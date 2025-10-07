import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

// State interface
export interface ProductState {
  // Product data
  products: any[];
  currentProduct: any | null;
  isLoadingProducts: boolean;
  isLoadingProduct: boolean;
  isSaving: boolean;
  error: string | null;

  // Actions
  setProducts: (products: any[]) => void;
  setCurrentProduct: (product: any | null) => void;
  setLoadingProducts: (isLoading: boolean) => void;
  setLoadingProduct: (isLoading: boolean) => void;
  setSaving: (isSaving: boolean) => void;
  setError: (error: string | null) => void;

  // API Actions
  fetchProducts: () => Promise<{ data: any[] | null; error: any }>;
  fetchProductById: (productId: number) => Promise<{ data: any | null; error: any }>;
  createProduct: (productData: any) => Promise<{ data: any | null; error: any }>;
  updateProduct: (productId: number, productData: any) => Promise<{ data: any | null; error: any }>;
  deleteProduct: (productId: number) => Promise<{ error: any }>;

  // Utility
  clearCurrentProduct: () => void;
  clearError: () => void;
}

// Create store
export const useProductStore = create<ProductState>()(
  devtools(
    immer((set, get) => ({
      // Initial state
      products: [],
      currentProduct: null,
      isLoadingProducts: false,
      isLoadingProduct: false,
      isSaving: false,
      error: null,

      // Simple setters
      setProducts: (products) =>
        set(
          (state) => {
            state.products = products;
          },
          false,
          "setProducts"
        ),

      setCurrentProduct: (product) =>
        set(
          (state) => {
            state.currentProduct = product;
          },
          false,
          "setCurrentProduct"
        ),

      setLoadingProducts: (isLoading) =>
        set(
          (state) => {
            state.isLoadingProducts = isLoading;
          },
          false,
          "setLoadingProducts"
        ),

      setLoadingProduct: (isLoading) =>
        set(
          (state) => {
            state.isLoadingProduct = isLoading;
          },
          false,
          "setLoadingProduct"
        ),

      setSaving: (isSaving) =>
        set(
          (state) => {
            state.isSaving = isSaving;
          },
          false,
          "setSaving"
        ),

      setError: (error) =>
        set(
          (state) => {
            state.error = error;
          },
          false,
          "setError"
        ),

      // API Actions
      fetchProducts: async () => {
        const { setLoadingProducts, setProducts, setError } = get();

        setLoadingProducts(true);
        setError(null);

        try {
          const { getProducts } = await import("@nam-viet-erp/services");
          const { data, error } = await getProducts();

          if (error) {
            setError(error.message || "Failed to fetch products");
            setProducts([]);
            return { data: null, error };
          }

          setProducts(data || []);
          return { data, error: null };
        } catch (error: any) {
          const errorMsg = error?.message || "Failed to fetch products";
          setError(errorMsg);
          setProducts([]);
          return { data: null, error };
        } finally {
          setLoadingProducts(false);
        }
      },

      fetchProductById: async (productId: number) => {
        const { setLoadingProduct, setCurrentProduct, setError } = get();

        setLoadingProduct(true);
        setError(null);

        try {
          const { getProductById, getInventoryByProductId } = await import("@nam-viet-erp/services");

          // Fetch product data
          const { data: product, error: productError } = await getProductById(productId);

          if (productError) {
            setError(productError.message || "Failed to fetch product");
            setCurrentProduct(null);
            return { data: null, error: productError };
          }

          if (!product) {
            const notFoundError = { message: "Product not found" };
            setError("Product not found");
            setCurrentProduct(null);
            return { data: null, error: notFoundError };
          }

          // Fetch inventory data
          const { data: inventoryData, error: inventoryError } = await getInventoryByProductId(productId);

          if (inventoryError) {
            console.error("Error loading inventory:", inventoryError);
          }

          // Merge inventory data into product
          const productWithInventory = {
            ...product,
            inventory_data: inventoryData || [],
          };

          setCurrentProduct(productWithInventory);
          return { data: productWithInventory, error: null };
        } catch (error: any) {
          const errorMsg = error?.message || "Failed to fetch product";
          setError(errorMsg);
          setCurrentProduct(null);
          return { data: null, error };
        } finally {
          setLoadingProduct(false);
        }
      },

      createProduct: async (productData: any) => {
        const { setSaving, setError } = get();

        setSaving(true);
        setError(null);

        try {
          const { createProduct } = await import("@nam-viet-erp/services");
          const { data, error } = await createProduct(productData);

          if (error) {
            setError(error.message || "Failed to create product");
            return { data: null, error };
          }

          return { data, error: null };
        } catch (error: any) {
          const errorMsg = error?.message || "Failed to create product";
          setError(errorMsg);
          return { data: null, error };
        } finally {
          setSaving(false);
        }
      },

      updateProduct: async (productId: number, productData: any) => {
        const { setSaving, setError } = get();

        setSaving(true);
        setError(null);

        try {
          const { updateProduct } = await import("@nam-viet-erp/services");
          const { data, error } = await updateProduct(productId, productData);

          if (error) {
            setError(error.message || "Failed to update product");
            return { data: null, error };
          }

          return { data, error: null };
        } catch (error: any) {
          const errorMsg = error?.message || "Failed to update product";
          setError(errorMsg);
          return { data: null, error };
        } finally {
          setSaving(false);
        }
      },

      deleteProduct: async (productId: number) => {
        const { setSaving, setError } = get();

        setSaving(true);
        setError(null);

        try {
          const { deleteProduct } = await import("@nam-viet-erp/services");
          const { error } = await deleteProduct(productId);

          if (error) {
            setError(error.message || "Failed to delete product");
            return { error };
          }

          return { error: null };
        } catch (error: any) {
          const errorMsg = error?.message || "Failed to delete product";
          setError(errorMsg);
          return { error };
        } finally {
          setSaving(false);
        }
      },

      // Utility
      clearCurrentProduct: () =>
        set(
          (state) => {
            state.currentProduct = null;
          },
          false,
          "clearCurrentProduct"
        ),

      clearError: () =>
        set(
          (state) => {
            state.error = null;
          },
          false,
          "clearError"
        ),
    })),
    {
      name: "ProductStore",
    }
  )
);

// Selectors
export const useProducts = () => useProductStore((state) => state.products);
export const useCurrentProduct = () => useProductStore((state) => state.currentProduct);
export const useIsLoadingProducts = () => useProductStore((state) => state.isLoadingProducts);
export const useIsLoadingProduct = () => useProductStore((state) => state.isLoadingProduct);
export const useIsSavingProduct = () => useProductStore((state) => state.isSaving);
export const useProductError = () => useProductStore((state) => state.error);
