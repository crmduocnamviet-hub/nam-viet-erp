import React, { useState } from "react";
import {
  Modal,
  Tabs,
  Table,
  Button,
  Space,
  Statistic,
  Tag,
  Typography,
  notification,
  Row,
  Col,
  Card,
} from "antd";
import {
  ShoppingOutlined,
  ArrowRightOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import type { ColumnsType } from "antd/es/table";

const { Text, Title } = Typography;

interface ProductSuggestion {
  product_id: number;
  product_name: string;
  product_sku: string;
  current_quantity: number;
  min_stock: number;
  max_stock: number;
  quantity_needed_retail: number;
  quantity_needed_wholesale: number;
  conversion_rate: number;
  wholesale_unit: string;
  retail_unit: string;
  unit_price: number;
  enable_lot_management: boolean;
}

interface WarehouseSuggestion {
  warehouse_id: number;
  warehouse_name: string;
  products: ProductSuggestion[];
  total_products: number;
  total_value: number;
}

interface TransferSuggestionsData {
  b2b_warehouse: IWarehouse;
  suggestions: WarehouseSuggestion[];
  total_pharmacies: number;
  total_products: number;
}

interface TransferSuggestionsModalProps {
  open: boolean;
  onClose: () => void;
  data: TransferSuggestionsData | null;
  loading?: boolean;
}

const TransferSuggestionsModal: React.FC<TransferSuggestionsModalProps> = ({
  open,
  onClose,
  data,
  loading = false,
}) => {
  const navigate = useNavigate();
  const [selectedWarehouse, setSelectedWarehouse] = useState<number | null>(
    null,
  );

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);

  const columns: ColumnsType<ProductSuggestion> = [
    {
      title: "Sản phẩm",
      dataIndex: "product_name",
      key: "product_name",
      width: 250,
      fixed: "left",
      render: (text, record) => (
        <div>
          <Text strong>{text}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            SKU: {record.product_sku}
          </Text>
          {record.enable_lot_management && (
            <Tag color="blue" style={{ marginLeft: 8 }}>
              Quản lý lô
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: "Tồn hiện tại",
      dataIndex: "current_quantity",
      key: "current_quantity",
      width: 100,
      align: "right",
      render: (value, record) => (
        <Text type={value < record.min_stock ? "danger" : "secondary"}>
          {value} {record.retail_unit}
        </Text>
      ),
    },
    {
      title: "Min",
      dataIndex: "min_stock",
      key: "min_stock",
      width: 80,
      align: "right",
      render: (value, record) => `${value} ${record.retail_unit}`,
    },
    {
      title: "Max",
      dataIndex: "max_stock",
      key: "max_stock",
      width: 80,
      align: "right",
      render: (value, record) => `${value} ${record.retail_unit}`,
    },
    {
      title: "Cần chuyển (B2B)",
      dataIndex: "quantity_needed_wholesale",
      key: "quantity_needed_wholesale",
      width: 140,
      align: "right",
      render: (value, record) => (
        <Text strong style={{ color: "#1890ff" }}>
          {value} {record.wholesale_unit}
        </Text>
      ),
    },
    {
      title: "= Nhận (Hiệu thuốc)",
      dataIndex: "quantity_needed_retail",
      key: "quantity_needed_retail",
      width: 160,
      align: "right",
      render: (value, record) => (
        <Text style={{ color: "#52c41a" }}>
          {value} {record.retail_unit}
          {record.conversion_rate > 1 && (
            <Text type="secondary" style={{ fontSize: 11, marginLeft: 4 }}>
              (x{record.conversion_rate})
            </Text>
          )}
        </Text>
      ),
    },
    {
      title: "Giá trị",
      key: "total_value",
      width: 130,
      align: "right",
      render: (_, record) =>
        formatCurrency(record.quantity_needed_retail * record.unit_price),
    },
  ];

  const handleCreateTransfer = (warehouseSuggestion: WarehouseSuggestion) => {
    // Store suggestion data in sessionStorage to use in CreateWarehouseTransferPage
    sessionStorage.setItem(
      "transferSuggestion",
      JSON.stringify({
        from_warehouse_id: data?.b2b_warehouse.id,
        to_warehouse_id: warehouseSuggestion.warehouse_id,
        products: warehouseSuggestion.products,
      }),
    );

    notification.success({
      message: "Đã chuyển sang trang tạo phiếu",
      description: `Tạo phiếu chuyển kho cho ${warehouseSuggestion.warehouse_name}`,
    });

    navigate("/warehouse/transfers/create");
    onClose();
  };

  if (!data || data.suggestions.length === 0) {
    return (
      <Modal
        title="Dự trù chuyển kho"
        open={open}
        onCancel={onClose}
        footer={null}
        width={800}
      >
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <CheckCircleOutlined
            style={{ fontSize: 48, color: "#52c41a", marginBottom: 16 }}
          />
          <Title level={4}>Tất cả kho đều đủ hàng!</Title>
          <Text type="secondary">
            Không có sản phẩm nào cần chuyển kho tại thời điểm này.
          </Text>
        </div>
      </Modal>
    );
  }

  const tabItems = data.suggestions.map((suggestion) => ({
    key: suggestion.warehouse_id.toString(),
    label: (
      <Space>
        {suggestion.warehouse_name}
        <Tag color="orange">{suggestion.total_products}</Tag>
      </Space>
    ),
    children: (
      <div>
        {/* Summary */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Card size="small">
              <Statistic
                title="Số sản phẩm cần chuyển"
                value={suggestion.total_products}
                prefix={<ShoppingOutlined />}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small">
              <Statistic
                title="Tổng giá trị"
                value={suggestion.total_value}
                formatter={(value) => formatCurrency(Number(value))}
                valueStyle={{ color: "#3f8600" }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small">
              <Button
                type="primary"
                icon={<ArrowRightOutlined />}
                onClick={() => handleCreateTransfer(suggestion)}
                block
                size="large"
              >
                Tạo phiếu chuyển kho
              </Button>
            </Card>
          </Col>
        </Row>

        {/* Product Table */}
        <Table
          columns={columns}
          dataSource={suggestion.products}
          rowKey="product_id"
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 10,
            showTotal: (total) => `Tổng ${total} sản phẩm`,
            showSizeChanger: true,
          }}
          size="small"
        />
      </div>
    ),
  }));

  return (
    <Modal
      title={
        <Space>
          <ShoppingOutlined />
          <span>Dự trù chuyển kho từ {data.b2b_warehouse.name}</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width="90%"
      style={{ top: 20 }}
      bodyStyle={{ maxHeight: "calc(100vh - 200px)", overflowY: "auto" }}
    >
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {/* Overall Summary */}
        <Row gutter={16}>
          <Col span={12}>
            <Card size="small">
              <Statistic
                title="Tổng số kho cần chuyển"
                value={data.total_pharmacies}
                suffix="kho"
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card size="small">
              <Statistic
                title="Tổng số sản phẩm"
                value={data.total_products}
                suffix="sản phẩm"
                prefix={<ShoppingOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {/* Tabs for each warehouse */}
        <Tabs
          defaultActiveKey={data.suggestions[0]?.warehouse_id.toString()}
          items={tabItems}
        />
      </Space>
    </Modal>
  );
};

export default TransferSuggestionsModal;
