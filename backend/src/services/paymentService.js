// backend/src/services/paymentService.js
const { prisma } = require('../config/database');
const axios = require('axios');

class PaymentService {
  constructor() {
    this.chapaSecretKey = process.env.CHAPA_SECRET_KEY;
    this.chapaPublicKey = process.env.CHAPA_PUBLIC_KEY;
    this.webhookSecret = process.env.CHAPA_WEBHOOK_SECRET;
    this.baseURL = 'https://api.chapa.co/v1';
  }

  async createPaymentIntent(orderId, amount, customerInfo) {
    try {
      console.log('💳 Creating payment intent for order:', orderId);

      // Verify order exists and is pending
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          buyer: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                  phone: true
                }
              }
            }
          }
        }
      });

      if (!order) {
        throw new Error('Order not found');
      }

      if (order.paymentStatus !== 'PENDING') {
        throw new Error(`Order payment already ${order.paymentStatus}`);
      }

      console.log('💰 Order amount:', order.totalAmount);

      // Fix amount format - Chapa requires string without decimals
      const chapaAmount = Math.round(order.totalAmount).toString();
      console.log('💰 Chapa amount:', chapaAmount);

      // Fix name splitting safely
      const nameParts = order.buyer.user.name.split(' ');
      const firstName = nameParts[0] || 'Customer';
      const lastName = nameParts.slice(1).join(' ') || 'User';

      // FIX: Use shorter transaction reference (max 50 chars)
      const shortOrderId = orderId.substring(0, 8); // Use first 8 chars of order ID
      const txRef = `ord-${shortOrderId}-${Date.now()}`.substring(0, 50);
      
      // FIX: Use Chapa-approved test email
      const testEmail = 'test@chapa.co'; // Chapa's preferred test email

      // Prepare Chapa payment request with FIXED format
      const paymentData = {
        amount: chapaAmount,
        currency: 'ETB',
        email: testEmail, // Use Chapa test email
        first_name: firstName,
        last_name: lastName,
        phone_number: customerInfo.phone || order.buyer.user.phone || '+251911223344',
        tx_ref: txRef, // Fixed: max 50 characters
        callback_url: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/payments/webhook/chapa`,
        return_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/order/${orderId}`,
        customization: {
          title: 'Marketplace',
          description: `Order ${shortOrderId}`
        }
      };

      console.log('📤 Sending to Chapa:', JSON.stringify(paymentData, null, 2));

      // Create payment intent and store reference in transaction
      const result = await prisma.$transaction(async (tx) => {
        // Call Chapa API
        const response = await axios.post(
          `${this.baseURL}/transaction/initialize`,
          paymentData,
          {
            headers: {
              'Authorization': `Bearer ${this.chapaSecretKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 10000
          }
        );

        console.log('✅ Chapa response:', response.data);

        if (response.data.status !== 'success') {
          throw new Error(`Chapa API error: ${JSON.stringify(response.data)}`);
        }

        // Create payment record
        const paymentRecord = await tx.paymentConfirmation.create({
          data: {
            orderId: orderId,
            confirmedById: order.buyer.userId,
            confirmationMethod: 'CHAPA',
            proofImageUrl: null,
            blockchainTxHash: null,
            confirmedAt: new Date(), 
            isConfirmed: false 
          }
        });

        // NEW: Store payment reference mapping
        await tx.paymentReference.create({
          data: {
            orderId: orderId,
            paymentCode: txRef, // Store the tx_ref
            generatedAt: new Date()
          }
        });

        console.log('💾 Stored payment reference:', txRef);

        return {
          paymentUrl: response.data.data.checkout_url,
          paymentReference: txRef,
          paymentRecordId: paymentRecord.id
        };
      });

      console.log('✅ Payment intent created successfully');

      return result;

    } catch (error) {
      console.error('❌ Payment intent creation FAILED:');
      
      if (error.response) {
        console.error('HTTP Status:', error.response.status);
        console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
      } else if (error.request) {
        console.error('No response received');
      } else {
        console.error('Error message:', error.message);
      }
      
      throw new Error(`Payment creation failed: ${error.message}`);
    }
  }

async handlePaymentWebhook(webhookData) {
  try {
    console.log('🔄 Processing payment webhook:', JSON.stringify(webhookData, null, 2));

    const { tx_ref, status, transaction_id, currency, amount } = webhookData;

    // Log all received data
    console.log('📨 Webhook data received:');
    console.log('- Transaction Reference:', tx_ref);
    console.log('- Status:', status);
    console.log('- Transaction ID:', transaction_id);
    console.log('- Currency:', currency);
    console.log('- Amount:', amount);

    // Find order by payment reference
    console.log('🔍 Looking up order by payment reference:', tx_ref);

    const paymentReference = await prisma.paymentReference.findUnique({
      where: { 
        paymentCode: tx_ref 
      },
      include: {
        order: {
          include: {
            buyer: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              }
            },
            paymentConfirmations: {
              orderBy: { confirmedAt: 'desc' },
              take: 1
            },
            // ADD: Include order items for producer notification
            orderItems: {
              include: {
                product: {
                  include: {
                    producer: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!paymentReference) {
      throw new Error(`Payment reference not found: ${tx_ref}. Please check if the payment intent was created successfully.`);
    }

    const orderId = paymentReference.order.id;
    const order = paymentReference.order;

    console.log('✅ Found order:', orderId);
    console.log('💰 Order amount:', order.totalAmount);
    console.log('💳 Current payment status:', order.paymentStatus);

    // Update order and payment status in transaction
    const result = await prisma.$transaction(async (tx) => {
      console.log('💾 Starting database transaction...');

      const paymentConfirmation = await tx.paymentConfirmation.updateMany({
        where: { 
          orderId: orderId,
          isConfirmed: false
        },
        data: {
          confirmedAt: new Date(),
          blockchainTxHash: status === 'success' ? transaction_id : null,
          isConfirmed: true
        }
      });

      console.log('✅ Updated payment confirmations:', paymentConfirmation.count);

      // If no payment confirmation was updated, create a new one
      if (paymentConfirmation.count === 0) {
        console.log('⚠️ No existing payment confirmation found, creating new one...');
        await tx.paymentConfirmation.create({
          data: {
            orderId: orderId,
            confirmedById: order.buyer.userId,
            confirmationMethod: 'CHAPA',
            confirmedAt: new Date(),
            blockchainTxHash: status === 'success' ? transaction_id : null,
            proofImageUrl: null,
            isConfirmed: true
          }
        });
        console.log('✅ Created new payment confirmation');
      }

      // Update order payment status
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: status === 'success' ? 'CONFIRMED' : 'FAILED',
          // Also update delivery status if payment successful
          deliveryStatus: status === 'success' ? 'CONFIRMED' : 'PENDING'
        },
        include: {
          buyer: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      });

      console.log('✅ Updated order payment status to:', updatedOrder.paymentStatus);

      // Mark payment reference as used
      await tx.paymentReference.update({
        where: { id: paymentReference.id },
        data: { usedAt: new Date() }
      });

      console.log('✅ Marked payment reference as used');

      // ==================== NOTIFICATION INTEGRATION ====================
      
      if (status === 'success') {
        try {
          const blockchainService = require('./blockchainService');
          const notificationService = require('./notificationService');
          
          // Get payment reference for blockchain recording
          const paymentRef = await prisma.paymentReference.findFirst({
            where: { orderId: orderId }
          });

          if (paymentRef) {
            // Record on blockchain with correct parameters
            const blockchainResult = await blockchainService.recordTransaction({
              orderId: orderId,
              paymentReference: paymentRef.paymentCode, // Use payment code from reference
              txHash: transaction_id // Chapa transaction ID
            });

            console.log('🔗 Blockchain recording result:', {
              success: blockchainResult.success,
              isMock: blockchainResult.isMock,
              message: blockchainResult.message
            });

            // Update order with blockchain hash if real transaction
            if (blockchainResult.success && !blockchainResult.isMock) {
              await tx.order.update({
                where: { id: orderId },
                data: { blockchainTxHash: blockchainResult.transactionHash }
              });
              console.log('✅ Updated order with blockchain hash');
            }

            // ========== SEND NOTIFICATIONS ==========
            
            // 1. Send payment confirmation to buyer
            console.log('📢 Sending payment confirmation notification to buyer...');
            await notificationService.sendPaymentConfirmedNotification(orderId)
              .then(result => {
                if (result.success) {
                  console.log('✅ Payment confirmation notification sent to buyer');
                } else {
                  console.log('⚠️ Payment confirmation notification failed:', result.error);
                }
              })
              .catch(error => {
                console.error('❌ Payment notification error:', error);
              });

            // 2. Send blockchain verification notification to buyer
            if (blockchainResult.success && !blockchainResult.isMock) {
              console.log('📢 Sending blockchain verification notification...');
              await notificationService.sendBlockchainVerificationNotification(
                orderId, 
                blockchainResult.transactionHash
              )
                .then(result => {
                  if (result.success) {
                    console.log('✅ Blockchain verification notification sent');
                  } else {
                    console.log('⚠️ Blockchain notification failed:', result.error);
                  }
                })
                .catch(error => {
                  console.error('❌ Blockchain notification error:', error);
                });
            }

            // 3. Send new order notification to producer(s)
            console.log('📢 Sending new order notification to producer...');
            await notificationService.sendNewOrderNotificationToProducer(orderId)
              .then(result => {
                if (result.success) {
                  console.log('✅ New order notification sent to producer');
                } else {
                  console.log('⚠️ Producer notification failed:', result.error);
                }
              })
              .catch(error => {
                console.error('❌ Producer notification error:', error);
              });

            // 4. Send order status update notification
            console.log('📢 Sending order status notification...');
            await notificationService.sendOrderStatusNotification(orderId, 'CONFIRMED')
              .then(result => {
                if (result.success) {
                  console.log('✅ Order status notification sent');
                } else {
                  console.log('⚠️ Order status notification failed:', result.error);
                }
              })
              .catch(error => {
                console.error('❌ Order status notification error:', error);
              });
          }
        } catch (blockchainError) {
          console.error('⚠️ Blockchain recording failed, but payment succeeded:', blockchainError);
          // Don't fail the payment process if blockchain fails
          
          // Still send payment confirmation even if blockchain fails
          try {
            const notificationService = require('./notificationService');
            await notificationService.sendPaymentConfirmedNotification(orderId);
            console.log('✅ Payment notification sent (blockchain failed)');
          } catch (notifError) {
            console.error('❌ Payment notification also failed:', notifError);
          }
        }
      } else {
        // Payment failed - send failure notification
        console.log('📢 Sending payment failure notification...');
        try {
          const notificationService = require('./notificationService');
          await notificationService.createNotification(
            order.buyer.user.id,
            `Payment failed for order #${orderId.substring(0, 8)}. Please try again or contact support.`,
            'GENERAL'
          );
          console.log('✅ Payment failure notification sent');
        } catch (notifError) {
          console.error('❌ Payment failure notification error:', notifError);
        }
      }

      return { order: updatedOrder };
    });

    console.log(`✅ Payment webhook processed successfully - Status: ${status}`);

    return {
      success: status === 'success',
      orderId: orderId,
      transactionId: transaction_id,
      paymentStatus: status === 'success' ? 'CONFIRMED' : 'FAILED'
    };

  } catch (error) {
    console.error('❌ Payment webhook processing FAILED:');
    console.error('Error message:', error.message);
    console.error('Stack trace:', error.stack);
    
    // Log additional context for debugging
    if (error.code) {
      console.error('Error code:', error.code);
    }
    if (error.meta) {
      console.error('Error meta:', error.meta);
    }
    
    throw new Error(`Webhook processing failed: ${error.message}`);
  }
}

  async getPaymentStatus(orderId) {
    try {
      const payment = await prisma.paymentConfirmation.findFirst({
        where: { orderId },
        orderBy: { confirmedAt: 'desc' },
        include: {
          order: {
            select: {
              paymentStatus: true,
              totalAmount: true
            }
          }
        }
      });

      if (!payment) {
        return { status: 'NOT_INITIATED' };
      }

      return {
        status: payment.order.paymentStatus,
        amount: payment.order.totalAmount,
        method: payment.confirmationMethod,
        confirmedAt: payment.confirmedAt,
        transactionHash: payment.blockchainTxHash
      };

    } catch (error) {
      console.error('❌ Get payment status failed:', error);
      throw new Error(`Payment status check failed: ${error.message}`);
    }
  }

  async verifyWebhookSignature(signature, payload) {
    // Implement webhook signature verification
    // This ensures the webhook is genuinely from Chapa
    console.log('🔐 Verifying webhook signature');
    return true; // Implement proper verification based on Chapa docs
  }
}

module.exports = new PaymentService();