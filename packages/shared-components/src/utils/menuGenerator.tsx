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
  InboxOutlined,
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
      {
        label: "Đơn mua hàng",
        key: "/purchase-orders",
        screenKey: "inventory.purchase-orders",
        permissions: ["inventory.purchase-orders.view"],
      },
    ],
  },
  {
    label: "🏭 Quản Lý Kho Vận",
    key: "warehouse",
    icon: <InboxOutlined />,
    permissions: ["warehouse.access"],
    children: [
      {
        label: "Đơn Đặt Hàng",
        key: "/warehouse/purchase-orders",
        screenKey: "warehouse.purchase-orders",
        permissions: ["warehouse.purchase-orders.view"],
      },
      {
        label: "Nhận Hàng",
        key: "/warehouse/receiving",
        screenKey: "warehouse.receiving",
        permissions: ["warehouse.receiving.access"],
      },
      {
        label: "Xuất Hàng",
        key: "/warehouse/picking",
        screenKey: "warehouse.picking",
        permissions: ["warehouse.picking.access"],
      },
      {
        label: "Kho VAT",
        key: "/warehouse/vat-inventory",
        screenKey: "warehouse.vat-inventory",
        permissions: ["warehouse.vat.view"],
      },
      {
        label: "Đối Chiếu VAT",
        key: "/warehouse/vat-reconciliation",
        screenKey: "warehouse.vat-reconciliation",
        permissions: ["warehouse.vat.reconcile"],
      },
      {
        label: "Chuyển kho",
        key: "/warehouse/transfers",
        screenKey: "warehouse.transfers",
        permissions: ["warehouse.transfers.view"],
      },
    ],
  },
  {
    label: "🏢 Nhà Cung Cấp",
    key: "/warehouse/suppliers",
    icon: <ShopOutlined />,
    screenKey: "warehouse.suppliers",
    permissions: ["warehouse.suppliers.view"],
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
    key: "b2b",
    label: "🏢 Bán Buôn (B2B)",
    icon: <ShopOutlined />,
    children: [
      {
        key: "b2b-dashboard",
        label: "B2B Dashboard",
        screenKey: "b2b.dashboard",
      },
      {
        key: "b2b-orders",
        label: "Danh sách Đơn hàng",
        screenKey: "b2b.orders",
      },
      {
        key: "create-quote",
        label: "Tạo Báo Giá / Đơn Hàng",
        screenKey: "b2b.create-quote",
      },
      {
        key: "quick-quote",
        label: "Báo giá nhanh",
        screenKey: "b2b.quick-quote",
      },
    ],
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
    key: "warehouse",
    label: "🏭 Quản Lý Kho Vận",
    icon: <InboxOutlined />,
    children: [
      {
        key: "warehouse-purchase-orders",
        label: "Đơn Đặt Hàng",
        screenKey: "warehouse.purchase-orders",
      },
      {
        key: "warehouse-receiving",
        label: "Nhận Hàng",
        screenKey: "warehouse.receiving",
      },
      {
        key: "warehouse-picking",
        label: "Xuất Hàng",
        screenKey: "warehouse.picking",
      },
      {
        key: "warehouse-suppliers",
        label: "Nhà Cung Cấp",
        screenKey: "warehouse.suppliers",
      },
      {
        key: "warehouse-transfers",
        label: "Chuyển kho",
        screenKey: "warehouse.transfers",
      },
      {
        key: "warehouse-vat",
        label: "Quản lý VAT",
        children: [
          {
            key: "vat-inventory",
            label: "Kho VAT",
            screenKey: "warehouse.vat-inventory",
          },
          {
            key: "vat-reconciliation",
            label: "Đối Chiếu VAT",
            screenKey: "warehouse.vat-reconciliation",
          },
          {
            key: "vat-invoice-input",
            label: "Nhập Hóa Đơn VAT",
            screenKey: "warehouse.vat-invoice-input",
          },
          {
            key: "vat-invoice-pos",
            label: "Xuất HĐ VAT (POS)",
            screenKey: "warehouse.vat-invoice-pos",
          },
          {
            key: "vat-invoice-b2b",
            label: "Xuất HĐ VAT (B2B)",
            screenKey: "warehouse.vat-invoice-b2b",
          },
        ],
      },
    ],
  },
  {
    key: "medical",
    label: "🏥 Y tế",
    icon: <CalendarOutlined />,
    children: [
      {
        key: "scheduling",
        label: "Lịch hẹn",
        screenKey: "medical.scheduling",
      },
      {
        key: "patients",
        label: "Quản lý Bệnh nhân",
        screenKey: "medical.patients",
      },
      {
        key: "medical-records",
        label: "Hồ sơ Y tế",
        screenKey: "medical.records",
      },
    ],
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
        key: "marketing-dashboard",
        label: "Marketing Dashboard",
        screenKey: "marketing.dashboard",
      },
      {
        key: "campaigns",
        label: "Chiến dịch",
        screenKey: "marketing.campaigns",
      },
      {
        key: "promotions",
        label: "Khuyến mãi",
        screenKey: "marketing.promotions",
      },
      {
        key: "vouchers",
        label: "Phiếu giảm giá",
        screenKey: "marketing.vouchers",
      },
      {
        key: "segments",
        label: "Phân khúc khách hàng",
        screenKey: "marketing.customer-segments",
      },
      {
        key: "content-library",
        label: "Thư viện Nội dung",
        screenKey: "marketing.content-library",
      },
      {
        key: "chatbot",
        label: "Quản lý Chatbot",
        screenKey: "marketing.chatbot",
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
        key: "users",
        label: "Tài khoản",
        screenKey: "management.users",
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
  requiredPermissions: string[],
): boolean => {
  return requiredPermissions.some((permission) =>
    userPermissions.includes(permission),
  );
};

// Generate menu items based on user permissions
export const generateMenu = (
  menuConfig: MenuItemConfig[],
  userPermissions: string[],
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
  menuConfig: MenuItemConfig[],
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
  userPermissions: string[],
): Array<{ path: string; screenKey: string }> => {
  return Object.entries(routeMapping)
    .filter(([_, screenKey]) => hasScreenPermission(screenKey, userPermissions))
    .map(([path, screenKey]) => ({ path, screenKey }));
};
