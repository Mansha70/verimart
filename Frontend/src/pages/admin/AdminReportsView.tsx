import { useEffect, useState } from 'react';
import { Flag, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { Avatar, EmptyState, StatusBadge } from '@/components/ui';
import { Modal } from '@/components/Modal';
import { pushNotification } from '@/lib/notifications';
import { formatDate } from '@/lib/format';
import { getReports, rejectReport, resolveReport } from '@/lib/api';
import type { Report } from '@/lib/types';

export function AdminReportsView() {
  const toast = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<Report | null>(null);
  const [note, setNote] = useState('');

  const load = async () => {
    const data = await getReports();
    setReports(data as Report[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

const resolve = async (status: 'resolved' | 'dismissed') => {
    if (!active) return;
    try {
      if (status === 'resolved') {
        await resolveReport(active.id, note.trim());
      } else {
        await rejectReport(active.id, note.trim());
      }
      await pushNotification(active.reporter_id, 'report', `Report ${status}`, `Your report has been ${status}.`, '#/dashboard');
      toast(`Report ${status}`, 'success');
      setActive(null);
      setNote('');
      load();
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Unable to update report', 'error');
    }
  };

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-ink-400" /></div>
      ) : reports.length === 0 ? (
        <EmptyState icon={Flag} title="No reports" description="When users report products or other users, they'll appear here for review." />
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <div key={r.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gold-100 text-gold-600"><Flag className="h-4 w-4" /></div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="badge bg-ink-100 text-ink-600 capitalize">{r.target_type}</span>
                      <StatusBadge status={r.status} />
                    </div>
                    <p className="mt-2 text-sm text-ink-800">{r.reason}</p>
                    <div className="mt-2 flex items-center gap-2 text-xs text-ink-500">
                      <Avatar name={r.reporter?.full_name ?? 'User'} url={r.reporter?.avatar_url} size="xs" />
                      {r.reporter?.full_name} · {formatDate(r.created_at)}
                    </div>
                  </div>
                </div>
{r.status === 'pending' && (
                  <button onClick={() => { setActive(r); setNote(r.admin_note ?? ''); }} className="btn-secondary py-2 text-xs">Review</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!active} onClose={() => setActive(null)} title="Review report">
        {active && (
          <div className="space-y-4">
            <div className="rounded-xl bg-ink-50 p-3">
              <p className="text-xs font-semibold uppercase text-ink-500">Reported {active.target_type}</p>
              <p className="mt-1 text-sm text-ink-800">{active.reason}</p>
              <p className="mt-2 text-xs text-ink-500">Reported by {active.reporter?.full_name} on {formatDate(active.created_at)}</p>
            </div>
            <div>
              <label className="label">Admin note</label>
              <textarea className="input min-h-20 resize-none" placeholder="Add a note about this decision..." value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2 border-t border-ink-200 pt-4">
              <button onClick={() => resolve('dismissed')} className="btn-secondary"><XCircle className="h-4 w-4" /> Dismiss</button>
              <button onClick={() => resolve('resolved')} className="btn-primary"><CheckCircle className="h-4 w-4" /> Resolve</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
