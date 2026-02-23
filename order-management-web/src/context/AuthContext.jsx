import { createContext, useContext, useState } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = async (username, password) => {
    const { data } = await authService.login(username, password);
    const userData = { username: data.username, role: data.role, fullName: data.fullName, expiration: data.expiration };
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', data.token);
    setUser(userData);
    return true;
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
