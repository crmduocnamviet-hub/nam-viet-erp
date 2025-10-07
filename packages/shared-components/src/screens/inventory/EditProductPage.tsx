import React, { useState, useEffect } from "react";
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
import {
  HomeOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";
import ProductForm from "../../components/ProductForm";
import PageLayout from "../../components/PageLayout";
import {
  getProductById,
  updateProduct,
  upsetInventory,
  getInventoryByProductId,
} from "@nam-viet-erp/services";
import { ProductFormData } from "../../types/product";

interface EditProductPageProps {
  hasPermission?: (permission: string) => boolean;
}

const EditProductPage: React.FC<EditProductPageProps> = ({
  hasPermission = () => true,
}) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { notification } = AntApp.useApp();

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [productData, setProductData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

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

  // Load product data
  useEffect(() => {
    const loadProduct = async () => {
      if (!id) {
        setError("ID sản phẩm không hợp lệ");
        setInitialLoading(false);
        return;
      }

      try {
        const productId = parseInt(id);

        // Fetch product data
        const { data: product, error: productError } = await getProductById(
          productId
        );
        if (productError) throw productError;
        if (!product) {
          throw new Error("Không tìm thấy sản phẩm");
        }

        // Fetch inventory data for this product
        const { data: inventoryData, error: inventoryError } =
          await getInventoryByProductId(productId);
        if (inventoryError) {
          console.error("Error loading inventory:", inventoryError);
        }

        // Merge inventory data into product data
        const productWithInventory = {
          ...product,
          inventory_data: inventoryData || [],
        };

        console.log("Loaded product with inventory:", productWithInventory);
        setProductData(productWithInventory);
      } catch (error: any) {
        console.error("Error loading product:", error);
        setError(error.message || "Không thể tải thông tin sản phẩm");
      } finally {
        setInitialLoading(false);
      }
    };

    loadProduct();
  }, [id]);

  const handleUpdateProduct = async (values: ProductFormData) => {
    if (!id) return;

    setLoading(true);
    try {
      const { inventory_settings, ...productData } = values;
      const productId = parseInt(id);

      console.log("Inventory settings:", inventory_settings);
      console.log("Product data:", productData);

      // Update product data
      const { error: productError } = await updateProduct(
        productId,
        productData
      );
      if (productError) throw productError;

      // Update inventory settings if they exist
      if (inventory_settings && Object.keys(inventory_settings).length > 0) {
        // Convert inventory_settings to array format for upsert
        const inventoryData = Object.entries(inventory_settings)
          .filter(([_, settings]) => settings && typeof settings === "object")
          .map(([warehouseId, settings]) => ({
            product_id: productId,
            warehouse_id: parseInt(warehouseId),
            min_stock: settings?.min_stock || 0,
            max_stock: settings?.max_stock || 0,
          }));

        console.log("Upserting inventory data:", inventoryData);

        const { error: inventoryError } = await upsetInventory(inventoryData);
        if (inventoryError) {
          console.error("Inventory update error:", inventoryError);
          notification.warning({
            message: "Cảnh báo!",
            description:
              "Sản phẩm đã được cập nhật nhưng có lỗi khi cập nhật tồn kho.",
          });
        }
      }

      notification?.success({
        message: "Thành công!",
        description: "Sản phẩm và tồn kho đã được cập nhật thành công.",
      });

      // Navigate back to products list
      navigate("/products");
    } catch (error: any) {
      notification.error({
        message: "Lỗi cập nhật sản phẩm",
        description: error.message || "Không thể cập nhật sản phẩm.",
      });
    } finally {
      setLoading(false);
    }
  };

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
