import { apiClient } from './apiClient';

export const auditApi = {
  list: async () => {
    return apiClient.get('/audit');
  },
};
