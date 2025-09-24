import React, { useState, useEffect } from 'react';
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
  Modal,
  Form,
  App,
  Row,
  Col,
  Statistic,
  Drawer,
  Tabs,
  Steps,
  Descriptions,
} from 'antd';
import {
  FilterOutlined,
  EyeOutlined,
  EditOutlined,
  DollarOutlined,
  ShopOutlined,
  ReloadOutlined,
  FileTextOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
// Employee context will be passed as props
import {
  getB2BQuotes,
  getQuoteStatistics,
  createB2BQuote,
} from '@nam-viet-erp/services';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Step } = Steps;
const { TabPane } = Tabs;

// B2B Quote interface matching the service
interface B2BQuote {
  quote_id: string;
  quote_number: string;
  customer_name: string;
  customer_code?: string | null;
  customer_contact_person?: string | null;
  customer_phone?: string | null;
  customer_email?: string | null;
  customer_address?: string | null;
  quote_stage: 'draft' | 'sent' | 'negotiating' | 'accepted' | 'rejected' | 'expired';
  total_value: number;
  subtotal: number;
  discount_percent: number;
  discount_amount: number;
  tax_percent: number;
  tax_amount: number;
  quote_date: string;
  valid_until: string;
  notes?: string | null;
  terms_conditions?: string | null;
  created_by_employee_id: string;
  created_at: string;
  updated_at: string;
  quote_items?: any[];
  employee?: {
    full_name: string;
    employee_code: string;
  };
}

// B2B Order Stages
const B2B_ORDER_STAGES = [
  {
    key: 'draft',
    title: 'Nháp',
    description: 'Báo giá đã gửi, chờ quyết định',
    icon: <FileTextOutlined />,
    color: 'default',
    status: 'wait'
  },
  {
    key: 'sent',
    title: 'Đã gửi',
    description: 'Báo giá đã gửi cho khách hàng',
    icon: <FileTextOutlined />,
    color: 'blue',
    status: 'process'
  },
  {
    key: 'negotiating',
    title: 'Thương thảo',
    description: 'Đang thương thảo điều khoản',
    icon: <ClockCircleOutlined />,
    color: 'orange',
    status: 'process'
  },
  {
    key: 'accepted',
    title: 'Chấp nhận',
    description: 'Báo giá được chấp nhận',
    icon: <CheckCircleOutlined />,
    color: 'green',
    status: 'finish'
  },
  {
    key: 'rejected',
    title: 'Từ chối',
    description: 'Báo giá bị từ chối',
    icon: <WarningOutlined />,
    color: 'red',
    status: 'error'
  },
  {
    key: 'expired',
    title: 'Hết hạn',
    description: 'Báo giá đã hết hạn',
    icon: <WarningOutlined />,
    color: 'volcano',
    status: 'error'
  },
];

interface Employee {
  employee_id: string;
  full_name: string;
  employee_code: string;
}

interface B2BOrderManagementPageProps {
  employee?: Employee | null;
}

const B2BOrderManagementPage: React.FC<B2BOrderManagementPageProps> = ({ employee }) => {
  const { notification } = App.useApp();
  const [form] = Form.useForm();
  const [createQuoteForm] = Form.useForm();

  const [orders, setOrders] = useState<B2BQuote[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrent] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filters, setFilters] = useState<any>({});
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [orderDetailModalOpen, setOrderDetailModalOpen] = useState(false);
  const [createQuoteModalOpen, setCreateQuoteModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<B2BQuote | null>(null);
  const [statistics, setStatistics] = useState<any>(null);
  const [currentTab, setCurrentTab] = useState('overview');

  // Load B2B quotes and statistics
  const loadOrders = async () => {
    setLoading(true);
    try {
      const searchFilters = {
        keyword: searchKeyword || undefined,
        stage: filters.quoteStage,
        employeeId: employee?.employee_id,
        startDate: filters.startDate,
        endDate: filters.endDate,
        limit: pageSize,
        offset: (currentPage - 1) * pageSize,
      };

      const [quotesResponse, statsResponse] = await Promise.all([
        getB2BQuotes(searchFilters),
        getQuoteStatistics({
          employeeId: employee?.employee_id,
          startDate: filters.startDate,
          endDate: filters.endDate,
        }),
      ]);

      if (quotesResponse.error) throw quotesResponse.error;
      if (statsResponse.error) throw statsResponse.error;

      setOrders(quotesResponse.data || []);
      setTotal(quotesResponse.data?.length || 0);

      // Set statistics
      const stats = {
        total: statsResponse.data?.totalQuotes || 0,
        totalRevenue: statsResponse.data?.totalValue || 0,
        draftQuotes: statsResponse.data?.byStage?.draft || 0,
        sentQuotes: statsResponse.data?.byStage?.sent || 0,
        acceptedQuotes: statsResponse.data?.byStage?.accepted || 0,
        rejectedQuotes: statsResponse.data?.byStage?.rejected || 0,
        byStage: statsResponse.data?.byStage || {},
      };
      setStatistics(stats);
    } catch (error: any) {
      notification.error({
        message: 'Lỗi tải dữ liệu',
        description: error.message || 'Không thể tải danh sách báo giá B2B',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (employee?.employee_id) {
      loadOrders();
    }
  }, [employee?.employee_id, currentPage, pageSize, filters]);

  // Handle search
  const handleSearch = () => {
    setCurrent(1);
    loadOrders();
  };

  // Handle filter apply
  const handleFilterApply = (values: any) => {
    const newFilters: any = {};

    if (values.quoteStage) newFilters.quoteStage = values.quoteStage;
    if (values.dateRange) {
      newFilters.startDate = values.dateRange[0].format('YYYY-MM-DD');
      newFilters.endDate = values.dateRange[1].format('YYYY-MM-DD');
    }

    setFilters(newFilters);
    setCurrent(1);
    setFilterDrawerOpen(false);
  };

  // Handle clear filters
  const handleClearFilters = () => {
    setFilters({});
    setSearchKeyword('');
    form.resetFields();
    setCurrent(1);
    setFilterDrawerOpen(false);
  };

  // Handle view order details
  const handleViewOrder = (quote: B2BQuote) => {
    setSelectedOrder(quote);
    setOrderDetailModalOpen(true);
  };

  // Handle create quote
  const handleCreateQuote = () => {
    setCreateQuoteModalOpen(true);
  };

  // Handle save quote
  const handleSaveQuote = async (values: any, isDraft: boolean = true) => {
    try {
      if (!employee?.employee_id) {
        notification.error({
          message: 'Lỗi',
          description: 'Không tìm thấy thông tin nhân viên',
        });
        return;
      }

      const quoteData = {
        customer_name: values.customer_name,
        customer_code: values.customer_code,
        customer_contact_person: values.contact_person,
        customer_phone: values.customer_phone,
        customer_email: values.customer_email,
        customer_address: values.customer_address,
        quote_stage: isDraft ? 'draft' as const : 'sent' as const,
        total_value: 0,
        subtotal: 0,
        discount_percent: values.discount_percent || 0,
        discount_amount: 0,
        tax_percent: values.tax_percent || 0,
        tax_amount: 0,
        quote_date: dayjs().format('YYYY-MM-DD'),
        valid_until: values.valid_until ? dayjs(values.valid_until).format('YYYY-MM-DD') : dayjs().add(30, 'days').format('YYYY-MM-DD'),
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
          message: 'Thành công',
          description: `${isDraft ? 'Lưu nháp' : 'Gửi'} báo giá thành công`,
        });
        setCreateQuoteModalOpen(false);
        createQuoteForm.resetFields();
        loadOrders(); // Reload data
      }
    } catch (error) {
      console.error('Error creating quote:', error);
      notification.error({
        message: 'Lỗi tạo báo giá',
        description: 'Không thể tạo báo giá mới',
      });
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  // Get stage info
  const getStageInfo = (stage: string) => {
    return B2B_ORDER_STAGES.find(s => s.key === stage) || B2B_ORDER_STAGES[0];
  };

  const columns: ColumnsType<B2BQuote> = [
    {
      title: 'Mã báo giá',
      dataIndex: 'quote_number',
      key: 'quote_number',
      width: 140,
      render: (text: string) => (
        <Text strong style={{ color: '#722ed1' }}>
          {text}
        </Text>
      ),
    },
    {
      title: 'Khách hàng',
      key: 'customer',
      width: 200,
      render: (_, record) => (
        <div>
          <Text strong>{record.customer_name}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.customer_code}
          </Text>
          {record.customer_phone && (
            <>
              <br />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {record.customer_phone}
              </Text>
            </>
          )}
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'quote_stage',
      key: 'quote_stage',
      width: 130,
      render: (stage: string) => {
        const stageInfo = getStageInfo(stage);
        return (
          <Tag color={stageInfo.color} icon={stageInfo.icon}>
            {stageInfo.title}
          </Tag>
        );
      },
    },
    {
      title: 'Tổng giá trị',
      dataIndex: 'total_value',
      key: 'total_value',
      width: 120,
      render: (value: number) => (
        <Text strong style={{ color: '#52c41a' }}>
          {formatCurrency(value)}
        </Text>
      ),
      sorter: true,
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'quote_date',
      key: 'quote_date',
      width: 100,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Hết hạn',
      dataIndex: 'valid_until',
      key: 'valid_until',
      width: 100,
      render: (date: string) => {
        const isExpired = dayjs(date).isBefore(dayjs());
        return (
          <Text style={{ color: isExpired ? '#ff4d4f' : undefined }}>
            {dayjs(date).format('DD/MM/YYYY')}
          </Text>
        );
      },
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewOrder(record)}
          >
            Xem
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
          >
            Sửa
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2} style={{ margin: 0 }}>
            <ShopOutlined style={{ marginRight: 8 }} />
            Quản lý Đơn hàng B2B
          </Title>
          <Text type="secondary">
            Tạo báo giá và quản lý đơn hàng bán buôn
          </Text>
        </Col>
        <Col>
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateQuote}>
              Tạo báo giá mới
            </Button>
            <Button icon={<ReloadOutlined />} onClick={loadOrders} loading={loading}>
              Làm mới
            </Button>
          </Space>
        </Col>
      </Row>

      <Tabs activeKey={currentTab} onChange={setCurrentTab} style={{ marginBottom: 24 }}>
        <TabPane tab="Tổng quan" key="overview">
          {/* Statistics Cards */}
          {statistics && (
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Tổng báo giá"
                    value={statistics.total}
                    prefix={<ShopOutlined />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Tổng giá trị"
                    value={statistics.totalRevenue}
                    prefix={<DollarOutlined />}
                    formatter={(value) => formatCurrency(Number(value))}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Báo giá nháp"
                    value={statistics.draftQuotes}
                    prefix={<FileTextOutlined />}
                    valueStyle={{ color: '#8c8c8c' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Đã chấp nhận"
                    value={statistics.acceptedQuotes}
                    prefix={<CheckCircleOutlined />}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
            </Row>
          )}

          {/* Workflow Progress */}
          <Card title="Vòng đời Báo giá B2B - 6 Giai đoạn" style={{ marginBottom: 24 }}>
            <div style={{ marginBottom: 16 }}>
              <Text type="secondary">
                <strong>Giai đoạn 1 - Nháp:</strong> Báo giá đã gửi cho khách hàng, đang chờ họ ra quyết định
              </Text>
            </div>
            <Steps direction="horizontal" size="small">
              {B2B_ORDER_STAGES.slice(0, 4).map((stage) => (
                <Step
                  key={stage.key}
                  title={stage.title}
                  description={
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {stage.description}
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 'bold', color: stage.color === 'default' ? '#666' : stage.color }}>
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
                <div style={{ padding: '16px', backgroundColor: '#fff2f0', borderRadius: '6px', border: '1px solid #ffccc7' }}>
                  <Space>
                    <WarningOutlined style={{ color: '#ff4d4f' }} />
                    <Text strong>Báo giá từ chối:</Text>
                    <Text style={{ color: '#ff4d4f' }}>{statistics?.byStage?.rejected || 0} báo giá</Text>
                  </Space>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ padding: '16px', backgroundColor: '#fff7e6', borderRadius: '6px', border: '1px solid #ffd591' }}>
                  <Space>
                    <WarningOutlined style={{ color: '#fa8c16' }} />
                    <Text strong>Báo giá hết hạn:</Text>
                    <Text style={{ color: '#fa8c16' }}>{statistics?.byStage?.expired || 0} báo giá</Text>
                  </Space>
                </div>
              </Col>
            </Row>
          </Card>
        </TabPane>

        <TabPane tab="Danh sách báo giá" key="orders">
          {/* Search and Filter Bar */}
          <Card style={{ marginBottom: 16 }}>
            <Row gutter={16} align="middle">
              <Col flex="auto">
                <Input.Search
                  placeholder="Tìm theo mã báo giá, tên khách hàng, mã khách hàng..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  onSearch={handleSearch}
                  style={{ width: '100%' }}
                  size="large"
                />
              </Col>
              <Col>
                <Space>
                  <Button
                    icon={<FilterOutlined />}
                    onClick={() => setFilterDrawerOpen(true)}
                  >
                    Bộ lọc
                  </Button>
                  <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateQuote}>
                    Tạo báo giá
                  </Button>
                </Space>
              </Col>
            </Row>
          </Card>

          {/* Orders Table */}
          <Card>
            <Table
              columns={columns}
              dataSource={orders}
              rowKey="quote_id"
              loading={loading}
              pagination={{
                current: currentPage,
                pageSize: pageSize,
                total: total,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} của ${total} báo giá`,
                onChange: (page, size) => {
                  setCurrent(page);
                  setPageSize(size || 20);
                },
              }}
              scroll={{ x: 1200 }}
            />
          </Card>
        </TabPane>
      </Tabs>

      {/* Filter Drawer */}
      <Drawer
        title="Bộ lọc nâng cao"
        placement="right"
        onClose={() => setFilterDrawerOpen(false)}
        open={filterDrawerOpen}
        width={400}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFilterApply}
        >
          <Form.Item name="quoteStage" label="Trạng thái báo giá">
            <Select placeholder="Chọn trạng thái báo giá" allowClear>
              {B2B_ORDER_STAGES.map(stage => (
                <Select.Option key={stage.key} value={stage.key}>
                  {stage.title}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="dateRange" label="Khoảng thời gian">
            <RangePicker
              style={{ width: '100%' }}
              format="DD/MM/YYYY"
              placeholder={['Từ ngày', 'Đến ngày']}
            />
          </Form.Item>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Button onClick={handleClearFilters}>
                Xóa bộ lọc
              </Button>
              <Button type="primary" htmlType="submit">
                Áp dụng
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Drawer>

      {/* Order Detail Modal */}
      <Modal
        title={`Chi tiết báo giá ${selectedOrder?.quote_number}`}
        open={orderDetailModalOpen}
        onCancel={() => setOrderDetailModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setOrderDetailModalOpen(false)}>
            Đóng
          </Button>,
          <Button key="edit" type="primary">
            Chỉnh sửa
          </Button>,
        ]}
        width={800}
      >
        {selectedOrder && (
          <div>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Mã báo giá">
                {selectedOrder.quote_number}
              </Descriptions.Item>
              <Descriptions.Item label="Khách hàng">
                {selectedOrder.customer_name}
              </Descriptions.Item>
              <Descriptions.Item label="Mã khách hàng">
                {selectedOrder.customer_code}
              </Descriptions.Item>
              <Descriptions.Item label="Người liên hệ">
                {selectedOrder.customer_contact_person}
              </Descriptions.Item>
              <Descriptions.Item label="Số điện thoại">
                {selectedOrder.customer_phone}
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                {selectedOrder.customer_email}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày tạo">
                {dayjs(selectedOrder.quote_date).format('DD/MM/YYYY')}
              </Descriptions.Item>
              <Descriptions.Item label="Hạn báo giá">
                {dayjs(selectedOrder.valid_until).format('DD/MM/YYYY')}
              </Descriptions.Item>
              <Descriptions.Item label="Tổng giá trị">
                <Text strong style={{ color: '#52c41a' }}>
                  {formatCurrency(selectedOrder.total_value)}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Chiết khấu">
                {selectedOrder.discount_percent}%
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái" span={2}>
                <Tag color={getStageInfo(selectedOrder.quote_stage).color}>
                  {getStageInfo(selectedOrder.quote_stage).title}
                </Tag>
              </Descriptions.Item>
              {selectedOrder.notes && (
                <Descriptions.Item label="Ghi chú" span={2}>
                  {selectedOrder.notes}
                </Descriptions.Item>
              )}
            </Descriptions>
          </div>
        )}
      </Modal>

      {/* Create Quote Modal */}
      <Modal
        title="Tạo báo giá B2B mới"
        open={createQuoteModalOpen}
        onCancel={() => setCreateQuoteModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setCreateQuoteModalOpen(false)}>
            Hủy
          </Button>,
          <Button key="save-draft" type="default" onClick={async () => {
            try {
              const values = await createQuoteForm.validateFields();
              handleSaveQuote(values, true);
            } catch (error) {
              console.error('Validation failed:', error);
            }
          }}>
            Lưu nháp
          </Button>,
          <Button key="send" type="primary" onClick={async () => {
            try {
              const values = await createQuoteForm.validateFields();
              handleSaveQuote(values, false);
            } catch (error) {
              console.error('Validation failed:', error);
            }
          }}>
            Gửi báo giá
          </Button>,
        ]}
        width={800}
      >
        <Form layout="vertical" form={createQuoteForm}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="customer_name" label="Tên khách hàng" rules={[{ required: true, message: 'Vui lòng nhập tên khách hàng' }]}>
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
              <Form.Item name="valid_until" label="Ngày hết hạn báo giá" rules={[{ required: true, message: 'Vui lòng chọn ngày hết hạn' }]}>
                <DatePicker style={{ width: '100%' }} placeholder="Chọn ngày hết hạn" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="discount_percent" label="Chiết khấu (%)">
                <Input placeholder="0" suffix="%" type="number" min={0} max={100} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="tax_percent" label="Thuế (%)">
                <Input placeholder="0" suffix="%" type="number" min={0} max={100} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="contact_person" label="Người liên hệ">
                <Input placeholder="Tên người liên hệ" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="customer_phone" label="Số điện thoại">
                <Input placeholder="Số điện thoại liên hệ" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="customer_email" label="Email">
            <Input placeholder="Email khách hàng" type="email" />
          </Form.Item>
          <Form.Item name="customer_address" label="Địa chỉ">
            <Input.TextArea rows={2} placeholder="Địa chỉ khách hàng" />
          </Form.Item>
          <Form.Item name="notes" label="Ghi chú">
            <Input.TextArea rows={3} placeholder="Thêm ghi chú cho báo giá..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default B2BOrderManagementPage;