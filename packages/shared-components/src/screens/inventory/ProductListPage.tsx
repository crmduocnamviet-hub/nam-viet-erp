import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  Input,
  Space,
  Typography,
  Grid,
  App as AntApp,
  type TableProps,
} from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useDebounce } from "@nam-viet-erp/shared-components";
import { searchProducts } from "@nam-viet-erp/services";
import { ProductListTable } from "../../components/tables";

const { Title, Text } = Typography;
const { Search } = Input;
const { useBreakpoint } = Grid;

interface ProductListPageContentProps {
  hasPermission?: (permission: string) => boolean;
}

const ProductListPageContent: React.FC<ProductListPageContentProps> = () => {
  const navigate = useNavigate();
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

  const handleRowClick = (record: IProduct) => {
    navigate(`/products/edit/${record.id}`);
  };

  return (
    <div style={{ padding: "24px", minHeight: "100vh" }}>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <div>
          <Title level={isMobile ? 3 : 2} style={{ margin: 0 }}>
            📦 Danh sách Sản phẩm
          </Title>
          <Text
            type="secondary"
            style={{ fontSize: isMobile ? "14px" : "16px" }}
          >
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

            <ProductListTable
              products={products}
              loading={loading}
              pagination={pagination}
              isMobile={isMobile}
              onTableChange={handleTableChange}
              onRowClick={handleRowClick}
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
