import { useState } from 'react';
import { Search, Download } from 'lucide-react';
import { AUDIT_LOGS } from '../../../app/mockData';
const ACTION_COLORS = {
    CREATE: 'bg-[#EBF2F9] text-[#1F4E79]',
    APPROVE: 'bg-[#DCFCE7] text-[#16A34A]',
    REJECT: 'bg-[#FEE2E2] text-[#DC2626]',
    PUBLISH: 'bg-[#EDE9FE] text-[#7C3AED]',
    UPDATE: 'bg-[#FFEDD5] text-[#EA580C]',
    DELETE: 'bg-[#FEE2E2] text-[#DC2626]',
};
export default function AuditLogPage() {
    const [search, setSearch] = useState('');
    const [actionFilter, setActionFilter] = useState('');
    const filtered = AUDIT_LOGS.filter(log => (log.userName.toLowerCase().includes(search.toLowerCase()) ||
        log.details.toLowerCase().includes(search.toLowerCase()) ||
        log.resourceId.toLowerCase().includes(search.toLowerCase())) &&
        (!actionFilter || log.action === actionFilter));
    return (<div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#172033]">Journal d'audit</h1>
          <p className="text-sm text-[#8898AA] mt-0.5">Historique global de toutes les actions sur la plateforme</p>
        </div>
        <button onClick={() => {
            const header = 'Horodatage,Utilisateur,Action,Ressource,ID,Détails';
            const rows = filtered.map(l => [new Date(l.timestamp).toLocaleString('fr-FR'), l.userName, l.action, l.resource, l.resourceId, `"${l.details.replace(/"/g, '""')}"`].join(','));
            const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `audit-${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        }} className="flex items-center gap-2 border border-[#D1D9E0] text-[#4A5568] px-3 py-2 rounded-lg text-sm hover:bg-[#F4F6F8] transition-colors">
          <Download className="w-4 h-4"/> Exporter CSV
        </button>
      </div>

      <div className="bg-white border border-[#D1D9E0] rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-[#D1D9E0] flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8898AA]"/>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." className="w-full pl-9 pr-4 py-2 text-sm border border-[#D1D9E0] rounded-lg focus:outline-none focus:border-[#1F4E79] bg-[#F8FAFC]"/>
          </div>
          <select value={actionFilter} onChange={e => setActionFilter(e.target.value)} className="text-sm border border-[#D1D9E0] rounded-lg px-3 py-2 focus:outline-none focus:border-[#1F4E79] bg-[#F8FAFC]">
            <option value="">Toutes actions</option>
            {['CREATE', 'APPROVE', 'REJECT', 'PUBLISH', 'UPDATE', 'DELETE'].map(a => (<option key={a} value={a}>{a}</option>))}
          </select>
          <span className="text-xs text-[#8898AA]">{filtered.length} entrée{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#D1D9E0] text-xs text-[#8898AA] uppercase tracking-wide bg-[#F8FAFC]">
              <th className="px-5 py-3 text-left font-medium">Horodatage</th>
              <th className="px-5 py-3 text-left font-medium">Utilisateur</th>
              <th className="px-5 py-3 text-left font-medium">Action</th>
              <th className="px-5 py-3 text-left font-medium">Ressource</th>
              <th className="px-5 py-3 text-left font-medium">Détails</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F4F6F8]">
            {filtered.map(log => (<tr key={log.id} className="hover:bg-[#F8FAFC] transition-colors">
                <td className="px-5 py-3 text-[#4A5568] text-xs whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleString('fr-FR')}
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#EBF2F9] flex items-center justify-center text-[9px] font-bold text-[#1F4E79] flex-shrink-0">
                      {log.userName.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span className="text-[#172033] font-medium text-xs">{log.userName}</span>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${ACTION_COLORS[log.action] ?? 'bg-[#F4F6F8] text-[#4A5568]'}`}>
                    {log.action}
                  </span>
                </td>
                <td className="px-5 py-3 text-xs">
                  <span className="font-medium text-[#172033]">{log.resource}</span>
                  <span className="text-[#8898AA] font-mono ml-1">#{log.resourceId}</span>
                </td>
                <td className="px-5 py-3 text-xs text-[#4A5568] max-w-xs truncate">{log.details}</td>
              </tr>))}
          </tbody>
        </table>
        {filtered.length === 0 && (<div className="py-12 text-center text-[#8898AA] text-sm">Aucune entrée trouvée</div>)}
      </div>
    </div>);
}
