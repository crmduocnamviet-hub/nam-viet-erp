import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  Space,
  Typography,
  Input,
  DatePicker,
  Form,
  Modal,
  App,
  Row,
  Col,
  Statistic,
  Steps,
  Grid,
  Tag,
  Descriptions,
} from "antd";
import {
  DollarOutlined,
  ShopOutlined,
  ReloadOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  UserOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
// Employee context will be passed as props
import { getQuoteStatistics, createB2BQuote } from "@nam-viet-erp/services";
import { B2BCustomerSearchModal } from "@nam-viet-erp/shared-components";
import B2B_ORDER_STAGES from "../../components/B2BOrderStages";

const { Title, Text } = Typography;
const { Step } = Steps;
const { RangePicker } = DatePicker;
const { useBreakpoint } = Grid;

interface User {
  id: string;
  name: string;
  permissions: string[];
}

interface B2BOrderManagementPageProps {
  employee?: IEmployee | null;
  user?: User | null;
}

const B2BOrderManagementPage: React.FC<B2BOrderManagementPageProps> = ({
  employee,
  user,
}) => {
  const { notification } = App.useApp();
  const [statistics, setStatistics] = useState<any>(null);
  const [createQuoteForm] = Form.useForm();
  const [createQuoteModalOpen, setCreateQuoteModalOpen] = useState(false);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const screens = useBreakpoint();
  const isMobile = !screens.lg;

  // Customer search state
  const [customerSearchModalOpen, setCustomerSearchModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<IB2BCustomer | null>(
    null
  );

  // Role detection
  const userPermissions = user?.permissions || [];
  const isSalesStaff =
    userPermissions.includes("sales.create") ||
    userPermissions.includes("sales.manage");
  const isInventoryStaff =
    userPermissions.includes("inventory.access") ||
    userPermissions.includes("inventory.manage");
  const isDeliveryStaff =
    userPermissions.includes("delivery.access") ||
    userPermissions.includes("shipping.manage");

  // Load B2B statistics for dashboard
  const loadStatistics = async () => {
    setLoading(true);
    try {
      const filters: any = {};

      // Role-based filtering
      if (isInventoryStaff && !isSalesStaff) {
        // Inventory staff only sees accepted orders they can process
        filters.stage = "accepted";
      } else if (isDeliveryStaff && !isSalesStaff && !isInventoryStaff) {
        // Delivery staff only sees orders ready for shipping
        filters.stage = "packaged";
      } else if (isSalesStaff) {
        // Sales staff sees their own orders
        filters.employeeId = employee?.employee_id;
      }

      // Add date range filter if selected
      if (dateRange) {
        filters.startDate = dateRange[0].format("YYYY-MM-DD");
        filters.endDate = dateRange[1].format("YYYY-MM-DD");
      }

      const statsResponse = await getQuoteStatistics(filters);

      if (statsResponse.error) throw statsResponse.error;

      // Set statistics
      const stats = {
        total: statsResponse.data?.totalQuotes || 0,
        totalRevenue: statsResponse.data?.totalValue || 0,
        draftQuotes: statsResponse.data?.byStage?.draft || 0,
        sentQuotes: statsResponse.data?.byStage?.sent || 0,
        acceptedQuotes: statsResponse.data?.byStage?.accepted || 0,
        rejectedQuotes: statsResponse.data?.byStage?.rejected || 0,
        byStage: statsResponse.data?.byStage || {},
        dateRangeText: dateRange
          ? `${dateRange[0].format("DD/MM/YYYY")} - ${dateRange[1].format(
              "DD/MM/YYYY"
            )}`
          : "Tất cả thời gian",
        roleContext:
          isInventoryStaff && !isSalesStaff
            ? "inventory"
            : isDeliveryStaff && !isSalesStaff && !isInventoryStaff
            ? "delivery"
            : "sales",
      };
      setStatistics(stats);
    } catch (error: any) {
      notification.error({
        message: "Lỗi tải dữ liệu",
        description: error.message || "Không thể tải thống kê B2B",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (employee?.employee_id) {
      loadStatistics();
    }
  }, [employee?.employee_id, dateRange]);

  // Handle date range change
  const handleDateRangeChange = (dates: [dayjs.Dayjs, dayjs.Dayjs] | null) => {
    setDateRange(dates);
  };

  // Handle clear date filter
  const handleClearDateFilter = () => {
    setDateRange(null);
  };

  // Handle quick date selections
  const handleQuickDateSelection = (days: number) => {
    const endDate = dayjs();
    const startDate = endDate.subtract(days, "day");
    setDateRange([startDate, endDate]);
  };

  // Handle save quote
  const handleSaveQuote = async (values: any, isDraft: boolean = true) => {
    try {
      if (!employee?.employee_id) {
        notification.error({
          message: "Lỗi",
          description: "Không tìm thấy thông tin nhân viên",
        });
        return;
      }

      if (!selectedCustomer) {
        notification.error({
          message: "Lỗi",
          description: "Vui lòng chọn khách hàng trước khi tạo báo giá",
        });
        return;
      }

      const quoteData = {
        customer_name: selectedCustomer.customer_name,
        customer_code: selectedCustomer.customer_code,
        customer_contact_person: selectedCustomer.contact_person,
        customer_phone: selectedCustomer.phone_number,
        customer_email: selectedCustomer.email,
        customer_address: selectedCustomer.address,
        quote_stage: isDraft ? ("draft" as const) : ("sent" as const),
        total_value: 0,
        subtotal: 0,
        discount_percent: values.discount_percent || 0,
        discount_amount: 0,
        tax_percent: values.tax_percent || 0,
        tax_amount: 0,
        quote_date: dayjs().format("YYYY-MM-DD"),
        valid_until: values.valid_until
          ? dayjs(values.valid_until).format("YYYY-MM-DD")
          : dayjs().add(30, "days").format("YYYY-MM-DD"),
        notes: values.notes,
        terms_conditions: values.terms_conditions,
        created_by_employee_id: employee.employee_id,
      };

      const { data: newQuote, error } = await createB2BQuote(quoteData as any);

      if (error) {
        throw new Error(error.message);
      }

      if (newQuote) {
        notification.success({
          message: "Thành công",
          description: `${isDraft ? "Lưu nháp" : "Gửi"} báo giá thành công`,
          duration: 2,
        });
        setCreateQuoteModalOpen(false);
        createQuoteForm.resetFields();
        setSelectedCustomer(null); // Clear selected customer

        // Show additional success notification with redirect info
        notification.info({
          message: "🎉 Chuyển hướng",
          description: "Đang chuyển đến danh sách đơn hàng B2B...",
          duration: 1.5,
        });

        // Redirect to B2B order list after a short delay
        setTimeout(() => {
          window.location.href = "/b2b";
        }, 1500);
      }
    } catch (error) {
      console.error("Error creating quote:", error);
      notification.error({
        message: "Lỗi tạo báo giá",
        description: "Không thể tạo báo giá mới",
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

  // Handle customer selection
  const handleSelectCustomer = (customer: IB2BCustomer) => {
    setSelectedCustomer(customer);

    // Auto-fill form with customer data
    createQuoteForm.setFieldsValue({
      customer_name: customer.customer_name,
      customer_code: customer.customer_code,
      contact_person: customer.contact_person,
      customer_phone: customer.phone_number,
      customer_email: customer.email,
      customer_address: customer.address,
    });

    notification.success({
      message: "Đã chọn khách hàng",
      description: `Đã chọn khách hàng ${customer.customer_name}`,
    });
  };

  return (
    <div style={{ padding: "24px" }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2} style={{ margin: 0 }}>
            <ShopOutlined style={{ marginRight: 8 }} />
            {statistics?.roleContext === "inventory"
              ? "Đơn hàng chờ xử lý - Kho"
              : statistics?.roleContext === "delivery"
              ? "Đơn hàng chờ giao - Vận chuyển"
              : "Quản lý Đơn hàng B2B"}
          </Title>
          <Text type="secondary">
            {statistics?.roleContext === "inventory"
              ? "Xử lý đơn hàng đã được chấp nhận - Đóng gói và chuẩn bị giao hàng"
              : statistics?.roleContext === "delivery"
              ? "Giao hàng và hoàn tất đơn hàng"
              : "Tạo báo giá và quản lý đơn hàng bán buôn"}
          </Text>
        </Col>
        <Col>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={loadStatistics}
              loading={loading}
            >
              Làm mới
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Date Filter Section */}
      <Card style={{ marginBottom: 24 }}>
        <Space
          direction={isMobile ? "vertical" : "horizontal"}
          size="middle"
          style={{ width: "100%" }}
        >
          <Text strong>Lọc theo thời gian:</Text>
          <RangePicker
            value={dateRange}
            onChange={handleDateRangeChange}
            format="DD/MM/YYYY"
            placeholder={["Từ ngày", "Đến ngày"]}
            style={{ width: isMobile ? "100%" : 280 }}
          />
          <Space wrap>
            <Button size="small" onClick={() => handleQuickDateSelection(7)}>
              7 ngày
            </Button>
            <Button size="small" onClick={() => handleQuickDateSelection(30)}>
              30 ngày
            </Button>
            <Button size="small" onClick={() => handleQuickDateSelection(90)}>
              3 tháng
            </Button>
            <Button size="small" onClick={handleClearDateFilter}>
              Tất cả
            </Button>
          </Space>
          {statistics?.dateRangeText && (
            <Text type="secondary">Hiển thị: {statistics.dateRangeText}</Text>
          )}
        </Space>
      </Card>

      {/* B2B Sales Dashboard - Overview Only */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title={
                statistics?.roleContext === "inventory"
                  ? "Đơn hàng chờ xử lý"
                  : statistics?.roleContext === "delivery"
                  ? "Đơn hàng chờ giao"
                  : "Tổng báo giá"
              }
              value={statistics?.total || 0}
              prefix={<ShopOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Tổng giá trị"
              value={statistics?.totalRevenue || 0}
              prefix={<DollarOutlined />}
              formatter={(value) => formatCurrency(Number(value))}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        {statistics?.roleContext === "sales" && (
          <>
            <Col xs={24} sm={12} lg={6}>
              <Card loading={loading}>
                <Statistic
                  title="Báo giá nháp"
                  value={statistics?.draftQuotes || 0}
                  prefix={<FileTextOutlined />}
                  valueStyle={{ color: "#8c8c8c" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card loading={loading}>
                <Statistic
                  title="Đã chấp nhận"
                  value={statistics?.acceptedQuotes || 0}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: "#52c41a" }}
                />
              </Card>
            </Col>
          </>
        )}
        {statistics?.roleContext === "inventory" && (
          <>
            <Col xs={24} sm={12} lg={6}>
              <Card loading={loading}>
                <Statistic
                  title="Chờ đóng gói"
                  value={statistics?.byStage?.accepted || 0}
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ color: "#fa8c16" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card loading={loading}>
                <Statistic
                  title="Đã đóng gói"
                  value={statistics?.byStage?.packaged || 0}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: "#52c41a" }}
                />
              </Card>
            </Col>
          </>
        )}
        {statistics?.roleContext === "delivery" && (
          <>
            <Col xs={24} sm={12} lg={6}>
              <Card loading={loading}>
                <Statistic
                  title="Chờ giao hàng"
                  value={statistics?.byStage?.packaged || 0}
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ color: "#fa8c16" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card loading={loading}>
                <Statistic
                  title="Đã hoàn tất"
                  value={statistics?.byStage?.completed || 0}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: "#52c41a" }}
                />
              </Card>
            </Col>
          </>
        )}
      </Row>

      {/* Quick Actions for Inventory/Delivery Staff */}
      {(statistics?.roleContext === "inventory" ||
        statistics?.roleContext === "delivery") && (
        <Card
          title={
            <Space>
              <Text strong>
                {statistics?.roleContext === "inventory"
                  ? "Hành động nhanh - Kho"
                  : "Hành động nhanh - Giao hàng"}
              </Text>
              {statistics?.roleContext === "inventory" && (
                <Text type="secondary">
                  (Cập nhật trạng thái đơn hàng đã chấp nhận)
                </Text>
              )}
              {statistics?.roleContext === "delivery" && (
                <Text type="secondary">(Cập nhật trạng thái giao hàng)</Text>
              )}
            </Space>
          }
          style={{ marginBottom: 24 }}
        >
          <Row gutter={16}>
            <Col xs={24} md={12} lg={8}>
              <div
                style={{
                  padding: "16px",
                  backgroundColor: "#fff7e6",
                  borderRadius: "8px",
                  border: "1px solid #ffd591",
                  textAlign: "center",
                }}
              >
                <ClockCircleOutlined
                  style={{
                    fontSize: "24px",
                    color: "#fa8c16",
                    marginBottom: "8px",
                  }}
                />
                <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
                  {statistics?.roleContext === "inventory"
                    ? "Chờ đóng gói"
                    : "Chờ giao hàng"}
                </div>
                <div
                  style={{
                    fontSize: "20px",
                    fontWeight: "bold",
                    color: "#fa8c16",
                  }}
                >
                  {statistics?.roleContext === "inventory"
                    ? statistics?.byStage?.accepted || 0
                    : statistics?.byStage?.packaged || 0}{" "}
                  đơn
                </div>
                <Button
                  type="primary"
                  size="small"
                  style={{ marginTop: "8px" }}
                  onClick={() => {
                    // Navigate to order list to process orders
                    window.location.href = "/b2b";
                  }}
                >
                  Xử lý ngay
                </Button>
              </div>
            </Col>
            {statistics?.roleContext === "inventory" && (
              <Col xs={24} md={12} lg={8}>
                <div
                  style={{
                    padding: "16px",
                    backgroundColor: "#f6ffed",
                    borderRadius: "8px",
                    border: "1px solid #b7eb8f",
                    textAlign: "center",
                  }}
                >
                  <CheckCircleOutlined
                    style={{
                      fontSize: "24px",
                      color: "#52c41a",
                      marginBottom: "8px",
                    }}
                  />
                  <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
                    Đã đóng gói
                  </div>
                  <div
                    style={{
                      fontSize: "20px",
                      fontWeight: "bold",
                      color: "#52c41a",
                    }}
                  >
                    {statistics?.byStage?.packaged || 0} đơn
                  </div>
                  <Text type="secondary" style={{ fontSize: "12px" }}>
                    Chờ bộ phận vận chuyển
                  </Text>
                </div>
              </Col>
            )}
            {statistics?.roleContext === "delivery" && (
              <Col xs={24} md={12} lg={8}>
                <div
                  style={{
                    padding: "16px",
                    backgroundColor: "#f6ffed",
                    borderRadius: "8px",
                    border: "1px solid #b7eb8f",
                    textAlign: "center",
                  }}
                >
                  <CheckCircleOutlined
                    style={{
                      fontSize: "24px",
                      color: "#52c41a",
                      marginBottom: "8px",
                    }}
                  />
                  <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
                    Đã hoàn tất
                  </div>
                  <div
                    style={{
                      fontSize: "20px",
                      fontWeight: "bold",
                      color: "#52c41a",
                    }}
                  >
                    {statistics?.byStage?.completed || 0} đơn
                  </div>
                  <Text type="secondary" style={{ fontSize: "12px" }}>
                    Đã giao thành công
                  </Text>
                </div>
              </Col>
            )}
            <Col xs={24} md={12} lg={8}>
              <div
                style={{
                  padding: "16px",
                  backgroundColor: "#f0f5ff",
                  borderRadius: "8px",
                  border: "1px solid #adc6ff",
                  textAlign: "center",
                }}
              >
                <ShopOutlined
                  style={{
                    fontSize: "24px",
                    color: "#1890ff",
                    marginBottom: "8px",
                  }}
                />
                <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
                  Tổng đơn hàng
                </div>
                <div
                  style={{
                    fontSize: "20px",
                    fontWeight: "bold",
                    color: "#1890ff",
                  }}
                >
                  {statistics?.total || 0} đơn
                </div>
                <div style={{ fontSize: "14px", color: "#52c41a" }}>
                  {formatCurrency(statistics?.totalRevenue || 0)}
                </div>
              </div>
            </Col>
          </Row>
        </Card>
      )}

      {/* Workflow Progress */}
      <Card title="Trạng thái nhanh" style={{ marginBottom: 24 }}>
        <Steps direction="horizontal" size="small">
          {B2B_ORDER_STAGES.slice(0, 4).map((stage) => (
            <Step
              key={stage.key}
              title={stage.title}
              description={
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "12px", color: "#666" }}>
                    {stage.description}
                  </div>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: "bold",
                      color: stage.color === "default" ? "#666" : stage.color,
                    }}
                  >
                    {statistics?.byStage?.[stage.key] || 0} báo giá
                  </div>
                </div>
              }
              icon={stage.icon}
              status={stage.status as any}
            />
          ))}
        </Steps>

        {/* Rejected and Expired quotes separate */}
        <Row gutter={16} style={{ marginTop: 24 }}>
          <Col span={12}>
            <div
              style={{
                padding: "16px",
                backgroundColor: "#fff2f0",
                borderRadius: "6px",
                border: "1px solid #ffccc7",
              }}
            >
              <Space>
                <WarningOutlined style={{ color: "#ff4d4f" }} />
                <Text strong>Báo giá từ chối:</Text>
                <Text style={{ color: "#ff4d4f" }}>
                  {statistics?.byStage?.rejected || 0} báo giá
                </Text>
              </Space>
            </div>
          </Col>
          <Col span={12}>
            <div
              style={{
                padding: "16px",
                backgroundColor: "#fff7e6",
                borderRadius: "6px",
                border: "1px solid #ffd591",
              }}
            >
              <Space>
                <WarningOutlined style={{ color: "#fa8c16" }} />
                <Text strong>Báo giá hết hạn:</Text>
                <Text style={{ color: "#fa8c16" }}>
                  {statistics?.byStage?.expired || 0} báo giá
                </Text>
              </Space>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Create Quote Modal */}
      <Modal
        title="Tạo báo giá B2B mới"
        open={createQuoteModalOpen}
        onCancel={() => {
          setCreateQuoteModalOpen(false);
          createQuoteForm.resetFields();
          setSelectedCustomer(null);
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setCreateQuoteModalOpen(false);
              createQuoteForm.resetFields();
              setSelectedCustomer(null);
            }}
          >
            Hủy
          </Button>,
          <Button
            key="save-draft"
            type="default"
            onClick={async () => {
              try {
                const values = await createQuoteForm.validateFields();
                handleSaveQuote(values, true);
              } catch (error) {
                console.error("Validation failed:", error);
              }
            }}
          >
            Lưu nháp
          </Button>,
          <Button
            key="send"
            type="primary"
            onClick={async () => {
              try {
                const values = await createQuoteForm.validateFields();
                handleSaveQuote(values, false);
              } catch (error) {
                console.error("Validation failed:", error);
              }
            }}
          >
            Gửi báo giá
          </Button>,
        ]}
        width={800}
      >
        {/* Customer Selection Section */}
        <Card
          title={
            <Space>
              <UserOutlined />
              <span>Thông tin Khách hàng</span>
              {selectedCustomer && (
                <Tag color="green">
                  Đã chọn: {selectedCustomer.customer_name}
                </Tag>
              )}
            </Space>
          }
          style={{ marginBottom: 16 }}
          extra={
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={() => setCustomerSearchModalOpen(true)}
            >
              {selectedCustomer ? "Đổi khách hàng" : "Chọn khách hàng"}
            </Button>
          }
        >
          {selectedCustomer ? (
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Tên khách hàng" span={2}>
                <Text strong>{selectedCustomer.customer_name}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Mã khách hàng">
                {selectedCustomer.customer_code}
              </Descriptions.Item>
              <Descriptions.Item label="Loại khách hàng">
                <Tag color="blue">
                  {selectedCustomer.customer_type === "hospital" && "Bệnh viện"}
                  {selectedCustomer.customer_type === "pharmacy" && "Nhà thuốc"}
                  {selectedCustomer.customer_type === "clinic" && "Phòng khám"}
                  {selectedCustomer.customer_type === "distributor" &&
                    "Nhà phân phối"}
                  {selectedCustomer.customer_type === "other" && "Khác"}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Người liên hệ">
                {selectedCustomer.contact_person || "Chưa có"}
              </Descriptions.Item>
              <Descriptions.Item label="Số điện thoại">
                {selectedCustomer.phone_number || "Chưa có"}
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                {selectedCustomer.email || "Chưa có"}
              </Descriptions.Item>
              <Descriptions.Item label="Địa chỉ" span={2}>
                {selectedCustomer.address || "Chưa có"}
              </Descriptions.Item>
            </Descriptions>
          ) : (
            <div
              style={{ textAlign: "center", padding: "40px 0", color: "#999" }}
            >
              <UserOutlined style={{ fontSize: 48, marginBottom: 16 }} />
              <div>Vui lòng chọn khách hàng để tạo báo giá</div>
            </div>
          )}
        </Card>

        <Form layout="vertical" form={createQuoteForm}>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="valid_until"
                label="Ngày hết hạn báo giá"
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
              <Form.Item name="discount_percent" label="Chiết khấu (%)">
                <Input
                  placeholder="0"
                  suffix="%"
                  type="number"
                  min={0}
                  max={100}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="tax_percent" label="Thuế (%)">
                <Input
                  placeholder="0"
                  suffix="%"
                  type="number"
                  min={0}
                  max={100}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="notes" label="Ghi chú">
            <Input.TextArea
              rows={3}
              placeholder="Thêm ghi chú cho báo giá..."
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Customer Search Modal */}
      <B2BCustomerSearchModal
        open={customerSearchModalOpen}
        onClose={() => setCustomerSearchModalOpen(false)}
        onSelect={handleSelectCustomer}
        title="Chọn Khách hàng B2B cho báo giá"
      />
    </div>
  );
};

export default B2BOrderManagementPage;
