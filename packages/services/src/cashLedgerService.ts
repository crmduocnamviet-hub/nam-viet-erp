import { supabase } from "./supabase";


export const getFundsAndTransactions = async () => {
  const fundsPromise = supabase.from("funds").select("*, banks(*)");
  const transPromise = supabase.from("transactions").select("*");
  const internalTransfersPromise = supabase
    .from("internal_fund_transfers")
    .select("*");

  const [fundsRes, transRes, internalTransfersRes] = await Promise.all([
    fundsPromise,
    transPromise,
    internalTransfersPromise,
  ]);

  if (fundsRes.error) throw fundsRes.error;
  if (transRes.error) throw transRes.error;
  if (internalTransfersRes.error) throw internalTransfersRes.error;

  return {
    funds: fundsRes.data || [],
    transactions: transRes.data || [],
    internalTransfers: internalTransfersRes.data || [],
  };
};
