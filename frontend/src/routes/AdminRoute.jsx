import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../app/providers/AuthProvider';

export default function AdminRoute() {
  const { currentUser } = useAuth();

  if (!currentUser) return <Navigate to="/login" replace />;
  if (currentUser.role !== 'ADMIN') return <Navigate to="/employee" replace />;

  return <Outlet />;
}
