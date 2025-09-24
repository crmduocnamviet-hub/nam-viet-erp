# Shared Components

This package contains reusable components and pages that can be used across different apps in the Nam Viet ERP monorepo.

## Pages

### B2BOrderManagementPage
A comprehensive B2B order management interface that handles:
- Quote creation and management
- 6-stage workflow visualization (Draft → Sent → Negotiating → Accepted + Rejected/Expired)
- Customer information management
- Employee-specific filtering
- Statistics and analytics

**Usage:**
```typescript
import { B2BOrderManagementPage } from '@nam-viet-erp/shared-components';

// In your app
<B2BOrderManagementPage employee={employee} />
```

**Props:**
- `employee?: { employee_id: string; full_name: string; employee_code: string } | null` - Current employee context

## Components

### AppointmentCreationModal
Modal for creating new appointments with patient selection/creation.

## Hooks

### useDebounce
Utility hook for debouncing values.

## Usage in Apps

### Sale App
```typescript
import { B2BOrderManagementPage } from '@nam-viet-erp/shared-components';
import { useEmployee } from '../context/EmployeeContext';

// In routes
<Route path="/store-channel" element={<B2BOrderManagementPage employee={employee} />} />
```

### CMS App
```typescript
import { B2BOrderManagementPage } from '@nam-viet-erp/shared-components';

// In routes
<Route path="/b2b-orders" element={<B2BOrderManagementPage employee={null} />} />
```

## Architecture Benefits

1. **Code Reuse**: Pages are shared across multiple apps
2. **Consistency**: Same UI/UX across different applications
3. **Maintainability**: Single source of truth for complex pages
4. **Flexibility**: Components accept props to customize behavior per app
5. **Scalability**: Easy to add new shared pages and components