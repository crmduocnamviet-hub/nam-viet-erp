import { supabase } from "./supabase";

/**
 * Interface for creating a sales combo item
 */
export interface ISalesComboItem {
  order_id: string;
  combo_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  lot_id?: number | null;
}

/**
 * Create a single sales combo item record
 * @param comboItem - The combo item data to insert
 * @returns Promise with the created combo item data and any error
 */
export const createSalesComboItem = async (comboItem: ISalesComboItem) => {
  const response = await supabase
    .from("sales_combo_items")
    .insert(comboItem)
    .select()
    .single();

  return response;
};

/**
 * Create multiple sales combo items in a batch
 * @param comboItems - Array of combo items to insert
 * @returns Promise with the created combo items data and any error
 */
export const createMultipleSalesComboItems = async (
  comboItems: ISalesComboItem[],
) => {
  const response = await supabase
    .from("sales_combo_items")
    .insert(comboItems)
    .select();

  return response;
};

/**
 * Get all sales combo items for a specific order
 * @param orderId - The sales order ID
 * @returns Promise with the combo items data and any error
 */
export const getSalesComboItemsByOrderId = async (orderId: string) => {
  const response = await supabase
    .from("sales_combo_items")
    .select(
      `
      *,
      combos:combo_id (
        id,
        name,
        description,
        combo_price
      ),
      products:product_id (
        id,
        name,
        sku,
        barcode
      )
    `,
    )
    .eq("order_id", orderId)
    .order("created_at", { ascending: false });

  return response;
};

/**
 * Get all sales combo items for a specific combo
 * @param comboId - The combo ID
 * @returns Promise with the combo items data and any error
 */
export const getSalesComboItemsByComboId = async (comboId: number) => {
  const response = await supabase
    .from("sales_combo_items")
    .select(
      `
      *,
      sales_orders:order_id (
        order_id,
        order_datetime,
        total_value,
        patient_id
      ),
      products:product_id (
        id,
        name,
        sku,
        barcode
      )
    `,
    )
    .eq("combo_id", comboId)
    .order("created_at", { ascending: false });

  return response;
};

/**
 * Get sales combo items with detailed information (using the view)
 * @param orderId - Optional order ID to filter by
 * @returns Promise with detailed combo items data and any error
 */
export const getSalesComboItemsDetailed = async (orderId?: string) => {
  let query = supabase.from("sales_combo_items_detailed").select("*");

  if (orderId) {
    query = query.eq("order_id", orderId);
  }

  const response = await query.order("created_at", { ascending: false });

  return response;
};
