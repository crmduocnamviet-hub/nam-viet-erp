import React from "react";
import type { MenuProps } from "antd";
import {
  ShoppingCartOutlined,
  CalendarOutlined,
  ShopOutlined,
  DashboardOutlined,
  MedicineBoxOutlined,
  BankOutlined,
  RocketOutlined,
  SettingOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { hasScreenPermission } from "../screens";

export interface MenuItemConfig {
  key: string;
  label: string;
  icon?: React.ReactNode;
  screenKey?: string;
  children?: MenuItemConfig[];
  permissions?: string[];
}

// Define app-specific menu structures
export const SALE_APP_MENU: MenuItemConfig[] = [
  {
    label: "📋 Công việc hôm nay",
    key: "/",
    screenKey: "staff.sales-dashboard",
    permissions: ["sales.dashboard"],
    icon: <UserOutlined />,
  },
  {
    label: "📋 Công việc hôm nay",
    key: "/",
    screenKey: "staff.inventory-dashboard",
    permissions: ["inventory.dashboard"],
    icon: <UserOutlined />,
  },
  {
    label: "📋 Công việc hôm nay",
    key: "/",
    screenKey: "staff.delivery-dashboard",
    permissions: ["delivery.dashboard"],
    icon: <UserOutlined />,
  },
  {
    label: "💰 Bán hàng (POS)",
    key: "/pos",
    icon: <ShoppingCartOutlined />,
    screenKey: "pos.main",
    permissions: ["pos.access"],
  },
  {
    label: "🏢 Bán Buôn",
    key: "wholesale",
    icon: <ShopOutlined />,
    permissions: ["b2b.access"],
    children: [
      {
        label: "B2B Sales Dashboard",
        key: "/b2b-dashboard",
        screenKey: "b2b.dashboard",
        permissions: ["b2b.access"],
      },
      {
        label: "Tạo Báo Giá / Đơn Hàng",
        key: "/create-quote",
        screenKey: "b2b.create-quote",
        permissions: ["b2b.create"],
      },
      {
        label: "Danh sách Đơn hàng",
        key: "/store-channel",
        screenKey: "b2b.orders",
        permissions: ["b2b.view"],
      },
    ],
  },
  {
    label: "📦 Sản phẩm",
    key: "products",
    icon: <MedicineBoxOutlined />,
    children: [
      {
        label: "Danh sách sản phẩm",
        key: "/products",
        screenKey: "inventory.products",
        permissions: ["products.view"],
      },
      {
        label: "Danh sách Combo",
        key: "/combos",
        screenKey: "inventory.combos",
        permissions: ["products.view"],
      },
    ],
  },
  {
    label: "📅 Đặt lịch & Khám bệnh",
    key: "scheduling",
    icon: <CalendarOutlined />,
    permissions: ["medical.access"],
    children: [
      {
        label: "Lịch hẹn hôm nay",
        key: "/scheduling",
        screenKey: "medical.scheduling",
        permissions: ["medical.access"],
      },
      {
        label: "Quản lý bệnh nhân",
        key: "/patients",
        screenKey: "medical.patients",
        permissions: ["patients.view"],
      },
      {
        label: "Hồ sơ y tế",
        key: "/medical-records",
        screenKey: "medical.records",
        permissions: ["medical.access"],
      },
    ],
  },
];

export const CMS_APP_MENU: MenuItemConfig[] = [
  {
    key: "dashboard",
    label: "📊 Tổng quan",
    icon: <DashboardOutlined />,
    screenKey: "management.dashboard",
  },
  {
    key: "inventory",
    label: "📦 Kho hàng",
    icon: <MedicineBoxOutlined />,
    children: [
      {
        key: "products",
        label: "Sản phẩm",
        screenKey: "inventory.products",
      },
      {
        key: "combos",
        label: "Combo khuyến mãi",
        screenKey: "inventory.combos",
      },
      {
        key: "purchase-orders",
        label: "Đơn mua hàng",
        screenKey: "inventory.purchase-orders",
      },
    ],
  },
  {
    key: "b2b",
    label: "📋 Đơn hàng B2B",
    icon: <ShopOutlined />,
    screenKey: "b2b.orders",
  },
  {
    key: "financial",
    label: "💰 Tài chính",
    icon: <BankOutlined />,
    children: [
      {
        key: "transactions",
        label: "Giao dịch",
        screenKey: "financial.transactions",
      },
      {
        key: "ledger",
        label: "Sổ cái",
        screenKey: "financial.ledger",
      },
      {
        key: "funds",
        label: "Quản lý quỹ",
        screenKey: "financial.funds",
      },
    ],
  },
  {
    key: "marketing",
    label: "🎯 Marketing",
    icon: <RocketOutlined />,
    children: [
      {
        key: "campaigns",
        label: "Chiến dịch",
        screenKey: "marketing.campaigns",
      },
      {
        key: "segments",
        label: "Phân khúc khách hàng",
        screenKey: "marketing.segments",
      },
    ],
  },
  {
    key: "management",
    label: "👥 Quản lý",
    icon: <SettingOutlined />,
    children: [
      {
        key: "employees",
        label: "Nhân viên",
        screenKey: "management.employees",
      },
      {
        key: "rooms",
        label: "Phòng ban",
        screenKey: "management.rooms",
      },
    ],
  },
];

// Helper function to check if user has any of the required permissions
const hasAnyPermission = (
  userPermissions: string[],
  requiredPermissions: string[]
): boolean => {
  return requiredPermissions.some((permission) =>
    userPermissions.includes(permission)
  );
};

// Generate menu items based on user permissions
export const generateMenu = (
  menuConfig: MenuItemConfig[],
  userPermissions: string[]
): MenuProps["items"] => {
  const filterMenuItems = (items: MenuItemConfig[]): MenuProps["items"] => {
    return items
      .filter((item) => {
        if (!item.permissions?.length) return true;
        // Check explicit permissions first - if user doesn't have required permissions, hide the item completely
        if (item.permissions && item.permissions.length > 0) {
          return hasAnyPermission(userPermissions, item.permissions);
        }

        // If item has a screenKey, check permissions for that screen
        if (item.screenKey) {
          return hasScreenPermission(item.screenKey, userPermissions);
        }

        // If item has children, check if any children are accessible
        if (item.children) {
          const accessibleChildren = item.children.filter((child) => {
            // Check child's explicit permissions
            if (child.permissions && child.permissions.length > 0) {
              return hasAnyPermission(userPermissions, child.permissions);
            }

            if (child.screenKey) {
              return hasScreenPermission(child.screenKey, userPermissions);
            }
            return true;
          });
          return accessibleChildren.length > 0;
        }

        // If no permissions, screenKey, or children specified, include by default
        return true;
      })
      .map((item) => {
        const menuItem: any = {
          key: item.key,
          label: item.label,
          icon: item.icon,
        };

        // Add children if they exist and are accessible
        if (item.children) {
          const accessibleChildren = filterMenuItems(item.children);
          if (accessibleChildren && accessibleChildren.length > 0) {
            menuItem.children = accessibleChildren;
          }
        }

        return menuItem;
      });
  };

  return filterMenuItems(menuConfig);
};

// Helper to get route mapping from menu config
export const getRouteMapping = (
  menuConfig: MenuItemConfig[]
): Record<string, string> => {
  const mapping: Record<string, string> = {};

  const extractRoutes = (items: MenuItemConfig[], parentPath = "") => {
    items.forEach((item) => {
      const path = parentPath ? `${parentPath}/${item.key}` : `/${item.key}`;

      if (item.screenKey) {
        mapping[path] = item.screenKey;
      }

      if (item.children) {
        extractRoutes(item.children, path);
      }
    });
  };

  extractRoutes(menuConfig);
  return mapping;
};

// Permission-based route generator
export const generateRoutes = (
  routeMapping: Record<string, string>,
  userPermissions: string[]
): Array<{ path: string; screenKey: string }> => {
  return Object.entries(routeMapping)
    .filter(([_, screenKey]) => hasScreenPermission(screenKey, userPermissions))
    .map(([path, screenKey]) => ({ path, screenKey }));
};
