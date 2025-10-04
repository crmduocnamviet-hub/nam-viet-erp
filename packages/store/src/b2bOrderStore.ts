import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

// Customer type matching global IB2BCustomer
export interface Customer {
  customer_id: string;
  customer_name: string;
  customer_code: string;
  contact_person?: string | null;
  phone_number?: string | null;
  email?: string | null;
  address?: string | null;
  tax_code?: string | null;
  customer_type: "hospital" | "pharmacy" | "clinic" | "distributor" | "other";
  credit_limit?: number | null;
  payment_terms_days: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type QuoteStage = "draft" | "accepted" | "sent";

export interface OrderFormData {
  b2b_customer_id: string;
  customer_name: string;
  customer_code?: string;
  customer_phone: string;
  customer_email?: string;
  customer_address: string;
  delivery_address?: string;
  quote_date: string;
  valid_until: string;
  discount_percent: number;
  tax_percent: number;
  notes?: string;
  created_by_employee_id?: string;
  quote_stage?: QuoteStage;
}

export interface OrderTotals {
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  itemCount: number;
  totalQuantity: number;
}

export interface CreatedOrder {
  quote_id: number;
  quote_number: string;
  created_at: string;
}

// Single order tab data
export interface OrderTab {
  id: string;
  title: string;
  orderItems: IB2BQuoteItem[];
  selectedCustomer: Customer | null;
  formData: Partial<OrderFormData>;
  isCreating: boolean;
  createdOrder: CreatedOrder | null;
  error: string | null;
}

// State interface
export interface B2BOrderState {
  // Multi-tab state
  tabs: OrderTab[];
  activeTabId: string;

  // Tab management actions
  createTab: (title?: string) => string;
  closeTab: (tabId: string) => void;
  switchTab: (tabId: string) => void;
  updateTabTitle: (tabId: string, title: string) => void;

  // Order item actions (operate on active tab)
  addOrderItem: (item: IB2BQuoteItem) => void;
  updateOrderItem: (key: string, updates: Partial<IB2BQuoteItem>) => void;
  removeOrderItem: (key: string) => void;
  clearOrderItems: () => void;

  // Order item actions by index
  addOrderItemByIndex: (index: number, item: IB2BQuoteItem) => void;
  updateOrderItemByIndex: (
    index: number,
    key: string,
    updates: Partial<IB2BQuoteItem>
  ) => void;
  removeOrderItemByIndex: (index: number, key: string) => void;
  clearOrderItemsByIndex: (index: number) => void;

  // Customer actions (operate on active tab)
  setSelectedCustomer: (customer: Customer | null) => void;
  updateFormData: (data: Partial<OrderFormData>) => void;

  // Customer actions by index
  setSelectedCustomerByIndex: (
    index: number,
    customer: Customer | null
  ) => void;
  updateFormDataByIndex: (index: number, data: Partial<OrderFormData>) => void;

  // Async actions (operate on active tab)
  createOrder: (
    payload: {
      formData: OrderFormData;
      items: IB2BQuoteItem[];
    },
    createB2BQuote: (data: any) => Promise<any>,
    addQuoteItem: (data: any) => Promise<any>
  ) => Promise<void>;

  // Reset (operate on active tab)
  resetOrder: () => void;
}

// Create store without saga middleware
export const useB2BOrderStore = create<B2BOrderState>()(
  devtools(
    immer((set, get) => {
      // Helper to create a new empty tab
      const createEmptyTab = (id: string, title: string): OrderTab => ({
        id,
        title,
        orderItems: [],
        selectedCustomer: null,
        formData: {},
        isCreating: false,
        createdOrder: null,
        error: null,
      });

      // Create initial tab
      const initialTabId = `tab-${Date.now()}`;
      const initialTab = createEmptyTab(initialTabId, "Đơn hàng 1");

      const store: B2BOrderState = {
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

        // Order item actions (operate on active tab)
        addOrderItem: (item) =>
          set(
            (state) => {
              const tab = state.tabs.find((t) => t.id === state.activeTabId);
              if (!tab) return;

              const existingIndex = tab.orderItems.findIndex(
                (i) => i.product_id === item.product_id
              );

              if (existingIndex >= 0) {
                // Increase quantity if product already exists
                tab.orderItems[existingIndex].quantity += item.quantity;
                tab.orderItems[existingIndex].total_price =
                  tab.orderItems[existingIndex].quantity *
                  tab.orderItems[existingIndex].unit_price;
              } else {
                // Add new item
                tab.orderItems.push(item);
              }
            },
            false,
            "addOrderItem"
          ),

        updateOrderItem: (key, updates) =>
          set(
            (state) => {
              const tab = state.tabs.find((t) => t.id === state.activeTabId);
              if (!tab) return;

              const item = tab.orderItems.find((i) => i.key === key);
              if (item) {
                Object.assign(item, updates);
                if (
                  updates.quantity !== undefined ||
                  updates.unit_price !== undefined
                ) {
                  item.total_price = item.quantity * item.unit_price;
                }
              }
            },
            false,
            "updateOrderItem"
          ),

        removeOrderItem: (key) =>
          set(
            (state) => {
              const tab = state.tabs.find((t) => t.id === state.activeTabId);
              if (!tab) return;

              tab.orderItems = tab.orderItems.filter((i) => i.key !== key);
            },
            false,
            "removeOrderItem"
          ),

        clearOrderItems: () =>
          set(
            (state) => {
              const tab = state.tabs.find((t) => t.id === state.activeTabId);
              if (!tab) return;

              tab.orderItems = [];
            },
            false,
            "clearOrderItems"
          ),

        // Customer actions (operate on active tab)
        setSelectedCustomer: (customer) =>
          set(
            (state) => {
              const tab = state.tabs.find((t) => t.id === state.activeTabId);
              if (!tab) return;

              tab.selectedCustomer = customer;
              if (customer) {
                tab.formData = {
                  ...tab.formData,
                  b2b_customer_id: customer.customer_id,
                  customer_name: customer.customer_name,
                  customer_code: customer.customer_code,
                  customer_phone: customer.phone_number || undefined,
                  customer_email: customer.email || undefined,
                };
              }
            },
            false,
            "setSelectedCustomer"
          ),

        updateFormData: (data) =>
          set(
            (state) => {
              const tab = state.tabs.find((t) => t.id === state.activeTabId);
              if (!tab) return;

              tab.formData = { ...tab.formData, ...data };
            },
            false,
            "updateFormData"
          ),

        // Order item actions by index
        addOrderItemByIndex: (index, item) =>
          set(
            (state) => {
              const tab = state.tabs[index];
              if (!tab) return;

              const existingIndex = tab.orderItems.findIndex(
                (i) => i.product_id === item.product_id
              );

              if (existingIndex >= 0) {
                // Increase quantity if product already exists
                tab.orderItems[existingIndex].quantity += item.quantity;
                tab.orderItems[existingIndex].total_price =
                  tab.orderItems[existingIndex].quantity *
                  tab.orderItems[existingIndex].unit_price;
              } else {
                // Add new item
                tab.orderItems.push(item);
              }
            },
            false,
            "addOrderItemByIndex"
          ),

        updateOrderItemByIndex: (index, key, updates) =>
          set(
            (state) => {
              const tab = state.tabs[index];
              if (!tab) return;

              const item = tab.orderItems.find((i) => i.key === key);
              if (item) {
                Object.assign(item, updates);
                if (
                  updates.quantity !== undefined ||
                  updates.unit_price !== undefined
                ) {
                  item.total_price = item.quantity * item.unit_price;
                }
              }
            },
            false,
            "updateOrderItemByIndex"
          ),

        removeOrderItemByIndex: (index, key) =>
          set(
            (state) => {
              const tab = state.tabs[index];
              if (!tab) return;

              tab.orderItems = tab.orderItems.filter((i) => i.key !== key);
            },
            false,
            "removeOrderItemByIndex"
          ),

        clearOrderItemsByIndex: (index) =>
          set(
            (state) => {
              const tab = state.tabs[index];
              if (!tab) return;

              tab.orderItems = [];
            },
            false,
            "clearOrderItemsByIndex"
          ),

        // Customer actions by index
        setSelectedCustomerByIndex: (index, customer) =>
          set(
            (state) => {
              const tab = state.tabs[index];
              if (!tab) return;

              tab.selectedCustomer = customer;
              if (customer) {
                tab.formData = {
                  ...tab.formData,
                  b2b_customer_id: customer.customer_id,
                  customer_name: customer.customer_name,
                  customer_code: customer.customer_code,
                  customer_phone: customer.phone_number || undefined,
                  customer_email: customer.email || undefined,
                };
              }
            },
            false,
            "setSelectedCustomerByIndex"
          ),

        updateFormDataByIndex: (index, data) =>
          set(
            (state) => {
              const tab = state.tabs[index];
              if (!tab) return;

              tab.formData = { ...tab.formData, ...data };
            },
            false,
            "updateFormDataByIndex"
          ),

        // Create order action
        createOrder: async (payload, createB2BQuote, addQuoteItem) => {
          const { formData, items } = payload;
          const state = get();
          const tab = state.tabs.find((t) => t.id === state.activeTabId);

          if (!tab) {
            throw new Error("No active tab found");
          }

          try {
            // Set loading state
            set((state) => {
              const tab = state.tabs.find((t) => t.id === state.activeTabId);
              if (tab) {
                tab.isCreating = true;
                tab.error = null;
              }
            });

            // Calculate totals
            const subtotal = items.reduce(
              (sum, item) => sum + item.total_price,
              0
            );
            const discountAmount = subtotal * (formData.discount_percent / 100);
            const taxableAmount = subtotal - discountAmount;
            const taxAmount = taxableAmount * (formData.tax_percent / 100);
            const totalAmount = taxableAmount + taxAmount;

            // Create quote data
            const quoteData: IB2BQuoteForm = {
              ...formData,
              subtotal,
              discount_amount: discountAmount,
              tax_amount: taxAmount,
              quote_stage: formData.quote_stage || "draft",
              payment_status: "unpaid",
            };

            // Call API to create quote
            const quoteResult: any = await createB2BQuote(quoteData);

            if (quoteResult.error) {
              throw new Error(
                quoteResult.error.message || "Failed to create quote"
              );
            }

            const newQuote = quoteResult.data;

            // Create quote items
            const itemPromises = items.map((item) => {
              const itemData = {
                quote_id: newQuote.quote_id,
                product_id: item.product_id,
                product_name: item.product_name,
                product_sku: null,
                quantity: item.quantity,
                unit_price: item.unit_price,
                discount_percent: 0,
                discount_amount: 0,
                subtotal: item.total_price,
                notes: null,
              };

              return addQuoteItem(itemData);
            });

            // Wait for all items to be created
            const itemResults: any[] = await Promise.all(itemPromises);

            const failedItems = itemResults.filter((result) => result.error);
            if (failedItems.length > 0) {
              console.error("Some items failed to save:", failedItems);
            }

            // Update state with created order
            set((state) => {
              const tab = state.tabs.find((t) => t.id === state.activeTabId);
              if (tab) {
                tab.isCreating = false;
                tab.createdOrder = {
                  quote_id: newQuote.quote_id,
                  quote_number: newQuote.quote_number,
                  created_at: new Date().toISOString(),
                };
              }
            });

            // Handle tab cleanup after successful creation
            const currentState = get();
            const currentTabId = currentState.activeTabId;

            if (currentState.tabs.length > 1) {
              // Remove current tab if there are multiple tabs
              const tabIndex = currentState.tabs.findIndex(
                (t) => t.id === currentTabId
              );

              set((state) => {
                if (tabIndex !== -1) {
                  // Remove the tab
                  state.tabs.splice(tabIndex, 1);

                  // Switch to another tab
                  const newActiveIndex = Math.min(
                    tabIndex,
                    state.tabs.length - 1
                  );
                  state.activeTabId = state.tabs[newActiveIndex].id;
                }
              });
            }

            return newQuote;
          } catch (error: any) {
            console.error("[CREATE ORDER ERROR]", error);

            // Handle error
            set((state) => {
              const tab = state.tabs.find((t) => t.id === state.activeTabId);
              if (tab) {
                tab.isCreating = false;
                tab.error =
                  error.message || "An error occurred while creating the order";
              }
            });

            throw error;
          }
        },

        // Reset (operate on active tab)
        resetOrder: () =>
          set(
            (state) => {
              const tab = state.tabs.find((t) => t.id === state.activeTabId);
              if (!tab) return;

              tab.orderItems = [];
              tab.selectedCustomer = null;
              tab.formData = {};
              tab.isCreating = false;
              tab.createdOrder = null;
              tab.error = null;
            },
            false,
            "resetOrder"
          ),
      };

      return store;
    })
  )
);

// Helper to get active tab
const getActiveTab = (state: B2BOrderState): OrderTab | null => {
  return state.tabs.find((tab) => tab.id === state.activeTabId) || null;
};

// Selectors (return data from active tab)
export const useTabs = () => useB2BOrderStore((state) => state.tabs);
export const useActiveTabId = () =>
  useB2BOrderStore((state) => state.activeTabId);
export const useActiveTab = () =>
  useB2BOrderStore((state) => getActiveTab(state));

export const useOrderItems = () =>
  useB2BOrderStore((state) => {
    const tab = getActiveTab(state);
    return tab?.orderItems || [];
  });

export const useSelectedCustomer = () =>
  useB2BOrderStore((state) => {
    const tab = getActiveTab(state);
    return tab?.selectedCustomer || null;
  });

export const useSelectedCustomerByIndex = (index: number) =>
  useB2BOrderStore((state) => {
    const tab = state.tabs[index];
    return tab?.selectedCustomer || null;
  });

export const useOrderFormData = () =>
  useB2BOrderStore((state) => {
    const tab = getActiveTab(state);
    return tab?.formData || {};
  });

export const useOrderFormDataByIndex = (index: number) =>
  useB2BOrderStore((state) => {
    const tab = state.tabs[index];
    return tab?.formData || {};
  });

export const useOrderItemsByIndex = (index: number) =>
  useB2BOrderStore((state) => {
    const tab = state.tabs[index];
    return tab?.orderItems || [];
  });

export const useTabByIndex = (index: number) =>
  useB2BOrderStore((state) => {
    return state.tabs[index] || null;
  });

export const useIsCreatingOrder = () =>
  useB2BOrderStore((state) => {
    const tab = getActiveTab(state);
    return tab?.isCreating || false;
  });

export const useCreatedOrder = () =>
  useB2BOrderStore((state) => {
    const tab = getActiveTab(state);
    return tab?.createdOrder || null;
  });

export const useOrderError = () =>
  useB2BOrderStore((state) => {
    const tab = getActiveTab(state);
    return tab?.error || null;
  });

// Computed selectors
export const useOrderTotals = (): OrderTotals => {
  const items = useOrderItems();
  const formData = useOrderFormData();

  const subtotal = items.reduce(
    (sum: number, item: IB2BQuoteItem) => sum + item.total_price,
    0
  );
  const discountPercent = formData.discount_percent || 0;
  const taxPercent = formData.tax_percent || 10;

  const discountAmount = subtotal * (discountPercent / 100);
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = taxableAmount * (taxPercent / 100);
  const totalAmount = taxableAmount + taxAmount;

  return {
    subtotal,
    discountAmount,
    taxAmount,
    totalAmount,
    itemCount: items.length,
    totalQuantity: items.reduce(
      (sum: number, item: IB2BQuoteItem) => sum + item.quantity,
      0
    ),
  };
};

export const useOrderTotalsByIndex = (index: number): OrderTotals => {
  const items = useOrderItemsByIndex(index);
  const formData = useOrderFormDataByIndex(index);

  const subtotal = items.reduce(
    (sum: number, item: IB2BQuoteItem) => sum + item.total_price,
    0
  );
  const discountPercent = formData.discount_percent || 0;
  const taxPercent = formData.tax_percent || 10;

  const discountAmount = subtotal * (discountPercent / 100);
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = taxableAmount * (taxPercent / 100);
  const totalAmount = taxableAmount + taxAmount;

  return {
    subtotal,
    discountAmount,
    taxAmount,
    totalAmount,
    itemCount: items.length,
    totalQuantity: items.reduce(
      (sum: number, item: IB2BQuoteItem) => sum + item.quantity,
      0
    ),
  };
};
