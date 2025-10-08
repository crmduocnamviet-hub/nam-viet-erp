import React, { useState, useEffect } from "react";
import { Table, Button, Select, Row, Col, Tag, App, Spin } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { getProductLots, deleteProductLot } from "@nam-viet-erp/services";
import AddLotModal from "./AddLotModal";

interface ProductLotManagementProps {
  productId: number;
  isEnabled: boolean;
  warehouses: any[];
}

const ProductLotManagement: React.FC<ProductLotManagementProps> = ({
  productId,
  isEnabled,
  warehouses,
}) => {
  const { notification } = App.useApp();
  const navigate = useNavigate();

  const [productLots, setProductLots] = useState<IProductLot[]>([]);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [isAddLotModalOpen, setIsAddLotModalOpen] = useState(false);
  const [selectedWarehouseFilter, setSelectedWarehouseFilter] = useState<
    number | "all"
  >("all");

  const fetchProductLots = async (warehouseFilter?: number | "all") => {
    if (!productId || !isEnabled) {
      setProductLots([]);
      return;
    }
    setIsFetching(true);
    try {
      const filter = warehouseFilter ?? selectedWarehouseFilter;
      const { data, error } = await getProductLots({
        productId: productId,
        warehouseId: filter === "all" ? undefined : filter,
      });

      if (error) {
        console.error("Error fetching product lots:", error);
        notification.error({
          message: "Lỗi tải danh sách lô",
          description: error.message,
        });
      } else {
        console.log("Fetched product lots:", data);
        setProductLots(data || []);
      }
    } catch (error: any) {
      console.error("Error:", error);
      setProductLots([]);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchProductLots();
  }, [productId, isEnabled]);

  if (!isEnabled) {
    return null;
  }

  const handleDeleteLot = async (record: any) => {
    if (!productId) return;

    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn xóa lô "${record.lot_number}"?`
    );

    if (!confirmed) return;

    try {
      const { error } = await deleteProductLot({
        lotId: record.id,
        productId: productId,
        warehouseId: record.warehouse_id,
      });

      if (error) throw error;

      notification.success({
        message: "Đã xóa!",
        description: `Lô "${record.lot_number}" đã được xóa thành công.`,
      });

      // Refresh lots
      await fetchProductLots();
    } catch (error: any) {
      notification.error({
        message: "Lỗi xóa lô",
        description: error.message || "Không thể xóa lô hàng.",
      });
    }
  };

  const lotTableColumns = React.useMemo(
    () => [
      {
        title: "Lô sản phẩm",
        dataIndex: "lot_number",
        key: "lot_number",
        width: 150,
        render: (text: string, record: any) => (
          <Button
            type="link"
            onClick={() => {
              if (record.id) {
                navigate(`/lots/${record.id}`);
              } else {
                notification.error({
                  message: "Lỗi",
                  description: "Không tìm thấy ID lô hàng",
                });
              }
            }}
            style={{ padding: 0, fontWeight: "bold" }}
          >
            {text}
          </Button>
        ),
      },
      {
        title: "Kho",
        dataIndex: "warehouse_id",
        key: "warehouse",
        width: 150,
        render: (warehouseId: number) => {
          const warehouse = warehouses.find((wh) => wh.id === warehouseId);
          return warehouse?.name || "-";
        },
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
        dataIndex: "manufacturing_date",
        key: "manufacturing_date",
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
        width: 100,
        align: "right" as const,
        render: (qty: number) => (
          <Tag color={qty > 0 ? "green" : "red"}>{qty}</Tag>
        ),
      },
      {
        title: "Thao tác",
        key: "action",
        width: 80,
        align: "center" as const,
        render: (_: any, record: any) => (
          <Button
            type="text"
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteLot(record)}
          />
        ),
      },
    ],
    []
  );

  return (
    <>
      <Row style={{ marginBottom: 16 }} justify="space-between" align="middle">
        <Col>
          <span style={{ marginRight: 8 }}>Lọc theo kho:</span>
          <Select
            value={selectedWarehouseFilter}
            onChange={async (value) => {
              setSelectedWarehouseFilter(value);
              await fetchProductLots(value);
            }}
            style={{ width: 200 }}
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
            size="small"
            onClick={() => setIsAddLotModalOpen(true)}
          >
            Thêm lô hàng mới
          </Button>
        </Col>
      </Row>

      <Spin spinning={isFetching} style={{ marginTop: 16 }}>
        {productLots.length > 0 && !isFetching && (
          <Table
            dataSource={productLots.concat()}
            rowKey="id"
            pagination={false}
            scroll={{ x: 600 }}
            columns={lotTableColumns}
          />
        )}
      </Spin>

      <AddLotModal
        open={isAddLotModalOpen}
        onClose={() => setIsAddLotModalOpen(false)}
        onSuccess={fetchProductLots}
        productId={productId}
        warehouses={warehouses}
      />
    </>
  );
};

export default ProductLotManagement;
