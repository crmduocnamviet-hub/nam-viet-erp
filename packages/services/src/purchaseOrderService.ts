import { supabase } from "./supabase";

export const getPurchaseOrder = async () => {
  const response = await supabase
    .from("purchase_orders")
    .select("*, suppliers(name)")
    .order("created_at", { ascending: false });

  return response;
};
