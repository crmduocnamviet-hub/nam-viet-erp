import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  message,
  Popconfirm,
  Tag,
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Tooltip,
  Badge,
  App,
  Grid,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  EyeOutlined,
  KeyOutlined,
  LinkOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import {
  getUsers,
  createUserAccount,
  updateUserAccount,
  deleteUserAccount,
} from "@nam-viet-erp/services";
import { COMMON_SPACING, getResponsivePadding } from "../../constants/spacing";

const { Title, Text } = Typography;
const { Search } = Input;
const { useBreakpoint } = Grid;

interface IUserAccount {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  avatar_url?: string;
  created_at: string;
  updated_at?: string;
  last_sign_in_at?: string;
  is_active: boolean;
  role?: string;
  employee_id?: string;
}

interface UserFormData {
  email: string;
  password: string;
  full_name?: string;
  phone?: string;
  role?: string;
  employee_id?: string;
  is_active: boolean;
}

const UserManagementPageContent: React.FC = () => {
  const { notification } = App.useApp();
  const screens = useBreakpoint();
  const [users, setUsers] = useState<IUserAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<IUserAccount | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState("");

  // Load users data
  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await getUsers({
        search: searchText,
      });

      if (error) {
        notification.error({
          message: "Lỗi khi tải danh sách tài khoản",
          description: error.message || "Không thể tải danh sách tài khoản",
        });
        return;
      }

      setUsers(data || []);
    } catch (error) {
      notification.error({
        message: "Lỗi khi tải danh sách tài khoản",
        description: error.message || "Không thể tải danh sách tài khoản",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [searchText]);

  // Handle create/edit user
  const handleSubmit = async (values: UserFormData) => {
    try {
      if (editingUser) {
        // Update existing user
        const updateData = {
          ...values,
          password: values.password || undefined, // Don't update password if empty
        };
        delete updateData.password; // Remove password from update if empty

        const { error } = await updateUserAccount(editingUser.id, updateData);
        if (error) {
          notification.error({
            message: "Lỗi cập nhật tài khoản",
            description: error.message || "Không thể cập nhật tài khoản",
          });
          return;
        }
        notification.success({
          message: "Cập nhật tài khoản thành công",
          description: "Thông tin tài khoản đã được cập nhật",
        });
      } else {
        // Create new user
        const { error } = await createUserAccount(values);
        if (error) {
          notification.error({
            message: "Lỗi khi tạo tài khoản",
            description: error.message || "Không thể tạo tài khoản",
          });
          return;
        }
        notification.success({
          message: "Tạo tài khoản thành công",
          description: "Tài khoản mới đã được tạo",
        });
      }

      setModalVisible(false);
      setEditingUser(null);
      form.resetFields();
      loadUsers();
    } catch (error: any) {
      notification.error({
        message: "Lỗi xử lý",
        description: error?.message || "Lỗi khi xử lý tài khoản",
      });
    }
  };

  // Handle delete user
  const handleDelete = async (userId: string) => {
    try {
      const { error } = await deleteUserAccount(userId);
      if (error) {
        notification.error({
          message: "Lỗi khi xóa tài khoản",
          description: error.message || "Không thể xóa tài khoản",
        });
        return;
      }
      notification.success({
        message: "Xóa tài khoản thành công",
        description: "Tài khoản đã được xóa",
      });
      loadUsers();
    } catch (error) {
      notification.error({
        message: "Lỗi khi xóa tài khoản",
        description: error.message || "Không thể xóa tài khoản",
      });
    }
  };

  // Open modal for create/edit
  const openModal = (user?: IUserAccount) => {
    setEditingUser(user || null);
    if (user) {
      form.setFieldsValue({
        ...user,
        password: "", // Don't show password
      });
    } else {
      form.resetFields();
    }
    setModalVisible(true);
  };

  // Table columns
  const columns: ColumnsType<IUserAccount> = [
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      width: 200,
      render: (email: string) => (
        <Space>
          <MailOutlined />
          <Text copyable={{ text: email }}>{email}</Text>
        </Space>
      ),
    },
    {
      title: "Họ tên",
      dataIndex: "full_name",
      key: "full_name",
      width: 150,
      render: (name: string) => (
        <Space>
          <UserOutlined />
          {name || "Chưa cập nhật"}
        </Space>
      ),
    },
    {
      title: "Số điện thoại",
      dataIndex: "phone",
      key: "phone",
      width: 120,
      render: (phone: string) =>
        phone ? (
          <Space>
            <PhoneOutlined />
            {phone}
          </Space>
        ) : (
          "Chưa cập nhật"
        ),
    },
    {
      title: "Lần đăng nhập cuối",
      dataIndex: "last_sign_in_at",
      key: "last_sign_in_at",
      width: 150,
      render: (date: string) =>
        date ? new Date(date).toLocaleString("vi-VN") : "Chưa đăng nhập",
    },
    {
      title: "Hành động",
      key: "actions",
      width: 100,
      fixed: "right" as const,
      render: (_, record: IUserAccount) => (
        <Space size="small">
          <Tooltip title="Sửa">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                openModal(record);
              }}
            />
          </Tooltip>
          <Popconfirm
            title="Xóa tài khoản?"
            description={`Bạn có chắc chắn muốn xóa tài khoản "${record.email}"?`}
            onConfirm={(e) => {
              e?.stopPropagation();
              handleDelete(record.id);
            }}
            onCancel={(e) => {
              e?.stopPropagation();
            }}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Xóa">
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={(e) => e.stopPropagation()}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Statistics
  const totalUsers = users.length;
  const activeUsers = users.length; // All users are active since Supabase Auth doesn't have is_active field

  return (
    <div style={{ padding: getResponsivePadding(screens) }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>Quản lý Tài khoản Người dùng</Title>
        <Text type="secondary">
          Quản lý tài khoản đăng nhập và phân quyền cho nhân viên
        </Text>
      </div>

      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Tổng số tài khoản"
              value={totalUsers}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Tài khoản hoạt động"
              value={activeUsers}
              valueStyle={{ color: "#3f8600" }}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Search and Actions */}
      <Card style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Search
              placeholder="Tìm kiếm theo email, tên hoặc số điện thoại..."
              allowClear
              style={{ width: 400 }}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onSearch={loadUsers}
            />
          </Col>
          <Col>
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => openModal()}
              >
                Thêm tài khoản
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Users Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          onRow={(record) => ({
            onClick: () => openModal(record),
            style: { cursor: "pointer" },
          })}
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} tài khoản`,
          }}
          locale={{
            emptyText: (
              <div style={{ padding: "40px 0", textAlign: "center" }}>
                <UserOutlined
                  style={{
                    fontSize: "48px",
                    color: "#d9d9d9",
                    marginBottom: "16px",
                  }}
                />
                <div
                  style={{
                    fontSize: "16px",
                    color: "#666",
                    marginBottom: "8px",
                  }}
                >
                  Chưa có tài khoản nào
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    color: "#999",
                    marginBottom: "24px",
                  }}
                >
                  Tạo tài khoản đầu tiên để bắt đầu quản lý
                </div>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => openModal()}
                  size="large"
                >
                  Tạo tài khoản đầu tiên
                </Button>
              </div>
            ),
          }}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={editingUser ? "Chỉnh sửa tài khoản" : "Thêm tài khoản mới"}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingUser(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ is_active: true }}
        >
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Vui lòng nhập email" },
              { type: "email", message: "Email không hợp lệ" },
            ]}
          >
            <Input placeholder="Nhập email" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Mật khẩu"
            rules={[
              ...(editingUser
                ? []
                : [{ required: true, message: "Vui lòng nhập mật khẩu" }]),
              { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự" },
            ]}
          >
            <Input.Password
              placeholder={
                editingUser
                  ? "Để trống nếu không muốn thay đổi"
                  : "Nhập mật khẩu"
              }
            />
          </Form.Item>

          <Form.Item name="full_name" label="Họ tên">
            <Input placeholder="Nhập họ tên" />
          </Form.Item>

          <Form.Item name="phone" label="Số điện thoại">
            <Input placeholder="Nhập số điện thoại" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingUser ? "Cập nhật" : "Tạo tài khoản"}
              </Button>
              <Button onClick={() => setModalVisible(false)}>Hủy</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

const UserManagementPage: React.FC = () => (
  <App>
    <UserManagementPageContent />
  </App>
);

export default UserManagementPage;
