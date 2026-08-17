import { useEffect, useState } from 'react';
import { MessageSquare, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { ChatPanel, ConversationListItem } from '@/components/ChatPanel';
import { EmptyState } from '@/components/ui';
import { useHashRoute } from '@/lib/router';
import { getConversations, getMessages } from '@/lib/api';
import type { Conversation, Message } from '@/lib/types';

export function BuyerChatView() {
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
const filtered = list.filter((c: Conversation) => c.buyer_id === myId || c.seller_id === myId);
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

  // support deep link #/chat/:id
  useEffect(() => {
    const seg = route.split('/').filter(Boolean);
    if (seg[0] === 'chat' && seg[1]) setActiveId(seg[1]);
  }, [route]);

  const active = convs.find((c) => c.id === activeId) ?? null;

  return (
    <div className="card flex h-[calc(100vh-8rem)] overflow-hidden">
      {/* List */}
      <div className={`w-full border-r border-ink-200 lg:w-80 ${active ? 'hidden lg:block' : ''}`}>
        <div className="border-b border-ink-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-ink-950">Messages</h2>
        </div>
        <div className="h-[calc(100%-3rem)] overflow-y-auto p-2 scrollbar-thin">
          {loading ? (
            <div className="flex justify-center py-10 text-ink-400">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : convs.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-ink-400">
              <MessageSquare className="mx-auto mb-2 h-8 w-8 text-ink-300" />
              No conversations yet
            </div>
          ) : (
            convs.map((c) => (
              <ConversationListItem
                key={c.id}
                conv={c}
                active={c.id === activeId}
                onClick={() => {
                  setActiveId(c.id);
                  navigate(`/chat/${c.id}`);
                }}
                myId={myId ?? ''}
                lastMessage={lastMsgs[c.id]}
              />
            ))
          )}
        </div>
      </div>

      {/* Panel */}
      <div className={`flex-1 ${active ? '' : 'hidden lg:block'}`}>
        {active ? (
          <ChatPanel conversation={active} onBack={() => { setActiveId(null); navigate('/messages'); }} />
        ) : (
          <div className="flex h-full items-center justify-center">
            <EmptyState icon={MessageSquare} title="Select a conversation" description="Choose a chat from the list to start messaging." />
          </div>
        )}
      </div>
    </div>
  );
}
