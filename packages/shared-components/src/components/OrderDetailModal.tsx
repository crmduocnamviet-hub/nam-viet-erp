import React from "react";
import {
  Modal,
  Button,
  Descriptions,
  Table,
  Tag,
  Typography,
  Card,
  Space,
} from "antd";
import { CheckCircleOutlined, QrcodeOutlined } from "@ant-design/icons";

const { Text } = Typography;

interface OrderDetailModalProps {
  open: boolean;
  onClose: () => void;
  selectedOrder: any | null;
  orderItems: any[];
  loadingItems: boolean;
  verifiedItems: Set<string>;
  isInventoryStaff: boolean;
  isDeliveryStaff?: boolean;
  onMarkAsPackaged: () => Promise<void>;
  onMarkAsShipping?: () => Promise<void>;
  onMarkAsCompleted?: () => Promise<void>;
  onOpenContinuousScanner: () => void;
  onManualVerify: (item: any) => void;
  formatCurrency: (amount: number) => string;
  getStageInfo: (stage: string) => any;
  loading: boolean;
}

const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  open,
  onClose,
  selectedOrder,
  orderItems,
  loadingItems,
  verifiedItems,
  isInventoryStaff,
  isDeliveryStaff = false,
  onMarkAsPackaged,
  onMarkAsShipping,
  onMarkAsCompleted,
  onOpenContinuousScanner,
  onManualVerify,
  formatCurrency,
  getStageInfo,
  loading,
}) => {
  // Determine which action buttons to show based on role and current stage
  const getActionButtons = () => {
    const buttons = [
      <Button key="close" onClick={onClose}>
        Đóng
      </Button>,
    ];

    // Inventory staff buttons
    if (isInventoryStaff) {
      // accepted → packaged
      if (selectedOrder?.quote_stage === "accepted") {
        buttons.push(
          <Button
            key="packaged"
            type="primary"
            onClick={async () => await onMarkAsPackaged()}
            loading={loading}
          >
            📦 Đóng gói
          </Button>,
        );
      }
      // packaged → shipping (hand over to delivery)
      else if (selectedOrder?.quote_stage === "packaged" && onMarkAsShipping) {
        buttons.push(
          <Button
            key="shipping"
            type="primary"
            onClick={async () => await onMarkAsShipping()}
            loading={loading}
          >
            🚚 Bàn giao cho giao hàng
          </Button>,
        );
      }
    }

    // Delivery staff buttons
    if (isDeliveryStaff) {
      // packaged → shipping (receive goods)
      if (selectedOrder?.quote_stage === "packaged" && onMarkAsShipping) {
        buttons.push(
          <Button
            key="receive"
            type="primary"
            onClick={async () => await onMarkAsShipping()}
            loading={loading}
          >
            📥 Nhận hàng
          </Button>,
        );
      }
      // shipping → completed (complete and submit money)
      else if (selectedOrder?.quote_stage === "shipping" && onMarkAsCompleted) {
        buttons.push(
          <Button
            key="complete"
            type="primary"
            onClick={async () => await onMarkAsCompleted()}
            loading={loading}
          >
            ✅ Hoàn thành & Nộp tiền
          </Button>,
        );
      }
    }

    // Show Edit button for non-inventory and non-delivery staff
    if (!isInventoryStaff && !isDeliveryStaff) {
      buttons.push(
        <Button key="edit" type="default">
          Chỉnh sửa
        </Button>,
      );
    }

    return buttons;
  };
  return (
    <Modal
      title={`Chi tiết báo giá ${selectedOrder?.quote_number}`}
      open={open}
      onCancel={onClose}
      footer={getActionButtons()}
      width={1000}
    >
      {selectedOrder && (
        <div>
          {/* Order Basic Info */}
          <Descriptions bordered column={2} style={{ marginBottom: 24 }}>
            <Descriptions.Item label="Mã báo giá">
              {selectedOrder.quote_number}
            </Descriptions.Item>
            <Descriptions.Item label="Khách hàng">
              {selectedOrder.customer_name}
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái đơn hàng">
              <Tag color={getStageInfo(selectedOrder.quote_stage).color}>
                {getStageInfo(selectedOrder.quote_stage).title}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Tổng giá trị">
              <Text strong style={{ color: "#52c41a" }}>
                {formatCurrency(selectedOrder.total_value)}
              </Text>
            </Descriptions.Item>
          </Descriptions>

          {/* Order Items with QR Verification */}
          <Card
            title={
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Space>
                  <Text strong>Sản phẩm trong đơn hàng</Text>
                  {isInventoryStaff && (
                    <Tag
                      color={
                        verifiedItems.size === orderItems.length &&
                        orderItems.length > 0
                          ? "green"
                          : "orange"
                      }
                    >
                      {verifiedItems.size}/{orderItems.length} đã xác thực
                    </Tag>
                  )}
                </Space>
                {isInventoryStaff &&
                  orderItems.length > 0 &&
                  !["packaged", "shipping", "completed"].includes(
                    selectedOrder?.quote_stage,
                  ) && (
                    <Button
                      type="primary"
                      icon={<QrcodeOutlined />}
                      onClick={onOpenContinuousScanner}
                      size="small"
                    >
                      Quét liên tục
                    </Button>
                  )}
              </div>
            }
            loading={loadingItems}
          >
            <Table
              dataSource={orderItems}
              pagination={false}
              size="small"
              rowKey="item_id"
              columns={[
                {
                  title: "Sản phẩm",
                  dataIndex: ["products", "name"],
                  key: "product_name",
                  render: (name: string, record: any) => (
                    <div>
                      <Text strong>{name}</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        SKU: {record.products?.sku || "N/A"}
                      </Text>
                    </div>
                  ),
                },
                {
                  title: "Số lượng",
                  dataIndex: "quantity",
                  key: "quantity",
                  width: 80,
                  align: "center",
                },
                {
                  title: "Đơn giá",
                  dataIndex: "unit_price",
                  key: "unit_price",
                  width: 120,
                  align: "right",
                  render: (price: number) => formatCurrency(price),
                },
                {
                  title: "Thành tiền",
                  dataIndex: "subtotal",
                  key: "subtotal",
                  width: 120,
                  align: "right",
                  render: (subtotal: number) => (
                    <Text strong>{formatCurrency(subtotal)}</Text>
                  ),
                },
                ...(isInventoryStaff
                  ? [
                      {
                        title: "Xác thực",
                        key: "verification",
                        width: 150,
                        align: "center" as const,
                        render: (_: any, record: any) => {
                          const isVerified = verifiedItems.has(record.item_id);

                          if (isVerified) {
                            return (
                              <Tag color="green" icon={<CheckCircleOutlined />}>
                                Đã xác thực
                              </Tag>
                            );
                          }

                          // Hide manual verify button if status is packaged/shipping/completed
                          if (
                            ["packaged", "shipping", "completed"].includes(
                              selectedOrder?.quote_stage,
                            )
                          ) {
                            return null;
                          }

                          return (
                            <Space direction="vertical" size="small">
                              <Button
                                type="default"
                                size="small"
                                icon={<CheckCircleOutlined />}
                                onClick={() => onManualVerify(record)}
                              >
                                Xác thực thủ công
                              </Button>
                            </Space>
                          );
                        },
                      },
                    ]
                  : []),
              ]}
            />

            {/* Show completion message when all products are verified */}
            {isInventoryStaff &&
              orderItems.length > 0 &&
              verifiedItems.size === orderItems.length &&
              selectedOrder?.quote_stage === "pending_packaging" && (
                <div
                  style={{
                    backgroundColor: "#f6ffed",
                    border: "1px solid #b7eb8f",
                    borderRadius: "6px",
                    padding: "16px",
                    marginTop: "16px",
                    textAlign: "center",
                  }}
                >
                  <CheckCircleOutlined
                    style={{
                      color: "#52c41a",
                      fontSize: "24px",
                      marginBottom: "8px",
                    }}
                  />
                  <div>
                    <Text strong style={{ color: "#52c41a", fontSize: "16px" }}>
                      🎉 Tất cả sản phẩm đã được xác thực!
                    </Text>
                  </div>
                  <div style={{ marginTop: "8px" }}>
                    <Text type="secondary">
                      Bạn có thể đánh dấu đơn hàng là đã đóng gói hoàn thành
                    </Text>
                  </div>
                </div>
              )}
          </Card>
        </div>
      )}
    </Modal>
  );
};

export default OrderDetailModal;
