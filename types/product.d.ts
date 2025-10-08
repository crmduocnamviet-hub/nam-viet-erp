interface InventorySettings {
  [warehouseId: number]: {
    min_stock: number;
    max_stock: number;
  };
}

interface ProductFormData {
  // Basic Info
  name: string;
  sku?: string;
  barcode?: string;
  image_url?: string;

  // Categories and Tags
  category?: string;
  tags?: string[];

  // Company Info
  manufacturer?: string;
  distributor?: string;

  // Product Details
  packaging?: string;
  description?: string;
  route?: string;
  disease?: string;

  // Units
  wholesale_unit?: string;
  retail_unit?: string;

  // Pricing
  wholesale_price?: number;
  retail_price?: number;

  // Medical Instructions
  hdsd_0_2?: string;
  hdsd_2_6?: string;
  hdsd_6_18?: string;
  hdsd_over_18?: string;

  // Lot Management
  enable_lot_management?: boolean;

  // Inventory Settings (separate table)
  inventory_settings?: InventorySettings;
}

interface ProductData extends Omit<ProductFormData, 'inventory_settings'> {
  id?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}
