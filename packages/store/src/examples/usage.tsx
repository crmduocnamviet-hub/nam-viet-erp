/**
 * Example usage of the store package
 * This file demonstrates how to use the various stores in your application
 */

import React from 'react';
import {
  useAuthStore,
  useEmployeeStore,
  useUIStore,
  useUser,
  useEmployee,
  usePermissions,
  useHasPermission,
} from '../index';

// Example 1: Authentication
export function LoginExample() {
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);
  const user = useUser();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const handleLogin = () => {
    const mockUser = {
      id: '123',
      email: 'user@example.com',
      name: 'John Doe',
    };
    const mockSession = { accessToken: 'token123', expiresAt: Date.now() };
    login(mockUser, mockSession);
  };

  return (
    <div>
      {isAuthenticated ? (
        <>
          <h2>Welcome, {user?.name}</h2>
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <button onClick={handleLogin}>Login</button>
      )}
    </div>
  );
}

// Example 2: Employee & Permissions
export function PermissionExample() {
  const employee = useEmployee();
  const permissions = usePermissions();
  const setEmployee = useEmployeeStore((state) => state.setEmployee);
  const setPermissions = useEmployeeStore((state) => state.setPermissions);

  // Using selector hook
  const canCreateB2B = useHasPermission('b2b.create');

  // Or check multiple permissions
  const hasAnyPermission = useEmployeeStore((state) =>
    state.hasAnyPermission(['b2b.create', 'b2b.edit'])
  );

  React.useEffect(() => {
    // Simulate fetching employee data
    const mockEmployee = {
      employee_id: 'EMP001',
      full_name: 'John Doe',
      email: 'john@example.com',
      role_name: 'admin',
      employee_code: 'JD001',
      is_active: true,
    };
    const mockPermissions = ['b2b.create', 'b2b.edit', 'b2b.view', 'quotes.create'];

    setEmployee(mockEmployee);
    setPermissions(mockPermissions);
  }, []);

  return (
    <div>
      <h2>Employee Dashboard</h2>
      {employee && (
        <>
          <p>Name: {employee.full_name}</p>
          <p>Role: {employee.role_name}</p>
          <p>Permissions: {permissions.join(', ')}</p>

          {canCreateB2B && <button>Create B2B Order</button>}
          {hasAnyPermission && <button>Edit B2B Order</button>}
        </>
      )}
    </div>
  );
}

// Example 3: UI State
export function UIExample() {
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);
  const sidebarCollapsed = useUIStore((state) => state.sidebarCollapsed);
  const theme = useUIStore((state) => state.theme);
  const toggleTheme = useUIStore((state) => state.toggleTheme);
  const openModal = useUIStore((state) => state.openModal);
  const closeModal = useUIStore((state) => state.closeModal);
  const isCreateOrderOpen = useUIStore((state) => state.isModalOpen('createOrder'));

  return (
    <div className={`app ${theme}`}>
      <header>
        <button onClick={toggleSidebar}>
          {sidebarCollapsed ? '☰ Expand' : '✕ Collapse'}
        </button>
        <button onClick={toggleTheme}>
          {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
        </button>
      </header>

      <main>
        <button onClick={() => openModal('createOrder')}>Create Order</button>

        {isCreateOrderOpen && (
          <div className="modal">
            <h2>Create Order Modal</h2>
            <button onClick={() => closeModal('createOrder')}>Close</button>
          </div>
        )}
      </main>
    </div>
  );
}

// Example 4: Combining Multiple Stores
export function DashboardExample() {
  const user = useUser();
  const employee = useEmployee();
  const hasB2BAccess = useHasPermission('b2b.access');
  const theme = useUIStore((state) => state.theme);
  const openModal = useUIStore((state) => state.openModal);

  return (
    <div className={theme}>
      <h1>Dashboard</h1>

      {user && <p>Logged in as: {user.email}</p>}
      {employee && <p>Employee: {employee.full_name} ({employee.role_name})</p>}

      {hasB2BAccess && (
        <div className="b2b-section">
          <h2>B2B Management</h2>
          <button onClick={() => openModal('createB2BOrder')}>
            Create B2B Order
          </button>
        </div>
      )}
    </div>
  );
}

// Example 5: Using store actions
export function ActionsExample() {
  const updateEmployee = useEmployeeStore((state) => state.updateEmployee);
  const employee = useEmployee();

  const handleUpdatePhone = () => {
    updateEmployee({ phone_number: '+84 123 456 789' });
  };

  return (
    <div>
      <p>Phone: {employee?.phone_number || 'Not set'}</p>
      <button onClick={handleUpdatePhone}>Update Phone</button>
    </div>
  );
}
