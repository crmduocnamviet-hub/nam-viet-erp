import { supabase } from "./supabase";

export const getInitialData = async () => {
  const fundsPromise = supabase.from("funds").select("*, banks(*)");
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

export const getTransactions = async (page: number, pageSize: number) => {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from("transactions")
    .select("*, funds(name)", { count: "exact" })
    .range(from, to)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return { data: data || [], count: count || 0, error };
};

export const searchTransactions = async (
  searchTerm: string,
  page: number,
  pageSize: number
) => {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .rpc("search_transactions", { search_term: searchTerm }, { count: "exact" })
    .select("*, funds(name)")
    .range(from, to)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return { data: data || [], count: count || 0, error };
};

export const createTransaction = async (record: Partial<ITransaction>) => {
  const response = await supabase.from("transactions").insert([record]);
  return response;
};

export const updateTransaction = async (
  id: number,
  updates: Partial<ITransaction>
) => {
  const response = await supabase
    .from("transactions")
    .update(updates)
    .eq("id", id);
  return response;
};

export const deleteTransaction = async (id: number) => {
  const response = await supabase.from("transactions").delete().eq("id", id);
  return response;
};

const sanitizeFilename = (filename: string) => {
  return filename
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9.\-_]/g, "_")
    .replace(/\s+/g, "_");
};

export const uploadAttachment = async (file: File) => {
  const cleanFileName = sanitizeFilename(file.name);
  const fileName = `${Date.now()}_${cleanFileName}`;

  const { error } = await uploadTransactionAttachments(fileName, file);

  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from("transaction-attachments").getPublicUrl(fileName);

  return publicUrl;
};

export const uploadTransactionAttachments = async (
  fileName: string,
  file: File
) => {
  const response = await supabase.storage
    .from("transaction-attachments")
    .upload(fileName, file, { contentType: file.type });

  return response;
};
