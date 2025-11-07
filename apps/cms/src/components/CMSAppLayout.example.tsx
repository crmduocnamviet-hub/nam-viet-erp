// CMSAppLayout.example.tsx - Example of how to use MainLayout with CMS
import React from "react";
import {
  PieChartOutlined,
  AppstoreOutlined,
  ShopOutlined,
  TagOutlined,
  DollarOutlined,
  SettingOutlined,
  UsergroupAddOutlined,
  RocketOutlined,
  UserOutlined,
  SwapOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { Routes, Route, useNavigate } from "react-router-dom";
import { ConfigProvider } from "antd";
import viVN from "antd/locale/vi_VN";
import { signOut } from "@nam-viet-erp/services";
import {
  MainLayout,
  Screen,
  CreateProductPage,
  EditProductPage,
  EditB2BOrderPage,
  InventoryB2BOrdersPage,
} from "@nam-viet-erp/shared-components";
import { useAuthStore } from "@nam-viet-erp/store";
import logo from "../assets/logo.png";
import MissingDocumentationWarning from "./MissingDocumentationWarning";

const menuItems: MenuProps["items"] = [
  { label: "Tổng quan", key: "/", icon: <PieChartOutlined /> },
  {
    label: "Kho - Sản Phẩm",
    key: "inventory",
    icon: <AppstoreOutlined />,
    children: [
      { label: "Danh sách Sản phẩm", key: "/products" },
      { label: "Thêm sản phẩm mới", key: "/products/create" },
      { label: "Quản lý Combo", key: "/combos" },
      { type: "divider" },
      { label: "Quản lý Đặt hàng", key: "/purchase-orders" },
      { label: "Nhận hàng", key: "/warehouse/receiving" },
      { label: "Lấy hàng (Picking)", key: "/warehouse/picking" },
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
      { label: "Dashboard B2B", key: "/b2b/dashboard" },
      { label: "Quản lý Đơn hàng B2B", key: "/b2b-orders" },
      { label: "📦 Đơn hàng - Kho", key: "/b2b/inventory" },
      { label: "Xem Nhanh Báo Giá", key: "/quick-quote" },
      { label: "Tạo Báo Giá / Đơn Hàng", key: "/create-quote" },
      { label: "Tài chính B2B", key: "/b2b/financial" },
    ],
  },
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

const CMSAppLayoutExample: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const handleMenuClick: MenuProps["onClick"] = (e) => {
    navigate(e.key);
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <ConfigProvider theme={namVietTheme} locale={viVN}>
      <MainLayout
        menuItems={menuItems}
        logo={logo}
        appName="Nam Việt EMS"
        user={{
          email: user?.email,
          name: user?.email,
        }}
        onLogout={handleLogout}
        onMenuClick={handleMenuClick}
        initialCollapsed={true}
        siderBg="#015ba9ff"
        collapsedWidth={50}
        siderWidth={230}
        showNotificationBadge={false}
      >
        {/* All routes go here as children */}
        <Routes>
          <Route
            path="/"
            element={<Screen screenKey="management.dashboard" />}
          />
          <Route
            path="/products"
            element={<Screen screenKey="inventory.products" />}
          />
          <Route path="/products/create" element={<CreateProductPage />} />
          <Route path="/products/edit/:id" element={<EditProductPage />} />
          <Route
            path="/lots/:lotId"
            element={<Screen screenKey="inventory.lot-detail" />}
          />
          <Route
            path="/combos"
            element={<Screen screenKey="inventory.combos" />}
          />
          <Route
            path="/b2b-orders"
            element={<Screen screenKey="b2b.orders" />}
          />
          <Route
            path="/b2b/dashboard"
            element={<Screen screenKey="b2b.dashboard" />}
          />
          <Route
            path="/b2b/financial"
            element={<Screen screenKey="b2b.financial" />}
          />
          <Route path="/b2b/orders/edit/:id" element={<EditB2BOrderPage />} />
          <Route path="/b2b/inventory" element={<InventoryB2BOrdersPage />} />
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

          {/* WAREHOUSE PURCHASE ORDER ROUTES */}
          <Route
            path="/warehouse/purchase-orders"
            element={<Screen screenKey="warehouse.purchase-orders" />}
          />
          <Route
            path="/warehouse/purchase-orders/:id/edit"
            element={<Screen screenKey="warehouse.purchase-orders.edit" />}
          />
          <Route
            path="/warehouse/receiving"
            element={<Screen screenKey="warehouse.receiving" />}
          />
          <Route
            path="/warehouse/receiving/create"
            element={<Screen screenKey="warehouse.receiving.create" />}
          />
          <Route
            path="/warehouse/receiving/:id"
            element={<Screen screenKey="warehouse.receiving.detail" />}
          />
          <Route
            path="/warehouse/picking"
            element={<Screen screenKey="warehouse.picking" />}
          />

          {/* SUPPLIER ROUTES */}
          <Route
            path="/suppliers"
            element={<Screen screenKey="warehouse.suppliers" />}
          />
          <Route
            path="/suppliers/new"
            element={<Screen screenKey="warehouse.suppliers.form" />}
          />
          <Route
            path="/suppliers/:id"
            element={<Screen screenKey="warehouse.suppliers.form" />}
          />
          <Route
            path="/suppliers/:id/promotions"
            element={<Screen screenKey="warehouse.suppliers.promotions" />}
          />

          {/* ROUTE CHO MODULE NHÂN SỰ */}
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

          {/* ROUTE CHO MODULE QUẢN LÝ TÀI KHOẢN */}
          <Route
            path="/users"
            element={<Screen screenKey="management.users" />}
          />

          {/* ROUTE CHO MODULE BỆNH NHÂN */}
          <Route
            path="/patients"
            element={<Screen screenKey="medical.patients" />}
          />
          <Route
            path="/patients/:patientId"
            element={<Screen screenKey="medical.patient-detail" />}
          />

          {/* ROUTE CHO MODULE QUẢN LÝ PHÒNG */}
          <Route
            path="/rooms"
            element={<Screen screenKey="management.rooms" />}
          />

          {/* THÊM ROUTE CHO MODULE MARKETING */}
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

          {/* WAREHOUSE TRANSFER ROUTES */}
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

          {/* WAREHOUSE VAT ROUTES */}
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
      </MainLayout>
    </ConfigProvider>
  );
};

export default CMSAppLayoutExample;
