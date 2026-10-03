import { apiClient } from './apiClient';

export const authApi = {
  login: credentials => apiClient.post('/auth/login', credentials),
  currentUser: () => apiClient.get('/auth/me'),
  changePassword: payload => apiClient.post('/auth/change-password', payload),
};
