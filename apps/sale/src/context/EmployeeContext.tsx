import React, { createContext, useContext, useState, useEffect } from "react";
import { getCurrentUser } from "@nam-viet-erp/services";

interface Employee {
  employee_id: string;
  full_name: string;
  employee_code: string | null;
  is_active: boolean;
  user_id?: string;
  permissions: string[]; // Permissions from database
}

interface EmployeeContextType {
  employee: Employee | null;
  loading: boolean;
  permissions: string[];
  hasPermission: (permission: string) => boolean;
  refreshEmployee: () => Promise<void>;
}

const EmployeeContext = createContext<EmployeeContextType | undefined>(
  undefined
);

export const useEmployee = () => {
  const context = useContext(EmployeeContext);
  if (context === undefined) {
    throw new Error("useEmployee must be used within an EmployeeProvider");
  }
  return context;
};

interface EmployeeProviderProps {
  children: React.ReactNode;
}

export const EmployeeProvider: React.FC<EmployeeProviderProps> = ({
  children,
}) => {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<string[]>([]);

  const refreshEmployee = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching current employee data...');
      const { data, error } = await getCurrentUser();

      if (error) {
        console.error("❌ Error fetching employee:", error);
        setEmployee(null);
        setPermissions([]);
      } else if (data?.employee) {
        console.log('✅ Employee data retrieved:', data.employee);
        const employeeData = data.employee;

        // Get permissions directly from database
        const databasePermissions = employeeData.permissions || [];
        console.log(`🔑 Employee ${employeeData.full_name} database permissions:`, databasePermissions);
        console.log('📊 Total permissions count:', databasePermissions.length);

        // Add permissions to employee object
        const employeeWithPermissions = {
          ...employeeData,
          permissions: databasePermissions,
        };

        setEmployee(employeeWithPermissions);
        setPermissions(databasePermissions);
      } else {
        setEmployee(null);
        setPermissions([]);
      }
    } catch (error) {
      console.error("Error in refreshEmployee:", error);
      setEmployee(null);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (permission: string): boolean => {
    const hasAccess = permissions.includes(permission);
    console.log(`🔐 Permission check "${permission}":`, hasAccess ? '✅ ALLOWED' : '❌ DENIED');
    return hasAccess;
  };

  useEffect(() => {
    refreshEmployee();
  }, []);

  const value = {
    employee,
    loading,
    permissions,
    hasPermission,
    refreshEmployee,
  };

  return (
    <EmployeeContext.Provider value={value}>
      {children}
    </EmployeeContext.Provider>
  );
};
