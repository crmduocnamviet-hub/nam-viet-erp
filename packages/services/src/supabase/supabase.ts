import { createClient, SupabaseClient } from "@supabase/supabase-js";

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

// Singleton instances to prevent multiple GoTrueClient instances
let supabaseInstance: SupabaseClient | null = null;
let supabaseAdminInstance: SupabaseClient | null = null;

/**
 * Get the singleton Supabase client instance
 * Prevents multiple GoTrueClient instances in the same browser context
 */
const getSupabaseClient = (): SupabaseClient => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storageKey: "nam-viet-erp-auth", // Custom storage key to avoid conflicts
      },
    });
  }
  return supabaseInstance;
};

/**
 * Get the singleton Supabase admin client instance
 * For admin operations (user management)
 */
const getSupabaseAdminClient = (): SupabaseClient => {
  if (!supabaseAdminInstance) {
    supabaseAdminInstance = createClient(
      supabaseUrl,
      supabaseServiceKey || supabaseAnonKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          storageKey: "nam-viet-erp-admin-auth", // Separate storage key for admin
        },
      },
    );
  }
  return supabaseAdminInstance;
};

// Export singleton instances
export const supabase = getSupabaseClient();
export const supabaseAdmin = getSupabaseAdminClient();
