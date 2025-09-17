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
import { supabase } from "../lib/supabaseClient";

// Import tất cả các trang của bạn ở đây
import Dashboard from "../pages/Dashboard";
import Products from "../pages/Products";
import QuickQuote from "../pages/QuickQuote";
import Promotions from "../pages/Promotions";
import Vouchers from "../pages/Vouchers";
import PromotionDetail from "../pages/PromotionDetail";
import FinancialTransactions from "../pages/FinancialTransactions";
import CashLedger from "../pages/CashLedger";
import FundManagement from "../pages/FundManagement";
import logo from "../assets/logo.png";

const { Header, Content, Footer, Sider } = Layout;
const { Title } = Typography;
const { useBreakpoint } = Grid; // <-- "Mắt thần" theo dõi kích thước màn hình

const menuItems: MenuProps["items"] = [
  { label: "Tổng quan", key: "/", icon: <PieChartOutlined /> },
  { label: "Kho - Sản Phẩm", key: "/products", icon: <AppstoreOutlined /> },
  {
    label: "Bán Buôn (B2B)",
    key: "b2b",
    icon: <ShopOutlined />,
    children: [{ label: "Xem Nhanh Báo Giá", key: "/quick-quote" }],
  },
  {
    label: "Marketing",
    key: "marketing",
    icon: <TagOutlined />,
    children: [
      { label: "Quản lý Khuyến mại", key: "/promotions" },
      { label: "Quản lý Mã Giảm Giá", key: "/vouchers" },
    ],
  },
  {
    label: "Đối Tác",
    key: "partners",
    icon: <UsergroupAddOutlined />,
    children: [{ label: "Nhà Cung Cấp", key: "/suppliers" }],
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
    children: [{ label: "Quản lý Quỹ", key: "/settings/funds" }],
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
const SiderContent: React.FC<{ onMenuClick: MenuProps["onClick"] }> = ({
  onMenuClick,
}) => (
  <>
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
      style={{ fontSize: "16px" }}
    />
  </>
);

const AppLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
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
    await supabase.auth.signOut();
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
            width={200} // Độ rộng Menu Bar bên trái
            collapsedWidth={50}
            style={{
              overflow: "auto",
              height: "100vh",
              position: "fixed",
              left: 0,
              top: 0,
              bottom: 0,
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
              style={{ fontSize: "16px" }}
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
              },
            }}
            width={200}
          >
            <SiderContent onMenuClick={handleMenuClick} />
          </Drawer>
        )}

        <Layout
          style={{
            // Điều chỉnh lề trái tùy theo màn hình desktop hay mobile
            marginLeft: isMobile ? 0 : collapsed ? 50 : 170,
            transition: "margin-left 0.2s",
          }}
        >
          <Header
            style={{
              padding: "0 24px",
              background: namVietTheme.components.Layout.headerBg,
              display: "flex",
              justifyContent: isMobile ? "space-between" : "flex-end",
              alignItems: "center",
              height: 48,
            }}
          >
            {/* Nút Hamburger chỉ hiển thị trên mobile */}
            {isMobile && (
              <Button
                type="text"
                icon={<MenuOutlined style={{ fontSize: "20px" }} />}
                onClick={() => setMobileMenuOpen(true)}
              />
            )}
            <Button onClick={handleLogout}>Đăng xuất</Button>
          </Header>
          <Content style={{ margin: "16px", overflow: "initial" }}>
            <div
              style={{
                padding: 16,
                background: "#ffffff",
                borderRadius: namVietTheme.token.borderRadius,
                minHeight: "calc(100vh - 128px)",
              }}
            >
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/products" element={<Products />} />
                <Route path="/quick-quote" element={<QuickQuote />} />
                <Route path="/promotions" element={<Promotions />} />
                <Route path="/promotions/new" element={<PromotionDetail />} />
                <Route path="/promotions/:id" element={<PromotionDetail />} />
                <Route path="/vouchers" element={<Vouchers />} />
                <Route
                  path="/financial-transactions"
                  element={<FinancialTransactions />}
                />
                <Route path="/cash-ledger" element={<CashLedger />} />
                <Route path="/settings/funds" element={<FundManagement />} />
                <Route path="*" element={<ComingSoon />} />
              </Routes>
            </div>
          </Content>
          <Footer style={{ textAlign: "center", padding: "10px 0" }}>
            Nam Việt ERP ©{new Date().getFullYear()} - LVH
          </Footer>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
};

export default AppLayout;
