import { supabase } from "./supabase";
import { getCurrentEmployee } from "./employeeService";

export const signOut = async () => {
  await supabase.auth.signOut();
};

export const signIn = async (email: string, password: string) => {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    return { data: null, error: authError };
  }

  // Fetch employee data for the signed-in user
  const { data: employee, error: employeeError } = await getCurrentEmployee();

  return {
    data: {
      user: authData.user,
      session: authData.session,
      employee,
    },
    error: employeeError,
  };
};

export const getCurrentUser = async () => {
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return { data: null, error: userError };
  }

  const { data: employee, error: employeeError } = await getCurrentEmployee();

  return {
    data: {
      user,
      employee,
    },
    error: employeeError,
  };
};

// Note: Patient search and management functions have been moved to patientService.ts
// All patient-related operations now use the patients table instead of profiles
