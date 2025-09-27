import React from "react";
import { Routes, Route } from "react-router-dom";
import AppLayout from "./components/AppLayout"; // <-- Chúng ta sẽ tách Layout ra file riêng
import Login from "./pages/Login";
import { useAuth } from "./hooks/useAuth";
import { ScreenProvider, ROLE_PERMISSIONS } from "@nam-viet-erp/shared-components";
import { Spin, Row } from "antd";

const App: React.FC = () => {
  const { session, loading } = useAuth();

  // Nếu đang trong quá trình kiểm tra session, hiển thị màn hình loading
  if (loading) {
    return (
      <Row justify="center" align="middle" style={{ minHeight: "100vh" }}>
        <Spin size="large" />
      </Row>
    );
  }

  // Create user object for permissions (placeholder - would typically come from auth)
  const user = session ? {
    id: 'current-user',
    name: 'Current User',
    permissions: ROLE_PERMISSIONS['super-admin'], // Use super-admin permissions for cms app (full access)
    role: 'super-admin'
  } : null;

  return (
    <Routes>
      {/* Nếu chưa đăng nhập, chỉ có thể truy cập trang Login */}
      <Route path="/login" element={<Login />} />

      {/* Nếu đã đăng nhập, có thể truy cập các trang bên trong AppLayout */}
      <Route path="/*" element={session && user ? (
        <ScreenProvider user={user}>
          <AppLayout />
        </ScreenProvider>
      ) : <Login />} />
    </Routes>
  );
};

export default App;
