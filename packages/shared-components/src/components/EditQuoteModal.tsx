import React, { useState } from "react";
import {
  Modal,
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
  Card,
  Alert,
  Space,
  App,
} from "antd";
import { CheckCircleOutlined, DollarOutlined } from "@ant-design/icons";

const { Text } = Typography;

interface EditQuoteModalProps {
  open: boolean;
  onCancel: () => void;
  form: any;
  selectedOrder: any | null;
  onUpdateQuote: (values: any) => Promise<void>;
  canEditOrderStatus: (status: string) => boolean;
  getAllowedStatuses: (currentStatus?: string) => any[];
  B2B_PAYMENT_STATUS: any[];
  isSalesStaff: boolean;
  isInventoryStaff: boolean;
  isDeliveryStaff: boolean;
  employees?: IEmployee[];
}

const EditQuoteModal: React.FC<EditQuoteModalProps> = ({
  open,
  onCancel,
  form,
  selectedOrder,
  onUpdateQuote,
  canEditOrderStatus,
  getAllowedStatuses,
  B2B_PAYMENT_STATUS,
  isSalesStaff,
  isInventoryStaff,
  isDeliveryStaff,
  employees = [],
}) => {
  const { notification, modal: antModal } = App.useApp();
  const [submittingMoney, setSubmittingMoney] = useState(false);

  // Check if order is in delivery stage (shipping or completed)
  const isDeliveryStage =
    selectedOrder?.quote_stage === "shipping" ||
    selectedOrder?.quote_stage === "completed";

  // Check if money already submitted
  const isMoneySubmitted =
    selectedOrder?.money_submitted_to_accountant === true;

  const handleSubmitMoney = async () => {
    // Import the service function
    const { submitMoneyToAccountant } = await import("@nam-viet-erp/services");

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
            {selectedOrder?.total_amount?.toLocaleString()} VND
          </p>
        </div>
      ),
      okText: "Xác nhận",
      cancelText: "Hủy",
      onOk: async () => {
        setSubmittingMoney(true);
        try {
          // Get current user/employee ID - you might need to get this from props or context
          const currentEmployeeId = selectedOrder?.delivery_employee_id; // or from current user

          await submitMoneyToAccountant(selectedOrder?.quote_id, {
            submitted_by: currentEmployeeId,
            note: `Đã nộp tiền từ đơn hàng ${selectedOrder?.quote_number}`,
          });

          notification.success({
            message: "Đã xác nhận nộp tiền",
            description: "Đã ghi nhận việc nộp tiền cho kế toán thành công.",
          });

          // Refresh the order data
          onCancel(); // Close modal to trigger refresh
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

  const handleUnsubmitMoney = async () => {
    const { unsubmitMoneyToAccountant } = await import(
      "@nam-viet-erp/services"
    );

    antModal.confirm({
      title: "Hủy xác nhận nộp tiền",
      content: "Bạn có chắc muốn hủy xác nhận nộp tiền cho kế toán?",
      okText: "Xác nhận hủy",
      cancelText: "Hủy",
      okType: "danger",
      onOk: async () => {
        setSubmittingMoney(true);
        try {
          await unsubmitMoneyToAccountant(selectedOrder?.quote_id);

          notification.success({
            message: "Đã hủy xác nhận",
            description: "Đã hủy xác nhận nộp tiền.",
          });

          onCancel();
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

  return (
    <Modal
      title={`Chỉnh sửa báo giá ${selectedOrder?.quote_number}`}
      open={open}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Hủy
        </Button>,
        <Button
          key="update"
          type="primary"
          onClick={async () => {
            try {
              const values = await form.validateFields();
              await onUpdateQuote(values);
            } catch (error) {
              console.error("Validation failed:", error);
            }
          }}
        >
          Cập nhật
        </Button>,
      ]}
      width={800}
    >
      {selectedOrder && !canEditOrderStatus(selectedOrder.quote_stage) && (
        <div
          style={{
            backgroundColor: "#fff7e6",
            border: "1px solid #ffd591",
            borderRadius: "6px",
            padding: "12px",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
          }}
        >
          <span style={{ color: "#fa8c16", marginRight: "8px" }}>⚠️</span>
          <span style={{ color: "#ad6800" }}>
            Trạng thái này thuộc phạm vi quản lý của bộ phận khác. Bạn chỉ có
            thể xem thông tin.
          </span>
        </div>
      )}
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
                  {isSalesStaff && (
                    <Tag color="blue" style={{ marginLeft: 8 }}>
                      Sales
                    </Tag>
                  )}
                  {isInventoryStaff && (
                    <Tag color="orange" style={{ marginLeft: 8 }}>
                      Kho
                    </Tag>
                  )}
                  {isDeliveryStaff && (
                    <Tag color="green" style={{ marginLeft: 8 }}>
                      Giao hàng
                    </Tag>
                  )}
                  {selectedOrder &&
                    !canEditOrderStatus(selectedOrder.quote_stage) && (
                      <Tag color="red" style={{ marginLeft: 8 }}>
                        Chỉ đọc
                      </Tag>
                    )}
                </span>
              }
              rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}
            >
              <Select
                placeholder="Chọn trạng thái đơn hàng"
                disabled={
                  selectedOrder
                    ? !canEditOrderStatus(selectedOrder.quote_stage)
                    : false
                }
              >
                {getAllowedStatuses(selectedOrder?.quote_stage).map((stage) => (
                  <Select.Option key={stage.key} value={stage.key}>
                    <Tag color={stage.color}>{stage.title}</Tag> -{" "}
                    {stage.description}
                  </Select.Option>
                ))}
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
            <Form.Item name="delivery_employee_id" label="Nhân viên giao hàng">
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
    </Modal>
  );
};

export default EditQuoteModal;
