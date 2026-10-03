import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronDown, User, Building2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../app/providers/AuthProvider';
export default function ContextSwitcher() {
    const { currentUser, getUserWorkspaces } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    useEffect(() => {
        const close = (e) => {
            if (ref.current && !ref.current.contains(e.target))
                setOpen(false);
        };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, []);
    const workspaces = getUserWorkspaces();
    const isAdmin = currentUser?.role === 'ADMIN';
    const contexts = [
        {
            id: 'employee',
            label: 'Mon espace Employé',
            sublabel: 'Mes demandes & suivi',
            path: '/employee',
            color: '#16A34A',
            icon: <User className="w-3.5 h-3.5"/>,
        },
        ...workspaces.map(ws => ({
            id: ws.id,
            label: ws.name,
            sublabel: 'Espace de validation',
            path: `/workspaces/${ws.id}`,
            color: ws.color,
            icon: <Building2 className="w-3.5 h-3.5"/>,
        })),
        ...(isAdmin ? [{
                id: 'admin',
                label: 'Administration',
                sublabel: 'Configuration & gestion',
                path: '/admin',
                color: '#1F4E79',
                icon: <ShieldCheck className="w-3.5 h-3.5"/>,
            }] : []),
    ];
    const path = location.pathname;
    const wsMatch = path.match(/^\/workspaces\/(\w+)/);
    const currentId = path.startsWith('/admin') ? 'admin' : wsMatch ? wsMatch[1] : 'employee';
    const current = contexts.find(c => c.id === currentId) ?? contexts[0];
    if (contexts.length <= 1)
        return null;
    return (<div className="relative" ref={ref}>
      <button onClick={() => setOpen(p => !p)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#D1D9E0] bg-white hover:bg-[#F8FAFC] transition-colors max-w-[200px]">
        <span className="w-5 h-5 rounded-md flex items-center justify-center text-white flex-shrink-0" style={{ backgroundColor: current.color }}>
          {current.icon}
        </span>
        <span className="text-sm font-semibold text-[#172033] truncate">{current.label}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-[#8898AA] flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}/>
      </button>

      {open && (<div className="absolute right-0 top-full mt-2 w-64 bg-white border border-[#D1D9E0] rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-[#F4F6F8]">
            <p className="text-[10px] font-bold text-[#8898AA] uppercase tracking-widest">Changer d'espace</p>
          </div>
          <div className="py-1">
            {contexts.map(ctx => {
                const active = ctx.id === currentId;
                return (<button key={ctx.id} onClick={() => { navigate(ctx.path); setOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${active ? 'bg-[#F4F6F8]' : 'hover:bg-[#F8FAFC]'}`}>
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center text-white flex-shrink-0 shadow-sm" style={{ backgroundColor: ctx.color }}>
                    {ctx.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${active ? 'text-[#172033]' : 'text-[#4A5568]'}`}>{ctx.label}</p>
                    <p className="text-[11px] text-[#8898AA] truncate">{ctx.sublabel}</p>
                  </div>
                  {active && <span className="w-2 h-2 rounded-full bg-[#16A34A] flex-shrink-0"/>}
                </button>);
            })}
          </div>
        </div>)}
    </div>);
}
