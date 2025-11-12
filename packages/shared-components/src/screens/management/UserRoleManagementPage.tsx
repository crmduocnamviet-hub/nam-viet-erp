/**
 * User & Role Management Page
 *
 * Trang quản lý người dùng và phân quyền
 * 2 tabs: Quản lý vai trò (Permission Roles) và Quản lý nhân viên
 */

import React from "react";
import { Tabs, Typography } from "antd";
import { SafetyOutlined, TeamOutlined } from "@ant-design/icons";
import RoleManagementPage from "./RoleManagementPage";
import EmployeeManagementPage from "./EmployeeManagementPage";

const { Title, Text } = Typography;

const UserRoleManagementPage: React.FC = () => {
  const items = [
    {
      key: "roles",
      label: (
        <span>
          <SafetyOutlined />
          Quản lý Vai trò
        </span>
      ),
      children: <RoleManagementPage />,
    },
    {
      key: "employees",
      label: (
        <span>
          <TeamOutlined />
          Quản lý Nhân viên
        </span>
      ),
      children: <EmployeeManagementPage />,
    },
  ];

  return (
    <div style={{ padding: "0 12px 12px" }}>
      <div style={{ marginBottom: 16 }}>
        <Title level={2} style={{ marginBottom: 8 }}>
          Quản lý Người dùng & Phân quyền
        </Title>
        <Text type="secondary">
          Quản lý vai trò hệ thống, thông tin nhân viên và phân quyền truy cập
        </Text>
      </div>

      <Tabs defaultActiveKey="roles" items={items} size="large" />
    </div>
  );
};

export default UserRoleManagementPage;
