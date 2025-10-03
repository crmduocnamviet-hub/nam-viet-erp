# Quick Reference Guide

## 📦 Import Cheatsheet

```typescript
// Stores
import {
  useAuthStore,
  useEmployeeStore,
  useUIStore
} from '@nam-viet-erp/store';

// Selectors (Optimized hooks)
import {
  useUser,
  useSession,
  useIsAuthenticated,
  useEmployee,
  usePermissions,
  useHasPermission,
  useHasAnyPermission,
  useHasAllPermissions,
  useTheme,
  useSidebarCollapsed,
  useIsModalOpen
} from '@nam-viet-erp/store';

// Initialization hooks
import {
  useInitializeEmployee,
  useRefreshEmployee
} from '@nam-viet-erp/store';

// Services
import {
  fetchAndSetEmployee,
  fetchEmployeeByUserId,
  refreshEmployee,
  clearEmployeeData,
  getCurrentEmployee,
  getCurrentPermissions
} from '@nam-viet-erp/store';
```

## 🎯 Common Tasks

### Initialize Employee on App Start

```typescript
import { useInitializeEmployee } from '@nam-viet-erp/store';
import { getEmployeeByUserId } from '@nam-viet-erp/services';

function App() {
  useInitializeEmployee(getEmployeeByUserId);
  return <YourApp />;
}
```

### Check Permission

```typescript
import { useHasPermission } from '@nam-viet-erp/store';

function MyComponent() {
  const canCreate = useHasPermission('b2b.create');
  return canCreate ? <CreateButton /> : null;
}
```

### Get Employee Info

```typescript
import { useEmployee } from '@nam-viet-erp/store';

function Profile() {
  const employee = useEmployee();
  return <h1>{employee?.full_name}</h1>;
}
```

### Login/Logout

```typescript
import { useAuthStore, useEmployeeStore } from '@nam-viet-erp/store';

function LoginButton() {
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);
  const clearEmployee = useEmployeeStore((state) => state.clearEmployee);

  const handleLogin = () => {
    login(userData, sessionData);
  };

  const handleLogout = () => {
    logout();
    clearEmployee();
  };
}
```

### Manage Modals

```typescript
import { useUIStore, useIsModalOpen } from '@nam-viet-erp/store';

function MyPage() {
  const openModal = useUIStore((state) => state.openModal);
  const closeModal = useUIStore((state) => state.closeModal);
  const isOpen = useIsModalOpen('myModal');

  return (
    <>
      <button onClick={() => openModal('myModal')}>Open</button>
      {isOpen && <Modal onClose={() => closeModal('myModal')} />}
    </>
  );
}
```

### Theme Toggle

```typescript
import { useTheme, useUIStore } from '@nam-viet-erp/store';

function ThemeToggle() {
  const theme = useTheme();
  const toggleTheme = useUIStore((state) => state.toggleTheme);

  return (
    <button onClick={toggleTheme}>
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
}
```

### Refresh Employee

```typescript
import { useRefreshEmployee } from '@nam-viet-erp/store';
import { getEmployeeByUserId } from '@nam-viet-erp/services';

function Profile() {
  const { refreshEmployee, isLoading } = useRefreshEmployee(getEmployeeByUserId);

  return (
    <button onClick={refreshEmployee} disabled={isLoading}>
      Refresh
    </button>
  );
}
```

## 📊 Permission Patterns

### Single Permission

```typescript
const canCreate = useHasPermission('b2b.create');
```

### Any Permission (OR)

```typescript
const canEdit = useEmployeeStore((state) =>
  state.hasAnyPermission(['b2b.edit', 'quotes.edit'])
);
```

### All Permissions (AND)

```typescript
const canManage = useEmployeeStore((state) =>
  state.hasAllPermissions(['b2b.create', 'b2b.edit', 'b2b.delete'])
);
```

### Multiple Selectors

```typescript
const employee = useEmployee();
const permissions = usePermissions();
const canCreate = useHasPermission('b2b.create');
```

## 🎨 UI State Patterns

### Sidebar

```typescript
const collapsed = useSidebarCollapsed();
const toggleSidebar = useUIStore((state) => state.toggleSidebar);
const setSidebarCollapsed = useUIStore((state) => state.setSidebarCollapsed);
```

### Theme

```typescript
const theme = useTheme();
const setTheme = useUIStore((state) => state.setTheme);
const toggleTheme = useUIStore((state) => state.toggleTheme);
```

### Modals

```typescript
const openModal = useUIStore((state) => state.openModal);
const closeModal = useUIStore((state) => state.closeModal);
const toggleModal = useUIStore((state) => state.toggleModal);
const isOpen = useIsModalOpen('modalName');
```

## 🔄 Direct Store Access (Outside Components)

```typescript
import { useEmployeeStore, useAuthStore } from '@nam-viet-erp/store';

// Get state
const employee = useEmployeeStore.getState().employee;
const user = useAuthStore.getState().user;

// Call actions
useEmployeeStore.getState().setEmployee(employeeData);
useAuthStore.getState().login(userData, sessionData);

// Subscribe to changes
const unsubscribe = useEmployeeStore.subscribe(
  (state) => state.employee,
  (employee) => {
    console.log('Employee changed:', employee);
  }
);
```

## 🧪 Testing Patterns

```typescript
import { useEmployeeStore } from '@nam-viet-erp/store';

beforeEach(() => {
  // Reset store before each test
  useEmployeeStore.setState({
    employee: null,
    permissions: [],
    isLoading: false,
    error: null,
  });
});

it('should show create button with permission', () => {
  // Set store state
  useEmployeeStore.setState({
    employee: mockEmployee,
    permissions: ['b2b.create'],
  });

  render(<MyComponent />);
  expect(screen.getByText('Create')).toBeInTheDocument();
});
```

## ⚡ Performance Tips

### ✅ Good - Optimized selectors

```typescript
const employee = useEmployee();
const permissions = usePermissions();
const canCreate = useHasPermission('b2b.create');
```

### ✅ Good - Specific selector

```typescript
const employeeName = useEmployeeStore((state) => state.employee?.full_name);
```

### ❌ Bad - Re-renders on any change

```typescript
const { employee, permissions } = useEmployeeStore();
```

### ✅ Best - Use exported selectors

```typescript
import { useEmployee, usePermissions } from '@nam-viet-erp/store';
```

## 🔗 Related Files

- **README.md** - Full documentation
- **MIGRATION_GUIDE.md** - Migration from Context to Zustand
- **INTEGRATION_EXAMPLES.md** - Real-world examples
- **src/examples/usage.tsx** - Code examples

## 📚 API Reference

See [README.md](./README.md) for complete API documentation.
