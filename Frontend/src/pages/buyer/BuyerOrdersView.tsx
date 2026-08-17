import { useEffect, useState } from 'react';
import { ShoppingBag, Star, MessageSquare, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/Toast';
import { EmptyState, StatusBadge, ProductImage, Avatar, Stars } from '@/components/ui';
import { formatPrice, formatDate } from '@/lib/format';
import { Modal } from '@/components/Modal';
import { pushNotification } from '@/lib/notifications';
import { useHashRoute } from '@/lib/router';
import { createConversation, createReview, getMyReviews, getMyTransactions, getTransactionById, updateTransactionStatus, updateReview } from '@/lib/api';
import type { Order } from '@/lib/types';

export function BuyerOrdersView() {
  const { session } = useAuth();
  const toast = useToast();
  const [, navigate] = useHashRoute();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewOrder, setReviewOrder] = useState<Order | null>(null);
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [myReviews, setMyReviews] = useState<Record<string, { id: string; rating: number; comment: string }>>({});

  const load = async () => {
    const myId = session?.user?.id;
    if (!myId) return;
    const [list, reviews] = await Promise.all([getMyTransactions(), getMyReviews()]);
    setOrders(list.filter((o: Order) => o.buyer_id === myId) as Order[]);
    const map: Record<string, { id: string; rating: number; comment: string }> = {};
    reviews.forEach((r: { product_id: string; id: string; rating: number; comment: string }) => {
      map[r.product_id] = { id: r.id, rating: r.rating, comment: r.comment };
    });
    setMyReviews(map);
    setLoading(false);
  };

  useEffect(() => { load(); }, [session?.user?.id]);

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

  const confirmDelivery = async (o: Order) => {
    try {
      await updateTransactionStatus(o.id, 'buyer-confirm');
      await pushNotification(o.seller_id, 'transaction', 'Buyer confirmed', `${o.product?.title} was confirmed by the buyer.`, '#/orders');
      toast('Order confirmed. Thank you!', 'success');
      load();
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Unable to confirm order', 'error');
    }
  };

  const viewDetail = async (o: Order) => {
    setDetailLoading(true);
    setDetailOrder(o);
    try {
      const full = await getTransactionById(o.id);
      if (full) setDetailOrder(full as Order);
    } catch {
      // fall back to the list item
    }
    setDetailLoading(false);
  };

  const submitReview = async (rating: number, comment: string) => {
    if (!reviewOrder) return;
    try {
      const existing = myReviews[reviewOrder.product_id];
      if (existing) {
        await updateReview(existing.id, { product: reviewOrder.product_id, rating, review: comment });
        await pushNotification(reviewOrder.seller_id, 'review', 'Review updated', `Your product review was updated to ${rating} stars.`, '#/orders');
        toast('Review updated. Thank you!', 'success');
      } else {
        await createReview({ product: reviewOrder.product_id, rating, review: comment });
        await pushNotification(
          reviewOrder.seller_id,
          'review',
          'New review received',
          `You received a ${rating}-star review.`,
          '#/orders',
        );
        toast('Review submitted. Thank you!', 'success');
      }
      setReviewOrder(null);
      load();
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Unable to submit review', 'error');
    }
  };

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="card animate-pulse p-6">Loading...</div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No purchases yet"
          description="Browse the marketplace and make your first purchase."
          action={<button onClick={() => navigate('/browse')} className="btn-primary">Browse products</button>}
        />
      ) : (
        orders.map((o) => (
          <div key={o.id} className="card p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl">
                <ProductImage url={o.product?.image_url ?? null} title={o.product?.title ?? ''} />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-ink-950">{o.product?.title}</h3>
                    <p className="mt-0.5 text-xs text-ink-500">Qty {o.quantity} · {formatPrice(o.unit_price)} each</p>
                  </div>
                  <StatusBadge status={o.status} />
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs text-ink-500">
                  <Avatar name={o.seller?.full_name ?? ''} url={o.seller?.avatar_url} size="xs" />
                  {o.seller?.full_name}
                  <span>· {formatDate(o.created_at)}</span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
<span className="text-lg font-bold text-ink-950">{formatPrice(o.total)}</span>
                  <button onClick={() => openChat(o)} className="chip">
                    <MessageSquare className="h-3.5 w-3.5" /> Message
                  </button>
                  <button onClick={() => viewDetail(o)} className="chip border-brand-300 bg-brand-50 text-brand-700">
                    View details
                  </button>
                  {o.status === 'meeting_scheduled' && (
                    <button onClick={() => confirmDelivery(o)} className="btn-primary py-2 text-xs">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Confirm purchase
                    </button>
                  )}
                  {o.status === 'completed' && (
                    <button onClick={() => setReviewOrder(o)} className="chip border-gold-300 bg-gold-50 text-gold-700">
                      <Star className="h-3.5 w-3.5" /> {myReviews[o.product_id] ? 'Edit review' : 'Leave review'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))
      )}

      <Modal open={!!detailOrder} onClose={() => setDetailOrder(null)} title="Transaction details">
        {detailOrder && (
          <div className="space-y-4">
            {detailLoading ? (
              <div className="flex justify-center py-8 text-ink-400"><Loader2 className="h-5 w-5 animate-spin" /></div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-xl bg-ink-50 p-3">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg">
                    <ProductImage url={detailOrder.product?.image_url ?? null} title={detailOrder.product?.title ?? ''} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink-900">{detailOrder.product?.title}</p>
                    <p className="text-xs text-ink-500">{formatPrice(detailOrder.total)} · Qty {detailOrder.quantity}</p>
                  </div>
                  <StatusBadge status={detailOrder.status} />
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl border border-ink-200 p-3">
                    <p className="text-xs font-semibold uppercase text-ink-400">Order ID</p>
                    <p className="mt-1 break-all text-xs text-ink-700">{detailOrder.id}</p>
                  </div>
                  <div className="rounded-xl border border-ink-200 p-3">
                    <p className="text-xs font-semibold uppercase text-ink-400">Placed</p>
                    <p className="mt-1 text-xs text-ink-700">{formatDate(detailOrder.created_at)}</p>
                  </div>
                  <div className="rounded-xl border border-ink-200 p-3">
                    <p className="text-xs font-semibold uppercase text-ink-400">Seller</p>
                    <p className="mt-1 text-xs text-ink-700">{detailOrder.seller?.full_name ?? '—'}</p>
                  </div>
                  <div className="rounded-xl border border-ink-200 p-3">
                    <p className="text-xs font-semibold uppercase text-ink-400">Unit price</p>
                    <p className="mt-1 text-xs text-ink-700">{formatPrice(detailOrder.unit_price)}</p>
                  </div>
                  <div className="rounded-xl border border-ink-200 p-3">
                    <p className="text-xs font-semibold uppercase text-ink-400">Total</p>
                    <p className="mt-1 font-semibold text-ink-900">{formatPrice(detailOrder.total)}</p>
                  </div>
                  <div className="rounded-xl border border-ink-200 p-3">
                    <p className="text-xs font-semibold uppercase text-ink-400">Status</p>
                    <p className="mt-1 capitalize text-ink-700">{detailOrder.status.replace(/_/g, ' ')}</p>
                  </div>
                </div>

                <div className="flex justify-end gap-2 border-t border-ink-200 pt-4">
                  <button onClick={() => setDetailOrder(null)} className="btn-secondary">Close</button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <ReviewModal
        order={reviewOrder}
        existing={reviewOrder ? myReviews[reviewOrder.product_id] : undefined}
        onClose={() => setReviewOrder(null)}
        onSubmit={submitReview}
      />
    </div>
  );
}

function ReviewModal({
  order,
  existing,
  onClose,
  onSubmit,
}: {
  order: Order | null;
  existing?: { id: string; rating: number; comment: string };
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => void;
}) {
  const [rating, setRating] = useState(existing?.rating ?? 5);
  const [comment, setComment] = useState(existing?.comment ?? '');
  useEffect(() => { setRating(existing?.rating ?? 5); setComment(existing?.comment ?? ''); }, [order, existing]);

  return (
    <Modal open={!!order} onClose={onClose} title={existing ? 'Edit your review' : 'Leave a review'}>
      {order && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-xl bg-ink-50 p-3">
            <div className="h-12 w-12 overflow-hidden rounded-lg">
              <ProductImage url={order.product?.image_url ?? null} title={order.product?.title ?? ''} />
            </div>
            <p className="text-sm font-medium text-ink-900">{order.product?.title}</p>
          </div>
          <div>
            <label className="label">Rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <button key={i} onClick={() => setRating(i)} className="transition hover:scale-110">
                  <Star className={`h-8 w-8 ${i <= rating ? 'fill-gold-400 text-gold-400' : 'fill-ink-200 text-ink-200'}`} />
                </button>
              ))}
            </div>
            <div className="mt-1"><Stars rating={rating} size={16} /></div>
          </div>
          <div>
            <label className="label">Comment</label>
            <textarea
              className="input min-h-24 resize-none"
              placeholder="Share your experience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="btn-secondary">Cancel</button>
            <button onClick={() => onSubmit(rating, comment)} className="btn-gold">{existing ? 'Update review' : 'Submit review'}</button>
          </div>
        </div>
      )}
    </Modal>
  );
}
