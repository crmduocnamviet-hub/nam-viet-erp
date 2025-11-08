import React, { ReactNode } from "react";
import { Result, Button } from "antd";
import { LockOutlined } from "@ant-design/icons";
import { usePermission } from "../hooks/usePermission";

export interface PermissionGuardProps {
  /**
   * Required permissions - user must have ALL of these
   */
  permissions?: string[];

  /**
   * Alternative permissions - user must have ANY of these
   */
  anyPermissions?: string[];

  /**
   * Screen key to check permission for
   */
  screenKey?: string;

  /**
   * Children to render if user has permission
   */
  children: ReactNode;

  /**
   * Fallback content to render if user doesn't have permission
   * If not provided, nothing will be rendered
   */
  fallback?: ReactNode;

  /**
   * If true, show access denied page instead of hiding content
   */
  showDenied?: boolean;

  /**
   * Custom access denied message
   */
  deniedMessage?: string;
}

/**
 * Component to guard content based on user permissions
 *
 * @example
 * // Require specific permission
 * <PermissionGuard permissions={["roles.create"]}>
 *   <Button>Create Role</Button>
 * </PermissionGuard>
 *
 * @example
 * // Require ANY of the permissions
 * <PermissionGuard anyPermissions={["roles.edit", "roles.create"]}>
 *   <RoleForm />
 * </PermissionGuard>
 *
 * @example
 * // Check screen permission
 * <PermissionGuard screenKey="management.roles" showDenied>
 *   <RoleManagementPage />
 * </PermissionGuard>
 */
const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permissions,
  anyPermissions,
  screenKey,
  children,
  fallback,
  showDenied = false,
  deniedMessage = "Bạn không có quyền truy cập tính năng này",
}) => {
  const { hasAllPermissions, hasAnyPermission, canAccessScreen } =
    usePermission();

  // Determine if user has access
  let hasAccess = true;

  if (screenKey) {
    hasAccess = canAccessScreen(screenKey);
  } else if (permissions && permissions.length > 0) {
    hasAccess = hasAllPermissions(permissions);
  } else if (anyPermissions && anyPermissions.length > 0) {
    hasAccess = hasAnyPermission(anyPermissions);
  }

  // If user has access, render children
  if (hasAccess) {
    return <>{children}</>;
  }

  // If user doesn't have access
  if (showDenied) {
    return (
      <Result
        status="403"
        icon={<LockOutlined />}
        title="403"
        subTitle={deniedMessage}
        extra={
          <Button type="primary" onClick={() => window.history.back()}>
            Quay lại
          </Button>
        }
      />
    );
  }

  // Render fallback or nothing
  return <>{fallback || null}</>;
};

export default PermissionGuard;
