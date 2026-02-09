import { createContext, useState, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authMethod, setAuthMethod] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('auth_token'));
  const navigate = useNavigate();

  const login = useCallback((userData, method) => {
    setUser(userData);
    setAuthMethod(method);
    if (userData.token) {
      setToken(userData.token);
      localStorage.setItem('auth_token', userData.token);
    }
    navigate('/dashboard');
  }, [navigate]);

  const logout = useCallback(() => {
    setUser(null);
    setAuthMethod(null);
    setToken(null);
    localStorage.removeItem('auth_token');
    navigate('/');
  }, [navigate]);

  const value = {
    user,
    authMethod,
    token,
    isAuthenticated: !!user,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}