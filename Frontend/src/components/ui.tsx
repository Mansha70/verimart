import { ShieldCheck, Star, Store, TrendingUp, AlertTriangle, Package } from 'lucide-react';
import { initials } from '@/lib/format';

export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dims = size === 'lg' ? 'h-10 w-10' : size === 'sm' ? 'h-7 w-7' : 'h-8 w-8';
  const text = size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-lg' : 'text-xl';
  return (
    <div className="flex items-center gap-2">
      <div className={`flex ${dims} items-center justify-center rounded-xl bg-brand-600 text-white shadow-soft`}>
        <ShieldCheck className={size === 'lg' ? 'h-6 w-6' : 'h-4 w-4'} />
      </div>
      <span className={`font-display ${text} font-bold tracking-tight text-ink-950`}>
        Veri<span className="text-brand-600">Mart</span>
      </span>
    </div>
  );
}

const palette = [
  'from-brand-400 to-brand-600',
  'from-accent-400 to-accent-600',
  'from-gold-400 to-gold-600',
  'from-rose-400 to-rose-600',
  'from-teal-400 to-teal-600',
  'from-indigo-400 to-indigo-600',
];

function pickGradient(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}

export function Avatar({
  name,
  url,
  size = 'sm',
}: {
  name: string;
  url?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}) {
  const sz = {
    xs: 'h-7 w-7 text-[10px]',
    sm: 'h-9 w-9 text-xs',
    md: 'h-11 w-11 text-sm',
    lg: 'h-14 w-14 text-base',
    xl: 'h-20 w-20 text-xl',
  }[size];

  if (url) {
    return <img src={url} alt={name} className={`${sz} rounded-full object-cover ring-2 ring-white`} />;
  }
  return (
    <div
      className={`${sz} flex items-center justify-center rounded-full bg-gradient-to-br ${pickGradient(
        name,
      )} font-semibold text-white ring-2 ring-white`}
    >
      {initials(name) || '?'}
    </div>
  );
}

export function TrustBadge({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' }) {
  const color =
    score >= 80
      ? 'bg-brand-100 text-brand-700'
      : score >= 50
        ? 'bg-gold-100 text-gold-700'
        : 'bg-red-100 text-red-700';
  const Icon = score >= 80 ? ShieldCheck : score >= 50 ? TrendingUp : AlertTriangle;
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5';
  return (
    <span className={`badge ${color}`}>
      <Icon className={iconSize} />
      {score}/100
    </span>
  );
}

export function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          style={{ width: size, height: size }}
          className={
            i <= Math.round(rating) ? 'fill-gold-400 text-gold-400' : 'fill-ink-200 text-ink-200'
          }
        />
      ))}
    </div>
  );
}

export function EmptyState({
  icon: Icon = Package,
  title,
  description,
  action,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-200 bg-white/60 px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-100 text-ink-400">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="text-base font-semibold text-ink-900">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-ink-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'brand',
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  tone?: 'brand' | 'accent' | 'gold' | 'red';
}) {
  const tones = {
    brand: 'bg-brand-50 text-brand-600',
    accent: 'bg-accent-50 text-accent-600',
    gold: 'bg-gold-50 text-gold-600',
    red: 'bg-red-50 text-red-600',
  };
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-ink-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-ink-950">{value}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: 'bg-brand-100 text-brand-700',
    paused: 'bg-ink-100 text-ink-600',
    removed: 'bg-red-100 text-red-700',
    pending: 'bg-gold-100 text-gold-700',
    paid: 'bg-accent-100 text-accent-700',
    shipped: 'bg-accent-100 text-accent-700',
    delivered: 'bg-brand-100 text-brand-700',
    cancelled: 'bg-red-100 text-red-700',
    refunded: 'bg-ink-100 text-ink-600',
    requested: 'bg-gold-100 text-gold-700',
    accepted: 'bg-accent-100 text-accent-700',
    meeting_scheduled: 'bg-ink-100 text-ink-600',
    completed: 'bg-brand-100 text-brand-700',
    rejected: 'bg-red-100 text-red-700',
    open: 'bg-gold-100 text-gold-700',
    reviewing: 'bg-accent-100 text-accent-700',
    resolved: 'bg-brand-100 text-brand-700',
    dismissed: 'bg-ink-100 text-ink-600',
    under_review: 'bg-accent-100 text-accent-700',
  };
  const label = status ? status.replace(/_/g, ' ') : status;
  return (
    <span className={`badge ${map[status] ?? 'bg-ink-100 text-ink-600'}`}>
      {label ? label.charAt(0).toUpperCase() + label.slice(1) : ''}
    </span>
  );
}

export function ProductImage({
  url,
  title,
  className = '',
}: {
  url: string | null;
  title: string;
  className?: string;
}) {
  if (url) {
    return <img src={url} alt={title} className={`h-full w-full object-cover ${className}`} />;
  }
  return (
    <div
      className={`flex h-full w-full items-center justify-center bg-gradient-to-br from-ink-100 to-ink-200 text-ink-400 ${className}`}
    >
      <Store className="h-8 w-8" />
    </div>
  );
}
