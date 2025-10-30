import { supabase } from "./supabase";
import type {
  IVATInvoiceIn,
  IVATInvoiceOut,
  IVATInvoiceInWithDetails,
  IVATInvoiceOutWithDetails,
  ICreateVATInvoiceIn,
  ICreateVATInvoiceOut,
  IVATInventorySummary,
  VATInvoiceStatus,
} from "../../../../types";

// ============================================
// VAT INVOICES IN (INCOMING/PURCHASE)
// ============================================

/**
 * Get all incoming VAT invoices with optional filters
 */
export const getAllVATInvoicesIn = async (filters?: {
  warehouseId?: number;
  productId?: number;
  supplierId?: number;
  purchaseOrderId?: number;
  startDate?: string;
  endDate?: string;
  invoiceNo?: string;
}) => {
  try {
    let query = supabase
      .from("vat_invoices_in")
      .select(
        `
        *,
        warehouses:warehouse_id(id, name),
        products:product_id(id, name, sku, barcode),
        product_lots:product_lot_id(id, lot_number, expiry_date),
        suppliers:supplier_id(id, name, contact_person),
        purchase_orders:purchase_order_id(id, po_number)
      `,
      )
      .order("invoice_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (filters?.warehouseId) {
      query = query.eq("warehouse_id", filters.warehouseId);
    }

    if (filters?.productId) {
      query = query.eq("product_id", filters.productId);
    }

    if (filters?.supplierId) {
      query = query.eq("supplier_id", filters.supplierId);
    }

    if (filters?.purchaseOrderId) {
      query = query.eq("purchase_order_id", filters.purchaseOrderId);
    }

    if (filters?.invoiceNo) {
      query = query.ilike("invoice_no", `%${filters.invoiceNo}%`);
    }

    if (filters?.startDate) {
      query = query.gte("invoice_date", filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte("invoice_date", filters.endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { data: data as IVATInvoiceInWithDetails[], error: null };
  } catch (error) {
    console.error("Error fetching VAT invoices in:", error);
    return { data: null, error };
  }
};

/**
 * Get a single incoming VAT invoice by ID
 */
export const getVATInvoiceInById = async (id: number) => {
  try {
    const { data, error } = await supabase
      .from("vat_invoices_in")
      .select(
        `
        *,
        warehouses:warehouse_id(id, name),
        products:product_id(id, name, sku, barcode, unit),
        product_lots:product_lot_id(id, lot_number, expiry_date, quantity),
        suppliers:supplier_id(id, name, contact_person, phone),
        purchase_orders:purchase_order_id(id, po_number, order_date)
      `,
      )
      .eq("id", id)
      .single();

    if (error) throw error;

    return { data: data as IVATInvoiceInWithDetails, error: null };
  } catch (error) {
    console.error("Error fetching VAT invoice in:", error);
    return { data: null, error };
  }
};

/**
 * Create a new incoming VAT invoice
 */
export const createVATInvoiceIn = async (invoiceData: ICreateVATInvoiceIn) => {
  try {
    const { data, error } = await supabase
      .from("vat_invoices_in")
      .insert([invoiceData])
      .select(
        `
        *,
        warehouses:warehouse_id(id, name),
        products:product_id(id, name, sku, barcode),
        product_lots:product_lot_id(id, lot_number, expiry_date),
        suppliers:supplier_id(id, name),
        purchase_orders:purchase_order_id(id, po_number)
      `,
      )
      .single();

    if (error) throw error;

    return { data: data as IVATInvoiceInWithDetails, error: null };
  } catch (error) {
    console.error("Error creating VAT invoice in:", error);
    return { data: null, error };
  }
};

/**
 * Create multiple incoming VAT invoices (bulk insert)
 */
export const createBulkVATInvoicesIn = async (
  invoices: ICreateVATInvoiceIn[],
) => {
  try {
    const { data, error } = await supabase
      .from("vat_invoices_in")
      .insert(invoices)
      .select(
        `
        *,
        warehouses:warehouse_id(id, name),
        products:product_id(id, name, sku, barcode),
        product_lots:product_lot_id(id, lot_number)
      `,
      );

    if (error) throw error;

    return { data: data as IVATInvoiceInWithDetails[], error: null };
  } catch (error) {
    console.error("Error creating bulk VAT invoices in:", error);
    return { data: null, error };
  }
};

/**
 * Update an incoming VAT invoice
 */
export const updateVATInvoiceIn = async (
  id: number,
  updates: Partial<IVATInvoiceIn>,
) => {
  try {
    const { data, error } = await supabase
      .from("vat_invoices_in")
      .update(updates)
      .eq("id", id)
      .select(
        `
        *,
        warehouses:warehouse_id(id, name),
        products:product_id(id, name, sku, barcode),
        product_lots:product_lot_id(id, lot_number, expiry_date)
      `,
      )
      .single();

    if (error) throw error;

    return { data: data as IVATInvoiceInWithDetails, error: null };
  } catch (error) {
    console.error("Error updating VAT invoice in:", error);
    return { data: null, error };
  }
};

/**
 * Delete an incoming VAT invoice
 */
export const deleteVATInvoiceIn = async (id: number) => {
  try {
    const { error } = await supabase
      .from("vat_invoices_in")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    console.error("Error deleting VAT invoice in:", error);
    return { error };
  }
};

// ============================================
// VAT INVOICES OUT (OUTGOING/SALES)
// ============================================

/**
 * Get all outgoing VAT invoices with optional filters
 */
export const getAllVATInvoicesOut = async (filters?: {
  warehouseId?: number;
  productId?: number;
  b2bQuoteId?: number;
  saleOrderId?: string;
  status?: VATInvoiceStatus | VATInvoiceStatus[];
  startDate?: string;
  endDate?: string;
  invoiceNo?: string;
}) => {
  try {
    let query = supabase
      .from("vat_invoices_out")
      .select(
        `
        *,
        warehouses:warehouse_id(id, name),
        products:product_id(id, name, sku, barcode),
        product_lots:product_lot_id(id, lot_number, expiry_date),
        b2b_quotes:b2b_quote_id(quote_id, quote_number, customer_name),
        sales_orders:sale_order_id(order_id, order_datetime, total_value)
      `,
      )
      .order("created_at", { ascending: false });

    if (filters?.warehouseId) {
      query = query.eq("warehouse_id", filters.warehouseId);
    }

    if (filters?.productId) {
      query = query.eq("product_id", filters.productId);
    }

    if (filters?.b2bQuoteId) {
      query = query.eq("b2b_quote_id", filters.b2bQuoteId);
    }

    if (filters?.saleOrderId) {
      query = query.eq("sale_order_id", filters.saleOrderId);
    }

    if (filters?.status) {
      if (Array.isArray(filters.status)) {
        query = query.in("status", filters.status);
      } else {
        query = query.eq("status", filters.status);
      }
    }

    if (filters?.invoiceNo) {
      query = query.ilike("invoice_no", `%${filters.invoiceNo}%`);
    }

    if (filters?.startDate) {
      query = query.gte("created_at", filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte("created_at", filters.endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { data: data as IVATInvoiceOutWithDetails[], error: null };
  } catch (error) {
    console.error("Error fetching VAT invoices out:", error);
    return { data: null, error };
  }
};

/**
 * Get a single outgoing VAT invoice by ID
 */
export const getVATInvoiceOutById = async (id: number) => {
  try {
    const { data, error } = await supabase
      .from("vat_invoices_out")
      .select(
        `
        *,
        warehouses:warehouse_id(id, name),
        products:product_id(id, name, sku, barcode, unit),
        product_lots:product_lot_id(id, lot_number, expiry_date, quantity),
        b2b_quotes:b2b_quote_id(quote_id, quote_number, customer_name)
      `,
      )
      .eq("id", id)
      .single();

    if (error) throw error;

    return { data: data as IVATInvoiceOutWithDetails, error: null };
  } catch (error) {
    console.error("Error fetching VAT invoice out:", error);
    return { data: null, error };
  }
};

/**
 * Get outgoing VAT invoices by B2B quote ID
 */
export const getVATInvoicesOutByB2BQuote = async (b2bQuoteId: number) => {
  try {
    const { data, error } = await supabase
      .from("vat_invoices_out")
      .select(
        `
        *,
        warehouses:warehouse_id(id, name),
        products:product_id(id, name, sku, barcode),
        product_lots:product_lot_id(id, lot_number, expiry_date)
      `,
      )
      .eq("b2b_quote_id", b2bQuoteId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return { data: data as IVATInvoiceOutWithDetails[], error: null };
  } catch (error) {
    console.error("Error fetching VAT invoices by B2B quote:", error);
    return { data: null, error };
  }
};

/**
 * Get outgoing VAT invoices by sale order ID
 */
export const getVATInvoicesOutBySaleOrder = async (saleOrderId: string) => {
  try {
    const { data, error } = await supabase
      .from("vat_invoices_out")
      .select(
        `
        *,
        warehouses:warehouse_id(id, name),
        products:product_id(id, name, sku, barcode),
        product_lots:product_lot_id(id, lot_number, expiry_date)
      `,
      )
      .eq("sale_order_id", saleOrderId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return { data: data as IVATInvoiceOutWithDetails[], error: null };
  } catch (error) {
    console.error("Error fetching VAT invoices by sale order:", error);
    return { data: null, error };
  }
};

/**
 * Create a new outgoing VAT invoice (status: pending)
 */
export const createVATInvoiceOut = async (
  invoiceData: ICreateVATInvoiceOut,
) => {
  try {
    const { data, error } = await supabase
      .from("vat_invoices_out")
      .insert([{ ...invoiceData, status: "pending" }])
      .select(
        `
        *,
        warehouses:warehouse_id(id, name),
        products:product_id(id, name, sku, barcode),
        product_lots:product_lot_id(id, lot_number, expiry_date),
        b2b_quotes:b2b_quote_id(quote_id, quote_number)
      `,
      )
      .single();

    if (error) throw error;

    return { data: data as IVATInvoiceOutWithDetails, error: null };
  } catch (error) {
    console.error("Error creating VAT invoice out:", error);
    return { data: null, error };
  }
};

/**
 * Create multiple outgoing VAT invoices (bulk insert)
 */
export const createBulkVATInvoicesOut = async (
  invoices: ICreateVATInvoiceOut[],
) => {
  try {
    const invoicesWithStatus = invoices.map((inv) => ({
      ...inv,
      status: "pending" as VATInvoiceStatus,
    }));

    const { data, error } = await supabase
      .from("vat_invoices_out")
      .insert(invoicesWithStatus)
      .select(
        `
        *,
        warehouses:warehouse_id(id, name),
        products:product_id(id, name, sku, barcode),
        product_lots:product_lot_id(id, lot_number)
      `,
      );

    if (error) throw error;

    return { data: data as IVATInvoiceOutWithDetails[], error: null };
  } catch (error) {
    console.error("Error creating bulk VAT invoices out:", error);
    return { data: null, error };
  }
};

/**
 * Update an outgoing VAT invoice
 */
export const updateVATInvoiceOut = async (
  id: number,
  updates: Partial<IVATInvoiceOut>,
) => {
  try {
    const { data, error } = await supabase
      .from("vat_invoices_out")
      .update(updates)
      .eq("id", id)
      .select(
        `
        *,
        warehouses:warehouse_id(id, name),
        products:product_id(id, name, sku, barcode),
        product_lots:product_lot_id(id, lot_number, expiry_date)
      `,
      )
      .single();

    if (error) throw error;

    return { data: data as IVATInvoiceOutWithDetails, error: null };
  } catch (error) {
    console.error("Error updating VAT invoice out:", error);
    return { data: null, error };
  }
};

/**
 * Generate and issue VAT invoice (change status from pending to done)
 * This now supports multi-product invoices: groups all pending items from the same source
 */
export const issueVATInvoice = async (id: number, invoiceDate?: string) => {
  try {
    // First, get the invoice to find its source
    const { data: firstInvoice, error: fetchError } = await supabase
      .from("vat_invoices_out")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError) throw fetchError;

    // Determine source field (sale_order_id or b2b_quote_id)
    const isFromSaleOrder = firstInvoice.sale_order_id !== null;
    const sourceId = isFromSaleOrder
      ? firstInvoice.sale_order_id
      : firstInvoice.b2b_quote_id;

    // Find ALL pending invoices from the same source (to support multi-product invoices)
    const filterField = isFromSaleOrder ? "sale_order_id" : "b2b_quote_id";

    const { data: allPendingInvoices, error: findError } = await supabase
      .from("vat_invoices_out")
      .select("*")
      .eq(filterField, sourceId)
      .eq("status", "pending");

    if (findError) throw findError;

    if (!allPendingInvoices || allPendingInvoices.length === 0) {
      throw new Error("No pending invoices found for this source");
    }

    // Generate ONE invoice number for all items from this source
    const { data: invoiceNumber, error: genError } = await supabase.rpc(
      "generate_vat_invoice_number",
    );

    if (genError) throw genError;

    // Update ALL pending invoices from the same source with the SAME invoice number
    const updates: Partial<IVATInvoiceOut> = {
      invoice_no: invoiceNumber,
      invoice_date: invoiceDate || new Date().toISOString().split("T")[0],
      status: "done",
    };

    const invoiceIds = allPendingInvoices.map((inv) => inv.id);

    const { data, error } = await supabase
      .from("vat_invoices_out")
      .update(updates)
      .in("id", invoiceIds)
      .select(
        `
        *,
        warehouses:warehouse_id(id, name),
        products:product_id(id, name, sku, barcode),
        product_lots:product_lot_id(id, lot_number)
      `,
      );

    if (error) throw error;

    return { data: data as IVATInvoiceOutWithDetails[], error: null };
  } catch (error) {
    console.error("Error issuing VAT invoice:", error);
    return { data: null, error };
  }
};

/**
 * Cancel an outgoing VAT invoice
 */
export const cancelVATInvoiceOut = async (id: number) => {
  try {
    const { data, error } = await supabase
      .from("vat_invoices_out")
      .update({ status: "cancelled" })
      .eq("id", id)
      .select(
        `
        *,
        warehouses:warehouse_id(id, name),
        products:product_id(id, name, sku, barcode)
      `,
      )
      .single();

    if (error) throw error;

    return { data: data as IVATInvoiceOutWithDetails, error: null };
  } catch (error) {
    console.error("Error cancelling VAT invoice out:", error);
    return { data: null, error };
  }
};

/**
 * Delete an outgoing VAT invoice (only if status is pending)
 */
export const deleteVATInvoiceOut = async (id: number) => {
  try {
    // Check status first
    const { data: invoice, error: fetchError } = await supabase
      .from("vat_invoices_out")
      .select("status")
      .eq("id", id)
      .single();

    if (fetchError) throw fetchError;

    if (invoice.status !== "pending") {
      throw new Error(
        "Only pending invoices can be deleted. Cancel issued invoices instead.",
      );
    }

    const { error } = await supabase
      .from("vat_invoices_out")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    console.error("Error deleting VAT invoice out:", error);
    return { error };
  }
};

// ============================================
// VAT INVENTORY SUMMARY & RECONCILIATION
// ============================================

/**
 * Get VAT inventory summary for reconciliation
 */
export const getVATInventorySummary = async (filters?: {
  warehouseId?: number;
  productId?: number;
  lotId?: number;
  showOnlyDiscrepancies?: boolean;
}) => {
  try {
    let query = supabase
      .from("vat_inventory_summary")
      .select("*")
      .order("warehouse_name")
      .order("product_name");

    if (filters?.warehouseId) {
      query = query.eq("warehouse_id", filters.warehouseId);
    }

    if (filters?.productId) {
      query = query.eq("product_id", filters.productId);
    }

    if (filters?.lotId) {
      query = query.eq("lot_id", filters.lotId);
    }

    if (filters?.showOnlyDiscrepancies) {
      query = query.neq("inventory_difference", 0);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { data: data as IVATInventorySummary[], error: null };
  } catch (error) {
    console.error("Error fetching VAT inventory summary:", error);
    return { data: null, error };
  }
};

/**
 * Get VAT statistics by warehouse
 */
export const getVATStatsByWarehouse = async (warehouseId: number) => {
  try {
    const { data, error } = await supabase
      .from("vat_inventory_summary")
      .select("*")
      .eq("warehouse_id", warehouseId);

    if (error) throw error;

    const summary = data as IVATInventorySummary[];

    // Calculate statistics
    const stats = {
      total_products: summary.length,
      total_vat_in: summary.reduce(
        (sum, item) => sum + Number(item.total_vat_in),
        0,
      ),
      total_vat_out: summary.reduce(
        (sum, item) => sum + Number(item.total_vat_out),
        0,
      ),
      pending_vat_out: summary.reduce(
        (sum, item) => sum + Number(item.pending_vat_out),
        0,
      ),
      current_vat_inventory: summary.reduce(
        (sum, item) => sum + Number(item.current_vat_inventory),
        0,
      ),
      physical_inventory: summary.reduce(
        (sum, item) => sum + Number(item.physical_inventory),
        0,
      ),
      discrepancies: summary.filter(
        (item) => Number(item.inventory_difference) !== 0,
      ).length,
      total_discrepancy_value: summary.reduce(
        (sum, item) => sum + Math.abs(Number(item.inventory_difference)),
        0,
      ),
    };

    return { data: stats, error: null };
  } catch (error) {
    console.error("Error fetching VAT stats by warehouse:", error);
    return { data: null, error };
  }
};

/**
 * Get overall VAT statistics
 */
export const getOverallVATStats = async () => {
  try {
    const { data, error } = await supabase
      .from("vat_inventory_summary")
      .select("*");

    if (error) throw error;

    const summary = data as IVATInventorySummary[];

    const stats = {
      total_warehouses: new Set(summary.map((item) => item.warehouse_id)).size,
      total_products: new Set(summary.map((item) => item.product_id)).size,
      total_vat_in: summary.reduce(
        (sum, item) => sum + Number(item.total_vat_in),
        0,
      ),
      total_vat_out: summary.reduce(
        (sum, item) => sum + Number(item.total_vat_out),
        0,
      ),
      pending_vat_out: summary.reduce(
        (sum, item) => sum + Number(item.pending_vat_out),
        0,
      ),
      current_vat_inventory: summary.reduce(
        (sum, item) => sum + Number(item.current_vat_inventory),
        0,
      ),
      physical_inventory: summary.reduce(
        (sum, item) => sum + Number(item.physical_inventory),
        0,
      ),
      discrepancies: summary.filter(
        (item) => Number(item.inventory_difference) !== 0,
      ).length,
      total_discrepancy_value: summary.reduce(
        (sum, item) => sum + Math.abs(Number(item.inventory_difference)),
        0,
      ),
    };

    return { data: stats, error: null };
  } catch (error) {
    console.error("Error fetching overall VAT stats:", error);
    return { data: null, error };
  }
};
