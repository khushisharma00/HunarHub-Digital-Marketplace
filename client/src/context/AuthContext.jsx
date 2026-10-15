import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [entrepreneur, setEntrepreneur] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('hunarhub_token') || null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setUser(null);
        setEntrepreneur(null);
        setLoading(false);
        return;
      }
      try {
        const res = await api.getMe();
        if (res.success) {
          setUser(res.user);
          setEntrepreneur(res.entrepreneur || null);
          setUnreadCount(res.unreadNotifications || 0);
        } else {
          logout();
        }
      } catch (err) {
        console.error('Failed to restore auth session:', err);
        logout();
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [token]);

  const login = (authToken, authUser, authEntrepreneur = null) => {
    localStorage.setItem('hunarhub_token', authToken);
    setToken(authToken);
    setUser(authUser);
    setEntrepreneur(authEntrepreneur);
  };

  const logout = () => {
    localStorage.removeItem('hunarhub_token');
    setToken(null);
    setUser(null);
    setEntrepreneur(null);
    setUnreadCount(0);
  };

  const refreshUser = async () => {
    try {
      const res = await api.getMe();
      if (res.success) {
        setUser(res.user);
        setEntrepreneur(res.entrepreneur || null);
        setUnreadCount(res.unreadNotifications || 0);
      }
    } catch (err) {
      console.error('Error refreshing user:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        entrepreneur,
        token,
        unreadCount,
        setUnreadCount,
        loading,
        login,
        logout,
        refreshUser,
        isAuthenticated: !!user,
        isCustomer: user?.role === 'customer',
        isEntrepreneur: user?.role === 'entrepreneur',
        isAdmin: user?.role === 'admin'
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
