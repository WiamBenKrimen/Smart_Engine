import { useNavigate } from 'react-router-dom';
import { FilePlus, Clock, CheckCircle, XCircle, ArrowRight, Bell, Sparkles } from 'lucide-react';
import { NOTIFICATIONS } from '../../../app/mockData';
import { useProcesses } from '../../../app/providers/ProcessProvider';
import { useAuth } from '../../../app/providers/AuthProvider';
import { useRequests } from '../../../app/providers/RequestProvider';
import StatusBadge from '../../../components/StatusBadge';
import KPICard from '../components/StatCard';
import ProcessIcon from '../../processes/components/ProcessIcon';
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
export default function EmployeeDashboard() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const { processes } = useProcesses();
    const { getMyRequests } = useRequests();
    const myRequests = getMyRequests(currentUser?.id ?? '');
    const myNotifs = NOTIFICATIONS.filter(n => n.userId === currentUser?.id && !n.read);
    const published = processes.filter(p => p.status === 'PUBLISHED');
    return (<div className="mx-auto max-w-[1440px] space-y-7">
      <div className="relative overflow-hidden rounded-3xl border border-[#C5D9EE] bg-gradient-to-br from-[#EBF2F9] via-white to-[#F8FAFC] px-6 py-6 shadow-[0_20px_50px_rgba(31,78,121,0.10)] sm:px-8 sm:py-7">
        <div className="absolute -right-10 -top-16 h-52 w-52 rounded-full bg-[#538CCA]/20 blur-3xl"/>
        <div className="absolute bottom-0 right-1/3 h-24 w-24 rounded-full bg-[#16A34A]/10 blur-2xl"/>
        <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#1F4E79]">
              <Sparkles className="h-3.5 w-3.5"/>
              Votre espace de travail
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#172033] sm:text-3xl">Bonjour, {currentUser?.name?.split(' ')[0]}</h1>
            <p className="mt-1 text-sm text-[#4A5568]">Que souhaitez-vous mettre en mouvement aujourd’hui ?</p>
          </div>
          <button onClick={() => navigate('/employee/new-request')} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1F4E79] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#1F4E79]/20 transition-transform hover:-translate-y-0.5 hover:bg-[#172033]">
            <FilePlus className="h-4 w-4"/>
            Nouvelle demande
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Mes demandes" value={myRequests.length} icon={FilePlus} accent="navy"/>
        <KPICard label="En cours" value={myRequests.filter(r => r.status === 'EN_COURS').length} icon={Clock} accent="warning"/>
        <KPICard label="Terminées" value={myRequests.filter(r => r.status === 'TERMINE').length} icon={CheckCircle} accent="success"/>
        <KPICard label="Rejetées" value={myRequests.filter(r => r.status === 'REJETE').length} icon={XCircle} accent="danger"/>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* My requests */}
        <div className="panel overflow-hidden rounded-2xl lg:col-span-2">
          <div className="flex items-center justify-between border-b border-[#D1D9E0]/70 px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-[#172033]">Mes dernières demandes</h2>
              <p className="mt-0.5 text-xs text-[#8898AA]">Suivez leur progression sans perdre le fil</p>
            </div>
            <button onClick={() => navigate('/employee/requests')} className="flex items-center gap-1 text-xs font-semibold text-[#1F4E79] hover:underline">
              Voir tout <ArrowRight className="w-3 h-3"/>
            </button>
          </div>
          {myRequests.length === 0 ? (<div className="py-12 text-center">
              <p className="text-sm text-[#8898AA]">Aucune demande pour l'instant</p>
              <button onClick={() => navigate('/employee/new-request')} className="mt-3 flex items-center gap-2 bg-[#1F4E79] text-white px-4 py-2 rounded-lg text-sm font-medium mx-auto hover:bg-[#172033] transition-colors">
                <FilePlus className="w-4 h-4"/> Nouvelle demande
              </button>
            </div>) : (<div className="divide-y divide-[#F4F6F8]">
              {myRequests.map(r => (<button key={r.id} onClick={() => navigate(`/employee/requests/${r.id}`)} className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-[#EBF2F9]/35">
                  <div>
                    <p className="text-sm font-medium text-[#172033]">{r.processName}</p>
                    <p className="text-xs text-[#8898AA] mt-0.5 font-mono">{r.reference} · {timeAgo(r.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={r.status} size="sm"/>
                    <ArrowRight className="w-3.5 h-3.5 text-[#D1D9E0]"/>
                  </div>
                </button>))}
            </div>)}
        </div>

        {/* Right col */}
        <div className="space-y-4">
          {/* Notifications */}
          {myNotifs.length > 0 && (<div className="panel overflow-hidden rounded-2xl">
              <div className="px-5 py-4 border-b border-[#D1D9E0] flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#1F4E79]"/>
                <h3 className="font-semibold text-[#172033] text-sm">Notifications non lues</h3>
                <span className="ml-auto bg-[#DC2626] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{myNotifs.length}</span>
              </div>
              <div className="divide-y divide-[#F4F6F8]">
                {myNotifs.slice(0, 3).map(n => (<div key={n.id} className="px-5 py-3">
                    <p className="text-xs text-[#172033] leading-snug">{n.message}</p>
                    <p className="text-[10px] text-[#8898AA] mt-1">{timeAgo(n.createdAt)}</p>
                  </div>))}
              </div>
            </div>)}

          {/* Catalogue */}
          <div className="panel overflow-hidden rounded-2xl">
            <div className="px-5 py-4 border-b border-[#D1D9E0]">
              <h3 className="font-semibold text-[#172033] text-sm">Catalogue des processus</h3>
            </div>
            <div className="p-3 space-y-1">
              {published.map(p => (<button key={p.id} onClick={() => navigate(`/employee/new-request?process=${p.id}`)} className="group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-[#EBF2F9]">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EBF2F9] text-[#1F4E79] transition-transform group-hover:scale-105">
                    <ProcessIcon icon={p.icon} name={p.name}/>
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#172033] group-hover:text-[#1F4E79] transition-colors">{p.name}</p>
                    <p className="text-xs text-[#8898AA] truncate">{p.description}</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[#D1D9E0] group-hover:text-[#1F4E79] transition-colors flex-shrink-0"/>
                </button>))}
            </div>
          </div>
        </div>
      </div>
    </div>);
}
