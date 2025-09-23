import type { PostgrestSingleResponse } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export const getPromotionFilterOptions = async () => {
  const [categoryRes, manuRes] = await Promise.all([
    supabase.from("products").select("category"),
    supabase.from("products").select("manufacturer"),
  ]);

  if (categoryRes.error) throw categoryRes.error;
  if (manuRes.error) throw manuRes.error;

  const uniqueCategories = [
    ...new Set(categoryRes.data.map((item) => item.category).filter(Boolean)),
  ];
  const categories = uniqueCategories.map((c) => ({ value: c, label: c }));

  const uniqueManufacturers = [
    ...new Set(manuRes.data.map((item) => item.manufacturer).filter(Boolean)),
  ];
  const manufacturers = uniqueManufacturers.map((m) => ({
    value: m,
    label: m,
  }));

  return { categories, manufacturers };
};

export const getVouchers = async (promoId: string) => {
  const { data, error } = await supabase
    .from("vouchers")
    .select("*")
    .eq("promotion_id", promoId);

  if (error) throw error;
  return data || [];
};

export const getPromotionDetail = async (id: string) => {
  const { data, error } = await supabase
    .from("promotions")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
};

export const getPromotions = async () => {
  const response = await supabase
    .from("promotions")
    .select("*")
    .order("created_at", { ascending: false });

  return response;
};

export const createPromotion = async (record: Record<string, any>) => {
  const response = await supabase
    .from("promotions")
    .insert(record)
    .select()
    .single();

  return response;
};

export const updatePromotion = async (id: string, record: Record<string, any>) => {
  const response = await supabase
    .from("promotions")
    .update(record)
    .eq("id", id);
  return response;
};

export const createVoucher = async (record: Omit<IVoucher, "id">) => {
  const response = await supabase.from("vouchers").insert([record]);
  return response;
};

export const getVouchersWithPromotion = async () => {
  const response = await supabase
    .from("vouchers")
    .select("*, promotions(name)")
    .order("created_at", { ascending: false });

  return response;
};

export const getActivePromotions = async () => {
  const response = await supabase
    .from("promotions")
    .select("id, name")
    .eq("is_active", true);

  return response;
};

export const deleteVoucher = async (
  id: number
): Promise<PostgrestSingleResponse<null>> => {
  const response = await supabase.from("vouchers").delete().eq("id", id);
  return response;
};

export const updateVoucher = async (
  id: number,
  record: Partial<IVoucher>
): Promise<PostgrestSingleResponse<IVoucher | null>> => {
  const response: PostgrestSingleResponse<IVoucher | null> = await supabase
    .from("vouchers")
    .update(record)
    .eq("id", id);

  return response;
};

export const deletePromotion = async (id: number) => {
  const response = await supabase.from("promotions").delete().eq("id", id);
  return response;
};
