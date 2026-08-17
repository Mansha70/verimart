import { useEffect, useState } from 'react';
import { Search, Ban, ShieldCheck, AlertTriangle, Users as UsersIcon } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/Toast';
import { Avatar, TrustBadge, EmptyState } from '@/components/ui';
import { Modal } from '@/components/Modal';
import { pushNotification } from '@/lib/notifications';
import { formatDate } from '@/lib/format';
import { getAllUsers, updateUserStatus, createWarning } from '@/lib/api';
import type { Profile } from '@/lib/types';

export function AdminUsersView() {
  const { profile: me } = useAuth();
  const toast = useToast();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'buyer' | 'seller' | 'admin'>('all');
  const [warnTarget, setWarnTarget] = useState<Profile | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getAllUsers();
      const filtered = data.filter((u: Profile) => {
        if (roleFilter !== 'all' && u.role !== roleFilter) return false;
        if (query.trim() && !u.full_name.toLowerCase().includes(query.trim().toLowerCase())) return false;
        return true;
      });
      setUsers(filtered as Profile[]);
    } catch {
      setUsers([]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [roleFilter]);

  const toggleBlock = async (u: Profile) => {
    const next = !u.is_blocked;
    try {
      await updateUserStatus(u.id, next);
      await pushNotification(u.id, 'system', next ? 'Account blocked' : 'Account restored', next ? 'Your account has been blocked by admin.' : 'Your account has been restored.', '#/dashboard');
      toast(next ? 'Seller blocked' : 'Seller unblocked', 'success');
      load();
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Unable to update user status', 'error');
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input className="input pl-10" placeholder="Search by name..." value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()} />
          </div>
          <select className="input sm:w-40" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}>
            <option value="all">All roles</option>
            <option value="buyer">Buyers</option>
            <option value="seller">Sellers</option>
            <option value="admin">Admins</option>
          </select>
          <button onClick={load} className="btn-primary sm:w-28">Search</button>
        </div>
      </div>

      {loading ? (
        <div className="card animate-pulse p-6">Loading...</div>
      ) : users.length === 0 ? (
        <EmptyState icon={UsersIcon} title="No users found" />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-ink-200 bg-ink-50 text-left text-xs font-semibold uppercase tracking-wider text-ink-500">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Trust</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {users.map((u) => (
                  <tr key={u.id} className="transition hover:bg-ink-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar name={u.full_name} url={u.avatar_url} size="sm" />
                        <span className="font-medium text-ink-900">{u.full_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3"><span className="badge bg-ink-100 text-ink-600 capitalize">{u.role}</span></td>
                    <td className="px-4 py-3">{u.role === 'seller' ? <TrustBadge score={u.trust_score} size="sm" /> : '—'}</td>
                    <td className="px-4 py-3">
                      {u.is_blocked ? <span className="badge bg-red-100 text-red-700">Blocked</span> : <span className="badge bg-brand-100 text-brand-700">Active</span>}
                    </td>
                    <td className="px-4 py-3 text-ink-500">{formatDate(u.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        {u.role === 'seller' && u.id !== me?.id && (
                          <button onClick={() => setWarnTarget(u)} className="btn-ghost py-1.5 text-xs text-gold-700 hover:bg-gold-50">
                            <AlertTriangle className="h-3.5 w-3.5" /> Warn
                          </button>
                        )}
                        {u.role === 'seller' && u.id !== me?.id && (
                          <button onClick={() => toggleBlock(u)} className={`btn-ghost py-1.5 text-xs ${u.is_blocked ? 'text-brand-700 hover:bg-brand-50' : 'text-red-600 hover:bg-red-50'}`}>
                            {u.is_blocked ? <><ShieldCheck className="h-3.5 w-3.5" /> Unblock</> : <><Ban className="h-3.5 w-3.5" /> Block</>}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <WarnModal target={warnTarget} onClose={() => setWarnTarget(null)} onSent={() => { setWarnTarget(null); load(); }} />
    </div>
  );
}

function WarnModal({ target, onClose, onSent }: { target: Profile | null; onClose: () => void; onSent: () => void }) {
  const toast = useToast();
  const [reason, setReason] = useState('');
  const [severity, setSeverity] = useState<'minor' | 'major' | 'critical'>('minor');
  const [sending, setSending] = useState(false);
  useEffect(() => { setReason(''); setSeverity('minor'); }, [target]);

  const send = async () => {
    if (!target || !reason.trim()) { toast('Reason is required', 'error'); return; }
    setSending(true);
    try {
      await createWarning({ sellerId: target.id, reason: reason.trim(), severity });
      await pushNotification(target.id, 'warning', 'You received a warning', `Severity: ${severity}. ${reason.slice(0, 80)}`, '#/warnings');
      toast('Warning issued.', 'success');
      setSending(false);
      onSent();
    } catch (error) {
      setSending(false);
      toast(error instanceof Error ? error.message : 'Unable to issue warning', 'error');
    }
  };

  return (
    <Modal open={!!target} onClose={onClose} title="Issue warning">
      {target && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-xl bg-ink-50 p-3">
            <Avatar name={target.full_name} url={target.avatar_url} size="md" />
            <div>
              <p className="text-sm font-semibold text-ink-900">{target.full_name}</p>
              <p className="text-xs text-ink-500">Current trust: {target.trust_score}/100 · {target.warnings_count} warnings</p>
            </div>
          </div>
          <div>
            <label className="label">Severity</label>
            <div className="grid grid-cols-3 gap-2">
              {(['minor', 'major', 'critical'] as const).map((s) => (
                <button key={s} onClick={() => setSeverity(s)} className={`rounded-xl border px-3 py-2 text-sm font-medium capitalize transition ${
                  severity === s ? 'border-gold-300 bg-gold-50 text-gold-700' : 'border-ink-200 text-ink-600 hover:bg-ink-50'
                }`}>
                  {s}
                  <span className="block text-[10px] text-ink-400">{s === 'minor' ? '-5 pts' : s === 'major' ? '-15 pts' : '-30 pts'}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Reason</label>
            <textarea className="input min-h-24 resize-none" placeholder="Describe the violation..." value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
          <div className="rounded-lg bg-gold-50 p-3 text-xs text-gold-800">
            <AlertTriangle className="mr-1 inline h-3.5 w-3.5" />
            3+ unresolved warnings, a critical warning, or score hitting 0 will auto-block this seller.
          </div>
          <div className="flex justify-end gap-2 border-t border-ink-200 pt-4">
            <button onClick={onClose} className="btn-secondary">Cancel</button>
            <button onClick={send} className="btn-gold" disabled={sending}>Issue warning</button>
          </div>
        </div>
      )}
    </Modal>
  );
}

