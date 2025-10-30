import React, { createContext, useContext, useState, useEffect } from 'react';

type UserRole = 'producer' | 'buyer' | 'admin';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  region?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('ethiotrust-user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = async (email: string, password: string, role: UserRole) => {
    // Mock login - in real app, this would call API
    const mockUser: User = {
      id: Math.random().toString(36),
      name: email.split('@')[0],
      email,
      role,
      phone: '+251911234567',
      region: 'Addis Ababa',
    };
    setUser(mockUser);
    localStorage.setItem('ethiotrust-user', JSON.stringify(mockUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('ethiotrust-user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
