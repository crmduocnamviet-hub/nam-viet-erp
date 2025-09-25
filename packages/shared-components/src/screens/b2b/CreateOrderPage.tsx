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
import { getActiveProduct, createB2BQuote } from "@nam-viet-erp/services";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Step } = Steps;
const { Option } = Select;

interface Product {
  product_id: string;
  name: string;
  wholesale_price: number;
  packaging?: string;
  manufacturer?: string;
  image_url?: string;
  unit?: string;
}

interface OrderItem {
  key: string;
  product_id: string;
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

const CreateOrderPage: React.FC<CreateOrderPageProps> = ({ employee }) => {
  const { notification } = App.useApp();
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [productSelectVisible, setProductSelectVisible] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [orderSummary, setOrderSummary] = useState<any>(null);
  const [previewVisible, setPreviewVisible] = useState(false);

  // Load products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await getActiveProduct();
        if (response.error) throw response.error;
        setProducts(response.data || []);
      } catch (error: any) {
        notification.error({
          message: "Lỗi tải sản phẩm",
          description: error.message || "Không thể tải danh sách sản phẩm",
        });
      }
    };
    fetchProducts();
  }, []);

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
    const newItems: OrderItem[] = products.map((product, index) => ({
      key: `${product.product_id}_${Date.now()}_${index}`,
      product_id: product.product_id,
      product_name: product.name,
      unit_price: product.wholesale_price || 0,
      quantity: 1,
      total_price: product.wholesale_price || 0,
      packaging: product.packaging,
      unit: product.unit || "Hộp",
    }));

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
        "customer_email",
        "customer_address",
      ]);

      if (orderItems.length === 0) {
        notification.warning({
          message: "Cảnh báo",
          description: "Vui lòng thêm ít nhất một sản phẩm vào đơn hàng",
        });
        return;
      }

      setLoading(true);
      const totals = calculateTotals();

      const orderData = {
        customer_name: values.customer_name,
        customer_code: values.customer_code,
        customer_contact_person: values.contact_person,
        customer_phone: values.customer_phone,
        customer_email: values.customer_email,
        customer_address: values.customer_address,
        delivery_address: values.delivery_address || values.customer_address,
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
        notes: values.notes,
        terms_conditions: values.terms_conditions,
        created_by_employee_id: employee?.employee_id || "",
        quote_items: orderItems.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
        })),
      };

      const { data: newOrder, error } = await createB2BQuote(orderData as any);

      if (error) {
        throw new Error(error.message);
      }

      if (newOrder) {
        setOrderSummary({
          ...orderData,
          quote_number: newOrder.quote_number || "DRAFT-" + Date.now(),
          created_at: dayjs().format("DD/MM/YYYY HH:mm"),
          totals,
          items: orderItems,
        });

        notification.success({
          message: "Thành công",
          description: "Đã lưu nháp đơn hàng thành công",
        });

        setPreviewVisible(true);
      }
    } catch (error) {
      console.error("Error saving draft:", error);
      notification.error({
        message: "Lỗi lưu nháp",
        description: "Không thể lưu nháp đơn hàng",
      });
    } finally {
      setLoading(false);
    }
  };

  // Send order
  const handleSendOrder = async () => {
    try {
      await handleSaveDraft();
      // Additional logic for sending order
      notification.success({
        message: "Thành công",
        description: "Đã gửi đơn hàng cho khách hàng",
      });
    } catch (error) {
      notification.error({
        message: "Lỗi gửi đơn hàng",
        description: "Không thể gửi đơn hàng",
      });
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
      width: "40%",
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
      width: "15%",
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
      width: "15%",
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
      width: "10%",
      render: (text) => <Text>{text}</Text>,
    },
    {
      title: "Thành tiền",
      dataIndex: "total_price",
      key: "total_price",
      width: "15%",
      render: (value) => (
        <Text strong style={{ color: "#52c41a" }}>
          {formatCurrency(value)}
        </Text>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: "5%",
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
    <div style={{ padding: "24px", background: "#f0f2f5", minHeight: "100vh" }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2} style={{ margin: 0 }}>
            🛒 Tạo Báo Giá / Đơn Hàng B2B
          </Title>
          <Text type="secondary">
            Tạo báo giá và đơn hàng chi tiết cho khách hàng bán buôn
          </Text>
        </Col>
      </Row>

      <Steps current={currentStep} style={{ marginBottom: 24 }}>
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
                </Space>
              }
              style={{ marginBottom: 16 }}
            >
              <Row gutter={16}>
                <Col span={12}>
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
                <Col span={12}>
                  <Form.Item name="customer_code" label="Mã khách hàng">
                    <Input placeholder="Mã khách hàng (tùy chọn)" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="contact_person" label="Người liên hệ">
                    <Input placeholder="Tên người liên hệ" />
                  </Form.Item>
                </Col>
                <Col span={8}>
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
                <Col span={8}>
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
                <Col span={12}>
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
                <Col span={12}>
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
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="quote_date" label="Ngày tạo">
                    <DatePicker style={{ width: "100%" }} disabled />
                  </Form.Item>
                </Col>
                <Col span={8}>
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
                <Col span={8}>
                  <Form.Item label="Nhân viên tạo">
                    <Input value={employee?.full_name} disabled />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={6}>
                  <Form.Item name="discount_percent" label="Chiết khấu (%)">
                    <InputNumber
                      style={{ width: "100%" }}
                      min={0}
                      max={100}
                      placeholder="0"
                    />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item name="tax_percent" label="Thuế (%)">
                    <InputNumber
                      style={{ width: "100%" }}
                      min={0}
                      max={100}
                      placeholder="10"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
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
                onClick={() => setProductSelectVisible(true)}
              >
                Thêm sản phẩm
              </Button>
            }
            style={{ marginBottom: 16 }}
          >
            <Table
              columns={orderColumns}
              dataSource={orderItems}
              pagination={false}
              scroll={{ x: 800 }}
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
            style={{ position: "sticky", top: 24 }}
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
                size="large"
              >
                Lưu nháp
              </Button>
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSendOrder}
                loading={loading}
                style={{ width: "100%" }}
                size="large"
              >
                Gửi báo giá
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Product Selection Modal */}
      <Modal
        title="Chọn sản phẩm"
        open={productSelectVisible}
        onCancel={() => setProductSelectVisible(false)}
        onOk={() => handleAddProducts(selectedProducts)}
        width={1000}
        okButtonProps={{ disabled: selectedProducts.length === 0 }}
        okText={`Thêm ${selectedProducts.length} sản phẩm`}
        cancelText="Hủy"
      >
        <List
          grid={{ gutter: 16, xs: 1, sm: 2, md: 3 }}
          dataSource={products}
          renderItem={(product) => (
            <List.Item>
              <Card
                hoverable
                style={{
                  border: selectedProducts.find(
                    (p) => p.product_id === product.product_id
                  )
                    ? "2px solid #1890ff"
                    : "1px solid #d9d9d9",
                }}
                onClick={() => {
                  const isSelected = selectedProducts.find(
                    (p) => p.product_id === product.product_id
                  );
                  if (isSelected) {
                    setSelectedProducts((prev) =>
                      prev.filter((p) => p.product_id !== product.product_id)
                    );
                  } else {
                    setSelectedProducts((prev) => [...prev, product]);
                  }
                }}
                cover={
                  <img
                    alt={product.name}
                    src={product.image_url || "https://via.placeholder.com/150"}
                    style={{ height: 120, objectFit: "contain", padding: 8 }}
                  />
                }
              >
                <Card.Meta
                  title={
                    <Text ellipsis style={{ fontSize: 14 }}>
                      {product.name}
                    </Text>
                  }
                  description={
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {product.packaging}
                      </Text>
                      <br />
                      <Text strong style={{ color: "#52c41a" }}>
                        {formatCurrency(product.wholesale_price || 0)}
                      </Text>
                    </div>
                  }
                />
              </Card>
            </List.Item>
          )}
          pagination={{ pageSize: 9 }}
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
        width={800}
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
    </div>
  );
};

export default CreateOrderPage;
