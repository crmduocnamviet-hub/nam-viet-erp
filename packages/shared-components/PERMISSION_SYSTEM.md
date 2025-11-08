# Permission System Documentation

Hệ thống phân quyền của Nam Việt ERP cho phép kiểm soát truy cập chi tiết đến các chức năng và trang trong ứng dụng.

## 📚 Mục lục

- [Utility Functions](#utility-functions)
- [Hooks](#hooks)
- [Components](#components)
- [Higher Order Components (HOC)](#higher-order-components-hoc)
- [Ví dụ Sử dụng](#ví-dụ-sử-dụng)

## Utility Functions

Các utility functions cho phép kiểm tra quyền và thực thi callback một cách đơn giản, xử lý tự động thông báo lỗi khi không có quyền.

### `checkPermissionAndExecute()`

Function chính để kiểm tra quyền và thực thi callback nếu có quyền.

```typescript
import { checkPermissionAndExecute } from "@nam-viet-erp/shared-components";

// Ví dụ 1: Kiểm tra một quyền
const handleAction = () => {
  checkPermissionAndExecute(
    "roles.create",
    () => {
      // Code thực thi nếu có quyền
      console.log("Creating role...");
    },
    {
      deniedMessage: "Bạn không có quyền tạo vai trò",
    },
  );
};

// Ví dụ 2: Kiểm tra nhiều quyền (yêu cầu TẤT CẢ)
checkPermissionAndExecute(
  ["roles.create", "roles.edit"],
  () => {
    saveRole(data);
  },
  {
    deniedMessage: "Bạn cần quyền tạo và sửa vai trò",
  },
);

// Ví dụ 3: Kiểm tra nhiều quyền (chỉ cần MỘT trong số đó)
checkPermissionAndExecute(
  ["roles.edit", "roles.update"],
  () => {
    updateRole(data);
  },
  {
    requireAny: true,
    deniedMessage: "Bạn cần quyền chỉnh sửa vai trò",
  },
);

// Ví dụ 4: Async callback
await checkPermissionAndExecute("roles.delete", async () => {
  await deleteRoleAPI(id);
  message.success("Đã xóa vai trò");
});

// Ví dụ 5: Silent mode (không hiển thị thông báo)
const result = checkPermissionAndExecute(
  "roles.view",
  () => {
    return getRoleData();
  },
  { silent: true },
);

if (!result) {
  // Tự xử lý khi không có quyền
  console.log("No permission");
}
```

#### Options

```typescript
export interface PermissionCheckOptions {
  /**
   * Custom error message when permission is denied
   */
  deniedMessage?: string;

  /**
   * If true, check if user has ANY of the permissions (OR logic)
   * If false, check if user has ALL permissions (AND logic)
   * Default: false (requires ALL permissions)
   */
  requireAny?: boolean;

  /**
   * If true, don't show notification when permission is denied
   * Default: false (show notification)
   */
  silent?: boolean;
}
```

### `checkAndCreate()`

Kiểm tra quyền CREATE và thực thi callback.

```typescript
import { checkAndCreate } from "@nam-viet-erp/shared-components";

const handleCreate = () => {
  checkAndCreate(
    "roles", // Resource name - sẽ check quyền "roles.create"
    () => {
      setEditingRole(null);
      setModalVisible(true);
    },
    "Bạn không có quyền tạo vai trò mới", // Optional custom message
  );
};
```

### `checkAndEdit()`

Kiểm tra quyền EDIT/UPDATE và thực thi callback. Function này tự động check cả `resource.edit` VÀ `resource.update` (chỉ cần một trong hai).

```typescript
import { checkAndEdit } from "@nam-viet-erp/shared-components";

const handleEdit = (role: Role) => {
  checkAndEdit(
    "roles", // Sẽ check "roles.edit" HOẶC "roles.update"
    () => {
      setEditingRole(role);
      setModalVisible(true);
    },
    "Bạn không có quyền chỉnh sửa vai trò",
  );
};
```

### `checkAndDelete()`

Kiểm tra quyền DELETE và thực thi callback.

```typescript
import { checkAndDelete } from "@nam-viet-erp/shared-components";

const handleDelete = async (role: Role) => {
  // Business logic check trước
  if (role.is_system_role) {
    message.error("Không thể xóa vai trò hệ thống");
    return;
  }

  // Permission check
  await checkAndDelete(
    "roles",
    async () => {
      try {
        await deleteRoleAPI(role.id);
        message.success(`Đã xóa vai trò "${role.title}"`);
        loadRoles();
      } catch (error) {
        message.error("Không thể xóa vai trò");
      }
    },
    "Bạn không có quyền xóa vai trò",
  );
};
```

### `checkAndView()`

Kiểm tra quyền VIEW và thực thi callback.

```typescript
import { checkAndView } from "@nam-viet-erp/shared-components";

const handleViewDetails = (role: Role) => {
  checkAndView(
    "roles",
    () => {
      navigate(`/roles/${role.id}`);
    },
    "Bạn không có quyền xem chi tiết vai trò",
  );
};
```

### `checkPermission()`

Chỉ kiểm tra quyền mà không thực thi callback. Trả về `boolean`.

```typescript
import { checkPermission } from "@nam-viet-erp/shared-components";

const MyComponent = () => {
  // Kiểm tra một quyền
  const canCreate = checkPermission("roles.create");

  // Kiểm tra nhiều quyền (yêu cầu TẤT CẢ)
  const canManage = checkPermission(["roles.create", "roles.edit", "roles.delete"]);

  // Kiểm tra nhiều quyền (chỉ cần MỘT)
  const canModify = checkPermission(["roles.edit", "roles.update"], true);

  return (
    <div>
      {canCreate && <Button>Tạo mới</Button>}
      {canManage && <AdminPanel />}
    </div>
  );
};
```

### `checkCustomAndExecute()`

Cho phép custom logic kiểm tra quyền phức tạp.

```typescript
import { checkCustomAndExecute } from "@nam-viet-erp/shared-components";

const handleComplexAction = (record: Role) => {
  checkCustomAndExecute(
    () => {
      // Custom permission logic
      const { hasPermission } = usePermission();
      const isOwner = record.created_by === currentUserId;
      const isAdmin = hasPermission("management.admin");

      return isOwner || isAdmin;
    },
    () => {
      // Execute action
      performAction(record);
    },
    "Chỉ admin hoặc người tạo mới có quyền thực hiện thao tác này",
  );
};
```

### Ưu điểm của Utility Functions

✅ **Đơn giản**: One-liner để check permission và execute callback
✅ **Tự động xử lý lỗi**: Hiển thị notification khi không có quyền
✅ **Type-safe**: Full TypeScript support với generic types
✅ **Async support**: Hoạt động với cả sync và async callbacks
✅ **Flexible**: Nhiều options để customize behavior
✅ **Clean code**: Giảm boilerplate code trong handlers

### Khi nào dùng Utility Functions?

Sử dụng utility functions khi bạn cần:

- ✅ Kiểm tra quyền trong event handlers (onClick, onSubmit, etc.)
- ✅ Bảo vệ logic nghiệp vụ phức tạp
- ✅ Tự động hiển thị thông báo lỗi
- ✅ Code đơn giản, ngắn gọn

Sử dụng Hooks/Components khi bạn cần:

- ✅ Conditional rendering trong JSX
- ✅ Ẩn/hiện UI elements dựa trên quyền
- ✅ Page-level protection

## Hooks

### `usePermission()`

Hook chính để kiểm tra quyền của người dùng.

```typescript
import { usePermission } from "@nam-viet-erp/shared-components";

const MyComponent = () => {
  const {
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    canAccessScreen,
    getAllPermissions,
    permissions,
  } = usePermission();

  // Kiểm tra một quyền cụ thể
  if (hasPermission("roles.create")) {
    // Hiển thị nút tạo vai trò
  }

  // Kiểm tra có tất cả các quyền
  if (hasAllPermissions(["roles.create", "roles.edit"])) {
    // Hiển thị form tạo/sửa
  }

  // Kiểm tra có ít nhất một trong các quyền
  if (hasAnyPermission(["roles.view", "roles.edit"])) {
    // Hiển thị danh sách vai trò
  }

  // Kiểm tra quyền truy cập screen
  if (canAccessScreen("management.roles")) {
    // Cho phép vào trang quản lý vai trò
  }

  return <div>...</div>;
};
```

### `useResourcePermission(resource)`

Hook tiện lợi để kiểm tra quyền CRUD cho một resource cụ thể.

```typescript
import { useResourcePermission } from "@nam-viet-erp/shared-components";

const RoleManagement = () => {
  const { canView, canCreate, canEdit, canDelete, canManage } =
    useResourcePermission("roles");

  return (
    <div>
      {canView && <RoleList />}
      {canCreate && <Button>Tạo vai trò</Button>}
      {canEdit && <Button>Sửa</Button>}
      {canDelete && <Button>Xóa</Button>}
    </div>
  );
};
```

## Components

### `<PermissionGuard>`

Component để bảo vệ nội dung dựa trên quyền.

#### Props

| Prop             | Type        | Required | Description                                   |
| ---------------- | ----------- | -------- | --------------------------------------------- |
| `permissions`    | `string[]`  | No       | Các quyền bắt buộc - user phải có TẤT CẢ      |
| `anyPermissions` | `string[]`  | No       | Các quyền thay thế - user phải có ÍT NHẤT MỘT |
| `screenKey`      | `string`    | No       | Screen key để kiểm tra permission             |
| `children`       | `ReactNode` | Yes      | Nội dung hiển thị nếu có quyền                |
| `fallback`       | `ReactNode` | No       | Nội dung thay thế nếu không có quyền          |
| `showDenied`     | `boolean`   | No       | Hiện trang Access Denied thay vì ẩn           |
| `deniedMessage`  | `string`    | No       | Custom message cho Access Denied              |

#### Ví dụ

```typescript
import { PermissionGuard } from "@nam-viet-erp/shared-components";

// Ví dụ 1: Bảo vệ một button
<PermissionGuard permissions={["roles.create"]}>
  <Button onClick={handleCreate}>Tạo vai trò mới</Button>
</PermissionGuard>

// Ví dụ 2: Yêu cầu một trong các quyền
<PermissionGuard anyPermissions={["roles.edit", "roles.create"]}>
  <RoleForm />
</PermissionGuard>

// Ví dụ 3: Kiểm tra screen permission và hiện trang denied
<PermissionGuard
  screenKey="management.roles"
  showDenied
  deniedMessage="Bạn cần quyền admin để truy cập"
>
  <RoleManagementPage />
</PermissionGuard>

// Ví dụ 4: Với fallback content
<PermissionGuard
  permissions={["roles.delete"]}
  fallback={<Text type="secondary">Không có quyền xóa</Text>}
>
  <Button danger>Xóa vai trò</Button>
</PermissionGuard>
```

## Higher Order Components (HOC)

### `withPermission()`

HOC để wrap component với permission checking.

```typescript
import { withPermission } from "@nam-viet-erp/shared-components";

const RoleForm = ({ role }) => {
  return <Form>...</Form>;
};

// Wrap component
const ProtectedRoleForm = withPermission(RoleForm, {
  permissions: ["roles.create", "roles.edit"],
  showDenied: true
});

// Sử dụng
<ProtectedRoleForm role={selectedRole} />
```

### `requireAllPermissions()`

HOC yêu cầu TẤT CẢ các quyền.

```typescript
import { requireAllPermissions } from "@nam-viet-erp/shared-components";

const RoleDeleteButton = ({ onDelete }) => {
  return <Button danger onClick={onDelete}>Xóa</Button>;
};

const ProtectedDeleteButton = requireAllPermissions(
  RoleDeleteButton,
  ["roles.delete", "roles.edit"],
  true // showDenied
);
```

### `requireAnyPermission()`

HOC yêu cầu ÍT NHẤT MỘT quyền.

```typescript
import { requireAnyPermission } from "@nam-viet-erp/shared-components";

const RoleActionButtons = () => {
  return (
    <Space>
      <Button>Sửa</Button>
      <Button>Xóa</Button>
    </Space>
  );
};

const ProtectedActions = requireAnyPermission(
  RoleActionButtons,
  ["roles.edit", "roles.delete"]
);
```

### `requireScreenAccess()`

HOC để bảo vệ toàn bộ page với screen permission.

```typescript
import { requireScreenAccess } from "@nam-viet-erp/shared-components";

const RoleManagementPage = () => {
  return <div>...</div>;
};

export default requireScreenAccess(
  RoleManagementPage,
  "management.roles",
  true // showDenied
);
```

## Ví dụ Sử dụng

### 1. Sử dụng Utility Functions trong Handlers (Recommended)

```typescript
import { checkAndCreate, checkAndEdit, checkAndDelete } from "@nam-viet-erp/shared-components";

const RoleManagementPage = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  // ✅ SIMPLE: One-liner với automatic error handling
  const handleCreate = () => {
    checkAndCreate("roles", () => {
      setEditingRole(null);
      setModalVisible(true);
    }, "Bạn không có quyền tạo vai trò mới");
  };

  const handleEdit = (role: Role) => {
    checkAndEdit("roles", () => {
      setEditingRole(role);
      setModalVisible(true);
    }, "Bạn không có quyền chỉnh sửa vai trò");
  };

  const handleDelete = async (role: Role) => {
    // Business logic check
    if (role.is_system_role) {
      message.error("Không thể xóa vai trò hệ thống");
      return;
    }

    // Permission check với async callback
    await checkAndDelete("roles", async () => {
      try {
        await deleteRoleAPI(role.id);
        message.success(`Đã xóa vai trò "${role.title}"`);
        loadRoles();
      } catch (error) {
        message.error("Không thể xóa vai trò");
      }
    }, "Bạn không có quyền xóa vai trò");
  };

  return (
    <div>
      <Button onClick={handleCreate}>Tạo vai trò mới</Button>
      <Table dataSource={roles} />
    </div>
  );
};
```

### 2. Bảo vệ Actions trong Table

```typescript
import { PermissionGuard, useResourcePermission } from "@nam-viet-erp/shared-components";

const RoleManagementPage = () => {
  const { canEdit, canDelete, canCreate } = useResourcePermission("roles");

  const columns = [
    // ... other columns
    {
      title: "Thao tác",
      key: "action",
      render: (_, record) => (
        <Space>
          <PermissionGuard permissions={["roles.edit"]}>
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            >
              Sửa
            </Button>
          </PermissionGuard>

          <PermissionGuard permissions={["roles.delete"]}>
            {!record.is_system_role && (
              <Popconfirm
                title="Xác nhận xóa"
                onConfirm={() => handleDelete(record)}
              >
                <Button type="link" danger icon={<DeleteOutlined />}>
                  Xóa
                </Button>
              </Popconfirm>
            )}
          </PermissionGuard>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PermissionGuard permissions={["roles.create"]}>
        <Button type="primary" onClick={handleCreate}>
          Tạo vai trò mới
        </Button>
      </PermissionGuard>

      <Table columns={columns} dataSource={roles} />
    </div>
  );
};
```

### 2. Conditional Rendering trong Form

```typescript
const RoleForm = ({ mode }) => {
  const { canCreate, canEdit } = useResourcePermission("roles");

  // Chỉ cho phép submit nếu có quyền tương ứng
  const canSubmit = mode === "create" ? canCreate : canEdit;

  return (
    <Form onFinish={handleSubmit}>
      <Form.Item name="key" label="Mã vai trò">
        <Input />
      </Form.Item>

      <Form.Item name="title" label="Tên vai trò">
        <Input />
      </Form.Item>

      <PermissionGuard
        anyPermissions={["roles.create", "roles.edit"]}
        fallback={<Text type="danger">Không có quyền lưu</Text>}
      >
        <Button type="primary" htmlType="submit" disabled={!canSubmit}>
          {mode === "create" ? "Tạo mới" : "Cập nhật"}
        </Button>
      </PermissionGuard>
    </Form>
  );
};
```

### 3. Menu Động dựa trên Permissions

```typescript
import { usePermission } from "@nam-viet-erp/shared-components";

const SettingsMenu = () => {
  const { hasPermission, canAccessScreen } = usePermission();

  const menuItems = [
    canAccessScreen("management.users") && {
      key: "/users",
      label: "Quản lý Tài khoản",
    },
    canAccessScreen("management.roles") && {
      key: "/roles",
      label: "Quản lý Vai trò",
    },
    hasPermission("rooms.view") && {
      key: "/rooms",
      label: "Quản lý Phòng",
    },
  ].filter(Boolean); // Remove falsy values

  return <Menu items={menuItems} />;
};
```

### 4. Protecting Entire Page

```typescript
// RoleManagementPage.tsx
import { requireScreenAccess } from "@nam-viet-erp/shared-components";

const RoleManagementPage = () => {
  // Component logic
  return (
    <div>
      <h1>Quản lý Vai trò</h1>
      {/* Page content */}
    </div>
  );
};

// Export với protection
export default requireScreenAccess(
  RoleManagementPage,
  "management.roles",
  true // Show access denied page if no permission
);
```

### 5. Complex Permission Logic

```typescript
const ComplexComponent = () => {
  const { hasAllPermissions, hasAnyPermission } = usePermission();

  // Yêu cầu tất cả permissions để admin
  const isAdmin = hasAllPermissions([
    "management.access",
    "roles.create",
    "roles.edit",
    "roles.delete",
  ]);

  // Yêu cầu ít nhất một permission để view
  const canView = hasAnyPermission(["roles.view", "users.view"]);

  return (
    <div>
      {canView && <RoleList />}

      <PermissionGuard
        permissions={["roles.create"]}
        fallback={<Alert message="Chỉ admin mới có thể tạo vai trò" />}
      >
        {isAdmin && <CreateRoleButton />}
      </PermissionGuard>
    </div>
  );
};
```

## Best Practices

### 1. Chọn đúng công cụ cho từng tình huống

**Sử dụng Utility Functions (checkAndCreate, checkAndEdit, etc.) khi:**

```typescript
// ✅ Bảo vệ event handlers
const handleCreate = () => {
  checkAndCreate("roles", () => {
    openModal();
  });
};

// ✅ Bảo vệ business logic
const handleSubmit = async (data) => {
  await checkAndEdit("products", async () => {
    await updateProduct(data);
  });
};
```

**Sử dụng Hooks (usePermission, useResourcePermission) khi:**

```typescript
// ✅ Conditional rendering
const { canCreate, canEdit } = useResourcePermission("roles");

return (
  <div>
    {canCreate && <CreateButton />}
    {canEdit && <EditForm />}
  </div>
);
```

**Sử dụng Components (PermissionGuard) khi:**

```typescript
// ✅ Wrap UI elements
<PermissionGuard permissions={["roles.delete"]}>
  <DeleteButton />
</PermissionGuard>
```

**Sử dụng HOC (requireScreenAccess) khi:**

```typescript
// ✅ Bảo vệ toàn bộ page
export default requireScreenAccess(PageComponent, "management.roles", true);
```

### 2. Luôn hiện feedback khi không có quyền

```typescript
// ✅ Good: Automatic error message
checkAndCreate("roles", () => {
  createRole();
}, "Bạn không có quyền tạo vai trò");

// ✅ Good: Fallback UI
<PermissionGuard
  permissions={["roles.delete"]}
  fallback={<Text type="secondary">Không có quyền xóa</Text>}
>
  <DeleteButton />
</PermissionGuard>
```

### 3. Kết hợp permission check với business logic

```typescript
const handleDelete = async (role: Role) => {
  // Business logic trước
  if (role.is_system_role) {
    message.error("Không thể xóa vai trò hệ thống");
    return;
  }

  // Permission check sau
  await checkAndDelete("roles", async () => {
    await deleteRole(role.id);
  });
};
```

### 4. Sử dụng resource-based permissions

```typescript
// ✅ Good: Consistent naming
checkAndCreate("roles", callback);
checkAndEdit("products", callback);
checkAndDelete("users", callback);

// ❌ Bad: Hardcoded permission strings
checkPermissionAndExecute("some.random.permission", callback);
```

### 5. Cache permission checks trong useMemo nếu phức tạp

```typescript
const canPerformAction = useMemo(() => {
  return hasAllPermissions(["perm1", "perm2"]) && someBusinessLogic;
}, [hasAllPermissions, someBusinessLogic]);
```

## Available Permissions

Xem file `packages/shared-components/src/screens/index.ts` để biết tất cả permissions có sẵn trong hệ thống.

### Permission Categories:

- `auth.*` - Authentication
- `pos.*` - POS/Retail
- `b2b.*` - B2B/Wholesale
- `medical.*` - Medical
- `inventory.*` - Inventory
- `warehouse.*` - Warehouse
- `financial.*` - Financial
- `marketing.*` - Marketing
- `management.*` - Management
- `users.*`, `employees.*`, `roles.*` - User management

### Common Patterns:

- `resource.view` - View/list
- `resource.create` - Create new
- `resource.edit` / `resource.update` - Edit existing
- `resource.delete` - Delete
- `resource.manage` - Full management access
- `resource.access` - Basic access to module
