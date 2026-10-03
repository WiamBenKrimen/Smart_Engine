import { apiClient } from './apiClient';

export const notificationApi = {
  list: () => apiClient.get('/notifications'),
  markAsRead: id => apiClient.patch(`/notifications/${id}/read`, {}),
  markAllAsRead: () => apiClient.patch('/notifications/read-all', {}),
};
