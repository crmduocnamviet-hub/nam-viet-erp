import { supabase } from "./supabase";
import type {
  NotificationType,
  NotificationPriority,
} from "./employeeNotificationService";

/**
 * Send push notification via Edge Function
 */
export interface ISendPushNotificationParams {
  employee_ids: string[];
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
}

export interface ISendPushNotificationResponse {
  success: boolean;
  notifications_created: number;
  fcm_tokens_found: number;
  fcm_sent_success: number;
  fcm_sent_failed: number;
  notification_ids: number[];
  error?: string;
}

/**
 * Send push notification to employees via Supabase Edge Function
 */
export const sendPushNotification = async (
  params: ISendPushNotificationParams,
): Promise<ISendPushNotificationResponse> => {
  try {
    const { data, error } = await supabase.functions.invoke(
      "push-notification",
      {
        body: params,
      },
    );

    if (error) {
      console.error("Error calling push-notification function:", error);
      throw error;
    }

    return data as ISendPushNotificationResponse;
  } catch (error: any) {
    console.error("Error sending push notification:", error);
    return {
      success: false,
      notifications_created: 0,
      fcm_tokens_found: 0,
      fcm_sent_success: 0,
      fcm_sent_failed: 0,
      notification_ids: [],
      error: error.message || "Unknown error",
    };
  }
};

/**
 * Helper: Send order notification via push
 */
export const sendOrderPushNotification = async (
  employeeIds: string[],
  orderId: number,
  orderData: {
    customerName: string;
    total: number;
    status: string;
  },
  type: "order_new" | "order_updated" | "order_cancelled" = "order_new",
  createdBy?: string,
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

  return await sendPushNotification({
    employee_ids: employeeIds,
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
    created_by: createdBy,
  });
};

/**
 * Helper: Send inventory notification via push
 */
export const sendInventoryPushNotification = async (
  employeeIds: string[],
  productId: number,
  productData: {
    productName: string;
    currentQuantity: number;
    minStock?: number;
  },
  type: "inventory_low" | "inventory_expired" = "inventory_low",
  createdBy?: string,
) => {
  const isLowStock = type === "inventory_low";

  return await sendPushNotification({
    employee_ids: employeeIds,
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
    created_by: createdBy,
  });
};

/**
 * Helper: Send appointment notification via push
 */
export const sendAppointmentPushNotification = async (
  employeeIds: string[],
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
  createdBy?: string,
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

  return await sendPushNotification({
    employee_ids: employeeIds,
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
    created_by: createdBy,
  });
};

/**
 * Helper: Send system notification via push
 */
export const sendSystemPushNotification = async (
  employeeIds: string[],
  title: string,
  body: string,
  metadata?: Record<string, any>,
  priority: NotificationPriority = "normal",
  createdBy?: string,
) => {
  return await sendPushNotification({
    employee_ids: employeeIds,
    notification_type: "system",
    title,
    body,
    priority,
    metadata,
    icon: "info",
    created_by: createdBy,
  });
};

/**
 * Helper: Broadcast notification to all employees with specific roles
 */
export const broadcastPushNotificationByRole = async (
  roles: string[],
  notification: Omit<ISendPushNotificationParams, "employee_ids">,
  createdBy?: string,
) => {
  try {
    // Get employees by roles
    const { data: employees, error } = await supabase
      .from("employees")
      .select("employee_id")
      .overlaps("role", roles);

    if (error) throw error;

    if (!employees || employees.length === 0) {
      console.warn("No employees found with roles:", roles);
      return {
        success: true,
        notifications_created: 0,
        fcm_tokens_found: 0,
        fcm_sent_success: 0,
        fcm_sent_failed: 0,
        notification_ids: [],
      };
    }

    const employeeIds = employees.map((e) => e.employee_id);

    return await sendPushNotification({
      ...notification,
      employee_ids: employeeIds,
      created_by: createdBy,
    });
  } catch (error: any) {
    console.error("Error broadcasting notification:", error);
    return {
      success: false,
      notifications_created: 0,
      fcm_tokens_found: 0,
      fcm_sent_success: 0,
      fcm_sent_failed: 0,
      notification_ids: [],
      error: error.message,
    };
  }
};
