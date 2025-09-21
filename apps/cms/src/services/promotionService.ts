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
  const manufacturers = uniqueManufacturers.map((m) => ({ value: m, label: m }));

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

export const createPromotion = async (record: any) => {
  const { data, error } = await supabase
    .from("promotions")
    .insert(record)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updatePromotion = async (id: string, record: any) => {
  const { error } = await supabase.from("promotions").update(record).eq("id", id);
  if (error) throw error;
};

export const createVoucher = async (record: any) => {
  const { error } = await supabase.from("vouchers").insert([record]);
  if (error) throw error;
};
