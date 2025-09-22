import { supabase } from './supabase';
import { upsetInventory } from './warehouse';

interface IProcessSale {
  cart: any[];
  total: number;
  paymentMethod: string;
  warehouseId: number;
  // Ideally, we'd get the user from the session on the server-side.
  // For now, we'll pass it from the client.
  createdBy: string;
  // This should be determined by business logic, e.g., which fund to use for a given warehouse.
  fundId: number;
}

/**
 * Processes a Point of Sale transaction.
 * 1. Creates a new financial transaction record.
 * 2. Updates the inventory for each item sold.
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
}: IProcessSale) => {
  // Step 1: Create the financial transaction record.
  const transactionRecord = {
    type: 'income',
    amount: total,
    description: `POS Sale - Warehouse ID ${warehouseId}`,
    payment_method: paymentMethod,
    status: 'đã thu', // POS transactions are considered completed immediately.
    transaction_date: new Date().toISOString(),
    created_by: createdBy,
    fund_id: fundId,
  };

  const { data: transactionData, error: transactionError } = await supabase
    .from('transactions')
    .insert(transactionRecord)
    .select()
    .single();

  if (transactionError) {
    console.error('Transaction Creation Error:', transactionError);
    throw new Error(`Failed to create transaction: ${transactionError.message}`);
  }

  // Step 2: Prepare and execute inventory updates.
  const inventoryUpdates = cart.map((item) => {
    const warehouseInventory = item.inventory_data.find(
      (inv: any) => inv.warehouse_id === warehouseId
    );

    const currentQuantity = warehouseInventory ? warehouseInventory.quantity : 0;
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
      // If inventory update fails, we should try to roll back the financial transaction
      // to avoid data inconsistency.
      console.error('Inventory Update Error:', inventoryError);
      await supabase.from('transactions').delete().eq('id', transactionData.id);
      throw new Error(`Failed to update inventory: ${inventoryError.message}`);
    }
  }

  return { transactionData };
};
