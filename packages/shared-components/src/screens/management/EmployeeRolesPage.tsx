/**
 * Employee Roles Page
 *
 * Page quản lý vai trò nhân viên (khác với permission roles)
 */

import React from "react";
import { Typography } from "antd";
import RoleManagementTab from "../../components/roles/RoleManagementTab";

const { Title, Text } = Typography;

const EmployeeRolesPage: React.FC = () => {
  return (
    <div style={{ padding: "0 12px 12px" }}>
      {/* Page Header */}
      <div style={{ marginBottom: 16 }}>
        <Title level={2} style={{ marginBottom: 8 }}>
          Quản lý Người dùng & Phân quyền
        </Title>
        <Text type="secondary">
          Quản lý các vai trò nhân viên trong hệ thống. Bạn có thể tạo các vai
          trò tùy chỉnh như thực tập sinh, nhân viên cao cấp, v.v.
        </Text>
      </div>

      {/* Role Management Tab */}
      <RoleManagementTab />
    </div>
  );
};

export default EmployeeRolesPage;
