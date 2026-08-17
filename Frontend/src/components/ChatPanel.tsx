import { useEffect, useRef, useState } from 'react';
import { Send, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/Toast';
import { Avatar } from '@/components/ui';
import { formatTime } from '@/lib/format';
import { pushNotification } from '@/lib/notifications';
import { getMessages, sendMessage } from '@/lib/api';
import type { Conversation, Message } from '@/lib/types';

export function ChatPanel({
  conversation,
  onBack,
}: {
  conversation: Conversation;
  onBack?: () => void;
}) {
  const { session } = useAuth();
  const toast = useToast();
  const myId = session?.user?.id;
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const other =
    conversation.buyer_id === myId
      ? conversation.seller
      : conversation.buyer;

  useEffect(() => {
    if (!conversation.id) return;
    const load = async () => {
      const data = await getMessages(conversation.id);
      setMessages(data as Message[]);
      setLoading(false);
    };
    load();
    const interval = window.setInterval(() => {
      load();
    }, 4000);
    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = text.trim();
    if (!content || !myId) return;
    setSending(true);
    try {
      await sendMessage(conversation.id, content);
      const recipientId = conversation.buyer_id === myId ? conversation.seller_id : conversation.buyer_id;
      await pushNotification(recipientId, 'chat', 'New message', `${content.slice(0, 80)}`, `#/chat/${conversation.id}`);
      setText('');
      const fresh = await getMessages(conversation.id);
      setMessages(fresh as Message[]);
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Unable to send message', 'error');
    }
    setSending(false);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-ink-200 bg-white px-4 py-3">
        {onBack && (
          <button onClick={onBack} className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-100 lg:hidden">
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <Avatar name={other?.full_name ?? 'User'} url={other?.avatar_url} size="md" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink-950">{other?.full_name ?? 'User'}</p>
          <p className="truncate text-xs text-ink-500">Re: {conversation.product?.title}</p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-ink-50 p-4 scrollbar-thin">
        {loading ? (
          <div className="flex h-full items-center justify-center text-ink-400">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-sm text-ink-400">
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-ink-100 text-2xl">
              💬
            </div>
            Start the conversation
            <p className="mt-1 text-xs">Say hello about this product.</p>
          </div>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === myId;
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                    mine
                      ? 'rounded-br-sm bg-brand-600 text-white'
                      : 'rounded-bl-sm bg-white text-ink-900 shadow-soft'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{m.content}</p>
                  <p className={`mt-1 text-[10px] ${mine ? 'text-white/70' : 'text-ink-400'}`}>
                    {formatTime(m.created_at)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Composer */}
      <form onSubmit={send} className="flex items-center gap-2 border-t border-ink-200 bg-white p-3">
        <input
          className="input flex-1"
          placeholder="Type a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={sending}
        />
        <button type="submit" className="btn-primary px-3.5" disabled={sending || !text.trim()}>
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </form>
    </div>
  );
}

export function ConversationListItem({
  conv,
  active,
  onClick,
  myId,
  lastMessage,
}: {
  conv: Conversation;
  active: boolean;
  onClick: () => void;
  myId: string;
  lastMessage?: Message | null;
}) {
  const other = conv.buyer_id === myId ? conv.seller : conv.buyer;
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
        active ? 'bg-brand-50 ring-1 ring-brand-200' : 'hover:bg-ink-100'
      }`}
    >
      <Avatar name={other?.full_name ?? 'User'} url={other?.avatar_url} size="md" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-semibold text-ink-900">{other?.full_name}</p>
          {lastMessage && (
            <span className="shrink-0 text-[10px] text-ink-400">{formatTime(lastMessage.created_at)}</span>
          )}
        </div>
        <p className="truncate text-xs text-ink-500">{conv.product?.title}</p>
        {lastMessage && (
          <p className="mt-0.5 truncate text-xs text-ink-400">
            {lastMessage.sender_id === myId ? 'You: ' : ''}
            {lastMessage.content}
          </p>
        )}
      </div>
      {lastMessage && !lastMessage.read_at && lastMessage.sender_id !== myId && (
        <span className="h-2 w-2 shrink-0 rounded-full bg-brand-500" />
      )}
    </button>
  );
}
