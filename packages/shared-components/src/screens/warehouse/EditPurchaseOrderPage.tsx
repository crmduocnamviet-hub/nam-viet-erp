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
  getPurchaseOrderById,
  updatePurchaseOrder,
  updatePurchaseOrderItem,
  addPurchaseOrderItems,
  deletePurchaseOrderItem,
} from "@nam-viet-erp/services";
import { getSuppliers } from "@nam-viet-erp/services";
import { searchProducts } from "@nam-viet-erp/services";
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

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [purchaseOrder, setPurchaseOrder] = useState<IProductOrder>(null);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [items, setItems] = useState<POItem[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [addingProduct, setAddingProduct] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      setLoading(true);
      try {
        // Fetch purchase order, suppliers, and products in parallel
        const [poResponse, suppliersResponse, productsResponse] =
          await Promise.all([
            getPurchaseOrderById(parseInt(id)),
            getSuppliers(),
            searchProducts({ pageSize: 1000 }),
          ]);

        if (poResponse.error) {
          throw new Error(poResponse.error.message || "Không thể tải đơn hàng");
        }

        if (suppliersResponse.error) {
          throw new Error(
            suppliersResponse.error.message || "Không thể tải nhà cung cấp",
          );
        }

        const poData = poResponse.data;
        setPurchaseOrder(poData);
        setSuppliers(suppliersResponse.data || []);
        setProducts(productsResponse.data || []);
        setItems(poData.items || []);
        console.log(poData);
        // Set form values
        form.setFieldsValue({
          supplier_id: poData.supplier_id,
          order_date: poData.order_date ? dayjs(poData.order_date) : null,
          expected_delivery_date: poData.expected_delivery_date
            ? dayjs(poData.expected_delivery_date)
            : null,
          status: poData.status,
          notes: poData.notes,
        });
      } catch (error: any) {
        notification.error({
          message: "Lỗi tải dữ liệu",
          description: error.message,
        });
        navigate("/warehouse/purchase-orders");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const calculateTotalAmount = () => {
    return items.reduce((total, item) => {
      const price = item.product?.wholesale_price || 0;
      return total + price * item.quantity;
    }, 0);
  };

  const handleAddProduct = () => {
    setAddingProduct(true);
  };

  const handleProductSelect = (productId: number) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    // Check if product already exists in items
    if (items.some((item) => item.product_id === productId)) {
      notification.warning({
        message: "Sản phẩm đã tồn tại",
        description: "Sản phẩm này đã có trong đơn hàng",
      });
      setAddingProduct(false);
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
    setAddingProduct(false);
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
    if (!id) return;

    if (items.length === 0) {
      notification.error({
        message: "Lỗi",
        description: "Đơn hàng phải có ít nhất một sản phẩm",
      });
      return;
    }

    setSaving(true);
    try {
      const poId = parseInt(id);
      const totalAmount = calculateTotalAmount();

      // Update PO header
      const updates = {
        supplier_id: values.supplier_id,
        order_date: values.order_date?.format("YYYY-MM-DD"),
        expected_delivery_date:
          values.expected_delivery_date?.format("YYYY-MM-DD"),
        status: values.status,
        notes: values.notes,
        total_amount: totalAmount,
      };

      const { error: poError } = await updatePurchaseOrder(poId, updates);
      if (poError) throw poError;

      // Handle items: update existing, add new, delete removed
      const originalItemIds = new Set(
        purchaseOrder.items?.map((item: any) => item.id) || [],
      );
      const currentItemIds = new Set(
        items.filter((item) => item.id).map((item) => item.id),
      );

      // Delete removed items
      for (const itemId of originalItemIds) {
        if (!currentItemIds.has(itemId)) {
          await deletePurchaseOrderItem(itemId);
        }
      }

      // Update existing items and add new ones
      for (const item of items) {
        if (item.id && !item.isNew) {
          // Update existing item
          await updatePurchaseOrderItem(item.id, item.quantity);
        } else if (item.isNew) {
          // Add new item
          await addPurchaseOrderItems(poId, [
            { product_id: item.product_id, quantity: item.quantity },
          ]);
        }
      }

      notification.success({
        message: "Cập nhật thành công",
        description: "Đơn đặt hàng đã được cập nhật",
      });

      navigate("/warehouse/purchase-orders");
    } catch (error: any) {
      notification.error({
        message: "Lỗi cập nhật",
        description: error.message || "Không thể cập nhật đơn đặt hàng",
      });
    } finally {
      setSaving(false);
    }
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
              loading={saving}
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
                  filterOption={(input, option) =>
                    (option?.label ?? "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  options={suppliers.map((supplier) => ({
                    value: supplier.id,
                    label: supplier.name,
                  }))}
                />
              </Form.Item>

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
                <Select placeholder="Chọn trạng thái" size="large">
                  <Select.Option value="draft">Nháp</Select.Option>
                  <Select.Option value="sent">Đã gửi</Select.Option>
                  <Select.Option value="ordered">Đã đặt hàng</Select.Option>
                  <Select.Option value="partially_received">
                    Nhận một phần
                  </Select.Option>
                  <Select.Option value="received">Hoàn thành</Select.Option>
                  <Select.Option value="cancelled">Đã hủy</Select.Option>
                </Select>
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
              title="Sản phẩm trong đơn hàng"
              extra={
                <Tooltip title="Thêm sản phẩm">
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleAddProduct}
                  />
                </Tooltip>
              }
            >
              {addingProduct && (
                <div style={{ marginBottom: 16 }}>
                  <Select
                    showSearch
                    placeholder="Tìm và chọn sản phẩm..."
                    optionFilterProp="children"
                    size="large"
                    style={{ width: "100%" }}
                    onSelect={handleProductSelect}
                    onBlur={() => setAddingProduct(false)}
                    autoFocus
                    filterOption={(input, option) => {
                      const product = products.find(
                        (p) => p.id === option?.value,
                      );
                      if (!product) return false;
                      const searchStr =
                        `${product.name} ${product.sku || ""}`.toLowerCase();
                      return searchStr.includes(input.toLowerCase());
                    }}
                    options={products.map((product) => ({
                      value: product.id,
                      label: `${product.name}${product.sku ? ` (${product.sku})` : ""}`,
                    }))}
                  />
                </div>
              )}

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
