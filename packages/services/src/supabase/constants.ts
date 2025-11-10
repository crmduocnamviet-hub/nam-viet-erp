/**
 * ============================================
 * DATABASE TABLE & VIEW CONSTANTS
 * ============================================
 * Centralized constants for Supabase table and view names.
 * Using constants helps prevent typos and makes it easier to refactor.
 */

export const TABLES = {
  // Core Medical & Appointments
  APPOINTMENTS: "appointments",
  APPOINTMENT_STATUSES: "appointment_statuses",
  EMPLOYEES: "employees",
  PATIENTS: "patients",
  ROOMS: "rooms",

  // EMR
  LAB_ORDERS: "lab_orders",
  MEDICAL_VISITS: "medical_visits",
  PRESCRIPTIONS: "prescriptions",

  // Sales & Inventory
  INVENTORY: "inventory",
  PRODUCTS: "products",
  PRODUCT_LOTS: "product_lots",
  PRODUCT_SUPPLIER_MAPPING: "product_supplier_mapping",
  PURCHASE_ORDERS: "purchase_orders",
  PURCHASE_ORDER_ITEMS: "purchase_order_items",
  SALES_ORDERS: "sales_orders",
  SALES_ORDER_ITEMS: "sales_order_items",
  SALES_ORDER_PRODUCT_LOT_ITEMS: "sales_order_product_lot_items",
  SUPPLIERS: "suppliers",
  WAREHOUSES: "warehouses",
  WAREHOUSE_TRANSFERS: "warehouse_transfers",
  WAREHOUSE_TRANSFER_ITEMS: "warehouse_transfer_items",

  // B2B
  B2B_CUSTOMERS: "b2b_customers",
  B2B_QUOTES: "b2b_quotes",
  B2B_QUOTE_ITEMS: "b2b_quote_items",

  // Combos & Promotions
  COMBOS: "combos",
  COMBO_ITEMS: "combo_items",
  PROMOTIONS: "promotions",
  SALES_COMBO_ITEMS: "sales_combo_items",
  SUPPLIER_PROMOTIONS: "supplier_promotions",
  VOUCHERS: "vouchers",

  // Financial
  BANKS: "banks",
  FUNDS: "funds",
  INTERNAL_FUND_TRANSFERS: "internal_fund_transfers",
  TRANSACTIONS: "transactions",
  TRANSACTION_ATTACHMENTS: "transaction_attachments",

  // Lot & VAT Management
  BARCODE_VERIFICATIONS: "barcode_verifications",
  LOT_MOVEMENTS: "lot_movements",
  VAT_WAREHOUSE: "vat_warehouse",
  VAT_INVOICES_IN: "vat_invoices_in",
  VAT_INVOICES_OUT: "vat_invoices_out",
  VAT_INVOICE_ITEMS: "vat_invoice_items",

  // Notifications & Users
  EMPLOYEE_NOTIFICATIONS: "employee_notifications",
  FCM_TOKENS: "fcm_tokens",
  NOTIFICATIONS: "notifications",

  // Patient Points
  PATIENT_POINTS_HISTORY: "patient_points_history",
  POINT_RULES: "point_rules",
  VAT_INVOICES: "vat_invoices",
} as const;

export const VIEWS = {
  PRODUCTS_WITH_INVENTORY: "products_with_inventory",
  VAT_INVENTORY_SUMMARY: "vat_inventory_summary",
  PATIENT_POINTS_SUMMARY: "patient_points_summary",
  SALES_COMBO_ITEMS_DETAILED: "sales_combo_items_detailed",
} as const;
