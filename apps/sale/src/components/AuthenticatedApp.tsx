import React from "react";
import { Spin, Row, Alert } from "antd";
import { ScreenProvider } from "@nam-viet-erp/shared-components";
import { useEmployee } from "../context/EmployeeContext";
import AppLayout from "./AppLayout";

const AuthenticatedApp: React.FC = () => {
  const { employee, loading, permissions } = useEmployee();

  if (loading) {
    return (
      <Row justify="center" align="middle" style={{ minHeight: "100vh" }}>
        <Spin size="large" />
      </Row>
    );
  }

  if (!employee) {
    return (
      <Row justify="center" align="middle" style={{ minHeight: "100vh" }}>
        <Alert
          message="Không thể tải thông tin nhân viên"
          description="Vui lòng đăng xuất và đăng nhập lại"
          type="error"
          showIcon
        />
      </Row>
    );
  }

  if (!employee.is_active) {
    return (
      <Row justify="center" align="middle" style={{ minHeight: "100vh" }}>
        <Alert
          message="Tài khoản đã bị vô hiệu hóa"
          description="Vui lòng liên hệ quản trị viên để được hỗ trợ"
          type="warning"
          showIcon
        />
      </Row>
    );
  }

  // Create user object for ScreenProvider from employee data
  const user = {
    id: employee.employee_id,
    name: employee.full_name,
    permissions: permissions,
  };

  return (
    <ScreenProvider user={user} context={{ employee }}>
      <AppLayout />
    </ScreenProvider>
  );
};

export default AuthenticatedApp;