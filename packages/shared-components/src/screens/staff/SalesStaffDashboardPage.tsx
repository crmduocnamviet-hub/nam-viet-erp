import React, { useState, useEffect } from "react";
import {
  Card,
  List,
  Badge,
  Button,
  Typography,
  Row,
  Col,
  Statistic,
  Tag,
  Space,
  Table,
  Modal,
  Select,
  DatePicker,
  notification,
} from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  WarningOutlined,
  CreditCardOutlined,
  CalendarOutlined,
  HeartOutlined,
  PhoneOutlined,
} from "@ant-design/icons";
import {
  getB2BQuotes,
  updateB2BQuote,
  getB2BCustomers,
} from "@nam-viet-erp/services";

const { Title, Text } = Typography;
const { Option } = Select;

interface TodoItem {
  id: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  status: "pending" | "in_progress" | "completed";
  dueDate?: string;
  type: "quote" | "order" | "customer" | "general";
}

interface B2BPaymentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  totalAmount: number;
  paymentDueDate: string;
  paymentStatus: "unpaid" | "paid" | "partial" | "overdue";
  daysOverdue: number;
  orderDate: string;
  paymentTerms: string;
  quoteId: string;
}

interface InactiveCustomer {
  customerId: string;
  customerName: string;
  customerCode: string;
  contactPerson?: string;
  phoneNumber?: string;
  email?: string;
  customerType: string;
  lastOrderDate: string;
  daysSinceLastOrder: number;
  totalOrders: number;
  totalOrderValue: number;
  averageOrderValue: number;
  riskLevel: "high" | "medium" | "low";
}

interface SalesStaffDashboardPageProps {
  employee?: any;
}

const SalesStaffDashboardPage: React.FC<SalesStaffDashboardPageProps> = ({
  employee,
}) => {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [paymentOrders, setPaymentOrders] = useState<B2BPaymentOrder[]>([]);
  const [inactiveCustomers, setInactiveCustomers] = useState<
    InactiveCustomer[]
  >([]);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [customerCareModalVisible, setCustomerCareModalVisible] =
    useState(false);
  const [selectedOrder, setSelectedOrder] = useState<B2BPaymentOrder | null>(
    null,
  );
  const [selectedCustomer, setSelectedCustomer] =
    useState<InactiveCustomer | null>(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    pendingQuotes: 0,
    activeOrders: 0,
    newCustomers: 0,
    todayRevenue: 0,
    overduePayments: 0,
    totalOverdueAmount: 0,
  });

  useEffect(() => {
    // Load all analytics from B2B quotes (this will also generate todos from real data)
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      console.log("🔍 Fetching B2B quotes for analytics...");

      // Fetch all B2B quotes and customers
      const [quotesResponse, customersResponse] = await Promise.all([
        getB2BQuotes(),
        getB2BCustomers(),
      ]);

      if (quotesResponse.error || customersResponse.error) {
        console.error(
          "❌ Error fetching data:",
          quotesResponse.error || customersResponse.error,
        );
        notification.error({
          message: "Lỗi",
          description: "Không thể tải dữ liệu B2B",
        });
        return;
      }

      const quotes = quotesResponse.data;
      const customers = customersResponse.data;

      if (quotes) {
        const today = new Date();
        const startOfToday = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
        );
        const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

        // Analytics calculations
        // 1. Báo giá chờ phản hồi (quotes with status: sent, negotiating)
        const pendingQuotes = quotes.filter((quote) =>
          ["sent", "negotiating"].includes(quote.quote_stage),
        ).length;

        // 2. Đơn hàng đang xử lý (orders with status: accepted, pending_packaging, packaged, shipping)
        const activeOrders = quotes.filter((quote) =>
          ["accepted", "pending_packaging", "packaged", "shipping"].includes(
            quote.quote_stage,
          ),
        ).length;

        // 3. Khách hàng mới (unique customers created in the last 7 days)
        const newCustomersCount = new Set(
          quotes
            .filter((quote) => {
              const quoteDate = new Date(quote.quote_date);
              return quoteDate >= oneWeekAgo;
            })
            .map((quote) => quote.customer_name?.toLowerCase().trim()),
        ).size;

        // 4. Payment analytics (existing logic)
        const unpaidCompletedQuotes = quotes.filter(
          (quote) =>
            quote.quote_stage === "completed" &&
            (quote.payment_status === "unpaid" || !quote.payment_status),
        );

        // Transform quotes to payment orders format
        const paymentOrdersData: B2BPaymentOrder[] = unpaidCompletedQuotes.map(
          (quote) => {
            // Calculate payment due date (30 days from quote_date)
            const quoteDate = new Date(quote.quote_date);
            const paymentDueDate = new Date(quoteDate);
            paymentDueDate.setDate(paymentDueDate.getDate() + 30);

            // Calculate days overdue
            const timeDiff = today.getTime() - paymentDueDate.getTime();
            const daysOverdue = Math.max(
              0,
              Math.ceil(timeDiff / (1000 * 3600 * 24)),
            );

            return {
              id: quote.quote_id,
              quoteId: quote.quote_id,
              orderNumber:
                quote.quote_number ||
                `B2B-${quote.quote_id.slice(-6).toUpperCase()}`,
              customerName: quote.customer_name || "Khách hàng không xác định",
              totalAmount: quote.total_value || 0,
              paymentDueDate: paymentDueDate.toISOString().split("T")[0],
              paymentStatus: daysOverdue > 0 ? "overdue" : "unpaid",
              daysOverdue: daysOverdue,
              orderDate: quote.quote_date,
              paymentTerms: "30 ngày",
            };
          },
        );

        setPaymentOrders(paymentOrdersData);

        // Calculate overdue payments
        const overdueCount = paymentOrdersData.filter(
          (order) => order.paymentStatus === "overdue",
        ).length;
        const totalOverdueAmount = paymentOrdersData
          .filter((order) => order.paymentStatus === "overdue")
          .reduce((sum, order) => sum + order.totalAmount, 0);

        // Calculate today's revenue (completed quotes from today)
        const todayRevenue = quotes
          .filter((quote) => {
            const quoteDate = new Date(quote.quote_date);
            return (
              quoteDate >= startOfToday && quote.quote_stage === "completed"
            );
          })
          .reduce((sum, quote) => sum + (quote.total_value || 0), 0);

        // Update all statistics
        setStats({
          pendingQuotes,
          activeOrders,
          newCustomers: newCustomersCount,
          todayRevenue,
          overduePayments: overdueCount,
          totalOverdueAmount,
        });

        // 5. Analyze inactive customers for customer care suggestions
        const inactiveCustomersData: InactiveCustomer[] = [];

        if (customers && customers.length > 0) {
          customers.forEach((customer) => {
            // Find all quotes for this customer
            const customerQuotes = quotes.filter(
              (quote) =>
                quote.b2b_customer_id === customer.customer_id ||
                quote.customer_name?.toLowerCase().trim() ===
                  customer.customer_name?.toLowerCase().trim(),
            );

            if (customerQuotes.length > 0) {
              // Get the most recent quote date
              const lastQuote = customerQuotes.reduce((latest, quote) =>
                new Date(quote.quote_date) > new Date(latest.quote_date)
                  ? quote
                  : latest,
              );

              const lastOrderDate = new Date(lastQuote.quote_date);
              const daysSinceLastOrder = Math.floor(
                (today.getTime() - lastOrderDate.getTime()) /
                  (1000 * 3600 * 24),
              );

              // Only include customers who haven't ordered in 30+ days
              if (daysSinceLastOrder >= 30) {
                const totalOrderValue = customerQuotes.reduce(
                  (sum, quote) => sum + (quote.total_value || 0),
                  0,
                );
                const averageOrderValue =
                  totalOrderValue / customerQuotes.length;

                // Determine risk level based on days since last order and customer value
                let riskLevel: "high" | "medium" | "low" = "low";
                if (daysSinceLastOrder >= 90 && averageOrderValue >= 10000000) {
                  riskLevel = "high"; // 90+ days and high-value customer
                } else if (daysSinceLastOrder >= 60) {
                  riskLevel = "medium"; // 60+ days
                }

                inactiveCustomersData.push({
                  customerId: customer.customer_id,
                  customerName: customer.customer_name,
                  customerCode: customer.customer_code,
                  contactPerson: customer.contact_person,
                  phoneNumber: customer.phone_number,
                  email: customer.email,
                  customerType: customer.customer_type,
                  lastOrderDate: lastQuote.quote_date,
                  daysSinceLastOrder,
                  totalOrders: customerQuotes.length,
                  totalOrderValue,
                  averageOrderValue,
                  riskLevel,
                });
              }
            }
          });

          // Sort by risk level and days since last order
          inactiveCustomersData.sort((a, b) => {
            const riskWeight = { high: 3, medium: 2, low: 1 };
            const aWeight =
              riskWeight[a.riskLevel] * 1000 + a.daysSinceLastOrder;
            const bWeight =
              riskWeight[b.riskLevel] * 1000 + b.daysSinceLastOrder;
            return bWeight - aWeight;
          });
        }

        setInactiveCustomers(inactiveCustomersData);

        // Generate todos from real data instead of mock
        const realTodos: TodoItem[] = [];

        // Add todos from pending quotes that need follow-up (older than 3 days)
        const threeDaysAgo = new Date(
          today.getTime() - 3 * 24 * 60 * 60 * 1000,
        );
        quotes
          .filter((quote) => {
            const quoteDate = new Date(quote.quote_date);
            return (
              ["sent", "negotiating"].includes(quote.quote_stage) &&
              quoteDate < threeDaysAgo
            );
          })
          .slice(0, 3)
          .forEach((quote) => {
            realTodos.push({
              id: `quote-${quote.quote_id}`,
              title: `Theo dõi báo giá ${quote.quote_number || `#${quote.quote_id.slice(-6)}`}`,
              description: `Khách hàng ${quote.customer_name || "không xác định"} chưa phản hồi báo giá gửi ${Math.floor((today.getTime() - new Date(quote.quote_date).getTime()) / (1000 * 60 * 60 * 24))} ngày trước`,
              priority: "high",
              status: "pending",
              dueDate: new Date(
                new Date(quote.quote_date).getTime() + 7 * 24 * 60 * 60 * 1000,
              )
                .toISOString()
                .split("T")[0],
              type: "quote",
            });
          });

        // Add todos from overdue payments
        paymentOrdersData
          .filter(
            (order) =>
              order.paymentStatus === "overdue" && order.daysOverdue > 0,
          )
          .slice(0, 2)
          .forEach((order) => {
            realTodos.push({
              id: `payment-${order.id}`,
              title: `Thu tiền đơn hàng ${order.orderNumber}`,
              description: `Khách hàng ${order.customerName} còn nợ ${order.totalAmount.toLocaleString("vi-VN")} ₫ (quá hạn ${order.daysOverdue} ngày)`,
              priority: "high",
              status: "pending",
              type: "order",
            });
          });

        // Add todos from inactive customers (high risk)
        inactiveCustomersData
          .filter((customer) => customer.riskLevel === "high")
          .slice(0, 2)
          .forEach((customer) => {
            realTodos.push({
              id: `customer-${customer.customerId}`,
              title: `Chăm sóc khách hàng ${customer.customerName}`,
              description: `Khách hàng không đặt hàng ${customer.daysSinceLastOrder} ngày, giá trị TB ${customer.averageOrderValue.toLocaleString("vi-VN")} ₫`,
              priority: "medium",
              status: "pending",
              type: "customer",
            });
          });

        setTodos(realTodos);

        console.log(`📊 Analytics loaded:
          - Pending quotes: ${pendingQuotes}
          - Active orders: ${activeOrders}
          - New customers: ${newCustomersCount}
          - Today revenue: ${todayRevenue.toLocaleString("vi-VN")} ₫
          - Overdue payments: ${overdueCount}
          - Total overdue: ${totalOverdueAmount.toLocaleString("vi-VN")} ₫
          - Inactive customers: ${inactiveCustomersData.length}
          - Todos generated: ${realTodos.length}`);
      }
    } catch (error) {
      console.error("💥 Error in loadAnalytics:", error);
      notification.error({
        message: "Lỗi hệ thống",
        description: "Đã xảy ra lỗi khi tải dữ liệu phân tích",
      });
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "red";
      case "medium":
        return "orange";
      case "low":
        return "green";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircleOutlined style={{ color: "#52c41a" }} />;
      case "in_progress":
        return <ClockCircleOutlined style={{ color: "#1890ff" }} />;
      case "pending":
        return <ExclamationCircleOutlined style={{ color: "#faad14" }} />;
      default:
        return <ClockCircleOutlined />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "quote":
        return <DollarOutlined />;
      case "order":
        return <ShoppingCartOutlined />;
      case "customer":
        return <UserOutlined />;
      default:
        return <ClockCircleOutlined />;
    }
  };

  const markAsCompleted = (todoId: string) => {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === todoId ? { ...todo, status: "completed" } : todo,
      ),
    );
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "green";
      case "partial":
        return "orange";
      case "overdue":
        return "red";
      case "unpaid":
        return "blue";
      default:
        return "default";
    }
  };

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case "paid":
        return "Đã thanh toán";
      case "partial":
        return "Thanh toán một phần";
      case "overdue":
        return "Quá hạn";
      case "unpaid":
        return "Chưa thanh toán";
      default:
        return status;
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case "high":
        return "red";
      case "medium":
        return "orange";
      case "low":
        return "blue";
      default:
        return "default";
    }
  };

  const getRiskLevelText = (level: string) => {
    switch (level) {
      case "high":
        return "Nguy cơ cao";
      case "medium":
        return "Nguy cơ trung bình";
      case "low":
        return "Nguy cơ thấp";
      default:
        return level;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const handleCustomerCareAction = (customer: InactiveCustomer) => {
    setSelectedCustomer(customer);
    setCustomerCareModalVisible(true);
  };

  const handleUpdatePaymentStatus = (order: B2BPaymentOrder) => {
    setSelectedOrder(order);
    setPaymentModalVisible(true);
  };

  const handlePaymentUpdate = async (newStatus: string) => {
    if (!selectedOrder) return;

    try {
      console.log(
        `🔄 Updating payment status for quote ${selectedOrder.quoteId} to ${newStatus}`,
      );

      // Update the payment status in the database
      const { error } = await updateB2BQuote(selectedOrder.quoteId, {
        payment_status: newStatus as any,
      });

      if (error) {
        console.error("❌ Error updating payment status:", error);
        notification.error({
          message: "Lỗi cập nhật",
          description:
            "Không thể cập nhật trạng thái thanh toán. Vui lòng thử lại.",
        });
        return;
      }

      // Update local state
      setPaymentOrders((prev) =>
        prev.map((order) =>
          order.id === selectedOrder.id
            ? { ...order, paymentStatus: newStatus as any }
            : order,
        ),
      );

      // Update statistics if status changed to/from overdue
      if (newStatus === "paid") {
        setStats((prev) => ({
          ...prev,
          overduePayments: Math.max(
            0,
            prev.overduePayments -
              (selectedOrder.paymentStatus === "overdue" ? 1 : 0),
          ),
          totalOverdueAmount: Math.max(
            0,
            prev.totalOverdueAmount -
              (selectedOrder.paymentStatus === "overdue"
                ? selectedOrder.totalAmount
                : 0),
          ),
        }));
      }

      notification?.success({
        message: "Cập nhật thành công",
        description: `Đã cập nhật trạng thái thanh toán cho đơn hàng ${selectedOrder.orderNumber}`,
      });

      console.log(
        `✅ Payment status updated successfully for ${selectedOrder.orderNumber}`,
      );

      setPaymentModalVisible(false);
      setSelectedOrder(null);

      // Optionally reload data to ensure consistency
      // loadAnalytics();
    } catch (error) {
      console.error("💥 Error in handlePaymentUpdate:", error);
      notification.error({
        message: "Lỗi hệ thống",
        description: "Đã xảy ra lỗi khi cập nhật trạng thái thanh toán",
      });
    }
  };

  const pendingTodos = todos.filter((todo) => todo.status !== "completed");
  const completedTodos = todos.filter((todo) => todo.status === "completed");

  return (
    <div style={{ padding: "24px" }}>
      <Title level={2}>📊 Dashboard Nhân viên Bán hàng</Title>
      <Text type="secondary">
        Xin chào {employee?.full_name || "Nhân viên"}! Đây là danh sách công
        việc hôm nay.
      </Text>

      {/* Statistics Cards */}
      <Row gutter={16} style={{ margin: "24px 0" }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Báo giá chờ phản hồi"
              value={stats.pendingQuotes}
              prefix={<DollarOutlined />}
              valueStyle={{ color: "#faad14" }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Đơn hàng đang xử lý"
              value={stats.activeOrders}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Khách hàng mới"
              value={stats.newCustomers}
              prefix={<UserOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Thanh toán quá hạn"
              value={stats.overduePayments}
              prefix={<WarningOutlined />}
              valueStyle={{ color: "#ff4d4f" }}
            />
          </Card>
        </Col>
      </Row>

      {/* B2B Payment Analytics - Only show if there are payment orders */}
      {paymentOrders.length > 0 && (
        <Card
          title={
            <Space>
              <CreditCardOutlined />
              Phân tích Thanh toán B2B
              <Tag color="red">
                {
                  paymentOrders.filter((o) => o.paymentStatus === "overdue")
                    .length
                }{" "}
                quá hạn
              </Tag>
            </Space>
          }
          style={{ margin: "24px 0" }}
          extra={
            <Space>
              <Statistic
                title="Tổng tiền quá hạn"
                value={stats.totalOverdueAmount}
                formatter={(value) =>
                  `${Number(value).toLocaleString("vi-VN")} ₫`
                }
                valueStyle={{ color: "#ff4d4f", fontSize: "14px" }}
              />
            </Space>
          }
        >
          <Table
            dataSource={paymentOrders}
            rowKey="id"
            size="small"
            loading={loading}
            scroll={{ x: 800 }}
            columns={[
              {
                title: "Số đơn hàng",
                dataIndex: "orderNumber",
                width: 120,
                render: (text) => <Text strong>{text}</Text>,
              },
              {
                title: "Khách hàng",
                dataIndex: "customerName",
                width: 200,
                ellipsis: true,
              },
              {
                title: "Số tiền",
                dataIndex: "totalAmount",
                width: 150,
                render: (amount) => (
                  <Text strong style={{ color: "#1890ff" }}>
                    {Number(amount).toLocaleString("vi-VN")} ₫
                  </Text>
                ),
              },
              {
                title: "Hạn thanh toán",
                dataIndex: "paymentDueDate",
                width: 120,
                render: (date) => (
                  <Space>
                    <CalendarOutlined />
                    {date}
                  </Space>
                ),
              },
              {
                title: "Trạng thái",
                dataIndex: "paymentStatus",
                width: 130,
                render: (status, record) => (
                  <Space direction="vertical" size={0}>
                    <Tag color={getPaymentStatusColor(status)}>
                      {getPaymentStatusText(status)}
                    </Tag>
                    {record.daysOverdue > 0 && (
                      <Text type="danger" style={{ fontSize: "11px" }}>
                        Quá hạn {record.daysOverdue} ngày
                      </Text>
                    )}
                  </Space>
                ),
              },
              {
                title: "Thao tác",
                width: 120,
                render: (_, record) => (
                  <Button
                    type="link"
                    size="small"
                    onClick={() => handleUpdatePaymentStatus(record)}
                    disabled={record.paymentStatus === "paid"}
                  >
                    Cập nhật
                  </Button>
                ),
              },
            ]}
            pagination={{
              pageSize: 5,
              showSizeChanger: false,
              showTotal: (total) => `Tổng ${total} đơn hàng`,
            }}
          />
        </Card>
      )}

      {/* Customer Care Suggestions - Only show if there are inactive customers */}
      {inactiveCustomers.length > 0 && (
        <Card
          title={
            <Space>
              <HeartOutlined />
              Gợi ý Chăm sóc Khách hàng
              <Tag color="orange">
                {inactiveCustomers.length} khách hàng cần chăm sóc
              </Tag>
            </Space>
          }
          style={{ margin: "24px 0" }}
          extra={
            <Text type="secondary">
              Khách hàng không đặt hàng từ 30 ngày trở lên
            </Text>
          }
        >
          <Table
            dataSource={inactiveCustomers.slice(0, 10)} // Show top 10 inactive customers
            rowKey="customerId"
            size="small"
            loading={loading}
            scroll={{ x: 900 }}
            columns={[
              {
                title: "Khách hàng",
                width: 200,
                render: (_, record) => (
                  <div>
                    <Text strong>{record.customerName}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: "12px" }}>
                      {record.customerCode} • {record.customerType}
                    </Text>
                  </div>
                ),
              },
              {
                title: "Liên hệ",
                width: 150,
                render: (_, record) => (
                  <div>
                    {record.contactPerson && (
                      <div style={{ fontSize: "12px" }}>
                        <Text>{record.contactPerson}</Text>
                      </div>
                    )}
                    {record.phoneNumber && (
                      <div style={{ fontSize: "12px" }}>
                        <PhoneOutlined /> {record.phoneNumber}
                      </div>
                    )}
                  </div>
                ),
              },
              {
                title: "Đơn hàng cuối",
                dataIndex: "lastOrderDate",
                width: 120,
                render: (date) => (
                  <Space>
                    <CalendarOutlined />
                    {new Date(date).toLocaleDateString("vi-VN")}
                  </Space>
                ),
              },
              {
                title: "Số ngày",
                dataIndex: "daysSinceLastOrder",
                width: 100,
                render: (days) => (
                  <Tag
                    color={days >= 90 ? "red" : days >= 60 ? "orange" : "blue"}
                  >
                    {days} ngày
                  </Tag>
                ),
              },
              {
                title: "Tổng ĐH",
                dataIndex: "totalOrders",
                width: 80,
                render: (count) => <Text strong>{count}</Text>,
              },
              {
                title: "Giá trị TB",
                dataIndex: "averageOrderValue",
                width: 130,
                render: (amount) => (
                  <Text style={{ color: "#1890ff", fontWeight: "bold" }}>
                    {formatCurrency(amount)}
                  </Text>
                ),
              },
              {
                title: "Mức độ",
                dataIndex: "riskLevel",
                width: 120,
                render: (level) => (
                  <Tag color={getRiskLevelColor(level)}>
                    {getRiskLevelText(level)}
                  </Tag>
                ),
              },
              {
                title: "Thao tác",
                width: 120,
                render: (_, record) => (
                  <Space>
                    <Button
                      type="link"
                      size="small"
                      icon={<PhoneOutlined />}
                      onClick={() => handleCustomerCareAction(record)}
                    >
                      Chăm sóc
                    </Button>
                  </Space>
                ),
              },
            ]}
            pagination={{
              pageSize: 10,
              showSizeChanger: false,
              showTotal: (total) => `${total} khách hàng cần chăm sóc`,
            }}
          />
        </Card>
      )}

      <Row gutter={16}>
        {/* Pending Tasks */}
        <Col span={16}>
          <Card
            title={
              <Space>
                <ClockCircleOutlined />
                Công việc cần xử lý ({pendingTodos.length})
              </Space>
            }
            extra={
              <Button type="primary" size="small">
                Tạo công việc mới
              </Button>
            }
          >
            <List
              dataSource={pendingTodos}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Button
                      type="link"
                      size="small"
                      onClick={() => markAsCompleted(item.id)}
                    >
                      Hoàn thành
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={getTypeIcon(item.type)}
                    title={
                      <Space>
                        <span>{item.title}</span>
                        <Tag color={getPriorityColor(item.priority)}>
                          {item.priority === "high"
                            ? "Ưu tiên cao"
                            : item.priority === "medium"
                              ? "Ưu tiên trung bình"
                              : "Ưu tiên thấp"}
                        </Tag>
                        {item.dueDate && (
                          <Tag color="blue">Hạn: {item.dueDate}</Tag>
                        )}
                      </Space>
                    }
                    description={item.description}
                  />
                  <div>{getStatusIcon(item.status)}</div>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* Quick Actions */}
        <Col span={8}>
          <Card title="⚡ Thao tác nhanh">
            <Space direction="vertical" style={{ width: "100%" }}>
              <Button type="primary" block icon={<DollarOutlined />}>
                Tạo báo giá mới
              </Button>
              <Button block icon={<ShoppingCartOutlined />}>
                Tạo đơn hàng
              </Button>
              <Button block icon={<UserOutlined />}>
                Thêm khách hàng
              </Button>
              <Button block>Xem báo cáo bán hàng</Button>
            </Space>
          </Card>

          {/* Completed Tasks */}
          <Card
            title={
              <Space>
                <CheckCircleOutlined style={{ color: "#52c41a" }} />
                Đã hoàn thành ({completedTodos.length})
              </Space>
            }
            style={{ marginTop: 16 }}
          >
            <List
              dataSource={completedTodos.slice(0, 3)}
              size="small"
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={<Text delete>{item.title}</Text>}
                    description={
                      <Text type="secondary" style={{ fontSize: "12px" }}>
                        {item.description}
                      </Text>
                    }
                  />
                </List.Item>
              )}
            />
            {completedTodos.length > 3 && (
              <Button type="link" size="small">
                Xem tất cả ({completedTodos.length})
              </Button>
            )}
          </Card>
        </Col>
      </Row>

      {/* Customer Care Modal */}
      <Modal
        title={`Chăm sóc khách hàng - ${selectedCustomer?.customerName}`}
        open={customerCareModalVisible}
        onCancel={() => {
          setCustomerCareModalVisible(false);
          setSelectedCustomer(null);
        }}
        footer={[
          <Button
            key="close"
            onClick={() => {
              setCustomerCareModalVisible(false);
              setSelectedCustomer(null);
            }}
          >
            Đóng
          </Button>,
          <Button key="call" type="primary" icon={<PhoneOutlined />}>
            Gọi điện
          </Button>,
        ]}
        width={600}
      >
        {selectedCustomer && (
          <div>
            <Space direction="vertical" style={{ width: "100%" }} size="large">
              <Row gutter={16}>
                <Col span={12}>
                  <div>
                    <Text strong>Mã khách hàng: </Text>
                    <Text>{selectedCustomer.customerCode}</Text>
                  </div>
                </Col>
                <Col span={12}>
                  <div>
                    <Text strong>Loại khách hàng: </Text>
                    <Text>{selectedCustomer.customerType}</Text>
                  </div>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <div>
                    <Text strong>Người liên hệ: </Text>
                    <Text>{selectedCustomer.contactPerson || "Chưa có"}</Text>
                  </div>
                </Col>
                <Col span={12}>
                  <div>
                    <Text strong>Số điện thoại: </Text>
                    <Text>{selectedCustomer.phoneNumber || "Chưa có"}</Text>
                  </div>
                </Col>
              </Row>

              <div>
                <Text strong>Email: </Text>
                <Text>{selectedCustomer.email || "Chưa có"}</Text>
              </div>

              <Row gutter={16}>
                <Col span={12}>
                  <div>
                    <Text strong>Đơn hàng cuối: </Text>
                    <Text>
                      {new Date(
                        selectedCustomer.lastOrderDate,
                      ).toLocaleDateString("vi-VN")}
                    </Text>
                  </div>
                </Col>
                <Col span={12}>
                  <div>
                    <Text strong>Số ngày không đặt hàng: </Text>
                    <Tag
                      color={
                        selectedCustomer.daysSinceLastOrder >= 90
                          ? "red"
                          : selectedCustomer.daysSinceLastOrder >= 60
                            ? "orange"
                            : "blue"
                      }
                    >
                      {selectedCustomer.daysSinceLastOrder} ngày
                    </Tag>
                  </div>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={8}>
                  <div>
                    <Text strong>Tổng đơn hàng: </Text>
                    <Text
                      style={{
                        fontSize: "16px",
                        fontWeight: "bold",
                        color: "#1890ff",
                      }}
                    >
                      {selectedCustomer.totalOrders}
                    </Text>
                  </div>
                </Col>
                <Col span={8}>
                  <div>
                    <Text strong>Tổng giá trị: </Text>
                    <Text
                      style={{
                        fontSize: "16px",
                        fontWeight: "bold",
                        color: "#52c41a",
                      }}
                    >
                      {formatCurrency(selectedCustomer.totalOrderValue)}
                    </Text>
                  </div>
                </Col>
                <Col span={8}>
                  <div>
                    <Text strong>Giá trị TB: </Text>
                    <Text
                      style={{
                        fontSize: "16px",
                        fontWeight: "bold",
                        color: "#722ed1",
                      }}
                    >
                      {formatCurrency(selectedCustomer.averageOrderValue)}
                    </Text>
                  </div>
                </Col>
              </Row>

              <div>
                <Text strong>Mức độ ưu tiên: </Text>
                <Tag
                  color={getRiskLevelColor(selectedCustomer.riskLevel)}
                  style={{ fontSize: "14px", padding: "4px 8px" }}
                >
                  {getRiskLevelText(selectedCustomer.riskLevel)}
                </Tag>
              </div>

              <div
                style={{
                  backgroundColor: "#f6ffed",
                  border: "1px solid #b7eb8f",
                  borderRadius: "6px",
                  padding: "12px",
                  marginTop: "16px",
                }}
              >
                <Text strong style={{ color: "#389e0d" }}>
                  💡 Gợi ý chăm sóc khách hàng:
                </Text>
                <ul
                  style={{
                    marginTop: "8px",
                    marginBottom: "0",
                    paddingLeft: "20px",
                  }}
                >
                  <li>Gọi điện thoại để hỏi thăm tình hình kinh doanh</li>
                  <li>
                    Gửi email thông báo về sản phẩm mới hoặc chương trình khuyến
                    mãi
                  </li>
                  <li>Lên lịch thăm khách hàng trực tiếp</li>
                  {selectedCustomer.riskLevel === "high" && (
                    <li style={{ color: "#cf1322" }}>
                      <strong>Ưu tiên cao:</strong> Khách hàng có giá trị lớn,
                      cần chăm sóc đặc biệt
                    </li>
                  )}
                </ul>
              </div>
            </Space>
          </div>
        )}
      </Modal>

      {/* Payment Status Update Modal */}
      <Modal
        title={`Cập nhật trạng thái thanh toán - ${selectedOrder?.orderNumber}`}
        open={paymentModalVisible}
        onCancel={() => setPaymentModalVisible(false)}
        footer={null}
        width={500}
      >
        {selectedOrder && (
          <div>
            <Space direction="vertical" style={{ width: "100%" }} size="large">
              <div>
                <Text strong>Khách hàng: </Text>
                <Text>{selectedOrder.customerName}</Text>
              </div>
              <div>
                <Text strong>Số tiền: </Text>
                <Text
                  style={{
                    color: "#1890ff",
                    fontSize: "16px",
                    fontWeight: "bold",
                  }}
                >
                  {Number(selectedOrder.totalAmount).toLocaleString("vi-VN")} ₫
                </Text>
              </div>
              <div>
                <Text strong>Hạn thanh toán: </Text>
                <Text>{selectedOrder.paymentDueDate}</Text>
                {selectedOrder.daysOverdue > 0 && (
                  <Tag color="red" style={{ marginLeft: 8 }}>
                    Quá hạn {selectedOrder.daysOverdue} ngày
                  </Tag>
                )}
              </div>
              <div>
                <Text strong>Trạng thái hiện tại: </Text>
                <Tag color={getPaymentStatusColor(selectedOrder.paymentStatus)}>
                  {getPaymentStatusText(selectedOrder.paymentStatus)}
                </Tag>
              </div>

              <div>
                <Text strong>Cập nhật trạng thái mới:</Text>
                <div style={{ marginTop: 8 }}>
                  <Space wrap>
                    <Button
                      type={
                        selectedOrder.paymentStatus === "unpaid"
                          ? "primary"
                          : "default"
                      }
                      onClick={() => handlePaymentUpdate("unpaid")}
                    >
                      Chưa thanh toán
                    </Button>
                    <Button
                      type={
                        selectedOrder.paymentStatus === "partial"
                          ? "primary"
                          : "default"
                      }
                      onClick={() => handlePaymentUpdate("partial")}
                    >
                      Thanh toán một phần
                    </Button>
                    <Button
                      type={
                        selectedOrder.paymentStatus === "paid"
                          ? "primary"
                          : "default"
                      }
                      onClick={() => handlePaymentUpdate("paid")}
                      style={{
                        backgroundColor: "#52c41a",
                        borderColor: "#52c41a",
                      }}
                    >
                      Đã thanh toán
                    </Button>
                  </Space>
                </div>
              </div>
            </Space>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SalesStaffDashboardPage;
