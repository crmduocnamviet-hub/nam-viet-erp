import React, { ComponentType } from "react";
import PermissionGuard, {
  PermissionGuardProps,
} from "../components/PermissionGuard";

export interface WithPermissionOptions {
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
   * If true, show access denied page instead of redirecting
   */
  showDenied?: boolean;

  /**
   * Custom access denied message
   */
  deniedMessage?: string;
}

/**
 * Higher Order Component to wrap a component with permission checking
 *
 * @param Component - Component to wrap
 * @param options - Permission checking options
 * @returns Wrapped component with permission checking
 *
 * @example
 * // Wrap a component to require specific permissions
 * const ProtectedRoleForm = withPermission(RoleForm, {
 *   permissions: ["roles.create", "roles.edit"]
 * });
 *
 * @example
 * // Wrap a page component with screen permission
 * const ProtectedRolePage = withPermission(RoleManagementPage, {
 *   screenKey: "management.roles",
 *   showDenied: true
 * });
 */
export function withPermission<P extends object>(
  Component: ComponentType<P>,
  options: WithPermissionOptions,
): ComponentType<P> {
  const WrappedComponent: React.FC<P> = (props) => {
    return (
      <PermissionGuard
        permissions={options.permissions}
        anyPermissions={options.anyPermissions}
        screenKey={options.screenKey}
        showDenied={options.showDenied}
        deniedMessage={options.deniedMessage}
      >
        <Component {...props} />
      </PermissionGuard>
    );
  };

  // Set display name for debugging
  const componentName = Component.displayName || Component.name || "Component";
  WrappedComponent.displayName = `withPermission(${componentName})`;

  return WrappedComponent;
}

/**
 * HOC specifically for requiring ALL permissions
 */
export function requireAllPermissions<P extends object>(
  Component: ComponentType<P>,
  permissions: string[],
  showDenied = true,
): ComponentType<P> {
  return withPermission(Component, { permissions, showDenied });
}

/**
 * HOC specifically for requiring ANY permissions
 */
export function requireAnyPermission<P extends object>(
  Component: ComponentType<P>,
  anyPermissions: string[],
  showDenied = true,
): ComponentType<P> {
  return withPermission(Component, { anyPermissions, showDenied });
}

/**
 * HOC specifically for screen permission checking
 */
export function requireScreenAccess<P extends object>(
  Component: ComponentType<P>,
  screenKey: string,
  showDenied = true,
): ComponentType<P> {
  return withPermission(Component, { screenKey, showDenied });
}
