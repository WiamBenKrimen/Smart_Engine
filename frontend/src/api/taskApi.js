import { apiClient } from './apiClient';

export const taskApi = {
  listMine: () => apiClient.get('/tasks/mine'),
  listByWorkspace: workspaceId => apiClient.get(`/workspaces/${workspaceId}/tasks`),
  claim: id => apiClient.post(`/tasks/${id}/claim`, {}),
  approve: (id, comment) => apiClient.post(`/tasks/${id}/approve`, { comment }),
  reject: (id, comment) => apiClient.post(`/tasks/${id}/reject`, { comment }),
};
