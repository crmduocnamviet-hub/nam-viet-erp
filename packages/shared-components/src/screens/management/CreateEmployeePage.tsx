import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
} from "antd";
import { ArrowLeftOutlined, UserAddOutlined } from "@ant-design/icons";
import PageLayout from "../../components/PageLayout";
import PermissionPicker from "../../components/PermissionPicker";
import {
  createEmployee,
  updateEmployee,
  searchUsersForLinking,
} from "@nam-viet-erp/services";

const { Text } = Typography;

interface EmployeeFormData {
  full_name: string;
  employee_code: string;
  role_name: string;
  is_active: boolean;
  user_id?: string;
  permissions?: string[];
}

const CreateEmployeePage: React.FC = () => {
  const navigate = useNavigate();
  const { notification } = App.useApp();
  const [form] = Form.useForm();
  const [creating, setCreating] = useState(false);
  const [userSearchResults, setUserSearchResults] = useState<IUserAccount[]>(
    [],
  );
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState("");

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

  const handleCreateEmployee = async (values: EmployeeFormData) => {
    setCreating(true);
    try {
      // Remove user_id from employee creation data
      const { user_id, permissions, ...employeeData } = values;

      const employeeDataWithPermissions = {
        ...employeeData,
        permissions: permissions || [],
      };

      const { data: newEmployee, error } = await createEmployee(
        employeeDataWithPermissions,
      );
      if (error) {
        notification.error({
          message: "Lỗi tạo nhân viên",
          description: error.message,
        });
        return;
      }

      // Link user if selected
      if (user_id && newEmployee?.employee_id) {
        try {
          await updateEmployee(newEmployee.employee_id, {
            user_id: user_id || null,
          });
        } catch (linkError) {
          console.error("Error linking user:", linkError);
          notification.warning({
            message: "Nhân viên đã tạo",
            description:
              "Nhân viên được tạo thành công nhưng không thể liên kết tài khoản. Vui lòng thử liên kết lại sau.",
          });
        }
      }

      notification.success({
        message: "Tạo nhân viên thành công!",
        description: `Đã tạo nhân viên ${values.full_name}`,
      });

      // Navigate back to employees list
      navigate("/employees");
    } catch (error) {
      notification.error({
        message: "Lỗi hệ thống",
        description: "Không thể tạo nhân viên mới",
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <PageLayout
      title="Thêm Nhân Viên Mới"
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
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateEmployee}
          initialValues={{ is_active: true }}
        >
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
                initialValue={[]}
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
                  icon={<UserAddOutlined />}
                  loading={creating}
                >
                  Tạo Nhân Viên
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>
    </PageLayout>
  );
};

const CreateEmployeePageWrapper: React.FC = () => (
  <App>
    <CreateEmployeePage />
  </App>
);

export default CreateEmployeePageWrapper;
