import { createContext, useContext, useState } from 'react';
import * as db from '../db';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const login = async (email, password) => {
    const data = db.login(email, password);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const ROLE_LABELS = { staff: 'Staff', leader: 'Team Lead', strategy: 'Strategy', executive: 'Executive' };
  const roleLabel = user ? ROLE_LABELS[user.role] || user.role : '';

  return (
    <AuthContext.Provider value={{ user, login, logout, loading: false, roleLabel }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
