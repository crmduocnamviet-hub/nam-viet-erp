import { supabase } from "./supabase";

export const getAppointments = async (filters?: {
  resourceId?: string;
  startDate?: string;
  endDate?: string;
}) => {
  let query = supabase.from("appointments").select("*");

  if (filters?.resourceId) {
    query = query.eq("resource_id", filters.resourceId);
  }
  if (filters?.startDate) {
    query = query.gte("appointment_time", filters.startDate);
  }
  if (filters?.endDate) {
    query = query.lte("appointment_time", filters.endDate);
  }

  const { data, error } = await query.order("appointment_time", {
    ascending: true,
  });

  if (error) {
    console.error("Error fetching appointments:", error);
    throw error;
  }

  return { data, error };
};

export const getAppointmentsByPatientId = async (patientId: string) => {
  const { data, error } = await supabase
    .from("appointments")
    .select("*, profiles(full_name)")
    .eq("patient_id", patientId)
    .order("appointment_time", { ascending: false });

  if (error) {
    console.error("Error fetching appointments by patient:", error);
    throw error;
  }

  return { data, error };
};