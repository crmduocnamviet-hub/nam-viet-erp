import { supabase } from "./supabase";

// ==================== SALARY GRADES ====================

export const getSalaryGrades = async () => {
  const response = await supabase
    .from("salary_grades_with_allowances")
    .select("*")
    .order("base_salary", { ascending: false });

  return response;
};

export const getSalaryGradeById = async (id: string) => {
  const response = await supabase
    .from("salary_grades_with_allowances")
    .select("*")
    .eq("id", id)
    .single();

  return response;
};

export const createSalaryGrade = async (data: {
  grade_name: string;
  base_salary: number;
  description?: string;
  allowances: Array<{ name: string; amount: number }>;
}) => {
  // 1. Create salary grade
  const { data: gradeData, error: gradeError } = await supabase
    .from("salary_grades")
    .insert({
      grade_name: data.grade_name,
      base_salary: data.base_salary,
      description: data.description,
      is_active: true,
    })
    .select()
    .single();

  if (gradeError) {
    return { data: null, error: gradeError };
  }

  // 2. Create allowances if any
  if (data.allowances && data.allowances.length > 0) {
    const allowancesData = data.allowances.map((allowance) => ({
      salary_grade_id: gradeData.id,
      name: allowance.name,
      amount: allowance.amount,
    }));

    const { error: allowancesError } = await supabase
      .from("salary_grade_allowances")
      .insert(allowancesData);

    if (allowancesError) {
      // Rollback: delete the grade if allowances failed
      await supabase.from("salary_grades").delete().eq("id", gradeData.id);
      return { data: null, error: allowancesError };
    }
  }

  // 3. Return the complete salary grade with allowances
  const result = await getSalaryGradeById(gradeData.id);
  return result;
};

export const updateSalaryGrade = async (
  id: string,
  data: {
    grade_name?: string;
    base_salary?: number;
    description?: string;
    is_active?: boolean;
    allowances?: Array<{ id?: string; name: string; amount: number }>;
  },
) => {
  // 1. Update salary grade basic info
  const gradeUpdateData: any = {};
  if (data.grade_name !== undefined)
    gradeUpdateData.grade_name = data.grade_name;
  if (data.base_salary !== undefined)
    gradeUpdateData.base_salary = data.base_salary;
  if (data.description !== undefined)
    gradeUpdateData.description = data.description;
  if (data.is_active !== undefined) gradeUpdateData.is_active = data.is_active;

  if (Object.keys(gradeUpdateData).length > 0) {
    const { error: gradeError } = await supabase
      .from("salary_grades")
      .update(gradeUpdateData)
      .eq("id", id);

    if (gradeError) {
      return { data: null, error: gradeError };
    }
  }

  // 2. Update allowances if provided
  if (data.allowances !== undefined) {
    // Delete all existing allowances
    const { error: deleteError } = await supabase
      .from("salary_grade_allowances")
      .delete()
      .eq("salary_grade_id", id);

    if (deleteError) {
      return { data: null, error: deleteError };
    }

    // Insert new allowances
    if (data.allowances.length > 0) {
      const allowancesData = data.allowances.map((allowance) => ({
        salary_grade_id: id,
        name: allowance.name,
        amount: allowance.amount,
      }));

      const { error: insertError } = await supabase
        .from("salary_grade_allowances")
        .insert(allowancesData);

      if (insertError) {
        return { data: null, error: insertError };
      }
    }
  }

  // 3. Return the updated salary grade with allowances
  const result = await getSalaryGradeById(id);
  return result;
};

export const deleteSalaryGrade = async (id: string) => {
  const response = await supabase.from("salary_grades").delete().eq("id", id);

  return response;
};

export const toggleSalaryGradeStatus = async (id: string) => {
  // Get current status
  const { data: currentGrade } = await supabase
    .from("salary_grades")
    .select("is_active")
    .eq("id", id)
    .single();

  if (!currentGrade) {
    return { data: null, error: { message: "Salary grade not found" } };
  }

  // Toggle status
  const response = await supabase
    .from("salary_grades")
    .update({ is_active: !currentGrade.is_active })
    .eq("id", id)
    .select()
    .single();

  return response;
};

// ==================== EMPLOYEE SALARY ASSIGNMENT ====================

export const assignSalaryGradeToEmployee = async (
  employeeId: string,
  salaryGradeId: string | null,
) => {
  const response = await supabase
    .from("employees")
    .update({ salary_grade_id: salaryGradeId })
    .eq("employee_id", employeeId)
    .select()
    .single();

  return response;
};

export const getEmployeesWithSalary = async () => {
  const response = await supabase
    .from("employees_with_salary")
    .select("*")
    .order("full_name", { ascending: true });

  return response;
};

export const getEmployeeBySalaryGrade = async (salaryGradeId: string) => {
  const response = await supabase
    .from("employees_with_salary")
    .select("*")
    .eq("salary_grade_id", salaryGradeId)
    .order("full_name", { ascending: true });

  return response;
};

// ==================== SALARY STATISTICS ====================

export const getSalaryGradeStatistics = async () => {
  const response = await supabase
    .from("salary_grade_statistics")
    .select("*")
    .order("base_salary", { ascending: false });

  return response;
};

export const getEmployeeSalaryHistory = async (employeeId: string) => {
  const response = await supabase
    .from("employee_salary_history")
    .select("*")
    .eq("employee_id", employeeId)
    .order("changed_at", { ascending: false });

  return response;
};

// ==================== KPI POLICIES ====================

export const getKPIPolicies = async () => {
  const response = await supabase
    .from("kpi_with_commission_policies")
    .select("*")
    .order("kpi_name", { ascending: true });

  return response;
};

export const getKPIPolicyById = async (id: string) => {
  const response = await supabase
    .from("kpi_with_commission_policies")
    .select("*")
    .eq("kpi_id", id)
    .single();

  return response;
};

export const createKPIPolicy = async (data: {
  name: string;
  description?: string;
  kpi_type: string;
  calculation_logic?: any;
  target_value?: number;
  measurement_period: string;
  applicable_roles?: string[];
}) => {
  const response = await supabase
    .from("kpi_policies")
    .insert({
      name: data.name,
      description: data.description,
      kpi_type: data.kpi_type,
      calculation_logic: data.calculation_logic,
      target_value: data.target_value,
      measurement_period: data.measurement_period,
      applicable_roles: data.applicable_roles,
      is_active: true,
    })
    .select()
    .single();

  return response;
};

export const updateKPIPolicy = async (
  id: string,
  data: {
    name?: string;
    description?: string;
    kpi_type?: string;
    calculation_logic?: any;
    target_value?: number;
    measurement_period?: string;
    applicable_roles?: string[];
    is_active?: boolean;
  },
) => {
  const response = await supabase
    .from("kpi_policies")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  return response;
};

export const deleteKPIPolicy = async (id: string) => {
  const response = await supabase.from("kpi_policies").delete().eq("id", id);

  return response;
};

// ==================== COMMISSION POLICIES ====================

export const getCommissionPolicies = async (kpiId?: string) => {
  let query = supabase.from("commission_policies").select("*");

  if (kpiId) {
    query = query.eq("kpi_id", kpiId);
  }

  const response = await query.order("created_at", { ascending: false });
  return response;
};

export const createCommissionPolicy = async (data: {
  policy_name: string;
  kpi_id: string;
  commission_type: string;
  commission_rate?: number;
  tiers?: any;
  min_threshold?: number;
  max_commission?: number;
  applicable_roles?: string[];
}) => {
  const response = await supabase
    .from("commission_policies")
    .insert({
      policy_name: data.policy_name,
      kpi_id: data.kpi_id,
      commission_type: data.commission_type,
      commission_rate: data.commission_rate,
      tiers: data.tiers,
      min_threshold: data.min_threshold,
      max_commission: data.max_commission,
      applicable_roles: data.applicable_roles,
      is_active: true,
    })
    .select()
    .single();

  return response;
};

export const updateCommissionPolicy = async (
  id: string,
  data: {
    policy_name?: string;
    commission_type?: string;
    commission_rate?: number;
    tiers?: any;
    min_threshold?: number;
    max_commission?: number;
    applicable_roles?: string[];
    is_active?: boolean;
  },
) => {
  const response = await supabase
    .from("commission_policies")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  return response;
};

export const deleteCommissionPolicy = async (id: string) => {
  const response = await supabase
    .from("commission_policies")
    .delete()
    .eq("id", id);

  return response;
};

// ==================== EMPLOYEE KPI RESULTS ====================

export const getEmployeeKPIResults = async (filters?: {
  employeeId?: string;
  kpiId?: string;
  periodStart?: string;
  periodEnd?: string;
}) => {
  let query = supabase.from("employee_kpi_performance").select("*");

  if (filters?.employeeId) {
    query = query.eq("employee_id", filters.employeeId);
  }

  if (filters?.kpiId) {
    query = query.eq("kpi_id", filters.kpiId);
  }

  if (filters?.periodStart) {
    query = query.gte("period_start", filters.periodStart);
  }

  if (filters?.periodEnd) {
    query = query.lte("period_end", filters.periodEnd);
  }

  const response = await query.order("period_start", { ascending: false });
  return response;
};

export const createEmployeeKPIResult = async (data: {
  employee_id: string;
  kpi_id: string;
  period_start: string;
  period_end: string;
  actual_value: number;
  target_value?: number;
  commission_earned?: number;
  notes?: string;
}) => {
  const response = await supabase
    .from("employee_kpi_results")
    .insert(data)
    .select()
    .single();

  return response;
};

export const updateEmployeeKPIResult = async (
  id: string,
  data: {
    actual_value?: number;
    target_value?: number;
    commission_earned?: number;
    notes?: string;
  },
) => {
  const response = await supabase
    .from("employee_kpi_results")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  return response;
};
