import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

interface QueriesData<T = any> {
  isLoading: boolean;
  isRefreshing: boolean;
  data: T;
  isError: boolean;
  error: any;
  lastFetch: Date | null;
  fetch?: () => Promise<any>;
}

type FetchStore = {
  fetchData: Record<string, QueriesData>;
  fetch: (key: string, callback: () => Promise<any>) => Promise<void>;
  setData: (key: string, data: any) => void;
  clear: () => void;
};

export const fetchStore = create<FetchStore, any>(
  immer((set, get) => ({
    fetchData: {},
    clear() {
      set((state) => {
        Object.keys(state.fetchData).forEach((key) => {
          state.fetchData[key].data = undefined;
          state.fetchData[key].lastFetch = null;
        });
      });
    },
    async fetch(key, callback) {
      console.log("[QUERY_KEY] ", key);
      const isRefresh = !!get().fetchData[key];
      set((state) => {
        state.fetchData[key] = {
          isLoading: true,
          isRefreshing: isRefresh ? true : false,
          data: null,
          isError: false,
          error: null,
          lastFetch: null,
          fetch: callback,
        };
      });
      try {
        const res = await callback();
        set((state) => {
          state.fetchData[key].isLoading = false;
          state.fetchData[key].data = res;
          state.fetchData[key].isRefreshing = false;
          state.fetchData[key].lastFetch = new Date();
        });
        return res;
      } catch (e) {
        set((state) => {
          state.fetchData[key].isLoading = false;
          state.fetchData[key].isError = true;
          state.fetchData[key].error = e;
          state.fetchData[key].isRefreshing = false;
          state.fetchData[key].lastFetch = null;
        });
        throw e;
      }
    },
    setData(key, data) {
      try {
        const oldData = get().fetchData[key];
        set((state) => {
          state.fetchData[key] = {
            isLoading: oldData?.isLoading || false,
            isError: oldData?.isError || false,
            error: oldData?.error || null,
            isRefreshing: oldData?.isRefreshing || false,
            lastFetch: new Date(),
            data: data,
            fetch: oldData?.fetch,
          };
        });
      } catch (e) {}
    },
  })),
);

const useFetchStore = fetchStore;

export default useFetchStore;
