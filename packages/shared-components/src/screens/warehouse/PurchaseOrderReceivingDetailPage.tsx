import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  Tag,
  Row,
  Col,
  Statistic,
  InputNumber,
  Modal,
  Alert,
  notification,
  Badge,
  Spin,
} from "antd";
import {
  ScanOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  BarcodeOutlined,
  ArrowLeftOutlined,
  ClockCircleOutlined,
  PlusOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import PageLayout from "../../components/PageLayout";
import LotExpirationInput from "../../components/LotExpirationInput";
import QRScannerModal from "../../components/QRScannerModal";
import { useAuthStore, usePurchaseOrderStore } from "@nam-viet-erp/store";

const { Text } = Typography;

interface LotData {
  id: number; // Unique ID for UI management
  quantityToReceive: number;
  lotNumber?: string;
  expirationDate?: string;
  shelfLocation?: string;
}

const PurchaseOrderReceivingDetailPage: React.FC = () => {
  const { poId } = useParams<{ poId: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  // Purchase Order Store
  const {
    purchaseOrders,
    isLoading: loading,
    fetchPurchaseOrders,
    receivePurchaseOrderItems: receivePOItems,
  } = usePurchaseOrderStore();

  const [selectedPO, setSelectedPO] = useState<any>(null);
  const [receivingData, setReceivingData] = useState<Record<number, LotData[]>>(
    {},
  );
  const [scannerOpen, setScannerOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);

  // Fetch purchase orders on mount
  useEffect(() => {
    fetchPurchaseOrders({
      status: ["ordered", "sent", "partially_received"],
    });
  }, [fetchPurchaseOrders]);

  // Find and set the selected PO when data is loaded
  useEffect(() => {
    if (poId && purchaseOrders.length > 0) {
      const po = purchaseOrders.find((order) => order.id === Number(poId));
      if (po) {
        setSelectedPO(po);
      } else {
        notification.error({
          message: "Không tìm thấy",
          description: "Không tìm thấy đơn hàng này",
        });
        navigate("/warehouse/receiving");
      }
    }
  }, [poId, purchaseOrders, navigate]);

  // Calculate receiving summary
  const receivingSummary = React.useMemo(() => {
    if (!selectedPO) return null;

    const items = selectedPO.items || [];
    const totalItems = items.length;
    const totalQuantityOrdered = items.reduce(
      (sum: number, item: any) => sum + item.quantity,
      0,
    );
    const totalQuantityReceived = items.reduce(
      (sum: number, item: any) => sum + (item.received_quantity || 0),
      0,
    );

    let totalQuantityToReceive = 0;
    let itemsWithData = 0;

    Object.values(receivingData).forEach((lots) => {
      if (lots.length > 0) {
        itemsWithData++;
        lots.forEach((lot) => {
          totalQuantityToReceive += lot.quantityToReceive || 0;
        });
      }
    });

    return {
      totalItems,
      totalQuantityOrdered,
      totalQuantityReceived,
      totalQuantityToReceive,
      itemsWithData,
      pendingQuantity: totalQuantityOrdered - totalQuantityReceived,
    };
  }, [selectedPO, receivingData]);

  // Handle barcode scan
  const handleBarcodeScan = (barcode: string) => {
    if (!selectedPO) return;

    // Find product by barcode in current PO items
    const item = selectedPO.items?.find(
      (item: any) =>
        item.product?.barcode === barcode ||
        item.product?.sku === barcode ||
        item.product?.id?.toString() === barcode,
    );

    if (item) {
      const remaining = item.quantity - (item.received_quantity || 0);
      if (remaining > 0) {
        setReceivingData((prev) => {
          const lots = prev[item.id] || [];
          const existingEmptyLotIndex = lots.findIndex((l) => !l.lotNumber);

          if (existingEmptyLotIndex !== -1) {
            const newLots = [...lots];
            newLots[existingEmptyLotIndex].quantityToReceive += 1;
            return { ...prev, [item.id]: newLots };
          } else {
            const newLot: LotData = {
              id: Date.now(),
              quantityToReceive: 1,
              lotNumber: "",
              expirationDate: "",
            };
            return { ...prev, [item.id]: [...lots, newLot] };
          }
        });

        notification.success({
          message: "Quét thành công",
          description: `${item.product?.name} - Thêm 1 sản phẩm`,
          duration: 2,
        });
      } else {
        notification.warning({
          message: "Đã nhận đủ",
          description: `${item.product?.name} đã nhận đủ số lượng`,
        });
      }
    } else {
      notification.error({
        message: "Không tìm thấy",
        description: "Sản phẩm không có trong đơn đặt hàng này",
      });
    }
  };

  // Handle confirm receiving
  const handleConfirmReceiving = () => {
    const itemsToReceive = Object.entries(receivingData).flatMap(
      ([itemId, lots]) => lots.map((lot) => ({ ...lot, itemId })),
    );

    if (itemsToReceive.length === 0) {
      notification.warning({
        message: "Chưa có sản phẩm",
        description: "Vui lòng nhập số lượng cần nhận cho ít nhất 1 sản phẩm",
      });
      return;
    }

    // Check for missing lot/expiration
    const missingData = itemsToReceive.filter(
      (lot) => !lot.lotNumber || !lot.expirationDate,
    );

    if (missingData.length > 0) {
      Modal.confirm({
        title: "Thiếu thông tin Lô/Hạn",
        content: `Có ${missingData.length} sản phẩm chưa nhập đủ Số Lô và Hạn Sử Dụng. Bạn có muốn tiếp tục?`,
        okText: "Tiếp tục",
        cancelText: "Hủy",
        onOk: () => confirmReceiving(),
      });
    } else {
      confirmReceiving();
    }
  };

  const confirmReceiving = async () => {
    setConfirming(true);
    try {
      // Prepare receiving payload
      const receivingPayload = Object.entries(receivingData)
        .flatMap(([itemId, lots]) =>
          lots.map((lot) => ({
            itemId: Number(itemId),
            quantityToReceive: lot.quantityToReceive,
            lotNumber: lot.lotNumber,
            expirationDate: lot.expirationDate,
            shelfLocation: lot.shelfLocation,
          })),
        )
        .filter((lot) => lot.quantityToReceive > 0);

      console.log(receivingData);

      // Call receiving service through store
      const result = await receivePOItems(
        selectedPO.id,
        receivingPayload,
        user?.id || null,
      );

      if (!result.success) {
        throw new Error(result.error?.message || "Failed to receive items");
      }

      notification.success({
        message: "Nhận hàng thành công",
        description: `Đã nhận ${receivingSummary?.itemsWithData} sản phẩm với tổng ${receivingSummary?.totalQuantityToReceive} chiếc`,
        duration: 4,
      });

      // Reset and navigate back
      setReceivingData({});
      navigate("/warehouse/receiving");
    } catch (error: any) {
      notification.error({
        message: "Lỗi",
        description: error.message || "Không thể xác nhận nhận hàng",
      });
    } finally {
      setConfirming(false);
    }
  };

  // Product columns
  const productColumns: ColumnsType<any> = [
    {
      title: "Sản Phẩm",
      dataIndex: ["product", "name"],
      key: "product_name",
      width: 200,
      fixed: "left",
    },
    {
      title: "Mã",
      dataIndex: ["product", "sku"],
      key: "sku",
      width: 100,
    },
    {
      title: "SL Đặt",
      dataIndex: "quantity",
      key: "quantity",
      width: 80,
      align: "center",
    },
    {
      title: "Đã Nhận",
      dataIndex: "received_quantity",
      key: "received_quantity",
      width: 90,
      align: "center",
      render: (qty: number) => <Tag color="success">{qty || 0}</Tag>,
    },
    {
      title: "Còn Lại",
      key: "remaining",
      width: 80,
      align: "center",
      render: (_: any, record: any) => {
        const remaining = record.quantity - (record.received_quantity || 0);
        return (
          <Tag color={remaining > 0 ? "warning" : "default"}>{remaining}</Tag>
        );
      },
    },
    {
      title: "Nhận Lần Này",
      key: "receiving",
      width: 120,
      align: "center",
      render: (_: any, record: any) => {
        const lots = receivingData[record.id] || [];
        const totalToReceive = lots.reduce(
          (sum, lot) => sum + (lot.quantityToReceive || 0),
          0,
        );
        return <Text strong>{totalToReceive}</Text>;
      },
    },
    {
      title: "Số Lô & Hạn SD",
      key: "lot_expiration",
      width: 350,
      render: (_: any, record: any) => {
        const lots = receivingData[record.id] || [];
        const product = record.product;
        const showLotInput = product?.enable_lot_management;

        return (
          <Space direction="vertical" style={{ width: "100%" }}>
            {lots.map((lot, index) => (
              <Space key={lot.id} style={{ width: "100%" }} align="start">
                <LotExpirationInput
                  showLotNumberInput={showLotInput}
                  value={{
                    lotNumber: lot.lotNumber,
                    expirationDate: lot.expirationDate,
                  }}
                  onChange={(value) => {
                    const newLots = [...lots];
                    newLots[index] = { ...newLots[index], ...value };
                    setReceivingData((prev) => ({
                      ...prev,
                      [record.id]: newLots,
                    }));
                  }}
                  productId={record.product_id}
                />
                <InputNumber
                  min={1}
                  placeholder="SL"
                  value={lot.quantityToReceive}
                  onChange={(quantity) => {
                    const newLots = [...lots];
                    newLots[index].quantityToReceive = quantity || 1;
                    setReceivingData((prev) => ({
                      ...prev,
                      [record.id]: newLots,
                    }));
                  }}
                  style={{ width: 70 }}
                />
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => {
                    const newLots = lots.filter((_, i) => i !== index);
                    setReceivingData((prev) => ({
                      ...prev,
                      [record.id]: newLots,
                    }));
                  }}
                />
              </Space>
            ))}
            {(!!product?.enable_lot_management || lots.length === 0) && (
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={() => {
                  const newLot: LotData = {
                    id: Date.now(),
                    quantityToReceive: 1,
                    lotNumber: "",
                    expirationDate: "",
                  };
                  setReceivingData((prev) => ({
                    ...prev,
                    [record.id]: [...(prev[record.id] || []), newLot],
                  }));
                }}
                block
              >
                Thêm Lô
              </Button>
            )}
          </Space>
        );
      },
    },
    {
      title: "Trạng Thái",
      key: "status",
      width: 120,
      fixed: "right",
      render: (_: any, record: any) => {
        const lots = receivingData[record.id] || [];
        const totalToReceive = lots.reduce(
          (sum, lot) => sum + (lot.quantityToReceive || 0),
          0,
        );

        if (totalToReceive === 0) {
          return <Tag>Chưa nhận</Tag>;
        }
        const remaining = record.quantity - (record.received_quantity || 0);
        if (totalToReceive === remaining) {
          return (
            <Tag color="success" icon={<CheckCircleOutlined />}>
              Đủ
            </Tag>
          );
        }
        return (
          <Tag color="warning" icon={<WarningOutlined />}>
            Một phần
          </Tag>
        );
      },
    },
  ];

  if (loading || !selectedPO) {
    return (
      <PageLayout title="Xác Nhận Nhận Hàng">
        <div style={{ textAlign: "center", padding: "40px" }}>
          <Spin size="large" tip="Đang tải thông tin đơn hàng..." />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Xác Nhận Nhận Hàng"
      extra={
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/warehouse/receiving")}
          size="large"
        >
          Quay Lại
        </Button>
      }
    >
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {/* Order Info */}
        <Card>
          <Row gutter={16}>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title="Số Đơn"
                value={selectedPO.po_number}
                prefix={<Text type="secondary">#</Text>}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title="Nhà Cung Cấp"
                value={selectedPO.supplier?.name || "-"}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title="Tổng SL Đặt"
                value={receivingSummary?.totalQuantityOrdered || 0}
                suffix="sp"
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title="Đã Nhận"
                value={receivingSummary?.totalQuantityReceived || 0}
                valueStyle={{ color: "#52c41a" }}
                suffix="sp"
              />
            </Col>
          </Row>
        </Card>

        {/* Receiving Summary Alert */}
        {receivingSummary && receivingSummary.totalQuantityToReceive > 0 && (
          <Alert
            message={
              <Space>
                <Text strong>Chuẩn bị nhận:</Text>
                <Badge
                  count={receivingSummary.itemsWithData}
                  style={{ backgroundColor: "#1890ff" }}
                />
                <Text>sản phẩm</Text>
                <Text strong>({receivingSummary.totalQuantityToReceive})</Text>
                <Text>chiếc</Text>
              </Space>
            }
            type="info"
            showIcon
          />
        )}

        {/* Barcode Scanner */}
        <Card>
          <Space wrap>
            <Button
              type="primary"
              icon={<ScanOutlined />}
              onClick={() => setScannerOpen(true)}
              size="large"
            >
              Quét Mã Vạch
            </Button>
            <Button icon={<BarcodeOutlined />} size="large" disabled>
              Nhập Mã Thủ Công
            </Button>
            <Alert
              message="Quét mã vạch sản phẩm để tự động tăng số lượng nhận"
              type="info"
              showIcon
              style={{ flex: 1 }}
            />
          </Space>
        </Card>

        {/* Products Table */}
        <Card
          title={
            <Space>
              <ClockCircleOutlined />
              Danh Sách Sản Phẩm ({selectedPO.items?.length || 0})
            </Space>
          }
          extra={
            <Space>
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={handleConfirmReceiving}
                loading={confirming}
                disabled={!receivingSummary?.totalQuantityToReceive}
                size="large"
              >
                Xác Nhận Nhận Hàng
              </Button>
            </Space>
          }
        >
          <Table
            columns={productColumns}
            dataSource={selectedPO.items || []}
            rowKey="id"
            pagination={false}
            scroll={{ x: 1200 }}
            size="large"
          />
        </Card>
      </Space>

      {/* QR Scanner Modal */}
      <QRScannerModal
        visible={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleBarcodeScan}
      />
    </PageLayout>
  );
};

export default PurchaseOrderReceivingDetailPage;
