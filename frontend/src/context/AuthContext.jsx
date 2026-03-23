import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for saved user session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('evaldemo_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email) => {
    try {
      const response = await api.post('/auth/login', { email });
      const userData = response.data.user;
      setUser(userData);
      localStorage.setItem('evaldemo_user', JSON.stringify(userData));
      return userData;
    } catch (error) {
      console.error('Login failed', error);
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('evaldemo_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
