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
  Drawer,
  Descriptions,
} from 'antd';
import {
  FilterOutlined,
  EyeOutlined,
  EditOutlined,
  ReloadOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import {
  getB2BQuotes,
  createB2BQuote,
} from '@nam-viet-erp/services';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

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
  operation_status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  payment_status: 'unpaid' | 'partial' | 'paid' | 'overdue';
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
    color: 'default',
  },
  {
    key: 'sent',
    title: 'Đã gửi',
    description: 'Báo giá đã gửi cho khách hàng',
    color: 'blue',
  },
  {
    key: 'negotiating',
    title: 'Thương thảo',
    description: 'Đang thương thảo điều khoản',
    color: 'orange',
  },
  {
    key: 'accepted',
    title: 'Chấp nhận',
    description: 'Báo giá được chấp nhận',
    color: 'green',
  },
  {
    key: 'rejected',
    title: 'Từ chối',
    description: 'Báo giá bị từ chối',
    color: 'red',
  },
  {
    key: 'expired',
    title: 'Hết hạn',
    description: 'Báo giá đã hết hạn',
    color: 'volcano',
  },
];

interface Employee {
  employee_id: string;
  full_name: string;
  employee_code: string;
}

interface B2BOrderListPageProps {
  employee?: Employee | null;
}

const B2BOrderListPage: React.FC<B2BOrderListPageProps> = ({ employee }) => {
  const { notification } = App.useApp();
  const [quotes, setQuotes] = useState<B2BQuote[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filters, setFilters] = useState<any>({});
  const [current, setCurrent] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [orderDetailModalOpen, setOrderDetailModalOpen] = useState(false);
  const [createQuoteModalOpen, setCreateQuoteModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<B2BQuote | null>(null);

  const [form] = Form.useForm();
  const [createQuoteForm] = Form.useForm();

  // Load B2B orders
  const loadOrders = async () => {
    setLoading(true);
    try {
      const response = await getB2BQuotes({
        page: current,
        limit: pageSize,
        search: searchKeyword,
        employeeId: employee?.employee_id,
        ...filters,
      });

      if (response.error) throw response.error;

      setQuotes(response.data?.quotes || []);
      setTotal(response.data?.total || 0);
    } catch (error: any) {
      notification.error({
        message: 'Lỗi tải dữ liệu',
        description: error.message || 'Không thể tải danh sách đơn hàng B2B',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (employee?.employee_id) {
      loadOrders();
    }
  }, [employee?.employee_id, current, searchKeyword, filters]);

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

  const getOperationStatusInfo = (status: string) => {
    const statusMap: Record<string, { title: string; color: string }> = {
      'pending': { title: 'Chờ xử lý', color: 'orange' },
      'processing': { title: 'Đang xử lý', color: 'blue' },
      'shipped': { title: 'Đã giao vận', color: 'cyan' },
      'delivered': { title: 'Đã giao hàng', color: 'green' },
      'cancelled': { title: 'Đã hủy', color: 'red' },
    };
    return statusMap[status] || { title: status, color: 'default' };
  };

  const getPaymentStatusInfo = (status: string) => {
    const statusMap: Record<string, { title: string; color: string }> = {
      'unpaid': { title: 'Chưa thanh toán', color: 'red' },
      'partial': { title: 'Thanh toán một phần', color: 'orange' },
      'paid': { title: 'Đã thanh toán', color: 'green' },
      'overdue': { title: 'Quá hạn', color: 'volcano' },
    };
    return statusMap[status] || { title: status, color: 'default' };
  };

  const columns: ColumnsType<B2BQuote> = [
    {
      title: 'Mã ĐH / BG',
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
      title: 'Tên Khách hàng',
      key: 'customer',
      width: 200,
      render: (_, record) => (
        <div>
          <Text strong>{record.customer_name}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.customer_code}
          </Text>
        </div>
      ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'quote_date',
      key: 'quote_date',
      width: 110,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
      sorter: true,
    },
    {
      title: 'Tổng Giá trị',
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
      title: 'Trạng thái Vận hành',
      dataIndex: 'operation_status',
      key: 'operation_status',
      width: 140,
      render: (status: string) => {
        const statusInfo = getOperationStatusInfo(status);
        return (
          <Tag color={statusInfo.color}>
            {statusInfo.title}
          </Tag>
        );
      },
    },
    {
      title: 'Trạng thái Thanh toán',
      dataIndex: 'payment_status',
      key: 'payment_status',
      width: 150,
      render: (status: string) => {
        const statusInfo = getPaymentStatusInfo(status);
        return (
          <Tag color={statusInfo.color}>
            {statusInfo.title}
          </Tag>
        );
      },
    },
    {
      title: 'Hành Động',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewOrder(record)}
            size="small"
          >
            Xem
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            size="small"
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
            📋 Danh sách Đơn hàng B2B
          </Title>
          <Text type="secondary">
            Quản lý và theo dõi tất cả đơn hàng bán buôn
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

      {/* Search and Filter */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={16} align="middle">
          <Col flex={1}>
            <Input.Search
              placeholder="Tìm kiếm theo mã đơn hàng, tên khách hàng..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onSearch={handleSearch}
              style={{ width: '100%' }}
              enterButton={<SearchOutlined />}
            />
          </Col>
          <Col>
            <Button
              icon={<FilterOutlined />}
              onClick={() => setFilterDrawerOpen(true)}
            >
              Bộ lọc ({Object.keys(filters).length})
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Orders Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={quotes}
          rowKey="quote_id"
          loading={loading}
          pagination={{
            current,
            pageSize,
            total,
            onChange: setCurrent,
            showSizeChanger: false,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} đơn hàng`,
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

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

export default B2BOrderListPage;