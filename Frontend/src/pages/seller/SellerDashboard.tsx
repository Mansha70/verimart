import { useEffect, useState } from 'react';
import { LayoutDashboard, Package, MessageSquare, Receipt, AlertTriangle, TrendingUp, DollarSign, ShoppingBag } from 'lucide-react';
import { DashboardLayout, type NavItem } from '@/components/DashboardLayout';
import { useAuth } from '@/lib/auth';
import { useHashRoute, parseRoute } from '@/lib/router';
import { StatCard } from '@/components/ui';
import { formatPrice } from '@/lib/format';
import { getMyProducts, getMyTransactions } from '@/lib/api';
import { SellerProductsView } from './SellerProductsView';
import { SellerOrdersView } from './SellerOrdersView';
import { SellerChatView, SellerWarningsView } from './SellerChatView';
import type { Order } from '@/lib/types';

const nav: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Products', to: '/products', icon: Package },
  { label: 'Messages', to: '/messages', icon: MessageSquare },
  { label: 'Orders', to: '/orders', icon: Receipt },
  { label: 'Warnings', to: '/warnings', icon: AlertTriangle },
];

export function SellerDashboard() {
  const { profile } = useAuth();
  const [route] = useHashRoute();
  const { segments } = parseRoute(route);
  const [stats, setStats] = useState({ products: 0, orders: 0, revenue: 0, pending: 0 });

  useEffect(() => {
    if (!profile) return;
const load = async () => {
      const [products, orders] = await Promise.all([getMyProducts(), getMyTransactions()]);
      const orderList = orders.filter((o: Order) => o.seller_id === profile.id);
      const revenue = orderList.filter((o: Order) => o.status === 'completed').reduce((s: number, o: Order) => s + Number(o.total), 0);
      const pending = orderList.filter((o: Order) => o.status === 'pending' || o.status === 'requested').length;
      setStats({ products: products.length, orders: orderList.length, revenue, pending });
    };
    load();
  }, [profile]);

  const root = segments[0] ?? 'dashboard';
  const blocked = profile?.is_blocked;

  const titleMap: Record<string, string> = {
    dashboard: 'Seller Dashboard',
    products: 'My Products',
    messages: 'Messages',
    chat: 'Messages',
    orders: 'Orders',
    warnings: 'Trust & Warnings',
  };

  return (
    <DashboardLayout role="seller" navItems={nav} title={titleMap[root] ?? 'Dashboard'}>
      {blocked && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Your account has been blocked</p>
            <p className="text-red-700">{profile?.blocked_reason ?? 'Contact admin support to resolve this.'}</p>
          </div>
        </div>
      )}

      {root === 'dashboard' && (
        <div className="space-y-6">
          <div className="card overflow-hidden">
            <div className="bg-gradient-to-r from-gold-500 to-gold-700 p-6 text-white">
              <h2 className="text-xl font-bold">Hello, {profile?.full_name?.split(' ')[0]}!</h2>
              <p className="mt-1 text-sm text-white/85">Here's how your store is performing today.</p>
              <div className="mt-4 flex items-center gap-2">
                <span className="text-sm text-white/85">Trust score:</span>
                <span className="rounded-lg bg-white/20 px-3 py-1 text-sm font-bold backdrop-blur">{profile?.trust_score}/100</span>
              </div>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Products" value={stats.products} icon={Package} tone="brand" />
            <StatCard label="Total orders" value={stats.orders} icon={ShoppingBag} tone="accent" />
            <StatCard label="Revenue" value={formatPrice(stats.revenue)} icon={DollarSign} tone="gold" />
            <StatCard label="Pending" value={stats.pending} icon={TrendingUp} tone="red" />
          </div>
        </div>
      )}
      {root === 'products' && <SellerProductsView />}
      {(root === 'messages' || root === 'chat') && <SellerChatView />}
      {root === 'orders' && <SellerOrdersView />}
      {root === 'warnings' && <SellerWarningsView />}
    </DashboardLayout>
  );
}
