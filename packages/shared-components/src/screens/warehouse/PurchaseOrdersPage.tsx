import React, { useState, useEffect, useMemo } from "react";
import {
  Button,
  Card,
  Row,
  Col,
  Statistic,
  Input,
  Select,
  DatePicker,
  Space,
  notification,
  Tooltip,
} from "antd";
import {
  SearchOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ClearOutlined,
} from "@ant-design/icons";
import PageLayout from "../../components/PageLayout";
import AutoGeneratePOModal from "../../components/AutoGeneratePOModal";
import EditPurchaseOrderModal from "../../components/EditPurchaseOrderModal";
import ViewPurchaseOrderModal from "../../components/ViewPurchaseOrderModal";
import PurchaseOrdersTable from "../../components/PurchaseOrdersTable";
import {
  analyzeProductsNeedingReorder,
  getPurchaseOrders,
  cancelPurchaseOrder,
  deletePurchaseOrder,
  createPurchaseOrdersFromProducts,
  updatePurchaseOrderStatus,
} from "@nam-viet-erp/services";
import { getSuppliers } from "@nam-viet-erp/services/src/supplierService";
import { useAuthStore } from "@nam-viet-erp/store";
import { useEmployeeStore } from "@nam-viet-erp/store";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;

const PurchaseOrdersPage: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const hasPermission = useEmployeeStore((state) => state.hasPermission);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(
    null,
  );
  const [autoGenModalOpen, setAutoGenModalOpen] = useState(false);
  const [autoGenLoading, setAutoGenLoading] = useState(false);
  const [suggestedProducts, setSuggestedProducts] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [inventoryAnalytics, setInventoryAnalytics] = useState<any>(null);

  // Fetch inventory analytics
  const fetchInventoryAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const warehouseId = 1; // TODO: Get actual warehouseId
      const result = await analyzeProductsNeedingReorder(warehouseId);
      setInventoryAnalytics(result);
    } catch (error: any) {
      console.error("Error fetching analytics:", error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // Fetch suppliers
  const fetchSuppliers = async () => {
    try {
      const { data, error } = await getSuppliers();

      if (error) {
        throw error;
      }

      setSuppliers(data || []);
    } catch (error: any) {
      notification.error({
        message: "Lỗi",
        description: error.message || "Không thể tải danh sách nhà cung cấp",
      });
    }
  };

  // Fetch purchase orders
  const fetchPurchaseOrders = async () => {
    setLoading(true);
    try {
      const filters: any = {};

      if (statusFilter && statusFilter !== "all") {
        filters.status = statusFilter;
      }

      if (dateRange && dateRange[0] && dateRange[1]) {
        filters.startDate = dateRange[0].format("YYYY-MM-DD");
        filters.endDate = dateRange[1].format("YYYY-MM-DD");
      }

      const { data, error } = await getPurchaseOrders(filters);

      if (error) {
        throw error;
      }

      setPurchaseOrders(data || []);
    } catch (error: any) {
      notification.error({
        message: "Lỗi",
        description: error.message || "Không thể tải danh sách đơn hàng",
      });
    } finally {
      setLoading(false);
    }
  };

  // Load suppliers and analytics on mount
  useEffect(() => {
    fetchSuppliers();
    fetchInventoryAnalytics();
  }, []);

  // Load data on mount and when filters change
  useEffect(() => {
    fetchPurchaseOrders();
  }, [statusFilter, dateRange]);

  const handleClearFilters = () => {
    setSearchText("");
    setStatusFilter("all");
    setDateRange(null);
  };

  // Filter by search text (client-side)
  const filteredData = useMemo(() => {
    if (!searchText) return purchaseOrders;

    const lowerSearch = searchText.toLowerCase();
    return purchaseOrders.filter(
      (po) =>
        po.po_number?.toLowerCase().includes(lowerSearch) ||
        po.supplier?.name?.toLowerCase().includes(lowerSearch),
    );
  }, [purchaseOrders, searchText]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const total = purchaseOrders.length;
    const draft = purchaseOrders.filter((po) => po.status === "draft").length;
    const ordered = purchaseOrders.filter(
      (po) => po.status === "ordered" || po.status === "sent",
    ).length;
    const partial = purchaseOrders.filter(
      (po) => po.status === "partially_received",
    ).length;
    const completed = purchaseOrders.filter(
      (po) => po.status === "received",
    ).length;

    return { total, draft, ordered, partial, completed };
  }, [purchaseOrders]);

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!inventoryAnalytics?.productsToOrder) {
      return {
        supplierData: { categories: [], series: [] },
        statusData: { labels: [], series: [] },
      };
    }

    // Group products by supplier
    const productsBySupplier: Record<string, number> = {};
    inventoryAnalytics.productsToOrder.forEach((product: any) => {
      const supplier = product.supplier_name || "Unknown";
      productsBySupplier[supplier] = (productsBySupplier[supplier] || 0) + 1;
    });

    // Sort by quantity
    const sortedSuppliers = Object.entries(productsBySupplier)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10); // Top 10 suppliers

    const supplierData = {
      categories: sortedSuppliers.map(([name]) => name),
      series: [
        {
          name: "Số sản phẩm cần đặt",
          data: sortedSuppliers.map(([, count]) => count),
        },
      ],
    };

    // Status distribution
    const statusData = {
      labels: ["Cần đặt hàng", "Tồn kho ổn định"],
      series: [
        inventoryAnalytics.productsToOrder.length,
        inventoryAnalytics.totalProducts -
          inventoryAnalytics.productsToOrder.length,
      ],
    };

    return { supplierData, statusData };
  }, [inventoryAnalytics]);

  const handleOpenAutoGenerate = async () => {
    setAutoGenModalOpen(true);
    setAutoGenLoading(true);
    setSuggestedProducts([]);

    try {
      // TODO: Get actual warehouseId from context/props
      const warehouseId = 1; // Replace with actual warehouse selection

      const result = await analyzeProductsNeedingReorder(warehouseId);

      if (result.productsToOrder && result.productsToOrder.length > 0) {
        setSuggestedProducts(result.productsToOrder);
      }
    } catch (error: any) {
      notification.error({
        message: "Lỗi",
        description: error.message || "Không thể phân tích tồn kho",
      });
      setAutoGenModalOpen(false);
    } finally {
      setAutoGenLoading(false);
    }
  };

  const handleConfirmAutoGenerate = async (editedProducts: any[]) => {
    try {
      // TODO: Get actual warehouseId from context/props
      const warehouseId = 1; // Replace with actual warehouse selection

      // Create purchase orders from edited products
      const result = await createPurchaseOrdersFromProducts(
        editedProducts,
        warehouseId,
        user?.id || null,
      );

      notification.success({
        message: "Thành công",
        description:
          result.message ||
          `Đã tạo đơn đặt hàng tự động cho ${editedProducts.length} sản phẩm`,
        duration: 5,
      });

      setAutoGenModalOpen(false);
      setSuggestedProducts([]);

      // Refresh purchase orders list
      fetchPurchaseOrders();
    } catch (error: any) {
      notification.error({
        message: "Lỗi",
        description: error.message || "Không thể tạo đơn đặt hàng",
      });
    }
  };

  const handleView = (record: any) => {
    setSelectedPO(record);
    setViewModalOpen(true);
  };

  const handleEdit = (record: any) => {
    setSelectedPO(record);
    setEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    fetchPurchaseOrders();
  };

  const handleCancel = async (record: any) => {
    try {
      const { error } = await cancelPurchaseOrder(record.id);

      if (error) {
        throw error;
      }

      notification.success({
        message: "Thành công",
        description: `Đã hủy đơn đặt hàng ${record.po_number}`,
      });

      fetchPurchaseOrders();
    } catch (error: any) {
      notification.error({
        message: "Lỗi",
        description: error.message || "Không thể hủy đơn đặt hàng",
      });
    }
  };

  const handleDelete = async (record: any) => {
    try {
      await deletePurchaseOrder(record.id);

      notification.success({
        message: "Thành công",
        description: `Đã xóa đơn đặt hàng ${record.po_number}`,
      });

      fetchPurchaseOrders();
    } catch (error: any) {
      notification.error({
        message: "Lỗi",
        description: error.message || "Không thể xóa đơn đặt hàng",
      });
    }
  };

  const handleStatusChange = async (record: any, status: string) => {
    try {
      const { error } = await updatePurchaseOrderStatus(
        record.id,
        status as any,
      );

      if (error) {
        throw error;
      }

      notification.success({
        message: "Thành công",
        description: `Đã cập nhật trạng thái đơn hàng ${record.po_number}`,
      });

      fetchPurchaseOrders();
    } catch (error: any) {
      notification.error({
        message: "Lỗi",
        description: error.message || "Không thể cập nhật trạng thái",
      });
    }
  };

  const canAutoCreate = hasPermission("warehouse.purchase-orders.auto-create");

  return (
    <PageLayout
      title="Đơn Đặt Hàng"
      extra={
        <Space>
          {canAutoCreate && (
            <Button
              type="primary"
              icon={<SyncOutlined />}
              onClick={handleOpenAutoGenerate}
              size="large"
            >
              Tạo Dự Trù Tự Động
            </Button>
          )}
        </Space>
      }
    >
      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng Đơn Hàng"
              value={statistics.total}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Đang Chờ"
              value={statistics.ordered}
              valueStyle={{ color: "#1890ff" }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Nhận Một Phần"
              value={statistics.partial}
              valueStyle={{ color: "#faad14" }}
              prefix={<SyncOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Hoàn Thành"
              value={statistics.completed}
              valueStyle={{ color: "#52c41a" }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: 16, borderWidth: 0 }}>
        <Space wrap>
          <Input
            placeholder="Tìm kiếm theo số đơn, nhà cung cấp..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
            size="large"
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 150 }}
            size="large"
          >
            <Select.Option value="all">Tất cả</Select.Option>
            <Select.Option value="draft">Nháp</Select.Option>
            <Select.Option value="sent">Đã gửi</Select.Option>
            <Select.Option value="ordered">Đã đặt hàng</Select.Option>
            <Select.Option value="partially_received">
              Nhận một phần
            </Select.Option>
            <Select.Option value="received">Hoàn thành</Select.Option>
            <Select.Option value="cancelled">Đã hủy</Select.Option>
          </Select>
          <RangePicker
            placeholder={["Từ ngày", "Đến ngày"]}
            value={dateRange}
            onChange={(dates) => setDateRange(dates as any)}
            size="large"
          />
          <Tooltip title="Xóa bộ lọc">
            <Button
              icon={<ClearOutlined />}
              onClick={handleClearFilters}
              size="large"
            />
          </Tooltip>
        </Space>
      </Card>

      {/* Table */}
      <Card style={{ borderWidth: 0 }}>
        <PurchaseOrdersTable
          data={filteredData}
          loading={loading}
          onView={handleView}
          onEdit={handleEdit}
          onCancel={handleCancel}
          onDelete={handleDelete}
          onStatusChange={handleStatusChange}
          hasPermission={hasPermission}
        />
      </Card>

      {/* Auto Generate PO Modal */}
      <AutoGeneratePOModal
        open={autoGenModalOpen}
        onClose={() => {
          setAutoGenModalOpen(false);
          setSuggestedProducts([]);
        }}
        onConfirm={handleConfirmAutoGenerate}
        loading={autoGenLoading}
        products={suggestedProducts}
        warehouseName="Kho Chính" // TODO: Replace with actual warehouse name
      />

      {/* View Purchase Order Modal */}
      <ViewPurchaseOrderModal
        open={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedPO(null);
        }}
        purchaseOrder={selectedPO}
      />

      {/* Edit Purchase Order Modal */}
      <EditPurchaseOrderModal
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedPO(null);
        }}
        onSuccess={handleEditSuccess}
        purchaseOrder={selectedPO}
        suppliers={suppliers}
      />
    </PageLayout>
  );
};

export default PurchaseOrdersPage;
