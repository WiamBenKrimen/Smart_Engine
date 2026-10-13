import { useEffect, useMemo, useState } from 'react';
import { Plus, Users, Building2, Power, Edit2, X, Check, Search, Loader2, AlertCircle } from 'lucide-react';
import { workspaceApi } from '../../../api/workspaceApi';
import StatusBadge from '../../../components/StatusBadge';

function Toast({ msg, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 2500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 right-6 flex items-center gap-2 bg-[#16A34A] text-white px-4 py-3 rounded-xl shadow-lg text-sm font-medium z-50">
      <Check className="w-4 h-4" /> {msg}
    </div>
  );
}

const WS_PALETTE = ['#1F4E79', '#7C3AED', '#EA580C', '#0EA5E9', '#16A34A', '#DC2626'];

function colorForWorkspace(workspace) {
  const source = workspace.code || workspace.name || '';
  const total = source.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return WS_PALETTE[total % WS_PALETTE.length];
}

function workspacePayload({ name, code, description, active = true }) {
  return {
    name: name.trim(),
    code: code.trim().toUpperCase(),
    description: description.trim(),
    active,
  };
}

export default function WorkspaceManagement() {
  const [workspaces, setWorkspaces] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editWs, setEditWs] = useState(null);
  const [toast, setToast] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [fName, setFName] = useState('');
  const [fCode, setFCode] = useState('');
  const [fDesc, setFDesc] = useState('');

  const selectedWs = workspaces.find(w => w.id === selected);
  const wsMembers = useMemo(() => {
    if (!selectedWs) return [];
    return allUsers.filter(u => selectedWs.memberIds?.includes(u.id));
  }, [allUsers, selectedWs]);

  const availableUsers = allUsers.filter(u => (
    u.active &&
    !wsMembers.find(m => m.id === u.id) &&
    (memberSearch === '' || u.name.toLowerCase().includes(memberSearch.toLowerCase()) || u.email.toLowerCase().includes(memberSearch.toLowerCase()))
  ));

  const loadWorkspaceData = async () => {
    setLoading(true);
    setError('');
    try {
      const [workspaceRows, userRows] = await Promise.all([
        workspaceApi.list(),
        workspaceApi.listUsers(),
      ]);
      setWorkspaces(workspaceRows);
      setAllUsers(userRows);
      setSelected(current => (current && workspaceRows.some(w => w.id === current) ? current : null));
    } catch (err) {
      setError(err.message || 'Impossible de charger les workspaces.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspaceData();
  }, []);

  const replaceWorkspace = updated => {
    setWorkspaces(prev => prev.map(w => (w.id === updated.id ? updated : w)));
  };

  const toggleActive = async (workspace) => {
    const nextActive = !workspace.active;
    setError('');
    try {
      const updated = await workspaceApi.setActive(workspace.id, nextActive);
      replaceWorkspace(updated);
      setToast(nextActive ? `${updated.name} active` : `${updated.name} desactive`);
    } catch (err) {
      setError(err.message || 'Impossible de modifier le statut du workspace.');
    }
  };

  const openCreate = () => {
    setFName('');
    setFCode('');
    setFDesc('');
    setEditWs(null);
    setShowModal(true);
  };

  const openEdit = (ws) => {
    setFName(ws.name);
    setFCode(ws.code);
    setFDesc(ws.description || '');
    setEditWs(ws);
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!fName.trim() || !fCode.trim() || saving) return;
    setSaving(true);
    setError('');

    try {
      const payload = workspacePayload({
        name: fName,
        code: fCode,
        description: fDesc,
        active: editWs ? editWs.active : true,
      });

      if (editWs) {
        const updated = await workspaceApi.update(editWs.id, payload);
        replaceWorkspace(updated);
        setToast(`Workspace "${updated.name}" mis a jour`);
      } else {
        const created = await workspaceApi.create(payload);
        setWorkspaces(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
        setSelected(created.id);
        setToast(`Workspace "${created.name}" cree`);
      }

      setShowModal(false);
    } catch (err) {
      setError(err.message || 'Impossible de sauvegarder le workspace.');
    } finally {
      setSaving(false);
    }
  };

  const addMember = async (userId) => {
    if (!selected) return;
    setError('');
    try {
      const updated = await workspaceApi.addMember(selected, userId);
      replaceWorkspace(updated);
      setMemberSearch('');
    } catch (err) {
      setError(err.message || 'Impossible d ajouter ce membre.');
    }
  };

  const removeMember = async (userId) => {
    if (!selected) return;
    setError('');
    try {
      const updated = await workspaceApi.removeMember(selected, userId);
      replaceWorkspace(updated);
    } catch (err) {
      setError(err.message || 'Impossible de retirer ce membre.');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#172033]">Gestion des Workspaces</h1>
          <p className="text-sm text-[#8898AA] mt-0.5">Espaces de validation et de traitement</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-[#1F4E79] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#172033] transition-colors">
          <Plus className="w-4 h-4" /> Creer un Workspace
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-[#FCA5A5] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-[#8898AA] py-8">
          <Loader2 className="w-4 h-4 animate-spin" /> Chargement des workspaces depuis la base...
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            {workspaces.map(ws => {
              const color = colorForWorkspace(ws);
              const count = ws.memberCount ?? ws.memberIds?.length ?? 0;
              return (
                <div key={ws.id} onClick={() => setSelected(ws.id === selected ? null : ws.id)} className={`bg-white border rounded-xl p-5 cursor-pointer transition-all ${selected === ws.id ? 'border-[#1F4E79] ring-2 ring-[#1F4E79]/20' : 'border-[#D1D9E0] hover:border-[#B0BEC9] hover:shadow-sm'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
                        <Building2 className="w-5 h-5" style={{ color }} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-[#172033] text-sm">{ws.name}</h3>
                          <span className="text-[10px] font-mono bg-[#F4F6F8] border border-[#D1D9E0] text-[#8898AA] px-1.5 py-0.5 rounded">{ws.code}</span>
                        </div>
                        <p className="text-xs text-[#8898AA] mt-0.5">{ws.description || 'Aucune description'}</p>
                        <p className="text-xs text-[#8898AA] mt-1 flex items-center gap-1"><Users className="w-3 h-3" />{count} membre{count !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={ws.active ? 'ACTIF' : 'INACTIF'} size="sm" />
                      <button onClick={e => { e.stopPropagation(); openEdit(ws); }} className="p-1.5 rounded-lg hover:bg-[#EBF2F9] text-[#8898AA] hover:text-[#1F4E79] transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={e => { e.stopPropagation(); toggleActive(ws); }} className={`p-1.5 rounded-lg transition-colors ${ws.active ? 'hover:bg-[#FEE2E2] text-[#8898AA] hover:text-[#DC2626]' : 'hover:bg-[#DCFCE7] text-[#8898AA] hover:text-[#16A34A]'}`}>
                        <Power className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            {workspaces.length === 0 && (
              <div className="bg-white border border-[#D1D9E0] rounded-xl p-8 text-sm text-[#8898AA] text-center">
                Aucun workspace en base.
              </div>
            )}
          </div>

          {selectedWs && (
            <div className="bg-white border border-[#D1D9E0] rounded-xl overflow-hidden flex flex-col">
              <div className="px-5 py-4 border-b border-[#D1D9E0]">
                <h3 className="font-semibold text-[#172033] text-sm">{selectedWs.name} - Membres</h3>
              </div>
              <div className="p-4 space-y-2 flex-1">
                {wsMembers.map(u => (
                  <div key={u.id} className="flex items-center gap-2 py-1">
                    <div className="w-7 h-7 rounded-full bg-[#EBF2F9] flex items-center justify-center text-[10px] font-bold text-[#1F4E79]">{u.avatar}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#172033] truncate">{u.name}</p>
                      <p className="text-xs text-[#8898AA] truncate">{u.email}</p>
                    </div>
                    <button onClick={() => removeMember(u.id)} className="p-1 rounded hover:bg-[#FEE2E2] text-[#8898AA] hover:text-[#DC2626] transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {wsMembers.length === 0 && <p className="text-sm text-[#8898AA] text-center py-3">Aucun membre</p>}
              </div>
              <div className="px-4 pb-4 border-t border-[#F4F6F8] pt-3 space-y-2">
                <p className="text-xs font-semibold text-[#4A5568] uppercase tracking-wide">Ajouter un membre</p>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8898AA]" />
                  <input value={memberSearch} onChange={e => setMemberSearch(e.target.value)} placeholder="Rechercher..." className="w-full pl-8 pr-3 py-2 border border-[#D1D9E0] rounded-lg text-xs focus:outline-none focus:border-[#1F4E79]" />
                </div>
                {memberSearch && availableUsers.slice(0, 5).map(u => (
                  <button key={u.id} onClick={() => addMember(u.id)} className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-[#EBF2F9] rounded-lg text-left transition-colors">
                    <div className="w-6 h-6 rounded-full bg-[#EBF2F9] flex items-center justify-center text-[9px] font-bold text-[#1F4E79]">{u.avatar}</div>
                    <span className="text-xs text-[#172033]">{u.name}</span>
                    <Plus className="w-3 h-3 text-[#1F4E79] ml-auto" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
            <div className="px-6 py-4 border-b border-[#D1D9E0] flex items-center justify-between">
              <h2 className="font-semibold text-[#172033]">{editWs ? 'Modifier le Workspace' : 'Creer un Workspace'}</h2>
              <button onClick={() => setShowModal(false)} className="text-[#8898AA] hover:text-[#172033]"><X className="w-4 h-4" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#4A5568] uppercase tracking-wide mb-1.5">Nom <span className="text-[#DC2626]">*</span></label>
                <input autoFocus value={fName} onChange={e => setFName(e.target.value)} placeholder="ex: Finance" className="w-full px-3 py-2.5 border border-[#D1D9E0] rounded-lg text-sm focus:outline-none focus:border-[#1F4E79]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#4A5568] uppercase tracking-wide mb-1.5">Code <span className="text-[#DC2626]">*</span></label>
                <input value={fCode} onChange={e => setFCode(e.target.value.toUpperCase())} placeholder="ex: FINANCE" className="w-full px-3 py-2.5 border border-[#D1D9E0] rounded-lg text-sm font-mono focus:outline-none focus:border-[#1F4E79]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#4A5568] uppercase tracking-wide mb-1.5">Description</label>
                <input value={fDesc} onChange={e => setFDesc(e.target.value)} placeholder="Description de l'espace" className="w-full px-3 py-2.5 border border-[#D1D9E0] rounded-lg text-sm focus:outline-none focus:border-[#1F4E79]" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-[#D1D9E0] flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-[#4A5568] border border-[#D1D9E0] rounded-lg hover:bg-[#F4F6F8]">Annuler</button>
              <button onClick={handleSubmit} disabled={!fName.trim() || !fCode.trim() || saving} className="px-4 py-2 text-sm font-medium bg-[#1F4E79] text-white rounded-lg hover:bg-[#172033] disabled:opacity-50 disabled:cursor-not-allowed">
                {saving ? 'Sauvegarde...' : editWs ? 'Sauvegarder' : 'Creer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast msg={toast} onClose={() => setToast('')} />}
    </div>
  );
}
