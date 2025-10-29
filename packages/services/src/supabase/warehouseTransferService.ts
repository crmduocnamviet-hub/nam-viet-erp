import type { PostgrestSingleResponse } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { TABLES } from "./constants";
import {
  syncAllLotsToInventory,
  syncMultipleProductsToInventory,
} from "./lotManagementService";

/**
 * ============================================
 * WAREHOUSE TRANSFER SERVICE
 * ============================================
 * Manages warehouse transfers between main warehouse and pharmacies
 */

/**
 * Get all warehouse transfers with filters
 */
export const getAllWarehouseTransfers = async (filters?: {
  status?: TransferStatus | TransferStatus[];
  fromWarehouseId?: number;
  toWarehouseId?: number;
  startDate?: string;
  endDate?: string;
}) => {
  let query = supabase
    .from("warehouse_transfers")
    .select(
      `
      *,
      from_warehouse:warehouses!warehouse_transfers_from_warehouse_id_fkey(*),
      to_warehouse:warehouses!warehouse_transfers_to_warehouse_id_fkey(*),
      warehouse_transfer_items(
        *,
        products(*),
        product_lots(*)
      )
    `,
    )
    .order("created_at", { ascending: false });

  // Apply filters
  if (filters?.status) {
    if (Array.isArray(filters.status)) {
      query = query.in("status", filters.status);
    } else {
      query = query.eq("status", filters.status);
    }
  }

  if (filters?.fromWarehouseId) {
    query = query.eq("from_warehouse_id", filters.fromWarehouseId);
  }

  if (filters?.toWarehouseId) {
    query = query.eq("to_warehouse_id", filters.toWarehouseId);
  }

  if (filters?.startDate) {
    query = query.gte("transfer_date", filters.startDate);
  }

  if (filters?.endDate) {
    query = query.lte("transfer_date", filters.endDate);
  }

  const response = await query;

  // Calculate totals for each transfer
  if (response.data) {
    const transfersWithTotals = response.data.map((transfer: any) => {
      const items = transfer.warehouse_transfer_items || [];

      const total_quantity_requested = items.reduce(
        (sum: number, item: any) =>
          sum + parseFloat(item.quantity_requested || 0),
        0,
      );

      const total_quantity_sent = items.reduce(
        (sum: number, item: any) => sum + parseFloat(item.quantity_sent || 0),
        0,
      );

      const total_quantity_received = items.reduce(
        (sum: number, item: any) =>
          sum + parseFloat(item.quantity_received || 0),
        0,
      );

      const total_value = items.reduce(
        (sum: number, item: any) =>
          sum +
          parseFloat(item.quantity_requested || 0) *
            parseFloat(item.unit_price || 0),
        0,
      );

      return {
        ...transfer,
        total_quantity_requested,
        total_quantity_sent,
        total_quantity_received,
        total_value,
      };
    });

    return {
      ...response,
      data: transfersWithTotals as IWarehouseTransferWithDetails[],
    };
  }

  return response;
};

/**
 * Get warehouse transfer by ID
 */
export const getWarehouseTransferById = async (id: number) => {
  const response: PostgrestSingleResponse<IWarehouseTransferWithDetails> =
    await supabase
      .from("warehouse_transfers")
      .select(
        `
      *,
      from_warehouse:warehouses!warehouse_transfers_from_warehouse_id_fkey(*),
      to_warehouse:warehouses!warehouse_transfers_to_warehouse_id_fkey(*),
      warehouse_transfer_items(
        *,
        products(*),
        product_lots(*)
      )
    `,
      )
      .eq("id", id)
      .single();

  // Calculate totals
  if (response.data) {
    const items = response.data.warehouse_transfer_items || [];

    response.data.total_quantity_requested = items.reduce(
      (sum, item) =>
        sum + parseFloat(item.quantity_requested.toString() || "0"),
      0,
    );

    response.data.total_quantity_sent = items.reduce(
      (sum, item) => sum + parseFloat(item.quantity_sent.toString() || "0"),
      0,
    );

    response.data.total_quantity_received = items.reduce(
      (sum, item) => sum + parseFloat(item.quantity_received.toString() || "0"),
      0,
    );

    response.data.total_value = items.reduce(
      (sum, item) =>
        sum +
        parseFloat(item.quantity_requested.toString() || "0") *
          parseFloat(item.unit_price?.toString() || "0"),
      0,
    );
  }

  return response;
};

/**
 * Create a new warehouse transfer
 */
export const createWarehouseTransfer = async (
  transferData: ICreateWarehouseTransfer,
) => {
  try {
    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 1. Create transfer header
    const { data: transfer, error: transferError } = await supabase
      .from("warehouse_transfers")
      .insert({
        from_warehouse_id: transferData.from_warehouse_id,
        to_warehouse_id: transferData.to_warehouse_id,
        transfer_date:
          transferData.transfer_date || new Date().toISOString().split("T")[0],
        expected_delivery_date: transferData.expected_delivery_date,
        notes: transferData.notes,
        status: "draft",
        created_by: user?.id,
      })
      .select()
      .single();

    if (transferError) {
      throw transferError;
    }

    // 2. Create transfer items
    const items = transferData.items.map((item) => ({
      transfer_id: transfer.id,
      product_id: item.product_id,
      lot_id: item.lot_id,
      quantity_requested: item.quantity_requested,
      quantity_sent: 0,
      quantity_received: 0,
      unit_price: item.unit_price,
      notes: item.notes,
    }));

    const { error: itemsError } = await supabase
      .from("warehouse_transfer_items")
      .insert(items);

    if (itemsError) {
      // Rollback: delete the transfer
      await supabase.from("warehouse_transfers").delete().eq("id", transfer.id);
      throw itemsError;
    }

    // 3. Fetch complete transfer with items
    return await getWarehouseTransferById(transfer.id);
  } catch (error) {
    console.error("Error creating warehouse transfer:", error);
    return { data: null, error };
  }
};

/**
 * Update warehouse transfer
 */
export const updateWarehouseTransfer = async (
  id: number,
  updateData: IUpdateWarehouseTransfer,
) => {
  const response = await supabase
    .from("warehouse_transfers")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  return response;
};

/**
 * Delete warehouse transfer (only if status is draft)
 */
export const deleteWarehouseTransfer = async (id: number) => {
  // Check status first
  const { data: transfer } = await supabase
    .from("warehouse_transfers")
    .select("status")
    .eq("id", id)
    .single();

  if (transfer?.status !== "draft") {
    return {
      data: null,
      error: {
        message: "Chỉ có thể xóa phiếu chuyển kho ở trạng thái nháp",
      },
    };
  }

  // Delete transfer (will cascade delete items)
  const response = await supabase
    .from("warehouse_transfers")
    .delete()
    .eq("id", id);

  return response;
};

/**
 * Approve warehouse transfer
 */
export const approveWarehouseTransfer = async (id: number) => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const response = await supabase
      .from("warehouse_transfers")
      .update({
        status: "approved",
        approved_by: user?.id,
        approved_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("status", "pending") // Only approve if pending
      .select()
      .single();

    return response;
  } catch (error) {
    console.error("Error approving warehouse transfer:", error);
    return { data: null, error };
  }
};

/**
 * Send warehouse transfer (mark items as sent and update inventory)
 */
export const sendWarehouseTransfer = async (
  id: number,
  sendData: ISendWarehouseTransfer,
) => {
  try {
    // Get current user and transfer details
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: transfer, error: transferError } =
      await getWarehouseTransferById(id);

    if (transferError || !transfer) {
      throw new Error("Không tìm thấy phiếu chuyển kho.");
    }

    // --- Start Transaction-like logic ---

    // 1. Update quantity_sent for each item
    const updateItemsPromises = sendData.items.map((item) =>
      supabase
        .from(TABLES.WAREHOUSE_TRANSFER_ITEMS)
        .update({ quantity_sent: item.quantity_sent })
        .eq("id", item.id),
    );
    const itemResults = await Promise.all(updateItemsPromises);
    const itemErrors = itemResults.filter((res) => res.error);
    if (itemErrors.length > 0) {
      throw new Error(
        `Lỗi cập nhật số lượng gửi: ${itemErrors[0].error?.message}`,
      );
    }

    // 2. Deduct inventory from the source warehouse for each item
    const deductInventoryPromises = sendData.items.map((sentItem) => {
      const transferItem = (transfer.warehouse_transfer_items || []).find(
        (i) => i.id === sentItem.id,
      );
      if (!transferItem) return Promise.resolve();

      return supabase.rpc("deduct_inventory", {
        p_product_id: transferItem.product_id,
        p_warehouse_id: transfer.from_warehouse_id,
        p_quantity_to_deduct: sentItem.quantity_sent,
        p_lot_id: transferItem.lot_id,
      });
    });

    const deductResults = await Promise.all(deductInventoryPromises);
    const deductErrors = deductResults.filter((res) => !!res);
    if (deductErrors.length > 0) {
      // NOTE: This is where atomicity is lost. Items are updated but inventory failed.
      // A full rollback would be complex here.
      throw new Error(`Lỗi trừ tồn kho: ${deductErrors[0].error?.message}`);
    }

    // 3. Update the main transfer status to 'in_transit'
    const { error: updateTransferError } = await supabase
      .from("warehouse_transfers")
      .update({
        status: "in_transit",
        sent_by: user?.id,
        sent_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateTransferError) {
      // At this point, inventory has been deducted but the transfer status failed to update.
      // This is a critical inconsistency.
      console.error(
        "CRITICAL: Inventory deducted but transfer status update failed.",
      );
      throw updateTransferError;
    }

    // 4. Sync inventory table from product_lots for all affected products
    // This ensures the main inventory count is consistent after lot updates.
    const productIdsToSync = [
      ...new Set(
        (transfer.warehouse_transfer_items ?? []).map(
          (item) => item.product_id,
        ),
      ),
    ];

    if (productIdsToSync.length > 0) {
      const { error: syncError } =
        await syncMultipleProductsToInventory(productIdsToSync);
      if (syncError) {
        console.warn("Inventory sync after transfer send failed:", syncError);
      }
    }

    // --- End Transaction-like logic ---

    // 4. Return the fully updated transfer details
    return await getWarehouseTransferById(id);
  } catch (error) {
    console.error("Error sending warehouse transfer:", error);
    return { data: null, error };
  }
};

/**
 * Receive warehouse transfer (mark items as received and update inventory)
 */
export const receiveWarehouseTransfer = async (
  id: number,
  receiveData: IReceiveWarehouseTransfer,
) => {
  try {
    // Get current user and transfer details
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: transfer, error: transferError } =
      await getWarehouseTransferById(id);

    if (transferError || !transfer) {
      throw new Error("Không tìm thấy phiếu chuyển kho.");
    }

    // --- Start Transaction-like logic ---

    // 1. Update quantity_received and damage_notes for each item
    const updateItemsPromises = receiveData.items.map((item) =>
      supabase
        .from(TABLES.WAREHOUSE_TRANSFER_ITEMS)
        .update({
          quantity_received: item.quantity_received,
          damage_notes: item.damage_notes,
        })
        .eq("id", item.id),
    );

    const itemResults = await Promise.all(updateItemsPromises);
    const itemErrors = itemResults.filter((res) => res.error);
    if (itemErrors.length > 0) {
      throw new Error(
        `Lỗi cập nhật số lượng nhận: ${itemErrors[0].error?.message}`,
      );
    }

    // 2. Add inventory to the destination warehouse for each item
    const receiveInventoryPromises = receiveData.items.map((receivedItem) => {
      const transferItem = (transfer.warehouse_transfer_items ?? []).find(
        (i) => i.id === receivedItem.id,
      );
      if (!transferItem) return Promise.resolve();

      return supabase.rpc("receive_inventory", {
        p_product_id: transferItem.product_id,
        p_warehouse_id: transfer.to_warehouse_id,
        p_quantity_to_receive: receivedItem.quantity_received,
        p_source_lot_id: transferItem.lot_id, // Pass original lot to copy info
      });
    });

    const receiveResults = await Promise.all(receiveInventoryPromises);
    const receiveErrors = receiveResults.filter((res) => !!res);
    if (receiveErrors.length > 0) {
      // Data inconsistency risk
      throw new Error(`Lỗi cộng tồn kho: ${receiveErrors[0].error?.message}`);
    }

    // 3. Update the main transfer status to 'completed'
    const { error: updateTransferError } = await supabase
      .from("warehouse_transfers")
      .update({
        status: "completed",
        received_by: user?.id,
        received_at: new Date().toISOString(),
        actual_delivery_date: new Date().toISOString().split("T")[0],
      })
      .eq("id", id);

    if (updateTransferError) {
      console.error(
        "CRITICAL: Inventory received but transfer status update failed.",
      );
      throw updateTransferError;
    }

    // 4. Sync inventory table from product_lots for all affected products
    // This ensures the main inventory count is consistent after lot updates.
    const productIdsToSync = [
      ...new Set(
        (transfer.warehouse_transfer_items ?? []).map(
          (item) => item.product_id,
        ),
      ),
    ];

    if (productIdsToSync.length > 0) {
      const { error: syncError } =
        await syncMultipleProductsToInventory(productIdsToSync);
      if (syncError) {
        console.warn(
          "Inventory sync after transfer receive failed:",
          syncError,
        );
      }
    }
    // --- End Transaction-like logic ---

    // 4. Return the fully updated transfer details
    return await getWarehouseTransferById(id);
  } catch (error) {
    console.error("Error receiving warehouse transfer:", error);
    return { data: null, error };
  }
};

/**
 * Cancel warehouse transfer
 */
export const cancelWarehouseTransfer = async (
  id: number,
  rejectionReason?: string,
) => {
  try {
    const response = await supabase
      .from("warehouse_transfers")
      .update({
        status: "cancelled",
        rejection_reason: rejectionReason,
      })
      .eq("id", id)
      .in("status", ["draft", "pending", "approved"]) // Can only cancel before sent
      .select()
      .single();

    return response;
  } catch (error) {
    console.error("Error cancelling warehouse transfer:", error);
    return { data: null, error };
  }
};

/**
 * Submit warehouse transfer for approval
 */
export const submitWarehouseTransfer = async (id: number) => {
  const response = await supabase
    .from("warehouse_transfers")
    .update({
      status: "pending",
    })
    .eq("id", id)
    .eq("status", "draft")
    .select()
    .single();

  return response;
};

/**
 * Update warehouse transfer item
 */
export const updateWarehouseTransferItem = async (
  itemId: number,
  updateData: {
    quantity_requested?: number;
    lot_id?: number | null;
    unit_price?: number;
    notes?: string;
  },
) => {
  const response = await supabase
    .from("warehouse_transfer_items")
    .update(updateData)
    .eq("id", itemId)
    .select()
    .single();

  return response;
};

/**
 * Delete warehouse transfer item
 */
export const deleteWarehouseTransferItem = async (itemId: number) => {
  const response = await supabase
    .from("warehouse_transfer_items")
    .delete()
    .eq("id", itemId);

  return response;
};

/**
 * Add item to warehouse transfer
 */
export const addWarehouseTransferItem = async (
  transferId: number,
  itemData: {
    product_id: number;
    lot_id?: number | null;
    quantity_requested: number;
    unit_price?: number;
    notes?: string;
  },
) => {
  const response = await supabase
    .from("warehouse_transfer_items")
    .insert({
      transfer_id: transferId,
      ...itemData,
      quantity_sent: 0,
      quantity_received: 0,
    })
    .select()
    .single();

  return response;
};
