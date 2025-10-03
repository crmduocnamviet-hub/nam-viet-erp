# Migration Guide: From Context to Zustand Store

This guide will help you migrate from React Context to Zustand store in the sale and cms apps.

## 📋 Overview

The store package provides three main stores:
- **AuthStore** - User authentication
- **EmployeeStore** - Employee data and permissions
- **UIStore** - UI state management

## 🔄 Migration Steps

### 1. Sale App - Replace EmployeeContext

**Before** (`apps/sale/src/context/EmployeeContext.tsx`):
```typescript
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
    // refresh logic
  };

  return (
    <EmployeeContext.Provider value={{ employee, setEmployee, permissions, setPermissions, refreshEmployee }}>
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

**After** (using store):
```typescript
// No need for context provider! Just import and use the store
import { useEmployeeStore, useEmployee, usePermissions } from '@nam-viet-erp/store';

// In your components:
function MyComponent() {
  const employee = useEmployee(); // Optimized selector
  const permissions = usePermissions(); // Optimized selector
  const setEmployee = useEmployeeStore((state) => state.setEmployee);
  const setPermissions = useEmployeeStore((state) => state.setPermissions);

  return <div>{employee?.full_name}</div>;
}
```

### 2. CMS App - Replace App.tsx employee state

**Before** (`apps/cms/src/App.tsx`):
```typescript
function App() {
  const [employee, setEmployee] = useState<IEmployee | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);

  // Pass employee and permissions down as props
  return <Component employee={employee} permissions={permissions} />;
}
```

**After**:
```typescript
import { useEmployeeStore } from '@nam-viet-erp/store';

function App() {
  const setEmployee = useEmployeeStore((state) => state.setEmployee);
  const setPermissions = useEmployeeStore((state) => state.setPermissions);

  useEffect(() => {
    // Load employee data
    const loadEmployeeData = async () => {
      const employeeData = await fetchEmployee();
      setEmployee(employeeData);
      setPermissions(employeeData.permissions);
    };
    loadEmployeeData();
  }, []);

  // No need to pass employee and permissions as props!
  // Components can access them directly from the store
  return <Component />;
}
```

### 3. Update Component Props

**Before**:
```typescript
interface MyComponentProps {
  employee?: IEmployee | null;
  user?: User | null;
}

function MyComponent({ employee, user }: MyComponentProps) {
  return <div>{employee?.full_name}</div>;
}
```

**After**:
```typescript
// No props needed!
import { useEmployee } from '@nam-viet-erp/store';

function MyComponent() {
  const employee = useEmployee();
  return <div>{employee?.full_name}</div>;
}
```

### 4. Permission Checking

**Before**:
```typescript
function MyComponent({ user }: { user: User | null }) {
  const userPermissions = user?.permissions || [];
  const canCreateB2B = userPermissions.includes('b2b.create');

  return canCreateB2B ? <CreateButton /> : null;
}
```

**After**:
```typescript
import { useHasPermission } from '@nam-viet-erp/store';

function MyComponent() {
  const canCreateB2B = useHasPermission('b2b.create');

  return canCreateB2B ? <CreateButton /> : null;
}
```

### 5. Authentication State

**Before**:
```typescript
function App() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState(null);

  return <Component user={user} />;
}
```

**After**:
```typescript
import { useAuthStore, useUser } from '@nam-viet-erp/store';

function App() {
  const login = useAuthStore((state) => state.login);

  useEffect(() => {
    // On successful auth
    const handleAuth = (user, session) => {
      login(user, session);
    };
  }, []);

  return <Component />;
}

// In child components:
function MyComponent() {
  const user = useUser();
  const logout = useAuthStore((state) => state.logout);

  return (
    <div>
      <p>{user?.email}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

## 🎯 Benefits of Migration

### 1. **No Provider Hell**
❌ Before:
```typescript
<AuthProvider>
  <EmployeeProvider>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </EmployeeProvider>
</AuthProvider>
```

✅ After:
```typescript
<App />
```

### 2. **Better Performance**
- Only re-renders components that use changed state
- Optimized selectors prevent unnecessary re-renders
- No prop drilling

### 3. **Persistence**
- Auth and employee data automatically saved to localStorage
- Survives page refreshes

### 4. **DevTools**
- Redux DevTools integration for debugging
- Time-travel debugging
- State inspection

### 5. **Type Safety**
- Full TypeScript support
- Better autocomplete
- Compile-time error checking

## 📝 Step-by-Step Migration Checklist

### For Sale App:

- [ ] Remove `EmployeeContext.tsx`
- [ ] Remove `<EmployeeProvider>` from main.tsx
- [ ] Replace `useEmployee()` hook with `useEmployee()` from store
- [ ] Update all components to use store instead of context
- [ ] Remove employee/permissions props from component interfaces
- [ ] Test all employee-related functionality

### For CMS App:

- [ ] Remove employee state from App.tsx
- [ ] Replace with `useEmployeeStore` and `useAuthStore`
- [ ] Update B2BOrderListPage to use store
- [ ] Remove employee/user props from all pages
- [ ] Test authentication flow
- [ ] Test permission checks

## 🔧 Common Patterns

### Pattern 1: Loading Employee on App Start
```typescript
// apps/cms/src/App.tsx or apps/sale/src/main.tsx
import { useEmployeeStore, useAuthStore } from '@nam-viet-erp/store';

function App() {
  const setEmployee = useEmployeeStore((state) => state.setEmployee);
  const setPermissions = useEmployeeStore((state) => state.setPermissions);
  const login = useAuthStore((state) => state.login);

  useEffect(() => {
    const initAuth = async () => {
      const { user, session } = await getSession();
      if (user && session) {
        login(user, session);

        const employeeData = await getEmployee(user.id);
        setEmployee(employeeData);
        setPermissions(employeeData.permissions);
      }
    };
    initAuth();
  }, []);

  return <Routes />;
}
```

### Pattern 2: Protected Routes
```typescript
import { useIsAuthenticated, useHasPermission } from '@nam-viet-erp/store';

function ProtectedRoute({ permission, children }) {
  const isAuthenticated = useIsAuthenticated();
  const hasPermission = useHasPermission(permission);

  if (!isAuthenticated) return <Navigate to="/login" />;
  if (!hasPermission) return <Navigate to="/unauthorized" />;

  return children;
}
```

### Pattern 3: Optimized Selectors
```typescript
// ✅ Good - only re-renders when employee.full_name changes
const employeeName = useEmployeeStore((state) => state.employee?.full_name);

// ❌ Bad - re-renders on any employee change
const employee = useEmployeeStore((state) => state.employee);
const employeeName = employee?.full_name;

// ✅ Best - use exported selector
const employee = useEmployee();
const employeeName = employee?.full_name;
```

## 🚀 Next Steps

1. Start with one component/page
2. Test thoroughly
3. Migrate incrementally
4. Remove old context files once fully migrated
5. Enjoy the benefits of Zustand!

## ❓ FAQ

**Q: Do I need to keep the Context providers?**
A: No! Once migrated to Zustand, you can remove all Context providers.

**Q: Will my state persist on page refresh?**
A: Yes, auth and employee stores use localStorage persistence.

**Q: Can I use both Context and Zustand during migration?**
A: Yes, you can migrate gradually and run both side-by-side.

**Q: How do I debug the store?**
A: Install Redux DevTools extension in your browser. All stores have devtools enabled.

**Q: What about testing?**
A: Zustand stores are easier to test. You can directly access store actions without mocking providers.
