import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '@/lib/api';
import type { AppNotification } from '@/lib/types';

export function useNotifications() {
  const { session, profile } = useAuth();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const unread = useMemo(() => items.filter((n) => !n.is_read).length, [items]);

  useEffect(() => {
    if (!session?.user?.id) {
      setItems([]);
      setLoading(false);
      return;
    }

    const load = async () => {
      const data = await getNotifications();
      setItems(data as AppNotification[]);
      setLoading(false);
    };

    load();
    const interval = window.setInterval(() => {
      load();
    }, 5000);

    return () => window.clearInterval(interval);
  }, [session?.user?.id]);

  const markAllRead = async () => {
    if (!profile) return;
    await markAllNotificationsRead();
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const markRead = async (id: string) => {
    await markNotificationRead(id);
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  return { items, unread, loading, markAllRead, markRead };
}
