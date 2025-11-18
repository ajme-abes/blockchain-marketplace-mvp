// src/pages/common/Chats.tsx - UPDATED WITH WEB SOCKET STATUS
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useChat, Chat } from '@/contexts/ChatContext';
import { useSocket } from '@/contexts/SocketContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Search, 
  Send, 
  Paperclip, 
  Smile, 
  Loader2, 
  MessageSquare, 
  Wifi, 
  WifiOff, 
  Circle 
} from 'lucide-react';

const Chats: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { 
    chats, 
    currentChat, 
    messages, 
    loading, 
    error,
    unreadCount,
    loadUserChats, 
    loadChat, 
    sendMessage,
    setCurrentChat,
    markMessagesAsRead
  } = useChat();
  const { isConnected } = useSocket();
  
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [lastMessageTime, setLastMessageTime] = useState<Date | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chats on component mount
  useEffect(() => {
    let isMounted = true;
    
    const loadChatsOnce = async () => {
      if (isAuthenticated && isMounted) {
        console.log('🔧 Loading chats once');
        await loadUserChats();
      }
    };
  
    loadChatsOnce();
  
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mark messages as read when chat is opened
  useEffect(() => {
    if (currentChat && user) {
      markMessagesAsRead(currentChat.id);
    }
  }, [currentChat, user, markMessagesAsRead]);

  const handleSendMessage = async () => {
    if (newMessage.trim() && currentChat) {
      try {
        setSendingMessage(true);
        const startTime = new Date();
        
        await sendMessage(currentChat.id, newMessage);
        setNewMessage('');
        setLastMessageTime(new Date());
        
        const endTime = new Date();
        const duration = endTime.getTime() - startTime.getTime();
        console.log(`✅ Message delivered in ${duration}ms via ${isConnected ? 'WebSocket' : 'HTTP'}`);
        
      } catch (error) {
        console.error('Failed to send message:', error);
      } finally {
        setSendingMessage(false);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSelectChat = async (chat: Chat) => {
    try {
      await loadChat(chat.id);
      setCurrentChat(chat);
    } catch (error) {
      console.error('Failed to load chat:', error);
    }
  };

  const getOtherParticipant = (chat: Chat) => {
    if (!user) return null;
    
    const otherParticipant = chat.participants.find(p => p.user.id !== user.id);
    return otherParticipant?.user || null;
  };

  const getLastMessage = (chat: Chat) => {
    return chat.messages && chat.messages.length > 0 ? chat.messages[0] : null;
  };

  const getUnreadCountForChat = (chat: Chat) => {
    if (!user) return 0;
    
    const userParticipant = chat.participants.find(p => p.user.id === user.id);
    if (!userParticipant || !chat.messages || chat.messages.length === 0) return 0;

    const lastMessage = chat.messages[0];
    const lastReadTime = userParticipant.lastReadAt ? new Date(userParticipant.lastReadAt) : new Date(0);
    const messageTime = new Date(lastMessage.createdAt);
    
    // Count as unread if message is newer than last read time and not sent by user
    return messageTime > lastReadTime && lastMessage.sender.id !== user.id ? 1 : 0;
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getChatTitle = (chat: Chat) => {
    const otherUser = getOtherParticipant(chat);
    if (chat.order) {
      return `Order #${chat.order.id.slice(-8)}`;
    } else if (chat.product) {
      return `About: ${chat.product.name}`;
    } else if (otherUser) {
      return otherUser.name;
    }
    return 'Unknown Chat';
  };

  const getChatSubtitle = (chat: Chat) => {
    const otherUser = getOtherParticipant(chat);
    if (chat.order) {
      return `Order chat with ${otherUser?.name || 'user'}`;
    } else if (chat.product) {
      return `Product inquiry with ${otherUser?.name || 'producer'}`;
    } else if (otherUser) {
      return otherUser.role === 'PRODUCER' ? 'Producer' : 'Buyer';
    }
    return 'Chat';
  };

  const filteredChats = chats.filter(chat => {
    // Add null checks
    if (!chat) return false;
    
    const otherUser = getOtherParticipant(chat);
    const lastMessage = getLastMessage(chat);
    
    const searchTerm = searchQuery.toLowerCase();
    
    return (
      (otherUser?.name && otherUser.name.toLowerCase().includes(searchTerm)) ||
      (getChatTitle(chat) && getChatTitle(chat).toLowerCase().includes(searchTerm)) ||
      (lastMessage?.content && lastMessage.content.toLowerCase().includes(searchTerm))
    );
  });

  const content = (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Messages</h1>
            <p className="text-muted-foreground">
              {unreadCount > 0 
                ? `${unreadCount} unread message${unreadCount > 1 ? 's' : ''}`
                : 'Communicate with buyers and producers'
              }
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isConnected ? "default" : "secondary"} className="flex items-center gap-1">
              {isConnected ? (
                <>
                  <Wifi className="h-3 w-3" />
                  <span>Real-time</span>
                  <Circle className="h-2 w-2 fill-green-500 text-green-500 animate-pulse" />
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3" />
                  <span>Offline</span>
                </>
              )}
            </Badge>
            
            {lastMessageTime && (
              <Badge variant="outline" className="text-xs">
                Last: {formatTime(lastMessageTime.toISOString())}
              </Badge>
            )}
            
            <Button variant="outline" onClick={loadUserChats} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refresh'}
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-destructive/10 border border-destructive rounded-lg">
          <p className="text-destructive">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[600px]">
        {/* Conversations List */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle>Conversations</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-1 max-h-[500px] overflow-y-auto">
              {loading && chats.length === 0 ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : filteredChats.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No conversations found</p>
                  {searchQuery && (
                    <p className="text-sm mt-1">Try changing your search</p>
                  )}
                </div>
              ) : (
                filteredChats.map((chat) => {
                  const otherUser = getOtherParticipant(chat);
                  const lastMessage = getLastMessage(chat);
                  const unreadCountForChat = getUnreadCountForChat(chat);
                  const isActive = currentChat?.id === chat.id;
                  
                  if (!otherUser) return null;
                  
                  return (
                    <div
                      key={chat.id}
                      className={`p-4 cursor-pointer hover:bg-accent transition-colors ${
                        isActive ? 'bg-accent border-l-4 border-primary' : ''
                      }`}
                      onClick={() => handleSelectChat(chat)}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={otherUser.avatarUrl} />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {otherUser.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold truncate text-sm">
                              {getChatTitle(chat)}
                            </h3>
                            {unreadCountForChat > 0 && (
                              <Badge variant="destructive" className="ml-2 h-5 min-w-5 flex items-center justify-center p-0">
                                {unreadCountForChat}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <p className="text-muted-foreground truncate text-xs">
                              {lastMessage?.content || 'No messages yet'}
                            </p>
                            {lastMessage && (
                              <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                                {formatTime(lastMessage.createdAt)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <Badge variant="outline" className="text-xs">
                              {getChatSubtitle(chat)}
                            </Badge>
                            {chat.order && (
                              <Badge variant="secondary" className="text-xs">
                                Order
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="lg:col-span-3 flex flex-col">
          {currentChat ? (
            <>
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {(() => {
                      const otherUser = getOtherParticipant(currentChat);
                      return (
                        <>
                          <Avatar>
                            <AvatarImage src={otherUser?.avatarUrl} />
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {otherUser?.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-lg">
                              {getChatTitle(currentChat)}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                              {getChatSubtitle(currentChat)}
                            </p>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                  {currentChat.order && (
                    <Badge variant="outline">
                      Order: {currentChat.order.deliveryStatus}
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="flex-1 p-0">
                {/* Messages Area */}
                <div className="h-[400px] overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
                      <p>Start the conversation by sending a message!</p>
                    </div>
                  ) : (
                    [...messages].reverse().map((message) => {
                      const isOwnMessage = message.sender.id === user?.id;
                      
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg p-3 ${
                              isOwnMessage
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            {!isOwnMessage && (
                              <div className="text-xs font-medium mb-1">
                                {message.sender.name}
                              </div>
                            )}
                            <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                            <div
                              className={`text-xs mt-1 flex items-center gap-2 ${
                                isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'
                              }`}
                            >
                              {formatTime(message.createdAt)}
                              {isOwnMessage && message.readBy.length > 0 && (
                                <span className="text-green-400">✓ Read</span>
                              )}
                              {isOwnMessage && message.readBy.length === 0 && (
                                <span className="text-blue-400">✓ Delivered</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="border-t p-4">
                  <div className="flex gap-2 items-center">
                    <Button variant="ghost" size="icon">
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Smile className="h-4 w-4" />
                    </Button>
                    
                    <div className="flex-1 relative">
                      <Input
                        placeholder={isConnected ? "Type your message (real-time)..." : "Type your message (offline mode)..."}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="pr-10"
                        disabled={sendingMessage}
                      />
                      
                      {sendingMessage && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    
                    <Button 
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sendingMessage}
                      className="min-w-[80px]"
                    >
                      {sendingMessage ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-1" />
                          Send
                        </>
                      )}
                    </Button>
                  </div>
                  
                  {/* Connection Status Info */}
                  <div className="mt-2 text-xs text-muted-foreground flex items-center gap-2">
                    {isConnected ? (
                      <>
                        <Circle className="h-2 w-2 fill-green-500 text-green-500 animate-pulse" />
                        <span>Connected - Messages deliver instantly</span>
                      </>
                    ) : (
                      <>
                        <Circle className="h-2 w-2 fill-yellow-500 text-yellow-500" />
                        <span>Offline - Using fallback mode</span>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
                <p>Choose a conversation from the list to start messaging</p>
                {chats.length === 0 && !loading && (
                  <p className="text-sm mt-2">
                    Your chat conversations will appear here when you start messaging buyers or producers.
                  </p>
                )}
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </main>
  );

  if (isAuthenticated) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <div className="flex-1 flex flex-col">
            <PageHeader title="Chats" />
            {content}
          </div>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {content}
      <Footer />
    </div>
  );
};

export default Chats;