import React, { useState, useEffect } from "react";
import {
  Table,
  Card,
  Input,
  Select,
  Space,
  Typography,
  Tag,
  Button,
  Modal,
  Form,
  DatePicker,
  message,
  Row,
  Col,
  Divider,
  Grid,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  SearchOutlined,
  ReloadOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  PrinterOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { Statistic } from "antd";
import {
  getAllVATInvoicesOut,
  createVATInvoiceOut,
  issueVATInvoice,
  getAllWarehouses,
} from "@nam-viet-erp/services";
import type {
  IVATInvoiceOutWithDetails,
  IWarehouse,
  ICreateVATInvoiceOut,
  VATInvoiceStatus,
} from "../../../../../types";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;
const { useBreakpoint } = Grid;

const VATInvoicePOSPage: React.FC = () => {
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const isTablet = screens.md && !screens.lg;
  const [loading, setLoading] = useState(false);
  const [invoices, setInvoices] = useState<IVATInvoiceOutWithDetails[]>([]);
  const [warehouses, setWarehouses] = useState<IWarehouse[]>([]);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(
    null,
  );

  // Filters
  const [searchText, setSearchText] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState<number | null>(
    null,
  );

  useEffect(() => {
    loadData();
    loadMasterData();
  }, [selectedWarehouse]);

  const loadMasterData = async () => {
    try {
      const { data } = await getAllWarehouses();
      if (data) setWarehouses(data);
    } catch (error) {
      console.error("Error loading master data:", error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // Chỉ lấy các invoice có sale_order_id (từ POS)
      const { data, error } = await getAllVATInvoicesOut({
        warehouseId: selectedWarehouse || undefined,
        invoiceNo: searchText || undefined,
      });

      if (error) throw error;

      // Filter chỉ lấy các invoice có sale_order_id
      const posInvoices =
        data?.filter((inv) => inv.sale_order_id !== null) || [];
      setInvoices(posInvoices);
    } catch (error) {
      console.error("Error loading VAT invoices out:", error);
      message.error("Không thể tải danh sách hóa đơn VAT");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadData();
  };

  const handleIssueInvoice = (id: number) => {
    setSelectedInvoiceId(id);
    setShowIssueModal(true);
  };

  const confirmIssueInvoice = async () => {
    if (!selectedInvoiceId) return;
    try {
      const { data, error } = await issueVATInvoice(selectedInvoiceId);
      if (error) throw error;
      // data is now an array of issued invoices (may have multiple products)
      const invoiceCount = data ? data.length : 1;
      message.success(`Đã xuất hóa đơn VAT với ${invoiceCount} sản phẩm`);
      setShowIssueModal(false);
      setSelectedInvoiceId(null);
      loadData();
    } catch (error) {
      message.error("Không thể xuất hóa đơn VAT");
    }
  };

  const handlePrintInvoice = (record: IVATInvoiceOutWithDetails) => {
    if (!record.invoice_no) {
      message.warning("Hóa đơn chưa được xuất");
      return;
    }
    window.print();
  };

  const columns: ColumnsType<IVATInvoiceOutWithDetails> = [
    {
      title: "Số HĐ",
      dataIndex: "invoice_no",
      key: "invoice_no",
      width: 120,
      render: (text: string) => text || <Tag color="default">Chưa xuất</Tag>,
    },
    {
      title: "Ngày xuất",
      dataIndex: "invoice_date",
      key: "invoice_date",
      width: 120,
      render: (text: string) => (text ? dayjs(text).format("DD/MM/YYYY") : "-"),
    },
    {
      title: "Sản phẩm",
      key: "product",
      width: 200,
      ellipsis: true,
      render: (_, record) => (
        <div>
          <div>{record.products?.name || "-"}</div>
          <Text type="secondary" style={{ fontSize: "12px" }}>
            {record.products?.sku || "-"}
          </Text>
        </div>
      ),
    },
    {
      title: "Kho",
      dataIndex: "warehouses",
      key: "warehouses",
      width: 100,
      render: (warehouse: IWarehouse) => warehouse?.name || "-",
    },
    {
      title: "Số lượng",
      dataIndex: "quantity",
      key: "quantity",
      width: 100,
      align: "right",
    },
    {
      title: "Thành tiền",
      dataIndex: "total_amount",
      key: "total_amount",
      width: 130,
      align: "right",
      render: (amount: number) => `${amount?.toLocaleString("vi-VN")} đ` || "-",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status: VATInvoiceStatus) => {
        const statusMap = {
          pending: { color: "orange", text: "Chờ xuất" },
          done: { color: "green", text: "Đã xuất" },
          cancelled: { color: "red", text: "Đã hủy" },
        };
        const statusInfo = statusMap[status] || {
          color: "default",
          text: status,
        };
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
      },
    },
    {
      title: "Thao tác",
      key: "action",
      width: 120,
      render: (_, record) => (
        <Space>
          {record.status === "pending" && (
            <Button
              type="primary"
              size="small"
              onClick={() => handleIssueInvoice(record.id)}
            >
              Xuất HĐ
            </Button>
          )}
          {record.status === "done" && (
            <Button
              icon={<PrinterOutlined />}
              size="small"
              onClick={() => handlePrintInvoice(record)}
            >
              In
            </Button>
          )}
        </Space>
      ),
    },
  ];

  // Statistics
  const stats = {
    total: invoices.length,
    pending: invoices.filter((inv) => inv.status === "pending").length,
    done: invoices.filter((inv) => inv.status === "done").length,
    cancelled: invoices.filter((inv) => inv.status === "cancelled").length,
  };

  return (
    <div style={{ padding: isMobile ? "12px" : "24px" }}>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {/* Header */}
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col xs={24} sm={24} md={16}>
            <Title level={isMobile ? 4 : 2}>Xuất Hóa Đơn VAT cho POS</Title>
          </Col>
          <Col
            xs={24}
            sm={24}
            md={8}
            style={{ textAlign: screens.md ? "right" : "left" }}
          >
            <Button
              icon={<ReloadOutlined />}
              onClick={loadData}
              block={isMobile}
            >
              Làm mới
            </Button>
          </Col>
        </Row>

        {/* Stats Cards */}
        <Row gutter={16}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Tổng số"
                value={stats.total}
                prefix={<FileTextOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Chờ xuất"
                value={stats.pending}
                valueStyle={{ color: "#faad14" }}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Đã xuất"
                value={stats.done}
                valueStyle={{ color: "#52c41a" }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Đã hủy"
                value={stats.cancelled}
                valueStyle={{ color: "#ff4d4f" }}
                prefix={<CloseCircleOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {/* Filters */}
        <Card>
          <Space
            direction={isMobile ? "vertical" : "horizontal"}
            wrap
            style={{ width: "100%" }}
          >
            <Input
              placeholder="Tìm kiếm số hóa đơn"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={handleSearch}
              style={{ width: isMobile ? "100%" : 300 }}
            />
            <Select
              placeholder="Chọn kho"
              style={{ width: isMobile ? "100%" : 200 }}
              allowClear
              value={selectedWarehouse}
              onChange={setSelectedWarehouse}
            >
              {warehouses.map((wh) => (
                <Option key={wh.id} value={wh.id}>
                  {wh.name}
                </Option>
              ))}
            </Select>
            <Button type="primary" onClick={handleSearch} block={isMobile}>
              Tìm kiếm
            </Button>
          </Space>
        </Card>

        {/* Table */}
        <Card>
          <Table
            columns={columns}
            dataSource={invoices}
            loading={loading}
            rowKey="id"
            scroll={{ x: 900 }}
            size="middle"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Tổng ${total} hóa đơn`,
            }}
          />
        </Card>
      </Space>

      {/* Issue Modal */}
      <Modal
        title="Xuất hóa đơn VAT"
        open={showIssueModal}
        onOk={confirmIssueInvoice}
        onCancel={() => {
          setShowIssueModal(false);
          setSelectedInvoiceId(null);
        }}
        okText="Đồng ý"
        cancelText="Hủy"
      >
        Bạn có chắc chắn muốn xuất hóa đơn VAT này?
      </Modal>
    </div>
  );
};

export default VATInvoicePOSPage;
