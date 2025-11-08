/**
 * Salary Grade Form Modal
 *
 * Modal để tạo/sửa ngạch lương với lương cơ bản và danh sách phụ cấp
 */

import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Button,
  Space,
  Table,
  Card,
  Typography,
  Divider,
  App,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { SalaryGrade, Allowance } from "../../types/salary";
import { formatCurrency } from "../../utils";
import { createSalaryGrade, updateSalaryGrade } from "@nam-viet-erp/services";

const { TextArea } = Input;
const { Text } = Typography;

export interface SalaryGradeFormModalProps {
  visible: boolean;
  grade?: SalaryGrade | null; // null = create, có giá trị = edit
  onClose: (saved: boolean) => void;
}

interface AllowanceFormItem {
  id: string;
  name: string;
  amount: number;
}

const SalaryGradeFormModal: React.FC<SalaryGradeFormModalProps> = ({
  visible,
  grade,
  onClose,
}) => {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [allowances, setAllowances] = useState<AllowanceFormItem[]>([]);
  const [baseSalary, setBaseSalary] = useState(0);

  // Load existing data when editing
  useEffect(() => {
    if (visible && grade) {
      form.setFieldsValue({
        grade_name: grade.grade_name,
        base_salary: grade.base_salary,
        description: grade.description,
      });
      setBaseSalary(grade.base_salary);
      setAllowances(
        grade.allowances.map((a) => ({
          id: a.id,
          name: a.name,
          amount: a.amount,
        })),
      );
    } else if (visible) {
      // Reset form khi tạo mới
      form.resetFields();
      setAllowances([]);
      setBaseSalary(0);
    }
  }, [visible, grade, form]);

  const handleAddAllowance = () => {
    const newAllowance: AllowanceFormItem = {
      id: `temp_${Date.now()}`,
      name: "",
      amount: 0,
    };
    setAllowances([...allowances, newAllowance]);
  };

  const handleDeleteAllowance = (id: string) => {
    setAllowances(allowances.filter((a) => a.id !== id));
  };

  const handleAllowanceChange = (
    id: string,
    field: "name" | "amount",
    value: string | number,
  ) => {
    setAllowances(
      allowances.map((a) => (a.id === id ? { ...a, [field]: value } : a)),
    );
  };

  // Calculate totals
  const totalAllowances = allowances.reduce((sum, a) => sum + a.amount, 0);
  const totalSalary = baseSalary + totalAllowances;

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      // Validate allowances
      const invalidAllowances = allowances.filter(
        (a) => !a.name.trim() || a.amount <= 0,
      );
      if (invalidAllowances.length > 0) {
        message.error("Vui lòng nhập đầy đủ tên và số tiền cho tất cả phụ cấp");
        return;
      }

      setLoading(true);

      // Build salary grade data
      const salaryGradeData = {
        grade_name: values.grade_name,
        base_salary: values.base_salary,
        description: values.description,
        allowances: allowances.map((a) => ({
          name: a.name,
          amount: a.amount,
        })),
      };

      let result;
      if (grade) {
        // Update existing salary grade
        result = await updateSalaryGrade(grade.id, salaryGradeData);
      } else {
        // Create new salary grade
        result = await createSalaryGrade(salaryGradeData);
      }

      if (result.error) {
        console.error("Error saving salary grade:", result.error);
        message.error(
          `Không thể ${grade ? "cập nhật" : "tạo"} ngạch lương: ${result.error.message}`,
        );
        setLoading(false);
        return;
      }

      message.success(
        grade
          ? `Đã cập nhật ngạch lương "${values.grade_name}"`
          : `Đã tạo ngạch lương "${values.grade_name}"`,
      );

      setLoading(false);
      onClose(true);
    } catch (error: any) {
      console.error("Error in handleSubmit:", error);
      message.error("Có lỗi xảy ra khi lưu ngạch lương");
      setLoading(false);
    }
  };

  const allowanceColumns: ColumnsType<AllowanceFormItem> = [
    {
      title: "Tên phụ cấp",
      dataIndex: "name",
      key: "name",
      width: 250,
      render: (_, record) => (
        <Input
          placeholder="VD: Phụ cấp xăng xe"
          value={record.name}
          onChange={(e) =>
            handleAllowanceChange(record.id, "name", e.target.value)
          }
        />
      ),
    },
    {
      title: "Số tiền",
      dataIndex: "amount",
      key: "amount",
      width: 200,
      render: (_, record) => (
        <InputNumber
          placeholder="Nhập số tiền"
          value={record.amount}
          onChange={(value) =>
            handleAllowanceChange(record.id, "amount", value || 0)
          }
          formatter={(value) =>
            `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
          }
          parser={(value) => value!.replace(/\$\s?|(,*)/g, "")}
          style={{ width: "100%" }}
          min={0}
          step={100000}
        />
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 100,
      align: "center",
      render: (_, record) => (
        <Button
          type="link"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleDeleteAllowance(record.id)}
        >
          Xóa
        </Button>
      ),
    },
  ];

  return (
    <Modal
      title={
        grade
          ? `Chỉnh sửa ngạch lương "${grade.grade_name}"`
          : "Thêm ngạch lương mới"
      }
      open={visible}
      onCancel={() => onClose(false)}
      onOk={handleSubmit}
      confirmLoading={loading}
      width={900}
      okText={grade ? "Cập nhật" : "Tạo mới"}
      cancelText="Hủy"
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        {/* Thông tin cơ bản */}
        <Card
          title="Thông tin ngạch lương"
          size="small"
          style={{ marginBottom: 16 }}
        >
          <Form.Item
            label="Tên ngạch lương"
            name="grade_name"
            rules={[
              { required: true, message: "Vui lòng nhập tên ngạch lương" },
            ]}
          >
            <Input placeholder="VD: Ngạch A - Nhân viên cấp cao" />
          </Form.Item>

          <Form.Item
            label="Lương cơ bản"
            name="base_salary"
            rules={[
              { required: true, message: "Vui lòng nhập lương cơ bản" },
              {
                type: "number",
                min: 0,
                message: "Lương cơ bản phải lớn hơn 0",
              },
            ]}
          >
            <InputNumber
              placeholder="Nhập lương cơ bản"
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => value!.replace(/\$\s?|(,*)/g, "")}
              style={{ width: "100%" }}
              min={0}
              step={1000000}
              onChange={(value) => setBaseSalary(value || 0)}
            />
          </Form.Item>

          <Form.Item label="Mô tả" name="description">
            <TextArea placeholder="Mô tả ngạch lương (tùy chọn)" rows={2} />
          </Form.Item>
        </Card>

        {/* Danh sách phụ cấp */}
        <Card
          title="Danh sách phụ cấp"
          size="small"
          extra={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddAllowance}
              size="small"
            >
              Thêm phụ cấp
            </Button>
          }
          style={{ marginBottom: 16 }}
        >
          {allowances.length === 0 ? (
            <Text type="secondary">
              Chưa có phụ cấp nào. Nhấn "Thêm phụ cấp" để thêm mới.
            </Text>
          ) : (
            <Table
              columns={allowanceColumns}
              dataSource={allowances}
              rowKey="id"
              pagination={false}
              size="small"
            />
          )}
        </Card>

        {/* Tổng kết */}
        <Card title="Tổng kết lương" size="small">
          <Space direction="vertical" style={{ width: "100%" }} size="large">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text>Lương cơ bản:</Text>
              <Text strong style={{ fontSize: 16 }}>
                {formatCurrency(baseSalary)}
              </Text>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text>Tổng phụ cấp ({allowances.length} khoản):</Text>
              <Text strong style={{ fontSize: 16, color: "#1890ff" }}>
                {formatCurrency(totalAllowances)}
              </Text>
            </div>

            <Divider style={{ margin: "8px 0" }} />

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text strong style={{ fontSize: 18 }}>
                Tổng lương:
              </Text>
              <Text strong style={{ fontSize: 20, color: "#52c41a" }}>
                {formatCurrency(totalSalary)}
              </Text>
            </div>
          </Space>
        </Card>
      </Form>
    </Modal>
  );
};

export default SalaryGradeFormModal;
