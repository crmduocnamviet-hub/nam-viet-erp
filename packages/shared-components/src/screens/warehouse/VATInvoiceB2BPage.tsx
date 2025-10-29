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
  PlusOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { Statistic } from "antd";
import {
  getAllVATInvoicesOut,
  createVATInvoiceOut,
  issueVATInvoice,
  cancelVATInvoiceOut,
  getAllWarehouses,
  getProductWithInventory,
} from "@nam-viet-erp/services";
import { getB2BQuotes } from "@nam-viet-erp/services";
import type {
  IVATInvoiceOutWithDetails,
  IWarehouse,
  IProduct,
  ICreateVATInvoiceOut,
  VATInvoiceStatus,
  IB2BQuote,
} from "../../../../../types";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;
const { useBreakpoint } = Grid;

const VATInvoiceB2BPage: React.FC = () => {
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const isTablet = screens.md && !screens.lg;
  const [loading, setLoading] = useState(false);
  const [invoices, setInvoices] = useState<IVATInvoiceOutWithDetails[]>([]);
  const [warehouses, setWarehouses] = useState<IWarehouse[]>([]);
  const [products, setProducts] = useState<IProduct[]>([]);
  const [b2bQuotes, setB2bQuotes] = useState<IB2BQuote[]>([]);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(
    null,
  );
  const [form] = Form.useForm();

  // Multiple products support
  const [invoiceItems, setInvoiceItems] = useState<any[]>([]);

  // Filters
  const [searchText, setSearchText] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState<number | null>(
    null,
  );
  const [statusFilter, setStatusFilter] = useState<VATInvoiceStatus | "all">(
    "all",
  );

  useEffect(() => {
    loadData();
    loadMasterData();
  }, [selectedWarehouse, statusFilter]);

  const loadMasterData = async () => {
    try {
      const [warehousesRes, productsRes, b2bQuotesRes] = await Promise.all([
        getAllWarehouses(),
        getProductWithInventory(),
        getB2BQuotes(),
      ]);
      if (warehousesRes.data) setWarehouses(warehousesRes.data);
      if (productsRes.data) setProducts(productsRes.data);
      if (b2bQuotesRes.data) setB2bQuotes(b2bQuotesRes.data);
    } catch (error) {
      console.error("Error loading master data:", error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // Chỉ lấy các invoice có b2b_quote_id (từ B2B)
      const { data, error } = await getAllVATInvoicesOut({
        warehouseId: selectedWarehouse || undefined,
        invoiceNo: searchText || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
      });

      if (error) throw error;

      // Filter chỉ lấy các invoice có b2b_quote_id
      const b2bInvoices =
        data?.filter((inv) => inv.b2b_quote_id !== null) || [];
      setInvoices(b2bInvoices);
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

  // Handle adding multiple products to invoice
  const handleAddProductToInvoice = (values: any) => {
    const selectedProducts = values.product_id;
    const productsToAdd = Array.isArray(selectedProducts)
      ? selectedProducts
      : [selectedProducts];

    if (productsToAdd.length === 0) {
      message.error("Vui lòng chọn ít nhất 1 sản phẩm");
      return;
    }

    if (!values.quantity || !values.unit_price) {
      message.error("Vui lòng nhập Số lượng và Đơn giá");
      return;
    }

    const quantity = Math.floor(values.quantity); // Integer quantity
    const unitPrice = values.unit_price;
    const vatPercent = values.vat_percent || 10;
    const totalAmount = quantity * unitPrice;
    const vatAmount = (totalAmount * vatPercent) / 100;

    const newItems = productsToAdd.map((productId: number) => ({
      id: Date.now() + productId,
      product_id: productId,
      product_lot_id: null,
      quantity: quantity,
      unit_price: unitPrice,
      total_amount: totalAmount,
      vat_amount: vatAmount,
      vat_percent: vatPercent,
      notes: values.notes || null,
    }));

    setInvoiceItems([...invoiceItems, ...newItems]);

    // Reset product fields but keep header info
    form.resetFields([
      "product_id",
      "quantity",
      "unit_price",
      "vat_percent",
      "notes",
    ]);
    message.success(`Đã thêm ${newItems.length} sản phẩm vào hóa đơn`);
  };

  const handleRemoveProductFromInvoice = (id: number) => {
    setInvoiceItems(invoiceItems.filter((item) => item.id !== id));
    message.success("Đã xóa sản phẩm khỏi hóa đơn");
  };

  const handleSubmitInvoice = async () => {
    if (invoiceItems.length === 0) {
      message.error("Vui lòng thêm ít nhất 1 sản phẩm vào hóa đơn");
      return;
    }

    const warehouseId = form.getFieldValue("warehouse_id");
    const b2bQuoteId = form.getFieldValue("b2b_quote_id");

    if (!warehouseId) {
      message.error("Vui lòng chọn kho");
      return;
    }

    try {
      // Create multiple invoice records (one per product)
      const promises = invoiceItems.map((item) => {
        const invoiceData: ICreateVATInvoiceOut = {
          warehouse_id: warehouseId,
          product_id: item.product_id,
          product_lot_id: null,
          quantity: item.quantity,
          unit_price: item.unit_price || null,
          total_amount: item.total_amount || null,
          vat_amount: item.vat_amount || null,
          vat_percent: item.vat_percent || 0,
          b2b_quote_id: b2bQuoteId || null,
          notes: item.notes || null,
        };

        return createVATInvoiceOut(invoiceData);
      });

      const results = await Promise.all(promises);
      const errors = results.filter((r) => r.error);

      if (errors.length > 0) {
        throw errors[0].error;
      }

      message.success(`Đã tạo hóa đơn VAT với ${invoiceItems.length} sản phẩm`);
      setShowCreateModal(false);
      form.resetFields();
      setInvoiceItems([]);
      loadData();
    } catch (error) {
      console.error("Error saving VAT invoice:", error);
      message.error("Không thể lưu hóa đơn VAT");
    }
  };

  const handleIssueInvoice = (id: number) => {
    console.log("handleIssueInvoice called with id:", id);
    setSelectedInvoiceId(id);
    setShowIssueModal(true);
  };

  const confirmIssueInvoice = async () => {
    if (!selectedInvoiceId) return;
    console.log("onOk clicked, issuing VAT invoice for id:", selectedInvoiceId);
    try {
      const { data, error } = await issueVATInvoice(selectedInvoiceId);
      console.log("issueVATInvoice result:", { data, error });
      if (error) {
        console.error("Error issuing VAT invoice:", error);
        message.error(
          `Không thể xuất hóa đơn VAT: ${error.message || JSON.stringify(error)}`,
        );
        return;
      }
      // data is now an array of issued invoices (may have multiple products)
      const invoiceCount = data ? data.length : 1;
      message.success(`Đã xuất hóa đơn VAT với ${invoiceCount} sản phẩm`);
      setShowIssueModal(false);
      setSelectedInvoiceId(null);
      loadData();
    } catch (error: any) {
      console.error("Error issuing VAT invoice:", error);
      message.error(
        `Không thể xuất hóa đơn VAT: ${error?.message || JSON.stringify(error)}`,
      );
    }
  };

  const handleCancelInvoice = (id: number) => {
    setSelectedInvoiceId(id);
    setShowCancelModal(true);
  };

  const confirmCancelInvoice = async () => {
    if (!selectedInvoiceId) return;
    try {
      const { data, error } = await cancelVATInvoiceOut(selectedInvoiceId);
      if (error) {
        console.error("Error cancelling VAT invoice:", error);
        message.error(
          `Không thể hủy hóa đơn VAT: ${error.message || JSON.stringify(error)}`,
        );
        return;
      }
      message.success("Hủy hóa đơn VAT thành công");
      setShowCancelModal(false);
      setSelectedInvoiceId(null);
      loadData();
    } catch (error: any) {
      console.error("Error cancelling VAT invoice:", error);
      message.error(
        `Không thể hủy hóa đơn VAT: ${error?.message || JSON.stringify(error)}`,
      );
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
      title: "B2B Quote",
      dataIndex: "b2b_quotes",
      key: "b2b_quote",
      width: 120,
      render: (quote: any) => quote?.quote_number || "-",
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
            <>
              <Button
                type="primary"
                size="small"
                onClick={() => handleIssueInvoice(record.id)}
              >
                Xuất HĐ
              </Button>
              <Button
                danger
                size="small"
                onClick={() => handleCancelInvoice(record.id)}
              >
                Hủy
              </Button>
            </>
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
            <Title level={isMobile ? 4 : 2}>Xuất Hóa Đơn VAT cho B2B</Title>
          </Col>
          <Col
            xs={24}
            sm={24}
            md={8}
            style={{ textAlign: screens.md ? "right" : "left" }}
          >
            <Space
              direction={isMobile ? "vertical" : "horizontal"}
              style={{ width: "100%" }}
            >
              <Button
                icon={<ReloadOutlined />}
                onClick={loadData}
                block={isMobile}
              >
                Làm mới
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setShowCreateModal(true)}
                block={isMobile}
              >
                Tạo HĐ VAT mới
              </Button>
            </Space>
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
            <Select
              placeholder="Trạng thái"
              style={{ width: isMobile ? "100%" : 150 }}
              value={statusFilter}
              onChange={setStatusFilter}
            >
              <Option value="all">Tất cả</Option>
              <Option value="pending">Chờ xuất</Option>
              <Option value="done">Đã xuất</Option>
              <Option value="cancelled">Đã hủy</Option>
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
            scroll={{ x: 1000 }}
            size="middle"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Tổng ${total} hóa đơn`,
            }}
          />
        </Card>
      </Space>
      {/* Create Modal */}
      <Modal
        title="Tạo HĐ VAT mới (B2B)"
        open={showCreateModal}
        onCancel={() => {
          setShowCreateModal(false);
          form.resetFields();
        }}
        footer={null}
        width={isMobile ? "95%" : isTablet ? "90%" : 800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddProductToInvoice}
          initialValues={{
            vat_percent: 10,
          }}
        >
          <Row gutter={16}>
            <Col xs={24} sm={24} md={12}>
              <Form.Item
                label="Kho"
                name="warehouse_id"
                rules={[{ required: true, message: "Vui lòng chọn kho" }]}
              >
                <Select placeholder="Chọn kho">
                  {warehouses.map((wh) => (
                    <Option key={wh.id} value={wh.id}>
                      {wh.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} md={12}>
              <Form.Item
                label="Sản phẩm (có thể chọn nhiều)"
                name="product_id"
                rules={[{ required: true, message: "Vui lòng chọn sản phẩm" }]}
              >
                <Select
                  mode="multiple"
                  showSearch
                  placeholder="Chọn sản phẩm (có thể chọn nhiều)"
                  filterOption={(input, option) =>
                    String(option?.label || option?.children || "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                >
                  {products.map((product) => (
                    <Option key={product.id} value={product.id}>
                      {product.name} ({product.sku})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {/* Display invoice items list */}
          {invoiceItems.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <Divider orientation="left">
                <Text strong>Sản phẩm đã thêm ({invoiceItems.length})</Text>
              </Divider>
              <Table
                dataSource={invoiceItems}
                columns={[
                  {
                    title: "SP",
                    dataIndex: "product_id",
                    key: "product_id",
                    render: (id) =>
                      products.find((p) => p.id === id)?.name || "-",
                    ellipsis: true,
                  },
                  {
                    title: "SL",
                    dataIndex: "quantity",
                    key: "quantity",
                    align: "right",
                  },
                  {
                    title: "Đơn giá",
                    dataIndex: "unit_price",
                    key: "unit_price",
                    render: (v) => (v ? `₫${v.toLocaleString()}` : "-"),
                    align: "right",
                  },
                  {
                    title: "Thành tiền",
                    dataIndex: "total_amount",
                    key: "total_amount",
                    render: (v) => (v ? `₫${v.toLocaleString()}` : "-"),
                    align: "right",
                  },
                  {
                    title: "VAT",
                    dataIndex: "vat_amount",
                    key: "vat_amount",
                    render: (v) => (v ? `₫${v.toLocaleString()}` : "-"),
                    align: "right",
                  },
                  {
                    title: "Thao tác",
                    key: "action",
                    render: (_, record: any) => (
                      <Button
                        type="text"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() =>
                          handleRemoveProductFromInvoice(record.id)
                        }
                      >
                        Xóa
                      </Button>
                    ),
                  },
                ]}
                pagination={false}
                size="small"
                rowKey="id"
              />
            </div>
          )}

          <Row gutter={16}>
            <Col xs={24} sm={24} md={12}>
              <Form.Item
                label="Số lượng"
                name="quantity"
                rules={[{ required: true, message: "Vui lòng nhập số lượng" }]}
              >
                <Input type="number" placeholder="Nhập số lượng" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} md={12}>
              <Form.Item
                label="Đơn giá"
                name="unit_price"
                rules={[{ required: true, message: "Vui lòng nhập đơn giá" }]}
              >
                <Input type="number" placeholder="Nhập đơn giá" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={24} md={12}>
              <Form.Item label="% VAT" name="vat_percent" initialValue={10}>
                <Input type="number" placeholder="Nhập % VAT" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} md={12}>
              <Form.Item label="B2B Quote (Optional)" name="b2b_quote_id">
                <Select
                  showSearch
                  placeholder="Chọn B2B Quote"
                  allowClear
                  filterOption={(input, option) =>
                    String(option?.label || option?.children || "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                >
                  {b2bQuotes.map((quote) => (
                    <Option key={quote.quote_id} value={quote.quote_id}>
                      {quote.quote_number} - {quote.customer_name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Ghi chú" name="notes">
            <Input.TextArea rows={3} placeholder="Nhập ghi chú (nếu có)" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                + Thêm sản phẩm
              </Button>
              <Button
                type="primary"
                danger
                onClick={handleSubmitInvoice}
                disabled={invoiceItems.length === 0}
              >
                Lưu hóa đơn ({invoiceItems.length} SP)
              </Button>
              <Button
                onClick={() => {
                  setShowCreateModal(false);
                  setInvoiceItems([]);
                  form.resetFields();
                }}
              >
                Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

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

      {/* Cancel Modal */}
      <Modal
        title="Hủy hóa đơn VAT"
        open={showCancelModal}
        onOk={confirmCancelInvoice}
        onCancel={() => {
          setShowCancelModal(false);
          setSelectedInvoiceId(null);
        }}
        okText="Đồng ý"
        cancelText="Hủy"
      >
        Bạn có chắc chắn muốn hủy hóa đơn VAT này?
      </Modal>
    </div>
  );
};

export default VATInvoiceB2BPage;
