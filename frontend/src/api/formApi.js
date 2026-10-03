import { apiClient } from './apiClient';

export const formApi = {
  list: () => apiClient.get('/forms'),
  getById: id => apiClient.get(`/forms/${id}`),
  create: payload => apiClient.post('/forms', payload),
  update: (id, payload) => apiClient.put(`/forms/${id}`, payload),
};
