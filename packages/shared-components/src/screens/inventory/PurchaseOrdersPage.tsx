import React, { useState, useEffect, useMemo } from "react";
import {
  Button,
  Table,
  Space,
  Row,
  Col,
  Typography,
  App as AntApp,
  Tag,
  type TableProps,
  Input,
  Grid,
  Tooltip,
  Popover,
} from "antd";
import {
  PlusOutlined,
  RobotOutlined,
  ShoppingOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  getPurchaseOrders,
  autoGeneratePurchaseOrders,
} from "@nam-viet-erp/services";

const { Title } = Typography;
const { Search } = Input;
const { useBreakpoint } = Grid;

interface PurchaseOrdersPageProps {
  employee?: any;
}

const PurchaseOrdersContent: React.FC<PurchaseOrdersPageProps> = ({
  employee,
}) => {
  const { notification, modal } = AntApp.useApp();
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const screens = useBreakpoint();
  const isMobile = !screens.lg;

  const fetchPOs = async () => {
    setLoading(true);
    try {
      // Use getPurchaseOrders to get orders with items and products
      const { data, error } = await getPurchaseOrders();
      if (error) throw error;

      // Debug: Log order structure to verify items are loaded
      if (data && data.length > 0) {
        console.log("[PurchaseOrdersPage] Orders loaded:", data.length);
        console.log("[PurchaseOrdersPage] First order structure:", {
          id: data[0].id,
          po_number: data[0].po_number,
          hasItems: !!data[0].items,
          itemsCount: data[0].items?.length || 0,
          items: data[0].items,
          firstItem: data[0].items?.[0]
            ? {
                hasProduct: !!data[0].items[0].product,
                product: data[0].items[0].product,
                productName: data[0].items[0].product?.name,
                productSku: data[0].items[0].product?.sku,
                productBarcode: data[0].items[0].product?.barcode,
              }
            : null,
        });
      }

      setPurchaseOrders(data || []);
    } catch (error: any) {
      notification.error({
        message: "Lỗi tải đơn đặt hàng",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPOs();
  }, [notification]);

  // Filter by search text (client-side) - includes product name, SKU, barcode search
  const filteredData = useMemo(() => {
    if (!searchText) return purchaseOrders;

    const lowerSearch = searchText.toLowerCase().trim();
    if (!lowerSearch) return purchaseOrders;

    return purchaseOrders.filter((po) => {
      // Search by PO number
      if (po.po_number?.toLowerCase().includes(lowerSearch)) return true;
      if (po.id?.toString().includes(lowerSearch)) return true;

      // Search by supplier name
      if (po.supplier?.name?.toLowerCase().includes(lowerSearch)) return true;
      if (po.suppliers?.name?.toLowerCase().includes(lowerSearch)) return true;

      // Search by product names, SKU, barcode in order items
      if (po.items && Array.isArray(po.items) && po.items.length > 0) {
        const hasMatchingProduct = po.items.some((item: any) => {
          // Try multiple paths for product data
          const product = item.product || item.product_id || {};
          const productName = (
            product?.name ||
            item.product_name ||
            product?.product_name ||
            ""
          ).toLowerCase();
          const productSku = (
            product?.sku ||
            item.sku ||
            product?.product_sku ||
            ""
          ).toLowerCase();
          const productBarcode = (
            product?.barcode ||
            item.barcode ||
            product?.product_barcode ||
            ""
          ).toLowerCase();

          // Also check product code if exists
          const productCode = (
            product?.code ||
            item.product_code ||
            ""
          ).toLowerCase();

          return (
            productName.includes(lowerSearch) ||
            productSku.includes(lowerSearch) ||
            productBarcode.includes(lowerSearch) ||
            productCode.includes(lowerSearch)
          );
        });
        if (hasMatchingProduct) return true;
      }

      return false;
    });
  }, [purchaseOrders, searchText]);

  const handleAutoGenerate = async () => {
    if (!employee?.warehouse_id) {
      notification.error({
        message: "Lỗi",
        description:
          "Bạn chưa được gán kho hàng. Vui lòng liên hệ quản trị viên.",
      });
      return;
    }

    modal.confirm({
      title: "Xác nhận Tạo Dự trù Tự động?",
      content:
        "Hệ thống sẽ quét kho và tự động tạo các đơn hàng nháp cho các sản phẩm dưới tồn tối thiểu. Quá trình này có thể mất vài phút.",
      okText: "Bắt đầu",
      cancelText: "Hủy",
      onOk: async () => {
        setLoading(true);
        try {
          const result = await autoGeneratePurchaseOrders(
            employee.warehouse_id,
            employee.employee_id || null,
          );

          notification.success({
            message: "Đã tạo thành công!",
            description: result.message,
          });

          // Reload purchase orders list
          await fetchPOs();
        } catch (error: any) {
          notification.error({
            message: "Tạo dự trù thất bại",
            description: error.message,
          });
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const columns: TableProps<any>["columns"] = [
    {
      title: "Mã ĐH",
      dataIndex: "id",
      key: "id",
      render: (id) => `PO-${String(id).padStart(5, "0")}`,
    },
    {
      title: "Nhà Cung Cấp",
      dataIndex: ["supplier", "suppliers"],
      key: "supplier_name",
      render: (_, record) =>
        record.supplier?.name || record.suppliers?.name || "N/A",
    },
    {
      title: "Sản phẩm",
      key: "products",
      width: 300,
      render: (_, record) => {
        const items = record.items || [];
        if (items.length === 0) {
          return (
            <Tag color="default" style={{ margin: 0 }}>
              Chưa có sản phẩm
            </Tag>
          );
        }

        // Single product - show full name
        if (items.length === 1) {
          const product = items[0].product;
          const productName =
            product?.name || `Sản phẩm #${items[0].product_id}`;
          return (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <ShoppingOutlined style={{ color: "#1890ff" }} />
              <span style={{ fontWeight: 500 }}>{productName}</span>
              {items[0].quantity && (
                <Tag color="blue" style={{ margin: 0 }}>
                  x{items[0].quantity}
                </Tag>
              )}
            </div>
          );
        }

        // Multiple products - show count with popover
        const firstTwoProducts = items.slice(0, 2);
        const remainingCount = items.length - 2;

        const productListContent = (
          <div style={{ maxWidth: 400, maxHeight: 300, overflowY: "auto" }}>
            <div style={{ marginBottom: 8, fontWeight: 600, color: "#1890ff" }}>
              {items.length} sản phẩm trong đơn hàng:
            </div>
            {items.map((item: any, index: number) => {
              const product = item.product;
              const productName =
                product?.name || `Sản phẩm #${item.product_id}`;
              return (
                <div
                  key={index}
                  style={{
                    padding: "6px 0",
                    borderBottom:
                      index < items.length - 1 ? "1px solid #f0f0f0" : "none",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span style={{ color: "#666", minWidth: 20 }}>
                    {index + 1}.
                  </span>
                  <span style={{ flex: 1, fontWeight: 500 }}>
                    {productName}
                  </span>
                  {item.quantity && (
                    <Tag color="blue" style={{ margin: 0 }}>
                      SL: {item.quantity}
                    </Tag>
                  )}
                </div>
              );
            })}
          </div>
        );

        return (
          <Popover
            content={productListContent}
            title={null}
            trigger="click"
            placement="left"
            overlayStyle={{ maxWidth: 450 }}
          >
            <div
              style={{
                cursor: "pointer",
                padding: "4px 8px",
                borderRadius: 4,
                background: "#f0f7ff",
                border: "1px solid #d6e4ff",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <ShoppingOutlined style={{ color: "#1890ff" }} />
              <span style={{ fontWeight: 600, color: "#1890ff" }}>
                {items.length} sản phẩm
              </span>
            </div>
          </Popover>
        );
      },
    },
    {
      title: "Ngày tạo",
      dataIndex: "created_at",
      key: "created_at",
      render: (date) => dayjs(date).format("DD/MM/YYYY"),
    },
    { title: "Người tạo", dataIndex: "created_by", key: "created_by" },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => <Tag>{status}</Tag>,
    },
    {
      title: "Hành động",
      key: "action",
      render: () => (
        <Space>
          <Button size="small">Xem</Button>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2}>Quản lý Đặt hàng</Title>
        </Col>
        <Col>
          <Space wrap>
            <Button icon={<RobotOutlined />} onClick={handleAutoGenerate}>
              Tạo Dự trù & Lên Đơn hàng Loạt
            </Button>
            <Button type="primary" icon={<PlusOutlined />}>
              {!isMobile && "Tạo Đơn hàng Thủ công"}
            </Button>
          </Space>
        </Col>
      </Row>
      <Row style={{ marginBottom: 16 }} gutter={16}>
        <Col span={12}>
          <Search
            placeholder="Tìm theo Mã ĐH, NCC, tên sản phẩm, SKU, mã vạch..."
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onSearch={(value) => setSearchText(value)}
          />
        </Col>
      </Row>
      <Table
        columns={columns}
        dataSource={filteredData}
        loading={loading}
        rowKey="id"
      />
    </>
  );
};

const PurchaseOrders: React.FC<PurchaseOrdersPageProps> = ({ employee }) => (
  <AntApp>
    <PurchaseOrdersContent employee={employee} />
  </AntApp>
);
export default PurchaseOrders;
