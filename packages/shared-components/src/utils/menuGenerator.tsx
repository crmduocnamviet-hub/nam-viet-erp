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
  CarOutlined,
  ContainerOutlined,
  ProfileOutlined,
  DollarOutlined,
  FileTextOutlined,
  SwapOutlined,
  GiftOutlined,
  TeamOutlined,
  ApartmentOutlined,
  AuditOutlined,
  OrderedListOutlined,
  FileAddOutlined,
  HomeOutlined,
  ThunderboltOutlined,
  SendOutlined,
  GlobalOutlined,
  FileSyncOutlined,
  EditOutlined,
  BarcodeOutlined,
  FormOutlined,
  BookOutlined,
  CustomerServiceOutlined,
  DatabaseOutlined,
  CalculatorOutlined,
  BarChartOutlined,
  LineChartOutlined,
  FileSearchOutlined,
  HistoryOutlined,
  CheckCircleOutlined,
  ToolOutlined,
  PartitionOutlined,
  TabletOutlined,
  ExperimentOutlined,
  IdcardOutlined,
  SyncOutlined,
  CloudUploadOutlined,
  PieChartOutlined,
  AppstoreOutlined,
  TagOutlined,
  UsergroupAddOutlined,
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
    label: "Trang chủ",
    key: "/",
    screenKey: "staff.sales-dashboard",
    permissions: ["sales.dashboard"],
    icon: <HomeOutlined />,
  },
  {
    label: "Trang chủ",
    key: "/",
    screenKey: "staff.inventory-dashboard",
    permissions: ["inventory.dashboard"],
    icon: <HomeOutlined />,
  },
  {
    label: "Trang chủ",
    key: "/",
    screenKey: "staff.delivery-dashboard",
    permissions: ["delivery.dashboard"],
    icon: <HomeOutlined />,
  },
  {
    label: "Kênh Cửa Hàng",
    key: "store-channel",
    icon: <ShopOutlined />,
    permissions: ["pos.access"],
    children: [
      {
        label: "Dashboard Cửa hàng",
        key: "/store-dashboard",
        screenKey: "store.dashboard",
        permissions: ["pos.access"],
      },
      {
        label: "Đặt Lịch Hẹn",
        key: "/store-scheduling",
        screenKey: "medical.scheduling",
        permissions: ["medical.access"],
      },
      {
        label: "Tạo đơn tại Cửa Hàng [POS]",
        key: "/pos",
        screenKey: "pos.main",
        permissions: ["pos.access"],
      },
      {
        label: "Tạo đơn Gửi Đi",
        key: "/pos/send-order",
        screenKey: "pos.send-order",
        permissions: ["pos.access"],
      },
      {
        label: "Danh sách đơn hàng B2C",
        key: "/pos/orders",
        screenKey: "pos.orders",
        permissions: ["pos.access", "sales.view"],
      },
      {
        label: "Kết nối Sàn TMĐT",
        key: "/store-channel/marketplaces",
        screenKey: "store.marketplaces",
        permissions: ["pos.access"],
      },
      {
        label: "Quản lý Website Bán Lẻ",
        key: "retail-website",
        icon: <GlobalOutlined />,
        children: [
          {
            label: "Thông tin chung",
            key: "/store-channel/retail-website/general",
            screenKey: "store.retail-website.general",
          },
          {
            label: "Cấu hình Đơn hàng và Sản phẩm",
            key: "/store-channel/retail-website/config",
            screenKey: "store.retail-website.config",
          },
          {
            label: "Quản lý Nội Dung và Chính Sách",
            key: "/store-channel/retail-website/content",
            screenKey: "store.retail-website.content",
          },
        ],
      },
    ],
  },
  {
    label: "Nghiệp vụ Y Tế",
    key: "medical",
    icon: <MedicineBoxOutlined />,
    permissions: ["medical.access"],
    children: [
      {
        label: "Dashboard Y Tế",
        key: "/medical/dashboard",
        screenKey: "medical.dashboard",
        permissions: ["medical.access"],
      },
      {
        label: "Phòng Khám",
        key: "/medical/clinic",
        screenKey: "medical.clinic",
        permissions: ["medical.access"],
      },
      {
        label: "Tiêm Chủng",
        key: "/medical/vaccination",
        screenKey: "medical.vaccination",
        permissions: ["medical.access"],
      },
    ],
  },
  {
    label: "Bán buôn",
    key: "wholesale",
    icon: <ShopOutlined />,
    permissions: ["b2b.access"],
    children: [
      {
        label: "Thông tin chung B2B",
        key: "/b2b-dashboard",
        screenKey: "b2b.dashboard",
        permissions: ["b2b.access"],
      },
      {
        label: "Tạo Đơn Hàng B2B",
        key: "/create-quote",
        screenKey: "b2b.create-quote",
        permissions: ["b2b.create"],
      },
      {
        label: "Danh sách đơn hàng",
        key: "/store-channel",
        screenKey: "b2b.orders",
        permissions: ["b2b.view"],
      },
      {
        label: "Website B2B",
        key: "b2b-website",
        icon: <GlobalOutlined />,
        children: [
          {
            label: "Thông tin chung",
            key: "/b2b/website/general",
            screenKey: "b2b.website.general",
          },
          {
            label: "Cấu hình đơn hàng và Sản phẩm Web",
            key: "/b2b/website/config",
            screenKey: "b2b.website.config",
          },
          {
            label: "Quản lý Nội Dung và Chính sách",
            key: "/b2b/website/content",
            screenKey: "b2b.website.content",
          },
        ],
      },
    ],
  },
  {
    label: "📦 Sản phẩm",
    key: "products",
    icon: <GiftOutlined />,
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
    icon: <TeamOutlined />,
    screenKey: "warehouse.suppliers",
    permissions: ["warehouse.suppliers.view"],
  },
  {
    label: "📅 Đặt lịch & Khám bệnh",
    key: "medical-scheduling",
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
  {
    label: "👤 Tài Khoản",
    key: "user",
    icon: <ProfileOutlined />,
    children: [
      {
        label: "Thông Tin Cá Nhân",
        key: "/profile",
        screenKey: "user.profile",
        permissions: [],
      },
    ],
  },
];

export const CMS_APP_MENU: MenuItemConfig[] = [
  {
    key: "/",
    label: "Trang chủ",
    icon: <HomeOutlined />,
    screenKey: "management.dashboard",
  },
  {
    key: "store-channel",
    label: "Kênh Cửa Hàng",
    icon: <ShopOutlined />,
    children: [
      {
        key: "/store-scheduling",
        label: "Đặt Lịch Hẹn",
        screenKey: "medical.scheduling",
      },
      {
        key: "/pos",
        label: "Tạo đơn tại Cửa Hàng [ POS ]",
        screenKey: "pos.main",
      },
      {
        key: "/pos/orders",
        label: "Danh sách đơn hàng B2C",
        screenKey: "pos.orders",
      },
    ],
  },
  {
    key: "medical",
    label: "Nghiệp vụ Y Tế",
    icon: <MedicineBoxOutlined />,
    children: [
      {
        key: "/patients",
        label: "Quản lý Bệnh nhân",
        screenKey: "medical.patients",
      },
      {
        key: "/medical/scheduling",
        label: "Phòng Khám",
        screenKey: "medical.scheduling",
      },
    ],
  },
  {
    key: "b2b",
    label: "Bán buôn",
    icon: <GlobalOutlined />,
    children: [
      {
        key: "/b2b/dashboard",
        label: "Thông tin chung B2B",
        screenKey: "b2b.dashboard",
      },
      {
        key: "/create-quote",
        label: "Tạo Đơn Hàng B2B",
        screenKey: "b2b.create-quote",
      },
      {
        key: "/b2b-orders",
        label: "Danh sách đơn hàng",
        screenKey: "b2b.orders",
      },
      {
        key: "/quick-quote",
        label: "Xem Nhanh Báo Giá",
        screenKey: "b2b.quick-quote",
      },
      {
        key: "/b2b/inventory",
        label: "📦 Đơn hàng - Kho",
        screenKey: "b2b.inventory",
      },
      {
        key: "/b2b/financial",
        label: "Tài chính B2B",
        screenKey: "b2b.financial",
      },
    ],
  },
  {
    key: "combos-services",
    label: "Combo và Dịch Vụ",
    icon: <GiftOutlined />,
    children: [
      {
        key: "/combos",
        label: "Quản lý Combo",
        screenKey: "inventory.combos",
      },
    ],
  },
  {
    key: "inventory",
    label: "Kho – Hàng Hóa",
    icon: <ContainerOutlined />,
    children: [
      {
        key: "/products",
        label: "Danh sách Sản Phẩm",
        screenKey: "inventory.products",
      },
      {
        key: "/purchase-orders",
        label: "Mua hàng",
        screenKey: "inventory.purchase-orders",
      },
      {
        key: "/warehouse/transfers",
        label: "Chuyển kho",
        screenKey: "warehouse.transfers",
      },
      {
        key: "/warehouse/vat-invoice-input",
        label: "Nhập HĐ VAT",
        screenKey: "warehouse.vat-invoice-input",
      },
      {
        key: "/warehouse/vat-invoice-pos",
        label: "Xuất HĐ VAT cho POS",
        screenKey: "warehouse.vat-invoice-pos",
      },
      {
        key: "/warehouse/vat-invoice-b2b",
        label: "Xuất HĐ VAT cho B2B",
        screenKey: "warehouse.vat-invoice-b2b",
      },
    ],
  },
  {
    key: "warehouse",
    label: "Quản Lý Kho Vận",
    icon: <InboxOutlined />,
    children: [
      {
        key: "/warehouse/vat-inventory",
        label: "Kho VAT",
        screenKey: "warehouse.vat-inventory",
      },
      {
        key: "/warehouse/vat-reconciliation",
        label: "Đối Chiếu VAT",
        screenKey: "warehouse.vat-reconciliation",
      },
    ],
  },
  {
    key: "partners",
    label: "Đối tác",
    icon: <UsergroupAddOutlined />,
    children: [
      {
        key: "/suppliers",
        label: "Nhà Cung Cấp",
        screenKey: "warehouse.suppliers",
      },
    ],
  },
  {
    key: "customers",
    label: "Quản lý Khách hàng",
    icon: <TeamOutlined />,
    children: [
      {
        key: "/patients",
        label: "Quản lý bệnh nhân",
        screenKey: "medical.patients",
      },
    ],
  },
  {
    key: "marketing",
    label: "Quản lý Marketing",
    icon: <RocketOutlined />,
    children: [
      {
        key: "/marketing/dashboard",
        label: "Dashboard Marketing",
        screenKey: "marketing.dashboard",
      },
      {
        key: "/marketing/campaigns",
        label: "Quản lý Chiến dịch",
        screenKey: "marketing.campaigns",
      },
      {
        key: "marketing-tools",
        label: "Công cụ Marketing",
        icon: <ToolOutlined />,
        children: [
          {
            key: "/marketing/segments",
            label: "Trình tạo Phân Khúc Khách Hàng",
            screenKey: "marketing.customer-segments",
          },
          {
            key: "/marketing/library",
            label: "Thư viện Nội Dung",
            screenKey: "marketing.content-library",
          },
          {
            key: "promo-vouchers",
            label: "Quản lý Mã Giảm Giá & QR Code",
            icon: <BarcodeOutlined />,
            children: [
              {
                key: "/promotions",
                label: "Quản lý Khuyến mại",
                screenKey: "marketing.promotions",
              },
              {
                key: "/vouchers",
                label: "Quản lý Mã Giảm Giá",
                screenKey: "marketing.vouchers",
              },
              {
                key: "/point-rules",
                label: "Quản lý Quy tắc Tích điểm",
                screenKey: "marketing.point-rules",
              },
            ],
          },
        ],
      },
      {
        key: "/marketing/chatbot",
        label: "Quản lý Chatbot",
        screenKey: "marketing.chatbot",
      },
    ],
  },
  {
    key: "hr",
    label: "Quản lý Nhân sự",
    icon: <IdcardOutlined />,
    children: [
      {
        key: "/employees",
        label: "Quản lý Nhân viên",
        screenKey: "management.employees",
      },
    ],
  },
  {
    key: "salary",
    label: "Lương & Thưởng",
    icon: <DollarOutlined />,
    children: [
      {
        key: "/salary",
        label: "Quản lý Lương & Thưởng",
        screenKey: "salary.management",
      },
    ],
  },
  {
    key: "finance",
    label: "Tài Chính & Kế Toán",
    icon: <BankOutlined />,
    children: [
      {
        key: "/financial-transactions",
        label: "Quản lý Thu – Chi",
        screenKey: "financial.transactions",
      },
      {
        key: "/warehouse/vat-invoice-input",
        label: "Quản lý Hóa Đơn VAT",
        screenKey: "warehouse.vat-invoice-input",
      },
    ],
  },
  {
    key: "reports",
    label: "Báo Cáo",
    icon: <BarChartOutlined />,
    children: [
      {
        key: "/cash-ledger",
        label: "Sổ quỹ",
        screenKey: "financial.ledger",
      },
    ],
  },
  {
    key: "settings",
    label: "Cấu hình hệ thống",
    icon: <SettingOutlined />,
    children: [
      {
        key: "/users",
        label: "Quản lý tài khoản",
        screenKey: "management.users",
      },
      {
        key: "/roles",
        label: "Quản lý Vai trò",
        screenKey: "management.roles",
      },
      {
        key: "/settings/funds",
        label: "Quản lý Quỹ",
        screenKey: "financial.funds",
      },
      {
        key: "/rooms",
        label: "Quản lý Phòng",
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
