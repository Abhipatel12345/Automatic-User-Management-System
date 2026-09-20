import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginApi, getMeApi } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('apex_auth_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('apex_auth_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifySession() {
      const storedToken = localStorage.getItem('apex_auth_token');
      if (storedToken) {
        try {
          const res = await getMeApi();
          if (res.success && res.user) {
            setUser(res.user);
            localStorage.setItem('apex_auth_user', JSON.stringify(res.user));
          } else {
            logout();
          }
        } catch (err) {
          console.warn('Session verification failed, clearing auth:', err);
          logout();
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    }

    verifySession();
  }, []);

  const login = async (email, password) => {
    const res = await loginApi({ email, password });
    if (res.success && res.token && res.user) {
      localStorage.setItem('apex_auth_token', res.token);
      localStorage.setItem('apex_auth_user', JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
      return res.user;
    }
    throw new Error(res.message || 'Login failed');
  };

  const logout = () => {
    localStorage.removeItem('apex_auth_token');
    localStorage.removeItem('apex_auth_user');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
