import { Check, X, Clock, SkipForward } from 'lucide-react';
const STEP_ICON = {
    APPROVED: { icon: Check, bg: 'bg-[#16A34A]', ring: 'ring-[#DCFCE7]' },
    REJECTED: { icon: X, bg: 'bg-[#DC2626]', ring: 'ring-[#FEE2E2]' },
    IN_PROGRESS: { icon: Clock, bg: 'bg-[#1F4E79]', ring: 'ring-[#C5D9EE]' },
    PENDING: { icon: Clock, bg: 'bg-[#D1D9E0]', ring: 'ring-[#F4F6F8]' },
    SKIPPED: { icon: SkipForward, bg: 'bg-[#94A3B8]', ring: 'ring-[#F1F5F9]' },
};
function formatDate(iso) {
    if (!iso)
        return null;
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}
export default function Timeline({ steps }) {
    return (<div className="relative">
      {steps.map((step, idx) => {
            const cfg = STEP_ICON[step.status] ?? STEP_ICON.PENDING;
            const Icon = cfg.icon;
            const isLast = idx === steps.length - 1;
            return (<div key={step.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ring-4 ${cfg.bg} ${cfg.ring} flex-shrink-0 z-10`}>
                <Icon className="w-4 h-4 text-white" strokeWidth={2.5}/>
              </div>
              {!isLast && <div className="w-0.5 flex-1 bg-[#D1D9E0] my-1"/>}
            </div>
            <div className={`pb-6 ${isLast ? '' : ''} min-w-0 flex-1`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-[#172033] text-sm">{step.nodeLabel}</p>
                  {step.workspaceName && (<p className="text-xs text-[#8898AA] mt-0.5">Espace : {step.workspaceName}</p>)}
                  {step.assignedTo && (<p className="text-xs text-[#4A5568] mt-0.5">Par : {step.assignedTo}</p>)}
                  {step.comment && (<div className="mt-2 px-3 py-2 bg-[#F4F6F8] rounded-lg text-sm text-[#4A5568] border border-[#D1D9E0] italic">
                      "{step.comment}"
                    </div>)}
                </div>
                <div className="text-right flex-shrink-0">
                  {step.slaHours ? (<span className="text-[11px] text-[#8898AA]">SLA : {step.slaHours}h</span>) : null}
                  {(step.completedAt || step.startedAt) && (<p className="text-[11px] text-[#8898AA] mt-0.5">
                      {formatDate(step.completedAt ?? step.startedAt)}
                    </p>)}
                </div>
              </div>
            </div>
          </div>);
        })}
    </div>);
}
