import React, { useState, useEffect, useMemo } from "react";
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
  Empty,
  notification,
  Modal,
} from "antd";
import { SearchOutlined, EyeOutlined, ReloadOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { getSalesOrders, getSalesOrderById } from "@nam-viet-erp/services";
import { useAuthStore } from "@nam-viet-erp/store";
import PageLayout from "../../components/PageLayout";

const { Text } = Typography;
const { RangePicker } = DatePicker;

interface POSOrderListPageProps {
  employee?: IEmployee | null;
}

const POSOrderListPage: React.FC<POSOrderListPageProps> = ({ employee }) => {
  const user = useAuthStore((state) => state.user);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(
    null,
  );
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  // Load POS orders - load all and filter client-side
  const loadOrders = async () => {
    setLoading(true);
    try {
      const filters: any = {
        orderType: "pos",
        limit: 1000, // Load more for client-side filtering
      };

      // Only apply date range filter at API level
      if (dateRange && dateRange[0] && dateRange[1]) {
        filters.startDate = dateRange[0].format("YYYY-MM-DD");
        filters.endDate = dateRange[1].format("YYYY-MM-DD");
      }

      const { data, error } = await getSalesOrders(filters);

      if (error) {
        throw error;
      }

      const ordersData = data || [];
      setOrders(ordersData);

      // Debug: Log data structure and unique values for filter testing
      if (ordersData.length > 0) {
        try {
          const uniqueStatuses = [
            ...new Set(
              ordersData.map((o: any) => o.operational_status).filter(Boolean),
            ),
          ];
          const uniquePaymentStatuses = [
            ...new Set(
              ordersData.map((o: any) => o.payment_status).filter(Boolean),
            ),
          ];

          // Get sample order structure (safe stringify)
          const sampleOrder = {
            order_id: ordersData[0].order_id,
            operational_status: ordersData[0].operational_status,
            payment_status: ordersData[0].payment_status,
            total_value: ordersData[0].total_value,
            order_datetime: ordersData[0].order_datetime,
            patient_id: ordersData[0].patient_id,
            patients: ordersData[0].patients
              ? {
                  full_name: Array.isArray(ordersData[0].patients)
                    ? ordersData[0].patients[0]?.full_name
                    : ordersData[0].patients?.full_name,
                  phone_number: Array.isArray(ordersData[0].patients)
                    ? ordersData[0].patients[0]?.phone_number
                    : ordersData[0].patients?.phone_number,
                }
              : null,
            items_count: ordersData[0].sales_order_items?.length || 0,
          };

          console.log("==========================================");
          console.log("📦 POS ORDER LIST DATA STRUCTURE");
          console.log("==========================================");
          console.log("Total orders loaded:", ordersData.length);
          console.log("\n📊 Sample order structure:");
          console.log(JSON.stringify(sampleOrder, null, 2));
          console.log("\n🔍 Unique operational_status values:");
          console.log(uniqueStatuses);
          console.log("\n💰 Unique payment_status values:");
          console.log(uniquePaymentStatuses);
          console.log("\n📋 All operational_status counts:");
          const statusCounts: Record<string, number> = {};
          ordersData.forEach((o: any) => {
            const status = o.operational_status || "null";
            statusCounts[status] = (statusCounts[status] || 0) + 1;
          });
          console.log(statusCounts);
          console.log("\n📋 All payment_status counts:");
          const paymentCounts: Record<string, number> = {};
          ordersData.forEach((o: any) => {
            const payment = o.payment_status || "null";
            paymentCounts[payment] = (paymentCounts[payment] || 0) + 1;
          });
          console.log(paymentCounts);
          console.log("==========================================");
        } catch (err) {
          console.error("Error logging data structure:", err);
        }
      }
    } catch (error: any) {
      notification.error({
        message: "Lỗi tải dữ liệu",
        description: error.message || "Không thể tải danh sách đơn hàng",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]); // Only reload when date range changes

  // Combined filter: search + status + payment (client-side)
  const filteredOrders = useMemo(() => {
    let filtered = orders;

    // Filter by status - handle both Vietnamese and English
    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter((order) => {
        const orderStatus = (order.operational_status || "").toString().trim();
        const filterStatus = statusFilter.toString().trim();

        // Direct match
        if (orderStatus === filterStatus) return true;

        // Case-insensitive match
        if (orderStatus.toLowerCase() === filterStatus.toLowerCase())
          return true;

        // Mapping for Vietnamese <-> English
        const statusMapping: Record<string, string[]> = {
          "Hoàn tất": ["completed", "Completed", "COMPLETED"],
          completed: ["Hoàn tất"],
          "Đang xử lý": ["processing", "Processing", "PROCESSING"],
          processing: ["Đang xử lý"],
          "Đã giao": ["delivered", "Delivered", "DELIVERED"],
          delivered: ["Đã giao"],
          "Đã hủy": [
            "cancelled",
            "Cancelled",
            "CANCELLED",
            "canceled",
            "Canceled",
          ],
          cancelled: ["Đã hủy"],
          canceled: ["Đã hủy"],
        };

        const mappedValues = statusMapping[filterStatus] || [];
        return mappedValues.some(
          (val) =>
            orderStatus === val ||
            orderStatus.toLowerCase() === val.toLowerCase(),
        );
      });
    }

    // Filter by payment status - handle both Vietnamese and English
    if (paymentFilter && paymentFilter !== "all") {
      filtered = filtered.filter((order) => {
        const paymentStatus = (order.payment_status || "").toString().trim();
        const filterPayment = paymentFilter.toString().trim();

        // Direct match
        if (paymentStatus === filterPayment) return true;

        // Case-insensitive match
        if (paymentStatus.toLowerCase() === filterPayment.toLowerCase())
          return true;

        // Mapping for Vietnamese <-> English
        const paymentMapping: Record<string, string[]> = {
          "Đã thanh toán": ["paid", "Paid", "PAID"],
          paid: ["Đã thanh toán"],
          "Chờ thanh toán": [
            "pending",
            "Pending",
            "PENDING",
            "unpaid",
            "Unpaid",
          ],
          pending: ["Chờ thanh toán"],
          unpaid: ["Chờ thanh toán"],
          "Thanh toán thiếu": ["partial", "Partial", "PARTIAL"],
          partial: ["Thanh toán thiếu"],
        };

        const mappedValues = paymentMapping[filterPayment] || [];
        return mappedValues.some(
          (val) =>
            paymentStatus === val ||
            paymentStatus.toLowerCase() === val.toLowerCase(),
        );
      });
    }

    // Filter by search text
    if (searchText && searchText.trim()) {
      const lowerSearch = searchText.toLowerCase().trim();
      filtered = filtered.filter((order) => {
        // Search by order ID
        const orderId = order.order_id?.toString().toLowerCase() || "";
        if (orderId.includes(lowerSearch)) return true;

        // Search by customer name (handle patients as object or array)
        const patient = order.patients;
        if (patient) {
          const patientData = Array.isArray(patient) ? patient[0] : patient;
          const fullName = (patientData?.full_name || "")
            .toString()
            .toLowerCase();
          if (fullName.includes(lowerSearch)) return true;

          // Search by phone number
          const phoneNumber = (patientData?.phone_number || "")
            .toString()
            .toLowerCase();
          if (phoneNumber.includes(lowerSearch)) return true;
        }

        // Search "Khách lẻ" if no patient
        if (!patient && "khách lẻ".includes(lowerSearch)) return true;

        // Search by product name in order items
        const items = order.sales_order_items || [];
        if (Array.isArray(items) && items.length > 0) {
          const hasMatchingProduct = items.some((item: any) => {
            const product = item.products;
            if (product) {
              const productData = Array.isArray(product) ? product[0] : product;
              const productName = (productData?.name || "")
                .toString()
                .toLowerCase();
              return productName.includes(lowerSearch);
            }
            return false;
          });
          if (hasMatchingProduct) return true;
        }

        return false;
      });
    }

    return filtered;
  }, [orders, searchText, statusFilter, paymentFilter]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const total = filteredOrders.length;
    const totalValue = filteredOrders.reduce(
      (sum, order) => sum + (order.total_value || 0),
      0,
    );
    const paid = filteredOrders.filter(
      (o) => o.payment_status === "Đã thanh toán",
    ).length;
    const unpaid = filteredOrders.filter(
      (o) =>
        o.payment_status === "Chờ thanh toán" ||
        o.payment_status === "Thanh toán thiếu",
    ).length;

    return { total, totalValue, paid, unpaid };
  }, [filteredOrders]);

  // Handle view order details
  const handleView = async (record: any) => {
    try {
      const { data, error } = await getSalesOrderById(record.order_id);
      if (error) {
        notification.error({
          message: "Lỗi",
          description: "Không thể tải chi tiết đơn hàng",
        });
        return;
      }
      setSelectedOrder(data);
      setViewModalOpen(true);
    } catch (error: any) {
      notification.error({
        message: "Lỗi",
        description: error.message || "Không thể tải chi tiết đơn hàng",
      });
    }
  };

  // Table columns
  const columns: ColumnsType<any> = [
    {
      title: "Mã Đơn",
      dataIndex: "order_id",
      key: "order_id",
      width: 150,
      render: (text: string) => (
        <Text strong style={{ color: "#1890ff" }}>
          #{text}
        </Text>
      ),
    },
    {
      title: "Khách Hàng",
      key: "customer",
      width: 200,
      render: (_: any, record: any) => (
        <div>
          <div style={{ fontWeight: 500 }}>
            {record.patients?.full_name || "Khách lẻ"}
          </div>
          {record.patients?.phone_number && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.patients.phone_number}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: "Số Sản Phẩm",
      key: "item_count",
      width: 120,
      align: "center" as const,
      render: (_: any, record: any) => (
        <Tag color="blue">{record.sales_order_items?.length || 0}</Tag>
      ),
    },
    {
      title: "Tổng Tiền",
      dataIndex: "total_value",
      key: "total_value",
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
      title: "Trạng Thái",
      dataIndex: "operational_status",
      key: "operational_status",
      width: 150,
      render: (status: string) => {
        const statusConfig: Record<string, { color: string; text: string }> = {
          "Hoàn tất": { color: "success", text: "Hoàn tất" },
          "Đang xử lý": { color: "processing", text: "Đang xử lý" },
          "Đã giao": { color: "default", text: "Đã giao" },
          "Đã hủy": { color: "error", text: "Đã hủy" },
        };
        const config = statusConfig[status] || {
          color: "default",
          text: status || "N/A",
        };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: "Thanh Toán",
      dataIndex: "payment_status",
      key: "payment_status",
      width: 150,
      render: (status: string) => {
        const paymentConfig: Record<string, { color: string; text: string }> = {
          "Đã thanh toán": { color: "success", text: "Đã thanh toán" },
          "Chờ thanh toán": { color: "warning", text: "Chờ thanh toán" },
          "Thanh toán thiếu": { color: "error", text: "Thiếu" },
        };
        const config = paymentConfig[status] || {
          color: "default",
          text: status || "N/A",
        };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: "Ngày Tạo",
      dataIndex: "order_datetime",
      key: "order_datetime",
      width: 150,
      render: (date: string) =>
        date ? dayjs(date).format("DD/MM/YYYY HH:mm") : "-",
    },
    {
      title: "Hành Động",
      key: "actions",
      width: 120,
      fixed: "right" as const,
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            Xem
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <PageLayout
      title="Danh Sách Đơn Hàng POS"
      breadcrumbs={[
        { title: "Trang chủ", href: "/", icon: null },
        { title: "Đơn hàng POS", icon: null },
      ]}
    >
      {/* Statistics */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng Đơn Hàng"
              value={statistics.total}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng Giá Trị"
              value={statistics.totalValue}
              precision={0}
              suffix="đ"
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Đã Thanh Toán"
              value={statistics.paid}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Chưa Thanh Toán"
              value={statistics.unpaid}
              valueStyle={{ color: "#faad14" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={16} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Tìm kiếm theo mã đơn, khách hàng, sản phẩm..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="Trạng thái"
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: "100%" }}
            >
              <Select.Option value="all">Tất cả</Select.Option>
              <Select.Option value="Hoàn tất">Hoàn tất</Select.Option>
              <Select.Option value="Đang xử lý">Đang xử lý</Select.Option>
              <Select.Option value="Đã giao">Đã giao</Select.Option>
              <Select.Option value="Đã hủy">Đã hủy</Select.Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="Thanh toán"
              value={paymentFilter}
              onChange={setPaymentFilter}
              style={{ width: "100%" }}
            >
              <Select.Option value="all">Tất cả</Select.Option>
              <Select.Option value="Đã thanh toán">Đã thanh toán</Select.Option>
              <Select.Option value="Chờ thanh toán">
                Chờ thanh toán
              </Select.Option>
              <Select.Option value="Thanh toán thiếu">
                Thanh toán thiếu
              </Select.Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <RangePicker
              style={{ width: "100%" }}
              format="DD/MM/YYYY"
              value={dateRange}
              onChange={(dates) => setDateRange(dates as any)}
              placeholder={["Từ ngày", "Đến ngày"]}
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={loadOrders}
                loading={loading}
              >
                Làm mới
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Orders Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredOrders}
          rowKey="order_id"
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
                description="Không có đơn hàng nào"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ),
          }}
        />
      </Card>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <Modal
          title={`Chi Tiết Đơn Hàng #${selectedOrder.order_id}`}
          open={viewModalOpen}
          onCancel={() => {
            setViewModalOpen(false);
            setSelectedOrder(null);
          }}
          footer={[
            <Button
              key="close"
              onClick={() => {
                setViewModalOpen(false);
                setSelectedOrder(null);
              }}
            >
              Đóng
            </Button>,
          ]}
          width={800}
        >
          <Space direction="vertical" style={{ width: "100%" }} size="large">
            <div>
              <Text strong>Khách hàng: </Text>
              <Text>{selectedOrder.patients?.full_name || "Khách lẻ"}</Text>
            </div>
            <div>
              <Text strong>Số điện thoại: </Text>
              <Text>{selectedOrder.patients?.phone_number || "N/A"}</Text>
            </div>
            <div>
              <Text strong>Ngày tạo: </Text>
              <Text>
                {dayjs(selectedOrder.order_datetime).format("DD/MM/YYYY HH:mm")}
              </Text>
            </div>
            <div>
              <Text strong>Trạng thái: </Text>
              <Tag color="blue">{selectedOrder.operational_status}</Tag>
            </div>
            <div>
              <Text strong>Thanh toán: </Text>
              <Tag
                color={
                  selectedOrder.payment_status === "Đã thanh toán"
                    ? "green"
                    : "orange"
                }
              >
                {selectedOrder.payment_status}
              </Tag>
            </div>
            <div>
              <Text strong>Tổng tiền: </Text>
              <Text strong style={{ color: "#52c41a", fontSize: 16 }}>
                {selectedOrder.total_value?.toLocaleString("vi-VN", {
                  style: "currency",
                  currency: "VND",
                })}
              </Text>
            </div>
            <div>
              <Text strong>Sản phẩm:</Text>
              <Table
                dataSource={selectedOrder.sales_order_items || []}
                rowKey="id"
                pagination={false}
                columns={[
                  {
                    title: "Tên sản phẩm",
                    dataIndex: ["products", "name"],
                    key: "name",
                  },
                  {
                    title: "Số lượng",
                    dataIndex: "quantity",
                    key: "quantity",
                    align: "center" as const,
                  },
                  {
                    title: "Đơn giá",
                    dataIndex: ["products", "retail_price"],
                    key: "price",
                    align: "right" as const,
                    render: (price: number) =>
                      price?.toLocaleString("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }),
                  },
                  {
                    title: "Thành tiền",
                    key: "total",
                    align: "right" as const,
                    render: (_: any, record: any) => {
                      const total =
                        (record.products?.retail_price || 0) *
                        (record.quantity || 0);
                      return total.toLocaleString("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      });
                    },
                  },
                ]}
              />
            </div>
          </Space>
        </Modal>
      )}
    </PageLayout>
  );
};

export default POSOrderListPage;
