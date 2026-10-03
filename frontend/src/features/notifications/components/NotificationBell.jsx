import { useState } from 'react';
import { Bell, X, CheckCheck } from 'lucide-react';
const TYPE_COLORS = {
    INFO: 'bg-[#EFF6FF] border-[#BFDBFE]',
    SUCCESS: 'bg-[#F0FDF4] border-[#BBF7D0]',
    WARNING: 'bg-[#FFF7ED] border-[#FED7AA]',
    ERROR: 'bg-[#FEF2F2] border-[#FECACA]',
};
const TYPE_DOT = {
    INFO: 'bg-[#3B82F6]',
    SUCCESS: 'bg-[#16A34A]',
    WARNING: 'bg-[#EA580C]',
    ERROR: 'bg-[#DC2626]',
};
function timeAgo(iso) {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 60)
        return `il y a ${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24)
        return `il y a ${h}h`;
    return `il y a ${Math.floor(h / 24)}j`;
}
export default function NotificationBell({ notifications, onMarkAllRead }) {
    const [open, setOpen] = useState(false);
    const unread = notifications.filter(n => !n.read).length;
    return (<div className="relative">
      <button onClick={() => setOpen(!open)} className="relative p-2 rounded-lg hover:bg-[#EBF2F9] transition-colors">
        <Bell className="w-5 h-5 text-[#4A5568]"/>
        {unread > 0 && (<span className="absolute top-1 right-1 w-4 h-4 bg-[#DC2626] rounded-full text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>)}
      </button>

      {open && (<div className="absolute right-0 top-full mt-2 w-80 bg-white border border-[#D1D9E0] rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#D1D9E0]">
            <h3 className="font-semibold text-sm text-[#172033]">Notifications</h3>
            <div className="flex items-center gap-2">
              {unread > 0 && (<button onClick={onMarkAllRead} className="text-xs text-[#1F4E79] hover:underline flex items-center gap-1">
                  <CheckCheck className="w-3 h-3"/> Tout lire
                </button>)}
              <button onClick={() => setOpen(false)} className="text-[#8898AA] hover:text-[#172033]">
                <X className="w-4 h-4"/>
              </button>
            </div>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (<div className="px-4 py-8 text-center text-[#8898AA] text-sm">Aucune notification</div>) : (notifications.map(n => (<div key={n.id} className={`px-4 py-3 border-b border-[#F4F6F8] last:border-0 ${!n.read ? 'bg-[#F8FAFC]' : ''} cursor-pointer hover:bg-[#F4F6F8] transition-colors`}>
                  <div className="flex gap-2.5">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${TYPE_DOT[n.type]}`}/>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug ${!n.read ? 'font-medium text-[#172033]' : 'text-[#4A5568]'}`}>{n.message}</p>
                      <p className="text-[11px] text-[#8898AA] mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                  </div>
                </div>)))}
          </div>
        </div>)}
    </div>);
}
