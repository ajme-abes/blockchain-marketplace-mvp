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
        callback_url: `https://anton-armoured-lustfully.ngrok-free.dev/api/payments/webhook/chapa`,
        return_url: `${process.env.FRONTEND_URL || 'http://localhost:8080'}/order/${orderId}/success`,
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

    // ✅ CRITICAL FIX 1: DEDUPLICATION CHECK
    console.log('🔍 Checking for duplicate webhook...');
    
    // Check if we already processed this exact webhook
    const existingWebhook = await prisma.auditLog.findFirst({
      where: {
        entity: 'WEBHOOK',
        entityId: `chapa_${tx_ref}_${transaction_id}`,
        action: 'WEBHOOK_PROCESSED'
      }
    });

    if (existingWebhook) {
      console.log('🔄 DUPLICATE WEBHOOK DETECTED - Already processed, skipping');
      return {
        success: true,
        message: 'Webhook already processed',
        isDuplicate: true
      };
    }

    // Log this webhook to prevent future duplicates
    await prisma.auditLog.create({
      data: {
        action: 'WEBHOOK_PROCESSED',
        entity: 'WEBHOOK',
        entityId: `chapa_${tx_ref}_${transaction_id}`,
        userId: null,
        ipAddress: 'webhook',
        userAgent: 'ChapaWebhook/1.0',
        timestamp: new Date(),
        newValues: {
          tx_ref: tx_ref,
          transaction_id: transaction_id,
          status: status,
          processedAt: new Date().toISOString()
        }
      }
    });

    console.log('✅ Webhook deduplication check passed');

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

    // ✅ CRITICAL FIX 2: CHECK IF PAYMENT REFERENCE ALREADY USED
    if (paymentReference?.usedAt) {
      console.log('🔄 Payment reference already used at:', paymentReference.usedAt);
      console.log('💡 This is a duplicate webhook - skipping processing');
      
      return {
        success: true,
        message: 'Payment already processed',
        orderId: paymentReference.order.id,
        isDuplicate: true
      };
    }

    const orderId = paymentReference.order.id;
    const order = paymentReference.order;

    console.log('✅ Found order:', orderId);
    console.log('💰 Order amount:', order.totalAmount);
    console.log('💳 Current payment status:', order.paymentStatus);

    // ✅ CRITICAL FIX 3: CHECK IF ORDER ALREADY CONFIRMED
    if (order.paymentStatus === 'CONFIRMED') {
      console.log('💰 Order already confirmed - marking payment reference as used and skipping processing');
      
      // Still mark the payment reference as used
      await prisma.paymentReference.update({
        where: { id: paymentReference.id },
        data: { usedAt: new Date() }
      });
      
      return {
        success: true,
        message: 'Order already confirmed',
        orderId: orderId,
        isDuplicate: true
      };
    }

    // Update order and payment status in transaction (without blockchain)
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
      // After updating order status, record the change
                    tx.orderStatusHistory.create({
                    data: {
                    orderId: orderId,
                    fromStatus: order.paymentStatus, // previous status
                    toStatus: status === 'success' ? 'CONFIRMED' : 'FAILED',
                    changedById: 'system', // or admin user ID
                    reason: `Payment ${status === 'success' ? 'confirmed' : 'failed'} via Chapa`
                  }
                  });

      console.log('✅ Updated order payment status to:', updatedOrder.paymentStatus);

      // Mark payment reference as used
      await tx.paymentReference.update({
        where: { id: paymentReference.id },
        data: { usedAt: new Date() }
      });

      console.log('✅ Marked payment reference as used');

      return { order: updatedOrder };
    });

    // ✅ BLOCKCHAIN RECORDING - AFTER DATABASE TRANSACTION
    let blockchainResult = null;
    
    if (status === 'success') {
      try {
        const blockchainService = require('./blockchainService');
        const notificationService = require('./notificationService');
        
        console.log('🔗 Starting blockchain recording for order:', orderId);
        
        // ✅ CRITICAL FIX 4: CHECK DATABASE BEFORE BLOCKCHAIN RECORDING
        const existingBlockchain = await prisma.order.findUnique({
          where: { id: orderId },
          select: { blockchainRecorded: true, blockchainTxHash: true }
        });
        
        if (existingBlockchain?.blockchainRecorded) {
          console.log('✅ Blockchain already recorded in database:', existingBlockchain.blockchainTxHash);
          blockchainResult = {
            success: true,
            blockchainTxHash: existingBlockchain.blockchainTxHash,
            alreadyRecorded: true,
            message: 'Already recorded in database'
          };
        } else {
          const canRecord = await blockchainService.verifyContractOwnership();
          if (!canRecord) {
            console.log('⚠️ Skipping blockchain recording - wallet not contract owner');
            blockchainResult = {
              success: false,
              error: 'Wallet not contract owner',
              isMock: false
            };
          } else {
            // Proceed with blockchain recording
            blockchainResult = await blockchainService.recordOrderTransaction(orderId, {
              paymentReference: tx_ref
            });
          }
        }
        
        console.log('🔗 Blockchain recording result:', {
          success: blockchainResult.success,
          transactionHash: blockchainResult.blockchainTxHash,
          message: blockchainResult.message,
          alreadyRecorded: blockchainResult.alreadyRecorded
        });

        // Update order with blockchain hash if successful
        if (blockchainResult.success && !blockchainResult.alreadyRecorded) {
          await prisma.order.update({
            where: { id: orderId },
            data: { 
              blockchainTxHash: blockchainResult.blockchainTxHash,
              blockchainRecorded: true 
            }
          });
          console.log('✅ Updated order with blockchain transaction');
        } else if (blockchainResult.alreadyRecorded) {
          console.log('✅ Blockchain already recorded - no update needed');
        } else {
          console.log('⚠️ Blockchain recording failed:', blockchainResult.error);
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
        if (blockchainResult.success && !blockchainResult.isMock && !blockchainResult.alreadyRecorded) {
          console.log('📢 Sending blockchain verification notification...');
          await notificationService.sendBlockchainVerificationNotification(
            orderId, 
            blockchainResult.blockchainTxHash
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

    console.log(`✅ Payment webhook processed successfully - Status: ${status}`);

    // Create the final response
    const response = {
      success: status === 'success',
      orderId: orderId,
      transactionId: transaction_id,
      paymentStatus: status === 'success' ? 'CONFIRMED' : 'FAILED'
    };

    // Add blockchain data to response if available
    if (blockchainResult) {
      response.blockchain = {
        recorded: blockchainResult.success,
        transactionHash: blockchainResult.blockchainTxHash,
        isMock: blockchainResult.isMock || false,
        alreadyRecorded: blockchainResult.alreadyRecorded || false
      };
    }

    console.log(`✅ Payment webhook processed successfully - Status: ${status}`);
    return response;

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

async verifyWebhookSignature(signature, payload) {
  const crypto = require('crypto');
  const hmac = crypto.createHmac('sha256', this.webhookSecret);
  hmac.update(JSON.stringify(payload));
  const calculatedSignature = hmac.digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature), 
    Buffer.from(calculatedSignature)
  );
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