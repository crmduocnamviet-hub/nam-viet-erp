/**
 * Salary & Compensation System Types
 *
 * Hệ thống quản lý lương bổng và thưởng cho nhân viên
 */

/**
 * Allowance Type - Loại phụ cấp cho ngạch lương
 */
export interface Allowance {
  id: string;
  name: string; // Tên phụ cấp (e.g., "Phụ cấp xăng xe", "Phụ cấp điện thoại")
  amount: number; // Số tiền phụ cấp
  description?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Salary Grade - Ngạch lương
 * Đây là đơn vị chính để quản lý lương
 */
export interface SalaryGrade {
  id: string;
  grade_name: string; // Tên ngạch lương (e.g., "Ngạch A", "Ngạch B", "Ngạch Quản lý")
  base_salary: number; // Lương cơ bản
  allowances: Allowance[]; // Danh sách các khoản phụ cấp
  total_salary: number; // Tổng lương = base_salary + sum(allowances.amount)
  description?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * DEPRECATED: Sử dụng SalaryGrade thay thế
 * Salary Structure - Cấu trúc lương cơ bản (Legacy)
 */
export interface SalaryStructure {
  id: string;
  role_key: string; // Link to role (e.g., "sales-staff", "inventory-manager")
  role_title: string;
  base_salary: number; // Lương cơ bản
  allowances: Allowance[]; // Các khoản phụ cấp
  total_salary: number; // Tổng lương = base_salary + allowances
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// ==================== KPI & COMMISSION POLICIES (NEW) ====================

/**
 * KPI Policy - Chính sách KPI (Configurable in UI)
 * Thay thế cho KPIDefinition hardcoded
 */
export interface KPIPolicy {
  kpi_id: string;
  kpi_name: string;
  description?: string;
  kpi_type: "revenue" | "orders" | "customers" | "products_sold" | "custom";
  default_target?: number;
  measurement_period: "daily" | "weekly" | "monthly" | "quarterly" | "yearly";
  kpi_applicable_roles?: string[];
  kpi_is_active: boolean;
  commission_policies: CommissionPolicyItem[];
}

/**
 * Commission Policy Item - Chính sách hoa hồng
 */
export interface CommissionPolicyItem {
  id: string;
  policy_name: string;
  commission_type: "percentage" | "fixed" | "tiered";
  commission_rate?: number;
  tiers?: CommissionTierConfig[];
  min_threshold?: number;
  max_commission?: number;
  applicable_roles?: string[];
  is_active: boolean;
}

/**
 * Commission Tier Config - Cấu hình bậc thang hoa hồng
 */
export interface CommissionTierConfig {
  from: number;
  to?: number | null;
  rate: number;
  description?: string;
}

/**
 * Employee KPI Result - Kết quả KPI của nhân viên
 */
export interface EmployeeKPIResultItem {
  id: string;
  employee_id: string;
  full_name: string;
  role_name: string;
  kpi_id: string;
  kpi_name: string;
  kpi_type: string;
  period_start: string;
  period_end: string;
  actual_value: number;
  target_value?: number;
  achievement_rate?: number;
  commission_earned: number;
  notes?: string;
  created_at: string;
}

// ==================== LEGACY TYPES (To be deprecated) ====================

/**
 * KPI Metric Type - Loại chỉ số KPI
 * @deprecated Use kpi_type in KPIPolicy instead
 */
export type KPIMetricType =
  | "revenue" // Doanh thu
  | "order_count" // Số đơn hàng
  | "customer_count" // Số khách hàng mới
  | "product_sold" // Số sản phẩm bán được
  | "custom"; // Custom metric

/**
 * KPI Calculation Period - Kỳ tính KPI
 */
export type KPIPeriod = "daily" | "weekly" | "monthly" | "quarterly" | "yearly";

/**
 * KPI Definition - Định nghĩa KPI (hardcoded)
 * Các KPI này được code cứng, không có UI để config
 */
export interface KPIDefinition {
  id: string;
  key: string; // e.g., "sales_monthly_revenue"
  name: string; // e.g., "Doanh thu trong tháng"
  description?: string;
  metric_type: KPIMetricType;
  period: KPIPeriod;
  applicable_roles: string[]; // Roles mà KPI này áp dụng
  calculation_logic: string; // Mô tả logic tính toán (for documentation)
}

/**
 * KPI Result - Kết quả KPI của nhân viên
 * Read-only, được tính toán tự động
 */
export interface KPIResult {
  id: string;
  employee_id: string;
  employee_name: string;
  kpi_definition_id: string;
  kpi_name: string;
  period_start: string; // ISO date
  period_end: string; // ISO date
  actual_value: number; // Giá trị thực tế đạt được
  calculated_at: string; // Thời điểm tính toán
  metadata?: {
    // Additional info for calculation
    order_count?: number;
    total_orders?: number;
    conditions?: string[];
  };
}

/**
 * Commission Tier - Bậc hoa hồng
 */
export interface CommissionTier {
  id: string;
  min_value: number; // Giá trị tối thiểu
  max_value?: number; // Giá trị tối đa (null = unlimited)
  commission_rate: number; // % hoa hồng (0-100)
  description?: string;
}

/**
 * Commission Structure - Cấu trúc hoa hồng
 * Link với KPI để tính hoa hồng
 */
export interface CommissionStructure {
  id: string;
  role_key: string;
  role_title: string;
  kpi_definition_id: string;
  kpi_name: string;
  tiers: CommissionTier[]; // Các bậc hoa hồng
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Commission Result - Kết quả hoa hồng
 * Tính dựa trên KPI Result
 */
export interface CommissionResult {
  id: string;
  employee_id: string;
  employee_name: string;
  commission_structure_id: string;
  kpi_result_id: string;
  kpi_value: number; // Giá trị KPI đạt được
  commission_rate: number; // % hoa hồng áp dụng
  commission_amount: number; // Số tiền hoa hồng
  period_start: string;
  period_end: string;
  calculated_at: string;
}

/**
 * Seniority Policy - Chính sách thâm niên
 * Tự động cộng lương theo thời gian làm việc
 */
export interface SeniorityPolicy {
  id: string;
  name: string;
  description?: string;
  min_years: number; // Số năm tối thiểu
  max_years?: number; // Số năm tối đa (null = unlimited)
  bonus_type: "fixed" | "percentage"; // Fixed amount hoặc %
  bonus_amount: number; // Số tiền thưởng
  applicable_roles?: string[]; // Roles áp dụng (null = all roles)
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Employee Seniority - Thâm niên của nhân viên
 */
export interface EmployeeSeniority {
  employee_id: string;
  employee_name: string;
  role_key: string;
  join_date: string; // Ngày vào làm
  years_of_service: number; // Số năm làm việc (tự động tính)
  applicable_policies: SeniorityPolicy[]; // Các policy áp dụng
  total_seniority_bonus: number; // Tổng thưởng thâm niên
  calculated_at: string;
}

/**
 * Total Compensation - Tổng thu nhập của nhân viên
 * Summary tất cả các khoản
 */
export interface TotalCompensation {
  employee_id: string;
  employee_name: string;
  role_key: string;
  role_title: string;
  period_start: string;
  period_end: string;

  // Lương cơ bản & phụ cấp
  base_salary: number;
  allowances: number;

  // Hoa hồng
  commission: number;

  // Thưởng thâm niên
  seniority_bonus: number;

  // Tổng
  total: number;

  calculated_at: string;
}

/**
 * Predefined KPIs - Các KPI được định nghĩa sẵn
 * Hardcoded, không có UI để config
 */
export const PREDEFINED_KPIS: KPIDefinition[] = [
  {
    id: "kpi_sales_monthly_revenue",
    key: "sales_monthly_revenue",
    name: "Doanh thu trong tháng",
    description:
      "Tổng doanh thu của đơn hàng đã giao và đã nộp tiền trong tháng",
    metric_type: "revenue",
    period: "monthly",
    applicable_roles: ["sales-staff", "sales-manager"],
    calculation_logic:
      "SUM(orders.total) WHERE status='delivered' AND payment_status='paid' AND employee_id=X AND created_at BETWEEN start_date AND end_date",
  },
  {
    id: "kpi_sales_monthly_orders",
    key: "sales_monthly_orders",
    name: "Số đơn hàng trong tháng",
    description: "Số lượng đơn hàng hoàn thành trong tháng",
    metric_type: "order_count",
    period: "monthly",
    applicable_roles: ["sales-staff", "sales-manager"],
    calculation_logic:
      "COUNT(orders) WHERE status='delivered' AND employee_id=X AND created_at BETWEEN start_date AND end_date",
  },
  {
    id: "kpi_inventory_accuracy",
    key: "inventory_accuracy",
    name: "Độ chính xác kiểm kê",
    description: "Tỷ lệ % chính xác trong công tác kiểm kê hàng tháng",
    metric_type: "custom",
    period: "monthly",
    applicable_roles: ["inventory-manager", "inventory-staff"],
    calculation_logic: "(Số sản phẩm khớp / Tổng số sản phẩm kiểm kê) * 100",
  },
  {
    id: "kpi_delivery_on_time",
    key: "delivery_on_time",
    name: "Tỷ lệ giao hàng đúng hạn",
    description: "% đơn hàng giao đúng hoặc trước thời hạn",
    metric_type: "custom",
    period: "monthly",
    applicable_roles: ["delivery-staff", "warehouse-staff"],
    calculation_logic: "(Đơn giao đúng hạn / Tổng đơn giao) * 100",
  },
];
