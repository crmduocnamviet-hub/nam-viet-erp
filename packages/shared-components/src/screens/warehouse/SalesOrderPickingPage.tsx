import React, { useState, useEffect } from "react";
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
  Empty,
  notification,
  Spin,
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
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Load pending sales orders that need picking
  useEffect(() => {
    loadPendingOrders();
  }, []);

  const loadPendingOrders = async () => {
    try {
      setLoadingOrders(true);
      const { getSalesOrders } = await import("@nam-viet-erp/services");

      // Fetch orders that need picking - orders that are completed but not yet shipped
      // Get orders with various statuses that might need picking
      const { data, error } = await getSalesOrders({
        // Remove strict filter - get all orders and filter client-side
        limit: 100,
      });

      if (error) {
        console.error("Error loading pending orders:", error);
        notification.error({
          message: "Lỗi tải dữ liệu",
          description: error.message || "Không thể tải danh sách đơn hàng",
        });
        return;
      }

      // Map orders to display format
      const ordersNeedingPicking = (data || [])
        .filter((order: any) => {
          // Show orders that:
          // 1. Have items
          // 2. Are completed/ready for picking (not yet shipped or cancelled)
          // 3. Include POS and B2B orders
          const hasItems =
            order.sales_order_items && order.sales_order_items.length > 0;
          const isReadyForPicking =
            order.operational_status === "Hoàn tất" ||
            order.operational_status === "Đang xử lý" ||
            (order.operational_status !== "Đã giao" &&
              order.operational_status !== "Đã hủy");
          return hasItems && isReadyForPicking;
        })
        .map((order: any) => ({
          order_id: order.order_id,
          customer_name: order.patients?.full_name || "Khách lẻ",
          order_type: order.order_type || "pos",
          total_items: order.sales_order_items?.length || 0,
          total_value: order.total_value || 0,
          created_at: order.order_datetime || order.created_at,
          items: (order.sales_order_items || []).map((item: any) => ({
            id: item.id,
            product_name:
              item.products?.name ||
              item.product_name ||
              "Sản phẩm không xác định",
            quantity: item.quantity || 0,
            barcode: item.products?.barcode || item.barcode,
            lot_number: item.lot_number,
            location: item.location || "Chưa xác định",
          })),
          ...order,
        }));

      setPendingOrders(ordersNeedingPicking);
    } catch (error: any) {
      console.error("Error in loadPendingOrders:", error);
      notification.error({
        message: "Lỗi",
        description: error.message || "Không thể tải danh sách đơn hàng",
      });
    } finally {
      setLoadingOrders(false);
    }
  };

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
          {loadingOrders ? (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <Spin size="large" tip="Đang tải danh sách đơn hàng..." />
            </div>
          ) : pendingOrders.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="Không có đơn hàng nào cần lấy hàng"
            />
          ) : (
            <Table
              columns={orderColumns}
              dataSource={pendingOrders}
              rowKey="order_id"
              loading={loadingOrders}
              pagination={{
                showTotal: (total) => `Tổng ${total} đơn hàng`,
                showSizeChanger: true,
              }}
            />
          )}
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
