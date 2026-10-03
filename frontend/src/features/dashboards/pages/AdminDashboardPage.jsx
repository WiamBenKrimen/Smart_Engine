import { FileText, Clock, AlertTriangle, CheckCircle, Building2, Activity, Radio, ArrowUpRight } from 'lucide-react';
import KPICard from '../components/StatCard';
import StatusBadge from '../../../components/StatusBadge';
import { REQUESTS, WORKSPACES, AUDIT_LOGS, TASKS } from '../../../app/mockData';
function timeAgo(iso) {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 60)
        return `il y a ${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24)
        return `il y a ${h}h`;
    return `il y a ${Math.floor(h / 24)}j`;
}
export default function AdminDashboard() {
    const late = TASKS.filter(t => t.status === 'LATE').length;
    const pending = TASKS.filter(t => t.status === 'AVAILABLE').length;
    const done = REQUESTS.filter(r => r.status === 'TERMINE').length;
    const sla = Math.round((done / REQUESTS.length) * 100);
    return (<div className="mx-auto max-w-[1440px] space-y-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#1F4E79]">
            <Radio className="h-3.5 w-3.5"/>
            Centre de contrôle
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#172033] lg:text-3xl">Vue d’ensemble</h1>
          <p className="mt-1 text-sm text-[#8898AA]">Pilotez les opérations et la santé de vos processus en temps réel.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-[#D1D9E0] bg-white/80 px-3 py-2 text-xs font-medium text-[#4A5568] shadow-sm">
          <span className="h-2 w-2 rounded-full bg-[#16A34A] shadow-[0_0_0_4px_rgba(22,163,74,0.1)]"/>
          Tous les systèmes opérationnels
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Demandes totales" value={REQUESTS.length} icon={FileText} accent="navy" trend={{ value: '+3 cette semaine', positive: true }}/>
        <KPICard label="Processus actifs" value="3" icon={Activity} accent="success"/>
        <KPICard label="Tâches en attente" value={pending} icon={Clock} accent="warning"/>
        <KPICard label="Tâches en retard" value={late} icon={AlertTriangle} accent="danger"/>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent requests */}
        <div className="panel overflow-hidden rounded-2xl lg:col-span-2">
          <div className="flex items-center justify-between border-b border-[#D1D9E0]/70 px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-[#172033]">Flux des demandes</h2>
              <p className="mt-0.5 text-xs text-[#8898AA]">Dernières activités sur la plateforme</p>
            </div>
            <span className="rounded-full bg-[#EBF2F9] px-2.5 py-1 text-[11px] font-semibold text-[#1F4E79]">{REQUESTS.length} demandes</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#D1D9E0]/70 bg-[#F8FAFC]/70 text-[10px] uppercase tracking-[0.12em] text-[#8898AA]">
                <th className="px-5 py-3 text-left font-medium">Référence</th>
                <th className="px-5 py-3 text-left font-medium">Processus</th>
                <th className="px-5 py-3 text-left font-medium">Demandeur</th>
                <th className="px-5 py-3 text-left font-medium">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F4F6F8]">
              {REQUESTS.map(r => (<tr key={r.id} className="transition-colors hover:bg-[#EBF2F9]/35">
                  <td className="px-5 py-3 font-mono text-xs font-medium text-[#1F4E79]">{r.reference}</td>
                  <td className="px-5 py-3 text-[#172033]">{r.processName}</td>
                  <td className="px-5 py-3 text-[#4A5568]">{r.requesterName}</td>
                  <td className="px-5 py-3"><StatusBadge status={r.status} size="sm"/></td>
                </tr>))}
            </tbody>
          </table>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* SLA tile */}
          <div className="panel relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-[#EBF2F9] p-5">
            <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[#538CCA]/20 blur-2xl"/>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[#172033]">Taux SLA respecté</h3>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EBF2F9]">
                <CheckCircle className="h-4 w-4 text-[#1F4E79]"/>
              </div>
            </div>
            <div className="mb-3 text-4xl font-bold tracking-tight text-[#172033]">{sla}<span className="text-xl text-[#8898AA]">%</span></div>
            <div className="h-1.5 w-full rounded-full bg-[#C5D9EE]">
              <div className="h-1.5 rounded-full bg-[#1F4E79] transition-all" style={{ width: `${sla}%` }}/>
            </div>
            <p className="mt-3 text-xs text-[#4A5568]">{done} demandes finalisées dans les délais</p>
          </div>

          {/* Workspaces */}
          <div className="panel rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="w-4 h-4 text-[#1F4E79]"/>
              <h3 className="font-semibold text-[#172033] text-sm">Workspaces</h3>
            </div>
            <div className="space-y-2">
              {WORKSPACES.filter(w => w.active).map(ws => (<div key={ws.id} className="group flex items-center justify-between rounded-xl px-2 py-2 transition-colors hover:bg-[#F4F6F8]">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ws.color }}/>
                    <span className="text-sm text-[#172033]">{ws.name}</span>
                  </div>
                  <span className="text-xs text-[#8898AA]">{ws.memberIds.length} membres</span>
                </div>))}
            </div>
          </div>
        </div>
      </div>

      {/* Audit feed */}
      <div className="panel overflow-hidden rounded-2xl">
        <div className="flex items-center justify-between border-b border-[#D1D9E0]/70 px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-[#172033]">Journal d’activité</h2>
            <p className="mt-0.5 text-xs text-[#8898AA]">Traçabilité des dernières actions</p>
          </div>
          <ArrowUpRight className="h-4 w-4 text-[#8898AA]"/>
        </div>
        <div className="divide-y divide-[#F4F6F8]">
          {AUDIT_LOGS.slice(0, 5).map(log => (<div key={log.id} className="flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-[#F8FAFC]/80">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-[#EBF2F9]">
                <span className="text-[10px] font-bold text-[#1F4E79]">
                  {log.userName.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#172033]">
                  <span className="font-medium">{log.userName}</span>{' '}
                  <span className="text-[#4A5568]">{log.details}</span>
                </p>
                <p className="text-xs text-[#8898AA] mt-0.5">{timeAgo(log.timestamp)}</p>
              </div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${log.action === 'APPROVE' ? 'bg-[#DCFCE7] text-[#16A34A]' :
                log.action === 'REJECT' ? 'bg-[#FEE2E2] text-[#DC2626]' :
                    'bg-[#EBF2F9] text-[#1F4E79]'}`}>{log.action}</span>
            </div>))}
        </div>
      </div>
    </div>);
}
