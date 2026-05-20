import React, { createContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { User, AuthResponse } from '../types';
import api from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signup: (email: string, password: string, username: string, specialization: string) => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  restoreToken: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore token on app launch
  const restoreToken = useCallback(async () => {
    try {
      setIsLoading(true);
      const storedToken = await api.getStoredToken();
      if (storedToken) {
        setToken(storedToken);
        // TODO: Fetch user profile with token to verify it's still valid
      }
    } catch (error) {
      console.error('Token restore error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial token check on mount
  useEffect(() => {
    restoreToken();
  }, [restoreToken]);

  const signup = useCallback(
    async (email: string, password: string, username: string, specialization: string) => {
      try {
        const response: AuthResponse = await api.signup(email, password, username, specialization);
        setUser(response.user);
        setToken(response.token);
      } catch (error) {
        console.error('Signup error:', error);
        throw error;
      }
    },
    []
  );

  const login = useCallback(async (username: string, password: string) => {
    try {
      const response: AuthResponse = await api.login(username, password);
      setUser(response.user);
      setToken(response.token);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
      setUser(null);
      setToken(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }, []);

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    signup,
    login,
    logout,
    restoreToken,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
