/**
 * Employee Roles Constants
 * Định nghĩa các vai trò nhân viên với title tương ứng
 */

export const EMPLOYEE_ROLES = {
  "sales-staff": "Nhân viên bán hàng",
  "sales-manager": "Quản lý bán hàng",
  "inventory-staff": "Nhân viên kho",
  "inventory-manager": "Quản lý kho",
  "delivery-staff": "Nhân viên giao hàng",
  admin: "Quản trị viên",
  "super-admin": "Quản trị viên cấp cao",
} as const;

export type RoleKey = keyof typeof EMPLOYEE_ROLES;

/**
 * Get role display title from role key
 * @param roleKey - The role key (e.g., 'sales-staff')
 * @returns The display title (e.g., 'Nhân viên bán hàng')
 */
export const getRoleTitle = (roleKey: string): string => {
  return EMPLOYEE_ROLES[roleKey as RoleKey] || roleKey;
};

/**
 * Get array of role options for Select/Checkbox components
 */
export const getRoleOptions = () => {
  return Object.entries(EMPLOYEE_ROLES).map(([value, label]) => ({
    value,
    label,
  }));
};

/**
 * Format array of role keys to display titles
 * @param roles - Array of role keys
 * @returns Comma-separated string of role titles
 */
export const formatRoleTitles = (roles?: string[] | null): string => {
  if (!roles || roles.length === 0) return "Tất cả";
  return roles.map((role) => getRoleTitle(role)).join(", ");
};

/**
 * Measurement Periods Constants
 * Định nghĩa các chu kỳ đo lường với title tiếng Việt
 */
export const MEASUREMENT_PERIODS = {
  daily: "Hàng ngày",
  weekly: "Hàng tuần",
  monthly: "Hàng tháng",
  quarterly: "Hàng quý",
  yearly: "Hàng năm",
} as const;

export type MeasurementPeriodKey = keyof typeof MEASUREMENT_PERIODS;

/**
 * Get measurement period display title
 * @param periodKey - The period key (e.g., 'daily')
 * @returns The display title (e.g., 'Hàng ngày')
 */
export const getMeasurementPeriodTitle = (periodKey: string): string => {
  return MEASUREMENT_PERIODS[periodKey as MeasurementPeriodKey] || periodKey;
};

/**
 * Get array of measurement period options for Select components
 */
export const getMeasurementPeriodOptions = () => {
  return Object.entries(MEASUREMENT_PERIODS).map(([value, label]) => ({
    value,
    label,
  }));
};

/**
 * KPI Types Constants
 * Định nghĩa các loại KPI với title tiếng Việt
 */
export const KPI_TYPES = {
  revenue: "Doanh thu",
  orders: "Số đơn hàng",
  customers: "Số khách hàng",
  products_sold: "Số sản phẩm bán",
  custom: "Tùy chỉnh",
} as const;

export type KPITypeKey = keyof typeof KPI_TYPES;

/**
 * Get KPI type display title
 * @param typeKey - The type key (e.g., 'revenue')
 * @returns The display title (e.g., 'Doanh thu')
 */
export const getKPITypeTitle = (typeKey: string): string => {
  return KPI_TYPES[typeKey as KPITypeKey] || typeKey;
};
