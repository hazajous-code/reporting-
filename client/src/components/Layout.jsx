import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, CalendarRange, MessageSquare, Bell, LogOut, Menu, X } from 'lucide-react';

const NAV_ITEMS = {
  staff: [
    { to: '/', icon: LayoutDashboard, label: '대시보드' },
    { to: '/cycles', icon: CalendarRange, label: '보고 사이클' },
    { to: '/feedback', icon: MessageSquare, label: '피드백' },
    { to: '/reminders', icon: Bell, label: '알림' },
  ],
  leader: [
    { to: '/', icon: LayoutDashboard, label: '대시보드' },
    { to: '/cycles', icon: CalendarRange, label: '보고 사이클' },
    { to: '/feedback', icon: MessageSquare, label: '피드백' },
    { to: '/reminders', icon: Bell, label: '알림' },
  ],
  strategy: [
    { to: '/', icon: LayoutDashboard, label: '대시보드' },
    { to: '/cycles', icon: CalendarRange, label: '보고 사이클' },
    { to: '/feedback', icon: MessageSquare, label: '피드백' },
    { to: '/reminders', icon: Bell, label: '알림' },
  ],
  executive: [
    { to: '/', icon: LayoutDashboard, label: '대시보드' },
    { to: '/cycles', icon: CalendarRange, label: '보고 사이클' },
    { to: '/feedback', icon: MessageSquare, label: '피드백' },
  ],
};

const ROLE_COLORS = {
  staff: 'bg-emerald-600',
  leader: 'bg-[var(--color-accent)]',
  strategy: 'bg-violet-600',
  executive: 'bg-gray-800',
};

const ROLE_LABELS = {
  staff: '현업 담당자',
  leader: '실장',
  strategy: '전략기획팀',
  executive: '임원',
};

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const items = NAV_ITEMS[user?.role] || NAV_ITEMS.staff;

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="min-h-screen flex bg-[var(--color-bg)]">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/20 z-40 lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-[260px] bg-[var(--color-surface)] border-r border-[var(--color-border-light)]
        transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col
      `}>
        <div className="h-16 flex items-center px-5 border-b border-[var(--color-border-light)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[var(--color-accent)] rounded-lg flex items-center justify-center shadow-sm">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <span className="text-base font-bold text-[var(--color-text)] tracking-tight">WeeklyFlow</span>
          </div>
          <button className="ml-auto lg:hidden p-1 hover:bg-[var(--color-surface-secondary)] rounded-lg" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5 text-[var(--color-text-secondary)]" />
          </button>
        </div>

        <div className="px-4 py-5">
          <div className="flex items-center gap-3 p-3 bg-[var(--color-surface-secondary)] rounded-xl">
            <div className={`w-9 h-9 rounded-full ${ROLE_COLORS[user?.role]} flex items-center justify-center text-white font-semibold text-sm shrink-0`}>
              {user?.name?.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-sm text-[var(--color-text)] truncate">{user?.name}</div>
              <div className="text-xs text-[var(--color-text-secondary)] truncate">
                {ROLE_LABELS[user?.role]} {user?.department_name ? `· ${user.department_name}` : ''}
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-0.5">
          {items.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === '/'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150
                ${isActive
                  ? 'bg-[var(--color-accent-light)] text-[var(--color-accent)]'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] hover:text-[var(--color-text)]'
                }`
              }
            >
              <Icon className="w-[18px] h-[18px] shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-[var(--color-border-light)]">
          <button onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-[13px] font-medium
              text-[var(--color-text-secondary)] hover:bg-[var(--color-danger-light)] hover:text-[var(--color-danger)] transition-all duration-150">
            <LogOut className="w-[18px] h-[18px]" />
            로그아웃
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-[var(--color-surface)]/80 backdrop-blur-md border-b border-[var(--color-border-light)] flex items-center px-4 lg:px-8 sticky top-0 z-30">
          <button className="lg:hidden mr-3 p-1.5 hover:bg-[var(--color-surface-secondary)] rounded-lg" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5 text-[var(--color-text-secondary)]" />
          </button>
        </header>
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
