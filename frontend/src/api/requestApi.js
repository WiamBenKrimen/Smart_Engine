import { apiClient } from './apiClient';

export const requestApi = {
  listMine: () => apiClient.get('/requests/mine'),
  getById: id => apiClient.get(`/requests/${id}`),
  create: payload => apiClient.post('/requests', payload),
};
