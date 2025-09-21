import { supabase } from "./supabase";

export const createInternalTransfer = async (values: any) => {
  const { error } = await supabase.rpc("create_internal_transfer", {
    from_fund_id: values.from_fund_id,
    to_fund_id: values.to_fund_id,
    transfer_amount: values.amount,
    transfer_description: values.description || "Chuyển tiền nội bộ",
    created_by_user: "Thủ quỹ",
  });

  if (error) throw error;
};

export const getFunds = async () => {
  const fundsPromise = supabase
    .from("funds")
    .select("*, banks(*)")
    .order("created_at");
  const banksPromise = supabase.from("banks").select("*");

  const [fundsRes, banksRes] = await Promise.all([fundsPromise, banksPromise]);

  if (fundsRes.error) throw fundsRes.error;
  if (banksRes.error) throw banksRes.error;

  const bankList =
    banksRes.data?.map((b) => ({
      value: b.short_name,
      label: `${b.short_name} - ${b.name}`,
      bin: b.bin,
    })) || [];

  return { funds: fundsRes.data || [], banks: bankList };
};

export const deleteFund = async (id: number) => {
  const { error } = await supabase.from("funds").delete().eq("id", id);
  if (error) throw error;
};

export const updateFund = async (id: number, record: any) => {
  const { error } = await supabase.from("funds").update(record).eq("id", id);
  if (error) throw error;
};

export const createFund = async (record: any) => {
  const { error } = await supabase.from("funds").insert([record]);
  if (error) throw error;
};