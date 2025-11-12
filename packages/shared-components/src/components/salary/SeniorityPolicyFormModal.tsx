/**
 * Seniority Policy Form Modal
 * Modal form để tạo và chỉnh sửa chính sách thâm niên
 */

import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  App,
  Checkbox,
  Space,
  Typography,
} from "antd";
import type { SeniorityPolicy } from "../../types/salary";
import { formatCurrency } from "../../utils";
import {
  createSeniorityPolicy,
  updateSeniorityPolicy,
} from "@nam-viet-erp/services";
import { getRoleOptions } from "../../constants/roles";

const { TextArea } = Input;
const { Text } = Typography;
const { Option } = Select;

export interface SeniorityPolicyFormModalProps {
  visible: boolean;
  seniorityPolicy?: SeniorityPolicy | null;
  onClose: (saved: boolean) => void;
}

const SeniorityPolicyFormModal: React.FC<SeniorityPolicyFormModalProps> = ({
  visible,
  seniorityPolicy,
  onClose,
}) => {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [benefitType, setBenefitType] = useState<string>("percentage");

  // Available roles from constants
  const availableRoles = getRoleOptions();

  useEffect(() => {
    if (visible && seniorityPolicy) {
      form.setFieldsValue({
        policy_name: seniorityPolicy.policy_name,
        description: seniorityPolicy.description,
        years_from: seniorityPolicy.years_from,
        years_to: seniorityPolicy.years_to,
        benefit_type: seniorityPolicy.benefit_type,
        benefit_value: seniorityPolicy.benefit_value,
        applicable_roles: seniorityPolicy.applicable_roles || [],
      });
      setBenefitType(seniorityPolicy.benefit_type);
    } else if (visible && !seniorityPolicy) {
      form.resetFields();
      setBenefitType("percentage");
    }
  }, [visible, seniorityPolicy, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const policyData = {
        policy_name: values.policy_name,
        description: values.description,
        years_from: values.years_from,
        years_to: values.years_to || null,
        benefit_type: values.benefit_type,
        benefit_value: values.benefit_value,
        applicable_roles:
          values.applicable_roles && values.applicable_roles.length > 0
            ? values.applicable_roles
            : null,
      };

      let result;
      if (seniorityPolicy) {
        result = await updateSeniorityPolicy(seniorityPolicy.id, policyData);
        if (result.error) {
          message.error(
            `Không thể cập nhật chính sách thâm niên: ${result.error.message}`,
          );
          return;
        }
        message.success(`Đã cập nhật chính sách "${values.policy_name}"`);
      } else {
        result = await createSeniorityPolicy(policyData);
        if (result.error) {
          message.error(
            `Không thể tạo chính sách thâm niên: ${result.error.message}`,
          );
          return;
        }
        message.success(`Đã tạo chính sách "${values.policy_name}"`);
      }

      onClose(true);
    } catch (error: any) {
      console.error("Error saving seniority policy:", error);
      message.error("Vui lòng kiểm tra lại thông tin");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose(false);
  };

  return (
    <Modal
      title={
        seniorityPolicy
          ? "Chỉnh sửa chính sách thâm niên"
          : "Thêm chính sách thâm niên"
      }
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      width={700}
      okText={seniorityPolicy ? "Cập nhật" : "Tạo mới"}
      cancelText="Hủy"
      destroyOnClose
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        {/* Policy Name */}
        <Form.Item
          label="Tên chính sách"
          name="policy_name"
          rules={[
            { required: true, message: "Vui lòng nhập tên chính sách" },
            {
              max: 255,
              message: "Tên chính sách không được vượt quá 255 ký tự",
            },
          ]}
        >
          <Input placeholder="Ví dụ: Phụ cấp thâm niên 1-2 năm" />
        </Form.Item>

        {/* Description */}
        <Form.Item label="Mô tả" name="description">
          <TextArea
            rows={2}
            placeholder="Mô tả chi tiết về chính sách thâm niên..."
          />
        </Form.Item>

        {/* Years Range */}
        <Space style={{ width: "100%" }} size="large">
          <Form.Item
            label="Từ năm thứ"
            name="years_from"
            rules={[
              { required: true, message: "Vui lòng nhập số năm tối thiểu" },
            ]}
            style={{ marginBottom: 0, flex: 1 }}
          >
            <InputNumber
              min={0}
              precision={0}
              style={{ width: "100%" }}
              placeholder="0"
            />
          </Form.Item>

          <Form.Item
            label="Đến năm thứ"
            name="years_to"
            style={{ marginBottom: 0, flex: 1 }}
            tooltip="Để trống nếu không giới hạn"
          >
            <InputNumber
              min={0}
              precision={0}
              style={{ width: "100%" }}
              placeholder="Không giới hạn"
            />
          </Form.Item>
        </Space>

        {/* Benefit Type */}
        <Form.Item
          label="Loại phụ cấp"
          name="benefit_type"
          rules={[{ required: true, message: "Vui lòng chọn loại phụ cấp" }]}
          initialValue="percentage"
        >
          <Select onChange={(value) => setBenefitType(value)}>
            <Option value="percentage">Phần trăm (%)</Option>
            <Option value="fixed">Cố định (VNĐ)</Option>
          </Select>
        </Form.Item>

        {/* Benefit Value */}
        <Form.Item
          label={
            benefitType === "percentage"
              ? "Tỷ lệ phụ cấp (%)"
              : "Số tiền phụ cấp (VNĐ)"
          }
          name="benefit_value"
          rules={[{ required: true, message: "Vui lòng nhập giá trị phụ cấp" }]}
        >
          <InputNumber
            min={0}
            max={benefitType === "percentage" ? 100 : undefined}
            precision={benefitType === "percentage" ? 2 : 0}
            style={{ width: "100%" }}
            placeholder={
              benefitType === "percentage" ? "Ví dụ: 5.00" : "Ví dụ: 1000000"
            }
            formatter={
              benefitType === "percentage"
                ? undefined
                : (value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
            }
            parser={
              benefitType === "percentage"
                ? undefined
                : (value) => value!.replace(/\$\s?|(,*)/g, "")
            }
          />
        </Form.Item>

        {benefitType === "percentage" && (
          <Text type="secondary" style={{ display: "block", marginTop: -16 }}>
            Ví dụ: 5% nghĩa là phụ cấp thêm 5% trên lương cơ bản
          </Text>
        )}

        {/* Applicable Roles */}
        <Form.Item
          label="Vai trò áp dụng"
          name="applicable_roles"
          tooltip="Để trống để áp dụng cho tất cả vai trò"
        >
          <Checkbox.Group style={{ width: "100%" }}>
            <Space direction="vertical">
              {availableRoles.map((role) => (
                <Checkbox key={role.value} value={role.value}>
                  {role.label}
                </Checkbox>
              ))}
            </Space>
          </Checkbox.Group>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default SeniorityPolicyFormModal;
