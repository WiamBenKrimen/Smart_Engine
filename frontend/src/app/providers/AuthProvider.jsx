import { createContext, useContext, useState } from 'react';
import { USERS, WORKSPACES } from '../mockData';
const AuthContext = createContext(null);
const DEMO_CREDENTIALS = {
    'admin@smart-engine.io': 'admin123',
    'thomas@acme.com': 'pass123',
    'sophie@acme.com': 'pass123',
    'lucas@acme.com': 'pass123',
    'emma@acme.com': 'pass123',
    'antoine@acme.com': 'pass123',
};
export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [activeWorkspace, setActiveWorkspace] = useState(null);
    const login = (email, password) => {
        const expectedPass = DEMO_CREDENTIALS[email.toLowerCase()];
        if (!expectedPass || expectedPass !== password) {
            return { success: false, error: 'Email ou mot de passe incorrect.' };
        }
        const user = USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (!user)
            return { success: false, error: 'Utilisateur introuvable.' };
        if (!user.active)
            return { success: false, error: 'Compte désactivé. Contactez l\'administrateur.' };
        setCurrentUser(user);
        setActiveWorkspace(null);
        return { success: true };
    };
    const logout = () => {
        setCurrentUser(null);
        setActiveWorkspace(null);
    };
    const getUserWorkspaces = () => {
        if (!currentUser)
            return [];
        return WORKSPACES.filter(ws => currentUser.workspaceIds.includes(ws.id) && ws.active);
    };
    return (<AuthContext.Provider value={{ currentUser, login, logout, activeWorkspace, setActiveWorkspace, getUserWorkspaces }}>
      {children}
    </AuthContext.Provider>);
}
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx)
        throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
}
