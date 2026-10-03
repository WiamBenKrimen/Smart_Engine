import { Outlet } from 'react-router-dom';
import EmployeeSidebar from './components/MainSidebar';
import NotificationBell from '../features/notifications/components/NotificationBell';
import ContextSwitcher from '../components/ContextSwitcher';
import { NOTIFICATIONS } from '../app/mockData';
import { useState } from 'react';
import { useAuth } from '../app/providers/AuthProvider';
export default function EmployeeLayout() {
    const { currentUser } = useAuth();
    const [notifs, setNotifs] = useState(NOTIFICATIONS.filter(n => n.userId === currentUser?.id));
    return (<div className="app-canvas flex h-screen overflow-hidden">
      <EmployeeSidebar />
      <div className="relative z-10 flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 flex-shrink-0 items-center justify-between gap-3 border-b border-white/70 bg-white/75 px-5 backdrop-blur-xl lg:px-8">
          <ContextSwitcher />
          <div className="flex items-center gap-3">
            <NotificationBell notifications={notifs} onMarkAllRead={() => setNotifs(prev => prev.map(n => ({ ...n, read: true })))}/>
            <div className="h-6 w-px bg-[#D1D9E0]"/>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#172033] text-xs font-bold text-white shadow-sm">
                {currentUser?.avatar}
              </div>
              <div className="hidden sm:block">
                <span className="block text-sm font-semibold text-[#172033]">{currentUser?.name}</span>
                <span className="block text-[10px] font-medium uppercase tracking-wider text-[#8898AA]">Espace personnel</span>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto px-5 py-7 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>);
}
