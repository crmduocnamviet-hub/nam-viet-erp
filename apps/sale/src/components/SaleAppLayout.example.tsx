// SaleAppLayout.example.tsx - Example of how to use MainLayout with Sale app
import React from "react";
import {
  ShoppingCartOutlined,
  ShopOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { Routes, Route, useNavigate } from "react-router-dom";
import { ConfigProvider } from "antd";
import viVN from "antd/locale/vi_VN";
import { signOut } from "@nam-viet-erp/services";
import {
  MainLayout,
  EditB2BOrderPage,
  InventoryB2BOrdersPage,
  useScreens,
} from "@nam-viet-erp/shared-components";
import { useEmployee } from "../context/EmployeeContext";
import logo from "../assets/logo.png";

// Define menu items with their required permissions
const allMenuItems = [
  {
    label: "💰 Bán hàng (POS)",
    key: "/",
    icon: <ShoppingCartOutlined />,
    screenKey: "pos.main",
  },
  {
    label: "🏢 Bán Buôn",
    key: "wholesale",
    icon: <ShopOutlined />,
    children: [
      {
        label: "B2B Sales Dashboard",
        key: "/b2b-dashboard",
        screenKey: "b2b.dashboard",
      },
      {
        label: "Tạo Báo Giá / Đơn Hàng",
        key: "/create-quote",
        screenKey: "b2b.create-quote",
      },
      {
        label: "Danh sách Đơn hàng",
        key: "/store-channel",
        screenKey: "b2b.orders",
      },
      {
        label: "📦 Đơn hàng - Kho",
        key: "/b2b/inventory",
        screenKey: "b2b.inventory-orders",
      },
    ],
  },
  {
    label: "📅 Đặt lịch & Khám bệnh",
    key: "scheduling",
    icon: <CalendarOutlined />,
    children: [
      {
        label: "Lịch hẹn hôm nay",
        key: "/scheduling",
        screenKey: "medical.scheduling",
      },
      {
        label: "Quản lý bệnh nhân",
        key: "/patients",
        screenKey: "medical.patients",
      },
      {
        label: "Hồ sơ y tế",
        key: "/medical-records",
        screenKey: "medical.records",
      },
    ],
  },
];

const namVietTheme = {
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

const ComingSoon = () => <h1>Tính năng này sắp ra mắt!</h1>;

const SaleAppLayoutExample: React.FC = () => {
  const { employee } = useEmployee();
  const { renderScreen, hasPermission } = useScreens();
  const navigate = useNavigate();

  // Filter menu items based on user permissions
  const getFilteredMenuItems = (): MenuProps["items"] => {
    return allMenuItems
      .map((item) => {
        // Check if user has permission for top-level items
        if (item.screenKey && !hasPermission(item.screenKey)) {
          return null;
        }

        // If it has children, filter them too
        if (item.children) {
          const filteredChildren = item.children.filter(
            (child) => !child.screenKey || hasPermission(child.screenKey),
          );

          // If no children are accessible, don't show the parent
          if (filteredChildren.length === 0) {
            return null;
          }

          return {
            ...item,
            children: filteredChildren,
          };
        }

        return item;
      })
      .filter((item) => item !== null);
  };

  const menuItems = getFilteredMenuItems();

  const handleMenuClick: MenuProps["onClick"] = (e) => {
    navigate(e.key);
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <ConfigProvider theme={namVietTheme} locale={viVN}>
      <MainLayout
        menuItems={menuItems}
        logo={logo}
        appName="Nam Việt Sale"
        user={{
          name: employee?.full_name,
          email: employee?.employee_code,
        }}
        onLogout={handleLogout}
        onMenuClick={handleMenuClick}
        initialCollapsed={true}
        siderBg="#015ba9ff"
        collapsedWidth={50}
        siderWidth={230}
        showNotificationBadge={false}
      >
        {/* All routes go here as children */}
        <Routes>
          <Route path="/" element={renderScreen("pos.main", { employee })} />
          <Route
            path="/store-channel"
            element={renderScreen("b2b.orders", { employee })}
          />
          <Route
            path="/b2b/orders/edit/:id"
            element={<EditB2BOrderPage employee={employee} />}
          />
          <Route
            path="/b2b/inventory"
            element={<InventoryB2BOrdersPage employee={employee} />}
          />
          <Route
            path="/b2b-dashboard"
            element={renderScreen("b2b.dashboard", { employee })}
          />
          <Route
            path="/b2b/financial"
            element={renderScreen("b2b.financial", { employee })}
          />
          <Route
            path="/create-quote"
            element={renderScreen("b2b.create-quote", { employee })}
          />
          <Route
            path="/pos/orders"
            element={renderScreen("pos.orders", { employee })}
          />
          <Route path="/profile" element={renderScreen("user.profile")} />
          <Route
            path="/scheduling"
            element={renderScreen("medical.scheduling")}
          />
          <Route path="/patients" element={renderScreen("medical.patients")} />
          <Route
            path="/patients/:patientId"
            element={renderScreen("medical.patient-detail")}
          />
          <Route
            path="/medical-records"
            element={renderScreen("medical.records")}
          />
          <Route path="*" element={<ComingSoon />} />
        </Routes>
      </MainLayout>
    </ConfigProvider>
  );
};

export default SaleAppLayoutExample;
