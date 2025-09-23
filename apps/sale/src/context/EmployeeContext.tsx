import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getCurrentUser } from '@nam-viet-erp/services';

interface Employee {
  employee_id: string;
  full_name: string;
  employee_code: string | null;
  role_name: string;
  is_active: boolean;
  user_id?: string;
}

interface EmployeeContextType {
  employee: Employee | null;
  loading: boolean;
  refreshEmployee: () => Promise<void>;
}

const EmployeeContext = createContext<EmployeeContextType | undefined>(undefined);

export const useEmployee = () => {
  const context = useContext(EmployeeContext);
  if (context === undefined) {
    throw new Error('useEmployee must be used within an EmployeeProvider');
  }
  return context;
};

interface EmployeeProviderProps {
  children: ReactNode;
}

export const EmployeeProvider: React.FC<EmployeeProviderProps> = ({ children }) => {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshEmployee = async () => {
    try {
      setLoading(true);
      const { data, error } = await getCurrentUser();

      if (error) {
        console.error('Error fetching employee:', error);
        setEmployee(null);
      } else if (data?.employee) {
        setEmployee(data.employee);
      } else {
        setEmployee(null);
      }
    } catch (error) {
      console.error('Error in refreshEmployee:', error);
      setEmployee(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshEmployee();
  }, []);

  const value = {
    employee,
    loading,
    refreshEmployee,
  };

  return (
    <EmployeeContext.Provider value={value}>
      {children}
    </EmployeeContext.Provider>
  );
};