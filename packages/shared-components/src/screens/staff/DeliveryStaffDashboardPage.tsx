import React, { useState, useEffect } from "react";
import {
  Card,
  List,
  Button,
  Typography,
  Row,
  Col,
  Statistic,
  Tag,
  Space,
  Timeline,
} from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  TruckOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  CarOutlined,
  ShoppingOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

interface TodoItem {
  id: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  status: "pending" | "in_progress" | "completed";
  dueDate?: string;
  type: "delivery" | "pickup" | "contact" | "general";
  orderId?: string;
  customerInfo?: {
    name: string;
    phone: string;
    address: string;
  };
}

interface DeliveryStaffDashboardPageProps {
  employee?: any;
}

const DeliveryStaffDashboardPage: React.FC<DeliveryStaffDashboardPageProps> = ({
  employee,
}) => {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [stats, setStats] = useState({
    todayDeliveries: 0,
    pendingPickups: 0,
    completedDeliveries: 0,
    totalDistance: 0,
  });

  useEffect(() => {
    // Load real data for delivery staff
    loadDeliveryData();
  }, []);

  const loadDeliveryData = async () => {
    try {
      // Import services
      const { getB2BQuotes } = await import("@nam-viet-erp/services");

      // Fetch B2B quotes that need delivery
      const { data: quotes, error } = await getB2BQuotes();

      if (error) {
        console.error("Error loading delivery data:", error);
        return;
      }

      const today = new Date();
      const startOfToday = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
      );

      // Calculate stats from real data
      const todayDeliveries =
        quotes?.filter((q) => {
          const quoteDate = new Date(q.quote_date);
          return (
            quoteDate >= startOfToday &&
            ["packaged", "shipping"].includes(q.quote_stage)
          );
        }).length || 0;

      const pendingPickups =
        quotes?.filter(
          (q) => q.quote_stage === "completed" && q.payment_status === "unpaid",
        ).length || 0;

      const completedDeliveries =
        quotes?.filter((q) => q.quote_stage === "completed").length || 0;

      // Generate todos from real data
      const realTodos: TodoItem[] = [];

      quotes
        ?.filter((q) => ["packaged", "shipping"].includes(q.quote_stage))
        .slice(0, 5)
        .forEach((quote) => {
          // Use valid_until as delivery deadline if available, otherwise use quote_date + 7 days
          const quoteDate = new Date(quote.quote_date);
          const validUntil = quote.valid_until
            ? new Date(quote.valid_until)
            : null;
          const deliveryDeadline =
            validUntil ||
            new Date(quoteDate.getTime() + 7 * 24 * 60 * 60 * 1000);
          const isUrgent =
            deliveryDeadline < new Date(Date.now() + 24 * 60 * 60 * 1000);

          realTodos.push({
            id: `delivery-${quote.quote_id}`,
            title: `Giao hàng đơn ${quote.quote_number || `#${quote.quote_id.slice(-6)}`}`,
            description: `Giao hàng cho ${quote.customer_name || "Khách hàng không xác định"} - Tổng giá trị: ${(quote.total_value || 0).toLocaleString("vi-VN")} ₫`,
            priority: isUrgent ? "high" : "medium",
            status: "pending",
            dueDate: deliveryDeadline.toLocaleDateString("vi-VN"),
            type: "delivery",
            orderId: quote.quote_number || quote.quote_id.slice(-6),
            customerInfo: {
              name: quote.customer_name || "Không xác định",
              phone: quote.customer_phone || "",
              address: quote.customer_address || "",
            },
          });
        });

      setTodos(realTodos);

      setStats({
        todayDeliveries,
        pendingPickups,
        completedDeliveries,
        totalDistance: 0, // TODO: Calculate from delivery routes if available
      });
    } catch (error) {
      console.error("Error in loadDeliveryData:", error);
    }
  };

  // Data loading is handled by loadDeliveryData() in first useEffect

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
      case "delivery":
        return <TruckOutlined />;
      case "pickup":
        return <CarOutlined />;
      case "contact":
        return <PhoneOutlined />;
      default:
        return <ShoppingOutlined />;
    }
  };

  const markAsCompleted = (todoId: string) => {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === todoId ? { ...todo, status: "completed" } : todo,
      ),
    );
  };

  const markAsInProgress = (todoId: string) => {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === todoId ? { ...todo, status: "in_progress" } : todo,
      ),
    );
  };

  const pendingTodos = todos.filter((todo) => todo.status !== "completed");
  const completedTodos = todos.filter((todo) => todo.status === "completed");
  const todayDeliveries = todos.filter((todo) => todo.type === "delivery");

  return (
    <div style={{ padding: "12px" }}>
      <Title level={2}>🚚 Dashboard Nhân viên Giao hàng</Title>
      <Text type="secondary">
        Xin chào {employee?.full_name || "Nhân viên"}! Đây là lịch trình giao
        hàng hôm nay.
      </Text>

      {/* Statistics Cards */}
      <Row gutter={16} style={{ margin: "24px 0" }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Giao hàng hôm nay"
              value={stats.todayDeliveries}
              prefix={<TruckOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Chờ thu hồi"
              value={stats.pendingPickups}
              prefix={<CarOutlined />}
              valueStyle={{ color: "#faad14" }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Đã hoàn thành"
              value={stats.completedDeliveries}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Tổng quãng đường"
              value={stats.totalDistance}
              suffix="km"
              prefix={<EnvironmentOutlined />}
              valueStyle={{ color: "#722ed1" }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        {/* Pending Tasks */}
        <Col span={16}>
          <Card
            title={
              <Space>
                <ClockCircleOutlined />
                Lịch trình giao hàng ({pendingTodos.length})
              </Space>
            }
            extra={
              <Button type="primary" size="small">
                Tối ưu lộ trình
              </Button>
            }
          >
            <List
              dataSource={pendingTodos}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    item.status === "pending" && (
                      <Button
                        type="link"
                        size="small"
                        onClick={() => markAsInProgress(item.id)}
                      >
                        Bắt đầu
                      </Button>
                    ),
                    <Button
                      type="link"
                      size="small"
                      onClick={() => markAsCompleted(item.id)}
                    >
                      Hoàn thành
                    </Button>,
                  ].filter(Boolean)}
                >
                  <List.Item.Meta
                    avatar={getTypeIcon(item.type)}
                    title={
                      <Space direction="vertical" size={0}>
                        <Space>
                          <span>{item.title}</span>
                          <Tag color={getPriorityColor(item.priority)}>
                            {item.priority === "high"
                              ? "Khẩn cấp"
                              : item.priority === "medium"
                                ? "Ưu tiên"
                                : "Bình thường"}
                          </Tag>
                          {item.dueDate && (
                            <Tag color="blue">{item.dueDate}</Tag>
                          )}
                        </Space>
                        {item.customerInfo && (
                          <Space size={12}>
                            <Text strong style={{ fontSize: "12px" }}>
                              {item.customerInfo.name}
                            </Text>
                            <Text type="secondary" style={{ fontSize: "12px" }}>
                              <PhoneOutlined /> {item.customerInfo.phone}
                            </Text>
                          </Space>
                        )}
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size={0}>
                        <Text>{item.description}</Text>
                        {item.customerInfo && (
                          <Text type="secondary" style={{ fontSize: "12px" }}>
                            <EnvironmentOutlined /> {item.customerInfo.address}
                          </Text>
                        )}
                      </Space>
                    }
                  />
                  <div>{getStatusIcon(item.status)}</div>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* Quick Actions & Timeline */}
        <Col span={8}>
          <Card title="⚡ Thao tác nhanh">
            <Space direction="vertical" style={{ width: "100%" }}>
              <Button type="primary" block icon={<TruckOutlined />}>
                Bắt đầu giao hàng
              </Button>
              <Button block icon={<EnvironmentOutlined />}>
                Xem bản đồ
              </Button>
              <Button block icon={<PhoneOutlined />}>
                Gọi khách hàng
              </Button>
              <Button block>Báo cáo giao hàng</Button>
            </Space>
          </Card>

          {/* Delivery Timeline */}
          <Card
            title={
              <Space>
                <ClockCircleOutlined />
                Lịch trình hôm nay
              </Space>
            }
            style={{ marginTop: 16 }}
          >
            <Timeline
              items={todayDeliveries.slice(0, 4).map((item) => ({
                color:
                  item.status === "completed"
                    ? "green"
                    : item.status === "in_progress"
                      ? "blue"
                      : "gray",
                children: (
                  <div>
                    <Text style={{ fontSize: "12px" }} strong>
                      {item.dueDate}
                    </Text>
                    <br />
                    <Text style={{ fontSize: "11px" }}>
                      {item.customerInfo?.name}
                    </Text>
                  </div>
                ),
              }))}
            />
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
                    title={
                      <Text delete style={{ fontSize: "12px" }}>
                        {item.title}
                      </Text>
                    }
                    description={
                      <Text type="secondary" style={{ fontSize: "10px" }}>
                        {item.customerInfo?.name}
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
    </div>
  );
};

export default DeliveryStaffDashboardPage;
