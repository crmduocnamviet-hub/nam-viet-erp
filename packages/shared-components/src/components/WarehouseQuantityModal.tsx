import React, { useState } from "react";
import {
  Modal,
  Table,
  Button,
  Space,
  Tag,
  Typography,
  InputNumber,
  App,
  Select,
  Row,
  Col,
} from "antd";
import { ShopOutlined, SaveOutlined, PlusOutlined } from "@ant-design/icons";
import { useUpdateQuantityByLot } from "@nam-viet-erp/store";

const { Text } = Typography;

interface WarehouseQuantity {
  warehouse_id: number;
  warehouse_name: string;
  quantity: number;
  min_stock?: number;
  max_stock?: number;
}

interface WarehouseQuantityModalProps {
  visible: boolean;
  onClose: () => void;
  lotId: number | null;
  lotNumber: string;
  productId: number;
  warehouseQuantities: WarehouseQuantity[];
  warehouses?: Array<{ id: number; name: string }>;
  onSuccess?: () => void;
}

const WarehouseQuantityModal: React.FC<WarehouseQuantityModalProps> = ({
  visible,
  onClose,
  lotId,
  lotNumber,
  productId,
  warehouseQuantities,
  onSuccess,
}) => {
  const { notification } = App.useApp();
  const [editingKey, setEditingKey] = useState<number | null>(null);
  const [quantity, setQuantity] = useState<number>(0);

  const { submit: updateQuantity, isLoading: isSaving } =
    useUpdateQuantityByLot({
      lotId: lotId,
      onSuccess: () => {
        notification.success({
          message: "Cập nhật thành công",
          description: "Số lượng tồn kho đã được cập nhật",
        });
        setEditingKey(null);
        onSuccess?.();
      },
      onError: (error) => {
        notification.error({
          message: "Lỗi cập nhật",
          description: error?.message || "Không thể cập nhật số lượng",
        });
      },
    });

  const handleEdit = (record: WarehouseQuantity) => {
    setEditingKey(record.warehouse_id);
    setQuantity(record.quantity || 0);
  };

  const handleSave = async (record: WarehouseQuantity) => {
    await updateQuantity({
      lotId,
      productId,
      warehouseId: record.warehouse_id,
      newQuantityAvailable: quantity,
    });
  };

  // Deduplicate by warehouse_id and sum quantities, then filter to only show warehouses with quantity > 0
  const filteredWarehouseQuantities = Object.values(
    warehouseQuantities.reduce(
      (acc, wh) => {
        if (!acc[wh.warehouse_id]) {
          acc[wh.warehouse_id] = { ...wh };
        } else {
          // If duplicate warehouse_id, sum the quantities
          acc[wh.warehouse_id].quantity += wh.quantity;
        }
        return acc;
      },
      {} as Record<number, WarehouseQuantity>,
    ),
  );

  const columns = [
    {
      title: (
        <Space>
          <ShopOutlined />
          <span>Kho</span>
        </Space>
      ),
      dataIndex: "warehouse_name",
      key: "warehouse_name",
      render: (text: string) => (
        <Text strong style={{ fontSize: 14 }}>
          {text}
        </Text>
      ),
    },
    {
      title: "Số lượng",
      dataIndex: "quantity",
      key: "quantity",
      align: "center" as const,
      render: (qty: number, record: WarehouseQuantity) => {
        const isEditing = editingKey === record.warehouse_id;

        if (isEditing) {
          return (
            <Space>
              <InputNumber
                value={quantity}
                onChange={(value) => setQuantity(value || 0)}
                min={0}
                style={{ width: 120 }}
                autoFocus
                onPressEnter={() => handleSave(record)}
                disabled={isSaving}
              />
              <Button
                icon={<SaveOutlined />}
                type="primary"
                size="small"
                loading={isSaving}
                onClick={() => handleSave(record)}
              />
            </Space>
          );
        }

        return (
          <Tag
            color={qty > 0 ? "green" : "red"}
            style={{
              fontSize: 13,
              cursor: "pointer",
              userSelect: "none",
            }}
            onClick={() => handleEdit(record)}
          >
            {qty} đơn vị
          </Tag>
        );
      },
    },
  ];

  return (
    <Modal
      title={
        <Space>
          <ShopOutlined style={{ fontSize: 20, color: "#1890ff" }} />
          <span>
            Tồn kho theo kho - <Text type="secondary">{lotNumber}</Text>
          </span>
          {filteredWarehouseQuantities.length > 0 && (
            <Tag color="blue">{filteredWarehouseQuantities.length} kho</Tag>
          )}
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={600}
    >
      {!lotId && (
        <div style={{ marginBottom: 16 }}>
          <Tag color="blue" style={{ padding: "8px 16px", fontSize: 13 }}>
            ℹ️ Lô mặc định - Sản phẩm chưa được phân lô
          </Tag>
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          💡 Nhấp vào số lượng để chỉnh sửa
        </Text>
      </div>

      {filteredWarehouseQuantities.length > 0 ? (
        <Table
          columns={columns}
          dataSource={filteredWarehouseQuantities}
          rowKey="warehouse_id"
          pagination={false}
          size="middle"
          scroll={{ y: 400 }}
        />
      ) : (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <Text type="secondary">Không có kho nào có tồn kho cho lô này</Text>
        </div>
      )}
    </Modal>
  );
};

export default WarehouseQuantityModal;
