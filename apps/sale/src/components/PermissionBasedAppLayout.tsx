import React, { useState } from "react";
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
import { MenuOutlined } from "@ant-design/icons";
import viVN from "antd/locale/vi_VN";
import { signOut } from "@nam-viet-erp/services";
import {
  ScreenProvider,
  useScreens,
  Screen,
  generateMenu,
  generateRoutes,
  getRouteMapping,
  SALE_APP_MENU,
} from "@nam-viet-erp/shared-components";

import { useEmployee } from "../context/EmployeeContext";
import logo from "../assets/logo.png";

const { Header, Content, Footer, Sider } = Layout;
const { Title } = Typography;
const { useBreakpoint } = Grid;

// Theme configuration
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

// Convert employee to user format
const convertEmployeeToUser = (employee: any) => {
  if (!employee) return null;

  return {
    id: employee.employee_id,
    name: employee.full_name,
    role: employee.role_name || 'employee',
    // Mock permissions - in real app, this would come from the backend
    permissions: [
      'pos.access',
      'sales.create',
      'sales.view',
      'b2b.access',
      'quotes.view',
      'quotes.create',
      'medical.access',
      'patients.view',
      'appointments.view',
    ],
  };
};

// Inner component that uses screen context
const AppLayoutContent: React.FC = () => {
  const [collapsed, setCollapsed] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const isMobile = !screens.lg;
  const { user, renderScreen } = useScreens();

  // Generate menu and routes based on user permissions
  const menuItems = user ? generateMenu(SALE_APP_MENU, user.permissions) : [];
  const routeMapping = getRouteMapping(SALE_APP_MENU);
  const availableRoutes = user ? generateRoutes(routeMapping, user.permissions) : [];

  const handleMenuClick = (e: any) => {
    navigate(e.key);
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const ComingSoon = () => (
    <div style={{ padding: '24px', textAlign: 'center' }}>
      <h1>Tính năng này sắp ra mắt!</h1>
    </div>
  );

  return (
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
            },
          }}
          width={230}
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
              Nam Việt Sale
            </Title>
          </div>
          <Menu
            theme="dark"
            defaultSelectedKeys={["/"]}
            mode="inline"
            items={menuItems}
            onClick={handleMenuClick}
            style={{ fontSize: "16px" }}
          />
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {user && (
              <span style={{ color: '#666' }}>
                Xin chào, {user.name}
              </span>
            )}
            <Button onClick={handleLogout}>Đăng xuất</Button>
          </div>
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
              {/* Default route */}
              <Route
                path="/"
                element={
                  <Screen
                    screenKey="pos.main"
                    fallback={<ComingSoon />}
                  />
                }
              />

              {/* Generate routes dynamically based on permissions */}
              {availableRoutes.map(({ path, screenKey }) => (
                <Route
                  key={path}
                  path={path}
                  element={
                    <Screen
                      screenKey={screenKey}
                      fallback={<ComingSoon />}
                    />
                  }
                />
              ))}

              {/* Fallback route */}
              <Route path="*" element={<ComingSoon />} />
            </Routes>
          </div>
        </Content>
        <Footer style={{ textAlign: "center", padding: "10px 0" }}>
          Nam Việt ERP ©{new Date().getFullYear()} - LVH
        </Footer>
      </Layout>
    </Layout>
  );
};

// Main component with providers
const PermissionBasedAppLayout: React.FC = () => {
  const { employee } = useEmployee();
  const user = convertEmployeeToUser(employee);

  // Additional context to pass to screens
  const screenContext = {
    employee,
    appType: 'sale',
  };

  return (
    <ConfigProvider theme={namVietTheme} locale={viVN}>
      <ScreenProvider user={user} context={screenContext}>
        <AppLayoutContent />
      </ScreenProvider>
    </ConfigProvider>
  );
};

export default PermissionBasedAppLayout;