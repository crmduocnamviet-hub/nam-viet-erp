# MainLayout Component

MainLayout là một component layout chung được thiết kế để tái sử dụng cho nhiều ứng dụng khác nhau trong hệ thống Nam Việt ERP.

## Tính năng

- ✅ **Responsive Design**: Tự động điều chỉnh giữa desktop (fixed sidebar) và mobile (drawer menu)
- ✅ **Collapsible Sidebar**: Có thể thu gọn/mở rộng sidebar
- ✅ **Header với User Info**: Avatar, tên người dùng và dropdown menu
- ✅ **Notification Button**: Button thông báo với badge indicator
- ✅ **Tùy chỉnh cao**: Nhiều props để tùy chỉnh màu sắc, kích thước, v.v.
- ✅ **Theme Support**: Hỗ trợ custom theme cho Ant Design
- ✅ **Flexible Content**: Có thể sử dụng với React Router Outlet hoặc render children trực tiếp

## Cài đặt

```bash
# MainLayout đã được export từ @nam-viet-erp/shared-components
import { MainLayout } from "@nam-viet-erp/shared-components";
```

## Props

| Prop                    | Type                                | Required | Default          | Description                                              |
| ----------------------- | ----------------------------------- | -------- | ---------------- | -------------------------------------------------------- |
| `menuItems`             | `MenuProps["items"]`                | ✅ Yes   | -                | Menu items cho sidebar                                   |
| `logo`                  | `string \| ReactNode`               | ❌ No    | -                | Logo URL hoặc React component                            |
| `appName`               | `string`                            | ❌ No    | `"Nam Việt ERP"` | Tên ứng dụng hiển thị khi sidebar không collapsed        |
| `user`                  | `{ email?: string; name?: string }` | ❌ No    | -                | Thông tin người dùng                                     |
| `onLogout`              | `() => Promise<void>`               | ✅ Yes   | -                | Handler khi đăng xuất                                    |
| `onMenuClick`           | `MenuProps["onClick"]`              | ❌ No    | -                | Handler khi click menu item                              |
| `initialCollapsed`      | `boolean`                           | ❌ No    | `true`           | Trạng thái ban đầu của sidebar (collapsed/expanded)      |
| `siderBg`               | `string`                            | ❌ No    | `"#001529"`      | Màu nền của sidebar                                      |
| `collapsedWidth`        | `number`                            | ❌ No    | `50`             | Độ rộng sidebar khi collapsed                            |
| `siderWidth`            | `number`                            | ❌ No    | `230`            | Độ rộng sidebar khi expanded                             |
| `showNotificationBadge` | `boolean`                           | ❌ No    | `false`          | Hiển thị badge dot trên notification button              |
| `onNotificationClick`   | `() => void`                        | ❌ No    | -                | Handler khi click notification button                    |
| `children`              | `ReactNode`                         | ❌ No    | -                | Content để render. Nếu không có, sẽ sử dụng `<Outlet />` |

## Sử dụng cơ bản

### 1. Với React Router (sử dụng Outlet)

```tsx
import React from "react";
import { MainLayout } from "@nam-viet-erp/shared-components";
import { useNavigate } from "react-router-dom";
import { signOut } from "@nam-viet-erp/services";
import logo from "./assets/logo.png";

const menuItems = [
  { label: "Dashboard", key: "/", icon: <HomeOutlined /> },
  { label: "Products", key: "/products", icon: <ShopOutlined /> },
];

const AppLayout = () => {
  const navigate = useNavigate();

  const handleMenuClick = (e) => {
    navigate(e.key);
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <MainLayout
      menuItems={menuItems}
      logo={logo}
      appName="My App"
      user={{ name: "John Doe", email: "john@example.com" }}
      onLogout={handleLogout}
      onMenuClick={handleMenuClick}
    />
  );
};
```

Trong trường hợp này, bạn cần setup routes ở parent component:

```tsx
<Route path="/" element={<AppLayout />}>
  <Route index element={<Dashboard />} />
  <Route path="products" element={<Products />} />
</Route>
```

### 2. Với children (render Routes trực tiếp)

```tsx
import React from "react";
import { MainLayout } from "@nam-viet-erp/shared-components";
import { Routes, Route } from "react-router-dom";

const AppLayout = () => {
  // ... same setup as above

  return (
    <MainLayout
      menuItems={menuItems}
      logo={logo}
      appName="My App"
      user={{ name: "John Doe", email: "john@example.com" }}
      onLogout={handleLogout}
      onMenuClick={handleMenuClick}
    >
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/products" element={<Products />} />
      </Routes>
    </MainLayout>
  );
};
```

## Examples

### CMS App Example

Xem file: `apps/cms/src/components/CMSAppLayout.example.tsx`

```tsx
import { MainLayout } from "@nam-viet-erp/shared-components";

const CMSAppLayout = () => {
  return (
    <ConfigProvider theme={namVietTheme} locale={viVN}>
      <MainLayout
        menuItems={menuItems}
        logo={logo}
        appName="Nam Việt EMS"
        user={{ email: user?.email }}
        onLogout={handleLogout}
        onMenuClick={handleMenuClick}
        siderBg="#015ba9ff"
        collapsedWidth={50}
        siderWidth={230}
      >
        <Routes>{/* Your routes here */}</Routes>
      </MainLayout>
    </ConfigProvider>
  );
};
```

### Sale App Example

Xem file: `apps/sale/src/components/SaleAppLayout.example.tsx`

```tsx
import { MainLayout } from "@nam-viet-erp/shared-components";

const SaleAppLayout = () => {
  return (
    <ConfigProvider theme={namVietTheme} locale={viVN}>
      <MainLayout
        menuItems={filteredMenuItems}
        logo={logo}
        appName="Nam Việt Sale"
        user={{
          name: employee?.full_name,
          email: employee?.employee_code,
        }}
        onLogout={handleLogout}
        onMenuClick={handleMenuClick}
        siderBg="#015ba9ff"
        showNotificationBadge={hasNewNotifications}
        onNotificationClick={handleNotificationClick}
      >
        <Routes>{/* Your routes here */}</Routes>
      </MainLayout>
    </ConfigProvider>
  );
};
```

## Custom Theme

MainLayout hoạt động tốt với Ant Design ConfigProvider. Bạn có thể tùy chỉnh theme như sau:

```tsx
const customTheme = {
  token: {
    colorBgLayout: "#f0f2f5",
    colorPrimary: "#1773adff",
    borderRadius: 5,
  },
  components: {
    Layout: {
      headerBg: "#ffffff",
      siderBg: "#015ba9ff",
      triggerBg: "#015ba9ff",
    },
    Menu: {
      darkItemBg: "#015ba9ff",
      darkSubMenuItemBg: "#015ba9ff",
      darkItemColor: "rgba(255, 255, 255, 0.75)",
      darkItemHoverBg: "rgba(255, 255, 255, 0.15)",
      darkItemHoverColor: "#ffffff",
      darkItemSelectedBg: "#00809D",
      darkItemSelectedColor: "#ffffff",
    },
  },
};

<ConfigProvider theme={customTheme}>
  <MainLayout {...props} />
</ConfigProvider>;
```

## Responsive Breakpoints

MainLayout sử dụng Ant Design Grid breakpoints:

- **Desktop**: `lg` breakpoint và lớn hơn (≥ 992px) - Hiển thị fixed sidebar
- **Mobile**: Nhỏ hơn `lg` breakpoint (< 992px) - Hiển thị drawer menu

## Tips

1. **Menu Items với icon**: Luôn thêm icon cho menu items để UI đẹp hơn khi sidebar collapsed
2. **Permission-based menu**: Filter menu items dựa trên quyền của user trước khi truyền vào MainLayout
3. **Notification Badge**: Sử dụng `showNotificationBadge={true}` khi có thông báo mới
4. **Custom Logo**: Có thể truyền string (URL) hoặc React component cho logo prop

## Migration Guide

### Từ CMS AppLayout cũ sang MainLayout mới

1. Import MainLayout từ shared-components
2. Di chuyển menuItems definition
3. Wrap Routes với MainLayout và truyền props
4. Xóa code cũ của Sider, Header, Drawer

Xem full example tại: `apps/cms/src/components/CMSAppLayout.example.tsx`

### Từ Sale AppLayout cũ sang MainLayout mới

Similar steps như CMS, nhưng cần:

1. Convert horizontal menu sang vertical menu items
2. Filter menu items dựa trên permissions
3. Pass employee info vào user prop

Xem full example tại: `apps/sale/src/components/SaleAppLayout.example.tsx`

## Notes

- MainLayout sử dụng `position: fixed` cho sidebar trên desktop để tránh scroll issues
- Content area tự động thêm padding và background color
- Header shadow được thêm để tạo depth
- Mobile drawer tự động đóng khi chọn menu item
