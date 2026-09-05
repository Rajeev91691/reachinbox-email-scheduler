import React, { createContext, useContext, useState } from 'react';
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
    } catch (err) {
      console.warn('Backend authentication offline, continuing with client-side Google session', err);
      const email = idToken.startsWith('mock_dev_')
        ? idToken.replace('mock_dev_', '')
        : 'rajeevnandan382@gmail.com';
      
      const fallbackUser: User = {
        id: 'usr_' + Math.random().toString(36).substring(7),
        email: email,
        name: email.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        avatarUrl: `https://lh3.googleusercontent.com/a/default-user=s96-c`,
      };
      
      setUser(fallbackUser);
      setToken('token_' + Date.now());
      localStorage.setItem('reachinbox_token', 'token_' + Date.now());
      localStorage.setItem('reachinbox_user', JSON.stringify(fallbackUser));
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsDev = async (email = 'rajeevnandan382@gmail.com') => {
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
