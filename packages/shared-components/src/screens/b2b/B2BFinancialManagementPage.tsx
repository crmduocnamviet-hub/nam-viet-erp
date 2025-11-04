import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  Input,
  Select,
  DatePicker,
  Tag,
  Row,
  Col,
  Statistic,
  Modal,
  Form,
  message,
  notification,
  Empty,
} from "antd";
import {
  SearchOutlined,
  EyeOutlined,
  ReloadOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  EditOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import {
  getB2BQuotes,
  updateB2BQuote,
  getB2BCustomers,
} from "@nam-viet-erp/services";
import { useEmployeeStore } from "@nam-viet-erp/store";
import PageLayout from "../../components/PageLayout";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface B2BFinancialManagementPageProps {
  employee?: IEmployee | null;
  user?: any | null;
}

interface PaymentOrder {
  id: string;
  quoteId: string;
  orderNumber: string;
  customerName: string;
  totalAmount: number;
  paymentDueDate: string;
  paymentStatus: "unpaid" | "partial" | "paid" | "overdue";
  daysOverdue: number;
  orderDate: string;
  quoteDate: string;
}

const B2BFinancialManagementPage: React.FC<B2BFinancialManagementPageProps> = ({
  employee,
  user,
}) => {
  const navigate = useNavigate();
  const hasPermission = useEmployeeStore((state) => state.hasPermission);
  const [loading, setLoading] = useState(false);
  const [quotes, setQuotes] = useState<IB2BQuote[]>([]);
  const [paymentOrders, setPaymentOrders] = useState<PaymentOrder[]>([]);
  const [searchText, setSearchText] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(
    null,
  );
  const [selectedOrder, setSelectedOrder] = useState<PaymentOrder | null>(null);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [form] = Form.useForm();

  // Load B2B quotes
  const loadQuotes = async () => {
    setLoading(true);
    try {
      const filters: any = {
        limit: 1000, // Get all quotes for financial tracking
      };

      if (dateRange && dateRange[0] && dateRange[1]) {
        filters.startDate = dateRange[0].format("YYYY-MM-DD");
        filters.endDate = dateRange[1].format("YYYY-MM-DD");
      }

      const { data, error } = await getB2BQuotes(filters);

      if (error) {
        throw error;
      }

      setQuotes(data || []);

      // Transform to payment orders
      const today = new Date();
      const paymentOrdersData: PaymentOrder[] = (data || [])
        .filter(
          (quote) =>
            quote.quote_stage === "completed" &&
            (quote.payment_status === "unpaid" ||
              quote.payment_status === "partial" ||
              quote.payment_status === "overdue" ||
              !quote.payment_status),
        )
        .map((quote) => {
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
            paymentStatus:
              quote.payment_status || (daysOverdue > 0 ? "overdue" : "unpaid"),
            daysOverdue: daysOverdue,
            orderDate: quote.quote_date,
            quoteDate: quote.quote_date,
          };
        });

      setPaymentOrders(paymentOrdersData);
    } catch (error: any) {
      notification.error({
        message: "Lỗi tải dữ liệu",
        description: error.message || "Không thể tải danh sách thanh toán",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuotes();
  }, [dateRange]);

  // Filter payment orders
  const filteredOrders = useMemo(() => {
    let filtered = paymentOrders;

    // Filter by payment status
    if (paymentFilter && paymentFilter !== "all") {
      filtered = filtered.filter(
        (order) => order.paymentStatus === paymentFilter,
      );
    }

    // Filter by search text
    if (searchText) {
      const lowerSearch = searchText.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order.orderNumber.toLowerCase().includes(lowerSearch) ||
          order.customerName.toLowerCase().includes(lowerSearch),
      );
    }

    return filtered;
  }, [paymentOrders, paymentFilter, searchText]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const total = filteredOrders.length;
    const totalAmount = filteredOrders.reduce(
      (sum, order) => sum + order.totalAmount,
      0,
    );
    const unpaid = filteredOrders.filter(
      (order) => order.paymentStatus === "unpaid",
    ).length;
    const overdue = filteredOrders.filter(
      (order) => order.paymentStatus === "overdue",
    ).length;
    const overdueAmount = filteredOrders
      .filter((order) => order.paymentStatus === "overdue")
      .reduce((sum, order) => sum + order.totalAmount, 0);
    const partial = filteredOrders.filter(
      (order) => order.paymentStatus === "partial",
    ).length;
    const paid = filteredOrders.filter(
      (order) => order.paymentStatus === "paid",
    ).length;

    return {
      total,
      totalAmount,
      unpaid,
      overdue,
      overdueAmount,
      partial,
      paid,
    };
  }, [filteredOrders]);

  // Handle update payment status
  const handleUpdatePaymentStatus = (order: PaymentOrder) => {
    setSelectedOrder(order);
    form.setFieldsValue({ paymentStatus: order.paymentStatus });
    setPaymentModalVisible(true);
  };

  // Handle save payment status
  const handleSavePaymentStatus = async (values: any) => {
    if (!selectedOrder) return;

    try {
      const { error } = await updateB2BQuote(selectedOrder.quoteId, {
        payment_status: values.paymentStatus,
      });

      if (error) {
        throw error;
      }

      notification.success({
        message: "Cập nhật thành công",
        description: `Đã cập nhật trạng thái thanh toán cho đơn hàng ${selectedOrder.orderNumber}`,
      });

      setPaymentModalVisible(false);
      setSelectedOrder(null);
      form.resetFields();
      loadQuotes();
    } catch (error: any) {
      notification.error({
        message: "Lỗi cập nhật",
        description:
          error.message || "Không thể cập nhật trạng thái thanh toán",
      });
    }
  };

  // Table columns
  const columns: ColumnsType<PaymentOrder> = [
    {
      title: "Mã Đơn",
      dataIndex: "orderNumber",
      key: "orderNumber",
      width: 150,
      render: (text: string) => (
        <Text strong style={{ color: "#1890ff" }}>
          {text}
        </Text>
      ),
    },
    {
      title: "Khách Hàng",
      dataIndex: "customerName",
      key: "customerName",
      width: 200,
    },
    {
      title: "Số Tiền",
      dataIndex: "totalAmount",
      key: "totalAmount",
      width: 150,
      align: "right" as const,
      render: (amount: number) => (
        <Text strong style={{ color: "#52c41a" }}>
          {amount?.toLocaleString("vi-VN", {
            style: "currency",
            currency: "VND",
          })}
        </Text>
      ),
    },
    {
      title: "Hạn Thanh Toán",
      dataIndex: "paymentDueDate",
      key: "paymentDueDate",
      width: 150,
      render: (date: string) => dayjs(date).format("DD/MM/YYYY"),
    },
    {
      title: "Trạng Thái",
      dataIndex: "paymentStatus",
      key: "paymentStatus",
      width: 150,
      render: (status: string, record: PaymentOrder) => {
        const statusConfig: Record<string, { color: string; text: string }> = {
          unpaid: { color: "default", text: "Chưa thanh toán" },
          partial: { color: "warning", text: "Thanh toán một phần" },
          paid: { color: "success", text: "Đã thanh toán" },
          overdue: { color: "error", text: "Quá hạn" },
        };
        const config = statusConfig[status] || {
          color: "default",
          text: status,
        };
        return (
          <Space>
            <Tag color={config.color}>{config.text}</Tag>
            {status === "overdue" && (
              <Text type="danger" style={{ fontSize: 12 }}>
                ({record.daysOverdue} ngày)
              </Text>
            )}
          </Space>
        );
      },
    },
    {
      title: "Ngày Đơn",
      dataIndex: "quoteDate",
      key: "quoteDate",
      width: 150,
      render: (date: string) => dayjs(date).format("DD/MM/YYYY"),
    },
    {
      title: "Hành Động",
      key: "actions",
      width: 120,
      fixed: "right" as const,
      render: (_: any, record: PaymentOrder) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleUpdatePaymentStatus(record)}
            disabled={!hasPermission("b2b.edit")}
          >
            Cập nhật
          </Button>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/b2b/orders/edit/${record.quoteId}`)}
          >
            Xem
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <PageLayout
      title="Quản Lý Tài Chính B2B"
      breadcrumbs={[
        { title: "Trang chủ", href: "/", icon: null },
        { title: "Quản lý tài chính B2B", icon: null },
      ]}
    >
      {/* Statistics */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng Đơn Chưa Thanh Toán"
              value={statistics.total}
              prefix={<DollarOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng Số Tiền"
              value={statistics.totalAmount}
              precision={0}
              suffix="đ"
              prefix={<DollarOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Đơn Quá Hạn"
              value={statistics.overdue}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: "#ff4d4f" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Số Tiền Quá Hạn"
              value={statistics.overdueAmount}
              precision={0}
              suffix="đ"
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: "#ff4d4f" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: 24 }}>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          {/* Search and Refresh Row */}
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={18} md={16} lg={18}>
              <Input
                size="large"
                placeholder="Tìm kiếm theo mã đơn, khách hàng..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
                style={{ width: "100%" }}
              />
            </Col>
            <Col xs={24} sm={6} md={4} lg={3}>
              <Button
                size="large"
                icon={<ReloadOutlined />}
                onClick={loadQuotes}
                loading={loading}
                block
                style={{ width: "100%" }}
              >
                Làm mới
              </Button>
            </Col>
          </Row>

          {/* Filter Row */}
          <Row gutter={16} align="middle">
            <Col xs={24} sm={12} md={6}>
              <Select
                size="large"
                placeholder="Trạng thái thanh toán"
                value={paymentFilter}
                onChange={setPaymentFilter}
                style={{ width: "100%" }}
                allowClear
              >
                <Select.Option value="all">Tất cả</Select.Option>
                <Select.Option value="unpaid">Chưa thanh toán</Select.Option>
                <Select.Option value="partial">
                  Thanh toán một phần
                </Select.Option>
                <Select.Option value="overdue">Quá hạn</Select.Option>
                <Select.Option value="paid">Đã thanh toán</Select.Option>
              </Select>
            </Col>
            <Col xs={24} sm={24} md={12}>
              <RangePicker
                size="large"
                style={{ width: "100%" }}
                format="DD/MM/YYYY"
                value={dateRange}
                onChange={(dates) => setDateRange(dates as any)}
                placeholder={["Từ ngày", "Đến ngày"]}
              />
            </Col>
          </Row>
        </Space>
      </Card>

      {/* Payment Orders Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredOrders}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} đơn hàng`,
            pageSize: 20,
          }}
          locale={{
            emptyText: (
              <Empty
                description="Không có đơn hàng nào cần thanh toán"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ),
          }}
        />
      </Card>

      {/* Payment Status Update Modal */}
      <Modal
        title={`Cập nhật Trạng thái Thanh toán - ${selectedOrder?.orderNumber}`}
        open={paymentModalVisible}
        onCancel={() => {
          setPaymentModalVisible(false);
          setSelectedOrder(null);
          form.resetFields();
        }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSavePaymentStatus}>
          <Form.Item
            name="paymentStatus"
            label="Trạng thái thanh toán"
            rules={[
              {
                required: true,
                message: "Vui lòng chọn trạng thái thanh toán",
              },
            ]}
          >
            <Select placeholder="Chọn trạng thái">
              <Select.Option value="unpaid">Chưa thanh toán</Select.Option>
              <Select.Option value="partial">Thanh toán một phần</Select.Option>
              <Select.Option value="paid">Đã thanh toán</Select.Option>
              <Select.Option value="overdue">Quá hạn</Select.Option>
            </Select>
          </Form.Item>

          {selectedOrder && (
            <div style={{ marginBottom: 16 }}>
              <Text type="secondary">Khách hàng: </Text>
              <Text strong>{selectedOrder.customerName}</Text>
              <br />
              <Text type="secondary">Số tiền: </Text>
              <Text strong style={{ color: "#52c41a" }}>
                {selectedOrder.totalAmount.toLocaleString("vi-VN", {
                  style: "currency",
                  currency: "VND",
                })}
              </Text>
            </div>
          )}

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Lưu
              </Button>
              <Button
                onClick={() => {
                  setPaymentModalVisible(false);
                  setSelectedOrder(null);
                  form.resetFields();
                }}
              >
                Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </PageLayout>
  );
};

export default B2BFinancialManagementPage;
