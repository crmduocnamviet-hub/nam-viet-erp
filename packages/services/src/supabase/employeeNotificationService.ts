import { supabase } from "./supabase";

// Notification Types
export type NotificationType =
  | "order_new"
  | "order_updated"
  | "order_cancelled"
  | "inventory_low"
  | "inventory_expired"
  | "appointment_new"
  | "appointment_reminder"
  | "appointment_cancelled"
  | "quote_new"
  | "quote_updated"
  | "purchase_order"
  | "payment_due"
  | "task_assigned"
  | "system"
  | "other";

export type NotificationPriority = "low" | "normal" | "high" | "urgent";

// Notification Interface
export interface INotification {
  id: number;
  employee_id: string;
  notification_type: NotificationType;
  title: string;
  body: string;
  priority?: NotificationPriority;
  metadata?: Record<string, any>;
  action_url?: string;
  action_label?: string;
  icon?: string;
  image_url?: string;
  is_read: boolean;
  read_at?: string;
  sent_to_fcm: boolean;
  fcm_sent_at?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  expires_at?: string;
}

export interface ICreateNotification {
  employee_id: string;
  notification_type: NotificationType;
  title: string;
  body: string;
  priority?: NotificationPriority;
  metadata?: Record<string, any>;
  action_url?: string;
  action_label?: string;
  icon?: string;
  image_url?: string;
  created_by?: string;
  expires_at?: string;
}

/**
 * Create a new notification
 */
export const createNotification = async (notification: ICreateNotification) => {
  return await supabase
    .from("notifications")
    .insert({
      ...notification,
      metadata: notification.metadata || {},
    })
    .select()
    .single();
};

/**
 * Create multiple notifications (bulk)
 */
export const createNotifications = async (
  notifications: ICreateNotification[],
) => {
  return await supabase
    .from("notifications")
    .insert(
      notifications.map((n) => ({
        ...n,
        metadata: n.metadata || {},
      })),
    )
    .select();
};

/**
 * Get notifications for an employee
 */
export const getNotifications = async (
  employeeId: string,
  filters?: {
    type?: NotificationType;
    isRead?: boolean;
    priority?: NotificationPriority;
    limit?: number;
    offset?: number;
  },
) => {
  let query = supabase
    .from("notifications")
    .select("*", { count: "exact" })
    .eq("employee_id", employeeId)
    .order("created_at", { ascending: false });

  if (filters?.type) {
    query = query.eq("notification_type", filters.type);
  }

  if (filters?.isRead !== undefined) {
    query = query.eq("is_read", filters.isRead);
  }

  if (filters?.priority) {
    query = query.eq("priority", filters.priority);
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

  return await query;
};

/**
 * Get unread notifications for an employee
 */
export const getUnreadNotifications = async (
  employeeId: string,
  limit?: number,
) => {
  return await getNotifications(employeeId, {
    isRead: false,
    limit: limit || 50,
  });
};

/**
 * Get notification by ID
 */
export const getNotificationById = async (id: number) => {
  return await supabase.from("notifications").select("*").eq("id", id).single();
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (id: number) => {
  return await supabase.rpc("mark_notification_as_read", {
    notification_id: id,
  });
};

/**
 * Mark multiple notifications as read
 */
export const markNotificationsAsRead = async (ids: number[]) => {
  return await supabase
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .in("id", ids);
};

/**
 * Mark all notifications as read for an employee
 */
export const markAllNotificationsAsRead = async (employeeId: string) => {
  return await supabase.rpc("mark_all_notifications_as_read", {
    emp_id: employeeId,
  });
};

/**
 * Get unread notification count
 */
export const getUnreadNotificationCount = async (employeeId: string) => {
  const { data, error } = await supabase.rpc("get_unread_notification_count", {
    emp_id: employeeId,
  });

  if (error) {
    console.error("Error getting unread count:", error);
    return 0;
  }

  return data || 0;
};

/**
 * Delete notification
 */
export const deleteNotification = async (id: number) => {
  return await supabase.from("notifications").delete().eq("id", id);
};

/**
 * Delete multiple notifications
 */
export const deleteNotifications = async (ids: number[]) => {
  return await supabase.from("notifications").delete().in("id", ids);
};

/**
 * Delete all read notifications for an employee
 */
export const deleteReadNotifications = async (employeeId: string) => {
  return await supabase
    .from("notifications")
    .delete()
    .eq("employee_id", employeeId)
    .eq("is_read", true);
};

/**
 * Update notification sent to FCM status
 */
export const updateNotificationFCMStatus = async (
  id: number,
  sent: boolean,
) => {
  return await supabase
    .from("notifications")
    .update({
      sent_to_fcm: sent,
      fcm_sent_at: sent ? new Date().toISOString() : null,
    })
    .eq("id", id);
};

/**
 * Get notifications by type
 */
export const getNotificationsByType = async (
  employeeId: string,
  type: NotificationType,
  limit?: number,
) => {
  return await getNotifications(employeeId, {
    type,
    limit: limit || 20,
  });
};

/**
 * Subscribe to realtime notifications for an employee
 */
export const subscribeToNotifications = (
  employeeId: string,
  callback: (payload: any) => void,
) => {
  const channel = supabase
    .channel(`notifications_${employeeId}`)
    .on(
      "postgres_changes" as any,
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `employee_id=eq.${employeeId}`,
      },
      (payload) => {
        console.log("[EmployeeNotificationService] New notification:", payload);
        callback(payload);
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

/**
 * Helper: Create order notification
 */
export const createOrderNotification = async (
  employeeId: string,
  orderId: number,
  orderData: {
    customerName: string;
    total: number;
    status: string;
  },
  type: "order_new" | "order_updated" | "order_cancelled" = "order_new",
) => {
  const titles = {
    order_new: "Đơn Hàng Mới",
    order_updated: "Đơn Hàng Cập Nhật",
    order_cancelled: "Đơn Hàng Đã Hủy",
  };

  const bodies = {
    order_new: `Đơn hàng #${orderId} từ ${orderData.customerName} - ${orderData.total.toLocaleString("vi-VN")}đ`,
    order_updated: `Đơn hàng #${orderId} đã được cập nhật - ${orderData.status}`,
    order_cancelled: `Đơn hàng #${orderId} từ ${orderData.customerName} đã bị hủy`,
  };

  return await createNotification({
    employee_id: employeeId,
    notification_type: type,
    title: titles[type],
    body: bodies[type],
    priority: type === "order_new" ? "high" : "normal",
    metadata: {
      order_id: orderId,
      customer_name: orderData.customerName,
      total: orderData.total,
      status: orderData.status,
    },
    action_url: `/orders/${orderId}`,
    action_label: "Xem đơn hàng",
    icon: "shopping-cart",
  });
};

/**
 * Helper: Create inventory notification
 */
export const createInventoryNotification = async (
  employeeId: string,
  productId: number,
  productData: {
    productName: string;
    currentQuantity: number;
    minStock?: number;
  },
  type: "inventory_low" | "inventory_expired" = "inventory_low",
) => {
  const isLowStock = type === "inventory_low";

  return await createNotification({
    employee_id: employeeId,
    notification_type: type,
    title: isLowStock ? "Cảnh Báo Tồn Kho" : "Hàng Hết Hạn",
    body: isLowStock
      ? `${productData.productName} sắp hết hàng (còn ${productData.currentQuantity} cái)`
      : `${productData.productName} đã hết hạn sử dụng`,
    priority: "high",
    metadata: {
      product_id: productId,
      product_name: productData.productName,
      quantity: productData.currentQuantity,
      min_stock: productData.minStock,
    },
    action_url: `/products/${productId}`,
    action_label: "Xem sản phẩm",
    icon: "warning",
  });
};

/**
 * Helper: Create appointment notification
 */
export const createAppointmentNotification = async (
  employeeId: string,
  appointmentId: number,
  appointmentData: {
    patientName: string;
    time: string;
    service?: string;
  },
  type:
    | "appointment_new"
    | "appointment_reminder"
    | "appointment_cancelled" = "appointment_new",
) => {
  const titles = {
    appointment_new: "Lịch Hẹn Mới",
    appointment_reminder: "Nhắc Lịch Hẹn",
    appointment_cancelled: "Lịch Hẹn Đã Hủy",
  };

  const bodies = {
    appointment_new: `Lịch hẹn mới với ${appointmentData.patientName} lúc ${appointmentData.time}`,
    appointment_reminder: `Bạn có lịch hẹn với ${appointmentData.patientName} lúc ${appointmentData.time}`,
    appointment_cancelled: `Lịch hẹn với ${appointmentData.patientName} đã bị hủy`,
  };

  return await createNotification({
    employee_id: employeeId,
    notification_type: type,
    title: titles[type],
    body: bodies[type],
    priority: type === "appointment_reminder" ? "high" : "normal",
    metadata: {
      appointment_id: appointmentId,
      patient_name: appointmentData.patientName,
      time: appointmentData.time,
      service: appointmentData.service,
    },
    action_url: `/appointments/${appointmentId}`,
    action_label: "Xem lịch hẹn",
    icon: "calendar",
  });
};
