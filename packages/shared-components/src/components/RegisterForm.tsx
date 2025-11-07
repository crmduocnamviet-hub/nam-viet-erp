import React, { useState, ReactNode } from "react";
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  Row,
  Col,
  App as AntApp,
} from "antd";
import { Link } from "react-router-dom";
import { supabase } from "@nam-viet-erp/services";

const { Title, Text } = Typography;

export interface RegisterFormProps {
  /**
   * Logo URL or component
   */
  logo?: string | ReactNode;

  /**
   * Application name
   */
  appName?: string;

  /**
   * On register success callback
   */
  onRegisterSuccess?: () => void;

  /**
   * Login page path
   */
  loginPath?: string;
}

const RegisterFormContent: React.FC<RegisterFormProps> = ({
  logo,
  appName = "Nam Việt ERP",
  onRegisterSuccess,
  loginPath = "/login",
}) => {
  const [loading, setLoading] = useState(false);
  const { notification } = AntApp.useApp();
  const [form] = Form.useForm();

  const handleRegister = async (values: any) => {
    setLoading(true);
    try {
      // Step 1: Sign up with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            full_name: values.fullName,
            phone: values.phone,
          },
        },
      });

      if (error) throw error;

      // Step 2: Show success message
      notification.success({
        message: "Đăng ký thành công!",
        description:
          "Vui lòng kiểm tra email của bạn để xác nhận tài khoản trước khi đăng nhập.",
        duration: 10,
      });

      // Reset form
      form.resetFields();

      // Call success callback if provided
      if (onRegisterSuccess) {
        onRegisterSuccess();
      }
    } catch (error: any) {
      notification.error({
        message: "Đăng ký thất bại",
        description: error.error_description || error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Row
      justify="center"
      align="middle"
      style={{ minHeight: "100vh", background: "#f0f2f5" }}
    >
      <Col xs={22} sm={16} md={12} lg={8} xl={6}>
        <Card>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            {logo && (
              <div style={{ marginBottom: 16 }}>
                {typeof logo === "string" ? (
                  <img
                    src={logo}
                    alt={appName}
                    style={{ width: 80, height: 80, objectFit: "contain" }}
                  />
                ) : (
                  logo
                )}
              </div>
            )}
            <Title level={2}>{appName}</Title>
            <Text>Tạo tài khoản mới để bắt đầu sử dụng</Text>
          </div>
          <Form
            form={form}
            name="register"
            onFinish={handleRegister}
            layout="vertical"
            requiredMark={false}
          >
            <Form.Item
              name="fullName"
              label="Họ và tên"
              rules={[{ required: true, message: "Vui lòng nhập họ và tên!" }]}
            >
              <Input placeholder="Nguyễn Văn A" />
            </Form.Item>

            <Form.Item
              name="email"
              label="Email"
              rules={[
                {
                  required: true,
                  type: "email",
                  message: "Vui lòng nhập email hợp lệ!",
                },
              ]}
            >
              <Input placeholder="email@example.com" />
            </Form.Item>

            <Form.Item
              name="phone"
              label="Số điện thoại"
              rules={[
                { required: true, message: "Vui lòng nhập số điện thoại!" },
                {
                  pattern: /^[0-9]{10,11}$/,
                  message: "Số điện thoại không hợp lệ!",
                },
              ]}
            >
              <Input placeholder="0123456789" />
            </Form.Item>

            <Form.Item
              name="password"
              label="Mật khẩu"
              rules={[
                { required: true, message: "Vui lòng nhập mật khẩu!" },
                { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự!" },
              ]}
            >
              <Input.Password placeholder="Mật khẩu của bạn" />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label="Xác nhận mật khẩu"
              dependencies={["password"]}
              rules={[
                { required: true, message: "Vui lòng xác nhận mật khẩu!" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("password") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error("Mật khẩu xác nhận không khớp!"),
                    );
                  },
                }),
              ]}
            >
              <Input.Password placeholder="Nhập lại mật khẩu" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block>
                Đăng ký
              </Button>
            </Form.Item>

            <div style={{ textAlign: "center" }}>
              <Text>
                Đã có tài khoản?{" "}
                <Link to={loginPath} style={{ fontWeight: 500 }}>
                  Đăng nhập ngay
                </Link>
              </Text>
            </div>
          </Form>
        </Card>
      </Col>
    </Row>
  );
};

const RegisterForm: React.FC<RegisterFormProps> = (props) => (
  <AntApp>
    <RegisterFormContent {...props} />
  </AntApp>
);

export default RegisterForm;
