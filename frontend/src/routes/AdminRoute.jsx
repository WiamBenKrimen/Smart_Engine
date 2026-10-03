import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../app/providers/AuthProvider';

export default function AdminRoute() {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-[#4A5568]">Chargement...</div>;
  }

  if (!currentUser) return <Navigate to="/login" replace />;
  if (currentUser.role !== 'ADMIN') return <Navigate to="/employee" replace />;

  return <Outlet />;
}
