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
  Typography,
} from "antd";
import { SaveOutlined, DeleteOutlined } from "@ant-design/icons";
import PageLayout from "../../components/PageLayout";
import LotSelectionModal from "../../components/LotSelectionModal";
import { useDebounce } from "../../hooks/useDebounce";
import {
  createWarehouseTransfer,
  getWarehouse,
  getProductWithInventory,
} from "@nam-viet-erp/services";
import dayjs from "dayjs";
import type { ColumnsType } from "antd/es/table";
import ProductSearchInput from "../../components/ProductSearchInput";

const { TextArea } = Input;
const { Text } = Typography;

interface TransferItem {
  key: number;
  product_id: number;
  product_name?: string;
  product_sku?: string;
  lot_id?: number | null;
  lot_number?: string;
  expiry_date?: string;
  lot_quantity?: number; // Add lot stock quantity
  quantity_requested: number;
  unit_price?: number;
  notes?: string;
  // For unit conversion display
  original_quantity?: number;
  original_unit?: string;
  converted_unit?: string;
  conversion_rate?: number;
}

const CreateWarehouseTransferPage: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [warehouses, setWarehouses] = useState<IWarehouse[]>([]);
  const [products, setProducts] = useState<IProduct[]>([]);
  const [items, setItems] = useState<TransferItem[]>([]);
  const [itemCounter, setItemCounter] = useState(1);

  // Filter state (for product list)
  const [listFilterTerm, setListFilterTerm] = useState("");
  const debouncedListFilter = useDebounce(listFilterTerm, 300);

  // From warehouse for ProductSearchInput
  const [fromWarehouse, setFromWarehouse] = useState<IWarehouse | null>(null);

  // Lot selection modal state
  const [isLotSelectionModalOpen, setIsLotSelectionModalOpen] = useState(false);
  const [selectedProductForLot, setSelectedProductForLot] =
    useState<IProduct | null>(null);
  const [tempUnitPrice, setTempUnitPrice] = useState<number | undefined>(
    undefined,
  );
  const [tempNotes, setTempNotes] = useState<string | undefined>(undefined);

  const productSearchRef = React.useRef<any>(null);

  // Auto-focus product search when typing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Get the active element
      const activeElement = document.activeElement as HTMLElement;
      const tagName = activeElement?.tagName.toLowerCase();

      // Don't trigger if user is already typing in an input/textarea
      if (
        tagName === "input" ||
        tagName === "textarea" ||
        activeElement?.contentEditable === "true"
      ) {
        return;
      }

      // Don't trigger on special keys
      if (
        e.ctrlKey ||
        e.metaKey ||
        e.altKey ||
        e.key === "Escape" ||
        e.key === "Tab" ||
        e.key === "Enter" ||
        e.key === "Shift" ||
        e.key === "Control" ||
        e.key === "Alt" ||
        e.key === "Meta" ||
        e.key.startsWith("Arrow") ||
        e.key.startsWith("F")
      ) {
        return;
      }

      // Only trigger on printable characters (length 1 or space)
      if (e.key.length === 1) {
        // Focus the product search input
        if (productSearchRef.current) {
          productSearchRef.current.focus();
        }
      }
    };

    // Add event listener
    document.addEventListener("keydown", handleKeyDown);

    // Cleanup
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Load warehouses
  const loadWarehouses = async () => {
    try {
      const { data, error } = await getWarehouse();
      if (!error && data) {
        setWarehouses(data);

        // Set default warehouse to B2B
        const b2bWarehouse = data.find((w) =>
          w.name.toLowerCase().includes("b2b"),
        );

        if (b2bWarehouse) {
          form.setFieldsValue({ from_warehouse_id: b2bWarehouse.id });
          setFromWarehouse(b2bWarehouse);
        }
      }
    } catch (error) {
      console.error("Error loading warehouses:", error);
    }
  };

  // Load products (for fallback)
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

  useEffect(() => {
    loadWarehouses();
    loadProducts();
  }, []);

  // Check if transfer is from B2B to pharmacy (B2C)
  const isB2BToPharmacyTransfer = (): boolean => {
    const fromWarehouseId = form.getFieldValue("from_warehouse_id");
    const toWarehouseId = form.getFieldValue("to_warehouse_id");

    if (!fromWarehouseId || !toWarehouseId) return false;

    const fromWh = warehouses.find((w) => w.id === fromWarehouseId);
    const toWh = warehouses.find((w) => w.id === toWarehouseId);

    if (!fromWh || !toWh) return false;

    // Check if from warehouse is B2B and to warehouse is pharmacy
    const isFromB2B = fromWh.name.toLowerCase().includes("b2b");
    const isToPharmacy = !toWh.name.toLowerCase().includes("b2b");

    return isFromB2B && isToPharmacy;
  };

  // Calculate converted quantity if needed
  const calculateConvertedQuantity = (
    product: IProduct,
    originalQuantity: number,
  ): {
    quantity: number;
    originalQuantity: number;
    originalUnit: string;
    convertedUnit: string;
    conversionRate: number;
    needsConversion: boolean;
  } => {
    const needsConversion = isB2BToPharmacyTransfer();

    if (!needsConversion || !product.conversion_rate) {
      return {
        quantity: originalQuantity,
        originalQuantity,
        originalUnit: product.wholesale_unit || "Đơn vị",
        convertedUnit: product.retail_unit || "Đơn vị",
        conversionRate: 1,
        needsConversion: false,
      };
    }

    return {
      quantity: originalQuantity * product.conversion_rate,
      originalQuantity,
      originalUnit: product.wholesale_unit || "Thùng",
      convertedUnit: product.retail_unit || "Hộp",
      conversionRate: product.conversion_rate,
      needsConversion: true,
    };
  };

  // Handle product selection from ProductSearchInput
  const handleProductSelect = (product: IProduct | null) => {
    if (!product) return;

    const fromWarehouseId = form.getFieldValue("from_warehouse_id");
    const toWarehouseId = form.getFieldValue("to_warehouse_id");

    if (!fromWarehouseId) {
      notification.warning({
        message: "Thiếu thông tin",
        description: "Vui lòng chọn kho xuất trước",
      });
      return;
    }

    if (!toWarehouseId) {
      notification.warning({
        message: "Thiếu thông tin",
        description: "Vui lòng chọn kho nhận trước khi thêm sản phẩm",
      });
      return;
    }

    // Check stock
    if (!product.stock_quantity || product.stock_quantity <= 0) {
      notification.error({
        message: "Không thể thêm sản phẩm",
        description: `${product.name} đã hết hàng trong kho.`,
        duration: 4,
      });
      return;
    }

    // Set default quantity to 1 (in source warehouse unit)
    const originalQuantity = 1;
    const unit_price = product.retail_price;

    // Calculate converted quantity
    const conversionInfo = calculateConvertedQuantity(
      product,
      originalQuantity,
    );

    // Check if product has lot management enabled
    if (product.enable_lot_management) {
      // Save temp values and open lot selection modal
      setTempUnitPrice(unit_price);
      setTempNotes(undefined);
      setSelectedProductForLot(product);
      setIsLotSelectionModalOpen(true);
      return;
    }

    // If no lot management, add directly
    addItemToList(
      product,
      null,
      conversionInfo.quantity,
      unit_price,
      undefined,
      conversionInfo,
    );

    const quantityDisplay = conversionInfo.needsConversion
      ? `${conversionInfo.originalQuantity} ${conversionInfo.originalUnit} = ${conversionInfo.quantity} ${conversionInfo.convertedUnit}`
      : `${conversionInfo.quantity}`;

    notification.success({
      message: "Đã thêm sản phẩm",
      description: `${product.name} (${quantityDisplay})`,
      duration: 3,
    });
  };

  // Handle lot selection from modal
  const handleLotSelect = (lot: IProductLot, quantity: number) => {
    if (!selectedProductForLot) return;

    // Check if lot has sufficient quantity
    if (lot.quantity < quantity) {
      notification.error({
        message: "Số lượng không đủ",
        description: `Lô ${lot.lot_number} chỉ còn ${lot.quantity} sản phẩm`,
      });
      return;
    }

    // Add item with selected lot
    addItemToList(
      selectedProductForLot,
      lot,
      quantity,
      tempUnitPrice,
      tempNotes,
    );

    notification.success({
      message: "Đã thêm sản phẩm",
      description: `${selectedProductForLot.name} - Lô: ${lot.lot_number} (${quantity})`,
      duration: 2,
    });

    // Close modal and reset
    setIsLotSelectionModalOpen(false);
    setSelectedProductForLot(null);
    resetItemForm();
  };

  // Add item to list (common logic)
  const addItemToList = (
    product: IProduct,
    lot: IProductLot | null,
    quantity: number,
    unit_price?: number,
    notes?: string,
    conversionInfo?: {
      originalQuantity: number;
      originalUnit: string;
      convertedUnit: string;
      conversionRate: number;
      needsConversion: boolean;
    },
  ) => {
    const newItem: TransferItem = {
      key: itemCounter,
      product_id: product.id,
      product_name: product.name,
      product_sku: product.sku,
      lot_id: lot?.id || null,
      lot_number: lot?.lot_number,
      lot_quantity: lot?.quantity, // Store lot quantity
      expiry_date: lot?.expiry_date,
      quantity_requested: quantity,
      unit_price: unit_price || product.retail_price,
      notes,
      // Conversion info
      original_quantity: conversionInfo?.originalQuantity,
      original_unit: conversionInfo?.originalUnit,
      converted_unit: conversionInfo?.convertedUnit,
      conversion_rate: conversionInfo?.conversionRate,
    };

    setItems([...items, newItem]);
    setItemCounter(itemCounter + 1);

    // Reset if not from lot modal
    if (!lot) {
      resetItemForm();
    }
  };

  // Reset item form fields
  const resetItemForm = () => {
    form.setFieldsValue({
      item_product_id: undefined,
      item_quantity: undefined,
      item_unit_price: undefined,
      item_notes: undefined,
    });
    setTempUnitPrice(undefined);
    setTempNotes(undefined);
  };

  // Handle item quantity update in the table
  const handleUpdateItemQuantity = (key: number, newQuantity: number) => {
    const itemToUpdate = items.find((item) => item.key === key);

    if (!itemToUpdate) return;

    // Check against lot quantity if it exists
    if (
      itemToUpdate.lot_quantity !== undefined &&
      newQuantity > itemToUpdate.lot_quantity
    ) {
      notification.error({
        message: "Vượt quá tồn kho của lô",
        description: `Số lượng tồn kho của lô "${itemToUpdate.lot_number}" chỉ còn ${itemToUpdate.lot_quantity}.`,
      });
      return; // Do not update state
    }

    setItems((prevItems) =>
      prevItems.map((item) =>
        item.key === key
          ? { ...item, quantity_requested: newQuantity || 1 }
          : item,
      ),
    );
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

  // Filter items based on search term
  const filteredItems = items.filter((item) => {
    if (!debouncedListFilter) return true;
    const searchLower = debouncedListFilter.toLowerCase();
    return (
      item.product_name?.toLowerCase().includes(searchLower) ||
      item.product_sku?.toLowerCase().includes(searchLower) ||
      item.lot_number?.toLowerCase().includes(searchLower)
    );
  });

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
      render: (value) => value || <Text type="secondary">Không có lô</Text>,
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
      render: (value: number, record: TransferItem) => (
        <InputNumber
          min={1}
          value={value}
          onChange={(newValue) =>
            handleUpdateItemQuantity(record.key, newValue || 1)
          }
        />
      ),
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
        { title: "Kho hàng", href: "/warehouse" },
        { title: "Chuyển kho", href: "/warehouse/transfers" },
        { title: "Tạo mới" },
      ]}
      extra={
        <Space>
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
      <Row
        gutter={24}
        style={{
          height: "calc(100vh - 150px)",
          paddingTop: "16px",
          width: "100%",
        }}
      >
        <Col
          xs={24}
          sm={16}
          md={18}
          style={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
          }}
        >
          <Card
            title={`Danh sách sản phẩm (${items.length})`}
            style={{
              display: "flex",
              flexDirection: "column",
              height: "100%",
              overflow: "hidden",
            }}
            styles={{
              body: {
                flex: 1,
                overflow: "auto",
                display: "flex",
                flexDirection: "column",
              },
            }}
          >
            {/* Product Search */}
            <ProductSearchInput
              ref={productSearchRef}
              size="large"
              onChange={handleProductSelect}
              employeeWarehouse={fromWarehouse}
              placeholder="Tìm kiếm sản phẩm theo tên, SKU, barcode... (hoặc bắt đầu gõ)"
            />
            <div style={{ flex: 1, overflow: "auto", marginTop: 16 }}>
              <Table
                columns={columns}
                dataSource={filteredItems}
                rowKey="key"
                scroll={{ x: 1200 }}
                pagination={false}
                size="small"
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
            </div>
          </Card>
        </Col>

        <Col
          xs={24}
          sm={8}
          md={6}
          style={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
          }}
        >
          <Card
            title="Thông tin chuyển kho"
            style={{
              display: "flex",
              flexDirection: "column",
              height: "100%",
              overflow: "hidden",
            }}
            styles={{
              body: {
                flex: 1,
                overflow: "auto",
                display: "flex",
                flexDirection: "column",
              },
            }}
          >
            <Form form={form} layout="vertical">
              <Row gutter={[16, 16]}>
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
                      onChange={(warehouseId) => {
                        // Update fromWarehouse for ProductSearchInput
                        const warehouse = warehouses.find(
                          (w) => w.id === warehouseId,
                        );
                        setFromWarehouse(warehouse || null);
                      }}
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
                            return Promise.reject(
                              "Kho nhận phải khác kho xuất",
                            );
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
                    <TextArea rows={4} placeholder="Nhập ghi chú" />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </Card>
        </Col>
      </Row>

      {/* Lot Selection Modal */}
      <LotSelectionModal
        open={isLotSelectionModalOpen}
        onClose={() => {
          setIsLotSelectionModalOpen(false);
          setSelectedProductForLot(null);
        }}
        onSelect={handleLotSelect}
        product={selectedProductForLot}
        warehouseId={form.getFieldValue("from_warehouse_id") || null}
      />
    </PageLayout>
  );
};

export default CreateWarehouseTransferPage;
