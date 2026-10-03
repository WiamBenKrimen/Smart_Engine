export function formatDate(value, options = {}) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    ...options,
  }).format(new Date(value));
}
