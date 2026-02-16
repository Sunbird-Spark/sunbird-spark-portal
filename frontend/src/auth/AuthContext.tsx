import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export type Role = 'admin' | 'content_creator' | 'content_reviewer' | 'guest';

export interface User {
  id: string;
  name: string;
  role: Role;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

import userAuthInfoService from '@/services/userAuthInfoService/userAuthInfoService';

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const authInfo = await userAuthInfoService.getAuthInfo();
        if (authInfo.isAuthenticated) {
          setUser({
            id: authInfo.uid || 'unknown',
            name: 'User', // Placeholder as we don't have name in auth info
            role: 'content_creator', // Default role for now
          });
        }
      } catch (error) {
        console.error('Failed to fetch auth info:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = (userData: User) => {
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
    userAuthInfoService.clearAuth();
    // Optionally call backend logout API here if needed
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
  };

  if (loading) {
    return null; // Or a loading spinner
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
