import React, { useState } from "react";
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  Tag,
  Progress,
  Row,
  Col,
  Statistic,
  InputNumber,
  Input,
  Modal,
  Form,
  DatePicker,
  Alert,
} from "antd";
import {
  ScanOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  BarcodeOutlined,
} from "@ant-design/icons";
import PageLayout from "../../components/PageLayout";

const { Title, Text } = Typography;

const PurchaseOrderReceivingPage: React.FC = () => {
  const [scanning, setScanning] = useState(false);
  const [selectedPO, setSelectedPO] = useState<any>(null);
  const [receivingData, setReceivingData] = useState<Record<number, number>>(
    {},
  );

  // Mock data - will be replaced with real API calls
  const mockPendingOrders: any[] = [];

  const orderColumns = [
    {
      title: "Số Đơn",
      dataIndex: "order_number",
      key: "order_number",
      render: (text: string, record: any) => (
        <a onClick={() => setSelectedPO(record)}>{text}</a>
      ),
    },
    {
      title: "Nhà Cung Cấp",
      dataIndex: "supplier_name",
      key: "supplier_name",
    },
    {
      title: "Ngày Đặt",
      dataIndex: "ordered_date",
      key: "ordered_date",
      render: (date: string) => new Date(date).toLocaleDateString("vi-VN"),
    },
    {
      title: "Tiến Độ",
      key: "progress",
      render: (_: any, record: any) => {
        const received = record.received_items || 0;
        const total = record.total_items || 0;
        const percent = total > 0 ? (received / total) * 100 : 0;
        return (
          <Space direction="vertical" size="small" style={{ width: "100%" }}>
            <Text type="secondary">
              {received}/{total} sản phẩm
            </Text>
            <Progress percent={percent} size="small" />
          </Space>
        );
      },
    },
    {
      title: "Hành Động",
      key: "actions",
      render: (_: any, record: any) => (
        <Button type="primary" onClick={() => setSelectedPO(record)}>
          Nhận Hàng
        </Button>
      ),
    },
  ];

  const productColumns = [
    {
      title: "Sản Phẩm",
      dataIndex: "product_name",
      key: "product_name",
    },
    {
      title: "Số Lượng Đặt",
      dataIndex: "quantity",
      key: "quantity",
      align: "center" as const,
    },
    {
      title: "Đã Nhận",
      dataIndex: "received_quantity",
      key: "received_quantity",
      align: "center" as const,
      render: (qty: number) => <Tag color="success">{qty || 0}</Tag>,
    },
    {
      title: "Còn Lại",
      key: "remaining",
      align: "center" as const,
      render: (_: any, record: any) => {
        const remaining = record.quantity - (record.received_quantity || 0);
        return (
          <Tag color={remaining > 0 ? "warning" : "default"}>{remaining}</Tag>
        );
      },
    },
    {
      title: "Nhận Lần Này",
      key: "receiving",
      render: (_: any, record: any) => {
        const remaining = record.quantity - (record.received_quantity || 0);
        return (
          <InputNumber
            min={0}
            max={remaining}
            value={receivingData[record.id] || 0}
            onChange={(val) =>
              setReceivingData((prev) => ({ ...prev, [record.id]: val || 0 }))
            }
          />
        );
      },
    },
    {
      title: "Trạng Thái",
      key: "status",
      render: (_: any, record: any) => {
        const receivedQty = receivingData[record.id] || 0;
        if (receivedQty === 0) {
          return <Tag>Chưa nhận</Tag>;
        }
        const remaining = record.quantity - (record.received_quantity || 0);
        if (receivedQty === remaining) {
          return (
            <Tag color="success" icon={<CheckCircleOutlined />}>
              Đủ
            </Tag>
          );
        }
        return (
          <Tag color="warning" icon={<WarningOutlined />}>
            Một phần
          </Tag>
        );
      },
    },
  ];

  const handleScanBarcode = () => {
    setScanning(true);
    // Will integrate with QR scanner
  };

  const handleConfirmReceiving = () => {
    Modal.confirm({
      title: "Xác nhận nhận hàng",
      content: "Bạn có chắc chắn muốn xác nhận nhận hàng?",
      onOk: async () => {
        console.log("Confirming receiving:", receivingData);
        // Will implement receiving logic
      },
    });
  };

  return (
    <PageLayout title="Nhận Hàng">
      {!selectedPO ? (
        // List of pending purchase orders
        <Card title="Đơn Hàng Đang Chờ Nhận">
          <Table
            columns={orderColumns}
            dataSource={mockPendingOrders}
            rowKey="id"
            pagination={{
              showTotal: (total) => `Tổng ${total} đơn hàng`,
            }}
          />
        </Card>
      ) : (
        // Receiving interface for selected PO
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          {/* Order Info */}
          <Card>
            <Row gutter={16}>
              <Col span={6}>
                <Statistic
                  title="Số Đơn"
                  value={selectedPO.order_number}
                  prefix={<Text type="secondary">#</Text>}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Nhà Cung Cấp"
                  value={selectedPO.supplier_name}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Tổng Sản Phẩm"
                  value={selectedPO.total_items || 0}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Đã Nhận"
                  value={selectedPO.received_items || 0}
                  valueStyle={{ color: "#52c41a" }}
                />
              </Col>
            </Row>
          </Card>

          {/* Barcode Scanner */}
          <Card>
            <Space>
              <Button
                type="primary"
                icon={<ScanOutlined />}
                size="large"
                onClick={handleScanBarcode}
              >
                Quét Mã Vạch
              </Button>
              <Button icon={<BarcodeOutlined />} size="large">
                Nhập Mã Thủ Công
              </Button>
              <Alert
                message="Quét mã vạch sản phẩm để tự động điền số lượng"
                type="info"
                showIcon
              />
            </Space>
          </Card>

          {/* Products Table */}
          <Card
            title="Danh Sách Sản Phẩm"
            extra={
              <Space>
                <Button onClick={() => setSelectedPO(null)}>Quay Lại</Button>
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={handleConfirmReceiving}
                >
                  Xác Nhận Nhận Hàng
                </Button>
              </Space>
            }
          >
            <Table
              columns={productColumns}
              dataSource={selectedPO.items || []}
              rowKey="id"
              pagination={false}
            />
          </Card>
        </Space>
      )}
    </PageLayout>
  );
};

export default PurchaseOrderReceivingPage;
