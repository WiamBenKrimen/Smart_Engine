import { useState, useEffect } from 'react';
import { Search, Download, RotateCw, Loader2, AlertCircle, ScrollText } from 'lucide-react';
import { auditApi } from '../../../api/auditApi';

const ACTION_COLORS = {
  // Codes standard
  CREATE: 'bg-[#EBF2F9] text-[#1F4E79] border-[#BFDBFE]',
  APPROVE: 'bg-[#DCFCE7] text-[#16A34A] border-[#BBF7D0]',
  REJECT: 'bg-[#FEE2E2] text-[#DC2626] border-[#FECACA]',
  PUBLISH: 'bg-[#EDE9FE] text-[#7C3AED] border-[#DDD6FE]',
  UPDATE: 'bg-[#FFEDD5] text-[#EA580C] border-[#FED7AA]',
  DELETE: 'bg-[#FEE2E2] text-[#DC2626] border-[#FECACA]',
  // Codes métier backend
  DEMANDE_CREEE: 'bg-[#EBF2F9] text-[#1F4E79] border-[#BFDBFE]',
  WORKFLOW_DEMARRE: 'bg-[#EDE9FE] text-[#7C3AED] border-[#DDD6FE]',
  TACHE_CREEE: 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]',
  TACHE_PRISE: 'bg-[#FFEDD5] text-[#EA580C] border-[#FED7AA]',
  TACHE_APPROUVEE: 'bg-[#DCFCE7] text-[#16A34A] border-[#BBF7D0]',
  APPROUVEE: 'bg-[#DCFCE7] text-[#16A34A] border-[#BBF7D0]',
  TACHE_REFUSEE: 'bg-[#FEE2E2] text-[#DC2626] border-[#FECACA]',
  REFUSEE: 'bg-[#FEE2E2] text-[#DC2626] border-[#FECACA]',
  CONDITION_EVALUEE: 'bg-[#F1F5F9] text-[#475569] border-[#CBD5E1]',
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const fetchLogs = () => {
    setLoading(true);
    auditApi.list()
      .then(res => {
        setLogs(Array.isArray(res) ? res : []);
        setError('');
      })
      .catch(err => {
        setError(err.message || 'Impossible de charger le journal d\'audit depuis le serveur.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Extraire la liste unique des actions disponibles
  const availableActions = Array.from(new Set(logs.map(l => l.action).filter(Boolean)));

  const filtered = logs.filter(log => {
    const term = search.toLowerCase();
    const uName = (log.userName || '').toLowerCase();
    const details = (log.details || '').toLowerCase();
    const rId = (log.resourceId || '').toLowerCase();
    const dRef = (log.demandeReference || '').toLowerCase();

    const matchesSearch = !term || uName.includes(term) || details.includes(term) || rId.includes(term) || dRef.includes(term);
    const matchesAction = !actionFilter || log.action === actionFilter;

    return matchesSearch && matchesAction;
  });

  const exportCSV = () => {
    const header = 'Horodatage,Utilisateur,Email,Action,Ressource,ID / Ref,Détails';
    const rows = filtered.map(l => [
      l.timestamp ? new Date(l.timestamp).toLocaleString('fr-FR') : '',
      `"${(l.userName || 'Système').replace(/"/g, '""')}"`,
      `"${(l.userEmail || '').replace(/"/g, '""')}"`,
      l.action || '',
      l.resource || '',
      `"${(l.resourceId || l.demandeReference || '').replace(/"/g, '""')}"`,
      `"${(l.details || '').replace(/"/g, '""')}"`
    ].join(','));

    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-journal-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#172033]">Journal d'audit</h1>
          <p className="text-sm text-[#8898AA] mt-0.5">
            Historique complet et traçabilité de toutes les actions (source Base de données)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center gap-1.5 border border-[#D1D9E0] text-[#4A5568] px-3 py-2 rounded-lg text-sm hover:bg-[#F4F6F8] transition-colors disabled:opacity-50"
            title="Rafraîchir les logs"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>
          <button
            onClick={exportCSV}
            disabled={filtered.length === 0}
            className="flex items-center gap-2 bg-[#1F4E79] text-white px-3.5 py-2 rounded-lg text-sm hover:bg-[#163a5c] transition-colors disabled:opacity-50 shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Exporter CSV</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 bg-[#FEF2F2] border border-[#FECACA] rounded-xl p-3.5 text-sm text-[#DC2626]">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Table Container */}
      <div className="bg-white border border-[#D1D9E0] rounded-xl overflow-hidden shadow-sm">
        {/* Filter bar */}
        <div className="px-5 py-3 border-b border-[#D1D9E0] flex flex-wrap items-center gap-3 bg-[#F8FAFC]">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8898AA]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher par utilisateur, référence, détail..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-[#D1D9E0] rounded-lg focus:outline-none focus:border-[#1F4E79] bg-white"
            />
          </div>
          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="text-sm border border-[#D1D9E0] rounded-lg px-3 py-2 focus:outline-none focus:border-[#1F4E79] bg-white"
          >
            <option value="">Toutes les actions ({logs.length})</option>
            {availableActions.map(a => (
              <option key={a} value={a}>
                {a} ({logs.filter(l => l.action === a).length})
              </option>
            ))}
          </select>
          <span className="text-xs text-[#8898AA] ml-auto">
            {filtered.length} entrée{filtered.length > 1 ? 's' : ''} affichée{filtered.length > 1 ? 's' : ''}
          </span>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-16 text-center text-sm text-[#8898AA] flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-[#1F4E79]" />
            <span>Chargement du journal d'audit...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-[#8898AA] text-sm">
            <ScrollText className="w-8 h-8 mx-auto text-[#D1D9E0] mb-2" />
            <p className="font-medium text-[#4A5568]">Aucune entrée trouvée</p>
            <p className="text-xs text-[#8898AA] mt-1">Modifiez vos filtres ou effectuez de nouvelles actions.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#D1D9E0] text-[11px] text-[#8898AA] uppercase tracking-wider bg-[#F8FAFC]">
                  <th className="px-5 py-3 text-left font-semibold">Horodatage</th>
                  <th className="px-5 py-3 text-left font-semibold">Utilisateur</th>
                  <th className="px-5 py-3 text-left font-semibold">Action</th>
                  <th className="px-5 py-3 text-left font-semibold">Ressource</th>
                  <th className="px-5 py-3 text-left font-semibold">Détails</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F4F6F8]">
                {filtered.map(log => {
                  const initials = (log.userName || '?')
                    .split(' ')
                    .filter(Boolean)
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);

                  const badgeClass = ACTION_COLORS[log.action] || 'bg-[#F4F6F8] text-[#4A5568] border-[#E2E8F0]';

                  return (
                    <tr key={log.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-5 py-3 text-[#4A5568] text-xs whitespace-nowrap font-mono">
                        {log.timestamp ? new Date(log.timestamp).toLocaleString('fr-FR') : '—'}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[#EBF2F9] flex items-center justify-center text-[10px] font-bold text-[#1F4E79] flex-shrink-0">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <span className="text-[#172033] font-medium text-xs block truncate">
                              {log.userName || 'Système'}
                            </span>
                            {log.userEmail && (
                              <span className="text-[10px] text-[#8898AA] block font-mono truncate">
                                {log.userEmail}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${badgeClass} whitespace-nowrap inline-block`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs whitespace-nowrap">
                        <span className="font-semibold text-[#172033]">{log.resource}</span>
                        {(log.resourceId || log.demandeReference) && (
                          <span className="text-[#8898AA] font-mono ml-1.5 bg-[#F4F6F8] px-1.5 py-0.5 rounded text-[11px]">
                            #{log.demandeReference || log.resourceId}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-xs text-[#4A5568] max-w-md">
                        <span className="line-clamp-2" title={log.details}>
                          {log.details || '—'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
