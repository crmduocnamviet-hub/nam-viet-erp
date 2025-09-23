import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  InputNumber,
  Statistic,
  Row,
  Col,
  Typography,
  Button,
  Space,
  Descriptions,
  Card,
  QRCode,
} from "antd";
import { PrinterOutlined, DownloadOutlined } from '@ant-design/icons';
import type { ButtonProps } from "antd";
import type { PaymentValues, CartItem } from '../../../types';

const { Text } = Typography;

interface PaymentModalProps {
  open: boolean;
  paymentMethod: "cash" | "card" | "qr";
  cartTotal: number;
  cartItems?: CartItem[];
  customerInfo?: any;
  onCancel: () => void;
  onFinish: (values: PaymentValues) => void;
  okButtonProps?: ButtonProps;
  onPrintReceipt?: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  open,
  paymentMethod,
  cartTotal,
  cartItems = [],
  customerInfo,
  onCancel,
  onFinish,
  okButtonProps,
  onPrintReceipt,
}) => {
  const [form] = Form.useForm();
  const [customerCash, setCustomerCash] = useState<number>(0);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);

  const change = customerCash > cartTotal ? customerCash - cartTotal : 0;

  useEffect(() => {
    if (open) {
      form.resetFields();
      setCustomerCash(0);
    }
  }, [open, form]);

  const getTitle = () => {
    if (showReceipt) {
      return "Hóa đơn thanh toán";
    }
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

  const handlePaymentSuccess = (values: PaymentValues) => {
    const receipt = {
      receiptNumber: `HD${Date.now()}`,
      date: new Date().toLocaleString('vi-VN'),
      customer: customerInfo || { full_name: 'Khách vãng lai' },
      items: cartItems,
      total: cartTotal,
      paymentMethod,
      customerCash: paymentMethod === 'cash' ? customerCash : cartTotal,
      change: paymentMethod === 'cash' ? change : 0,
    };
    setReceiptData(receipt);
    setShowReceipt(true);
    onFinish(values);
  };

  const handlePrintReceipt = () => {
    if (onPrintReceipt) {
      onPrintReceipt();
    } else {
      // Default print behavior
      const printWindow = window.open('', '_blank');
      if (printWindow && receiptData) {
        printWindow.document.write(generateReceiptHTML());
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const generateReceiptHTML = () => {
    if (!receiptData) return '';

    return `
      <html>
        <head>
          <title>Hóa đơn - ${receiptData.receiptNumber}</title>
          <style>
            body { font-family: 'Courier New', monospace; padding: 20px; max-width: 400px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px; }
            .item { display: flex; justify-content: space-between; margin: 5px 0; }
            .total { border-top: 2px solid #000; padding-top: 10px; margin-top: 15px; font-weight: bold; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>NAM VIỆT ERP</h2>
            <p>Hóa đơn: ${receiptData.receiptNumber}</p>
            <p>${receiptData.date}</p>
          </div>

          <div>
            <p><strong>Khách hàng:</strong> ${receiptData.customer.full_name}</p>
            ${receiptData.customer.phone_number ? `<p><strong>SĐT:</strong> ${receiptData.customer.phone_number}</p>` : ''}
          </div>

          <div>
            ${receiptData.items.map((item: CartItem) => `
              <div class="item">
                <span>${item.name} x${item.quantity}</span>
                <span>${(item.finalPrice * item.quantity).toLocaleString()}đ</span>
              </div>
              ${item.prescriptionNote ? `<div style="font-size: 12px; color: #666; margin-left: 10px;">📝 ${item.prescriptionNote}</div>` : ''}
            `).join('')}
          </div>

          <div class="total">
            <div class="item">
              <span>Tổng cộng:</span>
              <span>${receiptData.total.toLocaleString()}đ</span>
            </div>
            ${receiptData.paymentMethod === 'cash' ? `
              <div class="item">
                <span>Tiền khách đưa:</span>
                <span>${receiptData.customerCash.toLocaleString()}đ</span>
              </div>
              <div class="item">
                <span>Tiền thối:</span>
                <span>${receiptData.change.toLocaleString()}đ</span>
              </div>
            ` : ''}
          </div>

          <div class="footer">
            <p>Cảm ơn quý khách!</p>
            <p>Hẹn gặp lại!</p>
          </div>
        </body>
      </html>
    `;
  };

  return (
    <Modal
      title={getTitle()}
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      okText="Xác nhận Thanh toán"
      destroyOnHidden
      okButtonProps={showReceipt ? { style: { display: 'none' } } : okButtonProps}
      cancelButtonProps={showReceipt ? { style: { display: 'none' } } : undefined}
    >
      {showReceipt && receiptData ? (
        <div>
          <Card style={{ marginBottom: 16 }}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <Typography.Title level={4}>HÓA ĐƠN THANH TOÁN</Typography.Title>
              <Typography.Text type="secondary">#{receiptData.receiptNumber}</Typography.Text>
            </div>

            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label="Thời gian">{receiptData.date}</Descriptions.Item>
              <Descriptions.Item label="Khách hàng">{receiptData.customer.full_name}</Descriptions.Item>
              {receiptData.customer.phone_number && (
                <Descriptions.Item label="Số điện thoại">{receiptData.customer.phone_number}</Descriptions.Item>
              )}
              <Descriptions.Item label="Phương thức thanh toán">
                {paymentMethod === 'cash' ? 'Tiền mặt' : paymentMethod === 'card' ? 'Thẻ' : 'Chuyển khoản'}
              </Descriptions.Item>
            </Descriptions>

            <div style={{ margin: '16px 0' }}>
              <Typography.Text strong>Chi tiết sản phẩm:</Typography.Text>
              {receiptData.items.map((item: CartItem, index: number) => (
                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <span>{item.name} x{item.quantity}</span>
                  <span>{(item.finalPrice * item.quantity).toLocaleString()}đ</span>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '2px solid #000', paddingTop: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '16px' }}>
                <span>Tổng cộng:</span>
                <span>{receiptData.total.toLocaleString()}đ</span>
              </div>
              {paymentMethod === 'cash' && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                    <span>Tiền khách đưa:</span>
                    <span>{receiptData.customerCash.toLocaleString()}đ</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                    <span>Tiền thối:</span>
                    <span>{receiptData.change.toLocaleString()}đ</span>
                  </div>
                </>
              )}
            </div>
          </Card>

          <Space style={{ width: '100%', justifyContent: 'center' }}>
            <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrintReceipt}>
              In hóa đơn
            </Button>
            <Button icon={<DownloadOutlined />} onClick={() => {
              const blob = new Blob([generateReceiptHTML()], { type: 'text/html' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `hoa-don-${receiptData.receiptNumber}.html`;
              a.click();
            }}>
              Tải về
            </Button>
            <Button onClick={() => {
              setShowReceipt(false);
              onCancel();
            }}>
              Đóng
            </Button>
          </Space>
        </div>
      ) : (
        <Form
          form={form}
          layout="vertical"
          onFinish={handlePaymentSuccess}
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
              }}
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
              }
              parser={(value) => Number(value!.replace(/\./g, ""))}
              onChange={(value) => setCustomerCash(Number(value) || 0)}
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
            <QRCode
              value={`https://img.vietqr.io/image/970436-0123456789-compact2.png?amount=${cartTotal}&addInfo=Thanh%20toan%20don%20hang`}
              size={200}
              style={{ marginBottom: 16 }}
            />
            <br />
            <Text type="secondary">Quét mã để thanh toán {cartTotal.toLocaleString()}đ</Text>
          </div>
        )}
        </Form>
      )}
    </Modal>
  );
};

export default PaymentModal;
