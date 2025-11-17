// frontend/src/contexts/ChatContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import apiService from '@/services/api';

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
  
  // Actions
  loadUserChats: () => Promise<void>;
  loadChat: (chatId: string) => Promise<void>;
  createOrderChat: (orderId: string) => Promise<Chat>;
  createProductChat: (productId: string) => Promise<Chat>;
  sendMessage: (chatId: string, content: string, attachments?: any[]) => Promise<Message>;
  markMessagesAsRead: (chatId: string, messageIds?: string[]) => Promise<void>;
  setCurrentChat: (chat: Chat | null) => void;
  clearError: () => void;
  
  // Real-time (will be enhanced with WebSocket later)
  addMessage: (message: Message) => void;
  updateMessageReadStatus: (messageId: string, userId: string) => void;
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
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

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
      let count = 0;
      chats.forEach(chat => {
        const userParticipant = chat.participants.find(p => p.user.id === user?.id);
        if (userParticipant && chat.messages.length > 0) {
          const lastMessage = chat.messages[0]; // Messages are sorted descending
          const lastReadTime = userParticipant.lastReadAt ? new Date(userParticipant.lastReadAt) : new Date(0);
          const messageTime = new Date(lastMessage.createdAt);
          
          if (messageTime > lastReadTime && lastMessage.sender.id !== user?.id) {
            count++;
          }
        }
      });
      setUnreadCount(count);
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
      
      console.log('🔧 Sending message to chat:', chatId);
      const response = await apiService.request(`/chat/${chatId}/messages`, {
        method: 'POST',
        data: {
          content,
          messageType: 'TEXT',
          attachments
        }
      });
      
      if (response.success && response.data) {
        console.log('✅ Message sent:', response.data.id);
        
        // Add message to local state
        const newMessage = response.data;
        setMessages(prev => [newMessage, ...prev]);
        
        // Update last message in chats list
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
    } catch (error: any) {
      console.error('❌ Failed to send message:', error);
      setError(error.message || 'Failed to send message');
      throw error;
    }
  };

  const markMessagesAsRead = async (chatId: string, messageIds?: string[]) => {
    if (!isAuthenticated) return;

    try {
      console.log('🔧 Marking messages as read in chat:', chatId);
      await apiService.request(`/chat/${chatId}/mark-read`, {
        method: 'POST',
        data: { messageIds }
      });
      
      // Update local state
      setChats(prev => 
        prev.map(chat => 
          chat.id === chatId 
            ? {
                ...chat,
                participants: chat.participants.map(p =>
                  p.user.id === user?.id
                    ? { ...p, lastReadAt: new Date().toISOString() }
                    : p
                )
              }
            : chat
        )
      );
      
      console.log('✅ Messages marked as read');
    } catch (error: any) {
      console.error('❌ Failed to mark messages as read:', error);
      // Don't show error to user for read receipts
    }
  };

  const addMessage = (message: Message) => {
    // For real-time updates (will be connected to WebSocket later)
    setMessages(prev => [message, ...prev]);
    
    setChats(prev => 
      prev.map(chat => 
        chat.id === message.chatId 
          ? { 
              ...chat, 
              messages: [message, ...(chat.messages || [])],
              lastMessageAt: message.createdAt
            }
          : chat
      )
    );
  };

  const updateMessageReadStatus = (messageId: string, userId: string) => {
    // For real-time read receipts (will be connected to WebSocket later)
    setMessages(prev =>
      prev.map(message =>
        message.id === messageId
          ? {
              ...message,
              readBy: [
                ...message.readBy,
                {
                  id: `temp-${Date.now()}`,
                  user: { id: userId, name: 'User' },
                  readAt: new Date().toISOString()
                }
              ]
            }
          : message
      )
    );
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
    
    // Actions
    loadUserChats,
    loadChat,
    createOrderChat,
    createProductChat,
    sendMessage,
    markMessagesAsRead,
    setCurrentChat,
    clearError,
    
    // Real-time
    addMessage,
    updateMessageReadStatus
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};