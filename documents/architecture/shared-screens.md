# Shared Screens Architecture

This document explains the new shared screens architecture that centralizes all application screens in `packages/shared-components` with permission-based access control.

## Overview

All screens/pages are now defined in `packages/shared-components` and consumed by apps (sale/cms) based on user permissions. This provides:

1. **Centralized Screen Management**: All screens in one place
2. **Permission-Based Access**: Automatic access control
3. **Dynamic Menu Generation**: Menus generated based on permissions
4. **Consistent UI/UX**: Same components across apps
5. **Easy Maintenance**: Single source of truth

## Architecture Components

### 1. Screen Registry (`packages/shared-components/src/screens/index.ts`)

Central registry of all available screens with their permission requirements:

```typescript
export const SCREEN_REGISTRY: ScreenRegistry = {
  "pos.main": {
    component: PosPage,
    permissions: ["pos.access", "sales.create"],
    category: "pos",
    title: "Bán hàng (POS)",
    description: "Giao diện bán hàng trực tiếp",
  },
  "b2b.orders": {
    component: B2BOrderManagementPage,
    permissions: ["b2b.access", "quotes.view"],
    category: "b2b",
    title: "Quản lý Đơn hàng B2B",
    description: "Quản lý báo giá và đơn hàng bán buôn",
  },
  // ... more screens
};
```

### 2. Screen Provider (`packages/shared-components/src/providers/ScreenProvider.tsx`)

React context provider that handles permission checking and screen rendering:

```typescript
<ScreenProvider user={user} context={additionalContext}>
  <App />
</ScreenProvider>
```

### 3. Menu Generator (`packages/shared-components/src/utils/menuGenerator.ts`)

Generates navigation menus based on user permissions:

```typescript
const menuItems = generateMenu(SALE_APP_MENU, user.permissions);
```

## Screen Organization

Screens are organized by category in `packages/shared-components/src/screens/`:

```
screens/
├── auth/           # Authentication screens
├── pos/            # Point of Sale screens
├── b2b/            # B2B management screens
├── medical/        # Medical/healthcare screens
├── inventory/      # Inventory management screens
├── financial/      # Financial management screens
├── marketing/      # Marketing screens
└── management/     # General management screens
```

## Usage in Apps

### 1. Setup Screen Provider

```typescript
import { ScreenProvider } from '@nam-viet-erp/shared-components';

const App = () => {
  const user = {
    id: 'user-123',
    name: 'John Doe',
    permissions: ['pos.access', 'sales.create', 'b2b.access'],
    role: 'sales'
  };

  const screenContext = {
    employee: currentEmployee,
    appType: 'sale',
  };

  return (
    <ScreenProvider user={user} context={screenContext}>
      <AppContent />
    </ScreenProvider>
  );
};
```

### 2. Render Screens

#### Option A: Using Screen Component

```typescript
import { Screen } from '@nam-viet-erp/shared-components';

// Renders screen if user has permission, otherwise shows fallback
<Screen
  screenKey="pos.main"
  props={{ customProp: 'value' }}
  fallback={<div>Access Denied</div>}
/>
```

#### Option B: Using Hook

```typescript
import { useScreens } from '@nam-viet-erp/shared-components';

const MyComponent = () => {
  const { renderScreen, hasPermission } = useScreens();

  if (!hasPermission('pos.main')) {
    return <div>No access</div>;
  }

  return renderScreen('pos.main', { customProp: 'value' });
};
```

### 3. Generate Dynamic Routes

```typescript
import { generateRoutes, getRouteMapping, SALE_APP_MENU } from '@nam-viet-erp/shared-components';

const routeMapping = getRouteMapping(SALE_APP_MENU);
const availableRoutes = generateRoutes(routeMapping, user.permissions);

<Routes>
  {availableRoutes.map(({ path, screenKey }) => (
    <Route
      key={path}
      path={path}
      element={<Screen screenKey={screenKey} />}
    />
  ))}
</Routes>
```

### 4. Generate Dynamic Menu

```typescript
import { generateMenu, SALE_APP_MENU } from '@nam-viet-erp/shared-components';

const menuItems = generateMenu(SALE_APP_MENU, user.permissions);

<Menu items={menuItems} />
```

## Permission System

### Permission Format

Permissions follow a hierarchical format: `category.action`

Examples:

- `pos.access` - Access to POS system
- `sales.create` - Create sales orders
- `b2b.access` - Access to B2B features
- `quotes.view` - View quotes
- `medical.access` - Access to medical features

### Screen Access Control

Screens require ALL listed permissions to be accessible:

```typescript
// User needs BOTH pos.access AND sales.create
'pos.main': {
  permissions: ['pos.access', 'sales.create'],
  // ...
}
```

### Menu Access Control

Menu items are automatically filtered based on screen permissions. Parent menu items are hidden if no child items are accessible.

## Adding New Screens

### 1. Create Screen Component

```typescript
// packages/shared-components/src/screens/inventory/NewInventoryPage.tsx
import React from 'react';

interface NewInventoryPageProps {
  user: any;
  appType: string;
  // ... other props
}

const NewInventoryPage: React.FC<NewInventoryPageProps> = (props) => {
  return <div>New Inventory Page</div>;
};

export default NewInventoryPage;
```

### 2. Register Screen

```typescript
// packages/shared-components/src/screens/index.ts
import NewInventoryPage from "./inventory/NewInventoryPage";

export const SCREEN_REGISTRY: ScreenRegistry = {
  // ... existing screens
  "inventory.new": {
    component: NewInventoryPage,
    permissions: ["inventory.create"],
    category: "inventory",
    title: "Thêm hàng hóa",
    description: "Thêm hàng hóa mới vào kho",
  },
};
```

### 3. Add to Menu Configuration

```typescript
// packages/shared-components/src/utils/menuGenerator.ts
export const CMS_APP_MENU: MenuItemConfig[] = [
  {
    key: "inventory",
    label: "📦 Kho hàng",
    children: [
      // ... existing items
      {
        key: "inventory-new",
        label: "Thêm hàng hóa",
        screenKey: "inventory.new",
      },
    ],
  },
];
```

## Migration Strategy

1. **Phase 1**: Move critical screens (POS, B2B, Dashboard)
2. **Phase 2**: Move remaining screens by category
3. **Phase 3**: Remove old screen files from apps
4. **Phase 4**: Update apps to use permission-based layout

## Benefits

1. **DRY Principle**: No duplicate screens across apps
2. **Consistent UX**: Same screens look identical everywhere
3. **Security**: Automatic permission enforcement
4. **Maintainability**: Single place to update screens
5. **Scalability**: Easy to add new apps using existing screens
6. **Flexibility**: Screens can be customized per app via props

## Example Apps

- **Sale App**: Uses POS, B2B, Medical screens
- **CMS App**: Uses Dashboard, Inventory, Financial, Marketing screens
- **Future Mobile App**: Can reuse any existing screens

## Development Workflow

1. Define screen in shared-components
2. Add to screen registry with permissions
3. Add to appropriate app menu configuration
4. Test permission-based access
5. Deploy to all apps automatically
