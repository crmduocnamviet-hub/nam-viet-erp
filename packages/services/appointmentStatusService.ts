import type { PostgrestSingleResponse } from "@supabase/supabase-js";
import { supabase } from "./supabase";

// Get all appointment statuses
export const getAppointmentStatuses = async () => {
  const response = await supabase
    .from("appointment_statuses")
    .select("*")
    .order("status_code", { ascending: true });

  return response;
};

// Get appointment status by code
export const getAppointmentStatusByCode = async (statusCode: string): Promise<PostgrestSingleResponse<IAppointmentStatus | null>> => {
  const response = await supabase
    .from("appointment_statuses")
    .select("*")
    .eq("status_code", statusCode)
    .single();

  return response;
};

// Create new appointment status
export const createAppointmentStatus = async (status: IAppointmentStatus): Promise<PostgrestSingleResponse<IAppointmentStatus | null>> => {
  const response = await supabase
    .from("appointment_statuses")
    .insert(status)
    .select()
    .single();

  return response;
};

// Update appointment status definition
export const updateAppointmentStatusDefinition = async (
  statusCode: string,
  updates: Partial<Omit<IAppointmentStatus, "status_code">>
): Promise<PostgrestSingleResponse<IAppointmentStatus | null>> => {
  const response = await supabase
    .from("appointment_statuses")
    .update(updates)
    .eq("status_code", statusCode)
    .select()
    .single();

  return response;
};

// Delete appointment status
export const deleteAppointmentStatus = async (statusCode: string): Promise<PostgrestSingleResponse<null>> => {
  const response = await supabase
    .from("appointment_statuses")
    .delete()
    .eq("status_code", statusCode);

  return response;
};

// Get statuses with specific color
export const getAppointmentStatusesByColor = async (colorCode: string) => {
  const response = await supabase
    .from("appointment_statuses")
    .select("*")
    .eq("color_code", colorCode)
    .order("status_name_vn", { ascending: true });

  return response;
};

// Get status statistics (usage count)
export const getAppointmentStatusStats = async () => {
  const response = await supabase
    .from("appointments")
    .select("current_status, appointment_statuses!inner(status_name_vn, color_code)")
    .order("current_status");

  if (response.error) {
    return response;
  }

  const stats = response.data?.reduce((acc, appointment) => {
    const status = appointment.current_status;
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return { data: stats, error: null };
};

// Initialize default appointment statuses
export const initializeDefaultStatuses = async () => {
  const defaultStatuses: IAppointmentStatus[] = [
    {
      status_code: "SCHEDULED",
      status_name_vn: "Đã đặt lịch",
      color_code: "#1890ff"
    },
    {
      status_code: "CONFIRMED",
      status_name_vn: "Đã xác nhận",
      color_code: "#52c41a"
    },
    {
      status_code: "CHECKED_IN",
      status_name_vn: "Đã check-in",
      color_code: "#faad14"
    },
    {
      status_code: "IN_PROGRESS",
      status_name_vn: "Đang khám",
      color_code: "#722ed1"
    },
    {
      status_code: "COMPLETED",
      status_name_vn: "Hoàn thành",
      color_code: "#52c41a"
    },
    {
      status_code: "CANCELLED",
      status_name_vn: "Đã hủy",
      color_code: "#ff4d4f"
    },
    {
      status_code: "NO_SHOW",
      status_name_vn: "Không đến",
      color_code: "#8c8c8c"
    }
  ];

  const response = await supabase
    .from("appointment_statuses")
    .upsert(defaultStatuses, { onConflict: "status_code" })
    .select();

  return response;
};