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
import { ArrowLeftOutlined, SaveOutlined, CloseOutlined } from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { supabase } from "@nam-viet-erp/services";

const { Title } = Typography;

interface LotInventory {
  lot_id: number;
  warehouse_id: number;
  warehouse_name: string;
  quantity_received: number;
  quantity_available: number;
  quantity_reserved: number;
  quantity_sold: number;
  shelf_location: string | null;
}

interface ProductLotDetail {
  id: number;
  product_id: number;
  product_name: string;
  product_sku: string;
  lot_number: string;
  expiry_date: string | null;
  manufacturing_date: string | null;
  days_until_expiry: number | null;
  final_unit_cost: number;
  has_vat_invoice: boolean;
  unit_price_before_vat: number;
  unit_price_with_vat: number;
  created_at: string;
}

const ProductLotDetailPage: React.FC = () => {
  const { lotId } = useParams<{ lotId: string }>();
  const navigate = useNavigate();
  const { notification } = App.useApp();

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
      const oldQuantity = record.quantity_available;
      const newQuantity = editingValue;
      const difference = newQuantity - oldQuantity;

      // Update product_lots table - update both quantity_available and quantity_received
      const newQuantityReceived = record.quantity_received + difference;

      const { error: lotError } = await supabase
        .from("product_lots")
        .update({
          quantity_available: newQuantity,
          quantity_received: newQuantityReceived
        })
        .eq("id", record.lot_id);

      if (lotError) throw lotError;

      // Update inventory table - fetch current quantity first, then update
      const { data: currentInventory, error: fetchError } = await supabase
        .from("inventory")
        .select("quantity")
        .eq("product_id", lotDetail.product_id)
        .eq("warehouse_id", record.warehouse_id)
        .single();

      if (fetchError) throw fetchError;

      const newInventoryQuantity = (currentInventory?.quantity || 0) + difference;

      const { error: inventoryError } = await supabase
        .from("inventory")
        .update({ quantity: newInventoryQuantity })
        .eq("product_id", lotDetail.product_id)
        .eq("warehouse_id", record.warehouse_id);

      if (inventoryError) throw inventoryError;

      // Refresh data first
      await fetchLotDetails();

      // Then show success notification and exit edit mode
      notification.success({
        message: "Cập nhật thành công!",
        description: `Đã cập nhật tồn kho tại ${record.warehouse_name}`,
      });

      setEditingKey(null);
    } catch (error: any) {
      notification.error({
        message: "Lỗi cập nhật",
        description: error.message || "Không thể cập nhật tồn kho.",
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
      // Fetch lot basic information with product details
      const { data: lotData, error: lotError } = await supabase
        .from("product_lots")
        .select(
          `
          *,
          products (
            name,
            sku
          )
        `
        )
        .eq("id", parseInt(lotId))
        .single();

      if (lotError) throw lotError;

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
        expiry_date: lotData.expiry_date,
        manufacturing_date: lotData.manufacturing_date,
        days_until_expiry: daysUntilExpiry,
        final_unit_cost: lotData.final_unit_cost,
        has_vat_invoice: lotData.has_vat_invoice,
        unit_price_before_vat: lotData.unit_price_before_vat,
        unit_price_with_vat: lotData.unit_price_with_vat,
        created_at: lotData.created_at,
      });

      // Fetch inventory across all warehouses for this lot
      const { data: inventoryData, error: inventoryError } = await supabase
        .from("product_lots")
        .select(
          `
          id,
          warehouse_id,
          quantity_received,
          quantity_available,
          quantity_reserved,
          quantity_sold,
          shelf_location,
          warehouses (
            name
          )
        `
        )
        .eq("product_id", lotData.product_id)
        .eq("lot_number", lotData.lot_number);

      if (inventoryError) throw inventoryError;

      const formattedInventory: LotInventory[] = inventoryData.map(
        (item: any) => ({
          lot_id: item.id,
          warehouse_id: item.warehouse_id,
          warehouse_name: item.warehouses?.name || "",
          quantity_received: item.quantity_received,
          quantity_available: item.quantity_available,
          quantity_reserved: item.quantity_reserved,
          quantity_sold: item.quantity_sold,
          shelf_location: item.shelf_location,
        })
      );

      setLotInventory(formattedInventory);
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
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Title level={4}>Không tìm thấy thông tin lô hàng</Title>
        <Button onClick={() => navigate(-1)}>Quay lại</Button>
      </div>
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
    <div style={{ padding: "24px" }}>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate(-1)}
        style={{ marginBottom: 16 }}
      >
        Quay lại
      </Button>

      <Title level={2}>Chi tiết Lô hàng: {lotDetail.lot_number}</Title>

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
              <Descriptions.Item label="Trạng thái">
                <Tag color={status.color}>{status.text}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Ngày sản xuất">
                {lotDetail.manufacturing_date
                  ? dayjs(lotDetail.manufacturing_date).format("DD/MM/YYYY")
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
              <Descriptions.Item label="Giá vốn">
                {lotDetail.final_unit_cost.toLocaleString()} đ
              </Descriptions.Item>
              <Descriptions.Item label="Hóa đơn VAT">
                {lotDetail.has_vat_invoice ? (
                  <Tag color="blue">Có VAT</Tag>
                ) : (
                  <Tag>Không VAT</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Giá trước VAT">
                {lotDetail.unit_price_before_vat.toLocaleString()} đ
              </Descriptions.Item>
              <Descriptions.Item label="Ngày tạo">
                {dayjs(lotDetail.created_at).format("DD/MM/YYYY HH:mm")}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        {/* Inventory by Warehouse Table */}
        <Col xs={24} lg={12}>
          <Card title="Tồn kho theo Kho">
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
                  title: "Nhập về",
                  dataIndex: "quantity_received",
                  key: "quantity_received",
                  align: "right",
                },
                {
                  title: "Còn lại",
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
    </div>
  );
};

export default ProductLotDetailPage;
