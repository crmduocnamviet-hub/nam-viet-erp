import React, { useState } from "react";
import {
  Card,
  Table,
  Space,
  Typography,
  Tag,
  Row,
  Col,
  Statistic,
  DatePicker,
  Button,
  Modal,
  Descriptions,
  Tabs,
} from "antd";
import {
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import type { TabsProps } from "antd";
import PageLayout from "../../components/PageLayout";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const VATReconciliationPage: React.FC = () => {
  const [dateRange, setDateRange] = useState<any>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Mock data - will be replaced with real API calls
  const mockPurchaseInvoices: any[] = [];
  const mockSalesInvoices: any[] = [];
  const mockMatchingRecords: any[] = [];

  const purchaseInvoiceColumns = [
    {
      title: "Số HĐ",
      dataIndex: "invoice_number",
      key: "invoice_number",
      width: 150,
      render: (text: string, record: any) => (
        <a onClick={() => handleViewInvoice(record)}>{text}</a>
      ),
    },
    {
      title: "Nhà Cung Cấp",
      dataIndex: "supplier_name",
      key: "supplier_name",
      width: 200,
    },
    {
      title: "Ngày HĐ",
      dataIndex: "invoice_date",
      key: "invoice_date",
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString("vi-VN"),
    },
    {
      title: "Tổng Tiền",
      dataIndex: "total_amount",
      key: "total_amount",
      align: "right" as const,
      width: 150,
      render: (amount: number) =>
        amount?.toLocaleString("vi-VN", {
          style: "currency",
          currency: "VND",
        }),
    },
    {
      title: "Tiền VAT",
      dataIndex: "vat_amount",
      key: "vat_amount",
      align: "right" as const,
      width: 150,
      render: (amount: number) =>
        amount?.toLocaleString("vi-VN", {
          style: "currency",
          currency: "VND",
        }),
    },
    {
      title: "Trạng Thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status: string) => {
        const config: Record<string, { color: string; text: string }> = {
          pending: { color: "default", text: "Chưa đối chiếu" },
          partial: { color: "warning", text: "Đối chiếu 1 phần" },
          matched: { color: "success", text: "Đã đối chiếu" },
        };
        const c = config[status] || { color: "default", text: status };
        return <Tag color={c.color}>{c.text}</Tag>;
      },
    },
  ];

  const salesInvoiceColumns = [
    {
      title: "Số HĐ",
      dataIndex: "invoice_number",
      key: "invoice_number",
      width: 150,
      render: (text: string, record: any) => (
        <a onClick={() => handleViewInvoice(record)}>{text}</a>
      ),
    },
    {
      title: "Khách Hàng",
      dataIndex: "customer_name",
      key: "customer_name",
      width: 200,
    },
    {
      title: "Mã Đơn",
      dataIndex: "sales_order_id",
      key: "sales_order_id",
      width: 120,
      render: (id: number) => `#${id}`,
    },
    {
      title: "Ngày HĐ",
      dataIndex: "invoice_date",
      key: "invoice_date",
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString("vi-VN"),
    },
    {
      title: "Tổng Tiền",
      dataIndex: "total_amount",
      key: "total_amount",
      align: "right" as const,
      width: 150,
      render: (amount: number) =>
        amount?.toLocaleString("vi-VN", {
          style: "currency",
          currency: "VND",
        }),
    },
    {
      title: "Tiền VAT",
      dataIndex: "vat_amount",
      key: "vat_amount",
      align: "right" as const,
      width: 150,
      render: (amount: number) =>
        amount?.toLocaleString("vi-VN", {
          style: "currency",
          currency: "VND",
        }),
    },
    {
      title: "Trạng Thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status: string) => {
        const config: Record<string, { color: string; text: string }> = {
          pending: { color: "default", text: "Chưa đối chiếu" },
          matched: { color: "success", text: "Đã đối chiếu" },
        };
        const c = config[status] || { color: "default", text: status };
        return <Tag color={c.color}>{c.text}</Tag>;
      },
    },
  ];

  const matchingColumns = [
    {
      title: "Ngày Đối Chiếu",
      dataIndex: "matched_at",
      key: "matched_at",
      width: 150,
      render: (date: string) =>
        new Date(date).toLocaleDateString("vi-VN") +
        " " +
        new Date(date).toLocaleTimeString("vi-VN"),
    },
    {
      title: "Sản Phẩm",
      dataIndex: "product_name",
      key: "product_name",
      width: 200,
    },
    {
      title: "HĐ Mua",
      dataIndex: "purchase_invoice_number",
      key: "purchase_invoice_number",
      width: 150,
    },
    {
      title: "HĐ Bán",
      dataIndex: "sales_invoice_number",
      key: "sales_invoice_number",
      width: 150,
    },
    {
      title: "SL Đối Chiếu",
      dataIndex: "matched_quantity",
      key: "matched_quantity",
      align: "center" as const,
      width: 120,
      render: (qty: number) => <Tag color="blue">{qty}</Tag>,
    },
    {
      title: "Người Thực Hiện",
      dataIndex: "matched_by_name",
      key: "matched_by_name",
      width: 150,
    },
  ];

  const handleViewInvoice = (invoice: any) => {
    setSelectedInvoice(invoice);
    setModalVisible(true);
  };

  const handleExportReport = () => {
    console.log("Exporting VAT reconciliation report");
    // Will implement export logic
  };

  const tabItems: TabsProps["items"] = [
    {
      key: "purchase",
      label: (
        <Space>
          <FileTextOutlined />
          Hóa Đơn Mua
        </Space>
      ),
      children: (
        <Table
          columns={purchaseInvoiceColumns}
          dataSource={mockPurchaseInvoices}
          rowKey="id"
          scroll={{ x: 1000 }}
          pagination={{
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} hóa đơn`,
          }}
        />
      ),
    },
    {
      key: "sales",
      label: (
        <Space>
          <FileTextOutlined />
          Hóa Đơn Bán
        </Space>
      ),
      children: (
        <Table
          columns={salesInvoiceColumns}
          dataSource={mockSalesInvoices}
          rowKey="id"
          scroll={{ x: 1000 }}
          pagination={{
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} hóa đơn`,
          }}
        />
      ),
    },
    {
      key: "matching",
      label: (
        <Space>
          <CheckCircleOutlined />
          Lịch Sử Đối Chiếu
        </Space>
      ),
      children: (
        <Table
          columns={matchingColumns}
          dataSource={mockMatchingRecords}
          rowKey="id"
          scroll={{ x: 1000 }}
          pagination={{
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} bản ghi`,
          }}
        />
      ),
    },
  ];

  return (
    <PageLayout
      title="Đối Chiếu VAT"
      extra={
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={handleExportReport}
        >
          Xuất Báo Cáo
        </Button>
      }
    >
      {/* Statistics */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng HĐ Mua"
              value={0}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng HĐ Bán"
              value={0}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Đã Đối Chiếu"
              value={0}
              valueStyle={{ color: "#52c41a" }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Chưa Đối Chiếu"
              value={0}
              valueStyle={{ color: "#faad14" }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Text>Khoảng thời gian:</Text>
          <RangePicker
            value={dateRange}
            onChange={setDateRange}
            placeholder={["Từ ngày", "Đến ngày"]}
          />
        </Space>
      </Card>

      {/* Tabs */}
      <Card>
        <Tabs items={tabItems} />
      </Card>

      {/* Invoice Detail Modal */}
      <Modal
        title={`Chi Tiết Hóa Đơn: ${selectedInvoice?.invoice_number || ""}`}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setModalVisible(false)}>
            Đóng
          </Button>,
        ]}
        width={800}
      >
        {selectedInvoice && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="Số HĐ" span={2}>
              {selectedInvoice.invoice_number}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày HĐ">
              {new Date(selectedInvoice.invoice_date).toLocaleDateString(
                "vi-VN",
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Trạng Thái">
              <Tag color="success">
                {selectedInvoice.status === "matched"
                  ? "Đã đối chiếu"
                  : "Chưa đối chiếu"}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Tổng Tiền" span={2}>
              {selectedInvoice.total_amount?.toLocaleString("vi-VN", {
                style: "currency",
                currency: "VND",
              })}
            </Descriptions.Item>
            <Descriptions.Item label="Tiền VAT" span={2}>
              {selectedInvoice.vat_amount?.toLocaleString("vi-VN", {
                style: "currency",
                currency: "VND",
              })}
            </Descriptions.Item>
            <Descriptions.Item label="Thuế Suất">
              {selectedInvoice.vat_rate}%
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </PageLayout>
  );
};

export default VATReconciliationPage;
