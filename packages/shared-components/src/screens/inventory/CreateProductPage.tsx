import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  Typography,
  Button,
  App as AntApp,
  Breadcrumb,
} from "antd";
import {
  ArrowLeftOutlined,
  HomeOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import ProductForm from "../../components/ProductForm";
import { createProduct } from "@nam-viet-erp/services";

const { Title } = Typography;

interface CreateProductPageProps {
  hasPermission?: (permission: string) => boolean;
}

const CreateProductPage: React.FC<CreateProductPageProps> = ({
  hasPermission = () => true,
}) => {
  const navigate = useNavigate();
  const { notification } = AntApp.useApp();
  const [loading, setLoading] = useState(false);

  // Check permission
  if (!hasPermission("products:create")) {
    return (
      <Card>
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <Title level={3}>🚫 Không có quyền truy cập</Title>
          <p>Bạn không có quyền tạo sản phẩm mới.</p>
          <Button onClick={() => navigate(-1)}>
            <ArrowLeftOutlined /> Quay lại
          </Button>
        </div>
      </Card>
    );
  }

  const handleCreateProduct = async (values: any) => {
    console.log("CreateProductPage handleCreateProduct called with:", values);
    setLoading(true);
    try {
      const { error } = await createProduct(values);

      if (error) throw error;

      notification.success({
        message: "Thành công!",
        description: "Sản phẩm mới đã được tạo thành công.",
      });

      // Navigate back to products list
      navigate("/products");
    } catch (error: any) {
      notification.error({
        message: "Lỗi tạo sản phẩm",
        description: error.message || "Không thể tạo sản phẩm mới.",
      });
    } finally {
      setLoading(false);
    }
  };


  return (
    <div style={{ padding: "24px" }}>
      {/* Breadcrumb */}
      <Breadcrumb
        style={{ marginBottom: "16px" }}
        items={[
          {
            title: <HomeOutlined />
          },
          {
            title: (
              <span
                style={{ cursor: "pointer", color: "#1890ff" }}
                onClick={() => navigate("/products")}
              >
                Quản lý Sản phẩm
              </span>
            )
          },
          {
            title: "Thêm sản phẩm mới"
          }
        ]}
      />

      {/* Header */}
      <Card style={{ marginBottom: "24px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <Title level={2} style={{ margin: 0 }}>
              <PlusOutlined /> Thêm sản phẩm mới
            </Title>
            <p style={{ margin: "8px 0 0 0", color: "#666" }}>
              Điền thông tin để tạo sản phẩm mới trong hệ thống
            </p>
          </div>
        </div>
      </Card>

      {/* Product Form */}
      <Card>
        <ProductForm
          onFinish={handleCreateProduct}
          initialData={null}
          onClose={function (): void {
            navigate("/products");
          }}
          loading={loading}
        />
      </Card>
    </div>
  );
};

// Wrapper with App provider for notifications
const CreateProductPageWrapper: React.FC<CreateProductPageProps> = (props) => (
  <AntApp>
    <CreateProductPage {...props} />
  </AntApp>
);

export default CreateProductPageWrapper;
