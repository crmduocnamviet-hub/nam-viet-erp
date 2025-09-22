// IProduct interface is automatically available from global types/index.d.ts
// No need to import or re-export since it's defined in a .d.ts file

// Using global IPromotion interface from types/index.d.ts
// Sale-specific types that extend or use global interfaces

// Cart item types
export interface CartItem extends IProduct {
  quantity: number;
  finalPrice: number;
  originalPrice: number;
  appliedPromotion: IPromotion | null;
}

// Price calculation result
export interface PriceInfo {
  finalPrice: number;
  originalPrice: number;
  appliedPromotion: IPromotion | null;
}

// Product search parameters
export interface SearchProductsParams {
  search: string;
  pageSize: number;
  status: string;
}

// Cart details
export interface CartDetails {
  items: CartItem[];
  itemTotal: number;
  originalTotal: number;
  totalDiscount: number;
}

// Payment types
export type PaymentMethod = 'cash' | 'card' | 'qr';

// Transaction types
export interface TransactionData {
  cart: CartItem[];
  total: number;
  paymentMethod: PaymentMethod;
  warehouseId: number;
  fundId: number;
  createdBy: string;
}


// API response types
export interface ApiResponse<T> {
  data: T | null;
  error: Error | null;
}

// Payment modal types
export interface PaymentValues {
  amount?: number;
  change?: number;
  [key: string]: unknown;
}

// Error types (copied from cms types)
export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}

export interface DatabaseError extends ApiError {
  table?: string;
  constraint?: string;
}

export interface ValidationError extends ApiError {
  field?: string;
  value?: unknown;
}

// Type guard functions
export const isApiError = (error: unknown): error is ApiError => {
  return typeof error === 'object' && error !== null && 'message' in error;
};

export const isDatabaseError = (error: unknown): error is DatabaseError => {
  return isApiError(error) && ('table' in error || 'constraint' in error);
};

export const isValidationError = (error: unknown): error is ValidationError => {
  return isApiError(error) && ('field' in error || 'value' in error);
};

// Helper function to safely get error message
export const getErrorMessage = (error: unknown): string => {
  if (isApiError(error)) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'An unknown error occurred';
};

// Helper function to create error objects
export const createApiError = (message: string, code?: string, details?: unknown): ApiError => ({
  message,
  code,
  details,
});