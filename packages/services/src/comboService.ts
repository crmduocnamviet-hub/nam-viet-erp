import { supabase } from "./supabase";
import type { PostgrestSingleResponse, PostgrestResponse } from "@supabase/supabase-js";

/**
 * Fetch all active combos with their items and product details
 */
export const getActiveCombos = async (): Promise<PostgrestResponse<IComboWithItems>> => {
  const response = await supabase
    .from("combos")
    .select(`
      *,
      combo_items (
        id,
        combo_id,
        product_id,
        quantity,
        created_at,
        products (*)
      )
    `)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  return response as PostgrestResponse<IComboWithItems>;
};

/**
 * Fetch a single combo by ID with items and product details
 */
export const getComboById = async (comboId: number): Promise<PostgrestSingleResponse<IComboWithItems>> => {
  const response = await supabase
    .from("combos")
    .select(`
      *,
      combo_items (
        id,
        combo_id,
        product_id,
        quantity,
        created_at,
        products (*)
      )
    `)
    .eq("id", comboId)
    .single();

  return response as PostgrestSingleResponse<IComboWithItems>;
};

/**
 * Create a new combo
 */
export const createCombo = async (
  combo: Omit<ICombo, "id" | "created_at" | "updated_at">
): Promise<PostgrestSingleResponse<ICombo>> => {
  const response = await supabase
    .from("combos")
    .insert(combo)
    .select()
    .single();

  return response;
};

/**
 * Update an existing combo
 */
export const updateCombo = async (
  comboId: number,
  updates: Partial<Omit<ICombo, "id" | "created_at">>
): Promise<PostgrestSingleResponse<ICombo>> => {
  const response = await supabase
    .from("combos")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", comboId)
    .select()
    .single();

  return response;
};

/**
 * Add items to a combo
 */
export const addComboItems = async (
  items: Omit<IComboItem, "id" | "created_at">[]
): Promise<PostgrestResponse<IComboItem>> => {
  const response = await supabase
    .from("combo_items")
    .insert(items)
    .select();

  return response;
};

/**
 * Remove items from a combo
 */
export const removeComboItems = async (
  comboId: number,
  productIds: number[]
): Promise<PostgrestResponse<IComboItem>> => {
  const response = await supabase
    .from("combo_items")
    .delete()
    .eq("combo_id", comboId)
    .in("product_id", productIds)
    .select();

  return response;
};

/**
 * Delete a combo (sets is_active to false)
 */
export const deleteCombo = async (comboId: number): Promise<PostgrestSingleResponse<ICombo>> => {
  const response = await supabase
    .from("combos")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", comboId)
    .select()
    .single();

  return response;
};

/**
 * Detect combos that match the given cart items
 * Returns combos where all required products are present in the cart
 */
export const detectCombosInCart = async (
  cartItems: { id: number; quantity: number }[]
): Promise<IComboWithItems[]> => {
  // Fetch all active combos
  const { data: combos, error } = await getActiveCombos();

  if (error || !combos) {
    return [];
  }

  const matchedCombos: IComboWithItems[] = [];

  // Check each combo to see if cart has all required products
  for (const combo of combos) {
    const comboItems = combo.combo_items || [];
    let isMatch = true;

    // Check if all combo items are in the cart with sufficient quantity
    for (const comboItem of comboItems) {
      const cartItem = cartItems.find(ci => ci.id === comboItem.product_id);

      if (!cartItem || cartItem.quantity < comboItem.quantity) {
        isMatch = false;
        break;
      }
    }

    if (isMatch && comboItems.length > 0) {
      // Calculate original price and discount
      let originalPrice = 0;
      for (const comboItem of comboItems) {
        const product = comboItem.products;
        if (product && product.retail_price) {
          originalPrice += product.retail_price * comboItem.quantity;
        }
      }

      const discountAmount = originalPrice - combo.combo_price;
      const discountPercentage = originalPrice > 0 ? (discountAmount / originalPrice) * 100 : 0;

      matchedCombos.push({
        ...combo,
        original_price: originalPrice,
        discount_amount: discountAmount,
        discount_percentage: discountPercentage,
      });
    }
  }

  return matchedCombos;
};
