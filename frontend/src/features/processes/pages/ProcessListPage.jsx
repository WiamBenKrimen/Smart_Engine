import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Archive, Eye, GitBranch, FormInput, X, Check, AlertCircle } from 'lucide-react';
import { FORMS, WORKFLOWS } from '../../../app/mockData';
import { useProcesses } from '../../../app/providers/ProcessProvider';
import ProcessIcon from '../components/ProcessIcon';
function Toast({ msg, type, onClose }) {
    useState(() => { setTimeout(onClose, 2500); });
    return (<div className={`fixed bottom-6 right-6 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium z-50 ${type === 'error' ? 'bg-[#DC2626]' : 'bg-[#16A34A]'} text-white`}>
      <Check className="w-4 h-4"/> {msg}
    </div>);
}
const ICONS = ['🛒', '🏖️', '💳', '👥', '📋', '🏥', '🏢', '💼', '🎓', '🔧'];
export default function ProcessManagement() {
    const navigate = useNavigate();
    const { processes, addProcess, updateProcess } = useProcesses();
    const [showModal, setShowModal] = useState(false);
    const [detailId, setDetailId] = useState(null);
    const [toast, setToast] = useState(null);
    // Form state
    const [fName, setFName] = useState('');
    const [fDesc, setFDesc] = useState('');
    const [fFormId, setFFormId] = useState(FORMS[0]?.id ?? '');
    const [fWfId, setFWfId] = useState(WORKFLOWS.filter(w => w.status === 'PUBLISHED')[0]?.id ?? WORKFLOWS[0]?.id ?? '');
    const [fIcon, setFIcon] = useState(ICONS[0]);
    const publishedWfs = WORKFLOWS.filter(w => w.status === 'PUBLISHED');
    const publish = (id) => {
        updateProcess(id, { status: 'PUBLISHED' });
        setToast({ msg: 'Processus publié et disponible dans le catalogue' });
    };
    const archive = (id) => {
        updateProcess(id, { status: 'ARCHIVED' });
        setToast({ msg: 'Processus archivé' });
    };
    const handleCreate = () => {
        if (!fName.trim())
            return;
        const newProc = {
            id: `p_${Date.now()}`, name: fName.trim(), description: fDesc,
            formId: fFormId, workflowId: fWfId,
            status: 'DRAFT', icon: fIcon,
            createdAt: new Date().toISOString().slice(0, 10),
        };
        addProcess(newProc);
        setToast({ msg: `Processus "${newProc.name}" créé en brouillon` });
        setShowModal(false);
        setFName('');
        setFDesc('');
        setFFormId(FORMS[0]?.id ?? '');
        setFWfId(publishedWfs[0]?.id ?? '');
        setFIcon(ICONS[0]);
    };
    const detailProc = processes.find(p => p.id === detailId);
    const detailForm = FORMS.find(f => f.id === detailProc?.formId);
    const detailWf = WORKFLOWS.find(w => w.id === detailProc?.workflowId);
    const STATUS_COLORS = {
        DRAFT: 'bg-[#F1F5F9] text-[#4A5568]',
        PUBLISHED: 'bg-[#DCFCE7] text-[#16A34A]',
        ARCHIVED: 'bg-[#F1F5F9] text-[#94A3B8]',
    };
    return (<div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#172033]">Gestion des Processus</h1>
          <p className="text-sm text-[#8898AA] mt-0.5">Associez un formulaire et un workflow pour créer un processus</p>
        </div>
        <button onClick={() => navigate('/admin/process-creator')} className="flex items-center gap-2 bg-[#1F4E79] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#172033] transition-colors">
          <Plus className="w-4 h-4"/> Nouveau processus
        </button>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {processes.map(p => {
            const form = FORMS.find(f => f.id === p.formId);
            const wf = WORKFLOWS.find(w => w.id === p.workflowId);
            return (<div key={p.id} className="bg-white border border-[#D1D9E0] rounded-xl overflow-hidden hover:shadow-md transition-shadow">
              <div className="px-5 py-4 border-b border-[#F4F6F8]">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EBF2F9] text-[#1F4E79]">
                      <ProcessIcon icon={p.icon} name={p.name}/>
                    </span>
                    <div>
                      <h3 className="font-semibold text-[#172033] text-sm">{p.name}</h3>
                      <p className="text-xs text-[#8898AA] mt-0.5">{p.description}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_COLORS[p.status]}`}>
                    {p.status === 'DRAFT' ? 'Brouillon' : p.status === 'PUBLISHED' ? 'Publié' : 'Archivé'}
                  </span>
                </div>
              </div>
              <div className="px-5 py-3 space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-[#4A5568]">
                  <FormInput className="w-3.5 h-3.5 text-[#8898AA]"/>
                  <span className="font-medium">Formulaire :</span> <span>{form?.name ?? '—'}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#4A5568]">
                  <GitBranch className="w-3.5 h-3.5 text-[#8898AA]"/>
                  <span className="font-medium">Workflow :</span> <span>{wf?.name ?? '—'}</span>
                </div>
                <p className="text-xs text-[#8898AA]">Créé le {new Date(p.createdAt).toLocaleDateString('fr-FR')}</p>
              </div>
              <div className="px-5 py-3 border-t border-[#F4F6F8] flex items-center gap-2">
                {p.status === 'DRAFT' && (<button onClick={() => publish(p.id)} className="flex-1 flex items-center justify-center gap-1.5 bg-[#16A34A] text-white py-1.5 rounded-lg text-xs font-medium hover:bg-[#15803D] transition-colors">
                    <Globe className="w-3.5 h-3.5"/> Publier
                  </button>)}
                {p.status === 'PUBLISHED' && (<button onClick={() => archive(p.id)} className="flex-1 flex items-center justify-center gap-1.5 border border-[#D1D9E0] text-[#4A5568] py-1.5 rounded-lg text-xs font-medium hover:bg-[#F4F6F8] transition-colors">
                    <Archive className="w-3.5 h-3.5"/> Archiver
                  </button>)}
                {p.status === 'ARCHIVED' && (<span className="flex-1 text-center text-xs text-[#94A3B8]">Archivé</span>)}
                <button onClick={() => setDetailId(p.id)} className="p-1.5 border border-[#D1D9E0] rounded-lg text-[#8898AA] hover:text-[#1F4E79] hover:border-[#1F4E79]/30 transition-colors">
                  <Eye className="w-3.5 h-3.5"/>
                </button>
              </div>
            </div>);
        })}
      </div>

      {/* Create modal */}
      {showModal && (<div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
            <div className="px-6 py-4 border-b border-[#D1D9E0] flex items-center justify-between">
              <h2 className="font-semibold text-[#172033]">Créer un processus</h2>
              <button onClick={() => setShowModal(false)} className="text-[#8898AA] hover:text-[#172033]"><X className="w-4 h-4"/></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#4A5568] uppercase tracking-wide mb-1.5">Icône</label>
                <div className="flex flex-wrap gap-2">
                  {ICONS.map(ic => (<button key={ic} onClick={() => setFIcon(ic)} className={`flex h-10 w-10 items-center justify-center rounded-xl border-2 transition-all ${fIcon === ic ? 'border-[#1F4E79] bg-[#EBF2F9] text-[#1F4E79]' : 'border-[#D1D9E0] text-[#4A5568] hover:border-[#9FBFE2]'}`}>
                      <ProcessIcon icon={ic}/>
                    </button>))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#4A5568] uppercase tracking-wide mb-1.5">Nom <span className="text-[#DC2626]">*</span></label>
                <input autoFocus value={fName} onChange={e => setFName(e.target.value)} placeholder="ex: Demande d'achat" className="w-full px-3 py-2.5 border border-[#D1D9E0] rounded-lg text-sm focus:outline-none focus:border-[#1F4E79]"/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#4A5568] uppercase tracking-wide mb-1.5">Description</label>
                <textarea value={fDesc} onChange={e => setFDesc(e.target.value)} className="w-full px-3 py-2.5 border border-[#D1D9E0] rounded-lg text-sm focus:outline-none focus:border-[#1F4E79] h-16 resize-none" placeholder="Décrivez ce processus…"/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#4A5568] uppercase tracking-wide mb-1.5">Formulaire associé <span className="text-[#DC2626]">*</span></label>
                <select value={fFormId} onChange={e => setFFormId(e.target.value)} className="w-full px-3 py-2.5 border border-[#D1D9E0] rounded-lg text-sm focus:outline-none focus:border-[#1F4E79]">
                  {FORMS.map(f => <option key={f.id} value={f.id}>{f.name} ({f.fields.length} champs)</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#4A5568] uppercase tracking-wide mb-1.5">Workflow associé <span className="text-[#DC2626]">*</span></label>
                {publishedWfs.length === 0 ? (<div className="flex items-center gap-2 text-xs text-[#EA580C] bg-[#FFEDD5] border border-[#FED7AA] rounded-lg p-2.5">
                    <AlertCircle className="w-4 h-4 flex-shrink-0"/>
                    Aucun workflow publié. Publiez d'abord un workflow dans le Workflow Designer.
                  </div>) : (<select value={fWfId} onChange={e => setFWfId(e.target.value)} className="w-full px-3 py-2.5 border border-[#D1D9E0] rounded-lg text-sm focus:outline-none focus:border-[#1F4E79]">
                    {publishedWfs.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>)}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-[#D1D9E0] flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-[#4A5568] border border-[#D1D9E0] rounded-lg hover:bg-[#F4F6F8]">Annuler</button>
              <button onClick={handleCreate} disabled={!fName.trim() || publishedWfs.length === 0} className="px-4 py-2 text-sm font-medium bg-[#1F4E79] text-white rounded-lg hover:bg-[#172033] disabled:opacity-50 disabled:cursor-not-allowed">
                Créer en brouillon
              </button>
            </div>
          </div>
        </div>)}

      {/* Detail panel */}
      {detailProc && (<div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
            <div className="px-6 py-4 border-b border-[#D1D9E0] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EBF2F9] text-[#1F4E79]">
                  <ProcessIcon icon={detailProc.icon} name={detailProc.name}/>
                </span>
                <h2 className="font-semibold text-[#172033]">{detailProc.name}</h2>
              </div>
              <button onClick={() => setDetailId(null)} className="text-[#8898AA] hover:text-[#172033]"><X className="w-4 h-4"/></button>
            </div>
            <div className="px-6 py-5 space-y-3">
              <p className="text-sm text-[#4A5568]">{detailProc.description}</p>
              <div className="bg-[#F8FAFC] rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <FormInput className="w-4 h-4 text-[#1F4E79]"/>
                  <span className="font-medium text-[#172033]">Formulaire :</span>
                  <span className="text-[#4A5568]">{detailForm?.name ?? '—'}</span>
                </div>
                <div className="text-xs text-[#8898AA] pl-6">
                  {detailForm?.fields.map(f => f.label).join(' · ') ?? ''}
                </div>
                <div className="flex items-center gap-2 text-sm mt-2">
                  <GitBranch className="w-4 h-4 text-[#1F4E79]"/>
                  <span className="font-medium text-[#172033]">Workflow :</span>
                  <span className="text-[#4A5568]">{detailWf?.name ?? '—'}</span>
                </div>
                <div className="text-xs text-[#8898AA] pl-6">
                  {detailWf?.nodes.length ?? 0} nœuds · {detailWf?.edges.length ?? 0} connexions
                </div>
              </div>
              <p className="text-xs text-[#8898AA]">Créé le {new Date(detailProc.createdAt).toLocaleDateString('fr-FR')}</p>
            </div>
            <div className="px-6 py-4 border-t border-[#D1D9E0] flex justify-end">
              <button onClick={() => setDetailId(null)} className="px-4 py-2 text-sm text-[#4A5568] border border-[#D1D9E0] rounded-lg hover:bg-[#F4F6F8]">Fermer</button>
            </div>
          </div>
        </div>)}

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)}/>}
    </div>);
    function Globe({ className }) {
        return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>;
    }
}
