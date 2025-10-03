import React from "react";
import {
  Modal,
  Button,
  Form,
  Input,
  Row,
  Col,
  DatePicker,
  Typography,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";

const { Text } = Typography;

interface CreateQuoteModalProps {
  open: boolean;
  onCancel: () => void;
  form: any;
  onSaveDraft: (values: any) => Promise<void>;
  onSendQuote: (values: any) => Promise<void>;
  onCreateNewCustomer: () => void;
  onCustomerChange: (field: "customer_name" | "customer_code", value: string) => void;
}

const CreateQuoteModal: React.FC<CreateQuoteModalProps> = ({
  open,
  onCancel,
  form,
  onSaveDraft,
  onSendQuote,
  onCreateNewCustomer,
  onCustomerChange,
}) => {
  return (
    <Modal
      title="Tạo báo giá B2B mới"
      open={open}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Hủy
        </Button>,
        <Button
          key="save-draft"
          type="default"
          onClick={async () => {
            try {
              const values = await form.validateFields();
              await onSaveDraft(values);
            } catch (error) {
              console.error("Validation failed:", error);
            }
          }}
        >
          Lưu nháp
        </Button>,
        <Button
          key="send"
          type="primary"
          onClick={async () => {
            try {
              const values = await form.validateFields();
              await onSendQuote(values);
            } catch (error) {
              console.error("Validation failed:", error);
            }
          }}
        >
          Gửi báo giá
        </Button>,
      ]}
      width={800}
    >
      <Form layout="vertical" form={form}>
        <Row gutter={16} align="middle">
          <Col span={24}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <Text strong>Thông tin khách hàng</Text>
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={onCreateNewCustomer}
                size="small"
              >
                Tạo khách hàng mới
              </Button>
            </div>
          </Col>
        </Row>
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
                onBlur={(e) =>
                  onCustomerChange("customer_name", e.target.value)
                }
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="customer_code" label="Mã khách hàng">
              <Input
                placeholder="Mã khách hàng (tùy chọn)"
                onBlur={(e) =>
                  onCustomerChange("customer_code", e.target.value)
                }
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
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
              />
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
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="contact_person" label="Người liên hệ">
              <Input placeholder="Tên người liên hệ" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="customer_phone" label="Số điện thoại">
              <Input placeholder="Số điện thoại liên hệ" />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="customer_email" label="Email">
          <Input placeholder="Email khách hàng" type="email" />
        </Form.Item>
        <Form.Item name="customer_address" label="Địa chỉ">
          <Input.TextArea rows={2} placeholder="Địa chỉ khách hàng" />
        </Form.Item>
        <Form.Item name="notes" label="Ghi chú">
          <Input.TextArea
            rows={3}
            placeholder="Thêm ghi chú cho báo giá..."
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateQuoteModal;