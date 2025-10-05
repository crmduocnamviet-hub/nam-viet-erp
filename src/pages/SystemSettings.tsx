// src/pages/SystemSettings.tsx

import React, { useState, useEffect, useCallback } from "react";
import {
  Typography,
  App as AntApp,
  Spin,
  Card,
  Radio,
  Button,
  Form,
} from "antd";
import { supabase } from "../lib/supabaseClient";
import { SaveOutlined } from "@ant-design/icons";

const { Title } = Typography;

const SystemSettingsContent: React.FC = () => {
  const { notification } = AntApp.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("system_settings")
        .select("key, value")
        .eq("key", "suggestion_moderation_mode")
        .single();
      if (error && error.code !== "PGRST116") throw error;
      if (data) {
        form.setFieldsValue({ moderation_mode: data.value });
      }
    } catch (error: any) {
      notification.error({
        message: "Lỗi tải cấu hình",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  }, [notification, form]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async (values: any) => {
    setLoading(true);
    try {
      const { error } = await supabase.from("system_settings").upsert({
        key: "suggestion_moderation_mode",
        value: values.moderation_mode,
      });
      if (error) throw error;
      notification.success({ message: "Đã lưu cấu hình thành công!" });
    } catch (error: any) {
      notification.error({
        message: "Lưu thất bại",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Spin spinning={loading}>
      <Title level={2}>Cấu hình Hệ thống</Title>
      <Form form={form} layout="vertical" onFinish={handleSave}>
        <Card title="Cấu hình Kiểm duyệt">
          <Form.Item
            name="moderation_mode"
            label="Chế độ kiểm duyệt cho 'Diễn đàn Góp ý'"
          >
            <Radio.Group>
              <Radio value="manual">
                Duyệt Thủ công (Quản lý cần phê duyệt từng bài viết)
              </Radio>
              <Radio value="auto">
                Duyệt Tự động (Bài viết của nhân viên được đăng ngay lập tức)
              </Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
              Lưu thay đổi
            </Button>
          </Form.Item>
        </Card>
      </Form>
    </Spin>
  );
};

const SystemSettings: React.FC = () => (
  <AntApp>
    <SystemSettingsContent />
  </AntApp>
);

export default SystemSettings;
