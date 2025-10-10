import React, { useState, useEffect } from "react";
import {
  Modal,
  Steps,
  Button,
  Space,
  Typography,
  List,
  InputNumber,
  Tag,
  Card,
  Empty,
  Spin,
  App,
} from "antd";
import {
  CheckCircleOutlined,
  WarningOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { getProductLotsByWarehouse } from "@nam-viet-erp/services";
import dayjs from "dayjs";

const { Text, Title } = Typography;

interface ComboProduct {
  product_id: number;
  quantity: number;
  products?: IProduct;
}

interface LotSelection {
  product_id: number;
  lot_id: number;
  lot_number: string;
  batch_code?: string;
  expiry_date?: string;
  quantity: number;
  maxQuantity: number;
}

interface ComboLotSelectionModalProps {
  open: boolean;
  combo: IComboWithItems;
  comboQuantity: number; // How many combo sets to create
  warehouseId: number;
  onConfirm: (lotSelections: LotSelection[]) => void;
  onCancel: () => void;
}

const ComboLotSelectionModal: React.FC<ComboLotSelectionModalProps> = ({
  open,
  combo,
  comboQuantity,
  warehouseId,
  onConfirm,
  onCancel,
}) => {
  const { notification } = App.useApp();
  const [currentStep, setCurrentStep] = useState(0);
  const [lotSelections, setLotSelections] = useState<LotSelection[]>([]);
  const [availableLots, setAvailableLots] = useState<IProductLot[]>([]);
  const [loadingLots, setLoadingLots] = useState(false);

  // Filter lot-managed products from combo
  const lotManagedProducts = (combo.combo_items || []).filter(
    (item) => item.products?.enable_lot_management,
  );

  const currentProduct = lotManagedProducts[currentStep];
  const requiredQuantity = currentProduct
    ? currentProduct.quantity * comboQuantity
    : 0;

  // Fetch lots for current product
  useEffect(() => {
    if (open && currentProduct) {
      fetchLotsForProduct(currentProduct.product_id);
    }
  }, [open, currentStep, currentProduct]);

  const fetchLotsForProduct = async (productId: number) => {
    setLoadingLots(true);
    try {
      const { data, error } = await getProductLotsByWarehouse(
        productId,
        warehouseId,
      );

      if (error) {
        notification.error({
          message: "Lỗi tải danh sách lô",
          description: error.message,
        });
        setAvailableLots([]);
      } else {
        // Filter out lots with zero or negative quantity
        const validLots = (data || []).filter((lot) => (lot.quantity || 0) > 0);
        setAvailableLots(validLots);

        // Auto-select if only one lot available
        if (
          validLots.length === 1 &&
          !lotSelections.find((s) => s.product_id === productId)
        ) {
          const lot = validLots[0];
          handleSelectLot(lot, Math.min(lot.quantity || 0, requiredQuantity));
        }
      }
    } catch (error: any) {
      notification.error({
        message: "Lỗi",
        description: error.message || "Không thể tải danh sách lô",
      });
      setAvailableLots([]);
    } finally {
      setLoadingLots(false);
    }
  };

  const handleSelectLot = (lot: IProductLot, quantity: number) => {
    if (!currentProduct) return;

    const newSelection: LotSelection = {
      product_id: currentProduct.product_id,
      lot_id: lot.id!,
      lot_number: lot.lot_number,
      batch_code: lot.batch_code,
      expiry_date: lot.expiry_date,
      quantity,
      maxQuantity: lot.quantity || 0,
    };

    setLotSelections((prev) => {
      const filtered = prev.filter(
        (s) => s.product_id !== currentProduct.product_id,
      );
      return [...filtered, newSelection];
    });
  };

  const handleNext = () => {
    const selection = lotSelections.find(
      (s) => s.product_id === currentProduct?.product_id,
    );

    if (!selection) {
      notification.warning({
        message: "Chưa chọn lô",
        description: "Vui lòng chọn lô hàng cho sản phẩm này",
      });
      return;
    }

    if (selection.quantity !== requiredQuantity) {
      notification.warning({
        message: "Số lượng không đúng",
        description: `Cần chọn đúng ${requiredQuantity} sản phẩm`,
      });
      return;
    }

    if (currentStep < lotManagedProducts.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // All products selected, confirm
      onConfirm(lotSelections);
      handleClose();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    setCurrentStep(0);
    setLotSelections([]);
    setAvailableLots([]);
    onCancel();
  };

  const getExpiryStatus = (expiryDate?: string) => {
    if (!expiryDate || !dayjs(expiryDate).isValid()) {
      return { color: "default", text: "Không có HSD", icon: null };
    }

    const daysUntilExpiry = dayjs(expiryDate).diff(dayjs(), "day");

    if (daysUntilExpiry < 0) {
      return {
        color: "error",
        text: "Đã hết hạn",
        icon: <WarningOutlined />,
      };
    } else if (daysUntilExpiry <= 30) {
      return {
        color: "warning",
        text: `Còn ${daysUntilExpiry} ngày`,
        icon: <WarningOutlined />,
      };
    } else {
      return {
        color: "success",
        text: `Còn ${daysUntilExpiry} ngày`,
        icon: <CheckCircleOutlined />,
      };
    }
  };

  const currentSelection = lotSelections.find(
    (s) => s.product_id === currentProduct?.product_id,
  );

  return (
    <Modal
      title={
        <Space direction="vertical" size="small" style={{ width: "100%" }}>
          <Text strong style={{ fontSize: 16 }}>
            Chọn lô hàng cho Combo: {combo.name}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {comboQuantity} bộ combo (cần chọn lô cho{" "}
            {lotManagedProducts.length} sản phẩm)
          </Text>
        </Space>
      }
      open={open}
      onCancel={handleClose}
      width={700}
      footer={[
        <Button key="back" onClick={handleBack} disabled={currentStep === 0}>
          Quay lại
        </Button>,
        <Button key="cancel" onClick={handleClose}>
          Hủy
        </Button>,
        <Button
          key="next"
          type="primary"
          onClick={handleNext}
          disabled={!currentSelection}
        >
          {currentStep < lotManagedProducts.length - 1
            ? "Tiếp theo"
            : "Hoàn tất"}
        </Button>,
      ]}
    >
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {/* Steps */}
        <Steps
          current={currentStep}
          size="small"
          items={lotManagedProducts.map((product, index) => ({
            title: product.products?.name || `Sản phẩm ${index + 1}`,
            icon: lotSelections.find(
              (s) => s.product_id === product.product_id,
            ) ? (
              <CheckCircleOutlined />
            ) : undefined,
          }))}
        />

        {/* Current Product Info */}
        {currentProduct && (
          <Card size="small">
            <Space direction="vertical" size="small" style={{ width: "100%" }}>
              <Title level={5} style={{ margin: 0 }}>
                {currentProduct.products?.name}
              </Title>
              <Space>
                <Tag color="blue">
                  Cần: {requiredQuantity}{" "}
                  {currentProduct.products?.unit || "sản phẩm"}
                </Tag>
                <Tag color="green">
                  {currentProduct.quantity} x {comboQuantity} bộ
                </Tag>
              </Space>
            </Space>
          </Card>
        )}

        {/* Lot Selection */}
        {loadingLots ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <Spin tip="Đang tải danh sách lô..." />
          </div>
        ) : availableLots.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Không có lô hàng khả dụng"
          />
        ) : (
          <List
            dataSource={availableLots}
            renderItem={(lot) => {
              const expiryStatus = getExpiryStatus(lot.expiry_date);
              const isSelected = currentSelection?.lot_id === lot.id;
              const selectedQuantity = isSelected
                ? currentSelection.quantity
                : 0;

              return (
                <List.Item
                  style={{
                    padding: "12px",
                    border: isSelected
                      ? "2px solid #1890ff"
                      : "1px solid #f0f0f0",
                    borderRadius: "8px",
                    marginBottom: "8px",
                    backgroundColor: isSelected ? "#f0f7ff" : "white",
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    if (!isSelected) {
                      handleSelectLot(
                        lot,
                        Math.min(lot.quantity || 0, requiredQuantity),
                      );
                    }
                  }}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <Text strong>Lô: {lot.lot_number}</Text>
                        {lot.batch_code && (
                          <Tag color="purple">Batch: {lot.batch_code}</Tag>
                        )}
                        {isSelected && (
                          <CheckCircleOutlined style={{ color: "#1890ff" }} />
                        )}
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size="small">
                        <Space wrap>
                          <Tag>Tồn kho: {lot.quantity}</Tag>
                          <Tag color={expiryStatus.color}>
                            {expiryStatus.icon} {expiryStatus.text}
                          </Tag>
                          {lot.expiry_date && (
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              HSD: {dayjs(lot.expiry_date).format("DD/MM/YYYY")}
                            </Text>
                          )}
                        </Space>
                        {isSelected && (
                          <Space>
                            <Text>Số lượng:</Text>
                            <InputNumber
                              min={1}
                              max={Math.min(
                                lot.quantity || 0,
                                requiredQuantity,
                              )}
                              value={selectedQuantity}
                              onChange={(value) => {
                                if (value) {
                                  handleSelectLot(lot, value);
                                }
                              }}
                              onClick={(e) => e.stopPropagation()}
                              style={{ width: 100 }}
                            />
                            <Text type="secondary">/ {requiredQuantity}</Text>
                          </Space>
                        )}
                      </Space>
                    }
                  />
                </List.Item>
              );
            }}
          />
        )}

        {/* Info */}
        {currentSelection && (
          <Card size="small" style={{ backgroundColor: "#f6ffed" }}>
            <Space>
              <InfoCircleOutlined style={{ color: "#52c41a" }} />
              <Text>
                Đã chọn lô <Text strong>{currentSelection.lot_number}</Text> -{" "}
                {currentSelection.quantity}/{requiredQuantity} sản phẩm
              </Text>
            </Space>
          </Card>
        )}
      </Space>
    </Modal>
  );
};

export default ComboLotSelectionModal;
