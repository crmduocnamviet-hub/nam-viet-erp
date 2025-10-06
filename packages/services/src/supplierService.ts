import { supabase } from "./supabase";

/**
 * Get all suppliers
 */
export const getSuppliers = async (activeOnly: boolean = false) => {
  let query = supabase.from("suppliers").select("*").order("name", { ascending: true });

  if (activeOnly) {
    query = query.eq("is_active", true);
  }

  return await query;
};

/**
 * Get supplier by ID
 */
export const getSupplierById = async (id: number) => {
  return await supabase
    .from("suppliers")
    .select("*")
    .eq("id", id)
    .single();
};

/**
 * Create a new supplier
 */
export const createSupplier = async (supplier: Omit<ISupplier, "id" | "created_at" | "updated_at">) => {
  return await supabase
    .from("suppliers")
    .insert(supplier)
    .select()
    .single();
};

/**
 * Update supplier
 */
export const updateSupplier = async (id: number, updates: Partial<ISupplier>) => {
  return await supabase
    .from("suppliers")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
};

/**
 * Delete supplier (soft delete by setting is_active = false)
 */
export const deactivateSupplier = async (id: number) => {
  return await supabase
    .from("suppliers")
    .update({ is_active: false })
    .eq("id", id)
    .select()
    .single();
};

/**
 * Get product-supplier mappings for a product
 */
export const getProductSupplierMappings = async (productId: number) => {
  return await supabase
    .from("product_supplier_mapping")
    .select(`
      *,
      supplier:suppliers(*)
    `)
    .eq("product_id", productId);
};

/**
 * Create product-supplier mapping
 */
export const createProductSupplierMapping = async (
  mapping: Omit<IProductSupplierMapping, "id" | "created_at" | "updated_at">
) => {
  return await supabase
    .from("product_supplier_mapping")
    .insert(mapping)
    .select()
    .single();
};

/**
 * Update product-supplier mapping
 */
export const updateProductSupplierMapping = async (
  id: number,
  updates: Partial<IProductSupplierMapping>
) => {
  return await supabase
    .from("product_supplier_mapping")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
};

/**
 * Delete product-supplier mapping
 */
export const deleteProductSupplierMapping = async (id: number) => {
  return await supabase
    .from("product_supplier_mapping")
    .delete()
    .eq("id", id);
};

/**
 * Get primary supplier for a product
 */
export const getPrimarySupplierForProduct = async (productId: number) => {
  return await supabase
    .from("product_supplier_mapping")
    .select(`
      *,
      supplier:suppliers(*)
    `)
    .eq("product_id", productId)
    .eq("is_primary", true)
    .single();
};
