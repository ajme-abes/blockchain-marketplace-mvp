// frontend/src/contexts/ChatContext.tsx - FULLY UPDATED WITH WEB SOCKETS
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import apiService from '@/services/api';
import { useSocket } from './SocketContext';

export interface ChatUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
  phone?: string;
}

export interface Message {
  id: string;
  content: string;
  messageType: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';
  sender: ChatUser;
  chatId: string;
  attachments: MessageAttachment[];
  readBy: MessageRead[];
  createdAt: string;
  updatedAt: string;
}

export interface MessageAttachment {
  id: string;
  fileName?: string;
  fileUrl: string;
  fileType: string;
  fileSize?: number;
  ipfsCid?: string;
  createdAt: string;
}

export interface MessageRead {
  id: string;
  user: {
    id: string;
    name: string;
  };
  readAt: string;
}

export interface Chat {
  id: string;
  participants: ChatParticipant[];
  messages: Message[];
  orderId?: string;
  productId?: string;
  order?: {
    id: string;
    totalAmount: number;
    deliveryStatus: string;
    items: Array<{
      product: {
        id: string;
        name: string;
        imageUrl?: string;
      };
    }>;
  };
  product?: {
    id: string;
    name: string;
    imageUrl?: string;
    price: number;
  };
  createdAt: string;
  updatedAt: string;
  lastMessageAt?: string;
}

export interface ChatParticipant {
  id: string;
  user: ChatUser;
  joinedAt: string;
  lastReadAt?: string;
}

interface ChatContextType {
  // State
  chats: Chat[];
  currentChat: Chat | null;
  messages: Message[];
  loading: boolean;
  error: string | null;
  unreadCount: number;
  isConnected: boolean;
  
  // Actions
  loadUserChats: () => Promise<void>;
  loadChat: (chatId: string) => Promise<void>;
  createOrderChat: (orderId: string) => Promise<Chat>;
  createProductChat: (productId: string) => Promise<Chat>;
  sendMessage: (chatId: string, content: string, attachments?: any[]) => Promise<Message>;
  markMessagesAsRead: (chatId: string, messageIds?: string[]) => Promise<void>;
  setCurrentChat: (chat: Chat | null) => void;
  clearError: () => void;
  
  // Real-time WebSocket methods
  joinChat: (chatId: string) => void;
  leaveChat: (chatId: string) => void;
  startTyping: (chatId: string) => void;
  stopTyping: (chatId: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const { socket, isConnected } = useSocket();
  
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // ==================== WEB SOCKET EVENT HANDLERS ====================

  useEffect(() => {
    if (!socket || !isConnected) return;

    console.log('🔌 Setting up WebSocket chat listeners...');

    // Listen for new real-time messages
    const handleNewMessage = (data: { message: Message; chatId: string }) => {
      console.log('💬 Real-time message received:', data.message);
      
      // If this message is for the current chat, add it
      if (currentChat && currentChat.id === data.chatId) {
        setMessages(prev => [data.message, ...prev]);
      }
      
      // Update chats list with new message
      setChats(prev => 
        prev.map(chat => 
          chat.id === data.chatId 
            ? { 
                ...chat, 
                messages: [data.message, ...(chat.messages || [])],
                lastMessageAt: data.message.createdAt
              }
            : chat
        )
      );
    };
    

    // Listen for message read receipts
const handleMessagesRead = (data: { 
  chatId: string; 
  readerId: string; 
  messageIds?: string[]; // Make messageIds optional
  readAt?: string;
}) => {
  console.log('📖 Messages read receipt received:', data);
  
  if (!data.chatId || !data.readerId) {
    console.warn('⚠️ Invalid read receipt data:', data);
    return;
  }

  if (currentChat && currentChat.id === data.chatId) {
    setMessages(prev => {
      if (!Array.isArray(prev)) return prev;
      
      return prev.map(message => {
        // If specific messageIds provided, check if this message is in the list
        // If no messageIds provided, mark all messages as read
        const shouldMarkAsRead = data.messageIds 
          ? (Array.isArray(data.messageIds) && data.messageIds.includes(message.id))
          : true; // Mark all messages as read if no specific IDs provided

        if (shouldMarkAsRead) {
          // Check if already read by this user to avoid duplicates
          const alreadyRead = message.readBy?.some(read => 
            read?.user?.id === data.readerId
          );

          if (!alreadyRead) {
            return {
              ...message,
              readBy: [
                ...(message.readBy || []),
                {
                  id: `temp-read-${Date.now()}-${message.id}`,
                  user: { 
                    id: data.readerId, 
                    name: 'User' // You might want to get the actual name
                  },
                  readAt: data.readAt || new Date().toISOString()
                }
              ]
            };
          }
        }
        return message;
      });
    });
  }

  // Also update the chats list to reflect lastReadAt
  setChats(prev => {
    if (!Array.isArray(prev)) return prev;
    
    return prev.map(chat => {
      if (chat.id === data.chatId) {
        return {
          ...chat,
          participants: chat.participants.map(participant => 
            participant.user.id === data.readerId
              ? { 
                  ...participant, 
                  lastReadAt: data.readAt || new Date().toISOString() 
                }
              : participant
          )
        };
      }
      return chat;
    });
  });
};

    // Listen for typing indicators
    const handleUserTyping = (data: { chatId: string; userId: string; userName: string; isTyping: boolean }) => {
      console.log('⌨️ User typing:', data.userName, data.isTyping);
      // You can implement UI for typing indicators here
    };

    // Listen for message notifications
    const handleMessageNotification = (data: { message: Message; chatId: string; sender: any }) => {
      console.log('🔔 New message notification:', data.message);
      
      // Show desktop notification if permitted
      if (Notification.permission === 'granted' && document.hidden) {
        new Notification(`New message from ${data.sender.name}`, {
          body: data.message.content.substring(0, 100) + (data.message.content.length > 100 ? '...' : ''),
          icon: data.sender.avatarUrl,
        });
      }
    };

    // Register event listeners
    socket.on('new_message', handleNewMessage);
    socket.on('messages_read', handleMessagesRead);
    socket.on('user_typing', handleUserTyping);
    socket.on('message_notification', handleMessageNotification);

    // Cleanup socket listeners
    return () => {
      console.log('🔌 Cleaning up WebSocket chat listeners');
      socket.off('new_message', handleNewMessage);
      socket.off('messages_read', handleMessagesRead);
      socket.off('user_typing', handleUserTyping);
      socket.off('message_notification', handleMessageNotification);
    };
  }, [socket, isConnected, currentChat]);

  // ==================== CHAT MANAGEMENT ====================

  // Load user's chats when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserChats();
    } else {
      setChats([]);
      setCurrentChat(null);
      setMessages([]);
    }
  }, [isAuthenticated, user]);

  // Calculate unread count
  useEffect(() => {
    const calculateUnreadCount = () => {
      try {
        // Early return if data is not ready
        if (!user || !chats || !Array.isArray(chats)) {
          setUnreadCount(0);
          return;
        }
  
        let count = 0;
        
        chats.forEach(chat => {
          try {
            // Comprehensive null checking
            if (!chat || typeof chat !== 'object') return;
            if (!chat.participants || !Array.isArray(chat.participants)) return;
            if (!chat.messages || !Array.isArray(chat.messages)) return;
            if (chat.messages.length === 0) return;
  
            const userParticipant = chat.participants.find(p => 
              p && p.user && p.user.id === user.id
            );
            
            if (!userParticipant) return;
  
            const lastMessage = chat.messages[0];
            
            // Validate lastMessage structure
            if (!lastMessage || !lastMessage.sender || !lastMessage.createdAt) {
              return;
            }
  
            // Validate dates
            const lastReadTime = userParticipant.lastReadAt ? 
              new Date(userParticipant.lastReadAt) : new Date(0);
            const messageTime = new Date(lastMessage.createdAt);
            
            if (isNaN(lastReadTime.getTime()) || isNaN(messageTime.getTime())) {
              return;
            }
            
            // Count as unread if message is newer than last read time and not sent by user
            if (messageTime > lastReadTime && lastMessage.sender.id !== user.id) {
              count++;
            }
          } catch (chatError) {
            console.warn('Error processing chat for unread count:', chatError);
            // Continue with next chat instead of breaking
          }
        });
        
        setUnreadCount(count);
      } catch (error) {
        console.error('Error calculating unread count:', error);
        setUnreadCount(0);
      }
    };
  
    calculateUnreadCount();
  }, [chats, user]);
  const loadUserChats = async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      setError(null);
      
      console.log('🔧 Loading user chats...');
      const response = await apiService.request('/chat/inbox');
      
      if (response.success && response.data) {
        console.log('✅ Chats loaded:', response.data.length);
        setChats(response.data);
      } else {
        throw new Error(response.message || 'Failed to load chats');
      }
    } catch (error: any) {
      console.error('❌ Failed to load chats:', error);
      setError(error.message || 'Failed to load chats');
    } finally {
      setLoading(false);
    }
  };

  const loadChat = async (chatId: string) => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      setError(null);
      
      console.log('🔧 Loading chat:', chatId);
      const response = await apiService.request(`/chat/${chatId}`);
      
      if (response.success && response.data) {
        console.log('✅ Chat loaded with', response.data.messages?.length, 'messages');
        
        // Join WebSocket room for this chat
        joinChat(chatId);
        
        setCurrentChat(response.data);
        setMessages(response.data.messages || []);
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to load chat');
      }
    } catch (error: any) {
      console.error('❌ Failed to load chat:', error);
      setError(error.message || 'Failed to load chat');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const createOrderChat = async (orderId: string): Promise<Chat> => {
    if (!isAuthenticated) {
      throw new Error('Must be authenticated to create chat');
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('🔧 Creating order chat for order:', orderId);
      const response = await apiService.request(`/chat/order/${orderId}`, {
        method: 'POST'
      });
      
      if (response.success && response.data) {
        console.log('✅ Order chat created/loaded:', response.data.id);
        
        // Join WebSocket room for this chat
        joinChat(response.data.id);
        
        // Add to chats list if not already there
        setChats(prev => {
          const exists = prev.some(chat => chat.id === response.data.id);
          if (!exists) {
            return [response.data, ...prev];
          }
          return prev;
        });
        
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to create order chat');
      }
    } catch (error: any) {
      console.error('❌ Failed to create order chat:', error);
      setError(error.message || 'Failed to create order chat');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const createProductChat = async (productId: string): Promise<Chat> => {
    if (!isAuthenticated) {
      throw new Error('Must be authenticated to create chat');
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('🔧 Creating product chat for product:', productId);
      const response = await apiService.request(`/chat/product/${productId}`, {
        method: 'POST'
      });
      
      if (response.success && response.data) {
        console.log('✅ Product chat created/loaded:', response.data.id);
        
        // Join WebSocket room for this chat
        joinChat(response.data.id);
        
        // Add to chats list if not already there
        setChats(prev => {
          const exists = prev.some(chat => chat.id === response.data.id);
          if (!exists) {
            return [response.data, ...prev];
          }
          return prev;
        });
        
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to create product chat');
      }
    } catch (error: any) {
      console.error('❌ Failed to create product chat:', error);
      setError(error.message || 'Failed to create product chat');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (chatId: string, content: string, attachments: any[] = []): Promise<Message> => {
    if (!isAuthenticated) {
      throw new Error('Must be authenticated to send message');
    }

    try {
      setError(null);
      
      console.log('💬 Sending message to chat:', chatId);
      
      // If WebSocket is connected, use real-time messaging
      if (socket && isConnected) {
        return new Promise((resolve, reject) => {
          // Emit message via WebSocket
          socket.emit('send_message', {
            chatId,
            content,
            messageType: 'TEXT',
            attachments
          });

          // Set up timeout for WebSocket response
          const timeout = setTimeout(() => {
            socket.off('new_message');
            reject(new Error('Message send timeout - please try again'));
          }, 10000);

          // Listen for the message response
          const handleNewMessage = (data: { message: Message; chatId: string }) => {
            if (data.chatId === chatId) {
              clearTimeout(timeout);
              socket.off('new_message', handleNewMessage);
              console.log('✅ Message sent via WebSocket:', data.message.id);
              resolve(data.message);
            }
          };

          socket.on('new_message', handleNewMessage);
          
          socket.on('error', (error) => {
            clearTimeout(timeout);
            socket.off('new_message', handleNewMessage);
            reject(new Error(error.message || 'Failed to send message'));
          });
        });
      } else {
        // Fallback to HTTP API if WebSocket is not available
        console.log('🔧 WebSocket not available, using HTTP fallback');
        const response = await apiService.request(`/chat/${chatId}/messages`, {
          method: 'POST',
          data: {
            content,
            messageType: 'TEXT',
            attachments
          }
        });
        
        if (response.success && response.data) {
          const newMessage = response.data;
          console.log('✅ Message sent via HTTP:', newMessage.id);
          
          // Update local state
          setMessages(prev => [newMessage, ...prev]);
          setChats(prev => 
            prev.map(chat => 
              chat.id === chatId 
                ? { 
                    ...chat, 
                    messages: [newMessage, ...(chat.messages || [])],
                    lastMessageAt: newMessage.createdAt
                  }
                : chat
            )
          );
          
          return newMessage;
        } else {
          throw new Error(response.message || 'Failed to send message');
        }
      }
    } catch (error: any) {
      console.error('❌ Failed to send message:', error);
      setError(error.message || 'Failed to send message');
      throw error;
    }
  };

  const markMessagesAsRead = async (chatId: string, messageIds?: string[]): Promise<void> => {
    if (!isAuthenticated || !user) {
      console.warn('⚠️ User not authenticated, skipping mark as read');
      return;
    }
  
    // Validate chatId
    if (!chatId || typeof chatId !== 'string' || chatId.trim() === '') {
      console.error('❌ Invalid chatId provided:', chatId);
      return;
    }
  
    try {
      console.log('🔧 Marking messages as read in chat:', chatId, 'for user:', user.id);
      
      // Validate and normalize messageIds
      const validMessageIds = (() => {
        if (!messageIds) return [];
        if (!Array.isArray(messageIds)) {
          console.warn('⚠️ messageIds is not an array, normalizing to empty array');
          return [];
        }
        
        // Filter out invalid message IDs
        return messageIds.filter(id => 
          id && 
          typeof id === 'string' && 
          id.trim() !== '' &&
          id !== 'undefined' &&
          id !== 'null'
        );
      })();
  
      console.log('📝 Validated message IDs:', validMessageIds);
  
      // Update local state immediately for better UX - optimistic update
      setChats(prevChats => {
        if (!Array.isArray(prevChats)) return prevChats;
        
        return prevChats.map(chat => {
          if (chat?.id === chatId) {
            // Update participant's lastReadAt
            const updatedParticipants = chat.participants?.map(participant => 
              participant?.user?.id === user.id
                ? { 
                    ...participant, 
                    lastReadAt: new Date().toISOString() 
                  }
                : participant
            ) || [];
  
            return {
              ...chat,
              participants: updatedParticipants
            };
          }
          return chat;
        });
      });
  
      // Also update currentChat if it's the active chat
      if (currentChat?.id === chatId) {
        setCurrentChat(prev => {
          if (!prev) return prev;
          
          const updatedParticipants = prev.participants?.map(participant => 
            participant?.user?.id === user.id
              ? { 
                  ...participant, 
                  lastReadAt: new Date().toISOString() 
                }
              : participant
          ) || [];
  
          return {
            ...prev,
            participants: updatedParticipants
          };
        });
  
        // Update individual message read status if specific messageIds provided
        if (validMessageIds.length > 0) {
          setMessages(prevMessages => {
            if (!Array.isArray(prevMessages)) return prevMessages;
            
            return prevMessages.map(message => {
              if (validMessageIds.includes(message.id)) {
                // Check if message is already marked as read by this user
                const alreadyRead = message.readBy?.some(read => 
                  read?.user?.id === user.id
                );
  
                if (!alreadyRead) {
                  const newReadEntry: MessageRead = {
                    id: `temp-read-${Date.now()}-${message.id}`,
                    user: {
                      id: user.id,
                      name: user.name || 'User'
                    },
                    readAt: new Date().toISOString()
                  };
  
                  return {
                    ...message,
                    readBy: [...(message.readBy || []), newReadEntry]
                  };
                }
              }
              return message;
            });
          });
        }
      }
  
      // Send to server via WebSocket or HTTP
      const payload = {
        chatId: chatId.trim(),
        messageIds: validMessageIds,
        userId: user.id,
        timestamp: new Date().toISOString()
      };
  
      // Use WebSocket if available and connected
      if (socket && isConnected) {
        console.log('🔌 Sending read receipt via WebSocket');
        
        return new Promise((resolve, reject) => {
          // Set timeout for WebSocket operation
          const timeout = setTimeout(() => {
            socket.off('messages_read_success');
            socket.off('messages_read_error');
            console.warn('⚠️ WebSocket read receipt timeout');
            resolve(); // Resolve anyway to avoid blocking UI
          }, 5000);
  
          // Listen for success response
          const handleSuccess = (response: any) => {
            if (response.chatId === chatId) {
              clearTimeout(timeout);
              socket.off('messages_read_success', handleSuccess);
              socket.off('messages_read_error', handleError);
              console.log('✅ Read receipt confirmed via WebSocket');
              resolve();
            }
          };
  
          // Listen for error response
          const handleError = (error: any) => {
            clearTimeout(timeout);
            socket.off('messages_read_success', handleSuccess);
            socket.off('messages_read_error', handleError);
            console.error('❌ WebSocket read receipt error:', error);
            reject(new Error(error.message || 'Failed to mark messages as read'));
          };
  
          // Register listeners
          socket.on('messages_read_success', handleSuccess);
          socket.on('messages_read_error', handleError);
  
          // Emit the event
          socket.emit('mark_messages_read', payload);
        });
      } else {
        // Fallback to HTTP API
        console.log('🌐 WebSocket not available, using HTTP fallback for read receipt');
        
        try {
          const response = await apiService.request(`/chat/${chatId}/mark-read`, {
            method: 'POST',
            data: { 
              messageIds: validMessageIds,
              readAt: new Date().toISOString()
            }
          });
          
          if (response.success) {
            console.log('✅ Read receipt confirmed via HTTP');
          } else {
            console.warn('⚠️ HTTP read receipt returned non-success:', response.message);
            // Don't throw error for read receipts - they're not critical
          }
        } catch (httpError) {
          console.error('❌ HTTP read receipt failed:', httpError);
          // Don't throw error for read receipts - they're not critical
        }
      }
  
      // Recalculate unread count after marking as read
      setTimeout(() => {
        const calculateUnreadCount = () => {
          try {
            if (!user || !chats || !Array.isArray(chats)) {
              setUnreadCount(0);
              return;
            }
  
            let count = 0;
            
            chats.forEach(chat => {
              try {
                if (!chat || typeof chat !== 'object') return;
                if (!chat.participants || !Array.isArray(chat.participants)) return;
                if (!chat.messages || !Array.isArray(chat.messages)) return;
                if (chat.messages.length === 0) return;
  
                const userParticipant = chat.participants.find(p => 
                  p && p.user && p.user.id === user.id
                );
                
                if (!userParticipant) return;
  
                const lastMessage = chat.messages[0];
                
                if (!lastMessage || !lastMessage.sender || !lastMessage.createdAt) {
                  return;
                }
  
                const lastReadTime = userParticipant.lastReadAt ? 
                  new Date(userParticipant.lastReadAt) : new Date(0);
                const messageTime = new Date(lastMessage.createdAt);
                
                if (isNaN(lastReadTime.getTime()) || isNaN(messageTime.getTime())) {
                  return;
                }
                
                if (messageTime > lastReadTime && lastMessage.sender.id !== user.id) {
                  count++;
                }
              } catch (chatError) {
                console.warn('Error processing chat for unread count:', chatError);
              }
            });
            
            setUnreadCount(count);
          } catch (error) {
            console.error('Error calculating unread count:', error);
            setUnreadCount(0);
          }
        };
  
        calculateUnreadCount();
      }, 100);
  
    } catch (error: any) {
      console.error('❌ Unexpected error in markMessagesAsRead:', error);
      // Don't show error to user for read receipts as they're not critical
      // but log for debugging
    }
  };

  // ==================== WEB SOCKET METHODS ====================

  const joinChat = (chatId: string) => {
    if (socket && isConnected) {
      socket.emit('join_chat', chatId);
      console.log(`👥 Joined chat room: ${chatId}`);
    }
  };

  const leaveChat = (chatId: string) => {
    if (socket && isConnected) {
      socket.emit('leave_chat', chatId);
      console.log(`👋 Left chat room: ${chatId}`);
    }
  };

  const startTyping = (chatId: string) => {
    if (socket && isConnected) {
      socket.emit('typing_start', { chatId });
    }
  };

  const stopTyping = (chatId: string) => {
    if (socket && isConnected) {
      socket.emit('typing_stop', { chatId });
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value: ChatContextType = {
    // State
    chats,
    currentChat,
    messages,
    loading,
    error,
    unreadCount,
    isConnected,
    
    // Actions
    loadUserChats,
    loadChat,
    createOrderChat,
    createProductChat,
    sendMessage,
    markMessagesAsRead,
    setCurrentChat,
    clearError,
    
    // Real-time WebSocket methods
    joinChat,
    leaveChat,
    startTyping,
    stopTyping
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};