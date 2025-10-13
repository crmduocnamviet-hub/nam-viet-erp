import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  Tag,
  Progress,
  Row,
  Col,
  Statistic,
  InputNumber,
  Modal,
  Alert,
  notification,
  Badge,
  Empty,
  Spin,
  Form,
  Select,
  DatePicker,
  Input,
} from "antd";
import {
  ScanOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  BarcodeOutlined,
  ArrowLeftOutlined,
  InboxOutlined,
  ClockCircleOutlined,
  PlusOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import type { ColumnsType } from "antd/es/table";
import PageLayout from "../../components/PageLayout";
import LotExpirationInput from "../../components/LotExpirationInput";
import QRScannerModal from "../../components/QRScannerModal";
import { useAuthStore, usePurchaseOrderStore } from "@nam-viet-erp/store";

const { Text } = Typography;

interface ReceivingItemData {
  quantityToReceive: number;
  lotNumber?: string;
  expirationDate?: string;
  shelfLocation?: string;
}

const PurchaseOrderReceivingPage: React.FC = () => {
  const user = useAuthStore((state) => state.user);

  // Purchase Order Store
  const {
    purchaseOrders: pendingOrders,
    suppliers,
    products,
    b2bWarehouse,
    isLoading: loading,
    fetchPurchaseOrders,
    fetchSuppliers,
    fetchProducts,
    fetchB2bWarehouse,
    receivePurchaseOrderItems: receivePOItems,
    createDirectPurchaseImport: createImport,
  } = usePurchaseOrderStore();

  const [selectedPO, setSelectedPO] = useState<any>(null);
  const [receivingData, setReceivingData] = useState<
    Record<number, ReceivingItemData>
  >({});
  const [scannerOpen, setScannerOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);

  // New import modal state
  const [newImportModalOpen, setNewImportModalOpen] = useState(false);
  const [newImportForm] = Form.useForm();
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [creatingImport, setCreatingImport] = useState(false);

  // Fetch data on mount
  useEffect(() => {
    fetchPurchaseOrders({
      status: ["ordered", "sent", "partially_received"],
    });
    fetchSuppliers();
    fetchProducts();
    fetchB2bWarehouse();
  }, [fetchPurchaseOrders, fetchSuppliers, fetchProducts, fetchB2bWarehouse]);

  // Open new import modal
  const handleOpenNewImportModal = () => {
    setNewImportModalOpen(true);
    setSelectedProducts([]);
    newImportForm.resetFields();
    newImportForm.setFieldsValue({
      order_date: dayjs(),
    });
  };

  // Add product to import list
  const handleAddProduct = () => {
    setSelectedProducts([
      ...selectedProducts,
      {
        id: Date.now(), // Temporary ID for UI
        product_id: undefined,
        quantity: 1,
        lot_number: "",
        expiration_date: "",
      },
    ]);
  };

  // Remove product from import list
  const handleRemoveProduct = (id: number) => {
    setSelectedProducts(selectedProducts.filter((p) => p.id !== id));
  };

  // Update product in import list
  const handleUpdateProduct = (id: number, field: string, value: any) => {
    setSelectedProducts(
      selectedProducts.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    );
  };

  // Create new import order
  const handleCreateImport = async () => {
    try {
      const values = await newImportForm.validateFields();

      if (!b2bWarehouse) {
        notification.error({
          message: "Lỗi",
          description: "Không tìm thấy kho B2B",
        });
        return;
      }

      if (selectedProducts.length === 0) {
        notification.warning({
          message: "Chưa có sản phẩm",
          description: "Vui lòng thêm ít nhất 1 sản phẩm",
        });
        return;
      }

      // Validate all products have required fields
      const invalidProducts = selectedProducts.filter(
        (p) => !p.product_id || !p.quantity || p.quantity <= 0,
      );

      if (invalidProducts.length > 0) {
        notification.warning({
          message: "Thông tin không hợp lệ",
          description:
            "Vui lòng chọn sản phẩm và nhập số lượng cho tất cả các dòng",
        });
        return;
      }

      setCreatingImport(true);

      // Calculate total amount
      const totalAmount = selectedProducts.reduce((sum, p) => {
        const product = products.find((prod) => prod.id === p.product_id);
        const price = product?.cost_price || product?.wholesale_price || 0;
        return sum + price * p.quantity;
      }, 0);

      // Prepare items
      const items = selectedProducts.map((p) => ({
        product_id: p.product_id,
        quantity: p.quantity,
        lot_number: p.lot_number || undefined,
        expiration_date: p.expiration_date || undefined,
      }));

      // Create import order - always use B2B warehouse
      const result = await createImport(
        {
          supplier_id: values.supplier_id,
          order_date: values.order_date.format("YYYY-MM-DD"),
          expected_delivery_date: null,
          total_amount: totalAmount,
          notes: values.notes || "Nhập hàng trực tiếp vào kho B2B",
          created_by: user?.id || null,
        },
        items,
        b2bWarehouse.id,
      );

      if (!result.success) {
        throw new Error(result.error?.message || "Failed to create import");
      }

      notification.success({
        message: "Tạo phiếu nhập thành công",
        description: `Đã tạo phiếu nhập vào kho ${b2bWarehouse.name} với ${selectedProducts.length} sản phẩm`,
        duration: 4,
      });

      // Close modal and refresh
      setNewImportModalOpen(false);
      setSelectedProducts([]);
      newImportForm.resetFields();
      fetchPurchaseOrders({
        status: ["ordered", "sent", "partially_received"],
      });
    } catch (error: any) {
      notification.error({
        message: "Lỗi",
        description: error.message || "Không thể tạo phiếu nhập",
      });
    } finally {
      setCreatingImport(false);
    }
  };

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
    const totalQuantityToReceive = Object.values(receivingData).reduce(
      (sum, data) => sum + (data.quantityToReceive || 0),
      0,
    );

    const itemsWithData = items.filter(
      (item: any) => receivingData[item.id]?.quantityToReceive > 0,
    ).length;

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
        // Auto-fill quantity
        setReceivingData((prev) => ({
          ...prev,
          [item.id]: {
            ...prev[item.id],
            quantityToReceive: (prev[item.id]?.quantityToReceive || 0) + 1,
          },
        }));

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
    const itemsToReceive = Object.entries(receivingData).filter(
      ([_, data]) => data.quantityToReceive > 0,
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
      ([_, data]) => !data.lotNumber || !data.expirationDate,
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
        .filter(([_, data]) => data.quantityToReceive > 0)
        .map(([itemId, data]) => ({
          itemId: Number(itemId),
          quantityToReceive: data.quantityToReceive,
          lotNumber: data.lotNumber,
          expirationDate: data.expirationDate,
          shelfLocation: data.shelfLocation,
        }));

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

      // Reset and refresh
      setReceivingData({});
      setSelectedPO(null);
      fetchPurchaseOrders({
        status: ["ordered", "sent", "partially_received"],
      });
    } catch (error: any) {
      notification.error({
        message: "Lỗi",
        description: error.message || "Không thể xác nhận nhận hàng",
      });
    } finally {
      setConfirming(false);
    }
  };

  // Order columns
  const orderColumns: ColumnsType<any> = [
    {
      title: "Số Đơn",
      dataIndex: "po_number",
      key: "po_number",
      width: 150,
      render: (text: string, record: any) => (
        <a onClick={() => setSelectedPO(record)}>{text}</a>
      ),
    },
    {
      title: "Nhà Cung Cấp",
      dataIndex: ["supplier", "name"],
      key: "supplier_name",
      width: 200,
    },
    {
      title: "Ngày Đặt",
      dataIndex: "order_date",
      key: "order_date",
      width: 120,
      render: (date: string) =>
        date ? new Date(date).toLocaleDateString("vi-VN") : "-",
    },
    {
      title: "Trạng Thái",
      dataIndex: "status",
      key: "status",
      width: 150,
      render: (status: string) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          ordered: { color: "blue", text: "Đã đặt hàng" },
          sent: { color: "cyan", text: "Đã gửi" },
          partially_received: { color: "orange", text: "Nhận một phần" },
        };
        const config = statusMap[status] || { color: "default", text: status };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: "Tiến Độ",
      key: "progress",
      width: 200,
      render: (_: any, record: any) => {
        const items = record.items || [];
        const totalQty = items.reduce(
          (sum: number, item: any) => sum + item.quantity,
          0,
        );
        const receivedQty = items.reduce(
          (sum: number, item: any) => sum + (item.received_quantity || 0),
          0,
        );
        const percent = totalQty > 0 ? (receivedQty / totalQty) * 100 : 0;
        return (
          <Space direction="vertical" size="small" style={{ width: "100%" }}>
            <Text type="secondary">
              {receivedQty}/{totalQty} sản phẩm
            </Text>
            <Progress percent={Math.round(percent)} size="small" />
          </Space>
        );
      },
    },
    {
      title: "Hành Động",
      key: "actions",
      width: 120,
      fixed: "right",
      render: (_: any, record: any) => (
        <Button type="primary" onClick={() => setSelectedPO(record)}>
          Nhận Hàng
        </Button>
      ),
    },
  ];

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
        const remaining = record.quantity - (record.received_quantity || 0);
        return (
          <InputNumber
            min={0}
            max={remaining}
            value={receivingData[record.id]?.quantityToReceive || 0}
            onChange={(val) =>
              setReceivingData((prev) => ({
                ...prev,
                [record.id]: {
                  ...prev[record.id],
                  quantityToReceive: val || 0,
                },
              }))
            }
            style={{ width: "100%" }}
          />
        );
      },
    },
    {
      title: "Số Lô & Hạn SD",
      key: "lot_expiration",
      width: 250,
      render: (_: any, record: any) => (
        <LotExpirationInput
          value={{
            lotNumber: receivingData[record.id]?.lotNumber,
            expirationDate: receivingData[record.id]?.expirationDate,
          }}
          onChange={(value) =>
            setReceivingData((prev) => ({
              ...prev,
              [record.id]: {
                ...prev[record.id],
                ...value,
              },
            }))
          }
          disabled={!receivingData[record.id]?.quantityToReceive}
        />
      ),
    },
    {
      title: "Trạng Thái",
      key: "status",
      width: 120,
      fixed: "right",
      render: (_: any, record: any) => {
        const receivedQty = receivingData[record.id]?.quantityToReceive || 0;
        if (receivedQty === 0) {
          return <Tag>Chưa nhận</Tag>;
        }
        const remaining = record.quantity - (record.received_quantity || 0);
        if (receivedQty === remaining) {
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

  return (
    <PageLayout
      title="Nhận Hàng"
      extra={
        <Space>
          {!selectedPO && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleOpenNewImportModal}
            >
              Tạo Phiếu Nhập Mới
            </Button>
          )}
          {selectedPO && (
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => {
                setSelectedPO(null);
                setReceivingData({});
              }}
            >
              Quay Lại
            </Button>
          )}
        </Space>
      }
    >
      {!selectedPO ? (
        // List of pending purchase orders
        <Card
          title={
            <Space>
              <InboxOutlined />
              Đơn Hàng Đang Chờ Nhận
            </Space>
          }
        >
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <Spin size="large" tip="Đang tải danh sách đơn hàng..." />
            </div>
          ) : pendingOrders.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="Không có đơn hàng nào cần nhận"
            />
          ) : (
            <Table
              columns={orderColumns}
              dataSource={pendingOrders}
              rowKey="id"
              scroll={{ x: 1000 }}
              pagination={{
                showTotal: (total) => `Tổng ${total} đơn hàng`,
                showSizeChanger: true,
              }}
            />
          )}
        </Card>
      ) : (
        // Receiving interface for selected PO
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
                  <Text strong>
                    ({receivingSummary.totalQuantityToReceive})
                  </Text>
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
                size="large"
                onClick={() => setScannerOpen(true)}
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
              size="small"
            />
          </Card>
        </Space>
      )}

      {/* QR Scanner Modal */}
      <QRScannerModal
        visible={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleBarcodeScan}
      />

      {/* New Import Modal */}
      <Modal
        title={
          <Space>
            <PlusOutlined />
            Tạo Phiếu Nhập Hàng Mới
          </Space>
        }
        open={newImportModalOpen}
        onCancel={() => setNewImportModalOpen(false)}
        width={1000}
        footer={[
          <Button key="cancel" onClick={() => setNewImportModalOpen(false)}>
            Hủy
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={creatingImport}
            disabled={!b2bWarehouse}
            onClick={handleCreateImport}
            icon={<CheckCircleOutlined />}
          >
            Tạo Phiếu Nhập
          </Button>,
        ]}
      >
        <Form form={newImportForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="supplier_id"
                label="Nhà Cung Cấp"
                rules={[
                  { required: true, message: "Vui lòng chọn nhà cung cấp" },
                ]}
              >
                <Select
                  placeholder="Chọn nhà cung cấp"
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label ?? "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  options={suppliers.map((s) => ({
                    label: s.name,
                    value: s.id,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Kho Nhập">
                <Input
                  value={b2bWarehouse?.name || "Đang tải..."}
                  disabled
                  style={{ cursor: "not-allowed" }}
                  prefix={<InboxOutlined />}
                />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Tự động nhập vào kho B2B
                </Text>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="order_date"
                label="Ngày Nhập"
                rules={[{ required: true, message: "Vui lòng chọn ngày" }]}
              >
                <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="notes" label="Ghi Chú">
                <Input.TextArea rows={1} placeholder="Ghi chú về phiếu nhập" />
              </Form.Item>
            </Col>
          </Row>
        </Form>

        <Card
          title="Danh Sách Sản Phẩm"
          extra={
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={handleAddProduct}
            >
              Thêm Sản Phẩm
            </Button>
          }
          style={{ marginTop: 16 }}
        >
          {selectedProducts.length === 0 ? (
            <Empty description="Chưa có sản phẩm nào. Nhấn 'Thêm Sản Phẩm' để bắt đầu" />
          ) : (
            <Table
              dataSource={selectedProducts}
              rowKey="id"
              pagination={false}
              size="small"
              columns={[
                {
                  title: "Sản Phẩm",
                  key: "product",
                  width: 250,
                  render: (_, record) => (
                    <Select
                      placeholder="Chọn sản phẩm"
                      style={{ width: "100%" }}
                      value={record.product_id}
                      onChange={(value) =>
                        handleUpdateProduct(record.id, "product_id", value)
                      }
                      showSearch
                      filterOption={(input, option) =>
                        (option?.label ?? "")
                          .toLowerCase()
                          .includes(input.toLowerCase())
                      }
                      options={products.map((p) => ({
                        label: `${p.name} (${p.sku || "N/A"})`,
                        value: p.id,
                      }))}
                    />
                  ),
                },
                {
                  title: "Số Lượng",
                  key: "quantity",
                  width: 100,
                  render: (_, record) => (
                    <InputNumber
                      min={1}
                      value={record.quantity}
                      onChange={(value) =>
                        handleUpdateProduct(record.id, "quantity", value || 1)
                      }
                      style={{ width: "100%" }}
                    />
                  ),
                },
                {
                  title: "Số Lô & Hạn SD",
                  key: "lot",
                  width: 280,
                  render: (_, record) => (
                    <LotExpirationInput
                      value={{
                        lotNumber: record.lot_number,
                        expirationDate: record.expiration_date,
                      }}
                      onChange={(value) => {
                        if (value.lotNumber !== undefined) {
                          handleUpdateProduct(
                            record.id,
                            "lot_number",
                            value.lotNumber,
                          );
                        }
                        if (value.expirationDate !== undefined) {
                          handleUpdateProduct(
                            record.id,
                            "expiration_date",
                            value.expirationDate,
                          );
                        }
                      }}
                    />
                  ),
                },
                {
                  title: "Giá",
                  key: "price",
                  width: 100,
                  render: (_, record) => {
                    const product = products.find(
                      (p) => p.id === record.product_id,
                    );
                    const price =
                      product?.cost_price || product?.wholesale_price || 0;
                    return <Text>{price.toLocaleString("vi-VN")} ₫</Text>;
                  },
                },
                {
                  title: "Thành Tiền",
                  key: "total",
                  width: 120,
                  render: (_, record) => {
                    const product = products.find(
                      (p) => p.id === record.product_id,
                    );
                    const price =
                      product?.cost_price || product?.wholesale_price || 0;
                    const total = price * (record.quantity || 0);
                    return (
                      <Text strong>{total.toLocaleString("vi-VN")} ₫</Text>
                    );
                  },
                },
                {
                  title: "",
                  key: "actions",
                  width: 50,
                  fixed: "right",
                  render: (_, record) => (
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleRemoveProduct(record.id)}
                    />
                  ),
                },
              ]}
            />
          )}

          {selectedProducts.length > 0 && (
            <div style={{ marginTop: 16, textAlign: "right" }}>
              <Space size="large">
                <Text>
                  Tổng sản phẩm: <Text strong>{selectedProducts.length}</Text>
                </Text>
                <Text>
                  Tổng số lượng:{" "}
                  <Text strong>
                    {selectedProducts.reduce(
                      (sum, p) => sum + (p.quantity || 0),
                      0,
                    )}
                  </Text>
                </Text>
                <Text>
                  Tổng tiền:{" "}
                  <Text strong type="success">
                    {selectedProducts
                      .reduce((sum, p) => {
                        const product = products.find(
                          (prod) => prod.id === p.product_id,
                        );
                        const price =
                          product?.cost_price || product?.wholesale_price || 0;
                        return sum + price * (p.quantity || 0);
                      }, 0)
                      .toLocaleString("vi-VN")}{" "}
                    ₫
                  </Text>
                </Text>
              </Space>
            </div>
          )}
        </Card>
      </Modal>
    </PageLayout>
  );
};

export default PurchaseOrderReceivingPage;
