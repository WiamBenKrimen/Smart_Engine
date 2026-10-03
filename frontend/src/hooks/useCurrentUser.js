import { useAuth } from './useAuth';

export default function useCurrentUser() {
  const { currentUser } = useAuth();
  return currentUser;
}
