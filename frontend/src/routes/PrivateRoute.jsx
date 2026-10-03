import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../app/providers/AuthProvider';

export default function PrivateRoute() {
  const { currentUser } = useAuth();
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
