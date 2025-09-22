import { supabase } from "./supabase";

export const signOut = async () => {
  await await supabase.auth.signOut();
};

export const searchProfiles = async (searchTerm: string) => {
  const response = await supabase
    .from("profiles")
    .select("id, full_name, phone")
    .or(`full_name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
    .limit(10);
  return response;
};

export const getProfileById = async (profileId: string) => {
  const response = await supabase
    .from("profiles")
    .select("*")
    .eq("id", profileId)
    .single();
  return response;
};

export const updateProfileNotes = async (
  profileId: string,
  notes: string
) => {
  const response = await supabase
    .from("profiles")
    .update({ receptionist_notes: notes })
    .eq("id", profileId);
  return response;
};
