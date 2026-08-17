import { type ReactNode } from 'react';
import { Bell, LogOut, Menu, X, Pencil } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useNotifications } from '@/lib/useNotifications';
import { useHashRoute } from '@/lib/router';
import { timeAgo } from '@/lib/format';
import { Logo, Avatar } from '@/components/ui';
import { ProfileEditModal } from '@/components/ProfileEditModal';
import type { Role } from '@/lib/types';
import type { AppNotification } from '@/lib/types';

const notifIcon: Record<AppNotification['type'], string> = {
  chat: '💬',
  transaction: '🧾',
  warning: '⚠️',
  system: '🔧',
  report: '🚩',
  review: '⭐',
};

export type NavItem = {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
};

export function DashboardLayout({
  role,
  navItems,
  children,
  title,
}: {
  role: Role;
  navItems: NavItem[];
  children: ReactNode;
  title: string;
}) {
const { profile, signOut } = useAuth();
  const [route, navigate] = useHashRoute();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { items: notifs, unread, markAllRead } = useNotifications();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileEditOpen, setProfileEditOpen] = useState(false);

  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);
  const accent =
    role === 'admin'
      ? 'from-accent-600 to-accent-800'
      : role === 'seller'
        ? 'from-gold-500 to-gold-700'
        : 'from-brand-500 to-brand-700';

  const handleNav = (to: string) => {
    navigate(to);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-ink-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-ink-950/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-ink-200 bg-white transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-ink-200 px-5">
          <Logo size="sm" />
          <button
            className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-100 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

<div className={`bg-gradient-to-br ${accent} px-5 py-4 text-white`}>
          <div className="flex items-center gap-3">
            <Avatar name={profile?.full_name ?? ''} url={profile?.avatar_url} size="md" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{profile?.full_name}</p>
              <p className="text-xs opacity-90">{roleLabel} account</p>
            </div>
            <button
              onClick={() => setProfileEditOpen(true)}
              className="rounded-lg p-2 text-white/85 transition hover:bg-white/15 hover:text-white"
              title="Edit profile"
            >
              <Pencil className="h-4 w-4" />
            </button>
          </div>
          {role === 'seller' && (
            <div className="mt-3 flex items-center justify-between rounded-lg bg-white/15 px-3 py-2">
              <span className="text-xs font-medium">Trust score</span>
              <span className="text-sm font-bold">{profile?.trust_score ?? 0}</span>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto p-3 scrollbar-thin">
          <p className="px-3 pb-2 pt-2 text-xs font-semibold uppercase tracking-wider text-ink-400">
            Menu
          </p>
          <ul className="space-y-1">
            {navItems.map((item) => {
              const active = route === item.to || route.startsWith(item.to + '/');
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <button
                    onClick={() => handleNav(item.to)}
                    className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                      active
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900'
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 ${active ? 'text-brand-600' : 'text-ink-400 group-hover:text-ink-600'}`}
                    />
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge ? (
                      <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        {item.badge}
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-ink-200 p-3">
          <button
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-600 transition hover:bg-red-50 hover:text-red-700"
          >
            <LogOut className="h-5 w-5" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-ink-200 bg-white/80 px-4 backdrop-blur-md lg:px-8">
          <button
            className="rounded-lg p-1.5 text-ink-600 hover:bg-ink-100 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="flex-1 text-lg font-semibold text-ink-950">{title}</h1>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => {
                setNotifOpen((o) => !o);
                if (!notifOpen && unread > 0) markAllRead();
              }}
              className="relative rounded-xl p-2 text-ink-600 transition hover:bg-ink-100"
            >
              <Bell className="h-5 w-5" />
              {unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white animate-pulse-ring">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>

            {notifOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setNotifOpen(false)} />
                <div className="absolute right-0 top-12 z-40 w-80 sm:w-96 animate-slide-up">
                  <div className="card overflow-hidden">
                    <div className="flex items-center justify-between border-b border-ink-200 px-4 py-3">
                      <h3 className="text-sm font-semibold">Notifications</h3>
                      {unread > 0 && (
                        <span className="badge bg-red-100 text-red-700">{unread} new</span>
                      )}
                    </div>
                    <div className="max-h-96 overflow-y-auto scrollbar-thin">
                      {notifs.length === 0 ? (
                        <div className="px-4 py-10 text-center text-sm text-ink-400">
                          No notifications yet
                        </div>
                      ) : (
                        notifs.map((n) => (
                          <button
                            key={n.id}
                            onClick={() => {
                              if (n.link) navigate(n.link);
                              setNotifOpen(false);
                            }}
                            className={`flex w-full items-start gap-3 border-b border-ink-100 px-4 py-3 text-left transition hover:bg-ink-50 ${
                              !n.is_read ? 'bg-brand-50/40' : ''
                            }`}
                          >
                            <span className="text-lg">{notifIcon[n.type]}</span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-ink-900">{n.title}</p>
                              <p className="mt-0.5 line-clamp-2 text-xs text-ink-500">{n.body}</p>
                              <p className="mt-1 text-[11px] text-ink-400">{timeAgo(n.created_at)}</p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <Avatar name={profile?.full_name ?? ''} url={profile?.avatar_url} size="sm" />
        </header>

        <main className="px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>

      <ProfileEditModal open={profileEditOpen} onClose={() => setProfileEditOpen(false)} />
    </div>
  );
}
