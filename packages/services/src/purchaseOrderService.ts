import { supabase } from "./supabase";

/**
 * Generate the next PO number
 */
export const generatePONumber = async () => {
  const { data, error } = await supabase.rpc("generate_po_number");

  if (error) {
    console.error("Error generating PO number:", error);
    // Fallback to timestamp-based number if function fails
    return `PO-${Date.now()}`;
  }

  return data as string;
};

/**
 * Get all purchase orders
 */
export const getPurchaseOrder = async () => {
  const response = await supabase
    .from("purchase_orders")
    .select("*, suppliers(name)")
    .order("created_at", { ascending: false });

  return response;
};

export const getPurchaseOrders = async (filters?: {
  status?: string;
  supplierId?: number;
  startDate?: string;
  endDate?: string;
}) => {
  let query = supabase
    .from("purchase_orders")
    .select(
      `
      *,
      supplier:suppliers(*),
      items:purchase_order_items(
        *,
        product:products(*)
      )
    `,
    )
    .order("order_date", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  if (filters?.supplierId) {
    query = query.eq("supplier_id", filters.supplierId);
  }

  if (filters?.startDate) {
    query = query.gte("order_date", filters.startDate);
  }

  if (filters?.endDate) {
    query = query.lte("order_date", filters.endDate);
  }

  return await query;
};

/**
 * Get purchase order by ID
 */
export const getPurchaseOrderById = async (id: number) => {
  return await supabase
    .from("purchase_orders")
    .select(
      `
      *,
      supplier:suppliers(*),
      items:purchase_order_items(
        *,
        product:products(*)
      )
    `,
    )
    .eq("id", id)
    .single();
};

/**
 * Create a purchase order
 */
export const createPurchaseOrder = async (
  order: Omit<IPurchaseOrder, "id" | "created_at" | "updated_at" | "po_number">,
  items: Omit<IPurchaseOrderItem, "id" | "po_id" | "created_at">[],
) => {
  // Generate PO number
  const poNumber = await generatePONumber();

  // Create the purchase order
  const { data: orderData, error: orderError } = await supabase
    .from("purchase_orders")
    .insert({ ...order, po_number: poNumber })
    .select()
    .single();

  if (orderError || !orderData) {
    throw new Error(`Failed to create purchase order: ${orderError?.message}`);
  }

  // Create the purchase order items
  const itemsWithPoId = items.map((item) => ({
    ...item,
    po_id: orderData.id,
  }));

  const { data: itemsData, error: itemsError } = await supabase
    .from("purchase_order_items")
    .insert(itemsWithPoId)
    .select();

  if (itemsError) {
    // Rollback the order if items creation fails
    await supabase.from("purchase_orders").delete().eq("id", orderData.id);
    throw new Error(
      `Failed to create purchase order items: ${itemsError.message}`,
    );
  }

  return { order: orderData, items: itemsData };
};

/**
 * Update purchase order status
 */
export const updatePurchaseOrderStatus = async (
  id: number,
  status: IPurchaseOrder["status"],
) => {
  return await supabase
    .from("purchase_orders")
    .update({ status })
    .eq("id", id)
    .select()
    .single();
};

/**
 * Update purchase order
 */
export const updatePurchaseOrder = async (
  id: number,
  updates: Partial<
    Omit<IPurchaseOrder, "id" | "po_number" | "created_at" | "updated_at">
  >,
) => {
  return await supabase
    .from("purchase_orders")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
};

/**
 * Update received quantity for a purchase order item
 */
export const updateReceivedQuantity = async (
  itemId: number,
  receivedQuantity: number,
) => {
  return await supabase
    .from("purchase_order_items")
    .update({ received_quantity: receivedQuantity })
    .eq("id", itemId)
    .select()
    .single();
};

/**
 * Cancel a purchase order (set status to cancelled)
 */
export const cancelPurchaseOrder = async (id: number) => {
  return await supabase
    .from("purchase_orders")
    .update({ status: "cancelled" })
    .eq("id", id)
    .select()
    .single();
};

/**
 * Delete a purchase order and its items
 */
export const deletePurchaseOrder = async (id: number) => {
  // First delete all items
  const { error: itemsError } = await supabase
    .from("purchase_order_items")
    .delete()
    .eq("po_id", id);

  if (itemsError) {
    throw new Error(
      `Failed to delete purchase order items: ${itemsError.message}`,
    );
  }

  // Then delete the purchase order
  const { error: orderError } = await supabase
    .from("purchase_orders")
    .delete()
    .eq("id", id);

  if (orderError) {
    throw new Error(`Failed to delete purchase order: ${orderError.message}`);
  }

  return { success: true };
};

/**
 * ANALYZE PRODUCTS NEEDING REORDER (Preview only)
 *
 * Logic:
 * 1. Find products where current_stock <= min_stock
 * 2. Product must have a supplier assigned
 * 3. Product must NOT be in status "ordered" (awaiting receipt)
 * 4. Calculate quantity needed: max_stock - current_stock
 * Returns suggested products without creating POs
 */
export const analyzeProductsNeedingReorder = async (
  warehouseId: number,
): Promise<{
  productsToOrder: any[];
  totalAmount: number;
  supplierCount: number;
}> => {
  // Step 1: Get inventory items that need restocking
  const { data: inventoryData, error: inventoryError } = await supabase
    .from("inventory")
    .select(
      `
      *,
      products(*, suppliers(*))
    `,
    )
    .eq("warehouse_id", warehouseId)
    .not("products.supplier_id", "is", null);

  if (inventoryError) {
    throw new Error(`Failed to fetch inventory: ${inventoryError.message}`);
  }

  // Step 2: Get all pending purchase orders to check for products already ordered
  const { data: pendingPOs, error: poError } = await supabase
    .from("purchase_orders")
    .select(
      `
      id,
      items:purchase_order_items(product_id)
    `,
    )
    .in("status", ["draft", "sent", "ordered", "partially_received"]);

  if (poError) {
    console.error("Error fetching pending POs:", poError);
  }

  // Create a Set of product IDs that are already in pending orders
  const productsInPendingOrders = new Set(
    (pendingPOs || []).flatMap((po: any) =>
      (po.items || []).map((item: any) => item.product_id),
    ),
  );

  // Step 3: Filter products that need to be ordered
  const productsToOrder: any[] = [];

  (inventoryData || []).forEach((inv: any) => {
    const product = inv.products;
    if (!product) return;

    const currentStock = inv.quantity || 0;
    // Use min_stock and max_stock from inventory table, not product table
    const minStock = inv.min_stock || 0;
    const maxStock = inv.max_stock || 0;

    // Check conditions
    const needsRestocking = currentStock <= minStock;
    const hasSupplier = product.supplier_id !== null;
    const notAlreadyOrdered = !productsInPendingOrders.has(product.id);
    const hasMaxStock = maxStock > 0;

    if (needsRestocking && hasSupplier && notAlreadyOrdered && hasMaxStock) {
      const quantityNeeded = maxStock - currentStock;
      if (quantityNeeded > 0) {
        productsToOrder.push({
          product_id: product.id,
          product_name: product.name,
          supplier_id: product.supplier_id,
          supplier_name: product.suppliers?.name || "Unknown",
          current_stock: currentStock,
          min_stock: minStock,
          max_stock: maxStock,
          quantity_needed: quantityNeeded,
          unit_price: product.wholesale_price || product.cost_price || 0,
        });
      }
    }
  });

  // Group by supplier to count
  const supplierIds = new Set(productsToOrder.map((p) => p.supplier_id));

  // Calculate total amount
  const totalAmount = productsToOrder.reduce(
    (sum, p) => sum + p.quantity_needed * p.unit_price,
    0,
  );

  return {
    productsToOrder,
    totalAmount,
    supplierCount: supplierIds.size,
  };
};

/**
 * CREATE PURCHASE ORDERS FROM EDITED PRODUCT LIST
 *
 * Used by the Auto Generate PO Modal after user edits quantities
 * Groups products by supplier and creates one PO per supplier
 */
export const createPurchaseOrdersFromProducts = async (
  products: Array<{
    product_id: number;
    product_name: string;
    supplier_id: number;
    supplier_name: string;
    quantity_needed: number;
    unit_price: number;
  }>,
  warehouseId: number,
  createdBy: string | null,
) => {
  if (products.length === 0) {
    return { message: "No products to order", purchaseOrders: [] };
  }

  // Group products by supplier
  const productsBySupplier: Record<number, typeof products> = {};
  products.forEach((product) => {
    const supplierId = product.supplier_id;
    if (!productsBySupplier[supplierId]) {
      productsBySupplier[supplierId] = [];
    }
    productsBySupplier[supplierId].push(product);
  });

  // Create one purchase order per supplier
  const createdPurchaseOrders: any[] = [];

  for (const [supplierId, supplierProducts] of Object.entries(
    productsBySupplier,
  )) {
    const totalAmount = supplierProducts.reduce(
      (sum, p) => sum + p.quantity_needed * p.unit_price,
      0,
    );

    const items = supplierProducts.map((p) => ({
      product_id: p.product_id,
      quantity: p.quantity_needed,
      received_quantity: 0,
    }));

    try {
      const result = await createPurchaseOrder(
        {
          supplier_id: Number(supplierId),
          order_date: new Date().toISOString().split("T")[0],
          expected_delivery_date: null,
          status: "draft",
          total_amount: totalAmount,
          notes: `Auto-generated purchase order for restocking (Warehouse ID: ${warehouseId})`,
          created_by: createdBy,
        },
        items,
      );

      createdPurchaseOrders.push(result);
    } catch (error: any) {
      console.error(`Failed to create PO for supplier ${supplierId}:`, error);
    }
  }

  return {
    message: `Created ${createdPurchaseOrders.length} purchase order(s) for ${products.length} product(s)`,
    purchaseOrders: createdPurchaseOrders,
    productsOrdered: products,
  };
};

/**
 * AUTO-GENERATE PURCHASE ORDERS (NÚT 1)
 *
 * Logic:
 * 1. Find products where current_stock <= min_stock
 * 2. Product must have a supplier assigned
 * 3. Product must NOT be in status "ordered" (awaiting receipt)
 * 4. Calculate quantity needed: max_stock - current_stock
 * 5. Group products by supplier
 * 6. Create one PO per supplier
 */
export const autoGeneratePurchaseOrders = async (
  warehouseId: number,
  createdBy: string | null,
) => {
  // Step 1: Get inventory items that need restocking
  const { data: inventoryData, error: inventoryError } = await supabase
    .from("inventory")
    .select(
      `
      *,
      products(*, suppliers(*))
    `,
    )
    .eq("warehouse_id", warehouseId)
    .not("products.supplier_id", "is", null);

  if (inventoryError) {
    throw new Error(`Failed to fetch inventory: ${inventoryError.message}`);
  }

  // Step 2: Get all pending purchase orders to check for products already ordered
  const { data: pendingPOs, error: poError } = await supabase
    .from("purchase_orders")
    .select(
      `
      id,
      items:purchase_order_items(product_id)
    `,
    )
    .in("status", ["draft", "sent", "ordered", "partially_received"]);

  if (poError) {
    console.error("Error fetching pending POs:", poError);
  }

  // Create a Set of product IDs that are already in pending orders
  const productsInPendingOrders = new Set(
    (pendingPOs || []).flatMap((po: any) =>
      (po.items || []).map((item: any) => item.product_id),
    ),
  );

  // Step 3: Filter products that need to be ordered
  const productsToOrder: any[] = [];

  (inventoryData || []).forEach((inv: any) => {
    const product = inv.products;
    if (!product) return;

    const currentStock = inv.quantity || 0;
    // Use min_stock and max_stock from inventory table, not product table
    const minStock = inv.min_stock || 0;
    const maxStock = inv.max_stock || 0;

    // Check conditions
    const needsRestocking = currentStock <= minStock;
    const hasSupplier = product.supplier_id !== null;
    const notAlreadyOrdered = !productsInPendingOrders.has(product.id);
    const hasMaxStock = maxStock > 0;

    if (needsRestocking && hasSupplier && notAlreadyOrdered && hasMaxStock) {
      const quantityNeeded = maxStock - currentStock;
      if (quantityNeeded > 0) {
        productsToOrder.push({
          product_id: product.id,
          product_name: product.name,
          supplier_id: product.supplier_id,
          supplier_name: product.suppliers?.name || "Unknown",
          current_stock: currentStock,
          min_stock: minStock,
          max_stock: maxStock,
          quantity_needed: quantityNeeded,
          unit_price: product.wholesale_price || product.cost_price || 0,
        });
      }
    }
  });

  if (productsToOrder.length === 0) {
    return { message: "No products need restocking", purchaseOrders: [] };
  }

  // Step 4: Group products by supplier
  const productsBySupplier: Record<number, any[]> = {};
  productsToOrder.forEach((product) => {
    const supplierId = product.supplier_id;
    if (!productsBySupplier[supplierId]) {
      productsBySupplier[supplierId] = [];
    }
    productsBySupplier[supplierId].push(product);
  });

  // Step 5: Create one purchase order per supplier
  const createdPurchaseOrders: any[] = [];

  for (const [supplierId, products] of Object.entries(productsBySupplier)) {
    const totalAmount = products.reduce(
      (sum, p) => sum + p.quantity_needed * p.unit_price,
      0,
    );

    const items = products.map((p) => ({
      product_id: p.product_id,
      quantity: p.quantity_needed,
      // unit_price: p.unit_price,
      received_quantity: 0,
    }));

    try {
      const result = await createPurchaseOrder(
        {
          supplier_id: Number(supplierId),
          order_date: new Date().toISOString().split("T")[0],
          expected_delivery_date: null,
          status: "draft",
          total_amount: totalAmount,
          notes: `Auto-generated purchase order for restocking (Warehouse ID: ${warehouseId})`,
          created_by: createdBy,
        },
        items,
      );

      createdPurchaseOrders.push(result);
    } catch (error: any) {
      console.error(`Failed to create PO for supplier ${supplierId}:`, error);
    }
  }

  return {
    message: `Created ${createdPurchaseOrders.length} purchase order(s) for ${productsToOrder.length} product(s)`,
    purchaseOrders: createdPurchaseOrders,
    productsOrdered: productsToOrder,
  };
};
