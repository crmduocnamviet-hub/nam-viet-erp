import { supabaseAdmin, supabase } from "./supabase";
import type {
  PostgrestSingleResponse,
  PostgrestResponse,
} from "@supabase/supabase-js";

// Get all users with optional filtering
export const getUsers = async (filters?: {
  search?: string;
  limit?: number;
  offset?: number;
}) => {
  const { data, error } = await supabaseAdmin.auth.admin.listUsers();

  if (error) {
    return {
      data: null,
      error: error as any,
      count: null,
      status: 500,
      statusText: "Error",
    };
  }

  let users = data?.users || [];

  // Apply search filter
  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    users = users.filter(
      (user) =>
        user.email?.toLowerCase().includes(searchLower) ||
        user.user_metadata?.full_name?.toLowerCase().includes(searchLower) ||
        user.user_metadata?.phone?.includes(searchLower),
    );
  }

  // Manually apply limit and offset as listUsers does not support them directly
  const totalCount = users.length;
  const startIndex = filters?.offset || 0;
  const endIndex = filters?.limit ? startIndex + filters.limit : totalCount;
  const paginatedUsers = users.slice(startIndex, endIndex);

  const transformedUsers: IUserAccount[] = paginatedUsers.map((user) => ({
    id: user.id,
    email: user.email || "",
    full_name: user.user_metadata?.full_name,
    phone: user.user_metadata?.phone,
    avatar_url: user.user_metadata?.avatar_url,
    created_at: user.created_at,
    updated_at: user.updated_at,
    last_sign_in_at: user.last_sign_in_at,
  }));

  // Get employee info for users
  const usersWithEmployeeInfo = await getEmployeeInfoForUsers(transformedUsers);

  return { data: usersWithEmployeeInfo, error: null };
};

// Helper function to get employee info for users
const getEmployeeInfoForUsers = async (
  users: IUserAccount[],
): Promise<IUserAccount[]> => {
  // Get all employees that are linked to these users
  const userIds = users.map((u) => u.id);

  if (userIds.length === 0) {
    return users;
  }

  const { data: employees } = await supabase
    .from("employees")
    .select("employee_id, role_name, user_id")
    .in("user_id", userIds);

  // Map employee info to users
  return users.map((user) => {
    const employee = employees?.find((emp) => emp.user_id === user.id);
    if (employee) {
      return {
        ...user,
        role: employee.role_name,
        employee_id: employee.employee_id,
      };
    }
    return user;
  });
};

// Get user by ID
export const getUserById = async (
  userId: string,
): Promise<PostgrestSingleResponse<IUserAccount | null>> => {
  const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);

  if (error || !data?.user) {
    return {
      data: null,
      error: error as any,
      count: null,
      status: 500,
      statusText: "Error",
    };
  }

  const user = data.user;
  const transformedUser: IUserAccount = {
    id: user.id,
    email: user.email || "",
    full_name: user.user_metadata?.full_name,
    phone: user.user_metadata?.phone,
    avatar_url: user.user_metadata?.avatar_url,
    created_at: user.created_at,
    updated_at: user.updated_at,
    last_sign_in_at: user.last_sign_in_at,
  };

  return {
    data: transformedUser,
    error: null,
    count: null,
    status: 200,
    statusText: "OK",
  };
};

// Create user account
export const createUserAccount = async (
  userData: IUserAccountForm,
): Promise<PostgrestSingleResponse<IUserAccount | null>> => {
  // Create user first
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: userData.email,
    password: userData.password,
    email_confirm: true, // Auto-confirm email
    user_metadata: {
      full_name: userData.full_name,
      phone: userData.phone,
    },
  });

  if (error || !data?.user) {
    return {
      data: null,
      error: error as any,
      count: null,
      status: 500,
      statusText: "Error",
    };
  }

  const user = data.user;

  // Get updated user data
  const { data: updatedUserData, error: updateError } =
    await supabaseAdmin.auth.admin.getUserById(user.id);

  if (updateError || !updatedUserData?.user) {
    // If update failed, return original user data
    const transformedUser: IUserAccount = {
      id: user.id,
      email: user.email || "",
      full_name: user.user_metadata?.full_name,
      phone: user.user_metadata?.phone,
      avatar_url: user.user_metadata?.avatar_url,
      created_at: user.created_at,
      updated_at: user.updated_at,
      last_sign_in_at: user.last_sign_in_at,
    };
    return {
      data: transformedUser,
      error: null,
      count: null,
      status: 200,
      statusText: "OK",
    };
  }

  const updatedUser = updatedUserData.user;
  const transformedUser: IUserAccount = {
    id: updatedUser.id,
    email: updatedUser.email || "",
    full_name: updatedUser.user_metadata?.full_name,
    phone: updatedUser.user_metadata?.phone,
    avatar_url: updatedUser.user_metadata?.avatar_url,
    created_at: updatedUser.created_at,
    updated_at: updatedUser.updated_at,
    last_sign_in_at: updatedUser.last_sign_in_at,
  };

  return {
    data: transformedUser,
    error: null,
    count: null,
    status: 200,
    statusText: "OK",
  };
};

// Update user account
export const updateUserAccount = async (
  userId: string,
  updates: Partial<IUserAccountForm>,
): Promise<PostgrestSingleResponse<IUserAccount | null>> => {
  const updateData: any = {};

  if (updates.email) updateData.email = updates.email;
  if (updates.password) updateData.password = updates.password;

  updateData.user_metadata = {};
  if (updates.full_name !== undefined)
    updateData.user_metadata.full_name = updates.full_name;
  if (updates.phone !== undefined)
    updateData.user_metadata.phone = updates.phone;

  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
    userId,
    updateData,
  );

  if (error || !data?.user) {
    return {
      data: null,
      error: error as any,
      count: null,
      status: 500,
      statusText: "Error",
    };
  }

  const user = data.user;
  const transformedUser: IUserAccount = {
    id: user.id,
    email: user.email || "",
    full_name: user.user_metadata?.full_name,
    phone: user.user_metadata?.phone,
    avatar_url: user.user_metadata?.avatar_url,
    created_at: user.created_at,
    updated_at: user.updated_at,
    last_sign_in_at: user.last_sign_in_at,
  };

  return {
    data: transformedUser,
    error: null,
    count: null,
    status: 200,
    statusText: "OK",
  };
};

// Delete user account
export const deleteUserAccount = async (
  userId: string,
): Promise<PostgrestResponse<null>> => {
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
  return {
    data: null,
    error: error as any,
    count: null,
    status: 200,
    statusText: "OK",
  };
};

// Search users for linking with employees
export const searchUsersForLinking = async (
  searchTerm: string,
): Promise<{ data: IUserAccount[] | null; error: any }> => {
  // Always load users, with optional search filter
  const { data, error } = await getUsers({
    search: searchTerm || undefined, // Use undefined if searchTerm is empty
    limit: 50, // Increase limit to get more users
  });

  if (error) {
    console.error("Error in searchUsersForLinking:", error);
    return { data: null, error: error as any };
  }

  return { data: data || [], error: null };
};
