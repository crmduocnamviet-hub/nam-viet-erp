import { supabase } from "./supabase";

// Promotion Types
export type PromotionType =
  | "buy_x_get_y"
  | "percentage_discount"
  | "fixed_discount"
  | "post_payment_discount";

// Promotion Config Types
export interface BuyXGetYConfig {
  buy_quantity: number;
  get_quantity: number;
}

export interface PercentageDiscountConfig {
  discount_percent: number;
  applies_to?: string;
}

export interface FixedDiscountConfig {
  discount_amount: number;
  min_order_value?: number;
}

export interface PostPaymentDiscountConfig {
  discount_percent: number;
  payment_days: number;
}

export type PromotionConfig =
  | BuyXGetYConfig
  | PercentageDiscountConfig
  | FixedDiscountConfig
  | PostPaymentDiscountConfig;

// Supplier Promotion Interface
export interface ISupplierPromotion {
  id: number;
  supplier_id: number;
  name: string;
  description?: string;
  promotion_type: PromotionType;
  promotion_config: PromotionConfig;
  start_date: string;
  end_date?: string;
  applies_to_all_products: boolean;
  product_ids?: number[];
  min_order_quantity?: number;
  min_order_value?: number;
  is_active: boolean;
  priority?: number;
  created_at?: string;
  updated_at?: string;
  created_by?: number;
  internal_notes?: string;
  // Relations
  supplier?: any;
}

/**
 * Get all supplier promotions with filters
 */
export const getSupplierPromotions = async (filters?: {
  supplierId?: number;
  isActive?: boolean;
  promotionType?: PromotionType;
  currentDate?: string; // Filter by active on this date
}) => {
  let query = supabase
    .from("supplier_promotions")
    .select(
      `
      *,
      supplier:suppliers(id, name)
    `,
    )
    .order("priority", { ascending: false })
    .order("start_date", { ascending: false });

  if (filters?.supplierId) {
    query = query.eq("supplier_id", filters.supplierId);
  }

  if (filters?.isActive !== undefined) {
    query = query.eq("is_active", filters.isActive);
  }

  if (filters?.promotionType) {
    query = query.eq("promotion_type", filters.promotionType);
  }

  if (filters?.currentDate) {
    query = query
      .lte("start_date", filters.currentDate)
      .or(`end_date.is.null,end_date.gte.${filters.currentDate}`);
  }

  return await query;
};

/**
 * Get active promotions for a supplier on a specific date
 */
export const getActiveSupplierPromotions = async (
  supplierId: number,
  date: string = new Date().toISOString().split("T")[0],
) => {
  return await supabase
    .from("supplier_promotions")
    .select("*")
    .eq("supplier_id", supplierId)
    .eq("is_active", true)
    .lte("start_date", date)
    .or(`end_date.is.null,end_date.gte.${date}`)
    .order("priority", { ascending: false });
};

/**
 * Get promotion by ID
 */
export const getSupplierPromotionById = async (id: number) => {
  return await supabase
    .from("supplier_promotions")
    .select(
      `
      *,
      supplier:suppliers(id, name)
    `,
    )
    .eq("id", id)
    .single();
};

/**
 * Create a new supplier promotion
 */
export const createSupplierPromotion = async (
  promotion: Omit<ISupplierPromotion, "id" | "created_at" | "updated_at">,
) => {
  return await supabase
    .from("supplier_promotions")
    .insert(promotion)
    .select()
    .single();
};

/**
 * Update supplier promotion
 */
export const updateSupplierPromotion = async (
  id: number,
  updates: Partial<ISupplierPromotion>,
) => {
  return await supabase
    .from("supplier_promotions")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
};

/**
 * Delete supplier promotion
 */
export const deleteSupplierPromotion = async (id: number) => {
  return await supabase.from("supplier_promotions").delete().eq("id", id);
};

/**
 * Toggle promotion active status
 */
export const toggleSupplierPromotionStatus = async (
  id: number,
  isActive: boolean,
) => {
  return await supabase
    .from("supplier_promotions")
    .update({ is_active: isActive })
    .eq("id", id)
    .select()
    .single();
};

/**
 * Get applicable promotions for a product from a supplier
 */
export const getApplicablePromotionsForProduct = async (
  supplierId: number,
  productId: number,
  date: string = new Date().toISOString().split("T")[0],
) => {
  return await supabase
    .from("supplier_promotions")
    .select("*")
    .eq("supplier_id", supplierId)
    .eq("is_active", true)
    .lte("start_date", date)
    .or(`end_date.is.null,end_date.gte.${date}`)
    .or(`applies_to_all_products.eq.true,product_ids.cs.{${productId}}`)
    .order("priority", { ascending: false });
};

/**
 * Calculate discount for a promotion
 */
export const calculatePromotionDiscount = (
  promotion: ISupplierPromotion,
  orderQuantity: number,
  unitPrice: number,
): {
  effectivePrice: number;
  discountAmount: number;
  freeQuantity?: number;
} => {
  const config = promotion.promotion_config;

  switch (promotion.promotion_type) {
    case "buy_x_get_y": {
      const { buy_quantity, get_quantity } = config as BuyXGetYConfig;
      const sets = Math.floor(orderQuantity / buy_quantity);
      const freeQuantity = sets * get_quantity;
      const totalItems = orderQuantity + freeQuantity;
      const effectivePrice = (orderQuantity * unitPrice) / totalItems;
      const discountAmount = unitPrice - effectivePrice;

      return { effectivePrice, discountAmount, freeQuantity };
    }

    case "percentage_discount": {
      const { discount_percent } = config as PercentageDiscountConfig;
      const discountAmount = (unitPrice * discount_percent) / 100;
      const effectivePrice = unitPrice - discountAmount;

      return { effectivePrice, discountAmount };
    }

    case "fixed_discount": {
      const { discount_amount } = config as FixedDiscountConfig;
      const effectivePrice = Math.max(0, unitPrice - discount_amount);
      const discountAmount = discount_amount;

      return { effectivePrice, discountAmount };
    }

    case "post_payment_discount": {
      const { discount_percent } = config as PostPaymentDiscountConfig;
      const discountAmount = (unitPrice * discount_percent) / 100;
      const effectivePrice = unitPrice - discountAmount;

      return { effectivePrice, discountAmount };
    }

    default:
      return { effectivePrice: unitPrice, discountAmount: 0 };
  }
};
