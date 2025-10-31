import useQuery from "./useQuery";
import useSubmitQuery from "./useSubmitQuery";
import {
  analyzeProductsNeedingReorder,
  createPurchaseOrdersFromProducts,
  analyticPurchaseOrderImage,
  analyticPurchaseOrderPdf,
} from "@nam-viet-erp/services";

/**
 * Hook to analyze products that need reordering in a warehouse
 * Returns products below min_stock threshold
 */
export const useAnalyzeProductsNeedingReorder = (
  warehouseId: number | null,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    key: ["analyze-products-reorder", warehouseId],
    queryFn: async () => {
      if (!warehouseId) return [];
      const result = await analyzeProductsNeedingReorder(warehouseId);
      return result;
    },
    disableCache: options?.enabled === false ? true : false,
  });
};

/**
 * Hook to automatically create purchase orders from analyzed products
 * Usage:
 * ```typescript
 * const { submit: createPOs, isLoading } = useCreatePurchaseOrdersFromProducts({
 *   onSuccess: (result) => {
 *     notification.success({ message: result.message });
 *   }
 * });
 *
 * await createPOs({ products, warehouseId, createdBy });
 * ```
 */
export const useCreatePurchaseOrdersFromProducts = (callbacks?: {
  onSuccess?: (result: any) => void;
  onError?: (error: any) => void;
}) => {
  return useSubmitQuery<
    { products: any[]; warehouseId: number; createdBy: string | null },
    any
  >({
    key: ["create-purchase-orders-from-products"],
    onSubmit: async (params) => {
      if (!params) {
        throw new Error("Missing parameters");
      }
      const { products, warehouseId, createdBy } = params;
      const result = await createPurchaseOrdersFromProducts(
        products,
        warehouseId,
        createdBy,
      );
      return result;
    },
    onSuccess: callbacks?.onSuccess,
    onError: callbacks?.onError,
  });
};

/**
 * Hook to analyze purchase order image using AI (Gemini Vision)
 * Extracts product information, quantities, lot numbers, and expiration dates
 *
 * Usage:
 * ```typescript
 * const { submit: analyzeImage, isLoading } = useAnalyticPurchaseOrderImage({
 *   onSuccess: (result) => {
 *     console.log('Extracted products:', result.products);
 *     console.log('Supplier:', result.supplier);
 *   }
 * });
 *
 * await analyzeImage(imageFile); // Pass File object directly
 * ```
 */
export const useAnalyticPurchaseOrderImage = (callbacks?: {
  onSuccess?: (result?: {
    text: string;
    products?: Array<{
      name: string;
      quantity?: number;
      lotNumber?: string;
      expirationDate?: string;
      lots?: Array<{
        lotNumber?: string;
        quantity?: number;
        expirationDate?: string;
      }>;
    }>;
    supplier?: string;
  }) => void;
  onError?: (error: any) => void;
}) => {
  return useSubmitQuery<
    File,
    {
      text: string;
      products?: Array<{
        name: string;
        quantity?: number;
        lotNumber?: string;
        expirationDate?: string;
        lots?: Array<{
          lotNumber?: string;
          quantity?: number;
          expirationDate?: string;
        }>;
      }>;
      supplier?: string;
    }
  >({
    key: ["analytic-purchase-order-image"],
    onSubmit: async (file) => {
      if (!file) {
        throw new Error("No file provided");
      }
      const result = await analyticPurchaseOrderImage(file);
      return result;
    },
    onSuccess: callbacks?.onSuccess,
    onError: callbacks?.onError,
  });
};

/**
 * Hook to analyze purchase order PDF using AI (Gemini)
 * Extracts product information, SKU, quantities, prices, lot numbers, and expiration dates
 *
 * Usage:
 * ```typescript
 * const { submit: analyzePdf, isLoading } = useAnalyticPurchaseOrderPdf({
 *   onSuccess: (result) => {
 *     console.log('Extracted products:', result.products);
 *     console.log('Supplier:', result.supplier);
 *   }
 * });
 *
 * await analyzePdf(pdfFile); // Pass File object directly
 * ```
 */
export const useAnalyticPurchaseOrderPdf = (callbacks?: {
  onSuccess?: (result?: {
    text: string;
    products?: Array<{
      name: string;
      quantity?: number;
      unitPrice?: number;
      sku?: string;
      lotNumber?: string;
      expirationDate?: string;
      lots?: Array<{
        lotNumber?: string;
        quantity?: number;
        expirationDate?: string;
      }>;
    }>;
    supplier?: string;
    orderNumber?: string;
    orderDate?: string;
    totalAmount?: number;
  }) => void;
  onError?: (error: any) => void;
}) => {
  return useSubmitQuery<
    File,
    {
      text: string;
      products?: Array<{
        name: string;
        quantity?: number;
        unitPrice?: number;
        sku?: string;
        lotNumber?: string;
        expirationDate?: string;
        lots?: Array<{
          lotNumber?: string;
          quantity?: number;
          expirationDate?: string;
        }>;
      }>;
      supplier?: string;
      orderNumber?: string;
      orderDate?: string;
      totalAmount?: number;
    }
  >({
    key: ["analytic-purchase-order-pdf"],
    onSubmit: async (file) => {
      if (!file) {
        throw new Error("No file provided");
      }
      const result = await analyticPurchaseOrderPdf(file);
      return result;
    },
    onSuccess: callbacks?.onSuccess,
    onError: callbacks?.onError,
  });
};

/**
 * Comprehensive hook for auto-generating purchase orders workflow
 * Combines analysis and creation into a single operation
 *
 * Usage:
 * ```typescript
 * const { submit: autoGeneratePOs, isLoading } = useAutoGeneratePurchaseOrders({
 *   onSuccess: ({ analyzed, created }) => {
 *     notification.success({
 *       message: `Created ${created.purchaseOrders?.length || 0} purchase orders`
 *     });
 *   }
 * });
 *
 * await autoGeneratePOs({ warehouseId: 1, createdBy: userId });
 * ```
 */
export const useAutoGeneratePurchaseOrders = (callbacks?: {
  onSuccess?: (result?: { analyzed: any; created: any }) => void;
  onError?: (error: any) => void;
}) => {
  return useSubmitQuery<
    { warehouseId: number; createdBy: string | null },
    { analyzed: any; created: any }
  >({
    key: ["auto-generate-purchase-orders"],
    onSubmit: async (params) => {
      if (!params) {
        throw new Error("Missing parameters");
      }
      const { warehouseId, createdBy } = params;

      // Step 1: Analyze products needing reorder
      const analyzedProducts = await analyzeProductsNeedingReorder(warehouseId);

      if (
        !analyzedProducts ||
        !analyzedProducts.productsToOrder ||
        analyzedProducts.productsToOrder.length === 0
      ) {
        return { analyzed: analyzedProducts, created: { purchaseOrders: [] } };
      }

      // Step 2: Create purchase orders from analyzed products
      const createdOrders = await createPurchaseOrdersFromProducts(
        analyzedProducts.productsToOrder,
        warehouseId,
        createdBy,
      );

      return {
        analyzed: analyzedProducts,
        created: createdOrders,
      };
    },
    onSuccess: callbacks?.onSuccess,
    onError: callbacks?.onError,
  });
};
