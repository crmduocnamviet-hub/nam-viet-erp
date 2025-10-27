import type { PostgrestSingleResponse } from "@supabase/supabase-js";
import { supabase } from "./supabase";

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
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 1. Update item quantities
    for (const item of sendData.items) {
      const { error } = await supabase
        .from("warehouse_transfer_items")
        .update({
          quantity_sent: item.quantity_sent,
        })
        .eq("id", item.id);

      if (error) throw error;
    }

    // 2. Call database function to update inventory
    const { error: inventoryError } = await supabase.rpc(
      "process_warehouse_transfer_inventory",
      {
        p_transfer_id: id,
        p_action: "send",
      },
    );

    if (inventoryError) {
      throw inventoryError;
    }

    // 3. Update transfer status
    await supabase
      .from("warehouse_transfers")
      .update({
        sent_by: user?.id,
      })
      .eq("id", id);

    // 4. Return updated transfer
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
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 1. Update item quantities
    for (const item of receiveData.items) {
      const { error } = await supabase
        .from("warehouse_transfer_items")
        .update({
          quantity_received: item.quantity_received,
          damage_notes: item.damage_notes,
        })
        .eq("id", item.id);

      if (error) throw error;
    }

    // 2. Call database function to update inventory
    const { error: inventoryError } = await supabase.rpc(
      "process_warehouse_transfer_inventory",
      {
        p_transfer_id: id,
        p_action: "receive",
      },
    );

    if (inventoryError) {
      throw inventoryError;
    }

    // 3. Update transfer status
    await supabase
      .from("warehouse_transfers")
      .update({
        received_by: user?.id,
      })
      .eq("id", id);

    // 4. Return updated transfer
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
