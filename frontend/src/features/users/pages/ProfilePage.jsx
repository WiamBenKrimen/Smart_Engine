import { useState } from 'react';
import { UserCircle, Lock, Link2, Check, Eye, EyeOff, AlertCircle, Camera } from 'lucide-react';
import { useAuth } from '../../../app/providers/AuthProvider';
function Toast({ msg, onClose }) {
    useState(() => { setTimeout(onClose, 2500); });
    return (<div className="fixed bottom-6 right-6 flex items-center gap-2 bg-[#16A34A] text-white px-4 py-3 rounded-xl shadow-lg text-sm font-medium z-50">
      <Check className="w-4 h-4"/> {msg}
    </div>);
}
export default function Profile() {
    const { currentUser } = useAuth();
    const [tab, setTab] = useState('info');
    const [toast, setToast] = useState('');
    // Info form state
    const [name, setName] = useState(currentUser?.name ?? '');
    const [email, setEmail] = useState(currentUser?.email ?? '');
    const [phone, setPhone] = useState('+212 6 00 00 00 00');
    const [jobTitle, setJobTitle] = useState('Responsable');
    const [department, setDepartment] = useState('Opérations');
    // Security form state
    const [currentPwd, setCurrentPwd] = useState('');
    const [newPwd, setNewPwd] = useState('');
    const [confirmPwd, setConfirmPwd] = useState('');
    const [showCur, setShowCur] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConf, setShowConf] = useState(false);
    const [pwdError, setPwdError] = useState('');
    // Account state
    const [accounts] = useState([
        { id: 'a1', type: 'email', label: 'Compte principal', value: currentUser?.email ?? '', verified: true },
    ]);
    const [newAccountEmail, setNewAccountEmail] = useState('');
    function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 2500); }
    function saveInfo() {
        showToast('Profil mis à jour');
    }
    function savePassword() {
        setPwdError('');
        if (!currentPwd) {
            setPwdError('Entrez votre mot de passe actuel');
            return;
        }
        if (newPwd.length < 6) {
            setPwdError('Le nouveau mot de passe doit contenir au moins 6 caractères');
            return;
        }
        if (newPwd !== confirmPwd) {
            setPwdError('Les mots de passe ne correspondent pas');
            return;
        }
        setCurrentPwd('');
        setNewPwd('');
        setConfirmPwd('');
        showToast('Mot de passe modifié');
    }
    function addAccount() {
        if (!newAccountEmail.trim())
            return;
        setNewAccountEmail('');
        showToast('Lien d\'invitation envoyé');
    }
    const initials = currentUser?.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() ?? '??';
    const role = currentUser?.role === 'ADMIN' ? 'Administrateur' : 'Employé';
    const TABS = [
        { id: 'info', label: 'Informations personnelles', icon: <UserCircle size={15}/> },
        { id: 'security', label: 'Sécurité', icon: <Lock size={15}/> },
        { id: 'account', label: 'Compte', icon: <Link2 size={15}/> },
    ];
    return (<div className="max-w-2xl mx-auto space-y-6">
      {/* Avatar card */}
      <div className="bg-white border border-[#D1D9E0] rounded-xl p-6">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="w-16 h-16 bg-[#1F4E79] rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-sm">
              {initials}
            </div>
            <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-white border border-[#D1D9E0] rounded-full flex items-center justify-center shadow-sm hover:bg-[#F4F6F8] transition-colors">
              <Camera size={11} className="text-[#4A5568]"/>
            </button>
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#172033]">{currentUser?.name}</h1>
            <p className="text-sm text-[#8898AA]">{currentUser?.email}</p>
            <span className="inline-block mt-1.5 px-2.5 py-0.5 bg-[#EBF2F9] text-[#1F4E79] text-[10px] font-bold uppercase tracking-wide rounded-full">{role}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border border-[#D1D9E0] rounded-xl overflow-hidden">
        <div className="flex border-b border-[#D1D9E0]">
          {TABS.map(t => (<button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-2 px-5 py-3 text-xs font-medium border-b-2 transition-colors ${tab === t.id ? 'border-[#1F4E79] text-[#1F4E79] bg-[#EBF2F9]/40' : 'border-transparent text-[#8898AA] hover:text-[#4A5568]'}`}>
              {t.icon} {t.label}
            </button>))}
        </div>

        <div className="p-6">
          {/* Tab: Informations */}
          {tab === 'info' && (<div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#4A5568] uppercase tracking-wide mb-1.5">Nom complet</label>
                  <input value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2.5 border border-[#D1D9E0] rounded-lg text-sm focus:outline-none focus:border-[#1F4E79] focus:ring-2 focus:ring-[#1F4E79]/20"/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#4A5568] uppercase tracking-wide mb-1.5">Adresse email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3 py-2.5 border border-[#D1D9E0] rounded-lg text-sm focus:outline-none focus:border-[#1F4E79] focus:ring-2 focus:ring-[#1F4E79]/20"/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#4A5568] uppercase tracking-wide mb-1.5">Téléphone</label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-3 py-2.5 border border-[#D1D9E0] rounded-lg text-sm focus:outline-none focus:border-[#1F4E79] focus:ring-2 focus:ring-[#1F4E79]/20"/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#4A5568] uppercase tracking-wide mb-1.5">Poste</label>
                  <input value={jobTitle} onChange={e => setJobTitle(e.target.value)} className="w-full px-3 py-2.5 border border-[#D1D9E0] rounded-lg text-sm focus:outline-none focus:border-[#1F4E79] focus:ring-2 focus:ring-[#1F4E79]/20"/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#4A5568] uppercase tracking-wide mb-1.5">Département</label>
                  <input value={department} onChange={e => setDepartment(e.target.value)} className="w-full px-3 py-2.5 border border-[#D1D9E0] rounded-lg text-sm focus:outline-none focus:border-[#1F4E79] focus:ring-2 focus:ring-[#1F4E79]/20"/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#4A5568] uppercase tracking-wide mb-1.5">Rôle</label>
                  <div className="px-3 py-2.5 border border-[#D1D9E0] rounded-lg text-sm bg-[#F4F6F8] text-[#8898AA]">{role}</div>
                </div>
              </div>
              <div className="flex justify-end pt-2 border-t border-[#F4F6F8]">
                <button onClick={saveInfo} className="px-5 py-2.5 bg-[#1F4E79] text-white text-sm font-medium rounded-lg hover:bg-[#172033] transition-colors">
                  Enregistrer les modifications
                </button>
              </div>
            </div>)}

          {/* Tab: Security */}
          {tab === 'security' && (<div className="space-y-5">
              <div className="bg-[#EBF2F9] border border-[#1F4E79]/20 rounded-xl p-4 text-xs text-[#1F4E79]">
                <p className="font-semibold mb-1">Conseils de sécurité</p>
                <ul className="space-y-0.5 text-[#1F4E79]/70 list-disc list-inside">
                  <li>Minimum 8 caractères</li>
                  <li>Combinez lettres, chiffres et symboles</li>
                  <li>Évitez les mots de passe déjà utilisés</li>
                </ul>
              </div>

              {pwdError && (<div className="flex items-center gap-2 bg-[#FEF2F2] border border-[#FECACA] rounded-lg p-3 text-sm text-[#DC2626]">
                  <AlertCircle size={14}/> {pwdError}
                </div>)}

              <div className="space-y-4">
                {[
                { label: 'Mot de passe actuel', val: currentPwd, set: setCurrentPwd, show: showCur, toggle: () => setShowCur(v => !v) },
                { label: 'Nouveau mot de passe', val: newPwd, set: setNewPwd, show: showNew, toggle: () => setShowNew(v => !v) },
                { label: 'Confirmer le nouveau mot de passe', val: confirmPwd, set: setConfirmPwd, show: showConf, toggle: () => setShowConf(v => !v) },
            ].map(f => (<div key={f.label}>
                    <label className="block text-xs font-semibold text-[#4A5568] uppercase tracking-wide mb-1.5">{f.label}</label>
                    <div className="relative">
                      <input type={f.show ? 'text' : 'password'} value={f.val} onChange={e => f.set(e.target.value)} placeholder="••••••••" className="w-full px-3 py-2.5 pr-10 border border-[#D1D9E0] rounded-lg text-sm focus:outline-none focus:border-[#1F4E79] focus:ring-2 focus:ring-[#1F4E79]/20"/>
                      <button type="button" onClick={f.toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8898AA] hover:text-[#4A5568]">
                        {f.show ? <EyeOff size={14}/> : <Eye size={14}/>}
                      </button>
                    </div>
                  </div>))}
              </div>

              {/* Strength indicator */}
              {newPwd && (<div>
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4].map(i => (<div key={i} className={`h-1 flex-1 rounded-full ${newPwd.length >= i * 3 ? i <= 2 ? 'bg-[#EA580C]' : i === 3 ? 'bg-[#EAB308]' : 'bg-[#16A34A]' : 'bg-[#D1D9E0]'}`}/>))}
                  </div>
                  <p className="text-[10px] text-[#8898AA]">{newPwd.length < 6 ? 'Trop court' : newPwd.length < 9 ? 'Faible' : newPwd.length < 12 ? 'Moyen' : 'Fort'}</p>
                </div>)}

              <div className="flex justify-end pt-2 border-t border-[#F4F6F8]">
                <button onClick={savePassword} className="px-5 py-2.5 bg-[#1F4E79] text-white text-sm font-medium rounded-lg hover:bg-[#172033] transition-colors">
                  Modifier le mot de passe
                </button>
              </div>
            </div>)}

          {/* Tab: Account */}
          {tab === 'account' && (<div className="space-y-5">
              <div>
                <p className="text-xs font-semibold text-[#4A5568] uppercase tracking-wide mb-3">Comptes liés</p>
                <div className="space-y-2">
                  {accounts.map(a => (<div key={a.id} className="flex items-center gap-3 p-3 border border-[#D1D9E0] rounded-xl">
                      <div className="w-9 h-9 bg-[#EBF2F9] rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-[#1F4E79]">@</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#172033]">{a.label}</p>
                        <p className="text-xs text-[#8898AA] truncate">{a.value}</p>
                      </div>
                      {a.verified && (<span className="flex items-center gap-1 text-[10px] font-medium text-[#16A34A] bg-[#DCFCE7] px-2 py-0.5 rounded-full flex-shrink-0">
                          <Check size={9}/> Vérifié
                        </span>)}
                    </div>))}
                </div>
              </div>

              <div className="border-t border-[#F4F6F8] pt-5">
                <p className="text-xs font-semibold text-[#4A5568] uppercase tracking-wide mb-3">Ajouter un compte</p>
                <div className="flex gap-2">
                  <input type="email" value={newAccountEmail} onChange={e => setNewAccountEmail(e.target.value)} placeholder="email@example.com" className="flex-1 px-3 py-2.5 border border-[#D1D9E0] rounded-lg text-sm focus:outline-none focus:border-[#1F4E79] focus:ring-2 focus:ring-[#1F4E79]/20" onKeyDown={e => { if (e.key === 'Enter')
            addAccount(); }}/>
                  <button onClick={addAccount} disabled={!newAccountEmail.trim()} className="px-4 py-2.5 bg-[#1F4E79] text-white text-sm font-medium rounded-lg hover:bg-[#172033] disabled:opacity-40 transition-colors">
                    Envoyer le lien
                  </button>
                </div>
                <p className="text-[11px] text-[#8898AA] mt-2">Un lien de liaison sera envoyé par email.</p>
              </div>

              <div className="border-t border-[#F4F6F8] pt-5">
                <p className="text-xs font-semibold text-[#4A5568] uppercase tracking-wide mb-3">Zone de danger</p>
                <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-xl p-4">
                  <p className="text-sm font-medium text-[#DC2626] mb-1">Désactiver le compte</p>
                  <p className="text-xs text-[#9CA3AF] mb-3">Cette action nécessite une confirmation par votre administrateur.</p>
                  <button className="px-4 py-2 text-xs font-medium text-[#DC2626] border border-[#FECACA] rounded-lg hover:bg-[#FEE2E2] transition-colors">
                    Demander la désactivation
                  </button>
                </div>
              </div>
            </div>)}
        </div>
      </div>

      {toast && <Toast msg={toast} onClose={() => setToast('')}/>}
    </div>);
}
