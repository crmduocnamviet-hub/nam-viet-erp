import type { PostgrestSingleResponse } from "@supabase/supabase-js";
import { supabase } from "./supabase";

/**
 * Patient Points Service
 * Manages loyalty points for patients including earning, redeeming, and tracking history
 */

// ==================== POINTS HISTORY ====================

/**
 * Get points history for a patient
 */
export const getPatientPointsHistory = async (
  patientId: string,
  filters?: {
    transactionType?: PointsTransactionType;
    limit?: number;
    offset?: number;
  },
) => {
  let query = supabase
    .from("patient_points_history")
    .select(
      `
      *,
      patient:patients(full_name, phone_number),
      employee:employees(full_name, employee_code)
    `,
    )
    .eq("patient_id", patientId);

  if (filters?.transactionType) {
    query = query.eq("transaction_type", filters.transactionType);
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

  const response = await query.order("created_at", { ascending: false });
  return response;
};

/**
 * Get all points history with pagination
 */
export const getAllPointsHistory = async (filters?: {
  search?: string;
  transactionType?: PointsTransactionType;
  limit?: number;
  offset?: number;
}) => {
  let query = supabase.from("patient_points_history").select(
    `
      *,
      patient:patients(full_name, phone_number),
      employee:employees(full_name, employee_code)
    `,
    { count: "exact" },
  );

  if (filters?.search) {
    query = query.or(
      `patient.full_name.ilike.%${filters.search}%,patient.phone_number.ilike.%${filters.search}%`,
    );
  }

  if (filters?.transactionType) {
    query = query.eq("transaction_type", filters.transactionType);
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

  const response = await query.order("created_at", { ascending: false });
  return response;
};

/**
 * Get points summary for a patient
 */
export const getPatientPointsSummary = async (
  patientId: string,
): Promise<PostgrestSingleResponse<IPatientPointsSummary | null>> => {
  const response = await supabase
    .from("patient_points_summary")
    .select("*")
    .eq("patient_id", patientId)
    .single();

  return response;
};

/**
 * Get all patients points summary with pagination
 */
export const getAllPatientPointsSummary = async (filters?: {
  search?: string;
  minPoints?: number;
  limit?: number;
  offset?: number;
}) => {
  let query = supabase.from("patient_points_summary").select("*", {
    count: "exact",
  });

  if (filters?.search) {
    query = query.or(
      `full_name.ilike.%${filters.search}%,phone_number.ilike.%${filters.search}%`,
    );
  }

  if (filters?.minPoints !== undefined) {
    query = query.gte("current_balance", filters.minPoints);
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

  const response = await query.order("current_balance", { ascending: false });
  return response;
};

// ==================== POINTS TRANSACTIONS ====================

/**
 * Add points to a patient (earn points)
 */
export const addPointsToPatient = async (params: {
  patientId: string;
  points: number;
  referenceType: PointsReferenceType;
  referenceId?: string;
  description?: string;
  notes?: string;
  expiresAt?: string;
  createdBy?: string;
}): Promise<PostgrestSingleResponse<IPatientPointsHistory | null>> => {
  const {
    patientId,
    points,
    referenceType,
    referenceId,
    description,
    notes,
    expiresAt,
    createdBy,
  } = params;

  // Get current patient points
  const { data: patient, error: patientError } = await supabase
    .from("patients")
    .select("loyalty_points")
    .eq("patient_id", patientId)
    .single();

  if (patientError || !patient) {
    throw new Error("Patient not found");
  }

  const balanceBefore = patient.loyalty_points || 0;
  const balanceAfter = balanceBefore + points;

  // Create points history record
  const { data: historyData, error: historyError } = await supabase
    .from("patient_points_history")
    .insert({
      patient_id: patientId,
      transaction_type: "earn",
      points_amount: points,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      reference_type: referenceType,
      reference_id: referenceId,
      description: description || "Points earned",
      notes,
      expires_at: expiresAt,
      created_by: createdBy,
    })
    .select()
    .single();

  if (historyError) {
    throw new Error(`Failed to create points history: ${historyError.message}`);
  }

  // Update patient loyalty points
  const { error: updateError } = await supabase
    .from("patients")
    .update({ loyalty_points: balanceAfter })
    .eq("patient_id", patientId);

  if (updateError) {
    throw new Error(`Failed to update patient points: ${updateError.message}`);
  }

  return {
    data: historyData,
    error: null,
  } as PostgrestSingleResponse<IPatientPointsHistory>;
};

/**
 * Redeem points from a patient (use points)
 */
export const redeemPointsFromPatient = async (params: {
  patientId: string;
  points: number;
  referenceType: PointsReferenceType;
  referenceId?: string;
  description?: string;
  notes?: string;
  createdBy?: string;
}): Promise<PostgrestSingleResponse<IPatientPointsHistory | null>> => {
  const {
    patientId,
    points,
    referenceType,
    referenceId,
    description,
    notes,
    createdBy,
  } = params;

  // Get current patient points
  const { data: patient, error: patientError } = await supabase
    .from("patients")
    .select("loyalty_points")
    .eq("patient_id", patientId)
    .single();

  if (patientError || !patient) {
    throw new Error("Patient not found");
  }

  const balanceBefore = patient.loyalty_points || 0;

  // Check if patient has enough points
  if (balanceBefore < points) {
    throw new Error(
      `Insufficient points. Available: ${balanceBefore}, Required: ${points}`,
    );
  }

  const balanceAfter = balanceBefore - points;

  // Create points history record (negative amount for redemption)
  const { data: historyData, error: historyError } = await supabase
    .from("patient_points_history")
    .insert({
      patient_id: patientId,
      transaction_type: "redeem",
      points_amount: -points, // Negative for redemption
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      reference_type: referenceType,
      reference_id: referenceId,
      description: description || "Points redeemed",
      notes,
      created_by: createdBy,
    })
    .select()
    .single();

  if (historyError) {
    throw new Error(`Failed to create points history: ${historyError.message}`);
  }

  // Update patient loyalty points
  const { error: updateError } = await supabase
    .from("patients")
    .update({ loyalty_points: balanceAfter })
    .eq("patient_id", patientId);

  if (updateError) {
    throw new Error(`Failed to update patient points: ${updateError.message}`);
  }

  return {
    data: historyData,
    error: null,
  } as PostgrestSingleResponse<IPatientPointsHistory>;
};

/**
 * Adjust points manually (can be positive or negative)
 */
export const adjustPatientPoints = async (params: {
  patientId: string;
  pointsAdjustment: number; // Positive or negative
  referenceType: PointsReferenceType;
  referenceId?: string;
  description: string;
  notes?: string;
  createdBy?: string;
}): Promise<PostgrestSingleResponse<IPatientPointsHistory | null>> => {
  const {
    patientId,
    pointsAdjustment,
    referenceType,
    referenceId,
    description,
    notes,
    createdBy,
  } = params;

  // Get current patient points
  const { data: patient, error: patientError } = await supabase
    .from("patients")
    .select("loyalty_points")
    .eq("patient_id", patientId)
    .single();

  if (patientError || !patient) {
    throw new Error("Patient not found");
  }

  const balanceBefore = patient.loyalty_points || 0;
  const balanceAfter = balanceBefore + pointsAdjustment;

  // Check if adjustment would result in negative balance
  if (balanceAfter < 0) {
    throw new Error(
      `Adjustment would result in negative balance. Current: ${balanceBefore}, Adjustment: ${pointsAdjustment}`,
    );
  }

  // Create points history record
  const { data: historyData, error: historyError } = await supabase
    .from("patient_points_history")
    .insert({
      patient_id: patientId,
      transaction_type: "adjustment",
      points_amount: pointsAdjustment,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      reference_type: referenceType,
      reference_id: referenceId,
      description,
      notes,
      created_by: createdBy,
    })
    .select()
    .single();

  if (historyError) {
    throw new Error(`Failed to create points history: ${historyError.message}`);
  }

  // Update patient loyalty points
  const { error: updateError } = await supabase
    .from("patients")
    .update({ loyalty_points: balanceAfter })
    .eq("patient_id", patientId);

  if (updateError) {
    throw new Error(`Failed to update patient points: ${updateError.message}`);
  }

  return {
    data: historyData,
    error: null,
  } as PostgrestSingleResponse<IPatientPointsHistory>;
};

/**
 * Expire points for a patient
 */
export const expirePatientPoints = async (params: {
  patientId: string;
  points: number;
  description: string;
  notes?: string;
  createdBy?: string;
}): Promise<PostgrestSingleResponse<IPatientPointsHistory | null>> => {
  const { patientId, points, description, notes, createdBy } = params;

  // Get current patient points
  const { data: patient, error: patientError } = await supabase
    .from("patients")
    .select("loyalty_points")
    .eq("patient_id", patientId)
    .single();

  if (patientError || !patient) {
    throw new Error("Patient not found");
  }

  const balanceBefore = patient.loyalty_points || 0;
  const balanceAfter = Math.max(0, balanceBefore - points);

  // Create points history record
  const { data: historyData, error: historyError } = await supabase
    .from("patient_points_history")
    .insert({
      patient_id: patientId,
      transaction_type: "expire",
      points_amount: -(balanceBefore - balanceAfter), // Negative for expiration
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      reference_type: "system",
      description,
      notes,
      created_by: createdBy,
    })
    .select()
    .single();

  if (historyError) {
    throw new Error(`Failed to create points history: ${historyError.message}`);
  }

  // Update patient loyalty points
  const { error: updateError } = await supabase
    .from("patients")
    .update({ loyalty_points: balanceAfter })
    .eq("patient_id", patientId);

  if (updateError) {
    throw new Error(`Failed to update patient points: ${updateError.message}`);
  }

  return {
    data: historyData,
    error: null,
  } as PostgrestSingleResponse<IPatientPointsHistory>;
};

/**
 * Refund points to a patient (e.g., from canceled order)
 */
export const refundPointsToPatient = async (params: {
  patientId: string;
  points: number;
  referenceType: PointsReferenceType;
  referenceId?: string;
  description: string;
  notes?: string;
  createdBy?: string;
}): Promise<PostgrestSingleResponse<IPatientPointsHistory | null>> => {
  const {
    patientId,
    points,
    referenceType,
    referenceId,
    description,
    notes,
    createdBy,
  } = params;

  // Get current patient points
  const { data: patient, error: patientError } = await supabase
    .from("patients")
    .select("loyalty_points")
    .eq("patient_id", patientId)
    .single();

  if (patientError || !patient) {
    throw new Error("Patient not found");
  }

  const balanceBefore = patient.loyalty_points || 0;
  const balanceAfter = balanceBefore + points;

  // Create points history record
  const { data: historyData, error: historyError } = await supabase
    .from("patient_points_history")
    .insert({
      patient_id: patientId,
      transaction_type: "refund",
      points_amount: points, // Positive for refund
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      reference_type: referenceType,
      reference_id: referenceId,
      description,
      notes,
      created_by: createdBy,
    })
    .select()
    .single();

  if (historyError) {
    throw new Error(`Failed to create points history: ${historyError.message}`);
  }

  // Update patient loyalty points
  const { error: updateError } = await supabase
    .from("patients")
    .update({ loyalty_points: balanceAfter })
    .eq("patient_id", patientId);

  if (updateError) {
    throw new Error(`Failed to update patient points: ${updateError.message}`);
  }

  return {
    data: historyData,
    error: null,
  } as PostgrestSingleResponse<IPatientPointsHistory>;
};

// ==================== UTILITY FUNCTIONS ====================

/**
 * Calculate points to earn based on order value
 * Default: 1 point per 10,000 VND
 */
export const calculatePointsToEarn = (
  orderValue: number,
  pointsPerAmount: number = 10000,
): number => {
  return Math.floor(orderValue / pointsPerAmount);
};

/**
 * Calculate discount value from points redemption
 * Default: 1 point = 1,000 VND
 */
export const calculateDiscountFromPoints = (
  points: number,
  valuePerPoint: number = 1000,
): number => {
  return points * valuePerPoint;
};

/**
 * Get expiring points for a patient
 */
export const getExpiringPoints = async (
  patientId: string,
  daysUntilExpiry: number = 30,
) => {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + daysUntilExpiry);

  const response = await supabase
    .from("patient_points_history")
    .select("*")
    .eq("patient_id", patientId)
    .eq("transaction_type", "earn")
    .lte("expires_at", expiryDate.toISOString())
    .is("expires_at", null)
    .order("expires_at", { ascending: true });

  return response;
};

/**
 * Process automatic points expiration
 * Should be run as a scheduled job
 */
export const processExpiredPoints = async () => {
  const now = new Date().toISOString();

  // Get all earned points that have expired
  const { data: expiredPoints, error } = await supabase
    .from("patient_points_history")
    .select("patient_id, points_amount")
    .eq("transaction_type", "earn")
    .lte("expires_at", now);

  if (error || !expiredPoints) {
    throw new Error("Failed to fetch expired points");
  }

  // Group by patient and sum expired points
  const expirationsByPatient = expiredPoints.reduce(
    (acc, record) => {
      const patientId = record.patient_id;
      acc[patientId] = (acc[patientId] || 0) + record.points_amount;
      return acc;
    },
    {} as Record<string, number>,
  );

  // Expire points for each patient
  const results = await Promise.all(
    Object.entries(expirationsByPatient).map(([patientId, points]) =>
      expirePatientPoints({
        patientId,
        points,
        description: "Points expired automatically",
        notes: `Expired ${points} points on ${now}`,
      }),
    ),
  );

  return {
    processed: results.length,
    totalPointsExpired: Object.values(expirationsByPatient).reduce(
      (sum, points) => sum + points,
      0,
    ),
  };
};
