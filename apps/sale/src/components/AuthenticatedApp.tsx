import React from "react";
import { Spin, Row, Alert } from "antd";
import { useEmployee, useEmployeeStore } from "@nam-viet-erp/store";
import PermissionBasedAppLayout from "./PermissionBasedAppLayout";

const AuthenticatedApp: React.FC = () => {
  const employee = useEmployee();
  const isLoading = useEmployeeStore((state) => state.isLoading);

  if (isLoading) {
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

  return <PermissionBasedAppLayout />;
};

export default AuthenticatedApp;