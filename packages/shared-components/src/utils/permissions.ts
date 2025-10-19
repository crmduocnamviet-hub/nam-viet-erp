import { SCREEN_REGISTRY } from "../screens";

export interface PermissionGroup {
  category: string;
  displayName: string;
  permissions: string[];
}

/**
 * Extract all unique permissions from SCREEN_REGISTRY
 */
export const getAllPermissions = (): string[] => {
  const permissionsSet = new Set<string>();

  Object.values(SCREEN_REGISTRY).forEach((screen) => {
    screen.permissions.forEach((permission) => {
      permissionsSet.add(permission);
    });
  });

  return Array.from(permissionsSet).sort();
};

/**
 * Group permissions by category (first part before dot)
 */
export const getPermissionsByCategory = (): PermissionGroup[] => {
  const allPermissions = getAllPermissions();
  const categoryMap = new Map<string, Set<string>>();

  allPermissions.forEach((permission) => {
    const [category] = permission.split(".");
    if (!categoryMap.has(category)) {
      categoryMap.set(category, new Set());
    }
    categoryMap.get(category)!.add(permission);
  });

  const categoryDisplayNames: Record<string, string> = {
    pos: "Bán hàng (POS)",
    b2b: "Bán buôn (B2B)",
    medical: "Y tế",
    patients: "Bệnh nhân",
    appointments: "Lịch hẹn",
    inventory: "Kho - Sản phẩm",
    products: "Sản phẩm",
    "purchase-orders": "Đơn đặt hàng",
    warehouse: "Kho",
    financial: "Tài chính",
    transactions: "Giao dịch",
    funds: "Quỹ",
    ledger: "Sổ quỹ",
    marketing: "Marketing",
    promotions: "Khuyến mại",
    campaigns: "Chiến dịch",
    segments: "Phân khúc KH",
    content: "Nội dung",
    chatbot: "Chatbot",
    vouchers: "Mã giảm giá",
    management: "Quản lý",
    employees: "Nhân viên",
    users: "Tài khoản",
    rooms: "Phòng ban",
    dashboard: "Tổng quan",
    sales: "Bán hàng",
    quotes: "Báo giá",
    delivery: "Giao hàng",
    shipping: "Vận chuyển",
    settings: "Cài đặt",
  };

  return Array.from(categoryMap.entries())
    .map(([category, permissions]) => ({
      category,
      displayName: categoryDisplayNames[category] || category,
      permissions: Array.from(permissions).sort(),
    }))
    .sort((a, b) => a.displayName.localeCompare(b.displayName, "vi"));
};

/**
 * Get display name for a permission
 */
export const getPermissionDisplayName = (permission: string): string => {
  const permissionDisplayNames: Record<string, string> = {
    access: "Truy cập",
    view: "Xem",
    create: "Tạo mới",
    update: "Cập nhật",
    delete: "Xóa",
    manage: "Quản lý",
    edit: "Chỉnh sửa",
  };

  const parts = permission.split(".");
  const action = parts[parts.length - 1];

  return permissionDisplayNames[action] || permission;
};

/**
 * Check if an employee has a specific permission
 */
export const hasPermission = (
  employeePermissions: string[] | undefined,
  requiredPermission: string,
): boolean => {
  if (!employeePermissions) return false;
  return employeePermissions.includes(requiredPermission);
};

/**
 * Check if an employee has all required permissions
 */
export const hasAllPermissions = (
  employeePermissions: string[] | undefined,
  requiredPermissions: string[],
): boolean => {
  if (!employeePermissions) return false;
  return requiredPermissions.every((permission) =>
    employeePermissions.includes(permission),
  );
};

/**
 * Check if an employee has any of the required permissions
 */
export const hasAnyPermission = (
  employeePermissions: string[] | undefined,
  requiredPermissions: string[],
): boolean => {
  if (!employeePermissions) return false;
  return requiredPermissions.some((permission) =>
    employeePermissions.includes(permission),
  );
};
