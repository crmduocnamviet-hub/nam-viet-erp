import { supabase } from "./supabase";
import { upsetInventory } from "./warehouse";
import { createSalesOrder } from "./salesOrderService";
import { createMultipleSalesOrderItems } from "./salesOrderItemService";
import { createMultipleSalesComboItems } from "./salesComboItemService";
import { batchDeductLotQuantities } from "./lotManagementService";

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
 * Processes a Point of Sale transaction.
 * 1. Creates a sales order and sales order items.
 * 2. Creates a new financial transaction record.
 * 3. Updates the inventory for each item sold.
 * NOTE: This function is not atomic. A database RPC function would be a better approach
 * to ensure data consistency, but this is a good starting point for the prototype.
 */
export const processSaleTransaction = async (
  {
    cart,
    total,
    paymentMethod,
    warehouseId,
    createdBy,
    fundId,
    customerId,
  }: IProcessSale,
  inventory: IInventoryWithProduct[],
) => {
  // Step 1: Create the sales order record.
  const salesOrder = {
    patient_id: customerId || null, // Default patient ID for walk-in customers
    order_type: "pos",
    total_value: total,
    payment_method: paymentMethod,
    payment_status: "paid",
    operational_status: "completed",
    is_ai_checked: false,
    created_by_employee_id: createdBy || null, // Allow null when no employee context available
  };

  const { data: orderData, error: orderError } =
    await createSalesOrder(salesOrder);

  if (orderError || !orderData) {
    console.error("Sales Order Creation Error:", orderError);
    throw new Error(
      `Failed to create sales order: ${orderError?.message || "Unknown error"}`,
    );
  }

  // Step 2: Create sales order items and track combo items separately
  const orderItems: any[] = [];
  const comboItems: any[] = [];

  (cart || []).forEach((item) => {
    if (item.isCombo && item.comboData) {
      // Track individual products in sales_combo_items table
      item.comboData.combo_items?.forEach((comboItem) => {
        const itemQuantity = comboItem.quantity * item.quantity;
        const itemPrice =
          item.finalPrice /
          (item.comboData?.combo_items?.reduce(
            (sum, ci) => sum + ci.quantity,
            0,
          ) || 1);

        // Find lot information from lotSelections if available
        const lotSelection = item.lotSelections?.find(
          (ls: any) => ls.product_id === comboItem.product_id,
        );

        comboItems.push({
          order_id: orderData.order_id,
          combo_id: item.id,
          product_id: comboItem.product_id,
          quantity: itemQuantity,
          unit_price: itemPrice,
          lot_id: lotSelection?.lot_id || null, // Include lot_id if available
        });
      });
    } else {
      // Regular product - unchanged
      orderItems.push({
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.finalPrice || 0,
        is_service: false,
        lot_id: item.lot_id || null, // Include lot_id if available
      });
    }
  });

  const { error: itemsError } = await createMultipleSalesOrderItems(
    orderData.order_id,
    orderItems,
  );

  if (itemsError) {
    console.error("Sales Order Items Creation Error:", itemsError);
    // Try to rollback the sales order
    await supabase
      .from("sales_orders")
      .delete()
      .eq("order_id", orderData.order_id);
    throw new Error(
      `Failed to create sales order items: ${itemsError.message}`,
    );
  }

  // Step 2.5: Create sales combo items records for tracking
  if (comboItems.length > 0) {
    const { error: comboItemsError } =
      await createMultipleSalesComboItems(comboItems);

    if (comboItemsError) {
      console.error("Sales Combo Items Creation Error:", comboItemsError);
      // Continue with transaction - combo items tracking is supplementary
      // We log the error but don't rollback the entire transaction
    }
  }

  // Step 3: Create the financial transaction record.
  const transactionRecord = {
    type: "income",
    amount: total,
    description: `POS Sale - Order ${orderData.order_id} - Warehouse ID ${warehouseId}`,
    payment_method: paymentMethod,
    status: "đã thu", // POS transactions are considered completed immediately.
    transaction_date: new Date().toISOString(),
    created_by: createdBy,
    fund_id: fundId,
  };

  const { data: transactionData, error: transactionError } = await supabase
    .from("transactions")
    .insert(transactionRecord)
    .select()
    .single();

  if (transactionError) {
    console.error("Transaction Creation Error:", transactionError);
    // Rollback sales order and items
    await supabase
      .from("sales_orders")
      .delete()
      .eq("order_id", orderData.order_id);
    throw new Error(
      `Failed to create transaction: ${transactionError.message}`,
    );
  }

  // Step 4: Prepare and execute inventory updates.
  const quantities = calculateProductGlobalQuantities(cart);

  const filterProducts = inventory.filter(
    (i) => !!i.products?.id && !!quantities[i.products.id],
  );

  const inventoryUpdates: any[] = [];

  filterProducts.forEach((inventory) => {
    if (!inventory.products?.id) return;
    const quantity = quantities[inventory.products.id].quantity;
    const currentQuantity = inventory.quantity || 0;
    const quantityToDeduct = currentQuantity - quantity;
    inventoryUpdates.push({
      product_id: inventory.products.id,
      warehouse_id: warehouseId,
      quantity: quantityToDeduct, // Negative to deduct
    });
  });

  if (inventoryUpdates.length > 0) {
    const { error: inventoryError } = await upsetInventory(inventoryUpdates);

    if (inventoryError) {
      // If inventory update fails, we should try to roll back the financial transaction and sales order
      // to avoid data inconsistency.
      await supabase.from("transactions").delete().eq("id", transactionData.id);
      await supabase
        .from("sales_orders")
        .delete()
        .eq("order_id", orderData.order_id);
      throw new Error(`Failed to update inventory: ${inventoryError.message}`);
    }
  }

  // Step 5: Deduct quantities from product lots for lot-managed products
  const lotDeductions: Array<{ lotId: number; quantityToDeduct: number }> = [];

  // Collect lot deductions from regular order items
  orderItems.forEach((item) => {
    if (item.lot_id) {
      lotDeductions.push({
        lotId: item.lot_id,
        quantityToDeduct: item.quantity,
      });
    }
  });

  // Collect lot deductions from combo items
  comboItems.forEach((item) => {
    if (item.lot_id) {
      lotDeductions.push({
        lotId: item.lot_id,
        quantityToDeduct: item.quantity,
      });
    }
  });

  // Execute lot quantity deductions if any
  if (lotDeductions.length > 0) {
    const { errors, success } = await batchDeductLotQuantities(lotDeductions);

    if (!success) {
      console.error("Lot Quantity Deduction Errors:", errors);
      // Log the errors but don't rollback - inventory was already updated
      // The lot quantities will be synced during next inventory sync
      // This is a soft failure to prevent order loss
    }
  }

  return { transactionData, orderData };
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
      item.comboData.combo_items?.forEach((comboItem: any) => {
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
