import { supabase } from "./supabase";

export const getVouchersWithPromotion = async (): Promise<
  (IVoucher & { promotions: { name: string } })[]
> => {
  const { data, error } = await supabase
    .from("vouchers")
    .select("*, promotions(name)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
};

export const getActivePromotions = async (): Promise<IPromotion[]> => {
  const { data, error } = await supabase
    .from("promotions")
    .select("id, name")
    .eq("is_active", true);

  if (error) throw error;
  return data.map((p) => ({ value: p.id, label: p.name } as any)) || [];
};

export const deleteVoucher = async (id: number): Promise<void> => {
  const { error } = await supabase.from("vouchers").delete().eq("id", id);
  if (error) throw error;
};

export const updateVoucher = async (
  id: number,
  record: Partial<IVoucher>
): Promise<void> => {
  const { error } = await supabase.from("vouchers").update(record).eq("id", id);
  if (error) throw error;
};

export const createVoucher = async (
  record: Partial<IVoucher>
): Promise<void> => {
  const { error } = await supabase.from("vouchers").insert([record]);
  if (error) throw error;
};
