import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

// State interface
export interface ComboState {
  // Combos data
  combos: IComboWithItems[];
  isLoadingCombos: boolean;
  error: string | null;

  // Actions
  setCombos: (combos: IComboWithItems[]) => void;
  setLoadingCombos: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  fetchCombos: () => Promise<void>;
  refreshCombos: () => Promise<void>;
}

// Create store
export const useComboStore = create<ComboState>()(
  devtools(
    immer((set, get) => ({
      // Initial state
      combos: [],
      isLoadingCombos: false,
      error: null,

      // Actions
      setCombos: (combos) =>
        set(
          (state) => {
            state.combos = combos;
          },
          false,
          "setCombos"
        ),

      setLoadingCombos: (isLoading) =>
        set(
          (state) => {
            state.isLoadingCombos = isLoading;
          },
          false,
          "setLoadingCombos"
        ),

      setError: (error) =>
        set(
          (state) => {
            state.error = error;
          },
          false,
          "setError"
        ),

      fetchCombos: async () => {
        const { setLoadingCombos, setCombos, setError } = get();

        setLoadingCombos(true);
        setError(null);

        try {
          // Import dynamically to avoid circular dependencies
          const { getActiveCombos } = await import("@nam-viet-erp/services");
          const { data: combos, error } = await getActiveCombos();

          if (error) {
            console.error("Error fetching combos:", error);
            setError(error.message || "Failed to fetch combos");
            setCombos([]);
          } else {
            setCombos(combos || []);
          }
        } catch (error: any) {
          console.error("Error fetching combos:", error);
          setError(error?.message || "Failed to fetch combos");
          setCombos([]);
        } finally {
          setLoadingCombos(false);
        }
      },

      refreshCombos: async () => {
        const { fetchCombos } = get();
        await fetchCombos();
      },
    })),
    {
      name: "ComboStore",
    }
  )
);

// Selectors
export const useCombos = () => useComboStore((state) => state.combos);
export const useIsLoadingCombos = () =>
  useComboStore((state) => state.isLoadingCombos);
export const useComboError = () => useComboStore((state) => state.error);
