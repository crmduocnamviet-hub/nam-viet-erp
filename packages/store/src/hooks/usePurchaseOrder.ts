import useQuery from "./useQuery";
import {
  getPurchaseOrderById,
  getSuppliers,
  searchProducts,
} from "@nam-viet-erp/services";

/**
 * Hook to fetch a purchase order by ID
 */
export const usePurchaseOrder = (id: number | null) => {
  return useQuery({
    key: ["purchase-order", id],
    queryFn: async () => {
      if (!id) return null;
      const response = await getPurchaseOrderById(id);
      if (response.error) {
        throw new Error(response.error.message || "Không thể tải đơn hàng");
      }
      return response.data;
    },
    disableCache: false,
  });
};

/**
 * Hook to fetch all suppliers
 */
export const useSuppliersQuery = () => {
  return useQuery({
    key: ["suppliers"],
    queryFn: async () => {
      const response = await getSuppliers();
      if (response.error) {
        throw new Error(response.error.message || "Không thể tải nhà cung cấp");
      }
      return response.data || [];
    },
    disableCache: false,
  });
};

/**
 * Hook to fetch products with search capability
 */
export const useProductsQuery = (pageSize = 1000) => {
  return useQuery({
    key: ["products", pageSize],
    queryFn: async () => {
      const response = await searchProducts({ pageSize });
      return response.data || [];
    },
    disableCache: false,
  });
};
