/**
 * Lot Management Service
 * Handles all lot/batch tracking operations
 * Implements NÚT 2, 3, 4 functionalities
 */

import { supabase } from "./supabase";

// =====================================================
// LOT OPERATIONS
// =====================================================

/**
 * Get available lots using FIFO/FEFO strategy
 */
export const getAvailableLots = async (params: {
  productId: number;
  warehouseId: number;
  requiredQuantity?: number;
  strategy?: "FIFO" | "FEFO";
  requireVat?: boolean;
}) => {
  const { data, error } = await supabase.rpc("get_available_lots_v2", {
    p_product_id: params.productId,
    p_warehouse_id: params.warehouseId,
    p_required_quantity: params.requiredQuantity,
    p_strategy: params.strategy || "FEFO",
    p_require_vat: params.requireVat || false,
  });

  return { data: data as AvailableLot[], error };
};

/**
 * Create a new product lot
 * Stores lot metadata with warehouse and quantity in product_lots table
 */
export const createProductLot = async (
  lot: Partial<IProductLot> & {
    warehouse_id?: number;
    quantity?: number;
  },
) => {
  const lotData = {
    lot_number: lot.lot_number,
    product_id: lot.product_id,
    warehouse_id: lot.warehouse_id,
    batch_code: lot.batch_code,
    expiry_date: lot.expiry_date,
    received_date: lot.received_date,
    quantity: lot.quantity || 0,
  };

  const { data, error } = await supabase
    .from("product_lots")
    .insert(lotData)
    .select()
    .single();

  return { data: data as IProductLot, error };
};

/**
 * Create a new product lot with inventory sync
 * Creates lot in product_lots table and syncs to inventory
 */
export const createProductLotWithInventory = async (params: {
  lot_number: string;
  product_id: number;
  warehouse_id: number;
  batch_code?: string;
  expiry_date?: string;
  received_date?: string;
  quantity: number;
}) => {
  try {
    // Step 1: Create lot in product_lots table
    const { data: lot, error: lotError } = await createProductLot({
      lot_number: params.lot_number,
      product_id: params.product_id,
      warehouse_id: params.warehouse_id,
      batch_code: params.batch_code,
      expiry_date: params.expiry_date,
      received_date: params.received_date,
      quantity: params.quantity,
    });

    if (lotError) throw lotError;
    if (!lot) throw new Error("Failed to create lot");

    // Step 2: Sync to inventory table
    await syncLotQuantityToInventory({
      productId: params.product_id,
      warehouseId: params.warehouse_id,
    });

    return { data: lot as IProductLot, error: null };
  } catch (error: any) {
    return { data: null, error };
  }
};

/**
 * Update product lot
 */
export const updateProductLot = async (
  lotId: number,
  updates: Partial<IProductLot>,
) => {
  const { data, error } = await supabase
    .from("product_lots")
    .update(updates)
    .eq("id", lotId)
    .select()
    .single();

  return { data: data as IProductLot, error };
};

/**
 * Reserve quantity from lot
 */
export const reserveLotQuantity = async (params: {
  lotId: number;
  quantity: number;
  orderId: number;
  orderType: string;
  employeeId: string;
  shelfLocation?: string;
}) => {
  const { data, error } = await supabase.rpc("reserve_lot_quantity_v2", {
    p_lot_id: params.lotId,
    p_quantity: params.quantity,
    p_order_id: params.orderId,
    p_order_type: params.orderType,
    p_employee_id: params.employeeId,
    p_shelf_location: params.shelfLocation,
  });

  return { data, error };
};

/**
 * Sell lot quantity with VAT tracking
 */
export const sellLotQuantity = async (params: {
  lotId: number;
  quantity: number;
  orderId: number;
  orderType: string;
  salesVatInvoiceId?: number;
  employeeId?: string;
}) => {
  const { data, error } = await supabase.rpc("sell_lot_quantity_v2", {
    p_lot_id: params.lotId,
    p_quantity: params.quantity,
    p_order_id: params.orderId,
    p_order_type: params.orderType,
    p_sales_vat_invoice_id: params.salesVatInvoiceId,
    p_employee_id: params.employeeId,
  });

  return { data, error };
};

/**
 * Get lot movements history
 */
export const getLotMovements = async (lotId: number) => {
  const { data, error } = await supabase
    .from("lot_movements")
    .select(
      `
      *,
      performed_by_employee:performed_by(full_name),
      from_warehouse:from_warehouse_id(name),
      to_warehouse:to_warehouse_id(name),
      purchase_vat:purchase_vat_invoice_id(invoice_number),
      sales_vat:sales_vat_invoice_id(invoice_number)
    `,
    )
    .eq("lot_id", lotId)
    .order("created_at", { ascending: false });

  return { data, error };
};

// =====================================================
// VAT INVOICE OPERATIONS (NÚT 4)
// =====================================================

/**
 * Create VAT invoice
 */
export const createVatInvoice = async (invoice: Partial<VatInvoice>) => {
  const { data, error } = await supabase
    .from("vat_invoices")
    .insert(invoice)
    .select()
    .single();

  return { data: data as VatInvoice, error };
};

/**
 * Add items to VAT invoice
 */
export const addVatInvoiceItems = async (
  items: Array<{
    vat_invoice_id: number;
    product_id: number;
    lot_id?: number;
    quantity: number;
    unit_price: number;
    discount_percent?: number;
    discount_amount?: number;
    subtotal: number;
    vat_rate?: number;
    vat_amount: number;
    total_with_vat: number;
    lot_number?: string;
    expiry_date?: string;
  }>,
) => {
  const { data, error } = await supabase
    .from("vat_invoice_items")
    .insert(items)
    .select();

  return { data, error };
};

/**
 * Check VAT availability for a lot
 */
export const checkVatAvailability = async (lotId: number) => {
  const { data, error } = await supabase
    .from("vat_warehouse")
    .select("quantity_available")
    .eq("lot_id", lotId)
    .single();

  return {
    available: data?.quantity_available || 0,
    error,
  };
};

/**
 * Get VAT reconciliation report
 */
export const getVatReconciliation = async (params?: {
  startDate?: string;
  endDate?: string;
  supplierId?: number;
  customerId?: number;
}) => {
  let query = supabase
    .from("lot_movements")
    .select(
      `
      *,
      lot:lot_id(
        lot_number,
        product:product_id(id, name, sku)
      ),
      purchase_vat:purchase_vat_invoice_id(
        invoice_number,
        invoice_date,
        supplier:supplier_id(name)
      ),
      sales_vat:sales_vat_invoice_id(
        invoice_number,
        invoice_date,
        customer:customer_id(customer_name)
      )
    `,
    )
    .not("purchase_vat_invoice_id", "is", null)
    .not("sales_vat_invoice_id", "is", null);

  if (params?.startDate) {
    query = query.gte("created_at", params.startDate);
  }
  if (params?.endDate) {
    query = query.lte("created_at", params.endDate);
  }

  const { data, error } = await query;
  return { data, error };
};

// =====================================================
// BARCODE OPERATIONS (NÚT 3)
// =====================================================

/**
 * Verify barcode and check against order
 */
export const verifyBarcode = async (params: {
  barcode: string;
  orderId?: number;
  orderType?: string;
  context?: string;
  employeeId?: string;
}) => {
  const { data, error } = await supabase.rpc("verify_barcode_v2", {
    p_barcode: params.barcode,
    p_order_id: params.orderId,
    p_order_type: params.orderType,
    p_context: params.context || "inventory_check",
    p_employee_id: params.employeeId,
  });

  return { data: data as BarcodeVerificationResult, error };
};

/**
 * Get barcode verification history
 */
export const getBarcodeVerificationHistory = async (params?: {
  productId?: number;
  orderId?: number;
  startDate?: string;
  limit?: number;
}) => {
  let query = supabase
    .from("barcode_verifications")
    .select(
      `
      *,
      product:product_id(id, name, sku),
      lot:lot_id(lot_number, expiry_date),
      scanned_by_employee:scanned_by(full_name)
    `,
    )
    .order("scanned_at", { ascending: false });

  if (params?.productId) {
    query = query.eq("product_id", params.productId);
  }
  if (params?.orderId) {
    query = query.eq("order_id", params.orderId);
  }
  if (params?.startDate) {
    query = query.gte("scanned_at", params.startDate);
  }
  if (params?.limit) {
    query = query.limit(params.limit);
  }

  const { data, error } = await query;
  return { data, error };
};

// =====================================================
// OCR/AI OPERATIONS (NÚT 2)
// =====================================================

/**
 * Extract lot info from image using OCR
 */
export const extractLotFromImage = async (imageData: string) => {
  // This would call your AI/OCR API endpoint
  const response = await fetch("/api/ocr/extract-lot-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: imageData }),
  });

  if (!response.ok) {
    throw new Error("OCR processing failed");
  }

  return response.json();
};

/**
 * Extract lot info from PDF invoice
 */
export const extractLotFromPDF = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/ocr/extract-lot-pdf", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("PDF processing failed");
  }

  return response.json();
};

/**
 * Process VAT invoice with OCR
 */
export const processVatInvoiceOCR = async (params: {
  invoiceId: number;
  pdfUrl: string;
}) => {
  const response = await fetch("/api/ocr/process-vat-invoice", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error("VAT invoice OCR failed");
  }

  const result = await response.json();

  // Update invoice with OCR data
  await supabase
    .from("vat_invoices")
    .update({
      ocr_status: "completed",
      ocr_data: result.data,
      ocr_confidence: result.confidence,
      ocr_processed_at: new Date().toISOString(),
    })
    .eq("id", params.invoiceId);

  return result;
};

/**
 * Bulk create lots from OCR data
 */
export const bulkCreateLotsFromOCR = async (params: {
  purchaseOrderId: number;
  warehouseId: number;
  ocrData: Array<{
    supplier_product_name: string;
    lot_number: string;
    expiry_date: string;
    quantity: number;
    unit_price: number;
  }>;
  employeeId: string;
}) => {
  const results = [];

  for (const item of params.ocrData) {
    // Map supplier product to internal product
    const { data: mapping } = await supabase
      .from("product_supplier_mapping")
      .select("product_id")
      .ilike("supplier_product_name", `%${item.supplier_product_name}%`)
      .single();

    if (!mapping) {
      results.push({
        success: false,
        error: `Product mapping not found: ${item.supplier_product_name}`,
      });
      continue;
    }

    // Create lot
    const { data: lot, error } = await createProductLot({
      product_id: mapping.product_id,
      lot_number: item.lot_number,
      expiry_date: item.expiry_date,
      created_by: params.employeeId,
    });

    results.push({ success: !error, data: lot, error });
  }

  return results;
};

/**
 * Get expiring lots
 */
export const getExpiringLots = async (params: {
  warehouseId?: number;
  daysUntilExpiry: number;
}) => {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + params.daysUntilExpiry);

  let query = supabase
    .from("product_lots")
    .select(
      `
      *,
      product:product_id(id, name, sku),
      warehouse:warehouse_id(name)
    `,
    )
    .lte("expiry_date", expiryDate.toISOString().split("T")[0])
    .gt("quantity_available", 0)
    .eq("status", "active")
    .order("expiry_date", { ascending: true });

  if (params.warehouseId) {
    query = query.eq("warehouse_id", params.warehouseId);
  }

  const { data, error } = await query;
  return { data, error };
};

// =====================================================
// REPORTING
// =====================================================

/**
 * Get lot inventory summary
 */
export const getLotInventorySummary = async (params?: {
  warehouseId?: number;
  productId?: number;
  status?: string;
  includeExpired?: boolean;
}) => {
  let query = supabase.from("product_lots").select(`
      *,
      product:product_id(id, name, sku),
      warehouse:warehouse_id(name),
      vat_warehouse(quantity_available)
    `);

  if (params?.warehouseId) {
    query = query.eq("warehouse_id", params.warehouseId);
  }
  if (params?.productId) {
    query = query.eq("product_id", params.productId);
  }
  if (params?.status) {
    query = query.eq("status", params.status);
  }

  const { data, error } = await query;

  if (error) return { data: null, error };

  // Transform data to include flattened product/warehouse info
  const transformedData: ProductLotWithDetails[] = (data || []).map(
    (lot: any) => {
      const expiryDate = lot.expiry_date ? new Date(lot.expiry_date) : null;
      const today = new Date();
      const daysUntilExpiry = expiryDate
        ? Math.floor(
            (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
          )
        : undefined;

      return {
        ...lot,
        product_name: lot.product?.name || "",
        product_sku: lot.product?.sku || "",
        warehouse_name: lot.warehouse?.name || "",
        days_until_expiry: daysUntilExpiry,
      };
    },
  );

  return { data: transformedData, error: null };
};

/**
 * Get lots for a specific product with inventory data
 * Calculates from inventory table:
 * - If lot_id is NULL → show as "Mặc Định" (Default) lot with no dates
 * - If lot_id exists → show actual product_lot data
 */
export const getProductLots = async (params: {
  productId: number;
  warehouseId?: number;
  onlyAvailable?: boolean;
}) => {
  // Fetch all inventory records (including those with null lot_id)
  let query = supabase
    .from("product_lots")
    .select(
      `
      *,
      warehouses(id, name)
    `,
    )
    .eq("product_id", params.productId);

  if (params.warehouseId) {
    query = query.eq("warehouse_id", params.warehouseId);
  }

  if (params.onlyAvailable) {
    query = query.gt("quantity", 0);
  }

  const { data, error } = await query;

  if (error) return { data: null, error };

  // Transform and calculate days until expiry
  const lotsWithExpiry = (data || []).map((inv: any) => {
    // If lot_id is null, show as "Mặc Định" (Default) lot
    if (!inv.product_lots) {
      return {
        id: inv.id,
        lot_number: inv.lot_number,
        product_id: params.productId,
        batch_code: null,
        expiry_date: null,
        received_date: null,
        created_at: null,
        updated_at: null,
        warehouse_id: inv.warehouse_id,
        warehouse_name: inv.warehouses?.name || "",
        quantity: inv.quantity,
        days_until_expiry: undefined,
      };
    }

    // Otherwise, show actual lot data
    const lot = inv.product_lots;
    const expiryDate = lot.expiry_date ? new Date(lot.expiry_date) : null;
    const today = new Date();
    const daysUntilExpiry = expiryDate
      ? Math.floor(
          (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
        )
      : undefined;

    return {
      id: lot.id,
      lot_number: lot.lot_number,
      product_id: lot.product_id,
      batch_code: lot.batch_code,
      expiry_date: lot.expiry_date,
      received_date: lot.received_date,
      created_at: lot.created_at,
      updated_at: lot.updated_at,
      warehouse_id: inv.warehouse_id,
      warehouse_name: inv.warehouses?.name || "",
      quantity: lot.quantity,
      days_until_expiry: daysUntilExpiry,
    };
  });

  return { data: lotsWithExpiry, error: null };
};

/**
 * Delete a product lot and resync inventory
 * Deletes the lot and recalculates inventory quantities
 */
export const deleteProductLot = async (params: {
  lotId: number;
  productId: number;
  warehouseId: number;
}) => {
  const { lotId, productId, warehouseId } = params;

  try {
    // Delete the lot from product_lots table
    const { error: deleteError } = await supabase
      .from("product_lots")
      .delete()
      .eq("id", lotId);

    if (deleteError) throw deleteError;

    // Resync inventory quantities using database function
    const syncResult = await syncLotQuantityToInventory({
      productId,
      warehouseId,
    });

    if (syncResult.error) {
      console.error("Failed to sync inventory after delete:", syncResult.error);
    }

    return {
      error: null,
      syncedQuantity: syncResult.totalQuantity,
      success: true,
    };
  } catch (error: any) {
    return { error, success: false };
  }
};

/**
 * Delete all lots for a product
 */
export const deleteAllProductLots = async (productId: number) => {
  const { error } = await supabase
    .from("product_lots")
    .delete()
    .eq("product_id", productId);

  return { error };
};

/**
 * Update inventory quantity for a specific lot
 * Updates product_lots table and syncs to inventory
 * Supports null lot_id for default lots
 */
export const updateProductLotQuantity = async (params: {
  lotId: number | null;
  productId: number;
  warehouseId: number;
  newQuantityAvailable: number;
}) => {
  const { lotId, productId, warehouseId, newQuantityAvailable } = params;

  try {
    // Update product_lots table
    if (lotId) {
      const { error: updateError } = await supabase
        .from("product_lots")
        .update({ quantity: newQuantityAvailable })
        .eq("id", lotId)
        .eq("product_id", productId)
        .eq("warehouse_id", warehouseId);

      if (updateError) throw updateError;
    } else {
      // Handle default lot (lot_id is null) - update by product and warehouse
      const { error: updateError } = await supabase
        .from("product_lots")
        .update({ quantity: newQuantityAvailable })
        .eq("product_id", productId)
        .eq("warehouse_id", warehouseId)
        .eq("lot_number", "Lô mặc định");

      if (updateError) throw updateError;
    }

    // Sync to inventory table
    await syncLotQuantityToInventory({ productId, warehouseId });

    return { error: null };
  } catch (error: any) {
    return { error };
  }
};

/**
 * Update inventory quantity directly
 */
export const updateInventoryQuantity = async (params: {
  productId: number;
  warehouseId: number;
  quantity: number;
}) => {
  const { error } = await supabase
    .from("inventory")
    .update({ quantity: params.quantity })
    .eq("product_id", params.productId)
    .eq("warehouse_id", params.warehouseId);

  return { error };
};

/**
 * Sync product lot quantities to inventory table
 * Uses database function for efficient server-side calculation
 */
export const syncLotQuantityToInventory = async (params: {
  productId: number;
  warehouseId: number;
}) => {
  try {
    // Call database function to sync all lots for this product
    // This will sync all warehouses including the specified one
    const { error } = await supabase.rpc("sync_lots_to_inventory", {
      p_product_id: params.productId,
    });

    if (error) throw error;

    // Get the updated quantity for this specific warehouse
    const { data: inventory } = await supabase
      .from("inventory")
      .select("quantity")
      .eq("product_id", params.productId)
      .eq("warehouse_id", params.warehouseId)
      .single();

    const totalQuantity = inventory?.quantity || 0;

    return { totalQuantity, error: null };
  } catch (error: any) {
    return { totalQuantity: 0, error };
  }
};

/**
 * Sync all product lots to inventory for a specific product
 * Uses database function for efficient server-side calculation
 */
export const syncAllLotsToInventory = async (productId: number) => {
  try {
    // Call database function to sync all lots
    const { data, error } = await supabase.rpc("sync_lots_to_inventory", {
      p_product_id: productId,
    });

    if (error) throw error;

    // Parse the JSON result from database function
    const result = data as {
      success: boolean;
      warehouses_synced: number;
      product_id: number;
    };

    return {
      success: result.success,
      warehousesSynced: result.warehouses_synced,
      error: null,
    };
  } catch (error: any) {
    return { success: false, warehousesSynced: 0, error };
  }
};

/**
 * Fetch lot by ID with product details
 */
export const getLotById = async (lotId: number) => {
  const { data, error } = await supabase
    .from("product_lots")
    .select(
      `
      *,
      products (
        name,
        sku
      ),
      warehouses (
        name,
        id
      )
    `,
    )
    .eq("id", lotId)
    .single();

  return { data, error };
};

export const fetchProductLot = async (lotId: number) => {
  const { data: lotData } = await supabase
    .from("product_lots")
    .select(
      `
      *,
      products (
        name,
        sku
      ),
      warehouses (
        name,
        id
      )
    `,
    )
    .eq("id", lotId)
    .single();
  return lotData;
};

export const fetchInventoryByLotId = async (lotId: number) => {
  const { data: inventoryData } = await supabase
    .from("inventory")
    .select(
      `*,
      warehouses (
        name
      )
    `,
    )
    .eq("lot_id", lotId)
    .order("warehouse_id");

  return inventoryData;
};

/**
 * Fetch lot detail with inventory across all warehouses
 * Shows inventory quantities for this lot in each warehouse
 */
export const fetchLotDetailWithInventory = async (lotId: number) => {
  // Fetch lot basic information with product details
  const { data: lotData, error: lotError } = await supabase
    .from("product_lots")
    .select(
      `
      *,
      products (
        name,
        sku
      )
    `,
    )
    .eq("id", lotId)
    .single();

  if (lotError) return { lotDetail: null, inventory: [], error: lotError };

  // Fetch inventory records where lot_id matches
  const { data: inventoryData, error: inventoryError } = await supabase
    .from("inventory")
    .select(
      `
      quantity,
      warehouse_id,
      lot_id,
      warehouses (
        name
      )
    `,
    )
    .eq("lot_id", lotId)
    .order("warehouse_id");

  if (inventoryError)
    return { lotDetail: lotData, inventory: [], error: inventoryError };

  // Format inventory data
  const formattedInventory = inventoryData.map((inv: any) => ({
    lot_id: inv.lot_id,
    warehouse_id: inv.warehouse_id,
    warehouse_name: inv.warehouses?.name || "",
    quantity: inv.quantity,
  }));

  return { lotDetail: lotData, inventory: formattedInventory, error: null };
};

// /**
//  * Get total quantities of a product across all warehouses from lots
//  * Returns aggregated totals by warehouse and overall total
//  */
// export const getProductLotTotals = async (params: {
//   productId: number;
//   warehouseId?: number;
// }) => {
//   let query = supabase
//     .from("product_lots")
//     .select(
//       `
//       warehouse_id,
//       quantity_received,
//       quantity_reserved,
//       quantity_sold,
//       warehouse:warehouse_id(id, name)
//     `
//     )
//     .eq("product_id", params.productId);

//   // Only filter by warehouse if a valid warehouseId is provided
//   if (params.warehouseId) {
//     query = query.eq("warehouse_id", params.warehouseId);
//   }

//   const { data, error } = await query;

//   if (error) return { data: null, error };

//   // Group by warehouse and calculate totals
//   const warehouseTotals = (data || []).reduce((acc: any, lot: any) => {
//     const warehouseId = lot.warehouse_id;

//     if (!acc[warehouseId]) {
//       acc[warehouseId] = {
//         warehouse_id: warehouseId,
//         warehouse_name: lot.warehouse?.name || "",
//         total_received: 0,
//         total_available: 0,
//         total_reserved: 0,
//         total_sold: 0,
//         lots_count: 0,
//       };
//     }

//     acc[warehouseId].total_received += lot.quantity_received || 0;
//     acc[warehouseId].total_available += lot.quantity_available || 0;
//     acc[warehouseId].total_reserved += lot.quantity_reserved || 0;
//     acc[warehouseId].total_sold += lot.quantity_sold || 0;
//     acc[warehouseId].lots_count += 1;

//     return acc;
//   }, {});

//   const warehouseList = Object.values(warehouseTotals);

//   // Calculate overall totals
//   const overallTotals = {
//     total_received: (data || []).reduce(
//       (sum, lot) => sum + (lot.quantity_received || 0),
//       0
//     ),
//     total_available: (data || []).reduce(
//       (sum, lot) => sum + (lot.quantity || 0),
//       0
//     ),
//     total_reserved: (data || []).reduce(
//       (sum, lot) => sum + (lot.quantity_reserved || 0),
//       0
//     ),
//     total_sold: (data || []).reduce(
//       (sum, lot) => sum + (lot.quantity_sold || 0),
//       0
//     ),
//     total_lots: (data || []).length,
//     warehouses_count: Object.keys(warehouseTotals).length,
//   };

//   return {
//     data: {
//       by_warehouse: warehouseList,
//       overall: overallTotals,
//     },
//     error: null,
//   };
// };

/**
 * Get cost of goods sold (COGS) by lot
 */
export const getCOGSByLot = async (params: {
  startDate: string;
  endDate: string;
  productId?: number;
}) => {
  let query = supabase
    .from("lot_movements")
    .select(
      `
      *,
      lot:lot_id(
        lot_number,
        final_unit_cost,
        product:product_id(id, name, sku)
      )
    `,
    )
    .eq("movement_type", "sold")
    .gte("created_at", params.startDate)
    .lte("created_at", params.endDate);

  if (params.productId) {
    query = query.eq("lot.product_id", params.productId);
  }

  const { data, error } = await query;

  if (error) return { data: null, error };

  // Calculate COGS
  const cogs = data.reduce((total, movement: any) => {
    return total + movement.quantity * (movement.lot?.final_unit_cost || 0);
  }, 0);

  return { data: { cogs, movements: data }, error: null };
};

/**
 * Enable lot management for a product
 * Copies quantities from inventory table to product_lots as default lots
 */
export const enableLotManagement = async (productId: number) => {
  try {
    // Get all inventory records for this product
    const { data: inventoryRecords, error: fetchError } = await supabase
      .from("inventory")
      .select("*")
      .eq("product_id", productId);

    if (fetchError) throw fetchError;
    if (!inventoryRecords || inventoryRecords.length === 0) {
      return { success: true, message: "No inventory to convert" };
    }

    // Create default lots for each warehouse with inventory
    const lotPromises = inventoryRecords
      .filter((inv) => inv.quantity > 0)
      .map(async (inv) => {
        // Create default lot in product_lots table
        const { error: lotError } = await supabase.from("product_lots").insert({
          product_id: productId,
          warehouse_id: inv.warehouse_id,
          lot_number: "Lô mặc định",
          received_date: new Date().toISOString().split("T")[0],
          quantity: inv.quantity,
        });

        return { success: !lotError, error: lotError };
      });

    const results = await Promise.all(lotPromises);
    const failed = results.filter((r) => !r.success);

    if (failed.length > 0) {
      throw new Error(`Failed to create ${failed.length} default lots`);
    }

    // Sync all lots to inventory (inventory should already have the values, but this ensures consistency)
    await syncAllLotsToInventory(productId);

    return { success: true, message: "Lot management enabled successfully" };
  } catch (error: any) {
    return { success: false, error };
  }
};

/**
 * Disable lot management for a product
 * Deletes all product_lots for this product
 */
export const disableLotManagement = async (productId: number) => {
  try {
    // Delete all lots for this product
    const { error } = await supabase
      .from("product_lots")
      .delete()
      .eq("product_id", productId);

    if (error) throw error;

    return { success: true, message: "Lot management disabled successfully" };
  } catch (error: any) {
    return { success: false, error };
  }
};

export default {
  // Lot operations
  getAvailableLots,
  createProductLot,
  createProductLotWithInventory,
  updateProductLot,
  reserveLotQuantity,
  sellLotQuantity,
  getLotMovements,

  // VAT operations
  createVatInvoice,
  addVatInvoiceItems,
  checkVatAvailability,
  getVatReconciliation,

  // Barcode operations
  verifyBarcode,
  getBarcodeVerificationHistory,

  // OCR operations
  extractLotFromImage,
  extractLotFromPDF,
  processVatInvoiceOCR,
  bulkCreateLotsFromOCR,

  // Warehouse operations
  getExpiringLots,

  // Reporting
  getLotInventorySummary,
  getProductLots,
  // getProductLotTotals,
  getCOGSByLot,
  deleteProductLot,
  deleteAllProductLots,
  updateProductLotQuantity,
  updateInventoryQuantity,
  syncLotQuantityToInventory,
  syncAllLotsToInventory,
  getLotById,
  fetchLotDetailWithInventory,

  // Enable/Disable lot management
  enableLotManagement,
  disableLotManagement,
};
