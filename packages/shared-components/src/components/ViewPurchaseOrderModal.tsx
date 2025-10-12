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
import type { ColumnsType } from "antd/es/table";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { RobotoRegular } from "../utils/RobotoFont";

const { Text, Title } = Typography;

interface ViewPurchaseOrderModalProps {
  open: boolean;
  onClose: () => void;
  purchaseOrder: any | null;
}

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

  const itemColumns: ColumnsType<any> = [
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

  // Export to PDF function
  const handleExportPDF = () => {
    const doc = new jsPDF();

    // Add Vietnamese font
    doc.addFileToVFS("Roboto-Regular.ttf", RobotoRegular);
    doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
    doc.setFont("Roboto");

    // Add title
    doc.setFontSize(18);
    doc.text("ĐỚN ĐẶT HÀNG", 105, 20, { align: "center" });

    doc.setFontSize(14);
    doc.text(purchaseOrder.po_number || "", 105, 28, { align: "center" });

    // Add order info
    doc.setFontSize(10);
    let yPos = 40;

    doc.text(`Nhà cung cấp: ${purchaseOrder.supplier?.name || "-"}`, 15, yPos);
    yPos += 7;
    doc.text(
      `Ngày đặt hàng: ${
        purchaseOrder.order_date
          ? new Date(purchaseOrder.order_date).toLocaleDateString("vi-VN")
          : "-"
      }`,
      15,
      yPos,
    );
    yPos += 7;
    doc.text(
      `Ngày dự kiến giao: ${
        purchaseOrder.expected_delivery_date
          ? new Date(purchaseOrder.expected_delivery_date).toLocaleDateString(
              "vi-VN",
            )
          : "-"
      }`,
      15,
      yPos,
    );
    yPos += 7;
    doc.text(`Trạng thái: ${status.text}`, 15, yPos);
    yPos += 7;
    doc.text(`Người tạo: ${purchaseOrder.created_by || "-"}`, 15, yPos);
    yPos += 10;

    if (purchaseOrder.notes) {
      doc.setFontSize(9);
      doc.text(`Ghi chú: ${purchaseOrder.notes}`, 15, yPos);
      yPos += 10;
    }

    // Add items table
    const tableData = (purchaseOrder.items || []).map(
      (item: any, index: number) => [
        index + 1,
        item.product?.name || "-",
        item.product?.unit || "-",
        item.quantity,
        item.received_quantity || 0,
        (item.product?.wholesale_price || 0).toLocaleString("vi-VN"),
        (item.quantity * (item.product?.wholesale_price || 0)).toLocaleString(
          "vi-VN",
        ),
      ],
    );

    autoTable(doc, {
      startY: yPos,
      head: [
        [
          "STT",
          "Sản phẩm",
          "Đơn vị",
          "SL đặt",
          "Đã nhận",
          "Đơn giá",
          "Thành tiền",
        ],
      ],
      body: tableData,
      foot: [
        [
          "",
          "",
          "TỔNG CỘNG:",
          totalQuantity,
          totalReceived,
          "",
          (purchaseOrder.total_amount || 0).toLocaleString("vi-VN") + " đ",
        ],
      ],
      theme: "grid",
      headStyles: {
        fillColor: [66, 139, 202],
        textColor: 255,
        fontStyle: "bold",
        halign: "center",
        font: "Roboto",
      },
      footStyles: {
        fillColor: [240, 240, 240],
        textColor: 0,
        fontStyle: "bold",
        font: "Roboto",
      },
      columnStyles: {
        0: { halign: "center", cellWidth: 15 },
        1: { halign: "left", cellWidth: 50 },
        2: { halign: "center", cellWidth: 20 },
        3: { halign: "center", cellWidth: 20 },
        4: { halign: "center", cellWidth: 20 },
        5: { halign: "right", cellWidth: 30 },
        6: { halign: "right", cellWidth: 35 },
      },
      styles: {
        fontSize: 9,
        cellPadding: 3,
        font: "Roboto",
      },
    });

    // Add footer
    const finalY = (doc as any).lastAutoTable.finalY || yPos + 50;
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Ngày xuất: ${new Date().toLocaleString("vi-VN")}`,
      15,
      finalY + 10,
    );

    // Save PDF
    doc.save(`Don_Dat_Hang_${purchaseOrder.po_number || "PO"}.pdf`);
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
