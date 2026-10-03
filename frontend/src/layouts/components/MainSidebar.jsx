import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FilePlus, Inbox, Building2, LogOut, UserCircle } from 'lucide-react';
import { useAuth } from '../../app/providers/AuthProvider';
import SmartEngineLogo from '../../components/SmartEngineLogo';
export default function EmployeeSidebar() {
    const { currentUser, logout, getUserWorkspaces, setActiveWorkspace } = useAuth();
    const workspaces = getUserWorkspaces();
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

      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <p className="mb-3 px-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-white/30">Mon espace</p>
        {[
            { to: '/employee', label: 'Tableau de bord', icon: LayoutDashboard, end: true },
            { to: '/employee/new-request', label: 'Nouvelle demande', icon: FilePlus },
            { to: '/employee/requests', label: 'Mes demandes', icon: Inbox },
        ].map(({ to, label, icon: Icon, end }) => (<NavLink key={to} to={to} end={end} className={({ isActive }) => `relative mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${isActive ? 'bg-white/20 text-white shadow-inner ring-1 ring-white/25 before:absolute before:-left-3 before:h-5 before:w-1 before:rounded-r-full before:bg-white' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
            <Icon className="w-4 h-4 flex-shrink-0"/>
            {label}
          </NavLink>))}

        {workspaces.length > 0 && (<>
            <p className="mb-3 mt-6 px-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-white/30">Workspaces</p>
            {workspaces.map(ws => (<NavLink key={ws.id} to={`/workspaces/${ws.id}`} className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium mb-0.5 transition-colors ${isActive ? 'bg-white/[0.12] text-white ring-1 ring-white/10' : 'text-white/55 hover:bg-white/[0.06] hover:text-white'}`} onClick={() => setActiveWorkspace(ws)}>
                <Building2 className="w-4 h-4 flex-shrink-0"/>
                {ws.name}
              </NavLink>))}
          </>)}
      </nav>

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
        <NavLink to="/employee/profile" className={({ isActive }) => `w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-[#1F4E79] text-white' : 'text-white/50 hover:text-white hover:bg-white/8'}`}>
          <UserCircle className="w-4 h-4"/> Mon profil
        </NavLink>
        <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/8 transition-colors">
          <LogOut className="w-4 h-4"/> Déconnexion
        </button>
      </div>
    </aside>);
}
