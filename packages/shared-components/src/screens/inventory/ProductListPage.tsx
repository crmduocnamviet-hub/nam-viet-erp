import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Input,
  Space,
  Typography,
  Avatar,
  Tag,
  Grid,
  App as AntApp,
  type TableProps,
} from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useDebounce } from "@nam-viet-erp/shared-components";
import { searchProducts } from "@nam-viet-erp/services";

const { Title, Text } = Typography;
const { Search } = Input;
const { useBreakpoint } = Grid;

// Helper function to validate URLs
const isValidUrl = (string: string): boolean => {
  try {
    const url = new URL(string);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

interface ProductListPageContentProps {
  hasPermission?: (permission: string) => boolean;
}

const ProductListPageContent: React.FC<ProductListPageContentProps> = ({
  hasPermission = () => true,
}) => {
  const { notification } = AntApp.useApp();
  const screens = useBreakpoint();
  const isMobile = !screens.lg;

  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error, count } = await searchProducts({
        search: debouncedSearchTerm,
        page: pagination.current,
        pageSize: pagination.pageSize,
      });
      if (error) throw error;
      setProducts(data || []);
      setPagination((prev) => ({ ...prev, total: count || 0 }));
    } catch (error: any) {
      notification.error({
        message: "Lỗi tải dữ liệu",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [debouncedSearchTerm, pagination.current, pagination.pageSize]);

  const handleTableChange: TableProps<any>["onChange"] = (newPagination) => {
    setPagination((prev) => ({
      ...prev,
      current: newPagination.current || 1,
      pageSize: newPagination.pageSize || 10,
    }));
  };

  const columns: TableProps<IProduct>["columns"] = [
    {
      title: "Sản phẩm",
      dataIndex: "name",
      key: "name",
      render: (text: string, record: IProduct) => (
        <Space>
          <Avatar
            shape="square"
            size={isMobile ? 48 : 64}
            src={
              record.image_url && isValidUrl(record.image_url)
                ? record.image_url
                : null
            }
          />
          <div>
            <Typography.Text strong>{text}</Typography.Text>
            <div style={{ color: "gray", fontSize: "12px" }}>
              SKU: {record.sku || "N/A"}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: "Phân loại",
      dataIndex: "category",
      key: "category",
      responsive: ["md"],
      render: (category: string) => category || "-",
    },
    {
      title: "Đơn vị",
      key: "unit",
      responsive: ["lg"],
      render: (_: any, record: IProduct) => (
        <div>
          <div>Bán lẻ: {record.retail_unit || "-"}</div>
          <div style={{ fontSize: "12px", color: "gray" }}>
            Bán buôn: {record.wholesale_unit || "-"}
          </div>
        </div>
      ),
    },
    {
      title: "Giá bán",
      key: "price",
      render: (_: any, record: IProduct) => (
        <div>
          <div>
            {record.retail_price
              ? `${record.retail_price.toLocaleString("vi-VN")}đ`
              : "-"}
          </div>
          {record.wholesale_price && (
            <div style={{ fontSize: "12px", color: "gray" }}>
              Sỉ: {record.wholesale_price.toLocaleString("vi-VN")}đ
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Nhà sản xuất",
      dataIndex: "manufacturer",
      key: "manufacturer",
      responsive: ["lg"],
      render: (manufacturer: string) => manufacturer || "-",
    },
    {
      title: "Trạng thái",
      dataIndex: "is_active",
      key: "is_active",
      responsive: ["md"],
      render: (isActive: boolean) => (
        <Tag color={isActive ? "green" : "red"}>
          {isActive ? "Đang kinh doanh" : "Ngừng kinh doanh"}
        </Tag>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px", minHeight: "100vh" }}>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <div>
          <Title level={isMobile ? 3 : 2} style={{ margin: 0 }}>
            📦 Danh sách Sản phẩm
          </Title>
          <Text type="secondary" style={{ fontSize: isMobile ? "14px" : "16px" }}>
            Xem danh sách sản phẩm trong hệ thống
          </Text>
        </div>

        <Card>
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            <Search
              placeholder="Tìm kiếm theo tên, SKU, mã vạch..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              prefix={<SearchOutlined />}
              allowClear
              size={isMobile ? "middle" : "large"}
            />

            <Table
              columns={columns}
              dataSource={products}
              loading={loading}
              rowKey="id"
              pagination={pagination}
              onChange={handleTableChange}
              scroll={{ x: 800 }}
            />
          </Space>
        </Card>
      </Space>
    </div>
  );
};

const ProductListPage: React.FC<ProductListPageContentProps> = (props) => (
  <AntApp>
    <ProductListPageContent {...props} />
  </AntApp>
);

export default ProductListPage;
