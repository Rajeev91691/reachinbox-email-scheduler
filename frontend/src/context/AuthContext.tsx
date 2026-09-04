import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loginWithGoogleToken: (idToken: string) => Promise<void>;
  loginAsDev: (email?: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const cached = localStorage.getItem('reachinbox_user');
    return cached ? JSON.parse(cached) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('reachinbox_token'));
  const [isLoading, setIsLoading] = useState(false);

  const loginWithGoogleToken = async (idToken: string) => {
    setIsLoading(true);
    try {
      const res = await authApi.loginWithGoogle(idToken);
      setUser(res.user);
      setToken(res.token);
      localStorage.setItem('reachinbox_token', res.token);
      localStorage.setItem('reachinbox_user', JSON.stringify(res.user));
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsDev = async (email = 'mitrajit@reachinbox.ai') => {
    await loginWithGoogleToken(`mock_dev_${email}`);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('reachinbox_token');
    localStorage.removeItem('reachinbox_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, loginWithGoogleToken, loginAsDev, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
