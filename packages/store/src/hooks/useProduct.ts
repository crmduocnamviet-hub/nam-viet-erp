import {
  getInventoryByProductId,
  getProductById,
  updateProduct,
  upsetInventory,
} from "@nam-viet-erp/services";
import { FETCH_QUERY_KEY, useQuery } from "..";
import useSubmitQuery from "./useSubmitQuery";
import { FETCH_SUBMIT_QUERY_KEY } from "../constants";
import useFetchStore from "../fetchStore";
import { getQueryKey } from "./useQuery";

type ProductWithInventory = IProduct & {
  inventory_data: IInventory[];
};

export const useProductWithInventory = (productId: number) => {
  const { data, isLoading, isError, error } = useQuery<ProductWithInventory>({
    key: [FETCH_QUERY_KEY.PRODUCT_WITH_INVENTORY, productId!],
    queryFn: async () => {
      try {
        // Fetch product data
        const { data: product, error: productError } = await getProductById(
          productId
        );
        if (productError) throw productError;
        if (!product) {
          throw new Error("Không tìm thấy sản phẩm");
        }

        // Fetch inventory data for this product
        const { data: inventoryData, error: inventoryError } =
          await getInventoryByProductId(productId);
        if (inventoryError) {
          console.error("Error loading inventory:", inventoryError);
        }

        // Merge inventory data into product data
        const productWithInventory = {
          ...product,
          inventory_data: inventoryData || [],
        };
        return productWithInventory;
      } catch (error: any) {
        throw error;
      }
    },
  });

  return { data, isLoading, isError, error };
};

export const useUpdateProductHandler = ({
  productId,
  onError,
  onSuccess,
}: {
  productId: number;
  onError?: (e) => any;
  onSuccess?: () => any;
}) => {
  const refetchProductWithInventory = useFetchStore(
    (state) =>
      state.fetchData?.[
        getQueryKey([FETCH_QUERY_KEY.PRODUCT_WITH_INVENTORY, productId!])
      ]?.fetch ?? null
  );

  const { submit, isLoading } = useSubmitQuery({
    key: [FETCH_SUBMIT_QUERY_KEY.UPDATE_PRODUCT, productId],
    onSubmit: async (values: ProductFormData) => {
      try {
        const { inventory_settings, ...productData } = {...values};

        // Update product data
        const { error: productError } = await updateProduct(
          productId,
          productData
        );
        if (productError) throw productError;

        // Update inventory settings if they exist
        if (inventory_settings && Object.keys(inventory_settings).length > 0) {
          // Convert inventory_settings to array format for upsert
          const inventoryData = Object.entries(inventory_settings)
            .filter(([_, settings]) => settings && typeof settings === "object")
            .map(([warehouseId, settings]) => ({
              product_id: productId,
              warehouse_id: parseInt(warehouseId),
              min_stock: settings?.min_stock || 0,
              max_stock: settings?.max_stock || 0,
            }));

          const { error: inventoryError } = await upsetInventory(inventoryData);
          if (inventoryError) {
            throw {
              message:
                "Sản phẩm đã được cập nhật nhưng có lỗi khi cập nhật tồn kho.",
            };
          }
        }
      } catch (error: any) {
        throw error;
      }
    },
    onError(e) {
      onError?.(e);
    },
    onSuccess: () => {
      //Refetch product with inventory
      refetchProductWithInventory?.();
      //Run if success
      onSuccess?.();
    },
  });

  return { submit, isLoading };
};
