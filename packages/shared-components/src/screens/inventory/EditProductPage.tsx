import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Card,
  Typography,
  Button,
  Space,
  App as AntApp,
  Spin,
  Alert,
} from "antd";
import { HomeOutlined, AppstoreOutlined } from "@ant-design/icons";
import ProductForm from "../../components/ProductForm";
import PageLayout from "../../components/PageLayout";
import {
  useProductWithInventory,
  useUpdateProductHandler,
} from "@nam-viet-erp/store";

interface EditProductPageProps {
  hasPermission?: (permission: string) => boolean;
}

const EditProductPage: React.FC<EditProductPageProps> = ({
  hasPermission = () => true,
}) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { notification } = AntApp.useApp();
  const {
    data: productData,
    isLoading: initialLoading,
    error,
  } = useProductWithInventory(parseInt(id));

  // Check permission
  if (!hasPermission("products:update")) {
    return (
      <PageLayout title="Chỉnh sửa sản phẩm" showBackButton>
        <Card>
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <Typography.Title level={3}>
              🚫 Không có quyền truy cập
            </Typography.Title>
            <p>Bạn không có quyền chỉnh sửa sản phẩm.</p>
          </div>
        </Card>
      </PageLayout>
    );
  }

  const { submit: handleUpdateProduct, isLoading: loading } =
    useUpdateProductHandler({
      productId: parseInt(id),
      onError(error) {
        notification.error({
          message: "Lỗi cập nhật sản phẩm",
          description: error.message || "Không thể cập nhật sản phẩm.",
        });
      },
      onSuccess() {
        notification?.success({
          message: "Thành công!",
          description: "Sản phẩm và tồn kho đã được cập nhật thành công.",
        });
      },
    });

  if (initialLoading) {
    return (
      <PageLayout title="Chỉnh sửa sản phẩm" showBackButton>
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <Spin size="large" />
          <p style={{ marginTop: "16px" }}>Đang tải thông tin sản phẩm...</p>
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout
        title="Chỉnh sửa sản phẩm"
        showBackButton
        breadcrumbs={[
          {
            title: "Trang chủ",
            href: "/",
            icon: <HomeOutlined />,
          },
          {
            title: "Sản phẩm",
            href: "/products",
            icon: <AppstoreOutlined />,
          },
          {
            title: "Chỉnh sửa sản phẩm",
          },
        ]}
      >
        <Alert
          message="Lỗi tải dữ liệu"
          description={error}
          type="error"
          showIcon
          action={
            <Space>
              <Button size="small" onClick={() => window.location.reload()}>
                Thử lại
              </Button>
              <Button
                size="small"
                onClick={() => navigate("/inventory/products")}
              >
                Quay về danh sách
              </Button>
            </Space>
          }
        />
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title={`Chỉnh sửa sản phẩm: ${productData?.name || ""}`}
      showBackButton
      breadcrumbs={[
        {
          title: "Trang chủ",
          href: "/",
          icon: <HomeOutlined />,
        },
        {
          title: "Sản phẩm",
          href: "/products",
          icon: <AppstoreOutlined />,
        },
        {
          title: "Chỉnh sửa sản phẩm",
        },
      ]}
    >
      {productData && (
        <ProductForm
          onClose={() => navigate(-1)}
          onFinish={handleUpdateProduct}
          loading={loading}
          initialData={productData}
        />
      )}
    </PageLayout>
  );
};

// Wrapper with App provider for notifications
const EditProductPageWrapper: React.FC<EditProductPageProps> = (props) => (
  <AntApp>
    <EditProductPage {...props} />
  </AntApp>
);

export default EditProductPageWrapper;
