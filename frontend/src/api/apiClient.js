import { appConfig } from '../app/appConfig';

async function request(path, options = {}) {
  const token = localStorage.getItem('smart-engine-token');
  const isFormData = options.body instanceof FormData;
  const response = await fetch(`${appConfig.apiUrl}${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Une erreur est survenue.' }));
    throw new Error(error.message ?? `Erreur HTTP ${response.status}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

export const apiClient = {
  get: path => request(path),
  post: (path, data) => request(path, { method: 'POST', body: data instanceof FormData ? data : JSON.stringify(data) }),
  put: (path, data) => request(path, { method: 'PUT', body: JSON.stringify(data) }),
  patch: (path, data) => request(path, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: path => request(path, { method: 'DELETE' }),
};
