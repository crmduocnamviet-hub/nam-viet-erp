/**
 * Hook to provide B2B order API functions
 * Returns the API functions that should be passed to createOrder action
 */
export const useInitializeB2BOrder = (
  createB2BQuote: (data: any) => Promise<any>,
  addQuoteItem: (data: any) => Promise<any>
) => {
  return {
    createB2BQuote,
    addQuoteItem,
  };
};
