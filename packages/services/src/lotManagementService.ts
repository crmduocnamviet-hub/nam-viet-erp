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
 * Create a new product lot (metadata only)
 * Note: After schema change, product_lots only stores lot metadata
 * Quantities are tracked in inventory table with lot_id foreign key
 */
export const createProductLot = async (lot: Partial<IProductLot>) => {
  // Only insert lot metadata fields. This is a helper for the more complete createProductLotWithInventory.
  const lotData = {
    lot_number: lot.lot_number,
    product_id: lot.product_id,
    batch_code: lot.batch_code,
    expiry_date: lot.expiry_date,
    received_date: lot.received_date,
  };

  const { data, error } = await supabase
    .from("product_lots")
    .insert(lotData)
    .select()
    .single();

  return { data: data as IProductLot, error };
};

/**
 * Create a new product lot with inventory
 * Creates lot metadata and links it to inventory record
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
  // Step 1: Create lot metadata
  const { data: lot, error: lotError } = await createProductLot(params);

  if (lotError) return { data: null, error: lotError };
  if (!lot)
    return {
      data: null,
      error: {
        message: "Failed to create lot metadata.",
        details: "",
        hint: "",
        code: "500",
      },
    };

  // Step 2: Update or create inventory record with lot_id and quantity
  const { error: inventoryError } = await supabase
    .from("inventory")
    .insert({
      product_id: params.product_id,
      warehouse_id: params.warehouse_id,
      lot_id: lot.id,
      quantity: params.quantity,
    })
    .select()
    .single();

  if (inventoryError) {
    // Rollback: delete the created lot
    await supabase.from("product_lots").delete().eq("id", lot.id);
    return { data: null, error: inventoryError };
  }

  return { data: lot as IProductLot, error: null };
};

/**
 * Update product lot
 */
export const updateProductLot = async (
  lotId: number,
  updates: Partial<IProductLot>
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
    `
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
  }>
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
    `
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
    `
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
 * Get lots by shelf location
 */
export const getLotsByShelfLocation = async (params: {
  warehouseId: number;
  aisle?: string;
  rack?: string;
  level?: string;
}) => {
  let query = supabase
    .from("product_lots")
    .select(
      `
      *,
      product:product_id(id, name, sku, barcode),
      warehouse:warehouse_id(name)
    `
    )
    .eq("warehouse_id", params.warehouseId)
    .eq("status", "on_shelf");

  if (params.aisle) query = query.eq("aisle", params.aisle);
  if (params.rack) query = query.eq("rack", params.rack);
  if (params.level) query = query.eq("level", params.level);

  const { data, error } = await query;
  return { data, error };
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
    `
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
            (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          )
        : undefined;

      return {
        ...lot,
        product_name: lot.product?.name || "",
        product_sku: lot.product?.sku || "",
        warehouse_name: lot.warehouse?.name || "",
        days_until_expiry: daysUntilExpiry,
      };
    }
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
    .from("inventory")
    .select(
      `
      quantity,
      warehouse_id,
      lot_id,
      product_lots(
        id,
        lot_number,
        product_id,
        batch_code,
        expiry_date,
        received_date,
        created_at,
        updated_at
      ),
      warehouses(id, name)
    `
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
    if (!inv.lot_id || !inv.product_lots) {
      return {
        id: null,
        lot_number: "Mặc Định",
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
          (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
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
      quantity: inv.quantity,
      days_until_expiry: daysUntilExpiry,
    };
  });

  return { data: lotsWithExpiry, error: null };
};

/**
 * Delete a product lot
 * Foreign key constraint will set lot_id to NULL in inventory records
 */
export const deleteProductLot = async (params: {
  lotId: number;
  productId: number;
  warehouseId: number;
}) => {
  const { lotId, productId, warehouseId } = params;

  // First, set lot_id to NULL for inventory records linked to this lot
  const { error: unlinkError } = await supabase
    .from("inventory")
    .update({ lot_id: null })
    .eq("lot_id", lotId)
    .eq("product_id", productId)
    .eq("warehouse_id", warehouseId);

  if (unlinkError) return { error: unlinkError };

  // Delete the lot
  const { error: deleteError } = await supabase
    .from("product_lots")
    .delete()
    .eq("id", lotId);

  return { error: deleteError };
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
 * Updates inventory table directly where lot_id matches
 */
export const updateProductLotQuantity = async (params: {
  lotId: number;
  productId: number;
  warehouseId: number;
  newQuantityAvailable: number;
}) => {
  const { lotId, productId, warehouseId, newQuantityAvailable } = params;

  // Update inventory table quantity for this lot
  const { error } = await supabase
    .from("inventory")
    .update({ quantity: newQuantityAvailable })
    .eq("lot_id", lotId)
    .eq("product_id", productId)
    .eq("warehouse_id", warehouseId);

  return { error };
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
 * No longer needed - quantities are tracked directly in inventory table
 * Kept for backward compatibility but does nothing
 */
export const syncLotQuantityToInventory = async (params: {
  productId: number;
  warehouseId: number;
}) => {
  // With new schema, inventory table has lot_id and tracks quantities directly
  // No need to sync from product_lots to inventory
  return { totalQuantity: 0, error: null };
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
      )
    `
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
      )
    `
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
    `
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
    `
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
    `
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
    `
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
  getLotsByShelfLocation,
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
  getLotById,
  fetchLotDetailWithInventory,
};
