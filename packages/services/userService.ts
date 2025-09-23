import { supabase } from "./supabase";

export const signOut = async () => {
  await await supabase.auth.signOut();
};

// Note: Patient search and management functions have been moved to patientService.ts
// All patient-related operations now use the patients table instead of profiles
