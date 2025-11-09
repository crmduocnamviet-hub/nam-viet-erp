/**
 * Commission Policy Form Modal
 * Modal để tạo/sửa chính sách hoa hồng
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
  Button,
  Space,
  Table,
  Divider,
} from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type {
  CommissionPolicyItem,
  CommissionTierConfig,
} from "../../types/salary";
import { formatCurrency } from "../../utils";
import {
  createCommissionPolicy,
  updateCommissionPolicy,
} from "@nam-viet-erp/services";
import { getRoleOptions } from "../../constants/roles";

const { TextArea } = Input;
const { Text } = Typography;
const { Option } = Select;

export interface CommissionPolicyFormModalProps {
  visible: boolean;
  kpiId: string; // Required: which KPI this commission is for
  commissionPolicy?: CommissionPolicyItem | null;
  onClose: (saved: boolean) => void;
}

interface TierFormItem {
  id: string;
  from: number;
  to: number | null;
  rate: number;
  description: string;
}

const CommissionPolicyFormModal: React.FC<CommissionPolicyFormModalProps> = ({
  visible,
  kpiId,
  commissionPolicy,
  onClose,
}) => {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [commissionType, setCommissionType] = useState<string>("percentage");
  const [tiers, setTiers] = useState<TierFormItem[]>([]);

  // Available roles from constants
  const availableRoles = getRoleOptions();

  useEffect(() => {
    if (visible && commissionPolicy) {
      form.setFieldsValue({
        policy_name: commissionPolicy.policy_name,
        commission_type: commissionPolicy.commission_type,
        commission_rate: commissionPolicy.commission_rate,
        min_threshold: commissionPolicy.min_threshold,
        max_commission: commissionPolicy.max_commission,
        applicable_roles: commissionPolicy.applicable_roles || [],
      });
      setCommissionType(commissionPolicy.commission_type);

      if (
        commissionPolicy.commission_type === "tiered" &&
        commissionPolicy.tiers
      ) {
        setTiers(
          commissionPolicy.tiers.map((t, idx) => ({
            id: `tier_${idx}`,
            from: t.from,
            to: t.to ?? null,
            rate: t.rate,
            description: t.description || "",
          })),
        );
      }
    } else if (visible) {
      form.resetFields();
      setCommissionType("percentage");
      setTiers([]);
    }
  }, [visible, commissionPolicy, form]);

  const handleAddTier = () => {
    const lastTier = tiers[tiers.length - 1];
    const newTier: TierFormItem = {
      id: `tier_${Date.now()}`,
      from: lastTier ? (lastTier.to ?? 0) : 0,
      to: null,
      rate: 0,
      description: "",
    };
    setTiers([...tiers, newTier]);
  };

  const handleDeleteTier = (id: string) => {
    setTiers(tiers.filter((t) => t.id !== id));
  };

  const handleTierChange = (
    id: string,
    field: keyof TierFormItem,
    value: any,
  ) => {
    setTiers(tiers.map((t) => (t.id === id ? { ...t, [field]: value } : t)));
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      // Validate tiers if commission_type is tiered
      if (values.commission_type === "tiered") {
        if (tiers.length === 0) {
          message.error("Vui lòng thêm ít nhất 1 bậc hoa hồng");
          return;
        }

        const invalidTiers = tiers.filter((t) => t.rate <= 0 || t.from < 0);
        if (invalidTiers.length > 0) {
          message.error("Vui lòng nhập đầy đủ thông tin cho tất cả các bậc");
          return;
        }
      }

      setLoading(true);

      const commissionData: any = {
        policy_name: values.policy_name,
        kpi_id: kpiId,
        commission_type: values.commission_type,
        min_threshold: values.min_threshold,
        max_commission: values.max_commission,
        applicable_roles: values.applicable_roles,
      };

      if (values.commission_type === "tiered") {
        commissionData.tiers = tiers.map((t) => ({
          from: t.from,
          to: t.to,
          rate: t.rate,
          description: t.description,
        }));
      } else {
        commissionData.commission_rate = values.commission_rate;
      }

      let result;
      if (commissionPolicy) {
        result = await updateCommissionPolicy(
          commissionPolicy.id,
          commissionData,
        );
      } else {
        result = await createCommissionPolicy(commissionData);
      }

      if (result.error) {
        console.error("Error saving commission policy:", result.error);
        message.error(
          `Không thể ${commissionPolicy ? "cập nhật" : "tạo"} chính sách hoa hồng: ${result.error.message}`,
        );
        setLoading(false);
        return;
      }

      message.success(
        commissionPolicy
          ? `Đã cập nhật chính sách hoa hồng "${values.policy_name}"`
          : `Đã tạo chính sách hoa hồng "${values.policy_name}"`,
      );

      setLoading(false);
      onClose(true);
    } catch (error: any) {
      console.error("Error in handleSubmit:", error);
      message.error("Có lỗi xảy ra khi lưu chính sách hoa hồng");
      setLoading(false);
    }
  };

  const tierColumns: ColumnsType<TierFormItem> = [
    {
      title: "Từ (VNĐ)",
      dataIndex: "from",
      key: "from",
      width: 150,
      render: (_, record) => (
        <InputNumber
          value={record.from}
          onChange={(value) => handleTierChange(record.id, "from", value || 0)}
          formatter={(value) =>
            `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
          }
          parser={(value) => value!.replace(/\$\s?|(,*)/g, "")}
          style={{ width: "100%" }}
          min={0}
        />
      ),
    },
    {
      title: "Đến (VNĐ)",
      dataIndex: "to",
      key: "to",
      width: 150,
      render: (_, record) => (
        <InputNumber
          value={record.to ?? undefined}
          onChange={(value) => handleTierChange(record.id, "to", value || null)}
          formatter={(value) =>
            `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
          }
          parser={(value) => value!.replace(/\$\s?|(,*)/g, "")}
          placeholder="Không giới hạn"
          style={{ width: "100%" }}
          min={record.from}
        />
      ),
    },
    {
      title: "Tỷ lệ (%)",
      dataIndex: "rate",
      key: "rate",
      width: 120,
      render: (_, record) => (
        <InputNumber
          value={record.rate}
          onChange={(value) => handleTierChange(record.id, "rate", value || 0)}
          min={0}
          max={100}
          step={0.1}
          style={{ width: "100%" }}
        />
      ),
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      render: (_, record) => (
        <Input
          value={record.description}
          onChange={(e) =>
            handleTierChange(record.id, "description", e.target.value)
          }
          placeholder="VD: Dưới 30 triệu"
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
          onClick={() => handleDeleteTier(record.id)}
        >
          Xóa
        </Button>
      ),
    },
  ];

  return (
    <Modal
      title={
        commissionPolicy
          ? `Chỉnh sửa chính sách hoa hồng "${commissionPolicy.policy_name}"`
          : "Thêm chính sách hoa hồng mới"
      }
      open={visible}
      onCancel={() => onClose(false)}
      onOk={handleSubmit}
      confirmLoading={loading}
      width={900}
      okText={commissionPolicy ? "Cập nhật" : "Tạo mới"}
      cancelText="Hủy"
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Card
          title="Thông tin chính sách"
          size="small"
          style={{ marginBottom: 16 }}
        >
          <Form.Item
            label="Tên chính sách"
            name="policy_name"
            rules={[
              { required: true, message: "Vui lòng nhập tên chính sách" },
            ]}
          >
            <Input placeholder="VD: Hoa hồng doanh thu bậc thang" />
          </Form.Item>

          <Form.Item
            label="Loại hoa hồng"
            name="commission_type"
            rules={[{ required: true, message: "Vui lòng chọn loại hoa hồng" }]}
          >
            <Select
              placeholder="Chọn loại"
              onChange={(value) => setCommissionType(value)}
            >
              <Option value="percentage">Phần trăm (%)</Option>
              <Option value="fixed">Cố định (VNĐ)</Option>
              <Option value="tiered">Bậc thang</Option>
            </Select>
          </Form.Item>

          {commissionType !== "tiered" && (
            <Form.Item
              label={
                commissionType === "percentage"
                  ? "Tỷ lệ hoa hồng (%)"
                  : "Số tiền hoa hồng (VNĐ)"
              }
              name="commission_rate"
              rules={[
                {
                  required: true,
                  message: "Vui lòng nhập tỷ lệ/số tiền hoa hồng",
                },
              ]}
            >
              <InputNumber
                min={0}
                max={commissionType === "percentage" ? 100 : undefined}
                step={commissionType === "percentage" ? 0.1 : 10000}
                formatter={(value) =>
                  commissionType === "percentage"
                    ? `${value}`
                    : `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                }
                parser={(value) => value!.replace(/\$\s?|(,*)/g, "")}
                style={{ width: "100%" }}
              />
            </Form.Item>
          )}

          <Form.Item label="Ngưỡng tối thiểu (VNĐ)" name="min_threshold">
            <InputNumber
              placeholder="KPI tối thiểu để nhận hoa hồng"
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => value!.replace(/\$\s?|(,*)/g, "")}
              style={{ width: "100%" }}
              min={0}
            />
          </Form.Item>

          <Form.Item label="Hoa hồng tối đa (VNĐ)" name="max_commission">
            <InputNumber
              placeholder="Giới hạn hoa hồng tối đa trong kỳ"
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => value!.replace(/\$\s?|(,*)/g, "")}
              style={{ width: "100%" }}
              min={0}
            />
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

        {commissionType === "tiered" && (
          <Card
            title="Cấu hình bậc thang hoa hồng"
            size="small"
            extra={
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddTier}
                size="small"
              >
                Thêm bậc
              </Button>
            }
          >
            {tiers.length === 0 ? (
              <Text type="secondary">
                Chưa có bậc nào. Nhấn "Thêm bậc" để thêm mới.
              </Text>
            ) : (
              <Table
                columns={tierColumns}
                dataSource={tiers}
                rowKey="id"
                pagination={false}
                size="small"
              />
            )}
          </Card>
        )}
      </Form>
    </Modal>
  );
};

export default CommissionPolicyFormModal;
