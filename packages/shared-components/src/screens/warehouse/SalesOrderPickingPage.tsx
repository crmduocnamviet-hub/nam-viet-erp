import React, { useState } from "react";
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  Tag,
  Checkbox,
  Row,
  Col,
  Statistic,
  Alert,
  List,
  Modal,
} from "antd";
import {
  ScanOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  BarcodeOutlined,
} from "@ant-design/icons";
import PageLayout from "../../components/PageLayout";

const { Title, Text } = Typography;

const SalesOrderPickingPage: React.FC = () => {
  const [scanning, setScanning] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [pickedItems, setPickedItems] = useState<Record<number, boolean>>({});
  const [scannedProducts, setScannedProducts] = useState<string[]>([]);

  // Mock data - will be replaced with real API calls
  const mockPendingOrders: any[] = [];

  const orderColumns = [
    {
      title: "Mã Đơn",
      dataIndex: "order_id",
      key: "order_id",
      render: (text: string, record: any) => (
        <a onClick={() => setSelectedOrder(record)}>#{text}</a>
      ),
    },
    {
      title: "Khách Hàng",
      dataIndex: "customer_name",
      key: "customer_name",
    },
    {
      title: "Loại Đơn",
      dataIndex: "order_type",
      key: "order_type",
      render: (type: string) => {
        const config: Record<string, { color: string; text: string }> = {
          pos: { color: "blue", text: "POS" },
          b2b: { color: "green", text: "B2B" },
          online: { color: "purple", text: "Online" },
        };
        const c = config[type] || { color: "default", text: type };
        return <Tag color={c.color}>{c.text}</Tag>;
      },
    },
    {
      title: "Số Sản Phẩm",
      dataIndex: "total_items",
      key: "total_items",
      align: "center" as const,
    },
    {
      title: "Tổng Tiền",
      dataIndex: "total_value",
      key: "total_value",
      align: "right" as const,
      render: (amount: number) =>
        amount?.toLocaleString("vi-VN", {
          style: "currency",
          currency: "VND",
        }),
    },
    {
      title: "Ngày Tạo",
      dataIndex: "created_at",
      key: "created_at",
      render: (date: string) => new Date(date).toLocaleDateString("vi-VN"),
    },
    {
      title: "Hành Động",
      key: "actions",
      render: (_: any, record: any) => (
        <Button type="primary" onClick={() => setSelectedOrder(record)}>
          Lấy Hàng
        </Button>
      ),
    },
  ];

  const productColumns = [
    {
      title: "",
      key: "checkbox",
      width: 50,
      render: (_: any, record: any) => (
        <Checkbox
          checked={pickedItems[record.id]}
          onChange={(e) =>
            setPickedItems((prev) => ({
              ...prev,
              [record.id]: e.target.checked,
            }))
          }
        />
      ),
    },
    {
      title: "Sản Phẩm",
      dataIndex: "product_name",
      key: "product_name",
      render: (name: string, record: any) => (
        <Space direction="vertical" size="small">
          <Text strong>{name}</Text>
          {record.lot_number && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              Lô: {record.lot_number}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: "Mã Vạch",
      dataIndex: "barcode",
      key: "barcode",
      render: (barcode: string) => <Text code>{barcode || "Không có"}</Text>,
    },
    {
      title: "Số Lượng",
      dataIndex: "quantity",
      key: "quantity",
      align: "center" as const,
      render: (qty: number) => <Tag color="blue">{qty}</Tag>,
    },
    {
      title: "Vị Trí",
      dataIndex: "location",
      key: "location",
      render: (location: string) => location || "Chưa xác định",
    },
    {
      title: "Trạng Thái",
      key: "status",
      render: (_: any, record: any) => {
        if (pickedItems[record.id]) {
          return (
            <Tag color="success" icon={<CheckCircleOutlined />}>
              Đã Lấy
            </Tag>
          );
        }
        return <Tag>Chưa lấy</Tag>;
      },
    },
  ];

  const handleScanBarcode = () => {
    setScanning(true);
    // Will integrate with QR scanner
  };

  const handleConfirmPicking = () => {
    const pickedCount = Object.values(pickedItems).filter(Boolean).length;
    const totalItems = selectedOrder?.items?.length || 0;

    if (pickedCount === 0) {
      Modal.warning({
        title: "Chưa lấy sản phẩm nào",
        content: "Vui lòng quét hoặc chọn ít nhất một sản phẩm",
      });
      return;
    }

    if (pickedCount < totalItems) {
      Modal.confirm({
        title: "Chưa lấy đủ sản phẩm",
        content: `Bạn mới lấy ${pickedCount}/${totalItems} sản phẩm. Bạn có chắc muốn tiếp tục?`,
        onOk: async () => {
          console.log("Confirming partial picking:", pickedItems);
          // Will implement picking logic
        },
      });
    } else {
      Modal.confirm({
        title: "Xác nhận hoàn tất lấy hàng",
        content: "Bạn đã lấy đủ tất cả sản phẩm. Xác nhận hoàn tất?",
        onOk: async () => {
          console.log("Confirming picking:", pickedItems);
          // Will implement picking logic
        },
      });
    }
  };

  const pickedCount = Object.values(pickedItems).filter(Boolean).length;
  const totalItems = selectedOrder?.items?.length || 0;
  const pickingProgress = totalItems > 0 ? (pickedCount / totalItems) * 100 : 0;

  return (
    <PageLayout title="Xuất Hàng / Lấy Hàng">
      {!selectedOrder ? (
        // List of pending sales orders
        <Card title="Đơn Hàng Chờ Lấy">
          <Table
            columns={orderColumns}
            dataSource={mockPendingOrders}
            rowKey="order_id"
            pagination={{
              showTotal: (total) => `Tổng ${total} đơn hàng`,
            }}
          />
        </Card>
      ) : (
        // Picking interface for selected order
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          {/* Order Info */}
          <Card>
            <Row gutter={16}>
              <Col span={6}>
                <Statistic
                  title="Mã Đơn"
                  value={selectedOrder.order_id}
                  prefix={<Text type="secondary">#</Text>}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Khách Hàng"
                  value={selectedOrder.customer_name || "Khách lẻ"}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Đã Lấy"
                  value={pickedCount}
                  suffix={`/ ${totalItems}`}
                  valueStyle={{
                    color: pickedCount === totalItems ? "#52c41a" : "#1890ff",
                  }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Tiến Độ"
                  value={pickingProgress.toFixed(0)}
                  suffix="%"
                  valueStyle={{
                    color: pickingProgress === 100 ? "#52c41a" : "#1890ff",
                  }}
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
                message="Quét mã vạch sản phẩm để tự động đánh dấu đã lấy"
                type="info"
                showIcon
              />
            </Space>
          </Card>

          {/* Scanned Products Log */}
          {scannedProducts.length > 0 && (
            <Card title="Lịch Sử Quét">
              <List
                size="small"
                dataSource={scannedProducts}
                renderItem={(item, index) => (
                  <List.Item>
                    <Space>
                      <CheckCircleOutlined style={{ color: "#52c41a" }} />
                      <Text>{item}</Text>
                      <Text type="secondary">
                        {new Date().toLocaleTimeString("vi-VN")}
                      </Text>
                    </Space>
                  </List.Item>
                )}
              />
            </Card>
          )}

          {/* Products Table */}
          <Card
            title="Danh Sách Sản Phẩm Cần Lấy"
            extra={
              <Space>
                <Button onClick={() => setSelectedOrder(null)}>Quay Lại</Button>
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={handleConfirmPicking}
                  disabled={pickedCount === 0}
                >
                  Xác Nhận Hoàn Tất ({pickedCount}/{totalItems})
                </Button>
              </Space>
            }
          >
            <Table
              columns={productColumns}
              dataSource={selectedOrder.items || []}
              rowKey="id"
              pagination={false}
              rowClassName={(record) =>
                pickedItems[record.id] ? "row-picked" : ""
              }
            />
          </Card>

          <style>{`
            .row-picked {
              background-color: #f6ffed !important;
            }
          `}</style>
        </Space>
      )}
    </PageLayout>
  );
};

export default SalesOrderPickingPage;
