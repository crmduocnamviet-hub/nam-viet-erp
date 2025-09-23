import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "YOUR_SUPABASE_URL"; // Replace with actual URL from env in consuming app
const supabaseAnonKey = "YOUR_SUPABASE_ANON_KEY"; // Replace with actual key from env in consuming app

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
