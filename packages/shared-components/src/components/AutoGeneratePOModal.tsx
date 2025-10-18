import React, { useState, useEffect } from "react";
import {
  Modal,
  Table,
  Button,
  Space,
  Typography,
  Tag,
  Alert,
  Spin,
  Result,
  Divider,
  InputNumber,
} from "antd";
import {
  CheckCircleOutlined,
  WarningOutlined,
  ShoppingCartOutlined,
  MedicineBoxOutlined,
} from "@ant-design/icons";

const { Text, Title } = Typography;

interface ProductToOrder {
  product_id: number;
  product_name: string;
  supplier_id: number;
  supplier_name: string;
  current_stock: number;
  min_stock: number;
  max_stock: number;
  quantity_needed: number;
  unit_price: number;
}

interface AutoGeneratePOModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (editedProducts: ProductToOrder[]) => Promise<void>;
  loading: boolean;
  products: ProductToOrder[];
  warehouseName?: string;
}

const AutoGeneratePOModal: React.FC<AutoGeneratePOModalProps> = ({
  open,
  onClose,
  onConfirm,
  loading,
  products,
  warehouseName = "Unknown",
}) => {
  const [confirming, setConfirming] = useState(false);
  const [editedProducts, setEditedProducts] = useState<ProductToOrder[]>([]);

  // Initialize edited products when products change
  useEffect(() => {
    setEditedProducts(products);
  }, [products]);

  // Handle quantity change with validation
  const handleQuantityChange = (productId: number, newQuantity: number) => {
    // Ensure quantity is within valid range
    const validQuantity = Math.max(1, newQuantity);

    setEditedProducts((prev) =>
      prev.map((p) =>
        p.product_id === productId
          ? { ...p, quantity_needed: validQuantity }
          : p,
      ),
    );
  };

  // Group products by supplier
  const productsBySupplier: Record<string, ProductToOrder[]> = {};
  editedProducts.forEach((product) => {
    const supplierName = product.supplier_name;
    if (!productsBySupplier[supplierName]) {
      productsBySupplier[supplierName] = [];
    }
    productsBySupplier[supplierName].push(product);
  });

  const columns = [
    {
      title: "Sản Phẩm",
      dataIndex: "product_name",
      key: "product_name",
      width: 200,
    },
    {
      title: "Tồn Kho Hiện Tại",
      dataIndex: "current_stock",
      key: "current_stock",
      align: "center" as const,
      width: 120,
      render: (qty: number, record: ProductToOrder) => (
        <Space direction="vertical" size="small">
          <Tag color="error">{qty}</Tag>
          <Text type="secondary" style={{ fontSize: 11 }}>
            Min: {record.min_stock}
          </Text>
        </Space>
      ),
    },
    {
      title: "Tồn Kho Tối Đa",
      dataIndex: "max_stock",
      key: "max_stock",
      align: "center" as const,
      width: 100,
      render: (qty: number) => <Tag color="success">{qty}</Tag>,
    },
    {
      title: "Số Lượng Cần Đặt",
      dataIndex: "quantity_needed",
      key: "quantity_needed",
      align: "center" as const,
      width: 150,
      render: (qty: number, record: ProductToOrder) => (
        <InputNumber
          min={1}
          // max={record.max_stock}
          value={qty}
          onChange={(value) =>
            handleQuantityChange(record.product_id, value || 1)
          }
          onBlur={(e) => {
            const inputValue = parseFloat(e.target.value);
            if (!isNaN(inputValue)) {
              handleQuantityChange(record.product_id, inputValue);
            }
          }}
          style={{ width: "100%" }}
          size="middle"
        />
      ),
    },
    {
      title: "Đơn Giá",
      dataIndex: "unit_price",
      key: "unit_price",
      align: "right" as const,
      width: 120,
      render: (price: number) =>
        price?.toLocaleString("vi-VN", {
          style: "currency",
          currency: "VND",
        }),
    },
    {
      title: "Thành Tiền",
      key: "total",
      align: "right" as const,
      width: 150,
      render: (_: any, record: ProductToOrder) => {
        const total = record.quantity_needed * record.unit_price;
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

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      await onConfirm(editedProducts);
    } finally {
      setConfirming(false);
    }
  };

  const totalAmount = editedProducts.reduce(
    (sum, p) => sum + p.quantity_needed * p.unit_price,
    0,
  );
  const totalProducts = editedProducts.length;
  const totalSuppliers = Object.keys(productsBySupplier).length;

  return (
    <Modal
      title={
        <Space>
          <ShoppingCartOutlined />
          <Text strong>Dự Trù Tự Động - {warehouseName}</Text>
        </Space>
      }
      open={open}
      onCancel={onClose}
      width={1000}
      footer={[
        <Button
          key="cancel"
          onClick={onClose}
          disabled={confirming}
          size="large"
        >
          Hủy
        </Button>,
        <Button
          key="confirm"
          type="primary"
          onClick={handleConfirm}
          loading={confirming}
          disabled={editedProducts.length === 0}
          icon={<CheckCircleOutlined />}
          size="large"
        >
          Xác Nhận Tạo {totalSuppliers} Đơn Hàng
        </Button>,
      ]}
    >
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <Spin size="large" tip="Đang phân tích tồn kho..." />
        </div>
      ) : editedProducts.length === 0 ? (
        <Result
          status="success"
          icon={<CheckCircleOutlined style={{ color: "#52c41a" }} />}
          title="Tồn Kho Ổn Định"
          subTitle="Không có sản phẩm nào cần đặt hàng bổ sung."
        />
      ) : (
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          {/* Summary */}
          <Alert
            message="Sản phẩm cần đặt hàng"
            description={
              <Space split={<Divider type="vertical" />}>
                <Text>
                  <Text strong>{totalProducts}</Text> sản phẩm
                </Text>
                <Text>
                  <Text strong>{totalSuppliers}</Text> nhà cung cấp
                </Text>
                <Text>
                  Tổng:{" "}
                  <Text strong style={{ color: "#1890ff" }}>
                    {totalAmount.toLocaleString("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    })}
                  </Text>
                </Text>
              </Space>
            }
            type="success"
            icon={<MedicineBoxOutlined />}
            showIcon
          />

          {/* Products grouped by supplier */}
          {Object.entries(productsBySupplier).map(
            ([supplierName, supplierProducts], index) => {
              const supplierTotal = supplierProducts.reduce(
                (sum, p) => sum + p.quantity_needed * p.unit_price,
                0,
              );

              return (
                <div key={supplierName}>
                  <Space
                    style={{
                      width: "100%",
                      justifyContent: "space-between",
                      marginBottom: 8,
                    }}
                  >
                    <Title level={5} style={{ margin: 0 }}>
                      Nhà Cung Cấp: {supplierName}
                    </Title>
                    <Space>
                      <Tag color="blue">{supplierProducts.length} sản phẩm</Tag>
                      <Tag color="green">
                        {supplierTotal.toLocaleString("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        })}
                      </Tag>
                    </Space>
                  </Space>
                  <Table
                    columns={columns}
                    dataSource={supplierProducts}
                    rowKey="product_id"
                    pagination={false}
                    size="large"
                    scroll={{ x: 900 }}
                  />
                </div>
              );
            },
          )}
        </Space>
      )}
    </Modal>
  );
};

export default AutoGeneratePOModal;
