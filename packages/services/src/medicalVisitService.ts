import type { PostgrestSingleResponse } from "@supabase/supabase-js";
import { supabase } from "./supabase";

// Get all medical visits with optional filtering and relations
export const getMedicalVisits = async (filters?: {
  patientId?: string;
  doctorId?: string;
  appointmentId?: string;
  startDate?: string;
  endDate?: string;
  isSignedOff?: boolean;
  limit?: number;
  offset?: number;
}) => {
  let query = supabase
    .from("medical_visits")
    .select(`
      *,
      patients!inner(full_name, phone_number, allergy_notes, chronic_diseases),
      doctor:employees!inner(full_name, role_name),
      appointments(scheduled_datetime, service_type, current_status)
    `);

  if (filters?.patientId) {
    query = query.eq("patient_id", filters.patientId);
  }

  if (filters?.doctorId) {
    query = query.eq("doctor_id", filters.doctorId);
  }

  if (filters?.appointmentId) {
    query = query.eq("appointment_id", filters.appointmentId);
  }

  if (filters?.startDate) {
    query = query.gte("visit_date", filters.startDate);
  }

  if (filters?.endDate) {
    query = query.lte("visit_date", filters.endDate);
  }

  if (filters?.isSignedOff !== undefined) {
    query = query.eq("is_signed_off", filters.isSignedOff);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  if (filters?.offset) {
    query = query.range(filters.offset, (filters.offset + (filters.limit || 10)) - 1);
  }

  const response = await query.order("visit_date", { ascending: false });
  return response;
};

// Get medical visit by ID
export const getMedicalVisitById = async (visitId: string): Promise<PostgrestSingleResponse<IMedicalVisit | null>> => {
  const response = await supabase
    .from("medical_visits")
    .select(`
      *,
      patients!inner(full_name, phone_number, date_of_birth, allergy_notes, chronic_diseases),
      doctor:employees!inner(full_name, role_name),
      appointments(scheduled_datetime, service_type, reason_for_visit),
      prescriptions(*),
      lab_orders(*)
    `)
    .eq("visit_id", visitId)
    .single();

  return response;
};

// Get medical visits by patient ID
export const getMedicalVisitsByPatientId = async (patientId: string) => {
  const response = await supabase
    .from("medical_visits")
    .select(`
      *,
      doctor:employees!inner(full_name, role_name),
      appointments(scheduled_datetime, service_type)
    `)
    .eq("patient_id", patientId)
    .order("visit_date", { ascending: false });

  return response;
};

// Get medical visits by doctor ID
export const getMedicalVisitsByDoctorId = async (doctorId: string, date?: string) => {
  let query = supabase
    .from("medical_visits")
    .select(`
      *,
      patients!inner(full_name, phone_number),
      appointments(scheduled_datetime, service_type)
    `)
    .eq("doctor_id", doctorId);

  if (date) {
    const startOfDay = `${date}T00:00:00`;
    const endOfDay = `${date}T23:59:59`;
    query = query.gte("visit_date", startOfDay).lte("visit_date", endOfDay);
  }

  const response = await query.order("visit_date", { ascending: false });
  return response;
};

// Create new medical visit
export const createMedicalVisit = async (
  visit: Omit<IMedicalVisit, "visit_id" | "visit_date">
): Promise<PostgrestSingleResponse<IMedicalVisit | null>> => {
  const response = await supabase
    .from("medical_visits")
    .insert(visit)
    .select()
    .single();

  return response;
};

// Create medical visit from appointment
export const createMedicalVisitFromAppointment = async (
  appointmentId: string,
  doctorId: string
): Promise<PostgrestSingleResponse<IMedicalVisit | null>> => {
  // First get appointment details
  const { data: appointment } = await supabase
    .from("appointments")
    .select("patient_id, reason_for_visit")
    .eq("appointment_id", appointmentId)
    .single();

  if (!appointment) {
    throw new Error("Appointment not found");
  }

  const visit: Omit<IMedicalVisit, "visit_id" | "visit_date"> = {
    appointment_id: appointmentId,
    patient_id: appointment.patient_id,
    doctor_id: doctorId,
    subjective_notes: appointment.reason_for_visit,
    objective_notes: null,
    vital_signs: null,
    assessment_diagnosis_icd10: null,
    plan_notes: null,
    is_signed_off: false,
    signed_off_at: null
  };

  return createMedicalVisit(visit);
};

// Update medical visit
export const updateMedicalVisit = async (
  visitId: string,
  updates: Partial<Omit<IMedicalVisit, "visit_id" | "visit_date">>
): Promise<PostgrestSingleResponse<IMedicalVisit | null>> => {
  const response = await supabase
    .from("medical_visits")
    .update(updates)
    .eq("visit_id", visitId)
    .select()
    .single();

  return response;
};

// Update SOAP notes separately for better workflow
export const updateSubjectiveNotes = async (visitId: string, notes: string) => {
  return updateMedicalVisit(visitId, { subjective_notes: notes });
};

export const updateObjectiveNotes = async (visitId: string, notes: string) => {
  return updateMedicalVisit(visitId, { objective_notes: notes });
};

export const updateAssessment = async (visitId: string, diagnosis: string) => {
  return updateMedicalVisit(visitId, { assessment_diagnosis_icd10: diagnosis });
};

export const updatePlanNotes = async (visitId: string, notes: string) => {
  return updateMedicalVisit(visitId, { plan_notes: notes });
};

// Update vital signs
export const updateVitalSigns = async (
  visitId: string,
  vitalSigns: Record<string, any>
): Promise<PostgrestSingleResponse<IMedicalVisit | null>> => {
  return updateMedicalVisit(visitId, { vital_signs: vitalSigns });
};

// Sign off medical visit
export const signOffMedicalVisit = async (visitId: string): Promise<PostgrestSingleResponse<IMedicalVisit | null>> => {
  const response = await supabase
    .from("medical_visits")
    .update({
      is_signed_off: true,
      signed_off_at: new Date().toISOString()
    })
    .eq("visit_id", visitId)
    .select()
    .single();

  // Also update the related appointment to completed
  if (response.data?.appointment_id) {
    await supabase
      .from("appointments")
      .update({ current_status: "COMPLETED" })
      .eq("appointment_id", response.data.appointment_id);
  }

  return response;
};

// Delete medical visit
export const deleteMedicalVisit = async (visitId: string): Promise<PostgrestSingleResponse<null>> => {
  const response = await supabase
    .from("medical_visits")
    .delete()
    .eq("visit_id", visitId);

  return response;
};

// Get pending medical visits (not signed off)
export const getPendingMedicalVisits = async (doctorId?: string) => {
  let query = supabase
    .from("medical_visits")
    .select(`
      *,
      patients!inner(full_name, phone_number),
      appointments(scheduled_datetime, service_type)
    `)
    .eq("is_signed_off", false);

  if (doctorId) {
    query = query.eq("doctor_id", doctorId);
  }

  const response = await query.order("visit_date", { ascending: true });
  return response;
};

// Get medical visit statistics
export const getMedicalVisitStats = async (
  doctorId?: string,
  startDate?: string,
  endDate?: string
) => {
  let query = supabase
    .from("medical_visits")
    .select("is_signed_off, assessment_diagnosis_icd10");

  if (doctorId) {
    query = query.eq("doctor_id", doctorId);
  }

  if (startDate) {
    query = query.gte("visit_date", startDate);
  }

  if (endDate) {
    query = query.lte("visit_date", endDate);
  }

  const response = await query;

  if (response.error) {
    return response;
  }

  const stats = response.data?.reduce((acc, visit) => {
    acc.total = (acc.total || 0) + 1;

    if (visit.is_signed_off) {
      acc.signedOff = (acc.signedOff || 0) + 1;
    } else {
      acc.pending = (acc.pending || 0) + 1;
    }

    if (visit.assessment_diagnosis_icd10) {
      acc.withDiagnosis = (acc.withDiagnosis || 0) + 1;
    }

    return acc;
  }, {} as any);

  return { data: stats, error: null };
};

// Get patient medical history
export const getPatientMedicalHistory = async (patientId: string) => {
  const response = await supabase
    .from("medical_visits")
    .select(`
      *,
      doctor:employees!inner(full_name),
      prescriptions(*, products(name)),
      lab_orders(*),
      appointments(scheduled_datetime, service_type)
    `)
    .eq("patient_id", patientId)
    .eq("is_signed_off", true)
    .order("visit_date", { ascending: false });

  return response;
};

// Search medical visits by diagnosis
export const searchMedicalVisitsByDiagnosis = async (diagnosisCode: string) => {
  const response = await supabase
    .from("medical_visits")
    .select(`
      *,
      patients!inner(full_name, phone_number),
      doctor:employees!inner(full_name)
    `)
    .ilike("assessment_diagnosis_icd10", `%${diagnosisCode}%`)
    .eq("is_signed_off", true)
    .order("visit_date", { ascending: false });

  return response;
};