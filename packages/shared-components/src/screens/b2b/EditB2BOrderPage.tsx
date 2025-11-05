import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Card,
  Button,
  Form,
  Input,
  Row,
  Col,
  DatePicker,
  Select,
  Tag,
  Typography,
  Divider,
  Alert,
  Space,
  App,
  Spin,
} from "antd";
import {
  ArrowLeftOutlined,
  SaveOutlined,
  CheckCircleOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  getB2BQuoteById,
  updateB2BQuote,
  getEmployees,
  submitMoneyToAccountant,
  unsubmitMoneyToAccountant,
} from "@nam-viet-erp/services";
import {
  B2B_ORDER_STAGES,
  DELIVERY_STATUSES,
  INVENTORY_STATUSES,
  SALE_STATUSES,
} from "../../constants/b2b";
import {
  isSuperAdmin,
  canEditB2BOrderStatus,
  getAllowedB2BStatuses,
} from "../../utils/permissions";

const { Title, Text } = Typography;

interface EditB2BOrderPageProps {
  employee?: IEmployee | null;
  user?: any | null;
}

const EditB2BOrderPage: React.FC<EditB2BOrderPageProps> = ({
  employee,
  user,
}) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { notification, modal: antModal } = App.useApp();
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(false);
  const [submittingMoney, setSubmittingMoney] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<IB2BQuote | null>(null);
  const [employees, setEmployees] = useState<IEmployee[]>([]);

  // Permission checks using employee role
  const userPermissions = user?.permissions || employee?.permissions || [];
  const isSalesStaff = employee?.role_name === "sales-staff";
  const isInventoryStaff = employee?.role_name === "inventory-staff";
  const isDeliveryStaff = employee?.role_name === "delivery-staff";

  // Payment Status
  const B2B_PAYMENT_STATUS = [
    {
      key: "unpaid",
      title: "Chưa thanh toán",
      color: "red",
    },
    {
      key: "partial",
      title: "Thanh toán một phần",
      color: "orange",
    },
    {
      key: "paid",
      title: "✅ Hoàn tất",
      color: "green",
    },
    {
      key: "overdue",
      title: "Quá hạn",
      color: "volcano",
    },
  ];

  // Get allowed statuses based on employee role and current order status
  const getAllowedStatuses = (currentStatus?: string) => {
    const allowedStatusKeys = getAllowedB2BStatuses(employee, currentStatus);

    // Filter B2B_ORDER_STAGES to only include allowed statuses
    return B2B_ORDER_STAGES.filter((stage) =>
      allowedStatusKeys.includes(stage.key),
    );
  };

  // Check if employee can edit the current order status
  const canEditOrderStatus = (currentStatus: string) => {
    return canEditB2BOrderStatus(employee, currentStatus);
  };

  // Check if order is in delivery stage (shipping or completed)
  const isDeliveryStage =
    selectedOrder?.quote_stage === "shipping" ||
    selectedOrder?.quote_stage === "completed";

  // Check if money already submitted
  const isMoneySubmitted =
    selectedOrder?.money_submitted_to_accountant === true;

  // Load order data
  useEffect(() => {
    const loadOrder = async () => {
      if (!id) return;

      setLoading(true);
      try {
        const { data, error } = await getB2BQuoteById(id);

        if (error || !data) {
          notification.error({
            message: "Lỗi",
            description: "Không thể tải thông tin đơn hàng",
          });
          navigate("/b2b-orders");
          return;
        }

        setSelectedOrder(data);

        // Populate form with order data
        form.setFieldsValue({
          customer_name: data.customer_name,
          customer_code: data.customer_code,
          contact_person: data.customer_contact_person,
          customer_phone: data.customer_phone,
          customer_email: data.customer_email,
          customer_address: data.customer_address,
          quote_stage: data.quote_stage,
          payment_status: data.payment_status,
          discount_percent: data.discount_percent,
          tax_percent: data.tax_percent,
          valid_until: data.valid_until ? dayjs(data.valid_until) : null,
          notes: data.notes,
          terms_conditions: data.terms_conditions,
          warehouse_employee_id: data.warehouse_employee_id,
          delivery_employee_id: data.delivery_employee_id,
        });
      } catch (error: any) {
        notification.error({
          message: "Lỗi",
          description: error.message || "Có lỗi xảy ra khi tải đơn hàng",
        });
        navigate("/b2b-orders");
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [id, navigate, notification]);

  // Load employees for assignment
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const { data, error } = await getEmployees({ isActive: true });
        if (error) {
          console.error("Error loading employees:", error);
        } else {
          setEmployees(data || []);
        }
      } catch (error) {
        console.error("Error loading employees:", error);
      }
    };
    loadEmployees();
  }, []);

  // Handle submit money to accountant
  const handleSubmitMoney = async () => {
    antModal.confirm({
      title: "Xác nhận đã nộp tiền cho kế toán",
      content: (
        <div>
          <p>Bạn xác nhận đã nộp tiền thu được từ đơn hàng này cho kế toán?</p>
          <p>
            <strong>Đơn hàng:</strong> {selectedOrder?.quote_number}
          </p>
          <p>
            <strong>Tổng tiền:</strong>{" "}
            {selectedOrder?.total_value?.toLocaleString()} VND
          </p>
        </div>
      ),
      okText: "Xác nhận",
      cancelText: "Hủy",
      onOk: async () => {
        if (!selectedOrder) return;

        setSubmittingMoney(true);
        try {
          const currentEmployeeId =
            selectedOrder?.delivery_employee_id || employee?.employee_id;

          if (!currentEmployeeId) {
            notification.error({
              message: "Lỗi",
              description: "Không tìm thấy thông tin nhân viên",
            });
            return;
          }

          await submitMoneyToAccountant(selectedOrder?.quote_id, {
            submitted_by: currentEmployeeId,
            note: `Đã nộp tiền từ đơn hàng ${selectedOrder?.quote_number}`,
          });

          notification.success({
            message: "Đã xác nhận nộp tiền",
            description: "Đã ghi nhận việc nộp tiền cho kế toán thành công.",
          });

          // Reload order data
          const { data } = await getB2BQuoteById(selectedOrder.quote_id);
          if (data) {
            setSelectedOrder(data);
          }
        } catch (error: any) {
          notification.error({
            message: "Lỗi",
            description: error.message || "Không thể xác nhận nộp tiền.",
          });
        } finally {
          setSubmittingMoney(false);
        }
      },
    });
  };

  // Handle unsubmit money
  const handleUnsubmitMoney = async () => {
    antModal.confirm({
      title: "Hủy xác nhận nộp tiền",
      content: "Bạn có chắc muốn hủy xác nhận nộp tiền cho kế toán?",
      okText: "Xác nhận hủy",
      cancelText: "Hủy",
      okType: "danger",
      onOk: async () => {
        if (!selectedOrder) return;

        setSubmittingMoney(true);
        try {
          await unsubmitMoneyToAccountant(selectedOrder?.quote_id);

          notification.success({
            message: "Đã hủy xác nhận",
            description: "Đã hủy xác nhận nộp tiền.",
          });

          // Reload order data
          const { data } = await getB2BQuoteById(selectedOrder.quote_id);
          if (data) {
            setSelectedOrder(data);
          }
        } catch (error: any) {
          notification.error({
            message: "Lỗi",
            description: error.message || "Không thể hủy xác nhận.",
          });
        } finally {
          setSubmittingMoney(false);
        }
      },
    });
  };

  // Handle save changes
  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      if (!selectedOrder?.quote_id) {
        notification.error({
          message: "Lỗi",
          description: "Không tìm thấy thông tin báo giá",
        });
        return;
      }

      setLoading(true);

      const updateData = {
        customer_name: values.customer_name,
        customer_code: values.customer_code,
        customer_contact_person: values.contact_person,
        customer_phone: values.customer_phone,
        customer_email: values.customer_email,
        customer_address: values.customer_address,
        quote_stage: values.quote_stage,
        payment_status: values.payment_status,
        discount_percent: values.discount_percent || 0,
        tax_percent: values.tax_percent || 0,
        valid_until: values.valid_until
          ? dayjs(values.valid_until).format("YYYY-MM-DD")
          : null,
        notes: values.notes,
        terms_conditions: values.terms_conditions,
        warehouse_employee_id: values.warehouse_employee_id || null,
        delivery_employee_id: values.delivery_employee_id || null,
      };

      const { data: updatedQuote, error } = await updateB2BQuote(
        selectedOrder.quote_id,
        updateData,
      );

      if (error) {
        throw new Error(error.message);
      }

      if (updatedQuote) {
        notification.success({
          message: "Thành công",
          description: "Cập nhật báo giá thành công",
        });
        navigate("/b2b-orders");
      }
    } catch (error: any) {
      console.error("Error updating quote:", error);
      notification.error({
        message: "Lỗi cập nhật báo giá",
        description: error.message || "Không thể cập nhật báo giá",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle back navigation
  const handleBack = () => {
    navigate("/b2b-orders");
  };

  if (loading && !selectedOrder) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <Spin size="large" tip="Đang tải thông tin đơn hàng..." />
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
              Quay lại
            </Button>
            <Title level={2} style={{ margin: 0 }}>
              Chỉnh sửa đơn hàng {selectedOrder?.quote_number}
            </Title>
          </Space>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSave}
            loading={loading}
            size="large"
          >
            Lưu thay đổi
          </Button>
        </Col>
      </Row>

      {/* Warning if user cannot edit */}
      {selectedOrder && !canEditOrderStatus(selectedOrder.quote_stage) && (
        <Alert
          message="Cảnh báo"
          description="Trạng thái này thuộc phạm vi quản lý của bộ phận khác. Bạn chỉ có thể xem thông tin."
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Main Form */}
      <Card>
        <Form layout="vertical" form={form}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="customer_name"
                label="Tên khách hàng"
                rules={[
                  { required: true, message: "Vui lòng nhập tên khách hàng" },
                ]}
              >
                <Input
                  placeholder="Nhập tên khách hàng"
                  disabled={isInventoryStaff}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="customer_code" label="Mã khách hàng">
                <Input
                  placeholder="Mã khách hàng (tùy chọn)"
                  disabled={isInventoryStaff}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="quote_stage"
                label={
                  <span>
                    Trạng thái đơn hàng
                    {isSuperAdmin(employee) && (
                      <Tag color="gold" style={{ marginLeft: 8 }}>
                        Super Admin - Full Access
                      </Tag>
                    )}
                    {!isSuperAdmin(employee) && isSalesStaff && (
                      <Tag color="blue" style={{ marginLeft: 8 }}>
                        Sales
                      </Tag>
                    )}
                    {!isSuperAdmin(employee) && isInventoryStaff && (
                      <Tag color="orange" style={{ marginLeft: 8 }}>
                        Kho
                      </Tag>
                    )}
                    {!isSuperAdmin(employee) && isDeliveryStaff && (
                      <Tag color="green" style={{ marginLeft: 8 }}>
                        Giao hàng
                      </Tag>
                    )}
                    {selectedOrder &&
                      !isSuperAdmin(employee) &&
                      !canEditOrderStatus(selectedOrder.quote_stage) && (
                        <Tag color="red" style={{ marginLeft: 8 }}>
                          Chỉ đọc
                        </Tag>
                      )}
                  </span>
                }
                rules={[
                  { required: true, message: "Vui lòng chọn trạng thái" },
                ]}
              >
                <Select
                  placeholder="Chọn trạng thái đơn hàng"
                  disabled={
                    selectedOrder
                      ? !canEditOrderStatus(selectedOrder.quote_stage)
                      : false
                  }
                >
                  {getAllowedStatuses(selectedOrder?.quote_stage).map(
                    (stage) => (
                      <Select.Option key={stage.key} value={stage.key}>
                        <Tag color={stage.color}>{stage.title}</Tag> -{" "}
                        {stage.description}
                      </Select.Option>
                    ),
                  )}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="valid_until"
                label="Ngày hết hạn báo giá"
                rules={[
                  { required: true, message: "Vui lòng chọn ngày hết hạn" },
                ]}
              >
                <DatePicker
                  style={{ width: "100%" }}
                  placeholder="Chọn ngày hết hạn"
                  disabled={isInventoryStaff}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="payment_status"
                label="Trạng thái thanh toán"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng chọn trạng thái thanh toán",
                  },
                ]}
              >
                <Select
                  placeholder="Chọn trạng thái thanh toán"
                  disabled={isInventoryStaff}
                >
                  {B2B_PAYMENT_STATUS.map((status) => (
                    <Select.Option key={status.key} value={status.key}>
                      <Tag color={status.color}>{status.title}</Tag>
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="discount_percent" label="Chiết khấu (%)">
                <Input
                  placeholder="0"
                  suffix="%"
                  type="number"
                  min={0}
                  max={100}
                  disabled={isInventoryStaff}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="tax_percent" label="Thuế (%)">
                <Input
                  placeholder="0"
                  suffix="%"
                  type="number"
                  min={0}
                  max={100}
                  disabled={isInventoryStaff}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="contact_person" label="Người liên hệ">
                <Input
                  placeholder="Tên người liên hệ"
                  disabled={isInventoryStaff}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="customer_phone" label="Số điện thoại">
                <Input
                  placeholder="Số điện thoại liên hệ"
                  disabled={isInventoryStaff}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="warehouse_employee_id" label="Nhân viên kho">
                <Select
                  placeholder="Chọn nhân viên kho"
                  allowClear
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    (option?.label ?? "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  options={employees.map((emp) => ({
                    value: emp.employee_id,
                    label: `${emp.full_name}${emp.employee_code ? ` (${emp.employee_code})` : ""}`,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="delivery_employee_id"
                label="Nhân viên giao hàng"
              >
                <Select
                  placeholder="Chọn nhân viên giao hàng"
                  allowClear
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    (option?.label ?? "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  options={employees.map((emp) => ({
                    value: emp.employee_id,
                    label: `${emp.full_name}${emp.employee_code ? ` (${emp.employee_code})` : ""}`,
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Money Submission Section - Only for Delivery Staff */}
          {isDeliveryStaff && isDeliveryStage && (
            <>
              <Divider orientation="left">
                <Space>
                  <DollarOutlined />
                  <Text strong>Nộp tiền cho Kế toán</Text>
                </Space>
              </Divider>

              {isMoneySubmitted ? (
                <Alert
                  message="Đã nộp tiền cho kế toán"
                  description={
                    <div>
                      <p>
                        <strong>Thời gian nộp:</strong>{" "}
                        {selectedOrder?.money_submitted_at
                          ? new Date(
                              selectedOrder.money_submitted_at,
                            ).toLocaleString("vi-VN")
                          : "N/A"}
                      </p>
                      {selectedOrder?.money_submitted_note && (
                        <p>
                          <strong>Ghi chú:</strong>{" "}
                          {selectedOrder.money_submitted_note}
                        </p>
                      )}
                      <Button
                        danger
                        size="small"
                        onClick={handleUnsubmitMoney}
                        loading={submittingMoney}
                        style={{ marginTop: 8 }}
                      >
                        Hủy xác nhận
                      </Button>
                    </div>
                  }
                  type="success"
                  showIcon
                  icon={<CheckCircleOutlined />}
                  style={{ marginBottom: 16 }}
                />
              ) : (
                <Card
                  size="small"
                  style={{ marginBottom: 16, backgroundColor: "#f0f5ff" }}
                >
                  <Space direction="vertical" style={{ width: "100%" }}>
                    <Text>
                      Nhân viên giao hàng chưa xác nhận đã nộp tiền cho kế toán.
                    </Text>
                    <Button
                      type="primary"
                      icon={<CheckCircleOutlined />}
                      onClick={handleSubmitMoney}
                      loading={submittingMoney}
                      block
                    >
                      Xác nhận đã nộp tiền
                    </Button>
                  </Space>
                </Card>
              )}
            </>
          )}

          <Form.Item name="customer_email" label="Email">
            <Input
              placeholder="Email khách hàng"
              type="email"
              disabled={isInventoryStaff}
            />
          </Form.Item>
          <Form.Item name="customer_address" label="Địa chỉ">
            <Input.TextArea
              rows={2}
              placeholder="Địa chỉ khách hàng"
              disabled={isInventoryStaff}
            />
          </Form.Item>
          <Form.Item name="notes" label="Ghi chú">
            <Input.TextArea
              rows={3}
              placeholder="Thêm ghi chú cho báo giá..."
              disabled={isInventoryStaff}
            />
          </Form.Item>
          <Form.Item name="terms_conditions" label="Điều khoản & Điều kiện">
            <Input.TextArea
              rows={3}
              placeholder="Điều khoản và điều kiện..."
              disabled={isInventoryStaff}
            />
          </Form.Item>
        </Form>
      </Card>

      {/* Footer Actions */}
      <Row
        justify="space-between"
        align="middle"
        style={{
          marginTop: 24,
          paddingTop: 16,
          borderTop: "1px solid #f0f0f0",
        }}
      >
        <Col>
          <Button onClick={handleBack}>Hủy</Button>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSave}
            loading={loading}
            size="large"
          >
            Lưu thay đổi
          </Button>
        </Col>
      </Row>
    </div>
  );
};

export default EditB2BOrderPage;
