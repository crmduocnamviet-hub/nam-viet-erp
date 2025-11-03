import { supabase } from "./supabase";

interface IProcessSale {
  cart: CartItem[];
  total: number;
  paymentMethod: string;
  warehouseId: number;
  // Ideally, we'd get the user from the session on the server-side.
  // For now, we'll pass it from the client.
  createdBy: string | null;
  // This should be determined by business logic, e.g., which fund to use for a given warehouse.
  fundId: number;
  // Customer information for sales order
  customerId?: string;
}

/**
 * Process sale transaction using Edge Function (Server-side)
 * This is the RECOMMENDED approach for production as it ensures:
 * - Atomic transactions
 * - Better security (service role key on server)
 * - Centralized business logic
 * - Better error handling and rollback
 */
export const processSaleTransactionViaEdgeFunction = async (
  paymentData: IProcessSale,
  _inventory?: IInventoryWithProduct[], // Not used in edge function approach
) => {
  try {
    // Get the auth session to pass to edge function
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      throw new Error("No active session found");
    }

    // Get Supabase URL from environment
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
      throw new Error("VITE_SUPABASE_URL is not configured");
    }

    // Call edge function
    const response = await fetch(
      `${supabaseUrl}/functions/v1/process-sale-order`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(paymentData),
      },
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || "Failed to process sale transaction");
    }

    return result.data;
  } catch (error: any) {
    console.error("[Edge Function Error]:", error);
    throw error;
  }
};

/**
 * Calculate global quantities for all products in cart (including products in combos)
 * @param cartItems - The cart items to calculate from
 * @returns Record of product ID to { name, quantity }
 */
export const calculateProductGlobalQuantities = (
  cartItems: any[],
): Record<number, { name: string; quantity: number }> => {
  const quantities: Record<number, { name: string; quantity: number }> = {};

  cartItems.forEach((item: any) => {
    if (item.isCombo && item.comboData) {
      // Add quantities from combo items
      const comboData = item.comboData; // Type narrowing
      comboData.combo_items?.forEach((comboItem: any) => {
        const productId = comboItem.product_id;
        const qty = comboItem.quantity * item.quantity;
        const productName = comboItem.products?.name || "Unknown";

        if (!quantities[productId]) {
          quantities[productId] = { name: productName, quantity: 0 };
        }
        quantities[productId].quantity += qty;
      });
    } else {
      // Add quantities from individual products
      const productId = item.id;
      const productName = item.name || "Unknown";

      if (!quantities[productId]) {
        quantities[productId] = { name: productName, quantity: 0 };
      }
      quantities[productId].quantity += item.quantity;
    }
  });

  return quantities;
};
