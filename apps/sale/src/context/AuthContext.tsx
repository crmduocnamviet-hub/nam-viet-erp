import { useState, useEffect, type ReactNode } from "react";
import { supabase } from "@nam-viet-erp/services";
import type { Session, User } from "@supabase/supabase-js";
import { AuthContext } from "./AuthContextDefinition";
import {
  useEmployeeStore,
  useInventoryStore,
  useComboStore,
  usePosStore,
  useAuthStore,
} from "@nam-viet-erp/store";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Get store clear functions
  const clearEmployee = useEmployeeStore((state) => state.setEmployee);
  const clearPermissions = useEmployeeStore((state) => state.setPermissions);
  const clearInventory = useInventoryStore((state) => state.clearInventory);
  const clearCombos = useComboStore((state) => state.setCombos);
  const clearAuthUser = useAuthStore((state) => state.setUser);
  const clearAuthSession = useAuthStore((state) => state.setSession);
  const resetPosStore = usePosStore((state) => state.resetStore);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    // Sign out from Supabase
    await supabase.auth.signOut();

    // Clear all stores
    clearEmployee(null);
    clearPermissions([]);
    clearInventory();
    clearCombos([]);
    clearAuthUser(null);
    clearAuthSession(null);
    resetPosStore();

    // Clear localStorage for all persisted stores
    localStorage.removeItem("inventory-storage");
    localStorage.removeItem("employee-storage");
    localStorage.removeItem("auth-storage");
  };

  const value = {
    session,
    user,
    loading,
    signOut: handleSignOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
