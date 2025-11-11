/**
 * Point Rules Service
 * Service for managing point accumulation and redemption rules
 */

import { supabase } from "./supabase";
import { TABLES } from "./constants";

// ==================== GET POINT RULES ====================

/**
 * Get all point rules
 */
export const getPointRules = async (params?: {
  isActive?: boolean;
  includeInactive?: boolean;
}): Promise<{
  data: IPointRule[] | null;
  error: any;
}> => {
  let query = supabase.from(TABLES.POINT_RULES).select("*");

  if (params?.isActive !== undefined) {
    query = query.eq("is_active", params.isActive);
  }

  query = query.order("created_at", { ascending: false });

  const response = await query;
  return response;
};

/**
 * Get point rule by ID
 */
export const getPointRuleById = async (
  id: number,
): Promise<{
  data: IPointRule | null;
  error: any;
}> => {
  const response = await supabase
    .from(TABLES.POINT_RULES)
    .select("*")
    .eq("id", id)
    .single();

  return response;
};

/**
 * Get point rule with warehouse details
 */
export const getPointRuleWithDetails = async (
  id: number,
): Promise<{
  data: IPointRuleWithDetails | null;
  error: any;
}> => {
  const response = await supabase
    .from(TABLES.POINT_RULES)
    .select(
      `
  *,
  warehouses:warehouse_ids (
    id,
    name
  )
  `,
    )
    .eq("id", id)
    .single();
  // Transform the response to match IPointRuleWithDetails
  if (response.data) {
    // Note: Supabase array foreign key joins need special handling
    // For now, we'll fetch warehouses separately if needed
    const rule = response.data as any;
    return {
      data: rule as IPointRuleWithDetails,
      error: response.error,
    };
  }
  return response;
};

/**
 * Get default point rule (is_default = true)
 */
export const getDefaultPointRule = async (): Promise<{
  data: IPointRule | null;
  error: any;
}> => {
  const response = await supabase
    .from(TABLES.POINT_RULES)
    .select("*")
    .eq("is_default", true)
    .eq("is_active", true)
    .single();
  return response;
};

/**
 * Get active point rules for a specific warehouse
 */
export const getPointRulesForWarehouse = async (
  warehouseId: number,
): Promise<{
  data: IPointRule[] | null;
  error: any;
}> => {
  // Get rules that apply to all branches OR include this warehouse
  const response = await supabase
    .from(TABLES.POINT_RULES)
    .select("*")
    .eq("is_active", true)
    .or(`applies_to_all_branches.eq.true,warehouse_ids.cs.{${warehouseId}}`);
  return response;
};

// ==================== CREATE POINT RULE ====================

/**
 * Create a new point rule
 */
export const createPointRule = async (params: {
  name: string;
  description?: string;
  is_active?: boolean;
  is_default?: boolean;
  accumulation_spend_amount: number;
  accumulation_points_earned: number;
  redemption_points_required: number;
  redemption_voucher_value: number;
  applies_to_all_branches: boolean;
  warehouse_ids?: number[];
  voucher_validity_days?: number;
  voucher_min_points?: number;
  created_by?: string;
  notes?: string;
}): Promise<{
  data: IPointRule | null;
  error: any;
}> => {
  const {
    name,
    description,
    is_active = true,
    is_default = false,
    accumulation_spend_amount,
    accumulation_points_earned,
    redemption_points_required,
    redemption_voucher_value,
    applies_to_all_branches,
    warehouse_ids,
    voucher_validity_days = 30,
    voucher_min_points = 10,
    created_by,
    notes,
  } = params;
  const insertData: any = {
    name,
    description: description || null,
    is_active,
    is_default,
    accumulation_spend_amount,
    accumulation_points_earned,
    redemption_points_required,
    redemption_voucher_value,
    applies_to_all_branches,
    // If applies to all branches, set warehouse_ids to null
    // Otherwise, use provided warehouse_ids (must be non-empty array)
    warehouse_ids: applies_to_all_branches
      ? null
      : warehouse_ids && warehouse_ids.length > 0
        ? warehouse_ids
        : null,
    voucher_validity_days,
    voucher_min_points,
    created_by: created_by || null,
    notes: notes || null,
  };
  const response = await supabase
    .from(TABLES.POINT_RULES)
    .insert(insertData)
    .select()
    .single();
  return response;
};

// ==================== UPDATE POINT RULE ====================

/**
 * Update a point rule
 */
export const updatePointRule = async (
  id: number,
  params: {
    name?: string;
    description?: string;
    is_active?: boolean;
    is_default?: boolean;
    accumulation_spend_amount?: number;
    accumulation_points_earned?: number;
    redemption_points_required?: number;
    redemption_voucher_value?: number;
    applies_to_all_branches?: boolean;
    warehouse_ids?: number[];
    voucher_validity_days?: number;
    voucher_min_points?: number;
    notes?: string;
  },
): Promise<{
  data: IPointRule | null;
  error: any;
}> => {
  const updateData: any = {};

  if (params.name !== undefined) updateData.name = params.name;
  if (params.description !== undefined)
    updateData.description = params.description;
  if (params.is_active !== undefined) updateData.is_active = params.is_active;
  if (params.is_default !== undefined)
    updateData.is_default = params.is_default;
  if (params.accumulation_spend_amount !== undefined)
    updateData.accumulation_spend_amount = params.accumulation_spend_amount;
  if (params.accumulation_points_earned !== undefined)
    updateData.accumulation_points_earned = params.accumulation_points_earned;
  if (params.redemption_points_required !== undefined)
    updateData.redemption_points_required = params.redemption_points_required;
  if (params.redemption_voucher_value !== undefined)
    updateData.redemption_voucher_value = params.redemption_voucher_value;
  if (params.applies_to_all_branches !== undefined) {
    updateData.applies_to_all_branches = params.applies_to_all_branches;
    // If applies to all branches, clear warehouse_ids
    if (params.applies_to_all_branches) {
      updateData.warehouse_ids = null;
    } else {
      // If switching to specific branches, ensure warehouse_ids is set
      if (params.warehouse_ids !== undefined) {
        updateData.warehouse_ids = params.warehouse_ids;
      }
    }
  }
  // Only update warehouse_ids if not switching applies_to_all_branches
  if (
    params.warehouse_ids !== undefined &&
    params.applies_to_all_branches === undefined
  ) {
    // Only update if current rule doesn't apply to all branches
    // Note: We need to check current state, but for now, update if provided
    updateData.warehouse_ids = params.warehouse_ids;
  }
  if (params.voucher_validity_days !== undefined)
    updateData.voucher_validity_days = params.voucher_validity_days;
  if (params.voucher_min_points !== undefined)
    updateData.voucher_min_points = params.voucher_min_points;
  if (params.notes !== undefined) updateData.notes = params.notes;
  const response = await supabase
    .from(TABLES.POINT_RULES)
    .update(updateData)
    .eq("id", id)
    .select()
    .single();
  return response;
};

// ==================== DELETE POINT RULE ====================

/**
 * Delete a point rule
 */
export const deletePointRule = async (
  id: number,
): Promise<{
  data: any;
  error: any;
}> => {
  const response = await supabase
    .from(TABLES.POINT_RULES)
    .delete()
    .eq("id", id);
  return response;
};

// ==================== UTILITY FUNCTIONS ====================

/**
 * Calculate points to earn based on order value and rule
 */
export const calculatePointsToEarn = (
  orderValue: number,
  rule: IPointRule,
): number => {
  if (!rule.is_active) return 0;
  const points = Math.floor(
    (orderValue / rule.accumulation_spend_amount) *
      rule.accumulation_points_earned,
  );
  return points;
};

/**
 * Calculate voucher value from points using rule
 */
export const calculateVoucherValueFromPoints = (
  points: number,
  rule: IPointRule,
): number => {
  if (!rule.is_active) return 0;
  const vouchersCount = Math.floor(points / rule.redemption_points_required);
  return vouchersCount * rule.redemption_voucher_value;
};

/**
 * Get applicable point rule for a warehouse
 */
export const getApplicablePointRule = async (
  warehouseId?: number,
): Promise<{
  data: IPointRule | null;
  error: any;
}> => {
  // First try to get warehouse-specific rule
  if (warehouseId) {
    const { data: warehouseRules, error: warehouseError } =
      await getPointRulesForWarehouse(warehouseId);
    if (!warehouseError && warehouseRules && warehouseRules.length > 0) {
      // Return the first active rule (or default if exists)
      const defaultRule = warehouseRules.find((r) => r.is_default);
      return {
        data: defaultRule || warehouseRules[0],
        error: null,
      };
    }
  }
  // Fallback to default rule
  return getDefaultPointRule();
};

/**
 * Redeem points for voucher - Create a voucher from patient points
 * This function:
 * 1. Validates patient has enough points
 * 2. Gets applicable point rule
 * 3. Calculates voucher value
 * 4. Creates voucher with point tracking fields
 * 5. Deducts points from patient
 */
export const redeemPointsForVoucher = async (params: {
  patientId: string;
  points: number;
  warehouseId?: number;
  createdBy?: string;
}): Promise<{
  data: IVoucher | null;
  error: any;
}> => {
  const { patientId, points, warehouseId, createdBy } = params;
  // Validate points
  if (points <= 0) {
    return {
      data: null,
      error: { message: "Số điểm phải lớn hơn 0" },
    };
  }
  // Get patient current points
  const { data: patient, error: patientError } = await supabase
    .from("patients")
    .select("loyalty_points")
    .eq("patient_id", patientId)
    .single();
  if (patientError || !patient) {
    return {
      data: null,
      error: { message: "Không tìm thấy bệnh nhân" },
    };
  }
  const currentPoints = patient.loyalty_points || 0;
  if (currentPoints < points) {
    return {
      data: null,
      error: {
        message: `Không đủ điểm. Hiện có: ${currentPoints}, Cần: ${points}`,
      },
    };
  }
  // Get applicable point rule
  const { data: rule, error: ruleError } =
    await getApplicablePointRule(warehouseId);
  if (ruleError || !rule) {
    return {
      data: null,
      error: {
        message: "Không tìm thấy quy tắc tích điểm phù hợp",
      },
    };
  }
  if (!rule.is_active) {
    return {
      data: null,
      error: { message: "Quy tắc tích điểm đang tắt" },
    };
  }
  // Check minimum points
  if (points < (rule.voucher_min_points || 0)) {
    return {
      data: null,
      error: {
        message: `Số điểm tối thiểu để đổi là ${rule.voucher_min_points} điểm`,
      },
    };
  }
  // Calculate voucher value
  const vouchersCount = Math.floor(points / rule.redemption_points_required);
  if (vouchersCount === 0) {
    return {
      data: null,
      error: {
        message: `Số điểm không đủ để đổi voucher. Cần tối thiểu ${rule.redemption_points_required} điểm`,
      },
    };
  }
  const voucherValue = vouchersCount * rule.redemption_voucher_value;
  const actualPointsUsed = vouchersCount * rule.redemption_points_required;
  // Generate voucher code
  const voucherCode = `POINT-${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase()}`;
  // Calculate expiration date
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + rule.voucher_validity_days);

  // Get a placeholder promotion_id (required by DB constraint)
  // Use the first active promotion as placeholder, or create a default one
  let placeholderPromotionId = 0;
  const { data: firstPromotion } = await supabase
    .from("promotions")
    .select("id")
    .eq("is_active", true)
    .limit(1)
    .single();

  if (firstPromotion?.id) {
    placeholderPromotionId = firstPromotion.id;
  } else {
    // If no promotion exists, we need to create a default one
    // This should rarely happen, but handle it gracefully
    return {
      data: null,
      error: {
        message:
          "Không tìm thấy promotion nào trong hệ thống. Vui lòng tạo ít nhất một promotion trước khi đổi điểm.",
      },
    };
  }

  // Create voucher
  const { data: voucher, error: voucherError } = await supabase
    .from("vouchers")
    .insert({
      code: voucherCode,
      promotion_id: placeholderPromotionId, // Use placeholder promotion_id (required by DB)
      usage_limit: 1, // Point vouchers can only be used once
      times_used: 0,
      is_active: true,
      // Point voucher fields
      is_point_voucher: true,
      point_rule_id: rule.id,
      redeemed_by_patient_id: patientId,
      points_used: actualPointsUsed,
      redeemed_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();
  if (voucherError || !voucher) {
    return {
      data: null,
      error: {
        message: `Lỗi tạo voucher: ${voucherError?.message || "Unknown error"}`,
      },
    };
  }
  // Deduct points from patient
  const { redeemPointsFromPatient } = await import("./patientPointsService");
  const { error: redeemError } = await redeemPointsFromPatient({
    patientId,
    points: actualPointsUsed,
    referenceType: "order", // Use "order" as voucher redemption is similar to order redemption
    referenceId: null, // Voucher ID is BIGINT, not UUID, so set to null
    description: `Đổi ${actualPointsUsed} điểm thành voucher ${voucherCode} (Giá trị: ${voucherValue.toLocaleString()} VND)`,
    notes: `Voucher ID: ${voucher.id}, Hết hạn: ${expiresAt.toLocaleDateString("vi-VN")}`,
    createdBy,
  });
  if (redeemError) {
    // Rollback: delete voucher if points deduction fails
    await supabase.from("vouchers").delete().eq("id", voucher.id);
    return {
      data: null,
      error: {
        message: `Lỗi trừ điểm: ${redeemError.message}`,
      },
    };
  }
  return {
    data: voucher,
    error: null,
  };
};

/**
 * Redeem points directly for discount (without creating voucher)
 * This function:
 * 1. Validates patient has enough points
 * 2. Gets applicable point rule
 * 3. Calculates discount value from points
 * 4. Deducts points from patient
 * Returns discount amount and points used
 */
export const redeemPointsForDiscount = async (params: {
  patientId: string;
  points: number;
  warehouseId?: number;
  orderId?: string;
  createdBy?: string;
}): Promise<{
  data: {
    discountAmount: number;
    pointsUsed: number;
    pointsRemaining: number;
  } | null;
  error: any;
}> => {
  const { patientId, points, warehouseId, orderId, createdBy } = params;
  // Validate points
  if (points <= 0) {
    return {
      data: null,
      error: { message: "Số điểm phải lớn hơn 0" },
    };
  }
  // Get patient current points
  const { data: patient, error: patientError } = await supabase
    .from("patients")
    .select("loyalty_points")
    .eq("patient_id", patientId)
    .single();
  if (patientError || !patient) {
    return {
      data: null,
      error: { message: "Không tìm thấy bệnh nhân" },
    };
  }
  const currentPoints = patient.loyalty_points || 0;
  if (currentPoints < points) {
    return {
      data: null,
      error: {
        message: `Không đủ điểm. Hiện có: ${currentPoints}, Cần: ${points}`,
      },
    };
  }
  // Get applicable point rule
  const { data: rule, error: ruleError } =
    await getApplicablePointRule(warehouseId);
  if (ruleError || !rule) {
    return {
      data: null,
      error: {
        message: "Không tìm thấy quy tắc tích điểm phù hợp",
      },
    };
  }
  if (!rule.is_active) {
    return {
      data: null,
      error: { message: "Quy tắc tích điểm đang tắt" },
    };
  }
  // Calculate discount value from points
  // Formula: (points / redemption_points_required) * redemption_voucher_value
  const vouchersCount = Math.floor(points / rule.redemption_points_required);
  if (vouchersCount === 0) {
    return {
      data: null,
      error: {
        message: `Số điểm không đủ để đổi. Cần tối thiểu ${rule.redemption_points_required} điểm`,
      },
    };
  }
  const discountAmount = vouchersCount * rule.redemption_voucher_value;
  const actualPointsUsed = vouchersCount * rule.redemption_points_required;
  const pointsRemaining = currentPoints - actualPointsUsed;
  // Deduct points from patient
  const { redeemPointsFromPatient } = await import("./patientPointsService");
  const { error: redeemError } = await redeemPointsFromPatient({
    patientId,
    points: actualPointsUsed,
    referenceType: "order",
    referenceId: orderId,
    description: `Đổi ${actualPointsUsed} điểm lấy giảm giá trực tiếp (Giá trị: ${discountAmount.toLocaleString()} VND)`,
    notes: `Đơn hàng: ${orderId || "POS"}`,
    createdBy,
  });
  if (redeemError) {
    return {
      data: null,
      error: {
        message: `Lỗi trừ điểm: ${redeemError.message}`,
      },
    };
  }
  return {
    data: {
      discountAmount,
      pointsUsed: actualPointsUsed,
      pointsRemaining,
    },
    error: null,
  };
};
