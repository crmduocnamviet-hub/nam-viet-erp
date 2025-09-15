import { createClient } from "@supabase/supabase-js";

// Dán "Địa chỉ" (URL) của bạn vào đây
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
