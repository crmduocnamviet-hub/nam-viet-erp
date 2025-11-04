import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Card,
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Divider,
  App,
  Spin,
  Table,
  InputNumber,
  Popconfirm,
  Tooltip,
} from "antd";
import {
  SaveOutlined,
  PlusOutlined,
  DeleteOutlined,
  CloseOutlined,
  HomeOutlined,
  ShoppingOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import {
  usePurchaseOrder,
  useSuppliersQuery,
  useProductsQuery,
  useSavePurchaseOrder,
} from "@nam-viet-erp/store";
import PageLayout from "../../components/PageLayout";

const { Title, Text } = Typography;
const { TextArea } = Input;

interface POItem {
  id?: number;
  product_id: number;
  quantity: number;
  received_quantity?: number;
  product?: {
    id: number;
    name: string;
    sku?: string;
    wholesale_price?: number;
  };
  isNew?: boolean;
}

const EditPurchaseOrderPageContent: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { notification } = App.useApp();
  const [form] = Form.useForm();

  const purchaseOrderId = id ? parseInt(id) : null;

  // Fetch data using hooks
  const {
    data: purchaseOrder,
    isLoading: isPurchaseOrderLoading,
    error: purchaseOrderError,
  } = usePurchaseOrder(purchaseOrderId);

  const { data: suppliers, isLoading: isSuppliersLoading } =
    useSuppliersQuery();

  const { data: products, isLoading: isProductsLoading } =
    useProductsQuery(1000);

  const [items, setItems] = useState<POItem[]>([]);
  const [isCreatingNewSupplier, setIsCreatingNewSupplier] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState("");

  // Comprehensive save hook that handles the entire flow
  const { submit: savePurchaseOrder, isLoading: isSaving } =
    useSavePurchaseOrder({
      onSuccess: (result) => {
        if (result.newSupplierName) {
          notification.success({
            message: "Đã tạo nhà cung cấp",
            description: `Nhà cung cấp "${result.newSupplierName}" đã được tạo`,
          });
        }
        notification.success({
          message: "Cập nhật thành công",
          description: "Đơn đặt hàng đã được cập nhật",
        });
        navigate("/warehouse/purchase-orders");
      },
      onError: (error) => {
        notification.error({
          message: "Lỗi cập nhật",
          description: error.message || "Không thể cập nhật đơn đặt hàng",
        });
      },
    });

  // Calculate combined loading state
  const loading =
    isPurchaseOrderLoading || isSuppliersLoading || isProductsLoading;

  // Handle purchase order error
  useEffect(() => {
    if (purchaseOrderError) {
      notification.error({
        message: "Lỗi tải dữ liệu",
        description: purchaseOrderError.message || "Không thể tải đơn hàng",
      });
      navigate("/warehouse/purchase-orders");
    }
  }, [purchaseOrderError]);

  // Initialize form when purchase order data is loaded
  useEffect(() => {
    if (purchaseOrder) {
      setItems(purchaseOrder.items || []);

      // Check if PO has no supplier - enable create new mode
      if (!purchaseOrder.supplier_id) {
        setIsCreatingNewSupplier(true);
      }

      // Set form values
      form.setFieldsValue({
        supplier_id: purchaseOrder.supplier_id || "new",
        order_date: purchaseOrder.order_date
          ? dayjs(purchaseOrder.order_date)
          : null,
        expected_delivery_date: purchaseOrder.expected_delivery_date
          ? dayjs(purchaseOrder.expected_delivery_date)
          : null,
        status: purchaseOrder.status,
        notes: purchaseOrder.notes,
      });
    }
  }, [purchaseOrder, form]);

  const calculateTotalAmount = () => {
    return items.reduce((total, item) => {
      const price = item.product?.wholesale_price || 0;
      return total + price * item.quantity;
    }, 0);
  };

  const handleProductSelect = (productId: number) => {
    if (!products) return;

    const product = products.find((p) => p.id === productId);
    if (!product) return;

    // Check if product already exists in items
    if (items.some((item) => item.product_id === productId)) {
      notification.warning({
        message: "Sản phẩm đã tồn tại",
        description:
          "Sản phẩm này đã có trong đơn hàng. Vui lòng tăng số lượng thay vì thêm mới.",
      });
      return;
    }

    const newItem: POItem = {
      product_id: productId,
      quantity: 1,
      received_quantity: 0,
      product: {
        id: product.id,
        name: product.name,
        sku: product.sku,
        wholesale_price: product.wholesale_price,
      },
      isNew: true,
    };

    setItems([...items, newItem]);
    notification.success({
      message: "Đã thêm sản phẩm",
      description: `${product.name} đã được thêm vào giỏ hàng`,
      duration: 2,
    });
  };

  const handleQuantityChange = (index: number, quantity: number) => {
    const newItems = [...items];
    newItems[index].quantity = quantity;
    setItems(newItems);
  };

  const handleDeleteItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const handleSave = async (values: any) => {
    if (!purchaseOrderId || !purchaseOrder) return;

    await savePurchaseOrder({
      purchaseOrderId,
      originalItems: purchaseOrder.items || [],
      currentItems: items,
      formValues: values,
      isCreatingNewSupplier,
      newSupplierName,
    });
  };

  const columns: ColumnsType<POItem> = [
    {
      title: "Sản phẩm",
      dataIndex: ["product", "name"],
      key: "product_name",
      render: (name: string, record: POItem) => (
        <div>
          <div style={{ fontWeight: 500 }}>{name}</div>
          {record.product?.sku && (
            <div style={{ fontSize: 12, color: "#8c8c8c" }}>
              SKU: {record.product.sku}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Đơn giá",
      key: "price",
      width: 150,
      render: (_, record: POItem) => (
        <Text>
          {(record.product?.wholesale_price || 0).toLocaleString("vi-VN")}đ
        </Text>
      ),
    },
    {
      title: "Số lượng",
      key: "quantity",
      width: 150,
      render: (_, record: POItem, index: number) => (
        <InputNumber
          min={1}
          value={record.quantity}
          onChange={(value) => handleQuantityChange(index, value || 1)}
          style={{ width: "100%" }}
        />
      ),
    },
    {
      title: "Thành tiền",
      key: "total",
      width: 150,
      render: (_, record: POItem) => {
        const price = record.product?.wholesale_price || 0;
        const total = price * record.quantity;
        return <Text strong>{total.toLocaleString("vi-VN")}đ</Text>;
      },
    },
    {
      title: "",
      key: "actions",
      width: 80,
      fixed: "right" as const,
      render: (_, record: POItem, index: number) => (
        <Popconfirm
          title="Xóa sản phẩm"
          description="Bạn có chắc muốn xóa sản phẩm này?"
          onConfirm={(e) => {
            e?.stopPropagation();
            handleDeleteItem(index);
          }}
          okText="Xóa"
          cancelText="Hủy"
          okType="danger"
        >
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={(e) => e.stopPropagation()}
          />
        </Popconfirm>
      ),
    },
  ];

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  return (
    <PageLayout
      title={`Chỉnh sửa Đơn Đặt Hàng - ${purchaseOrder?.po_number || ""}`}
      showBackButton
      breadcrumbs={[
        {
          title: "Trang chủ",
          href: "/",
          icon: <HomeOutlined />,
        },
        {
          title: "Đơn Đặt Hàng",
          href: "/warehouse/purchase-orders",
          icon: <ShoppingOutlined />,
        },
        {
          title: purchaseOrder?.po_number ?? "",
        },
      ]}
      extra={
        <Space size="middle">
          <Tooltip title="Hủy">
            <Button
              icon={<CloseOutlined />}
              size="large"
              onClick={() => navigate("/warehouse/purchase-orders")}
            />
          </Tooltip>
          <Tooltip title="Lưu thay đổi">
            <Button
              type="primary"
              size="large"
              icon={<SaveOutlined />}
              onClick={() => form.submit()}
              loading={isSaving}
            />
          </Tooltip>
        </Space>
      }
    >
      {/* Two Column Layout */}
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
        initialValues={{
          status: "draft",
        }}
      >
        <Row gutter={24}>
          {/* Left Column - Order Information */}
          <Col xs={24} lg={10} xl={8}>
            <Card title="Thông tin Đơn hàng" style={{ height: "100%" }}>
              <Form.Item
                name="supplier_id"
                label="Nhà Cung Cấp"
                rules={[
                  { required: true, message: "Vui lòng chọn nhà cung cấp" },
                ]}
              >
                <Select
                  showSearch
                  placeholder="Chọn nhà cung cấp"
                  optionFilterProp="children"
                  size="large"
                  onChange={(value) => {
                    if (value === "new") {
                      setIsCreatingNewSupplier(true);
                    } else {
                      setIsCreatingNewSupplier(false);
                      setNewSupplierName("");
                    }
                  }}
                  filterOption={(input, option) =>
                    (option?.label ?? "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  options={[
                    ...(suppliers || []).map((supplier) => ({
                      value: supplier.id,
                      label: supplier.name,
                    })),
                    ...(purchaseOrder?.supplier_id === null
                      ? [
                          {
                            value: "new",
                            label: "➕ Tạo nhà cung cấp mới",
                          },
                        ]
                      : []),
                  ]}
                />
              </Form.Item>

              {isCreatingNewSupplier && (
                <Form.Item
                  label="Tên Nhà Cung Cấp Mới"
                  required
                  validateStatus={newSupplierName.trim() ? "success" : "error"}
                  help={
                    !newSupplierName.trim()
                      ? "Vui lòng nhập tên nhà cung cấp"
                      : ""
                  }
                >
                  <Input
                    size="large"
                    placeholder="Nhập tên nhà cung cấp..."
                    value={newSupplierName}
                    onChange={(e) => setNewSupplierName(e.target.value)}
                    autoFocus
                  />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Nhà cung cấp mới sẽ được tạo khi lưu đơn hàng
                  </Text>
                </Form.Item>
              )}

              <Form.Item
                name="order_date"
                label="Ngày Đặt Hàng"
                rules={[
                  { required: true, message: "Vui lòng chọn ngày đặt hàng" },
                ]}
              >
                <DatePicker
                  style={{ width: "100%" }}
                  format="DD/MM/YYYY"
                  size="large"
                />
              </Form.Item>

              <Form.Item
                name="expected_delivery_date"
                label="Ngày Dự Kiến Giao"
              >
                <DatePicker
                  style={{ width: "100%" }}
                  format="DD/MM/YYYY"
                  size="large"
                />
              </Form.Item>

              <Form.Item
                name="status"
                label="Trạng Thái"
                rules={[
                  { required: true, message: "Vui lòng chọn trạng thái" },
                ]}
              >
                <Space wrap>
                  {[
                    { value: "draft", label: "Nháp", color: "default" },
                    { value: "sent", label: "Đã gửi", color: "processing" },
                    {
                      value: "ordered",
                      label: "Đã đặt hàng",
                      color: "processing",
                    },
                    {
                      value: "partially_received",
                      label: "Nhận một phần",
                      color: "warning",
                    },
                    {
                      value: "received",
                      label: "Hoàn thành",
                      color: "success",
                    },
                    { value: "cancelled", label: "Đã hủy", color: "error" },
                  ].map((status) => (
                    <Button
                      key={status.value}
                      type={
                        form.getFieldValue("status") === status.value
                          ? "primary"
                          : "default"
                      }
                      onClick={() =>
                        form.setFieldsValue({ status: status.value })
                      }
                      style={{ marginBottom: 8 }}
                    >
                      {status.label}
                    </Button>
                  ))}
                </Space>
              </Form.Item>

              <Form.Item name="notes" label="Ghi Chú">
                <TextArea
                  rows={4}
                  placeholder="Nhập ghi chú cho đơn hàng..."
                  showCount
                  maxLength={500}
                />
              </Form.Item>

              <Divider />

              {/* Total Amount Display */}
              <div
                style={{
                  padding: "16px",
                  backgroundColor: "#f5f5f5",
                  borderRadius: "8px",
                }}
              >
                <Row justify="space-between" align="middle">
                  <Col>
                    <Text strong style={{ fontSize: 16 }}>
                      Tổng Tiền:
                    </Text>
                  </Col>
                  <Col>
                    <Text strong style={{ fontSize: 20, color: "#1890ff" }}>
                      {calculateTotalAmount().toLocaleString("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      })}
                    </Text>
                  </Col>
                </Row>
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Số sản phẩm: <strong>{items.length}</strong>
                  </Text>
                </div>
              </div>
            </Card>
          </Col>

          {/* Right Column - Products */}
          <Col xs={24} lg={14} xl={16}>
            <Card
              title={
                <Space>
                  <ShoppingOutlined />
                  <span>Sản phẩm trong đơn hàng ({items.length})</span>
                </Space>
              }
            >
              {/* Search box - Always visible, like a shopping cart */}
              <div
                style={{
                  marginBottom: 16,
                  padding: 12,
                  background: "#f5f5f5",
                  borderRadius: 8,
                }}
              >
                <Select
                  showSearch
                  placeholder="🔍 Tìm kiếm và thêm sản phẩm vào giỏ hàng..."
                  optionFilterProp="children"
                  size="large"
                  style={{ width: "100%" }}
                  onSelect={handleProductSelect}
                  allowClear
                  filterOption={(input, option) => {
                    if (!products) return false;
                    const product = products.find(
                      (p) => p.id === option?.value,
                    );
                    if (!product) return false;
                    const searchStr =
                      `${product.name} ${product.sku || ""} ${product.barcode || ""}`.toLowerCase();
                    return searchStr.includes(input.toLowerCase());
                  }}
                  options={(products || []).map((product) => ({
                    value: product.id,
                    label: `${product.name}${product.sku ? ` (SKU: ${product.sku})` : ""}${product.wholesale_price ? ` - ${product.wholesale_price.toLocaleString("vi-VN")}đ` : ""}`,
                  }))}
                />
                <Text
                  type="secondary"
                  style={{ fontSize: 12, display: "block", marginTop: 8 }}
                >
                  Gõ tên, SKU hoặc mã vạch để tìm sản phẩm. Chọn sản phẩm sẽ tự
                  động thêm vào giỏ hàng.
                </Text>
              </div>

              <Table
                columns={columns}
                dataSource={items}
                rowKey={(record, index) =>
                  record.id?.toString() || `new-${index}`
                }
                pagination={false}
                scroll={{ x: 800 }}
                locale={{
                  emptyText:
                    "Chưa có sản phẩm nào. Click 'Thêm sản phẩm' để bắt đầu.",
                }}
              />
            </Card>
          </Col>
        </Row>
      </Form>
    </PageLayout>
  );
};

const EditPurchaseOrderPage: React.FC = () => (
  <App>
    <EditPurchaseOrderPageContent />
  </App>
);

export default EditPurchaseOrderPage;
