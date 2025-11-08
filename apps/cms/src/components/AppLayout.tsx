import React, { useState } from "react";
import {
  PieChartOutlined,
  AppstoreOutlined,
  ShopOutlined,
  TagOutlined,
  DollarOutlined,
  SettingOutlined,
  UsergroupAddOutlined,
  MenuOutlined,
  RocketOutlined,
  UserOutlined,
  LogoutOutlined,
  SwapOutlined,
  HomeOutlined,
  MedicineBoxOutlined,
  GiftOutlined,
  ContainerOutlined,
  ThunderboltOutlined,
  TeamOutlined,
  CustomerServiceOutlined,
  ToolOutlined,
  BarcodeOutlined,
  CalculatorOutlined,
  BarChartOutlined,
  LineChartOutlined,
  FileSyncOutlined,
  AuditOutlined,
  BankOutlined,
  GlobalOutlined,
  BellOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { Routes, Route, useNavigate } from "react-router-dom";
import {
  Layout,
  Menu,
  ConfigProvider,
  Avatar,
  Typography,
  Button,
  Grid,
  Drawer,
  Badge,
  Dropdown,
} from "antd";
import viVN from "antd/locale/vi_VN";
import { signOut } from "@nam-viet-erp/services";
import {
  Screen,
  CreateProductPage,
  EditProductPage,
  EditB2BOrderPage,
  generateMenu,
  CMS_APP_MENU,
  useScreens,
  InventoryB2BOrdersPage,
  getNamVietTheme,
} from "@nam-viet-erp/shared-components";
import logo from "../assets/logo.png";
import MissingDocumentationWarning from "./MissingDocumentationWarning";

const { Content, Sider, Header } = Layout;
const { Title } = Typography;
const { useBreakpoint } = Grid;

// === SỬ DỤNG THEME CONFIG TỪ SHARED COMPONENTS ===
const namVietTheme = getNamVietTheme();

const ComingSoon = () => <h1>Tính năng này sắp ra mắt!</h1>;

// Tách nội dung của Sider ra một component riêng để tái sử dụng
const SiderContent: React.FC<{
  onMenuClick: MenuProps["onClick"];
  menuItems: MenuProps["items"];
}> = ({ onMenuClick, menuItems }) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      height: "100%",
    }}
  >
    <div
      style={{
        height: "48px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
      }}
    >
      <Avatar
        src={logo}
        shape="square"
        size="large"
        style={{ backgroundColor: "transparent" }}
      />
      <Title level={5} style={{ color: "white", margin: 0 }}>
        Nam Việt EMS
      </Title>
    </div>
    <Menu
      theme="dark"
      defaultSelectedKeys={["/"]}
      mode="inline"
      items={menuItems}
      onClick={onMenuClick}
      style={{ fontSize: "16px", flex: 1 }}
    />
  </div>
);

const AppLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // State cho menu di động
  const navigate = useNavigate();
  const screens = useBreakpoint(); // Lấy thông tin màn hình hiện tại
  const isMobile = !screens.lg; // Coi là mobile nếu màn hình nhỏ hơn 'lg'
  const { user } = useScreens();

  // Generate menu items from CMS_APP_MENU based on user permissions
  const menuItems = user
    ? generateMenu(CMS_APP_MENU, user.permissions || [])
    : [];

  const handleMenuClick: MenuProps["onClick"] = (e) => {
    navigate(e.key);
    if (isMobile) {
      setMobileMenuOpen(false); // Tự động đóng menu sau khi chọn trên mobile
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  // User dropdown menu items
  const userMenuItems: MenuProps["items"] = [
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Đăng xuất",
      onClick: handleLogout,
    },
  ];

  return (
    <ConfigProvider theme={namVietTheme} locale={viVN}>
      <Layout style={{ minHeight: "100vh" }}>
        {/* === LOGIC RESPONSIVE BẮT ĐẦU TỪ ĐÂY === */}

        {/* HIỂN THỊ SIDER CỐ ĐỊNH TRÊN DESKTOP */}
        {!isMobile && (
          <Sider
            collapsible
            collapsed={collapsed}
            onCollapse={(value) => setCollapsed(value)}
            width={230} // Tăng độ rộng để vừa menu mới
            collapsedWidth={50}
            style={{
              overflow: "auto",
              height: "100vh",
              position: "fixed",
              left: 0,
              top: 0,
              bottom: 0,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Dùng lại SiderContent nhưng bỏ qua title vì đã có ở trên */}
            <div
              style={{
                height: "48px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
              }}
            >
              <Avatar
                src={logo}
                shape="square"
                size="large"
                style={{ backgroundColor: "transparent" }}
              />
              {!collapsed && (
                <Title level={5} style={{ color: "white", margin: 0 }}>
                  Nam Việt EMS
                </Title>
              )}
            </div>
            <Menu
              theme="dark"
              defaultSelectedKeys={["/"]}
              mode="inline"
              items={menuItems}
              onClick={handleMenuClick}
              style={{ fontSize: "16px", flex: 1 }}
            />
          </Sider>
        )}

        {/* HIỂN THỊ DRAWER (MENU TRƯỢT) TRÊN MOBILE */}
        {isMobile && (
          <Drawer
            placement="left"
            onClose={() => setMobileMenuOpen(false)}
            open={mobileMenuOpen}
            closable={false}
            styles={{
              body: {
                padding: 0,
                background: namVietTheme.components.Layout.siderBg,
                display: "flex",
                flexDirection: "column",
                height: "100vh",
              },
            }}
            width={230}
          >
            <SiderContent onMenuClick={handleMenuClick} menuItems={menuItems} />
          </Drawer>
        )}

        <Layout
          style={{
            // Điều chỉnh lề trái tùy theo màn hình desktop hay mobile
            marginLeft: isMobile ? 0 : collapsed ? 50 : 230,
            transition: "margin-left 0.2s",
          }}
        >
          {/* Header with notification and user info */}
          <Header className="app-header">
            <div style={{ display: "flex", alignItems: "center", flexGrow: 1 }}>
              {!isMobile && (
                <Button
                  type="text"
                  icon={
                    collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />
                  }
                  onClick={() => setCollapsed(!collapsed)}
                  className="menu-trigger-btn"
                />
              )}
              {isMobile && (
                <Button
                  type="text"
                  icon={<MenuOutlined />}
                  onClick={() => setMobileMenuOpen(true)}
                  className="menu-trigger-btn"
                />
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {/* Notification Button */}
              <Button
                type="text"
                shape="circle"
                icon={
                  <Badge dot>
                    <BellOutlined />
                  </Badge>
                }
                style={{ marginRight: 8 }}
              />

              {/* User Avatar Dropdown */}
              <Dropdown
                menu={{ items: userMenuItems }}
                trigger={["click"]}
                placement="bottomRight"
              >
                <Button
                  type="text"
                  style={{ height: "auto", padding: "4px 8px" }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <Avatar icon={<UserOutlined />} />
                    {!isMobile && (
                      <span style={{ fontWeight: 500, color: "#333" }}>
                        {user?.name || user?.id?.slice(0, 8) || "Admin"}
                      </span>
                    )}
                  </div>
                </Button>
              </Dropdown>
            </div>
          </Header>

          <Content
            className="app-content-layout"
            style={{ overflow: "initial" }}
          >
            <div
              style={{
                padding: 8,
                background: "#ffffff",
                borderRadius: 5,
                minHeight: "calc(100vh - 20px)",
              }}
            >
              <Routes>
                <Route
                  path="/"
                  element={<Screen screenKey="management.dashboard" />}
                />
                <Route
                  path="/products"
                  element={<Screen screenKey="inventory.products" />}
                />
                <Route
                  path="/products/create"
                  element={<CreateProductPage />}
                />
                <Route
                  path="/products/edit/:id"
                  element={<EditProductPage />}
                />
                <Route
                  path="/lots/:lotId"
                  element={<Screen screenKey="inventory.lot-detail" />}
                />
                <Route
                  path="/combos"
                  element={<Screen screenKey="inventory.combos" />}
                />
                <Route
                  path="/b2b-orders"
                  element={<Screen screenKey="b2b.orders" />}
                />
                <Route
                  path="/b2b/dashboard"
                  element={<Screen screenKey="b2b.dashboard" />}
                />
                <Route
                  path="/b2b/financial"
                  element={<Screen screenKey="b2b.financial" />}
                />
                <Route
                  path="/b2b/orders/edit/:id"
                  element={<EditB2BOrderPage />}
                />
                <Route
                  path="/b2b/inventory"
                  element={<InventoryB2BOrdersPage />}
                />
                <Route
                  path="/quick-quote"
                  element={<Screen screenKey="b2b.quick-quote" />}
                />
                <Route
                  path="/create-quote"
                  element={<Screen screenKey="b2b.create-quote" />}
                />
                <Route
                  path="/promotions"
                  element={<Screen screenKey="marketing.promotions" />}
                />
                <Route
                  path="/promotions/new"
                  element={<Screen screenKey="marketing.promotion-detail" />}
                />
                <Route
                  path="/promotions/:id"
                  element={<Screen screenKey="marketing.promotion-detail" />}
                />
                <Route
                  path="/vouchers"
                  element={<Screen screenKey="marketing.vouchers" />}
                />
                <Route
                  path="/financial-transactions"
                  element={<Screen screenKey="financial.transactions" />}
                />
                <Route
                  path="/cash-ledger"
                  element={<Screen screenKey="financial.ledger" />}
                />
                <Route
                  path="/settings/funds"
                  element={<Screen screenKey="financial.funds" />}
                />
                <Route
                  path="/purchase-orders"
                  element={<Screen screenKey="inventory.purchase-orders" />}
                />

                {/* --- WAREHOUSE PURCHASE ORDER ROUTES --- */}
                <Route
                  path="/warehouse/purchase-orders"
                  element={<Screen screenKey="warehouse.purchase-orders" />}
                />
                <Route
                  path="/warehouse/purchase-orders/:id/edit"
                  element={
                    <Screen screenKey="warehouse.purchase-orders.edit" />
                  }
                />
                <Route
                  path="/warehouse/receiving"
                  element={<Screen screenKey="warehouse.receiving" />}
                />
                <Route
                  path="/warehouse/receiving/create"
                  element={<Screen screenKey="warehouse.receiving.create" />}
                />
                <Route
                  path="/warehouse/receiving/:id"
                  element={<Screen screenKey="warehouse.receiving.detail" />}
                />
                <Route
                  path="/warehouse/picking"
                  element={<Screen screenKey="warehouse.picking" />}
                />

                {/* --- SUPPLIER ROUTES --- */}
                <Route
                  path="/suppliers"
                  element={<Screen screenKey="warehouse.suppliers" />}
                />
                <Route
                  path="/suppliers/new"
                  element={<Screen screenKey="warehouse.suppliers.form" />}
                />
                <Route
                  path="/suppliers/:id"
                  element={<Screen screenKey="warehouse.suppliers.form" />}
                />
                <Route
                  path="/suppliers/:id/promotions"
                  element={
                    <Screen screenKey="warehouse.suppliers.promotions" />
                  }
                />

                {/* --- ROUTE CHO MODULE NHÂN SỰ --- */}
                <Route
                  path="/employees"
                  element={<Screen screenKey="management.employees" />}
                />
                <Route
                  path="/employees/create"
                  element={<Screen screenKey="management.employees.create" />}
                />
                <Route
                  path="/employees/:employeeId"
                  element={<Screen screenKey="management.employees.edit" />}
                />

                {/* --- ROUTE CHO MODULE QUẢN LÝ TÀI KHOẢN --- */}
                <Route
                  path="/users"
                  element={<Screen screenKey="management.users" />}
                />

                {/* --- ROUTE CHO MODULE QUẢN LÝ VAI TRÒ --- */}
                <Route
                  path="/roles"
                  element={<Screen screenKey="management.roles" />}
                />

                {/* --- ROUTE CHO MODULE LƯƠNG & THƯỞNG --- */}
                <Route
                  path="/salary"
                  element={<Screen screenKey="salary.management" />}
                />

                {/* --- ROUTE CHO MODULE BỆNH NHÂN --- */}
                <Route
                  path="/patients"
                  element={<Screen screenKey="medical.patients" />}
                />
                <Route
                  path="/patients/:patientId"
                  element={<Screen screenKey="medical.patient-detail" />}
                />

                {/* --- ROUTE CHO MODULE QUẢN LÝ PHÒNG --- */}
                <Route
                  path="/rooms"
                  element={<Screen screenKey="management.rooms" />}
                />

                {/* --- THÊM ROUTE CHO MODULE MARKETING --- */}
                <Route
                  path="/marketing/dashboard"
                  element={<Screen screenKey="marketing.dashboard" />}
                />
                <Route
                  path="/marketing/campaigns"
                  element={<Screen screenKey="marketing.campaigns" />}
                />
                <Route
                  path="/marketing/campaigns/new"
                  element={<Screen screenKey="marketing.campaign-detail" />}
                />
                <Route
                  path="/marketing/campaigns/:id"
                  element={<Screen screenKey="marketing.campaign-detail" />}
                />
                <Route
                  path="/marketing/segments"
                  element={<Screen screenKey="marketing.customer-segments" />}
                />
                <Route
                  path="/marketing/library"
                  element={<Screen screenKey="marketing.content-library" />}
                />
                <Route
                  path="/marketing/chatbot"
                  element={<Screen screenKey="marketing.chatbot" />}
                />
                <Route
                  path="/missing-documentation"
                  element={<MissingDocumentationWarning />}
                />

                {/* --- WAREHOUSE TRANSFER ROUTES --- */}
                <Route
                  path="/warehouse/transfers"
                  element={<Screen screenKey="warehouse.transfers" />}
                />
                <Route
                  path="/warehouse/transfers/create"
                  element={<Screen screenKey="warehouse.transfers.create" />}
                />
                <Route
                  path="/warehouse/transfers/:id"
                  element={<Screen screenKey="warehouse.transfers.detail" />}
                />

                {/* --- WAREHOUSE VAT ROUTES --- */}
                <Route
                  path="/warehouse/vat-inventory"
                  element={<Screen screenKey="warehouse.vat-inventory" />}
                />
                <Route
                  path="/warehouse/vat-reconciliation"
                  element={<Screen screenKey="warehouse.vat-reconciliation" />}
                />
                <Route
                  path="/warehouse/vat-invoice-input"
                  element={<Screen screenKey="warehouse.vat-invoice-input" />}
                />
                <Route
                  path="/warehouse/vat-invoice-pos"
                  element={<Screen screenKey="warehouse.vat-invoice-pos" />}
                />
                <Route
                  path="/warehouse/vat-invoice-b2b"
                  element={<Screen screenKey="warehouse.vat-invoice-b2b" />}
                />

                <Route path="*" element={<ComingSoon />} />
              </Routes>
            </div>
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
};

export default AppLayout;
