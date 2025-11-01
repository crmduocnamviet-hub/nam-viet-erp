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
  App,
  Row,
  Col,
  Divider,
  Popconfirm,
  Grid,
  Upload,
  Descriptions,
  Tooltip,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  EditOutlined,
  DeleteOutlined,
  FileTextOutlined,
  UploadOutlined,
  FilePdfOutlined,
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
  analyticInvoicePdf,
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
import { COMMON_SPACING, getResponsivePadding } from "../../constants/spacing";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { useBreakpoint } = Grid;

const VATInvoiceInputPage: React.FC = () => {
  const { notification } = App.useApp();
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
  const [uploading, setUploading] = useState(false);

  // Invoice items state (multiple products for one invoice)
  const [invoiceItems, setInvoiceItems] = useState<any[]>([]);
  const [currentInvoiceInfo, setCurrentInvoiceInfo] = useState<any>({
    invoice_no: "",
    invoice_date: null,
    supplier_id: null,
    warehouse_id: null,
  });

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
      notification.error({
        message: "Lỗi tải dữ liệu",
        description: "Không thể tải danh sách hóa đơn VAT",
      });
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
    setInvoiceItems([]);
    setCurrentInvoiceInfo({
      invoice_no: "",
      invoice_date: null,
      supplier_id: null,
      warehouse_id: null,
    });
    form.resetFields();
    form.setFieldValue("vat_percent", 10);
    setShowCreateModal(true);
  };

  const handleUploadPDF = async (file: File) => {
    setUploading(true);
    try {
      const result = await analyticInvoicePdf(file);
      console.log("PDF Analysis Result:", result);

      // Store result for later use

      // Fill form with extracted data
      if (result.invoiceNumber) {
        form.setFieldValue("invoice_no", result.invoiceNumber);
      }
      if (result.invoiceDate) {
        form.setFieldValue("invoice_date", dayjs(result.invoiceDate));
      }
      if (result.supplier) {
        // Try to find supplier by name
        const matchedSupplier = suppliers.find((s) =>
          s.name.toLowerCase().includes(result.supplier?.toLowerCase() || ""),
        );
        if (matchedSupplier) {
          form.setFieldValue("supplier_id", matchedSupplier.id);
        } else {
          notification.warning({
            message: "Thông báo",
            description: `Không tìm thấy nhà cung cấp: ${result.supplier}`,
          });
        }
      }

      // Update invoice header info when PDF is read
      setCurrentInvoiceInfo({
        invoice_no: result.invoiceNumber || currentInvoiceInfo.invoice_no,
        invoice_date: result.invoiceDate
          ? dayjs(result.invoiceDate)
          : currentInvoiceInfo.invoice_date,
        supplier_id: null, // Will be matched and set below
        warehouse_id: currentInvoiceInfo.warehouse_id,
      });

      // Set invoice_no and invoice_date in form
      if (result.invoiceNumber) {
        form.setFieldValue("invoice_no", result.invoiceNumber);
      }
      if (result.invoiceDate) {
        form.setFieldValue("invoice_date", dayjs(result.invoiceDate));
        setCurrentInvoiceInfo((prev) => ({
          ...prev,
          invoice_date: dayjs(result.invoiceDate),
        }));
      }

      // Try to auto-fill ALL products from PDF
      if (result.items && result.items.length > 0) {
        console.log("Found items in PDF:", result.items);
        console.log("Available products:", products);

        // Gemini already filters items without price (only valid items returned)
        // Process each item from PDF
        let productsMatched = 0;
        let productsNotFound = 0;

        for (const item of result.items) {
          // Skip items without name or price (free/promotional items)
          if (!item.name || !item.unitPrice) continue;

          // Find product using improved matching
          const normalizeText = (text: string) =>
            text.toLowerCase().replace(/[^a-z0-9]/g, "");
          const pdfNameNormalized = normalizeText(item.name);

          let matchedProduct = products.find(
            (p) => normalizeText(p.name) === pdfNameNormalized,
          );

          if (!matchedProduct) {
            matchedProduct = products.find((p) => {
              const normalized = normalizeText(p.name);
              return (
                normalized.length > pdfNameNormalized.length * 0.7 &&
                (normalized.includes(pdfNameNormalized) ||
                  pdfNameNormalized.includes(normalized))
              );
            });
          }

          if (!matchedProduct) {
            const significantWords = item.name
              .toLowerCase()
              .split(" ")
              .filter((w) => w.length > 3);
            for (const word of significantWords) {
              matchedProduct = products.find((p) => {
                const normalized = normalizeText(p.name);
                return normalized.includes(word) || word.includes(normalized);
              });
              if (matchedProduct) break;
            }
          }

          if (matchedProduct) {
            // Add to invoice items
            const quantity = item.quantity || 0;
            const unitPrice = item.unitPrice || 0;
            const vatPercent = 10; // Default VAT
            const totalAmount = quantity * unitPrice;
            const vatAmount = (totalAmount * vatPercent) / 100;

            const newItem = {
              id: Date.now() + matchedProduct.id + Math.random(), // Unique ID
              product_id: matchedProduct.id,
              product_lot_id: null, // Will need to be set manually if lot exists
              quantity: quantity,
              unit_price: unitPrice,
              total_amount: totalAmount,
              vat_amount: vatAmount,
              vat_percent: vatPercent,
              notes: null,
            };

            setInvoiceItems((prev) => [...prev, newItem]);
            productsMatched++;
            console.log(
              `✅ Matched: "${item.name}" → "${matchedProduct.name}"`,
            );
          } else {
            productsNotFound++;
            console.log(`❌ Not found: "${item.name}"`);
          }
        }

        notification.success({
          message: "Đọc PDF thành công",
          description: `Đã thêm ${productsMatched} sản phẩm từ PDF vào danh sách hóa đơn. ${productsNotFound > 0 ? `${productsNotFound} sản phẩm không tìm thấy trong hệ thống.` : ""}`,
        });
      } else {
        notification.success({
          message: "Đọc PDF thành công",
          description:
            "Đã đọc hóa đơn PDF thành công. Vui lòng điền thông tin thủ công.",
        });
      }
    } catch (error) {
      console.error("Error analyzing PDF:", error);
      notification.error({
        message: "Lỗi đọc PDF",
        description: "Không thể đọc hóa đơn PDF. Vui lòng kiểm tra lại file.",
      });
    } finally {
      setUploading(false);
    }
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
      product_id: [record.product_id], // Array for multiple mode
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
        notification.error({
          message: "Lỗi xóa hóa đơn",
          description: error.message || "Không thể xóa hóa đơn VAT",
        });
        return;
      }
      notification.success({
        message: "Xóa thành công",
        description: "Đã xóa hóa đơn VAT",
      });
      loadData();
    } catch (error: any) {
      console.error("Error deleting VAT invoice:", error);
      notification.error({
        message: "Lỗi xóa hóa đơn",
        description: error?.message || "Không thể xóa hóa đơn VAT",
      });
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

  const handleAddProductToInvoice = (values: any) => {
    // Support multiple products selected at once
    const selectedProducts = values.product_id;
    const productsToAdd = Array.isArray(selectedProducts)
      ? selectedProducts
      : [selectedProducts];

    if (productsToAdd.length === 0) {
      notification.error({
        message: "Lỗi",
        description: "Vui lòng chọn ít nhất 1 sản phẩm",
      });
      return;
    }

    // Check if quantity and unit_price are provided
    if (!values.quantity || !values.unit_price) {
      notification.error({
        message: "Lỗi",
        description: "Vui lòng nhập Số lượng và Đơn giá",
      });
      return;
    }

    // Calculate total and VAT for all products
    // Convert quantity to integer to avoid decimal values
    const quantity = Math.floor(values.quantity);
    const unitPrice = values.unit_price;
    const vatPercent = values.vat_percent || 10;
    const totalAmount = quantity * unitPrice;
    const vatAmount = (totalAmount * vatPercent) / 100;

    // Add all selected products
    const newItems = productsToAdd.map((productId: number) => ({
      id: Date.now() + productId, // Unique ID
      product_id: productId,
      product_lot_id: values.product_lot_id || null,
      quantity: quantity, // Integer quantity
      unit_price: unitPrice,
      total_amount: totalAmount,
      vat_amount: vatAmount,
      vat_percent: vatPercent,
      notes: values.notes || null,
    }));

    setInvoiceItems([...invoiceItems, ...newItems]);

    // Reset product-related fields but keep invoice header
    form.resetFields([
      "product_id",
      "product_lot_id",
      "quantity",
      "unit_price",
      "total_amount",
      "vat_amount",
      "vat_percent",
      "notes",
    ]);
    setProductLots([]);
    setSelectedProductId(undefined);

    notification.success({
      message: "Thêm sản phẩm thành công",
      description: `Đã thêm ${newItems.length} sản phẩm vào hóa đơn`,
    });
  };

  const handleRemoveProductFromInvoice = (id: number) => {
    setInvoiceItems(invoiceItems.filter((item) => item.id !== id));
    notification.success({
      message: "Xóa sản phẩm thành công",
      description: "Đã xóa sản phẩm khỏi hóa đơn",
    });
  };

  const handleSubmitInvoice = async () => {
    if (invoiceItems.length === 0) {
      notification.error({
        message: "Lỗi",
        description: "Vui lòng thêm ít nhất 1 sản phẩm vào hóa đơn",
      });
      return;
    }

    // Get values from form
    const invoiceNo = form.getFieldValue("invoice_no");
    const invoiceDate = form.getFieldValue("invoice_date");
    const warehouseId = form.getFieldValue("warehouse_id");

    if (!invoiceNo || !invoiceDate || !warehouseId) {
      notification.error({
        message: "Lỗi",
        description:
          "Vui lòng điền đầy đủ thông tin hóa đơn (Số HĐ, Ngày HĐ, Kho)",
      });
      return;
    }

    // Update currentInvoiceInfo with form values
    setCurrentInvoiceInfo({
      invoice_no: invoiceNo,
      invoice_date: invoiceDate,
      warehouse_id: warehouseId,
      supplier_id: form.getFieldValue("supplier_id"),
    });

    try {
      // Create multiple invoice records (one per product)
      // Use invoice_date from form (already validated above)
      // No need to get from currentInvoiceInfo which may be null

      const promises = invoiceItems.map((item) => {
        const invoiceData: ICreateVATInvoiceIn = {
          invoice_no: invoiceNo,
          invoice_date: invoiceDate.format("YYYY-MM-DD"),
          warehouse_id: warehouseId,
          product_id: item.product_id,
          product_lot_id: item.product_lot_id || null,
          quantity: item.quantity,
          unit_price: item.unit_price || null,
          total_amount: item.total_amount || null,
          vat_amount: item.vat_amount || null,
          vat_percent: item.vat_percent || 0,
          supplier_id: form.getFieldValue("supplier_id") || null,
          notes: item.notes || null,
        };

        return createVATInvoiceIn(invoiceData);
      });

      const results = await Promise.all(promises);

      // Check for errors
      const errors = results.filter((r) => r.error);
      if (errors.length > 0) {
        throw errors[0].error;
      }

      notification.success({
        message: "Tạo hóa đơn thành công",
        description: `Đã tạo hóa đơn VAT với ${invoiceItems.length} sản phẩm`,
      });
      setShowCreateModal(false);
      form.resetFields();
      setInvoiceItems([]);
      setCurrentInvoiceInfo({
        invoice_no: "",
        invoice_date: null,
        supplier_id: null,
        warehouse_id: null,
      });
      loadData();
    } catch (error) {
      console.error("Error saving VAT invoice:", error);
      notification.error({
        message: "Lỗi tạo hóa đơn",
        description: "Không thể lưu hóa đơn VAT",
      });
    }
  };

  const handleSubmit = async (values: any) => {
    // This is for EDIT mode only (single product)
    try {
      // Extract product_id - handle both single number and array
      const productId = Array.isArray(values.product_id)
        ? values.product_id[0] // If array, take first element
        : values.product_id; // If single value, use it directly

      const invoiceData: ICreateVATInvoiceIn = {
        invoice_no: values.invoice_no,
        invoice_date: values.invoice_date.format("YYYY-MM-DD"),
        warehouse_id: values.warehouse_id,
        product_id: productId, // Use extracted product_id
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
        notification.success({
          message: "Cập nhật thành công",
          description: "Đã cập nhật hóa đơn VAT",
        });
        setShowEditModal(false);
        setSelectedInvoice(null);
      }

      loadData();
      form.resetFields();
    } catch (error) {
      console.error("Error saving VAT invoice:", error);
      notification.error({
        message: "Lỗi cập nhật",
        description: "Không thể lưu hóa đơn VAT",
      });
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
          <Tooltip title="Sửa">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Xóa hóa đơn VAT?"
            description="Bạn có chắc chắn muốn xóa hóa đơn VAT này?"
            onConfirm={() => handleDeleteConfirm(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Xóa">
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const isMobile = !screens.md;
  const isTablet = screens.md && !screens.lg;

  return (
    <div style={{ padding: getResponsivePadding(screens) }}>
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
          onFinish={!selectedInvoice ? handleAddProductToInvoice : handleSubmit}
          initialValues={{
            invoice_date: dayjs(),
            vat_percent: 10,
          }}
        >
          {/* Upload PDF Button */}
          {!selectedInvoice && (
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={24}>
                <Upload
                  beforeUpload={(file) => {
                    if (file.type !== "application/pdf") {
                      notification.error({
                        message: "Lỗi",
                        description: "Chỉ chấp nhận file PDF",
                      });
                      return false;
                    }
                    handleUploadPDF(file);
                    return false; // Prevent auto upload
                  }}
                  showUploadList={false}
                  accept=".pdf"
                >
                  <Button
                    icon={<FilePdfOutlined />}
                    loading={uploading}
                    disabled={uploading}
                    block
                  >
                    {uploading ? "Đang đọc PDF..." : "📄 Upload hóa đơn PDF"}
                  </Button>
                </Upload>
              </Col>
            </Row>
          )}

          {/* Display invoice items list */}
          {!selectedInvoice && invoiceItems.length > 0 && (
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
                    // Update current invoice info
                    setCurrentInvoiceInfo((prev) => ({
                      ...prev,
                      warehouse_id: warehouseId,
                    }));

                    // Clear product lots when warehouse changes
                    form.setFieldValue("product_lot_id", undefined);
                    setProductLots([]);

                    // Load product lots when warehouse is selected
                    const productId = form.getFieldValue("product_id");
                    // Only load lots if single product selected (not multiple)
                    if (productId && warehouseId && !Array.isArray(productId)) {
                      setSelectedProductId(productId);
                      try {
                        const { data, error } = await getProductLotsByWarehouse(
                          productId,
                          warehouseId,
                        );
                        console.log("Load product lots (warehouse change):", {
                          data,
                          error,
                          productId,
                          warehouseId,
                        });
                        if (data && !error) {
                          setProductLots(data);
                          if (data.length === 0) {
                            notification.warning({
                              message: "Thông báo",
                              description:
                                "Không có số lô nào cho sản phẩm này trong kho này.",
                            });
                          }
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
                <Select
                  placeholder="Chọn nhà cung cấp"
                  allowClear
                  onChange={(supplierId) => {
                    setCurrentInvoiceInfo((prev) => ({
                      ...prev,
                      supplier_id: supplierId,
                    }));
                  }}
                >
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
                label="Sản phẩm (có thể chọn nhiều)"
                name="product_id"
                rules={[{ required: true, message: "Vui lòng chọn sản phẩm" }]}
              >
                <Select
                  mode="multiple"
                  placeholder="Chọn sản phẩm (có thể chọn nhiều)"
                  showSearch
                  filterOption={(input, option) =>
                    String(option?.label || option?.children || "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  onChange={async (productIds) => {
                    // Reset lot selection when products change
                    form.setFieldValue("product_lot_id", undefined);
                    setProductLots([]);
                    setSelectedProductId(undefined);

                    // If single product selected, load its lots
                    if (productIds && productIds.length === 1) {
                      setSelectedProductId(productIds[0]);
                      const warehouseId = form.getFieldValue("warehouse_id");
                      if (warehouseId) {
                        try {
                          const { data, error } =
                            await getProductLotsByWarehouse(
                              productIds[0],
                              warehouseId,
                            );
                          console.log("Load product lots result:", {
                            data,
                            error,
                            productId: productIds[0],
                            warehouseId,
                          });
                          if (data && !error) {
                            setProductLots(data);
                            notification.info({
                              message: "Thông tin",
                              description: `Đã load ${data.length} số lô cho sản phẩm này`,
                            });
                          } else {
                            setProductLots([]);
                            if (data && data.length === 0) {
                              notification.warning({
                                message: "Thông báo",
                                description:
                                  "Không có số lô nào cho sản phẩm này trong kho. Vui lòng nhập kho trước.",
                              });
                            } else if (error) {
                              notification.error({
                                message: "Lỗi",
                                description:
                                  "Lỗi khi load số lô: " + error.message,
                              });
                            }
                          }
                        } catch (err) {
                          console.error("Error loading product lots:", err);
                          setProductLots([]);
                          notification.error({
                            message: "Lỗi",
                            description: "Lỗi khi load số lô",
                          });
                        }
                      }
                    }
                    // If multiple products selected, don't load lots (user can select manually)
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
                    min: 1,
                    message: "Số lượng phải lớn hơn 0",
                  },
                ]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={1}
                  step={1}
                  precision={0}
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
              {selectedInvoice ? (
                <>
                  <Button type="primary" htmlType="submit">
                    Cập nhật
                  </Button>
                  <Button
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedInvoice(null);
                      setProductLots([]);
                      setSelectedProductId(undefined);
                      form.resetFields();
                    }}
                  >
                    Hủy
                  </Button>
                </>
              ) : (
                <>
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
                      setSelectedInvoice(null);
                      setProductLots([]);
                      setSelectedProductId(undefined);
                      setInvoiceItems([]);
                      form.resetFields();
                    }}
                  >
                    Hủy
                  </Button>
                </>
              )}
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default VATInvoiceInputPage;
