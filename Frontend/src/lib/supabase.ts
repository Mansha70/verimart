import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Make supabase optional — if env vars are missing, create a dummy client
// that logs a warning instead of crashing the app.
const hasSupabase = !!(url && anonKey);

if (!hasSupabase) {
  console.warn(
    '[VeriMart] Supabase env vars (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY) not set. ' +
    'In-app notifications will use the backend API instead. ' +
    'To enable full Supabase features, add them to your .env file.'
  );
}

function createDummyClient(): SupabaseClient {
  return {
    from: () => ({
      insert: async () => ({ error: null }),
      select: () => ({
        eq: () => ({
          order: () => ({
            then: (cb: (arg: { data: never[]; error: null }) => void) => cb({ data: [], error: null }),
          }),
        }),
      }),
    }),
    storage: {
      from: () => ({
        upload: async () => ({ error: null }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
      }),
    },
    auth: {
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signOut: async () => {},
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      signUp: async () => ({ data: { user: null, session: null }, error: null }),
      signInWithPassword: async () => ({ data: { user: null, session: null }, error: null }),
    },
    channel: () => ({
      on: () => ({ subscribe: () => {} }),
      unsubscribe: () => {},
    }),
  } as unknown as SupabaseClient;
}

export const supabase = hasSupabase
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      realtime: { params: { eventsPerSecond: 10 } },
    })
  : createDummyClient();

