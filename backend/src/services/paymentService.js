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
            blockchainTxHash: null
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
            proofImageUrl: null
          }
        });
        console.log('✅ Created new payment confirmation');
      }

      // Update order payment status
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: status === 'success' ? 'CONFIRMED' : 'FAILED'
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

      // Create status history for payment confirmation
      if (status === 'success') {
        await tx.orderStatusHistory.create({
          data: {
            orderId: orderId,
            fromStatus: updatedOrder.deliveryStatus,
            toStatus: updatedOrder.deliveryStatus, // Delivery status remains same
            changedById: updatedOrder.buyer.user.id,
            reason: `Payment confirmed via Chapa - TX: ${transaction_id}`
          }
        });
        console.log('✅ Created payment status history');
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