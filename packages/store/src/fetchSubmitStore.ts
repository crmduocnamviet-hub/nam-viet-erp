import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

interface QueriesData<TData = any, TResponse = any> {
  isLoading: boolean;
  data: TResponse | null;
  isError: boolean;
  error: any;
  lastFetch: Date | null;
  onSuccess?: (data: TResponse) => void;
  onError?: (e: any) => void;
  onSubmit?: (data?: TData) => Promise<TResponse>;
}

type FetchStore = {
  fetchData: Record<string, QueriesData>;
  register: <TParams = any, TResponse = any>(params: {
    key: string;
    onSuccess?: (data?: TResponse) => void;
    onError?: (e: any) => void;
    onSubmit?: (data?: TParams) => Promise<TResponse>;
  }) => void;
  sendRequest: (key: string, data?: any) => Promise<any>;
  // fetch: (key: string, callback: () => Promise<any>) => Promise<void>;
  // setData: (key: string, data: any) => void;
  // clear: () => void;
};

export const fetchSubmitStore = create<FetchStore, any>(
  immer((set, get) => ({
    fetchData: {},
    register: ({ key, onError, onSubmit, onSuccess }) => {
      set((state) => {
        state.fetchData[key] = {
          isLoading: false,
          data: null,
          isError: false,
          error: null,
          lastFetch: null,
          onError,
          onSubmit,
          onSuccess,
        };
      });
    },
    async sendRequest(key, data) {
      const { onSubmit, onError, onSuccess } = get().fetchData[key];
      if (!onSubmit) return;
      console.log("[QUERY_SUBMIT_KEY] ", key);
      set((state) => {
        state.fetchData[key].isLoading = true;
      });
      try {
        const res = await onSubmit(data);
        set((state) => {
          state.fetchData[key].data = res;
          state.fetchData[key].isError = false;
          state.fetchData[key].error = null;
        });
        onSuccess?.(res);
      } catch (e) {
        set((state) => {
          state.fetchData[key].isError = true;
          state.fetchData[key].error = e;
        });
        onError?.(e);
      }
      set((state) => {
        state.fetchData[key].isLoading = false;
        state.fetchData[key].lastFetch = new Date();
      });
    },
  })),
);

const useFetchSubmitStore = fetchSubmitStore;

export default useFetchSubmitStore;
