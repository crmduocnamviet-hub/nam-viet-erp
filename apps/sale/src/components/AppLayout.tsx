import React, { useState } from "react";
import {
  UserOutlined,
  LogoutOutlined,
  ShoppingCartOutlined,
  ShopOutlined,
  CalendarOutlined,
  MenuOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import {
  Layout,
  ConfigProvider,
  Avatar,
  Typography,
  Grid,
  Space,
  Dropdown,
  Menu,
  Button,
  Drawer,
} from "antd";
import viVN from "antd/locale/vi_VN";
import { signOut } from "@nam-viet-erp/services";
import {
  useScreens,
  EditB2BOrderPage,
  InventoryB2BOrdersPage,
  getNamVietTheme,
} from "@nam-viet-erp/shared-components";
import { useEmployee } from "../context/EmployeeContext";
import logo from "../assets/logo.png";

const { Header, Content, Footer } = Layout;
const { Title } = Typography;
const { useBreakpoint } = Grid;

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

// === SỬ DỤNG THEME CONFIG TỪ SHARED COMPONENTS ===
const namVietTheme = getNamVietTheme();

const ComingSoon = () => <h1>Tính năng này sắp ra mắt!</h1>;

const AppLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { employee } = useEmployee();
  const { renderScreen, hasPermission } = useScreens();
  const navigate = useNavigate();
  const location = useLocation();
  const screens = useBreakpoint();
  const isMobile = !screens.lg;

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
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  // Check if current route should hide the menu (full screen pages)
  const isFullScreenPage = ["/", "/create-quote"].includes(location.pathname);

  return (
    <>
      <style>{`
        .user-avatar-section:hover {
          background-color: #f5f5f5;
        }
      `}</style>
      <ConfigProvider theme={namVietTheme} locale={viVN}>
        <Layout style={{ minHeight: "100vh" }}>
          <Layout
            style={{
              marginLeft: 0,
            }}
          >
            {!isFullScreenPage && (
              <Header
                style={{
                  padding: "0 24px",
                  background: namVietTheme.components.Layout.headerBg,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  height: 70,
                }}
              >
                {/* Left side: Mobile menu button + Logo */}
                <Space align="center">
                  {isMobile && (
                    <Button
                      type="text"
                      icon={<MenuOutlined style={{ fontSize: "20px" }} />}
                      onClick={() => setMobileMenuOpen(true)}
                    />
                  )}
                  <Avatar
                    src={logo}
                    shape="square"
                    size="large"
                    style={{ backgroundColor: "transparent" }}
                  />
                  {!isMobile && (
                    <Title level={4} style={{ margin: 0, color: "#015ba9ff" }}>
                      Nam Việt Sale
                    </Title>
                  )}
                </Space>

                {/* Navigation Menu - Desktop only */}
                {!isMobile && (
                  <Menu
                    mode="horizontal"
                    selectedKeys={[location.pathname]}
                    items={menuItems}
                    onClick={handleMenuClick}
                    style={{
                      flex: 1,
                      border: "none",
                      fontSize: "15px",
                      marginLeft: 24,
                    }}
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
                              {employee?.full_name || "Người dùng"}
                            </div>
                            <div
                              style={{
                                fontSize: "13px",
                                color: "#8c8c8c",
                                lineHeight: "1.2",
                              }}
                            >
                              Mã NV: {employee?.employee_code || "N/A"}
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
                      icon={!employee?.full_name ? <UserOutlined /> : null}
                    >
                      {employee?.full_name
                        ? employee.full_name.charAt(0).toUpperCase()
                        : "U"}
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
                          {employee?.full_name || "Người dùng"}
                        </div>
                        <div
                          style={{
                            fontSize: "13px",
                            color: "#8c8c8c",
                            lineHeight: "1.2",
                          }}
                        >
                          Mã NV: {employee?.employee_code || "N/A"}
                        </div>
                      </div>
                    )}
                  </Space>
                </Dropdown>
              </Header>
            )}
            <Content style={{ margin: 0, overflow: "initial" }}>
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
                <Route
                  path="/store-scheduling"
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
            </Content>
            <Footer
              style={{
                textAlign: "center",
                padding: "10px 0",
                display: "none",
              }}
            >
              Nam Việt ERP ©{new Date().getFullYear()} - LVH
            </Footer>
          </Layout>

          {/* Mobile Navigation Drawer */}
          {isMobile && (
            <Drawer
              title="Menu"
              placement="left"
              onClose={() => setMobileMenuOpen(false)}
              open={mobileMenuOpen}
              styles={{
                body: {
                  padding: 0,
                },
              }}
              width={260}
            >
              <Menu
                mode="inline"
                selectedKeys={[location.pathname]}
                items={menuItems}
                onClick={handleMenuClick}
                style={{ fontSize: "15px", border: "none" }}
              />
            </Drawer>
          )}
        </Layout>
      </ConfigProvider>
    </>
  );
};

export default AppLayout;
