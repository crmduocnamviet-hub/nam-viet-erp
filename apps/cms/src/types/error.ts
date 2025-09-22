// Error types for try-catch blocks
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