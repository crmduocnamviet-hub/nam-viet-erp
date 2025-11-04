import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
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
  PlusCircleOutlined,
  HomeOutlined,
  ShoppingOutlined,
} from "@ant-design/icons";
import PageLayout from "../../components/PageLayout";
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
import { useAuthStore } from "@nam-viet-erp/store";
import { useEmployeeStore } from "@nam-viet-erp/store";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;

const PurchaseOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const hasPermission = useEmployeeStore((state) => state.hasPermission);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(
    null,
  );
  const [autoGenLoading, setAutoGenLoading] = useState(false);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<any>(null);

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

  // Load data on mount and when filters change
  useEffect(() => {
    fetchPurchaseOrders();
  }, [statusFilter, dateRange]);

  const handleClearFilters = () => {
    setSearchText("");
    setStatusFilter("all");
    setDateRange(null);
  };

  // Filter by search text (client-side) - includes product name search
  const filteredData = useMemo(() => {
    if (!searchText) return purchaseOrders;

    const lowerSearch = searchText.toLowerCase();
    return purchaseOrders.filter((po) => {
      // Search by PO number
      if (po.po_number?.toLowerCase().includes(lowerSearch)) return true;

      // Search by supplier name
      if (po.supplier?.name?.toLowerCase().includes(lowerSearch)) return true;

      // Search by product name in order items
      if (po.items && Array.isArray(po.items)) {
        const hasMatchingProduct = po.items.some((item: any) => {
          const productName = item.product?.name?.toLowerCase() || "";
          const productSku = item.product?.sku?.toLowerCase() || "";
          const productBarcode = item.product?.barcode?.toLowerCase() || "";
          return (
            productName.includes(lowerSearch) ||
            productSku.includes(lowerSearch) ||
            productBarcode.includes(lowerSearch)
          );
        });
        if (hasMatchingProduct) return true;
      }

      return false;
    });
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

  const handleAutoGenerate = async () => {
    setAutoGenLoading(true);

    try {
      // TODO: Get actual warehouseId from context/props
      const warehouseId = 1; // Replace with actual warehouse selection

      const result = await analyzeProductsNeedingReorder(warehouseId);

      if (result.productsToOrder && result.productsToOrder.length > 0) {
        // Directly create purchase orders without modal confirmation
        const createResult = await createPurchaseOrdersFromProducts(
          result.productsToOrder,
          warehouseId,
          user?.id || null,
        );

        notification.success({
          message: "Thành công",
          description:
            createResult.message ||
            `Đã tạo đơn đặt hàng tự động cho ${result.productsToOrder.length} sản phẩm`,
          duration: 5,
        });

        // Refresh purchase orders list
        fetchPurchaseOrders();
      } else {
        notification.info({
          message: "Thông báo",
          description: "Không có sản phẩm nào cần đặt hàng",
        });
      }
    } catch (error: any) {
      notification.error({
        message: "Lỗi",
        description: error.message || "Không thể tạo đơn đặt hàng tự động",
      });
    } finally {
      setAutoGenLoading(false);
    }
  };

  const handleView = (record: any) => {
    // Navigate to receiving page for ordered status
    if (record.status === "ordered") {
      navigate(`/warehouse/receiving/${record.id}`);
    } else {
      // Show view modal for other statuses
      setSelectedPO(record);
      setViewModalOpen(true);
    }
  };

  const handleEdit = (record: any) => {
    // Navigate to edit page for draft orders
    if (record.status === "draft") {
      navigate(`/warehouse/purchase-orders/${record.id}/edit`);
    } else {
      // Show view modal for non-draft orders
      handleView(record);
    }
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
      breadcrumbs={[
        {
          title: "Trang chủ",
          href: "/",
          icon: <HomeOutlined />,
        },
        {
          title: "Đơn Đặt Hàng",
          icon: <ShoppingOutlined />,
        },
      ]}
      extra={
        <Space>
          {canAutoCreate && (
            <Button
              type="primary"
              icon={<SyncOutlined />}
              onClick={handleAutoGenerate}
              loading={autoGenLoading}
              size="large"
            >
              Dự Trù Tự Động
            </Button>
          )}
          {canAutoCreate && (
            <Button
              type="primary"
              icon={<PlusCircleOutlined />}
              onClick={() => navigate("/warehouse/receiving/create")}
              size="large"
            >
              Tạo đơn hàng
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

      {/* View Purchase Order Modal */}
      <ViewPurchaseOrderModal
        open={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedPO(null);
        }}
        purchaseOrder={selectedPO}
      />
    </PageLayout>
  );
};

export default PurchaseOrdersPage;
