# @nam-viet-erp/store

Global state management package for Nam Viet ERP using Zustand.

## 🚀 Quick Start

### Installation

This package is already installed in CMS and Sale apps. Just import and use!

```typescript
import {
  useEmployee,
  usePermissions,
  useHasPermission,
  useInitializeEmployee
} from '@nam-viet-erp/store';
```

### ✨ Features

- 🎯 **Zustand** - Simple and performant state management
- 🔄 **Immer** - Mutable-style state updates (immutability under the hood)
- 💾 **Persistence** - Auto-save to localStorage
- 🛠️ **DevTools** - Redux DevTools integration
- 📘 **TypeScript** - Full type safety
- ⚡ **Optimized** - Structural sharing for performance

### Basic Setup

```typescript
// apps/cms/src/App.tsx
import { useInitializeEmployee } from '@nam-viet-erp/store';
import { getEmployeeByUserId } from '@nam-viet-erp/services';

function App() {
  // Automatically fetch and store employee data
  useInitializeEmployee(getEmployeeByUserId);

  return <YourApp />;
}
```

## Usage

### Authentication Store

```typescript
import { useAuthStore, useUser, useIsAuthenticated } from '@nam-viet-erp/store';

function LoginComponent() {
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);

  // Using selectors
  const user = useUser();
  const isAuthenticated = useIsAuthenticated();

  const handleLogin = async () => {
    const userData = { id: '1', email: 'user@example.com', name: 'John Doe' };
    const session = { /* session data */ };
    login(userData, session);
  };

  return (
    <div>
      {isAuthenticated ? (
        <>
          <p>Welcome, {user?.name}</p>
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <button onClick={handleLogin}>Login</button>
      )}
    </div>
  );
}
```

### Employee Store

```typescript
import {
  useEmployeeStore,
  useEmployee,
  usePermissions,
  useHasPermission,
} from '@nam-viet-erp/store';

function DashboardComponent() {
  const employee = useEmployee();
  const permissions = usePermissions();
  const setEmployee = useEmployeeStore((state) => state.setEmployee);
  const hasPermission = useHasPermission('b2b.create');

  // Or check permission directly
  const canCreateB2B = useEmployeeStore((state) =>
    state.hasPermission('b2b.create')
  );

  return (
    <div>
      <h1>Welcome, {employee?.full_name}</h1>
      {hasPermission && <button>Create B2B Order</button>}
    </div>
  );
}
```

### UI Store

```typescript
import {
  useUIStore,
  useSidebarCollapsed,
  useTheme,
  useIsModalOpen,
} from '@nam-viet-erp/store';

function Layout() {
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);
  const sidebarCollapsed = useSidebarCollapsed();
  const theme = useTheme();
  const openModal = useUIStore((state) => state.openModal);
  const closeModal = useUIStore((state) => state.closeModal);
  const isModalOpen = useIsModalOpen('createOrder');

  return (
    <div className={theme}>
      <button onClick={toggleSidebar}>
        {sidebarCollapsed ? 'Expand' : 'Collapse'}
      </button>

      <button onClick={() => openModal('createOrder')}>
        Create Order
      </button>

      {isModalOpen && (
        <Modal onClose={() => closeModal('createOrder')}>
          <h2>Create Order</h2>
        </Modal>
      )}
    </div>
  );
}
```

## Features

### 🔐 Auth Store
- User authentication state
- Session management
- Persistent storage (localStorage)
- Login/logout actions

### 👤 Employee Store
- Employee information
- Permission management
- Permission checking utilities
- Persistent storage (localStorage)

### 🎨 UI Store
- Sidebar state
- Theme management (light/dark)
- Mobile detection
- Notification system
- Modal management

## Advanced Usage

### Creating Custom Stores

```typescript
import { create } from '@nam-viet-erp/store';

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
}

export const useCartStore = create<CartState>()((set) => ({
  items: [],

  addItem: (item) =>
    set((state) => ({ items: [...state.items, item] })),

  removeItem: (id) =>
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    })),
}));
```

### Using Middleware

```typescript
import { create, devtools, persist } from '@nam-viet-erp/store';

export const useMyStore = create<MyState>()(
  devtools(
    persist(
      (set) => ({
        // your state and actions
      }),
      {
        name: 'my-storage',
      }
    ),
    {
      name: 'MyStore',
    }
  )
);
```

### Optimized Selectors

```typescript
// ✅ Good: Selector only re-renders when employee changes
const employee = useEmployeeStore((state) => state.employee);

// ❌ Bad: Re-renders on any state change
const { employee } = useEmployeeStore();

// ✅ Best: Use exported selectors
const employee = useEmployee();
```

## API Reference

### Auth Store

| Method | Description |
|--------|-------------|
| `setUser(user)` | Set current user |
| `setSession(session)` | Set session data |
| `login(user, session)` | Login user with session |
| `logout()` | Clear user and session |
| `updateUser(updates)` | Partially update user |

### Employee Store

| Method | Description |
|--------|-------------|
| `setEmployee(employee)` | Set current employee |
| `setPermissions(permissions)` | Set employee permissions |
| `clearEmployee()` | Clear employee data |
| `updateEmployee(updates)` | Partially update employee |
| `hasPermission(permission)` | Check single permission |
| `hasAnyPermission(permissions)` | Check if has any permission |
| `hasAllPermissions(permissions)` | Check if has all permissions |

### UI Store

| Method | Description |
|--------|-------------|
| `toggleSidebar()` | Toggle sidebar state |
| `setSidebarCollapsed(collapsed)` | Set sidebar state |
| `setTheme(theme)` | Set theme (light/dark) |
| `toggleTheme()` | Toggle theme |
| `openModal(name)` | Open modal by name |
| `closeModal(name)` | Close modal by name |
| `toggleModal(name)` | Toggle modal state |
| `addNotification(notification)` | Add notification |
| `removeNotification(id)` | Remove notification |

## DevTools

All stores support Redux DevTools for debugging. Install the extension:
- [Chrome](https://chrome.google.com/webstore/detail/redux-devtools/)
- [Firefox](https://addons.mozilla.org/en-US/firefox/addon/reduxdevtools/)

## TypeScript

All stores are fully typed with TypeScript. Import types as needed:

```typescript
import type { Employee } from '@nam-viet-erp/store';
```

## License

MIT
