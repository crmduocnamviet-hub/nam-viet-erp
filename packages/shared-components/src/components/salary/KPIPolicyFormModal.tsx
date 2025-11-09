/**
 * KPI Policy Form Modal
 * Modal để tạo/sửa chính sách KPI
 */

import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Card,
  Typography,
  App,
  Checkbox,
} from "antd";
import type { KPIPolicy } from "../../types/salary";
import { formatCurrency } from "../../utils";
import { createKPIPolicy, updateKPIPolicy } from "@nam-viet-erp/services";
import {
  getRoleOptions,
  getMeasurementPeriodOptions,
  KPI_TYPES,
} from "../../constants/roles";

const { TextArea } = Input;
const { Text } = Typography;
const { Option } = Select;

export interface KPIPolicyFormModalProps {
  visible: boolean;
  kpiPolicy?: KPIPolicy | null;
  onClose: (saved: boolean) => void;
}

const KPIPolicyFormModal: React.FC<KPIPolicyFormModalProps> = ({
  visible,
  kpiPolicy,
  onClose,
}) => {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // Available options from constants
  const availableRoles = getRoleOptions();
  const kpiTypes = Object.entries(KPI_TYPES).map(([value, label]) => ({
    value,
    label,
  }));
  const measurementPeriods = getMeasurementPeriodOptions();

  useEffect(() => {
    if (visible && kpiPolicy) {
      form.setFieldsValue({
        kpi_name: kpiPolicy.kpi_name,
        description: kpiPolicy.description,
        kpi_type: kpiPolicy.kpi_type,
        default_target: kpiPolicy.default_target,
        measurement_period: kpiPolicy.measurement_period,
        applicable_roles: kpiPolicy.kpi_applicable_roles || [],
      });
    } else if (visible) {
      form.resetFields();
    }
  }, [visible, kpiPolicy, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const kpiData = {
        name: values.kpi_name,
        description: values.description,
        kpi_type: values.kpi_type,
        target_value: values.default_target,
        measurement_period: values.measurement_period,
        applicable_roles: values.applicable_roles,
      };

      let result;
      if (kpiPolicy) {
        result = await updateKPIPolicy(kpiPolicy.kpi_id, kpiData);
      } else {
        result = await createKPIPolicy(kpiData);
      }

      if (result.error) {
        console.error("Error saving KPI policy:", result.error);
        message.error(
          `Không thể ${kpiPolicy ? "cập nhật" : "tạo"} chính sách KPI: ${result.error.message}`,
        );
        setLoading(false);
        return;
      }

      message.success(
        kpiPolicy
          ? `Đã cập nhật chính sách KPI "${values.kpi_name}"`
          : `Đã tạo chính sách KPI "${values.kpi_name}"`,
      );

      setLoading(false);
      onClose(true);
    } catch (error: any) {
      console.error("Error in handleSubmit:", error);
      message.error("Có lỗi xảy ra khi lưu chính sách KPI");
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        kpiPolicy
          ? `Chỉnh sửa KPI "${kpiPolicy.kpi_name}"`
          : "Thêm chính sách KPI mới"
      }
      open={visible}
      onCancel={() => onClose(false)}
      onOk={handleSubmit}
      confirmLoading={loading}
      width={700}
      okText={kpiPolicy ? "Cập nhật" : "Tạo mới"}
      cancelText="Hủy"
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Card title="Thông tin KPI" size="small" style={{ marginBottom: 16 }}>
          <Form.Item
            label="Tên KPI"
            name="kpi_name"
            rules={[{ required: true, message: "Vui lòng nhập tên KPI" }]}
          >
            <Input placeholder="VD: Doanh thu trong tháng" />
          </Form.Item>

          <Form.Item label="Mô tả" name="description">
            <TextArea placeholder="Mô tả chi tiết về KPI này" rows={2} />
          </Form.Item>

          <Form.Item
            label="Loại KPI"
            name="kpi_type"
            rules={[{ required: true, message: "Vui lòng chọn loại KPI" }]}
          >
            <Select placeholder="Chọn loại KPI">
              {kpiTypes.map((type) => (
                <Option key={type.value} value={type.value}>
                  {type.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Mục tiêu mặc định" name="default_target">
            <InputNumber
              placeholder="Mục tiêu cần đạt (VD: 50,000,000)"
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => value!.replace(/\$\s?|(,*)/g, "")}
              style={{ width: "100%" }}
              min={0}
            />
          </Form.Item>

          <Form.Item
            label="Chu kỳ đo lường"
            name="measurement_period"
            rules={[
              { required: true, message: "Vui lòng chọn chu kỳ đo lường" },
            ]}
          >
            <Select placeholder="Chọn chu kỳ">
              {measurementPeriods.map((period) => (
                <Option key={period.value} value={period.value}>
                  {period.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Áp dụng cho vai trò" name="applicable_roles">
            <Checkbox.Group>
              {availableRoles.map((role) => (
                <div key={role.value} style={{ marginBottom: 8 }}>
                  <Checkbox value={role.value}>{role.label}</Checkbox>
                </div>
              ))}
            </Checkbox.Group>
          </Form.Item>
        </Card>
      </Form>
    </Modal>
  );
};

export default KPIPolicyFormModal;
