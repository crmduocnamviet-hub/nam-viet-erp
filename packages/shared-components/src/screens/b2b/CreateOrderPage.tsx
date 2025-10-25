import React, { useState } from "react";
import {
  Row,
  Col,
  Typography,
  Grid,
  notification,
  Tabs,
  Input,
  Space,
  Tooltip,
  Badge,
} from "antd";
import { PlusOutlined, EditOutlined } from "@ant-design/icons";
import { getB2BWarehouseProductByBarCode } from "@nam-viet-erp/services";
import {
  B2BCustomerSearchModal,
  B2BOrderPreviewModal,
  QRScannerModal,
} from "@nam-viet-erp/shared-components";
import CreateOrderForm from "../../components/CreateOrderForm";
import {
  useB2BOrderStore,
  useInitializeB2BOrder,
  useOrderItems,
  useTabs,
  useActiveTabId,
} from "@nam-viet-erp/store";

const { Title, Text } = Typography;

interface Product {
  id: number;
  name: string;
  wholesale_price: number;
  packaging?: string;
  manufacturer?: string;
  image_url?: string;
  unit?: string;
  sku?: string;
  stock_quantity?: number;
}

interface Employee {
  employee_id: string;
  full_name: string;
  employee_code: string;
}

interface CreateOrderPageProps {
  employee?: Employee | null;
  onNavigateToList?: () => void;
}

const { useBreakpoint } = Grid; // <-- "Mắt thần" theo dõi kích thước màn hình

const CreateOrderPage: React.FC<CreateOrderPageProps> = ({
  employee,
  onNavigateToList,
}) => {
  // Initialize B2B order sagas

  const [previewVisible, setPreviewVisible] = useState(false);
  const [clientSelectVisible, setClientSelectVisible] = useState(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const screens = useBreakpoint(); // Lấy thông tin màn hình hiện tại
  const isMobile = !screens.lg; // Coi là mobile nếu màn hình nhỏ hơn 'lg'

  // Tab editing state
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingTabTitle, setEditingTabTitle] = useState<string>("");

  // Get zustand store state and actions
  const tabs = useTabs();
  const activeTabId = useActiveTabId();
  const orderItems = useOrderItems();

  const {
    addOrderItem,
    updateOrderItem,
    setSelectedCustomer,
    createTab,
    closeTab,
    switchTab,
    updateTabTitle,
  } = useB2BOrderStore();
  // Handle client selection
  const handleSelectClient = (client: IB2BCustomer) => {
    // Type assertion since IB2BCustomer is compatible with store Customer type
    setSelectedCustomer(client as any);
    // Auto-fill form with B2B customer information
  };

  // Handle QR scan result
  const handleQRScan = async (scannedData: string) => {
    try {
      const { data } = await getB2BWarehouseProductByBarCode({
        barcode: scannedData,
      });

      if (data && data.length) {
        const product = {
          ...data?.[0]?.products,
          stock_quantity: data?.[0]?.quantity || 0,
        } as unknown as Product;

        // Check inventory before adding
        if (
          product.stock_quantity !== undefined &&
          product.stock_quantity <= 0
        ) {
          notification.error({
            message: "❌ Sản phẩm hết hàng",
            description: `${product.name} đã hết hàng trong kho. Vui lòng nhập thêm hàng.`,
            duration: 3,
          });
        } else {
          handleAddProducts([product]);
          notification.success({
            message: "✅ Quét thành công",
            description: `Đã thêm ${product.name} vào đơn hàng`,
            duration: 2,
          });
        }
      } else {
        notification.warning({
          message: "⚠️ Không tìm thấy sản phẩm",
          description: `Mã: ${scannedData}`,
          duration: 2,
        });
      }
    } catch (error) {
      console.error("Error fetching product by barcode:", error);
      notification.error({
        message: "❌ Lỗi quét mã",
        description: "Không thể tìm kiếm sản phẩm",
        duration: 2,
      });
    }
  };

  // Add products to order (supports both single product and array)
  const handleAddProducts = (products: Product | Product[]) => {
    const productArray = Array.isArray(products) ? products : [products];
    const newItems: IB2BQuoteItem[] = [];
    const updatedItems: string[] = [];
    const outOfStockItems: string[] = [];

    productArray.forEach((product, index) => {
      // Check inventory before processing
      if (product.stock_quantity !== undefined && product.stock_quantity <= 0) {
        outOfStockItems.push(product.name);
        return;
      }

      // Check if product already exists in order
      const existingItem = orderItems.find(
        (item) => item.product_id === product.id,
      );

      if (existingItem) {
        // Increase quantity of existing product using store
        const newQuantity = existingItem.quantity + 1;

        // Check if new quantity exceeds stock
        if (
          product.stock_quantity !== undefined &&
          newQuantity > product.stock_quantity
        ) {
          notification.error({
            message: "Vượt quá tồn kho",
            description: `${product.name} chỉ còn ${product.stock_quantity} sản phẩm trong kho. Hiện tại đơn hàng đã có ${existingItem.quantity}.`,
            duration: 4,
          });
          return;
        }

        updateOrderItem(existingItem.key, {
          quantity: newQuantity,
          total_price: newQuantity * existingItem.unit_price,
        });
        updatedItems.push(existingItem.product_name);
        return;
      }

      // Validate product_id is a valid number
      if (!product.id || typeof product.id !== "number") {
        console.error(
          "Invalid product id when adding product:",
          product.id,
          product,
        );
        return;
      }

      // Add new product
      newItems.push({
        key: `${product.id}_${Date.now()}_${index}`,
        product_id: product.id,
        product_name: product.name,
        unit_price: product.wholesale_price || 0,
        quantity: 1,
        total_price: product.wholesale_price || 0,
        packaging: product.packaging,
        unit: product.unit || "Hộp",
      } as never);
    });

    // Add new items to order using store
    newItems.forEach((item) => addOrderItem(item));

    // Show appropriate notifications
    if (outOfStockItems.length > 0) {
      notification.error({
        message: "Không thể thêm sản phẩm hết hàng",
        description: `Các sản phẩm sau đã hết hàng: ${outOfStockItems.join(
          ", ",
        )}. Vui lòng nhập thêm hàng.`,
        duration: 4,
      });
    }

    if (newItems.length > 0 && updatedItems.length > 0) {
      notification?.success({
        message: "Thêm sản phẩm thành công",
        description: `Đã thêm ${newItems.length} sản phẩm mới và tăng số lượng ${updatedItems.length} sản phẩm có sẵn`,
      });
    } else if (newItems.length > 0) {
      notification?.success({
        message: "Thêm sản phẩm thành công",
        description: `Đã thêm ${newItems.length} sản phẩm vào đơn hàng`,
      });
    } else if (updatedItems.length > 0) {
      notification?.success({
        message: "Cập nhật số lượng thành công",
        description: `Đã tăng số lượng cho ${updatedItems.join(", ")}`,
      });
    }
  };

  return (
    <div
      style={{
        padding: 0,
        minHeight: "100vh",
        height: "100vh",
        backgroundColor: "#f5f5f5",
        overflow: "hidden",
      }}
    >
      {/* Multi-tab navigation */}
      <Tabs
        type="editable-card"
        activeKey={activeTabId}
        onChange={switchTab}
        onEdit={(targetKey, action) => {
          if (action === "add") {
            createTab();
          } else if (action === "remove" && typeof targetKey === "string") {
            closeTab(targetKey);
          }
        }}
        items={tabs.map((tab, index) => ({
          key: tab.id,
          label: (
            <Space size={4}>
              {editingTabId === tab.id ? (
                <Input
                  size="small"
                  value={editingTabTitle}
                  onChange={(e) => setEditingTabTitle(e.target.value)}
                  onPressEnter={() => {
                    if (editingTabTitle.trim()) {
                      updateTabTitle(tab.id, editingTabTitle.trim());
                    }
                    setEditingTabId(null);
                    setEditingTabTitle("");
                  }}
                  onBlur={() => {
                    if (editingTabTitle.trim()) {
                      updateTabTitle(tab.id, editingTabTitle.trim());
                    }
                    setEditingTabId(null);
                    setEditingTabTitle("");
                  }}
                  autoFocus
                  style={{ width: 120 }}
                />
              ) : (
                <span
                  style={{ cursor: "pointer" }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setEditingTabId(tab.id);
                    setEditingTabTitle(tab.title);
                  }}
                >
                  {tab.title}
                </span>
              )}
              {editingTabId !== tab.id && (
                <Tooltip title="Double-click to edit or click icon">
                  <EditOutlined
                    style={{ fontSize: 12, color: "#999", cursor: "pointer" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingTabId(tab.id);
                      setEditingTabTitle(tab.title);
                    }}
                  />
                </Tooltip>
              )}
              {tab.orderItems.length > 0 && (
                <Badge
                  count={tab.orderItems.length}
                  offset={[10, -2]}
                  style={{ backgroundColor: "#52c41a" }}
                />
              )}
            </Space>
          ),
          closable: tabs.length > 1,
          children: (
            <div
              style={{
                height: "calc(100vh - 48px)",
                overflowY: "auto",
                padding: "16px",
              }}
            >
              <CreateOrderForm
                index={index}
                employee={employee}
                onOpenClientSelectModal={() => setClientSelectVisible(true)}
                onNavigateToList={onNavigateToList}
              />
            </div>
          ),
        }))}
        style={{
          marginBottom: 0,
          backgroundColor: "transparent",
        }}
        addIcon={<PlusOutlined />}
        // styles={{
        //   tabPane: {
        //     overflowY: "auto",
        //     height: "calc(100vh - 48px)",
        //     padding: "16px",
        //   },
        // }}
      />

      {/* Order Preview Modal */}
      <B2BOrderPreviewModal
        visible={previewVisible}
        onClose={() => setPreviewVisible(false)}
        orderSummary={null}
        isMobile={isMobile}
      />

      {/* Client Selection Modal */}
      <B2BCustomerSearchModal
        open={clientSelectVisible}
        onClose={() => setClientSelectVisible(false)}
        onSelect={handleSelectClient}
        title="Chọn Khách hàng B2B"
      />

      {/* QR Scanner Modal */}
      <QRScannerModal
        visible={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        onScan={handleQRScan}
      />
    </div>
  );
};

export default CreateOrderPage;
