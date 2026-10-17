import { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Edit2, UserCheck, Building2, X, Check, Loader2, AlertCircle, ShieldOff, ShieldCheck } from 'lucide-react';
import { userApi } from '../../../api/userApi';
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

export default function UserManagement() {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null); // { user, action: 'deactivate'|'activate' }
  const [toast, setToast] = useState('');

  // Form state
  const [fName, setFName] = useState('');
  const [fEmail, setFEmail] = useState('');
  const [fRole, setFRole] = useState('EMPLOYEE');
  const [fWorkspaces, setFWorkspaces] = useState([]);
  const [fTempPassword, setFTempPassword] = useState('');

  // Load data on mount
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      userApi.list(),
      workspaceApi.list(),
    ])
      .then(([usersData, wsData]) => {
        if (cancelled) return;
        setUsers(Array.isArray(usersData) ? usersData : []);
        setWorkspaces(Array.isArray(wsData) ? wsData : []);
      })
      .catch(() => {
        if (!cancelled) setError('Impossible de charger les données.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() =>
    users.filter(u =>
      (u.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (u.email ?? '').toLowerCase().includes(search.toLowerCase())
    ),
    [users, search]
  );

  const showToast = msg => setToast(msg);

  const reload = () =>
    userApi.list().then(data => setUsers(Array.isArray(data) ? data : []));

  const requestToggle = (user) => {
    setConfirmModal({ user, action: user.active ? 'deactivate' : 'activate' });
  };

  const confirmToggle = async () => {
    if (!confirmModal) return;
    const { user } = confirmModal;
    setConfirmModal(null);
    try {
      const updated = await userApi.setActive(user.id, !user.active);
      setUsers(prev => prev.map(u => u.id === user.id ? updated : u));
      showToast(updated.active ? `${updated.name} activé` : `${updated.name} désactivé`);
    } catch (err) {
      setError(err.message || 'Erreur lors du changement de statut.');
    }
  };

  const openCreate = () => {
    setFName('');
    setFEmail('');
    setFRole('EMPLOYEE');
    setFWorkspaces([]);
    setFTempPassword('');
    setError('');
    setModal({ mode: 'create' });
  };

  const openEdit = (u) => {
    setFName(u.name ?? '');
    setFEmail(u.email ?? '');
    setFRole(u.role ?? 'EMPLOYEE');
    setFWorkspaces(u.workspaceIds ? [...u.workspaceIds] : []);
    setFTempPassword('');
    setError('');
    setModal({ mode: 'edit', userId: u.id });
  };

  const handleSubmit = async () => {
    if (!fName.trim() || !fEmail.trim()) return;
    setSaving(true);
    setError('');

    const payload = {
      name: fName.trim(),
      email: fEmail.trim(),
      role: fRole,
      workspaceIds: fWorkspaces,
    };

    if (modal?.mode === 'create') {
      if (!fTempPassword.trim()) {
        setError('Le mot de passe temporaire est obligatoire.');
        setSaving(false);
        return;
      }
      payload.tempPassword = fTempPassword.trim();
    }

    try {
      if (modal?.mode === 'create') {
        const created = await userApi.create(payload);
        setUsers(prev => [...prev, created]);
        showToast(`Utilisateur "${created.name}" créé`);
      } else if (modal?.mode === 'edit' && modal.userId) {
        const updated = await userApi.update(modal.userId, payload);
        setUsers(prev => prev.map(u => u.id === modal.userId ? updated : u));
        showToast('Utilisateur mis à jour');
      }
      setModal(null);
    } catch (err) {
      setError(err.message || 'Une erreur est survenue.');
    } finally {
      setSaving(false);
    }
  };

  const toggleWs = (wsId) => {
    setFWorkspaces(prev =>
      prev.includes(wsId) ? prev.filter(w => w !== wsId) : [...prev, wsId]
    );
  };

  const getWorkspaceNames = (wsIds) => {
    if (!wsIds || wsIds.length === 0) return '—';
    return workspaces
      .filter(w => wsIds.includes(w.id))
      .map(w => w.name)
      .join(', ') || '—';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-[#8898AA] gap-2 text-sm">
        <Loader2 className="w-5 h-5 animate-spin" />
        Chargement des utilisateurs...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#172033]">Gestion des utilisateurs</h1>
          <p className="text-sm text-[#8898AA] mt-0.5">{users.length} utilisateur{users.length !== 1 ? 's' : ''} enregistré{users.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-[#1F4E79] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#172033] transition-colors">
          <Plus className="w-4 h-4" /> Nouvel utilisateur
        </button>
      </div>

      {error && !modal && (
        <div className="flex items-center gap-2 bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] rounded-xl px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      <div className="bg-white border border-[#D1D9E0] rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-[#D1D9E0]">
          <div className="relative max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8898AA]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-[#D1D9E0] rounded-lg focus:outline-none focus:border-[#1F4E79] bg-[#F8FAFC]"
            />
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
            {filtered.map(u => (
              <tr key={u.id} className="hover:bg-[#F8FAFC] transition-colors">
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
                  {u.workspaceIds?.length > 0 ? (
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-[#8898AA]" />
                      {getWorkspaceNames(u.workspaceIds)}
                    </span>
                  ) : '—'}
                </td>
                <td className="px-5 py-3">
                  <button
                    onClick={() => requestToggle(u)}
                    title={u.active ? 'Cliquer pour désactiver' : 'Cliquer pour activer'}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer hover:shadow-sm active:scale-95 ${
                      u.active
                        ? 'bg-[#DCFCE7] text-[#16A34A] border-[#BBF7D0] hover:bg-[#FEE2E2] hover:text-[#DC2626] hover:border-[#FECACA]'
                        : 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA] hover:bg-[#DCFCE7] hover:text-[#16A34A] hover:border-[#BBF7D0]'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${u.active ? 'bg-[#16A34A]' : 'bg-[#DC2626]'}`} />
                    {u.active ? 'Actif' : 'Inactif'}
                  </button>
                </td>
                <td className="px-5 py-3 text-[#8898AA] text-xs">
                  {u.createdAt ? new Date(u.createdAt).toLocaleDateString('fr-FR') : '—'}
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(u)}
                      className="p-1.5 rounded-lg hover:bg-[#EBF2F9] text-[#8898AA] hover:text-[#1F4E79] transition-colors"
                      title="Modifier"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-[#8898AA] text-sm">
            <UserCheck className="w-8 h-8 mx-auto mb-2 opacity-40" />
            {search ? 'Aucun utilisateur trouvé pour cette recherche.' : 'Aucun utilisateur enregistré.'}
          </div>
        )}
      </div>

      {/* Create / Edit modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
            <div className="px-6 py-4 border-b border-[#D1D9E0] flex items-center justify-between">
              <h2 className="font-semibold text-[#172033]">
                {modal.mode === 'create' ? 'Nouvel utilisateur' : "Modifier l'utilisateur"}
              </h2>
              <button onClick={() => setModal(null)} className="text-[#8898AA] hover:text-[#172033]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {error && (
                <div className="flex items-center gap-2 bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] rounded-lg px-3 py-2.5 text-xs">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {error}
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-[#4A5568] uppercase tracking-wide mb-1.5">
                  Nom complet <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  autoFocus
                  value={fName}
                  onChange={e => setFName(e.target.value)}
                  placeholder="ex: Jean Dupont"
                  className="w-full px-3 py-2.5 border border-[#D1D9E0] rounded-lg text-sm focus:outline-none focus:border-[#1F4E79]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#4A5568] uppercase tracking-wide mb-1.5">
                  Adresse email <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  type="email"
                  value={fEmail}
                  onChange={e => setFEmail(e.target.value)}
                  placeholder="jean.dupont@acme.com"
                  className="w-full px-3 py-2.5 border border-[#D1D9E0] rounded-lg text-sm focus:outline-none focus:border-[#1F4E79]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#4A5568] uppercase tracking-wide mb-1.5">Rôle</label>
                <select
                  value={fRole}
                  onChange={e => setFRole(e.target.value)}
                  className="w-full px-3 py-2.5 border border-[#D1D9E0] rounded-lg text-sm focus:outline-none focus:border-[#1F4E79]"
                >
                  <option value="EMPLOYEE">Employé</option>
                  <option value="ADMIN">Administrateur</option>
                </select>
              </div>
              {modal.mode === 'create' && (
                <div>
                  <label className="block text-xs font-semibold text-[#4A5568] uppercase tracking-wide mb-1.5">
                    Mot de passe temporaire <span className="text-[#DC2626]">*</span>
                  </label>
                  <input
                    type="text"
                    value={fTempPassword}
                    onChange={e => setFTempPassword(e.target.value)}
                    placeholder="ex: Temp@2024!"
                    className="w-full px-3 py-2.5 border border-[#D1D9E0] rounded-lg text-sm font-mono focus:outline-none focus:border-[#1F4E79]"
                  />
                  <p className="text-[10px] text-[#8898AA] mt-1">L'utilisateur devra changer ce mot de passe à sa première connexion.</p>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-[#4A5568] uppercase tracking-wide mb-2">Espaces assignés</label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {workspaces.filter(w => w.active).length === 0 && (
                    <p className="text-xs text-[#8898AA] py-2">Aucun workspace actif disponible.</p>
                  )}
                  {workspaces.filter(w => w.active).map(ws => (
                    <label key={ws.id} className="flex items-center gap-2.5 text-sm text-[#172033] cursor-pointer hover:text-[#1F4E79] p-2 rounded-lg border border-[#D1D9E0] hover:border-[#1F4E79]/30 transition-colors">
                      <input
                        type="checkbox"
                        checked={fWorkspaces.includes(ws.id)}
                        onChange={() => toggleWs(ws.id)}
                        className="accent-[#1F4E79]"
                      />
                      <div className="w-5 h-5 rounded flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0" style={{ background: ws.color || '#1F4E79' }}>
                        {(ws.code ?? '').slice(0, 2)}
                      </div>
                      {ws.name}
                      <span className="text-xs text-[#8898AA] font-mono ml-auto">({ws.code})</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-[#D1D9E0] flex justify-end gap-3">
              <button
                onClick={() => setModal(null)}
                className="px-4 py-2 text-sm text-[#4A5568] border border-[#D1D9E0] rounded-lg hover:bg-[#F4F6F8]"
              >
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                disabled={!fName.trim() || !fEmail.trim() || saving}
                className="px-4 py-2 text-sm font-medium bg-[#1F4E79] text-white rounded-lg hover:bg-[#172033] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {modal.mode === 'create' ? "Créer l'utilisateur" : 'Sauvegarder'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm deactivate / activate modal */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm shadow-xl overflow-hidden">
            <div className={`px-6 pt-6 pb-4 flex flex-col items-center text-center`}>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
                confirmModal.action === 'deactivate'
                  ? 'bg-[#FEF2F2]'
                  : 'bg-[#DCFCE7]'
              }`}>
                {confirmModal.action === 'deactivate'
                  ? <ShieldOff className="w-6 h-6 text-[#DC2626]" />
                  : <ShieldCheck className="w-6 h-6 text-[#16A34A]" />
                }
              </div>
              <h3 className="text-base font-semibold text-[#172033] mb-1">
                {confirmModal.action === 'deactivate' ? 'Désactiver le compte ?' : 'Activer le compte ?'}
              </h3>
              <p className="text-sm text-[#8898AA] leading-relaxed">
                {confirmModal.action === 'deactivate'
                  ? <>Le compte de <strong className="text-[#172033]">{confirmModal.user.name}</strong> sera désactivé. Il ne pourra plus se connecter à la plateforme.</>
                  : <>Le compte de <strong className="text-[#172033]">{confirmModal.user.name}</strong> sera réactivé. Il pourra à nouveau se connecter.</>
                }
              </p>
            </div>
            <div className="px-6 pb-5 flex gap-3">
              <button
                onClick={() => setConfirmModal(null)}
                className="flex-1 px-4 py-2 text-sm text-[#4A5568] border border-[#D1D9E0] rounded-lg hover:bg-[#F4F6F8] transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={confirmToggle}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors ${
                  confirmModal.action === 'deactivate'
                    ? 'bg-[#DC2626] hover:bg-[#B91C1C]'
                    : 'bg-[#16A34A] hover:bg-[#15803D]'
                }`}
              >
                {confirmModal.action === 'deactivate' ? 'Désactiver' : 'Activer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast msg={toast} onClose={() => setToast('')} />}
    </div>
  );
}
