import { useEffect } from 'react';
import { AuthProvider, useAuth } from '@/lib/auth';
import { ToastProvider } from '@/components/Toast';
import { useHashRoute } from '@/lib/router';
import { LandingPage } from '@/pages/LandingPage';
import { AuthPage } from '@/pages/AuthPage';
import { BuyerDashboard } from '@/pages/buyer/BuyerDashboard';
import { SellerDashboard } from '@/pages/seller/SellerDashboard';
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { Loader2 } from 'lucide-react';
import type { Role } from '@/lib/types';

// Routes:
//  /              -> landing
//  /login[/:role] -> login
//  /signup[/:role]-> signup
//  signed-in users always see their role dashboard (routes are /dashboard, /browse, /products, ...)
const roleDashboards: Record<Role, () => React.ReactElement> = {
  buyer: BuyerDashboard,
  seller: SellerDashboard,
  admin: AdminDashboard,
};

function Router() {
  const { session, profile, role, loading } = useAuth();
  const [route, navigate] = useHashRoute();
  const path = route.startsWith('/') ? route.slice(1) : route;
  const segments = path.split('/').filter(Boolean);

  const signedIn = !!(session && profile && role);
  const isAuthRoute = segments[0] === 'login' || segments[0] === 'signup';

  // Redirect signed-in users away from auth/landing to their dashboard
  useEffect(() => {
    if (loading || !signedIn) return;
    if (isAuthRoute || segments.length === 0) {
      navigate('/dashboard');
    }
  }, [loading, signedIn, isAuthRoute, segments.length, navigate]);

  // Redirect to dashboard if a signed-in user hits another role's area
  useEffect(() => {
    if (loading || !signedIn) return;
    const first = segments[0];
    const validRoles: Role[] = ['buyer', 'seller', 'admin'];
    if (validRoles.includes(first as Role) && first !== role) {
      navigate('/dashboard');
    }
  }, [loading, signedIn, segments, role, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-50">
        <div className="flex flex-col items-center gap-3 text-ink-400">
          <Loader2 className="h-7 w-7 animate-spin" />
          <p className="text-sm">Loading VeriMart…</p>
        </div>
      </div>
    );
  }

  if (signedIn && role) {
    const Dashboard = roleDashboards[role];
    return <Dashboard key={role} />;
  }

  if (segments[0] === 'login') {
    const r = (segments[1] as Role) || 'buyer';
    return <AuthPage mode="login" role={r} />;
  }
  if (segments[0] === 'signup') {
    const r = (segments[1] as Role) || 'buyer';
    return <AuthPage mode="signup" role={r} />;
  }

  return <LandingPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router />
      </ToastProvider>
    </AuthProvider>
  );
}
