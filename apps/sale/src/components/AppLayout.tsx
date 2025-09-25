import React, { useState } from "react";
import {
  ShoppingCartOutlined,
  CalendarOutlined,
  ShopOutlined,
  MenuOutlined,
  UserOutlined,
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
  Space,
} from "antd";
import viVN from "antd/locale/vi_VN";
import { signOut } from "@nam-viet-erp/services";
import { useScreens } from "@nam-viet-erp/shared-components";
import { useEmployee } from "../context/EmployeeContext";
import logo from "../assets/logo.png";

const { Header, Content, Footer, Sider } = Layout;
const { Title } = Typography;
const { useBreakpoint } = Grid;

// Define menu items with their required permissions
const allMenuItems = [
  {
    label: "💰 Bán hàng (POS)",
    key: "/",
    icon: <ShoppingCartOutlined />,
    screenKey: "pos.main"
  },
  {
    label: "🏢 Bán Buôn",
    key: "wholesale",
    icon: <ShopOutlined />,
    children: [
      {
        label: "B2B Sales Dashboard",
        key: "/b2b-dashboard",
        screenKey: "b2b.dashboard"
      },
      {
        label: "Tạo Báo Giá / Đơn Hàng",
        key: "/create-quote",
        screenKey: "b2b.create-quote"
      },
      {
        label: "Danh sách Đơn hàng",
        key: "/store-channel",
        screenKey: "b2b.orders"
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
        screenKey: "medical.scheduling"
      },
      {
        label: "Quản lý bệnh nhân",
        key: "/patients",
        screenKey: "medical.patients"
      },
      {
        label: "Hồ sơ y tế",
        key: "/medical-records",
        screenKey: "medical.records"
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

const SiderContent: React.FC<{
  onMenuClick: MenuProps["onClick"];
  employee?: any;
  menuItems: MenuProps["items"];
}> = ({
  onMenuClick,
  employee,
  menuItems,
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
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
        Nam Việt Sale
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

    {/* User Info Section for Mobile */}
    <div style={{
      padding: "16px",
      borderTop: "1px solid rgba(255, 255, 255, 0.1)",
      backgroundColor: "rgba(255, 255, 255, 0.05)"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <Avatar
          size="default"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            fontWeight: 'bold'
          }}
        >
          {employee?.full_name ? employee.full_name.charAt(0).toUpperCase() : 'U'}
        </Avatar>
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: "14px",
            fontWeight: "500",
            color: "white",
            lineHeight: "1.2"
          }}>
            {employee?.full_name || 'Người dùng'}
          </div>
          <div style={{
            fontSize: "12px",
            color: "rgba(255, 255, 255, 0.7)",
            lineHeight: "1.2"
          }}>
            Mã NV: {employee?.employee_code || 'N/A'}
          </div>
        </div>
      </div>
    </div>
  </div>
);

const AppLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { employee } = useEmployee();
  const { renderScreen, hasPermission } = useScreens();
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const isMobile = !screens.lg;

  // Filter menu items based on user permissions
  const getFilteredMenuItems = (): MenuProps["items"] => {
    return allMenuItems
      .map(item => {
        // Check if user has permission for top-level items
        if (item.screenKey && !hasPermission(item.screenKey)) {
          return null;
        }

        // If it has children, filter them too
        if (item.children) {
          const filteredChildren = item.children
            .filter(child => !child.screenKey || hasPermission(child.screenKey));

          // If no children are accessible, don't show the parent
          if (filteredChildren.length === 0) {
            return null;
          }

          return {
            ...item,
            children: filteredChildren
          };
        }

        return item;
      })
      .filter(item => item !== null);
  };

  const menuItems = getFilteredMenuItems();

  // Debug: Log filtered menu items
  console.log('📋 Filtered menu items:', menuItems?.length || 0, 'items available');

  const handleMenuClick: MenuProps["onClick"] = (e) => {
    navigate(e.key);
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <ConfigProvider theme={namVietTheme} locale={viVN}>
      <Layout style={{ minHeight: "100vh" }}>
        {!isMobile && (
          <Sider
            collapsible
            collapsed={collapsed}
            onCollapse={(value) => setCollapsed(value)}
            width={230}
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
                  Nam Việt Sale
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
                display: 'flex',
                flexDirection: 'column',
                height: '100vh',
              },
            }}
            width={230}
          >
            <SiderContent onMenuClick={handleMenuClick} employee={employee} menuItems={menuItems} />
          </Drawer>
        )}

        <Layout
          style={{
            marginLeft: isMobile ? 0 : collapsed ? 50 : 230,
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
            {isMobile && (
              <Button
                type="text"
                icon={<MenuOutlined style={{ fontSize: "20px" }} />}
                onClick={() => setMobileMenuOpen(true)}
              />
            )}
            <Space align="center">
              <Avatar
                size="large"
                style={{
                  backgroundColor: '#1890ff',
                  fontWeight: 'bold',
                  fontSize: '16px'
                }}
                icon={!employee?.full_name ? <UserOutlined /> : null}
              >
                {employee?.full_name ? employee.full_name.charAt(0).toUpperCase() : 'U'}
              </Avatar>
              <div style={{ textAlign: "left" }}>
                <div style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#262626",
                  lineHeight: "1.2"
                }}>
                  {employee?.full_name || 'Người dùng'}
                </div>
                <div style={{
                  fontSize: "13px",
                  color: "#8c8c8c",
                  lineHeight: "1.2"
                }}>
                  Mã NV: {employee?.employee_code || 'N/A'}
                </div>
              </div>
              <Button onClick={handleLogout} type="default">
                Đăng xuất
              </Button>
            </Space>
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
                <Route
                  path="/"
                  element={renderScreen("pos.main", { employee })}
                />
                <Route
                  path="/store-channel"
                  element={renderScreen("b2b.orders", { employee })}
                />
                <Route
                  path="/b2b-dashboard"
                  element={renderScreen("b2b.dashboard", { employee })}
                />
                <Route
                  path="/create-quote"
                  element={renderScreen("b2b.create-quote", { employee })}
                />
                <Route
                  path="/scheduling"
                  element={renderScreen("medical.scheduling")}
                />
                <Route
                  path="/patients"
                  element={renderScreen("medical.patients")}
                />
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
