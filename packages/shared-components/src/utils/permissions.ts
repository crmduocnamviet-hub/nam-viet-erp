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
 * Check if employee is super admin or admin
 * Both super-admin and admin have ALL permissions automatically
 * Valid roles: super-admin, admin, sales-staff, inventory-staff, delivery-staff, medical-staff
 */
export const isSuperAdmin = (
  employee: IEmployee | null | undefined,
): boolean => {
  if (!employee) return false;

  const role = employee.role_name;
  return role === "super-admin" || role === "admin";
};

/**
 * Check if employee can edit B2B order based on status and role
 * Uses role_name instead of permissions for simpler logic
 */
export const canEditB2BOrderStatus = (
  employee: IEmployee | null | undefined,
  currentStatus: string,
): boolean => {
  if (!employee) return false;

  // Super admin and admin can edit any status
  if (isSuperAdmin(employee)) return true;

  const role = employee.role_name;

  // Define status ranges for each role
  const SALE_STATUSES = [
    "draft",
    "sent",
    "negotiating",
    "accepted",
    "cancelled",
    "rejected",
    "expired",
  ];

  const INVENTORY_STATUSES = ["accepted", "pending_packaging", "packaged"];

  const DELIVERY_STATUSES = ["packaged", "shipping", "completed"];

  // Check if current status is in employee's authorized range based on role
  if (role === "sales-staff" && SALE_STATUSES.includes(currentStatus))
    return true;
  if (role === "inventory-staff" && INVENTORY_STATUSES.includes(currentStatus))
    return true;
  if (role === "delivery-staff" && DELIVERY_STATUSES.includes(currentStatus))
    return true;

  return false;
};

/**
 * Get allowed statuses for B2B order based on employee role
 * Uses role_name instead of permissions for simpler logic
 */
export const getAllowedB2BStatuses = (
  employee: IEmployee | null | undefined,
  currentStatus?: string,
): string[] => {
  if (!employee) return [];

  // Super admin and admin can access all statuses
  if (isSuperAdmin(employee)) {
    return [
      "draft",
      "sent",
      "negotiating",
      "accepted",
      "cancelled",
      "rejected",
      "expired",
      "pending_packaging",
      "packaged",
      "shipping",
      "completed",
    ];
  }

  const role = employee.role_name;

  const SALE_STATUSES = [
    "draft",
    "sent",
    "negotiating",
    "accepted",
    "cancelled",
    "rejected",
    "expired",
  ];

  const INVENTORY_STATUSES = ["accepted", "pending_packaging", "packaged"];

  const DELIVERY_STATUSES = ["packaged", "shipping", "completed"];

  let allowedStatuses: string[] = [];

  // Assign statuses based on employee role
  if (role === "sales-staff") {
    allowedStatuses = SALE_STATUSES;
  } else if (role === "inventory-staff") {
    allowedStatuses = INVENTORY_STATUSES;
  } else if (role === "delivery-staff") {
    allowedStatuses = DELIVERY_STATUSES;
  }

  // If editing an existing order, check if current status is in employee's range
  if (currentStatus) {
    const isCurrentStatusInUserRange = allowedStatuses.includes(currentStatus);

    // If current status is NOT in employee's range, they can only view it
    if (!isCurrentStatusInUserRange) {
      return [currentStatus]; // Read-only
    }
  }

  return allowedStatuses;
};
