import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem('user');
    await AsyncStorage.removeItem('token');
    setUser(null);
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const saved = await AsyncStorage.getItem('user');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.expiration && new Date(parsed.expiration) < new Date()) {
            await logout();
          } else {
            setUser(parsed);
          }
        }
      } catch {
        await logout();
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, [logout]);

  const login = async (username, password) => {
    const { data } = await authService.login(username, password);
    const userData = {
      username: data.username,
      role: data.role,
      fullName: data.fullName,
      expiration: data.expiration,
    };
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    await AsyncStorage.setItem('token', data.token);
    setUser(userData);
  };

  const isAdmin = user?.role === 'Admin';

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, isAdmin, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
