import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  Button,
  Space,
  notification,
  Form,
  Select,
  DatePicker,
  Input,
  Table,
  InputNumber,
  Popconfirm,
  Row,
  Col,
} from "antd";
import {
  ArrowLeftOutlined,
  SaveOutlined,
  PlusOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import PageLayout from "../../components/PageLayout";
import {
  createWarehouseTransfer,
  getWarehouse,
  getProductWithInventory,
  getProductLotByProductIds,
} from "@nam-viet-erp/services";
import dayjs from "dayjs";
import type { ColumnsType } from "antd/es/table";

const { TextArea } = Input;

interface TransferItem {
  key: number;
  product_id: number;
  product_name?: string;
  product_sku?: string;
  lot_id?: number | null;
  lot_number?: string;
  expiry_date?: string;
  quantity_requested: number;
  unit_price?: number;
  notes?: string;
}

const CreateWarehouseTransferPage: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [warehouses, setWarehouses] = useState<IWarehouse[]>([]);
  const [products, setProducts] = useState<IProduct[]>([]);
  const [lots, setLots] = useState<IProductLot[]>([]);
  const [items, setItems] = useState<TransferItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [itemCounter, setItemCounter] = useState(1);

  // Load warehouses
  const loadWarehouses = async () => {
    try {
      const { data, error } = await getWarehouse();
      if (!error && data) {
        setWarehouses(data);
      }
    } catch (error) {
      console.error("Error loading warehouses:", error);
    }
  };

  // Load products
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
        // Filter lots by from_warehouse_id if selected
        const fromWarehouseId = form.getFieldValue("from_warehouse_id");
        if (fromWarehouseId) {
          const filteredLots = data.filter(
            (lot) => lot.warehouse_id === fromWarehouseId,
          );
          setLots(filteredLots);
        } else {
          setLots(data);
        }
      }
    } catch (error) {
      console.error("Error loading lots:", error);
    }
  };

  useEffect(() => {
    loadWarehouses();
    loadProducts();
  }, []);

  // Handle add item
  const handleAddItem = () => {
    const product_id = form.getFieldValue("item_product_id");
    const lot_id = form.getFieldValue("item_lot_id");
    const quantity_requested = form.getFieldValue("item_quantity");
    const unit_price = form.getFieldValue("item_unit_price");
    const notes = form.getFieldValue("item_notes");

    if (!product_id || !quantity_requested || quantity_requested <= 0) {
      notification.warning({
        message: "Thiếu thông tin",
        description: "Vui lòng chọn sản phẩm và nhập số lượng",
      });
      return;
    }

    const product = products.find((p) => p.id === product_id);
    const lot = lots.find((l) => l.id === lot_id);

    const newItem: TransferItem = {
      key: itemCounter,
      product_id,
      product_name: product?.name,
      product_sku: product?.sku,
      lot_id: lot_id || null,
      lot_number: lot?.lot_number,
      expiry_date: lot?.expiry_date,
      quantity_requested,
      unit_price,
      notes,
    };

    setItems([...items, newItem]);
    setItemCounter(itemCounter + 1);

    // Reset item form fields
    form.setFieldsValue({
      item_product_id: undefined,
      item_lot_id: undefined,
      item_quantity: undefined,
      item_unit_price: undefined,
      item_notes: undefined,
    });
    setSelectedProduct(null);
    setLots([]);
  };

  // Handle delete item
  const handleDeleteItem = (key: number) => {
    setItems(items.filter((item) => item.key !== key));
  };

  // Handle submit
  const handleSubmit = async () => {
    try {
      // Validate main form
      await form.validateFields([
        "from_warehouse_id",
        "to_warehouse_id",
        "transfer_date",
      ]);

      if (items.length === 0) {
        notification.warning({
          message: "Thiếu thông tin",
          description: "Vui lòng thêm ít nhất 1 sản phẩm",
        });
        return;
      }

      const values = form.getFieldsValue();

      const transferData: ICreateWarehouseTransfer = {
        from_warehouse_id: values.from_warehouse_id,
        to_warehouse_id: values.to_warehouse_id,
        transfer_date: values.transfer_date
          ? values.transfer_date.format("YYYY-MM-DD")
          : undefined,
        expected_delivery_date: values.expected_delivery_date
          ? values.expected_delivery_date.format("YYYY-MM-DD")
          : undefined,
        notes: values.notes,
        items: items.map((item) => ({
          product_id: item.product_id,
          lot_id: item.lot_id,
          quantity_requested: item.quantity_requested,
          unit_price: item.unit_price,
          notes: item.notes,
        })),
      };

      setLoading(true);

      const { data, error } = await createWarehouseTransfer(transferData);

      if (error) {
        throw error;
      }

      notification.success({
        message: "Thành công",
        description: "Đã tạo phiếu chuyển kho",
      });

      // Navigate to detail page
      if (data) {
        navigate(`/warehouse/transfers/${data.id}`);
      } else {
        navigate("/warehouse/transfers");
      }
    } catch (error: any) {
      notification.error({
        message: "Lỗi",
        description: error.message || "Không thể tạo phiếu chuyển kho",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle from warehouse change - reload lots if product is selected
  const handleFromWarehouseChange = () => {
    if (selectedProduct) {
      loadLotsForProduct(selectedProduct);
    }
  };

  // Table columns
  const columns: ColumnsType<TransferItem> = [
    {
      title: "Sản phẩm",
      dataIndex: "product_name",
      key: "product_name",
      width: 250,
    },
    {
      title: "SKU",
      dataIndex: "product_sku",
      key: "product_sku",
      width: 120,
    },
    {
      title: "Số lô",
      dataIndex: "lot_number",
      key: "lot_number",
      width: 120,
      render: (value) => value || "-",
    },
    {
      title: "Hạn sử dụng",
      dataIndex: "expiry_date",
      key: "expiry_date",
      width: 120,
      render: (date: string) => (date ? dayjs(date).format("DD/MM/YYYY") : "-"),
    },
    {
      title: "Số lượng",
      dataIndex: "quantity_requested",
      key: "quantity_requested",
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
      render: (_: any, record: TransferItem) => {
        const total = record.quantity_requested * (record.unit_price || 0);
        return new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(total);
      },
    },
    {
      title: "Ghi chú",
      dataIndex: "notes",
      key: "notes",
      width: 150,
      render: (value) => value || "-",
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 80,
      fixed: "right",
      render: (_: any, record: TransferItem) => (
        <Popconfirm
          title="Xác nhận xóa?"
          onConfirm={() => handleDeleteItem(record.key)}
          okText="Xóa"
          cancelText="Hủy"
        >
          <Button type="text" danger icon={<DeleteOutlined />} size="small" />
        </Popconfirm>
      ),
    },
  ];

  return (
    <PageLayout
      title="Tạo phiếu chuyển kho"
      breadcrumbs={[
        { title: "Kho hàng", path: "/warehouse" },
        { title: "Chuyển kho", path: "/warehouse/transfers" },
        { title: "Tạo mới" },
      ]}
      extra={
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            Hủy
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSubmit}
            loading={loading}
          >
            Lưu phiếu
          </Button>
        </Space>
      }
    >
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {/* Transfer Information */}
        <Card title="Thông tin chuyển kho">
          <Form form={form} layout="vertical">
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="from_warehouse_id"
                  label="Từ kho"
                  rules={[
                    { required: true, message: "Vui lòng chọn kho xuất" },
                  ]}
                >
                  <Select
                    placeholder="Chọn kho xuất"
                    onChange={handleFromWarehouseChange}
                  >
                    {warehouses.map((warehouse) => (
                      <Select.Option key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item
                  name="to_warehouse_id"
                  label="Đến kho"
                  rules={[
                    { required: true, message: "Vui lòng chọn kho nhận" },
                    {
                      validator: (_, value) => {
                        const fromWarehouseId =
                          form.getFieldValue("from_warehouse_id");
                        if (value && value === fromWarehouseId) {
                          return Promise.reject("Kho nhận phải khác kho xuất");
                        }
                        return Promise.resolve();
                      },
                    },
                  ]}
                >
                  <Select placeholder="Chọn kho nhận">
                    {warehouses.map((warehouse) => (
                      <Select.Option key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item
                  name="transfer_date"
                  label="Ngày chuyển"
                  initialValue={dayjs()}
                >
                  <DatePicker
                    style={{ width: "100%" }}
                    format="DD/MM/YYYY"
                    placeholder="Chọn ngày chuyển"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item
                  name="expected_delivery_date"
                  label="Ngày dự kiến giao"
                >
                  <DatePicker
                    style={{ width: "100%" }}
                    format="DD/MM/YYYY"
                    placeholder="Chọn ngày dự kiến giao"
                  />
                </Form.Item>
              </Col>

              <Col xs={24}>
                <Form.Item name="notes" label="Ghi chú">
                  <TextArea rows={3} placeholder="Nhập ghi chú" />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Card>

        {/* Add Product */}
        <Card title="Thêm sản phẩm">
          <Form form={form} layout="vertical">
            <Row gutter={16}>
              <Col xs={24} sm={8}>
                <Form.Item name="item_product_id" label="Sản phẩm">
                  <Select
                    showSearch
                    placeholder="Chọn sản phẩm"
                    optionFilterProp="children"
                    onChange={(value) => {
                      setSelectedProduct(value);
                      loadLotsForProduct(value);
                      // Auto-fill unit price
                      const product = products.find((p) => p.id === value);
                      if (product?.retail_price) {
                        form.setFieldValue(
                          "item_unit_price",
                          product.retail_price,
                        );
                      }
                    }}
                  >
                    {products.map((product) => (
                      <Select.Option key={product.id} value={product.id}>
                        {product.name} ({product.sku})
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={24} sm={6}>
                <Form.Item name="item_lot_id" label="Số lô (tùy chọn)">
                  <Select
                    placeholder="Chọn lô"
                    allowClear
                    disabled={!selectedProduct}
                  >
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
              </Col>

              <Col xs={24} sm={4}>
                <Form.Item name="item_quantity" label="Số lượng">
                  <InputNumber
                    min={1}
                    style={{ width: "100%" }}
                    placeholder="SL"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={4}>
                <Form.Item name="item_unit_price" label="Đơn giá">
                  <InputNumber
                    min={0}
                    style={{ width: "100%" }}
                    placeholder="Đơn giá"
                    formatter={(value) =>
                      `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                    }
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={2}>
                <Form.Item label=" ">
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleAddItem}
                    block
                  >
                    Thêm
                  </Button>
                </Form.Item>
              </Col>
            </Row>

            <Row>
              <Col xs={24}>
                <Form.Item name="item_notes" label="Ghi chú cho sản phẩm">
                  <Input placeholder="Ghi chú" />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Card>

        {/* Items List */}
        <Card title={`Danh sách sản phẩm (${items.length})`}>
          <Table
            columns={columns}
            dataSource={items}
            rowKey="key"
            scroll={{ x: 1200 }}
            pagination={false}
            summary={(data) => {
              const totalQuantity = data.reduce(
                (sum, item) => sum + item.quantity_requested,
                0,
              );
              const totalValue = data.reduce(
                (sum, item) =>
                  sum + item.quantity_requested * (item.unit_price || 0),
                0,
              );

              return (
                <Table.Summary fixed>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={4}>
                      <strong>Tổng cộng</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="right">
                      <strong>{totalQuantity.toFixed(0)}</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2} />
                    <Table.Summary.Cell index={3} align="right">
                      <strong>
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(totalValue)}
                      </strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={4} colSpan={2} />
                  </Table.Summary.Row>
                </Table.Summary>
              );
            }}
          />
        </Card>
      </Space>
    </PageLayout>
  );
};

export default CreateWarehouseTransferPage;
