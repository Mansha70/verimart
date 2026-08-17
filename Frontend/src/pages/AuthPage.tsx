import { useEffect, useState } from 'react';
import { ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Logo } from '@/components/ui';
import { useHashRoute } from '@/lib/router';
import { useToast } from '@/components/Toast';
import { useAuth } from '@/lib/auth';
import { loginUser, registerUser } from '@/lib/api';
import type { Role } from '@/lib/types';

const roleMeta: Record<Role, { label: string; tagline: string; accent: string; icon: string }> = {
  buyer: {
    label: 'Buyer',
    tagline: 'Shop with confidence and chat with sellers in real time.',
    accent: 'from-brand-500 to-brand-700',
    icon: '🛍️',
  },
  seller: {
    label: 'Seller',
    tagline: 'List products, manage orders, and build your trust score.',
    accent: 'from-gold-500 to-gold-700',
    icon: '🏪',
  },
  admin: {
    label: 'Admin',
    tagline: 'Oversee the marketplace and keep it safe for everyone.',
    accent: 'from-accent-600 to-accent-800',
    icon: '🛡️',
  },
};

export function AuthPage({ mode, role }: { mode: 'login' | 'signup'; role: Role }) {
  const [, navigate] = useHashRoute();
  const toast = useToast();
  const { refreshProfile } = useAuth();
  const meta = roleMeta[role];
  const isSignup = mode === 'signup';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  // Pre-seed admin demo credentials hint
  useEffect(() => {
    if (role === 'admin' && !isSignup) {
      setEmail('admin@verimart.app');
      setPassword('admin1234');
    }
  }, [role, isSignup]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      if (isSignup) {
        if (!fullName.trim()) {
          toast('Please enter your name', 'error');
          setLoading(false);
          return;
        }
await registerUser({ name: fullName.trim(), email, password, role });
        toast('Account created! Welcome to VeriMart.', 'success');
        navigate(`/login/${role}`);
      } else {
        await loginUser(email, password);
        await refreshProfile();
        toast('Welcome back!', 'success');
        navigate('/dashboard');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      toast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left panel */}
      <div className={`relative hidden w-1/2 flex-col justify-between bg-gradient-to-br ${meta.accent} p-12 text-white lg:flex`}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, white 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        <button onClick={() => navigate('/')} className="relative flex items-center gap-2 text-sm font-medium text-white/80 transition hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </button>
        <div className="relative">
          <div className="mb-6 text-5xl">{meta.icon}</div>
          <h2 className="text-3xl font-bold leading-tight">
            {isSignup ? 'Join as a' : 'Welcome back,'} {meta.label.toLowerCase()}
          </h2>
          <p className="mt-3 max-w-sm text-white/85">{meta.tagline}</p>
        </div>
        <div className="relative text-sm text-white/70">
          <Logo size="sm" />
        </div>
      </div>

      {/* Form */}
      <div className="flex w-full flex-col justify-center px-6 py-10 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 flex items-center justify-between">
            <Logo />
            <button onClick={() => navigate('/')} className="text-sm text-ink-500 hover:text-ink-800 lg:hidden">
              <ArrowLeft className="inline h-4 w-4" /> Home
            </button>
          </div>

          <h1 className="text-2xl font-bold text-ink-950">
            {isSignup ? `Create your ${meta.label.toLowerCase()} account` : `Sign in as ${meta.label.toLowerCase()}`}
          </h1>
          <p className="mt-2 text-sm text-ink-500">
            {isSignup ? 'Already have an account?' : "Don't have one yet?"}{' '}
            <button
              onClick={() => navigate(isSignup ? `/login/${role}` : `/signup/${role}`)}
              className="font-semibold text-brand-600 hover:text-brand-700"
            >
              {isSignup ? 'Sign in' : 'Sign up'}
            </button>
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {isSignup && (
              <div>
                <label className="label" htmlFor="name">Full name</label>
                <input
                  id="name"
                  className="input"
                  placeholder="Jane Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            )}
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="pw">Password</label>
              <div className="relative">
                <input
                  id="pw"
                  type={showPw ? 'text' : 'password'}
                  className="input pr-11"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isSignup ? 'Create account' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between text-xs text-ink-400">
            <button onClick={() => navigate('/')} className="hover:text-ink-600">
              Choose a different role
            </button>
            <span className="badge bg-ink-100 text-ink-600">{meta.label}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
