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
  UserOutlined, // <-- IMPORT ICON MỚI
  LogoutOutlined,
  SwapOutlined,
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
} from "antd";
import viVN from "antd/locale/vi_VN";
import { signOut } from "@nam-viet-erp/services";
import {
  Screen,
  CreateProductPage,
  EditProductPage,
} from "@nam-viet-erp/shared-components";
import logo from "../assets/logo.png";
import MissingDocumentationWarning from "./MissingDocumentationWarning";

const { Content, Sider } = Layout;
const { Title } = Typography;
const { useBreakpoint } = Grid; // <-- "Mắt thần" theo dõi kích thước màn hình

const menuItems: MenuProps["items"] = [
  { label: "Tổng quan", key: "/", icon: <PieChartOutlined /> },
  {
    label: "Kho - Sản Phẩm",
    key: "inventory",
    icon: <AppstoreOutlined />,
    children: [
      { label: "Danh sách Sản phẩm", key: "/products" },
      { label: "Thêm sản phẩm mới", key: "/products/create" },
      { label: "Quản lý Đặt hàng", key: "/purchase-orders" },
      {
        label: "Chuyển kho",
        key: "/warehouse/transfers",
        icon: <SwapOutlined />,
      },
      { type: "divider" },
      { label: "Nhập HĐ VAT", key: "/warehouse/vat-invoice-input" },
      { label: "Xuất HĐ VAT cho POS", key: "/warehouse/vat-invoice-pos" },
      { label: "Xuất HĐ VAT cho B2B", key: "/warehouse/vat-invoice-b2b" },
    ],
  },
  {
    label: "Bán Buôn (B2B)",
    key: "b2b",
    icon: <ShopOutlined />,
    children: [
      { label: "Quản lý Đơn hàng B2B", key: "/b2b-orders" },
      { label: "Xem Nhanh Báo Giá", key: "/quick-quote" },
      { label: "Tạo Báo Giá / Đơn Hàng", key: "/create-quote" },
    ],
  },
  // --- MENU MARKETING ĐƯỢC NÂNG CẤP ---
  {
    label: "Marketing",
    key: "marketing",
    icon: <RocketOutlined />,
    children: [
      { label: "Trung tâm chỉ huy", key: "/marketing/dashboard" },
      { label: "Quản lý Chiến dịch", key: "/marketing/campaigns" },
      { label: "Phân khúc Khách hàng", key: "/marketing/segments" },
      { label: "Thư viện Nội dung", key: "/marketing/library" },
      { label: "Chatbot AI", key: "/marketing/chatbot" },
      {
        label: "Khuyến mại & Giảm giá",
        key: "marketing-promo",
        icon: <TagOutlined />,
        children: [
          { label: "Quản lý Khuyến mại", key: "/promotions" },
          { label: "Quản lý Mã Giảm Giá", key: "/vouchers" },
        ],
      },
    ],
  },
  {
    label: "Đối Tác",
    key: "partners",
    icon: <UsergroupAddOutlined />,
    children: [{ label: "Nhà Cung Cấp", key: "/suppliers" }],
  },
  {
    label: "Nhân sự",
    key: "hr",
    icon: <UserOutlined />,
    children: [
      { label: "Quản lý Nhân viên", key: "/employees" },
      { label: "Quản lý Tài khoản", key: "/users" },
      { label: "Quản lý Bệnh nhân", key: "/patients" },
    ],
  },
  {
    label: "Tài chính",
    key: "finance",
    icon: <DollarOutlined />,
    children: [
      { label: "Quản lý Thu - Chi", key: "/financial-transactions" },
      { label: "Sổ Quỹ", key: "/cash-ledger" },
    ],
  },
  {
    label: "Cấu hình",
    key: "settings",
    icon: <SettingOutlined />,
    children: [
      { label: "Quản lý Phòng", key: "/rooms" },
      { label: "Quản lý Quỹ", key: "/settings/funds" },
      { label: "Cảnh báo Thiếu Tài liệu", key: "/missing-documentation" },
    ],
  },
];

// === BẢN CẬP NHẬT THEME HOÀN CHỈNH ===
const namVietTheme = {
  token: {
    colorBgLayout: "#f0f2f5",
    colorPrimary: "#1773adff", // <-- ĐỔI MÀU CHỦ ĐẠO
    borderRadius: 5,
  },
  components: {
    Layout: {
      headerBg: "#ffffff",
      siderBg: "#015ba9ff", // <-- ĐỔI MÀU NỀN SIDER
      triggerBg: "#015ba9ff", // <-- ĐỔI MÀU NÚT ẨN / HIỆN SIDEBAR MENU BAR
    },
    Menu: {
      // Tùy chỉnh cho Menu có theme="dark"
      darkItemBg: "#015ba9ff", // Nền item trùng với nền Sider
      darkSubMenuItemBg: "#015ba9ff", //Nền menu con khi rê chu
      darkItemColor: "rgba(255, 255, 255, 0.75)", // Màu chữ item thường
      darkItemHoverBg: "rgba(255, 255, 255, 0.15)", // Nền item khi rê chuột
      darkItemHoverColor: "#ffffff", // Màu chữ item khi rê chuột
      darkItemSelectedBg: "#00809D", // Màu nền item được chọn (có thể dùng colorPrimary hoặc màu khác)
      darkItemSelectedColor: "#ffffff", // Màu chữ item được chọn
    },
  },
};

const ComingSoon = () => <h1>Tính năng này sắp ra mắt!</h1>;

// Tách nội dung của Sider ra một component riêng để tái sử dụng
const SiderContent: React.FC<{
  onMenuClick: MenuProps["onClick"];
  onLogout: () => void;
}> = ({ onMenuClick, onLogout }) => (
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
    <div
      style={{
        padding: "16px",
        borderTop: "1px solid rgba(255, 255, 255, 0.1)",
      }}
    >
      <Button
        type="text"
        icon={<LogoutOutlined />}
        onClick={onLogout}
        block
        style={{
          color: "rgba(255, 255, 255, 0.75)",
          height: "40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
        }}
      >
        Đăng xuất
      </Button>
    </div>
  </div>
);

const AppLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // State cho menu di động
  const navigate = useNavigate();
  const screens = useBreakpoint(); // Lấy thông tin màn hình hiện tại
  const isMobile = !screens.lg; // Coi là mobile nếu màn hình nhỏ hơn 'lg'

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
            <div
              style={{
                padding: collapsed ? "8px" : "16px",
                borderTop: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              <Button
                type="text"
                icon={<LogoutOutlined />}
                onClick={handleLogout}
                block
                style={{
                  color: "rgba(255, 255, 255, 0.75)",
                  height: "40px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: collapsed ? "center" : "flex-start",
                }}
              >
                {!collapsed && "Đăng xuất"}
              </Button>
            </div>
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
            <SiderContent
              onMenuClick={handleMenuClick}
              onLogout={handleLogout}
            />
          </Drawer>
        )}

        <Layout
          style={{
            // Điều chỉnh lề trái tùy theo màn hình desktop hay mobile
            marginLeft: isMobile ? 0 : collapsed ? 50 : 230,
            transition: "margin-left 0.2s",
          }}
        >
          {isMobile && (
            <div
              style={{
                position: "fixed",
                top: 16,
                right: 16,
                zIndex: 1000,
              }}
            >
              <Button
                type="primary"
                shape="circle"
                icon={<MenuOutlined style={{ fontSize: "20px" }} />}
                onClick={() => setMobileMenuOpen(true)}
                size="large"
              />
            </div>
          )}
          <Content style={{ margin: "16px", overflow: "initial" }}>
            <div
              style={{
                padding: 16,
                background: "#ffffff",
                borderRadius: namVietTheme.token.borderRadius,
                minHeight: "calc(100vh - 32px)",
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
                  path="/b2b-orders"
                  element={<Screen screenKey="b2b.orders" />}
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
