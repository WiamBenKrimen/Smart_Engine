import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, ListTodo, User, AlertTriangle, CheckCircle, Users,
    ArrowLeft, ThumbsUp, ThumbsDown, Clock, LogOut, UserCircle, FilePlus,
    ArrowRight, ScrollText, Loader2, CheckSquare, XCircle, FileText,
    Building2, Send, X, AlertCircle, ChevronDown, Inbox
} from 'lucide-react';
import { workspaceApi } from '../../../api/workspaceApi';
import { taskApi } from '../../../api/taskApi';
import { useAuth } from '../../../app/providers/AuthProvider';
import StatusBadge from '../../../components/StatusBadge';
import KPICard from '../../dashboards/components/StatCard';
import NotificationBell from '../../notifications/components/NotificationBell';
import SmartEngineLogo from '../../../components/SmartEngineLogo';
import ProcessIcon from '../../processes/components/ProcessIcon';
import { NOTIFICATIONS } from '../../../app/mockData';

// ── STATUT BADGES ─────────────────────────────────────────────────────────────
const STATUT_BADGES = {
    EN_ATTENTE: { label: 'En attente', color: 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]' },
    EN_COURS:   { label: 'En cours',   color: 'bg-[#EBF2F9] text-[#1F4E79] border-[#BFDBFE]' },
    APPROUVEE:  { label: 'Approuvée',  color: 'bg-[#DCFCE7] text-[#14532D] border-[#BBF7D0]' },
    REFUSEE:    { label: 'Refusée',    color: 'bg-[#FEE2E2] text-[#7F1D1D] border-[#FECACA]' },
    ANNULEE:    { label: 'Annulée',    color: 'bg-[#F4F6F8] text-[#4A5568] border-[#D1D9E0]' },
};

// ── TASK CARD (avec modal inline) ─────────────────────────────────────────────
function TaskCard({ task, onAction }) {
    const [expanded, setExpanded] = useState(false);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const badge = STATUT_BADGES[task.statut] || { label: task.statut, color: 'bg-gray-100 text-gray-600 border-gray-200' };
    const isPending = task.statut === 'EN_ATTENTE' || task.statut === 'EN_COURS';

    let parsedData = {};
    try { parsedData = JSON.parse(task.dataJson || '{}'); } catch { parsedData = {}; }

    const handle = async (isApprove) => {
        setLoading(true);
        try {
            if (isApprove) await taskApi.approve(task.id, comment);
            else await taskApi.reject(task.id, comment);
            setExpanded(false);
            onAction?.();
        } catch (err) {
            alert(err.message || 'Erreur lors du traitement');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`bg-white border rounded-xl overflow-hidden transition-all shadow-sm ${isPending ? 'border-[#1F4E79]/20' : 'border-[#D1D9E0]'}`}>
            <div className="px-5 py-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-[#EBF2F9] flex items-center justify-center flex-shrink-0">
                            <ProcessIcon icon={task.processusIcon} name={task.processusNom} />
                        </div>
                        <div className="min-w-0">
                            <p className="font-semibold text-[#172033] text-sm truncate">{task.processusNom || 'Demande'}</p>
                            <p className="text-xs text-[#8898AA] font-mono mt-0.5">{task.demandeReference || `DEM-${task.demandeId}`}</p>
                        </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${badge.color}`}>
                        {badge.label}
                    </span>
                </div>

                <div className="flex flex-wrap gap-3 text-xs text-[#8898AA] mt-2">
                    <span className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-[#1F4E79]" />
                        {task.demandeurPrenom} {task.demandeurNom}
                    </span>
                    <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {task.demandeDateCreation
                            ? new Date(task.demandeDateCreation).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
                            : '—'}
                    </span>
                    {task.noeudLibelle && (
                        <span className="flex items-center gap-1.5 text-[#1F4E79] font-medium">
                            <CheckSquare className="w-3.5 h-3.5" />
                            {task.noeudLibelle}
                        </span>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="px-5 py-3 border-t border-[#F4F6F8] flex items-center justify-between gap-2">
                <button
                    onClick={() => setExpanded(v => !v)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                        isPending
                            ? 'bg-[#1F4E79] text-white hover:bg-[#163a5c]'
                            : 'border border-[#D1D9E0] text-[#4A5568] hover:bg-[#F4F6F8]'
                    }`}
                >
                    {isPending ? <Send className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                    {isPending ? 'Traiter' : 'Voir'}
                    <ArrowRight className="w-3 h-3" />
                </button>
            </div>

            {/* Expanded panel */}
            {expanded && (
                <div className="border-t border-[#D1D9E0] bg-[#F8FAFC] p-5 space-y-4">
                    {/* Form data */}
                    <div>
                        <p className="text-[10px] uppercase tracking-wider text-[#8898AA] font-bold mb-2 flex items-center gap-2">
                            <FileText className="w-3.5 h-3.5" /> Données de la demande
                        </p>
                        {Object.keys(parsedData).length === 0 ? (
                            <p className="text-xs text-[#8898AA] italic">Aucune donnée de formulaire.</p>
                        ) : (
                            <div className="grid grid-cols-2 gap-2">
                                {Object.entries(parsedData).map(([k, v]) => (
                                    <div key={k} className="bg-white rounded-lg p-2.5 border border-[#E2E8F0]">
                                        <span className="block text-[10px] uppercase font-semibold text-[#8898AA] mb-0.5">{k.replace(/_/g, ' ')}</span>
                                        <span className="text-xs font-semibold text-[#172033]">
                                            {typeof v === 'boolean' ? (v ? 'Oui' : 'Non') : (v == null || v === '') ? '—' : String(v)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Demandeur */}
                    <div className="bg-white border border-[#E2E8F0] rounded-lg p-3 text-xs space-y-1">
                        <p className="text-[10px] uppercase font-bold text-[#8898AA] mb-2">Demandeur</p>
                        <p className="text-[#172033]"><span className="text-[#8898AA]">Nom :</span> {task.demandeurPrenom} {task.demandeurNom}</p>
                        <p className="text-[#172033]"><span className="text-[#8898AA]">Email :</span> {task.demandeurEmail || '—'}</p>
                    </div>

                    {/* Decision */}
                    {isPending ? (
                        <div className="space-y-3">
                            <textarea
                                rows={2}
                                placeholder="Commentaire ou motif (optionnel)..."
                                value={comment}
                                onChange={e => setComment(e.target.value)}
                                className="w-full text-xs p-3 border border-[#D1D9E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F4E79]/20 bg-white resize-none"
                            />
                            <div className="flex gap-2">
                                <button
                                    disabled={loading}
                                    onClick={() => handle(false)}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] hover:bg-[#FEE2E2] transition-colors disabled:opacity-50"
                                >
                                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                                    Refuser
                                </button>
                                <button
                                    disabled={loading}
                                    onClick={() => handle(true)}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold bg-[#16A34A] text-white hover:bg-[#15803D] transition-colors disabled:opacity-50"
                                >
                                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                                    Approuver
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className={`p-3 rounded-lg border text-xs font-medium flex items-center gap-2 ${
                            task.statut === 'APPROUVEE'
                                ? 'bg-[#DCFCE7] border-[#BBF7D0] text-[#14532D]'
                                : 'bg-[#FEE2E2] border-[#FECACA] text-[#7F1D1D]'
                        }`}>
                            {task.statut === 'APPROUVEE' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                            Tâche {task.statut === 'APPROUVEE' ? 'approuvée' : 'refusée'}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function WorkspacePage() {
    const { id } = useParams();
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();

    const [tab, setTab] = useState('overview');
    const [notifs, setNotifs] = useState(NOTIFICATIONS.filter(n => n.userId === currentUser?.id));
    const [workspace, setWorkspace] = useState(null);
    const [loadingWorkspace, setLoadingWorkspace] = useState(true);
    const [members, setMembers] = useState([]);
    const [employeeMenuOpen, setEmployeeMenuOpen] = useState(false);

    // Tasks state
    const [tasks, setTasks] = useState([]);
    const [loadingTasks, setLoadingTasks] = useState(true);
    const [taskError, setTaskError] = useState('');

    // Load workspace
    useEffect(() => {
        let cancelled = false;
        setLoadingWorkspace(true);
        workspaceApi.getById(id)
            .then(ws => { if (!cancelled) setWorkspace(ws); })
            .catch(() => { if (!cancelled) setWorkspace(null); })
            .finally(() => { if (!cancelled) setLoadingWorkspace(false); });
        return () => { cancelled = true; };
    }, [id]);

    // Load workspace members
    useEffect(() => {
        if (!workspace?.id) return;
        workspaceApi.listUsers()
            .then(users => {
                const wsMembers = (users || []).filter(u =>
                    (workspace.memberIds || []).some(mid => String(mid) === String(u.id))
                );
                setMembers(wsMembers);
            })
            .catch(() => setMembers([]));
    }, [workspace]);

    // Load tasks for workspace
    const loadTasks = useCallback(() => {
        if (!id) return;
        setLoadingTasks(true);
        setTaskError('');
        // Get numeric workspace id from URL param (e.g. "1" or "ws1")
        const numId = id.replace(/^ws/, '');
        taskApi.listByWorkspace(numId)
            .then(res => {
                setTasks(Array.isArray(res) ? res : []);
            })
            .catch(err => {
                setTaskError(err.message || 'Impossible de charger les tâches.');
                setTasks([]);
            })
            .finally(() => setLoadingTasks(false));
    }, [id]);

    useEffect(() => {
        loadTasks();
    }, [loadTasks]);

    if (loadingWorkspace) {
        return (
            <div className="min-h-screen flex items-center justify-center text-center text-sm text-[#8898AA]">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-6 h-6 animate-spin text-[#1F4E79]" />
                    Chargement de l'espace...
                </div>
            </div>
        );
    }

    if (!workspace) {
        return (
            <div className="min-h-screen flex items-center justify-center text-center">
                <div>
                    <p className="text-[#8898AA] mb-2">Workspace introuvable</p>
                    <button onClick={() => navigate('/employee')} className="text-[#1F4E79] hover:underline text-sm">Retour</button>
                </div>
            </div>
        );
    }

    if (!workspace.active) {
        return (
            <div className="min-h-screen flex items-center justify-center text-center">
                <div className="max-w-sm">
                    <p className="text-[#172033] font-semibold mb-2">Workspace désactivé</p>
                    <p className="text-[#8898AA] text-sm mb-4">Cet espace n'est plus accessible pour le traitement.</p>
                    <button onClick={() => navigate('/employee')} className="text-[#1F4E79] hover:underline text-sm">Retour</button>
                </div>
            </div>
        );
    }

    const pendingTasks = tasks.filter(t => t.statut === 'EN_ATTENTE' || t.statut === 'EN_COURS');
    const doneTasks = tasks.filter(t => t.statut === 'APPROUVEE' || t.statut === 'REFUSEE');

    const TABS = [
        { id: 'overview',     label: 'Vue d\'ensemble', icon: <LayoutDashboard className="w-4 h-4" /> },
        { id: 'tasks',        label: 'Tâches à traiter', count: pendingTasks.length, icon: <ListTodo className="w-4 h-4" /> },
        { id: 'history',      label: 'Traitées', count: doneTasks.length, icon: <CheckCircle className="w-4 h-4" /> },
        { id: 'members',      label: 'Membres', count: members.length, icon: <Users className="w-4 h-4" /> },
    ];

    const WS_COLORS = {
        ws1: { bg: '#EBF2F9', text: '#1F4E79' },
        ws2: { bg: '#EDE9FE', text: '#7C3AED' },
        ws3: { bg: '#FFEDD5', text: '#EA580C' },
        ws4: { bg: '#E0F2FE', text: '#0EA5E9' },
    };
    const wsColor = WS_COLORS[id ?? ''] ?? WS_COLORS.ws1;

    return (
        <div className="app-canvas flex h-screen overflow-hidden">
            {/* Sidebar */}
            <aside className="sidebar-grid sticky top-0 flex h-screen w-64 flex-shrink-0 flex-col">
                <div className="px-5 py-5 border-b border-white/10">
                    <div className="flex items-center gap-2.5">
                        <SmartEngineLogo inverse />
                        <div>
                            <span className="font-bold text-white text-sm tracking-tight">Smart Engine</span>
                            <span className="block text-[10px] text-white/40 font-medium uppercase tracking-wider">{workspace.name}</span>
                        </div>
                    </div>
                </div>
                <nav className="flex-1 px-3 py-4 overflow-y-auto">
                    <p className="px-2 mb-2 text-[10px] font-semibold uppercase tracking-wider text-white/30">Espace {workspace.name}</p>
                    {TABS.map(t => (
                        <button key={t.id} onClick={() => setTab(t.id)}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium mb-0.5 transition-colors ${
                                tab === t.id ? 'bg-white/20 text-white ring-1 ring-white/25' : 'text-white/70 hover:text-white hover:bg-white/10'
                            }`}>
                            <span className="flex items-center gap-2.5">{t.icon}{t.label}</span>
                            {t.count !== undefined && t.count > 0 && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${tab === t.id ? 'bg-white/20 text-white' : 'bg-white/10 text-white/50'}`}>
                                    {t.count}
                                </span>
                            )}
                        </button>
                    ))}
                    <div className="mt-4 border-t border-white/10 pt-4">
                        <p className="px-2 mb-2 text-[10px] font-semibold uppercase tracking-wider text-white/30">Navigation</p>
                        
                        {/* Bouton Espace Employé dépliable sans changer de page */}
                        <button
                            type="button"
                            onClick={() => setEmployeeMenuOpen(prev => !prev)}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                employeeMenuOpen
                                    ? 'bg-white/20 text-white shadow-inner ring-1 ring-white/25'
                                    : 'text-white/75 hover:bg-white/10 hover:text-white'
                            }`}
                        >
                            <span className="flex items-center gap-2.5">
                                <Building2 className="w-4 h-4 flex-shrink-0" />
                                <span>Espace Employé</span>
                            </span>
                            <ChevronDown
                                className={`w-4 h-4 transition-transform duration-200 ${
                                    employeeMenuOpen ? 'rotate-180 text-white' : 'text-white/50'
                                }`}
                            />
                        </button>

                        {/* Sous-menu affichant directement les fonctionnalités dans la même page */}
                        {employeeMenuOpen && (
                            <div className="mt-1.5 ml-2 pl-2.5 border-l border-white/15 space-y-1 py-1 animate-in fade-in slide-in-from-top-1">
                                <button
                                    type="button"
                                    onClick={() => navigate('/employee')}
                                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors text-left"
                                >
                                    <LayoutDashboard className="w-3.5 h-3.5 flex-shrink-0 text-white/60" />
                                    <span>Tableau de bord</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => navigate('/employee/new-request')}
                                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors text-left"
                                >
                                    <FilePlus className="w-3.5 h-3.5 flex-shrink-0 text-white/60" />
                                    <span>Nouvelle demande</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => navigate('/employee/requests')}
                                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors text-left"
                                >
                                    <Inbox className="w-3.5 h-3.5 flex-shrink-0 text-white/60" />
                                    <span>Mes demandes</span>
                                </button>
                            </div>
                        )}
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
                        <UserCircle className="w-4 h-4" /> Mon profil
                    </button>
                    <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/8 transition-colors">
                        <LogOut className="w-4 h-4" /> Déconnexion
                    </button>
                </div>
            </aside>

            {/* Main */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="h-14 bg-white border-b border-[#D1D9E0] px-6 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: wsColor.bg }}>
                            <span className="text-xs font-bold" style={{ color: wsColor.text }}>{workspace.code?.slice(0, 2)}</span>
                        </div>
                        <div>
                            <p className="font-semibold text-[#172033] text-sm">{workspace.name}</p>
                            <p className="text-xs text-[#8898AA]">{workspace.code}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <NotificationBell notifications={notifs} onMarkAllRead={() => setNotifs(prev => prev.map(n => ({ ...n, read: true })))} />
                        <div className="w-px h-5 bg-[#D1D9E0]" />
                        <div className="w-7 h-7 rounded-full bg-[#1F4E79] flex items-center justify-center text-white text-xs font-bold">
                            {currentUser?.avatar}
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-6">

                    {/* ── OVERVIEW ── */}
                    {tab === 'overview' && (
                        <div className="space-y-5">
                            <div>
                                <h1 className="text-xl font-bold text-[#172033]">{workspace.name}</h1>
                                <p className="text-sm text-[#8898AA] mt-0.5">{workspace.description || 'Espace de traitement et collaboration'}</p>
                            </div>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <KPICard label="À traiter" value={pendingTasks.length} icon={ListTodo} accent="navy" />
                                <KPICard label="Membres" value={members.length} icon={Users} accent="warning" />
                                <KPICard label="Traitées" value={doneTasks.length} icon={CheckCircle} accent="success" />
                                <KPICard label="Total" value={tasks.length} icon={CheckSquare} accent="navy" />
                            </div>

                            {/* Pending tasks summary */}
                            <div className="bg-white border border-[#D1D9E0] rounded-xl overflow-hidden">
                                <div className="px-5 py-4 border-b border-[#D1D9E0] flex items-center justify-between">
                                    <h2 className="font-semibold text-[#172033] text-sm">Tâches en attente — {workspace.name}</h2>
                                    <button onClick={() => setTab('tasks')} className="text-xs text-[#1F4E79] hover:underline flex items-center gap-1">
                                        Voir tout <ArrowRight className="w-3 h-3" />
                                    </button>
                                </div>
                                <div className="divide-y divide-[#F4F6F8]">
                                    {loadingTasks && (
                                        <div className="py-8 flex items-center justify-center gap-2 text-sm text-[#8898AA]">
                                            <Loader2 className="w-4 h-4 animate-spin" /> Chargement...
                                        </div>
                                    )}
                                    {!loadingTasks && pendingTasks.length === 0 && (
                                        <p className="py-8 text-center text-sm text-[#8898AA]">Aucune tâche active dans cet espace</p>
                                    )}
                                    {!loadingTasks && pendingTasks.slice(0, 5).map(t => (
                                        <div key={t.id} className="px-5 py-3 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-[#EBF2F9] flex items-center justify-center flex-shrink-0">
                                                    <ProcessIcon icon={t.processusIcon} name={t.processusNom} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-[#172033]">{t.processusNom || 'Demande'}</p>
                                                    <p className="text-xs text-[#8898AA] font-mono">{t.demandeReference} · {t.demandeurPrenom} {t.demandeurNom}</p>
                                                </div>
                                            </div>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${(STATUT_BADGES[t.statut] || STATUT_BADGES.EN_ATTENTE).color}`}>
                                                {(STATUT_BADGES[t.statut] || STATUT_BADGES.EN_ATTENTE).label}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── TASKS TAB ── */}
                    {tab === 'tasks' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-xl font-bold text-[#172033]">Tâches à traiter</h1>
                                    <p className="text-sm text-[#8898AA] mt-0.5">Demandes en attente d'approbation pour l'espace {workspace.name}</p>
                                </div>
                                <button onClick={loadTasks} className="flex items-center gap-2 text-xs text-[#1F4E79] hover:underline">
                                    ↻ Actualiser
                                </button>
                            </div>

                            {loadingTasks ? (
                                <div className="bg-white rounded-xl border border-[#D1D9E0] p-12 text-center text-sm text-[#8898AA]">
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#1F4E79]" />
                                    Chargement des tâches...
                                </div>
                            ) : taskError ? (
                                <div className="bg-white rounded-xl border border-[#D1D9E0] p-8 text-center text-sm text-[#DC2626]">
                                    <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                                    <p>{taskError}</p>
                                    <button onClick={loadTasks} className="mt-3 px-4 py-1.5 text-xs bg-[#1F4E79] text-white rounded-lg">Réessayer</button>
                                </div>
                            ) : pendingTasks.length === 0 ? (
                                <div className="bg-white rounded-xl border border-[#D1D9E0] p-12 text-center">
                                    <CheckSquare className="w-10 h-10 mx-auto mb-3 text-[#D1D9E0]" />
                                    <p className="font-semibold text-[#172033]">Aucune tâche en attente</p>
                                    <p className="text-xs text-[#8898AA] mt-1">Toutes les tâches de cet espace sont traitées !</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {pendingTasks.map(t => (
                                        <TaskCard key={t.id} task={t} onAction={loadTasks} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── HISTORY ── */}
                    {tab === 'history' && (
                        <div className="space-y-4">
                            <h1 className="text-xl font-bold text-[#172033]">Tâches traitées</h1>
                            {loadingTasks ? (
                                <div className="text-center py-8 text-sm text-[#8898AA]">
                                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[#1F4E79]" /> Chargement...
                                </div>
                            ) : doneTasks.length === 0 ? (
                                <p className="text-sm text-[#8898AA]">Aucune tâche traitée</p>
                            ) : (
                                <div className="bg-white border border-[#D1D9E0] rounded-xl divide-y divide-[#F4F6F8]">
                                    {doneTasks.map(t => {
                                        const badge = STATUT_BADGES[t.statut] || STATUT_BADGES.ANNULEE;
                                        return (
                                            <div key={t.id} className="px-5 py-3 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-[#EBF2F9] flex items-center justify-center">
                                                        <ProcessIcon icon={t.processusIcon} name={t.processusNom} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-[#172033]">{t.processusNom || 'Demande'}</p>
                                                        <p className="text-xs text-[#8898AA] font-mono">{t.demandeReference} · {t.demandeurPrenom} {t.demandeurNom}</p>
                                                    </div>
                                                </div>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.color}`}>
                                                    {badge.label}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── MEMBERS ── */}
                    {tab === 'members' && (
                        <div className="space-y-4">
                            <h1 className="text-xl font-bold text-[#172033]">Membres de l'espace</h1>
                            {members.length === 0 ? (
                                <div className="bg-white border border-[#D1D9E0] rounded-xl p-12 text-center">
                                    <Users className="w-8 h-8 text-[#D1D9E0] mx-auto mb-3" />
                                    <p className="text-sm text-[#8898AA]">Aucun membre dans cet espace</p>
                                </div>
                            ) : (
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {members.map(u => (
                                        <div key={u.id} className="bg-white border border-[#D1D9E0] rounded-xl p-4 flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-[#EBF2F9] flex items-center justify-center text-sm font-bold text-[#1F4E79] flex-shrink-0">
                                                {u.avatar || (u.name || '?')[0]?.toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-[#172033] text-sm">{u.name}</p>
                                                <p className="text-xs text-[#8898AA] truncate">{u.email}</p>
                                            </div>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                                                u.active !== false
                                                    ? 'bg-[#DCFCE7] text-[#14532D] border-[#BBF7D0]'
                                                    : 'bg-[#FEE2E2] text-[#7F1D1D] border-[#FECACA]'
                                            }`}>
                                                {u.active !== false ? 'Actif' : 'Inactif'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
