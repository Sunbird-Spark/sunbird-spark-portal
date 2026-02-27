// frontend/src/auth/AuthContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';

// Use uppercase roles to match backend
export type Role = 'CONTENT_CREATOR' | 'CONTENT_REVIEWER' | 'BOOK_CREATOR' | 'BOOK_REVIEWER' | 'PUBLIC' | 'ORG_ADMIN';

export interface User {
  id: string;
  name: string;
  roles: Role[];
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

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = (userData: User) => {
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
