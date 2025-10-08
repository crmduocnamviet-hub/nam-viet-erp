import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  Row,
  Col,
  Table,
  Tag,
  Spin,
  Typography,
  App,
  InputNumber,
  Space,
} from "antd";
import { HomeOutlined, AppstoreOutlined } from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { useLotManagementStore } from "@nam-viet-erp/store";
import PageLayout from "../../components/PageLayout";
import { updateProductLot } from "@nam-viet-erp/services";
import ProductLotDetailForm from "../../components/ProductLotDetailForm";

const ProductLotDetailPage: React.FC = () => {
  const { lotId } = useParams<{ lotId: string }>();
  const { notification } = App.useApp();

  // Store
  const { updateLotQuantity, fetchLotDetailWithInventory } =
    useLotManagementStore();

  const [loading, setLoading] = useState(true);
  const [lotDetail, setLotDetail] = useState<IProductLot | null>(null);
  const [lotInventory, setLotInventory] = useState<IInventory[]>([]);
  const [editingKey, setEditingKey] = useState<number | null>(null);
  const [quantity, setQuantityValue] = useState<number>(0);

  // Calculate days until expiry
  const daysUntilExpiry = useMemo(
    () =>
      lotDetail?.expiry_date
        ? dayjs(lotDetail.expiry_date).diff(dayjs(), "day")
        : null,
    [lotDetail]
  );

  useEffect(() => {
    if (lotId) {
      fetchLotDetails();
    }
  }, [lotId]);

  const handleEdit = (record: IInventory) => {
    setEditingKey(record.lot_id);
    setQuantityValue(record.quantity || 0);
  };

  const handleSave = async (record: IInventory) => {
    if (!lotDetail) return;

    try {
      // Update inventory quantity using store
      const { error } = await updateLotQuantity({
        lotId: record.lot_id,
        productId: lotDetail.product_id,
        warehouseId: record.warehouse_id,
        newQuantityAvailable: quantity,
      });

      if (error) throw error;

      // Refresh data first
      await fetchLotDetails();

      // Then show success notification and exit edit mode
      // notification.success({
      //   message: "Cập nhật thành công!",
      //   description: `Đã cập nhật lô hàng tại ${record.warehouse_name}`,
      // });

      setEditingKey(null);
    } catch (error: any) {
      notification.error({
        message: "Lỗi cập nhật",
        description: error.message || "Không thể cập nhật lô hàng.",
      });
    } finally {
    }
  };

  const fetchLotDetails = async () => {
    if (!lotId) {
      notification.error({
        message: "Lỗi",
        description: "Không tìm thấy ID lô hàng.",
      });
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Fetch lot details and inventory using store
      const {
        lotDetail: lotData,
        inventory,
        error,
      } = await fetchLotDetailWithInventory(parseInt(lotId));

      if (error) throw error;

      if (!lotData) {
        throw new Error("Không tìm thấy thông tin lô hàng");
      }

      setLotDetail({
        ...lotData,
        lot_number: lotData.lot_number,
        batch_code: lotData.batch_code,
        expiry_date: lotData.expiry_date,
        received_date: lotData.received_date,
      });

      setLotInventory(inventory);
    } catch (error: any) {
      notification.error({
        message: "Lỗi tải dữ liệu",
        description: error.message || "Không thể tải thông tin lô hàng.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!lotDetail) {
    return (
      <PageLayout title="Chi tiết Lô hàng" showBackButton>
        <div style={{ textAlign: "center", padding: "50px" }}>
          <Typography.Title level={4}>
            Không tìm thấy thông tin lô hàng
          </Typography.Title>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title={`Chi tiết Lô hàng: ${lotDetail.lot_number}`}
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
          title: lotDetail.products?.name,
          href: `/products/edit/${lotDetail.product_id}`,
        },
        {
          title: `Lô: ${lotDetail.lot_number}`,
        },
      ]}
    >
      <Row gutter={[16, 16]}>
        {/* Lot Information Card */}
        <Col xs={24} lg={12}>
          {!!lotDetail && <ProductLotDetailForm lot={lotDetail} />}
        </Col>
        {/* Inventory by Warehouse Table */}
        <Col xs={24} lg={12}>
          <Card title="Thông tin kho lưu trữ">
            <Table
              dataSource={lotInventory}
              rowKey="lot_id"
              pagination={false}
              columns={[
                {
                  title: "Kho",
                  dataIndex: "warehouse_name",
                  key: "warehouse_name",
                  render: (text) => <strong>{text}</strong>,
                },
                {
                  title: "Tồn kho",
                  dataIndex: "quantity",
                  key: "quantity",
                  align: "right",
                  render: (qty, record) => {
                    const isEditing = editingKey === record.lot_id;

                    if (isEditing) {
                      return (
                        <Space>
                          <InputNumber
                            value={quantity}
                            onChange={(value) => setQuantityValue(value || 0)}
                            min={0}
                            style={{ width: 100 }}
                            autoFocus
                            onPressEnter={() => handleSave(record)}
                          />
                        </Space>
                      );
                    }

                    return (
                      <Tag
                        color={qty > 0 ? "green" : "red"}
                        style={{ cursor: "pointer" }}
                        onClick={() => handleEdit(record)}
                      >
                        {qty}
                      </Tag>
                    );
                  },
                },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </PageLayout>
  );
};

export default ProductLotDetailPage;
