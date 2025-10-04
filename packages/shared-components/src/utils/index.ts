// Helper function to safely get error message
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    return (error as any).message;
  }

  return "An unknown error occurred";
};

// B2B Order PDF Export utilities
export * from './b2bOrder';
