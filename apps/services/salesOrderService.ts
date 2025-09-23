import type { PostgrestSingleResponse } from "@supabase/supabase-js";
import { supabase } from "./supabase";

// Get all sales orders with optional filtering and relations
export const getSalesOrders = async (filters?: {
  patientId?: string;
  medicalVisitId?: string;
  orderType?: string;
  paymentStatus?: string;
  operationalStatus?: string;
  createdByEmployeeId?: string;
  startDate?: string;
  endDate?: string;
  isAiChecked?: boolean;
  limit?: number;
  offset?: number;
}) => {
  let query = supabase
    .from("sales_orders")
    .select(`
      *,
      patients(full_name, phone_number),
      medical_visits(visit_date, patients!inner(full_name)),
      created_by:employees!created_by_employee_id(full_name, role_name),
      sales_order_items(*, products!inner(name, retail_price))
    `);

  if (filters?.patientId) {
    query = query.eq("patient_id", filters.patientId);
  }

  if (filters?.medicalVisitId) {
    query = query.eq("medical_visit_id", filters.medicalVisitId);
  }

  if (filters?.orderType) {
    query = query.eq("order_type", filters.orderType);
  }

  if (filters?.paymentStatus) {
    query = query.eq("payment_status", filters.paymentStatus);
  }

  if (filters?.operationalStatus) {
    query = query.eq("operational_status", filters.operationalStatus);
  }

  if (filters?.createdByEmployeeId) {
    query = query.eq("created_by_employee_id", filters.createdByEmployeeId);
  }

  if (filters?.startDate) {
    query = query.gte("order_datetime", filters.startDate);
  }

  if (filters?.endDate) {
    query = query.lte("order_datetime", filters.endDate);
  }

  if (filters?.isAiChecked !== undefined) {
    query = query.eq("is_ai_checked", filters.isAiChecked);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  if (filters?.offset) {
    query = query.range(filters.offset, (filters.offset + (filters.limit || 10)) - 1);
  }

  const response = await query.order("order_datetime", { ascending: false });
  return response;
};

// Get sales order by ID
export const getSalesOrderById = async (orderId: string): Promise<PostgrestSingleResponse<ISalesOrder | null>> => {
  const response = await supabase
    .from("sales_orders")
    .select(`
      *,
      patients(full_name, phone_number, loyalty_points),
      medical_visits(
        visit_date,
        assessment_diagnosis_icd10,
        doctor:employees!inner(full_name)
      ),
      created_by:employees!created_by_employee_id(full_name, role_name),
      sales_order_items(
        *,
        products!inner(name, manufacturer, retail_price, route)
      )
    `)
    .eq("order_id", orderId)
    .single();

  return response;
};

// Get sales orders by patient ID
export const getSalesOrdersByPatientId = async (patientId: string) => {
  const response = await supabase
    .from("sales_orders")
    .select(`
      *,
      created_by:employees!created_by_employee_id(full_name),
      sales_order_items(*, products!inner(name, retail_price))
    `)
    .eq("patient_id", patientId)
    .order("order_datetime", { ascending: false });

  return response;
};

// Create new sales order
export const createSalesOrder = async (
  order: Omit<ISalesOrder, "order_id" | "order_datetime">
): Promise<PostgrestSingleResponse<ISalesOrder | null>> => {
  const response = await supabase
    .from("sales_orders")
    .insert(order)
    .select()
    .single();

  return response;
};

// Create sales order from medical visit (prescription to sales)
export const createSalesOrderFromMedicalVisit = async (
  medicalVisitId: string,
  createdByEmployeeId: string,
  paymentMethod?: string
): Promise<PostgrestSingleResponse<ISalesOrder | null>> => {
  // First get the medical visit and prescriptions
  const { data: visit } = await supabase
    .from("medical_visits")
    .select(`
      patient_id,
      prescriptions(*, products!inner(retail_price))
    `)
    .eq("visit_id", medicalVisitId)
    .single();

  if (!visit || !visit.prescriptions?.length) {
    throw new Error("Medical visit not found or no prescriptions");
  }

  // Calculate total value
  const totalValue = visit.prescriptions.reduce((sum, prescription) => {
    const price = prescription.products?.retail_price || 0;
    return sum + (price * prescription.quantity_ordered);
  }, 0);

  const salesOrder: Omit<ISalesOrder, "order_id" | "order_datetime"> = {
    patient_id: visit.patient_id,
    medical_visit_id: medicalVisitId,
    order_type: "POS",
    created_by_employee_id: createdByEmployeeId,
    total_value: totalValue,
    payment_method: paymentMethod || null,
    payment_status: "Chờ thanh toán",
    operational_status: "Hoàn tất",
    is_ai_checked: false
  };

  return createSalesOrder(salesOrder);
};

// Update sales order
export const updateSalesOrder = async (
  orderId: string,
  updates: Partial<Omit<ISalesOrder, "order_id" | "order_datetime">>
): Promise<PostgrestSingleResponse<ISalesOrder | null>> => {
  const response = await supabase
    .from("sales_orders")
    .update(updates)
    .eq("order_id", orderId)
    .select()
    .single();

  return response;
};

// Update payment status
export const updatePaymentStatus = async (
  orderId: string,
  paymentStatus: string,
  paymentMethod?: string
): Promise<PostgrestSingleResponse<ISalesOrder | null>> => {
  const updates: any = { payment_status: paymentStatus };
  if (paymentMethod) {
    updates.payment_method = paymentMethod;
  }

  return updateSalesOrder(orderId, updates);
};

// Mark as paid
export const markOrderAsPaid = async (
  orderId: string,
  paymentMethod: string
): Promise<PostgrestSingleResponse<ISalesOrder | null>> => {
  return updatePaymentStatus(orderId, "Đã thanh toán", paymentMethod);
};

// Cancel sales order
export const cancelSalesOrder = async (orderId: string): Promise<PostgrestSingleResponse<ISalesOrder | null>> => {
  return updateSalesOrder(orderId, { operational_status: "Đã hủy" });
};

// Mark as AI checked
export const markAsAiChecked = async (orderId: string): Promise<PostgrestSingleResponse<ISalesOrder | null>> => {
  return updateSalesOrder(orderId, { is_ai_checked: true });
};

// Delete sales order
export const deleteSalesOrder = async (orderId: string): Promise<PostgrestSingleResponse<null>> => {
  const response = await supabase
    .from("sales_orders")
    .delete()
    .eq("order_id", orderId);

  return response;
};

// Get pending payments
export const getPendingPayments = async () => {
  const response = await supabase
    .from("sales_orders")
    .select(`
      *,
      patients(full_name, phone_number),
      created_by:employees!created_by_employee_id(full_name)
    `)
    .in("payment_status", ["Chờ thanh toán", "Thanh toán thiếu"])
    .eq("operational_status", "Hoàn tất")
    .order("order_datetime", { ascending: true });

  return response;
};

// Get orders needing AI check
export const getOrdersNeedingAiCheck = async () => {
  const response = await supabase
    .from("sales_orders")
    .select(`
      *,
      patients(full_name, phone_number),
      sales_order_items(*, products!inner(name))
    `)
    .eq("is_ai_checked", false)
    .eq("operational_status", "Hoàn tất")
    .order("order_datetime", { ascending: true });

  return response;
};

// Get sales statistics
export const getSalesStats = async (startDate?: string, endDate?: string) => {
  let query = supabase
    .from("sales_orders")
    .select("total_value, payment_status, operational_status, order_type, payment_method");

  if (startDate) {
    query = query.gte("order_datetime", startDate);
  }

  if (endDate) {
    query = query.lte("order_datetime", endDate);
  }

  const response = await query;

  if (response.error) {
    return response;
  }

  const stats = response.data?.reduce((acc, order) => {
    acc.total = (acc.total || 0) + 1;
    acc.totalRevenue = (acc.totalRevenue || 0) + order.total_value;

    // Payment status stats
    acc.byPaymentStatus = acc.byPaymentStatus || {};
    acc.byPaymentStatus[order.payment_status || "Không xác định"] =
      (acc.byPaymentStatus[order.payment_status || "Không xác định"] || 0) + 1;

    // Order type stats
    acc.byOrderType = acc.byOrderType || {};
    acc.byOrderType[order.order_type] = (acc.byOrderType[order.order_type] || 0) + 1;

    // Payment method stats
    acc.byPaymentMethod = acc.byPaymentMethod || {};
    acc.byPaymentMethod[order.payment_method || "Không xác định"] =
      (acc.byPaymentMethod[order.payment_method || "Không xác định"] || 0) + 1;

    return acc;
  }, {} as any);

  return { data: stats, error: null };
};

// Get today's sales
export const getTodaysSales = async () => {
  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
  const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

  return getSalesOrders({
    startDate: startOfDay,
    endDate: endOfDay
  });
};

// Get monthly sales summary
export const getMonthlySalesSummary = async (year: number, month: number) => {
  const startDate = new Date(year, month - 1, 1).toISOString();
  const endDate = new Date(year, month, 0, 23, 59, 59, 999).toISOString();

  return getSalesStats(startDate, endDate);
};

// Get top customers by sales value
export const getTopCustomers = async (limit: number = 10, startDate?: string, endDate?: string) => {
  let query = supabase
    .from("sales_orders")
    .select("patient_id, total_value, patients!inner(full_name, phone_number)")
    .eq("operational_status", "Hoàn tất")
    .eq("payment_status", "Đã thanh toán");

  if (startDate) {
    query = query.gte("order_datetime", startDate);
  }

  if (endDate) {
    query = query.lte("order_datetime", endDate);
  }

  const response = await query;

  if (response.error) {
    return response;
  }

  const customerTotals = response.data?.reduce((acc, order) => {
    const patientId = order.patient_id;
    if (!patientId) return acc;

    if (!acc[patientId]) {
      acc[patientId] = {
        patient_id: patientId,
        full_name: order.patients?.full_name,
        phone_number: order.patients?.phone_number,
        total_spent: 0,
        order_count: 0
      };
    }
    acc[patientId].total_spent += order.total_value;
    acc[patientId].order_count += 1;
    return acc;
  }, {} as Record<string, any>);

  const sortedCustomers = Object.values(customerTotals || {})
    .sort((a: any, b: any) => b.total_spent - a.total_spent)
    .slice(0, limit);

  return { data: sortedCustomers, error: null };
};