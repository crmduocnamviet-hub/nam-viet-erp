import React, { useState } from "react";
import {
  PieChartOutlined,
  AppstoreOutlined,
  ShopOutlined,
  TagOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { Routes, Route, useNavigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import QuickQuote from "./pages/QuickQuote";
import logo from "./assets/logo.png";
import {
  Layout,
  Menu,
  ConfigProvider,
  Avatar,
  Typography,
  App as AntApp,
} from "antd";
import Promotions from "./pages/Promotions";
import Vouchers from "./pages/Vouchers";
import PromotionDetail from "./pages/PromotionDetail";
import viVN from "antd/locale/vi_VN";

const { Header, Content, Footer, Sider } = Layout;
const { Title } = Typography;

const menuItems: MenuProps["items"] = [
  { label: "Tổng quan", key: "/", icon: <PieChartOutlined /> },
  { label: "Kho - Sản Phẩm", key: "/products", icon: <AppstoreOutlined /> },
  {
    label: "Bán Buôn (B2B)", // Giờ đây là một menu cha
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
];

const namVietTheme = {
  token: {
    colorBgLayout: "#f0f2f5",
    colorPrimary: "#00809D",
    borderRadius: 5,
  },
  components: {
    Layout: { headerBg: "#ffffff", siderBg: "#001529" },
  },
};

const ComingSoon = () => <h1>Tính năng này sắp ra mắt!</h1>;

const AppLayout: React.FC = () => {
  // Đổi tên component nội bộ để dễ quản lý
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  const handleMenuClick: MenuProps["onClick"] = (e) => {
    navigate(e.key);
  };

  return (
    <ConfigProvider theme={namVietTheme} locale={viVN}>
      <Layout style={{ minHeight: "100vh" }}>
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={(value) => setCollapsed(value)}
          // Thêm style để Sider không bị tràn ra ngoài
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
              height: "64px",
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
              <Title level={4} style={{ color: "white", margin: 0 }}>
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
          />
        </Sider>

        {/* Thêm style để nội dung bên phải không bị menu đè lên */}
        <Layout
          style={{
            marginLeft: collapsed ? 80 : 200,
            transition: "margin-left 0.2s",
          }}
        >
          <Header
            style={{
              padding: "0 10px",
              background: namVietTheme.components.Layout.headerBg,
            }}
          />
          <Content style={{ margin: "24px 16px 0", overflow: "initial" }}>
            <div
              style={{
                padding: 10,
                background: "#ffffff",
                borderRadius: namVietTheme.token.borderRadius,
              }}
            >
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/products" element={<Products />} />
                <Route path="/quick-quote" element={<QuickQuote />} />{" "}
                <Route path="/promotions" element={<Promotions />} />{" "}
                <Route path="/promotions/new" element={<PromotionDetail />} />{" "}
                <Route path="/promotions/:id" element={<PromotionDetail />} />
                <Route path="/vouchers" element={<Vouchers />} />
                <Route path="*" element={<ComingSoon />} />
              </Routes>
            </div>
          </Content>
          <Footer style={{ textAlign: "center" }}>
            Nam Việt ERP ©{new Date().getFullYear()} - Kiến tạo bởi SENKO V400
          </Footer>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
};

// Component App chính giờ đây sẽ bao gồm cả "hộp âm thanh"
const App: React.FC = () => (
  <ConfigProvider theme={namVietTheme}>
    <AntApp>
      {" "}
      {/* <-- BỌC MỌI THỨ TRONG "HỘP ÂM THANH" NÀY */}
      <AppLayout />
    </AntApp>
  </ConfigProvider>
);

export default App;
