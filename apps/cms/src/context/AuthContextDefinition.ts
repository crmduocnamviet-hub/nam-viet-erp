import { createContext } from "react";
import type { Session, User } from "@supabase/supabase-js";

// Define the "shape" of the context
export interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
}

// Create Context
export const AuthContext = createContext<AuthContextType | undefined>(undefined);