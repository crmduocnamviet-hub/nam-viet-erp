/**
 * Entity Store - Normalized data storage for products, lots, and inventory
 * This store keeps entities by ID for efficient updates and syncing across screens
 */

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

// =====================================================
// TYPES
// =====================================================

export interface ProductEntity {
  id: number;
  name: string;
  sku: string;
  enable_lot_management: boolean;
  // ... other product fields
  [key: string]: any;
}

export interface ProductLotEntity {
  id: number;
  product_id: number;
  warehouse_id: number;
  lot_number: string;
  batch_code?: string;
  quantity: number;
  expiry_date?: string;
  received_date?: string;
  // ... other lot fields
  [key: string]: any;
}

export interface InventoryEntity {
  id: number;
  product_id: number;
  warehouse_id: number;
  quantity: number;
  min_stock?: number;
  max_stock?: number;
  // ... other inventory fields
  [key: string]: any;
}

// =====================================================
// STATE INTERFACE
// =====================================================

export interface EntityState {
  // Normalized data (stored by ID for efficient updates)
  products: Record<number, ProductEntity>;
  productLots: Record<number, ProductLotEntity>;
  inventory: Record<string, InventoryEntity>; // Key: `${product_id}_${warehouse_id}`

  // Index for quick lookups
  productLotsByProduct: Record<number, number[]>; // productId -> lotIds[]
  productLotsByWarehouse: Record<number, number[]>; // warehouseId -> lotIds[]
  inventoryByProduct: Record<number, string[]>; // productId -> inventoryKeys[]
  inventoryByWarehouse: Record<number, string[]>; // warehouseId -> inventoryKeys[]

  // Timestamps for cache invalidation
  lastUpdated: {
    products: Record<number, number>; // productId -> timestamp
    productLots: Record<number, number>; // lotId -> timestamp
    inventory: Record<string, number>; // inventoryKey -> timestamp
  };

  // =====================================================
  // PRODUCT ACTIONS
  // =====================================================

  setProduct: (product: ProductEntity) => void;
  setProducts: (products: ProductEntity[]) => void;
  updateProduct: (productId: number, updates: Partial<ProductEntity>) => void;
  deleteProduct: (productId: number) => void;
  getProduct: (productId: number) => ProductEntity | undefined;
  getAllProducts: () => ProductEntity[];

  // =====================================================
  // PRODUCT LOT ACTIONS
  // =====================================================

  setProductLot: (lot: ProductLotEntity) => void;
  setProductLots: (lots: ProductLotEntity[]) => void;
  updateProductLot: (lotId: number, updates: Partial<ProductLotEntity>) => void;
  deleteProductLot: (lotId: number) => void;
  getProductLot: (lotId: number) => ProductLotEntity | undefined;
  getProductLotsByProduct: (productId: number) => ProductLotEntity[];
  getProductLotsByWarehouse: (
    productId: number,
    warehouseId: number,
  ) => ProductLotEntity[];

  // =====================================================
  // INVENTORY ACTIONS
  // =====================================================

  setInventory: (inventory: InventoryEntity) => void;
  setInventories: (inventories: InventoryEntity[]) => void;
  updateInventory: (
    productId: number,
    warehouseId: number,
    updates: Partial<InventoryEntity>,
  ) => void;
  deleteInventory: (productId: number, warehouseId: number) => void;
  getInventory: (
    productId: number,
    warehouseId: number,
  ) => InventoryEntity | undefined;
  getInventoriesByProduct: (productId: number) => InventoryEntity[];
  getInventoriesByWarehouse: (warehouseId: number) => InventoryEntity[];

  // =====================================================
  // UTILITY ACTIONS
  // =====================================================

  clear: () => void;
  clearProduct: (productId: number) => void;
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

const getInventoryKey = (productId: number, warehouseId: number) =>
  `${productId}_${warehouseId}`;

// =====================================================
// STORE IMPLEMENTATION
// =====================================================

export const useEntityStore = create<EntityState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        products: {},
        productLots: {},
        inventory: {},
        productLotsByProduct: {},
        productLotsByWarehouse: {},
        inventoryByProduct: {},
        inventoryByWarehouse: {},
        lastUpdated: {
          products: {},
          productLots: {},
          inventory: {},
        },

        // =====================================================
        // PRODUCT ACTIONS
        // =====================================================

        setProduct: (product) =>
          set(
            (state) => {
              state.products[product.id] = product;
              state.lastUpdated.products[product.id] = Date.now();
            },
            false,
            "setProduct",
          ),

        setProducts: (products) =>
          set(
            (state) => {
              const now = Date.now();
              products.forEach((product) => {
                state.products[product.id] = product;
                state.lastUpdated.products[product.id] = now;
              });
            },
            false,
            "setProducts",
          ),

        updateProduct: (productId, updates) =>
          set(
            (state) => {
              if (state.products[productId]) {
                state.products[productId] = {
                  ...state.products[productId],
                  ...updates,
                };
                state.lastUpdated.products[productId] = Date.now();
              }
            },
            false,
            "updateProduct",
          ),

        deleteProduct: (productId) =>
          set(
            (state) => {
              delete state.products[productId];
              delete state.lastUpdated.products[productId];
              // Also delete related data
              delete state.productLotsByProduct[productId];
              delete state.inventoryByProduct[productId];
            },
            false,
            "deleteProduct",
          ),

        getProduct: (productId) => get().products[productId],

        getAllProducts: () => Object.values(get().products),

        // =====================================================
        // PRODUCT LOT ACTIONS
        // =====================================================

        setProductLot: (lot) =>
          set(
            (state) => {
              state.productLots[lot.id] = lot;
              state.lastUpdated.productLots[lot.id] = Date.now();

              // Update indexes
              if (!state.productLotsByProduct[lot.product_id]) {
                state.productLotsByProduct[lot.product_id] = [];
              }
              if (
                !state.productLotsByProduct[lot.product_id].includes(lot.id)
              ) {
                state.productLotsByProduct[lot.product_id].push(lot.id);
              }

              if (!state.productLotsByWarehouse[lot.warehouse_id]) {
                state.productLotsByWarehouse[lot.warehouse_id] = [];
              }
              if (
                !state.productLotsByWarehouse[lot.warehouse_id].includes(lot.id)
              ) {
                state.productLotsByWarehouse[lot.warehouse_id].push(lot.id);
              }
            },
            false,
            "setProductLot",
          ),

        setProductLots: (lots) =>
          set(
            (state) => {
              const now = Date.now();
              lots.forEach((lot) => {
                state.productLots[lot.id] = lot;
                state.lastUpdated.productLots[lot.id] = now;

                // Update indexes
                if (!state.productLotsByProduct[lot.product_id]) {
                  state.productLotsByProduct[lot.product_id] = [];
                }
                if (
                  !state.productLotsByProduct[lot.product_id].includes(lot.id)
                ) {
                  state.productLotsByProduct[lot.product_id].push(lot.id);
                }

                if (!state.productLotsByWarehouse[lot.warehouse_id]) {
                  state.productLotsByWarehouse[lot.warehouse_id] = [];
                }
                if (
                  !state.productLotsByWarehouse[lot.warehouse_id].includes(
                    lot.id,
                  )
                ) {
                  state.productLotsByWarehouse[lot.warehouse_id].push(lot.id);
                }
              });
            },
            false,
            "setProductLots",
          ),

        updateProductLot: (lotId, updates) =>
          set(
            (state) => {
              if (state.productLots[lotId]) {
                state.productLots[lotId] = {
                  ...state.productLots[lotId],
                  ...updates,
                };
                state.lastUpdated.productLots[lotId] = Date.now();
              }
            },
            false,
            "updateProductLot",
          ),

        deleteProductLot: (lotId) =>
          set(
            (state) => {
              const lot = state.productLots[lotId];
              if (lot) {
                // Remove from indexes
                const productLots = state.productLotsByProduct[lot.product_id];
                if (productLots) {
                  const index = productLots.indexOf(lotId);
                  if (index > -1) {
                    productLots.splice(index, 1);
                  }
                }

                const warehouseLots =
                  state.productLotsByWarehouse[lot.warehouse_id];
                if (warehouseLots) {
                  const index = warehouseLots.indexOf(lotId);
                  if (index > -1) {
                    warehouseLots.splice(index, 1);
                  }
                }

                // Delete lot
                delete state.productLots[lotId];
                delete state.lastUpdated.productLots[lotId];
              }
            },
            false,
            "deleteProductLot",
          ),

        getProductLot: (lotId) => get().productLots[lotId],

        getProductLotsByProduct: (productId) => {
          const state = get();
          const lotIds = state.productLotsByProduct[productId] || [];
          return lotIds.map((id) => state.productLots[id]).filter(Boolean);
        },

        getProductLotsByWarehouse: (productId, warehouseId) => {
          const state = get();
          const lotIds = state.productLotsByProduct[productId] || [];
          return lotIds
            .map((id) => state.productLots[id])
            .filter((lot) => lot && lot.warehouse_id === warehouseId);
        },

        // =====================================================
        // INVENTORY ACTIONS
        // =====================================================

        setInventory: (inventory) =>
          set(
            (state) => {
              const key = getInventoryKey(
                inventory.product_id,
                inventory.warehouse_id,
              );
              state.inventory[key] = inventory;
              state.lastUpdated.inventory[key] = Date.now();

              // Update indexes
              if (!state.inventoryByProduct[inventory.product_id]) {
                state.inventoryByProduct[inventory.product_id] = [];
              }
              if (
                !state.inventoryByProduct[inventory.product_id].includes(key)
              ) {
                state.inventoryByProduct[inventory.product_id].push(key);
              }

              if (!state.inventoryByWarehouse[inventory.warehouse_id]) {
                state.inventoryByWarehouse[inventory.warehouse_id] = [];
              }
              if (
                !state.inventoryByWarehouse[inventory.warehouse_id].includes(
                  key,
                )
              ) {
                state.inventoryByWarehouse[inventory.warehouse_id].push(key);
              }
            },
            false,
            "setInventory",
          ),

        setInventories: (inventories) =>
          set(
            (state) => {
              const now = Date.now();
              inventories.forEach((inventory) => {
                const key = getInventoryKey(
                  inventory.product_id,
                  inventory.warehouse_id,
                );
                state.inventory[key] = inventory;
                state.lastUpdated.inventory[key] = now;

                // Update indexes
                if (!state.inventoryByProduct[inventory.product_id]) {
                  state.inventoryByProduct[inventory.product_id] = [];
                }
                if (
                  !state.inventoryByProduct[inventory.product_id].includes(key)
                ) {
                  state.inventoryByProduct[inventory.product_id].push(key);
                }

                if (!state.inventoryByWarehouse[inventory.warehouse_id]) {
                  state.inventoryByWarehouse[inventory.warehouse_id] = [];
                }
                if (
                  !state.inventoryByWarehouse[inventory.warehouse_id].includes(
                    key,
                  )
                ) {
                  state.inventoryByWarehouse[inventory.warehouse_id].push(key);
                }
              });
            },
            false,
            "setInventories",
          ),

        updateInventory: (productId, warehouseId, updates) =>
          set(
            (state) => {
              const key = getInventoryKey(productId, warehouseId);
              if (state.inventory[key]) {
                state.inventory[key] = {
                  ...state.inventory[key],
                  ...updates,
                };
                state.lastUpdated.inventory[key] = Date.now();
              }
            },
            false,
            "updateInventory",
          ),

        deleteInventory: (productId, warehouseId) =>
          set(
            (state) => {
              const key = getInventoryKey(productId, warehouseId);

              // Remove from indexes
              const productInventories = state.inventoryByProduct[productId];
              if (productInventories) {
                const index = productInventories.indexOf(key);
                if (index > -1) {
                  productInventories.splice(index, 1);
                }
              }

              const warehouseInventories =
                state.inventoryByWarehouse[warehouseId];
              if (warehouseInventories) {
                const index = warehouseInventories.indexOf(key);
                if (index > -1) {
                  warehouseInventories.splice(index, 1);
                }
              }

              // Delete inventory
              delete state.inventory[key];
              delete state.lastUpdated.inventory[key];
            },
            false,
            "deleteInventory",
          ),

        getInventory: (productId, warehouseId) => {
          const key = getInventoryKey(productId, warehouseId);
          return get().inventory[key];
        },

        getInventoriesByProduct: (productId) => {
          const state = get();
          const keys = state.inventoryByProduct[productId] || [];
          return keys.map((key) => state.inventory[key]).filter(Boolean);
        },

        getInventoriesByWarehouse: (warehouseId) => {
          const state = get();
          const keys = state.inventoryByWarehouse[warehouseId] || [];
          return keys.map((key) => state.inventory[key]).filter(Boolean);
        },

        // =====================================================
        // UTILITY ACTIONS
        // =====================================================

        clear: () =>
          set(
            (state) => {
              state.products = {};
              state.productLots = {};
              state.inventory = {};
              state.productLotsByProduct = {};
              state.productLotsByWarehouse = {};
              state.inventoryByProduct = {};
              state.inventoryByWarehouse = {};
              state.lastUpdated = {
                products: {},
                productLots: {},
                inventory: {},
              };
            },
            false,
            "clear",
          ),

        clearProduct: (productId) =>
          set(
            (state) => {
              delete state.products[productId];
              delete state.lastUpdated.products[productId];

              // Clear related lots
              const lotIds = state.productLotsByProduct[productId] || [];
              lotIds.forEach((lotId) => {
                delete state.productLots[lotId];
                delete state.lastUpdated.productLots[lotId];
              });
              delete state.productLotsByProduct[productId];

              // Clear related inventory
              const inventoryKeys = state.inventoryByProduct[productId] || [];
              inventoryKeys.forEach((key) => {
                delete state.inventory[key];
                delete state.lastUpdated.inventory[key];
              });
              delete state.inventoryByProduct[productId];
            },
            false,
            "clearProduct",
          ),
      })),
      {
        name: "entity-storage",
        // Persist everything
        partialize: (state) => ({
          products: state.products,
          productLots: state.productLots,
          inventory: state.inventory,
          productLotsByProduct: state.productLotsByProduct,
          productLotsByWarehouse: state.productLotsByWarehouse,
          inventoryByProduct: state.inventoryByProduct,
          inventoryByWarehouse: state.inventoryByWarehouse,
          lastUpdated: state.lastUpdated,
        }),
      },
    ),
    {
      name: "EntityStore",
    },
  ),
);

// =====================================================
// SELECTORS (with "Entity" prefix to avoid conflicts)
// =====================================================

export const useEntityProduct = (productId: number) =>
  useEntityStore((state) => state.products[productId]);

export const useEntityAllProducts = () =>
  useEntityStore((state) => Object.values(state.products));

export const useEntityProductLot = (lotId: number) =>
  useEntityStore((state) => state.productLots[lotId]);

export const useEntityProductLotsByProduct = (productId: number) =>
  useEntityStore((state) => state.getProductLotsByProduct(productId));

export const useEntityProductLotsByWarehouse = (
  productId: number,
  warehouseId: number,
) =>
  useEntityStore((state) =>
    state.getProductLotsByWarehouse(productId, warehouseId),
  );

export const useEntityInventoryItem = (
  productId: number,
  warehouseId: number,
) => useEntityStore((state) => state.getInventory(productId, warehouseId));

export const useEntityInventoriesByProduct = (productId: number) =>
  useEntityStore((state) => state.getInventoriesByProduct(productId));

export const useEntityInventoriesByWarehouse = (warehouseId: number) =>
  useEntityStore((state) => state.getInventoriesByWarehouse(warehouseId));
