import React from "react";
import {
  Modal,
  Button,
  Space,
  Card,
  Row,
  Col,
  Descriptions,
  Table,
  Typography,
  Tag,
} from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";

const { Text, Paragraph } = Typography;

interface OrderItem {
  key: string;
  product_id: number;
  product_name: string;
  unit_price: number;
  quantity: number;
  total_price: number;
  packaging?: string;
  unit?: string;
}

interface OrderTotals {
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
}

interface OrderSummary {
  quote_number: string;
  customer_name: string;
  customer_code?: string;
  customer_phone: string;
  customer_email?: string;
  customer_address: string;
  delivery_address?: string;
  created_at: string;
  items: OrderItem[];
  totals: OrderTotals;
}

interface B2BOrderPreviewModalProps {
  visible: boolean;
  onClose: () => void;
  orderSummary: OrderSummary | null;
  isMobile?: boolean;
}

const B2BOrderPreviewModal: React.FC<B2BOrderPreviewModalProps> = ({
  visible,
  onClose,
  orderSummary,
  isMobile = false,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  return (
    <Modal
      title={
        <Space>
          <InfoCircleOutlined />
          Chi tiết Đơn hàng đã lưu
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Đóng
        </Button>,
        <Button key="print" type="primary">
          In báo giá
        </Button>,
      ]}
      width={isMobile ? "95%" : 800}
    >
      {orderSummary && (
        <div>
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={12}>
              <Card title="Thông tin Khách hàng" size="small">
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="Tên khách hàng">
                    <Text strong>{orderSummary.customer_name}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Mã khách hàng">
                    {orderSummary.customer_code || "Chưa có"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Số điện thoại">
                    {orderSummary.customer_phone}
                  </Descriptions.Item>
                  <Descriptions.Item label="Email">
                    {orderSummary.customer_email || "Chưa có"}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>
            <Col span={12}>
              <Card title="Địa chỉ giao hàng" size="small">
                <Paragraph>
                  <Text strong>Địa chỉ khách hàng:</Text>
                  <br />
                  {orderSummary.customer_address}
                </Paragraph>
                {orderSummary.delivery_address && (
                  <Paragraph>
                    <Text strong>Địa chỉ giao hàng:</Text>
                    <br />
                    {orderSummary.delivery_address}
                  </Paragraph>
                )}
              </Card>
            </Col>
          </Row>

          <Card
            title="Thông tin Đơn hàng"
            size="small"
            style={{ marginBottom: 16 }}
          >
            <Row gutter={16}>
              <Col span={8}>
                <Text strong>Mã đơn hàng:</Text>
                <br />
                <Text>{orderSummary.quote_number}</Text>
              </Col>
              <Col span={8}>
                <Text strong>Ngày tạo:</Text>
                <br />
                <Text>{orderSummary.created_at}</Text>
              </Col>
              <Col span={8}>
                <Text strong>Trạng thái:</Text>
                <br />
                <Tag color="orange">Nháp</Tag>
              </Col>
            </Row>
          </Card>

          <Card
            title="Chi tiết Sản phẩm"
            size="small"
            style={{ marginBottom: 16 }}
          >
            <Table
              columns={[
                { title: "Sản phẩm", dataIndex: "product_name", key: "name" },
                {
                  title: "Đơn giá",
                  dataIndex: "unit_price",
                  key: "price",
                  render: formatCurrency,
                },
                { title: "SL", dataIndex: "quantity", key: "quantity" },
                {
                  title: "Thành tiền",
                  dataIndex: "total_price",
                  key: "total",
                  render: formatCurrency,
                },
              ]}
              dataSource={orderSummary.items}
              pagination={false}
              size="small"
            />
          </Card>

          <Card title="Tổng kết" size="small">
            <Descriptions column={2} size="small">
              <Descriptions.Item label="Tạm tính">
                {formatCurrency(orderSummary.totals.subtotal)}
              </Descriptions.Item>
              <Descriptions.Item label="Chiết khấu">
                -{formatCurrency(orderSummary.totals.discountAmount)}
              </Descriptions.Item>
              <Descriptions.Item label="Thuế">
                +{formatCurrency(orderSummary.totals.taxAmount)}
              </Descriptions.Item>
              <Descriptions.Item label="Tổng cộng">
                <Text strong style={{ color: "#52c41a", fontSize: 16 }}>
                  {formatCurrency(orderSummary.totals.totalAmount)}
                </Text>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </div>
      )}
    </Modal>
  );
};

export default B2BOrderPreviewModal;
