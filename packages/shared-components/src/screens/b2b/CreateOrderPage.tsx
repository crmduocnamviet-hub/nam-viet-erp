import React, { useState, useEffect } from "react";
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
  Select,
  Divider,
  Tag,
  Modal,
  App,
  Steps,
  Descriptions,
  List,
  Avatar,
  Grid,
} from "antd";
import {
  PlusOutlined,
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
import {
  getActiveProduct,
  createB2BQuote,
  addQuoteItem,
  getB2BCustomers,
} from "@nam-viet-erp/services";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Step } = Steps;

// Helper function to validate URLs
const isValidUrl = (string: string): boolean => {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

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
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [productSelectVisible, setProductSelectVisible] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [orderSummary, setOrderSummary] = useState<any>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [clientSelectVisible, setClientSelectVisible] = useState(false);
  const [allClients, setAllClients] = useState<IB2BCustomer[]>([]);
  const [filteredClients, setFilteredClients] = useState<IB2BCustomer[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [selectedClient, setSelectedClient] = useState<IB2BCustomer | null>(null);
  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const screens = useBreakpoint(); // Lấy thông tin màn hình hiện tại
  const isMobile = !screens.lg; // Coi là mobile nếu màn hình nhỏ hơn 'lg'

  // Load products
  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true);
      try {
        const response = await getActiveProduct();
        if (response.error) throw response.error;
        const productData = response.data || [];
        setProducts(productData);
        setFilteredProducts(productData); // Initialize filtered products
      } catch (error: any) {
        notification.error({
          message: "Lỗi tải sản phẩm",
          description: error.message || "Không thể tải danh sách sản phẩm",
        });
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchProducts();
  }, []);

  // Load all B2B clients
  const fetchAllClients = async (searchTerm?: string) => {
    setLoadingClients(true);
    try {
      const response = await getB2BCustomers({
        search: searchTerm, // Add search parameter
        isActive: true, // Only get active customers
        limit: 50, // Reasonable limit for better performance
      });
      if (response.error) throw response.error;
      const clients = response.data || [];
      setAllClients(clients);
      setFilteredClients(clients);
    } catch (error: any) {
      notification.error({
        message: "Lỗi tải danh sách khách hàng B2B",
        description: error.message || "Không thể tải danh sách khách hàng B2B",
      });
    } finally {
      setLoadingClients(false);
    }
  };

  // Filter clients locally
  const handleClientSearch = (searchValue: string) => {
    setClientSearchTerm(searchValue);
    if (!searchValue.trim()) {
      setFilteredClients(allClients);
      return;
    }

    const filtered = allClients.filter(client =>
      client.customer_name.toLowerCase().includes(searchValue.toLowerCase()) ||
      (client.customer_code && client.customer_code.toLowerCase().includes(searchValue.toLowerCase())) ||
      (client.phone_number && client.phone_number.includes(searchValue)) ||
      (client.address && client.address.toLowerCase().includes(searchValue.toLowerCase())) ||
      (client.contact_person && client.contact_person.toLowerCase().includes(searchValue.toLowerCase()))
    );
    setFilteredClients(filtered);
  };

  // Handle client selection
  const handleSelectClient = (client: IB2BCustomer) => {
    setSelectedClient(client);
    // Auto-fill form with B2B customer information
    form.setFieldsValue({
      customer_name: client.customer_name,
      customer_code: client.customer_code,
      customer_phone: client.phone_number,
      customer_email: client.email || '',
      contact_person: client.contact_person || client.customer_name,
      customer_address: client.address || '',
    });
    setClientSelectVisible(false);
  };

  // Handle product search
  const handleProductSearch = (searchValue: string) => {
    setProductSearchTerm(searchValue);
    if (!searchValue.trim()) {
      setFilteredProducts(products);
      return;
    }

    const filtered = products.filter(product =>
      product.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      (product.manufacturer && product.manufacturer.toLowerCase().includes(searchValue.toLowerCase())) ||
      (product.packaging && product.packaging.toLowerCase().includes(searchValue.toLowerCase())) ||
      (product.sku && product.sku.toLowerCase().includes(searchValue.toLowerCase()))
    );
    setFilteredProducts(filtered);
  };

  // Handle opening product selection modal
  const handleOpenProductSelection = () => {
    setProductSelectVisible(true);
    setProductSearchTerm(''); // Reset search
    setFilteredProducts(products); // Reset filter
    setSelectedProducts([]); // Reset selection
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

  // Add products to order
  const handleAddProducts = (products: Product[]) => {
    const newItems: OrderItem[] = products.map((product, index) => {
      // Validate product_id is a valid number
      if (!product.id || typeof product.id !== 'number') {
        console.error('Invalid product id when adding product:', product.id, product);
        notification.error({
          message: "Lỗi sản phẩm",
          description: `Sản phẩm "${product.name}" có ID không hợp lệ: ${product.id}`,
        });
        return null;
      }

      return {
        key: `${product.id}_${Date.now()}_${index}`,
        product_id: product.id, // Now correctly a number
        product_name: product.name,
        unit_price: product.wholesale_price || 0,
        quantity: 1,
        total_price: product.wholesale_price || 0,
        packaging: product.packaging,
        unit: product.unit || "Hộp",
      };
    }).filter(item => item !== null) as OrderItem[];

    setOrderItems((prev) => [...prev, ...newItems]);
    setProductSelectVisible(false);
    setSelectedProducts([]);
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
          description: "Không tìm thấy thông tin nhân viên. Vui lòng đăng nhập lại.",
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
        created_by_employee_id: employee.employee_id,
      };

      // First, create the quote in database
      const { data: newQuote, error: quoteError } = await createB2BQuote(quoteData);

      if (quoteError || !newQuote) {
        throw new Error(quoteError?.message || "Không thể tạo báo giá");
      }

      // Then, add all quote items to database
      const quoteItemPromises = orderItems.map(async (item) => {
        if (!item.product_id || typeof item.product_id !== 'number') {
          console.error('Invalid product_id:', item.product_id, 'for item:', item.product_name);
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
      const failedItems = itemResults.filter(result => result.error);

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
      setCurrentStep(0);

    } catch (error: any) {
      console.error("Error saving draft:", error);
      notification.error({
        message: "Lỗi lưu nháp",
        description: error.message || "Không thể lưu nháp báo giá. Vui lòng thử lại.",
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
          description: "Không tìm thấy thông tin nhân viên. Vui lòng đăng nhập lại.",
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
        created_by_employee_id: employee.employee_id,
      };

      // Create the quote in database
      const { data: newQuote, error: quoteError } = await createB2BQuote(quoteData);

      if (quoteError || !newQuote) {
        throw new Error(quoteError?.message || "Không thể tạo báo giá");
      }

      // Add all quote items to database
      const quoteItemPromises = orderItems.map(async (item) => {
        if (!item.product_id || typeof item.product_id !== 'number') {
          console.error('Invalid product_id:', item.product_id, 'for item:', item.product_name);
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
      const failedItems = itemResults.filter(result => result.error);

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
      setCurrentStep(0);

    } catch (error: any) {
      console.error("Error sending order:", error);
      notification.error({
        message: "Lỗi gửi báo giá",
        description: error.message || "Không thể gửi báo giá. Vui lòng thử lại.",
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

  const steps = [
    {
      title: "Thông tin khách hàng",
      icon: <UserOutlined />,
      description: "Nhập thông tin khách hàng và địa chỉ giao hàng",
    },
    {
      title: "Chọn sản phẩm",
      icon: <ShoppingCartOutlined />,
      description: "Thêm sản phẩm vào đơn hàng",
    },
    {
      title: "Xác nhận",
      icon: <InfoCircleOutlined />,
      description: "Xem lại và xác nhận đơn hàng",
    },
  ];

  return (
    <div
      style={{
        padding: isMobile ? "16px" : "24px",
        background: "#f0f2f5",
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

      <Steps
        current={currentStep}
        direction={isMobile ? "vertical" : "horizontal"}
        size={isMobile ? "small" : "default"}
        style={{ marginBottom: isMobile ? 16 : 24 }}
      >
        {steps.map((step, index) => (
          <Step
            key={index}
            title={step.title}
            description={step.description}
            icon={step.icon}
          />
        ))}
      </Steps>

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
                    <Tag color="green">Đã chọn: {selectedClient.customer_name}</Tag>
                  )}
                </Space>
              }
              extra={
                <Button
                  type="link"
                  icon={<UserOutlined />}
                  onClick={() => {
                    setClientSelectVisible(true);
                    setClientSearchTerm(""); // Reset search
                    fetchAllClients();
                  }}
                  size={isMobile ? "small" : "middle"}
                >
                  {isMobile ? "Chọn KH" : "Chọn từ danh sách"}
                </Button>
              }
              style={{ marginBottom: 16 }}
            >
              {/* Quick Search for Customers */}
              <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col span={24}>
                  <Input.Search
                    placeholder="Tìm nhanh khách hàng B2B theo tên hoặc số điện thoại..."
                    onSearch={(value) => {
                      if (value.trim()) {
                        setClientSelectVisible(true);
                        setClientSearchTerm(value);
                        fetchAllClients(value);
                      }
                    }}
                    enterButton="Tìm kiếm"
                    size="large"
                    style={{ marginBottom: 8 }}
                  />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Hoặc
                    <Button
                      type="link"
                      size="small"
                      style={{ padding: 0, fontSize: 12 }}
                      onClick={() => {
                        setClientSelectVisible(true);
                        setClientSearchTerm("");
                        fetchAllClients();
                      }}
                    >
                      xem tất cả khách hàng B2B
                    </Button>
                  </Text>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="customer_name"
                    label="Tên khách hàng"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng nhập tên khách hàng",
                      },
                    ]}
                  >
                    <Input placeholder="Nhập tên khách hàng" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="customer_code" label="Mã khách hàng">
                    <Input placeholder="Mã khách hàng (tùy chọn)" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col xs={24} sm={12} lg={8}>
                  <Form.Item name="contact_person" label="Người liên hệ">
                    <Input placeholder="Tên người liên hệ" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} lg={8}>
                  <Form.Item
                    name="customer_phone"
                    label="Số điện thoại"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng nhập số điện thoại",
                      },
                    ]}
                  >
                    <Input placeholder="Số điện thoại liên hệ" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={24} lg={8}>
                  <Form.Item
                    name="customer_email"
                    label="Email"
                    rules={[{ type: "email", message: "Email không hợp lệ" }]}
                  >
                    <Input placeholder="Email khách hàng" />
                  </Form.Item>
                </Col>
              </Row>
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
            extra={
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleOpenProductSelection}
              >
                {!isMobile && "Thêm sản phẩm"}
              </Button>
            }
            style={{ marginBottom: 16 }}
          >
            <Table
              columns={orderColumns}
              dataSource={orderItems}
              pagination={false}
              scroll={{ x: isMobile ? 600 : 800 }}
              size={isMobile ? "small" : "middle"}
              locale={{
                emptyText: "Chưa có sản phẩm nào được thêm vào đơn hàng",
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

      {/* Product Selection Modal */}
      <Modal
        title={
          <Space>
            <ShoppingCartOutlined />
            Chọn sản phẩm ({filteredProducts.length}/{products.length} sản phẩm)
            {selectedProducts.length > 0 && (
              <Tag color="blue">Đã chọn: {selectedProducts.length}</Tag>
            )}
          </Space>
        }
        open={productSelectVisible}
        onCancel={() => {
          setProductSelectVisible(false);
          setProductSearchTerm(''); // Reset search
          setFilteredProducts(products);
          setSelectedProducts([]); // Reset selection
        }}
        onOk={() => handleAddProducts(selectedProducts)}
        width={isMobile ? "95%" : 1200}
        okButtonProps={{ disabled: selectedProducts.length === 0 }}
        okText={`Thêm ${selectedProducts.length} sản phẩm vào đơn hàng`}
        cancelText="Hủy"
        style={{
          top: isMobile ? 16 : 20,
        }}
      >
        {/* Search Section */}
        <div style={{ marginBottom: 16 }}>
          <Input.Search
            placeholder="Tìm kiếm sản phẩm theo tên, nhà sản xuất, đóng gói, mã SKU..."
            value={productSearchTerm}
            onChange={(e) => handleProductSearch(e.target.value)}
            onSearch={handleProductSearch}
            allowClear
            style={{ marginBottom: 12 }}
            size="large"
            enterButton="Tìm kiếm"
          />

          {/* Search Results Info */}
          <Row justify="space-between" align="middle">
            <Col>
              {productSearchTerm && (
                <Text type="secondary">
                  Kết quả cho "{productSearchTerm}": {filteredProducts.length} sản phẩm
                  {filteredProducts.length === 0 && (
                    <Button
                      type="link"
                      size="small"
                      onClick={() => {
                        setProductSearchTerm('');
                        setFilteredProducts(products);
                      }}
                      style={{ padding: 0, marginLeft: 8 }}
                    >
                      Hiển thị tất cả
                    </Button>
                  )}
                </Text>
              )}
            </Col>
            <Col>
              {selectedProducts.length > 0 && (
                <Space>
                  <Button
                    size="small"
                    onClick={() => setSelectedProducts([])}
                  >
                    Bỏ chọn tất cả
                  </Button>
                  <Text type="secondary">| {selectedProducts.length} đã chọn</Text>
                </Space>
              )}
            </Col>
          </Row>
        </div>
        <Table
          loading={loadingProducts}
          dataSource={filteredProducts}
          rowKey="id"
          rowSelection={{
            type: 'checkbox',
            selectedRowKeys: selectedProducts.map(p => p.id),
            onChange: (_, selectedRows) => {
              setSelectedProducts(selectedRows);
            },
            onSelectAll: (selected, _, changeRows) => {
              if (selected) {
                // Select all visible products on current page
                const newSelections = changeRows.filter(item =>
                  !selectedProducts.find(p => p.id === item.id)
                );
                setSelectedProducts([...selectedProducts, ...newSelections]);
              } else {
                // Deselect all visible products on current page
                const changeKeys = changeRows.map(item => item.id);
                setSelectedProducts(selectedProducts.filter(p => !changeKeys.includes(p.id)));
              }
            },
            onSelect: (record, selected) => {
              // Handle individual row selection
              if (selected) {
                setSelectedProducts([...selectedProducts, record]);
              } else {
                setSelectedProducts(selectedProducts.filter(p => p.id !== record.id));
              }
            },
            getCheckboxProps: (record) => ({
              name: record.name,
            }),
          }}
          columns={[
            {
              title: 'Hình ảnh',
              dataIndex: 'image_url',
              key: 'image',
              width: isMobile ? 80 : 100,
              responsive: isMobile ? ['lg'] : undefined,
              render: (imageUrl, record) => (
                <img
                  alt={record.name}
                  src={(imageUrl && isValidUrl(imageUrl)) ? imageUrl : "https://via.placeholder.com/60"}
                  style={{
                    width: isMobile ? 40 : 60,
                    height: isMobile ? 40 : 60,
                    objectFit: "contain",
                    borderRadius: 4,
                    border: '1px solid #f0f0f0'
                  }}
                />
              ),
            },
            {
              title: 'Tên sản phẩm',
              dataIndex: 'name',
              key: 'name',
              width: isMobile ? 180 : '30%',
              fixed: isMobile ? 'left' : undefined,
              render: (text, record) => (
                <div>
                  <Text strong style={{ fontSize: isMobile ? 13 : 14 }}>
                    {text}
                  </Text>
                  {record.sku && (
                    <div>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        SKU: {record.sku}
                      </Text>
                    </div>
                  )}
                </div>
              ),
            },
            {
              title: 'Nhà sản xuất',
              dataIndex: 'manufacturer',
              key: 'manufacturer',
              width: isMobile ? 120 : '15%',
              responsive: isMobile ? ['md'] : undefined,
              render: (text) => (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {text || '-'}
                </Text>
              ),
            },
            {
              title: 'Đóng gói',
              dataIndex: 'packaging',
              key: 'packaging',
              width: isMobile ? 100 : '15%',
              responsive: isMobile ? ['lg'] : undefined,
              render: (text) => (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {text || '-'}
                </Text>
              ),
            },
            {
              title: 'Giá bán buôn',
              dataIndex: 'wholesale_price',
              key: 'wholesale_price',
              width: isMobile ? 120 : '20%',
              align: 'right',
              render: (price) => (
                <Text strong style={{ color: "#52c41a", fontSize: isMobile ? 13 : 14 }}>
                  {formatCurrency(price || 0)}
                </Text>
              ),
            },
            {
              title: 'Thao tác',
              key: 'actions',
              width: isMobile ? 80 : 100,
              fixed: isMobile ? 'right' : undefined,
              render: (_, record) => {
                const isSelected = selectedProducts.find(p => p.id === record.id);
                return (
                  <Button
                    type={isSelected ? "default" : "primary"}
                    size="small"
                    style={{
                      backgroundColor: isSelected ? "#f0f9ff" : undefined,
                      borderColor: isSelected ? "#1890ff" : undefined,
                      color: isSelected ? "#1890ff" : undefined,
                    }}
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent row selection event
                      if (isSelected) {
                        setSelectedProducts((prev) =>
                          prev.filter((p) => p.id !== record.id)
                        );
                      } else {
                        setSelectedProducts((prev) => [...prev, record]);
                      }
                    }}
                  >
                    {isSelected ? "Bỏ chọn" : "Chọn"}
                  </Button>
                );
              },
            },
          ]}
          pagination={{
            pageSize: isMobile ? 10 : 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} sản phẩm`,
            pageSizeOptions: ['10', '20', '50', '100'],
          }}
          scroll={{ x: isMobile ? 600 : 900 }}
          size={isMobile ? "small" : "middle"}
          onRow={() => ({
            onClick: (e) => {
              // Prevent row click from triggering selection
              // Only checkboxes and action buttons should handle selection
              e.stopPropagation();
            },
          })}
          locale={{
            emptyText: loadingProducts
              ? "Đang tải sản phẩm..."
              : productSearchTerm
                ? `Không tìm thấy sản phẩm nào chứa "${productSearchTerm}"`
                : "Không có sản phẩm nào",
          }}
        />
      </Modal>

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
      <Modal
        title={
          <Space>
            <UserOutlined />
            Chọn Khách hàng B2B ({filteredClients.length}/{allClients.length}{" "}
            khách hàng)
          </Space>
        }
        open={clientSelectVisible}
        onCancel={() => {
          setClientSelectVisible(false);
          setClientSearchTerm(""); // Reset search when closing
          setFilteredClients(allClients);
        }}
        footer={[
          <Button
            key="close"
            onClick={() => {
              setClientSelectVisible(false);
              setClientSearchTerm(""); // Reset search when closing
              setFilteredClients(allClients);
            }}
          >
            Đóng
          </Button>,
          <Button
            key="refresh"
            onClick={() => {
              setClientSearchTerm("");
              fetchAllClients();
            }}
            loading={loadingClients}
          >
            Tải lại
          </Button>,
        ]}
        width={isMobile ? "95%" : 1200}
        style={{
          top: isMobile ? 16 : 20,
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <Input.Search
            placeholder="Tìm kiếm theo tên, số điện thoại hoặc địa chỉ..."
            value={clientSearchTerm}
            onChange={(e) => handleClientSearch(e.target.value)}
            onSearch={handleClientSearch}
            allowClear
            style={{ marginBottom: 16 }}
            size="large"
            enterButton="Tìm kiếm"
          />
          {clientSearchTerm && (
            <div style={{ marginBottom: 12 }}>
              <Text type="secondary">
                Kết quả tìm kiếm cho "{clientSearchTerm}":{" "}
                {filteredClients.length} khách hàng
              </Text>
              {filteredClients.length === 0 && (
                <Button
                  type="link"
                  size="small"
                  onClick={() => {
                    setClientSearchTerm("");
                    setFilteredClients(allClients);
                  }}
                  style={{ padding: 0, marginLeft: 8 }}
                >
                  Hiển thị tất cả
                </Button>
              )}
            </div>
          )}
        </div>

        <List
          loading={loadingClients}
          dataSource={filteredClients}
          renderItem={(client) => (
            <List.Item
              actions={[
                <Button
                  type="primary"
                  size="small"
                  onClick={() => handleSelectClient(client)}
                >
                  Chọn
                </Button>,
              ]}
              style={{
                padding: "16px",
                borderRadius: 8,
                marginBottom: 8,
                backgroundColor: "#fafafa",
                cursor: "pointer",
                border: "1px solid #e8e8e8",
              }}
              onClick={() => handleSelectClient(client)}
            >
              <List.Item.Meta
                avatar={
                  <Avatar
                    size={48}
                    style={{ backgroundColor: "#1890ff" }}
                    icon={<UserOutlined />}
                  />
                }
                title={
                  <div>
                    <Text strong style={{ fontSize: 16 }}>
                      {client.customer_name}
                    </Text>
                    {client.customer_code && (
                      <Tag color="blue" style={{ marginLeft: 8 }}>
                        {client.customer_code}
                      </Tag>
                    )}
                    <Tag color="green" style={{ marginLeft: 8, fontSize: 11 }}>
                      {client.customer_type}
                    </Tag>
                  </div>
                }
                description={
                  <Space direction="vertical" size={4}>
                    {client.contact_person && (
                      <Text type="secondary">
                        👤 {client.contact_person}
                      </Text>
                    )}
                    <Text type="secondary">
                      📞 {client.phone_number}
                    </Text>
                    {client.email && (
                      <Text type="secondary">
                        ✉️ {client.email}
                      </Text>
                    )}
                    {client.address && (
                      <Text type="secondary" ellipsis>
                        🏠 {client.address}
                      </Text>
                    )}
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Ngày tạo: {dayjs(client.created_at).format('DD/MM/YYYY')}
                      </Text>
                      {client.tax_code && (
                        <Tag color="purple" style={{ marginLeft: 8, fontSize: 11 }}>
                          MST: {client.tax_code}
                        </Tag>
                      )}
                      {client.credit_limit && client.credit_limit > 0 && (
                        <Tag color="orange" style={{ marginLeft: 4, fontSize: 11 }}>
                          Hạn mức: {client.credit_limit.toLocaleString('vi-VN')}đ
                        </Tag>
                      )}
                    </div>
                  </Space>
                }
              />
            </List.Item>
          )}
          pagination={{
            pageSize: isMobile ? 5 : 10,
            showSizeChanger: false,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} khách hàng`,
          }}
          locale={{
            emptyText: loadingClients
              ? "Đang tải..."
              : clientSearchTerm
              ? `Không tìm thấy khách hàng nào chứa "${clientSearchTerm}"`
              : "Không có khách hàng B2B nào",
          }}
        />
      </Modal>
    </div>
  );
};

export default CreateOrderPage;
