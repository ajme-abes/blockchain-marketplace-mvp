// backend/src/services/chatService.js
const { prisma } = require('../config/database');

class ChatService {
  
  // Create a new chat (order-specific or product inquiry)
  async createChat(chatData) {
    try {
      console.log('🔧 createChat called with:', chatData);
      
      const { participants, orderId, productId, createdBy } = chatData;
      
      // Validation
      if (!participants || participants.length < 2) {
        throw new Error('CHAT_REQUIRES_PARTICIPANTS');
      }
      
      if (!createdBy) {
        throw new Error('CREATOR_REQUIRED');
      }
      
      // Check if creator is in participants
      const creatorInParticipants = participants.some(p => p.userId === createdBy);
      if (!creatorInParticipants) {
        throw new Error('CREATOR_MUST_BE_PARTICIPANT');
      }
      
      console.log('🔧 Starting chat creation transaction...');
      
      const chat = await prisma.$transaction(async (tx) => {
        console.log('🔧 Inside transaction - creating chat...');
        
        // Create the chat
        const newChat = await tx.chat.create({
          data: {
            orderId: orderId || null,
            productId: productId || null,
            lastMessageAt: new Date()
          }
        });
        
        console.log('🔧 Chat created:', newChat.id);
        
        // Add participants
        console.log('🔧 Adding participants...');
        const chatParticipants = await Promise.all(
          participants.map(participant => 
            tx.chatParticipant.create({
              data: {
                chatId: newChat.id,
                userId: participant.userId,
                lastReadAt: new Date()
              }
            })
          )
        );
        
        console.log('✅ Participants added:', chatParticipants.length);
        
        return newChat;
      });
      
      console.log('✅ Chat creation transaction completed successfully');
      
      // Return the full chat with participants
      return await this.getChatById(chat.id, createdBy);
      
    } catch (error) {
      console.error('❌ createChat error:', error);
      
      // Handle specific errors
      if (error.message === 'CHAT_REQUIRES_PARTICIPANTS') {
        throw new Error('Chat requires at least 2 participants');
      }
      if (error.message === 'CREATOR_REQUIRED') {
        throw new Error('Chat creator is required');
      }
      if (error.message === 'CREATOR_MUST_BE_PARTICIPANT') {
        throw new Error('Chat creator must be a participant');
      }
      
      throw error;
    }
  }
  
  // Get or create order-specific chat
  async getOrCreateOrderChat(orderId, userId) {
    try {
      console.log('🔧 getOrCreateOrderChat called:', { orderId, userId });
      
      // Check if chat already exists for this order
      const existingChat = await prisma.chat.findFirst({
        where: { orderId },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                  avatarUrl: true
                }
              }
            }
          },
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            include: {
              sender: {
                select: {
                  id: true,
                  name: true,
                  avatarUrl: true
                }
              }
            }
          }
        }
      });
      
      if (existingChat) {
        console.log('✅ Found existing order chat:', existingChat.id);
        return existingChat;
      }
      
      console.log('🔧 No existing chat found, creating new order chat...');
      
      // Get order details to identify participants
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          buyer: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true
                }
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
                        select: {
                          id: true,
                          name: true,
                          email: true,
                          role: true
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });
      
      if (!order) {
        throw new Error('ORDER_NOT_FOUND');
      }
      
      // Identify participants: buyer and producer(s)
      const participants = new Set();
      
      // Add buyer
      participants.add({
        userId: order.buyer.user.id,
        name: order.buyer.user.name,
        role: order.buyer.user.role
      });
      
      // Add producer(s) from order items
      order.orderItems.forEach(item => {
        if (item.product?.producer?.user) {
          participants.add({
            userId: item.product.producer.user.id,
            name: item.product.producer.user.name,
            role: item.product.producer.user.role
          });
        }
      });
      
      const participantArray = Array.from(participants).map(p => ({
        userId: p.userId
      }));
      
      console.log('🔧 Order chat participants:', participantArray);
      
      // Create the chat
      return await this.createChat({
        participants: participantArray,
        orderId: orderId,
        createdBy: userId
      });
      
    } catch (error) {
      console.error('❌ getOrCreateOrderChat error:', error);
      throw error;
    }
  }
  
  // Get or create product inquiry chat
  async getOrCreateProductChat(productId, userId) {
    try {
      console.log('🔧 getOrCreateProductChat called:', { productId, userId });
      
      // Check if chat already exists for this product and user
      const existingChat = await prisma.chat.findFirst({
        where: { 
          productId,
          participants: {
            some: { userId }
          }
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                  avatarUrl: true
                }
              }
            }
          },
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            include: {
              sender: {
                select: {
                  id: true,
                  name: true,
                  avatarUrl: true
                }
              }
            }
          }
        }
      });
      
      if (existingChat) {
        console.log('✅ Found existing product chat:', existingChat.id);
        return existingChat;
      }
      
      console.log('🔧 No existing chat found, creating new product chat...');
      
      // Get product and producer details
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
          producer: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true
                }
              }
            }
          }
        }
      });
      
      if (!product) {
        throw new Error('PRODUCT_NOT_FOUND');
      }
      
      if (!product.producer) {
        throw new Error('PRODUCT_HAS_NO_PRODUCER');
      }
      
      // Participants: current user and product producer
      const participants = [
        { userId: userId }, // Current user (buyer)
        { userId: product.producer.user.id } // Producer
      ];
      
      console.log('🔧 Product chat participants:', participants);
      
      // Create the chat
      return await this.createChat({
        participants: participants,
        productId: productId,
        createdBy: userId
      });
      
    } catch (error) {
      console.error('❌ getOrCreateProductChat error:', error);
      throw error;
    }
  }
  
  // Send a message in a chat
  async sendMessage(chatId, senderId, messageData) {
    try {
      console.log('🔧 sendMessage called:', { chatId, senderId, messageData });
      
      const { content, messageType = 'TEXT', attachments = [] } = messageData;
      
      // Validation
      if (!content && (!attachments || attachments.length === 0)) {
        throw new Error('MESSAGE_CONTENT_REQUIRED');
      }
      
      console.log('🔧 Starting message creation transaction...');
      
      const message = await prisma.$transaction(async (tx) => {
        console.log('🔧 Inside transaction - creating message...');
        
        // Create the message
        const newMessage = await tx.message.create({
          data: {
            content: content || '',
            messageType: messageType,
            senderId: senderId,
            chatId: chatId
          }
        });
        
        console.log('🔧 Message created:', newMessage.id);
        
        // Handle attachments if any
        if (attachments && attachments.length > 0) {
          console.log('🔧 Adding message attachments...');
          await Promise.all(
            attachments.map(attachment =>
              tx.messageAttachment.create({
                data: {
                  messageId: newMessage.id,
                  fileName: attachment.fileName,
                  fileUrl: attachment.fileUrl,
                  fileType: attachment.fileType,
                  fileSize: attachment.fileSize,
                  ipfsCid: attachment.ipfsCid
                }
              })
            )
          );
        }
        
        // Update chat's lastMessageAt
        await tx.chat.update({
          where: { id: chatId },
          data: { 
            lastMessageAt: new Date(),
            updatedAt: new Date()
          }
        });
        
        return newMessage;
      });
      
      console.log('✅ Message creation transaction completed successfully');
      
      // Return the full message with sender info
      return await this.getMessageById(message.id);
      
    } catch (error) {
      console.error('❌ sendMessage error:', error);
      throw error;
    }
  }
  
  // Get chat by ID with full details
  async getChatById(chatId, userId) {
    try {
      console.log('🔧 getChatById called:', { chatId, userId });
      
      const chat = await prisma.chat.findUnique({
        where: { id: chatId },
        include: {
          participants: {
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
          },
          messages: {
            take: 50,
            orderBy: { createdAt: 'desc' },
            include: {
              sender: {
                select: {
                  id: true,
                  name: true,
                  avatarUrl: true,
                  role: true
                }
              },
              attachments: true,
              readBy: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true
                    }
                  }
                }
              }
            }
          },
          order: {
            select: {
              id: true,
              totalAmount: true,
              deliveryStatus: true,
           orderItems: {
                include: {
                  product: {
                    select: {
                      id: true,
                      name: true,
                      imageUrl: true
                    }
                  }
                }
              }
            }
          },
          product: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
              price: true
            }
          }
        }
      });
      
      if (!chat) {
        throw new Error('CHAT_NOT_FOUND');
      }
      
      // Update user's last read time
      if (userId) {
        await prisma.chatParticipant.updateMany({
          where: {
            chatId: chatId,
            userId: userId
          },
          data: {
            lastReadAt: new Date()
          }
        });
      }
      
      console.log('✅ Chat found with', chat.messages.length, 'messages');
      return chat;
      
    } catch (error) {
      console.error('❌ getChatById error:', error);
      throw error;
    }
  }
  
  // Get user's chats (inbox)
  async getUserChats(userId) {
    try {
      console.log('🔧 getUserChats called for user:', userId);
      
      const chats = await prisma.chat.findMany({
        where: {
          participants: {
            some: { userId }
          }
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                  avatarUrl: true
                }
              }
            }
          },
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            include: {
              sender: {
                select: {
                  id: true,
                  name: true,
                  avatarUrl: true
                }
              }
            }
          },
          order: {
            select: {
              id: true,
              deliveryStatus: true
            }
          },
          product: {
            select: {
              id: true,
              name: true,
              imageUrl: true
            }
          }
        },
        orderBy: { lastMessageAt: 'desc' }
      });
      
      console.log('✅ Found', chats.length, 'chats for user');
      return chats;
      
    } catch (error) {
      console.error('❌ getUserChats error:', error);
      throw error;
    }
  }
  
  // Get message by ID
  async getMessageById(messageId) {
    try {
      return await prisma.message.findUnique({
        where: { id: messageId },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              role: true
            }
          },
          attachments: true,
          readBy: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        }
      });
    } catch (error) {
      console.error('❌ getMessageById error:', error);
      throw error;
    }
  }
  
  // Mark messages as read
  async markMessagesAsRead(chatId, userId, messageIds = []) {
    try {
      console.log('🔧 markMessagesAsRead called:', { chatId, userId, messageIds });
      
      if (messageIds.length === 0) {
        // Mark all messages in chat as read
        const unreadMessages = await prisma.message.findMany({
          where: {
            chatId: chatId,
            senderId: { not: userId }, // Only others' messages
            readBy: {
              none: { userId }
            }
          },
          select: { id: true }
        });
        
        messageIds = unreadMessages.map(msg => msg.id);
      }
      
      if (messageIds.length === 0) {
        console.log('🔧 No unread messages to mark as read');
        return { marked: 0 };
      }
      
      console.log('🔧 Marking', messageIds.length, 'messages as read');
      
      // Create read records for each message
      await Promise.all(
        messageIds.map(messageId =>
          prisma.messageRead.upsert({
            where: {
              messageId_userId: {
                messageId: messageId,
                userId: userId
              }
            },
            update: {
              readAt: new Date()
            },
            create: {
              messageId: messageId,
              userId: userId,
              readAt: new Date()
            }
          })
        )
      );
      
      // Update participant's last read time
      await prisma.chatParticipant.updateMany({
        where: {
          chatId: chatId,
          userId: userId
        },
        data: {
          lastReadAt: new Date()
        }
      });
      
      console.log('✅ Successfully marked', messageIds.length, 'messages as read');
      return { marked: messageIds.length };
      
    } catch (error) {
      console.error('❌ markMessagesAsRead error:', error);
      throw error;
    }
  }
}

module.exports = new ChatService();