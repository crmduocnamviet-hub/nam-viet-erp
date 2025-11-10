import React, { useState, useEffect } from "react";
import {
  Button,
  App,
  Form,
  Input,
  InputNumber,
  Switch,
  Card,
  Row,
  Col,
  Space,
  Alert,
  Divider,
  Select,
} from "antd";
import {
  SaveOutlined,
  HomeOutlined,
  GiftOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import PageLayout from "../../components/PageLayout";
import {
  createPointRule,
  getPointRuleById,
  updatePointRule,
  getWarehouse,
} from "@nam-viet-erp/services";
// IWarehouse is a global type from types/index.d.ts

// Helper function to safely get error message
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    return (error as any).message;
  }

  return "An unknown error occurred";
};

const PointRuleDetailPage: React.FC = () => {
  const { notification } = App.useApp();
  const [form] = Form.useForm();
  const params = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [pointRule, setPointRule] = useState<IPointRule | null>(null);
  const [warehouses, setWarehouses] = useState<IWarehouse[]>([]);
  const [appliesToAllBranches, setAppliesToAllBranches] = useState(true);

  const isCreating = !params.id;

  useEffect(() => {
    const fetchWarehouses = async () => {
      const { data, error } = await getWarehouse();
      if (!error && data) {
        setWarehouses(data);
      }
    };
    fetchWarehouses();
  }, []);

  useEffect(() => {
    if (!isCreating && params.id) {
      const fetchPointRuleDetail = async () => {
        setLoading(true);
        try {
          const { data, error } = await getPointRuleById(Number(params.id));
          if (error) throw error;
          if (data) {
            setPointRule(data);
            setAppliesToAllBranches(data.applies_to_all_branches);
            form.setFieldsValue({
              ...data,
              warehouse_ids: data.warehouse_ids || [],
            });
          }
        } catch (error: unknown) {
          notification.error({
            message: "Lỗi tải dữ liệu",
            description: getErrorMessage(error),
          });
        } finally {
          setLoading(false);
        }
      };
      fetchPointRuleDetail();
    } else {
      // Set default values for new rule
      form.setFieldsValue({
        is_active: true,
        is_default: false,
        applies_to_all_branches: true,
        accumulation_spend_amount: 100000,
        accumulation_points_earned: 1,
        redemption_points_required: 25,
        redemption_voucher_value: 25000,
        voucher_validity_days: 30,
        voucher_min_points: 10,
      });
      setAppliesToAllBranches(true);
    }
  }, [params.id, isCreating, form, notification]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const record: any = {
        name: values.name,
        description: values.description || null,
        is_active: values.is_active ?? true,
        is_default: values.is_default ?? false,
        accumulation_spend_amount: values.accumulation_spend_amount,
        accumulation_points_earned: values.accumulation_points_earned,
        redemption_points_required: values.redemption_points_required,
        redemption_voucher_value: values.redemption_voucher_value,
        applies_to_all_branches: values.applies_to_all_branches,
        warehouse_ids: values.applies_to_all_branches
          ? [] // Will be converted to null by service
          : values.warehouse_ids && values.warehouse_ids.length > 0
            ? values.warehouse_ids
            : [], // Service will validate and convert to null if empty
        voucher_validity_days: values.voucher_validity_days || 30,
        voucher_min_points: values.voucher_min_points || 10,
        notes: values.notes || null,
      };

      if (isCreating) {
        const { data, error } = await createPointRule(record);
        if (error) throw error;
        notification?.success({
          message: "Tạo quy tắc thành công!",
          duration: 2,
        });
        // Redirect to list page after successful creation
        navigate("/point-rules");
      } else {
        const { error } = await updatePointRule(Number(params.id), record);
        if (error) throw error;
        notification?.success({
          message: "Cập nhật thành công!",
          duration: 2,
        });
        // Redirect to list page after successful update
        navigate("/point-rules");
      }
    } catch (error: unknown) {
      const errorMsg = getErrorMessage(error);
      notification.error({
        message: isCreating ? "Lỗi tạo quy tắc" : "Lỗi cập nhật",
        description: errorMsg,
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString("vi-VN")} ₫`;
  };

  return (
    <PageLayout
      title={
        isCreating ? "Tạo Quy tắc Tích điểm mới" : "Chỉnh sửa Quy tắc Tích điểm"
      }
      extra={
        <Space>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/point-rules")}
          >
            Quay lại danh sách
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSave}
            loading={loading}
            size="large"
          >
            Lưu
          </Button>
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onValuesChange={(changedValues) => {
          if (changedValues.applies_to_all_branches !== undefined) {
            setAppliesToAllBranches(changedValues.applies_to_all_branches);
            if (changedValues.applies_to_all_branches) {
              form.setFieldsValue({ warehouse_ids: [] });
            }
          }
        }}
      >
        <Row gutter={16}>
          {/* Cột 1: Thông tin cơ bản */}
          <Col xs={24} lg={12}>
            <Card title="Thông tin Quy tắc" loading={loading && !isCreating}>
              <Form.Item
                name="name"
                label="Tên quy tắc *"
                rules={[
                  { required: true, message: "Vui lòng nhập tên quy tắc" },
                ]}
              >
                <Input placeholder="Ví dụ: Quy tắc Chung (Mặc định)" />
              </Form.Item>

              <Form.Item name="description" label="Mô tả">
                <Input.TextArea
                  rows={3}
                  placeholder="Mô tả về quy tắc tích điểm này..."
                />
              </Form.Item>

              <Form.Item
                name="is_active"
                label="Trạng thái"
                valuePropName="checked"
                initialValue={true}
              >
                <Switch
                  checkedChildren="Đang bật"
                  unCheckedChildren="Đang tắt"
                />
              </Form.Item>

              <Form.Item
                name="is_default"
                label="Quy tắc mặc định"
                valuePropName="checked"
                initialValue={false}
                tooltip="Quy tắc mặc định sẽ áp dụng cho tất cả chi nhánh khi không có quy tắc riêng"
              >
                <Switch checkedChildren="Mặc định" unCheckedChildren="Không" />
              </Form.Item>
            </Card>
          </Col>

          {/* Cột 2: Quy tắc Tích Điểm */}
          <Col xs={24} lg={12}>
            <Card title="1. Quy tắc Tích Điểm" loading={loading && !isCreating}>
              <Alert
                message="Thiết lập các quy tắc tích và đổi điểm cho khách hàng"
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />

              <Space
                direction="vertical"
                size="large"
                style={{ width: "100%" }}
              >
                <div>
                  <Form.Item
                    name="accumulation_spend_amount"
                    label="Số tiền chi tiêu"
                    rules={[
                      { required: true, message: "Vui lòng nhập số tiền" },
                      {
                        type: "number",
                        min: 1,
                        message: "Số tiền phải lớn hơn 0",
                      },
                    ]}
                  >
                    <InputNumber
                      style={{ width: "100%" }}
                      formatter={(value) =>
                        `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                      }
                      parser={(value) => value!.replace(/\$\s?|(,*)/g, "")}
                      placeholder="100,000"
                      addonAfter="VND"
                    />
                  </Form.Item>
                </div>

                <div>
                  <Form.Item
                    name="accumulation_points_earned"
                    label="Số điểm"
                    rules={[
                      { required: true, message: "Vui lòng nhập số điểm" },
                      {
                        type: "number",
                        min: 1,
                        message: "Số điểm phải lớn hơn 0",
                      },
                    ]}
                  >
                    <InputNumber
                      style={{ width: "100%" }}
                      min={1}
                      placeholder="1"
                      addonAfter="điểm"
                    />
                  </Form.Item>
                </div>

                <Form.Item
                  shouldUpdate={(prev, curr) =>
                    prev.accumulation_spend_amount !==
                      curr.accumulation_spend_amount ||
                    prev.accumulation_points_earned !==
                      curr.accumulation_points_earned
                  }
                >
                  {({ getFieldValue }) => (
                    <Alert
                      message={`Ví dụ: ${getFieldValue("accumulation_spend_amount") || 100000} ₫ chi tiêu = ${getFieldValue("accumulation_points_earned") || 1} điểm.`}
                      type="info"
                      style={{ marginTop: 8 }}
                    />
                  )}
                </Form.Item>
              </Space>
            </Card>
          </Col>
        </Row>

        <Row gutter={16} style={{ marginTop: 16 }}>
          {/* Cột 3: Quy tắc Đổi Điểm */}
          <Col xs={24} lg={12}>
            <Card title="2. Quy tắc Đổi Điểm" loading={loading && !isCreating}>
              <Space
                direction="vertical"
                size="large"
                style={{ width: "100%" }}
              >
                <Form.Item
                  name="redemption_points_required"
                  label="Số điểm cần để đổi"
                  rules={[
                    { required: true, message: "Vui lòng nhập số điểm" },
                    {
                      type: "number",
                      min: 1,
                      message: "Số điểm phải lớn hơn 0",
                    },
                  ]}
                >
                  <InputNumber
                    style={{ width: "100%" }}
                    min={1}
                    placeholder="25"
                    addonAfter="điểm"
                  />
                </Form.Item>

                <Form.Item
                  name="redemption_voucher_value"
                  label="Giá trị voucher"
                  rules={[
                    {
                      required: true,
                      message: "Vui lòng nhập giá trị voucher",
                    },
                    {
                      type: "number",
                      min: 1,
                      message: "Giá trị phải lớn hơn 0",
                    },
                  ]}
                >
                  <InputNumber
                    style={{ width: "100%" }}
                    formatter={(value) =>
                      `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                    }
                    parser={(value) => value!.replace(/\$\s?|(,*)/g, "")}
                    placeholder="25,000"
                    addonAfter="VND"
                  />
                </Form.Item>

                <Form.Item
                  shouldUpdate={(prev, curr) =>
                    prev.redemption_points_required !==
                      curr.redemption_points_required ||
                    prev.redemption_voucher_value !==
                      curr.redemption_voucher_value
                  }
                >
                  {({ getFieldValue }) => (
                    <Alert
                      message={`Ví dụ: ${getFieldValue("redemption_points_required") || 25} điểm = ${formatCurrency(getFieldValue("redemption_voucher_value") || 25000)}`}
                      type="info"
                    />
                  )}
                </Form.Item>
              </Space>
            </Card>
          </Col>

          {/* Cột 4: Chi nhánh & Voucher */}
          <Col xs={24} lg={12}>
            <Card
              title="3. Chi Nhánh & Voucher"
              loading={loading && !isCreating}
            >
              <Form.Item
                name="applies_to_all_branches"
                label="Áp dụng cho"
                valuePropName="checked"
                initialValue={true}
              >
                <Switch
                  checkedChildren="Tất cả chi nhánh"
                  unCheckedChildren="Chi nhánh cụ thể"
                />
              </Form.Item>

              {!appliesToAllBranches && (
                <Form.Item
                  name="warehouse_ids"
                  label="Chọn chi nhánh"
                  rules={[
                    {
                      required: !appliesToAllBranches,
                      message: "Vui lòng chọn ít nhất một chi nhánh",
                    },
                  ]}
                >
                  <Select
                    mode="multiple"
                    style={{ width: "100%" }}
                    placeholder="Chọn chi nhánh áp dụng"
                    options={warehouses.map((w) => ({
                      value: w.id,
                      label: w.name,
                    }))}
                  />
                </Form.Item>
              )}

              <Divider />

              <Form.Item
                name="voucher_validity_days"
                label="Thời gian hiệu lực voucher (ngày)"
                rules={[
                  { required: true, message: "Vui lòng nhập số ngày" },
                  { type: "number", min: 1, message: "Số ngày phải lớn hơn 0" },
                ]}
                tooltip="Số ngày voucher có hiệu lực sau khi khách hàng đổi điểm"
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={1}
                  placeholder="30"
                  addonAfter="ngày"
                />
              </Form.Item>

              <Form.Item
                name="voucher_min_points"
                label="Điểm tối thiểu để đổi"
                rules={[
                  { required: true, message: "Vui lòng nhập điểm tối thiểu" },
                  {
                    type: "number",
                    min: 1,
                    message: "Điểm tối thiểu phải lớn hơn 0",
                  },
                ]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={1}
                  placeholder="10"
                  addonAfter="điểm"
                />
              </Form.Item>
            </Card>
          </Col>
        </Row>

        <Row gutter={16} style={{ marginTop: 16 }}>
          <Col xs={24}>
            <Card title="Ghi chú" loading={loading && !isCreating}>
              <Form.Item name="notes" label="Ghi chú nội bộ">
                <Input.TextArea
                  rows={3}
                  placeholder="Ghi chú về quy tắc này (chỉ nhân viên mới thấy)..."
                />
              </Form.Item>
            </Card>
          </Col>
        </Row>
      </Form>
    </PageLayout>
  );
};

export default PointRuleDetailPage;
