import { useEffect, useState } from 'react';
import { ShoppingBag, MessageSquare, Package, LayoutDashboard, Flag, CheckCircle } from 'lucide-react';
import { DashboardLayout, type NavItem } from '@/components/DashboardLayout';
import { useAuth } from '@/lib/auth';
import { useHashRoute, parseRoute } from '@/lib/router';
import { useToast } from '@/components/Toast';
import { createConversation, createTransaction, getConversations, getMyTransactions } from '@/lib/api';
import { BrowseView, ProductDetailModal } from './BrowseView';
import { BuyerChatView } from './BuyerChatView';
import { BuyerOrdersView } from './BuyerOrdersView';
import { BuyerPurchasedView } from './BuyerPurchasedView';
import { BuyerReportsView } from './BuyerReportsView';
import { StatCard } from '@/components/ui';
import type { Conversation, Product } from '@/lib/types';

const nav: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Browse', to: '/browse', icon: ShoppingBag },
  { label: 'Purchased', to: '/purchased', icon: CheckCircle },
  { label: 'Messages', to: '/messages', icon: MessageSquare },
  { label: 'My Orders', to: '/orders', icon: Package },
  { label: 'My Reports', to: '/reports', icon: Flag },
];

export function BuyerDashboard() {
  const { profile } = useAuth();
  const [route, navigate] = useHashRoute();
  const toast = useToast();
  const { segments } = parseRoute(route);
  const [selected, setSelected] = useState<Product | null>(null);
  const [stats, setStats] = useState({ orders: 0, messages: 0 });

  useEffect(() => {
    if (!profile) return;
    const load = async () => {
      const [orders, convs] = await Promise.all([getMyTransactions(), getConversations()]);
      setStats({ orders: orders.length, messages: convs.length });
    };
    load();
  }, [profile]);

  const root = segments[0] ?? 'dashboard';

  const startChat = async (product: Product) => {
    if (!profile) return;
    setSelected(null);
    try {
      const data = await createConversation(product.seller_id, product.id);
      const conv = data?.conversation as Conversation | undefined;
      if (conv?.id) {
        navigate(`/chat/${conv.id}`);
      } else {
        navigate('/messages');
      }
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Unable to start chat', 'error');
    }
  };

  const buyNow = async (product: Product) => {
    if (!profile) return;
    if (product.stock <= 0) { toast('Product out of stock', 'error'); return; }
    setSelected(null);
    try {
      await createTransaction({ product: product.id, agreedPrice: product.price, meeting: '', paymentMethod: 'cash' });
      toast('Order placed! The seller will confirm shortly.', 'success');
      navigate('/orders');
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Unable to place order', 'error');
    }
  };

const titleMap: Record<string, string> = {
    dashboard: 'Buyer Dashboard',
    browse: 'Browse Products',
    purchased: 'Purchased Products',
    messages: 'Messages',
    chat: 'Messages',
    orders: 'My Orders',
    reports: 'My Reports',
  };

  return (
    <DashboardLayout role="buyer" navItems={nav} title={titleMap[root] ?? 'Dashboard'}>
      {root === 'dashboard' && (
        <div className="space-y-6">
          <div className="card overflow-hidden">
            <div className="bg-gradient-to-r from-brand-500 to-brand-700 p-6 text-white">
              <h2 className="text-xl font-bold">Welcome back, {profile?.full_name?.split(' ')[0]}!</h2>
              <p className="mt-1 text-sm text-white/85">Discover trusted products and chat with sellers in real time.</p>
              <button onClick={() => navigate('/browse')} className="mt-4 rounded-xl bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur transition hover:bg-white/25">
                Start shopping
              </button>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Total orders" value={stats.orders} icon={Package} tone="brand" />
            <StatCard label="Conversations" value={stats.messages} icon={MessageSquare} tone="accent" />
            <StatCard label="Member since" value={profile ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—'} icon={ShoppingBag} tone="gold" />
          </div>
        </div>
      )}
      {root === 'browse' && <BrowseView onOpen={setSelected} />}
      {root === 'purchased' && <BuyerPurchasedView />}
      {(root === 'messages' || root === 'chat') && <BuyerChatView />}
      {root === 'orders' && <BuyerOrdersView />}
      {root === 'reports' && <BuyerReportsView />}

      <ProductDetailModal product={selected} onClose={() => setSelected(null)} onChat={startChat} onBuy={buyNow} />
    </DashboardLayout>
  );
}
