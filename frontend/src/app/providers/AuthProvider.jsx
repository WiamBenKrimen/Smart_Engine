import { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from '../../api/authApi';
import { WORKSPACES } from '../mockData';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('smart-engine-token');
    if (!token) {
      setLoading(false);
      return;
    }

    authApi.currentUser()
      .then(user => setCurrentUser(user))
      .catch(() => {
        localStorage.removeItem('smart-engine-token');
        setCurrentUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authApi.login({ email, motDePasse: password });
      localStorage.setItem('smart-engine-token', response.token);
      setCurrentUser(response.user);
      setActiveWorkspace(null);
      return { success: true, user: response.user };
    } catch (error) {
      return { success: false, error: error.message || 'Email ou mot de passe incorrect.' };
    }
  };

  const logout = () => {
    localStorage.removeItem('smart-engine-token');
    setCurrentUser(null);
    setActiveWorkspace(null);
  };

  const getUserWorkspaces = () => {
    if (!currentUser) return [];
    return WORKSPACES.filter(ws => currentUser.workspaceIds?.includes(ws.id) && ws.active);
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, login, logout, activeWorkspace, setActiveWorkspace, getUserWorkspaces }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
