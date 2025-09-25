import React from 'react';
import { MenuProps } from 'antd';
import {
  ShoppingCartOutlined,
  CalendarOutlined,
  ShopOutlined,
  DashboardOutlined,
  MedicineBoxOutlined,
  BankOutlined,
  RocketOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { hasScreenPermission } from '../screens';

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
    key: 'pos',
    label: '💰 Bán hàng (POS)',
    icon: <ShoppingCartOutlined />,
    screenKey: 'pos.main',
  },
  {
    key: 'b2b',
    label: '📋 Quản lý Đơn hàng B2B',
    icon: <ShopOutlined />,
    screenKey: 'b2b.orders',
  },
  {
    key: 'medical',
    label: '📅 Đặt lịch & Khám bệnh',
    icon: <CalendarOutlined />,
    children: [
      {
        key: 'scheduling',
        label: 'Lịch hẹn hôm nay',
        screenKey: 'medical.scheduling',
      },
      {
        key: 'patients',
        label: 'Quản lý bệnh nhân',
        screenKey: 'medical.patients',
      },
      {
        key: 'medical-records',
        label: 'Hồ sơ y tế',
        screenKey: 'medical.records',
      },
    ],
  },
];

export const CMS_APP_MENU: MenuItemConfig[] = [
  {
    key: 'dashboard',
    label: '📊 Tổng quan',
    icon: <DashboardOutlined />,
    screenKey: 'management.dashboard',
  },
  {
    key: 'inventory',
    label: '📦 Kho hàng',
    icon: <MedicineBoxOutlined />,
    children: [
      {
        key: 'products',
        label: 'Sản phẩm',
        screenKey: 'inventory.products',
      },
      {
        key: 'purchase-orders',
        label: 'Đơn mua hàng',
        screenKey: 'inventory.purchase-orders',
      },
    ],
  },
  {
    key: 'b2b',
    label: '📋 Đơn hàng B2B',
    icon: <ShopOutlined />,
    screenKey: 'b2b.orders',
  },
  {
    key: 'financial',
    label: '💰 Tài chính',
    icon: <BankOutlined />,
    children: [
      {
        key: 'transactions',
        label: 'Giao dịch',
        screenKey: 'financial.transactions',
      },
      {
        key: 'ledger',
        label: 'Sổ cái',
        screenKey: 'financial.ledger',
      },
      {
        key: 'funds',
        label: 'Quản lý quỹ',
        screenKey: 'financial.funds',
      },
    ],
  },
  {
    key: 'marketing',
    label: '🎯 Marketing',
    icon: <RocketOutlined />,
    children: [
      {
        key: 'campaigns',
        label: 'Chiến dịch',
        screenKey: 'marketing.campaigns',
      },
      {
        key: 'segments',
        label: 'Phân khúc khách hàng',
        screenKey: 'marketing.segments',
      },
    ],
  },
  {
    key: 'management',
    label: '👥 Quản lý',
    icon: <SettingOutlined />,
    children: [
      {
        key: 'employees',
        label: 'Nhân viên',
        screenKey: 'management.employees',
      },
      {
        key: 'rooms',
        label: 'Phòng ban',
        screenKey: 'management.rooms',
      },
    ],
  },
];

// Generate menu items based on user permissions
export const generateMenu = (
  menuConfig: MenuItemConfig[],
  userPermissions: string[]
): MenuProps['items'] => {
  const filterMenuItems = (items: MenuItemConfig[]): MenuProps['items'] => {
    return items
      .filter(item => {
        // If item has a screenKey, check permissions for that screen
        if (item.screenKey) {
          return hasScreenPermission(item.screenKey, userPermissions);
        }

        // If item has children, check if any children are accessible
        if (item.children) {
          const accessibleChildren = item.children.filter(child => {
            if (child.screenKey) {
              return hasScreenPermission(child.screenKey, userPermissions);
            }
            return true;
          });
          return accessibleChildren.length > 0;
        }

        // If no screenKey and no children, include by default
        return true;
      })
      .map(item => {
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
export const getRouteMapping = (menuConfig: MenuItemConfig[]): Record<string, string> => {
  const mapping: Record<string, string> = {};

  const extractRoutes = (items: MenuItemConfig[], parentPath = '') => {
    items.forEach(item => {
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