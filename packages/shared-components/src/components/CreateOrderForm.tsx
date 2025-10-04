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
} from "@nam-viet-erp/store";

import { exportB2BOrderToPdf, formatCurrency } from "../utils";
import ProductSearchInput from "./ProductSearchInput";
import { ColumnsType } from "antd/es/table";

const { Text, Title } = Typography;
const { TextArea } = Input;
const { useBreakpoint } = Grid;

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
  createB2BQuote: (data: any) => Promise<any>;
  addQuoteItem: (data: any) => Promise<any>;
}

const CreateOrderForm: React.FC<CreateOrderFormProps> = ({
  employee,
  onOpenClientSelectModal,
  index,
  onSuccess,
  onNavigateToList,
  createB2BQuote,
  addQuoteItem,
}) => {
  const screens = useBreakpoint();
  const isMobile = !screens.lg;
  const [form] = Form.useForm();
  const selectedClient = useSelectedCustomerByIndex(index);
  const isCreatingOrder = useIsCreatingOrder();

  const orderItems = useOrderItemsByIndex(index);

  const {
    tabs,
    setSelectedCustomerByIndex,
    updateFormDataByIndex,
    createOrder: createStoreOrder,
    updateOrderItemByIndex,
    removeOrderItemByIndex,
    addOrderItemByIndex,
  } = useB2BOrderStore();

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

  // Watch form values to calculate totals
  const discountPercent = Form.useWatch("discount_percent", form) || 0;
  const taxPercent = Form.useWatch("tax_percent", form) || 0;

  // Calculate totals based on order items and form values
  const totals = React.useMemo(() => {
    const subtotal = orderItems.reduce(
      (sum, item) => sum + item.total_price,
      0
    );
    const discountAmount = (subtotal * discountPercent) / 100;
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = (taxableAmount * taxPercent) / 100;
    const totalAmount = taxableAmount + taxAmount;

    return {
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

      // Create order via zustand store
      await createStoreOrder(
        {
          formData: orderData,
          items: orderItems,
        },
        createB2BQuote,
        addQuoteItem
      );

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
      console.error("Error creating order:", err);
      notification.error({
        message: "Lỗi",
        description: err.message || "Không thể lưu đơn hàng. Vui lòng thử lại.",
      });
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
        (item) => item.product_id === product.id
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
          product
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
      width: isMobile ? 150 : "40%",
      fixed: isMobile ? "left" : undefined,
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
      width: isMobile ? 100 : "15%",
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
      width: isMobile ? 80 : "15%",
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
      title: "Đơn vị",
      dataIndex: "unit",
      key: "unit",
      width: isMobile ? 60 : "10%",
      render: (text) => <Text>{text}</Text>,
      responsive: isMobile ? ["lg"] : undefined,
    },
    {
      title: "Thành tiền",
      dataIndex: "total_price",
      key: "total_price",
      width: isMobile ? 100 : "15%",
      render: (value) => (
        <Text strong style={{ color: "#52c41a" }}>
          {formatCurrency(value)}
        </Text>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: isMobile ? 50 : "5%",
      fixed: isMobile ? "right" : undefined,
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
        <Space
          direction={isMobile ? "vertical" : "horizontal"}
          style={{ width: "100%" }}
          size="middle"
        >
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSaveAndSend}
            loading={isCreatingOrder}
            size="large"
            style={isMobile ? { width: "100%" } : {}}
          >
            Gửi đi
          </Button>
          <Button
            type="default"
            icon={<CheckOutlined />}
            onClick={handleSaveAndAccept}
            loading={isCreatingOrder}
            size="large"
            style={isMobile ? { width: "100%" } : {}}
          >
            Chấp nhận
          </Button>
          <Button
            icon={<SaveOutlined />}
            onClick={handleSaveDraft}
            loading={isCreatingOrder}
            size="large"
            style={isMobile ? { width: "100%" } : {}}
          >
            Lưu nháp
          </Button>
          <Button
            icon={<FilePdfOutlined />}
            onClick={handleExportPDF}
            disabled={orderItems.length === 0}
            size="large"
            style={isMobile ? { width: "100%" } : {}}
          >
            Xuất PDF
          </Button>
        </Space>
      </Card>

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
          <Col xs={24} lg={12}>
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
                    width: isMobile ? "40%" : "30%",
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

          <Col xs={24} lg={12}>
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
                <Col xs={24} lg={12}>
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
                    <TextArea
                      rows={7}
                      placeholder="Địa chỉ khách hàng"
                      style={{ height: 150 }}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} lg={12}>
                  <Form.Item name="delivery_address" label="Địa chỉ giao hàng">
                    <TextArea
                      rows={7}
                      style={{ height: 150 }}
                      placeholder="Địa chỉ giao hàng (để trống nếu trùng với địa chỉ khách hàng)"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>

        {/* Order Information */}
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
              <Form.Item name="quote_date" label="Ngày tạo">
                <DatePicker style={{ width: "100%" }} disabled />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="valid_until"
                label="Hạn báo giá"
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
              <Form.Item name="discount_percent" label="Chiết khấu (%)">
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  max={100}
                  placeholder="0"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="tax_percent" label="Thuế (%)">
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  max={100}
                  placeholder="10"
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Row 3: Nhân viên tạo (full screen) */}
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item label="Nhân viên tạo">
                <Input value={employee?.full_name} disabled />
              </Form.Item>
            </Col>
          </Row>

          {/* Row 4: Ghi chú (full screen) */}
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="notes" label="Ghi chú">
                <Input placeholder="Ghi chú cho đơn hàng..." />
              </Form.Item>
            </Col>
          </Row>
        </Card>
      </Form>

      <Row gutter={24}>
        <Col xs={24} lg={12}>
          {/* Order Items */}
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
              scroll={{ x: isMobile ? 600 : 800 }}
              size={isMobile ? "small" : "middle"}
              locale={{
                emptyText:
                  "Chưa có sản phẩm nào được thêm vào đơn hàng. Sử dụng ô tìm kiếm ở trên để thêm sản phẩm.",
              }}
            />
          </Card>
        </Col>
        {/* Order Summary Sidebar */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <DollarOutlined />
                Tổng kết Đơn hàng
              </Space>
            }
            style={{ position: isMobile ? "static" : "sticky", top: 24 }}
          >
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Số lượng sản phẩm">
                <Text strong>{totals.itemCount}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Tổng số lượng">
                <Text strong>{totals.totalQuantity}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Tạm tính">
                <Text>{formatCurrency(totals.subtotal)}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Chiết khấu">
                <Text>-{formatCurrency(totals.discountAmount)}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Thuế">
                <Text>+{formatCurrency(totals.taxAmount)}</Text>
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
