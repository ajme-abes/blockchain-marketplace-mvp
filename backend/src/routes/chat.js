// backend/src/routes/chat.js
const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const chatService = require('../services/chatService');

// FIX: Check the correct path to database config
let prisma;
try {
  prisma = require('../config/database').prisma;
  console.log('✅ Prisma client loaded in chat route');
} catch (error) {
  console.error('❌ Failed to load prisma client:', error.message);
  // Try alternative path
  try {
    const { PrismaClient } = require('@prisma/client');
    prisma = new PrismaClient();
    console.log('✅ Prisma client created directly');
  } catch (err) {
    console.error('❌ Failed to create prisma client:', err.message);
  }
}

const router = express.Router();

// Get user's chats (inbox)
router.get('/inbox', authenticateToken, async (req, res) => {
  try {
    // Check if prisma is available
    if (!prisma) {
      return res.status(500).json({
        error: 'Database connection not available',
        code: 'DATABASE_UNAVAILABLE'
      });
    }

    console.log('🔧 GET /chat/inbox for user:', req.user.id);

    const chats = await chatService.getUserChats(req.user.id);

    res.json({
      success: true,
      data: chats,
      message: `Found ${chats.length} chats`
    });

  } catch (error) {
    console.error('❌ GET /chat/inbox error:', error);
    res.status(500).json({
      error: 'Failed to fetch chats',
      code: 'FETCH_CHATS_FAILED',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get specific chat with messages
router.get('/:chatId', authenticateToken, async (req, res) => {
  try {
    if (!prisma) {
      return res.status(500).json({
        error: 'Database connection not available',
        code: 'DATABASE_UNAVAILABLE'
      });
    }

    const { chatId } = req.params;
    console.log('🔧 GET /chat/:chatId for user:', req.user.id, 'chat:', chatId);

    // Verify user is a participant in this chat
    const participant = await prisma.chatParticipant.findFirst({
      where: {
        chatId: chatId,
        userId: req.user.id
      }
    });

    if (!participant) {
      return res.status(403).json({
        error: 'Access denied to this chat',
        code: 'CHAT_ACCESS_DENIED'
      });
    }

    const chat = await chatService.getChatById(chatId, req.user.id);

    res.json({
      success: true,
      data: chat,
      message: 'Chat loaded successfully'
    });

  } catch (error) {
    console.error('❌ GET /chat/:chatId error:', error);
    
    if (error.message === 'CHAT_NOT_FOUND') {
      return res.status(404).json({
        error: 'Chat not found',
        code: 'CHAT_NOT_FOUND'
      });
    }

    res.status(500).json({
      error: 'Failed to fetch chat',
      code: 'FETCH_CHAT_FAILED',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get or create order-specific chat
router.post('/order/:orderId', authenticateToken, async (req, res) => {
  try {
    if (!prisma) {
      return res.status(500).json({
        error: 'Database connection not available',
        code: 'DATABASE_UNAVAILABLE'
      });
    }

    const { orderId } = req.params;
    console.log('🔧 POST /chat/order/:orderId for user:', req.user.id, 'order:', orderId);

    // DEBUG: Log user and order details
    console.log('🔧 DEBUG - User making request:', {
      userId: req.user.id,
      email: req.user.email,
      role: req.user.role
    });

    // FIX: First find the buyer record for this user
    let buyer = null;
    let producer = null;

    if (req.user.role === 'BUYER') {
      buyer = await prisma.buyer.findUnique({
        where: { userId: req.user.id },
        select: { id: true }
      });
      console.log('🔧 DEBUG - Buyer record found:', buyer?.id);
    } else if (req.user.role === 'PRODUCER') {
      producer = await prisma.producer.findUnique({
        where: { userId: req.user.id },
        select: { id: true }
      });
      console.log('🔧 DEBUG - Producer record found:', producer?.id);
    }

    // FIXED: Verify user has access to this order using correct IDs
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        OR: [
          // For buyers: compare with buyer.id (not user.id)
          ...(buyer ? [{ buyerId: buyer.id }] : []),
          
          // For producers: check if they produce any products in this order
          ...(producer ? [{
            orderItems: {
              some: {
                product: {
                  producerId: producer.id
                }
              }
            }
          }] : [])
        ]
      },
      include: {
        buyer: {
          include: {
            user: {
              select: { id: true, email: true, name: true }
            }
          }
        },
        orderItems: {
          include: {
            product: {
              include: {
                producer: {
                  include: {
                    user: {
                      select: { id: true, email: true, name: true }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    console.log('🔧 DEBUG - Order found:', order ? 'YES' : 'NO');
    if (order) {
      console.log('🔧 DEBUG - Order buyer user:', order.buyer?.user?.email);
      console.log('🔧 DEBUG - Order orderItems producers:', order.orderItems.map(item => 
        item.product.producer?.user?.email
      ));
    }

    if (!order) {
      console.log('❌ Access denied - Order not found or user has no access');
      return res.status(403).json({
        error: 'Access denied to this order',
        code: 'ORDER_ACCESS_DENIED',
        details: {
          userId: req.user.id,
          userRole: req.user.role,
          buyerId: buyer?.id,
          producerId: producer?.id,
          orderId: orderId
        }
      });
    }

    // Continue with chat creation...
    const chat = await chatService.getOrCreateOrderChat(orderId, req.user.id);

    res.json({
      success: true,
      data: chat,
      message: 'Order chat loaded successfully'
    });

  } catch (error) {
    console.error('❌ POST /chat/order/:orderId error:', error);
    
    if (error.message === 'ORDER_NOT_FOUND') {
      return res.status(404).json({
        error: 'Order not found',
        code: 'ORDER_NOT_FOUND'
      });
    }

    res.status(500).json({
      error: 'Failed to create order chat',
      code: 'CREATE_ORDER_CHAT_FAILED',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get or create product inquiry chat
router.post('/product/:productId', authenticateToken, async (req, res) => {
  try {
    if (!prisma) {
      return res.status(500).json({
        error: 'Database connection not available',
        code: 'DATABASE_UNAVAILABLE'
      });
    }

    const { productId } = req.params;
    console.log('🔧 POST /chat/product/:productId for user:', req.user.id, 'product:', productId);

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        producer: true
      }
    });

    if (!product) {
      return res.status(404).json({
        error: 'Product not found',
        code: 'PRODUCT_NOT_FOUND'
      });
    }

    // Don't allow producers to chat with themselves about their own products
    if (product.producer && product.producer.userId === req.user.id) {
      return res.status(400).json({
        error: 'Cannot create chat for your own product',
        code: 'SELF_CHAT_NOT_ALLOWED'
      });
    }

    const chat = await chatService.getOrCreateProductChat(productId, req.user.id);

    res.json({
      success: true,
      data: chat,
      message: 'Product chat loaded successfully'
    });

  } catch (error) {
    console.error('❌ POST /chat/product/:productId error:', error);
    
    if (error.message === 'PRODUCT_NOT_FOUND') {
      return res.status(404).json({
        error: 'Product not found',
        code: 'PRODUCT_NOT_FOUND'
      });
    }
    if (error.message === 'PRODUCT_HAS_NO_PRODUCER') {
      return res.status(400).json({
        error: 'Product has no producer assigned',
        code: 'NO_PRODUCER_ASSIGNED'
      });
    }

    res.status(500).json({
      error: 'Failed to create product chat',
      code: 'CREATE_PRODUCT_CHAT_FAILED',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Send message in chat
router.post('/:chatId/messages', authenticateToken, async (req, res) => {
  try {
    if (!prisma) {
      return res.status(500).json({
        error: 'Database connection not available',
        code: 'DATABASE_UNAVAILABLE'
      });
    }

    const { chatId } = req.params;
    const { content, messageType, attachments } = req.body;
    
    console.log('🔧 POST /chat/:chatId/messages for user:', req.user.id, 'chat:', chatId);

    // Verify user is a participant in this chat
    const participant = await prisma.chatParticipant.findFirst({
      where: {
        chatId: chatId,
        userId: req.user.id
      }
    });

    if (!participant) {
      return res.status(403).json({
        error: 'Access denied to this chat',
        code: 'CHAT_ACCESS_DENIED'
      });
    }

    const message = await chatService.sendMessage(chatId, req.user.id, {
      content,
      messageType: messageType || 'TEXT',
      attachments: attachments || []
    });

    res.json({
      success: true,
      data: message,
      message: 'Message sent successfully'
    });

  } catch (error) {
    console.error('❌ POST /chat/:chatId/messages error:', error);
    
    if (error.message === 'MESSAGE_CONTENT_REQUIRED') {
      return res.status(400).json({
        error: 'Message content or attachments are required',
        code: 'MESSAGE_CONTENT_REQUIRED'
      });
    }

    res.status(500).json({
      error: 'Failed to send message',
      code: 'SEND_MESSAGE_FAILED',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Mark messages as read
router.post('/:chatId/mark-read', authenticateToken, async (req, res) => {
  try {
    if (!prisma) {
      return res.status(500).json({
        error: 'Database connection not available',
        code: 'DATABASE_UNAVAILABLE'
      });
    }

    const { chatId } = req.params;
    const { messageIds } = req.body;
    
    console.log('🔧 POST /chat/:chatId/mark-read for user:', req.user.id, 'chat:', chatId);

    // Verify user is a participant in this chat
    const participant = await prisma.chatParticipant.findFirst({
      where: {
        chatId: chatId,
        userId: req.user.id
      }
    });

    if (!participant) {
      return res.status(403).json({
        error: 'Access denied to this chat',
        code: 'CHAT_ACCESS_DENIED'
      });
    }

    const result = await chatService.markMessagesAsRead(chatId, req.user.id, messageIds);

    res.json({
      success: true,
      data: result,
      message: `Marked ${result.marked} messages as read`
    });

  } catch (error) {
    console.error('❌ POST /chat/:chatId/mark-read error:', error);
    res.status(500).json({
      error: 'Failed to mark messages as read',
      code: 'MARK_READ_FAILED',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get chat participants
router.get('/:chatId/participants', authenticateToken, async (req, res) => {
  try {
    if (!prisma) {
      return res.status(500).json({
        error: 'Database connection not available',
        code: 'DATABASE_UNAVAILABLE'
      });
    }

    const { chatId } = req.params;
    console.log('🔧 GET /chat/:chatId/participants for user:', req.user.id, 'chat:', chatId);

    // Verify user is a participant in this chat
    const participant = await prisma.chatParticipant.findFirst({
      where: {
        chatId: chatId,
        userId: req.user.id
      }
    });

    if (!participant) {
      return res.status(403).json({
        error: 'Access denied to this chat',
        code: 'CHAT_ACCESS_DENIED'
      });
    }

    const participants = await prisma.chatParticipant.findMany({
      where: { chatId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatarUrl: true,
            phone: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: participants,
      message: `Found ${participants.length} participants`
    });

  } catch (error) {
    console.error('❌ GET /chat/:chatId/participants error:', error);
    res.status(500).json({
      error: 'Failed to fetch participants',
      code: 'FETCH_PARTICIPANTS_FAILED',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;