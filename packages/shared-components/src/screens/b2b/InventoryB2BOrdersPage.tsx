import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  Button,
  Space,
  Typography,
  Tabs,
  Badge,
  Modal,
  notification,
  App,
  Row,
  Col,
  Statistic,
} from "antd";
import {
  CheckOutlined,
  InboxOutlined,
  SendOutlined,
  ScanOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import {
  getB2BQuotes,
  updateQuoteStage,
  getQuoteItems,
} from "@nam-viet-erp/services";
import {
  OrderDetailModal,
  QRScannerVerificationModal,
  InventoryB2BOrdersTable,
} from "@nam-viet-erp/shared-components";

const { Title, Text } = Typography;

interface InventoryB2BOrdersPageProps {
  employee?: IEmployee | null;
}

const InventoryB2BOrdersPage: React.FC<InventoryB2BOrdersPageProps> = ({
  employee,
}) => {
  const navigate = useNavigate();
  const { notification: antNotification, modal } = App.useApp();

  const [quotes, setQuotes] = useState<IB2BQuote[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("accepted");
  const [selectedOrder, setSelectedOrder] = useState<IB2BQuote | null>(null);
  const [orderDetailModalOpen, setOrderDetailModalOpen] = useState(false);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [qrScannerOpen, setQrScannerOpen] = useState(false);
  const [verifiedItems, setVerifiedItems] = useState<Set<string>>(new Set());

  // Statistics
  const [stats, setStats] = useState({
    accepted: 0,
    pending_packaging: 0,
    packaged: 0,
  });

  // Load orders
  const loadOrders = async () => {
    setLoading(true);
    try {
      const response = await getB2BQuotes({});

      if (response.error) throw response.error;

      // Filter only inventory-relevant orders
      const inventoryOrders = (response.data || []).filter((quote: IB2BQuote) =>
        ["accepted", "pending_packaging", "packaged"].includes(
          quote.quote_stage,
        ),
      );

      setQuotes(inventoryOrders);

      // Calculate stats
      const newStats = {
        accepted: inventoryOrders.filter(
          (q: IB2BQuote) => q.quote_stage === "accepted",
        ).length,
        pending_packaging: inventoryOrders.filter(
          (q: IB2BQuote) => q.quote_stage === "pending_packaging",
        ).length,
        packaged: inventoryOrders.filter(
          (q: IB2BQuote) => q.quote_stage === "packaged",
        ).length,
      };
      setStats(newStats);
    } catch (error: any) {
      antNotification.error({
        message: "Lỗi tải dữ liệu",
        description: error.message || "Không thể tải danh sách đơn hàng",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  // Handle stage change
  const handleStageChange = async (
    quote: IB2BQuote,
    newStage: IB2BQuote["quote_stage"],
  ) => {
    modal.confirm({
      title: `Xác nhận chuyển trạng thái`,
      content: getStageChangeContent(quote.quote_stage, newStage),
      okText: "Xác nhận",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          const { error } = await updateQuoteStage(quote.quote_id, newStage);

          if (error) throw error;

          antNotification.success({
            message: "Thành công",
            description: `Đã chuyển đơn hàng sang trạng thái: ${getStageTitle(newStage)}`,
          });

          loadOrders();
        } catch (error: any) {
          antNotification.error({
            message: "Lỗi",
            description: error.message || "Không thể cập nhật trạng thái",
          });
        }
      },
    });
  };

  // Get stage change content
  const getStageChangeContent = (currentStage: string, newStage: string) => {
    const messages: Record<string, string> = {
      "accepted-pending_packaging": "Bắt đầu kiểm hàng cho đơn hàng này?",
      "pending_packaging-packaged":
        "Xác nhận đã kiểm hàng xong và bắt đầu đóng gói?",
      "packaged-shipping":
        "Xác nhận đã đóng gói xong và bàn giao cho nhân viên giao hàng?",
    };

    return (
      messages[`${currentStage}-${newStage}`] || "Xác nhận thay đổi trạng thái?"
    );
  };

  // Get stage title
  const getStageTitle = (stage: string) => {
    const titles: Record<string, string> = {
      accepted: "Đã chấp nhận",
      pending_packaging: "Đang kiểm hàng",
      packaged: "Đã đóng gói",
      shipping: "Đang giao hàng",
    };
    return titles[stage] || stage;
  };

  // Handle view order details
  const handleViewOrder = async (quote: IB2BQuote) => {
    setSelectedOrder(quote);
    setOrderDetailModalOpen(true);
    setLoadingItems(true);

    try {
      const { data, error } = await getQuoteItems(quote.quote_id);

      if (error) throw error;

      setOrderItems(data || []);
    } catch (error: any) {
      antNotification.error({
        message: "Lỗi",
        description: "Không thể tải chi tiết đơn hàng",
      });
      setOrderItems([]);
    } finally {
      setLoadingItems(false);
    }
  };

  // Handle open QR scanner
  const handleOpenQRScanner = (quote: IB2BQuote) => {
    setSelectedOrder(quote);
    setQrScannerOpen(true);
  };

  // Get action buttons based on stage
  const getActionButtons = (record: IB2BQuote) => {
    switch (record.quote_stage) {
      case "accepted":
        return (
          <Space>
            <Button
              type="primary"
              icon={<CheckOutlined />}
              onClick={() => handleStageChange(record, "pending_packaging")}
              size="small"
            >
              Bắt đầu kiểm hàng
            </Button>
            <Button
              icon={<EyeOutlined />}
              onClick={() => handleViewOrder(record)}
              size="small"
            >
              Chi tiết
            </Button>
          </Space>
        );

      case "pending_packaging":
        return (
          <Space>
            <Button
              icon={<ScanOutlined />}
              onClick={() => handleOpenQRScanner(record)}
              size="small"
            >
              Quét kiểm hàng
            </Button>
            <Button
              type="primary"
              icon={<InboxOutlined />}
              onClick={() => handleStageChange(record, "packaged")}
              size="small"
            >
              Hoàn thành kiểm hàng
            </Button>
            <Button
              icon={<EyeOutlined />}
              onClick={() => handleViewOrder(record)}
              size="small"
            >
              Chi tiết
            </Button>
          </Space>
        );

      case "packaged":
        return (
          <Space>
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={() => handleStageChange(record, "shipping")}
              size="small"
            >
              Bàn giao giao hàng
            </Button>
            <Button
              icon={<EyeOutlined />}
              onClick={() => handleViewOrder(record)}
              size="small"
            >
              Chi tiết
            </Button>
          </Space>
        );

      default:
        return (
          <Button
            icon={<EyeOutlined />}
            onClick={() => handleViewOrder(record)}
            size="small"
          >
            Chi tiết
          </Button>
        );
    }
  };

  // Filter orders by tab
  const getFilteredOrders = () => {
    if (activeTab === "all") return quotes;
    return quotes.filter((q) => q.quote_stage === activeTab);
  };

  // Format currency helper
  const formatCurrency = (amount: number) => {
    return amount?.toLocaleString("vi-VN") + " VND";
  };

  // Get stage info helper
  const getStageInfo = (stage: string) => {
    const colors: Record<string, string> = {
      accepted: "blue",
      pending_packaging: "orange",
      packaged: "green",
      shipping: "cyan",
    };
    return {
      color: colors[stage] || "default",
      text: getStageTitle(stage),
    };
  };

  return (
    <div style={{ padding: "24px" }}>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2} style={{ margin: 0 }}>
            📦 Quản lý Đơn hàng - Kho
          </Title>
          <Text type="secondary">Kiểm hàng và đóng gói đơn hàng bán buôn</Text>
        </Col>
      </Row>

      {/* Statistics */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Chờ kiểm hàng"
              value={stats.accepted}
              valueStyle={{ color: "#1890ff" }}
              prefix="🔵"
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Đang kiểm/đóng gói"
              value={stats.pending_packaging}
              valueStyle={{ color: "#faad14" }}
              prefix="📦"
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Chờ bàn giao"
              value={stats.packaged}
              valueStyle={{ color: "#52c41a" }}
              prefix="✅"
            />
          </Card>
        </Col>
      </Row>

      {/* Main Table */}
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: "all",
              label: (
                <span>
                  Tất cả{" "}
                  <Badge
                    count={quotes.length}
                    style={{ backgroundColor: "#52c41a" }}
                  />
                </span>
              ),
            },
            {
              key: "accepted",
              label: (
                <span>
                  🔵 Chờ kiểm hàng{" "}
                  <Badge
                    count={stats.accepted}
                    style={{ backgroundColor: "#1890ff" }}
                  />
                </span>
              ),
            },
            {
              key: "pending_packaging",
              label: (
                <span>
                  📦 Đang kiểm/đóng gói{" "}
                  <Badge
                    count={stats.pending_packaging}
                    style={{ backgroundColor: "#faad14" }}
                  />
                </span>
              ),
            },
            {
              key: "packaged",
              label: (
                <span>
                  ✅ Chờ bàn giao{" "}
                  <Badge
                    count={stats.packaged}
                    style={{ backgroundColor: "#52c41a" }}
                  />
                </span>
              ),
            },
          ]}
        />

        <InventoryB2BOrdersTable
          quotes={getFilteredOrders()}
          loading={loading}
          onViewOrder={handleViewOrder}
          getActionButtons={getActionButtons}
          getStageTitle={getStageTitle}
        />
      </Card>

      {/* Order Detail Modal */}
      <OrderDetailModal
        open={orderDetailModalOpen}
        onClose={() => setOrderDetailModalOpen(false)}
        selectedOrder={selectedOrder}
        orderItems={orderItems}
        loadingItems={loadingItems}
        verifiedItems={verifiedItems}
        isInventoryStaff={true}
        isDeliveryStaff={false}
        loading={loading}
        formatCurrency={formatCurrency}
        getStageInfo={getStageInfo}
        onMarkAsPackaged={async () => {
          if (selectedOrder) {
            await handleStageChange(selectedOrder, "packaged");
            setOrderDetailModalOpen(false);
          }
        }}
        onMarkAsShipping={async () => {
          if (selectedOrder) {
            await handleStageChange(selectedOrder, "shipping");
            setOrderDetailModalOpen(false);
          }
        }}
        onOpenContinuousScanner={handleOpenQRScanner.bind(null, selectedOrder!)}
        onManualVerify={(item: any) => {
          setVerifiedItems((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(item.product_id)) {
              newSet.delete(item.product_id);
            } else {
              newSet.add(item.product_id);
            }
            return newSet;
          });
        }}
      />

      {/* QR Scanner Modal */}
      <QRScannerVerificationModal
        open={qrScannerOpen}
        onClose={() => setQrScannerOpen(false)}
        orderItems={orderItems}
        verifiedItems={verifiedItems}
        onScan={(scannedData: string) => {
          // Find matching product by barcode or product_id
          const matchedItem = orderItems.find(
            (item) =>
              item.product_id === scannedData ||
              item.product?.barcode === scannedData,
          );

          if (matchedItem) {
            setVerifiedItems((prev) => {
              const newSet = new Set(prev);
              newSet.add(matchedItem.product_id);
              return newSet;
            });

            antNotification.success({
              message: "Đã quét",
              description: `Đã xác nhận: ${matchedItem.product?.product_name}`,
            });

            // Check if all items are verified
            if (verifiedItems.size + 1 === orderItems.length) {
              antNotification.success({
                message: "Hoàn thành",
                description: "Đã kiểm tra xong tất cả sản phẩm",
              });
            }
          } else {
            antNotification.warning({
              message: "Không tìm thấy",
              description: "Sản phẩm không có trong đơn hàng này",
            });
          }
        }}
      />
    </div>
  );
};

export default InventoryB2BOrdersPage;
