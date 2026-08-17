import { useEffect, useState } from 'react';
import { LayoutDashboard, Users, Package, Flag, Activity, DollarSign, AlertTriangle, ShoppingBag, TrendingUp } from 'lucide-react';
import { DashboardLayout, type NavItem } from '@/components/DashboardLayout';
import { useAuth } from '@/lib/auth';
import { useHashRoute, parseRoute } from '@/lib/router';
import { StatCard } from '@/components/ui';
import { formatPrice, timeAgo } from '@/lib/format';
import { getAllUsers, getProducts, getReports, getAllTransactions } from '@/lib/api';
import { AdminUsersView } from './AdminUsersView';
import { AdminProductsView } from './AdminProductsView';
import { AdminReportsView } from './AdminReportsView';
import type { Profile, Product, Report, Order } from '@/lib/types';

const nav: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Users', to: '/users', icon: Users },
  { label: 'Products', to: '/products', icon: Package },
  { label: 'Reports', to: '/reports', icon: Flag },
];

type ActivityItem = {
  id: string;
  type: 'order' | 'product' | 'user' | 'report' | 'warning';
  label: string;
  detail: string;
  created_at: string;
};

export function AdminDashboard() {
  const { profile } = useAuth();
  const [route] = useHashRoute();
  const { segments } = parseRoute(route);
  const [stats, setStats] = useState({ users: 0, sellers: 0, products: 0, orders: 0, revenue: 0, reports: 0, blocked: 0 });
  const [activity, setActivity] = useState<ActivityItem[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [products, reports, users, transactions] = await Promise.all([getProducts(), getReports(), getAllUsers(), getAllTransactions()]);
        const sellerCount = users.filter((u: Profile) => u.role === 'seller').length;
        const blockedCount = users.filter((u: Profile) => u.is_blocked).length;
        const openReports = reports.filter((r: Report) => r.status === 'pending' || r.status === 'open').length;
        const completedOrders = transactions.filter((o: Order) => ['completed', 'delivered', 'paid', 'shipped'].includes(o.status));
        const revenue = completedOrders.reduce((s, o) => s + Number(o.total), 0);
        setStats({
          users: users.length,
          sellers: sellerCount,
          products: products.length,
          orders: transactions.length,
          revenue,
          reports: openReports,
          blocked: blockedCount,
        });
        const allActivity: ActivityItem[] = [
          ...products.slice(0, 5).map((p: Product) => ({
            id: p.id,
            type: 'product' as const,
            label: p.title,
            detail: `Listed by ${p.seller?.full_name ?? 'Seller'}`,
            created_at: p.created_at,
          })),
          ...reports.slice(0, 5).map((r: Report) => ({
            id: r.id,
            type: 'report' as const,
            label: r.reason || 'Report',
            detail: `Reported by ${r.reporter?.full_name ?? 'User'}`,
            created_at: r.created_at,
          })),
          ...transactions.slice(0, 5).map((o: Order) => ({
            id: o.id,
            type: 'order' as const,
            label: o.product?.title || 'Order',
            detail: `${o.buyer?.full_name ?? 'Buyer'} → ${o.seller?.full_name ?? 'Seller'}`,
            created_at: o.created_at,
          })),
        ];
        allActivity.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setActivity(allActivity.slice(0, 10));
      } catch {
        // fallback to empty
      }
    };
    load();
  }, []);

  const root = segments[0] ?? 'dashboard';
  const titleMap: Record<string, string> = {
    dashboard: 'Admin Dashboard',
    users: 'User Management',
    products: 'All Products',
    reports: 'Reports',
  };

  const activityIcon = { order: ShoppingBag, product: Package, user: Users, report: Flag, warning: AlertTriangle };
  const activityColor = {
    order: 'bg-brand-100 text-brand-600', product: 'bg-accent-100 text-accent-600',
    user: 'bg-gold-100 text-gold-600', report: 'bg-red-100 text-red-600', warning: 'bg-gold-100 text-gold-600',
  };

  return (
    <DashboardLayout role="admin" navItems={nav} title={titleMap[root] ?? 'Dashboard'}>
      {root === 'dashboard' && (
        <div className="space-y-6">
          <div className="card overflow-hidden">
            <div className="bg-gradient-to-r from-accent-600 to-accent-800 p-6 text-white">
              <h2 className="text-xl font-bold">Welcome, {profile?.full_name?.split(' ')[0]}</h2>
              <p className="mt-1 text-sm text-white/85">Marketplace overview and moderation controls.</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total users" value={stats.users} icon={Users} tone="accent" />
            <StatCard label="Active sellers" value={stats.sellers} icon={TrendingUp} tone="brand" />
            <StatCard label="Products" value={stats.products} icon={Package} tone="gold" />
            <StatCard label="Total orders" value={stats.orders} icon={ShoppingBag} tone="accent" />
            <StatCard label="Revenue" value={formatPrice(stats.revenue)} icon={DollarSign} tone="brand" />
            <StatCard label="Open reports" value={stats.reports} icon={Flag} tone="red" />
            <StatCard label="Blocked sellers" value={stats.blocked} icon={AlertTriangle} tone="red" />
          </div>

          {/* Activity feed */}
          <div className="card p-5">
            <div className="mb-4 flex items-center gap-2">
              <Activity className="h-4 w-4 text-ink-500" />
              <h3 className="text-sm font-semibold text-ink-900">Recent activity</h3>
            </div>
            {activity.length === 0 ? (
              <p className="py-8 text-center text-sm text-ink-400">No recent activity</p>
            ) : (
              <div className="space-y-3">
                {activity.map((a) => {
                  const Icon = activityIcon[a.type];
                  return (
                    <div key={`${a.type}-${a.id}`} className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-ink-50">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${activityColor[a.type]}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink-900">{a.label}</p>
                        <p className="truncate text-xs text-ink-500">{a.detail}</p>
                      </div>
                      <span className="shrink-0 text-xs text-ink-400">{timeAgo(a.created_at)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
      {root === 'users' && <AdminUsersView />}
      {root === 'products' && <AdminProductsView />}
      {root === 'reports' && <AdminReportsView />}
    </DashboardLayout>
  );
}
