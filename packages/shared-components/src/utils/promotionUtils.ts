/**
 * Utility functions for promotion validation and calculations
 */

interface PromotionConditions {
  min_order_value?: number;
  manufacturers?: string[];
  product_categories?: string[];
}

interface Promotion {
  id: number;
  code?: string | null;
  name: string;
  type?: string;
  value?: number;
  conditions?: PromotionConditions;
}

interface CartItem {
  product_id?: number;
  manufacturer?: string;
  category?: string;
  product?: {
    manufacturer?: string;
    category?: string;
  };
}

/**
 * Check if a promotion is applicable based on order value and cart items
 */
export const isPromotionApplicable = (
  promo: Promotion,
  orderValue: number,
  items: CartItem[],
): boolean => {
  // If no conditions, promotion is always applicable
  if (!promo.conditions) return true;

  // Check min_order_value condition
  if (promo.conditions.min_order_value) {
    if (orderValue < promo.conditions.min_order_value) {
      return false;
    }
  }

  // Check manufacturers condition
  if (
    promo.conditions.manufacturers &&
    Array.isArray(promo.conditions.manufacturers) &&
    promo.conditions.manufacturers.length > 0
  ) {
    const allowedManufacturers = promo.conditions.manufacturers;
    const hasMatchingManufacturer = items.some((item: CartItem) => {
      const manufacturer = item.manufacturer || item.product?.manufacturer;
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
    promo.conditions.product_categories &&
    Array.isArray(promo.conditions.product_categories) &&
    promo.conditions.product_categories.length > 0
  ) {
    const allowedCategories = promo.conditions.product_categories;
    const hasMatchingCategory = items.some((item: CartItem) => {
      const category = item.category || item.product?.category;
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
};

/**
 * Get the reason why a promotion is not applicable
 */
export const getPromotionNotApplicableReason = (
  promo: Promotion,
  orderValue: number,
): string => {
  if (!promo.conditions) return "";

  // Check min_order_value first (most common reason)
  if (
    promo.conditions.min_order_value &&
    orderValue < promo.conditions.min_order_value
  ) {
    return `Cần đơn tối thiểu ${promo.conditions.min_order_value.toLocaleString()}đ`;
  }

  // Check other conditions
  if (
    promo.conditions.manufacturers?.length > 0 ||
    promo.conditions.product_categories?.length > 0
  ) {
    return "Sản phẩm không đủ điều kiện";
  }

  return "";
};

/**
 * Format promotion value for display
 */
export const formatPromotionValue = (type?: string, value?: number): string => {
  if (!value) return "-";

  if (type === "percentage") {
    return `${value}%`;
  }

  return `${value.toLocaleString("vi-VN")}đ`;
};

/**
 * Get promotion type label in Vietnamese
 */
export const getPromotionTypeLabel = (type?: string): string => {
  const types: Record<string, string> = {
    percentage: "Phần trăm (%)",
    fixed_amount: "Số tiền cố định",
    order_discount: "Giảm theo đơn hàng",
  };

  return types[type || ""] || type || "-";
};
