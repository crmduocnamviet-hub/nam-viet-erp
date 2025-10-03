# Integration Examples

This document provides real-world integration examples for the CMS and Sale apps.

## 📱 CMS App Integration

### Example 1: App.tsx - Initialize Employee on Login

```typescript
// apps/cms/src/App.tsx
import { useEffect } from 'react';
import { useInitializeEmployee, useAuthStore, useEmployee } from '@nam-viet-erp/store';
import { getEmployeeByUserId } from '@nam-viet-erp/services';
import { supabase } from './lib/supabase';

function App() {
  const setUser = useAuthStore((state) => state.setUser);
  const setSession = useAuthStore((state) => state.setSession);
  const login = useAuthStore((state) => state.login);

  // Initialize employee data automatically when user is authenticated
  useInitializeEmployee(getEmployeeByUserId);

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        login(
          {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.full_name,
          },
          session
        );
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        login(
          {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.full_name,
          },
          session
        );
      } else {
        // Clear store on logout
        useAuthStore.getState().logout();
        useEmployeeStore.getState().clearEmployee();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return <Router />;
}

export default App;
```

### Example 2: B2BOrderListPage - Remove Props

**Before:**
```typescript
interface B2BOrderListPageProps {
  employee?: IEmployee | null;
  user?: User | null;
}

const B2BOrderListPage: React.FC<B2BOrderListPageProps> = ({
  employee,
  user,
}) => {
  const userPermissions = user?.permissions || [];
  const canCreateQuotes = userPermissions.includes("quotes.create");

  return <div>{employee?.full_name}</div>;
};
```

**After:**
```typescript
import { useEmployee, usePermissions, useHasPermission } from '@nam-viet-erp/store';

const B2BOrderListPage: React.FC = () => {
  const employee = useEmployee();
  const permissions = usePermissions();
  const canCreateQuotes = useHasPermission('quotes.create');

  // Or check multiple permissions
  const canEditQuotes = useEmployeeStore((state) =>
    state.hasAnyPermission(['quotes.edit', 'b2b.edit'])
  );

  return <div>{employee?.full_name}</div>;
};
```

### Example 3: Protected Route Component

```typescript
// apps/cms/src/components/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useIsAuthenticated, useHasPermission } from '@nam-viet-erp/store';

interface ProtectedRouteProps {
  children: React.ReactNode;
  permission?: string;
  permissions?: string[];
  requireAll?: boolean; // If true, requires all permissions; if false, requires any
}

export function ProtectedRoute({
  children,
  permission,
  permissions,
  requireAll = false,
}: ProtectedRouteProps) {
  const isAuthenticated = useIsAuthenticated();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check single permission
  if (permission) {
    const hasPermission = useHasPermission(permission);
    if (!hasPermission) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // Check multiple permissions
  if (permissions && permissions.length > 0) {
    const hasPermissions = useEmployeeStore((state) =>
      requireAll
        ? state.hasAllPermissions(permissions)
        : state.hasAnyPermission(permissions)
    );

    if (!hasPermissions) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
}

// Usage in router:
<Routes>
  <Route
    path="/b2b"
    element={
      <ProtectedRoute permission="b2b.access">
        <B2BOrderListPage />
      </ProtectedRoute>
    }
  />
  <Route
    path="/b2b/create"
    element={
      <ProtectedRoute permissions={['b2b.create', 'quotes.create']}>
        <CreateOrderPage />
      </ProtectedRoute>
    }
  />
</Routes>
```

## 📱 Sale App Integration

### Example 1: main.tsx - Initialize Employee

```typescript
// apps/sale/src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { useInitializeEmployee } from '@nam-viet-erp/store';
import { getEmployeeByUserId } from '@nam-viet-erp/services';

function Root() {
  // Initialize employee data
  useInitializeEmployee(getEmployeeByUserId);

  return <App />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
```

### Example 2: Replace EmployeeContext

**Before:**
```typescript
// apps/sale/src/context/EmployeeContext.tsx
import React, { createContext, useContext, useState } from 'react';

interface EmployeeContextType {
  employee: IEmployee | null;
  setEmployee: (employee: IEmployee | null) => void;
  refreshEmployee: () => Promise<void>;
  permissions: string[];
  setPermissions: (permissions: string[]) => void;
}

const EmployeeContext = createContext<EmployeeContextType | undefined>(undefined);

export function EmployeeProvider({ children }: { children: React.ReactNode }) {
  const [employee, setEmployee] = useState<IEmployee | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);

  const refreshEmployee = async () => {
    // API call to refresh
  };

  return (
    <EmployeeContext.Provider
      value={{ employee, setEmployee, permissions, setPermissions, refreshEmployee }}
    >
      {children}
    </EmployeeContext.Provider>
  );
}

export const useEmployee = () => {
  const context = useContext(EmployeeContext);
  if (!context) throw new Error('useEmployee must be used within EmployeeProvider');
  return context;
};
```

**After:**
```typescript
// Delete EmployeeContext.tsx - no longer needed!

// In your components, just import:
import {
  useEmployee,
  usePermissions,
  useRefreshEmployee
} from '@nam-viet-erp/store';
import { getEmployeeByUserId } from '@nam-viet-erp/services';

function MyComponent() {
  const employee = useEmployee();
  const permissions = usePermissions();
  const { refreshEmployee, isLoading } = useRefreshEmployee(getEmployeeByUserId);

  return (
    <div>
      <h1>{employee?.full_name}</h1>
      <button onClick={refreshEmployee} disabled={isLoading}>
        Refresh
      </button>
    </div>
  );
}
```

### Example 3: Dashboard with Permissions

```typescript
// apps/sale/src/pages/Dashboard.tsx
import { useEmployee, usePermissions, useHasPermission } from '@nam-viet-erp/store';

export function Dashboard() {
  const employee = useEmployee();
  const canViewSales = useHasPermission('sales.view');
  const canCreateOrders = useHasPermission('orders.create');
  const canAccessB2B = useHasPermission('b2b.access');

  return (
    <div>
      <h1>Welcome, {employee?.full_name}</h1>
      <p>Role: {employee?.role_name}</p>

      <div className="dashboard-widgets">
        {canViewSales && <SalesWidget />}
        {canCreateOrders && <CreateOrderButton />}
        {canAccessB2B && <B2BSection />}
      </div>
    </div>
  );
}
```

## 🔄 Custom Fetch Implementation

### Using with Supabase

```typescript
// apps/cms/src/App.tsx
import { useInitializeEmployeeWithFetch } from '@nam-viet-erp/store';
import { supabase } from './lib/supabase';

function App() {
  const { fetchEmployee, isLoading } = useInitializeEmployeeWithFetch();

  useEffect(() => {
    // Custom fetch logic
    fetchEmployee(async (userId) => {
      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          roles (
            name,
            permissions:role_permissions (
              permission:permissions (name)
            )
          )
        `)
        .eq('user_id', userId)
        .single();

      if (error) {
        return { data: null, error };
      }

      // Transform permissions
      const permissions = data.roles?.permissions?.map(
        (p) => p.permission.name
      ) || [];

      return {
        data: {
          ...data,
          permissions,
        },
        error: null,
      };
    });
  }, [fetchEmployee]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return <Router />;
}
```

## 🎨 UI State Examples

### Sidebar Management

```typescript
// apps/cms/src/components/Sidebar.tsx
import { useSidebarCollapsed, useUIStore } from '@nam-viet-erp/store';

export function Sidebar() {
  const collapsed = useSidebarCollapsed();
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);

  return (
    <aside className={collapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}>
      <button onClick={toggleSidebar}>
        {collapsed ? '→' : '←'}
      </button>
      {/* Sidebar content */}
    </aside>
  );
}
```

### Theme Toggle

```typescript
// apps/cms/src/components/ThemeToggle.tsx
import { useTheme, useUIStore } from '@nam-viet-erp/store';

export function ThemeToggle() {
  const theme = useTheme();
  const toggleTheme = useUIStore((state) => state.toggleTheme);

  return (
    <button onClick={toggleTheme}>
      {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
    </button>
  );
}
```

### Modal Management

```typescript
// apps/cms/src/pages/B2BOrderListPage.tsx
import { useUIStore, useIsModalOpen } from '@nam-viet-erp/store';

export function B2BOrderListPage() {
  const openModal = useUIStore((state) => state.openModal);
  const closeModal = useUIStore((state) => state.closeModal);
  const isCreateOrderOpen = useIsModalOpen('createOrder');
  const isEditOrderOpen = useIsModalOpen('editOrder');

  return (
    <div>
      <button onClick={() => openModal('createOrder')}>
        Create Order
      </button>

      {isCreateOrderOpen && (
        <CreateOrderModal onClose={() => closeModal('createOrder')} />
      )}

      {isEditOrderOpen && (
        <EditOrderModal onClose={() => closeModal('editOrder')} />
      )}
    </div>
  );
}
```

## 🔒 Logout Implementation

```typescript
// apps/cms/src/components/Header.tsx
import { useAuthStore, useEmployeeStore, useUser } from '@nam-viet-erp/store';
import { supabase } from './lib/supabase';

export function Header() {
  const user = useUser();
  const logout = useAuthStore((state) => state.logout);
  const clearEmployee = useEmployeeStore((state) => state.clearEmployee);

  const handleLogout = async () => {
    // Logout from Supabase
    await supabase.auth.signOut();

    // Clear all stores
    logout();
    clearEmployee();

    // Redirect to login
    window.location.href = '/login';
  };

  return (
    <header>
      <span>{user?.email}</span>
      <button onClick={handleLogout}>Logout</button>
    </header>
  );
}
```

## 📊 Permission Matrix Component

```typescript
// apps/cms/src/components/PermissionMatrix.tsx
import { useEmployee, usePermissions } from '@nam-viet-erp/store';

export function PermissionMatrix() {
  const employee = useEmployee();
  const permissions = usePermissions();

  return (
    <div>
      <h2>User Permissions</h2>
      <p><strong>Employee:</strong> {employee?.full_name}</p>
      <p><strong>Role:</strong> {employee?.role_name}</p>
      <ul>
        {permissions.map((perm) => (
          <li key={perm}>{perm}</li>
        ))}
      </ul>
    </div>
  );
}
```

## 🧪 Testing Examples

### Test with Mock Store

```typescript
// apps/cms/src/__tests__/B2BOrderListPage.test.tsx
import { render, screen } from '@testing-library/react';
import { useEmployeeStore } from '@nam-viet-erp/store';
import { B2BOrderListPage } from '../pages/B2BOrderListPage';

describe('B2BOrderListPage', () => {
  it('should show create button for users with permission', () => {
    // Set up store state
    useEmployeeStore.setState({
      employee: {
        employee_id: '1',
        full_name: 'John Doe',
        role_name: 'admin',
      },
      permissions: ['b2b.create', 'b2b.view'],
    });

    render(<B2BOrderListPage />);

    expect(screen.getByText('Create Order')).toBeInTheDocument();
  });

  it('should hide create button for users without permission', () => {
    useEmployeeStore.setState({
      employee: {
        employee_id: '1',
        full_name: 'Jane Doe',
        role_name: 'viewer',
      },
      permissions: ['b2b.view'],
    });

    render(<B2BOrderListPage />);

    expect(screen.queryByText('Create Order')).not.toBeInTheDocument();
  });
});
```

## 📝 Summary

### Key Benefits:

✅ **No Provider Hell** - No need for context providers
✅ **No Prop Drilling** - Access state from anywhere
✅ **Type Safe** - Full TypeScript support
✅ **Persistent** - Auth & employee data saved to localStorage
✅ **DevTools** - Debug with Redux DevTools
✅ **Performance** - Only re-renders when needed
✅ **Simple Testing** - Easy to mock and test

### Migration Checklist:

- [ ] Remove EmployeeContext.tsx (Sale app)
- [ ] Remove employee/user props from components
- [ ] Replace context hooks with store hooks
- [ ] Initialize employee in App.tsx or main.tsx
- [ ] Update permission checks to use store
- [ ] Test all functionality
- [ ] Enjoy the benefits! 🎉
