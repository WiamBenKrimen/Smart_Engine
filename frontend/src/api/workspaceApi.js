import { apiClient } from './apiClient';

export const workspaceApi = {
  list: () => apiClient.get('/workspaces'),
  listUsers: () => apiClient.get('/workspaces/users'),
  getById: id => apiClient.get(`/workspaces/${id}`),
  create: payload => apiClient.post('/workspaces', payload),
  update: (id, payload) => apiClient.put(`/workspaces/${id}`, payload),
  setActive: (id, active) => apiClient.patch(`/workspaces/${id}/status`, { active }),
  addMember: (id, userId) => apiClient.post(`/workspaces/${id}/members`, { userId }),
  removeMember: (id, userId) => apiClient.delete(`/workspaces/${id}/members/${userId}`),
};
