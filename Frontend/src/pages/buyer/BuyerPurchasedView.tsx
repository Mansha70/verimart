import { useEffect, useState } from 'react';
import { ShoppingBag, MessageSquare, Star, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/Toast';
import { EmptyState, ProductImage, StatusBadge } from '@/components/ui';
import { formatPrice, formatDate } from '@/lib/format';
import { useHashRoute } from '@/lib/router';
import { createConversation, getMyTransactions } from '@/lib/api';
import type { Order } from '@/lib/types';

export function BuyerPurchasedView() {
  const { session } = useAuth();
  const toast = useToast();
  const [, navigate] = useHashRoute();
  const myId = session?.user?.id;
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!myId) return;
    const load = async () => {
      const list = await getMyTransactions();
      setOrders(list.filter((o: Order) => o.buyer_id === myId) as Order[]);
      setLoading(false);
    };
    load();
  }, [myId]);

  const openChat = async (o: Order) => {
    if (!o.conversation_id) {
      try {
        const data = await createConversation(o.seller_id, o.product_id);
        const conv = data?.conversation as { id?: string } | undefined;
        if (conv?.id) {
          navigate(`/chat/${conv.id}`);
          return;
        }
      } catch (error) {
        toast(error instanceof Error ? error.message : 'Unable to open chat', 'error');
        return;
      }
    }
    navigate(`/chat/${o.conversation_id}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-600">{orders.length} purchased product{orders.length !== 1 ? 's' : ''}</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-10 text-ink-400"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No purchases yet"
          description="Products you buy will appear here so you can track and review them."
          action={<button onClick={() => navigate('/browse')} className="btn-primary">Browse products</button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {orders.map((o) => (
            <div key={o.id} className="card overflow-hidden">
              <div className="relative aspect-square">
                <ProductImage url={o.product?.image_url ?? null} title={o.product?.title ?? ''} />
                <div className="absolute right-2 top-2"><StatusBadge status={o.status} /></div>
              </div>
              <div className="p-4">
                <h3 className="line-clamp-1 text-sm font-semibold text-ink-950">{o.product?.title ?? 'Product'}</h3>
                <p className="mt-0.5 text-xs text-ink-500">Purchased {formatDate(o.created_at)}</p>
                <p className="mt-2 text-lg font-bold text-ink-950">{formatPrice(o.total)}</p>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => openChat(o)} className="btn-secondary flex-1 py-2 text-xs">
                    <MessageSquare className="h-3.5 w-3.5" /> Message
                  </button>
                  <button onClick={() => navigate('/orders')} className="btn-ghost flex-1 py-2 text-xs">
                    <Star className="h-3.5 w-3.5" /> Review
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
