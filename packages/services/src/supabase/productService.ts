import type { PostgrestSingleResponse } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export const extractFromPdf = async (fileContent: string, mimeType: string) => {
  const response = await supabase.functions.invoke<IProduct>(
    "extract-from-pdf",
    {
      body: { fileContent, mimeType },
    },
  );
  return response;
};

export const enrichProductData = async (productName: string) => {
  const response = await supabase.functions.invoke("enrich-product-data", {
    body: { productName },
  });

  return response;
};

export const uploadProductImage = async (filePath: string, file: File) => {
  const response = await supabase.storage
    .from("product-images")
    .upload(filePath, file);

  return response;
};

export const getProductImageUrl = async (filePath: string) => {
  const response = supabase.storage
    .from("product-images")
    .getPublicUrl(filePath);

  return response;
};

export const searchProducts = async ({
  search,
  page = 1,
  pageSize = 10,
  status,
}: {
  search?: string;
  page?: number;
  pageSize?: number;
  status?: string | null;
}) => {
  try {
    let query = supabase
      .from("products_with_inventory")
      .select("*", { count: "exact" });
    if (search) {
      query = query.or(
        `name.ilike.%${search}%,sku.ilike.%${search}%,barcode.ilike.%${search}`,
      );
    }
    if (status) {
      query = query.eq("is_active", status === "active");
    }
    const response = await query
      .order("created_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    return response;
  } catch (error: any) {
    throw error;
  }
};

export const getProductWithInventory = async () => {
  const response = await supabase
    .from("products_with_inventory")
    .select("*")
    .order("name", { ascending: true });
  return response;
};

export const deleteProduct = async (id: any) => {
  const response = await supabase.from("products").delete().eq("id", id);
  return response;
};

export const deleteProductByIds = async (ids: any) => {
  const respoponse = await supabase.from("products").delete().in("id", ids);
  return respoponse;
};

export const updateProductByIds = async (ids: any, record: any) => {
  const response = await supabase.from("products").update(record).in("id", ids);
  return response;
};

export const updateProduct = async (id: any, record: Partial<IProduct>) => {
  const response = await supabase.from("products").update(record).eq("id", id);
  return response;
};

export const createProduct = async (record: Partial<IProduct>) => {
  const response = await supabase
    .from("products")
    .insert(record)
    .select()
    .single();
  return response;
};

export const upsetProduct = async (record: Partial<IProduct>[]) => {
  const response = await supabase
    .from("products")
    .upsert(record, { onConflict: "sku" });
  return response;
};

export const getActiveProduct = async () => {
  const response = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true);

  return response;
};

export const getProductById = async (id: number) => {
  const response: PostgrestSingleResponse<IProduct> = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  return response;
};

export const searchProductInWarehouse = async ({
  search,
  warehouseId,
}: {
  search: string;
  warehouseId: number;
}) => {
  const response = await supabase
    .from("inventory")
    .select("*, products!inner (*)")
    .ilike("products.name", `%${search}%`)
    .eq("products.is_active", true)
    .eq("warehouse_id", warehouseId);
  return response;
};

export const searchProductInWarehouseByBarcode = async ({
  search,
  warehouseId,
}: {
  search: string;
  warehouseId: number;
}) => {
  const response = await supabase
    .from("inventory")
    .select("*, products!inner (*)")
    .eq("products.barcode", search)
    .eq("products.is_active", true)
    .eq("warehouse_id", warehouseId);
  return response;
};

// Get products from B2B warehouses only
export const getB2BWarehouseProducts = async ({
  search,
}: {
  search: string;
}) => {
  const response = await supabase
    .from("inventory")
    .select(
      `
      quantity,
      products!inner (*),
      warehouses!inner (
        id,
        name,
        is_b2b_warehouse
      )
    `,
    )
    .ilike("products.name", `%${search}%`)
    .eq("products.is_active", true)
    .eq("warehouses.is_b2b_warehouse", true)
    .gt("quantity", 0); // Only products with stock
  return response;
};

export const getB2BWarehouseProductByBarCode = async ({
  barcode,
}: {
  barcode: string;
}) => {
  const response = await supabase
    .from("inventory")
    .select(
      `
      quantity,
      products!inner (*),
      warehouses!inner (
        id,
        name,
        is_b2b_warehouse
      )
    `,
    )
    .eq("products.barcode", barcode)
    .eq("products.is_active", true)
    .eq("warehouses.is_b2b_warehouse", true)
    .gt("quantity", 0); // Only products with stock
  return response;
};

export const getProductInWarehouseByBarCode = async ({
  barcode,
  warehouseId,
}: {
  barcode: string;
  warehouseId: number;
}) => {
  const response = await supabase
    .from("inventory")
    .select("*, products(*)")
    .eq("products.barcode", barcode)
    .eq("products.is_active", true)
    .eq("warehouse_id", warehouseId);
  return response;
};

export const getProductInventoryInWarehouse = async (params: {
  productId: number;
  warehouseId: number;
}) => {
  const response: PostgrestSingleResponse<IInventory> = await supabase
    .from("inventory")
    .select("*")
    .eq("product_id", params.productId)
    .eq("warehouse_id", params.warehouseId)
    .single();
  return response;
};
