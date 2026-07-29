import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('sd_token'));
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.user);
      setRole(res.data.user.role);
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchMe(); }, [fetchMe]);

  const login = (userData, jwtToken, userRole) => {
    localStorage.setItem('sd_token', jwtToken);
    setToken(jwtToken);
    setUser(userData);
    setRole(userRole);
  };

  const logout = useCallback(async () => {
    try {
      if (token) {
        await api.post('/auth/logout').catch(() => {});
      }
    } finally {
      localStorage.removeItem('sd_token');
      setToken(null);
      setUser(null);
      setRole(null);
      setLoading(false);
    }
  }, [token]);

  const value = React.useMemo(() => ({
    user, token, role, loading, login, logout, fetchMe
  }), [user, token, role, loading, login, logout, fetchMe]);
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
