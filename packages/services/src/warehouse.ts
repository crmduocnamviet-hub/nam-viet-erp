import type { PostgrestSingleResponse } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export const getWarehouse = async () => {
  const response: PostgrestSingleResponse<IWarehouse[]> = await supabase
    .from("warehouses")
    .select("*");
  return response;
};

export const getWarehouseById = async (warehouseId: number) => {
  const response: PostgrestSingleResponse<IWarehouse> = await supabase
    .from("warehouses")
    .select("*")
    .eq("id", warehouseId)
    .single();
  return response;
};

export const getInventoryByProductId = async (productId: number) => {
  const response = await supabase
    .from("inventory")
    .select("*")
    .eq("product_id", productId);
  return response;
};

export const upsetInventory = async (record: Partial<IInventory>[]) => {
  const response = await supabase.from("inventory").upsert(record, {
    onConflict: "product_id, warehouse_id",
  });
  return response;
};

/**
 * Fetch all inventory items for a specific warehouse
 * Includes product details via join
 */
export const getInventoryByWarehouse = async (warehouseId: number) => {
  const response = await supabase
    .from("inventory")
    .select(`
      *,
      products (*)
    `)
    .eq("warehouse_id", warehouseId)
    .order("created_at", { ascending: false });
  return response;
};
