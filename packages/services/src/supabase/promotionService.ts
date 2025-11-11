import type { PostgrestSingleResponse } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export const getPromotionFilterOptions = async () => {
  const [categoryRes, manuRes] = await Promise.all([
    supabase.from("products").select("category"),
    supabase.from("products").select("manufacturer"),
  ]);

  if (categoryRes.error) throw categoryRes.error;
  if (manuRes.error) throw manuRes.error;

  const uniqueCategories = [
    ...new Set(categoryRes.data.map((item) => item.category).filter(Boolean)),
  ];
  const categories = uniqueCategories.map((c) => ({ value: c, label: c }));

  const uniqueManufacturers = [
    ...new Set(manuRes.data.map((item) => item.manufacturer).filter(Boolean)),
  ];
  const manufacturers = uniqueManufacturers.map((m) => ({
    value: m,
    label: m,
  }));

  return { categories, manufacturers };
};

export const getVouchers = async (promoId: string) => {
  const { data, error } = await supabase
    .from("vouchers")
    .select("*")
    .eq("promotion_id", promoId);

  if (error) throw error;
  return data || [];
};

export const getPromotionDetail = async (id: string) => {
  const { data, error } = await supabase
    .from("promotions")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
};

export const getPromotions = async () => {
  const response = await supabase
    .from("promotions")
    .select("*")
    .order("created_at", { ascending: false });

  return response;
};

export const createPromotion = async (record: Record<string, any>) => {
  const response = await supabase
    .from("promotions")
    .insert(record)
    .select()
    .single();

  return response;
};

export const updatePromotion = async (
  id: string,
  record: Record<string, any>,
) => {
  const response = await supabase
    .from("promotions")
    .update(record)
    .eq("id", id);
  return response;
};

export const createVoucher = async (record: Omit<IVoucher, "id">) => {
  // Ensure promotion vouchers don't have point fields set
  const insertData: any = {
    ...record,
    // If not explicitly a point voucher, ensure point fields are null/false
    is_point_voucher: record.is_point_voucher ?? false,
    point_rule_id: record.point_rule_id ?? null,
    redeemed_by_patient_id: record.redeemed_by_patient_id ?? null,
    points_used: record.points_used ?? 0,
    redeemed_at: record.redeemed_at ?? null,
    expires_at: record.expires_at ?? null,
  };
  const response = await supabase.from("vouchers").insert([insertData]);
  return response;
};

export const getVouchersWithPromotion = async () => {
  const response = await supabase
    .from("vouchers")
    .select(
      "*, promotions(name), point_rules(name), patients(patient_id, full_name)",
    )
    .order("created_at", { ascending: false });

  return response;
};

export const getActivePromotions = async () => {
  // Only get promotions with valid types to avoid errors when creating vouchers
  const validTypes = ["order_discount", "percentage", "fixed_amount"];
  const response = await supabase
    .from("promotions")
    .select("id, name, type")
    .eq("is_active", true)
    .in("type", validTypes);

  return response;
};

export const deleteVoucher = async (
  id: number,
): Promise<PostgrestSingleResponse<null>> => {
  const response = await supabase.from("vouchers").delete().eq("id", id);
  return response;
};

export const updateVoucher = async (
  id: number,
  record: Partial<IVoucher>,
): Promise<PostgrestSingleResponse<IVoucher | null>> => {
  // If is_point_voucher is explicitly set to false, clear all point fields
  // This ensures promotion vouchers don't accidentally have point data
  const finalUpdateData: any = { ...record };

  if (record.is_point_voucher === false) {
    // Promotion voucher update - clear all point fields
    finalUpdateData.is_point_voucher = false;
    finalUpdateData.point_rule_id = null;
    finalUpdateData.redeemed_by_patient_id = null;
    finalUpdateData.points_used = 0;
    finalUpdateData.redeemed_at = null;
    finalUpdateData.expires_at = null;
  }
  // If is_point_voucher is true or undefined, preserve existing point fields
  // (Point vouchers should only be updated through point redemption service)

  const response: PostgrestSingleResponse<IVoucher | null> = await supabase
    .from("vouchers")
    .update(finalUpdateData)
    .eq("id", id);

  return response;
};

export const deletePromotion = async (id: number) => {
  const response = await supabase.from("promotions").delete().eq("id", id);
  return response;
};

// ============================================
// PROMO CODE FUNCTIONS
// ============================================

/**
 * Validate a promo code by code only
 * Returns the promotion if valid, null if invalid
 */
export const validatePromoCode = async (promoCode: string) => {
  if (!promoCode || promoCode.trim() === "") {
    return {
      data: null,
      error: { message: "Mã khuyến mãi không được để trống" },
    };
  }

  const trimmedCode = promoCode.trim();
  const now = new Date();

  // First check if it's a point voucher
  const { data: voucher, error: voucherError } = await supabase
    .from("vouchers")
    .select(
      "*, point_rules(redemption_points_required, redemption_voucher_value)",
    )
    .eq("code", trimmedCode)
    .eq("is_active", true)
    .maybeSingle(); // Use maybeSingle() instead of single() to avoid 406 error

  if (!voucherError && voucher) {
    // It's a voucher code - validate point voucher
    if (voucher.is_point_voucher) {
      // Check expiration
      if (voucher.expires_at) {
        const expiresAt = new Date(voucher.expires_at);
        if (now > expiresAt) {
          return {
            data: null,
            error: { message: "Voucher đã hết hạn" },
          };
        }
      }

      // Check usage limit
      if (voucher.times_used >= voucher.usage_limit) {
        return {
          data: null,
          error: { message: "Voucher đã được sử dụng hết lượt" },
        };
      }

      // Calculate voucher value from points used and rule
      let voucherValue = 0;
      if (voucher.point_rules && voucher.points_used) {
        const rule = Array.isArray(voucher.point_rules)
          ? voucher.point_rules[0]
          : voucher.point_rules;
        if (rule && rule.redemption_points_required > 0) {
          const vouchersCount = Math.floor(
            voucher.points_used / rule.redemption_points_required,
          );
          voucherValue = vouchersCount * rule.redemption_voucher_value;
        }
      }

      // Return voucher data with type indicator
      return {
        data: {
          ...voucher,
          type: "point_voucher",
          voucher_value: voucherValue,
        },
        error: null,
      };
    } else {
      // Regular promotion voucher - check usage
      if (voucher.times_used >= voucher.usage_limit) {
        return {
          data: null,
          error: { message: "Mã giảm giá đã được sử dụng hết lượt" },
        };
      }

      // Get promotion for regular voucher
      const { data: promotion, error: promoError } = await supabase
        .from("promotions")
        .select("*")
        .eq("id", voucher.promotion_id)
        .eq("is_active", true)
        .single();

      if (promoError || !promotion) {
        return {
          data: null,
          error: { message: "Chương trình khuyến mãi không hợp lệ" },
        };
      }

      // Validate promotion type
      const validTypes = ["order_discount", "percentage", "fixed_amount"];
      if (!promotion.type || !validTypes.includes(promotion.type)) {
        return {
          data: null,
          error: {
            message: `Chương trình khuyến mãi có loại không hợp lệ (${promotion.type || "null"}). Vui lòng cập nhật loại khuyến mãi.`,
          },
        };
      }

      const today = new Date().toISOString().split("T")[0];
      if (promotion.start_date > today || promotion.end_date < today) {
        return {
          data: null,
          error: { message: "Chương trình khuyến mãi đã hết hạn" },
        };
      }

      // Preserve original promotion type, add validationType to distinguish
      return {
        data: {
          ...promotion,
          validationType: "promotion",
          voucher_id: voucher.id,
        },
        error: null,
      };
    }
  }

  // If not a voucher, check if it's a promotion code
  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("promotions")
    .select("*")
    .eq("code", trimmedCode)
    .eq("is_active", true)
    .lte("start_date", today)
    .gte("end_date", today)
    .single();

  if (error || !data) {
    // Check if promotion exists but is not in date range
    const { data: promoCheck, error: promoCheckError } = await supabase
      .from("promotions")
      .select("code, start_date, end_date, is_active, type")
      .eq("code", trimmedCode)
      .single();

    if (promoCheck) {
      const today = new Date().toISOString().split("T")[0];

      if (!promoCheck.is_active) {
        return {
          data: null,
          error: { message: "Mã khuyến mãi đang tắt" },
        };
      }

      if (promoCheck.start_date > today) {
        return {
          data: null,
          error: {
            message: `Mã khuyến mãi chưa bắt đầu. Thời gian hiệu lực: ${new Date(promoCheck.start_date).toLocaleDateString("vi-VN")} - ${new Date(promoCheck.end_date).toLocaleDateString("vi-VN")}`,
          },
        };
      }
      if (promoCheck.end_date < today) {
        return {
          data: null,
          error: {
            message: `Mã khuyến mãi đã hết hạn. Thời gian hiệu lực: ${new Date(promoCheck.start_date).toLocaleDateString("vi-VN")} - ${new Date(promoCheck.end_date).toLocaleDateString("vi-VN")}`,
          },
        };
      }
    }

    return {
      data: null,
      error: { message: "Mã khuyến mãi không hợp lệ hoặc đã hết hạn" },
    };
  }

  // Validate promotion type
  const validTypes = ["order_discount", "percentage", "fixed_amount"];

  if (!data.type || !validTypes.includes(data.type)) {
    return {
      data: null,
      error: {
        message: `Chương trình khuyến mãi có loại không hợp lệ (${data.type || "null"}). Vui lòng cập nhật loại khuyến mãi thành: Giảm giá theo đơn hàng, Phần trăm, hoặc Số tiền cố định.`,
      },
    };
  }

  // Return with original type preserved, add validationType to distinguish from point_voucher
  return { data: { ...data, validationType: "promotion" }, error: null };
};

/**
 * Apply a promo code to an order
 * Calculates the discount amount based on promotion type
 */
export const applyPromoCode = async (
  promoCode: string,
  orderValue: number,
  items?: any[], // Optional: items in order/cart to check manufacturers and categories
): Promise<{
  discountAmount: number;
  promoCode: string | null;
  promoName: string | null;
  error: any;
}> => {
  try {
    const { data: promotionOrVoucher, error } =
      await validatePromoCode(promoCode);

    if (error || !promotionOrVoucher) {
      return { discountAmount: 0, promoCode: null, promoName: null, error };
    }

    // Handle point vouchers
    const validationType =
      (promotionOrVoucher as any)?.validationType || promotionOrVoucher.type;
    if (
      validationType === "point_voucher" ||
      promotionOrVoucher.type === "point_voucher"
    ) {
      const voucher = promotionOrVoucher as IVoucher & {
        voucher_value?: number;
      };
      const discountAmount = voucher.voucher_value || 0;

      // Update voucher usage count
      if (voucher.id) {
        await supabase
          .from("vouchers")
          .update({
            times_used: (voucher.times_used || 0) + 1,
          })
          .eq("id", voucher.id);
      }

      return {
        discountAmount: Math.min(discountAmount, orderValue), // Don't exceed order value
        promoCode: voucher.code,
        promoName: `Voucher đổi từ điểm (${voucher.points_used || 0} điểm)`,
        error: null,
      };
    }

    // Handle regular promotions
    const promotion = promotionOrVoucher as IPromotion & {
      voucher_id?: number;
    };

    // Check conditions based on promotion type (use original type, not validationType)
    const promotionType = promotion.type || "percentage";

    // For order_discount type, MUST validate min_order_value BEFORE other checks
    if (promotionType === "order_discount") {
      const minOrderValue = promotion.conditions?.min_order_value;

      if (
        !minOrderValue ||
        (typeof minOrderValue === "number" && minOrderValue <= 0)
      ) {
        return {
          discountAmount: 0,
          promoCode: null,
          promoName: null,
          error: {
            message:
              'Mã khuyến mãi loại "Giảm giá theo đơn hàng" cần có điều kiện đơn hàng tối thiểu. Vui lòng kiểm tra lại cấu hình khuyến mãi.',
          },
        };
      }

      const minValue =
        typeof minOrderValue === "number"
          ? minOrderValue
          : Number(minOrderValue);
      if (orderValue < minValue) {
        return {
          discountAmount: 0,
          promoCode: null,
          promoName: null,
          error: {
            message: `Đơn hàng tối thiểu phải từ ${minValue.toLocaleString()}đ để áp dụng mã khuyến mãi này`,
          },
        };
      }
    }

    // Check other conditions (manufacturers, categories) if specified
    if (promotion.conditions) {
      // For non-order_discount types, check min_order_value if specified (optional)
      if (promotionType !== "order_discount") {
        const minOrderValue = promotion.conditions.min_order_value;

        if (
          minOrderValue &&
          (typeof minOrderValue === "number"
            ? minOrderValue > 0
            : Number(minOrderValue) > 0)
        ) {
          const minValue =
            typeof minOrderValue === "number"
              ? minOrderValue
              : Number(minOrderValue);
          if (orderValue < minValue) {
            return {
              discountAmount: 0,
              promoCode: null,
              promoName: null,
              error: {
                message: `Đơn hàng tối thiểu phải từ ${minValue.toLocaleString()}đ`,
              },
            };
          }
        }
      }

      // Fetch product details once if needed for manufacturers or categories check
      const needsProductFetch =
        items &&
        ((promotion.conditions.manufacturers &&
          Array.isArray(promotion.conditions.manufacturers)) ||
          (promotion.conditions.product_categories &&
            Array.isArray(promotion.conditions.product_categories)));

      let productsMap: Record<number, any> = {};
      if (needsProductFetch) {
        const productIds = items
          .map((item: any) => item.product_id)
          .filter(Boolean);

        if (productIds.length > 0) {
          const { data: products } = await supabase
            .from("products")
            .select("id, manufacturer, category")
            .in("id", productIds);

          if (products) {
            products.forEach((p: any) => {
              productsMap[p.id] = p;
            });
          }
        }
      }

      // Check manufacturers condition (if specified)
      if (
        items &&
        promotion.conditions.manufacturers &&
        Array.isArray(promotion.conditions.manufacturers)
      ) {
        const allowedManufacturers = promotion.conditions.manufacturers;

        const hasMatchingManufacturer = items.some((item: any) => {
          // Check if item has manufacturer field
          let manufacturer = item.manufacturer || item.product?.manufacturer;

          // If not found, fetch from productsMap
          if (
            !manufacturer &&
            item.product_id &&
            productsMap[item.product_id]
          ) {
            manufacturer = productsMap[item.product_id].manufacturer;
          }

          if (!manufacturer) return false;

          // Normalize for comparison (trim and case-insensitive)
          const normalizedManufacturer = manufacturer.trim().toLowerCase();
          const isMatch = allowedManufacturers.some(
            (allowed: string) =>
              allowed.trim().toLowerCase() === normalizedManufacturer,
          );

          return isMatch;
        });

        if (!hasMatchingManufacturer) {
          return {
            discountAmount: 0,
            promoCode: null,
            promoName: null,
            error: {
              message: `Mã khuyến mãi này chỉ áp dụng cho các sản phẩm của hãng đã chỉ định. Vui lòng kiểm tra lại giỏ hàng.`,
            },
          };
        }
      }

      // Check product categories condition (if specified)
      if (
        items &&
        promotion.conditions.product_categories &&
        Array.isArray(promotion.conditions.product_categories)
      ) {
        const allowedCategories = promotion.conditions.product_categories;

        const hasMatchingCategory = items.some((item: any) => {
          // Check if item has category field
          let category = item.category || item.product?.category;

          // If not found, fetch from productsMap
          if (!category && item.product_id && productsMap[item.product_id]) {
            category = productsMap[item.product_id].category;
          }

          if (!category) return false;

          // Normalize for comparison (trim and case-insensitive)
          const normalizedCategory = category.trim().toLowerCase();
          const isMatch = allowedCategories.some(
            (allowed: string) =>
              allowed.trim().toLowerCase() === normalizedCategory,
          );

          return isMatch;
        });

        if (!hasMatchingCategory) {
          return {
            discountAmount: 0,
            promoCode: null,
            promoName: null,
            error: {
              message: `Mã khuyến mãi này chỉ áp dụng cho các sản phẩm thuộc phân loại đã chỉ định. Vui lòng kiểm tra lại giỏ hàng.`,
            },
          };
        }
      }
    }

    // Validate promotion type before calculating discount
    const validTypes = ["order_discount", "percentage", "fixed_amount"];

    if (!promotionType || !validTypes.includes(promotionType)) {
      return {
        discountAmount: 0,
        promoCode: null,
        promoName: null,
        error: {
          message: `Loại khuyến mãi không được hỗ trợ (${promotionType || "null"}). Chỉ hỗ trợ: Giảm giá theo đơn hàng, Phần trăm, Số tiền cố định.`,
        },
      };
    }

    // Calculate discount based on promotion type
    let discountAmount = 0;
    const promotionValue =
      typeof promotion.value === "number"
        ? promotion.value
        : Number(promotion.value || 0);

    if (promotionType === "order_discount") {
      // Fixed discount amount based on promotion.value
      // min_order_value already validated above
      discountAmount = Math.min(promotionValue, orderValue);
    } else if (promotionType === "percentage") {
      // Percentage discount
      discountAmount = (orderValue * promotionValue) / 100;
    } else if (promotionType === "fixed_amount") {
      // Fixed discount amount (no min_order_value required, but can be optional)
      discountAmount = Math.min(promotionValue, orderValue);
    }

    return {
      discountAmount,
      promoCode: promotion.code || promoCode,
      promoName: promotion.name,
      error: null,
    };
  } catch (error: any) {
    return {
      discountAmount: 0,
      promoCode: null,
      promoName: null,
      error: {
        message: `Lỗi khi áp dụng mã khuyến mãi: ${error?.message || "Lỗi không xác định"}`,
      },
    };
  }
};
/**
 * Get all active promo codes (promotions)
 */
export const getPromoCodes = async () => {
  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("promotions")
    .select("id, name, code, type, value, description, start_date, end_date")
    .eq("is_active", true)
    .not("code", "is", null)
    .lte("start_date", today)
    .gte("end_date", today)
    .order("created_at", { ascending: false });

  return { data: data || [], error };
};

/**
 * Get applicable promotions based on order details
 * Filters promotions by order value and items (manufacturers, categories)
 */
export const getApplicablePromotions = async (
  orderValue: number,
  items?: any[],
): Promise<{
  data: any[];
  error: any;
}> => {
  const today = new Date().toISOString().split("T")[0];

  // Get all active promotions within valid date range
  const { data: promotions, error } = await supabase
    .from("promotions")
    .select("*")
    .eq("is_active", true)
    .lte("start_date", today)
    .gte("end_date", today)
    .order("value", { ascending: false }); // Order by value descending to show best deals first

  if (error || !promotions) {
    return { data: [], error };
  }

  // Fetch product details if items are provided
  let productsMap: Record<number, any> = {};
  if (items && items.length > 0) {
    const productIds = items
      .map((item: any) => item.product_id)
      .filter(Boolean);

    if (productIds.length > 0) {
      const { data: products } = await supabase
        .from("products")
        .select("id, manufacturer, category")
        .in("id", productIds);

      if (products) {
        products.forEach((p: any) => {
          productsMap[p.id] = p;
        });
      }
    }
  }

  // Filter promotions based on conditions
  const applicablePromotions = promotions.filter((promotion: any) => {
    // Check min_order_value condition
    if (promotion.conditions?.min_order_value) {
      if (orderValue < promotion.conditions.min_order_value) {
        return false;
      }
    }

    // Check manufacturers condition
    if (
      items &&
      promotion.conditions?.manufacturers &&
      Array.isArray(promotion.conditions.manufacturers) &&
      promotion.conditions.manufacturers.length > 0
    ) {
      const allowedManufacturers = promotion.conditions.manufacturers;

      const hasMatchingManufacturer = items.some((item: any) => {
        let manufacturer = item.manufacturer || item.product?.manufacturer;

        if (!manufacturer && item.product_id && productsMap[item.product_id]) {
          manufacturer = productsMap[item.product_id].manufacturer;
        }

        if (!manufacturer) return false;

        const normalizedManufacturer = manufacturer.trim().toLowerCase();
        return allowedManufacturers.some(
          (allowed: string) =>
            allowed.trim().toLowerCase() === normalizedManufacturer,
        );
      });

      if (!hasMatchingManufacturer) {
        return false;
      }
    }

    // Check product_categories condition
    if (
      items &&
      promotion.conditions?.product_categories &&
      Array.isArray(promotion.conditions.product_categories) &&
      promotion.conditions.product_categories.length > 0
    ) {
      const allowedCategories = promotion.conditions.product_categories;

      const hasMatchingCategory = items.some((item: any) => {
        let category = item.category || item.product?.category;

        if (!category && item.product_id && productsMap[item.product_id]) {
          category = productsMap[item.product_id].category;
        }

        if (!category) return false;

        const normalizedCategory = category.trim().toLowerCase();
        return allowedCategories.some(
          (allowed: string) =>
            allowed.trim().toLowerCase() === normalizedCategory,
        );
      });

      if (!hasMatchingCategory) {
        return false;
      }
    }

    return true;
  });

  return { data: applicablePromotions, error: null };
};
