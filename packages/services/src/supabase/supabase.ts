import { createClient } from "@supabase/supabase-js";

let supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
let supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
let supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

export const setupEVN = (env: Record<string, string>) => {
  supabaseUrl = env.VITE_SUPABASE_URL;
  supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;
  supabaseServiceKey = env.VITE_SUPABASE_SERVICE_ROLE_KEY;
};

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be provided in an environment file.",
  );
}

// Singleton pattern to ensure only one client instance
let supabaseInstance: ReturnType<typeof createClient> | null = null;
let supabaseAdminInstance: ReturnType<typeof createClient> | null = null;

// Regular client for normal operations
export const supabase = (() => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storageKey: "nam-viet-supabase-auth",
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: "pkce",
      },
      global: {
        headers: {
          "x-client-info": "nam-viet-erm",
        },
      },
    });
  }
  return supabaseInstance;
})();

// Admin client for admin operations (user management)
export const supabaseAdmin = (() => {
  if (!supabaseAdminInstance) {
    supabaseAdminInstance = createClient(
      supabaseUrl,
      supabaseServiceKey || supabaseAnonKey,
      {
        auth: {
          storageKey: "nam-viet-supabase-admin-auth",
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );
  }
  return supabaseAdminInstance;
})();
