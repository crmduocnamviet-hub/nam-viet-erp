import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
  Divider,
} from "antd";
import {
  ArrowLeftOutlined,
  EditOutlined,
  CheckCircleOutlined,
  SendOutlined,
  CloseCircleOutlined,
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import PageLayout from "../../components/PageLayout";
import {
  getWarehouseTransferById,
  submitWarehouseTransfer,
  approveWarehouseTransfer,
  cancelWarehouseTransfer,
  sendWarehouseTransfer,
  receiveWarehouseTransfer,
  updateWarehouseTransferItem,
  deleteWarehouseTransferItem,
  addWarehouseTransferItem,
  updateWarehouseTransfer,
  getProductWithInventory,
  getProductLotByProductIds,
} from "@nam-viet-erp/services";
import dayjs from "dayjs";
import type { ColumnsType } from "antd/es/table";

const { TextArea } = Input;

const WarehouseTransferDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [transfer, setTransfer] =
    useState<IWarehouseTransferWithDetails | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [addProductModal, setAddProductModal] = useState(false);
  const [sendModal, setSendModal] = useState(false);
  const [receiveModal, setReceiveModal] = useState(false);
  const [products, setProducts] = useState<IProduct[]>([]);
  const [lots, setLots] = useState<IProductLot[]>([]);
  const [form] = Form.useForm();
  const [sendForm] = Form.useForm();
  const [receiveForm] = Form.useForm();

  // Fetch transfer details
  const fetchTransfer = async () => {
    if (!id) return;

    setLoading(true);
    try {
      const { data, error } = await getWarehouseTransferById(parseInt(id));

      if (error) {
        throw error;
      }

      setTransfer(data);
    } catch (error: any) {
      notification.error({
        message: "Lỗi",
        description:
          error.message || "Không thể tải thông tin phiếu chuyển kho",
      });
    } finally {
      setLoading(false);
    }
  };

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
      const { data, error } = await getProductLotByProductIds([productId]);
      if (!error && data) {
        setLots(data);
      }
    } catch (error) {
      console.error("Error loading lots:", error);
    }
  };

  useEffect(() => {
    fetchTransfer();
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

  // Handle submit for approval
  const handleSubmit = async () => {
    if (!transfer) return;

    try {
      const { error } = await submitWarehouseTransfer(transfer.id);

      if (error) {
        throw error;
      }

      notification.success({
        message: "Thành công",
        description: "Đã gửi phiếu chuyển kho để duyệt",
      });

      fetchTransfer();
    } catch (error: any) {
      notification.error({
        message: "Lỗi",
        description: error.message || "Không thể gửi phiếu chuyển kho",
      });
    }
  };

  // Handle approve
  const handleApprove = async () => {
    if (!transfer) return;

    try {
      const { error } = await approveWarehouseTransfer(transfer.id);

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

          const { error } = await cancelWarehouseTransfer(transfer.id, reason);

          if (error) {
            throw error;
          }

          notification.success({
            message: "Thành công",
            description: "Đã hủy phiếu chuyển kho",
          });

          fetchTransfer();
        } catch (error: any) {
          notification.error({
            message: "Lỗi",
            description: error.message || "Không thể hủy phiếu chuyển kho",
          });
        }
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

  const handleSendSubmit = async () => {
    if (!transfer) return;

    try {
      const values = await sendForm.validateFields();

      const items = transfer.warehouse_transfer_items?.map((item) => ({
        id: item.id,
        quantity_sent: values[`quantity_sent_${item.id}`] || 0,
      }));

      const { error } = await sendWarehouseTransfer(transfer.id, {
        items: items || [],
      });

      if (error) {
        throw error;
      }

      notification.success({
        message: "Thành công",
        description: "Đã xuất hàng từ kho",
      });

      setSendModal(false);
      fetchTransfer();
    } catch (error: any) {
      notification.error({
        message: "Lỗi",
        description: error.message || "Không thể xuất hàng",
      });
    }
  };

  // Handle receive
  const handleReceive = () => {
    if (!transfer) return;

    const initialValues = transfer.warehouse_transfer_items?.reduce(
      (acc: any, item) => {
        acc[`quantity_received_${item.id}`] = item.quantity_sent;
        return acc;
      },
      {},
    );

    receiveForm.setFieldsValue(initialValues);
    setReceiveModal(true);
  };

  const handleReceiveSubmit = async () => {
    if (!transfer) return;

    try {
      const values = await receiveForm.validateFields();

      const items = transfer.warehouse_transfer_items?.map((item) => ({
        id: item.id,
        quantity_received: values[`quantity_received_${item.id}`] || 0,
        damage_notes: values[`damage_notes_${item.id}`] || "",
      }));

      const { error } = await receiveWarehouseTransfer(transfer.id, {
        items: items || [],
      });

      if (error) {
        throw error;
      }

      notification.success({
        message: "Thành công",
        description: "Đã nhận hàng vào kho",
      });

      setReceiveModal(false);
      fetchTransfer();
    } catch (error: any) {
      notification.error({
        message: "Lỗi",
        description: error.message || "Không thể nhận hàng",
      });
    }
  };

  // Handle add product
  const handleAddProduct = () => {
    form.resetFields();
    setAddProductModal(true);
  };

  const handleAddProductSubmit = async () => {
    if (!transfer) return;

    try {
      const values = await form.validateFields();

      const { error } = await addWarehouseTransferItem(transfer.id, {
        product_id: values.product_id,
        lot_id: values.lot_id,
        quantity_requested: values.quantity_requested,
        unit_price: values.unit_price,
        notes: values.notes,
      });

      if (error) {
        throw error;
      }

      notification.success({
        message: "Thành công",
        description: "Đã thêm sản phẩm",
      });

      setAddProductModal(false);
      fetchTransfer();
    } catch (error: any) {
      notification.error({
        message: "Lỗi",
        description: error.message || "Không thể thêm sản phẩm",
      });
    }
  };

  // Handle delete item
  const handleDeleteItem = async (itemId: number) => {
    try {
      const { error } = await deleteWarehouseTransferItem(itemId);

      if (error) {
        throw error;
      }

      notification.success({
        message: "Thành công",
        description: "Đã xóa sản phẩm",
      });

      fetchTransfer();
    } catch (error: any) {
      notification.error({
        message: "Lỗi",
        description: error.message || "Không thể xóa sản phẩm",
      });
    }
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
      render: (value: number) => value?.toFixed(0),
    },
    {
      title: "SL nhận",
      dataIndex: "quantity_received",
      key: "quantity_received",
      width: 100,
      align: "right",
      render: (value: number) => value?.toFixed(0),
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
    return <PageLayout title="Đang tải..." loading />;
  }

  return (
    <PageLayout
      title={`Phiếu chuyển kho ${transfer.transfer_number}`}
      breadcrumbs={[
        { title: "Kho hàng", path: "/warehouse" },
        { title: "Chuyển kho", path: "/warehouse/transfers" },
        { title: transfer.transfer_number },
      ]}
      extra={
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            Quay lại
          </Button>

          {transfer.status === "draft" && (
            <>
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSubmit}
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
              >
                Duyệt
              </Button>
              <Button
                danger
                icon={<CloseCircleOutlined />}
                onClick={handleCancel}
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
            >
              Nhận hàng
            </Button>
          )}

          {["draft", "pending", "approved"].includes(transfer.status) && (
            <Button
              danger
              icon={<CloseCircleOutlined />}
              onClick={handleCancel}
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
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddProduct}
              >
                Thêm sản phẩm
              </Button>
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

      {/* Add Product Modal */}
      <Modal
        title="Thêm sản phẩm"
        open={addProductModal}
        onOk={handleAddProductSubmit}
        onCancel={() => setAddProductModal(false)}
        okText="Thêm"
        cancelText="Hủy"
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="product_id"
            label="Sản phẩm"
            rules={[{ required: true, message: "Vui lòng chọn sản phẩm" }]}
          >
            <Select
              showSearch
              placeholder="Chọn sản phẩm"
              optionFilterProp="children"
              onChange={(value) => loadLotsForProduct(value)}
            >
              {products.map((product) => (
                <Select.Option key={product.id} value={product.id}>
                  {product.name} ({product.sku})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="lot_id" label="Số lô (tùy chọn)">
            <Select placeholder="Chọn lô hàng" allowClear>
              {lots.map((lot) => (
                <Select.Option key={lot.id} value={lot.id}>
                  {lot.lot_number} - HSD:{" "}
                  {lot.expiry_date
                    ? dayjs(lot.expiry_date).format("DD/MM/YYYY")
                    : "N/A"}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="quantity_requested"
            label="Số lượng"
            rules={[
              { required: true, message: "Vui lòng nhập số lượng" },
              { type: "number", min: 1, message: "Số lượng phải lớn hơn 0" },
            ]}
          >
            <InputNumber
              min={1}
              style={{ width: "100%" }}
              placeholder="Nhập số lượng"
            />
          </Form.Item>

          <Form.Item name="unit_price" label="Đơn giá">
            <InputNumber
              min={0}
              style={{ width: "100%" }}
              placeholder="Nhập đơn giá"
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
            />
          </Form.Item>

          <Form.Item name="notes" label="Ghi chú">
            <TextArea rows={3} placeholder="Nhập ghi chú" />
          </Form.Item>
        </Form>
      </Modal>

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
                        max: item.quantity_sent,
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
    </PageLayout>
  );
};

export default WarehouseTransferDetailPage;
