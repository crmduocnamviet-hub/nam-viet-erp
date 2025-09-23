import type { PostgrestSingleResponse } from "@supabase/supabase-js";
import { supabase } from "./supabase";

// Get all lab orders with optional filtering and relations
export const getLabOrders = async (filters?: {
  visitId?: string;
  serviceName?: string;
  isExecuted?: boolean;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}) => {
  let query = supabase
    .from("lab_orders")
    .select(`
      *,
      medical_visits!inner(
        visit_date,
        patients!inner(full_name, phone_number),
        doctor:employees!inner(full_name)
      )
    `);

  if (filters?.visitId) {
    query = query.eq("visit_id", filters.visitId);
  }

  if (filters?.serviceName) {
    query = query.ilike("service_name", `%${filters.serviceName}%`);
  }

  if (filters?.isExecuted !== undefined) {
    query = query.eq("is_executed", filters.isExecuted);
  }

  if (filters?.startDate || filters?.endDate) {
    let visitQuery = supabase.from("medical_visits").select("visit_id");

    if (filters.startDate) {
      visitQuery = visitQuery.gte("visit_date", filters.startDate);
    }
    if (filters.endDate) {
      visitQuery = visitQuery.lte("visit_date", filters.endDate);
    }

    const { data: visits } = await visitQuery;
    if (visits) {
      const visitIds = visits.map(v => v.visit_id);
      query = query.in("visit_id", visitIds);
    }
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  if (filters?.offset) {
    query = query.range(filters.offset, (filters.offset + (filters.limit || 10)) - 1);
  }

  const response = await query.order("created_at", { ascending: false });
  return response;
};

// Get lab order by ID
export const getLabOrderById = async (orderId: string): Promise<PostgrestSingleResponse<ILabOrder | null>> => {
  const response = await supabase
    .from("lab_orders")
    .select(`
      *,
      medical_visits!inner(
        visit_date,
        assessment_diagnosis_icd10,
        patients!inner(full_name, phone_number, date_of_birth),
        doctor:employees!inner(full_name, role_name)
      )
    `)
    .eq("order_id", orderId)
    .single();

  return response;
};

// Get lab orders by visit ID
export const getLabOrdersByVisitId = async (visitId: string) => {
  const response = await supabase
    .from("lab_orders")
    .select("*")
    .eq("visit_id", visitId)
    .order("created_at", { ascending: true });

  return response;
};

// Create new lab order
export const createLabOrder = async (
  order: Omit<ILabOrder, "order_id">
): Promise<PostgrestSingleResponse<ILabOrder | null>> => {
  const response = await supabase
    .from("lab_orders")
    .insert(order)
    .select()
    .single();

  return response;
};

// Create multiple lab orders for a visit
export const createMultipleLabOrders = async (
  visitId: string,
  orders: Array<{
    service_name: string;
    preliminary_diagnosis?: string;
  }>
): Promise<PostgrestSingleResponse<ILabOrder[]>> => {
  const labOrders = orders.map(order => ({
    visit_id: visitId,
    service_name: order.service_name,
    preliminary_diagnosis: order.preliminary_diagnosis || null,
    is_executed: false,
    result_received_at: null
  }));

  const response = await supabase
    .from("lab_orders")
    .insert(labOrders)
    .select();

  return response;
};

// Update lab order
export const updateLabOrder = async (
  orderId: string,
  updates: Partial<Omit<ILabOrder, "order_id">>
): Promise<PostgrestSingleResponse<ILabOrder | null>> => {
  const response = await supabase
    .from("lab_orders")
    .update(updates)
    .eq("order_id", orderId)
    .select()
    .single();

  return response;
};

// Mark lab order as executed
export const executeLabOrder = async (orderId: string): Promise<PostgrestSingleResponse<ILabOrder | null>> => {
  const response = await supabase
    .from("lab_orders")
    .update({ is_executed: true })
    .eq("order_id", orderId)
    .select()
    .single();

  return response;
};

// Mark result as received
export const receiveLabResult = async (orderId: string): Promise<PostgrestSingleResponse<ILabOrder | null>> => {
  const response = await supabase
    .from("lab_orders")
    .update({ result_received_at: new Date().toISOString() })
    .eq("order_id", orderId)
    .select()
    .single();

  return response;
};

// Delete lab order
export const deleteLabOrder = async (orderId: string): Promise<PostgrestSingleResponse<null>> => {
  const response = await supabase
    .from("lab_orders")
    .delete()
    .eq("order_id", orderId);

  return response;
};

// Get pending lab orders (not executed)
export const getPendingLabOrders = async () => {
  const response = await supabase
    .from("lab_orders")
    .select(`
      *,
      medical_visits!inner(
        visit_date,
        patients!inner(full_name, phone_number),
        doctor:employees!inner(full_name)
      )
    `)
    .eq("is_executed", false)
    .order("created_at", { ascending: true });

  return response;
};

// Get completed lab orders awaiting results
export const getCompletedLabOrdersAwaitingResults = async () => {
  const response = await supabase
    .from("lab_orders")
    .select(`
      *,
      medical_visits!inner(
        visit_date,
        patients!inner(full_name, phone_number),
        doctor:employees!inner(full_name)
      )
    `)
    .eq("is_executed", true)
    .is("result_received_at", null)
    .order("created_at", { ascending: true });

  return response;
};

// Get lab order statistics
export const getLabOrderStats = async (startDate?: string, endDate?: string) => {
  let query = supabase
    .from("lab_orders")
    .select("is_executed, result_received_at, service_name");

  if (startDate || endDate) {
    let visitQuery = supabase.from("medical_visits").select("visit_id");

    if (startDate) {
      visitQuery = visitQuery.gte("visit_date", startDate);
    }
    if (endDate) {
      visitQuery = visitQuery.lte("visit_date", endDate);
    }

    const { data: visits } = await visitQuery;
    if (visits) {
      const visitIds = visits.map(v => v.visit_id);
      query = query.in("visit_id", visitIds);
    }
  }

  const response = await query;

  if (response.error) {
    return response;
  }

  const stats = response.data?.reduce((acc, order) => {
    acc.total = (acc.total || 0) + 1;

    if (order.is_executed) {
      acc.executed = (acc.executed || 0) + 1;
    } else {
      acc.pending = (acc.pending || 0) + 1;
    }

    if (order.result_received_at) {
      acc.resultsReceived = (acc.resultsReceived || 0) + 1;
    }

    // Service type stats
    acc.byService = acc.byService || {};
    acc.byService[order.service_name] = (acc.byService[order.service_name] || 0) + 1;

    return acc;
  }, {} as any);

  return { data: stats, error: null };
};

// Get popular lab services
export const getPopularLabServices = async (limit: number = 10) => {
  const response = await supabase
    .from("lab_orders")
    .select("service_name");

  if (response.error) {
    return response;
  }

  const serviceCounts = response.data?.reduce((acc, order) => {
    acc[order.service_name] = (acc[order.service_name] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sortedServices = Object.entries(serviceCounts || {})
    .sort(([,a], [,b]) => b - a)
    .slice(0, limit)
    .map(([service, count]) => ({ service_name: service, count }));

  return { data: sortedServices, error: null };
};

// Bulk update lab order status
export const bulkUpdateLabOrderStatus = async (
  orderIds: string[],
  isExecuted: boolean
): Promise<PostgrestSingleResponse<ILabOrder[]>> => {
  const response = await supabase
    .from("lab_orders")
    .update({ is_executed: isExecuted })
    .in("order_id", orderIds)
    .select();

  return response;
};