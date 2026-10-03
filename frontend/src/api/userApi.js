import { apiClient } from './apiClient';

export const userApi = {
  list: params => apiClient.get(`/users${params ? `?${new URLSearchParams(params)}` : ''}`),
  getById: id => apiClient.get(`/users/${id}`),
  create: payload => apiClient.post('/users', payload),
  update: (id, payload) => apiClient.put(`/users/${id}`, payload),
  setActive: (id, active) => apiClient.patch(`/users/${id}/status`, { active }),
};
