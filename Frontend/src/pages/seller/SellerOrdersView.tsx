import { useEffect, useState } from 'react';
import { Package, MessageSquare, Loader2, Check, X, CalendarClock } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/Toast';
import { EmptyState, StatusBadge, ProductImage, Avatar } from '@/components/ui';
import { formatPrice, formatDate } from '@/lib/format';
import { pushNotification } from '@/lib/notifications';
import { useHashRoute } from '@/lib/router';
import { Modal } from '@/components/Modal';
import { createConversation, getMyTransactions, getTransactionById, updateTransactionStatus } from '@/lib/api';
import type { Order } from '@/lib/types';

export function SellerOrdersView() {
  const { session } = useAuth();
  const toast = useToast();
  const [, navigate] = useHashRoute();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [meetingOrder, setMeetingOrder] = useState<Order | null>(null);
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

const load = async () => {
    const myId = session?.user?.id;
    if (!myId) return;
    const list = await getMyTransactions();
    setOrders(list.filter((o: Order) => o.seller_id === myId) as Order[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [session?.user?.id]);

  const openChat = async (o: Order) => {
    if (!o.conversation_id) {
      try {
        const data = await createConversation(o.buyer_id, o.product_id);
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

  const accept = async (o: Order) => {
    try {
      await updateTransactionStatus(o.id, 'accept');
      await pushNotification(o.buyer_id, 'transaction', 'Order accepted', `Your order for ${o.product?.title} was accepted.`, '#/orders');
      toast('Order accepted', 'success');
      load();
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Unable to accept order', 'error');
    }
  };

  const reject = async (o: Order) => {
    if (!confirm('Reject this order?')) return;
    try {
      await updateTransactionStatus(o.id, 'reject');
      await pushNotification(o.buyer_id, 'transaction', 'Order rejected', `Your order for ${o.product?.title} was rejected by the seller.`, '#/orders');
      toast('Order rejected', 'success');
      load();
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Unable to reject order', 'error');
    }
  };

const scheduleMeeting = async (o: Order, meeting: string, date: string, time: string) => {
    try {
      await updateTransactionStatus(o.id, 'meeting', { meeting, date, time });
      await pushNotification(o.buyer_id, 'transaction', 'Meeting scheduled', `A meeting for ${o.product?.title} is scheduled on ${date} at ${time}.`, '#/orders');
      toast('Meeting scheduled', 'success');
      load();
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Unable to schedule meeting', 'error');
    }
  };

const confirmDelivered = async (o: Order) => {
    try {
      await updateTransactionStatus(o.id, 'seller');
      await pushNotification(o.buyer_id, 'transaction', 'Order completed', `Thank you! Your order for ${o.product?.title} is complete.`, '#/orders');
      toast('Order confirmed as delivered', 'success');
      load();
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Unable to confirm', 'error');
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

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="flex justify-center py-10 text-ink-400"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : orders.length === 0 ? (
        <EmptyState icon={Package} title="No orders yet" description="When buyers purchase your products, orders will appear here." />
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
                    <p className="mt-0.5 text-xs text-ink-500">Qty {o.quantity} · {formatDate(o.created_at)}</p>
                  </div>
                  <StatusBadge status={o.status} />
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs text-ink-500">
                  <Avatar name={o.buyer?.full_name ?? ''} url={o.buyer?.avatar_url} size="xs" />
                  {o.buyer?.full_name}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
<span className="text-lg font-bold text-ink-950">{formatPrice(o.total)}</span>
                  <button onClick={() => openChat(o)} className="chip">
                    <MessageSquare className="h-3.5 w-3.5" /> Message buyer
                  </button>
                  <button onClick={() => viewDetail(o)} className="chip border-brand-300 bg-brand-50 text-brand-700">
                    View details
                  </button>
                  {o.status === 'requested' && (
                    <>
                      <button onClick={() => accept(o)} className="btn-primary py-2 text-xs">
                        <Check className="h-3.5 w-3.5" /> Accept
                      </button>
                      <button onClick={() => reject(o)} className="btn-ghost py-2 text-xs text-red-600 hover:bg-red-50">
                        <X className="h-3.5 w-3.5" /> Reject
                      </button>
                    </>
                  )}
                  {o.status === 'accepted' && (
                    <button onClick={() => setMeetingOrder(o)} className="btn-primary py-2 text-xs">
                      <CalendarClock className="h-3.5 w-3.5" /> Schedule meeting
                    </button>
                  )}
                  {o.status === 'meeting_scheduled' && (
                    <button onClick={() => confirmDelivered(o)} className="btn-primary py-2 text-xs">
                      <Check className="h-3.5 w-3.5" /> Confirm delivery
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))
      )}

<MeetingModal
        order={meetingOrder}
        onClose={() => setMeetingOrder(null)}
        onSchedule={scheduleMeeting}
      />

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
                    <p className="text-xs font-semibold uppercase text-ink-400">Buyer</p>
                    <p className="mt-1 text-xs text-ink-700">{detailOrder.buyer?.full_name ?? '—'}</p>
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
    </div>
  );
}

function MeetingModal({
  order,
  onClose,
  onSchedule,
}: {
  order: Order | null;
  onClose: () => void;
  onSchedule: (o: Order, meeting: string, date: string, time: string) => void;
}) {
  const [meeting, setMeeting] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  useEffect(() => { setMeeting(''); setDate(''); setTime(''); }, [order]);

  return (
    <Modal open={!!order} onClose={onClose} title="Schedule a meeting">
      {order && (
        <div className="space-y-4">
          <div className="rounded-xl bg-ink-50 p-3">
            <p className="text-sm font-medium text-ink-900">{order.product?.title}</p>
            <p className="text-xs text-ink-500">Buyer: {order.buyer?.full_name}</p>
          </div>
          <div>
            <label className="label">Meeting location</label>
            <input className="input" placeholder="e.g. City mall, coffee shop..." value={meeting} onChange={(e) => setMeeting(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Date</label>
              <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <label className="label">Time</label>
              <input type="time" className="input" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-ink-200 pt-4">
            <button onClick={onClose} className="btn-secondary">Cancel</button>
            <button onClick={() => meeting && date && time ? onSchedule(order, meeting, date, time) : null} className="btn-primary">
              Schedule
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
