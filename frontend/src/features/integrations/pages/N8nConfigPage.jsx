import { useState } from 'react';
import { Webhook, CheckCircle, XCircle, RefreshCw, Plus, Trash2 } from 'lucide-react';
const INITIAL_WEBHOOKS = [
    { id: 'wh1', event: 'REQUEST_CREATED', url: 'https://n8n.acme.com/webhook/bpm-new-request', active: true, lastSent: '2024-03-15T14:30:00', lastStatus: 'success' },
    { id: 'wh2', event: 'REQUEST_APPROVED', url: 'https://n8n.acme.com/webhook/bpm-approved', active: true, lastSent: '2024-03-15T14:31:00', lastStatus: 'success' },
    { id: 'wh3', event: 'REQUEST_REJECTED', url: 'https://n8n.acme.com/webhook/bpm-rejected', active: false, lastSent: '2024-03-06T10:00:00', lastStatus: 'error' },
];
const EVENTS = [
    'REQUEST_CREATED', 'REQUEST_SUBMITTED', 'TASK_ASSIGNED', 'TASK_APPROVED',
    'TASK_REJECTED', 'REQUEST_COMPLETED', 'SLA_BREACHED', 'USER_CREATED',
];
export default function N8nConfig() {
    const [webhooks, setWebhooks] = useState(INITIAL_WEBHOOKS);
    const [showAdd, setShowAdd] = useState(false);
    const [newEvent, setNewEvent] = useState(EVENTS[0]);
    const [newUrl, setNewUrl] = useState('');
    const [testing, setTesting] = useState(null);
    const toggle = (id) => setWebhooks(prev => prev.map(w => w.id === id ? { ...w, active: !w.active } : w));
    const remove = (id) => setWebhooks(prev => prev.filter(w => w.id !== id));
    const test = async (id) => {
        setTesting(id);
        await new Promise(r => setTimeout(r, 1000));
        setWebhooks(prev => prev.map(w => w.id === id ? { ...w, lastSent: new Date().toISOString(), lastStatus: 'success' } : w));
        setTesting(null);
    };
    const addWebhook = () => {
        if (!newUrl)
            return;
        setWebhooks(prev => [...prev, { id: `wh_${Date.now()}`, event: newEvent, url: newUrl, active: true }]);
        setNewUrl('');
        setShowAdd(false);
    };
    return (<div className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#172033]">Intégration n8n</h1>
          <p className="text-sm text-[#8898AA] mt-0.5">Configurez les webhooks vers votre instance n8n</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-[#1F4E79] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#172033] transition-colors">
          <Plus className="w-4 h-4"/> Nouveau webhook
        </button>
      </div>

      {/* Connection status */}
      <div className="bg-white border border-[#D1D9E0] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-[#172033] text-sm">Statut de connexion</h2>
          <span className="flex items-center gap-1.5 text-xs text-[#16A34A] font-medium">
            <span className="w-2 h-2 rounded-full bg-[#16A34A] pulse-dot"/>
            Connecté à n8n v1.24.0
          </span>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-[#F4F6F8] rounded-lg p-3">
            <p className="text-xl font-bold text-[#1F4E79]">{webhooks.filter(w => w.active).length}</p>
            <p className="text-xs text-[#8898AA] mt-0.5">Actifs</p>
          </div>
          <div className="bg-[#F4F6F8] rounded-lg p-3">
            <p className="text-xl font-bold text-[#16A34A]">{webhooks.filter(w => w.lastStatus === 'success').length}</p>
            <p className="text-xs text-[#8898AA] mt-0.5">Succès récents</p>
          </div>
          <div className="bg-[#F4F6F8] rounded-lg p-3">
            <p className="text-xl font-bold text-[#DC2626]">{webhooks.filter(w => w.lastStatus === 'error').length}</p>
            <p className="text-xs text-[#8898AA] mt-0.5">Erreurs</p>
          </div>
        </div>
      </div>

      {/* Webhooks list */}
      <div className="space-y-3">
        {webhooks.map(wh => (<div key={wh.id} className="bg-white border border-[#D1D9E0] rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${wh.active ? 'bg-[#EBF2F9]' : 'bg-[#F1F5F9]'}`}>
                  <Webhook className={`w-4 h-4 ${wh.active ? 'text-[#1F4E79]' : 'text-[#94A3B8]'}`}/>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-semibold text-[#1F4E79] bg-[#EBF2F9] px-2 py-0.5 rounded">{wh.event}</span>
                    {!wh.active && <span className="text-xs text-[#8898AA]">désactivé</span>}
                  </div>
                  <p className="text-sm text-[#172033] font-mono truncate">{wh.url}</p>
                  {wh.lastSent && (<div className="flex items-center gap-1.5 mt-1">
                      {wh.lastStatus === 'success' ? (<CheckCircle className="w-3.5 h-3.5 text-[#16A34A]"/>) : (<XCircle className="w-3.5 h-3.5 text-[#DC2626]"/>)}
                      <span className="text-xs text-[#8898AA]">
                        Dernier envoi : {new Date(wh.lastSent).toLocaleString('fr-FR')}
                      </span>
                    </div>)}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => test(wh.id)} disabled={testing === wh.id} className="flex items-center gap-1.5 border border-[#D1D9E0] text-[#4A5568] hover:border-[#1F4E79] hover:text-[#1F4E79] px-2.5 py-1.5 rounded-lg text-xs transition-colors disabled:opacity-50">
                  <RefreshCw className={`w-3.5 h-3.5 ${testing === wh.id ? 'animate-spin' : ''}`}/>
                  Tester
                </button>
                <button onClick={() => toggle(wh.id)} className={`w-9 h-5 rounded-full transition-colors relative ${wh.active ? 'bg-[#1F4E79]' : 'bg-[#D1D9E0]'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${wh.active ? 'left-4' : 'left-0.5'}`}/>
                </button>
                <button onClick={() => remove(wh.id)} className="p-1.5 rounded-lg hover:bg-[#FEE2E2] text-[#8898AA] hover:text-[#DC2626] transition-colors">
                  <Trash2 className="w-3.5 h-3.5"/>
                </button>
              </div>
            </div>
          </div>))}
      </div>

      {showAdd && (<div className="bg-white border border-[#1F4E79]/30 rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-[#172033] text-sm">Nouveau webhook</h3>
          <div>
            <label className="block text-xs font-semibold text-[#4A5568] uppercase tracking-wide mb-1.5">Événement</label>
            <select value={newEvent} onChange={e => setNewEvent(e.target.value)} className="w-full px-3 py-2.5 border border-[#D1D9E0] rounded-lg text-sm focus:outline-none focus:border-[#1F4E79]">
              {EVENTS.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#4A5568] uppercase tracking-wide mb-1.5">URL du webhook n8n</label>
            <input value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="https://n8n.example.com/webhook/..." className="w-full px-3 py-2.5 border border-[#D1D9E0] rounded-lg text-sm focus:outline-none focus:border-[#1F4E79]"/>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowAdd(false)} className="flex-1 border border-[#D1D9E0] text-[#4A5568] py-2 rounded-lg text-sm">Annuler</button>
            <button onClick={addWebhook} className="flex-1 bg-[#1F4E79] text-white py-2 rounded-lg text-sm font-medium hover:bg-[#172033]">Ajouter</button>
          </div>
        </div>)}
    </div>);
}
