import React, { useState, useEffect } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Divider,
  Avatar,
  message,
  App,
} from "antd";
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  SaveOutlined,
  EditOutlined,
} from "@ant-design/icons";
import {
  supabase,
  getCurrentEmployee,
  updateEmployee,
} from "@nam-viet-erp/services";
import { useAuthStore, useEmployeeStore } from "@nam-viet-erp/store";
import PageLayout from "../../components/PageLayout";

const { Title, Text } = Typography;

const UserProfilePage: React.FC = () => {
  const { notification } = App.useApp();
  const user = useAuthStore((state) => state.user);
  const employee = useEmployeeStore((state) => state.employee);
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();

  useEffect(() => {
    if (employee) {
      profileForm.setFieldsValue({
        full_name: employee.full_name,
        email: user?.email || "",
        phone: (employee as any).phone_number || (employee as any).phone || "",
        employee_code: employee.employee_code || "",
      });
    }
  }, [employee, user, profileForm]);

  // Handle update profile
  const handleUpdateProfile = async (values: any) => {
    if (!employee?.employee_id) {
      notification.error({
        message: "Lỗi",
        description:
          "Không tìm thấy thông tin nhân viên. Vui lòng đăng nhập lại.",
      });
      return;
    }

    setLoading(true);
    try {
      // Only update full_name since employees table doesn't have phone column
      // Phone should be stored in profiles table (linked via user_id)
      const updateData: Partial<IEmployee> = {
        full_name: values.full_name,
      };

      const { data, error } = await updateEmployee(
        employee.employee_id,
        updateData,
      );

      if (error) {
        console.error("Update error:", error);
        throw error;
      }

      if (!data) {
        throw new Error("Không nhận được dữ liệu phản hồi từ server");
      }

      notification.success({
        message: "Cập nhật thành công",
        description: "Thông tin cá nhân đã được cập nhật",
      });

      // Refresh employee data
      try {
        const { data: updatedEmployee, error: fetchError } =
          await getCurrentEmployee();
        if (fetchError) {
          console.error("Error fetching updated employee:", fetchError);
        } else if (updatedEmployee) {
          useEmployeeStore.getState().setEmployee(updatedEmployee);
          // Update form with new values
          profileForm.setFieldsValue({
            full_name: updatedEmployee.full_name,
            email: user?.email || "",
            phone:
              (updatedEmployee as any).phone_number ||
              (updatedEmployee as any).phone ||
              "",
            employee_code: updatedEmployee.employee_code || "",
          });
        }
      } catch (fetchErr) {
        console.error("Error refreshing employee data:", fetchErr);
        // Still show success even if refresh fails
      }
    } catch (error: any) {
      console.error("Update profile error:", error);
      notification.error({
        message: "Lỗi cập nhật",
        description:
          error.message || "Không thể cập nhật thông tin. Vui lòng thử lại.",
        duration: 5,
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle change password
  const handleChangePassword = async (values: any) => {
    setPasswordLoading(true);
    try {
      // Supabase allows updating password without current password for authenticated users
      // But we can add verification if needed
      const { error } = await supabase.auth.updateUser({
        password: values.newPassword,
      });

      if (error) {
        throw error;
      }

      notification.success({
        message: "Đổi mật khẩu thành công",
        description:
          "Mật khẩu của bạn đã được thay đổi. Vui lòng đăng nhập lại với mật khẩu mới.",
      });

      passwordForm.resetFields();
    } catch (error: any) {
      notification.error({
        message: "Lỗi đổi mật khẩu",
        description: error.message || "Không thể đổi mật khẩu",
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <PageLayout
      title="Thông Tin Cá Nhân"
      breadcrumbs={[
        { title: "Trang chủ", href: "/", icon: null },
        { title: "Thông tin cá nhân", icon: null },
      ]}
    >
      <Row gutter={[16, 16]}>
        {/* Profile Information */}
        <Col xs={24} lg={14}>
          <Card>
            <Form
              form={profileForm}
              layout="vertical"
              onFinish={handleUpdateProfile}
            >
              <Form.Item
                name="full_name"
                label="Họ và Tên"
                rules={[{ required: true, message: "Vui lòng nhập họ và tên" }]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="Nhập họ và tên"
                  size="large"
                />
              </Form.Item>

              <Form.Item name="employee_code" label="Mã Nhân Viên">
                <Input
                  prefix={<UserOutlined />}
                  placeholder="Mã nhân viên"
                  size="large"
                  disabled
                />
              </Form.Item>

              <Form.Item name="email" label="Email">
                <Input
                  prefix={<MailOutlined />}
                  placeholder="Email"
                  size="large"
                  disabled
                />
              </Form.Item>
              <Form.Item>
                <Text type="secondary" style={{ fontSize: 12, marginTop: -16 }}>
                  Email không thể thay đổi. Vui lòng liên hệ quản trị viên nếu
                  cần thay đổi.
                </Text>
              </Form.Item>

              <Form.Item name="phone" label="Số Điện Thoại">
                <Input
                  prefix={<PhoneOutlined />}
                  placeholder="Nhập số điện thoại (thông tin này được lưu trong bảng profiles)"
                  size="large"
                  disabled
                />
              </Form.Item>
              <Form.Item>
                <Text type="secondary" style={{ fontSize: 12, marginTop: -16 }}>
                  Số điện thoại hiện tại được lưu trong bảng profiles. Vui lòng
                  liên hệ quản trị viên để cập nhật.
                </Text>
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  loading={loading}
                  size="large"
                  block
                >
                  Lưu Thông Tin
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        {/* Change Password */}
        <Col xs={24} lg={10}>
          <Card
            title={
              <Space>
                <LockOutlined />
                <span>Đổi Mật Khẩu</span>
              </Space>
            }
          >
            <Form
              form={passwordForm}
              layout="vertical"
              onFinish={handleChangePassword}
            >
              <Form.Item
                name="newPassword"
                label="Mật Khẩu Mới"
                rules={[
                  { required: true, message: "Vui lòng nhập mật khẩu mới" },
                  { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự" },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Nhập mật khẩu mới"
                  size="large"
                />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                label="Xác Nhận Mật Khẩu Mới"
                dependencies={["newPassword"]}
                rules={[
                  { required: true, message: "Vui lòng xác nhận mật khẩu mới" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue("newPassword") === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(
                        new Error("Mật khẩu xác nhận không khớp"),
                      );
                    },
                  }),
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Nhập lại mật khẩu mới"
                  size="large"
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<LockOutlined />}
                  loading={passwordLoading}
                  size="large"
                  block
                  danger
                >
                  Đổi Mật Khẩu
                </Button>
              </Form.Item>
            </Form>
          </Card>

          {/* Account Info */}
          <Card title="Thông Tin Tài Khoản" style={{ marginTop: 16 }}>
            <Space direction="vertical" style={{ width: "100%" }} size="middle">
              <div>
                <Text type="secondary">Mã nhân viên: </Text>
                <Text strong>{employee?.employee_code || "N/A"}</Text>
              </div>
              <div>
                <Text type="secondary">Chức vụ: </Text>
                <Text strong>{employee?.role_name || "N/A"}</Text>
              </div>
              <div>
                <Text type="secondary">Email đăng nhập: </Text>
                <Text strong>{user?.email || "N/A"}</Text>
              </div>
              <div>
                <Text type="secondary">Ngày tạo tài khoản: </Text>
                <Text>
                  {(user as any)?.created_at
                    ? new Date((user as any).created_at).toLocaleDateString(
                        "vi-VN",
                      )
                    : "N/A"}
                </Text>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </PageLayout>
  );
};

export default UserProfilePage;
