const STATUS_CONFIG = {
    EN_ATTENTE: { label: 'En attente', bg: 'bg-[#FFF7ED]', text: 'text-[#C2410C]', dot: 'bg-[#EA580C]' },
    EN_COURS: { label: 'En cours', bg: 'bg-[#EFF6FF]', text: 'text-[#1D4ED8]', dot: 'bg-[#3B82F6]' },
    TERMINE: { label: 'Terminé', bg: 'bg-[#F0FDF4]', text: 'text-[#15803D]', dot: 'bg-[#16A34A]' },
    REJETE: { label: 'Rejeté', bg: 'bg-[#FEF2F2]', text: 'text-[#B91C1C]', dot: 'bg-[#DC2626]' },
    EN_RETARD: { label: 'En retard', bg: 'bg-[#FEF2F2]', text: 'text-[#B91C1C]', dot: 'bg-[#DC2626]' },
    BROUILLON: { label: 'Brouillon', bg: 'bg-[#F8FAFC]', text: 'text-[#4A5568]', dot: 'bg-[#8898AA]' },
    DRAFT: { label: 'Brouillon', bg: 'bg-[#F8FAFC]', text: 'text-[#4A5568]', dot: 'bg-[#8898AA]' },
    PUBLISHED: { label: 'Publié', bg: 'bg-[#F0FDF4]', text: 'text-[#15803D]', dot: 'bg-[#16A34A]' },
    PUBLIÉ: { label: 'Publié', bg: 'bg-[#F0FDF4]', text: 'text-[#15803D]', dot: 'bg-[#16A34A]' },
    ARCHIVED: { label: 'Archivé', bg: 'bg-[#F1F5F9]', text: 'text-[#64748B]', dot: 'bg-[#94A3B8]' },
    APPROVED: { label: 'Approuvé', bg: 'bg-[#F0FDF4]', text: 'text-[#15803D]', dot: 'bg-[#16A34A]' },
    REJECTED: { label: 'Rejeté', bg: 'bg-[#FEF2F2]', text: 'text-[#B91C1C]', dot: 'bg-[#DC2626]' },
    AVAILABLE: { label: 'Disponible', bg: 'bg-[#EFF6FF]', text: 'text-[#1D4ED8]', dot: 'bg-[#3B82F6]' },
    IN_PROGRESS: { label: 'En cours', bg: 'bg-[#EFF6FF]', text: 'text-[#1D4ED8]', dot: 'bg-[#3B82F6]' },
    DONE: { label: 'Terminé', bg: 'bg-[#F0FDF4]', text: 'text-[#15803D]', dot: 'bg-[#16A34A]' },
    LATE: { label: 'En retard', bg: 'bg-[#FEF2F2]', text: 'text-[#B91C1C]', dot: 'bg-[#DC2626]' },
    PENDING: { label: 'En attente', bg: 'bg-[#FFF7ED]', text: 'text-[#C2410C]', dot: 'bg-[#EA580C]' },
    SKIPPED: { label: 'Ignoré', bg: 'bg-[#F1F5F9]', text: 'text-[#64748B]', dot: 'bg-[#94A3B8]' },
    ACTIF: { label: 'Actif', bg: 'bg-[#F0FDF4]', text: 'text-[#15803D]', dot: 'bg-[#16A34A]' },
    INACTIF: { label: 'Inactif', bg: 'bg-[#F1F5F9]', text: 'text-[#64748B]', dot: 'bg-[#94A3B8]' },
};
export default function StatusBadge({ status, size = 'md' }) {
    const cfg = STATUS_CONFIG[status] ?? { label: status, bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' };
    const isAnimated = ['EN_COURS', 'IN_PROGRESS', 'EN_RETARD', 'LATE'].includes(status);
    const px = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';
    return (<span className={`inline-flex items-center gap-1.5 font-medium rounded-full ${cfg.bg} ${cfg.text} ${px}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${isAnimated ? 'pulse-dot' : ''}`}/>
      {cfg.label}
    </span>);
}
