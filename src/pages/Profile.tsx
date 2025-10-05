// src/pages/Profile.tsx

import React, { useState, useEffect } from "react";
import {
  Row,
  Col,
  Typography,
  App as AntApp,
  Card,
  Spin,
  Form,
  Button,
} from "antd";
import { SaveOutlined } from "@ant-design/icons";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import AvatarUpload from "../features/users/components/AvatarUpload";
import CameraCapture from "../features/users/components/CameraCapture";
import { DatePicker, Input, Radio, Select } from "antd";
import dayjs from "dayjs";

const { Title } = Typography;

const ProfilePageContent: React.FC = () => {
  const { user } = useAuth();
  const [form] = Form.useForm();
  const { notification } = AntApp.useApp();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        if (error) throw error;
        setProfile(data);
        // Chuyển đổi ngày tháng sang dayjs object để Form nhận diện
        form.setFieldsValue({
          ...data,
          date_of_birth: data.date_of_birth ? dayjs(data.date_of_birth) : null,
          citizen_id_issue_date: data.citizen_id_issue_date
            ? dayjs(data.citizen_id_issue_date)
            : null,
        });
      } catch (error: any) {
        notification.error({
          message: "Lỗi tải thông tin cá nhân",
          description: error.message,
        });
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user, form, notification]);

  const handleUpdateProfile = async (values: any) => {
    if (!user) return;
    setSaving(true);
    try {
      // Cập nhật user_metadata trong auth
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: values.full_name,
          avatar_url: values.avatar_url,
          phone: values.phone,
        },
      });
      if (authError) throw authError;

      // Cập nhật bảng profiles
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          ...values,
          // Đảm bảo định dạng ngày tháng đúng chuẩn
          date_of_birth: values.date_of_birth?.format("YYYY-MM-DD"),
          citizen_id_issue_date:
            values.citizen_id_issue_date?.format("YYYY-MM-DD"),
          updated_at: new Date().toISOString(), // Cập nhật thời gian sửa đổi
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      notification.success({ message: "Cập nhật thông tin thành công!" });
    } catch (error: any) {
      notification.error({
        message: "Cập nhật thất bại",
        description: error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Spin spinning={loading}>
      <Title level={2}>Thông tin Cá nhân</Title>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleUpdateProfile}
        initialValues={profile}
      >
        <Row gutter={24}>
          <Col xs={24} md={8} style={{ textAlign: "center" }}>
            <Form.Item name="avatar_url">
              <AvatarUpload />
            </Form.Item>
            <Title level={4}>{profile?.full_name}</Title>
          </Col>
          <Col xs={24} md={16}>
            <Card title="Thông tin cơ bản">
              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item name="full_name" label="Họ và Tên">
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="phone" label="Số điện thoại">
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="date_of_birth" label="Ngày sinh">
                    <DatePicker style={{ width: "100%" }} />
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
                <Col xs={24} sm={12}>
                  <Form.Item name="marital_status" label="Tình trạng hôn nhân">
                    <Select
                      options={[
                        { value: "Độc thân", label: "Độc thân" },
                        { value: "Đã kết hôn", label: "Đã kết hôn" },
                      ]}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
            <Card title="Thông tin CCCD" style={{ marginTop: 24 }}>
              <Row gutter={16}>
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
              </Row>
            </Card>
            {/* === DÁN TỪ ĐÂY === */}
            <Card title="Học vấn & Chuyên môn" style={{ marginTop: 24 }}>
              <Row gutter={16}>
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
            </Card>

            <Card title="Giới thiệu Bản thân" style={{ marginTop: 24 }}>
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
              <Form.Item
                name="strengths"
                label="Bạn giỏi nhất trong lĩnh vực gì?"
              >
                <Input.TextArea rows={2} />
              </Form.Item>
              <Form.Item
                name="allergies"
                label="Có Bệnh mãn tính và Dị ứng gì không?"
              >
                <Input.TextArea rows={2} />
              </Form.Item>
            </Card>
            {/* === DÁN ĐẾN ĐÂY === */}
            <Form.Item style={{ marginTop: 24, textAlign: "right" }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={saving}
                icon={<SaveOutlined />}
              >
                Lưu thay đổi
              </Button>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Spin>
  );
};

const Profile: React.FC = () => (
  <AntApp>
    <ProfilePageContent />
  </AntApp>
);

export default Profile;
