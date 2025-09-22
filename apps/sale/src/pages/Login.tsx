import React, { useState } from "react";
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  App as AntApp,
  Row,
  Col,
} from "antd";
import { useNavigate } from "react-router-dom";
import { supabase } from "@nam-viet-erp/services";

const { Title, Text } = Typography;

const LoginPageContent: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { notification } = AntApp.useApp();

  const handleLogin = async (values: any) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) throw error;

      notification.success({ message: "Đăng nhập thành công!" });
      navigate("/");
    } catch (error: any) {
      notification.error({
        message: "Đăng nhập thất bại",
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
            <Title level={2}>Nam Việt EMS</Title>
            <Text>Chào mừng trở lại! Vui lòng đăng nhập.</Text>
          </div>
          <Form
            name="login"
            onFinish={handleLogin}
            layout="vertical"
            requiredMark={false}
          >
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
              <Input placeholder="Email của bạn" />
            </Form.Item>

            <Form.Item
              name="password"
              label="Mật khẩu"
              rules={[{ required: true, message: "Vui lòng nhập mật khẩu!" }]}
            >
              <Input.Password placeholder="Mật khẩu" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block>
                Đăng nhập
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Col>
    </Row>
  );
};

const Login: React.FC = () => (
  <AntApp>
    <LoginPageContent />
  </AntApp>
);

export default Login;
