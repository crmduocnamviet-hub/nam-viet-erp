import { supabase } from "./supabase";
import { upsetInventory } from "./warehouse";
import { createSalesOrder } from "./salesOrderService";
import { createMultipleSalesOrderItems } from "./salesOrderItemService";

interface IProcessSale {
  cart: any[];
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
export const processSaleTransaction = async ({
  cart,
  total,
  paymentMethod,
  warehouseId,
  createdBy,
  fundId,
  customerId,
}: IProcessSale) => {
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

  const { data: orderData, error: orderError } = await createSalesOrder(
    salesOrder
  );

  if (orderError || !orderData) {
    console.error("Sales Order Creation Error:", orderError);
    throw new Error(
      `Failed to create sales order: ${orderError?.message || "Unknown error"}`
    );
  }

  // Step 2: Create sales order items.
  const orderItems = (cart || []).map((item) => ({
    product_id: item.id,
    quantity: item.quantity,
    unit_price: item.finalPrice || item.retail_price || 0,
    is_service: false,
  }));

  const { error: itemsError } = await createMultipleSalesOrderItems(
    orderData.order_id,
    orderItems
  );

  if (itemsError) {
    console.error("Sales Order Items Creation Error:", itemsError);
    // Try to rollback the sales order
    await supabase
      .from("sales_orders")
      .delete()
      .eq("order_id", orderData.order_id);
    throw new Error(
      `Failed to create sales order items: ${itemsError.message}`
    );
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
      `Failed to create transaction: ${transactionError.message}`
    );
  }

  // Step 4: Prepare and execute inventory updates.
  const inventoryUpdates = (cart || []).map((item) => {
    const warehouseInventory = (item.inventory_data || []).find(
      (inv: any) => inv.warehouse_id === warehouseId
    );

    const currentQuantity = warehouseInventory
      ? warehouseInventory.quantity
      : 0;
    const newQuantity = currentQuantity - item.quantity;

    return {
      product_id: item.id,
      warehouse_id: warehouseId,
      quantity: newQuantity,
      // We must include min/max stock for the upsert to not nullify them.
      min_stock: warehouseInventory ? warehouseInventory.min_stock : 0,
      max_stock: warehouseInventory ? warehouseInventory.max_stock : 0,
    };
  });

  if (inventoryUpdates.length > 0) {
    const { error: inventoryError } = await upsetInventory(inventoryUpdates);

    if (inventoryError) {
      // If inventory update fails, we should try to roll back the financial transaction and sales order
      // to avoid data inconsistency.
      console.error("Inventory Update Error:", inventoryError);
      await supabase.from("transactions").delete().eq("id", transactionData.id);
      await supabase
        .from("sales_orders")
        .delete()
        .eq("order_id", orderData.order_id);
      throw new Error(`Failed to update inventory: ${inventoryError.message}`);
    }
  }

  return { transactionData, orderData };
};
