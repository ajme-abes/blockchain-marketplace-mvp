// src/contexts/ChatContext.tsx
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useAuth } from './AuthContext';
import { Message, Conversation } from '@/services/chatService';
import { useToast } from '@/hooks/use-toast';

interface ChatContextType {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  sendMessage: (content: string, type?: 'text' | 'image' | 'file') => void;
  selectConversation: (conversation: Conversation | null) => void;
  markAsRead: (conversationId: string) => void;
  refreshConversations: () => void;
}

const ChatContext = createContext<ChatContextType | null>(null);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const connect = () => {
    if (!isAuthenticated || !user || socketRef.current) return;

    try {
      // In production, use your WebSocket server URL
      const wsUrl = process.env.NODE_ENV === 'production' 
        ? `wss://your-api.com/chat?token=${localStorage.getItem('authToken')}`
        : `ws://localhost:5000/chat?token=${localStorage.getItem('authToken')}`;
      
      socketRef.current = new WebSocket(wsUrl);

      socketRef.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        toast({
          title: "Chat connected",
          description: "Real-time messaging is active",
        });
      };

      socketRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      socketRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        // Attempt reconnect after 5 seconds
        reconnectTimeoutRef.current = setTimeout(connect, 5000);
      };

      socketRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };

    } catch (error) {
      console.error('WebSocket connection failed:', error);
    }
  };

  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    setIsConnected(false);
  };

  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case 'NEW_MESSAGE':
        handleNewMessage(data.message);
        break;
      case 'MESSAGE_READ':
        handleMessageRead(data.conversationId, data.readerId);
        break;
      case 'USER_TYPING':
        // Handle typing indicators
        break;
      case 'USER_ONLINE':
        // Handle user online status
        break;
      default:
        console.log('Unknown message type:', data.type);
    }
  };

  const handleNewMessage = (message: Message) => {
    // Add to current conversation if active
    if (currentConversation && message.conversationId === currentConversation.id) {
      setMessages(prev => [...prev, message]);
    }

    // Update conversations list with new last message
    setConversations(prev => prev.map(conv => {
      if (conv.id === message.conversationId) {
        return {
          ...conv,
          lastMessage: message,
          unreadCount: currentConversation?.id === conv.id ? 0 : conv.unreadCount + 1,
          updatedAt: message.timestamp,
        };
      }
      return conv;
    }));

    // Show notification if not in current conversation
    if (!currentConversation || currentConversation.id !== message.conversationId) {
      toast({
        title: `New message from ${message.senderName}`,
        description: message.content.substring(0, 50) + (message.content.length > 50 ? '...' : ''),
      });
    }
  };

  const handleMessageRead = (conversationId: string, readerId: string) => {
    if (readerId !== user?.id) return;

    setConversations(prev => prev.map(conv => {
      if (conv.id === conversationId) {
        return { ...conv, unreadCount: 0 };
      }
      return conv;
    }));
  };

  const sendMessage = (content: string, type: 'text' | 'image' | 'file' = 'text') => {
    if (!socketRef.current || !currentConversation || !content.trim()) return;

    const message = {
      type: 'SEND_MESSAGE',
      conversationId: currentConversation.id,
      content: content.trim(),
      messageType: type,
    };

    socketRef.current.send(JSON.stringify(message));
  };

  const selectConversation = (conversation: Conversation | null) => {
    setCurrentConversation(conversation);
    setMessages([]);
    
    if (conversation) {
      // Load conversation messages
      // This would typically call chatService.getConversation()
      // For now, we'll simulate with empty array
      setMessages([]);
      
      // Mark as read
      markAsRead(conversation.id);
    }
  };

  const markAsRead = (conversationId: string) => {
    if (!socketRef.current) return;

    const message = {
      type: 'MARK_AS_READ',
      conversationId,
    };

    socketRef.current.send(JSON.stringify(message));

    // Update local state
    setConversations(prev => prev.map(conv => {
      if (conv.id === conversationId) {
        return { ...conv, unreadCount: 0 };
      }
      return conv;
    }));
  };

  const refreshConversations = async () => {
    // This would typically call chatService.getConversations()
    // For now, we'll simulate with empty array
    setConversations([]);
  };

  useEffect(() => {
    if (isAuthenticated) {
      connect();
      refreshConversations();
    } else {
      disconnect();
      setConversations([]);
      setCurrentConversation(null);
      setMessages([]);
    }

    return () => {
      disconnect();
    };
  }, [isAuthenticated]);

  return (
    <ChatContext.Provider value={{
      conversations,
      currentConversation,
      messages,
      isConnected,
      connect,
      disconnect,
      sendMessage,
      selectConversation,
      markAsRead,
      refreshConversations,
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};