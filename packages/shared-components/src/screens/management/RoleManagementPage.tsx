import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Space,
  Tag,
  Typography,
  Popconfirm,
  message,
  Input,
  Card,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { Role, SYSTEM_ROLES } from "../../types/role";
import { ROLE_PERMISSIONS, PERMISSIONS } from "../index";
import RoleFormModal from "../../components/RoleFormModal";

const { Title, Text } = Typography;

// Convert ROLE_PERMISSIONS to Role format
const getRolesFromConfig = (): Role[] => {
  return Object.entries(ROLE_PERMISSIONS).map(([key, permissions]) => ({
    id: key,
    key: key,
    title: getRoleTitleFromKey(key),
    description: `Vai trò ${getRoleTitleFromKey(key)}`,
    permissions: permissions as string[],
    is_system_role: SYSTEM_ROLES.includes(key as any),
  }));
};

// Helper to get Vietnamese title from role key
const getRoleTitleFromKey = (key: string): string => {
  const titleMap: Record<string, string> = {
    "super-admin": "Quản trị viên cấp cao",
    admin: "Quản trị viên",
    "sales-manager": "Quản lý Bán hàng",
    "medical-staff": "Nhân viên Y tế",
    "inventory-manager": "Quản lý Kho",
    "inventory-staff": "Nhân viên Kho",
    "warehouse-manager": "Quản lý Kho vận",
    "warehouse-staff": "Nhân viên Kho vận",
    "delivery-staff": "Nhân viên Giao hàng",
    "sales-staff": "Nhân viên Bán hàng",
    "marketing-manager": "Quản lý Marketing",
    accountant: "Kế toán",
  };
  return titleMap[key] || key;
};

const RoleManagementPage: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [filteredRoles, setFilteredRoles] = useState<Role[]>([]);
  const [searchText, setSearchText] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRoles();
  }, []);

  useEffect(() => {
    // Filter roles based on search text
    if (searchText) {
      const filtered = roles.filter(
        (role) =>
          role.title.toLowerCase().includes(searchText.toLowerCase()) ||
          role.key.toLowerCase().includes(searchText.toLowerCase()) ||
          role.description?.toLowerCase().includes(searchText.toLowerCase()),
      );
      setFilteredRoles(filtered);
    } else {
      setFilteredRoles(roles);
    }
  }, [searchText, roles]);

  const loadRoles = () => {
    setLoading(true);
    try {
      // Load from configuration
      const rolesData = getRolesFromConfig();
      setRoles(rolesData);
      setFilteredRoles(rolesData);
    } catch (error) {
      message.error("Không thể tải danh sách vai trò");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingRole(null);
    setModalVisible(true);
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setModalVisible(true);
  };

  const handleDelete = async (role: Role) => {
    if (role.is_system_role) {
      message.error("Không thể xóa vai trò hệ thống");
      return;
    }

    try {
      // TODO: Implement API call to delete role
      message.success(`Đã xóa vai trò "${role.title}"`);
      loadRoles();
    } catch (error) {
      message.error("Không thể xóa vai trò");
    }
  };

  const handleModalClose = (saved: boolean) => {
    setModalVisible(false);
    setEditingRole(null);
    if (saved) {
      loadRoles();
    }
  };

  const columns: ColumnsType<Role> = [
    {
      title: "Mã vai trò",
      dataIndex: "key",
      key: "key",
      width: 200,
      render: (key: string, record: Role) => (
        <Space>
          <code>{key}</code>
          {record.is_system_role && <Tag color="blue">Hệ thống</Tag>}
        </Space>
      ),
    },
    {
      title: "Tên vai trò",
      dataIndex: "title",
      key: "title",
      width: 250,
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
    },
    {
      title: "Số quyền",
      dataIndex: "permissions",
      key: "permissions",
      width: 120,
      align: "center",
      render: (permissions: string[]) => (
        <Tag color="green">{permissions.length} quyền</Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 150,
      align: "center",
      render: (_, record: Role) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          >
            Sửa
          </Button>
          {!record.is_system_role && (
            <Popconfirm
              title="Xác nhận xóa"
              description={`Bạn có chắc muốn xóa vai trò "${record.title}"?`}
              onConfirm={() => handleDelete(record)}
              okText="Xóa"
              cancelText="Hủy"
              okButtonProps={{ danger: true }}
            >
              <Button type="link" danger icon={<DeleteOutlined />} size="small">
                Xóa
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Space
          style={{
            width: "100%",
            justifyContent: "space-between",
            flexWrap: "wrap",
          }}
        >
          <div>
            <Title level={3} style={{ margin: 0 }}>
              Quản lý Vai trò
            </Title>
            <Text type="secondary">
              Quản lý vai trò và phân quyền cho người dùng trong hệ thống
            </Text>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Thêm vai trò mới
          </Button>
        </Space>
      </div>

      <Card>
        <div style={{ marginBottom: 16 }}>
          <Input
            placeholder="Tìm kiếm theo tên, mã hoặc mô tả..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            style={{ width: 300 }}
          />
        </div>

        <Table
          columns={columns}
          dataSource={filteredRoles}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Tổng số ${total} vai trò`,
          }}
        />
      </Card>

      <RoleFormModal
        visible={modalVisible}
        role={editingRole}
        onClose={handleModalClose}
      />
    </div>
  );
};

export default RoleManagementPage;
