import { useState, useEffect, type ReactNode } from "react";
import { supabase } from "@nam-viet-erp/services";
import type { Session, User } from "@supabase/supabase-js";
import { AuthContext } from "./AuthContextDefinition";

// AuthProvider component - "Người quản lý" trạng thái đăng nhập
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Lắng nghe các thay đổi về trạng thái đăng nhập (đăng nhập, đăng xuất...)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Dọn dẹp listener khi component bị unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value = {
    session,
    user,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// The useAuth hook has been moved to src/hooks/useAuth.ts
// to comply with react-refresh/only-export-components rule
