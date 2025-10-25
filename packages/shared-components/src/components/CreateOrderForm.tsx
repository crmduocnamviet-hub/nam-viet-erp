import React, { useEffect } from "react";
import {
  Card,
  Form,
  Input,
  DatePicker,
  Button,
  Row,
  Col,
  Typography,
  Space,
  InputNumber,
  Tag,
  Table,
  Grid,
  Descriptions,
  notification,
  Select,
} from "antd";
import {
  UserOutlined,
  HomeOutlined,
  CalendarOutlined,
  CheckOutlined,
  DollarOutlined,
  FilePdfOutlined,
  SaveOutlined,
  SendOutlined,
  ShoppingCartOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import B2BCustomerSearchInput from "./B2BCustomerSearchInput";
import {
  QuoteStage,
  useB2BOrderStore,
  useIsCreatingOrder,
  useOrderItemsByIndex,
  useSelectedCustomerByIndex,
  useCreateB2BQuoteHandler,
} from "@nam-viet-erp/store";

import { exportB2BOrderToPdf, formatCurrency } from "../utils";
import ProductSearchInput from "./ProductSearchInput";
import { ColumnsType } from "antd/es/table";

const { Text, Title } = Typography;
const { TextArea } = Input;
const { useBreakpoint } = Grid;

// VAT percentage options
const VAT_OPTIONS = [
  { label: "0%", value: 0 },
  { label: "1%", value: 1 },
  { label: "2%", value: 2 },
  { label: "3%", value: 3 },
  { label: "5%", value: 5 },
];

interface Employee {
  employee_id: string;
  full_name: string;
  employee_code: string;
}

interface CreateOrderFormProps {
  employee?: Employee | null;
  onOpenClientSelectModal: () => void;
  index: number;
  onSuccess?: () => void;
  onNavigateToList?: () => void;
}

const CreateOrderForm: React.FC<CreateOrderFormProps> = ({
  employee,
  onOpenClientSelectModal,
  index,
  onSuccess,
  onNavigateToList,
}) => {
  const screens = useBreakpoint();
  const isMd = screens.md;
  const [form] = Form.useForm();
  const selectedClient = useSelectedCustomerByIndex(index);
  const isCreatingOrder = useIsCreatingOrder();
  const productSearchRef = React.useRef<any>(null);

  const orderItems = useOrderItemsByIndex(index);

  const {
    tabs,
    setSelectedCustomerByIndex,
    updateFormDataByIndex,
    updateOrderItemByIndex,
    removeOrderItemByIndex,
    addOrderItemByIndex,
    updateTabTitle,
  } = useB2BOrderStore();

  // Use the new useCreateB2BQuoteHandler hook
  const { submit: createOrder } = useCreateB2BQuoteHandler({
    onError: (error) => {
      notification.error({
        message: "Lỗi tạo đơn hàng",
        description:
          error.message || "Không thể tạo đơn hàng. Vui lòng thử lại.",
      });
    },
    onSuccess: () => {
      // Success notification is handled in handleCreateOrderWithStatus
      // This callback is mainly for refetching data if needed
    },
  });

  React.useEffect(() => {
    if (selectedClient) {
      form.setFieldsValue({
        customer_id: selectedClient.customer_id,
        customer_name: selectedClient.customer_name,
        customer_code: selectedClient.customer_code,
        customer_phone: selectedClient.phone_number,
        customer_email: selectedClient.email || "",
        contact_person:
          selectedClient.contact_person || selectedClient.customer_name,
        customer_address: selectedClient.address || "",
      });
    }
  }, [selectedClient]);

  // Update tab title when customer is selected
  React.useEffect(() => {
    const currentTab = tabs[index];
    if (selectedClient && currentTab) {
      const newTitle = `${selectedClient.customer_name}-${selectedClient.phone_number || selectedClient.customer_code}`;
      updateTabTitle(currentTab.id, newTitle);
    }
  }, [selectedClient, tabs, index, updateTabTitle]);

  // State for discount and tax to ensure proper re-rendering
  const [discountPercent, setDiscountPercent] = React.useState(0);
  const [taxPercent, setTaxPercent] = React.useState(10);

  // Sync form values with state when tab data is loaded
  React.useEffect(() => {
    const currentTab = tabs[index];
    if (currentTab?.formData) {
      const discount = currentTab.formData.discount_percent ?? 0;
      const tax = currentTab.formData.tax_percent ?? 10;
      setDiscountPercent(discount);
      setTaxPercent(tax);
    }
  }, [tabs, index]);

  // Auto-focus product search when typing
  React.useEffect(() => {
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

  // Calculate totals based on order items and form values
  const totals = React.useMemo(() => {
    // Subtotal without VAT
    const subtotalBeforeVAT = orderItems.reduce(
      (sum, item) => sum + item.total_price,
      0,
    );

    // Total VAT from all products
    const totalVAT = orderItems.reduce((sum, item) => {
      const vatPercent = item.vat_percent ?? 5;
      return sum + (item.total_price * vatPercent) / 100;
    }, 0);

    // Subtotal with VAT
    const subtotal = subtotalBeforeVAT + totalVAT;

    // Discount applied to subtotal (with VAT)
    const discountAmount = (subtotal * discountPercent) / 100;
    const taxableAmount = subtotal - discountAmount;

    // Tax applied after discount
    const taxAmount = (taxableAmount * taxPercent) / 100;
    const totalAmount = taxableAmount + taxAmount;

    return {
      subtotalBeforeVAT,
      totalVAT,
      subtotal,
      discountAmount,
      taxAmount,
      totalAmount,
      itemCount: orderItems.length,
      totalQuantity: orderItems.reduce((sum, item) => sum + item.quantity, 0),
    };
  }, [orderItems, discountPercent, taxPercent]);

  // Handle client selection
  const handleSelectClient = (client: IB2BCustomer) => {
    // Type assertion since IB2BCustomer is compatible with store Customer type
    setSelectedCustomerByIndex(index, client as any);
    // Auto-fill form with B2B customer information
    form.setFieldsValue({
      customer_id: client.customer_id,
      customer_name: client.customer_name,
      customer_code: client.customer_code,
      customer_phone: client.phone_number,
      customer_email: client.email || "",
      contact_person: client.contact_person || client.customer_name,
      customer_address: client.address || "",
    });
  };

  const handleFormValuesChange = (_: any, allValues: any) => {
    updateFormDataByIndex(index, allValues);
  };

  // Export to PDF
  const handleExportPDF = () => {
    const values = form.getFieldsValue();

    const result = exportB2BOrderToPdf(orderItems, totals, values, employee);

    if (result.success) {
      notification.success({
        message: "Xuất PDF",
        description:
          "Đã mở hộp thoại in. Vui lòng chọn 'Save as PDF' để lưu file.",
      });
    } else {
      notification.error({
        message: result.error?.includes("sản phẩm")
          ? "Không có sản phẩm"
          : "Lỗi xuất PDF",
        description: result.error || "Không thể xuất PDF. Vui lòng thử lại.",
      });
    }
  };

  // Generic function to create order with specific status
  const handleCreateOrderWithStatus = async (quoteStage: QuoteStage) => {
    try {
      const values = await form.validateFields([
        "customer_name",
        "customer_phone",
        "customer_address",
      ]);

      if (orderItems.length === 0) {
        notification.error({
          message: "Thiếu sản phẩm",
          description: "Vui lòng thêm ít nhất một sản phẩm vào đơn hàng",
        });
        return;
      }

      if (!employee?.employee_id) {
        notification.error({
          message: "Lỗi",
          description:
            "Không tìm thấy thông tin nhân viên. Vui lòng đăng nhập lại.",
        });
        return;
      }

      // Prepare order data for zustand store
      const orderData = {
        b2b_customer_id: selectedClient?.customer_id || "",
        customer_name: values.customer_name,
        customer_code: values.customer_code || undefined,
        customer_phone: values.customer_phone,
        customer_email: values.customer_email || undefined,
        customer_address: values.customer_address,
        delivery_address: values.delivery_address || undefined,
        quote_date: dayjs().format("YYYY-MM-DD"),
        valid_until: values.valid_until
          ? dayjs(values.valid_until).format("YYYY-MM-DD")
          : dayjs().add(30, "days").format("YYYY-MM-DD"),
        discount_percent: values.discount_percent || 0,
        tax_percent: values.tax_percent || 10,
        notes: values.notes || undefined,
        created_by_employee_id: employee.employee_id,
        quote_stage: quoteStage, // Set the status
      };

      // Create order via useCreateB2BQuoteHandler hook
      await createOrder({
        quoteData: orderData,
        orderItems: orderItems,
      });

      // Show success notification based on status
      const statusMessages: Record<QuoteStage, string> = {
        draft: "Đã lưu nháp báo giá thành công!",
        accepted: "Đã tạo và chấp nhận báo giá thành công!",
        sent: "Đã tạo và gửi báo giá thành công!",
      };

      notification.success({
        message: "Thành công",
        description: statusMessages[quoteStage],
        duration: 5,
      });

      // Show preview modal
      onSuccess?.();

      // Reset form
      form.resetFields();

      // Navigate back to list if only 1 tab remains
      if (tabs.length === 1 && onNavigateToList) {
        onNavigateToList();
      }
    } catch (err: any) {
      // Error notification is handled by the hook's onError callback
      console.error("Error creating order:", err);
    }
  };

  // Save draft order
  const handleSaveDraft = async () => {
    await handleCreateOrderWithStatus("draft");
  };

  // Save and accept order
  const handleSaveAndAccept = async () => {
    await handleCreateOrderWithStatus("accepted");
  };

  // Save and send order
  const handleSaveAndSend = async () => {
    await handleCreateOrderWithStatus("sent");
  };

  // Update order item using store
  const handleUpdateItem = (key: string, field: string, value: number) => {
    const item = orderItems.find((i) => i.key === key);
    if (!item) return;

    const updates: Partial<IB2BQuoteItem> = { [field]: value };

    if (field === "quantity" || field === "unit_price") {
      const quantity = field === "quantity" ? value : item.quantity;
      const unit_price = field === "unit_price" ? value : item.unit_price;
      updates.total_price = quantity * unit_price;
    }

    updateOrderItemByIndex(index, key, updates);
  };

  // Remove order item using store
  const handleRemoveItem = (key: string) => {
    removeOrderItemByIndex(index, key);
  };

  // Add products to order (supports both single product and array)
  const handleAddProducts = (products: IProduct | IProduct[]) => {
    const productArray = Array.isArray(products) ? products : [products];
    const newItems: IB2BQuoteItem[] = [];
    const updatedItems: string[] = [];

    productArray.forEach((product, index) => {
      // Check if product already exists in order
      const existingItem = orderItems.find(
        (item) => item.product_id === product.id,
      );

      if (existingItem) {
        // Increase quantity of existing product using store
        const newQuantity = existingItem.quantity + 1;
        updateOrderItemByIndex(index, existingItem.key, {
          quantity: newQuantity,
          total_price: newQuantity * existingItem.unit_price,
        });
        updatedItems.push(existingItem.product_name);
        return;
      }

      // Validate product_id is a valid number
      if (!product.id || typeof product.id !== "number") {
        console.error(
          "Invalid product id when adding product:",
          product.id,
          product,
        );
        return;
      }

      // Add new product
      newItems.push({
        key: `${product.id}_${Date.now()}_${index}`,
        product_id: product.id,
        product_name: product.name,
        unit_price: product.wholesale_price || 0,
        quantity: 1,
        total_price: product.wholesale_price || 0,
        packaging: product.packaging,
        unit: product.unit || "Hộp",
        vat_percent: product.vat_percent ?? 5, // Use product's VAT or default to 5%
      } as never);
    });

    // Add new items to order using store
    newItems.forEach((item) => addOrderItemByIndex(index, item));

    // Show appropriate notification
    if (newItems.length > 0 && updatedItems.length > 0) {
      notification?.success({
        message: "Thêm sản phẩm thành công",
        description: `Đã thêm ${newItems.length} sản phẩm mới và tăng số lượng ${updatedItems.length} sản phẩm có sẵn`,
      });
    } else if (newItems.length > 0) {
      notification?.success({
        message: "Thêm sản phẩm thành công",
        description: `Đã thêm ${newItems.length} sản phẩm vào đơn hàng`,
      });
    } else if (updatedItems.length > 0) {
      notification?.success({
        message: "Cập nhật số lượng thành công",
        description: `Đã tăng số lượng cho ${updatedItems.join(", ")}`,
      });
    }
  };

  // Order items table columns
  const orderColumns: ColumnsType<IB2BQuoteItem> = [
    {
      title: "Sản phẩm",
      dataIndex: "product_name",
      key: "product_name",
      width: isMd ? 150 : "40%",
      fixed: isMd ? "left" : undefined,
      render: (text, record) => (
        <div>
          <Text strong>{text}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: "12px" }}>
            {record.packaging}
          </Text>
        </div>
      ),
    },
    {
      title: "Đơn giá",
      dataIndex: "unit_price",
      key: "unit_price",
      width: isMd ? 100 : "15%",
      render: (value, record) => (
        <InputNumber
          value={value}
          onChange={(val) =>
            handleUpdateItem(record.key, "unit_price", val || 0)
          }
          formatter={(value) =>
            `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
          }
          parser={(value) => value!.replace(/\$\s?|(,*)/g, "")}
          style={{ width: "100%" }}
          min={0}
        />
      ),
    },
    {
      title: "Số lượng",
      dataIndex: "quantity",
      key: "quantity",
      width: isMd ? 80 : "15%",
      render: (value, record) => (
        <InputNumber
          value={value}
          onChange={(val) => handleUpdateItem(record.key, "quantity", val || 1)}
          style={{ width: "100%" }}
          min={1}
        />
      ),
    },
    {
      title: "VAT (%)",
      dataIndex: "vat_percent",
      key: "vat_percent",
      width: isMd ? 90 : "12%",
      render: (value, record) => (
        <Select
          value={value ?? 5}
          onChange={(val) => handleUpdateItem(record.key, "vat_percent", val)}
          style={{ width: "100%" }}
          options={VAT_OPTIONS}
        />
      ),
    },
    {
      title: "Đơn vị",
      dataIndex: "unit",
      key: "unit",
      width: isMd ? 60 : "10%",
      render: (text) => <Text>{text}</Text>,
      responsive: isMd ? ["lg"] : undefined,
    },
    {
      title: "Thành tiền",
      dataIndex: "total_price",
      key: "total_price",
      width: isMd ? 100 : "15%",
      render: (value) => (
        <Text strong style={{ color: "#52c41a" }}>
          {formatCurrency(value)}
        </Text>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: isMd ? 50 : "5%",
      fixed: isMd ? "right" : undefined,
      render: (_, record) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleRemoveItem(record.key)}
          size="small"
        />
      ),
    },
  ];

  return (
    <div>
      {/* Action Buttons - Pinned to Top */}
      <Card
        style={{
          marginBottom: 16,
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <Row gutter={[8, 8]}>
          <Col>
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSaveAndSend}
              loading={isCreatingOrder}
              size="large"
            >
              {!screens.xs && "Gửi đi"}
            </Button>
          </Col>
          <Col>
            <Button
              type="default"
              icon={<CheckOutlined />}
              onClick={handleSaveAndAccept}
              loading={isCreatingOrder}
              size="large"
            >
              {!screens.xs && "Chấp nhận"}
            </Button>
          </Col>
          <Col>
            <Button
              icon={<SaveOutlined />}
              onClick={handleSaveDraft}
              loading={isCreatingOrder}
              size="large"
            >
              {!screens.xs && "Lưu nháp"}
            </Button>
          </Col>
          <Col>
            <Button
              icon={<FilePdfOutlined />}
              onClick={handleExportPDF}
              disabled={orderItems.length === 0}
              size="large"
            >
              {!screens.xs && "Xuất PDF"}
            </Button>
          </Col>
        </Row>
      </Card>

      <Row gutter={24}>
        {/* Order Items - Left Position */}
        <Col xs={24} md={12}>
          <Card
            title={
              <Space>
                <ShoppingCartOutlined />
                Danh sách Sản phẩm ({orderItems.length} sản phẩm)
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            {/* Product Search Input */}
            <div style={{ marginBottom: 16 }}>
              <ProductSearchInput
                ref={productSearchRef}
                onChange={(product) => {
                  if (product) {
                    handleAddProducts([product]);
                  }
                }}
                placeholder="Tìm kiếm sản phẩm B2B theo tên, SKU, nhà sản xuất..."
                size="large"
                style={{ width: "100%" }}
                debounceDelay={200}
              />
            </div>

            <Table
              columns={orderColumns}
              dataSource={orderItems}
              pagination={false}
              scroll={{ x: isMd ? 600 : 800 }}
              size={isMd ? "small" : "middle"}
              locale={{
                emptyText:
                  "Chưa có sản phẩm nào được thêm vào đơn hàng. Sử dụng ô tìm kiếm ở trên để thêm sản phẩm.",
              }}
            />
          </Card>
        </Col>

        <Col xs={24} md={6}>
          <Form
            form={form}
            layout="vertical"
            onValuesChange={handleFormValuesChange}
            initialValues={{
              quote_date: dayjs(),
              valid_until: dayjs().add(30, "days"),
              discount_percent: 0,
              tax_percent: 10,
            }}
          >
            <Row gutter={16}>
              <Col xs={24}>
                {/* Client Information */}
                <Card
                  title={
                    <Space>
                      <UserOutlined />
                      Thông tin Khách hàng
                      {selectedClient && (
                        <Tag color="green">
                          Đã chọn: {selectedClient.customer_name}
                        </Tag>
                      )}
                    </Space>
                  }
                  style={{ marginBottom: 16 }}
                >
                  {/* B2B Customer Search Input */}
                  <Row gutter={16} style={{ marginBottom: 16 }}>
                    <Col span={24}>
                      <B2BCustomerSearchInput
                        value={selectedClient}
                        onChange={(customer: IB2BCustomer | null) => {
                          if (customer) {
                            handleSelectClient(customer);
                          } else {
                            setSelectedCustomerByIndex(index, null);
                          }
                        }}
                        placeholder="Tìm kiếm khách hàng B2B theo tên, mã, số điện thoại..."
                        size="large"
                        style={{ width: "100%" }}
                      />
                      <Text
                        type="secondary"
                        style={{ fontSize: 12, marginTop: 8, display: "block" }}
                      >
                        Hoặc
                        <Button
                          type="link"
                          size="small"
                          style={{ padding: 0, fontSize: 12, marginLeft: 4 }}
                          onClick={onOpenClientSelectModal}
                        >
                          chọn từ danh sách tất cả khách hàng B2B
                        </Button>
                      </Text>
                    </Col>
                  </Row>

                  <Table
                    dataSource={[
                      {
                        key: "1",
                        label: "Đơn vị mua",
                        value: selectedClient?.customer_name,
                      },
                      {
                        key: "2",
                        label: "Mã khách hàng",
                        value: selectedClient?.customer_code,
                      },
                      {
                        key: "3",
                        label: "Tên Chủ sở hữu",
                        value:
                          selectedClient?.contact_person ||
                          selectedClient?.customer_name,
                      },
                      {
                        key: "4",
                        label: "Số điện thoại",
                        value: selectedClient?.phone_number,
                      },
                    ]}
                    columns={[
                      {
                        title: "",
                        dataIndex: "label",
                        key: "label",
                        width: isMd ? "40%" : "30%",
                        render: (text) => (
                          <div
                            style={{
                              backgroundColor: "#f4f4f4",
                              padding: "8px",
                              margin: "-8px",
                            }}
                          >
                            <Text strong>{text}</Text>
                          </div>
                        ),
                      },
                      {
                        title: "",
                        dataIndex: "value",
                        key: "value",
                        render: (text) => <Text>{text}</Text>,
                      },
                    ]}
                    pagination={false}
                    showHeader={false}
                    size="small"
                    bordered
                    style={{ marginBottom: 16 }}
                  />

                  {/* Hidden form fields for form validation */}
                  {selectedClient && (
                    <div style={{ display: "none" }}>
                      <Form.Item
                        name="customer_name"
                        rules={[
                          {
                            required: true,
                            message: "Vui lòng chọn khách hàng từ danh sách",
                          },
                        ]}
                      >
                        <Input />
                      </Form.Item>
                      <Form.Item
                        name="customer_phone"
                        rules={[
                          {
                            required: true,
                            message: "Vui lòng chọn khách hàng từ danh sách",
                          },
                        ]}
                      >
                        <Input />
                      </Form.Item>
                    </div>
                  )}
                </Card>
              </Col>

              <Col xs={24}>
                {/* Address Information */}
                <Card
                  title={
                    <Space>
                      <HomeOutlined />
                      Địa chỉ
                    </Space>
                  }
                  style={{ marginBottom: 16, height: 365 }}
                >
                  <Row gutter={16}>
                    <Col xs={24}>
                      <Form.Item
                        name="customer_address"
                        label="Địa chỉ khách hàng"
                        rules={[
                          {
                            required: true,
                            message: "Vui lòng nhập địa chỉ khách hàng",
                          },
                        ]}
                      >
                        <TextArea rows={3} placeholder="Địa chỉ khách hàng" />
                      </Form.Item>
                    </Col>
                    <Col xs={24}>
                      <Form.Item
                        name="delivery_address"
                        label="Địa chỉ giao hàng"
                      >
                        <TextArea
                          rows={3}
                          placeholder="Địa chỉ giao hàng (để trống nếu trùng với địa chỉ khách hàng)"
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>
              </Col>
            </Row>
          </Form>
        </Col>

        {/* Order Summary Sidebar */}
        <Col xs={24} md={6}>
          <Card
            title={
              <Space>
                <CalendarOutlined />
                Thông tin Đơn hàng
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            {/* Row 1: Ngày tạo and Hạn báo giá */}
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item name="quote_date" label="Ngày tạo" layout="vertical">
                  <DatePicker style={{ width: "100%" }} disabled />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="valid_until"
                  label="Hạn báo giá"
                  layout="vertical"
                  rules={[
                    { required: true, message: "Vui lòng chọn ngày hết hạn" },
                  ]}
                >
                  <DatePicker
                    style={{ width: "100%" }}
                    placeholder="Chọn ngày hết hạn"
                  />
                </Form.Item>
              </Col>
            </Row>

            {/* Row 2: Chiết khấu and Thuế */}
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="discount_percent"
                  layout="vertical"
                  label="Chiết khấu (%)"
                >
                  <InputNumber
                    style={{ width: "100%" }}
                    min={0}
                    max={100}
                    placeholder="0"
                    onChange={(value) => setDiscountPercent(value || 0)}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="tax_percent"
                  layout="vertical"
                  label="Thuế (%)"
                >
                  <InputNumber
                    style={{ width: "100%" }}
                    min={0}
                    max={100}
                    placeholder="10"
                    onChange={(value) => setTaxPercent(value || 10)}
                  />
                </Form.Item>
              </Col>
            </Row>
            {/* Row 4: Ghi chú (full screen) */}
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item name="notes" layout="vertical" label="Ghi chú">
                  <TextArea rows={5} placeholder="Ghi chú cho đơn hàng..." />
                </Form.Item>
              </Col>
            </Row>
          </Card>
          <Card
            title={
              <Space>
                <DollarOutlined />
                Tổng kết Đơn hàng
              </Space>
            }
            style={{ position: isMd ? "static" : "sticky", top: 24 }}
          >
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Số lượng sản phẩm">
                <Text strong>{totals.itemCount}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Tổng số lượng">
                <Text strong>{totals.totalQuantity}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Tạm tính (chưa VAT)">
                <Text>{formatCurrency(totals.subtotalBeforeVAT)}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="VAT">
                <Text style={{ color: "#1890ff" }}>
                  +{formatCurrency(totals.totalVAT)}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Tổng sau VAT">
                <Text strong>{formatCurrency(totals.subtotal)}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Chiết khấu">
                <Text style={{ color: "#ff4d4f" }}>
                  -{formatCurrency(totals.discountAmount)}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Thuế">
                <Text style={{ color: "#1890ff" }}>
                  +{formatCurrency(totals.taxAmount)}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Tổng cộng">
                <Title level={4} style={{ color: "#52c41a", margin: 0 }}>
                  {formatCurrency(totals.totalAmount)}
                </Title>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default CreateOrderForm;
