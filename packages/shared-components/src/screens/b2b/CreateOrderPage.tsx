import React, { useState } from "react";
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
  Table,
  InputNumber,
  Divider,
  Tag,
  Modal,
  App,
  Descriptions,
  Grid,
} from "antd";
import {
  DeleteOutlined,
  SaveOutlined,
  SendOutlined,
  UserOutlined,
  HomeOutlined,
  ShoppingCartOutlined,
  CalendarOutlined,
  DollarOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { createB2BQuote, addQuoteItem } from "@nam-viet-erp/services";
import {
  B2BCustomerSearchModal,
  B2BCustomerSearchInput,
  ProductSearchInput,
} from "@nam-viet-erp/shared-components";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface Product {
  id: number;
  name: string;
  wholesale_price: number;
  packaging?: string;
  manufacturer?: string;
  image_url?: string;
  unit?: string;
  sku?: string;
}

interface OrderItem {
  key: string;
  product_id: number;
  product_name: string;
  unit_price: number;
  quantity: number;
  total_price: number;
  packaging?: string;
  unit?: string;
}

interface Employee {
  employee_id: string;
  full_name: string;
  employee_code: string;
}

interface CreateOrderPageProps {
  employee?: Employee | null;
}

const { useBreakpoint } = Grid; // <-- "Mắt thần" theo dõi kích thước màn hình

const CreateOrderPage: React.FC<CreateOrderPageProps> = ({ employee }) => {
  const { notification } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [orderSummary, setOrderSummary] = useState<any>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [clientSelectVisible, setClientSelectVisible] = useState(false);
  const [selectedClient, setSelectedClient] = useState<IB2BCustomer | null>(
    null
  );
  const screens = useBreakpoint(); // Lấy thông tin màn hình hiện tại
  const isMobile = !screens.lg; // Coi là mobile nếu màn hình nhỏ hơn 'lg'

  // Handle client selection
  const handleSelectClient = (client: IB2BCustomer) => {
    setSelectedClient(client);
    // Auto-fill form with B2B customer information
    form.setFieldsValue({
      customer_name: client.customer_name,
      customer_code: client.customer_code,
      customer_phone: client.phone_number,
      customer_email: client.email || "",
      contact_person: client.contact_person || client.customer_name,
      customer_address: client.address || "",
    });
  };

  // Calculate totals
  const calculateTotals = () => {
    const subtotal = orderItems.reduce(
      (sum, item) => sum + item.total_price,
      0
    );
    const discountPercent = form.getFieldValue("discount_percent") || 0;
    const taxPercent = form.getFieldValue("tax_percent") || 0;

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
  };

  // Add products to order (supports both single product and array)
  const handleAddProducts = (products: Product | Product[]) => {
    const productArray = Array.isArray(products) ? products : [products];

    const newItems: OrderItem[] = productArray
      .map((product, index) => {
        // Check if product already exists in order
        const existingItem = orderItems.find(
          (item) => item.product_id === product.id
        );
        if (existingItem) {
          notification.warning({
            message: "Sản phẩm đã tồn tại",
            description: `Sản phẩm "${product.name}" đã có trong đơn hàng. Vui lòng tăng số lượng nếu cần.`,
          });
          return null;
        }

        // Validate product_id is a valid number
        if (!product.id || typeof product.id !== "number") {
          console.error(
            "Invalid product id when adding product:",
            product.id,
            product
          );
          notification.error({
            message: "Lỗi sản phẩm",
            description: `Sản phẩm "${product.name}" có ID không hợp lệ: ${product.id}`,
          });
          return null;
        }

        return {
          key: `${product.id}_${Date.now()}_${index}`,
          product_id: product.id,
          product_name: product.name,
          unit_price: product.wholesale_price || 0,
          quantity: 1,
          total_price: product.wholesale_price || 0,
          packaging: product.packaging,
          unit: product.unit || "Hộp",
        };
      })
      .filter((item) => item !== null) as OrderItem[];

    if (newItems.length > 0) {
      setOrderItems((prev) => [...prev, ...newItems]);
      notification.success({
        message: "Thêm sản phẩm thành công",
        description: `Đã thêm ${newItems.length} sản phẩm vào đơn hàng`,
      });
    }
  };

  // Update order item
  const handleUpdateItem = (key: string, field: string, value: number) => {
    setOrderItems((prev) =>
      prev.map((item) => {
        if (item.key === key) {
          const updatedItem = { ...item, [field]: value };
          if (field === "quantity" || field === "unit_price") {
            updatedItem.total_price =
              updatedItem.quantity * updatedItem.unit_price;
          }
          return updatedItem;
        }
        return item;
      })
    );
  };

  // Remove order item
  const handleRemoveItem = (key: string) => {
    setOrderItems((prev) => prev.filter((item) => item.key !== key));
  };

  // Save draft order
  const handleSaveDraft = async () => {
    try {
      const values = await form.validateFields([
        "customer_name",
        "customer_phone",
        "customer_address",
      ]);

      if (orderItems.length === 0) {
        notification.warning({
          message: "Cảnh báo",
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

      setLoading(true);
      const totals = calculateTotals();

      // Prepare quote data for database
      const quoteData = {
        customer_name: values.customer_name,
        customer_code: values.customer_code || null,
        customer_contact_person: values.contact_person || null,
        customer_phone: values.customer_phone,
        customer_email: values.customer_email || null,
        customer_address: values.customer_address,
        quote_stage: "draft" as const,
        total_value: totals.totalAmount,
        subtotal: totals.subtotal,
        discount_percent: values.discount_percent || 0,
        discount_amount: totals.discountAmount,
        tax_percent: values.tax_percent || 0,
        tax_amount: totals.taxAmount,
        quote_date: dayjs().format("YYYY-MM-DD"),
        valid_until: values.valid_until
          ? dayjs(values.valid_until).format("YYYY-MM-DD")
          : dayjs().add(30, "days").format("YYYY-MM-DD"),
        notes: values.notes || null,
        terms_conditions: values.terms_conditions || null,
        created_by_employee_id: employee?.employee_id || null,
      };

      // First, create the quote in database
      const { data: newQuote, error: quoteError } = await createB2BQuote(
        quoteData
      );

      if (quoteError || !newQuote) {
        throw new Error(quoteError?.message || "Không thể tạo báo giá");
      }

      // Then, add all quote items to database
      const quoteItemPromises = orderItems.map(async (item) => {
        if (!item.product_id || typeof item.product_id !== "number") {
          console.error(
            "Invalid product_id:",
            item.product_id,
            "for item:",
            item.product_name
          );
          throw new Error(`Invalid product ID: ${item.product_id}`);
        }

        const itemData = {
          quote_id: newQuote.quote_id,
          product_id: item.product_id, // Already a number
          product_name: item.product_name,
          product_sku: null, // Can be enhanced later if needed
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount_percent: 0, // Default, can be enhanced later
          discount_amount: 0,
          subtotal: item.total_price,
          notes: null,
        };

        return addQuoteItem(itemData);
      });

      // Wait for all items to be saved
      const itemResults = await Promise.all(quoteItemPromises);
      const failedItems = itemResults.filter((result) => result.error);

      if (failedItems.length > 0) {
        console.error("Some items failed to save:", failedItems);
        notification.warning({
          message: "Cảnh báo",
          description: `Đã lưu báo giá nhưng ${failedItems.length} sản phẩm không thể lưu. Vui lòng kiểm tra lại.`,
        });
      }

      // Prepare order summary for preview
      setOrderSummary({
        ...quoteData,
        quote_id: newQuote.quote_id,
        quote_number: newQuote.quote_number,
        created_at: dayjs().format("DD/MM/YYYY HH:mm"),
        totals,
        items: orderItems,
      });

      notification.success({
        message: "Thành công",
        description: `Đã lưu nháp báo giá ${newQuote.quote_number} thành công! Sales staff có thể cập nhật và thay đổi trạng thái khi cần.`,
        duration: 5,
      });

      setPreviewVisible(true);

      // Reset form and items for next order
      form.resetFields();
      setOrderItems([]);
      setSelectedClient(null);
    } catch (error: any) {
      console.error("Error saving draft:", error);
      notification.error({
        message: "Lỗi lưu nháp",
        description:
          error.message || "Không thể lưu nháp báo giá. Vui lòng thử lại.",
        duration: 6,
      });
    } finally {
      setLoading(false);
    }
  };

  // Send order
  const handleSendOrder = async () => {
    try {
      const values = await form.validateFields([
        "customer_name",
        "customer_phone",
        "customer_address",
      ]);

      if (orderItems.length === 0) {
        notification.warning({
          message: "Cảnh báo",
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

      setLoading(true);
      const totals = calculateTotals();

      // Prepare quote data for database with "sent" status
      const quoteData = {
        customer_name: values.customer_name,
        customer_code: values.customer_code || null,
        customer_contact_person: values.contact_person || null,
        customer_phone: values.customer_phone,
        customer_email: values.customer_email || null,
        customer_address: values.customer_address,
        quote_stage: "sent" as const, // Mark as sent instead of draft
        total_value: totals.totalAmount,
        subtotal: totals.subtotal,
        discount_percent: values.discount_percent || 0,
        discount_amount: totals.discountAmount,
        tax_percent: values.tax_percent || 0,
        tax_amount: totals.taxAmount,
        quote_date: dayjs().format("YYYY-MM-DD"),
        valid_until: values.valid_until
          ? dayjs(values.valid_until).format("YYYY-MM-DD")
          : dayjs().add(30, "days").format("YYYY-MM-DD"),
        notes: values.notes || null,
        terms_conditions: values.terms_conditions || null,
        created_by_employee_id: employee?.employee_id || null,
      };

      // Create the quote in database
      const { data: newQuote, error: quoteError } = await createB2BQuote(
        quoteData
      );

      if (quoteError || !newQuote) {
        throw new Error(quoteError?.message || "Không thể tạo báo giá");
      }

      // Add all quote items to database
      const quoteItemPromises = orderItems.map(async (item) => {
        if (!item.product_id || typeof item.product_id !== "number") {
          console.error(
            "Invalid product_id:",
            item.product_id,
            "for item:",
            item.product_name
          );
          throw new Error(`Invalid product ID: ${item.product_id}`);
        }

        const itemData = {
          quote_id: newQuote.quote_id,
          product_id: item.product_id, // Already a number
          product_name: item.product_name,
          product_sku: null,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount_percent: 0,
          discount_amount: 0,
          subtotal: item.total_price,
          notes: null,
        };

        return addQuoteItem(itemData);
      });

      const itemResults = await Promise.all(quoteItemPromises);
      const failedItems = itemResults.filter((result) => result.error);

      if (failedItems.length > 0) {
        console.error("Some items failed to save:", failedItems);
        notification.warning({
          message: "Cảnh báo",
          description: `Đã gửi báo giá nhưng ${failedItems.length} sản phẩm không thể lưu. Vui lòng kiểm tra lại.`,
        });
      }

      // Prepare order summary for preview
      setOrderSummary({
        ...quoteData,
        quote_id: newQuote.quote_id,
        quote_number: newQuote.quote_number,
        created_at: dayjs().format("DD/MM/YYYY HH:mm"),
        totals,
        items: orderItems,
      });

      notification.success({
        message: "Thành công",
        description: `Đã gửi báo giá ${newQuote.quote_number} cho khách hàng! Sales staff có thể theo dõi và cập nhật trạng thái báo giá.`,
        duration: 5,
      });

      setPreviewVisible(true);

      // Reset form and items for next order
      form.resetFields();
      setOrderItems([]);
      setSelectedClient(null);
    } catch (error: any) {
      console.error("Error sending order:", error);
      notification.error({
        message: "Lỗi gửi báo giá",
        description:
          error.message || "Không thể gửi báo giá. Vui lòng thử lại.",
        duration: 6,
      });
    } finally {
      setLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Order items table columns
  const orderColumns: ColumnsType<OrderItem> = [
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

  const totals = calculateTotals();

  return (
    <div
      style={{
        padding: "24px",
        minHeight: "100vh",
      }}
    >
      <Row
        justify="space-between"
        align="middle"
        style={{ marginBottom: isMobile ? 16 : 24 }}
      >
        <Col>
          <Title level={isMobile ? 3 : 2} style={{ margin: 0 }}>
            🛒 Tạo Báo Giá / Đơn Hàng B2B
          </Title>
          <Text
            type="secondary"
            style={{ fontSize: isMobile ? "14px" : "16px" }}
          >
            Tạo báo giá và đơn hàng chi tiết cho khách hàng bán buôn
          </Text>
        </Col>
      </Row>

      <Row gutter={24}>
        <Col xs={24} lg={16}>
          <Form
            form={form}
            layout="vertical"
            initialValues={{
              quote_date: dayjs(),
              valid_until: dayjs().add(30, "days"),
              discount_percent: 0,
              tax_percent: 10,
            }}
          >
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
                    onChange={(customer) => {
                      if (customer) {
                        handleSelectClient(customer);
                      } else {
                        setSelectedClient(null);
                        form.resetFields([
                          "customer_name",
                          "customer_code",
                          "customer_phone",
                          "customer_email",
                          "contact_person",
                          "customer_address",
                        ]);
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
                      onClick={() => setClientSelectVisible(true)}
                    >
                      chọn từ danh sách tất cả khách hàng B2B
                    </Button>
                  </Text>
                </Col>
              </Row>

              {selectedClient && (
                <Table
                  dataSource={[
                    {
                      key: "1",
                      label: "Đơn vị mua",
                      value: selectedClient.customer_name,
                    },
                    {
                      key: "2",
                      label: "Mã khách hàng",
                      value: selectedClient.customer_code || "Chưa có",
                    },
                    {
                      key: "3",
                      label: "Tên Chủ sở hữu",
                      value:
                        selectedClient.contact_person ||
                        selectedClient.customer_name,
                    },
                    {
                      key: "4",
                      label: "Số điện thoại",
                      value: selectedClient.phone_number || "Chưa có",
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
              )}

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

            {/* Address Information */}
            <Card
              title={
                <Space>
                  <HomeOutlined />
                  Địa chỉ
                </Space>
              }
              style={{ marginBottom: 16 }}
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
                    <TextArea rows={2} placeholder="Địa chỉ khách hàng" />
                  </Form.Item>
                </Col>
                <Col xs={24} lg={12}>
                  <Form.Item name="delivery_address" label="Địa chỉ giao hàng">
                    <TextArea
                      rows={2}
                      placeholder="Địa chỉ giao hàng (để trống nếu trùng với địa chỉ khách hàng)"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

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
                placeholder="Tìm kiếm sản phẩm theo tên, SKU, nhà sản xuất..."
                size="large"
                style={{ width: "100%" }}
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
        <Col xs={24} lg={8}>
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

            <Divider />

            <Space direction="vertical" style={{ width: "100%" }}>
              <Button
                type="default"
                icon={<SaveOutlined />}
                onClick={handleSaveDraft}
                loading={loading}
                style={{ width: "100%" }}
                size={isMobile ? "middle" : "large"}
              >
                Lưu nháp
              </Button>
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSendOrder}
                loading={loading}
                style={{ width: "100%" }}
                size={isMobile ? "middle" : "large"}
              >
                Gửi báo giá
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Order Preview Modal */}
      <Modal
        title={
          <Space>
            <InfoCircleOutlined />
            Chi tiết Đơn hàng đã lưu
          </Space>
        }
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={[
          <Button key="close" onClick={() => setPreviewVisible(false)}>
            Đóng
          </Button>,
          <Button key="print" type="primary">
            In báo giá
          </Button>,
        ]}
        width={isMobile ? "95%" : 800}
      >
        {orderSummary && (
          <div>
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={12}>
                <Card title="Thông tin Khách hàng" size="small">
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Tên khách hàng">
                      <Text strong>{orderSummary.customer_name}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Mã khách hàng">
                      {orderSummary.customer_code || "Chưa có"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Số điện thoại">
                      {orderSummary.customer_phone}
                    </Descriptions.Item>
                    <Descriptions.Item label="Email">
                      {orderSummary.customer_email || "Chưa có"}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
              <Col span={12}>
                <Card title="Địa chỉ giao hàng" size="small">
                  <Paragraph>
                    <Text strong>Địa chỉ khách hàng:</Text>
                    <br />
                    {orderSummary.customer_address}
                  </Paragraph>
                  {orderSummary.delivery_address && (
                    <Paragraph>
                      <Text strong>Địa chỉ giao hàng:</Text>
                      <br />
                      {orderSummary.delivery_address}
                    </Paragraph>
                  )}
                </Card>
              </Col>
            </Row>

            <Card
              title="Thông tin Đơn hàng"
              size="small"
              style={{ marginBottom: 16 }}
            >
              <Row gutter={16}>
                <Col span={8}>
                  <Text strong>Mã đơn hàng:</Text>
                  <br />
                  <Text>{orderSummary.quote_number}</Text>
                </Col>
                <Col span={8}>
                  <Text strong>Ngày tạo:</Text>
                  <br />
                  <Text>{orderSummary.created_at}</Text>
                </Col>
                <Col span={8}>
                  <Text strong>Trạng thái:</Text>
                  <br />
                  <Tag color="orange">Nháp</Tag>
                </Col>
              </Row>
            </Card>

            <Card
              title="Chi tiết Sản phẩm"
              size="small"
              style={{ marginBottom: 16 }}
            >
              <Table
                columns={[
                  { title: "Sản phẩm", dataIndex: "product_name", key: "name" },
                  {
                    title: "Đơn giá",
                    dataIndex: "unit_price",
                    key: "price",
                    render: formatCurrency,
                  },
                  { title: "SL", dataIndex: "quantity", key: "quantity" },
                  {
                    title: "Thành tiền",
                    dataIndex: "total_price",
                    key: "total",
                    render: formatCurrency,
                  },
                ]}
                dataSource={orderSummary.items}
                pagination={false}
                size="small"
              />
            </Card>

            <Card title="Tổng kết" size="small">
              <Descriptions column={2} size="small">
                <Descriptions.Item label="Tạm tính">
                  {formatCurrency(orderSummary.totals.subtotal)}
                </Descriptions.Item>
                <Descriptions.Item label="Chiết khấu">
                  -{formatCurrency(orderSummary.totals.discountAmount)}
                </Descriptions.Item>
                <Descriptions.Item label="Thuế">
                  +{formatCurrency(orderSummary.totals.taxAmount)}
                </Descriptions.Item>
                <Descriptions.Item label="Tổng cộng">
                  <Text strong style={{ color: "#52c41a", fontSize: 16 }}>
                    {formatCurrency(orderSummary.totals.totalAmount)}
                  </Text>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </div>
        )}
      </Modal>

      {/* Client Selection Modal */}
      <B2BCustomerSearchModal
        open={clientSelectVisible}
        onClose={() => setClientSelectVisible(false)}
        onSelect={handleSelectClient}
        title="Chọn Khách hàng B2B"
      />
    </div>
  );
};

export default CreateOrderPage;
