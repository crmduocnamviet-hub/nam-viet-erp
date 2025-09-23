import type { PostgrestSingleResponse } from "@supabase/supabase-js";
import { supabase } from "./supabase";

// Get all patients with optional filtering
export const getPatients = async (filters?: {
  search?: string;
  isB2BCustomer?: boolean;
  limit?: number;
  offset?: number;
}) => {
  let query = supabase.from("patients").select("*");

  if (filters?.search) {
    query = query.or(`full_name.ilike.%${filters.search}%,phone_number.ilike.%${filters.search}%`);
  }

  if (filters?.isB2BCustomer !== undefined) {
    query = query.eq("is_b2b_customer", filters.isB2BCustomer);
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

// Get patient by ID
export const getPatientById = async (patientId: string): Promise<PostgrestSingleResponse<IPatient | null>> => {
  const response = await supabase
    .from("patients")
    .select("*")
    .eq("patient_id", patientId)
    .single();

  return response;
};

// Get patient by phone number
export const getPatientByPhone = async (phoneNumber: string): Promise<PostgrestSingleResponse<IPatient | null>> => {
  const response = await supabase
    .from("patients")
    .select("*")
    .eq("phone_number", phoneNumber)
    .single();

  return response;
};

// Create new patient
export const createPatient = async (patient: Omit<IPatient, "patient_id" | "created_at">): Promise<PostgrestSingleResponse<IPatient | null>> => {
  const response = await supabase
    .from("patients")
    .insert(patient)
    .select()
    .single();

  return response;
};

// Update patient
export const updatePatient = async (
  patientId: string,
  updates: Partial<Omit<IPatient, "patient_id" | "created_at">>
): Promise<PostgrestSingleResponse<IPatient | null>> => {
  const response = await supabase
    .from("patients")
    .update(updates)
    .eq("patient_id", patientId)
    .select()
    .single();

  return response;
};

// Delete patient
export const deletePatient = async (patientId: string): Promise<PostgrestSingleResponse<null>> => {
  const response = await supabase
    .from("patients")
    .delete()
    .eq("patient_id", patientId);

  return response;
};

// Get patients with loyalty points above threshold
export const getVIPPatients = async (minPoints: number = 100) => {
  const response = await supabase
    .from("patients")
    .select("*")
    .gte("loyalty_points", minPoints)
    .order("loyalty_points", { ascending: false });

  return response;
};

// Update loyalty points
export const updateLoyaltyPoints = async (
  patientId: string,
  pointsToAdd: number
): Promise<PostgrestSingleResponse<IPatient | null>> => {
  // First get current points
  const { data: currentPatient } = await getPatientById(patientId);

  if (!currentPatient) {
    throw new Error("Patient not found");
  }

  const newPoints = currentPatient.loyalty_points + pointsToAdd;

  const response = await supabase
    .from("patients")
    .update({ loyalty_points: newPoints })
    .eq("patient_id", patientId)
    .select()
    .single();

  return response;
};

// Get patients with specific medical conditions
export const getPatientsWithConditions = async (condition: string) => {
  const response = await supabase
    .from("patients")
    .select("*")
    .or(`allergy_notes.ilike.%${condition}%,chronic_diseases.ilike.%${condition}%`)
    .order("full_name", { ascending: true });

  return response;
};