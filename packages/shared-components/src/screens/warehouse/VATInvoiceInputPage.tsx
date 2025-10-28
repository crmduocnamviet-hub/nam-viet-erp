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
  Row,
  Col,
  Divider,
  Popconfirm,
  Grid,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  EditOutlined,
  DeleteOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import {
  getAllVATInvoicesIn,
  createVATInvoiceIn,
  updateVATInvoiceIn,
  deleteVATInvoiceIn,
  getAllWarehouses,
  getAllSuppliers,
  getProductWithInventory,
  getProductLotsByWarehouse,
} from "@nam-viet-erp/services";
import type {
  IVATInvoiceInWithDetails,
  IWarehouse,
  IProduct,
  ISupplier,
  ICreateVATInvoiceIn,
  IVATInvoiceIn,
  IProductLot,
} from "../../../../../types";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { useBreakpoint } = Grid;

const VATInvoiceInputPage: React.FC = () => {
  const screens = useBreakpoint();
  const [loading, setLoading] = useState(false);
  const [invoices, setInvoices] = useState<IVATInvoiceInWithDetails[]>([]);
  const [warehouses, setWarehouses] = useState<IWarehouse[]>([]);
  const [products, setProducts] = useState<IProduct[]>([]);
  const [suppliers, setSuppliers] = useState<ISupplier[]>([]);
  const [productLots, setProductLots] = useState<IProductLot[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<
    number | undefined
  >();

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] =
    useState<IVATInvoiceInWithDetails | null>(null);
  const [form] = Form.useForm();

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
      const [warehousesRes, productsRes, suppliersRes] = await Promise.all([
        getAllWarehouses(),
        getProductWithInventory(),
        getAllSuppliers(),
      ]);

      if (warehousesRes.data) setWarehouses(warehousesRes.data);
      if (productsRes.data) setProducts(productsRes.data);
      if (suppliersRes.data) setSuppliers(suppliersRes.data);
    } catch (error) {
      console.error("Error loading master data:", error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const { data, error } = await getAllVATInvoicesIn({
        warehouseId: selectedWarehouse || undefined,
        invoiceNo: searchText || undefined,
      });

      if (error) throw error;
      if (data) setInvoices(data);
    } catch (error) {
      console.error("Error loading VAT invoices:", error);
      message.error("Không thể tải danh sách hóa đơn VAT");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadData();
  };

  const handleCreate = () => {
    setSelectedInvoice(null);
    setProductLots([]);
    setSelectedProductId(undefined);
    form.resetFields();
    setShowCreateModal(true);
  };

  const handleEdit = async (record: IVATInvoiceInWithDetails) => {
    setSelectedInvoice(record);
    setSelectedProductId(record.product_id);

    // Load product lots for editing
    if (record.product_id && record.warehouse_id) {
      try {
        const { data, error } = await getProductLotsByWarehouse(
          record.product_id,
          record.warehouse_id,
        );
        if (data && !error) {
          setProductLots(data);
        }
      } catch (err) {
        console.error("Error loading product lots:", err);
      }
    }

    form.setFieldsValue({
      invoice_no: record.invoice_no,
      invoice_date: dayjs(record.invoice_date),
      warehouse_id: record.warehouse_id,
      product_id: record.product_id,
      product_lot_id: record.product_lot_id,
      quantity: record.quantity,
      unit_price: record.unit_price,
      total_amount: record.total_amount,
      vat_amount: record.vat_amount,
      vat_percent: record.vat_percent,
      supplier_id: record.supplier_id,
      notes: record.notes,
    });
    setShowEditModal(true);
  };

  const handleDeleteConfirm = async (id: number) => {
    try {
      const { error } = await deleteVATInvoiceIn(id);
      if (error) {
        console.error("Error deleting VAT invoice:", error);
        message.error(
          `Không thể xóa hóa đơn VAT: ${error.message || JSON.stringify(error)}`,
        );
        return;
      }
      message.success("Đã xóa hóa đơn VAT");
      loadData();
    } catch (error: any) {
      console.error("Error deleting VAT invoice:", error);
      message.error(
        `Không thể xóa hóa đơn VAT: ${error?.message || JSON.stringify(error)}`,
      );
    }
  };

  // Auto-calculate total_amount and vat_amount
  const calculateTotalAndVAT = (
    quantity: number,
    unitPrice: number,
    vatPercent: number,
  ) => {
    if (!quantity || !unitPrice) {
      form.setFieldsValue({
        total_amount: null,
        vat_amount: null,
      });
      return;
    }

    const totalAmount = quantity * unitPrice;
    const vatAmount = (totalAmount * (vatPercent || 0)) / 100;

    form.setFieldsValue({
      total_amount: totalAmount,
      vat_amount: vatAmount,
    });
  };

  const handleSubmit = async (values: any) => {
    try {
      const invoiceData: ICreateVATInvoiceIn = {
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

      if (selectedInvoice) {
        // Update existing invoice
        const { error } = await updateVATInvoiceIn(
          selectedInvoice.id,
          invoiceData,
        );
        if (error) throw error;
        message.success("Đã cập nhật hóa đơn VAT");
        setShowEditModal(false);
        setSelectedInvoice(null);
      } else {
        // Create new invoice
        const { error } = await createVATInvoiceIn(invoiceData);
        if (error) throw error;
        message.success("Đã tạo hóa đơn VAT nhập");
        setShowCreateModal(false);
      }

      loadData();
      form.resetFields();
    } catch (error) {
      console.error("Error saving VAT invoice:", error);
      message.error("Không thể lưu hóa đơn VAT");
    }
  };

  const columns: ColumnsType<IVATInvoiceInWithDetails> = [
    {
      title: "Số hóa đơn",
      dataIndex: "invoice_no",
      key: "invoice_no",
      width: 140,
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: "Ngày HĐ",
      dataIndex: "invoice_date",
      key: "invoice_date",
      width: 100,
      render: (date) => dayjs(date).format("DD/MM/YYYY"),
    },
    {
      title: "Kho",
      dataIndex: "warehouses",
      key: "warehouse_name",
      width: 100,
      render: (warehouse) => warehouse?.name || "-",
    },
    {
      title: "Sản phẩm",
      dataIndex: "products",
      key: "product_name",
      width: 180,
      ellipsis: true,
      render: (product) => product?.name || "-",
    },
    {
      title: "Số lô",
      dataIndex: "product_lots",
      key: "lot_number",
      width: 100,
      render: (lot) => lot?.lot_number || "-",
    },
    {
      title: "SL",
      dataIndex: "quantity",
      key: "quantity",
      width: 80,
      align: "right",
      render: (quantity) => quantity?.toLocaleString() || 0,
    },
    {
      title: "Đơn giá",
      dataIndex: "unit_price",
      key: "unit_price",
      width: 110,
      align: "right",
      render: (price) => (price ? `₫${price.toLocaleString()}` : "-"),
    },
    {
      title: "Thành tiền",
      dataIndex: "total_amount",
      key: "total_amount",
      width: 130,
      align: "right",
      render: (amount) => (amount ? `₫${amount.toLocaleString()}` : "-"),
    },
    {
      title: "VAT",
      dataIndex: "vat_amount",
      key: "vat_amount",
      width: 100,
      align: "right",
      render: (amount) => (amount ? `₫${amount.toLocaleString()}` : "-"),
    },
    {
      title: "NCC",
      dataIndex: "suppliers",
      key: "supplier_name",
      width: 120,
      ellipsis: true,
      render: (supplier) => supplier?.name || "-",
    },
    {
      title: "Thao tác",
      key: "action",
      width: 100,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Xác nhận xóa"
            description="Bạn có chắc chắn muốn xóa hóa đơn VAT này?"
            onConfirm={() => handleDeleteConfirm(record.id)}
            okText="Xóa"
            okType="danger"
            cancelText="Hủy"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const isMobile = !screens.md;
  const isTablet = screens.md && !screens.lg;

  return (
    <div style={{ padding: isMobile ? "12px" : "24px" }}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          {/* Header */}
          <Row justify="space-between" align="middle" gutter={[16, 16]}>
            <Col xs={24} sm={24} md={16}>
              <Title level={isMobile ? 4 : 3} style={{ margin: 0 }}>
                <FileTextOutlined /> Hóa đơn VAT nhập
              </Title>
              <Text
                type="secondary"
                style={{ fontSize: isMobile ? "12px" : "14px" }}
              >
                Quản lý hóa đơn VAT nhập từ nhà cung cấp
              </Text>
            </Col>
            <Col
              xs={24}
              sm={24}
              md={8}
              style={{ textAlign: screens.md ? "right" : "left" }}
            >
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreate}
                block={isMobile}
              >
                Thêm hóa đơn VAT
              </Button>
            </Col>
          </Row>

          {/* Filters */}
          <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
            <Col xs={24} sm={12} md={10}>
              <Input
                placeholder="Tìm kiếm số hóa đơn..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onPressEnter={handleSearch}
                allowClear
              />
            </Col>
            <Col xs={24} sm={12} md={10}>
              <Select
                placeholder="Chọn kho"
                style={{ width: "100%" }}
                allowClear
                value={selectedWarehouse}
                onChange={setSelectedWarehouse}
              >
                {warehouses.map((warehouse) => (
                  <Option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={12} sm={12} md={2}>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={handleSearch}
                block
              >
                Tìm
              </Button>
            </Col>
            <Col xs={12} sm={12} md={2}>
              <Button icon={<ReloadOutlined />} onClick={loadData} block>
                Mới
              </Button>
            </Col>
          </Row>

          {/* Table */}
          <Table
            columns={columns}
            dataSource={invoices}
            loading={loading}
            rowKey="id"
            scroll={{ x: 1200 }}
            size="middle"
            pagination={{
              total: invoices.length,
              pageSize: 10,
              showTotal: (total) => `Tổng ${total} hóa đơn`,
            }}
          />
        </Space>
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={selectedInvoice ? "Sửa hóa đơn VAT" : "Thêm hóa đơn VAT mới"}
        open={showCreateModal || showEditModal}
        onCancel={() => {
          setShowCreateModal(false);
          setShowEditModal(false);
          form.resetFields();
        }}
        footer={null}
        width={isMobile ? "95%" : isTablet ? "90%" : 800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            invoice_date: dayjs(),
            vat_percent: 10,
          }}
        >
          <Row gutter={16}>
            <Col xs={24} sm={24} md={12}>
              <Form.Item
                label="Số hóa đơn"
                name="invoice_no"
                rules={[
                  { required: true, message: "Vui lòng nhập số hóa đơn" },
                ]}
              >
                <Input placeholder="VD: VAT-2025-001" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} md={12}>
              <Form.Item
                label="Ngày hóa đơn"
                name="invoice_date"
                rules={[
                  { required: true, message: "Vui lòng chọn ngày hóa đơn" },
                ]}
              >
                <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={24} md={12}>
              <Form.Item
                label="Kho"
                name="warehouse_id"
                rules={[{ required: true, message: "Vui lòng chọn kho" }]}
              >
                <Select
                  placeholder="Chọn kho"
                  onChange={async (warehouseId) => {
                    // Clear product lots when warehouse changes
                    form.setFieldValue("product_lot_id", undefined);
                    setProductLots([]);

                    // Load product lots when warehouse is selected
                    const productId = form.getFieldValue("product_id");
                    if (productId && warehouseId) {
                      setSelectedProductId(productId);
                      try {
                        const { data, error } = await getProductLotsByWarehouse(
                          productId,
                          warehouseId,
                        );
                        if (data && !error) {
                          setProductLots(data);
                        }
                      } catch (err) {
                        console.error("Error loading product lots:", err);
                      }
                    }
                  }}
                >
                  {warehouses.map((warehouse) => (
                    <Option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} md={12}>
              <Form.Item label="Nhà cung cấp" name="supplier_id">
                <Select placeholder="Chọn nhà cung cấp" allowClear>
                  {suppliers.map((supplier) => (
                    <Option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={24} md={12}>
              <Form.Item
                label="Sản phẩm"
                name="product_id"
                rules={[{ required: true, message: "Vui lòng chọn sản phẩm" }]}
              >
                <Select
                  placeholder="Chọn sản phẩm"
                  onChange={async (productId) => {
                    setSelectedProductId(productId);

                    // Clear product lots when product changes
                    form.setFieldValue("product_lot_id", undefined);

                    // Load product lots when product is selected
                    const warehouseId = form.getFieldValue("warehouse_id");
                    if (productId && warehouseId) {
                      try {
                        const { data, error } = await getProductLotsByWarehouse(
                          productId,
                          warehouseId,
                        );
                        if (data && !error) {
                          setProductLots(data);
                        } else {
                          setProductLots([]);
                        }
                      } catch (err) {
                        console.error("Error loading product lots:", err);
                        setProductLots([]);
                      }
                    }
                  }}
                >
                  {products.map((product) => (
                    <Option key={product.id} value={product.id}>
                      {product.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} md={12}>
              <Form.Item label="Số lô (Optional)" name="product_lot_id">
                <Select
                  placeholder="Chọn số lô"
                  allowClear
                  disabled={!selectedProductId}
                  loading={loading}
                >
                  {productLots.map((lot) => (
                    <Option key={lot.id} value={lot.id}>
                      {lot.lot_number}{" "}
                      {lot.expiry_date
                        ? `(HSD: ${dayjs(lot.expiry_date).format("DD/MM/YYYY")})`
                        : ""}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="Số lượng"
                name="quantity"
                rules={[
                  { required: true, message: "Vui lòng nhập số lượng" },
                  {
                    type: "number",
                    min: 0.01,
                    message: "Số lượng phải lớn hơn 0",
                  },
                ]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  step={1}
                  precision={2}
                  placeholder="Số lượng"
                  onChange={(value) => {
                    calculateTotalAndVAT(
                      value,
                      form.getFieldValue("unit_price"),
                      form.getFieldValue("vat_percent"),
                    );
                  }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item label="Đơn giá" name="unit_price">
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  step={1000}
                  precision={0}
                  placeholder="₫"
                  onChange={(value) => {
                    calculateTotalAndVAT(
                      form.getFieldValue("quantity"),
                      value,
                      form.getFieldValue("vat_percent"),
                    );
                  }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item label="% VAT" name="vat_percent">
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  max={100}
                  step={1}
                  precision={2}
                  onChange={(value) => {
                    calculateTotalAndVAT(
                      form.getFieldValue("quantity"),
                      form.getFieldValue("unit_price"),
                      value,
                    );
                  }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={24} md={12}>
              <Form.Item label="Thành tiền" name="total_amount">
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  step={1000}
                  precision={0}
                  placeholder="₫"
                  readOnly
                  disabled
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} md={12}>
              <Form.Item label="Thuế VAT" name="vat_amount">
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  step={1000}
                  precision={0}
                  placeholder="₫"
                  readOnly
                  disabled
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Ghi chú" name="notes">
            <TextArea rows={3} placeholder="Nhập ghi chú (nếu có)" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {selectedInvoice ? "Cập nhật" : "Tạo"}
              </Button>
              <Button
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                  setSelectedInvoice(null);
                  setProductLots([]);
                  setSelectedProductId(undefined);
                  setTimeout(() => {
                    form.resetFields();
                  }, 0);
                }}
              >
                Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default VATInvoiceInputPage;
