import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Profile, Role } from './types';
import { clearStoredAuth, getProfile, getStoredUser, logoutUser } from './api';

type AuthState = {
  session: { user?: { id?: string } } | null;
  profile: Profile | null;
  role: Role | null;
  loading: boolean;
  error: string | null;
};

type AuthContextValue = AuthState & {
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    session: null,
    profile: null,
    role: null,
    loading: true,
    error: null,
  });

  const loadProfile = async (uid?: string) => {
    try {
      const res = await getProfile();
      const user = res?.user;
      if (!user) {
        setState((s) => ({ ...s, error: 'Profile not found', loading: false }));
        return;
      }
const role = user.role as Role;
      const profile = {
        id: user._id || user.id,
        role,
        full_name: user.name || user.full_name || 'User',
        avatar_url: user.profilePic || user.avatar_url || null,
        bio: user.bio || null,
        trust_score: Number(user.trustScore ?? user.trust_score ?? 0),
        warnings_count: Number(user.warningCount ?? user.warnings_count ?? 0),
        is_blocked: Boolean(user.accountStatus === 'BLOCKED' || user.is_blocked),
        blocked_reason: user.blockedReason || user.blocked_reason || null,
        created_at: user.createdAt || user.created_at || new Date().toISOString(),
        updated_at: user.updatedAt || user.updated_at || new Date().toISOString(),
      } as Profile;
      const userId = user._id || user.id || uid;
      setState((s) => ({
        ...s,
        profile,
        role,
        session: userId ? { user: { id: userId } } : s.session,
        loading: false,
        error: null,
      }));
    } catch (error) {
      setState((s) => ({ ...s, error: error instanceof Error ? error.message : 'Profile load failed', loading: false }));
    }
  };

  const refreshProfile = async () => {
    await loadProfile(state.session?.user?.id);
  };

  useEffect(() => {
    const storedUser = getStoredUser();
    const uid = storedUser?._id || storedUser?.id;
    if (!uid) {
      setState({ session: null, profile: null, role: null, loading: false, error: null });
      return;
    }
    setState((s) => ({ ...s, session: { user: { id: uid } }, loading: true }));
    loadProfile(uid);
  }, []);

  const signOut = async () => {
    await logoutUser();
    clearStoredAuth();
    setState({ session: null, profile: null, role: null, loading: false, error: null });
  };

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, refreshProfile, signOut }),
    [state, signOut, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
