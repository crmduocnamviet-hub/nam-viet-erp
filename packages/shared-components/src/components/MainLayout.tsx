// packages/shared-components/src/components/MainLayout.tsx
import {
  BellOutlined,
  LogoutOutlined,
  UserOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  MenuOutlined,
} from "@ant-design/icons";
import {
  Layout,
  Button,
  Menu,
  Avatar,
  Badge,
  Dropdown,
  message,
  Grid,
  Drawer,
  Typography,
} from "antd";
import React, { useState, ReactNode } from "react";
import { Outlet } from "react-router-dom";
import type { MenuProps } from "antd";

const { Header, Sider, Content } = Layout;
const { Title } = Typography;
const { useBreakpoint } = Grid;

export interface MainLayoutProps {
  /**
   * Menu items for the sidebar
   */
  menuItems: MenuProps["items"];

  /**
   * Logo URL or component
   */
  logo?: string | ReactNode;

  /**
   * Application name
   */
  appName?: string;

  /**
   * User information
   */
  user?: {
    email?: string;
    name?: string;
  };

  /**
   * Logout handler
   */
  onLogout: () => Promise<void>;

  /**
   * Menu click handler
   */
  onMenuClick?: MenuProps["onClick"];

  /**
   * Initial collapsed state
   */
  initialCollapsed?: boolean;

  /**
   * Sider background color
   */
  siderBg?: string;

  /**
   * Collapsed width
   */
  collapsedWidth?: number;

  /**
   * Sider width
   */
  siderWidth?: number;

  /**
   * Show notification badge
   */
  showNotificationBadge?: boolean;

  /**
   * Notification click handler
   */
  onNotificationClick?: () => void;

  /**
   * Children to render in content area
   * If not provided, will use <Outlet /> for react-router
   */
  children?: ReactNode;
}

// Sider Content Component for reuse
const SiderContent: React.FC<{
  logo?: string | ReactNode;
  appName: string;
  menuItems: MenuProps["items"];
  onMenuClick?: MenuProps["onClick"];
  collapsed?: boolean;
}> = ({ logo, appName, menuItems, onMenuClick, collapsed = false }) => (
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
      {typeof logo === "string" ? (
        <Avatar
          src={logo}
          shape="square"
          size="large"
          style={{ backgroundColor: "transparent" }}
        />
      ) : (
        logo
      )}
      {!collapsed && (
        <Title level={5} style={{ color: "white", margin: 0 }}>
          {appName}
        </Title>
      )}
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

const MainLayout: React.FC<MainLayoutProps> = ({
  menuItems,
  logo,
  appName = "Nam Việt ERP",
  user,
  onLogout,
  onMenuClick,
  initialCollapsed = true,
  siderBg = "#001529",
  collapsedWidth = 50,
  siderWidth = 230,
  showNotificationBadge = false,
  onNotificationClick,
  children,
}) => {
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const screens = useBreakpoint();
  const isMobile = !screens.lg;

  const handleLogout = async () => {
    try {
      await onLogout();
      message.success("Đã đăng xuất!");
    } catch (error) {
      message.error("Đăng xuất thất bại!");
    }
  };

  const handleMenuClickWrapper: MenuProps["onClick"] = (e) => {
    if (onMenuClick) {
      onMenuClick(e);
    }
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  };

  const userMenuItems: MenuProps["items"] = [
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Đăng xuất",
      onClick: handleLogout,
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* Desktop Sider */}
      {!isMobile && (
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={(value) => setCollapsed(value)}
          width={siderWidth}
          collapsedWidth={collapsedWidth}
          style={{
            overflow: "auto",
            height: "100vh",
            position: "fixed",
            left: 0,
            top: 0,
            bottom: 0,
            background: siderBg,
          }}
        >
          <SiderContent
            logo={logo}
            appName={appName}
            menuItems={menuItems}
            onMenuClick={handleMenuClickWrapper}
            collapsed={collapsed}
          />
        </Sider>
      )}

      {/* Mobile Drawer */}
      {isMobile && (
        <Drawer
          placement="left"
          onClose={() => setMobileMenuOpen(false)}
          open={mobileMenuOpen}
          closable={false}
          styles={{
            body: {
              padding: 0,
              background: siderBg,
              display: "flex",
              flexDirection: "column",
              height: "100vh",
            },
          }}
          width={siderWidth}
        >
          <SiderContent
            logo={logo}
            appName={appName}
            menuItems={menuItems}
            onMenuClick={handleMenuClickWrapper}
          />
        </Drawer>
      )}

      <Layout
        style={{
          marginLeft: isMobile ? 0 : collapsed ? collapsedWidth : siderWidth,
          transition: "margin-left 0.2s",
        }}
      >
        <Header
          style={{
            padding: "0 24px",
            background: "#ffffff",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "0 1px 4px rgba(0,21,41,.08)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", flexGrow: 1 }}>
            {!isMobile && (
              <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                style={{
                  fontSize: "16px",
                  width: 64,
                  height: 64,
                }}
              />
            )}
            {isMobile && (
              <Button
                type="text"
                icon={<MenuOutlined />}
                onClick={() => setMobileMenuOpen(true)}
                style={{
                  fontSize: "16px",
                  width: 64,
                  height: 64,
                }}
              />
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* Notification Button */}
            <Button
              type="text"
              shape="circle"
              icon={
                showNotificationBadge ? (
                  <Badge dot>
                    <BellOutlined style={{ fontSize: "18px" }} />
                  </Badge>
                ) : (
                  <BellOutlined style={{ fontSize: "18px" }} />
                )
              }
              onClick={onNotificationClick}
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
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <Avatar icon={<UserOutlined />} />
                  {!isMobile && (
                    <span style={{ fontWeight: 500, color: "#333" }}>
                      {user?.name || user?.email || "User"}
                    </span>
                  )}
                </div>
              </Button>
            </Dropdown>
          </div>
        </Header>
        <Content style={{ margin: "16px", overflow: "initial" }}>
          <div
            style={{
              padding: 16,
              background: "#ffffff",
              borderRadius: 8,
              minHeight: "calc(100vh - 32px)",
            }}
          >
            {children || <Outlet />}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
