import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FilePlus, ArrowRight } from 'lucide-react';
import { useAuth } from '../../../app/providers/AuthProvider';
import { useRequests } from '../../../app/providers/RequestProvider';
import StatusBadge from '../../../components/StatusBadge';
import ProcessIcon from '../../processes/components/ProcessIcon';
export default function RequestsList() {
    const { currentUser } = useAuth();
    const { getMyRequests } = useRequests();
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const myRequests = getMyRequests(currentUser?.id ?? '');
    const filtered = myRequests.filter(r => (r.reference.toLowerCase().includes(search.toLowerCase()) ||
        r.processName.toLowerCase().includes(search.toLowerCase())) &&
        (!statusFilter || r.status === statusFilter));
    return (<div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#172033]">Mes demandes</h1>
          <p className="text-sm text-[#8898AA] mt-0.5">{myRequests.length} demandes au total</p>
        </div>
        <button onClick={() => navigate('/employee/new-request')} className="flex items-center gap-2 bg-[#1F4E79] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#172033] transition-colors">
          <FilePlus className="w-4 h-4"/> Nouvelle demande
        </button>
      </div>

      <div className="bg-white border border-[#D1D9E0] rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-[#D1D9E0] flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8898AA]"/>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher…" className="w-full pl-9 pr-4 py-2 text-sm border border-[#D1D9E0] rounded-lg focus:outline-none focus:border-[#1F4E79] bg-[#F8FAFC]"/>
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="text-sm border border-[#D1D9E0] rounded-lg px-3 py-2 focus:outline-none focus:border-[#1F4E79] bg-[#F8FAFC]">
            <option value="">Tous les statuts</option>
            {['EN_ATTENTE', 'EN_COURS', 'TERMINE', 'REJETE', 'EN_RETARD'].map(s => (<option key={s} value={s}>{s.replace('_', ' ')}</option>))}
          </select>
        </div>

        <div className="divide-y divide-[#F4F6F8]">
          {filtered.length === 0 && (<div className="py-12 text-center text-[#8898AA] text-sm">
              <FilePlus className="w-8 h-8 mx-auto mb-2 opacity-30"/>
              Aucune demande trouvée
            </div>)}
          {filtered.map(r => {
            const currentStep = r.steps.find(s => s.id === r.currentStepId) ?? r.steps[r.steps.length - 1];
            return (<button key={r.id} onClick={() => navigate(`/employee/requests/${r.id}`)} className="w-full px-5 py-4 flex items-center justify-between hover:bg-[#F8FAFC] transition-colors text-left group">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#EBF2F9] text-[#1F4E79]">
                    <ProcessIcon name={r.processName}/>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-[#172033] text-sm">{r.processName}</p>
                      <span className="text-xs font-mono text-[#8898AA]">{r.reference}</span>
                    </div>
                    <p className="text-xs text-[#8898AA] mt-0.5">
                      {new Date(r.createdAt).toLocaleDateString('fr-FR')}
                      {currentStep && r.status !== 'TERMINE' && r.status !== 'REJETE' && (<> · Étape : {currentStep.nodeLabel}</>)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={r.status}/>
                  <ArrowRight className="w-4 h-4 text-[#D1D9E0] group-hover:text-[#1F4E79] transition-colors"/>
                </div>
              </button>);
        })}
        </div>
      </div>
    </div>);
}
