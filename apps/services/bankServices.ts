import { PostgrestSingleResponse } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export const getBanks = async () => {
  const response: PostgrestSingleResponse<IBank[]> = await supabase
    .from("banks")
    .select("*");
  return response;
};
