import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('hotelpro_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('hotelpro_token') || null);
  const [isLoading, setIsLoading] = useState(true);

  // Synchronize on startup: verify stored token against backend /me endpoint
  useEffect(() => {
    const verifyExistingSession = async () => {
      const storedToken = localStorage.getItem('hotelpro_token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await apiClient.get('/api/v1/auth/me');
        if (response.data && response.data.user) {
          setUser(response.data.user);
          localStorage.setItem('hotelpro_user', JSON.stringify(response.data.user));
        }
      } catch (err) {
        console.warn('Session verification failed. Clearing credentials:', err.message);
        localStorage.removeItem('hotelpro_token');
        localStorage.removeItem('hotelpro_user');
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    verifyExistingSession();

    // Listen for 401 session expiration from axios interceptor
    const handleSessionExpired = () => {
      setToken(null);
      setUser(null);
    };

    window.addEventListener('hotelpro_session_expired', handleSessionExpired);
    return () => {
      window.removeEventListener('hotelpro_session_expired', handleSessionExpired);
    };
  }, []);

  const login = async (email, password) => {
    const response = await apiClient.post('/api/v1/auth/login', {
      email,
      password
    });

    const { token: receivedToken, user: receivedUser } = response.data;
    localStorage.setItem('hotelpro_token', receivedToken);
    localStorage.setItem('hotelpro_user', JSON.stringify(receivedUser));
    setToken(receivedToken);
    setUser(receivedUser);

    return receivedUser;
  };

  const register = async (userData) => {
    const response = await apiClient.post('/api/v1/auth/register', userData);

    const { token: receivedToken, user: receivedUser } = response.data;
    localStorage.setItem('hotelpro_token', receivedToken);
    localStorage.setItem('hotelpro_user', JSON.stringify(receivedUser));
    setToken(receivedToken);
    setUser(receivedUser);

    return receivedUser;
  };

  const logout = () => {
    localStorage.removeItem('hotelpro_token');
    localStorage.removeItem('hotelpro_user');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    isAuthenticated: Boolean(token && user),
    isLoading,
    login,
    register,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
