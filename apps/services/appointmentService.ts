import type { PostgrestSingleResponse } from "@supabase/supabase-js";
import { supabase } from "./supabase";

// Get all appointments with optional filtering and relations
export const getAppointments = async (filters?: {
  patientId?: string;
  doctorId?: string;
  receptionistId?: string;
  status?: string;
  serviceType?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}) => {
  let query = supabase
    .from("appointments")
    .select(`
      *,
      patients!inner(full_name, phone_number),
      doctor:employees!doctor_id(full_name, role_name),
      receptionist:employees!receptionist_id(full_name, role_name),
      appointment_statuses!inner(status_name_vn, color_code)
    `);

  if (filters?.patientId) {
    query = query.eq("patient_id", filters.patientId);
  }

  if (filters?.doctorId) {
    query = query.eq("doctor_id", filters.doctorId);
  }

  if (filters?.receptionistId) {
    query = query.eq("receptionist_id", filters.receptionistId);
  }

  if (filters?.status) {
    query = query.eq("current_status", filters.status);
  }

  if (filters?.serviceType) {
    query = query.eq("service_type", filters.serviceType);
  }

  if (filters?.startDate) {
    query = query.gte("scheduled_datetime", filters.startDate);
  }

  if (filters?.endDate) {
    query = query.lte("scheduled_datetime", filters.endDate);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  if (filters?.offset) {
    query = query.range(filters.offset, (filters.offset + (filters.limit || 10)) - 1);
  }

  const response = await query.order("scheduled_datetime", { ascending: true });
  return response;
};

// Get appointment by ID
export const getAppointmentById = async (appointmentId: string): Promise<PostgrestSingleResponse<IAppointment | null>> => {
  const response = await supabase
    .from("appointments")
    .select(`
      *,
      patients!inner(full_name, phone_number, allergy_notes, chronic_diseases),
      doctor:employees!doctor_id(full_name, role_name),
      receptionist:employees!receptionist_id(full_name, role_name),
      appointment_statuses!inner(status_name_vn, color_code)
    `)
    .eq("appointment_id", appointmentId)
    .single();

  return response;
};

// Get appointments by patient ID
export const getAppointmentsByPatientId = async (patientId: string) => {
  const response = await supabase
    .from("appointments")
    .select(`
      *,
      doctor:employees!doctor_id(full_name, role_name),
      appointment_statuses!inner(status_name_vn, color_code)
    `)
    .eq("patient_id", patientId)
    .order("scheduled_datetime", { ascending: false });

  return response;
};

// Get appointments by doctor ID
export const getAppointmentsByDoctorId = async (doctorId: string, date?: string) => {
  let query = supabase
    .from("appointments")
    .select(`
      *,
      patients!inner(full_name, phone_number),
      appointment_statuses!inner(status_name_vn, color_code)
    `)
    .eq("doctor_id", doctorId);

  if (date) {
    const startOfDay = `${date}T00:00:00`;
    const endOfDay = `${date}T23:59:59`;
    query = query.gte("scheduled_datetime", startOfDay).lte("scheduled_datetime", endOfDay);
  }

  const response = await query.order("scheduled_datetime", { ascending: true });
  return response;
};

// Create new appointment
export const createAppointment = async (
  appointment: Omit<IAppointment, "appointment_id" | "created_at">
): Promise<PostgrestSingleResponse<IAppointment | null>> => {
  const response = await supabase
    .from("appointments")
    .insert(appointment)
    .select()
    .single();

  return response;
};

// Update appointment
export const updateAppointment = async (
  appointmentId: string,
  updates: Partial<Omit<IAppointment, "appointment_id" | "created_at">>
): Promise<PostgrestSingleResponse<IAppointment | null>> => {
  const response = await supabase
    .from("appointments")
    .update(updates)
    .eq("appointment_id", appointmentId)
    .select()
    .single();

  return response;
};

// Delete appointment
export const deleteAppointment = async (appointmentId: string): Promise<PostgrestSingleResponse<null>> => {
  const response = await supabase
    .from("appointments")
    .delete()
    .eq("appointment_id", appointmentId);

  return response;
};

// Update appointment status
export const updateAppointmentStatus = async (
  appointmentId: string,
  newStatus: string
): Promise<PostgrestSingleResponse<IAppointment | null>> => {
  const response = await supabase
    .from("appointments")
    .update({
      current_status: newStatus,
      ...(newStatus === "CHECKED_IN" && { check_in_time: new Date().toISOString() })
    })
    .eq("appointment_id", appointmentId)
    .select()
    .single();

  return response;
};

// Check-in appointment
export const checkInAppointment = async (appointmentId: string): Promise<PostgrestSingleResponse<IAppointment | null>> => {
  return updateAppointmentStatus(appointmentId, "CHECKED_IN");
};

// Cancel appointment
export const cancelAppointment = async (appointmentId: string): Promise<PostgrestSingleResponse<IAppointment | null>> => {
  return updateAppointmentStatus(appointmentId, "CANCELLED");
};

// Complete appointment
export const completeAppointment = async (appointmentId: string): Promise<PostgrestSingleResponse<IAppointment | null>> => {
  return updateAppointmentStatus(appointmentId, "COMPLETED");
};

// Mark as no-show
export const markNoShow = async (appointmentId: string): Promise<PostgrestSingleResponse<IAppointment | null>> => {
  return updateAppointmentStatus(appointmentId, "NO_SHOW");
};

// Get today's appointments
export const getTodaysAppointments = async (doctorId?: string) => {
  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
  const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

  return getAppointments({
    doctorId,
    startDate: startOfDay,
    endDate: endOfDay
  });
};

// Get upcoming appointments
export const getUpcomingAppointments = async (patientId: string) => {
  const now = new Date().toISOString();

  const response = await supabase
    .from("appointments")
    .select(`
      *,
      doctor:employees!doctor_id(full_name, role_name),
      appointment_statuses!inner(status_name_vn, color_code)
    `)
    .eq("patient_id", patientId)
    .gte("scheduled_datetime", now)
    .in("current_status", ["SCHEDULED", "CONFIRMED"])
    .order("scheduled_datetime", { ascending: true });

  return response;
};

// Get appointment statistics
export const getAppointmentStats = async (startDate?: string, endDate?: string) => {
  let query = supabase
    .from("appointments")
    .select("current_status, service_type");

  if (startDate) {
    query = query.gte("scheduled_datetime", startDate);
  }

  if (endDate) {
    query = query.lte("scheduled_datetime", endDate);
  }

  const response = await query;

  if (response.error) {
    return response;
  }

  const stats = response.data?.reduce((acc, appointment) => {
    // Status stats
    acc.byStatus = acc.byStatus || {};
    acc.byStatus[appointment.current_status] = (acc.byStatus[appointment.current_status] || 0) + 1;

    // Service type stats
    acc.byServiceType = acc.byServiceType || {};
    acc.byServiceType[appointment.service_type || "Không xác định"] =
      (acc.byServiceType[appointment.service_type || "Không xác định"] || 0) + 1;

    acc.total = (acc.total || 0) + 1;
    return acc;
  }, {} as any);

  return { data: stats, error: null };
};

// Send Zalo confirmation
export const sendZaloConfirmation = async (appointmentId: string): Promise<PostgrestSingleResponse<IAppointment | null>> => {
  // Here you would integrate with Zalo API
  // For now, just mark as confirmed
  const response = await supabase
    .from("appointments")
    .update({ is_confirmed_by_zalo: true })
    .eq("appointment_id", appointmentId)
    .select()
    .single();

  return response;
};

// Bulk update appointment statuses
export const bulkUpdateAppointmentStatus = async (
  appointmentIds: string[],
  newStatus: string
): Promise<PostgrestSingleResponse<IAppointment[]>> => {
  const response = await supabase
    .from("appointments")
    .update({ current_status: newStatus })
    .in("appointment_id", appointmentIds)
    .select();

  return response;
};