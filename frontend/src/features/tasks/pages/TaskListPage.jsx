import { useState, useEffect, useMemo } from 'react';
import { 
  CheckSquare, 
  Clock, 
  CheckCircle, 
  XCircle, 
  User, 
  FileText, 
  Building2, 
  Search, 
  Filter, 
  ArrowRight, 
  X, 
  Loader2, 
  AlertCircle,
  Calendar,
  Layers,
  Send
} from 'lucide-react';
import { taskApi } from '../../../api/taskApi';
import ProcessIcon from '../../processes/components/ProcessIcon';

const STATUT_BADGES = {
  EN_ATTENTE: { label: 'En attente', color: 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]' },
  EN_COURS:   { label: 'En cours',   color: 'bg-[#EBF2F9] text-[#1F4E79] border-[#BFDBFE]' },
  APPROUVEE:  { label: 'Approuvée',  color: 'bg-[#DCFCE7] text-[#14532D] border-[#BBF7D0]' },
  REFUSEE:    { label: 'Refusée',    color: 'bg-[#FEE2E2] text-[#7F1D1D] border-[#FECACA]' },
  ANNULEE:    { label: 'Annulée',    color: 'bg-[#F4F6F8] text-[#4A5568] border-[#D1D9E0]' },
};

export default function TaskListPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'all', 'approved', 'rejected'
  const [search, setSearch] = useState('');
  
  // Modal de traitement
  const [selectedTask, setSelectedTask] = useState(null);
  const [decisionComment, setDecisionComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: '' }

  const loadTasks = () => {
    setLoading(true);
    taskApi.listMine()
      .then(res => {
        setTasks(Array.isArray(res) ? res : []);
        setError('');
      })
      .catch(err => {
        setError(err.message || 'Impossible de charger vos tâches.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleDecision = async (isApprove) => {
    if (!selectedTask) return;
    setActionLoading(true);
    try {
      if (isApprove) {
        await taskApi.approve(selectedTask.id, decisionComment);
        setFeedback({ type: 'success', message: `La demande ${selectedTask.demandeReference || ''} a été approuvée avec succès.` });
      } else {
        await taskApi.reject(selectedTask.id, decisionComment);
        setFeedback({ type: 'success', message: `La demande ${selectedTask.demandeReference || ''} a été refusée.` });
      }
      window.dispatchEvent(new Event('smart-engine-task-decision'));
      setSelectedTask(null);
      setDecisionComment('');
      loadTasks();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Une erreur est survenue lors du traitement.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Filtrage
  const filteredTasks = tasks.filter(t => {
    if (activeTab === 'pending' && !(t.statut === 'EN_ATTENTE' || t.statut === 'EN_COURS')) return false;
    if (activeTab === 'approved' && t.statut !== 'APPROUVEE') return false;
    if (activeTab === 'rejected' && t.statut !== 'REFUSEE') return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const refMatch = t.demandeReference?.toLowerCase().includes(q);
      const procMatch = t.processusNom?.toLowerCase().includes(q);
      const requesterMatch = `${t.demandeurPrenom || ''} ${t.demandeurNom || ''}`.toLowerCase().includes(q) || t.demandeurEmail?.toLowerCase().includes(q);
      const stepMatch = t.noeudLibelle?.toLowerCase().includes(q);
      return refMatch || procMatch || requesterMatch || stepMatch;
    }
    return true;
  });

  const pendingCount = tasks.filter(t => t.statut === 'EN_ATTENTE' || t.statut === 'EN_COURS').length;
  const approvedCount = tasks.filter(t => t.statut === 'APPROUVEE').length;
  const rejectedCount = tasks.filter(t => t.statut === 'REFUSEE').length;

  // Parser le dataJson de la tâche sélectionnée
  let parsedFormData = {};
  if (selectedTask?.dataJson) {
    try {
      parsedFormData = JSON.parse(selectedTask.dataJson);
    } catch {
      parsedFormData = {};
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#172033]">Tâches à traiter</h1>
          <p className="text-sm text-[#8898AA] mt-1">
            Consultez et validez les demandes transmises par vos collègues nécessitant votre approbation.
          </p>
        </div>
      </div>

      {/* Message feedback */}
      {feedback && (
        <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-sm ${
          feedback.type === 'success' 
            ? 'bg-[#DCFCE7] border-[#BBF7D0] text-[#14532D]' 
            : 'bg-[#FEF2F2] border-[#FECACA] text-[#DC2626]'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="p-1 hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div 
          onClick={() => setActiveTab('pending')}
          className={`cursor-pointer bg-white p-4 rounded-xl border transition-all ${
            activeTab === 'pending' ? 'border-[#1F4E79] ring-2 ring-[#1F4E79]/20 shadow-sm' : 'border-[#D1D9E0] hover:border-[#1F4E79]/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#8898AA] uppercase tracking-wider">À traiter</span>
            <span className="p-1.5 rounded-lg bg-[#FEF3C7] text-[#92400E]">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-bold text-[#172033] mt-2">{pendingCount}</p>
        </div>

        <div 
          onClick={() => setActiveTab('approved')}
          className={`cursor-pointer bg-white p-4 rounded-xl border transition-all ${
            activeTab === 'approved' ? 'border-[#16A34A] ring-2 ring-[#16A34A]/20 shadow-sm' : 'border-[#D1D9E0] hover:border-[#16A34A]/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#8898AA] uppercase tracking-wider">Approuvées</span>
            <span className="p-1.5 rounded-lg bg-[#DCFCE7] text-[#14532D]">
              <CheckCircle className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-bold text-[#172033] mt-2">{approvedCount}</p>
        </div>

        <div 
          onClick={() => setActiveTab('rejected')}
          className={`cursor-pointer bg-white p-4 rounded-xl border transition-all ${
            activeTab === 'rejected' ? 'border-[#DC2626] ring-2 ring-[#DC2626]/20 shadow-sm' : 'border-[#D1D9E0] hover:border-[#DC2626]/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#8898AA] uppercase tracking-wider">Refusées</span>
            <span className="p-1.5 rounded-lg bg-[#FEE2E2] text-[#7F1D1D]">
              <XCircle className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-bold text-[#172033] mt-2">{rejectedCount}</p>
        </div>

        <div 
          onClick={() => setActiveTab('all')}
          className={`cursor-pointer bg-white p-4 rounded-xl border transition-all ${
            activeTab === 'all' ? 'border-[#1F4E79] ring-2 ring-[#1F4E79]/20 shadow-sm' : 'border-[#D1D9E0] hover:border-[#1F4E79]/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#8898AA] uppercase tracking-wider">Total</span>
            <span className="p-1.5 rounded-lg bg-[#EBF2F9] text-[#1F4E79]">
              <Layers className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-bold text-[#172033] mt-2">{tasks.length}</p>
        </div>
      </div>

      {/* Barre d'outils et de recherche */}
      <div className="bg-white p-4 rounded-xl border border-[#D1D9E0] flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Onglets */}
        <div className="flex items-center gap-1 bg-[#F4F6F8] p-1 rounded-lg">
          {[
            { id: 'pending', label: 'À traiter', count: pendingCount },
            { id: 'all', label: 'Toutes', count: tasks.length },
            { id: 'approved', label: 'Approuvées', count: approvedCount },
            { id: 'rejected', label: 'Refusées', count: rejectedCount },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
                activeTab === tab.id 
                  ? 'bg-white text-[#172033] shadow-sm font-semibold' 
                  : 'text-[#8898AA] hover:text-[#172033]'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === tab.id ? 'bg-[#1F4E79] text-white' : 'bg-[#E5E9EE] text-[#4A5568]'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Champ de recherche */}
        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8898AA]" />
          <input
            type="text"
            placeholder="Rechercher une tâche, demandeur, réf..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-[#D1D9E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F4E79]/20"
          />
        </div>
      </div>

      {/* Liste des tâches */}
      {loading ? (
        <div className="bg-white rounded-xl border border-[#D1D9E0] p-12 text-center text-sm text-[#8898AA]">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#1F4E79]" />
          Chargement de vos tâches...
        </div>
      ) : error ? (
        <div className="bg-white rounded-xl border border-[#D1D9E0] p-8 text-center text-sm text-[#DC2626]">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-[#DC2626]" />
          <p>{error}</p>
          <button onClick={loadTasks} className="mt-3 px-4 py-1.5 text-xs bg-[#1F4E79] text-white rounded-lg">
            Réessayer
          </button>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#D1D9E0] p-12 text-center text-sm text-[#8898AA]">
          <CheckSquare className="w-10 h-10 mx-auto mb-3 text-[#D1D9E0]" />
          <p className="font-semibold text-[#172033] text-base">Aucune tâche trouvée</p>
          <p className="text-xs text-[#8898AA] mt-1">
            {activeTab === 'pending'
              ? 'Vous êtes à jour ! Aucune demande n\'est en attente de votre validation.'
              : 'Aucun enregistrement ne correspond à vos critères de recherche.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#D1D9E0] overflow-hidden shadow-sm divide-y divide-[#F4F6F8]">
          {filteredTasks.map(task => {
            const isPending = task.statut === 'EN_ATTENTE' || task.statut === 'EN_COURS';
            const badge = STATUT_BADGES[task.statut] || { label: task.statut, color: 'bg-[#F4F6F8] text-[#8898AA]' };

            return (
              <div 
                key={task.id}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#F8FAFC] transition-colors"
              >
                {/* Demandeur et Demande info */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#EBF2F9] text-[#1F4E79] flex items-center justify-center font-bold text-sm flex-shrink-0 ring-1 ring-[#1F4E79]/20">
                    <ProcessIcon icon={task.processusIcon} name={task.processusNom} />
                  </div>
                  
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-[#172033] text-sm hover:underline cursor-pointer" onClick={() => setSelectedTask(task)}>
                        {task.processusNom || 'Demande sans nom'}
                      </span>
                      <span className="font-mono text-[11px] text-[#8898AA] bg-[#F4F6F8] px-2 py-0.5 rounded border border-[#D1D9E0]">
                        {task.demandeReference || `DEM-${task.demandeId}`}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.color}`}>
                        {badge.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-[#8898AA] flex-wrap">
                      <span className="flex items-center gap-1.5 font-medium text-[#4A5568]">
                        <User className="w-3.5 h-3.5 text-[#1F4E79]" />
                        Demandeur : {task.demandeurPrenom} {task.demandeurNom} ({task.demandeurEmail})
                      </span>
                      {task.workspaceName && (
                        <span className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-[#8898AA]" />
                          {task.workspaceName}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#8898AA]" />
                        {task.demandeDateCreation 
                          ? new Date(task.demandeDateCreation).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
                          : 'Date inconnue'}
                      </span>
                    </div>

                    {task.noeudLibelle && (
                      <p className="text-[11px] text-[#1F4E79] font-medium bg-[#EBF2F9]/50 inline-block px-2 py-0.5 rounded">
                        Étape : {task.noeudLibelle}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2.5 flex-shrink-0 self-end md:self-center">
                  <button
                    onClick={() => {
                      setSelectedTask(task);
                      setDecisionComment('');
                    }}
                    className={`px-4 py-2 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all ${
                      isPending
                        ? 'bg-[#1F4E79] text-white hover:bg-[#163a5c] shadow-sm'
                        : 'border border-[#D1D9E0] text-[#4A5568] hover:bg-[#F4F6F8]'
                    }`}
                  >
                    <span>{isPending ? 'Traiter la demande' : 'Voir les détails'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL DE TRAITEMENT COMPLET DE LA TÂCHE */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-[#D1D9E0] overflow-hidden my-8">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-[#D1D9E0] flex items-center justify-between bg-[#F8FAFC]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#EBF2F9] text-[#1F4E79] flex items-center justify-center">
                  <ProcessIcon icon={selectedTask.processusIcon} name={selectedTask.processusNom} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#172033]">{selectedTask.processusNom}</h2>
                  <p className="text-xs text-[#8898AA] font-mono mt-0.5">{selectedTask.demandeReference}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedTask(null)}
                className="p-1.5 rounded-lg text-[#8898AA] hover:text-[#172033] hover:bg-[#E5E9EE] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Infos demandeur */}
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4">
                <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider mb-3 flex items-center gap-2">
                  <User className="w-4 h-4 text-[#1F4E79]" /> Demandeur
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[#8898AA] block text-[10px] uppercase font-semibold">Nom complet</span>
                    <span className="font-semibold text-[#172033]">{selectedTask.demandeurPrenom} {selectedTask.demandeurNom}</span>
                  </div>
                  <div>
                    <span className="text-[#8898AA] block text-[10px] uppercase font-semibold">Email</span>
                    <span className="font-mono text-[#172033]">{selectedTask.demandeurEmail}</span>
                  </div>
                  <div>
                    <span className="text-[#8898AA] block text-[10px] uppercase font-semibold">Workspace</span>
                    <span className="font-medium text-[#172033]">{selectedTask.workspaceName || '—'}</span>
                  </div>
                  <div>
                    <span className="text-[#8898AA] block text-[10px] uppercase font-semibold">Étape requise</span>
                    <span className="font-semibold text-[#1F4E79]">{selectedTask.noeudLibelle || 'Validation'}</span>
                  </div>
                </div>
              </div>

              {/* Formulaire rempli par l'employé */}
              <div className="border border-[#D1D9E0] rounded-xl p-5 space-y-4">
                <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#1F4E79]" /> Informations remplies par le demandeur
                </h3>

                {Object.keys(parsedFormData).length === 0 ? (
                  <p className="text-xs text-[#8898AA] italic py-2">Aucune donnée de formulaire disponible.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(parsedFormData).map(([key, val]) => (
                      <div key={key} className="bg-[#F4F6F8] rounded-xl p-3 border border-[#E2E8F0]">
                        <span className="block text-[10px] font-semibold text-[#8898AA] uppercase tracking-wider mb-1">
                          {key.replace(/_/g, ' ')}
                        </span>
                        <span className="text-sm font-semibold text-[#172033]">
                          {typeof val === 'boolean'
                            ? (val ? 'Oui' : 'Non')
                            : val === null || val === undefined || val === ''
                              ? <span className="text-[#8898AA] italic">—</span>
                              : String(val)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Zone de décision (Approuver / Refuser) */}
              {(selectedTask.statut === 'EN_ATTENTE' || selectedTask.statut === 'EN_COURS') ? (
                <div className="bg-[#F8FAFC] border border-[#D1D9E0] rounded-xl p-5 space-y-4">
                  <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider flex items-center gap-2">
                    <Send className="w-4 h-4 text-[#1F4E79]" /> Votre Décision
                  </h3>
                  <div>
                    <label className="block text-xs font-medium text-[#4A5568] mb-1.5">
                      Commentaire ou motif (optionnel) :
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Indiquez ici vos remarques ou la raison de votre validation / refus..."
                      value={decisionComment}
                      onChange={e => setDecisionComment(e.target.value)}
                      className="w-full text-xs p-3 border border-[#D1D9E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1F4E79]/20 bg-white"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      disabled={actionLoading}
                      onClick={() => handleDecision(false)}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] hover:bg-[#FEE2E2] transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                      Refuser la demande
                    </button>
                    <button
                      disabled={actionLoading}
                      onClick={() => handleDecision(true)}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#16A34A] text-white hover:bg-[#15803D] shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      Approuver la demande
                    </button>
                  </div>
                </div>
              ) : (
                <div className={`p-4 rounded-xl border text-xs font-medium flex items-center gap-2 ${
                  selectedTask.statut === 'APPROUVEE' 
                    ? 'bg-[#DCFCE7] border-[#BBF7D0] text-[#14532D]' 
                    : 'bg-[#FEE2E2] border-[#FECACA] text-[#7F1D1D]'
                }`}>
                  {selectedTask.statut === 'APPROUVEE' ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <XCircle className="w-4 h-4 flex-shrink-0" />}
                  <span>Cette tâche a été traitée avec le statut : <strong>{selectedTask.statut}</strong>.</span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#F8FAFC] border-t border-[#D1D9E0] flex justify-end">
              <button
                onClick={() => setSelectedTask(null)}
                className="px-4 py-2 text-xs font-semibold text-[#4A5568] hover:bg-[#E2E8F0] rounded-xl transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
