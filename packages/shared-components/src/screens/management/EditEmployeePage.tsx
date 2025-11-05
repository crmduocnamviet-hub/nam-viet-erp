import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Card,
  Button,
  Space,
  Typography,
  App,
  Row,
  Col,
  Form,
  Select,
  Input,
  Divider,
  Spin,
  Alert,
} from "antd";
import {
  ArrowLeftOutlined,
  SaveOutlined,
  EditOutlined,
} from "@ant-design/icons";
import PageLayout from "../../components/PageLayout";
import PermissionPicker from "../../components/PermissionPicker";
import {
  getEmployeeById,
  updateEmployee,
  searchUsersForLinking,
} from "@nam-viet-erp/services";

const EditEmployeePage: React.FC = () => {
  const navigate = useNavigate();
  const { employeeId } = useParams<{ employeeId: string }>();
  const { notification } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [employee, setEmployee] = useState<IEmployee | null>(null);
  const [userSearchResults, setUserSearchResults] = useState<IUserAccount[]>(
    [],
  );
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState("");

  // Load employee data
  useEffect(() => {
    if (employeeId) {
      loadEmployee();
    }
  }, [employeeId]);

  const loadEmployee = async () => {
    if (!employeeId) return;

    setLoading(true);
    try {
      const { data, error } = await getEmployeeById(employeeId);

      if (error) {
        notification.error({
          message: "Lỗi tải dữ liệu",
          description: error.message,
        });
        navigate("/employees");
        return;
      }

      if (!data) {
        notification.error({
          message: "Không tìm thấy nhân viên",
          description: "Nhân viên không tồn tại trong hệ thống",
        });
        navigate("/employees");
        return;
      }

      setEmployee(data);
      form.setFieldsValue({
        full_name: data.full_name,
        employee_code: data.employee_code,
        role_name: data.role_name,
        is_active: data.is_active,
        user_id: data.user_id,
        permissions: data.permissions || [],
      });
    } catch (error) {
      notification.error({
        message: "Lỗi hệ thống",
        description: "Không thể tải thông tin nhân viên",
      });
      navigate("/employees");
    } finally {
      setLoading(false);
    }
  };

  // Search users for linking
  const searchUsers = async (searchTerm: string) => {
    setUserSearchLoading(true);
    try {
      const { data, error } = await searchUsersForLinking(searchTerm);
      if (error) {
        console.error("Error searching users:", error);
        notification.error({
          message: "Lỗi tìm kiếm tài khoản",
          description: error.message,
        });
      } else {
        setUserSearchResults(data || []);
      }
    } catch (error) {
      console.error("Exception searching users:", error);
      notification.error({
        message: "Lỗi hệ thống",
        description: "Không thể tìm kiếm tài khoản",
      });
    } finally {
      setUserSearchLoading(false);
    }
  };

  // Handle user search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchUsers(userSearchTerm);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [userSearchTerm]);

  // Load users initially
  useEffect(() => {
    searchUsers("");
  }, []);

  const handleUpdateEmployee = async (values: IEmployee) => {
    if (!employee || !employeeId) return;

    setUpdating(true);
    try {
      const { user_id, permissions, ...employeeData } = values;

      // Convert undefined to null for Supabase
      const updateData = {
        ...employeeData,
        user_id: user_id || null,
        permissions: permissions || [],
      };

      const { error } = await updateEmployee(employeeId, updateData);

      if (error) {
        notification.error({
          message: "Lỗi cập nhật nhân viên",
          description: error.message,
        });
        return;
      }

      notification.success({
        message: "Cập nhật nhân viên thành công!",
        description: `Đã cập nhật thông tin ${values.full_name}`,
      });

      // Navigate back to employees list
      navigate("/employees");
    } catch (error) {
      notification.error({
        message: "Lỗi hệ thống",
        description: "Không thể cập nhật nhân viên",
      });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <PageLayout title="Chỉnh Sửa Nhân Viên">
        <Card>
          <div style={{ textAlign: "center", padding: "40px" }}>
            <Spin size="large" tip="Đang tải thông tin nhân viên..." />
          </div>
        </Card>
      </PageLayout>
    );
  }

  if (!employee) {
    return (
      <PageLayout title="Chỉnh Sửa Nhân Viên">
        <Card>
          <Alert
            message="Không tìm thấy nhân viên"
            description="Nhân viên không tồn tại trong hệ thống"
            type="error"
            showIcon
          />
        </Card>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title={`Chỉnh Sửa Nhân Viên: ${employee.full_name}`}
      extra={
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/employees")}
          size="large"
        >
          Quay Lại
        </Button>
      }
    >
      <Card>
        <Form form={form} layout="vertical" onFinish={handleUpdateEmployee}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="full_name"
                label="Họ và tên"
                rules={[{ required: true, message: "Vui lòng nhập họ và tên" }]}
              >
                <Input placeholder="Nhập họ và tên" size="large" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="employee_code"
                label="Mã nhân viên"
                rules={[
                  { required: true, message: "Vui lòng nhập mã nhân viên" },
                  {
                    pattern: /^[A-Z0-9]+$/,
                    message: "Mã nhân viên chỉ chứa chữ hoa và số",
                  },
                ]}
              >
                <Input placeholder="VD: DOC001, PHAR001" size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="role_name"
                label="Vai trò"
                rules={[{ required: true, message: "Vui lòng chọn vai trò" }]}
              >
                <Select placeholder="Chọn vai trò" size="large">
                  <Select.Option value="inventory-staff">
                    📦 Nhân Viên Kho
                  </Select.Option>
                  <Select.Option value="medical-staff">
                    🏥 Nhân Viên Y Tế
                  </Select.Option>
                  <Select.Option value="delivery-staff">
                    🚚 Nhân Viên Giao Hàng
                  </Select.Option>
                  <Select.Option value="sales-staff">
                    💼 Nhân Viên Kinh Doanh
                  </Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="is_active" label="Trạng thái">
                <Select size="large">
                  <Select.Option value={true}>Hoạt động</Select.Option>
                  <Select.Option value={false}>Không hoạt động</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {/* User Account Linking Section */}
          <Divider orientation="left">Liên kết tài khoản đăng nhập</Divider>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="user_id"
                label="Tài khoản đăng nhập"
                help="Tùy chọn - Liên kết nhân viên với tài khoản để đăng nhập vào hệ thống"
              >
                <Select
                  placeholder="Chọn tài khoản để liên kết (tùy chọn)"
                  allowClear
                  showSearch
                  size="large"
                  loading={userSearchLoading}
                  notFoundContent={
                    userSearchLoading
                      ? "Đang tìm kiếm..."
                      : "Không tìm thấy tài khoản"
                  }
                  onSearch={setUserSearchTerm}
                  filterOption={false}
                  options={userSearchResults.map((user) => ({
                    value: user.id,
                    label: `${user.email} - ${user.full_name || "Chưa có tên"}`,
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Permissions Section */}
          <Divider orientation="left">Phân quyền hệ thống</Divider>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="permissions"
                label="Quyền truy cập"
                help="Chọn các quyền truy cập cho nhân viên này"
              >
                <PermissionPicker />
              </Form.Item>
            </Col>
          </Row>

          <Row>
            <Col span={24} style={{ textAlign: "right" }}>
              <Space>
                <Button size="large" onClick={() => navigate("/employees")}>
                  Hủy
                </Button>
                <Button
                  type="primary"
                  size="large"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  loading={updating}
                >
                  Lưu Thay Đổi
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>
    </PageLayout>
  );
};

const EditEmployeePageWrapper: React.FC = () => (
  <App>
    <EditEmployeePage />
  </App>
);

export default EditEmployeePageWrapper;
