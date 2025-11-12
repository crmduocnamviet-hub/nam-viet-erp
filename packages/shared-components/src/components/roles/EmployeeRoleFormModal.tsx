/**
 * Employee Role Form Modal
 * Modal form để tạo và chỉnh sửa vai trò nhân viên
 */

import React, { useState, useEffect } from "react";
import { Modal, Form, Input, InputNumber, App, Typography, Alert } from "antd";
import type { EmployeeRole } from "../../types/employeeRole";
import {
  createEmployeeRole,
  updateEmployeeRole,
  checkRoleKeyExists,
} from "@nam-viet-erp/services";

const { TextArea } = Input;
const { Text } = Typography;

export interface EmployeeRoleFormModalProps {
  visible: boolean;
  employeeRole?: EmployeeRole | null;
  onClose: (saved: boolean) => void;
}

const EmployeeRoleFormModal: React.FC<EmployeeRoleFormModalProps> = ({
  visible,
  employeeRole,
  onClose,
}) => {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [roleKeyError, setRoleKeyError] = useState<string>("");

  useEffect(() => {
    if (visible && employeeRole) {
      form.setFieldsValue({
        role_key: employeeRole.role_key,
        role_name: employeeRole.role_name,
        description: employeeRole.description,
        display_order: employeeRole.display_order,
      });
    } else if (visible && !employeeRole) {
      form.resetFields();
      setRoleKeyError("");
    }
  }, [visible, employeeRole, form]);

  const validateRoleKey = async (value: string) => {
    if (!value) {
      setRoleKeyError("");
      return;
    }

    // Check format: lowercase with hyphens only
    const roleKeyPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;
    if (!roleKeyPattern.test(value)) {
      setRoleKeyError(
        "Mã vai trò chỉ được chứa chữ thường, số và dấu gạch ngang (-)",
      );
      return;
    }

    // Check if editing (has id) and key unchanged
    if (employeeRole?.id && employeeRole.role_key === value) {
      setRoleKeyError("");
      return;
    }

    // Check if key exists
    const exists = await checkRoleKeyExists(value);
    if (exists) {
      setRoleKeyError("Mã vai trò đã tồn tại");
    } else {
      setRoleKeyError("");
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      // Check role key error
      if (roleKeyError) {
        message.error(roleKeyError);
        return;
      }

      setLoading(true);

      const roleData = {
        role_key: values.role_key,
        role_name: values.role_name,
        description: values.description,
        display_order: values.display_order || 999,
      };

      let result;
      if (employeeRole?.id) {
        // Update - don't allow changing role_key for system roles
        const updateData = employeeRole.is_system
          ? {
              role_name: roleData.role_name,
              description: roleData.description,
              display_order: roleData.display_order,
            }
          : roleData;

        result = await updateEmployeeRole(employeeRole.id, updateData);
        if (result.error) {
          message.error(`Không thể cập nhật vai trò: ${result.error.message}`);
          return;
        }
        message.success(`Đã cập nhật vai trò "${values.role_name}"`);
      } else {
        // Create (includes both new roles and duplicated roles)
        result = await createEmployeeRole(roleData);
        if (result.error) {
          message.error(`Không thể tạo vai trò: ${result.error.message}`);
          return;
        }
        message.success(`Đã tạo vai trò "${values.role_name}"`);
      }

      onClose(true);
    } catch (error: any) {
      console.error("Error saving employee role:", error);
      message.error("Vui lòng kiểm tra lại thông tin");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setRoleKeyError("");
    onClose(false);
  };

  const isEditing = employeeRole?.id;
  const isDuplicating = employeeRole && !employeeRole.id;

  return (
    <Modal
      title={
        isEditing
          ? "Chỉnh sửa vai trò"
          : isDuplicating
            ? "Sao chép vai trò"
            : "Thêm vai trò mới"
      }
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      width={600}
      okText={isEditing ? "Cập nhật" : "Tạo mới"}
      cancelText="Hủy"
      destroyOnClose
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        {isEditing && employeeRole?.is_system && (
          <Alert
            message="Vai trò hệ thống"
            description="Đây là vai trò hệ thống. Bạn không thể thay đổi mã vai trò hoặc xóa vai trò này."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {isDuplicating && (
          <Alert
            message="Sao chép vai trò"
            description="Bạn đang tạo một vai trò mới từ vai trò hiện có. Vui lòng kiểm tra và điều chỉnh thông tin trước khi lưu."
            type="success"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {/* Role Key */}
        <Form.Item
          label="Mã vai trò"
          name="role_key"
          validateStatus={roleKeyError ? "error" : ""}
          help={
            roleKeyError || (
              <Text type="secondary">
                Ví dụ: intern-delivery-staff, senior-sales-staff (chỉ chữ
                thường, số và dấu -)
              </Text>
            )
          }
          rules={[
            { required: true, message: "Vui lòng nhập mã vai trò" },
            {
              pattern: /^[a-z0-9]+(-[a-z0-9]+)*$/,
              message:
                "Mã vai trò chỉ được chứa chữ thường, số và dấu gạch ngang (-)",
            },
          ]}
        >
          <Input
            placeholder="intern-delivery-staff"
            disabled={isEditing && employeeRole?.is_system}
            onChange={(e) => validateRoleKey(e.target.value)}
          />
        </Form.Item>

        {/* Role Name */}
        <Form.Item
          label="Tên vai trò"
          name="role_name"
          rules={[
            { required: true, message: "Vui lòng nhập tên vai trò" },
            {
              max: 255,
              message: "Tên vai trò không được vượt quá 255 ký tự",
            },
          ]}
        >
          <Input placeholder="Ví dụ: Thực tập sinh giao hàng" />
        </Form.Item>

        {/* Description */}
        <Form.Item label="Mô tả" name="description">
          <TextArea rows={3} placeholder="Mô tả chi tiết về vai trò này..." />
        </Form.Item>

        {/* Display Order */}
        <Form.Item
          label="Thứ tự hiển thị"
          name="display_order"
          tooltip="Số thứ tự để sắp xếp vai trò trong danh sách (số nhỏ hơn = ưu tiên cao hơn)"
        >
          <InputNumber
            min={1}
            max={9999}
            precision={0}
            style={{ width: "100%" }}
            placeholder="999"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EmployeeRoleFormModal;
