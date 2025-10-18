import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  Typography,
  Button,
  App as AntApp,
  Breadcrumb,
  Grid,
  Row,
  Col,
} from "antd";
import {
  ArrowLeftOutlined,
  HomeOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import ProductForm from "../../components/ProductForm";
import {
  createProduct,
  upsetInventory,
  createProductSupplierMapping, // Import the service
} from "@nam-viet-erp/services";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

interface CreateProductPageProps {
  hasPermission?: (permission: string) => boolean;
}

const CreateProductPage: React.FC<CreateProductPageProps> = ({
  hasPermission = () => true,
}) => {
  const navigate = useNavigate();
  const { notification } = AntApp.useApp();
  const [loading, setLoading] = useState(false);
  const screens = useBreakpoint();
  const isMobile = !screens.lg;

  // Check permission
  if (!hasPermission("products:create")) {
    return (
      <div style={{ padding: "24px", minHeight: "100vh" }}>
        <Card>
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <Title level={3}>🚫 Không có quyền truy cập</Title>
            <p>Bạn không có quyền tạo sản phẩm mới.</p>
            <Button onClick={() => navigate(-1)} size="large">
              <ArrowLeftOutlined /> Quay lại
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const handleCreateProduct = async (values: ProductFormData) => {
    setLoading(true);
    try {
      const { inventory_settings, supplier_ids, ...productData } = values;

      // 1. Create product first
      const { data: createdProduct, error: productError } =
        await createProduct(productData);
      if (productError) throw productError;

      const productId = createdProduct.id;

      // 2. Save supplier mappings if product was created and IDs exist
      if (productId && supplier_ids && supplier_ids.length > 0) {
        const mappingPromises = supplier_ids.map((supplierId: number) =>
          createProductSupplierMapping({
            product_id: productId,
            supplier_id: supplierId,
            is_primary: false, // You might want to add logic to set a primary supplier
          }),
        );

        const mappingResults = await Promise.all(mappingPromises);

        const mappingErrors = mappingResults.filter((r) => r.error);
        if (mappingErrors.length > 0) {
          console.error("Supplier mapping errors:", mappingErrors);
          notification.warning({
            message: "Cảnh báo!",
            description:
              "Sản phẩm đã được tạo nhưng có lỗi khi lưu thông tin nhà cung cấp.",
          });
        }
      }

      // 3. Save inventory_settings to inventory table
      if (
        productId &&
        inventory_settings &&
        Object.keys(inventory_settings).length > 0
      ) {
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
          console.error("Inventory create error:", inventoryError);
          notification.warning({
            message: "Cảnh báo!",
            description:
              "Sản phẩm đã được tạo nhưng có lỗi khi cập nhật tồn kho.",
          });
        }
      }

      notification?.success({
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
    <div style={{ padding: "24px", minHeight: "100vh" }}>
      {/* Breadcrumb */}
      <Breadcrumb
        style={{ marginBottom: "16px" }}
        items={[
          {
            title: <HomeOutlined />,
          },
          {
            title: (
              <span
                style={{ cursor: "pointer", color: "#1890ff" }}
                onClick={() => navigate("/products")}
              >
                Quản lý Sản phẩm
              </span>
            ),
          },
          {
            title: "Thêm sản phẩm mới",
          },
        ]}
      />

      {/* Header */}
      <Row
        justify="space-between"
        align="middle"
        style={{ marginBottom: isMobile ? 16 : 24 }}
      >
        <Col>
          <Title level={isMobile ? 3 : 2} style={{ margin: 0 }}>
            <PlusOutlined /> Thêm sản phẩm mới
          </Title>
          <Text
            type="secondary"
            style={{ fontSize: isMobile ? "14px" : "16px" }}
          >
            Điền thông tin để tạo sản phẩm mới trong hệ thống
          </Text>
        </Col>
      </Row>

      {/* Product Form */}
      <Card>
        <ProductForm
          onFinish={handleCreateProduct}
          initialData={null}
          onClose={() => navigate("/products")}
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
