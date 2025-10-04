import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Card,
  Typography,
  Button,
  Space,
  App as AntApp,
  Breadcrumb,
  Spin,
  Alert,
} from "antd";
import {
  ArrowLeftOutlined,
  HomeOutlined,
  EditOutlined,
} from "@ant-design/icons";
import ProductForm from "../../components/ProductForm";
import { getProductById, updateProduct, upsetInventory, getInventoryByProductId } from "@nam-viet-erp/services";
import { ProductFormData } from "../../types/product";

const { Title } = Typography;

interface EditProductPageProps {
  hasPermission?: (permission: string) => boolean;
}

const EditProductPage: React.FC<EditProductPageProps> = ({
  hasPermission = () => true
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
      <Card>
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <Title level={3}>🚫 Không có quyền truy cập</Title>
          <p>Bạn không có quyền chỉnh sửa sản phẩm.</p>
          <Button onClick={() => navigate(-1)}>
            <ArrowLeftOutlined /> Quay lại
          </Button>
        </div>
      </Card>
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
        const { data: product, error: productError } = await getProductById(productId);
        if (productError) throw productError;
        if (!product) {
          throw new Error("Không tìm thấy sản phẩm");
        }

        // Fetch inventory data for this product
        const { data: inventoryData, error: inventoryError } = await getInventoryByProductId(productId);
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
      const { error: productError } = await updateProduct(productId, productData);
      if (productError) throw productError;

      // Update inventory settings if they exist
      if (inventory_settings && Object.keys(inventory_settings).length > 0) {
        // Convert inventory_settings to array format for upsert
        const inventoryData = Object.entries(inventory_settings)
          .filter(([_, settings]) => settings && typeof settings === 'object')
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
            description: "Sản phẩm đã được cập nhật nhưng có lỗi khi cập nhật tồn kho.",
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
      <div style={{ padding: "24px", textAlign: "center" }}>
        <Spin size="large" />
        <p style={{ marginTop: "16px" }}>Đang tải thông tin sản phẩm...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "24px" }}>
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
              <Button size="small" onClick={() => navigate("/inventory/products")}>
                Quay về danh sách
              </Button>
            </Space>
          }
        />
      </div>
    );
  }

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
            title: "Chỉnh sửa sản phẩm"
          }
        ]}
      />

      {/* Header */}
      <Card style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <Title level={2} style={{ margin: 0 }}>
              <EditOutlined /> Chỉnh sửa sản phẩm
            </Title>
            <p style={{ margin: "8px 0 0 0", color: "#666" }}>
              {productData?.name || "Cập nhật thông tin sản phẩm"}
            </p>
          </div>
        </div>
      </Card>

      {/* Product Form */}
      <Card>
        {productData && (
          <ProductForm
            onClose={() => navigate(-1)}
            onFinish={handleUpdateProduct}
            loading={loading}
            initialData={productData}
          />
        )}
      </Card>
    </div>
  );
};

// Wrapper with App provider for notifications
const EditProductPageWrapper: React.FC<EditProductPageProps> = (props) => (
  <AntApp>
    <EditProductPage {...props} />
  </AntApp>
);

export default EditProductPageWrapper;