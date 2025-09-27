import type { PostgrestSingleResponse } from "@supabase/supabase-js";
import { supabase } from "./supabase";

// Get all B2B quotes with optional filtering
export const getB2BQuotes = async (filters?: {
  stage?: string;
  customerName?: string;
  employeeId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}) => {
  let query = supabase
    .from("b2b_quotes")
    .select(`
      *,
      employees!created_by_employee_id(full_name, employee_code),
      quote_items:b2b_quote_items(
        *,
        products!product_id(name, sku, manufacturer, retail_price)
      )
    `);

  if (filters?.stage) {
    query = query.eq("quote_stage", filters.stage);
  }

  if (filters?.customerName) {
    query = query.ilike("customer_name", `%${filters.customerName}%`);
  }

  if (filters?.employeeId) {
    query = query.eq("created_by_employee_id", filters.employeeId);
  }

  if (filters?.startDate) {
    query = query.gte("quote_date", filters.startDate);
  }

  if (filters?.endDate) {
    query = query.lte("quote_date", filters.endDate);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  if (filters?.offset) {
    query = query.range(filters.offset, (filters.offset + (filters.limit || 10)) - 1);
  }

  const response = await query.order("quote_date", { ascending: false });
  return response;
};

// Get B2B quote by ID
export const getB2BQuoteById = async (quoteId: string): Promise<PostgrestSingleResponse<IB2BQuote | null>> => {
  const response = await supabase
    .from("b2b_quotes")
    .select(`
      *,
      employees!created_by_employee_id(full_name, employee_code),
      quote_items:b2b_quote_items(
        *,
        products!product_id(name, sku, manufacturer, retail_price)
      )
    `)
    .eq("quote_id", quoteId)
    .single();

  return response;
};

// Create new B2B quote
export const createB2BQuote = async (
  quote: Omit<IB2BQuote, "quote_id" | "quote_number" | "created_at" | "updated_at" | "quote_items" | "employee">
): Promise<PostgrestSingleResponse<IB2BQuote | null>> => {
  // Generate quote number
  const quoteNumber = await generateQuoteNumber();

  const quoteData = {
    ...quote,
    quote_number: quoteNumber,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const response = await supabase
    .from("b2b_quotes")
    .insert(quoteData)
    .select(`
      *,
      employees!created_by_employee_id(full_name, employee_code)
    `)
    .single();

  return response;
};

// Update B2B quote
export const updateB2BQuote = async (
  quoteId: string,
  updates: Partial<Omit<IB2BQuote, "quote_id" | "quote_number" | "created_at" | "quote_items" | "employee">>
): Promise<PostgrestSingleResponse<IB2BQuote | null>> => {
  const updateData = {
    ...updates,
    updated_at: new Date().toISOString(),
  };

  const response = await supabase
    .from("b2b_quotes")
    .update(updateData)
    .eq("quote_id", quoteId)
    .select(`
      *,
      employees!created_by_employee_id(full_name, employee_code)
    `)
    .single();

  return response;
};

// Update quote stage
export const updateQuoteStage = async (
  quoteId: string,
  stage: IB2BQuote['quote_stage']
): Promise<PostgrestSingleResponse<IB2BQuote | null>> => {
  return updateB2BQuote(quoteId, { quote_stage: stage });
};

// Delete B2B quote
export const deleteB2BQuote = async (quoteId: string): Promise<PostgrestSingleResponse<null>> => {
  // First delete quote items
  await supabase
    .from("b2b_quote_items")
    .delete()
    .eq("quote_id", quoteId);

  // Then delete the quote
  const response = await supabase
    .from("b2b_quotes")
    .delete()
    .eq("quote_id", quoteId);

  return response;
};

// Generate unique quote number
const generateQuoteNumber = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');

  // Get the latest quote number for this year/month
  const { data: latestQuote } = await supabase
    .from("b2b_quotes")
    .select("quote_number")
    .like("quote_number", `BG-${year}-${month}%`)
    .order("quote_number", { ascending: false })
    .limit(1)
    .single();

  let nextNumber = 1;
  if (latestQuote?.quote_number) {
    const parts = latestQuote.quote_number.split('-');
    const lastNumber = parseInt(parts[3] || '0');
    nextNumber = lastNumber + 1;
  }

  return `BG-${year}-${month}-${String(nextNumber).padStart(3, '0')}`;
};

// Add item to quote
export const addQuoteItem = async (
  item: Omit<IB2BQuoteItem, "item_id" | "created_at">
): Promise<PostgrestSingleResponse<IB2BQuoteItem | null>> => {
  const itemData = {
    ...item,
    created_at: new Date().toISOString(),
  };

  const response = await supabase
    .from("b2b_quote_items")
    .insert(itemData)
    .select(`
      *,
      products!product_id(name, sku, manufacturer, retail_price)
    `)
    .single();

  return response;
};

// Update quote item
export const updateQuoteItem = async (
  itemId: string,
  updates: Partial<Omit<IB2BQuoteItem, "item_id" | "created_at" | "product">>
): Promise<PostgrestSingleResponse<IB2BQuoteItem | null>> => {
  const response = await supabase
    .from("b2b_quote_items")
    .update(updates)
    .eq("item_id", itemId)
    .select(`
      *,
      products!product_id(name, sku, manufacturer, retail_price)
    `)
    .single();

  return response;
};

// Remove item from quote
export const removeQuoteItem = async (itemId: string): Promise<PostgrestSingleResponse<null>> => {
  const response = await supabase
    .from("b2b_quote_items")
    .delete()
    .eq("item_id", itemId);

  return response;
};

// Get quote items by quote ID
export const getQuoteItems = async (quoteId: string) => {
  const response = await supabase
    .from("b2b_quote_items")
    .select(`
      *,
      products!product_id(name, sku, manufacturer, retail_price)
    `)
    .eq("quote_id", quoteId)
    .order("created_at", { ascending: true });

  return response;
};

// Get B2B customers
export const getB2BCustomers = async (filters?: {
  search?: string;
  customerType?: string;
  isActive?: boolean;
  limit?: number;
}) => {
  let query = supabase.from("b2b_customers").select("*");

  if (filters?.search) {
    query = query.or(`customer_name.ilike.%${filters.search}%,customer_code.ilike.%${filters.search}%,phone_number.ilike.%${filters.search}%`);
  }

  if (filters?.customerType) {
    query = query.eq("customer_type", filters.customerType);
  }

  if (filters?.isActive !== undefined) {
    query = query.eq("is_active", filters.isActive);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const response = await query.order("customer_name", { ascending: true });
  return response;
};

// Create B2B customer
export const createB2BCustomer = async (
  customer: Omit<IB2BCustomer, "customer_id" | "created_at" | "updated_at">
): Promise<PostgrestSingleResponse<IB2BCustomer | null>> => {
  const customerData = {
    ...customer,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const response = await supabase
    .from("b2b_customers")
    .insert(customerData)
    .select()
    .single();

  return response;
};

// Get quote statistics
export const getQuoteStatistics = async (filters?: {
  employeeId?: string;
  startDate?: string;
  endDate?: string;
}) => {
  let query = supabase
    .from("b2b_quotes")
    .select("quote_stage, total_value, quote_date");

  if (filters?.employeeId) {
    query = query.eq("created_by_employee_id", filters.employeeId);
  }

  if (filters?.startDate) {
    query = query.gte("quote_date", filters.startDate);
  }

  if (filters?.endDate) {
    query = query.lte("quote_date", filters.endDate);
  }

  const { data: quotes, error } = await query;

  if (error) {
    return { data: null, error };
  }

  // Calculate statistics
  const stats = {
    totalQuotes: quotes?.length || 0,
    totalValue: quotes?.reduce((sum, quote) => sum + (quote.total_value || 0), 0) || 0,
    byStage: quotes?.reduce((acc: Record<string, number>, quote) => {
      acc[quote.quote_stage] = (acc[quote.quote_stage] || 0) + 1;
      return acc;
    }, {}) || {},
    valueByStage: quotes?.reduce((acc: Record<string, number>, quote) => {
      acc[quote.quote_stage] = (acc[quote.quote_stage] || 0) + (quote.total_value || 0);
      return acc;
    }, {}) || {},
  };

  return { data: stats, error: null };
};