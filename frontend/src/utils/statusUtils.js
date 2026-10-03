const LABELS = {
  EN_ATTENTE: 'En attente',
  EN_COURS: 'En cours',
  TERMINE: 'Terminé',
  REJETE: 'Rejeté',
  EN_RETARD: 'En retard',
  DRAFT: 'Brouillon',
  PUBLISHED: 'Publié',
  ARCHIVED: 'Archivé',
};

export function getStatusLabel(status) {
  return LABELS[status] ?? status;
}
