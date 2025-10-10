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
  stock_quantity?: number;
  unit?: string;
  min_stock?: number;
  max_stock?: number;
  batch_number?: string | null;
  expiry_date?: string | null;
  enable_lot_management?: boolean;
}

// Combo table - represents a product bundle/package deal
interface ICombo {
  id: number;
  name: string;
  description: string | null;
  combo_price: number; // Discounted price for the bundle
  is_active: boolean;
  image_url: string | null;
  created_at: string;
  updated_at?: string;
}

// Combo items table - links combos to products with quantities
interface IComboItem {
  id: number;
  combo_id: number;
  product_id: number;
  quantity: number; // How many of this product are needed for the combo
  created_at?: string;
}

// Extended combo with items for display
interface IComboWithItems extends ICombo {
  combo_items: (IComboItem & {
    products?: IProduct; // Joined product data
  })[];
  original_price?: number; // Calculated total price without discount
  discount_amount?: number; // Calculated discount
  discount_percentage?: number; // Calculated discount percentage
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
  conditions?: Record<string, number | string>;
}

interface IVoucher {
  id: number;
  created_at?: string;
  code: string;
  promotion_id: number;
  usage_limit: number;
  times_used?: number;
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
  created_at?: string;
  transaction_date: string;
  status: string;
  category: string | null;
  attachments?: string[] | string | null;
  approved_by?: string | null;
  executed_by?: string | null;
  transfer_pair_id: string;
  payment_method?: string | null;
  recipient_bank?: string | null;
  recipient_account?: string | null;
  recipient_name?: string | null;
  qr_code_url: string | null;
  initial_denomination_counts?: any | null;
  executed_denomination_counts?: any | null;
}

interface ISupplier {
  id: number;
  name: string;
  code: string | null;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  tax_code: string | null;
  payment_terms: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
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
  is_b2b_warehouse: boolean;
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
  id?: number;
  created_at?: string;
  product_id: number;
  warehouse_id: number;
  quantity: number;
  min_stock: number;
  max_stock: number;
  warehouses?: IWarehouse;
}

// Extended inventory with product details for display
interface IInventoryWithProduct extends IInventory {
  products?: IProduct; // Joined product data (plural due to Supabase join)
}

interface IPurchaseOrder {
  id: number;
  po_number: string;
  supplier_id: number;
  order_date: string;
  expected_delivery_date: string | null;
  status:
    | "draft"
    | "sent"
    | "ordered"
    | "partially_received"
    | "received"
    | "cancelled";
  total_amount: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
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

// === SCHEDULING & MEDICAL MODULE INTERFACES ===

// Patient/Customer Management - Quản lý Khách hàng/Bệnh nhân
interface IPatient {
  patient_id: string;
  full_name: string;
  phone_number: string | null;
  date_of_birth: string | null;
  gender: string | null;
  is_b2b_customer: boolean; // Phân biệt Khách lẻ/Bệnh nhân và Khách buôn
  loyalty_points: number;
  allergy_notes: string | null; // Dị ứng đã biết
  chronic_diseases: string | null; // Bệnh nền/Bệnh mãn tính
  created_at: string;
  receptionist_notes?: string;
  address?: string;
}

// Employee Management - Quản lý Nhân sự (Bác sĩ, Dược sĩ, Lễ tân)
interface IEmployee {
  employee_id: string;
  full_name: string;
  employee_code: string | null;
  role_name: string; // 'BacSi', 'DuocSi', 'LeTan'
  is_active: boolean;
  user_id?: string;
  permissions?: string[];
  warehouse_id?: number;
}

// Appointment Status Lookup - Bảng tra cứu Trạng thái Lịch hẹn
interface IAppointmentStatus {
  status_code: string;
  status_name_vn: string;
  color_code: string | null; // Mã hóa màu sắc trên Dashboard
}

// Appointment Details - Chi tiết các Lịch hẹn
interface IAppointment {
  appointment_id: string;
  patient_id: string;
  service_type: string | null; // Khám Bệnh | Tiêm Chủng | Siêu âm
  scheduled_datetime: string;
  doctor_id?: string | null; // Bác sĩ/Tài nguyên được đặt lịch
  receptionist_id: string | null; // Lễ tân tạo lịch
  current_status: string; // Xám, Xanh Lá, Tím, v.v.
  reason_for_visit: string | null;
  check_in_time: string | null; // Thời gian Lễ tân Check-in
  is_confirmed_by_zalo: boolean; // Đã gửi SMS/Zalo xác nhận
  receptionist_notes: string | null; // Ghi chú Lễ tân: "Bệnh nhân VIP", "Thường xuyên đến trễ"
  created_at: string;
}

// Medical Visit Records - Hồ sơ lần Khám Bệnh (EMR) theo mô hình SOAP
interface IMedicalVisit {
  visit_id: string;
  appointment_id: string | null; // Liên kết với lịch hẹn
  patient_id: string;
  doctor_id: string;
  visit_date: string;
  subjective_notes: string | null; // Phần S: Bệnh sử
  objective_notes: string | null; // Phần O: Thăm khám thực thể
  vital_signs: Record<string, any> | null; // Dấu hiệu sinh tồn (Nhiệt độ, HA, Mạch)
  assessment_diagnosis_icd10: string | null; // Phần A: Mã ICD-10
  plan_notes: string | null; // Phần P: Kế hoạch xử trí chung
  is_signed_off: boolean; // Đã Hoàn tất & Ký số
  signed_off_at: string | null;
}

// Laboratory Orders - Chỉ định Cận lâm sàng/Xét nghiệm
interface ILabOrder {
  order_id: string;
  visit_id: string;
  service_name: string; // Tên dịch vụ: X-Quang, Công thức máu
  preliminary_diagnosis: string | null; // Chẩn đoán sơ bộ (quan trọng cho phòng ban khác)
  is_executed: boolean; // Đã thực hiện
  result_received_at: string | null; // Thời gian nhận kết quả (để gửi vào Hộp thư Kết quả)
}

// Electronic Prescription - Chi tiết Đơn thuốc điện tử
interface IPrescription {
  prescription_item_id: string;
  visit_id: string;
  product_id: string; // Thuốc được kê
  quantity_ordered: number;
  dosage_instruction: string | null; // Hướng dẫn sử dụng: 'Ngày 2 lần, mỗi lần 1 viên sau ăn'
  ai_interaction_warning: string | null; // Cảnh báo Tương tác Thuốc từ AI
}

// Sales Order - Đơn hàng bán lẻ/POS tích hợp với phòng khám
interface ISalesOrder {
  order_id: string;
  patient_id: string | null; // Khách hàng mua
  medical_visit_id: string | null; // Đơn hàng được tạo từ lần khám
  order_type: string; // 'POS', 'B2B', 'TMDT'
  created_by_employee_id: string | null;
  order_datetime: string;
  total_value: number;
  payment_method: string | null; // Tiền mặt, Thẻ, Chuyển khoản
  payment_status: string | null; // Đã thanh toán, Thanh toán thiếu, Chờ thanh toán
  operational_status: string; // Hoàn tất, Đã hủy
  is_ai_checked: boolean; // Đã được AI Kiểm tra tương tác thuốc/tính ngày dùng thuốc
}

// Sales Order Items - Chi tiết sản phẩm trong đơn hàng
interface ISalesOrderItem {
  item_id: string;
  order_id: string;
  product_id: number;
  quantity: number;
  unit_price: number;
  is_service: boolean; // Phân biệt sản phẩm vật lý và phí dịch vụ (Phí khám)
  dosage_printed: string | null; // Hướng dẫn sử dụng in ra bill K80
}

type IB2BQuoteForm = Omit<
  IB2BQuote,
  | "quote_id"
  | "quote_number"
  | "created_at"
  | "updated_at"
  | "quote_items"
  | "employee"
>;

// B2B Quote interface
interface IB2BQuote {
  quote_id: string;
  quote_number: string; // BG-2024-001 format
  customer_name: string;
  customer_code?: string | null;
  customer_contact_person?: string | null;
  customer_phone?: string | null;
  customer_email?: string | null;
  customer_address?: string | null;
  quote_stage:
    | "draft"
    | "sent"
    | "negotiating"
    | "accepted"
    | "pending_packaging"
    | "packaged"
    | "shipping"
    | "completed"
    | "rejected"
    | "cancelled"
    | "expired";
  payment_status?: "unpaid" | "partial" | "paid" | "overdue";
  total_value?: number;
  subtotal: number;
  discount_percent: number;
  discount_amount: number;
  tax_percent: number;
  tax_amount: number;
  quote_date: string;
  valid_until: string;
  notes?: string | null;
  terms_conditions?: string | null;
  created_by_employee_id?: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  quote_items?: IB2BQuoteItem[];
  employee?: {
    full_name: string;
    employee_code: string;
  };
  b2b_customer_id?: string;
}

// B2B Quote Item interface
interface IB2BQuoteItem {
  item_id: string;
  quote_id: string;
  product_id: number;
  product_name: string;
  product_sku?: string | null;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  discount_amount: number;
  subtotal: number;
  notes?: string | null;
  created_at: string;
  // Relations
  product?: {
    name: string;
    sku: string;
    manufacturer?: string;
    retail_price: number;
  };
  total_price?: number;
  key?: string;
  unit?: string;
  packaging?: string;
}

// B2B Quote Customer interface
interface IB2BCustomer {
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
  address?: string;
}

// =====================================================
// WAREHOUSE MANAGEMENT INTERFACES
// =====================================================

// Product to Supplier mapping (for AI OCR matching)
interface IProductSupplierMapping {
  id: number;
  product_id: number;
  supplier_id: number;
  supplier_product_code: string | null;
  supplier_product_name: string | null;
  cost_price: number | null;
  lead_time_days: number | null;
  min_order_quantity: number | null;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

// Purchase Order line items
interface IPurchaseOrderItem {
  id: number;
  po_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  received_quantity: number;
  notes: string | null;
  created_at: string;
}

// Extended PO with supplier and items
interface IPurchaseOrderWithDetails extends IPurchaseOrder {
  supplier?: ISupplier;
  items?: IPurchaseOrderItem[];
}

// Extended PO Item with product details
interface IPurchaseOrderItemWithProduct extends IPurchaseOrderItem {
  product?: IProduct;
}

interface IProductLot {
  id: number;
  product_id: number;
  lot_number: string;
  batch_code?: string | null;
  expiry_date?: string | null;
  received_date?: string | null;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  products?: IProduct;
  quantity?: number;
  warehouse_id?: number;
}

interface VatInvoice {
  id: number;
  invoice_number: string;
  invoice_series?: string;
  invoice_symbol?: string;
  invoice_type: "purchase" | "sales";
  invoice_date: string;
  supplier_id?: number;
  customer_id?: number;
  subtotal: number;
  vat_rate: number;
  vat_amount: number;
  total_with_vat: number;
  discount_amount: number;
  pdf_url?: string;
  ocr_status: string;
  ocr_data?: any;
  ocr_confidence?: number;
  reconciliation_status: string;
  discrepancy_notes?: string;
  payment_status: string;
}

interface AvailableLot {
  lot_id: number;
  lot_number: string;
  expiry_date?: string;
  shelf_location?: string;
  quantity_available: number;
  vat_available: number;
  unit_cost: number;
  days_until_expiry?: number;
  recommended_quantity: number;
}

interface BarcodeVerificationResult {
  success: boolean;
  match_status: string;
  product_id?: number;
  lot_id?: number;
  in_order: boolean;
  product?: {
    id: number;
    name: string;
    sku: string;
    barcode: string;
  };
}

interface ProductLotWithDetails extends IProductLot {
  product_name: string;
  product_sku: string;
  warehouse_id?: number;
  warehouse_name?: string;
  quantity_available?: number;
  days_until_expiry?: number;
}

type ProductWithInventoryData = IProduct & {
  inventory_data: IInventory[];
};

interface SaleOrderProductLotItem {
  id: number;
  created_at: string;
  quantity: number;
  order_id: string;
  lot_id: number;
}
