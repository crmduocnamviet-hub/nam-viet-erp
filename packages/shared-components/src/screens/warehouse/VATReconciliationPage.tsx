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
  InputNumber,
  message,
  Tabs,
  Descriptions,
  Row,
  Col,
  Statistic,
  Divider,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  PlusOutlined,
  SearchOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import {
  getAllVATInvoicesIn,
  getAllVATInvoicesOut,
  createVATInvoiceIn,
  createVATInvoiceOut,
  issueVATInvoice,
  cancelVATInvoiceOut,
  getAllWarehouses,
  getProductWithInventory,
  getAllSuppliers,
} from "@nam-viet-erp/services";
import type {
  IVATInvoiceInWithDetails,
  IVATInvoiceOutWithDetails,
  IWarehouse,
  IProduct,
  ISupplier,
  ICreateVATInvoiceIn,
  ICreateVATInvoiceOut,
} from "../../../../../types";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { TextArea } = Input;

const VATReconciliationPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [incomingInvoices, setIncomingInvoices] = useState<
    IVATInvoiceInWithDetails[]
  >([]);
  const [outgoingInvoices, setOutgoingInvoices] = useState<
    IVATInvoiceOutWithDetails[]
  >([]);
  const [warehouses, setWarehouses] = useState<IWarehouse[]>([]);
  const [products, setProducts] = useState<IProduct[]>([]);
  const [suppliers, setSuppliers] = useState<ISupplier[]>([]);

  // Modal states
  const [showIncomingModal, setShowIncomingModal] = useState(false);
  const [showOutgoingModal, setShowOutgoingModal] = useState(false);
  const [formIncoming] = Form.useForm();
  const [formOutgoing] = Form.useForm();

  // Filters
  const [selectedWarehouse, setSelectedWarehouse] = useState<number | null>(
    null,
  );
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    loadData();
    loadMasterData();
  }, []);

  const loadMasterData = async () => {
    const [warehousesRes, productsRes, suppliersRes] = await Promise.all([
      getAllWarehouses(),
      getProductWithInventory(),
      getAllSuppliers(),
    ]);

    if (warehousesRes.data) setWarehouses(warehousesRes.data);
    if (productsRes.data) setProducts(productsRes.data);
    if (suppliersRes.data) setSuppliers(suppliersRes.data);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [inRes, outRes] = await Promise.all([
        getAllVATInvoicesIn({
          warehouseId: selectedWarehouse || undefined,
        }),
        getAllVATInvoicesOut({
          warehouseId: selectedWarehouse || undefined,
        }),
      ]);

      if (inRes.data) setIncomingInvoices(inRes.data);
      if (outRes.data) setOutgoingInvoices(outRes.data);
    } catch (error) {
      console.error("Error loading VAT invoices:", error);
      message.error("Không thể tải dữ liệu hóa đơn VAT");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIncoming = async (values: any) => {
    try {
      const data: ICreateVATInvoiceIn = {
        invoice_no: values.invoice_no,
        invoice_date: values.invoice_date.format("YYYY-MM-DD"),
        warehouse_id: values.warehouse_id,
        product_id: values.product_id,
        product_lot_id: values.product_lot_id || null,
        quantity: values.quantity,
        unit_price: values.unit_price || null,
        total_amount: values.total_amount || null,
        vat_amount: values.vat_amount || null,
        vat_percent: values.vat_percent || 0,
        supplier_id: values.supplier_id || null,
        purchase_order_id: values.purchase_order_id || null,
        notes: values.notes || null,
      };

      const { error } = await createVATInvoiceIn(data);

      if (error) throw error;

      message.success("Đã tạo hóa đơn VAT nhập");
      setShowIncomingModal(false);
      formIncoming.resetFields();
      loadData();
    } catch (error) {
      console.error("Error creating incoming VAT invoice:", error);
      message.error("Không thể tạo hóa đơn VAT nhập");
    }
  };

  const handleCreateOutgoing = async (values: any) => {
    try {
      const data: ICreateVATInvoiceOut = {
        warehouse_id: values.warehouse_id,
        product_id: values.product_id,
        product_lot_id: values.product_lot_id || null,
        quantity: values.quantity,
        unit_price: values.unit_price || null,
        total_amount: values.total_amount || null,
        vat_amount: values.vat_amount || null,
        vat_percent: values.vat_percent || 0,
        b2b_quote_id: values.b2b_quote_id || null,
        sale_order_id: values.sale_order_id || null,
        notes: values.notes || null,
      };

      const { error } = await createVATInvoiceOut(data);

      if (error) throw error;

      message.success("Đã tạo hóa đơn VAT xuất (trạng thái: Chờ)");
      setShowOutgoingModal(false);
      formOutgoing.resetFields();
      loadData();
    } catch (error) {
      console.error("Error creating outgoing VAT invoice:", error);
      message.error("Không thể tạo hóa đơn VAT xuất");
    }
  };

  const handleIssueInvoice = async (id: number) => {
    Modal.confirm({
      title: "Phát hành hóa đơn VAT",
      content:
        "Xác nhận phát hành hóa đơn VAT? Số hóa đơn sẽ được tạo tự động.",
      okText: "Phát hành",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          const { error } = await issueVATInvoice(id);
          if (error) throw error;

          message.success("Đã phát hành hóa đơn VAT");
          loadData();
        } catch (error) {
          console.error("Error issuing VAT invoice:", error);
          message.error("Không thể phát hành hóa đơn VAT");
        }
      },
    });
  };

  const handleCancelInvoice = async (id: number) => {
    Modal.confirm({
      title: "Hủy hóa đơn VAT",
      content: "Xác nhận hủy hóa đơn VAT?",
      okText: "Hủy hóa đơn",
      okType: "danger",
      cancelText: "Đóng",
      onOk: async () => {
        try {
          const { error } = await cancelVATInvoiceOut(id);
          if (error) throw error;

          message.success("Đã hủy hóa đơn VAT");
          loadData();
        } catch (error) {
          console.error("Error cancelling VAT invoice:", error);
          message.error("Không thể hủy hóa đơn VAT");
        }
      },
    });
  };

  const incomingColumns: ColumnsType<IVATInvoiceInWithDetails> = [
    {
      title: "Số HĐ",
      dataIndex: "invoice_no",
      key: "invoice_no",
      width: 150,
      fixed: "left",
    },
    {
      title: "Ngày HĐ",
      dataIndex: "invoice_date",
      key: "invoice_date",
      width: 120,
      render: (date) => dayjs(date).format("DD/MM/YYYY"),
      sorter: (a, b) =>
        dayjs(a.invoice_date).unix() - dayjs(b.invoice_date).unix(),
    },
    {
      title: "Kho",
      key: "warehouse",
      width: 150,
      render: (_, record) => record.warehouses?.name || "-",
    },
    {
      title: "Sản phẩm",
      key: "product",
      width: 200,
      render: (_, record) => (
        <div>
          <div>
            <Text strong>{record.products?.name || "-"}</Text>
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: "12px" }}>
              {record.products?.sku || ""}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: "Lô",
      key: "lot",
      width: 120,
      render: (_, record) => record.product_lots?.lot_number || "-",
    },
    {
      title: "Số lượng",
      dataIndex: "quantity",
      key: "quantity",
      width: 100,
      align: "right",
      render: (value) => Number(value).toLocaleString(),
    },
    {
      title: "Đơn giá",
      dataIndex: "unit_price",
      key: "unit_price",
      width: 120,
      align: "right",
      render: (value) => (value ? `${Number(value).toLocaleString()} đ` : "-"),
    },
    {
      title: "Tiền VAT",
      dataIndex: "vat_amount",
      key: "vat_amount",
      width: 120,
      align: "right",
      render: (value) => (value ? `${Number(value).toLocaleString()} đ` : "-"),
    },
    {
      title: "Tổng tiền",
      dataIndex: "total_amount",
      key: "total_amount",
      width: 140,
      align: "right",
      render: (value) =>
        value ? <Text strong>{Number(value).toLocaleString()} đ</Text> : "-",
    },
    {
      title: "NCC",
      key: "supplier",
      width: 150,
      render: (_, record) => record.suppliers?.name || "-",
    },
  ];

  const outgoingColumns: ColumnsType<IVATInvoiceOutWithDetails> = [
    {
      title: "Số HĐ",
      dataIndex: "invoice_no",
      key: "invoice_no",
      width: 150,
      fixed: "left",
      render: (value) => value || <Text type="secondary">Chưa phát hành</Text>,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status) => {
        const statusConfig = {
          pending: {
            color: "orange",
            icon: <ClockCircleOutlined />,
            text: "Chờ",
          },
          done: {
            color: "green",
            icon: <CheckCircleOutlined />,
            text: "Đã phát hành",
          },
          cancelled: {
            color: "red",
            icon: <CloseCircleOutlined />,
            text: "Đã hủy",
          },
        };
        const config = statusConfig[status as keyof typeof statusConfig];
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.text}
          </Tag>
        );
      },
      filters: [
        { text: "Chờ", value: "pending" },
        { text: "Đã phát hành", value: "done" },
        { text: "Đã hủy", value: "cancelled" },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: "Ngày tạo",
      dataIndex: "created_at",
      key: "created_at",
      width: 120,
      render: (date) => dayjs(date).format("DD/MM/YYYY"),
      sorter: (a, b) => dayjs(a.created_at).unix() - dayjs(b.created_at).unix(),
    },
    {
      title: "Kho",
      key: "warehouse",
      width: 150,
      render: (_, record) => record.warehouses?.name || "-",
    },
    {
      title: "Sản phẩm",
      key: "product",
      width: 200,
      render: (_, record) => (
        <div>
          <div>
            <Text strong>{record.products?.name || "-"}</Text>
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: "12px" }}>
              {record.products?.sku || ""}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: "Lô",
      key: "lot",
      width: 120,
      render: (_, record) => record.product_lots?.lot_number || "-",
    },
    {
      title: "Số lượng",
      dataIndex: "quantity",
      key: "quantity",
      width: 100,
      align: "right",
      render: (value) => Number(value).toLocaleString(),
    },
    {
      title: "Tổng tiền",
      dataIndex: "total_amount",
      key: "total_amount",
      width: 140,
      align: "right",
      render: (value) =>
        value ? <Text strong>{Number(value).toLocaleString()} đ</Text> : "-",
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 150,
      fixed: "right",
      render: (_, record) => (
        <Space>
          {record.status === "pending" && (
            <>
              <Button
                type="link"
                size="small"
                onClick={() => handleIssueInvoice(record.id)}
              >
                Phát hành
              </Button>
              <Button
                type="link"
                size="small"
                danger
                onClick={() => handleCancelInvoice(record.id)}
              >
                Hủy
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  const stats = {
    incoming: {
      total: incomingInvoices.length,
      totalQuantity: incomingInvoices.reduce(
        (sum, inv) => sum + Number(inv.quantity),
        0,
      ),
      totalAmount: incomingInvoices.reduce(
        (sum, inv) => sum + Number(inv.total_amount || 0),
        0,
      ),
    },
    outgoing: {
      total: outgoingInvoices.length,
      pending: outgoingInvoices.filter((inv) => inv.status === "pending")
        .length,
      done: outgoingInvoices.filter((inv) => inv.status === "done").length,
      cancelled: outgoingInvoices.filter((inv) => inv.status === "cancelled")
        .length,
      totalQuantity: outgoingInvoices
        .filter((inv) => inv.status === "done")
        .reduce((sum, inv) => sum + Number(inv.quantity), 0),
      totalAmount: outgoingInvoices
        .filter((inv) => inv.status === "done")
        .reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0),
    },
  };

  return (
    <div style={{ padding: "24px" }}>
      <div
        style={{
          marginBottom: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Title level={2} style={{ margin: 0 }}>
          🧾 Đối Chiếu VAT
        </Title>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: "16px" }}>
        <Space wrap>
          <Select
            placeholder="Chọn kho"
            style={{ width: 200 }}
            value={selectedWarehouse}
            onChange={(value) => {
              setSelectedWarehouse(value);
              setTimeout(loadData, 100);
            }}
            allowClear
          >
            {warehouses.map((warehouse) => (
              <Option key={warehouse.id} value={warehouse.id}>
                {warehouse.name}
              </Option>
            ))}
          </Select>
        </Space>
      </Card>

      {/* Tabs for Incoming and Outgoing */}
      <Tabs defaultActiveKey="incoming">
        <TabPane tab="📥 Hóa đơn nhập VAT" key="incoming">
          {/* Statistics */}
          <Row gutter={16} style={{ marginBottom: "16px" }}>
            <Col span={8}>
              <Card>
                <Statistic
                  title="Tổng hóa đơn nhập"
                  value={stats.incoming.total}
                  suffix="HĐ"
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="Tổng số lượng"
                  value={stats.incoming.totalQuantity}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="Tổng giá trị"
                  value={stats.incoming.totalAmount}
                  suffix="đ"
                />
              </Card>
            </Col>
          </Row>

          <Card
            extra={
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setShowIncomingModal(true)}
              >
                Thêm HĐ nhập
              </Button>
            }
          >
            <Table
              columns={incomingColumns}
              dataSource={incomingInvoices}
              rowKey="id"
              loading={loading}
              scroll={{ x: 1500 }}
              pagination={{
                defaultPageSize: 20,
                showSizeChanger: true,
                showTotal: (total) => `Tổng ${total} hóa đơn`,
              }}
            />
          </Card>
        </TabPane>

        <TabPane tab="📤 Hóa đơn xuất VAT" key="outgoing">
          {/* Statistics */}
          <Row gutter={16} style={{ marginBottom: "16px" }}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Tổng hóa đơn xuất"
                  value={stats.outgoing.total}
                  suffix="HĐ"
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Chờ phát hành"
                  value={stats.outgoing.pending}
                  valueStyle={{ color: "#faad14" }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Đã phát hành"
                  value={stats.outgoing.done}
                  valueStyle={{ color: "#52c41a" }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Tổng giá trị (đã phát hành)"
                  value={stats.outgoing.totalAmount}
                  suffix="đ"
                />
              </Card>
            </Col>
          </Row>

          <Card
            extra={
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setShowOutgoingModal(true)}
              >
                Thêm HĐ xuất
              </Button>
            }
          >
            <Table
              columns={outgoingColumns}
              dataSource={outgoingInvoices}
              rowKey="id"
              loading={loading}
              scroll={{ x: 1500 }}
              pagination={{
                defaultPageSize: 20,
                showSizeChanger: true,
                showTotal: (total) => `Tổng ${total} hóa đơn`,
              }}
            />
          </Card>
        </TabPane>
      </Tabs>

      {/* Modal: Create Incoming Invoice */}
      <Modal
        title="Thêm Hóa Đơn VAT Nhập"
        open={showIncomingModal}
        onCancel={() => {
          setShowIncomingModal(false);
          formIncoming.resetFields();
        }}
        onOk={() => formIncoming.submit()}
        width={700}
        okText="Tạo"
        cancelText="Hủy"
      >
        <Form
          form={formIncoming}
          layout="vertical"
          onFinish={handleCreateIncoming}
        >
          <Form.Item
            name="invoice_no"
            label="Số hóa đơn"
            rules={[{ required: true, message: "Vui lòng nhập số hóa đơn" }]}
          >
            <Input placeholder="VD: VAT001" />
          </Form.Item>

          <Form.Item
            name="invoice_date"
            label="Ngày hóa đơn"
            rules={[{ required: true, message: "Vui lòng chọn ngày" }]}
          >
            <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item
            name="warehouse_id"
            label="Kho"
            rules={[{ required: true, message: "Vui lòng chọn kho" }]}
          >
            <Select placeholder="Chọn kho">
              {warehouses.map((w) => (
                <Option key={w.id} value={w.id}>
                  {w.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="product_id"
            label="Sản phẩm"
            rules={[{ required: true, message: "Vui lòng chọn sản phẩm" }]}
          >
            <Select
              showSearch
              placeholder="Chọn sản phẩm"
              optionFilterProp="children"
            >
              {products.map((p) => (
                <Option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="supplier_id" label="Nhà cung cấp">
            <Select placeholder="Chọn nhà cung cấp" allowClear>
              {suppliers.map((s) => (
                <Option key={s.id} value={s.id}>
                  {s.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="quantity"
            label="Số lượng"
            rules={[{ required: true, message: "Vui lòng nhập số lượng" }]}
          >
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="unit_price" label="Đơn giá">
                <InputNumber
                  min={0}
                  style={{ width: "100%" }}
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="vat_percent" label="% VAT" initialValue={10}>
                <InputNumber min={0} max={100} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="vat_amount" label="Tiền VAT">
                <InputNumber
                  min={0}
                  style={{ width: "100%" }}
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="total_amount" label="Tổng tiền">
                <InputNumber
                  min={0}
                  style={{ width: "100%" }}
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="notes" label="Ghi chú">
            <TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal: Create Outgoing Invoice */}
      <Modal
        title="Thêm Hóa Đơn VAT Xuất"
        open={showOutgoingModal}
        onCancel={() => {
          setShowOutgoingModal(false);
          formOutgoing.resetFields();
        }}
        onOk={() => formOutgoing.submit()}
        width={700}
        okText="Tạo"
        cancelText="Hủy"
      >
        <Form
          form={formOutgoing}
          layout="vertical"
          onFinish={handleCreateOutgoing}
        >
          <Form.Item
            name="warehouse_id"
            label="Kho"
            rules={[{ required: true, message: "Vui lòng chọn kho" }]}
          >
            <Select placeholder="Chọn kho">
              {warehouses.map((w) => (
                <Option key={w.id} value={w.id}>
                  {w.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="product_id"
            label="Sản phẩm"
            rules={[{ required: true, message: "Vui lòng chọn sản phẩm" }]}
          >
            <Select
              showSearch
              placeholder="Chọn sản phẩm"
              optionFilterProp="children"
            >
              {products.map((p) => (
                <Option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="quantity"
            label="Số lượng"
            rules={[{ required: true, message: "Vui lòng nhập số lượng" }]}
          >
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="unit_price" label="Đơn giá">
                <InputNumber
                  min={0}
                  style={{ width: "100%" }}
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="vat_percent" label="% VAT" initialValue={10}>
                <InputNumber min={0} max={100} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="vat_amount" label="Tiền VAT">
                <InputNumber
                  min={0}
                  style={{ width: "100%" }}
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="total_amount" label="Tổng tiền">
                <InputNumber
                  min={0}
                  style={{ width: "100%" }}
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="b2b_quote_id" label="Đơn hàng B2B (ID)">
            <InputNumber
              min={0}
              style={{ width: "100%" }}
              placeholder="Tùy chọn"
            />
          </Form.Item>

          <Form.Item name="sale_order_id" label="Đơn hàng POS (ID)">
            <Input placeholder="Tùy chọn" />
          </Form.Item>

          <Form.Item name="notes" label="Ghi chú">
            <TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default VATReconciliationPage;
