import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  InputNumber,
  Statistic,
  Row,
  Col,
  Typography,
} from "antd";

const { Text } = Typography;

interface PaymentModalProps {
  open: boolean;
  paymentMethod: "cash" | "card" | "qr";
  cartTotal: number;
  onCancel: () => void;
  onFinish: (values: any) => void;
  okButtonProps?: any;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  open,
  paymentMethod,
  cartTotal,
  onCancel,
  onFinish,
  okButtonProps,
}) => {
  const [form] = Form.useForm();
  const [customerCash, setCustomerCash] = useState<number>(0);

  const change = customerCash > cartTotal ? customerCash - cartTotal : 0;

  useEffect(() => {
    if (open) {
      form.resetFields();
      setCustomerCash(0);
    }
  }, [open, form]);

  const getTitle = () => {
    switch (paymentMethod) {
      case "cash":
        return "Thanh toán Tiền mặt";
      case "card":
        return "Thanh toán Thẻ";
      case "qr":
        return "Thanh toán bằng Mã QR";
      default:
        return "Thanh toán";
    }
  };

  return (
    <Modal
      title={getTitle()}
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      okText="Xác nhận Thanh toán"
      destroyOnClose
      okButtonProps={okButtonProps}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        style={{ paddingTop: 24 }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Statistic title="Tổng tiền hàng" value={cartTotal} suffix="VNĐ" />
          </Col>
          {paymentMethod === "cash" && (
            <Col span={12}>
              <Statistic
                title="Tiền thối lại"
                value={change}
                suffix="VNĐ"
                valueStyle={{ color: "#3f8600" }}
              />
            </Col>
          )}
        </Row>

        {paymentMethod === "cash" && (
          <Form.Item
            name="customer_cash"
            label="Số tiền khách đưa"
            rules={[{ required: true, message: "Vui lòng nhập số tiền" }]}
          >
            <InputNumber
              style={{
                width: "100%",
                marginTop: 16,
                fontSize: "1.5rem",
                height: 50,
                paddingTop: 10,
              }}
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
              }
              parser={(value) => Number(value!.replace(/\./g, ""))}
              onChange={(value) => setCustomerCash(value || 0)}
              autoFocus
            />
          </Form.Item>
        )}

        {paymentMethod === "card" && (
          <Text style={{ marginTop: 16, display: "block" }}>
            Vui lòng quẹt thẻ qua máy POS.
          </Text>
        )}

        {paymentMethod === "qr" && (
          <div style={{ textAlign: "center", marginTop: 16 }}>
            {/* QR Code sẽ được hiển thị ở đây */}
            <img
              src={`https://img.vietqr.io/image/970436-0123456789-compact2.png?amount=${cartTotal}&addInfo=Thanh%20toan%20don%20hang`}
              alt="VietQR"
              width={250}
            />
            <Text type="secondary">Quét mã để thanh toán</Text>
          </div>
        )}
      </Form>
    </Modal>
  );
};

export default PaymentModal;
