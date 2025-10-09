import {
  getB2BWarehouseProducts,
  getB2BWarehouseProductByBarCode,
  createB2BQuote,
  addQuoteItem,
} from "@nam-viet-erp/services";
import { FETCH_QUERY_KEY, FETCH_SUBMIT_QUERY_KEY } from "../constants";
import { useQuery } from "..";
import useSubmitQuery from "./useSubmitQuery";

/**
 * Hook to fetch B2B warehouse products by search keyword
 */
export const useB2BWarehouseProducts = (search: string) => {
  const { data, isLoading, isError, error, refetch } = useQuery<IProduct[]>({
    key: [FETCH_QUERY_KEY.B2B_WAREHOUSE_PRODUCTS, search],
    queryFn: async () => {
      try {
        const { data, error } = await getB2BWarehouseProducts({ search });
        if (error) throw error;

        // Extract products from inventory data
        const products: IProduct[] =
          data?.map((v) => v.products as unknown as IProduct) || [];
        return products;
      } catch (error: any) {
        throw error;
      }
    },
    // Only fetch if search term has 2+ characters
    disableCache: search.length < 2,
  });

  return { data, isLoading, isError, error, refetch };
};

/**
 * Hook to fetch product by barcode from B2B warehouses
 */
export const useB2BWarehouseProductByBarcode = (barcode: string) => {
  const { data, isLoading, isError, error } = useQuery<IProduct | null>({
    key: [FETCH_QUERY_KEY.B2B_WAREHOUSE_PRODUCT_BY_BARCODE, barcode],
    queryFn: async () => {
      try {
        const { data, error } = await getB2BWarehouseProductByBarCode({
          barcode,
        });
        if (error) throw error;

        // Return first product if found
        if (data && data.length > 0) {
          return data[0].products as unknown as IProduct;
        }
        return null;
      } catch (error: any) {
        throw error;
      }
    },
    // Only fetch if barcode exists
    disableCache: !barcode,
  });

  return { data, isLoading, isError, error };
};

/**
 * Hook to handle B2B quote creation
 */
export const useCreateB2BQuoteHandler = ({
  onError,
  onSuccess,
}: {
  onError?: (error: any) => void;
  onSuccess?: (quoteId: number, quoteNumber: string) => void;
}) => {
  const { submit, isLoading, data } = useSubmitQuery<
    {
      quoteData: any;
      orderItems: any[];
    },
    { quote_id: number; quote_number: string }
  >({
    key: [FETCH_SUBMIT_QUERY_KEY.CREATE_B2B_QUOTE],
    onSubmit: async (values) => {
      try {
        const { quoteData, orderItems } = values;

        // Create the quote
        const { data: newQuote, error: quoteError } =
          await createB2BQuote(quoteData);
        if (quoteError) throw quoteError;
        if (!newQuote) throw new Error("Không thể tạo báo giá");

        // Add quote items
        const quoteItemPromises = orderItems.map((item) => {
          // Validate product_id
          if (!item.product_id || typeof item.product_id !== "number") {
            console.error(
              "Invalid product ID detected:",
              item.product_id,
              item.product_name,
            );
            throw new Error(`Invalid product ID: ${item.product_id}`);
          }

          const itemData = {
            quote_id: newQuote.quote_id,
            product_id: item.product_id,
            product_name: item.product_name,
            product_sku: null,
            quantity: item.quantity,
            unit_price: item.unit_price,
            discount_percent: 0,
            discount_amount: 0,
            subtotal: item.total_price,
            notes: null,
          };

          return addQuoteItem(itemData);
        });

        // Wait for all items to be saved
        const itemResults = await Promise.all(quoteItemPromises);
        const failedItems = itemResults.filter((result) => result.error);

        if (failedItems.length > 0) {
          console.error("Some items failed to save:", failedItems);
          throw new Error("Một số sản phẩm không thể được thêm vào báo giá");
        }

        return {
          quote_id: newQuote.quote_id,
          quote_number: newQuote.quote_number,
        };
      } catch (error: any) {
        throw error;
      }
    },
    onError(error) {
      onError?.(error);
    },
    onSuccess() {
      onSuccess?.(data?.quote_id!, data?.quote_number!);
    },
  });

  return { submit, isLoading, data };
};
