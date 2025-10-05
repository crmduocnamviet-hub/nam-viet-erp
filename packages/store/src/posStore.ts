import { processSaleTransaction } from "@nam-viet-erp/services/src/posService";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

// State interface
export interface PosState {
  // Multi-tab state
  tabs: PosTab[];
  activeTabId: string;

  // Tab management actions
  createTab: (title?: string) => string;
  closeTab: (tabId: string) => void;
  switchTab: (tabId: string) => void;
  updateTabTitle: (tabId: string, title: string) => void;

  // Cart actions (operate on active tab)
  addCartItem: (item: CartItem) => void;
  updateCartItem: (key: string, updates: Partial<CartItem>) => void;
  removeCartItem: (key: string) => void;
  clearCart: () => void;

  // Cart actions by index
  addCartItemByIndex: (index: number, item: CartItem) => void;
  updateCartItemByIndex: (
    index: number,
    key: string,
    updates: Partial<CartItem>
  ) => void;
  removeCartItemByIndex: (index: number, key: string) => void;
  clearCartByIndex: (index: number) => void;

  // Customer actions (operate on active tab)
  setSelectedCustomer: (customer: any | null) => void;
  setSelectedWarehouse: (warehouse: any | null) => void;
  setSelectedLocation: (location: string) => void;
  setPaymentMethod: (method: "cash" | "card") => void;

  // Customer actions by index
  setSelectedCustomerByIndex: (index: number, customer: any | null) => void;
  setSelectedWarehouseByIndex: (index: number, warehouse: any | null) => void;
  setSelectedLocationByIndex: (index: number, location: string) => void;
  setPaymentMethodByIndex: (index: number, method: "cash" | "card") => void;

  // Processing state
  setProcessingPayment: (isProcessing: boolean) => void;
  setError: (error: string | null) => void;

  // Async payment processing with tab cleanup
  processPayment: (
    paymentData: any,
    inventory?: IInventoryWithProduct[]
  ) => Promise<unknown>;

  // Reset (operate on active tab)
  resetTab: () => void;

  // Reset entire store
  resetStore: () => void;
}

// Create store
export const usePosStore = create<PosState>()(
  devtools(
    immer((set, get) => {
      // Helper to create a new empty tab
      const createEmptyTab = (id: string, title: string): PosTab => ({
        id,
        title,
        cart: [],
        selectedCustomer: null,
        selectedWarehouse: null,
        selectedLocation: "dh1",
        paymentMethod: "cash",
        isProcessingPayment: false,
        error: null,
      });

      // Create initial tab
      const initialTabId = `tab-${Date.now()}`;
      const initialTab = createEmptyTab(initialTabId, "Đơn hàng 1");

      const store: PosState = {
        // Initial state with one tab
        tabs: [initialTab],
        activeTabId: initialTabId,

        // Tab management actions
        createTab: (title) => {
          const newTabId = `tab-${Date.now()}`;
          const tabCount = get().tabs.length + 1;
          const newTitle = title || `Đơn hàng ${tabCount}`;

          set(
            (state) => {
              state.tabs.push(createEmptyTab(newTabId, newTitle));
              state.activeTabId = newTabId;
            },
            false,
            "createTab"
          );

          return newTabId;
        },

        closeTab: (tabId) =>
          set(
            (state) => {
              const tabIndex = state.tabs.findIndex((t) => t.id === tabId);
              if (tabIndex === -1) return;

              // Don't allow closing the last tab
              if (state.tabs.length === 1) {
                // Just reset the tab instead
                state.tabs[0] = createEmptyTab(state.tabs[0].id, "Đơn hàng 1");
                return;
              }

              // Remove the tab
              state.tabs.splice(tabIndex, 1);

              // Switch to another tab if closing active tab
              if (state.activeTabId === tabId) {
                const newActiveIndex = Math.min(
                  tabIndex,
                  state.tabs.length - 1
                );
                state.activeTabId = state.tabs[newActiveIndex].id;
              }
            },
            false,
            "closeTab"
          ),

        switchTab: (tabId) =>
          set(
            (state) => {
              if (state.tabs.some((t) => t.id === tabId)) {
                state.activeTabId = tabId;
              }
            },
            false,
            "switchTab"
          ),

        updateTabTitle: (tabId, title) =>
          set(
            (state) => {
              const tab = state.tabs.find((t) => t.id === tabId);
              if (tab) {
                tab.title = title;
              }
            },
            false,
            "updateTabTitle"
          ),

        // Cart actions (operate on active tab)
        addCartItem: (item) =>
          set(
            (state) => {
              const tab = state.tabs.find((t) => t.id === state.activeTabId);
              if (!tab) return;

              const existingIndex = tab.cart.findIndex((i) => i.id === item.id);

              if (existingIndex >= 0) {
                // Increase quantity if product already exists
                tab.cart[existingIndex].quantity += item.quantity;
                tab.cart[existingIndex].total =
                  tab.cart[existingIndex].quantity *
                  tab.cart[existingIndex].price;
              } else {
                // Add new item
                tab.cart.push(item);
              }
            },
            false,
            "addCartItem"
          ),

        updateCartItem: (key, updates) =>
          set(
            (state) => {
              const tab = state.tabs.find((t) => t.id === state.activeTabId);
              if (!tab) return;

              const item = tab.cart.find((i) => i.key === key);
              if (item) {
                Object.assign(item, updates);
                if (
                  updates.quantity !== undefined ||
                  updates.price !== undefined
                ) {
                  item.total = item.quantity * item.price;
                }
              }
            },
            false,
            "updateCartItem"
          ),

        removeCartItem: (key) =>
          set(
            (state) => {
              const tab = state.tabs.find((t) => t.id === state.activeTabId);
              if (!tab) return;

              tab.cart = tab.cart.filter((i) => i.key !== key);
            },
            false,
            "removeCartItem"
          ),

        clearCart: () =>
          set(
            (state) => {
              const tab = state.tabs.find((t) => t.id === state.activeTabId);
              if (!tab) return;

              tab.cart = [];
            },
            false,
            "clearCart"
          ),

        // Customer actions (operate on active tab)
        setSelectedCustomer: (customer) =>
          set(
            (state) => {
              const tab = state.tabs.find((t) => t.id === state.activeTabId);
              if (!tab) return;

              tab.selectedCustomer = customer;
            },
            false,
            "setSelectedCustomer"
          ),

        setSelectedWarehouse: (warehouse) =>
          set(
            (state) => {
              const tab = state.tabs.find((t) => t.id === state.activeTabId);
              if (!tab) return;

              tab.selectedWarehouse = warehouse;
            },
            false,
            "setSelectedWarehouse"
          ),

        setSelectedLocation: (location) =>
          set(
            (state) => {
              const tab = state.tabs.find((t) => t.id === state.activeTabId);
              if (!tab) return;

              tab.selectedLocation = location;
            },
            false,
            "setSelectedLocation"
          ),

        setPaymentMethod: (method) =>
          set(
            (state) => {
              const tab = state.tabs.find((t) => t.id === state.activeTabId);
              if (!tab) return;

              tab.paymentMethod = method;
            },
            false,
            "setPaymentMethod"
          ),

        // Cart actions by index
        addCartItemByIndex: (index, item) =>
          set(
            (state) => {
              const tab = state.tabs[index];
              if (!tab) return;

              const existingIndex = tab.cart.findIndex((i) => i.id === item.id);

              if (existingIndex >= 0) {
                // Increase quantity if product already exists
                tab.cart[existingIndex].quantity += item.quantity;
                tab.cart[existingIndex].total =
                  tab.cart[existingIndex].quantity *
                  tab.cart[existingIndex].price;
              } else {
                // Add new item
                tab.cart.push(item);
              }
            },
            false,
            "addCartItemByIndex"
          ),

        updateCartItemByIndex: (index, key, updates) =>
          set(
            (state) => {
              const tab = state.tabs[index];
              if (!tab) return;

              const item = tab.cart.find((i) => i.key === key);
              if (item) {
                Object.assign(item, updates);
                if (
                  updates.quantity !== undefined ||
                  updates.price !== undefined
                ) {
                  item.total = item.quantity * item.price;
                }
              }
            },
            false,
            "updateCartItemByIndex"
          ),

        removeCartItemByIndex: (index, key) =>
          set(
            (state) => {
              const tab = state.tabs[index];
              if (!tab) return;

              tab.cart = tab.cart.filter((i) => i.key !== key);
            },
            false,
            "removeCartItemByIndex"
          ),

        clearCartByIndex: (index) =>
          set(
            (state) => {
              const tab = state.tabs[index];
              if (!tab) return;

              tab.cart = [];
            },
            false,
            "clearCartByIndex"
          ),

        // Customer actions by index
        setSelectedCustomerByIndex: (index, customer) =>
          set(
            (state) => {
              const tab = state.tabs[index];
              if (!tab) return;

              tab.selectedCustomer = customer;
            },
            false,
            "setSelectedCustomerByIndex"
          ),

        setSelectedWarehouseByIndex: (index, warehouse) =>
          set(
            (state) => {
              const tab = state.tabs[index];
              if (!tab) return;

              tab.selectedWarehouse = warehouse;
            },
            false,
            "setSelectedWarehouseByIndex"
          ),

        setSelectedLocationByIndex: (index, location) =>
          set(
            (state) => {
              const tab = state.tabs[index];
              if (!tab) return;

              tab.selectedLocation = location;
            },
            false,
            "setSelectedLocationByIndex"
          ),

        setPaymentMethodByIndex: (index, method) =>
          set(
            (state) => {
              const tab = state.tabs[index];
              if (!tab) return;

              tab.paymentMethod = method;
            },
            false,
            "setPaymentMethodByIndex"
          ),

        // Processing state
        setProcessingPayment: (isProcessing) =>
          set(
            (state) => {
              const tab = state.tabs.find((t) => t.id === state.activeTabId);
              if (!tab) return;

              tab.isProcessingPayment = isProcessing;
            },
            false,
            "setProcessingPayment"
          ),

        setError: (error) =>
          set(
            (state) => {
              const tab = state.tabs.find((t) => t.id === state.activeTabId);
              if (!tab) return;

              tab.error = error;
            },
            false,
            "setError"
          ),

        // Process payment with automatic tab cleanup
        processPayment: async (paymentData, inventory = []) => {
          const state = get();

          // Get target tab by index if provided, otherwise use active tab
          const targetTabIndex =
            paymentData.tabIndex !== undefined
              ? paymentData.tabIndex
              : state.tabs.findIndex((t) => t.id === state.activeTabId);

          const tab = state.tabs[targetTabIndex];

          if (!tab) {
            throw new Error("No tab found for payment");
          }

          const targetTabId = tab.id;

          try {
            // Set processing state on target tab
            set((state) => {
              const tab = state.tabs[targetTabIndex];
              if (tab) {
                tab.isProcessingPayment = true;
                tab.error = null;
              }
            });

            // Call payment processing API
            const result = await processSaleTransaction(paymentData, inventory);

            // Update inventory store after successful payment
            const { calculateProductGlobalQuantities } = await import(
              "@nam-viet-erp/services"
            );
            const { useInventoryStore } = await import("./inventoryStore");

            const cart = paymentData.cart || [];
            const quantities = calculateProductGlobalQuantities(cart);

            // Create updates array with negative quantities (deductions)
            const inventoryUpdates = Object.entries(quantities).map(
              ([productId, { quantity }]) => ({
                productId: Number(productId),
                quantityChange: -quantity, // Negative to deduct
              })
            );

            useInventoryStore.getState().updateInventoryQuantities(inventoryUpdates);

            // Clear processing state
            set((state) => {
              const tab = state.tabs[targetTabIndex];
              if (tab) {
                tab.isProcessingPayment = false;
              }
            });

            // Handle tab cleanup after successful payment
            const currentState = get();

            if (currentState.tabs.length > 1) {
              // Remove target tab if there are multiple tabs
              set((state) => {
                // Remove the tab
                state.tabs.splice(targetTabIndex, 1);

                // If we removed the active tab, switch to another tab
                if (targetTabId === state.activeTabId) {
                  const newActiveIndex = Math.min(
                    targetTabIndex,
                    state.tabs.length - 1
                  );
                  state.activeTabId = state.tabs[newActiveIndex].id;
                }
              });
            } else {
              // Reset the tab if it's the only one
              set((state) => {
                const tab = state.tabs[0];
                if (tab) {
                  tab.cart = [];
                  tab.selectedCustomer = null;
                  tab.error = null;
                }
              });
            }

            return result;
          } catch (error: any) {
            console.error("[PROCESS PAYMENT ERROR]", error);

            // Handle error on target tab
            set((state) => {
              const tab = state.tabs[targetTabIndex];
              if (tab) {
                tab.isProcessingPayment = false;
                tab.error =
                  error.message || "An error occurred while processing payment";
              }
            });

            throw error;
          }
        },

        // Reset (operate on active tab)
        resetTab: () =>
          set(
            (state) => {
              const tab = state.tabs.find((t) => t.id === state.activeTabId);
              if (!tab) return;

              tab.cart = [];
              tab.selectedCustomer = null;
              tab.isProcessingPayment = false;
              tab.error = null;
            },
            false,
            "resetTab"
          ),

        // Reset entire store to initial state
        resetStore: () =>
          set(
            (state) => {
              const newTabId = `tab-${Date.now()}`;
              state.tabs = [createEmptyTab(newTabId, "Đơn hàng 1")];
              state.activeTabId = newTabId;
            },
            false,
            "resetStore"
          ),
      };

      return store;
    }),
    {
      name: "PosStore",
    }
  )
);

// Selectors (return data from active tab)
export const usePosTabs = () => usePosStore((state) => state.tabs);
export const usePosActiveTabId = () =>
  usePosStore((state) => state.activeTabId);

export const useCart = () =>
  usePosStore((state) => {
    const tab = state.tabs.find((t) => t.id === state.activeTabId);
    return tab?.cart || [];
  });

export const usePosSelectedCustomer = () =>
  usePosStore((state) => {
    const tab = state.tabs.find((t) => t.id === state.activeTabId);
    return tab?.selectedCustomer || null;
  });

export const usePosSelectedWarehouse = () =>
  usePosStore((state) => {
    const tab = state.tabs.find((t) => t.id === state.activeTabId);
    return tab?.selectedWarehouse || null;
  });

export const usePosSelectedLocation = () =>
  usePosStore((state) => {
    const tab = state.tabs.find((t) => t.id === state.activeTabId);
    return tab?.selectedLocation || "dh1";
  });

export const usePosPaymentMethod = () =>
  usePosStore((state) => {
    const tab = state.tabs.find((t) => t.id === state.activeTabId);
    return tab?.paymentMethod || "cash";
  });

export const usePosIsProcessingPayment = () =>
  usePosStore((state) => {
    const tab = state.tabs.find((t) => t.id === state.activeTabId);
    return tab?.isProcessingPayment || false;
  });

// Selectors by index
export const usePosCartByIndex = (index: number) =>
  usePosStore((state) => {
    const tab = state.tabs[index];
    return tab?.cart || [];
  });

export const usePosSelectedCustomerByIndex = (index: number) =>
  usePosStore((state) => {
    const tab = state.tabs[index];
    return tab?.selectedCustomer || null;
  });

export const usePosSelectedWarehouseByIndex = (index: number) =>
  usePosStore((state) => {
    const tab = state.tabs[index];
    return tab?.selectedWarehouse || null;
  });
