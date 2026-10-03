const ACCENT = {
    navy: { bg: 'bg-[#EBF2F9]', icon: 'text-[#1F4E79]', line: 'bg-[#1F4E79]' },
    success: { bg: 'bg-[#DCFCE7]', icon: 'text-[#16A34A]', line: 'bg-[#16A34A]' },
    warning: { bg: 'bg-[#FFEDD5]', icon: 'text-[#EA580C]', line: 'bg-[#EA580C]' },
    danger: { bg: 'bg-[#FEE2E2]', icon: 'text-[#DC2626]', line: 'bg-[#DC2626]' },
    purple: { bg: 'bg-[#EDE9FE]', icon: 'text-[#7C3AED]', line: 'bg-[#7C3AED]' },
};
export default function KPICard({ label, value, icon: Icon, trend, accent = 'navy' }) {
    const a = ACCENT[accent];
    return (<div className="panel group relative overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(23,32,51,0.09)]">
      <div className={`absolute inset-y-5 left-0 w-1 rounded-r-full ${a.line}`}/>
      <div className="flex items-start justify-between pl-1">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8898AA]">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-[#172033]">{value}</p>
          {trend && (<p className={`text-xs mt-1 font-medium ${trend.positive ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
              {trend.positive ? '↑' : '↓'} {trend.value}
            </p>)}
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${a.bg} transition-transform duration-300 group-hover:rotate-3 group-hover:scale-105`}>
          <Icon className={`h-5 w-5 ${a.icon}`} strokeWidth={2}/>
        </div>
      </div>
    </div>);
}
