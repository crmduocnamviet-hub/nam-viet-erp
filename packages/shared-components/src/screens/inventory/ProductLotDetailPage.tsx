import React, { useEffect, useState } from "react";
import {
  Card,
  Row,
  Col,
  Descriptions,
  Table,
  Tag,
  Spin,
  Typography,
  App,
  Button,
  InputNumber,
  Space,
} from "antd";
import { SaveOutlined, CloseOutlined, HomeOutlined, AppstoreOutlined } from "@ant-design/icons";
import { useParams } from "react-router-dom";
import dayjs from "dayjs";
import { useLotManagementStore } from "@nam-viet-erp/store";
import PageLayout from "../../components/PageLayout";

interface LotInventory {
  lot_id: number;
  warehouse_id: number;
  warehouse_name: string;
  quantity_available: number;
}

interface ProductLotDetail {
  id: number;
  product_id: number;
  product_name: string;
  product_sku: string;
  lot_number: string;
  batch_code: string | null;
  expiry_date: string | null;
  received_date: string | null;
  days_until_expiry: number | null;
  created_at: string;
}

const ProductLotDetailPage: React.FC = () => {
  const { lotId } = useParams<{ lotId: string }>();
  const { notification } = App.useApp();

  // Store
  const {
    updateLotQuantity,
    fetchLotDetailWithInventory,
  } = useLotManagementStore();

  const [loading, setLoading] = useState(true);
  const [lotDetail, setLotDetail] = useState<ProductLotDetail | null>(null);
  const [lotInventory, setLotInventory] = useState<LotInventory[]>([]);
  const [editingKey, setEditingKey] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (lotId) {
      fetchLotDetails();
    }
  }, [lotId]);

  const handleEdit = (record: LotInventory) => {
    setEditingKey(record.lot_id);
    setEditingValue(record.quantity_available);
  };

  const handleCancel = () => {
    setEditingKey(null);
    setEditingValue(0);
  };

  const handleSave = async (record: LotInventory) => {
    if (!lotDetail) return;

    setSaving(true);
    try {
      // Update inventory quantity using store
      const { error } = await updateLotQuantity({
        lotId: record.lot_id,
        productId: lotDetail.product_id,
        warehouseId: record.warehouse_id,
        newQuantityAvailable: editingValue,
      });

      if (error) throw error;

      // Refresh data first
      await fetchLotDetails();

      // Then show success notification and exit edit mode
      notification.success({
        message: "Cập nhật thành công!",
        description: `Đã cập nhật lô hàng tại ${record.warehouse_name}`,
      });

      setEditingKey(null);
    } catch (error: any) {
      notification.error({
        message: "Lỗi cập nhật",
        description: error.message || "Không thể cập nhật lô hàng.",
      });
    } finally {
      setSaving(false);
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
      const { lotDetail: lotData, inventory, error } = await fetchLotDetailWithInventory(parseInt(lotId));

      if (error) throw error;

      if (!lotData) {
        throw new Error("Không tìm thấy thông tin lô hàng");
      }

      // Calculate days until expiry
      const daysUntilExpiry = lotData.expiry_date
        ? dayjs(lotData.expiry_date).diff(dayjs(), "day")
        : null;

      setLotDetail({
        id: lotData.id,
        product_id: lotData.product_id,
        product_name: (lotData.products as any)?.name || "",
        product_sku: (lotData.products as any)?.sku || "",
        lot_number: lotData.lot_number,
        batch_code: lotData.batch_code,
        expiry_date: lotData.expiry_date,
        received_date: lotData.received_date,
        days_until_expiry: daysUntilExpiry,
        created_at: lotData.created_at,
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

  // Calculate status
  const getStatus = () => {
    if (!lotDetail.expiry_date) {
      return { text: "Còn hạn", color: "green" };
    }
    const isExpired = lotDetail.days_until_expiry !== null && lotDetail.days_until_expiry <= 0;
    return {
      text: isExpired ? "Hết hạn" : "Còn hạn",
      color: isExpired ? "red" : "green",
    };
  };

  const status = getStatus();

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
          title: lotDetail.product_name,
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
          <Card title="Thông tin Lô hàng">
            <Descriptions bordered column={1}>
              <Descriptions.Item label="Số lô">
                <strong>{lotDetail.lot_number}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="Sản phẩm">
                {lotDetail.product_name}
                <br />
                <Tag>{lotDetail.product_sku}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Mã lô">
                {lotDetail.batch_code || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color={status.color}>{status.text}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Ngày nhận">
                {lotDetail.received_date
                  ? dayjs(lotDetail.received_date).format("DD/MM/YYYY")
                  : "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Hạn sử dụng">
                {lotDetail.expiry_date
                  ? dayjs(lotDetail.expiry_date).format("DD/MM/YYYY")
                  : "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Còn lại">
                {lotDetail.days_until_expiry !== null
                  ? `${lotDetail.days_until_expiry} ngày`
                  : "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày tạo">
                {dayjs(lotDetail.created_at).format("DD/MM/YYYY HH:mm")}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        {/* Inventory by Warehouse Table */}
        <Col xs={24} lg={12}>
          <Card title="Tồn kho">
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
                  dataIndex: "quantity_available",
                  key: "quantity_available",
                  align: "right",
                  render: (qty, record) => {
                    const isEditing = editingKey === record.lot_id;

                    if (isEditing) {
                      return (
                        <Space>
                          <InputNumber
                            value={editingValue}
                            onChange={(value) => setEditingValue(value || 0)}
                            min={0}
                            style={{ width: 100 }}
                            autoFocus
                            onPressEnter={() => handleSave(record)}
                          />
                          <Button
                            type="primary"
                            size="small"
                            icon={<SaveOutlined />}
                            onClick={() => handleSave(record)}
                            loading={saving}
                          />
                          <Button
                            size="small"
                            icon={<CloseOutlined />}
                            onClick={handleCancel}
                            disabled={saving}
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
