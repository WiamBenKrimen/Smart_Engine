import { apiClient } from './apiClient';

export const workflowApi = {
  list: () => apiClient.get('/workflows'),
  getById: id => apiClient.get(`/workflows/${id}`),
  create: payload => apiClient.post('/workflows', payload),
  update: (id, payload) => apiClient.put(`/workflows/${id}`, payload),
  validate: payload => apiClient.post('/workflows/validate', payload),
};
