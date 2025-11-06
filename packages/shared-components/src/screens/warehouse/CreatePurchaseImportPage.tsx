import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  notification,
  Empty,
  Form,
  Select,
  DatePicker,
  Input,
  InputNumber,
  Row,
  Col,
  Statistic,
} from "antd";
import {
  ArrowLeftOutlined,
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
  InboxOutlined,
  HomeOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import type { ColumnsType } from "antd/es/table";
import PageLayout from "../../components/PageLayout";
import LotExpirationInput from "../../components/LotExpirationInput";
import { useAuthStore, usePurchaseOrderStore } from "@nam-viet-erp/store";

const { Text } = Typography;

const CreatePurchaseImportPage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  // Purchase Order Store
  const {
    suppliers,
    products,
    b2bWarehouse,
    isLoading: loading,
    fetchSuppliers,
    fetchProducts,
    fetchB2bWarehouse,
    createDirectPurchaseImport: createImport,
  } = usePurchaseOrderStore();

  const [form] = Form.useForm();
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [creatingImport, setCreatingImport] = useState(false);

  const selectedSupplierId = Form.useWatch("supplier_id", form);

  const supplierProducts = useMemo(() => {
    if (!selectedSupplierId) {
      return [];
    }
    return products.filter((p) => p.supplier_id === selectedSupplierId);
  }, [selectedSupplierId, products]);

  // Calculate totals
  const totals = useMemo(() => {
    const totalQuantity = selectedProducts.reduce(
      (sum, p) => sum + (p.quantity || 0),
      0,
    );

    const totalAmount = selectedProducts.reduce((sum, p) => {
      const product = products.find((prod) => prod.id === p.product_id);
      const price = product?.cost_price || product?.wholesale_price || 0;
      return sum + price * (p.quantity || 0);
    }, 0);

    return { totalQuantity, totalAmount };
  }, [selectedProducts, products]);

  // Fetch data on mount
  useEffect(() => {
    fetchSuppliers();
    fetchProducts();
    fetchB2bWarehouse();

    // Set default order date
    form.setFieldsValue({
      order_date: dayjs(),
    });
  }, [fetchSuppliers, fetchProducts, fetchB2bWarehouse]);

  // Add product to import list
  const handleAddProduct = () => {
    setSelectedProducts([
      ...selectedProducts,
      {
        id: Date.now(), // Temporary ID for UI
        product_id: undefined,
        quantity: 1,
        lot_number: "",
        expiration_date: "",
      },
    ]);
  };

  // Remove product from import list
  const handleRemoveProduct = (id: number) => {
    setSelectedProducts(selectedProducts.filter((p) => p.id !== id));
  };

  // Update product in import list
  const handleUpdateProduct = (id: number, field: string, value: any) => {
    setSelectedProducts(
      selectedProducts.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    );
  };

  // Create new import order
  const handleCreateImport = async () => {
    try {
      const values = await form.validateFields();

      if (!b2bWarehouse) {
        notification.error({
          message: "Lỗi",
          description: "Không tìm thấy kho B2B",
        });
        return;
      }

      if (selectedProducts.length === 0) {
        notification.warning({
          message: "Chưa có sản phẩm",
          description: "Vui lòng thêm ít nhất 1 sản phẩm",
        });
        return;
      }

      // Validate all products have required fields
      const invalidProducts = selectedProducts.filter(
        (p) => !p.product_id || !p.quantity || p.quantity <= 0,
      );

      if (invalidProducts.length > 0) {
        notification.warning({
          message: "Thông tin không hợp lệ",
          description:
            "Vui lòng chọn sản phẩm và nhập số lượng cho tất cả các dòng",
        });
        return;
      }

      setCreatingImport(true);

      // Prepare items
      const items = selectedProducts.map((p) => ({
        product_id: p.product_id,
        quantity: p.quantity,
        lot_number: p.lot_number || undefined,
        expiration_date: p.expiration_date || undefined,
      }));

      // Create import order - always use B2B warehouse
      const result = await createImport(
        {
          supplier_id: values.supplier_id,
          order_date: values.order_date.format("YYYY-MM-DD"),
          expected_delivery_date: null,
          total_amount: totals.totalAmount,
          notes: values.notes || "Nhập hàng trực tiếp vào kho B2B",
          created_by: user?.id || null,
        },
        items,
        b2bWarehouse.id,
      );

      if (!result.success) {
        throw new Error(result.error?.message || "Failed to create import");
      }

      notification.success({
        message: "Tạo phiếu nhập thành công",
        description: `Đã tạo phiếu nhập vào kho ${b2bWarehouse.name} với ${selectedProducts.length} sản phẩm`,
        duration: 4,
      });

      // Navigate back to receiving page
      navigate("/warehouse/receiving");
    } catch (error: any) {
      notification.error({
        message: "Lỗi",
        description: error.message || "Không thể tạo phiếu nhập",
      });
    } finally {
      setCreatingImport(false);
    }
  };

  // Product columns for table
  const productColumns: ColumnsType<any> = [
    {
      title: "Sản Phẩm",
      key: "product",
      width: 250,
      render: (_, record) => (
        <Select
          placeholder="Chọn sản phẩm"
          style={{ width: "100%" }}
          value={record.product_id}
          onChange={(value) =>
            handleUpdateProduct(record.id, "product_id", value)
          }
          showSearch
          filterOption={(input, option) =>
            (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
          }
          options={supplierProducts.map((p) => ({
            label: `${p.name} (${p.sku || "N/A"})`,
            value: p.id,
          }))}
          disabled={!selectedSupplierId}
          size="large"
        />
      ),
    },
    {
      title: "Số Lượng",
      key: "quantity",
      width: 120,
      render: (_, record) => (
        <InputNumber
          min={1}
          value={record.quantity}
          onChange={(value) =>
            handleUpdateProduct(record.id, "quantity", value || 1)
          }
          style={{ width: "100%" }}
          size="large"
        />
      ),
    },
    {
      title: "Số Lô & Hạn SD",
      key: "lot",
      width: 300,
      render: (_, record) => {
        const product = products.find((p) => p.id === record.product_id);
        const showLotInput = product?.enable_lot_management;
        return (
          <LotExpirationInput
            showLotNumberInput={showLotInput}
            value={{
              lotNumber: record.lot_number,
              expirationDate: record.expiration_date,
            }}
            onChange={(value) => {
              // Update the entire lot/expiration data in one call
              setSelectedProducts(
                selectedProducts.map((p) =>
                  p.id === record.id
                    ? {
                        ...p,
                        lot_number: value.lotNumber,
                        expiration_date: value.expirationDate,
                      }
                    : p,
                ),
              );
            }}
            productId={record.product_id}
            warehouseId={b2bWarehouse?.id}
          />
        );
      },
    },
    {
      title: "Giá",
      key: "price",
      width: 120,
      align: "right",
      render: (_, record) => {
        const product = products.find((p) => p.id === record.product_id);
        const price = product?.cost_price || product?.wholesale_price || 0;
        return <Text>{price.toLocaleString("vi-VN")} ₫</Text>;
      },
    },
    {
      title: "Thành Tiền",
      key: "total",
      width: 140,
      align: "right",
      render: (_, record) => {
        const product = products.find((p) => p.id === record.product_id);
        const price = product?.cost_price || product?.wholesale_price || 0;
        const total = price * (record.quantity || 0);
        return <Text strong>{total.toLocaleString("vi-VN")} ₫</Text>;
      },
    },
    {
      title: "",
      key: "actions",
      width: 60,
      fixed: "right",
      render: (_, record) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleRemoveProduct(record.id)}
          size="large"
        />
      ),
    },
  ];

  return (
    <PageLayout
      title="Tạo Phiếu Nhập Hàng Mới"
      breadcrumbs={[
        {
          title: "Trang chủ",
          href: "/",
          icon: <HomeOutlined />,
        },
        {
          title: "Nhận Hàng",
          href: "/warehouse/receiving",
          icon: <InboxOutlined />,
        },
        {
          title: "Tạo Phiếu Nhập Hàng Mới",
        },
      ]}
      extra={
        <Space>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleCreateImport}
            loading={creatingImport}
            disabled={!b2bWarehouse || selectedProducts.length === 0}
            size="large"
          >
            Lưu Phiếu Nhập
          </Button>
        </Space>
      }
    >
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {/* Order Information Form */}
        <Card title="Thông Tin Phiếu Nhập">
          <Form form={form} layout="vertical">
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="supplier_id"
                  label="Nhà Cung Cấp"
                  rules={[
                    { required: true, message: "Vui lòng chọn nhà cung cấp" },
                  ]}
                >
                  <Select
                    placeholder="Chọn nhà cung cấp"
                    showSearch
                    filterOption={(input, option) =>
                      (option?.label ?? "")
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                    options={suppliers.map((s) => ({
                      label: s.name,
                      value: s.id,
                    }))}
                    size="large"
                    onChange={(value) => {
                      // Clear selected products when supplier changes
                      setSelectedProducts([]);
                    }}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="order_date"
                  label="Ngày Nhập"
                  rules={[{ required: true, message: "Vui lòng chọn ngày" }]}
                >
                  <DatePicker
                    style={{ width: "100%" }}
                    format="DD/MM/YYYY"
                    size="large"
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Kho Nhập">
                  <Input
                    value={b2bWarehouse?.name || "Đang tải..."}
                    disabled
                    style={{ cursor: "not-allowed" }}
                    prefix={<InboxOutlined />}
                    size="large"
                  />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Tự động nhập vào kho B2B
                  </Text>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={24}>
                <Form.Item name="notes" label="Ghi Chú">
                  <Input.TextArea
                    rows={2}
                    placeholder="Ghi chú về phiếu nhập"
                    size="large"
                  />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Card>

        {/* Summary Statistics */}
        <Card>
          <Row gutter={16}>
            <Col span={8}>
              <Statistic
                title="Tổng Số Sản Phẩm"
                value={selectedProducts.length}
                suffix="sản phẩm"
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Tổng Số Lượng"
                value={totals.totalQuantity}
                suffix="chiếc"
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Tổng Tiền"
                value={totals.totalAmount}
                suffix="₫"
                valueStyle={{ color: "#3f8600" }}
                formatter={(value) => value.toLocaleString("vi-VN")}
              />
            </Col>
          </Row>
        </Card>

        {/* Products Table */}
        <Card title="Danh Sách Sản Phẩm">
          {!selectedSupplierId ? (
            <Empty description="Vui lòng chọn nhà cung cấp để thêm sản phẩm" />
          ) : (
            <>
              {/* Search box - Like shopping cart */}
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
                  onSelect={(value) => {
                    const product = supplierProducts.find(
                      (p) => p.id === value,
                    );
                    if (product) {
                      setSelectedProducts([
                        ...selectedProducts,
                        {
                          id: Date.now(),
                          product_id: product.id,
                          quantity: 1,
                          lot_number: "",
                          expiration_date: "",
                        },
                      ]);
                    }
                  }}
                  allowClear
                  filterOption={(input, option) => {
                    const product = supplierProducts.find(
                      (p) => p.id === option?.value,
                    );
                    if (!product) return false;
                    const searchStr =
                      `${product.name} ${product.sku || ""} ${product.barcode || ""}`.toLowerCase();
                    return searchStr.includes(input.toLowerCase());
                  }}
                  options={supplierProducts.map((product) => ({
                    value: product.id,
                    label: `${product.name}${product.sku ? ` (SKU: ${product.sku})` : ""}${product.cost_price ? ` - ${product.cost_price.toLocaleString("vi-VN")}đ` : ""}`,
                  }))}
                />
                <Text
                  type="secondary"
                  style={{ fontSize: 12, display: "block", marginTop: 8 }}
                >
                  Gõ tên sản phẩm, SKU hoặc mã vạch để tìm và tự động thêm vào
                  giỏ hàng
                </Text>
              </div>

              {selectedProducts.length === 0 ? (
                <Empty description="Chưa có sản phẩm nào. Tìm kiếm và chọn sản phẩm ở trên để thêm vào giỏ hàng" />
              ) : (
                <Table
                  dataSource={selectedProducts}
                  columns={productColumns}
                  rowKey="id"
                  pagination={false}
                  scroll={{ x: 1000 }}
                  size="large"
                />
              )}
            </>
          )}
        </Card>
      </Space>
    </PageLayout>
  );
};

export default CreatePurchaseImportPage;
