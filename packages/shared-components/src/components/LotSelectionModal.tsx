import React, { useState, useEffect } from "react";
import {
  Modal,
  List,
  Button,
  InputNumber,
  Space,
  Tag,
  Typography,
  Empty,
  Spin,
  App,
} from "antd";
import { CheckCircleOutlined, WarningOutlined } from "@ant-design/icons";
import { getProductLots } from "@nam-viet-erp/services";
import dayjs from "dayjs";

const { Text } = Typography;

interface LotSelectionModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (lot: IProductLot, quantity: number) => void;
  product: IProduct | null;
  warehouseId: number | null;
}

const LotSelectionModal: React.FC<LotSelectionModalProps> = ({
  open,
  onClose,
  onSelect,
  product,
  warehouseId,
}) => {
  const { notification } = App.useApp();
  const [lots, setLots] = useState<IProductLot[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLotId, setSelectedLotId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (open && product && warehouseId) {
      fetchLots();
    }
  }, [open, product, warehouseId]);

  const fetchLots = async () => {
    if (!product || !warehouseId) return;

    setLoading(true);
    try {
      const { data, error } = await getProductLots({
        productId: product.id,
        warehouseId: warehouseId,
      });

      if (error) throw error;

      // Filter lots with available quantity
      const availableLots = (data || []).filter(
        (lot: IProductLot) => lot.quantity && lot.quantity > 0,
      );

      setLots(availableLots);

      // Auto-select first lot if only one available
      if (availableLots.length === 1) {
        setSelectedLotId(availableLots[0].id);
      }
    } catch (error: any) {
      notification.error({
        message: "Lỗi tải danh sách lô",
        description: error.message || "Không thể tải danh sách lô hàng",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    const selectedLot = lots.find((lot) => lot.id === selectedLotId);
    if (!selectedLot) {
      notification.warning({
        message: "Vui lòng chọn lô hàng",
      });
      return;
    }

    if (quantity <= 0) {
      notification.warning({
        message: "Số lượng phải lớn hơn 0",
      });
      return;
    }

    if (selectedLot.quantity && quantity > selectedLot.quantity) {
      notification.error({
        message: "Vượt quá số lượng có sẵn",
        description: `Lô này chỉ còn ${selectedLot.quantity} sản phẩm`,
      });
      return;
    }

    onSelect(selectedLot, quantity);
    handleClose();
  };

  const handleClose = () => {
    setSelectedLotId(null);
    setQuantity(1);
    onClose();
  };

  const getDaysUntilExpiry = (expiryDate?: string | null) => {
    if (!expiryDate) return null;
    return dayjs(expiryDate).diff(dayjs(), "day");
  };

  return (
    <Modal
      title={`Chọn lô hàng - ${product?.name || ""}`}
      open={open}
      onCancel={handleClose}
      footer={[
        <Button key="cancel" onClick={handleClose}>
          Hủy
        </Button>,
        <Button
          key="confirm"
          type="primary"
          onClick={handleConfirm}
          disabled={!selectedLotId}
        >
          Xác nhận
        </Button>,
      ]}
      width={600}
    >
      <Spin spinning={loading}>
        {lots.length === 0 && !loading ? (
          <Empty
            description="Không có lô hàng nào khả dụng trong kho này"
            style={{ margin: "40px 0" }}
          />
        ) : (
          <List
            dataSource={lots}
            renderItem={(lot) => {
              const isSelected = lot.id === selectedLotId;
              const daysUntilExpiry = getDaysUntilExpiry(lot.expiry_date);
              const isExpiringSoon =
                daysUntilExpiry !== null && daysUntilExpiry <= 30;
              const isExpired =
                daysUntilExpiry !== null && daysUntilExpiry <= 0;

              return (
                <List.Item
                  style={{
                    padding: "12px",
                    cursor: "pointer",
                    border: isSelected
                      ? "2px solid #1890ff"
                      : "1px solid #d9d9d9",
                    borderRadius: 8,
                    marginBottom: 8,
                    backgroundColor: isSelected ? "#e6f7ff" : "#fff",
                  }}
                  onClick={() => setSelectedLotId(lot.id)}
                >
                  <Space direction="vertical" style={{ width: "100%" }}>
                    <Space
                      style={{ width: "100%", justifyContent: "space-between" }}
                    >
                      <Space>
                        {isSelected && (
                          <CheckCircleOutlined
                            style={{ color: "#1890ff", fontSize: 18 }}
                          />
                        )}
                        <Text strong style={{ fontSize: 15 }}>
                          {lot.lot_number}
                        </Text>
                      </Space>
                      <Tag
                        color={
                          lot.quantity && lot.quantity > 10 ? "green" : "orange"
                        }
                      >
                        Tồn: {lot.quantity || 0}
                      </Tag>
                    </Space>

                    {lot.batch_code && (
                      <Text type="secondary" style={{ fontSize: 13 }}>
                        Mã lô: {lot.batch_code}
                      </Text>
                    )}

                    {lot.expiry_date && (
                      <Space>
                        {isExpired ? (
                          <Tag color="red" icon={<WarningOutlined />}>
                            Đã hết hạn
                          </Tag>
                        ) : isExpiringSoon ? (
                          <Tag color="orange" icon={<WarningOutlined />}>
                            Sắp hết hạn ({daysUntilExpiry} ngày)
                          </Tag>
                        ) : (
                          <Tag color="green">
                            HSD: {dayjs(lot.expiry_date).format("DD/MM/YYYY")}
                          </Tag>
                        )}
                      </Space>
                    )}

                    {lot.received_date && (
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Ngày nhập:{" "}
                        {dayjs(lot.received_date).format("DD/MM/YYYY")}
                      </Text>
                    )}
                  </Space>
                </List.Item>
              );
            }}
          />
        )}

        {selectedLotId && (
          <div
            style={{
              marginTop: 16,
              padding: "12px",
              backgroundColor: "#f0f0f0",
              borderRadius: 8,
            }}
          >
            <Space>
              <Text strong>Số lượng:</Text>
              <InputNumber
                min={1}
                max={lots.find((l) => l.id === selectedLotId)?.quantity || 1}
                value={quantity}
                onChange={(val) => setQuantity(val || 1)}
                style={{ width: 100 }}
              />
              <Text type="secondary">
                / {lots.find((l) => l.id === selectedLotId)?.quantity || 0} có
                sẵn
              </Text>
            </Space>
          </div>
        )}
      </Spin>
    </Modal>
  );
};

export default LotSelectionModal;
