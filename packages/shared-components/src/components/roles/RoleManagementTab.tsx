/**
 * Role Management Tab
 *
 * Tab hiển thị và quản lý các vai trò nhân viên
 */

import React, { useState, useEffect } from "react";
import {
  Table,
  Card,
  Button,
  Space,
  Tag,
  Popconfirm,
  App,
  Empty,
  Typography,
  Switch,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  LockOutlined,
  UnlockOutlined,
  CopyOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { EmployeeRole } from "../../types/employeeRole";
import {
  getEmployeeRoles,
  deleteEmployeeRole,
  toggleEmployeeRoleStatus,
} from "@nam-viet-erp/services";
import EmployeeRoleFormModal from "./EmployeeRoleFormModal";

const { Title, Text } = Typography;

const RoleManagementTab: React.FC = () => {
  const { message: messageApi } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<EmployeeRole[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRole, setSelectedRole] = useState<EmployeeRole | null>(null);

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    setLoading(true);
    try {
      const { data, error } = await getEmployeeRoles();

      if (error) {
        messageApi.error("Không thể tải vai trò: " + error.message);
        return;
      }

      setRoles(data || []);
    } catch (error) {
      console.error("Error loading roles:", error);
      messageApi.error("Có lỗi xảy ra khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedRole(null);
    setModalVisible(true);
  };

  const handleEdit = (record: EmployeeRole) => {
    setSelectedRole(record);
    setModalVisible(true);
  };

  const handleDuplicate = (record: EmployeeRole) => {
    // Create a duplicate role with modified key and name
    const generateUniqueKey = (baseKey: string): string => {
      const existingKeys = roles.map((r) => r.role_key);
      let counter = 2;
      let newKey = `${baseKey}-${counter}`;

      while (existingKeys.includes(newKey)) {
        counter++;
        newKey = `${baseKey}-${counter}`;
      }

      return newKey;
    };

    const duplicatedRole: Partial<EmployeeRole> = {
      role_key: generateUniqueKey(record.role_key),
      role_name: `${record.role_name} (Bản sao)`,
      description: record.description,
      is_system: false, // Duplicated roles are always custom roles
      is_active: true,
      display_order: record.display_order,
    };

    // Open modal with pre-filled data but no ID (so it creates a new role)
    setSelectedRole(duplicatedRole as EmployeeRole);
    setModalVisible(true);
  };

  const handleDelete = async (record: EmployeeRole) => {
    try {
      const { error } = await deleteEmployeeRole(record.id);

      if (error) {
        messageApi.error("Không thể xóa vai trò: " + error.message);
        return;
      }

      messageApi.success(`Đã xóa vai trò "${record.role_name}"`);
      loadRoles();
    } catch (error) {
      console.error("Error deleting role:", error);
      messageApi.error("Có lỗi xảy ra khi xóa vai trò");
    }
  };

  const handleToggleStatus = async (record: EmployeeRole) => {
    try {
      const { error } = await toggleEmployeeRoleStatus(record.id);

      if (error) {
        messageApi.error("Không thể thay đổi trạng thái: " + error.message);
        return;
      }

      const newStatus = !record.is_active;
      messageApi.success(
        `Đã ${newStatus ? "kích hoạt" : "tạm dừng"} vai trò "${record.role_name}"`,
      );
      loadRoles();
    } catch (error) {
      console.error("Error toggling status:", error);
      messageApi.error("Có lỗi xảy ra");
    }
  };

  const handleModalClose = (saved: boolean) => {
    setModalVisible(false);
    setSelectedRole(null);

    if (saved) {
      loadRoles();
    }
  };

  const columns: ColumnsType<EmployeeRole> = [
    {
      title: "Mã vai trò",
      dataIndex: "role_key",
      key: "role_key",
      width: 200,
      render: (text: string, record) => (
        <Space>
          <code style={{ color: "#1890ff" }}>{text}</code>
          {record.is_system && (
            <Tooltip title="Vai trò hệ thống">
              <Tag color="gold" icon={<LockOutlined />}>
                System
              </Tag>
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: "Tên vai trò",
      dataIndex: "role_name",
      key: "role_name",
      width: 250,
      render: (text: string, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text}</Text>
          {record.description && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.description}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: "Thứ tự",
      dataIndex: "display_order",
      key: "display_order",
      width: 100,
      align: "center",
      render: (order: number) => <Tag>{order}</Tag>,
    },
    {
      title: "Trạng thái",
      dataIndex: "is_active",
      key: "is_active",
      width: 120,
      align: "center",
      render: (isActive: boolean, record) => (
        <Switch
          checked={isActive}
          onChange={() => handleToggleStatus(record)}
          checkedChildren="Hoạt động"
          unCheckedChildren="Tạm dừng"
        />
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 200,
      fixed: "right",
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Sửa
          </Button>
          <Tooltip title="Sao chép vai trò này để tạo vai trò mới">
            <Button
              type="link"
              size="small"
              icon={<CopyOutlined />}
              onClick={() => handleDuplicate(record)}
            >
              Sao chép
            </Button>
          </Tooltip>
          {!record.is_system && (
            <Popconfirm
              title="Xóa vai trò"
              description={
                <div>
                  <p>Bạn có chắc chắn muốn xóa vai trò</p>
                  <p>
                    <strong>"{record.role_name}"</strong>?
                  </p>
                  <p style={{ color: "#ff4d4f", marginTop: 8 }}>
                    Lưu ý: Các nhân viên đang có vai trò này sẽ bị ảnh hưởng.
                  </p>
                </div>
              }
              onConfirm={() => handleDelete(record)}
              okText="Xóa"
              cancelText="Hủy"
              okButtonProps={{ danger: true }}
            >
              <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                Xóa
              </Button>
            </Popconfirm>
          )}
          {record.is_system && (
            <Tooltip title="Không thể xóa vai trò hệ thống">
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
                disabled
              >
                Xóa
              </Button>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  const systemRoles = roles.filter((r) => r.is_system);
  const customRoles = roles.filter((r) => !r.is_system);

  return (
    <div>
      <Card>
        <Space
          style={{
            width: "100%",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <div>
            <Title level={4} style={{ margin: 0 }}>
              Quản lý vai trò
            </Title>
            <Text type="secondary">
              Quản lý các vai trò nhân viên trong hệ thống
            </Text>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Thêm vai trò
          </Button>
        </Space>

        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          {/* System Roles */}
          <div>
            <Title level={5}>
              <LockOutlined /> Vai trò hệ thống ({systemRoles.length})
            </Title>
            <Table
              columns={columns}
              dataSource={systemRoles}
              loading={loading}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </div>

          {/* Custom Roles */}
          <div>
            <Title level={5}>
              <UnlockOutlined /> Vai trò tùy chỉnh ({customRoles.length})
            </Title>
            <Table
              columns={columns}
              dataSource={customRoles}
              loading={loading}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `Tổng ${total} vai trò`,
              }}
              locale={{
                emptyText: (
                  <Empty
                    description="Chưa có vai trò tùy chỉnh nào"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  >
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={handleCreate}
                    >
                      Tạo vai trò đầu tiên
                    </Button>
                  </Empty>
                ),
              }}
              size="small"
            />
          </div>
        </Space>
      </Card>

      <EmployeeRoleFormModal
        visible={modalVisible}
        employeeRole={selectedRole}
        onClose={handleModalClose}
      />
    </div>
  );
};

export default RoleManagementTab;
