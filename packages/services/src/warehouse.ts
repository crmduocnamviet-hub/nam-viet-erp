import type { PostgrestSingleResponse } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export const getWarehouse = async () => {
  const response: PostgrestSingleResponse<IWarehouse[]> = await supabase
    .from("warehouses")
    .select("*");
  return response;
};

export const upsetInventory = async (record: Partial<IInventory>[]) => {
  const response = await supabase.from("inventory").upsert(record, {
    onConflict: "product_id, warehouse_id",
  });
  return response;
};
