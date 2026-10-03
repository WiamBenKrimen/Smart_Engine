import { useState } from 'react';
import { Plus, Search, Edit2, Power, UserCheck, Building2, X, Check } from 'lucide-react';
import { USERS, WORKSPACES } from '../../../app/mockData';
import StatusBadge from '../../../components/StatusBadge';
function Toast({ msg, onClose }) {
    useState(() => { setTimeout(onClose, 2500); });
    return (<div className="fixed bottom-6 right-6 flex items-center gap-2 bg-[#16A34A] text-white px-4 py-3 rounded-xl shadow-lg text-sm font-medium z-50">
      <Check className="w-4 h-4"/> {msg}
    </div>);
}
export default function UserManagement() {
    const [search, setSearch] = useState('');
    const [users, setUsers] = useState(USERS.map(u => ({ ...u })));
    const [modal, setModal] = useState(null);
    const [toast, setToast] = useState('');
    // Form state
    const [fName, setFName] = useState('');
    const [fEmail, setFEmail] = useState('');
    const [fRole, setFRole] = useState('EMPLOYEE');
    const [fWorkspaces, setFWorkspaces] = useState([]);
    const [fHasEmployee, setFHasEmployee] = useState(true);
    const [fTempPassword, setFTempPassword] = useState('');
    const filtered = users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()));
    const toggleActive = (id) => {
        setUsers(prev => prev.map(u => u.id === id ? { ...u, active: !u.active } : u));
        setToast(users.find(u => u.id === id)?.active ? 'Utilisateur désactivé' : 'Utilisateur activé');
    };
    const openCreate = () => {
        setFName('');
        setFEmail('');
        setFRole('EMPLOYEE');
        setFWorkspaces([]);
        setFHasEmployee(true);
        setFTempPassword('');
        setModal({ mode: 'create' });
    };
    const openEdit = (u) => {
        setFName(u.name);
        setFEmail(u.email);
        setFRole(u.role);
        setFWorkspaces([...u.workspaceIds]);
        setFHasEmployee(true);
        setFTempPassword('');
        setModal({ mode: 'edit', userId: u.id });
    };
    const handleSubmit = () => {
        if (!fName.trim() || !fEmail.trim())
            return;
        if (modal?.mode === 'create') {
            const newUser = {
                id: `u_${Date.now()}`, name: fName.trim(), email: fEmail.trim(),
                role: fRole, workspaceIds: fWorkspaces, active: true,
                avatar: fName.trim().split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
                createdAt: new Date().toISOString().slice(0, 10),
            };
            setUsers(prev => [...prev, newUser]);
            setToast(`Utilisateur "${newUser.name}" créé`);
        }
        else if (modal?.mode === 'edit' && modal.userId) {
            setUsers(prev => prev.map(u => u.id === modal.userId ? { ...u, name: fName.trim(), email: fEmail.trim(), role: fRole, workspaceIds: fWorkspaces } : u));
            setToast('Utilisateur mis à jour');
        }
        setModal(null);
    };
    const toggleWs = (id) => {
        setFWorkspaces(prev => prev.includes(id) ? prev.filter(w => w !== id) : [...prev, id]);
    };
    const getWorkspaceNames = (ids) => WORKSPACES.filter(w => ids.includes(w.id)).map(w => w.name).join(', ') || '—';
    return (<div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#172033]">Gestion des utilisateurs</h1>
          <p className="text-sm text-[#8898AA] mt-0.5">{users.length} utilisateurs enregistrés</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-[#1F4E79] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#172033] transition-colors">
          <Plus className="w-4 h-4"/> Nouvel utilisateur
        </button>
      </div>

      <div className="bg-white border border-[#D1D9E0] rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-[#D1D9E0]">
          <div className="relative max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8898AA]"/>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." className="w-full pl-9 pr-4 py-2 text-sm border border-[#D1D9E0] rounded-lg focus:outline-none focus:border-[#1F4E79] bg-[#F8FAFC]"/>
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#D1D9E0] text-xs text-[#8898AA] uppercase tracking-wide bg-[#F8FAFC]">
              <th className="px-5 py-3 text-left font-medium">Utilisateur</th>
              <th className="px-5 py-3 text-left font-medium">Rôle</th>
              <th className="px-5 py-3 text-left font-medium">Workspaces</th>
              <th className="px-5 py-3 text-left font-medium">Statut</th>
              <th className="px-5 py-3 text-left font-medium">Depuis le</th>
              <th className="px-5 py-3 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F4F6F8]">
            {filtered.map(u => (<tr key={u.id} className="hover:bg-[#F8FAFC] transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#EBF2F9] flex items-center justify-center text-xs font-bold text-[#1F4E79] flex-shrink-0">
                      {u.avatar}
                    </div>
                    <div>
                      <p className="font-medium text-[#172033]">{u.name}</p>
                      <p className="text-xs text-[#8898AA]">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${u.role === 'ADMIN' ? 'bg-[#EBF2F9] text-[#1F4E79]' : 'bg-[#F1F5F9] text-[#4A5568]'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-5 py-3 text-xs text-[#4A5568]">
                  {u.workspaceIds.length > 0 ? (<span className="flex items-center gap-1"><Building2 className="w-3 h-3 text-[#8898AA]"/>{getWorkspaceNames(u.workspaceIds)}</span>) : '—'}
                </td>
                <td className="px-5 py-3"><StatusBadge status={u.active ? 'ACTIF' : 'INACTIF'} size="sm"/></td>
                <td className="px-5 py-3 text-[#8898AA] text-xs">{new Date(u.createdAt).toLocaleDateString('fr-FR')}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg hover:bg-[#EBF2F9] text-[#8898AA] hover:text-[#1F4E79] transition-colors" title="Modifier">
                      <Edit2 className="w-3.5 h-3.5"/>
                    </button>
                    <button onClick={() => toggleActive(u.id)} className={`p-1.5 rounded-lg transition-colors ${u.active ? 'hover:bg-[#FEE2E2] text-[#8898AA] hover:text-[#DC2626]' : 'hover:bg-[#DCFCE7] text-[#8898AA] hover:text-[#16A34A]'}`} title={u.active ? 'Désactiver' : 'Activer'}>
                      <Power className="w-3.5 h-3.5"/>
                    </button>
                  </div>
                </td>
              </tr>))}
          </tbody>
        </table>
        {filtered.length === 0 && (<div className="py-12 text-center text-[#8898AA] text-sm">
            <UserCheck className="w-8 h-8 mx-auto mb-2 opacity-40"/>Aucun utilisateur trouvé
          </div>)}
      </div>

      {/* Create / Edit modal */}
      {modal && (<div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
            <div className="px-6 py-4 border-b border-[#D1D9E0] flex items-center justify-between">
              <h2 className="font-semibold text-[#172033]">{modal.mode === 'create' ? 'Nouvel utilisateur' : 'Modifier l\'utilisateur'}</h2>
              <button onClick={() => setModal(null)} className="text-[#8898AA] hover:text-[#172033]"><X className="w-4 h-4"/></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#4A5568] uppercase tracking-wide mb-1.5">Nom complet <span className="text-[#DC2626]">*</span></label>
                <input value={fName} onChange={e => setFName(e.target.value)} autoFocus placeholder="ex: Jean Dupont" className="w-full px-3 py-2.5 border border-[#D1D9E0] rounded-lg text-sm focus:outline-none focus:border-[#1F4E79]"/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#4A5568] uppercase tracking-wide mb-1.5">Adresse email <span className="text-[#DC2626]">*</span></label>
                <input type="email" value={fEmail} onChange={e => setFEmail(e.target.value)} placeholder="jean.dupont@acme.com" className="w-full px-3 py-2.5 border border-[#D1D9E0] rounded-lg text-sm focus:outline-none focus:border-[#1F4E79]"/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#4A5568] uppercase tracking-wide mb-1.5">Rôle</label>
                <select value={fRole} onChange={e => setFRole(e.target.value)} className="w-full px-3 py-2.5 border border-[#D1D9E0] rounded-lg text-sm focus:outline-none focus:border-[#1F4E79]">
                  <option value="EMPLOYEE">Employé</option>
                  <option value="ADMIN">Administrateur</option>
                </select>
              </div>
              {modal?.mode === 'create' && (<div>
                  <label className="block text-xs font-semibold text-[#4A5568] uppercase tracking-wide mb-1.5">
                    Mot de passe temporaire <span className="text-[#DC2626]">*</span>
                  </label>
                  <input type="text" value={fTempPassword} onChange={e => setFTempPassword(e.target.value)} placeholder="ex: Temp@2024!" className="w-full px-3 py-2.5 border border-[#D1D9E0] rounded-lg text-sm font-mono focus:outline-none focus:border-[#1F4E79]"/>
                  <p className="text-[10px] text-[#8898AA] mt-1">L'utilisateur devra changer ce mot de passe à sa première connexion.</p>
                </div>)}
              <div>
                <label className="block text-xs font-semibold text-[#4A5568] uppercase tracking-wide mb-2">Espaces assignés</label>
                <div className="space-y-2">
                  {/* Special employee space */}
                  <label className="flex items-center gap-2.5 text-sm text-[#172033] cursor-pointer hover:text-[#1F4E79] p-2 rounded-lg border border-[#D1D9E0] bg-[#F4F6F8]">
                    <input type="checkbox" checked={fHasEmployee} onChange={() => setFHasEmployee(v => !v)} className="accent-[#1F4E79]"/>
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 bg-[#1F4E79] rounded flex items-center justify-center text-white text-[9px] font-bold">EE</span>
                      <span>Espace Employé</span>
                    </div>
                    <span className="text-xs text-[#8898AA] font-mono ml-auto">(EMPLOYEE)</span>
                  </label>
                  {/* Actual workspaces */}
                  {WORKSPACES.filter(w => w.active).map(ws => (<label key={ws.id} className="flex items-center gap-2.5 text-sm text-[#172033] cursor-pointer hover:text-[#1F4E79] p-2 rounded-lg border border-[#D1D9E0]">
                      <input type="checkbox" checked={fWorkspaces.includes(ws.id)} onChange={() => toggleWs(ws.id)} className="accent-[#1F4E79]"/>
                      <div className="w-5 h-5 rounded flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0" style={{ background: WORKSPACES.find(w => w.id === ws.id)?.color || '#1F4E79' }}>
                        {ws.code.slice(0, 2)}
                      </div>
                      {ws.name} <span className="text-xs text-[#8898AA] font-mono ml-auto">({ws.code})</span>
                    </label>))}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-[#D1D9E0] flex justify-end gap-3">
              <button onClick={() => setModal(null)} className="px-4 py-2 text-sm text-[#4A5568] border border-[#D1D9E0] rounded-lg hover:bg-[#F4F6F8]">Annuler</button>
              <button onClick={handleSubmit} disabled={!fName.trim() || !fEmail.trim()} className="px-4 py-2 text-sm font-medium bg-[#1F4E79] text-white rounded-lg hover:bg-[#172033] disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                {modal.mode === 'create' ? 'Créer l\'utilisateur' : 'Sauvegarder'}
              </button>
            </div>
          </div>
        </div>)}

      {toast && <Toast msg={toast} onClose={() => setToast('')}/>}
    </div>);
}
