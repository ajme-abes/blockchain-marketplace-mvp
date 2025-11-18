// backend/src/services/socketService.js
const { Server } = require('socket.io');
const chatService = require('./chatService');

class SocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // userId -> socketId
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: ['http://localhost:8080', 'http://localhost:3000'],
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    this.io.use(this.authenticateSocket.bind(this));
    this.io.on('connection', this.handleConnection.bind(this));

    console.log('✅ WebSocket server initialized');
    return this.io;
  }

  // Socket authentication middleware
  async authenticateSocket(socket, next) {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      // Verify JWT token (you can reuse your auth middleware logic)
      const authService = require('./authService');
      const user = await authService.verifyToken(token);
      
      if (!user) {
        return next(new Error('Authentication error: Invalid token'));
      }

      socket.userId = user.userId;
      socket.user = user;
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication error'));
    }
  }

  // Handle new socket connections
  async handleConnection(socket) {
    console.log('🔌 User connected:', socket.userId);

    // Store user connection
    this.connectedUsers.set(socket.userId, socket.id);
    
    // Join user to their personal room for notifications
    socket.join(`user_${socket.userId}`);

    // Join user to their active chats
    try {
      const userChats = await chatService.getUserChats(socket.userId);
      userChats.forEach(chat => {
        socket.join(`chat_${chat.id}`);
      });
    } catch (error) {
      console.error('Error joining user to chat rooms:', error);
    }

    // Handle joining specific chat
    socket.on('join_chat', (chatId) => {
      socket.join(`chat_${chatId}`);
      console.log(`👥 User ${socket.userId} joined chat: ${chatId}`);
    });

    // Handle leaving chat
    socket.on('leave_chat', (chatId) => {
      socket.leave(`chat_${chatId}`);
      console.log(`👋 User ${socket.userId} left chat: ${chatId}`);
    });

    // Handle new message
    socket.on('send_message', async (data) => {
      try {
        console.log('💬 New message via socket:', data);
        
        const { chatId, content, messageType = 'TEXT', attachments = [] } = data;
        
        // Verify user is participant in this chat
        const chat = await chatService.getChatById(chatId, socket.userId);
        if (!chat) {
          socket.emit('error', { message: 'Access denied to this chat' });
          return;
        }

        // Save message to database
        const message = await chatService.sendMessage(chatId, socket.userId, {
          content,
          messageType,
          attachments
        });

        // Broadcast message to all participants in the chat
        this.io.to(`chat_${chatId}`).emit('new_message', {
          message,
          chatId
        });

        // Send notifications to other participants
        chat.participants.forEach(participant => {
          if (participant.user.id !== socket.userId) {
            this.io.to(`user_${participant.user.id}`).emit('message_notification', {
              message,
              chatId,
              sender: socket.user
            });
          }
        });

      } catch (error) {
        console.error('Error handling message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle message read receipts
    socket.on('mark_messages_read', async (data) => {
      try {
        const { chatId, messageIds } = data;
        await chatService.markMessagesAsRead(chatId, socket.userId, messageIds);
        
        // Notify other participants that messages were read
        this.io.to(`chat_${chatId}`).emit('messages_read', {
          chatId,
          readerId: socket.userId,
          messageIds
        });
      } catch (error) {
        console.error('Error marking messages read:', error);
      }
    });

    // Handle typing indicators
    socket.on('typing_start', (data) => {
      const { chatId } = data;
      socket.to(`chat_${chatId}`).emit('user_typing', {
        chatId,
        userId: socket.userId,
        userName: socket.user.name,
        isTyping: true
      });
    });

    socket.on('typing_stop', (data) => {
      const { chatId } = data;
      socket.to(`chat_${chatId}`).emit('user_typing', {
        chatId,
        userId: socket.userId,
        userName: socket.user.name,
        isTyping: false
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('🔌 User disconnected:', socket.userId);
      this.connectedUsers.delete(socket.userId);
    });
  }

  // Utility method to send notifications to specific user
  sendToUser(userId, event, data) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
    }
  }

  // Utility method to broadcast to chat room
  broadcastToChat(chatId, event, data) {
    this.io.to(`chat_${chatId}`).emit(event, data);
  }
}

module.exports = new SocketService();