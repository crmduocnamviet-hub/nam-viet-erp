import { useState, useEffect, useMemo } from "react";

export interface ProductToOrder {
  product_id: number;
  product_name: string;
  supplier_id: number;
  supplier_name: string;
  current_stock: number;
  min_stock: number;
  max_stock: number;
  quantity_needed: number;
  unit_price: number;
}

export interface UseAutoGeneratePOModalParams {
  products: ProductToOrder[];
}

export interface UseAutoGeneratePOModalReturn {
  editedProducts: ProductToOrder[];
  handleQuantityChange: (productId: number, newQuantity: number) => void;
  productsBySupplier: Record<string, ProductToOrder[]>;
  totalAmount: number;
  totalProducts: number;
  totalSuppliers: number;
  resetProducts: () => void;
}

/**
 * Custom hook for managing purchase order draft preview logic
 * Handles product editing, grouping by supplier, and calculations
 *
 * @param params - Configuration object
 * @param params.products - Initial list of products to order
 * @returns Object containing state and handlers for PO draft management
 *
 * @example
 * ```typescript
 * const {
 *   editedProducts,
 *   handleQuantityChange,
 *   productsBySupplier,
 *   totalAmount,
 *   totalProducts,
 *   totalSuppliers
 * } = useAutoGeneratePOModal({ products });
 * ```
 */
export const useAutoGeneratePOModal = ({
  products,
}: UseAutoGeneratePOModalParams): UseAutoGeneratePOModalReturn => {
  const [editedProducts, setEditedProducts] = useState<ProductToOrder[]>([]);

  // Initialize edited products when products change
  useEffect(() => {
    setEditedProducts(products);
  }, [products]);

  /**
   * Handle quantity change with validation
   * Ensures quantity is always at least 1
   */
  const handleQuantityChange = (productId: number, newQuantity: number) => {
    // Ensure quantity is within valid range
    const validQuantity = Math.max(1, newQuantity);

    setEditedProducts((prev) =>
      prev.map((p) =>
        p.product_id === productId
          ? { ...p, quantity_needed: validQuantity }
          : p,
      ),
    );
  };

  /**
   * Reset products to initial state
   */
  const resetProducts = () => {
    setEditedProducts(products);
  };

  /**
   * Group products by supplier
   * Memoized to avoid recalculation on every render
   */
  const productsBySupplier = useMemo(() => {
    const grouped: Record<string, ProductToOrder[]> = {};
    editedProducts.forEach((product) => {
      const supplierName = product.supplier_name;
      if (!grouped[supplierName]) {
        grouped[supplierName] = [];
      }
      grouped[supplierName].push(product);
    });
    return grouped;
  }, [editedProducts]);

  /**
   * Calculate total amount across all products
   */
  const totalAmount = useMemo(() => {
    return editedProducts.reduce(
      (sum, p) => sum + p.quantity_needed * p.unit_price,
      0,
    );
  }, [editedProducts]);

  /**
   * Total number of products
   */
  const totalProducts = editedProducts.length;

  /**
   * Total number of unique suppliers
   */
  const totalSuppliers = Object.keys(productsBySupplier).length;

  return {
    editedProducts,
    handleQuantityChange,
    productsBySupplier,
    totalAmount,
    totalProducts,
    totalSuppliers,
    resetProducts,
  };
};
