import React from "react";
import { Routes, Route } from "react-router-dom";
import AppLayout from "./components/AppLayout"; // <-- Chúng ta sẽ tách Layout ra file riêng
import Login from "./pages/Login";
import { useAuth } from "./context/AuthContext";
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

  return (
    <Routes>
      {/* Nếu chưa đăng nhập, chỉ có thể truy cập trang Login */}
      <Route path="/login" element={<Login />} />

      {/* Nếu đã đăng nhập, có thể truy cập các trang bên trong AppLayout */}
      <Route path="/*" element={session ? <AppLayout /> : <Login />} />
    </Routes>
  );
};

export default App;
