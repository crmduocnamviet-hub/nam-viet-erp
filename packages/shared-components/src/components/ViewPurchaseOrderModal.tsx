import React from "react";
import {
  Modal,
  Descriptions,
  Table,
  Tag,
  Typography,
  Divider,
  Space,
  Row,
  Col,
  Card,
  Statistic,
  Button,
} from "antd";
import {
  ShoppingOutlined,
  CalendarOutlined,
  UserOutlined,
  FileTextOutlined,
  FilePdfOutlined,
} from "@ant-design/icons";

const { Text, Title } = Typography;

interface ViewPurchaseOrderModalProps {
  open: boolean;
  onClose: () => void;
  purchaseOrder: any | null;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount || 0);
};

const ViewPurchaseOrderModal: React.FC<ViewPurchaseOrderModalProps> = ({
  open,
  onClose,
  purchaseOrder,
}) => {
  if (!purchaseOrder) return null;

  const statusConfig: Record<string, { color: string; text: string }> = {
    draft: { color: "default", text: "Nháp" },
    sent: { color: "processing", text: "Đã gửi" },
    ordered: { color: "processing", text: "Đã đặt hàng" },
    partially_received: { color: "warning", text: "Nhận một phần" },
    received: { color: "success", text: "Hoàn thành" },
    cancelled: { color: "error", text: "Đã hủy" },
  };

  const status = statusConfig[purchaseOrder.status] || {
    color: "default",
    text: purchaseOrder.status,
  };

  const itemColumns: any[] = [
    {
      title: "STT",
      key: "index",
      width: 60,
      align: "center",
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: "Sản phẩm",
      dataIndex: ["product", "name"],
      key: "product_name",
      width: 250,
    },
    {
      title: "Đơn vị",
      dataIndex: ["product", "unit"],
      key: "unit",
      width: 100,
      align: "center",
    },
    {
      title: "Số lượng đặt",
      dataIndex: "quantity",
      key: "quantity",
      width: 120,
      align: "center",
      render: (qty: number) => (
        <Text strong style={{ color: "#1890ff" }}>
          {qty}
        </Text>
      ),
    },
    {
      title: "Đã nhận",
      dataIndex: "received_quantity",
      key: "received_quantity",
      width: 120,
      align: "center",
      render: (qty: number, record: any) => {
        const isComplete = qty === record.quantity;
        const isPartial = qty > 0 && qty < record.quantity;
        return (
          <Tag
            color={isComplete ? "success" : isPartial ? "warning" : "default"}
          >
            {qty || 0}
          </Tag>
        );
      },
    },
    {
      title: "Đơn giá",
      dataIndex: ["product", "wholesale_price"],
      key: "unit_price",
      width: 130,
      align: "right",
      render: (price: number) =>
        (price || 0).toLocaleString("vi-VN", {
          style: "currency",
          currency: "VND",
        }),
    },
    {
      title: "Thành tiền",
      key: "total",
      width: 150,
      align: "right",
      render: (_: any, record: any) => {
        const unitPrice = record.product?.wholesale_price || 0;
        const total = record.quantity * unitPrice;
        return (
          <Text strong>
            {total.toLocaleString("vi-VN", {
              style: "currency",
              currency: "VND",
            })}
          </Text>
        );
      },
    },
  ];

  // Calculate statistics
  const totalItems = purchaseOrder.items?.length || 0;
  const totalQuantity =
    purchaseOrder.items?.reduce(
      (sum: number, item: any) => sum + item.quantity,
      0,
    ) || 0;
  const totalReceived =
    purchaseOrder.items?.reduce(
      (sum: number, item: any) => sum + (item.received_quantity || 0),
      0,
    ) || 0;

  const generatePurchaseOrderPdfContent = (
    purchaseOrder: IPurchaseOrderWithDetails,
  ): string => {
    if (!purchaseOrder) return "";

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Đơn đặt hàng - ${purchaseOrder.po_number}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; font-size: 14px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .header h1 { margin: 0; color: #1890ff; }
          .info-section { margin: 20px 0; }
          .info-row { display: flex; margin-bottom: 10px; }
          .info-label { font-weight: bold; width: 150px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background-color: #1890ff; color: white; }
          .total-section { margin-top: 30px; text-align: right; }
          .total-row { margin: 10px 0; font-size: 16px; }
          .total-row.final { font-size: 20px; font-weight: bold; color: #cf1322; }
          .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>ĐƠN ĐẶT HÀNG</h1>
          <p>Số: ${purchaseOrder.po_number || ""}</p>
        </div>

        <div class="info-section">
          <h3>Thông tin chung</h3>
          <div class="info-row">
            <div class="info-label">Nhà cung cấp:</div>
            <div>${purchaseOrder.supplier?.name || "-"}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Ngày đặt hàng:</div>
            <div>${
              purchaseOrder.order_date
                ? new Date(purchaseOrder.order_date).toLocaleDateString("vi-VN")
                : "-"
            }</div>
          </div>
          <div class="info-row">
            <div class="info-label">Trạng thái:</div>
            <div>${status.text}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Người tạo:</div>
            <div>${purchaseOrder.created_by || "-"}</div>
          </div>
        </div>

        <div class="info-section">
          <h3>Danh sách sản phẩm</h3>
          <table>
            <thead>
              <tr>
                <th style="width: 50px;">STT</th>
                <th>Tên sản phẩm</th>
                <th style="width: 100px;">Đơn vị</th>
                <th style="width: 100px;">Số lượng</th>
                <th style="width: 120px;">Đơn giá</th>
                <th style="width: 150px;">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              ${(purchaseOrder.items || [])
                .map(
                  (item: any, index: number) => `
                <tr>
                  <td style="text-align: center;">${index + 1}</td>
                  <td>${item.product?.name || "-"}</td>
                  <td>${item.product?.unit || "-"}</td>
                  <td style="text-align: center;">${item.quantity}</td>
                  <td style="text-align: right;">${formatCurrency(
                    item.product?.wholesale_price || 0,
                  )}</td>
                  <td style="text-align: right;">${formatCurrency(
                    item.quantity * (item.product?.wholesale_price || 0),
                  )}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
        </div>

        <div class="total-section">
          <div class="total-row final">Tổng cộng: ${formatCurrency(
            purchaseOrder.total_amount || 0,
          )}</div>
        </div>

        <div class="footer">
          <p>Ngày xuất: ${new Date().toLocaleString("vi-VN")}</p>
          <p>Cảm ơn quý khách đã hợp tác!</p>
        </div>
      </body>
      </html>
    `;
  };

  const handleExportPDF = () => {
    const printContent = generatePurchaseOrderPdfContent(purchaseOrder);
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <ShoppingOutlined />
          <Text strong>Chi tiết đơn đặt hàng - {purchaseOrder.po_number}</Text>
        </Space>
      }
      open={open}
      onCancel={onClose}
      width={1200}
      footer={
        <Space>
          <Button onClick={onClose}>Đóng</Button>
          <Button
            type="primary"
            icon={<FilePdfOutlined />}
            onClick={handleExportPDF}
          >
            Xuất PDF
          </Button>
        </Space>
      }
    >
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {/* Status and Summary Cards */}
        <Row gutter={16}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Trạng thái"
                value={status.text}
                valueStyle={{ fontSize: 16 }}
                prefix={<Tag color={status.color}>{status.text}</Tag>}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Số sản phẩm"
                value={totalItems}
                suffix="sản phẩm"
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Tổng số lượng"
                value={totalQuantity}
                suffix={`/ ${totalReceived} đã nhận`}
                valueStyle={{
                  color:
                    totalReceived === totalQuantity ? "#52c41a" : "#1890ff",
                }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Tổng tiền"
                value={purchaseOrder.total_amount || 0}
                precision={0}
                valueStyle={{ color: "#cf1322", fontSize: 18 }}
                formatter={(value) =>
                  `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " đ"
                }
              />
            </Card>
          </Col>
        </Row>

        <Divider />

        {/* Order Information */}
        <Descriptions bordered column={{ xs: 1, sm: 2 }}>
          <Descriptions.Item label={<Text strong>Số đơn</Text>}>
            <Text copyable>{purchaseOrder.po_number}</Text>
          </Descriptions.Item>
          <Descriptions.Item label={<Text strong>Nhà cung cấp</Text>}>
            <Space>
              <UserOutlined />
              <Text>{purchaseOrder.supplier?.name || "-"}</Text>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label={<Text strong>Ngày đặt hàng</Text>}>
            <Space>
              <CalendarOutlined />
              <Text>
                {purchaseOrder.order_date
                  ? new Date(purchaseOrder.order_date).toLocaleDateString(
                      "vi-VN",
                    )
                  : "-"}
              </Text>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label={<Text strong>Ngày dự kiến giao</Text>}>
            <Space>
              <CalendarOutlined />
              <Text>
                {purchaseOrder.expected_delivery_date
                  ? new Date(
                      purchaseOrder.expected_delivery_date,
                    ).toLocaleDateString("vi-VN")
                  : "-"}
              </Text>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label={<Text strong>Người tạo</Text>} span={2}>
            <Text>{purchaseOrder.created_by || "-"}</Text>
          </Descriptions.Item>
          {purchaseOrder.notes && (
            <Descriptions.Item label={<Text strong>Ghi chú</Text>} span={2}>
              <Space>
                <FileTextOutlined />
                <Text>{purchaseOrder.notes}</Text>
              </Space>
            </Descriptions.Item>
          )}
        </Descriptions>

        <Divider orientation="left">
          <Text strong>Danh sách sản phẩm</Text>
        </Divider>

        {/* Items Table */}
        <Table
          columns={itemColumns}
          dataSource={purchaseOrder.items || []}
          rowKey="id"
          pagination={false}
          scroll={{ x: 900 }}
          size="small"
          summary={() => (
            <Table.Summary>
              <Table.Summary.Row style={{ backgroundColor: "#fafafa" }}>
                <Table.Summary.Cell index={0} colSpan={3} align="right">
                  <Text strong>Tổng cộng:</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1} align="center">
                  <Text strong style={{ color: "#1890ff" }}>
                    {totalQuantity}
                  </Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2} align="center">
                  <Tag
                    color={
                      totalReceived === totalQuantity ? "success" : "warning"
                    }
                  >
                    {totalReceived}
                  </Tag>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3} />
                <Table.Summary.Cell index={4} align="right">
                  <Text strong style={{ fontSize: 16, color: "#cf1322" }}>
                    {(purchaseOrder.total_amount || 0).toLocaleString("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    })}
                  </Text>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />

        {/* Footer Information */}
        <div style={{ marginTop: 16, color: "#888", fontSize: 12 }}>
          <Space direction="vertical">
            <Text type="secondary">
              Ngày tạo:{" "}
              {purchaseOrder.created_at
                ? new Date(purchaseOrder.created_at).toLocaleString("vi-VN")
                : "-"}
            </Text>
            {purchaseOrder.updated_at && (
              <Text type="secondary">
                Cập nhật lần cuối:{" "}
                {new Date(purchaseOrder.updated_at).toLocaleString("vi-VN")}
              </Text>
            )}
          </Space>
        </div>
      </Space>
    </Modal>
  );
};

export default ViewPurchaseOrderModal;
