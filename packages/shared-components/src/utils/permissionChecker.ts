import { message } from "antd";
import { useEmployeeStore } from "@nam-viet-erp/store";

/**
 * Options for permission checking
 */
export interface PermissionCheckOptions {
  /**
   * Custom error message when permission is denied
   */
  deniedMessage?: string;

  /**
   * If true, check if user has ANY of the permissions (OR logic)
   * If false, check if user has ALL permissions (AND logic)
   * Default: false (requires ALL permissions)
   */
  requireAny?: boolean;

  /**
   * If true, don't show notification when permission is denied
   * Default: false (show notification)
   */
  silent?: boolean;
}

/**
 * Get current user permissions from employee store
 */
const getUserPermissions = (): string[] => {
  return useEmployeeStore.getState().permissions;
};

/**
 * Check if user has the required permission(s)
 */
const hasPermission = (
  requiredPermissions: string | string[],
  options: PermissionCheckOptions = {},
): boolean => {
  const userPermissions = getUserPermissions();
  const permissions = Array.isArray(requiredPermissions)
    ? requiredPermissions
    : [requiredPermissions];

  if (permissions.length === 0) return true;

  if (options.requireAny) {
    // Check if user has ANY of the permissions (OR logic)
    return permissions.some((perm) => userPermissions.includes(perm));
  } else {
    // Check if user has ALL permissions (AND logic)
    return permissions.every((perm) => userPermissions.includes(perm));
  }
};

/**
 * Check permission and execute callback if user has permission
 *
 * @param requiredPermissions - Single permission or array of permissions
 * @param callback - Function to execute if user has permission
 * @param options - Additional options for permission checking
 * @returns Result of callback if executed, undefined otherwise
 *
 * @example
 * // Single permission
 * checkPermissionAndExecute("roles.create", () => {
 *   createRole(data);
 * });
 *
 * @example
 * // Multiple permissions (requires ALL)
 * checkPermissionAndExecute(["roles.create", "roles.edit"], () => {
 *   saveRole(data);
 * });
 *
 * @example
 * // Multiple permissions (requires ANY)
 * checkPermissionAndExecute(
 *   ["roles.edit", "roles.delete"],
 *   () => modifyRole(data),
 *   { requireAny: true }
 * );
 *
 * @example
 * // With custom error message
 * checkPermissionAndExecute(
 *   "roles.delete",
 *   () => deleteRole(id),
 *   { deniedMessage: "Chỉ admin mới có quyền xóa vai trò" }
 * );
 *
 * @example
 * // Async callback
 * await checkPermissionAndExecute("roles.create", async () => {
 *   await createRoleAPI(data);
 * });
 */
export const checkPermissionAndExecute = <T = any>(
  requiredPermissions: string | string[],
  callback: () => T | Promise<T>,
  options: PermissionCheckOptions = {},
): T | Promise<T> | undefined => {
  const {
    deniedMessage = "Bạn không có quyền thực hiện thao tác này",
    requireAny = false,
    silent = false,
  } = options;

  // Check permission
  if (hasPermission(requiredPermissions, { requireAny })) {
    // Has permission - execute callback
    return callback();
  } else {
    // No permission - show notification and return undefined
    if (!silent) {
      message.error(deniedMessage);
    }
    return undefined;
  }
};

/**
 * Check permission for CREATE action and execute callback
 *
 * @param resource - Resource name (e.g., "roles", "users", "products")
 * @param callback - Function to execute if has permission
 * @param customMessage - Optional custom error message
 */
export const checkAndCreate = <T = any>(
  resource: string,
  callback: () => T | Promise<T>,
  customMessage?: string,
): T | Promise<T> | undefined => {
  return checkPermissionAndExecute(`${resource}.create`, callback, {
    deniedMessage: customMessage || `Bạn không có quyền tạo ${resource} mới`,
  });
};

/**
 * Check permission for EDIT/UPDATE action and execute callback
 *
 * @param resource - Resource name (e.g., "roles", "users", "products")
 * @param callback - Function to execute if has permission
 * @param customMessage - Optional custom error message
 */
export const checkAndEdit = <T = any>(
  resource: string,
  callback: () => T | Promise<T>,
  customMessage?: string,
): T | Promise<T> | undefined => {
  return checkPermissionAndExecute(
    [`${resource}.edit`, `${resource}.update`],
    callback,
    {
      deniedMessage:
        customMessage || `Bạn không có quyền chỉnh sửa ${resource}`,
      requireAny: true, // Has either edit OR update permission
    },
  );
};

/**
 * Check permission for DELETE action and execute callback
 *
 * @param resource - Resource name (e.g., "roles", "users", "products")
 * @param callback - Function to execute if has permission
 * @param customMessage - Optional custom error message
 */
export const checkAndDelete = <T = any>(
  resource: string,
  callback: () => T | Promise<T>,
  customMessage?: string,
): T | Promise<T> | undefined => {
  return checkPermissionAndExecute(`${resource}.delete`, callback, {
    deniedMessage: customMessage || `Bạn không có quyền xóa ${resource}`,
  });
};

/**
 * Check permission for VIEW action and execute callback
 *
 * @param resource - Resource name (e.g., "roles", "users", "products")
 * @param callback - Function to execute if has permission
 * @param customMessage - Optional custom error message
 */
export const checkAndView = <T = any>(
  resource: string,
  callback: () => T | Promise<T>,
  customMessage?: string,
): T | Promise<T> | undefined => {
  return checkPermissionAndExecute(`${resource}.view`, callback, {
    deniedMessage: customMessage || `Bạn không có quyền xem ${resource}`,
  });
};

/**
 * Check if user has permission (without executing callback)
 * This is a pure check function that returns boolean
 *
 * @param requiredPermissions - Single permission or array of permissions
 * @param requireAny - If true, check ANY (OR), if false check ALL (AND)
 * @returns true if user has permission, false otherwise
 */
export const checkPermission = (
  requiredPermissions: string | string[],
  requireAny = false,
): boolean => {
  return hasPermission(requiredPermissions, { requireAny });
};

/**
 * Check and execute with custom permission logic
 * Useful for complex permission requirements
 *
 * @param permissionCheck - Custom function that returns boolean
 * @param callback - Function to execute if permission check passes
 * @param deniedMessage - Error message if permission denied
 */
export const checkCustomAndExecute = <T = any>(
  permissionCheck: () => boolean,
  callback: () => T | Promise<T>,
  deniedMessage = "Bạn không có quyền thực hiện thao tác này",
): T | Promise<T> | undefined => {
  if (permissionCheck()) {
    return callback();
  } else {
    message.error(deniedMessage);
    return undefined;
  }
};
