// frontend/src/contexts/SocketContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: string[]; // Array of user IDs who are online
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      // Clean up socket if user logs out
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
        setOnlineUsers([]);
      }
      return;
    }

    console.log('🔌 Initializing WebSocket connection...');

    // Create socket connection
    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    const newSocket = io(SOCKET_URL, {
      auth: {
        token: localStorage.getItem('authToken'),
      },
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('✅ WebSocket connected successfully');
      setIsConnected(true);

      toast({
        title: "Connected",
        description: "Real-time chat is now active",
        duration: 3000,
      });
    });

    newSocket.on('disconnect', () => {
      console.log('❌ WebSocket disconnected');
      setIsConnected(false);

      toast({
        title: "Disconnected",
        description: "Real-time features temporarily unavailable",
        variant: "destructive",
        duration: 3000,
      });
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error);
      setIsConnected(false);
    });

    newSocket.on('user_online', (data: { userId: string }) => {
      console.log('👤 User came online:', data.userId);
      setOnlineUsers(prev => [...prev, data.userId]);
    });

    newSocket.on('user_offline', (data: { userId: string }) => {
      console.log('👤 User went offline:', data.userId);
      setOnlineUsers(prev => prev.filter(id => id !== data.userId));
    });

    newSocket.on('error', (error: { message: string }) => {
      console.error('❌ WebSocket error:', error);
      toast({
        title: "Connection Error",
        description: error.message,
        variant: "destructive",
      });
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      console.log('🔌 Cleaning up WebSocket connection');
      newSocket.disconnect();
    };
  }, [isAuthenticated, user, toast]);

  const value: SocketContextType = {
    socket,
    isConnected,
    onlineUsers,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};