import { supabase } from "./supabase";

// Import types from global declaration
type ISupplier = {
  id: number;
  name: string;
  tax_code?: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  payment_terms?: string;
  is_active: boolean;
  total_orders?: number;
  created_at?: string;
  updated_at?: string;
};

type IProductSupplierMapping = {
  id: number;
  product_id: number;
  supplier_id: number;
  is_primary: boolean;
  supplier_product_code?: string;
  unit_price?: number;
  lead_time_days?: number;
  created_at?: string;
  updated_at?: string;
};

/**
 * Get all suppliers
 */
export const getSuppliers = async (filters?: {
  status?: "all" | "active" | "inactive";
  searchText?: string;
}) => {
  let query = supabase
    .from("suppliers")
    .select("*")
    .order("name", { ascending: true });

  if (filters?.status === "active") {
    query = query.eq("is_active", true);
  } else if (filters?.status === "inactive") {
    query = query.eq("is_active", false);
  }

  if (filters?.searchText) {
    const search = filters.searchText;
    query = query.or(
      `name.ilike.%${search}%,tax_code.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`,
    );
  }

  return await query;
};

/**
 * Get supplier by ID
 */
export const getSupplierById = async (id: number) => {
  return await supabase.from("suppliers").select("*").eq("id", id).single();
};

/**
 * Create a new supplier
 */
export const createSupplier = async (
  supplier: Omit<ISupplier, "id" | "created_at" | "updated_at">,
) => {
  return await supabase.from("suppliers").insert(supplier).select().single();
};

/**
 * Update supplier
 */
export const updateSupplier = async (
  id: number,
  updates: Partial<ISupplier>,
) => {
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
    .select(
      `
      *,
      supplier:suppliers(*)
    `,
    )
    .eq("product_id", productId);
};

/**
 * Create product-supplier mapping
 */
export const createProductSupplierMapping = async (
  mapping: Omit<IProductSupplierMapping, "id" | "created_at" | "updated_at">,
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
  updates: Partial<IProductSupplierMapping>,
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
  return await supabase.from("product_supplier_mapping").delete().eq("id", id);
};

/**
 * Get primary supplier for a product
 */
export const getPrimarySupplierForProduct = async (productId: number) => {
  return await supabase
    .from("product_supplier_mapping")
    .select(
      `
      *,
      supplier:suppliers(*)
    `,
    )
    .eq("product_id", productId)
    .eq("is_primary", true)
    .single();
};
