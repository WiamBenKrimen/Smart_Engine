import { useAuth } from './useAuth';

export default function useWorkspaces() {
  const { getUserWorkspaces, activeWorkspace, setActiveWorkspace } = useAuth();
  return { workspaces: getUserWorkspaces(), activeWorkspace, setActiveWorkspace };
}
