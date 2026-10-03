import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Building2, GitBranch, FileText, ScrollText, LogOut, User, UserCircle } from 'lucide-react';
import { useAuth } from '../../app/providers/AuthProvider';
import SmartEngineLogo from '../../components/SmartEngineLogo';
const NAV = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/admin/users', label: 'Utilisateurs', icon: Users },
    { to: '/admin/workspaces', label: 'Workspaces', icon: Building2 },
    { to: '/admin/workflow-designer', label: 'Workflow Designer', icon: GitBranch },
    { to: '/admin/processes', label: 'Processus', icon: FileText },
    { to: '/admin/audit', label: 'Audit', icon: ScrollText },
];
export default function AdminSidebar() {
    const { currentUser, logout } = useAuth();
    return (<aside className="sidebar-grid sticky top-0 flex h-screen w-64 flex-shrink-0 flex-col border-r border-white/5">
      <div className="px-5 py-5">
        <div className="flex items-center gap-2.5">
          <SmartEngineLogo inverse/>
          <div>
            <span className="text-sm font-bold tracking-tight text-white">Smart Engine</span>
            <span className="block text-[9px] font-semibold uppercase tracking-[0.18em] text-white/35">Process OS</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="mb-3 px-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-white/30">Administration</p>
        {NAV.map(({ to, label, icon: Icon, end }) => (<NavLink key={to} to={to} end={end} className={({ isActive }) => `relative mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${isActive
                ? 'bg-white/20 text-white shadow-inner ring-1 ring-white/25 before:absolute before:-left-3 before:h-5 before:w-1 before:rounded-r-full before:bg-white'
                : 'text-white/55 hover:bg-white/[0.06] hover:text-white'}`}>
            <Icon className="w-4 h-4 flex-shrink-0"/>
            {label}
          </NavLink>))}
      </nav>

      <div className="space-y-0.5 border-t border-white/8 px-3 py-3">
        <NavLink to="/employee" className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-[#16A34A]/20 text-[#4ade80]' : 'text-white/50 hover:text-white hover:bg-white/[0.08]'}`}>
          <User className="w-4 h-4 flex-shrink-0"/>
          Mon espace Employé
        </NavLink>
        <NavLink to="/admin/profile" className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-[#1F4E79] text-white' : 'text-white/50 hover:text-white hover:bg-white/[0.08]'}`}>
          <UserCircle className="w-4 h-4 flex-shrink-0"/>
          Mon profil
        </NavLink>
      </div>

      <div className="border-t border-white/8 px-3 py-4">
        <div className="mb-1 flex items-center gap-3 rounded-xl bg-white/[0.04] px-3 py-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 text-xs font-bold text-white ring-1 ring-white/20">
            {currentUser?.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">{currentUser?.name}</p>
            <p className="text-[10px] text-white/40 truncate">{currentUser?.email}</p>
          </div>
        </div>
        <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/[0.08] transition-colors">
          <LogOut className="w-4 h-4"/> Déconnexion
        </button>
      </div>
    </aside>);
}
