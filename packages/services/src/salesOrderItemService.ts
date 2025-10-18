import type { PostgrestSingleResponse } from "@supabase/supabase-js";
import { supabase } from "./supabase";

// Get all sales order items with optional filtering and relations
export const getSalesOrderItems = async (filters?: {
  orderId?: string;
  productId?: number;
  isService?: boolean;
  limit?: number;
  offset?: number;
}) => {
  let query = supabase.from("sales_order_items").select(`
      *,
      sales_orders!inner(
        order_datetime,
        patients(full_name, phone_number)
      ),
      products!inner(name, manufacturer, retail_price, route)
    `);

  if (filters?.orderId) {
    query = query.eq("order_id", filters.orderId);
  }

  if (filters?.productId) {
    query = query.eq("product_id", filters.productId);
  }

  if (filters?.isService !== undefined) {
    query = query.eq("is_service", filters.isService);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  if (filters?.offset) {
    query = query.range(
      filters.offset,
      filters.offset + (filters.limit || 10) - 1,
    );
  }

  const response = await query.order("created_at", { ascending: false });
  return response;
};

// Get sales order item by ID
export const getSalesOrderItemById = async (
  itemId: string,
): Promise<PostgrestSingleResponse<ISalesOrderItem | null>> => {
  const response = await supabase
    .from("sales_order_items")
    .select(
      `
      *,
      sales_orders!inner(
        order_datetime,
        total_value,
        patients(full_name, phone_number)
      ),
      products!inner(name, manufacturer, retail_price, route, hdsd_over_18)
    `,
    )
    .eq("item_id", itemId)
    .single();

  return response;
};

// Get sales order items by order ID
export const getSalesOrderItemsByOrderId = async (orderId: string) => {
  const response = await supabase
    .from("sales_order_items")
    .select(
      `
      *,
      products!inner(name, manufacturer, retail_price, route)
    `,
    )
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });

  return response;
};

// Create new sales order item
export const createSalesOrderItem = async (
  i: Omit<ISalesOrderItem, "item_id">,
): Promise<PostgrestSingleResponse<ISalesOrderItem | null>> => {
  const response = await supabase
    .from("sales_order_items")
    .insert({
      dosage_printed: i.dosage_printed,
      is_service: i.is_service,
      order_id: i.order_id,
      product_id: i.product_id,
      quantity: i.quantity,
      unit_price: i.unit_price,
    })
    .select()
    .single();

  return response;
};

// Create multiple sales order items
export const createMultipleSalesOrderItems = async (
  orderId: string,
  items: Array<{
    product_id: number;
    quantity: number;
    unit_price: number;
    is_service?: boolean;
    dosage_printed?: string;
    lot_id?: number | null;
  }>,
): Promise<PostgrestSingleResponse<ISalesOrderItem[]>> => {
  const salesOrderItems = items.map((item) => ({
    order_id: orderId,
    product_id: item.product_id,
    quantity: item.quantity,
    unit_price: item.unit_price,
    is_service: item.is_service || false,
    dosage_printed: item.dosage_printed || null,
    lot_id: item.lot_id || null,
  }));

  const response = await supabase
    .from("sales_order_items")
    .insert(
      salesOrderItems.map((i) => ({
        dosage_printed: i.dosage_printed,
        is_service: i.is_service,
        order_id: i.order_id,
        product_id: i.product_id,
        quantity: i.quantity,
        unit_price: i.unit_price,
      })),
    )
    .select();

  return response;
};

// Create sales order items from prescriptions
export const createSalesOrderItemsFromPrescriptions = async (
  orderId: string,
  visitId: string,
): Promise<PostgrestSingleResponse<ISalesOrderItem[]>> => {
  // First get prescriptions with product prices
  const { data: prescriptions } = await supabase
    .from("prescriptions")
    .select(
      `
      *,
      products!inner(retail_price)
    `,
    )
    .eq("visit_id", visitId);

  if (!prescriptions?.length) {
    throw new Error("No prescriptions found for this visit");
  }

  const items = prescriptions.map((prescription) => ({
    order_id: orderId,
    product_id: parseInt(prescription.product_id),
    quantity: prescription.quantity_ordered,
    unit_price: prescription.products?.retail_price || 0,
    is_service: false,
    dosage_printed: prescription.dosage_instruction,
  }));

  return createMultipleSalesOrderItems(orderId, items);
};

// Update sales order item
export const updateSalesOrderItem = async (
  itemId: string,
  updates: Partial<Omit<ISalesOrderItem, "item_id">>,
): Promise<PostgrestSingleResponse<ISalesOrderItem | null>> => {
  const response = await supabase
    .from("sales_order_items")
    .update(updates)
    .eq("item_id", itemId)
    .select()
    .single();

  return response;
};

// Delete sales order item
export const deleteSalesOrderItem = async (
  itemId: string,
): Promise<PostgrestSingleResponse<null>> => {
  const response = await supabase
    .from("sales_order_items")
    .delete()
    .eq("item_id", itemId);

  return response;
};

// Delete all items for an order
export const deleteSalesOrderItemsByOrderId = async (
  orderId: string,
): Promise<PostgrestSingleResponse<null>> => {
  const response = await supabase
    .from("sales_order_items")
    .delete()
    .eq("order_id", orderId);

  return response;
};

// Get product sales statistics
export const getProductSalesStats = async (
  productId?: number,
  startDate?: string,
  endDate?: string,
) => {
  let query = supabase
    .from("sales_order_items")
    .select(
      `
      quantity,
      unit_price,
      is_service,
      sales_orders!inner(order_datetime, operational_status)
    `,
    )
    .eq("sales_orders.operational_status", "Hoàn tất");

  if (productId) {
    query = query.eq("product_id", productId);
  }

  if (startDate) {
    query = query.gte("sales_orders.order_datetime", startDate);
  }

  if (endDate) {
    query = query.lte("sales_orders.order_datetime", endDate);
  }

  const response = await query;

  if (response.error) {
    return response;
  }

  const stats = response.data?.reduce((acc, item) => {
    acc.totalQuantity = (acc.totalQuantity || 0) + item.quantity;
    acc.totalRevenue =
      (acc.totalRevenue || 0) + item.quantity * item.unit_price;
    acc.totalOrders = (acc.totalOrders || 0) + 1;

    if (item.is_service) {
      acc.serviceItems = (acc.serviceItems || 0) + 1;
    } else {
      acc.productItems = (acc.productItems || 0) + 1;
    }

    return acc;
  }, {} as any);

  return { data: stats, error: null };
};

// Get best selling products
export const getBestSellingProducts = async (
  limit: number = 10,
  startDate?: string,
  endDate?: string,
) => {
  let query = supabase
    .from("sales_order_items")
    .select(
      `
      product_id,
      quantity,
      unit_price,
      products!inner(name, manufacturer),
      sales_orders!inner(order_datetime, operational_status)
    `,
    )
    .eq("sales_orders.operational_status", "Hoàn tất")
    .eq("is_service", false);

  if (startDate) {
    query = query.gte("sales_orders.order_datetime", startDate);
  }

  if (endDate) {
    query = query.lte("sales_orders.order_datetime", endDate);
  }

  const response = await query;

  if (response.error) {
    return response;
  }

  const productStats = response.data?.reduce(
    (acc, item) => {
      const productId = item.product_id;

      if (!acc[productId]) {
        acc[productId] = {
          product_id: productId,
          name: (item.products as any)?.name,
          manufacturer: (item.products as any)?.manufacturer,
          total_quantity: 0,
          total_revenue: 0,
          order_count: 0,
        };
      }

      acc[productId].total_quantity += item.quantity;
      acc[productId].total_revenue += item.quantity * item.unit_price;
      acc[productId].order_count += 1;

      return acc;
    },
    {} as Record<number, any>,
  );

  const sortedProducts = Object.values(productStats || {})
    .sort((a: any, b: any) => b.total_quantity - a.total_quantity)
    .slice(0, limit);

  return { data: sortedProducts, error: null };
};

// Get service items statistics
export const getServiceItemStats = async (
  startDate?: string,
  endDate?: string,
) => {
  let query = supabase
    .from("sales_order_items")
    .select(
      `
      quantity,
      unit_price,
      sales_orders!inner(order_datetime, operational_status)
    `,
    )
    .eq("is_service", true)
    .eq("sales_orders.operational_status", "Hoàn tất");

  if (startDate) {
    query = query.gte("sales_orders.order_datetime", startDate);
  }

  if (endDate) {
    query = query.lte("sales_orders.order_datetime", endDate);
  }

  const response = await query;

  if (response.error) {
    return response;
  }

  const stats = response.data?.reduce((acc, item) => {
    acc.totalServiceItems = (acc.totalServiceItems || 0) + item.quantity;
    acc.totalServiceRevenue =
      (acc.totalServiceRevenue || 0) + item.quantity * item.unit_price;
    acc.serviceOrderCount = (acc.serviceOrderCount || 0) + 1;

    return acc;
  }, {} as any);

  return { data: stats, error: null };
};

// Calculate order total from items
export const calculateOrderTotal = async (orderId: string) => {
  const response = await supabase
    .from("sales_order_items")
    .select("quantity, unit_price")
    .eq("order_id", orderId);

  if (response.error) {
    return response;
  }

  const total =
    response.data?.reduce((sum, item) => {
      return sum + item.quantity * item.unit_price;
    }, 0) || 0;

  return { data: { total }, error: null };
};

// Update dosage instructions for prescription items
export const updateDosageInstructions = async (
  itemId: string,
  dosageInstructions: string,
): Promise<PostgrestSingleResponse<ISalesOrderItem | null>> => {
  return updateSalesOrderItem(itemId, { dosage_printed: dosageInstructions });
};

// Get items that need dosage printing
export const getItemsNeedingDosagePrint = async () => {
  const response = await supabase
    .from("sales_order_items")
    .select(
      `
      *,
      products!inner(name),
      sales_orders!inner(order_datetime, patients!inner(full_name))
    `,
    )
    .eq("is_service", false)
    .not("dosage_printed", "is", null)
    .order("created_at", { ascending: true });

  return response;
};
