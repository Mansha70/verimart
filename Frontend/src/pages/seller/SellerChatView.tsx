import { useEffect, useState } from 'react';
import { MessageSquare, Loader2, AlertTriangle, ShieldCheck, TrendingUp } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { ChatPanel, ConversationListItem } from '@/components/ChatPanel';
import { EmptyState } from '@/components/ui';
import { formatDate } from '@/lib/format';
import { useHashRoute } from '@/lib/router';
import { getConversations, getMessages, getWarnings } from '@/lib/api';
import type { Conversation, Message, Warning } from '@/lib/types';

export function SellerChatView() {
  const { session } = useAuth();
  const myId = session?.user?.id;
  const [route, navigate] = useHashRoute();
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [lastMsgs, setLastMsgs] = useState<Record<string, Message | null>>({});

  useEffect(() => {
    if (!myId) return;
    const load = async () => {
      const list = await getConversations();
 const filtered = list.filter((c: Conversation) => c.seller_id === myId || c.buyer_id === myId);
      setConvs(filtered as Conversation[]);
      setLoading(false);
      if (filtered.length) {
        const map: Record<string, Message | null> = {};
        for (const c of filtered) {
          const msgs = await getMessages(c.id);
          const last = msgs.at(-1) ?? null;
          if (last) map[c.id] = last as Message;
        }
        setLastMsgs(map);
      }
    };
    load();
  }, [myId]);

  useEffect(() => {
    const seg = route.split('/').filter(Boolean);
    if (seg[0] === 'chat' && seg[1]) setActiveId(seg[1]);
  }, [route]);

  const active = convs.find((c) => c.id === activeId) ?? null;

  return (
    <div className="card flex h-[calc(100vh-8rem)] overflow-hidden">
      <div className={`w-full border-r border-ink-200 lg:w-80 ${active ? 'hidden lg:block' : ''}`}>
        <div className="border-b border-ink-200 px-4 py-3"><h2 className="text-sm font-semibold text-ink-950">Buyer messages</h2></div>
        <div className="h-[calc(100%-3rem)] overflow-y-auto p-2 scrollbar-thin">
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-ink-400" /></div>
          ) : convs.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-ink-400">
              <MessageSquare className="mx-auto mb-2 h-8 w-8 text-ink-300" /> No conversations yet
            </div>
          ) : (
            convs.map((c) => (
              <ConversationListItem key={c.id} conv={c} active={c.id === activeId} onClick={() => { setActiveId(c.id); navigate(`/chat/${c.id}`); }} myId={myId ?? ''} lastMessage={lastMsgs[c.id]} />
            ))
          )}
        </div>
      </div>
      <div className={`flex-1 ${active ? '' : 'hidden lg:block'}`}>
        {active ? <ChatPanel conversation={active} onBack={() => { setActiveId(null); navigate('/messages'); }} /> : (
          <div className="flex h-full items-center justify-center"><EmptyState icon={MessageSquare} title="Select a conversation" description="Choose a chat from the list to reply to buyers." /></div>
        )}
      </div>
    </div>
  );
}

export function SellerWarningsView() {
  const { session, profile } = useAuth();
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user?.id) return;
    const load = async () => {
      try {
        const data = await getWarnings();
        setWarnings(data as Warning[]);
      } catch {
        setWarnings([]);
      }
      setLoading(false);
    };
    load();
  }, [session?.user?.id]);

 const score = profile?.trust_score ?? 100;
  const TrustIcon = score >= 80 ? ShieldCheck : score >= 50 ? TrendingUp : AlertTriangle;
  const scoreBg = score >= 80 ? 'from-brand-500 to-brand-700' : score >= 50 ? 'from-gold-500 to-gold-700' : 'from-red-500 to-red-700';

  return (
    <div className="space-y-6">
      {/* Trust score card */}
      <div className="card overflow-hidden">
        <div className={`bg-gradient-to-r ${scoreBg} p-6 text-white`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/85">Your trust score</p>
              <p className="mt-1 text-4xl font-bold">{score}<span className="text-lg text-white/70">/100</span></p>
            </div>
            <TrustIcon className="h-12 w-12 opacity-90" />
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/25">
            <div className="h-full rounded-full bg-white transition-all" style={{ width: `${score}%` }} />
          </div>
          <p className="mt-2 text-xs text-white/80">
            {profile?.is_blocked ? 'Your account is blocked. Contact support.' : 'Maintain good practices to keep your score high.'}
          </p>
        </div>
      </div>

      {/* Warnings list */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-ink-900">Warning history</h3>
        {loading ? (
          <div className="card animate-pulse p-6">Loading...</div>
        ) : warnings.length === 0 ? (
          <EmptyState icon={ShieldCheck} title="No warnings" description="Keep up the good work — your record is clean." />
        ) : (
          <div className="space-y-3">
            {warnings.map((w) => (
              <div key={w.id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                      w.severity === 'critical' ? 'bg-red-100 text-red-600' :
                      w.severity === 'major' ? 'bg-gold-100 text-gold-600' : 'bg-ink-100 text-ink-500'
                    }`}>
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`badge ${
                          w.severity === 'critical' ? 'bg-red-100 text-red-700' :
                          w.severity === 'major' ? 'bg-gold-100 text-gold-700' : 'bg-ink-100 text-ink-600'
                        }`}>{w.severity}</span>
                        {w.is_resolved && <span className="badge bg-brand-100 text-brand-700">Resolved</span>}
                      </div>
                      <p className="mt-2 text-sm text-ink-800">{w.reason}</p>
                      <p className="mt-1 text-xs text-ink-400">Issued by {w.issuer?.full_name ?? 'Admin'} · {new Date(w.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
