// src/features/users/components/ChangePasswordModal.tsx

import React, { useState } from "react";
import { Modal, Form, Input, App as AntApp } from "antd";
import { supabase } from "../../../lib/supabaseClient";

interface ChangePasswordModalProps {
  open: boolean;
  onCancel: () => void;
}

const ChangePasswordModalContent: React.FC<ChangePasswordModalProps> = ({
  open,
  onCancel,
}) => {
  const [form] = Form.useForm();
  const { notification } = AntApp.useApp();
  const [loading, setLoading] = useState(false);

  const handleFinish = async (values: any) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: values.newPassword,
      });
      if (error) throw error;
      notification.success({ message: "Đổi mật khẩu thành công!" });
      onCancel();
      form.resetFields();
    } catch (error: any) {
      notification.error({
        message: "Đổi mật khẩu thất bại",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Đổi mật khẩu"
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      confirmLoading={loading}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        style={{ paddingTop: 24 }}
      >
        <Form.Item
          name="newPassword"
          label="Mật khẩu mới"
          rules={[
            { required: true, message: "Vui lòng nhập mật khẩu mới!", min: 6 },
          ]}
          hasFeedback
        >
          <Input.Password />
        </Form.Item>
        <Form.Item
          name="confirmPassword"
          label="Xác nhận mật khẩu mới"
          dependencies={["newPassword"]}
          hasFeedback
          rules={[
            { required: true, message: "Vui lòng xác nhận mật khẩu!" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("newPassword") === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error("Hai mật khẩu không khớp!"));
              },
            }),
          ]}
        >
          <Input.Password />
        </Form.Item>
      </Form>
    </Modal>
  );
};

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = (props) => (
  <AntApp>
    <ChangePasswordModalContent {...props} />
  </AntApp>
);

export default ChangePasswordModal;
