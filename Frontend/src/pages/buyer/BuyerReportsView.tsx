import { useEffect, useState } from 'react';
import { Flag, Loader2 } from 'lucide-react';
import { EmptyState } from '@/components/ui';
import { formatDate } from '@/lib/format';
import { getMyReports } from '@/lib/api';
import type { Report } from '@/lib/types';

const statusColor: Record<string, string> = {
  pending: 'bg-gold-100 text-gold-700',
  open: 'bg-gold-100 text-gold-700',
  resolved: 'bg-brand-100 text-brand-700',
  rejected: 'bg-red-100 text-red-700',
  dismissed: 'bg-ink-100 text-ink-600',
};

export function BuyerReportsView() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const data = await getMyReports();
      setReports(data as Report[]);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-600">{reports.length} report{reports.length !== 1 ? 's' : ''} submitted</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-ink-400" /></div>
      ) : reports.length === 0 ? (
        <EmptyState icon={Flag} title="No reports submitted" description="When you report a seller after a completed transaction, it will appear here." />
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
                      <span className={`badge ${statusColor[r.status] ?? 'bg-ink-100 text-ink-600'}`}>{r.status}</span>
                    </div>
                    <p className="mt-2 text-sm text-ink-800">{r.reason}</p>
                    {r.description && <p className="mt-1 text-xs text-ink-500">{r.description}</p>}
                    <p className="mt-2 text-xs text-ink-400">Submitted {formatDate(r.created_at)}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
