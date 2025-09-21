import { supabase } from "./supabase";

export const signOut = async () => {
  await await supabase.auth.signOut();
};
