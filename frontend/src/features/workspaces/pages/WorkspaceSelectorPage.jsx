import { useNavigate } from 'react-router-dom';
import { Building2, Users, ArrowRight, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../../app/providers/AuthProvider';
import SmartEngineLogo from '../../../components/SmartEngineLogo';
export default function WorkspaceSelector() {
    const { currentUser, getUserWorkspaces, setActiveWorkspace } = useAuth();
    const navigate = useNavigate();
    const workspaces = getUserWorkspaces();
    const WS_COLORS = {
        ws1: 'bg-[#EBF2F9] text-[#1F4E79]',
        ws2: 'bg-[#EDE9FE] text-[#7C3AED]',
        ws3: 'bg-[#FFEDD5] text-[#EA580C]',
        ws4: 'bg-[#E0F2FE] text-[#0EA5E9]',
    };
    return (<div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center p-8">
      <div className="w-full max-w-lg">
        <div className="flex items-center gap-2 mb-8">
          <SmartEngineLogo className="h-10 w-10"/>
          <span className="font-bold text-[#172033] text-base">Smart Engine</span>
        </div>

        <h1 className="text-2xl font-bold text-[#172033] mb-1">Bonjour, {currentUser?.name?.split(' ')[0]}</h1>
        <p className="text-[#4A5568] text-sm mb-8">Sélectionnez le contexte dans lequel vous souhaitez travailler.</p>

        <div className="space-y-3 mb-6">
          <button onClick={() => navigate('/employee')} className="w-full flex items-center gap-4 bg-white border border-[#D1D9E0] hover:border-[#1F4E79]/40 hover:shadow-sm rounded-xl p-4 transition-all text-left group">
            <div className="w-10 h-10 rounded-lg bg-[#EBF2F9] flex items-center justify-center flex-shrink-0">
              <LayoutDashboard className="w-5 h-5 text-[#1F4E79]"/>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-[#172033] text-sm">Espace Employé</p>
              <p className="text-xs text-[#8898AA] mt-0.5">Soumettre des demandes, suivre mes dossiers</p>
            </div>
            <ArrowRight className="w-4 h-4 text-[#D1D9E0] group-hover:text-[#1F4E79] transition-colors"/>
          </button>

          {workspaces.map(ws => (<button key={ws.id} onClick={() => {
                setActiveWorkspace(ws);
                navigate(`/workspaces/${ws.id}`);
            }} className="w-full flex items-center gap-4 bg-white border border-[#D1D9E0] hover:border-[#1F4E79]/40 hover:shadow-sm rounded-xl p-4 transition-all text-left group">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${WS_COLORS[ws.id] ?? 'bg-[#EBF2F9] text-[#1F4E79]'}`}>
                <Building2 className="w-5 h-5"/>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-[#172033] text-sm">{ws.name}</p>
                <p className="text-xs text-[#8898AA] mt-0.5">{ws.description}</p>
                <p className="text-xs text-[#8898AA] mt-0.5 flex items-center gap-1">
                  <Users className="w-3 h-3"/> {ws.memberIds.length} membres
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-[#D1D9E0] group-hover:text-[#1F4E79] transition-colors"/>
            </button>))}
        </div>

        <p className="text-xs text-center text-[#8898AA]">
          Vous pouvez changer de contexte à tout moment depuis le menu latéral.
        </p>
      </div>
    </div>);
}
