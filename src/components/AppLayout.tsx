import React, { useState, useMemo } from "react"; // <-- Thêm useMemo
import {
  PieChartOutlined,
  AppstoreOutlined,
  ShopOutlined,
  TagOutlined,
  DollarOutlined,
  SettingOutlined,
  UsergroupAddOutlined,
  MenuOutlined,
  UserOutlined,
  KeyOutlined,
  BellOutlined,
  LogoutOutlined,
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
  Dropdown,
  Badge,
  Space,
} from "antd";
import viVN from "antd/locale/vi_VN";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { usePermissions } from "../context/PermissionContext";
import NewsfeedManagement from "../pages/NewsfeedManagement";

// Import các trang
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
import PurchaseOrders from "../pages/PurchaseOrders";
import RolesPermissions from "../pages/RolesPermissions";
import UserManagement from "../pages/UserManagement";
import ReceivePurchaseOrder from "../pages/ReceivePurchaseOrder";
import Profile from "../pages/Profile";
import ChangePasswordModal from "../features/users/components/ChangePasswordModal";
// Trong src/components/AppLayout.tsx
import Community from "../pages/Community";
import PostDetail from "../pages/PostDetail";
import { MessageSquare } from "lucide-react"; // Icon cho menu mới
import ModerationQueue from "../pages/ModerationQueue";
import SystemSettings from "../pages/SystemSettings";

const { Header, Content, Footer, Sider } = Layout;
const { Title } = Typography;
const { useBreakpoint } = Grid;

// Biến theme và các component tĩnh vẫn có thể để bên ngoài
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

const AppLayout: React.FC = () => {
  const { user } = useAuth();
  const { hasPermission } = usePermissions(); // <-- Hook được gọi ở đây
  const [collapsed, setCollapsed] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const isMobile = !screens.lg;

  // SỬA LỖI: Di chuyển menuItems vào bên trong component và dùng useMemo
  const menuItems: MenuProps["items"] = useMemo(
    () => [
      { label: "Tổng quan", key: "/", icon: <PieChartOutlined /> },
      {
        label: "Kho - Sản Phẩm",
        key: "inventory",
        icon: <AppstoreOutlined />,
        children: [
          { label: "Danh sách Sản phẩm", key: "/products" },
          { label: "Quản lý Đặt hàng", key: "/purchase-orders" },
        ],
      },
      {
        label: "Diễn đàn",
        key: "/community",
        icon: <MessageSquare size={18} />,
      },
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
          {
            label: "Sổ Quỹ",
            key: "/cash-ledger",
            // Giờ đây hàm hasPermission đã được định nghĩa trong scope này
            disabled: !hasPermission("cash_ledger.view"),
          },
        ],
      },
      {
        label: "Cấu hình",
        key: "settings",
        icon: <SettingOutlined />,
        children: [
          { label: "Quản lý Quỹ", key: "/settings/funds" },
          { label: "Phân quyền & Vai trò", key: "/settings/roles" },
          {
            label: "Quản lý Bảng tin",
            key: "/settings/newsfeed",
            disabled: !hasPermission("posts.manage"),
          },
          {
            label: "Kiểm duyệt Đề xuất",
            key: "/settings/moderation",
            disabled: !hasPermission("posts.manage"),
          },
          {
            label: "Cấu hình Hệ thống",
            key: "/settings/system",
            disabled: !hasPermission("settings.manage"),
          },
          { label: "Quản lý Người dùng", key: "/settings/users" },
        ],
      },
    ],
    [hasPermission]
  ); // <-- Phụ thuộc vào hasPermission

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const userMenu: MenuProps["items"] = [
    {
      key: "profile",
      label: "Thông tin cá nhân",
      icon: <UserOutlined />,
      onClick: () => navigate("/profile"),
    },
    {
      key: "change_password",
      label: "Đổi mật khẩu",
      icon: <KeyOutlined />,
      onClick: () => setIsPasswordModalOpen(true),
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      label: "Đăng xuất",
      icon: <LogoutOutlined />,
      danger: true,
      onClick: handleLogout,
    },
  ];

  const handleMenuClick: MenuProps["onClick"] = (e) => {
    navigate(e.key);
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  };

  // Lọc menuItems dựa trên quyền hạn
  const filteredMenuItems = useMemo(
    () =>
      menuItems.filter((item) => {
        if (!item) return false;
        // Lọc menu cha
        if (item.key === "settings") {
          // Chỉ hiển thị menu Cấu hình nếu user có ít nhất một quyền quản lý
          return hasPermission("users.manage") || hasPermission("posts.manage");
        }
        return true;
      }),
    [hasPermission, menuItems]
  );

  const SiderContent: React.FC<{ onMenuClick: MenuProps["onClick"] }> = ({
    onMenuClick,
  }) => (
    <>
      <div
        style={{
          height: "48px",
          display: "flex",
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
        items={filteredMenuItems} // <-- Sử dụng menu đã được lọc
        onClick={onMenuClick}
        style={{ fontSize: "16px" }}
      />
    </>
  );

  return (
    <ConfigProvider theme={namVietTheme} locale={viVN}>
      <Layout style={{ minHeight: "100vh" }}>
        {!isMobile && (
          <Sider
            collapsible
            collapsed={collapsed}
            onCollapse={(value) => setCollapsed(value)}
            width={200}
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
              items={filteredMenuItems}
              onClick={handleMenuClick}
              style={{ fontSize: "16px" }}
            />
          </Sider>
        )}

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
            marginLeft: isMobile ? 0 : collapsed ? 50 : 200,
            transition: "margin-left 0.2s",
          }}
        >
          <Header
            style={{
              padding: "0 24px",
              background: namVietTheme.components.Layout.headerBg,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              height: 48,
            }}
          >
            {isMobile && (
              <Button
                type="text"
                icon={<MenuOutlined style={{ fontSize: "20px" }} />}
                onClick={() => setMobileMenuOpen(true)}
              />
            )}
            <div />
            <Space size="large" align="center">
              <Badge count={5}>
                <Button
                  type="text"
                  shape="circle"
                  icon={<BellOutlined style={{ fontSize: "20px" }} />}
                />
              </Badge>
              <Dropdown menu={{ items: userMenu }} trigger={["click"]}>
                <a onClick={(e) => e.preventDefault()}>
                  <Space style={{ cursor: "pointer" }}>
                    <Avatar
                      src={user?.user_metadata?.avatar_url}
                      icon={<UserOutlined />}
                    />
                    {!isMobile && (
                      <div>
                        <Typography.Text strong>
                          {user?.user_metadata?.full_name}
                        </Typography.Text>
                        <br />
                        <Typography.Text type="secondary">
                          {/* Sẽ cập nhật vai trò sau */}
                        </Typography.Text>
                      </div>
                    )}
                  </Space>
                </a>
              </Dropdown>
            </Space>
          </Header>
          <Content style={{ margin: "16px", overflow: "initial" }}>
            <div
              style={{
                padding: 24,
                background: "#ffffff",
                borderRadius: namVietTheme.token.borderRadius,
                minHeight: "calc(100vh - 118px)",
              }}
            >
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/community" element={<Community />} />
                <Route path="/community/:id" element={<PostDetail />} />
                <Route path="/profile" element={<Profile />} />
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
                <Route
                  path="/cash-ledger"
                  element={
                    hasPermission("cash_ledger.view") ? (
                      <CashLedger />
                    ) : (
                      <ComingSoon />
                    )
                  }
                />
                <Route path="/settings/funds" element={<FundManagement />} />
                <Route path="/purchase-orders" element={<PurchaseOrders />} />
                <Route
                  path="/receive-po/:id"
                  element={<ReceivePurchaseOrder />}
                />
                <Route path="/settings/roles" element={<RolesPermissions />} />
                <Route
                  path="/settings/moderation"
                  element={
                    hasPermission("posts.manage") ? (
                      <ModerationQueue />
                    ) : (
                      <ComingSoon />
                    )
                  }
                />
                <Route
                  path="/settings/system"
                  element={
                    hasPermission("settings.manage") ? (
                      <SystemSettings />
                    ) : (
                      <ComingSoon />
                    )
                  }
                />

                <Route
                  path="/settings/newsfeed"
                  element={
                    hasPermission("posts.manage") ? (
                      <NewsfeedManagement />
                    ) : (
                      <ComingSoon />
                    )
                  }
                />
                <Route
                  path="/settings/users"
                  element={
                    hasPermission("users.manage") ? (
                      <UserManagement />
                    ) : (
                      <ComingSoon />
                    )
                  }
                />
                <Route path="*" element={<ComingSoon />} />
              </Routes>
            </div>
          </Content>
          <Footer style={{ textAlign: "center", padding: "12px 0" }}>
            Nam Việt ERP ©{new Date().getFullYear()} - Vận hành bởi Senko V400
          </Footer>
        </Layout>
        <ChangePasswordModal
          open={isPasswordModalOpen}
          onCancel={() => setIsPasswordModalOpen(false)}
        />
      </Layout>
    </ConfigProvider>
  );
};

export default AppLayout;
