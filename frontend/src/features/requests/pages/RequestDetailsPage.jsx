import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, User, FileText, CheckCircle, Circle, Loader, XCircle, AlertCircle } from 'lucide-react';
import { useRequests } from '../../../app/providers/RequestProvider';
import StatusBadge from '../../../components/StatusBadge';
function StepIcon({ status }) {
    if (status === 'APPROVED')
        return <CheckCircle className="w-5 h-5 text-[#16A34A]"/>;
    if (status === 'REJECTED')
        return <XCircle className="w-5 h-5 text-[#DC2626]"/>;
    if (status === 'IN_PROGRESS')
        return <Loader className="w-5 h-5 text-[#1F4E79] animate-spin"/>;
    if (status === 'OVERDUE')
        return <AlertCircle className="w-5 h-5 text-[#EA580C]"/>;
    return <Circle className="w-5 h-5 text-[#D1D9E0]"/>;
}
function stepColor(status) {
    if (status === 'APPROVED')
        return 'bg-[#DCFCE7] border-[#16A34A]/40 text-[#14532D]';
    if (status === 'REJECTED')
        return 'bg-[#FEE2E2] border-[#DC2626]/40 text-[#7F1D1D]';
    if (status === 'IN_PROGRESS')
        return 'bg-[#EBF2F9] border-[#1F4E79]/40 text-[#1F4E79]';
    if (status === 'OVERDUE')
        return 'bg-[#FFEDD5] border-[#EA580C]/40 text-[#7C2D12]';
    return 'bg-white border-[#D1D9E0] text-[#8898AA]';
}
function connectorColor(status) {
    if (status === 'APPROVED')
        return 'bg-[#16A34A]';
    if (status === 'REJECTED')
        return 'bg-[#DC2626]';
    if (status === 'IN_PROGRESS')
        return 'bg-[#1F4E79]';
    return 'bg-[#D1D9E0]';
}
function stepLabel(status) {
    if (status === 'APPROVED')
        return 'Approuvé';
    if (status === 'REJECTED')
        return 'Refusé';
    if (status === 'IN_PROGRESS')
        return 'En cours';
    if (status === 'OVERDUE')
        return 'En retard';
    return 'En attente';
}
export default function RequestDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { requests } = useRequests();
    const request = requests.find(r => r.id === id);
    if (!request) {
        return (<div className="text-center py-16">
        <p className="text-[#8898AA]">Demande introuvable</p>
        <button onClick={() => navigate('/employee/requests')} className="mt-3 text-[#1F4E79] hover:underline text-sm">Retour</button>
      </div>);
    }
    const currentStepIndex = request.steps.findIndex(s => s.id === request.currentStepId);
    const currentStep = request.steps.find(s => s.id === request.currentStepId);
    const formEntries = Object.entries(request.formData);
    const isActive = request.status === 'EN_COURS' || request.status === 'EN_RETARD';
    const totalSteps = request.steps.length;
    const doneSteps = request.steps.filter(s => s.status === 'APPROVED' || s.status === 'REJECTED').length;
    const progressPct = totalSteps > 0 ? Math.round((doneSteps / totalSteps) * 100) : 0;
    return (<div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/employee/requests')} className="p-1.5 rounded-lg hover:bg-[#F4F6F8] text-[#8898AA] hover:text-[#172033] transition-colors">
          <ArrowLeft className="w-5 h-5"/>
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-lg font-bold text-[#172033]">{request.processName}</h1>
            <StatusBadge status={request.status}/>
          </div>
          <p className="text-xs text-[#8898AA] font-mono mt-0.5">{request.reference}</p>
        </div>
      </div>

      {/* Progress summary bar */}
      <div className="bg-white border border-[#D1D9E0] rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-semibold text-[#172033]">Progression du dossier</p>
            <p className="text-xs text-[#8898AA] mt-0.5">{doneSteps} étape{doneSteps !== 1 ? 's' : ''} traitée{doneSteps !== 1 ? 's' : ''} sur {totalSteps}</p>
          </div>
          <span className="text-2xl font-bold text-[#1F4E79]">{progressPct}%</span>
        </div>
        <div className="w-full h-2 bg-[#F4F6F8] rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${request.status === 'TERMINE' ? 'bg-[#16A34A]' : request.status === 'REJETE' ? 'bg-[#DC2626]' : 'bg-[#1F4E79]'}`} style={{ width: `${progressPct}%` }}/>
        </div>
      </div>

      {/* Step tracker */}
      <div className="bg-white border border-[#D1D9E0] rounded-xl p-5">
        <div className="flex items-center gap-2 mb-5">
          <Clock className="w-4 h-4 text-[#1F4E79]"/>
          <h2 className="font-semibold text-[#172033] text-sm">Suivi étape par étape</h2>
        </div>
        <div className="space-y-0">
          {request.steps.map((step, idx) => {
            const isLast = idx === request.steps.length - 1;
            const isCurrent = step.id === request.currentStepId && isActive;
            return (<div key={step.id} className="flex gap-4">
                {/* Left: icon + connector */}
                <div className="flex flex-col items-center flex-shrink-0 w-10">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 flex-shrink-0 ${isCurrent ? 'border-[#1F4E79] bg-[#EBF2F9] shadow-sm ring-4 ring-[#1F4E79]/10' : step.status === 'APPROVED' ? 'border-[#16A34A] bg-[#DCFCE7]' : step.status === 'REJECTED' ? 'border-[#DC2626] bg-[#FEE2E2]' : 'border-[#D1D9E0] bg-white'}`}>
                    <StepIcon status={step.status}/>
                  </div>
                  {!isLast && (<div className={`w-0.5 flex-1 my-1 min-h-[20px] ${connectorColor(step.status)}`}/>)}
                </div>
                {/* Right: content */}
                <div className={`flex-1 mb-4 pb-0`}>
                  <div className={`rounded-xl border p-3.5 ${isCurrent ? 'border-[#1F4E79]/30 bg-[#EBF2F9]' : stepColor(step.status)}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className={`text-sm font-semibold ${isCurrent ? 'text-[#1F4E79]' : ''}`}>{step.nodeLabel}</p>
                        {step.workspaceName && (<p className="text-xs mt-0.5 opacity-70">
                            {isCurrent ? `⏳ En attente de : ${step.workspaceName}` : step.workspaceName}
                          </p>)}
                        {step.assignedTo && step.status === 'APPROVED' && (<p className="text-xs mt-0.5 opacity-70">Traité par : {step.assignedTo}</p>)}
                        {step.comment && (<p className="text-xs mt-1.5 italic opacity-80">"{step.comment}"</p>)}
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${step.status === 'APPROVED' ? 'bg-[#16A34A]/20 text-[#14532D]' : step.status === 'REJECTED' ? 'bg-[#DC2626]/20 text-[#7F1D1D]' : step.status === 'IN_PROGRESS' ? 'bg-[#1F4E79]/20 text-[#1F4E79]' : 'bg-[#D1D9E0]/50 text-[#8898AA]'}`}>
                          {stepLabel(step.status)}
                        </span>
                        {step.slaHours ? <span className="text-[10px] text-current opacity-60">SLA: {step.slaHours}h</span> : null}
                      </div>
                    </div>
                    {/* Timestamps */}
                    <div className="flex gap-4 mt-2 pt-2 border-t border-current/10 text-[10px] opacity-60">
                      {step.startedAt && <span>Démarré : {new Date(step.startedAt).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>}
                      {step.completedAt && <span>Terminé : {new Date(step.completedAt).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>}
                    </div>
                  </div>
                </div>
              </div>);
        })}
        </div>
      </div>

      {/* Form data */}
      <div className="bg-white border border-[#D1D9E0] rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-4 h-4 text-[#1F4E79]"/>
          <h2 className="font-semibold text-[#172033] text-sm">Données du formulaire</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {formEntries.map(([key, value]) => (<div key={key} className="bg-[#F4F6F8] rounded-lg px-3 py-2.5">
              <span className="block text-[10px] font-semibold text-[#8898AA] uppercase tracking-wide mb-1">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
              <span className="text-sm text-[#172033] font-medium">{typeof value === 'boolean' ? (value ? 'Oui' : 'Non') : String(value)}</span>
            </div>))}
        </div>
        <div className="mt-4 pt-4 border-t border-[#F4F6F8] flex flex-wrap gap-4 text-xs text-[#8898AA]">
          <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5"/> {request.requesterName}</span>
          <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5"/> Soumis le {new Date(request.createdAt).toLocaleString('fr-FR')}</span>
        </div>
      </div>
    </div>);
}
