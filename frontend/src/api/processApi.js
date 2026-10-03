import { apiClient } from './apiClient';

export const processApi = {
  list: () => apiClient.get('/processes'),
  getById: id => apiClient.get(`/processes/${id}`),
  create: payload => apiClient.post('/processes', payload),
  update: (id, payload) => apiClient.put(`/processes/${id}`, payload),
  publish: id => apiClient.post(`/processes/${id}/publish`, {}),
  archive: id => apiClient.post(`/processes/${id}/archive`, {}),
};
