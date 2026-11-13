import { ArrowRight, Check, X, Clock, SkipForward, GitBranch } from 'lucide-react';
const STATES = {
    APPROUVEE: { icon: Check, label: 'Approuvée', style: 'border-green-200 bg-green-50', iconStyle: 'bg-green-600' },
    REFUSEE: { icon: X, label: 'Refusée', style: 'border-red-200 bg-red-50', iconStyle: 'bg-red-600' },
    EN_COURS: { icon: Clock, label: 'En cours de traitement', style: 'border-blue-400 bg-blue-50 ring-1 ring-blue-200', iconStyle: 'bg-[#1F4E79]', current: true },
    EN_ATTENTE: { icon: Clock, label: 'En attente de validation', style: 'border-blue-400 bg-blue-50 ring-1 ring-blue-200', iconStyle: 'bg-[#1F4E79]', current: true },
    ANNULEE: { icon: SkipForward, label: 'Annulée', style: 'border-slate-200 bg-slate-50', iconStyle: 'bg-slate-400' },
    A_VENIR: { icon: Clock, label: 'À venir si approuvée', style: 'border-dashed border-slate-300 bg-white', iconStyle: 'bg-slate-400' },
    CONDITION_A_VENIR: { icon: GitBranch, label: 'Suite du parcours selon le résultat de cette condition', style: 'border-dashed border-violet-200 bg-violet-50', iconStyle: 'bg-violet-500' },
};
function formatDate(value) {
    return new Date(value).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}
export default function RequestTimeline({ steps = [], compact = false }) {
    if (compact) return <span className="mt-3 flex flex-wrap items-center gap-2" aria-label="Parcours par workspace">
        {steps.map((step, index) => {
            const cfg = STATES[step.status] ?? { ...STATES.A_VENIR, label: step.status };
            const Icon = cfg.icon;
            return <span key={step.id} className="inline-flex items-center gap-2">
                {index > 0 && <ArrowRight size={14} className="text-slate-400" aria-hidden="true"/>}
                <span className={"inline-flex items-center gap-2 rounded-lg border px-2 py-1 text-xs " + cfg.style}>
                    <Icon size={14}/><span><strong>{step.workspaceName || step.nodeLabel}</strong><span className="block">{cfg.label}</span></span>
                </span>
            </span>;
        })}
    </span>;
    return <ol aria-label="Parcours de validation par workspace" className="space-y-0">
        {steps.map((step, index) => {
            const cfg = STATES[step.status] ?? { ...STATES.A_VENIR, label: step.status };
            const Icon = cfg.icon;
            return <li key={step.id} aria-current={cfg.current ? 'step' : undefined} className="flex gap-3">
                <div className="flex flex-col items-center shrink-0">
                    <span className={'flex h-8 w-8 items-center justify-center rounded-full text-white ' + cfg.iconStyle}><Icon size={16}/></span>
                    {index < steps.length - 1 && <span aria-hidden="true" className="w-0.5 flex-1 min-h-5 bg-slate-200"/>}
                </div>
                <div className={'mb-4 min-w-0 flex-1 rounded-xl border p-4 ' + cfg.style}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-bold text-[#172033]">{index + 1}. {step.workspaceName || step.nodeLabel}</p>
                        {cfg.current && <span className="rounded-full bg-[#1F4E79] px-2 py-0.5 text-xs font-semibold text-white">Étape actuelle</span>}
                    </div>
                    {step.workspaceName && <p className="mt-1 text-xs text-slate-500">{step.nodeLabel}</p>}
                    <p className="mt-2 text-sm font-medium">{cfg.label}</p>
                    {(step.completedAt || step.startedAt) && <p className="mt-2 text-xs text-slate-500">
                        {step.completedAt ? 'Décision le ' : 'Reçue le '}{formatDate(step.completedAt || step.startedAt)}
                    </p>}
                </div>
            </li>;
        })}
    </ol>;
}
