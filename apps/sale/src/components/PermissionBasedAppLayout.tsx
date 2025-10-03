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
  Space,
  Dropdown,
} from "antd";
import { MenuOutlined, UserOutlined, LogoutOutlined } from "@ant-design/icons";
import viVN from "antd/locale/vi_VN";
import { signOut } from "@nam-viet-erp/services";
import {
  ScreenProvider,
  useScreens,
  generateMenu,
  SALE_APP_MENU,
} from "@nam-viet-erp/shared-components";

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

// Inner component that uses screen context
const AppLayoutContent: React.FC = () => {
  const [collapsed, setCollapsed] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const isMobile = !screens.lg;
  const { user, renderScreen } = useScreens();

  const menuItems = user ? generateMenu(SALE_APP_MENU, user.permissions) : [];

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
    <div style={{ padding: "24px", textAlign: "center" }}>
      <h1>Tính năng này sắp ra mắt!</h1>
    </div>
  );

  return (
    <>
      <style>{`
        .user-avatar-section:hover {
          background-color: #f5f5f5;
        }
      `}</style>
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
                display: "flex",
                flexDirection: "column",
                height: "100vh",
              },
            }}
            width={230}
          >
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
                  Nam Việt Sale
                </Title>
              </div>
              <Menu
                theme="dark"
                defaultSelectedKeys={["/"]}
                mode="inline"
                items={menuItems}
                onClick={handleMenuClick}
                style={{ fontSize: "16px", flex: 1 }}
              />

              {/* User Info Section for Mobile */}
              <div
                style={{
                  padding: "16px",
                  borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <Avatar
                    size="default"
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.2)",
                      color: "white",
                      fontWeight: "bold",
                    }}
                  >
                    {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                  </Avatar>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "white",
                        lineHeight: "1.2",
                      }}
                    >
                      {user?.name || "Người dùng"}
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "rgba(255, 255, 255, 0.7)",
                        lineHeight: "1.2",
                      }}
                    >
                      {/* Add employee code if available */}
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
              padding: "12px 24px",
              background: namVietTheme.components.Layout.headerBg,
              display: "flex",
              justifyContent: isMobile ? "space-between" : "flex-end",
              alignItems: "center",
              height: 70,
            }}
          >
            {isMobile && (
              <Button
                type="text"
                icon={<MenuOutlined style={{ fontSize: "20px" }} />}
                onClick={() => setMobileMenuOpen(true)}
              />
            )}
            <Dropdown
              menu={{
                items: [
                  {
                    key: "user-info",
                    label: (
                      <div
                        style={{
                          padding: "8px 0",
                          borderBottom: "1px solid #f0f0f0",
                          marginBottom: "8px",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "16px",
                            fontWeight: "600",
                            color: "#262626",
                            lineHeight: "1.2",
                          }}
                        >
                          {user?.name || "Người dùng"}
                        </div>
                        <div
                          style={{
                            fontSize: "13px",
                            color: "#8c8c8c",
                            lineHeight: "1.2",
                          }}
                        >
                          {/* Add employee code if available */}
                        </div>
                      </div>
                    ),
                    disabled: true,
                  },
                  {
                    key: "logout",
                    label: "Đăng xuất",
                    icon: <LogoutOutlined />,
                    onClick: handleLogout,
                  },
                ],
              }}
              placement="bottomRight"
              trigger={["click"]}
            >
              <Space
                align="center"
                style={{
                  cursor: "pointer",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  transition: "background-color 0.2s",
                }}
                className="user-avatar-section"
              >
                <Avatar
                  size="large"
                  style={{
                    backgroundColor: "#1890ff",
                    fontWeight: "bold",
                    fontSize: "16px",
                  }}
                  icon={!user?.name ? <UserOutlined /> : null}
                >
                  {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                </Avatar>
                {!isMobile && (
                  <div style={{ textAlign: "left" }}>
                    <div
                      style={{
                        fontSize: "16px",
                        fontWeight: "600",
                        color: "#262626",
                        lineHeight: "1.2",
                      }}
                    >
                      {user?.name || "Người dùng"}
                    </div>
                    <div
                      style={{
                        fontSize: "13px",
                        color: "#8c8c8c",
                        lineHeight: "1.2",
                      }}
                    >
                      {/* Add employee code if available */}
                    </div>
                  </div>
                )}
              </Space>
            </Dropdown>
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
                {/* Default route - Staff Dashboard/TODO Lists */}
                <Route
                  path="/"
                  element={
                    user?.role.includes("inventory")
                      ? renderScreen("staff.inventory-dashboard")
                      : user?.role.includes("delivery")
                      ? renderScreen("staff.delivery-dashboard")
                      : user?.role.includes("sales")
                      ? renderScreen("staff.sales-dashboard")
                      : renderScreen("pos.main")
                  }
                />
                <Route path="/pos" element={renderScreen("pos.main")} />
                <Route
                  path="/store-channel"
                  element={renderScreen("b2b.orders")}
                />
                <Route
                  path="/b2b-dashboard"
                  element={renderScreen("b2b.dashboard")}
                />
                <Route
                  path="/create-quote"
                  element={renderScreen("b2b.create-quote")}
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
                <Route
                  path="/sales-dashboard"
                  element={renderScreen("staff.sales-dashboard")}
                />
                <Route
                  path="/inventory-dashboard"
                  element={renderScreen("staff.inventory-dashboard")}
                />
                <Route
                  path="/delivery-dashboard"
                  element={renderScreen("staff.delivery-dashboard")}
                />
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
    </>
  );
};

// Main component with providers
const PermissionBasedAppLayout: React.FC = () => {
  // Additional context to pass to screens
  const screenContext = {
    appType: "sale",
  };

  return (
    <ConfigProvider theme={namVietTheme} locale={viVN}>
      <ScreenProvider context={screenContext}>
        <AppLayoutContent />
      </ScreenProvider>
    </ConfigProvider>
  );
};

export default PermissionBasedAppLayout;
