import { createContext, useContext, useMemo, useState } from 'react';
import { getStoredUser, login as loginService, logout as logoutService } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser());

  const value = useMemo(() => ({
    user,
    isAuthenticated: Boolean(user),
    login: async (payload) => {
      const nextUser = await loginService(payload);
      setUser(nextUser);
      return nextUser;
    },
    logout: () => {
      logoutService();
      setUser(null);
    }
  }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
