// src/pages/Register.tsx

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
  Steps,
  DatePicker,
  Select,
  Radio,
} from "antd";
import { supabase } from "../lib/supabaseClient";
import { Link } from "react-router-dom";
import AvatarUpload from "../features/users/components/AvatarUpload";
import CameraCapture from "../features/users/components/CameraCapture";

const { Title, Text } = Typography;

const RegisterPageContent: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { notification } = AntApp.useApp();
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);

  const handleRegister = async (values: any) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            full_name: values.full_name,
            phone: values.phone,
            avatar_url: values.avatar_url,
            date_of_birth: values.date_of_birth,
            gender: values.gender,
            marital_status: values.marital_status,
            citizen_id: values.citizen_id,
            citizen_id_issue_date:
              values.citizen_id_issue_date?.format("YYYY-MM-DD"),
            citizen_id_front_url: values.citizen_id_front_url,
            citizen_id_back_url: values.citizen_id_back_url,
            education_level: values.education_level,
            major: values.major,
            self_introduction: values.self_introduction,
            hobbies: values.hobbies,
            personal_boundaries: values.personal_boundaries,
            strengths: values.strengths,
            allergies: values.allergies,
          },
        },
      });
      if (error) throw error;
      if (data.user) setIsSuccess(true);
    } catch (error: any) {
      notification.error({
        message: "Đăng ký thất bại",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { title: "Tài khoản" },
    { title: "Thông tin cơ bản" },
    { title: "Giới thiệu" },
  ];

  if (isSuccess) {
    return (
      <Card>
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
          <Title level={3}>Đăng ký Thành công!</Title>
          <Text>
            Yêu cầu của bạn đã được gửi đi. Vui lòng chờ quản trị viên phê duyệt
            tài khoản. Kiểm tra email của bạn để xác thực địa chỉ email.
          </Text>
          <Button type="primary" style={{ marginTop: 24 }}>
            <Link to="/login">Quay lại Đăng nhập</Link>
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <Title level={2}>Đăng ký Nhân viên</Title>
        <Text>Hoàn tất hồ sơ để gia nhập hệ thống Nam Việt ERP</Text>
      </div>
      <Steps current={currentStep} items={steps} style={{ marginBottom: 24 }} />
      <Form
        form={form}
        name="register"
        onFinish={handleRegister}
        layout="vertical"
        requiredMark={false}
      >
        {/* Step 1: Thông tin tài khoản */}
        <div style={{ display: currentStep === 0 ? "block" : "none" }}>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="full_name"
                label="Họ và Tên"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="phone"
                label="Số điện thoại"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={[{ required: true, type: "email" }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                name="password"
                label="Mật khẩu"
                rules={[{ required: true, min: 6 }]}
              >
                <Input.Password />
              </Form.Item>
            </Col>
          </Row>
        </div>

        {/* Step 2: Thông tin cơ bản */}
        <div style={{ display: currentStep === 1 ? "block" : "none" }}>
          <Form.Item
            name="avatar_url"
            style={{ display: "flex", justifyContent: "center" }}
          >
            <AvatarUpload />
          </Form.Item>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="date_of_birth" label="Ngày sinh">
                <Input placeholder="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="gender" label="Giới tính">
                <Radio.Group>
                  <Radio value="Nam">Nam</Radio>
                  <Radio value="Nữ">Nữ</Radio>
                  <Radio value="Khác">Khác</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="marital_status" label="Tình trạng hôn nhân">
                <Select
                  options={[
                    { value: "Độc thân", label: "Độc thân" },
                    { value: "Đã kết hôn", label: "Đã kết hôn" },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="citizen_id" label="Số CCCD">
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="citizen_id_issue_date" label="Ngày cấp CCCD">
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="citizen_id_front_url">
                <CameraCapture title="Chụp mặt trước CCCD" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="citizen_id_back_url">
                <CameraCapture title="Chụp mặt sau CCCD" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="education_level" label="Trình độ học vấn">
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="major" label="Chuyên ngành">
                <Input />
              </Form.Item>
            </Col>
          </Row>
        </div>

        {/* Step 3: Giới thiệu */}
        <div style={{ display: currentStep === 2 ? "block" : "none" }}>
          <Form.Item
            name="self_introduction"
            label="Giới thiệu về bản thân và Quan điểm sống"
          >
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="hobbies" label="Sở thích cá nhân">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item
            name="personal_boundaries"
            label="Giới hạn cá nhân của bạn"
          >
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="strengths" label="Bạn giỏi nhất trong lĩnh vực gì?">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item
            name="allergies"
            label="Có Bệnh mãn tính và Dị ứng gì không?"
          >
            <Input.TextArea rows={2} />
          </Form.Item>
        </div>

        {/* Navigation Buttons */}
        <div
          style={{
            marginTop: 24,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          {currentStep > 0 && (
            <Button onClick={() => setCurrentStep(currentStep - 1)}>
              Quay lại
            </Button>
          )}
          <div /> {/* Để đẩy nút tiếp theo sang phải */}
          {currentStep < steps.length - 1 && (
            <Button
              type="primary"
              onClick={() => setCurrentStep(currentStep + 1)}
            >
              Tiếp theo
            </Button>
          )}
          {currentStep === steps.length - 1 && (
            <Button type="primary" htmlType="submit" loading={loading}>
              Hoàn tất & Gửi Đăng ký
            </Button>
          )}
        </div>
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <Text>Đã có tài khoản? </Text>
          <Link to="/login">Đăng nhập ngay</Link>
        </div>
      </Form>
    </Card>
  );
};

const Register: React.FC = () => (
  <AntApp>
    <Row
      justify="center"
      align="middle"
      style={{ minHeight: "100vh", background: "#f0f2f5", padding: "20px 0" }}
    >
      <Col xs={22} sm={16} md={12} lg={10} xl={8}>
        <RegisterPageContent />
      </Col>
    </Row>
  </AntApp>
);

export default Register;
