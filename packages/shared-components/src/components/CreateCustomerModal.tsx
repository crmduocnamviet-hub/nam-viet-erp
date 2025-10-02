import React from "react";
import {
  Modal,
  Button,
  Form,
  Input,
  Row,
  Col,
  Select,
} from "antd";

interface CreateCustomerModalProps {
  open: boolean;
  onCancel: () => void;
  form: any;
  onCreateCustomer: (values: any) => Promise<void>;
}

const CreateCustomerModal: React.FC<CreateCustomerModalProps> = ({
  open,
  onCancel,
  form,
  onCreateCustomer,
}) => {
  return (
    <Modal
      title="Tạo khách hàng B2B mới"
      open={open}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Hủy
        </Button>,
        <Button
          key="create"
          type="primary"
          onClick={async () => {
            try {
              const values = await form.validateFields();
              onCreateCustomer(values);
            } catch (error) {
              console.error("Validation failed:", error);
            }
          }}
        >
          Tạo khách hàng
        </Button>,
      ]}
      width={700}
    >
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
              <Input placeholder="Nhập tên khách hàng" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="customer_code"
              label="Mã khách hàng"
              rules={[
                { required: true, message: "Vui lòng nhập mã khách hàng" },
              ]}
            >
              <Input placeholder="Nhập mã khách hàng" />
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
            <Form.Item name="phone_number" label="Số điện thoại">
              <Input placeholder="Số điện thoại liên hệ" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="email" label="Email">
              <Input placeholder="Email khách hàng" type="email" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="customer_type"
              label="Loại khách hàng"
              rules={[
                { required: true, message: "Vui lòng chọn loại khách hàng" },
              ]}
            >
              <Select placeholder="Chọn loại khách hàng">
                <Select.Option value="hospital">Bệnh viện</Select.Option>
                <Select.Option value="pharmacy">Nhà thuốc</Select.Option>
                <Select.Option value="clinic">Phòng khám</Select.Option>
                <Select.Option value="distributor">
                  Nhà phân phối
                </Select.Option>
                <Select.Option value="other">Khác</Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="address" label="Địa chỉ">
          <Input.TextArea rows={2} placeholder="Địa chỉ khách hàng" />
        </Form.Item>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="tax_code" label="Mã số thuế">
              <Input placeholder="Mã số thuế" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="payment_terms_days"
              label="Thời hạn thanh toán (ngày)"
              initialValue={30}
            >
              <Input placeholder="30" type="number" min={1} max={365} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="credit_limit" label="Hạn mức tín dụng">
              <Input placeholder="0" type="number" min={0} suffix="VND" />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default CreateCustomerModal;