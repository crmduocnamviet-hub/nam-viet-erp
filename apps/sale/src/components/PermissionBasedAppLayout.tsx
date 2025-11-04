import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import {
  Layout,
  Menu,
  ConfigProvider,
  Avatar,
  Typography,
  Button,
  Grid,
  Drawer,
  Modal,
  Spin,
  Row,
  Alert,
  App,
} from "antd";
import {
  MenuOutlined,
  LogoutOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import viVN from "antd/locale/vi_VN";
import { signOut } from "@nam-viet-erp/services";
import {
  ScreenProvider,
  useScreens,
  generateMenu,
  SALE_APP_MENU,
} from "@nam-viet-erp/shared-components";
import { useEmployee, useEmployeeStore } from "@nam-viet-erp/store";

import logo from "../assets/logo.png";

const { Content, Sider } = Layout;
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

// Main component with providers
const PermissionBasedAppLayout: React.FC = () => {
  const employee = useEmployee();
  const isLoading = useEmployeeStore((state) => state.isLoading);

  // Additional context to pass to screens
  const screenContext = {
    appType: "sale",
  };

  // Show loading state
  if (isLoading) {
    return (
      <ConfigProvider theme={namVietTheme} locale={viVN}>
        <Row justify="center" align="middle" style={{ minHeight: "100vh" }}>
          <Spin size="large" />
        </Row>
      </ConfigProvider>
    );
  }

  // Show error if no employee
  if (!employee) {
    return (
      <ConfigProvider theme={namVietTheme} locale={viVN}>
        <Row justify="center" align="middle" style={{ minHeight: "100vh" }}>
          <Alert
            message="Không thể tải thông tin nhân viên"
            description="Vui lòng đăng xuất và đăng nhập lại"
            type="error"
            showIcon
          />
        </Row>
      </ConfigProvider>
    );
  }

  // Show warning if employee is inactive
  if (!employee.is_active) {
    return (
      <ConfigProvider theme={namVietTheme} locale={viVN}>
        <Row justify="center" align="middle" style={{ minHeight: "100vh" }}>
          <Alert
            message="Tài khoản đã bị vô hiệu hóa"
            description="Vui lòng liên hệ quản trị viên để được hỗ trợ"
            type="warning"
            showIcon
          />
        </Row>
      </ConfigProvider>
    );
  }

  return (
    <ConfigProvider theme={namVietTheme} locale={viVN}>
      <App>
        <ScreenProvider context={screenContext}>
          <AppLayoutContent />
        </ScreenProvider>
      </App>
    </ConfigProvider>
  );
};

// Inner component that uses screen context - MUST be inside ScreenProvider
const AppLayoutContent: React.FC = () => {
  const [collapsed, setCollapsed] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const screens = useBreakpoint();
  const isMobile = !screens.lg;
  const { user, renderScreen } = useScreens();

  const menuItems = user ? generateMenu(SALE_APP_MENU, user.permissions) : [];

  // Check if current route is POS - show fullscreen
  const isFullscreenRoute =
    location.pathname === "/pos" || location.pathname === "/create-quote";

  const handleMenuClick = (e: any) => {
    navigate(e.key);
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  };

  const handleLogout = () => {
    Modal.confirm({
      title: "Xác nhận đăng xuất",
      icon: <ExclamationCircleOutlined />,
      content: "Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?",
      okText: "Đăng xuất",
      okType: "danger",
      cancelText: "Hủy",
      centered: true,
      onOk: async () => {
        try {
          await signOut();
          navigate("/login");
        } catch (error) {
          console.error("Error signing out:", error);
        }
      },
    });
  };

  const ComingSoon = () => {
    const navigate = useNavigate();
    useEffect(() => {
      // Redirect to home after 2 seconds if on unknown route
      const timer = setTimeout(() => {
        navigate("/", { replace: true });
      }, 2000);
      return () => clearTimeout(timer);
    }, [navigate]);

    return (
      <div style={{ padding: "24px", textAlign: "center" }}>
        <h1>Trang không tồn tại</h1>
        <p>Đang chuyển về trang chủ...</p>
      </div>
    );
  };

  // Fullscreen mode for POS - but still show sidebar for navigation
  if (isFullscreenRoute) {
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
              display: "flex",
              flexDirection: "column",
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
              mode="inline"
              selectedKeys={[location.pathname]}
              items={menuItems}
              onClick={handleMenuClick}
              style={{ flex: 1, borderRight: 0 }}
            />
          </Sider>
        )}
        <Layout
          style={{
            marginLeft:
              !isMobile && !collapsed ? 230 : !isMobile && collapsed ? 50 : 0,
          }}
        >
          <Content
            style={{
              margin: "0",
              padding: "0",
              overflow: "hidden",
              height: "100vh",
            }}
          >
            <Routes>
              <Route path="/pos" element={renderScreen("pos.main")} />
              <Route
                path="/create-quote"
                element={renderScreen("b2b.create-quote")}
              />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    );
  }

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
              display: "flex",
              flexDirection: "column",
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

              {/* Logout Button for Mobile */}
              <div
                style={{
                  padding: "16px",
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
                    justifyContent: "flex-start",
                  }}
                >
                  Đăng xuất
                </Button>
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
          <Content style={{ margin: "0", padding: "8px", overflow: "initial" }}>
            <div
              style={{
                padding: 0,
                background: "transparent",
                borderRadius: namVietTheme.token.borderRadius,
                minHeight: "calc(100vh - 16px)",
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
                  path="/b2b/financial"
                  element={renderScreen("b2b.financial")}
                />
                <Route
                  path="/pos/orders"
                  element={renderScreen("pos.orders")}
                />
                <Route path="/profile" element={renderScreen("user.profile")} />
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
                <Route
                  path="/products"
                  element={renderScreen("inventory.products")}
                />
                <Route
                  path="/products/edit/:id"
                  element={renderScreen("inventory.products.edit")}
                />
                <Route
                  path="/products/create"
                  element={renderScreen("inventory.products.create")}
                />
                <Route
                  path="/combos"
                  element={renderScreen("inventory.combos")}
                />
                <Route
                  path="/purchase-orders"
                  element={renderScreen("inventory.purchase-orders")}
                />
                <Route
                  path="/warehouse-lots"
                  element={renderScreen("warehouse.lot-management")}
                />
                <Route
                  path="/lots/:lotId"
                  element={renderScreen("inventory.lot-detail")}
                />
                {/* Warehouse Routes */}
                <Route
                  path="/warehouse/purchase-orders"
                  element={renderScreen("warehouse.purchase-orders")}
                />
                <Route
                  path="/warehouse/purchase-orders/:id/edit"
                  element={renderScreen("warehouse.purchase-orders.edit")}
                />
                <Route
                  path="/warehouse/receiving"
                  element={renderScreen("warehouse.receiving")}
                />
                <Route
                  path="/warehouse/receiving/create"
                  element={renderScreen("warehouse.receiving.create")}
                />
                <Route
                  path="/warehouse/receiving/:poId"
                  element={renderScreen("warehouse.receiving.detail")}
                />
                <Route
                  path="/warehouse/picking"
                  element={renderScreen("warehouse.picking")}
                />
                <Route
                  path="/warehouse/suppliers"
                  element={renderScreen("warehouse.suppliers")}
                />
                <Route
                  path="/warehouse/suppliers/new"
                  element={renderScreen("warehouse.suppliers.form")}
                />
                <Route
                  path="/warehouse/suppliers/:supplierId"
                  element={renderScreen("warehouse.suppliers.form")}
                />
                <Route
                  path="/warehouse/suppliers/:supplierId/promotions"
                  element={renderScreen("warehouse.suppliers.promotions")}
                />
                <Route
                  path="/warehouse/vat-inventory"
                  element={renderScreen("warehouse.vat-inventory")}
                />
                <Route
                  path="/warehouse/vat-reconciliation"
                  element={renderScreen("warehouse.vat-reconciliation")}
                />
                <Route
                  path="/warehouse/transfers"
                  element={renderScreen("warehouse.transfers")}
                />
                <Route
                  path="/warehouse/transfers/create"
                  element={renderScreen("warehouse.transfers.create")}
                />
                <Route
                  path="/warehouse/transfers/:id"
                  element={renderScreen("warehouse.transfers.detail")}
                />
                {/* Management Routes */}
                <Route
                  path="/employees/create"
                  element={renderScreen("management.employees.create")}
                />
                <Route
                  path="/employees/:employeeId"
                  element={renderScreen("management.employees.edit")}
                />
                {/* Fallback route */}
                <Route path="*" element={<ComingSoon />} />
              </Routes>
            </div>
          </Content>
        </Layout>
      </Layout>
    </>
  );
};

export default PermissionBasedAppLayout;
