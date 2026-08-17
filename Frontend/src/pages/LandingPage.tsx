import { ShoppingBag, Store, ShieldCheck, ArrowRight, MessageCircle, Star, Bell, TrendingUp } from 'lucide-react';
import { Logo } from '@/components/ui';
import { useHashRoute } from '@/lib/router';
import type { Role } from '@/lib/types';

const roleCards: {
  role: Role;
  title: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  features: string[];
}[] = [
  {
    role: 'buyer',
    title: 'I want to buy',
    desc: 'Browse products, chat with sellers, and purchase with confidence.',
    icon: ShoppingBag,
    accent: 'from-brand-500 to-brand-700',
    features: ['Browse & search', 'Real-time chat', 'Leave reviews'],
  },
  {
    role: 'seller',
    title: 'I want to sell',
    desc: 'List products, manage orders, and grow your trusted store.',
    icon: Store,
    accent: 'from-gold-500 to-gold-700',
    features: ['Product management', 'Track transactions', 'Build trust score'],
  },
  {
    role: 'admin',
    title: 'I am an admin',
    desc: 'Oversee the marketplace, manage users, and keep it safe.',
    icon: ShieldCheck,
    accent: 'from-accent-600 to-accent-800',
    features: ['Manage users & products', 'Review reports', 'Issue warnings'],
  },
];

export function LandingPage() {
  const [, navigate] = useHashRoute();

  return (
    <div className="min-h-screen bg-ink-50">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-ink-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 lg:px-8">
          <Logo />
          <button onClick={() => navigate('/login')} className="btn-secondary">
            Sign in <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-brand-50 via-ink-50 to-ink-50" />
        <div className="absolute -right-20 -top-20 -z-10 h-72 w-72 rounded-full bg-brand-200/40 blur-3xl" />
        <div className="absolute -left-20 top-40 -z-10 h-72 w-72 rounded-full bg-accent-200/40 blur-3xl" />

        <div className="mx-auto max-w-6xl px-4 py-16 text-center lg:px-8 lg:py-24">
          <span className="badge bg-brand-100 text-brand-700">
            <ShieldCheck className="h-3.5 w-3.5" /> Trust-built marketplace
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold leading-tight text-ink-950 sm:text-5xl lg:text-6xl">
            A marketplace where <span className="text-brand-600">trust</span> is earned
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-ink-600 sm:text-lg">
            VeriMart connects buyers and sellers with real-time chat, verified trust scores, and
            full transparency — so every transaction feels safe.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button onClick={() => navigate('/signup/buyer')} className="btn-primary px-6 py-3 text-base">
              Get started <ArrowRight className="h-4 w-4" />
            </button>
            <button onClick={() => navigate('/login')} className="btn-secondary px-6 py-3 text-base">
              I already have an account
            </button>
          </div>
        </div>
      </section>

      {/* Role selection */}
      <section className="mx-auto max-w-6xl px-4 pb-20 lg:px-8">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-ink-950 sm:text-3xl">Choose how you want to join</h2>
          <p className="mt-2 text-ink-600">Each role has a dedicated dashboard tailored to its needs.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {roleCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.role}
                className="group card overflow-hidden p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-soft"
              >
                <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${card.accent} text-white shadow-soft`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-ink-950">{card.title}</h3>
                <p className="mt-2 text-sm text-ink-600">{card.desc}</p>
                <ul className="mt-4 space-y-2">
                  {card.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-ink-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 flex gap-2">
                  <button
                    onClick={() => navigate(`/login/${card.role}`)}
                    className="btn-secondary flex-1"
                  >
                    Sign in
                  </button>
                  <button
                    onClick={() => navigate(`/signup/${card.role}`)}
                    className="btn-primary flex-1"
                  >
                    Sign up
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-ink-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: MessageCircle, title: 'Real-time chat', desc: 'Talk to buyers or sellers instantly, per product.' },
              { icon: ShieldCheck, title: 'Trust scores', desc: 'Sellers earn trust through good behavior.' },
              { icon: Bell, title: 'Smart notifications', desc: 'Stay updated on messages, orders, and warnings.' },
              { icon: TrendingUp, title: 'Full transparency', desc: 'Track every transaction from start to finish.' },
            ].map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="text-center">
                  <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-ink-900">{f.title}</h3>
                  <p className="mt-1 text-sm text-ink-500">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <footer className="border-t border-ink-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row lg:px-8">
          <Logo size="sm" />
          <p className="text-xs text-ink-400">Built with trust, transparency, and real-time connection.</p>
        </div>
      </footer>
    </div>
  );
}
