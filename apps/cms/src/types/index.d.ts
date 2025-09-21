interface IProduct {
  id: number;
  created_at: string;
  name: string;
  cost_price: number | null;
  retail_price: number | null;
  sku: string;
  product_type: string;
  is_fixed_asset: boolean | null;
  barcode: string | null;
  category: string;
  tags: string[] | string;
  manufacturer: string | null;
  distributor: string | null;
  registration_number: string | null;
  packaging: string | null;
  description: string;
  hdsd_0_2: string | null;
  hdsd_2_6: string | null;
  hdsd_6_18: string | null;
  hdsd_over_18: string | null;
  disease: string | null;
  is_chronic: boolean | null;
  wholesale_unit: string | null;
  retail_unit: string | null;
  conversion_rate: number | null;
  invoice_price: number | null;
  wholesale_profit: number | null;
  retail_profit: number | null;
  wholesale_price: number | null;
  is_active: boolean;
  image_url: string | null;
  route: string | null;
  supplier_id: number | null;
  shelf_location: string | null;
}

interface IPromotion {
  id: number;
  created_at?: string;
  name: string;
  description?: string | null;
  type?: string;
  value?: number;
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
  conditions?: {
    min_order_value: number;
  };
}

interface IVoucher {
  id: number;
  created_at: string;
  code: string;
  promotion_id: number;
  usage_limit: number;
  times_used: number;
  is_active: boolean;
}

interface IProductOrderItem {
  id: number;
  po_id: number;
  product_id: number;
  quantity: number;
  cost_price: number;
  created_at: string;
}

interface IRolePermission {
  role_id: number;
  permission_id: number;
}

interface IFund {
  id: number;
  name: string;
  type: string;
  initial_balance: number;
  created_at: string;
  account_holder_name: string | null;
  account_number: string | null;
  bank_id: number | null;
}

interface IProfile {
  id: string;
  full_name: string;
  avatar_url: string;
  phone: string;
  date_of_birth: string;
  gender: string;
  address: string | null;
  citizen_id: string;
  emergency_contact: string | null;
  employee_status: string;
  start_date: string | null;
  end_date: string | null;
  manager_id: string | null;
  contract_number: string | null;
  bank_name: string | null;
  bank_account_number: string | null;
  updated_at: string;
  self_introduction: string;
  hobbies: string;
  personal_boundaries: string;
  marital_status: string;
  citizen_id_issue_date: string;
  citizen_id_front_url: string | null;
  citizen_id_back_url: string | null;
  education_level: string;
  major: string;
  strengths: string;
}

interface ITransaction {
  id: number;
  fund_id: number;
  type: string;
  amount: number;
  description: string;
  created_by: string;
  created_at: string;
  transaction_date: string;
  status: string;
  category: string | null;
  attachments: string | null;
  approved_by: string | null;
  executed_by: string | null;
  transfer_pair_id: string;
  payment_method: string | null;
  recipient_bank: string | null;
  recipient_account: string | null;
  recipient_name: string | null;
  qr_code_url: string | null;
  initial_denomination_counts: any | null;
  executed_denomination_counts: any | null;
}

interface ISupplier {
  id: number;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  created_at: string;
}

interface IPermission {
  id: number;
  name: string;
  description: string;
  module: string;
}

interface IWarehouse {
  id: number;
  created_at: string;
  name: string;
}

interface IBank {
  id: number;
  name: string;
  code: string;
  bin: string;
  short_name: string;
  logo: string;
  created_at: string;
}

interface IInventory {
  id: number;
  created_at: string;
  product_id: number;
  warehouse_id: number;
  quantity: number;
  min_stock: number;
  max_stock: number;
}

interface IPurchaseOrder {
  id: number;
  supplier_id: number;
  status: string;
  notes: string | null;
  created_by: string;
  created_at: string;
}

interface IPurchaseWithInventory {
  id: number;
  created_at: string;
  name: string;
  cost_price: number;
  retail_price: number;
  sku: string;
  product_type: string;
  is_fixed_asset: boolean;
  barcode: string;
  category: string;
  tags: string[] | string;
  manufacturer: string;
  distributor: string;
  registration_number: string;
  packaging: string;
  description: string;
  hdsd_0_2: string;
  hdsd_2_6: string;
  hdsd_6_18: string;
  hdsd_over_18: string;
}