import React, { useState, useEffect } from "react";
import {
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  App,
  Grid,
} from "antd";
import {
  PlusOutlined,
  UserOutlined,
  SearchOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import {
  getUsers,
  createUserAccount,
  updateUserAccount,
  deleteUserAccount,
} from "@nam-viet-erp/services";
import { UserManagementTable } from "../../components/tables";

const { Title, Text } = Typography;
const { Search } = Input;
const { useBreakpoint } = Grid;

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
  const isMobile = !screens.md;
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
    } catch (error: any) {
      notification.error({
        message: "Lỗi khi tải danh sách tài khoản",
        description: error?.message || "Không thể tải danh sách tài khoản",
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
    } catch (error: any) {
      notification.error({
        message: "Lỗi khi xóa tài khoản",
        description: error?.message || "Không thể xóa tài khoản",
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

  // Statistics
  const totalUsers = users.length;
  const activeUsers = users.length; // All users are active since Supabase Auth doesn't have is_active field

  return (
    <div>
      <Row style={{ marginBottom: 24 }} gutter={[16, 16]}>
        <Col xs={24} md={16}>
          {!isMobile && (
            <Text
              type="secondary"
              style={{ fontSize: 14, display: "block", marginTop: 4 }}
            >
              Quản lý tài khoản đăng nhập và phân quyền cho nhân viên
            </Text>
          )}
        </Col>
        <Col
          xs={24}
          md={8}
          style={{
            textAlign: isMobile ? "left" : "right",
            paddingRight: isMobile ? 56 : undefined,
          }}
        >
          <Button
            type="primary"
            size={isMobile ? "middle" : "large"}
            icon={<PlusOutlined />}
            onClick={() => openModal()}
            block={isMobile}
          >
            Thêm tài khoản
          </Button>
        </Col>
      </Row>

      {/* Search and Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]}>
          <Col xs={24} sm={12} md={10}>
            <Input
              placeholder="Tìm kiếm theo email, tên hoặc số điện thoại..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={loadUsers}
              allowClear
              size="large"
            />
          </Col>
          <Col xs={12} sm={12} md={2}>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={loadUsers}
              block
              size="large"
            >
              Tìm
            </Button>
          </Col>
          <Col xs={12} sm={12} md={2}>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                setSearchText("");
                loadUsers();
              }}
              block
              size="large"
            >
              Mới
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Users Table */}
      <Card>
        <UserManagementTable
          users={users}
          loading={loading}
          onEdit={(user) => openModal(user)}
          onDelete={handleDelete}
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
