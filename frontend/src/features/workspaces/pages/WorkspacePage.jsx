import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ListTodo, User, AlertTriangle, CheckCircle, Users, ArrowLeft, ThumbsUp, ThumbsDown, Clock, LogOut, UserCircle, FilePlus, ArrowRight, ScrollText } from 'lucide-react';
import { WORKSPACES, USERS, NOTIFICATIONS } from '../../../app/mockData';
import { useAuth } from '../../../app/providers/AuthProvider';
import { useRequests } from '../../../app/providers/RequestProvider';
import StatusBadge from '../../../components/StatusBadge';
import KPICard from '../../dashboards/components/StatCard';
import NotificationBell from '../../notifications/components/NotificationBell';
import SmartEngineLogo from '../../../components/SmartEngineLogo';
import ProcessIcon from '../../processes/components/ProcessIcon';
function TaskCard({ task, onClaim, onApprove, onReject, mine }) {
    const [comment, setComment] = useState('');
    const isLate = task.status === 'LATE';
    const deadline = new Date(task.slaDeadline);
    const isOverdue = deadline < new Date();
    return (<div className={`bg-white border rounded-xl overflow-hidden transition-all ${isLate ? 'border-[#DC2626]/40 bg-[#FEF2F2]/30' : 'border-[#D1D9E0] hover:border-[#B0BEC9] hover:shadow-sm'}`}>
      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-semibold text-[#172033] text-sm">{task.processName}</p>
              {isLate && (<span className="flex items-center gap-1 text-[10px] font-semibold bg-[#FEE2E2] text-[#DC2626] px-1.5 py-0.5 rounded-full">
                  <AlertTriangle className="w-2.5 h-2.5"/> RETARD
                </span>)}
            </div>
            <p className="text-xs text-[#8898AA] font-mono">{task.requestRef}</p>
            <p className="text-xs text-[#4A5568] mt-1">Demandeur : {task.requesterName}</p>
          </div>
          <StatusBadge status={task.status} size="sm"/>
        </div>

        <div className="flex items-center gap-4 text-xs text-[#8898AA]">
          <span className={`flex items-center gap-1 ${isOverdue ? 'text-[#DC2626]' : ''}`}>
            <Clock className="w-3.5 h-3.5"/>
            SLA : {deadline.toLocaleString('fr-FR')}
          </span>
        </div>

        <div className="mt-3 bg-[#F8FAFC] rounded-lg p-3 space-y-1">
          {Object.entries(task.formData).slice(0, 3).map(([k, v]) => (<div key={k} className="flex items-center gap-2 text-xs">
              <span className="text-[#8898AA] capitalize min-w-0">{k} :</span>
              <span className="font-medium text-[#172033] truncate">{String(v)}</span>
            </div>))}
        </div>
      </div>

      <div className="px-5 py-3 border-t border-[#F4F6F8] flex items-center gap-2">
        {!mine && task.status === 'AVAILABLE' && onClaim && (<button onClick={onClaim} className="flex-1 flex items-center justify-center gap-2 bg-[#1F4E79] text-white py-2 rounded-lg text-xs font-medium hover:bg-[#172033] transition-colors">
            <User className="w-3.5 h-3.5"/> Prendre en charge
          </button>)}
        {mine && (<>
            <div className="flex-1">
              <input value={comment} onChange={e => setComment(e.target.value)} placeholder="Commentaire (optionnel)…" className="w-full px-3 py-1.5 border border-[#D1D9E0] rounded-lg text-xs focus:outline-none focus:border-[#1F4E79]"/>
            </div>
            <button onClick={() => onApprove?.(comment)} className="flex items-center gap-1.5 bg-[#16A34A] text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-[#15803D] transition-colors">
              <ThumbsUp className="w-3.5 h-3.5"/> Approuver
            </button>
            <button onClick={() => onReject?.(comment)} className="flex items-center gap-1.5 bg-[#DC2626] text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-[#B91C1C] transition-colors">
              <ThumbsDown className="w-3.5 h-3.5"/> Refuser
            </button>
          </>)}
      </div>
    </div>);
}
function RequestRow({ request, onClick }) {
    return (<button onClick={onClick} className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-[#F8FAFC] transition-colors text-left group">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#EBF2F9] text-[#1F4E79]">
          <ProcessIcon name={request.processName}/>
        </div>
        <div>
          <p className="text-sm font-medium text-[#172033]">{request.processName}</p>
          <p className="text-xs text-[#8898AA] font-mono mt-0.5">{request.reference} · {new Date(request.createdAt).toLocaleDateString('fr-FR')}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <StatusBadge status={request.status} size="sm"/>
        <ArrowRight className="w-4 h-4 text-[#D1D9E0] group-hover:text-[#1F4E79] transition-colors"/>
      </div>
    </button>);
}
export default function WorkspacePage() {
    const { id } = useParams();
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const { getWorkspaceTasks, tasks, approveTask, rejectTask, claimTask, getMyRequests } = useRequests();
    const [tab, setTab] = useState('overview');
    const [notifs, setNotifs] = useState(NOTIFICATIONS.filter(n => n.userId === currentUser?.id));
    const workspace = WORKSPACES.find(w => w.id === id);
    if (!workspace) {
        return (<div className="min-h-screen flex items-center justify-center text-center">
        <div>
          <p className="text-[#8898AA] mb-2">Workspace introuvable</p>
          <button onClick={() => navigate('/employee')} className="text-[#1F4E79] hover:underline text-sm">Retour</button>
        </div>
      </div>);
    }
    const wsTasks = getWorkspaceTasks(id ?? '');
    const allWsTasks = tasks.filter(t => t.workspaceId === id);
    const available = wsTasks.filter(t => t.status === 'AVAILABLE');
    const mine = wsTasks.filter(t => t.assignedTo === currentUser?.id || t.status === 'IN_PROGRESS');
    const late = wsTasks.filter(t => t.status === 'LATE');
    const done = allWsTasks.filter(t => t.status === 'DONE');
    const members = USERS.filter(u => workspace.memberIds.includes(u.id));
    const myRequests = getMyRequests(currentUser?.id ?? '');
    const TABS = [
        { id: 'overview', label: 'Vue d\'ensemble', icon: <LayoutDashboard className="w-4 h-4"/> },
        { id: 'available', label: 'À traiter', count: available.length, icon: <ListTodo className="w-4 h-4"/> },
        { id: 'mine', label: 'Mes tâches', count: mine.length, icon: <User className="w-4 h-4"/> },
        { id: 'late', label: 'En retard', count: late.length, icon: <AlertTriangle className="w-4 h-4"/> },
        { id: 'history', label: 'Terminées', count: done.length, icon: <CheckCircle className="w-4 h-4"/> },
        { id: 'my-requests', label: 'Mes demandes', count: myRequests.length, icon: <ScrollText className="w-4 h-4"/> },
        { id: 'members', label: 'Membres', count: members.length, icon: <Users className="w-4 h-4"/> },
    ];
    const WS_COLORS = {
        ws1: { bg: '#EBF2F9', text: '#1F4E79' },
        ws2: { bg: '#EDE9FE', text: '#7C3AED' },
        ws3: { bg: '#FFEDD5', text: '#EA580C' },
        ws4: { bg: '#E0F2FE', text: '#0EA5E9' },
    };
    const wsColor = WS_COLORS[id ?? ''] ?? WS_COLORS.ws1;
    return (<div className="app-canvas flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="sidebar-grid sticky top-0 flex h-screen w-64 flex-shrink-0 flex-col">
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <SmartEngineLogo inverse/>
            <div>
              <span className="font-bold text-white text-sm tracking-tight">Smart Engine</span>
              <span className="block text-[10px] text-white/40 font-medium uppercase tracking-wider">{workspace.name}</span>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <p className="px-2 mb-2 text-[10px] font-semibold uppercase tracking-wider text-white/30">Espace {workspace.name}</p>
          {TABS.map(t => (<button key={t.id} onClick={() => setTab(t.id)} className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium mb-0.5 transition-colors ${tab === t.id ? 'bg-white/20 text-white ring-1 ring-white/25' : 'text-white/70 hover:text-white hover:bg-white/10'}`}>
              <span className="flex items-center gap-2.5">{t.icon}{t.label}</span>
              {t.count !== undefined && t.count > 0 && (<span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${tab === t.id ? 'bg-white/20 text-white' : 'bg-white/10 text-white/50'}`}>
                  {t.count}
                </span>)}
            </button>))}
          <div className="mt-4 border-t border-white/10 pt-4">
            <p className="px-2 mb-2 text-[10px] font-semibold uppercase tracking-wider text-white/30">Navigation</p>
            <button onClick={() => navigate('/employee')} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/8 transition-colors">
              <ArrowLeft className="w-4 h-4"/> Espace Employé
            </button>
          </div>
        </nav>
        <div className="px-3 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 text-xs font-bold text-white ring-1 ring-white/20">
              {currentUser?.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{currentUser?.name}</p>
              <p className="text-[10px] text-white/40 truncate">{workspace.name}</p>
            </div>
          </div>
          <button onClick={() => navigate('/employee/profile')} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/8 transition-colors mb-0.5">
            <UserCircle className="w-4 h-4"/> Mon profil
          </button>
          <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/8 transition-colors">
            <LogOut className="w-4 h-4"/> Déconnexion
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-white border-b border-[#D1D9E0] px-6 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: wsColor.bg }}>
              <span className="text-xs font-bold" style={{ color: wsColor.text }}>{workspace.code.slice(0, 2)}</span>
            </div>
            <div>
              <p className="font-semibold text-[#172033] text-sm">{workspace.name}</p>
              <p className="text-xs text-[#8898AA]">{workspace.code}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell notifications={notifs} onMarkAllRead={() => setNotifs(prev => prev.map(n => ({ ...n, read: true })))}/>
            <div className="w-px h-5 bg-[#D1D9E0]"/>
            <div className="w-7 h-7 rounded-full bg-[#1F4E79] flex items-center justify-center text-white text-xs font-bold">
              {currentUser?.avatar}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">

          {/* Overview */}
          {tab === 'overview' && (<div className="space-y-5">
              <div>
                <h1 className="text-xl font-bold text-[#172033]">{workspace.name}</h1>
                <p className="text-sm text-[#8898AA] mt-0.5">{workspace.description}</p>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard label="À traiter" value={available.length} icon={ListTodo} accent="navy"/>
                <KPICard label="Mes tâches" value={mine.length} icon={User} accent="warning"/>
                <KPICard label="En retard" value={late.length} icon={AlertTriangle} accent="danger"/>
                <KPICard label="Terminées" value={done.length} icon={CheckCircle} accent="success"/>
              </div>

              {/* Pending approvals summary */}
              <div className="bg-white border border-[#D1D9E0] rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-[#D1D9E0] flex items-center justify-between">
                  <h2 className="font-semibold text-[#172033] text-sm">Approbations en attente — {workspace.name}</h2>
                  <button onClick={() => setTab('available')} className="text-xs text-[#1F4E79] hover:underline flex items-center gap-1">
                    Voir tout <ArrowRight className="w-3 h-3"/>
                  </button>
                </div>
                <div className="divide-y divide-[#F4F6F8]">
                  {wsTasks.length === 0 && (<p className="py-8 text-center text-sm text-[#8898AA]">Aucune tâche active</p>)}
                  {wsTasks.slice(0, 5).map(t => (<div key={t.id} className="px-5 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-[#172033]">{t.processName}</p>
                        <p className="text-xs text-[#8898AA] font-mono">{t.requestRef} · {t.requesterName}</p>
                      </div>
                      <StatusBadge status={t.status} size="sm"/>
                    </div>))}
                </div>
              </div>

              {/* My recent requests */}
              {myRequests.length > 0 && (<div className="bg-white border border-[#D1D9E0] rounded-xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-[#D1D9E0] flex items-center justify-between">
                    <h2 className="font-semibold text-[#172033] text-sm">Mes dernières demandes</h2>
                    <button onClick={() => setTab('my-requests')} className="text-xs text-[#1F4E79] hover:underline flex items-center gap-1">
                      Voir tout <ArrowRight className="w-3 h-3"/>
                    </button>
                  </div>
                  <div className="divide-y divide-[#F4F6F8]">
                    {myRequests.slice(0, 3).map(r => (<RequestRow key={r.id} request={r} onClick={() => navigate(`/employee/requests/${r.id}`)}/>))}
                  </div>
                </div>)}
            </div>)}

          {/* Available tasks */}
          {tab === 'available' && (<div className="space-y-4">
              <h1 className="text-xl font-bold text-[#172033]">À traiter</h1>
              <p className="text-sm text-[#8898AA] -mt-2">Approbations en attente pour l'espace {workspace.name}</p>
              {available.length === 0 && <p className="text-sm text-[#8898AA]">Aucune tâche disponible</p>}
              <div className="space-y-3">
                {available.map(t => (<TaskCard key={t.id} task={t} onClaim={() => claimTask(t.id)}/>))}
              </div>
            </div>)}

          {/* My tasks */}
          {tab === 'mine' && (<div className="space-y-4">
              <h1 className="text-xl font-bold text-[#172033]">Mes tâches</h1>
              {mine.length === 0 && <p className="text-sm text-[#8898AA]">Vous n'avez pas de tâches assignées</p>}
              <div className="space-y-3">
                {mine.map(t => (<TaskCard key={t.id} task={t} mine onApprove={(comment) => approveTask(t.id, comment || undefined)} onReject={(comment) => rejectTask(t.id, comment || undefined)}/>))}
              </div>
            </div>)}

          {/* Late tasks */}
          {tab === 'late' && (<div className="space-y-4">
              <h1 className="text-xl font-bold text-[#172033]">Tâches en retard</h1>
              {late.length === 0 ? (<div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl p-6 text-center">
                  <CheckCircle className="w-8 h-8 text-[#16A34A] mx-auto mb-2"/>
                  <p className="text-sm font-medium text-[#16A34A]">Aucun dépassement de SLA !</p>
                </div>) : (<div className="space-y-3">
                  {late.map(t => (<TaskCard key={t.id} task={t} mine onApprove={(comment) => approveTask(t.id, comment || undefined)} onReject={(comment) => rejectTask(t.id, comment || undefined)}/>))}
                </div>)}
            </div>)}

          {/* History */}
          {tab === 'history' && (<div className="space-y-4">
              <h1 className="text-xl font-bold text-[#172033]">Tâches terminées</h1>
              {done.length === 0 && <p className="text-sm text-[#8898AA]">Aucune tâche terminée</p>}
              <div className="bg-white border border-[#D1D9E0] rounded-xl divide-y divide-[#F4F6F8]">
                {done.map(t => (<div key={t.id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[#172033]">{t.processName}</p>
                      <p className="text-xs text-[#8898AA]">{t.requestRef} · {t.requesterName}</p>
                    </div>
                    <StatusBadge status="DONE" size="sm"/>
                  </div>))}
              </div>
            </div>)}

          {/* My requests (as an employee) */}
          {tab === 'my-requests' && (<div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-[#172033]">Mes demandes</h1>
                  <p className="text-sm text-[#8898AA] mt-0.5">Demandes que vous avez soumises en tant qu'employé</p>
                </div>
                <button onClick={() => navigate('/employee/new-request')} className="flex items-center gap-2 bg-[#1F4E79] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#172033] transition-colors">
                  <FilePlus className="w-4 h-4"/> Nouvelle demande
                </button>
              </div>

              {myRequests.length === 0 ? (<div className="bg-white border border-[#D1D9E0] rounded-xl p-12 text-center">
                  <FilePlus className="w-8 h-8 text-[#D1D9E0] mx-auto mb-3"/>
                  <p className="text-sm text-[#8898AA] mb-4">Vous n'avez pas encore soumis de demande</p>
                  <button onClick={() => navigate('/employee/new-request')} className="flex items-center gap-2 bg-[#1F4E79] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#172033] transition-colors mx-auto">
                    <FilePlus className="w-4 h-4"/> Soumettre une demande
                  </button>
                </div>) : (<div className="bg-white border border-[#D1D9E0] rounded-xl overflow-hidden divide-y divide-[#F4F6F8]">
                  {myRequests.map(r => (<RequestRow key={r.id} request={r} onClick={() => navigate(`/employee/requests/${r.id}`)}/>))}
                </div>)}
            </div>)}

          {/* Members */}
          {tab === 'members' && (<div className="space-y-4">
              <h1 className="text-xl font-bold text-[#172033]">Membres de l'espace</h1>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {members.map(u => (<div key={u.id} className="bg-white border border-[#D1D9E0] rounded-xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#EBF2F9] flex items-center justify-center text-sm font-bold text-[#1F4E79] flex-shrink-0">
                      {u.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#172033] text-sm">{u.name}</p>
                      <p className="text-xs text-[#8898AA] truncate">{u.email}</p>
                    </div>
                    <StatusBadge status={u.active ? 'ACTIF' : 'INACTIF'} size="sm"/>
                  </div>))}
              </div>
            </div>)}
        </main>
      </div>
    </div>);
}
