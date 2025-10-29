import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Card,
  Button,
  Space,
  notification,
  Descriptions,
  Table,
  Tag,
  Modal,
  Form,
  Select,
  InputNumber,
  Input,
  Row,
  Col,
  Statistic,
  Popconfirm,
} from "antd";
import {
  CheckCircleOutlined,
  SendOutlined,
  CloseCircleOutlined,
  PlusOutlined,
  DeleteOutlined,
  HomeOutlined,
  ShoppingOutlined,
} from "@ant-design/icons";
import PageLayout from "../../components/PageLayout";
import {
  getProductWithInventory,
  getProductLotByProductIds,
  IProduct,
  IProductLot,
} from "@nam-viet-erp/services";
import dayjs from "dayjs";
import type { ColumnsType } from "antd/es/table";
import {
  useAddWarehouseTransferItem,
  useApproveWarehouseTransfer,
  useCancelWarehouseTransfer,
  useDeleteWarehouseTransferItem,
  useReceiveWarehouseTransfer,
  useSendWarehouseTransfer,
  useSubmitWarehouseTransfer,
  useTransferProductData,
  useWarehouses,
} from "@nam-viet-erp/store";
import ProductSearchInput from "../../components/ProductSearchInput";
import LotSelectionModal from "../../components/LotSelectionModal";

const { TextArea } = Input;

const WarehouseTransferDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>() as { id: string };
  const {
    data: transfer,
    isLoading: loading,
    refetch: fetchTransfer,
  } = useTransferProductData(parseInt(id));
  const [addProductModal, setAddProductModal] = useState(false);
  const [sendModal, setSendModal] = useState(false);
  const [products, setProducts] = useState<IProduct[]>([]);
  const [lots, setLots] = useState<IProductLot[]>([]);
  const [form] = Form.useForm();
  const [sendForm] = Form.useForm();
  const [receiveModal, setReceiveModal] = useState(false);
  const [receiveForm] = Form.useForm();

  // States for new product adding flow
  const [isLotSelectionModalOpen, setIsLotSelectionModalOpen] = useState(false);
  const [selectedProductForLot, setSelectedProductForLot] =
    useState<IProduct | null>(null);

  // Load products for adding items
  const loadProducts = async () => {
    try {
      const { data, error } = await getProductWithInventory();
      if (!error && data) {
        setProducts(data);
      }
    } catch (error) {
      console.error("Error loading products:", error);
    }
  };

  // Load lots for selected product
  const loadLotsForProduct = async (productId: number) => {
    try {
      const data = await getProductLotByProductIds([productId]);
      if (!!data) {
        setLots(data);
      }
    } catch (error) {
      console.error("Error loading lots:", error);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [id]);

  // Get status tag color
  const getStatusColor = (status: TransferStatus) => {
    const colors: Record<TransferStatus, string> = {
      draft: "default",
      pending: "orange",
      approved: "blue",
      in_transit: "cyan",
      completed: "green",
      cancelled: "red",
    };
    return colors[status];
  };

  // Get status label
  const getStatusLabel = (status: TransferStatus) => {
    const labels: Record<TransferStatus, string> = {
      draft: "Nháp",
      pending: "Chờ duyệt",
      approved: "Đã duyệt",
      in_transit: "Đang vận chuyển",
      completed: "Hoàn thành",
      cancelled: "Đã hủy",
    };
    return labels[status];
  };

  // --- Mutation Hooks ---
  const { submit: submitTransfer, isLoading: isSubmitting } =
    useSubmitWarehouseTransfer(transfer?.id, {
      onSuccess: () => {
        notification.success({
          message: "Thành công",
          description: "Đã gửi phiếu chuyển kho để duyệt",
        });
        fetchTransfer();
      },
      onError: (error: any) => {
        notification.error({
          message: "Lỗi",
          description: error.message || "Không thể gửi phiếu chuyển kho",
        });
      },
    });

  const { submit: approveTransfer, isLoading: isApproving } =
    useApproveWarehouseTransfer(transfer?.id, {
      onSuccess: () => {
        notification.success({
          message: "Thành công",
          description: "Đã duyệt phiếu chuyển kho",
        });
        fetchTransfer();
      },
      onError: (error: any) => {
        notification.error({
          message: "Lỗi",
          description: error.message || "Không thể duyệt phiếu chuyển kho",
        });
      },
    });

  const { submit: cancelTransfer, isLoading: isCancelling } =
    useCancelWarehouseTransfer(transfer?.id, {
      onSuccess: () => {
        notification.success({
          message: "Thành công",
          description: "Đã hủy phiếu chuyển kho",
        });
        fetchTransfer();
      },
      onError: (error: any) => {
        notification.error({
          message: "Lỗi",
          description: error.message || "Không thể hủy phiếu chuyển kho",
        });
      },
    });

  // Handle submit for approval
  const handleSubmit = async () => {
    if (!transfer) return;

    try {
      const { error } = await submitTransfer();

      if (error) {
        throw error;
      }

      notification.success({
        message: "Thành công",
        description: "Đã duyệt phiếu chuyển kho",
      });

      fetchTransfer();
    } catch (error: any) {
      notification.error({
        message: "Lỗi",
        description: error.message || "Không thể duyệt phiếu chuyển kho",
      });
    }
  };

  // Handle approve
  const handleApprove = async () => {
    if (!transfer) return;
    await approveTransfer();
  };

  // Handle cancel
  const handleCancel = async () => {
    if (!transfer) return;

    Modal.confirm({
      title: "Hủy phiếu chuyển kho",
      content: (
        <Form layout="vertical">
          <Form.Item label="Lý do hủy">
            <TextArea rows={3} id="rejection-reason" />
          </Form.Item>
        </Form>
      ),
      okText: "Hủy phiếu",
      cancelText: "Đóng",
      onOk: async () => {
        try {
          const reason =
            (document.getElementById("rejection-reason") as HTMLTextAreaElement)
              ?.value || "";

          await cancelTransfer(reason);
        } catch {}
      },
    });
  };

  // Handle send (export from warehouse)
  const handleSend = () => {
    if (!transfer) return;

    const initialValues = transfer.warehouse_transfer_items?.reduce(
      (acc: any, item) => {
        acc[`quantity_sent_${item.id}`] = item.quantity_requested;
        return acc;
      },
      {},
    );

    sendForm.setFieldsValue(initialValues);
    setSendModal(true);
  };

  const { submit: sendItems, isLoading: isSending } = useSendWarehouseTransfer(
    transfer?.id,
    {
      onSuccess: () => {
        notification.success({
          message: "Thành công",
          description: "Đã xuất hàng từ kho",
        });
        setSendModal(false);
        fetchTransfer();
      },
      onError: (error: any) => {
        notification.error({
          message: "Lỗi",
          description: error.message || "Không thể xuất hàng",
        });
      },
    },
  );

  const handleSendSubmit = async () => {
    if (!transfer) return;

    try {
      const values = await sendForm.validateFields();

      const items = transfer.warehouse_transfer_items?.map((item) => ({
        id: item.id,
        quantity_sent: values[`quantity_sent_${item.id}`] || 0,
      }));

      await sendItems({ items: items || [] });
    } catch (error) {}
  };

  // Handle receive
  const handleReceive = () => {
    if (!transfer) return;

    const initialValues = transfer.warehouse_transfer_items?.reduce(
      (acc: any, item) => {
        acc[`quantity_received_${item.id}`] =
          item.quantity_sent * (item.products?.conversion_rate || 1);
        return acc;
      },
      {},
    );

    receiveForm.setFieldsValue(initialValues);
    setReceiveModal(true);
  };

  const { submit: receiveItems, isLoading: isReceiving } =
    useReceiveWarehouseTransfer(transfer?.id, {
      onSuccess: () => {
        notification.success({
          message: "Thành công",
          description: "Đã nhận hàng vào kho",
        });
        setReceiveModal(false);
        fetchTransfer();
      },
      onError: (error: any) => {
        notification.error({
          message: "Lỗi",
          description: error.message || "Không thể nhận hàng",
        });
      },
    });

  const handleReceiveSubmit = async () => {
    if (!transfer) return;

    try {
      const values = await receiveForm.validateFields();

      const items = transfer.warehouse_transfer_items?.map((item) => ({
        id: item.id,
        quantity_received: values[`quantity_received_${item.id}`] || 0,
        damage_notes: values[`damage_notes_${item.id}`] || "",
      }));

      await receiveItems({ items: items || [] });
    } catch (error) {}
  };

  // Handle add product
  const handleAddProduct = () => {
    form.resetFields();
    setAddProductModal(true);
  };

  const { submit: addItem, isLoading: isAddingItem } =
    useAddWarehouseTransferItem(transfer?.id, {
      onSuccess: () => {
        notification.success({
          message: "Thành công",
          description: "Đã thêm sản phẩm",
        });
        setAddProductModal(false);
        fetchTransfer();
      },
      onError: (error: any) => {
        notification.error({
          message: "Lỗi",
          description: error.message || "Không thể thêm sản phẩm",
        });
      },
    });

  const handleAddProductSubmit = async () => {
    if (!transfer) return;

    try {
      const values = await form.validateFields();

      await addItem({
        product_id: values.product_id,
        lot_id: values.lot_id,
        quantity_requested: values.quantity_requested,
        unit_price: values.unit_price,
        notes: values.notes,
      });
    } catch (error) {}
  };

  const { submit: deleteItem, isLoading: isDeletingItem } =
    useDeleteWarehouseTransferItem({
      onSuccess: () => {
        notification.success({
          message: "Thành công",
          description: "Đã xóa sản phẩm",
        });
        fetchTransfer();
      },
      onError: (error: any) => {
        notification.error({
          message: "Lỗi",
          description: error.message || "Không thể xóa sản phẩm",
        });
      },
    });

  const handleLotSelect = (lot: IProductLot, quantity: number) => {
    if (!selectedProductForLot) return;

    // Check if lot has sufficient quantity
    if ((lot.quantity || 0) < quantity) {
      notification.error({
        message: "Số lượng không đủ",
        description: `Lô ${lot.lot_number} chỉ còn ${lot.quantity || 0} sản phẩm.`,
      });
      return;
    }

    // Add item with selected lot
    addItem({
      product_id: selectedProductForLot.id,
      lot_id: lot.id,
      quantity_requested: quantity,
      unit_price: selectedProductForLot.retail_price,
    });

    // Close modal and reset
    setIsLotSelectionModalOpen(false);
    setSelectedProductForLot(null);
  };

  // --- New Product Adding Flow ---

  const handleProductSelect = (product: IProduct | null) => {
    if (!product || !transfer) return;

    // Check stock in the 'from' warehouse
    const fromWarehouseId = transfer.from_warehouse_id;
    const inventoryInWarehouse = product.inventory?.find(
      (inv) => inv.warehouse_id === fromWarehouseId,
    );
    const stockQuantity = inventoryInWarehouse?.quantity || 0;

    if (stockQuantity <= 0) {
      notification.error({
        message: "Hết hàng",
        description: `${product.name} đã hết hàng trong kho xuất.`,
      });
      return;
    }

    if (product.enable_lot_management) {
      setSelectedProductForLot(product);
      setIsLotSelectionModalOpen(true);
    } else {
      // Add item directly with quantity 1
      addItem({
        product_id: product.id,
        quantity_requested: 1,
        unit_price: product.retail_price,
      });
    }
  };

  // Handle delete item
  const handleDeleteItem = async (itemId: number) => {
    await deleteItem(itemId);
  };

  // Table columns
  const columns: ColumnsType<any> = [
    {
      title: "Sản phẩm",
      dataIndex: ["products", "name"],
      key: "product_name",
      width: 250,
    },
    {
      title: "SKU",
      dataIndex: ["products", "sku"],
      key: "sku",
      width: 120,
    },
    {
      title: "Số lô",
      dataIndex: ["product_lots", "lot_number"],
      key: "lot_number",
      width: 120,
    },
    {
      title: "Hạn sử dụng",
      dataIndex: ["product_lots", "expiry_date"],
      key: "expiry_date",
      width: 120,
      render: (date: string) => (date ? dayjs(date).format("DD/MM/YYYY") : "-"),
    },
    {
      title: "SL yêu cầu",
      dataIndex: "quantity_requested",
      key: "quantity_requested",
      width: 100,
      align: "right",
      render: (value: number) => value?.toFixed(0),
    },
    {
      title: "SL gửi",
      dataIndex: "quantity_sent",
      key: "quantity_sent",
      width: 100,
      align: "right",
      render: (value: number, record) => {
        return `${value?.toFixed(0)} (${record?.products?.wholesale_unit ? record?.products?.wholesale_unit : "Hộp"})`;
      },
    },
    {
      title: "SL nhận",
      dataIndex: "quantity_received",
      key: "quantity_received",
      width: 100,
      align: "right",
      render: (value: number, record) => {
        return `${value?.toFixed(0)} (${record?.products?.retail_unit ? record?.products?.retail_unit : "Vỉ"})`;
      },
    },
    {
      title: "Đơn giá",
      dataIndex: "unit_price",
      key: "unit_price",
      width: 120,
      align: "right",
      render: (value: number) =>
        value
          ? new Intl.NumberFormat("vi-VN", {
              style: "currency",
              currency: "VND",
            }).format(value)
          : "-",
    },
    {
      title: "Thành tiền",
      key: "total",
      width: 130,
      align: "right",
      render: (_: any, record: any) => {
        const total = record.quantity_requested * (record.unit_price || 0);
        return new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(total);
      },
    },
  ];

  // Add actions column if in draft mode
  if (transfer?.status === "draft") {
    columns.push({
      title: "Thao tác",
      key: "actions",
      width: 80,
      fixed: "right",
      render: (_: any, record: any) => (
        <Popconfirm
          title="Xác nhận xóa?"
          onConfirm={() => handleDeleteItem(record.id)}
          okText="Xóa"
          cancelText="Hủy"
        >
          <Button type="text" danger icon={<DeleteOutlined />} size="small" />
        </Popconfirm>
      ),
    });
  }

  if (!transfer) {
    return (
      <PageLayout title="Đang tải...">
        <></>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title={`Phiếu chuyển kho ${transfer.transfer_number}`}
      breadcrumbs={[
        { title: "Kho hàng", href: "/warehouse" },
        { title: "Chuyển kho", href: "/warehouse/transfers" },
        { title: transfer.transfer_number },
      ]}
      extra={
        <Space>
          {transfer.status === "draft" && (
            <>
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSubmit}
                loading={isSubmitting}
              >
                Gửi duyệt
              </Button>
            </>
          )}

          {transfer.status === "pending" && (
            <>
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={handleApprove}
                loading={isApproving}
              >
                Duyệt
              </Button>
              <Button
                danger
                icon={<CloseCircleOutlined />}
                onClick={handleCancel}
                loading={isCancelling}
              >
                Từ chối
              </Button>
            </>
          )}

          {transfer.status === "approved" && (
            <Button type="primary" icon={<SendOutlined />} onClick={handleSend}>
              Xuất kho
            </Button>
          )}

          {transfer.status === "in_transit" && (
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={handleReceive}
              loading={isReceiving}
            >
              Nhận hàng
            </Button>
          )}

          {["draft", "pending", "approved"].includes(transfer.status) && (
            <Button
              danger
              icon={<CloseCircleOutlined />}
              onClick={handleCancel}
              loading={isCancelling}
            >
              Hủy phiếu
            </Button>
          )}
        </Space>
      }
    >
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {/* Statistics */}
        <Row gutter={16}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Số lượng yêu cầu"
                value={transfer.total_quantity_requested || 0}
                precision={0}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Số lượng gửi"
                value={transfer.total_quantity_sent || 0}
                precision={0}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Số lượng nhận"
                value={transfer.total_quantity_received || 0}
                precision={0}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Giá trị"
                value={transfer.total_value || 0}
                precision={0}
                formatter={(value) =>
                  new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(value as number)
                }
              />
            </Card>
          </Col>
        </Row>

        {/* Transfer Information */}
        <Card title="Thông tin chuyển kho">
          <Descriptions bordered column={2}>
            <Descriptions.Item label="Mã phiếu" span={1}>
              {transfer.transfer_number}
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái" span={1}>
              <Tag color={getStatusColor(transfer.status)}>
                {getStatusLabel(transfer.status)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Từ kho" span={1}>
              {transfer.from_warehouse?.name}
            </Descriptions.Item>
            <Descriptions.Item label="Đến kho" span={1}>
              {transfer.to_warehouse?.name}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày chuyển" span={1}>
              {dayjs(transfer.transfer_date).format("DD/MM/YYYY")}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày dự kiến giao" span={1}>
              {transfer.expected_delivery_date
                ? dayjs(transfer.expected_delivery_date).format("DD/MM/YYYY")
                : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày giao thực tế" span={1}>
              {transfer.actual_delivery_date
                ? dayjs(transfer.actual_delivery_date).format("DD/MM/YYYY")
                : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Ghi chú" span={2}>
              {transfer.notes || "-"}
            </Descriptions.Item>
            {transfer.rejection_reason && (
              <Descriptions.Item label="Lý do hủy/từ chối" span={2}>
                <span style={{ color: "red" }}>
                  {transfer.rejection_reason}
                </span>
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>

        {/* Transfer Items */}
        <Card
          title="Danh sách sản phẩm"
          extra={
            transfer.status === "draft" && (
              <div style={{ width: 400 }}>
                <ProductSearchInput
                  size="middle"
                  onChange={handleProductSelect}
                  employeeWarehouse={transfer.from_warehouse}
                  placeholder="Tìm kiếm để thêm sản phẩm..."
                />
              </div>
            )
          }
        >
          <Table
            columns={columns}
            dataSource={transfer.warehouse_transfer_items || []}
            rowKey="id"
            loading={loading}
            scroll={{ x: 1200 }}
            pagination={false}
          />
        </Card>
      </Space>

      {/* Send Modal */}
      <Modal
        title="Xuất hàng từ kho"
        open={sendModal}
        onOk={handleSendSubmit}
        onCancel={() => setSendModal(false)}
        okText="Xuất kho"
        cancelText="Hủy"
        width={800}
      >
        <p>Nhập số lượng thực tế xuất kho cho từng sản phẩm:</p>
        <Form form={sendForm} layout="vertical">
          {transfer.warehouse_transfer_items?.map((item) => (
            <Card key={item.id} size="small" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <strong>{item.products?.name}</strong>
                  <div>SKU: {item.products?.sku}</div>
                  {item.product_lots && (
                    <div>Lô: {item.product_lots.lot_number}</div>
                  )}
                  <div>Yêu cầu: {item.quantity_requested}</div>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name={`quantity_sent_${item.id}`}
                    label="Số lượng xuất"
                    rules={[
                      { required: true, message: "Vui lòng nhập số lượng" },
                      {
                        type: "number",
                        max: item.quantity_requested,
                        message: `Không được vượt quá ${item.quantity_requested}`,
                      },
                    ]}
                  >
                    <InputNumber
                      min={0}
                      max={item.quantity_requested}
                      style={{ width: "100%" }}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          ))}
        </Form>
      </Modal>

      {/* Receive Modal */}
      <Modal
        title="Nhận hàng vào kho"
        open={receiveModal}
        onOk={handleReceiveSubmit}
        onCancel={() => setReceiveModal(false)}
        okText="Nhận hàng"
        cancelText="Hủy"
        width={900}
      >
        <p>Nhập số lượng thực tế nhận được cho từng sản phẩm:</p>
        <Form form={receiveForm} layout="vertical">
          {transfer.warehouse_transfer_items?.map((item) => (
            <Card key={item.id} size="small" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={10}>
                  <strong>{item.products?.name}</strong>
                  <div>SKU: {item.products?.sku}</div>
                  {item.product_lots && (
                    <div>Lô: {item.product_lots.lot_number}</div>
                  )}
                  <div>Đã gửi: {item.quantity_sent}</div>
                </Col>
                <Col span={7}>
                  <Form.Item
                    name={`quantity_received_${item.id}`}
                    label="SL nhận"
                    rules={[
                      { required: true, message: "Nhập số lượng" },
                      {
                        type: "number",
                        max:
                          item.quantity_sent *
                          (item.products?.conversion_rate || 1),
                        message: `Không vượt quá ${item.quantity_sent}`,
                      },
                    ]}
                  >
                    <InputNumber
                      min={0}
                      max={item.quantity_sent}
                      style={{ width: "100%" }}
                    />
                  </Form.Item>
                </Col>
                <Col span={7}>
                  <Form.Item
                    name={`damage_notes_${item.id}`}
                    label="Ghi chú hỏng/thiếu"
                  >
                    <Input placeholder="Ghi chú nếu có" />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          ))}
        </Form>
      </Modal>

      {/* Lot Selection Modal for adding products */}
      <LotSelectionModal
        open={isLotSelectionModalOpen}
        onClose={() => {
          setIsLotSelectionModalOpen(false);
          setSelectedProductForLot(null);
        }}
        onSelect={handleLotSelect}
        product={selectedProductForLot}
        warehouseId={transfer.from_warehouse_id}
      />
    </PageLayout>
  );
};

export default WarehouseTransferDetailPage;
