// src/services/chatService.ts
import api from './api';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  content: string;
  type: 'text' | 'image' | 'file';
  fileUrl?: string;
  timestamp: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  participant1: string;
  participant2: string;
  participant1Name: string;
  participant2Name: string;
  participant1Role: string;
  participant2Role: string;
  lastMessage?: Message;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateConversationData {
  participant2: string; // User ID
  initialMessage?: string;
}

export const chatService = {
  // Get all conversations for current user
  async getConversations(): Promise<Conversation[]> {
    return api.request('/chat/conversations');
  },

  // Get single conversation with messages
  async getConversation(conversationId: string): Promise<{
    conversation: Conversation;
    messages: Message[];
  }> {
    return api.request(`/chat/conversations/${conversationId}`);
  },

  // Create new conversation
  async createConversation(data: CreateConversationData): Promise<Conversation> {
    return api.request('/chat/conversations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Send message
  async sendMessage(conversationId: string, content: string, type: 'text' | 'image' | 'file' = 'text'): Promise<Message> {
    return api.request(`/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content, type }),
    });
  },

  // Upload file for chat
  async uploadFile(conversationId: string, file: File): Promise<Message> {
    const formData = new FormData();
    formData.append('file', file);

    return api.request(`/chat/conversations/${conversationId}/upload`, {
      method: 'POST',
      body: formData,
    });
  },

  // Mark messages as read
  async markAsRead(conversationId: string): Promise<void> {
    return api.request(`/chat/conversations/${conversationId}/read`, {
      method: 'POST',
    });
  },

  // Search conversations or users
  async searchChats(query: string): Promise<{
    conversations: Conversation[];
    users: any[];
  }> {
    return api.request(`/chat/search?q=${encodeURIComponent(query)}`);
  },
};