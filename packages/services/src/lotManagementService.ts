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
 */
export const createProductLot = async (lot: Partial<ProductLot>) => {
  const { data, error } = await supabase
    .from("product_lots")
    .insert(lot)
    .select()
    .single();

  return { data: data as ProductLot, error };
};

/**
 * Update product lot
 */
export const updateProductLot = async (
  lotId: number,
  updates: Partial<ProductLot>
) => {
  const { data, error } = await supabase
    .from("product_lots")
    .update(updates)
    .eq("id", lotId)
    .select()
    .single();

  return { data: data as ProductLot, error };
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
      warehouse_id: params.warehouseId,
      lot_number: item.lot_number,
      expiry_date: item.expiry_date,
      quantity_received: item.quantity,
      quantity_available: item.quantity,
      unit_price_before_vat: item.unit_price,
      final_unit_cost: item.unit_price,
      purchase_order_id: params.purchaseOrderId,
      created_by: params.employeeId,
    });

    results.push({ success: !error, data: lot, error });
  }

  return results;
};

// =====================================================
// WAREHOUSE OPERATIONS
// =====================================================

/**
 * Move lot to shelf location
 */
export const moveLotToShelf = async (params: {
  lotId: number;
  shelfLocation: string;
  aisle?: string;
  rack?: string;
  level?: string;
  employeeId: string;
}) => {
  // Update lot location
  const { error: updateError } = await updateProductLot(params.lotId, {
    shelf_location: params.shelfLocation,
    aisle: params.aisle,
    rack: params.rack,
    level: params.level,
    status: "on_shelf",
  });

  if (updateError) return { error: updateError };

  // Record movement
  const { error: movementError } = await supabase.from("lot_movements").insert({
    lot_id: params.lotId,
    movement_type: "shelved",
    quantity: 0,
    to_location: params.shelfLocation,
    performed_by: params.employeeId,
  });

  return { error: movementError };
};

/**
 * Transfer lot between warehouses
 */
export const transferLotBetweenWarehouses = async (params: {
  lotId: number;
  toWarehouseId: number;
  quantity: number;
  employeeId: string;
  notes?: string;
}) => {
  // Get current lot info
  const { data: lot, error: lotError } = await supabase
    .from("product_lots")
    .select("*, warehouse_id, quantity_available")
    .eq("id", params.lotId)
    .single();

  if (lotError || !lot)
    return { error: lotError || new Error("Lot not found") };

  // Check if quantity is available
  if (lot.quantity_available < params.quantity) {
    return { error: new Error("Insufficient quantity available") };
  }

  // Reduce quantity from source lot
  const { error: reduceError } = await updateProductLot(params.lotId, {
    quantity_available: lot.quantity_available - params.quantity,
  });

  if (reduceError) return { error: reduceError };

  // Create new lot in destination warehouse
  const { data: newLot, error: createError } = await createProductLot({
    product_id: lot.product_id,
    warehouse_id: params.toWarehouseId,
    lot_number: lot.lot_number,
    expiry_date: lot.expiry_date,
    manufacturing_date: lot.manufacturing_date,
    quantity_received: params.quantity,
    quantity_available: params.quantity,
    unit_price_before_vat: lot.unit_price_before_vat,
    vat_percent: lot.vat_percent,
    discount_percent: lot.discount_percent,
    final_unit_cost: lot.final_unit_cost,
    barcode: lot.barcode,
    qr_code: lot.qr_code,
    has_vat_invoice: lot.has_vat_invoice,
    vat_invoice_received: lot.vat_invoice_received,
    status: "active",
    quality_status: lot.quality_status,
    notes: params.notes,
  });

  if (createError) return { error: createError };

  // Record movement from source
  await supabase.from("lot_movements").insert({
    lot_id: params.lotId,
    movement_type: "transfer",
    quantity: params.quantity,
    from_warehouse_id: lot.warehouse_id,
    to_warehouse_id: params.toWarehouseId,
    notes: params.notes,
    performed_by: params.employeeId,
  });

  // Record movement to destination
  await supabase.from("lot_movements").insert({
    lot_id: newLot.id,
    movement_type: "receive",
    quantity: params.quantity,
    from_warehouse_id: lot.warehouse_id,
    to_warehouse_id: params.toWarehouseId,
    notes: params.notes,
    performed_by: params.employeeId,
  });

  return { data: newLot, error: null };
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
 * Get lots for a specific product
 * Simplified function to get all lots of a product across all warehouses
 */
export const getProductLots = async (params: {
  productId: number;
  warehouseId?: number;
  onlyAvailable?: boolean;
}) => {
  let query = supabase
    .from("product_lots")
    .select(
      `
      *,
      warehouse:warehouse_id(id, name)
    `
    )
    .eq("product_id", params.productId)
    .order("expiry_date", { ascending: true });

  if (params.warehouseId) {
    query = query.eq("warehouse_id", params.warehouseId);
  }

  if (params.onlyAvailable) {
    query = query.gt("quantity_available", 0);
  }

  const { data, error } = await query;

  if (error) return { data: null, error };

  // Calculate days until expiry for each lot
  const lotsWithExpiry = (data || []).map((lot: any) => {
    const expiryDate = lot.expiry_date ? new Date(lot.expiry_date) : null;
    const today = new Date();
    const daysUntilExpiry = expiryDate
      ? Math.floor(
          (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        )
      : undefined;

    return {
      ...lot,
      warehouse_name: lot.warehouse?.name || "",
      days_until_expiry: daysUntilExpiry,
    };
  });

  return { data: lotsWithExpiry, error: null };
};

/**
 * Get total quantities of a product across all warehouses from lots
 * Returns aggregated totals by warehouse and overall total
 */
export const getProductLotTotals = async (params: {
  productId: number;
  warehouseId?: number;
}) => {
  let query = supabase
    .from("product_lots")
    .select(
      `
      warehouse_id,
      quantity_received,
      quantity_available,
      quantity_reserved,
      quantity_sold,
      warehouse:warehouse_id(id, name)
    `
    )
    .eq("product_id", params.productId);

  if (params.warehouseId) {
    query = query.eq("warehouse_id", params.warehouseId);
  }

  const { data, error } = await query;

  if (error) return { data: null, error };

  // Group by warehouse and calculate totals
  const warehouseTotals = (data || []).reduce((acc: any, lot: any) => {
    const warehouseId = lot.warehouse_id;

    if (!acc[warehouseId]) {
      acc[warehouseId] = {
        warehouse_id: warehouseId,
        warehouse_name: lot.warehouse?.name || "",
        total_received: 0,
        total_available: 0,
        total_reserved: 0,
        total_sold: 0,
        lots_count: 0,
      };
    }

    acc[warehouseId].total_received += lot.quantity_received || 0;
    acc[warehouseId].total_available += lot.quantity_available || 0;
    acc[warehouseId].total_reserved += lot.quantity_reserved || 0;
    acc[warehouseId].total_sold += lot.quantity_sold || 0;
    acc[warehouseId].lots_count += 1;

    return acc;
  }, {});

  const warehouseList = Object.values(warehouseTotals);

  // Calculate overall totals
  const overallTotals = {
    total_received: (data || []).reduce(
      (sum, lot) => sum + (lot.quantity_received || 0),
      0
    ),
    total_available: (data || []).reduce(
      (sum, lot) => sum + (lot.quantity_available || 0),
      0
    ),
    total_reserved: (data || []).reduce(
      (sum, lot) => sum + (lot.quantity_reserved || 0),
      0
    ),
    total_sold: (data || []).reduce(
      (sum, lot) => sum + (lot.quantity_sold || 0),
      0
    ),
    total_lots: (data || []).length,
    warehouses_count: Object.keys(warehouseTotals).length,
  };

  return {
    data: {
      by_warehouse: warehouseList,
      overall: overallTotals,
    },
    error: null,
  };
};

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
  moveLotToShelf,
  transferLotBetweenWarehouses,
  getLotsByShelfLocation,
  getExpiringLots,

  // Reporting
  getLotInventorySummary,
  getProductLots,
  getProductLotTotals,
  getCOGSByLot,
};
