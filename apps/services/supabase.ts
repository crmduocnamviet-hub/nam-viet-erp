import { createClient } from "@supabase/supabase-js";

let supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
let supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const setupEVN = (env: ImportMetaEnv) => {
  supabaseUrl = env.VITE_SUPABASE_URL;
  supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;
};

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be provided in an environment file."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
