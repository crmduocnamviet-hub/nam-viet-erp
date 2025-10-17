import React, { useState, useMemo } from "react";
import {
  Table,
  Button,
  Select,
  Row,
  Col,
  Tag,
  App,
  Spin,
  Tooltip,
  Modal,
} from "antd";
import { DeleteOutlined, PlusOutlined, ShopOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { deleteProductLot } from "@nam-viet-erp/services";
import AddLotModal from "./AddLotModal";
import WarehouseQuantityModal from "./WarehouseQuantityModal";
import { useSubmitQuery, useFilterProductLot } from "@nam-viet-erp/store";
import { FETCH_SUBMIT_QUERY_KEY } from "@nam-viet-erp/store/src/constants";

interface ProductLotManagementProps {
  productId: number;
  isEnabled: boolean;
  warehouses: IWarehouse[];
}

const ProductLotManagement: React.FC<ProductLotManagementProps> = ({
  productId,
  isEnabled,
  warehouses,
}) => {
  const { notification } = App.useApp();
  const navigate = useNavigate();

  const [isAddLotModalOpen, setIsAddLotModalOpen] = useState(false);
  const [isWarehouseQuantityModalOpen, setIsWarehouseQuantityModalOpen] =
    useState(false);
  const [selectedLot, setSelectedLot] = useState<any>(null);
  const [selectedWarehouseFilter, setSelectedWarehouseFilter] = useState<
    number | "all"
  >("all");
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    data: productLots = [],
    isLoading: isFetching,
    refetch,
  } = useFilterProductLot(productId, selectedWarehouseFilter);

  const isLoading = isFetching || isDeleting;

  if (!isEnabled) {
    return null;
  }

  const aggregatedLots = useMemo(() => {
    if (selectedWarehouseFilter !== "all") {
      return productLots || [];
    }

    const lotMap = new Map<number, IProductLot & { quantity: number }>();

    (productLots || [])?.forEach((lot: IProductLot & { quantity: number }) => {
      // Use lot.id as the unique key for aggregation
      const key = lot.id;
      if (lotMap.has(key)) {
        const existingLot = lotMap.get(key)!;
        existingLot.quantity += lot.quantity;
      } else {
        // Create a new entry in the map
        lotMap.set(key, { ...lot });
      }
    });

    return Array.from(lotMap.values());
  }, [productLots, selectedWarehouseFilter]);

  const isAggregatedView = selectedWarehouseFilter === "all";

  const dataSource = isAggregatedView ? aggregatedLots : productLots || [];

  // Handle case where default lot (id=null) might exist across warehouses
  if (isAggregatedView) {
    // This logic can be expanded if default lots need special aggregation
  }

  const handleDeleteLot = async (record: any) => {
    Modal.confirm({
      title: "Xác nhận xóa lô",
      content: `Bạn có chắc chắn muốn xóa lô "${record.lot_number}"?`,
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: () => {
        setIsDeleting(true);
        deleteLot({
          lotId: record.id,
          productId: productId,
          warehouseId: record.warehouse_id,
        });
      },
    });
  };

  const { submit: deleteLot } = useSubmitQuery({
    key: [FETCH_SUBMIT_QUERY_KEY.DELETE_PRODUCT_LOT, productId, "delete"],
    onSubmit: deleteProductLot,
    onSuccess: async () => {
      notification.success({
        message: "Lô đã được xóa thành công.",
        description: "Số lượng tồn kho đã được cập nhật tự động.",
      });

      // Force refetch to reload table with updated quantities
      await refetch();

      // Add delay to ensure UI updates properly
      setTimeout(() => {
        setIsDeleting(false);
      }, 300);
    },
    onError: (error) => {
      setIsDeleting(false);
      notification.error({
        message: "Lỗi khi xóa lô.",
        description: error?.message,
      });
    },
  });

  const handleAddLotSuccess = async () => {
    // Show loading state immediately
    setIsDeleting(true);

    // Refetch data to show new lot
    await refetch();

    // Close modal after data is fetched
    setIsAddLotModalOpen(false);

    // Delay to ensure UI updates properly
    setTimeout(() => {
      setIsDeleting(false);
    }, 300);
  };

  const handleOpenWarehouseQuantityModal = (record: IProductLot) => {
    setSelectedLot(record);
    setIsWarehouseQuantityModalOpen(true);
  };

  const handleCloseWarehouseQuantityModal = () => {
    setIsWarehouseQuantityModalOpen(false);
    setSelectedLot(null);
  };

  const handleWarehouseQuantitySuccess = async () => {
    // Show loading state while refetching
    setIsDeleting(true);
    await refetch();

    // Delay to ensure UI updates
    setTimeout(() => {
      setIsDeleting(false);
    }, 300);
  };

  const lotTableColumns = useMemo(
    () => [
      {
        title: "Lô sản phẩm",
        dataIndex: "lot_number",
        key: "lot_number",
        width: 150,
        render: (text: string, record: any) => {
          // For default lot (lot_id is null), show as plain text or handle differently
          if (!record.id) {
            return (
              <span style={{ fontWeight: "bold" }}>
                {text || "Lô mặc định"}
              </span>
            );
          }

          return (
            <Button
              type="link"
              onClick={() => navigate(`/lots/${record.id}`)}
              style={{ padding: 0, fontWeight: "bold" }}
              size="large"
            >
              {text}
            </Button>
          );
        },
      },
      {
        title: "Kho",
        dataIndex: "warehouse_name",
        key: "warehouse",
        width: 150,
        render: (text: string) => text || "-",
      },
      {
        title: "Trạng thái",
        dataIndex: "expiry_date",
        key: "status",
        width: 120,
        render: (date: string, record: any) => {
          if (!date) return <Tag color="green">Còn hạn</Tag>;
          const daysLeft = record.days_until_expiry;
          const isExpired = daysLeft <= 0;

          return (
            <Tag color={isExpired ? "red" : "green"}>
              {isExpired ? "Hết hạn" : "Còn hạn"}
            </Tag>
          );
        },
      },
      {
        title: "Ngày sản xuất",
        dataIndex: "received_date",
        key: "received_date",
        width: 130,
        render: (date: string) =>
          date ? dayjs(date).format("DD/MM/YYYY") : "-",
      },
      {
        title: "Hạn sử dụng",
        dataIndex: "expiry_date",
        key: "expiry_date",
        width: 130,
        render: (date: string) =>
          date ? dayjs(date).format("DD/MM/YYYY") : "-",
      },
      {
        title: "Tồn kho",
        dataIndex: "quantity",
        key: "quantity",
        width: 120,
        align: "center" as const,
        render: (qty: number, record: any) => (
          <Tooltip
            title={
              isAggregatedView
                ? "Nhấp để xem chi tiết theo kho"
                : "Nhấp để quản lý số lượng"
            }
          >
            <Button
              type="text"
              size="large"
              icon={isAggregatedView ? <ShopOutlined /> : undefined}
              onClick={() => handleOpenWarehouseQuantityModal(record)}
              style={{
                padding: "0 8px",
                height: "auto",
              }}
            >
              <Tag
                color={qty > 0 ? "green" : "red"}
                style={{ margin: 0, cursor: "pointer" }}
              >
                {qty} {isAggregatedView && "tổng"}
              </Tag>
            </Button>
          </Tooltip>
        ),
      },
      {
        title: "Thao tác",
        key: "action",
        width: 80,
        align: "center" as const,
        render: (_: any, record: any) => {
          // Don't allow deleting default lot (lot_id is null)
          if (!record.id) {
            return (
              <span style={{ color: "#d9d9d9", fontSize: 12 }}>
                Không thể xóa
              </span>
            );
          }

          return (
            <Button
              type="text"
              danger
              size="large"
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteLot(record)}
            />
          );
        },
      },
    ],
    [isAggregatedView, warehouses],
  );

  return (
    <>
      <Row
        style={{ marginBottom: 16 }}
        gutter={16}
        justify="start"
        align="bottom"
      >
        <Col xs={18} sm={15} md={10} lg={6} xl={5}>
          <span style={{ marginRight: 8 }}>Lọc theo kho:</span>
          <Select
            size="large"
            value={selectedWarehouseFilter}
            onChange={async (value) => {
              setSelectedWarehouseFilter(value); // This will trigger the useQuery to refetch
            }}
            style={{ width: "100%" }}
            options={[
              { value: "all", label: "Tất cả kho" },
              ...warehouses.map((wh) => ({
                value: wh.id,
                label: wh.name,
              })),
            ]}
          />
        </Col>
        <Col>
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={() => setIsAddLotModalOpen(true)}
          ></Button>
        </Col>
      </Row>

      <Spin spinning={isLoading} tip="Đang tải..." style={{ marginTop: 16 }}>
        <Table
          dataSource={[...dataSource]}
          pagination={false}
          scroll={{ x: 600 }}
          columns={lotTableColumns}
          rowKey={"id"}
          locale={{
            emptyText: "Chưa có lô hàng nào",
          }}
        />
      </Spin>

      <AddLotModal
        open={isAddLotModalOpen}
        onClose={() => setIsAddLotModalOpen(false)}
        onSuccess={handleAddLotSuccess}
        productId={productId}
        warehouses={warehouses}
      />

      {selectedLot && (
        <WarehouseQuantityModal
          visible={isWarehouseQuantityModalOpen}
          onClose={handleCloseWarehouseQuantityModal}
          lotId={selectedLot.id}
          lotNumber={selectedLot.lot_number || "Lô mặc định"}
          productId={productId}
          warehouses={warehouses}
          warehouseQuantities={
            isAggregatedView
              ? // In aggregated view, get all warehouses for this lot
                (productLots || [])
                  .filter((lot: any) => lot.id === selectedLot.id)
                  .map((lot: any) => ({
                    warehouse_id: lot.warehouse_id,
                    warehouse_name: lot.warehouse_name,
                    quantity: lot.quantity,
                    min_stock: lot.min_stock,
                    max_stock: lot.max_stock,
                  }))
              : // In warehouse-specific view, show only selected warehouse
                [
                  {
                    warehouse_id: selectedLot.warehouse_id,
                    warehouse_name: selectedLot.warehouse_name,
                    quantity: selectedLot.quantity,
                    min_stock: selectedLot.min_stock,
                    max_stock: selectedLot.max_stock,
                  },
                ]
          }
          onSuccess={handleWarehouseQuantitySuccess}
        />
      )}
    </>
  );
};

export default ProductLotManagement;
