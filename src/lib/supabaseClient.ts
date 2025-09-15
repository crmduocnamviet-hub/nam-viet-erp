import { createClient } from "@supabase/supabase-js";

// Dán "Địa chỉ" (URL) của bạn vào đây
const supabaseUrl = "https://yyqnjeaukxzkzfiufwkb.supabase.co";
// Dán "Chìa khóa công khai" (anon public key) của bạn vào đây
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5cW5qZWF1a3h6a3pmaXVmd2tiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNDQ3MzAsImV4cCI6MjA3MjcyMDczMH0._dbzHfUsuSBbKd1iXOMWzqJkvsZxMZBtjEfOexA0K04";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
