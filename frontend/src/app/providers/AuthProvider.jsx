import { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from '../../api/authApi';
import { workspaceApi } from '../../api/workspaceApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('smart-engine-token');
    if (!token) {
      setLoading(false);
      return;
    }

    authApi.currentUser()
      .then(async user => {
        const workspaceRows = await workspaceApi.list().catch(() => []);
        setCurrentUser(user);
        setWorkspaces(workspaceRows);
      })
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
      const workspaceRows = await workspaceApi.list().catch(() => []);
      setCurrentUser(response.user);
      setWorkspaces(workspaceRows);
      setActiveWorkspace(null);
      return { success: true, user: response.user };
    } catch (error) {
      const msg = error.message || '';
      const friendlyError = msg.includes('ACCOUNT_DISABLED')
        ? 'Votre compte a été désactivé. Veuillez contacter un administrateur.'
        : msg || 'Email ou mot de passe incorrect.';
      return { success: false, error: friendlyError };
    }
  };

  const logout = () => {
    localStorage.removeItem('smart-engine-token');
    setCurrentUser(null);
    setWorkspaces([]);
    setActiveWorkspace(null);
  };

  const getUserWorkspaces = () => {
    if (!currentUser) return [];
    return workspaces.filter(ws => currentUser.workspaceIds?.includes(ws.id) && ws.active);
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
