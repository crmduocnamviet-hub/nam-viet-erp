// src/context/PermissionContext.tsx

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "./AuthContext";

interface PermissionContextType {
  permissions: Set<string>;
  loading: boolean;
  hasPermission: (permissionName: string) => boolean;
}

const PermissionContext = createContext<PermissionContextType | undefined>(
  undefined
);

export const PermissionProvider = ({ children }: { children: ReactNode }) => {
  const { user, session } = useAuth();
  const [permissions, setPermissions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPermissions = async () => {
      if (!user) {
        setPermissions(new Set());
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Lấy vai trò của người dùng
        const { data: userRoles, error: rolesError } = await supabase
          .from("user_roles")
          .select("role_id")
          .eq("user_id", user.id);

        if (rolesError) throw rolesError;

        const roleIds = userRoles.map((ur) => ur.role_id);

        if (roleIds.length === 0) {
          setPermissions(new Set());
          setLoading(false);
          return;
        }

        // Lấy tất cả quyền hạn từ các vai trò đó
        const { data: rolePermissions, error: permissionsError } =
          await supabase
            .from("role_permissions")
            .select("permissions(name)")
            .in("role_id", roleIds);

        if (permissionsError) throw permissionsError;

        const userPermissions = new Set(
          rolePermissions.map((rp) => rp.permissions.name)
        );
        setPermissions(userPermissions);
      } catch (error: any) {
        console.error("Lỗi khi tải quyền hạn:", error.message);
        setPermissions(new Set());
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchPermissions();
    } else {
      setLoading(false);
    }
  }, [user, session]);

  const hasPermission = (permissionName: string) => {
    return permissions.has(permissionName);
  };

  const value = { permissions, loading, hasPermission };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};

export const usePermissions = () => {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error("usePermissions must be used within a PermissionProvider");
  }
  return context;
};
