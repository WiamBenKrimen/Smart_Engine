export function formatMoney(value, currency = 'EUR') {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
  }).format(Number(value ?? 0));
}
