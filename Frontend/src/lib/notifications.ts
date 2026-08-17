import { createNotification } from './api';
import type { NotificationType } from './types';

const typeMap: Record<string, string> = {
  chat: 'CHAT',
  transaction: 'TRANSACTION',
  warning: 'WARNING',
  system: 'REPORT',
  report: 'REPORT',
  review: 'REVIEW',
};

export async function pushNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  link?: string,
) {
  try {
    // Use the backend API for notifications instead of Supabase
    await createNotification({
      user: userId,
      title,
      body,
      type: typeMap[type] || 'PRODUCT',
      link: link || undefined,
    });
  } catch (err) {
    console.error('Failed to push notification', err);
  }
}

