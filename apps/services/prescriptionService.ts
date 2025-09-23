import type { PostgrestSingleResponse } from "@supabase/supabase-js";
import { supabase } from "./supabase";

// Get all prescriptions with optional filtering and relations
export const getPrescriptions = async (filters?: {
  visitId?: string;
  productId?: string;
  startDate?: string;
  endDate?: string;
  hasAiWarning?: boolean;
  limit?: number;
  offset?: number;
}) => {
  let query = supabase
    .from("prescriptions")
    .select(`
      *,
      products!inner(name, manufacturer, route),
      medical_visits!inner(
        visit_date,
        patients!inner(full_name, phone_number),
        doctor:employees!inner(full_name)
      )
    `);

  if (filters?.visitId) {
    query = query.eq("visit_id", filters.visitId);
  }

  if (filters?.productId) {
    query = query.eq("product_id", filters.productId);
  }

  if (filters?.hasAiWarning !== undefined) {
    if (filters.hasAiWarning) {
      query = query.not("ai_interaction_warning", "is", null);
    } else {
      query = query.is("ai_interaction_warning", null);
    }
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

// Get prescription by ID
export const getPrescriptionById = async (prescriptionId: string): Promise<PostgrestSingleResponse<IPrescription | null>> => {
  const response = await supabase
    .from("prescriptions")
    .select(`
      *,
      products!inner(name, manufacturer, route, hdsd_0_2, hdsd_2_6, hdsd_6_18, hdsd_over_18),
      medical_visits!inner(
        visit_date,
        assessment_diagnosis_icd10,
        patients!inner(full_name, phone_number, date_of_birth, allergy_notes),
        doctor:employees!inner(full_name, role_name)
      )
    `)
    .eq("prescription_item_id", prescriptionId)
    .single();

  return response;
};

// Get prescriptions by visit ID
export const getPrescriptionsByVisitId = async (visitId: string) => {
  const response = await supabase
    .from("prescriptions")
    .select(`
      *,
      products!inner(name, manufacturer, route, retail_price)
    `)
    .eq("visit_id", visitId)
    .order("created_at", { ascending: true });

  return response;
};

// Create new prescription
export const createPrescription = async (
  prescription: Omit<IPrescription, "prescription_item_id">
): Promise<PostgrestSingleResponse<IPrescription | null>> => {
  const response = await supabase
    .from("prescriptions")
    .insert(prescription)
    .select()
    .single();

  return response;
};

// Create multiple prescriptions for a visit
export const createMultiplePrescriptions = async (
  visitId: string,
  prescriptions: Array<{
    product_id: string;
    quantity_ordered: number;
    dosage_instruction?: string;
    ai_interaction_warning?: string;
  }>
): Promise<PostgrestSingleResponse<IPrescription[]>> => {
  const prescriptionItems = prescriptions.map(prescription => ({
    visit_id: visitId,
    product_id: prescription.product_id,
    quantity_ordered: prescription.quantity_ordered,
    dosage_instruction: prescription.dosage_instruction || null,
    ai_interaction_warning: prescription.ai_interaction_warning || null
  }));

  const response = await supabase
    .from("prescriptions")
    .insert(prescriptionItems)
    .select();

  return response;
};

// Update prescription
export const updatePrescription = async (
  prescriptionId: string,
  updates: Partial<Omit<IPrescription, "prescription_item_id">>
): Promise<PostgrestSingleResponse<IPrescription | null>> => {
  const response = await supabase
    .from("prescriptions")
    .update(updates)
    .eq("prescription_item_id", prescriptionId)
    .select()
    .single();

  return response;
};

// Delete prescription
export const deletePrescription = async (prescriptionId: string): Promise<PostgrestSingleResponse<null>> => {
  const response = await supabase
    .from("prescriptions")
    .delete()
    .eq("prescription_item_id", prescriptionId);

  return response;
};

// Add AI interaction warning
export const addAiInteractionWarning = async (
  prescriptionId: string,
  warning: string
): Promise<PostgrestSingleResponse<IPrescription | null>> => {
  const response = await supabase
    .from("prescriptions")
    .update({ ai_interaction_warning: warning })
    .eq("prescription_item_id", prescriptionId)
    .select()
    .single();

  return response;
};

// Get prescriptions with AI warnings
export const getPrescriptionsWithWarnings = async () => {
  const response = await supabase
    .from("prescriptions")
    .select(`
      *,
      products!inner(name, manufacturer),
      medical_visits!inner(
        visit_date,
        patients!inner(full_name, phone_number),
        doctor:employees!inner(full_name)
      )
    `)
    .not("ai_interaction_warning", "is", null)
    .order("created_at", { ascending: false });

  return response;
};

// Get prescription statistics
export const getPrescriptionStats = async (startDate?: string, endDate?: string) => {
  let query = supabase
    .from("prescriptions")
    .select("ai_interaction_warning, product_id, quantity_ordered");

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

  const stats = response.data?.reduce((acc, prescription) => {
    acc.total = (acc.total || 0) + 1;
    acc.totalQuantity = (acc.totalQuantity || 0) + prescription.quantity_ordered;

    if (prescription.ai_interaction_warning) {
      acc.withWarnings = (acc.withWarnings || 0) + 1;
    }

    // Product frequency
    acc.byProduct = acc.byProduct || {};
    acc.byProduct[prescription.product_id] = (acc.byProduct[prescription.product_id] || 0) + 1;

    return acc;
  }, {} as any);

  return { data: stats, error: null };
};

// Get most prescribed medications
export const getMostPrescribedMedications = async (limit: number = 10) => {
  const response = await supabase
    .from("prescriptions")
    .select("product_id, quantity_ordered, products!inner(name, manufacturer)");

  if (response.error) {
    return response;
  }

  const medicationCounts = response.data?.reduce((acc, prescription) => {
    const key = prescription.product_id;
    if (!acc[key]) {
      acc[key] = {
        product_id: prescription.product_id,
        name: prescription.products.name,
        manufacturer: prescription.products.manufacturer,
        count: 0,
        total_quantity: 0
      };
    }
    acc[key].count += 1;
    acc[key].total_quantity += prescription.quantity_ordered;
    return acc;
  }, {} as Record<string, any>);

  const sortedMedications = Object.values(medicationCounts || {})
    .sort((a: any, b: any) => b.count - a.count)
    .slice(0, limit);

  return { data: sortedMedications, error: null };
};

// Get patient prescription history
export const getPatientPrescriptionHistory = async (patientId: string) => {
  const response = await supabase
    .from("prescriptions")
    .select(`
      *,
      products!inner(name, manufacturer, route),
      medical_visits!inner(
        visit_date,
        assessment_diagnosis_icd10,
        doctor:employees!inner(full_name)
      )
    `)
    .eq("medical_visits.patient_id", patientId)
    .order("medical_visits.visit_date", { ascending: false });

  return response;
};

// Check for potential drug interactions
export const checkDrugInteractions = async (visitId: string) => {
  // Get all prescriptions for this visit
  const { data: prescriptions } = await getPrescriptionsByVisitId(visitId);

  if (!prescriptions || prescriptions.length < 2) {
    return { data: [], error: null };
  }

  // This is where you would implement actual drug interaction checking
  // For now, return a placeholder structure
  const interactions = prescriptions.map((prescription, index) => {
    const otherPrescriptions = prescriptions.filter((_, i) => i !== index);
    return {
      prescription_id: prescription.prescription_item_id,
      product_name: prescription.products?.name,
      potential_interactions: otherPrescriptions.map(other => ({
        with_product: other.products?.name,
        severity: "moderate", // This would come from actual drug interaction database
        description: "Potential interaction detected - consult pharmacist"
      }))
    };
  });

  return { data: interactions, error: null };
};

// Generate prescription summary for printing
export const generatePrescriptionSummary = async (visitId: string) => {
  const response = await supabase
    .from("prescriptions")
    .select(`
      *,
      products!inner(name, manufacturer, route, retail_price),
      medical_visits!inner(
        visit_date,
        patients!inner(full_name, date_of_birth),
        doctor:employees!inner(full_name)
      )
    `)
    .eq("visit_id", visitId)
    .order("created_at", { ascending: true });

  return response;
};