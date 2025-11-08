import { useEmployeeStore } from "@nam-viet-erp/store";
import { hasScreenPermission } from "../screens";

/**
 * Hook to check if user has specific permissions
 * @returns Object with permission checking utilities
 */
export const usePermission = () => {
  const permissions = useEmployeeStore((state) => state.permissions);

  /**
   * Check if user has a specific permission
   * @param permission - Single permission to check
   * @returns boolean
   */
  const hasPermission = (permission: string): boolean => {
    return permissions.includes(permission);
  };

  /**
   * Check if user has ALL of the specified permissions
   * @param requiredPermissions - Array of permissions to check
   * @returns boolean
   */
  const hasAllPermissions = (requiredPermissions: string[]): boolean => {
    return requiredPermissions.every((permission) =>
      permissions.includes(permission),
    );
  };

  /**
   * Check if user has ANY of the specified permissions
   * @param requiredPermissions - Array of permissions to check
   * @returns boolean
   */
  const hasAnyPermission = (requiredPermissions: string[]): boolean => {
    if (requiredPermissions.length === 0) return true;
    return requiredPermissions.some((permission) =>
      permissions.includes(permission),
    );
  };

  /**
   * Check if user has permission to access a screen
   * @param screenKey - Screen key to check (e.g., "management.roles")
   * @returns boolean
   */
  const canAccessScreen = (screenKey: string): boolean => {
    return hasScreenPermission(screenKey, permissions);
  };

  /**
   * Get all user permissions
   * @returns Array of permission strings
   */
  const getAllPermissions = (): string[] => {
    return permissions;
  };

  return {
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    canAccessScreen,
    getAllPermissions,
    permissions, // Direct access to permissions array
  };
};

/**
 * Hook specifically for checking action permissions (create, edit, delete, view)
 * @param resource - Resource name (e.g., "roles", "users", "products")
 * @returns Object with action permission checkers
 */
export const useResourcePermission = (resource: string) => {
  const { hasPermission } = usePermission();

  return {
    canView: hasPermission(`${resource}.view`),
    canCreate: hasPermission(`${resource}.create`),
    canEdit: hasPermission(`${resource}.edit`),
    canDelete: hasPermission(`${resource}.delete`),
    canManage: hasPermission(`${resource}.manage`),
  };
};
