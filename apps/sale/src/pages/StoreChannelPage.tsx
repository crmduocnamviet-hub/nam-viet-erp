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
  Badge,
  Drawer,
} from 'antd';
import {
  SearchOutlined,
  FilterOutlined,
  EyeOutlined,
  EditOutlined,
  DollarOutlined,
  ShopOutlined,
  ReloadOutlined,
  ExportOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import {
  searchOrdersForStoreChannel,
  updatePaymentStatus,
  updateSalesOrder,
  getSalesOrderById,
  getOrderStatuses,
  getSalesStats,
} from '@nam-viet-erp/services';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface Order {
  order_id: string;
  patient_id: string;
  total_value: number;
  payment_method?: string | null;
  payment_status: string;
  operational_status: string;
  order_type: string;
  order_datetime: string;
  patients?: {
    full_name: string;
    phone_number: string;
  };
  created_by?: {
    full_name: string;
    role_name: string;
  };
  sales_order_items?: any[];
}

const StoreChannelPage: React.FC = () => {
  const { notification } = App.useApp();
  const [form] = Form.useForm();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrent] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filters, setFilters] = useState<any>({});
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [orderDetailModalOpen, setOrderDetailModalOpen] = useState(false);
  const [statusEditModalOpen, setStatusEditModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderStatuses, setOrderStatuses] = useState<any>({});
  const [statistics, setStatistics] = useState<any>(null);

  // Load order statuses
  useEffect(() => {
    const statuses = getOrderStatuses();
    setOrderStatuses(statuses);
  }, []);

  // Load orders and statistics
  const loadOrders = async () => {
    setLoading(true);
    try {
      const searchFilters = {
        keyword: searchKeyword || undefined,
        ...filters,
        limit: pageSize,
        offset: (currentPage - 1) * pageSize,
      };

      const [ordersResponse, statsResponse] = await Promise.all([
        searchOrdersForStoreChannel(searchFilters),
        getSalesStats(),
      ]);

      if (ordersResponse.error) throw ordersResponse.error;
      if (statsResponse.error) throw statsResponse.error;

      setOrders(ordersResponse.data || []);
      setStatistics(statsResponse.data);

      // For total count, we'd need a separate count query or use the data length
      setTotal(ordersResponse.data?.length || 0);
    } catch (error: any) {
      notification.error({
        message: 'Lỗi tải dữ liệu',
        description: error.message || 'Không thể tải danh sách đơn hàng',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [currentPage, pageSize, filters]);

  // Handle search
  const handleSearch = () => {
    setCurrent(1);
    loadOrders();
  };

  // Handle filter apply
  const handleFilterApply = (values: any) => {
    const newFilters: any = {};

    if (values.paymentStatus) newFilters.paymentStatus = values.paymentStatus;
    if (values.operationalStatus) newFilters.operationalStatus = values.operationalStatus;
    if (values.orderType) newFilters.orderType = values.orderType;
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
  const handleViewOrder = async (orderId: string) => {
    try {
      const { data: orderDetails, error } = await getSalesOrderById(orderId);
      if (error) throw error;

      setSelectedOrder(orderDetails);
      setOrderDetailModalOpen(true);
    } catch (error: any) {
      notification.error({
        message: 'Lỗi tải chi tiết',
        description: error.message || 'Không thể tải chi tiết đơn hàng',
      });
    }
  };

  // Handle edit status
  const handleEditStatus = (order: Order) => {
    setSelectedOrder(order);
    form.setFieldsValue({
      paymentStatus: order.payment_status,
      operationalStatus: order.operational_status,
      paymentMethod: order.payment_method,
    });
    setStatusEditModalOpen(true);
  };

  // Handle status update
  const handleStatusUpdate = async (values: any) => {
    if (!selectedOrder) return;

    try {
      const updates: any = {};

      if (values.paymentStatus !== selectedOrder.payment_status) {
        await updatePaymentStatus(
          selectedOrder.order_id,
          values.paymentStatus,
          values.paymentMethod
        );
      }

      if (values.operationalStatus !== selectedOrder.operational_status) {
        updates.operational_status = values.operationalStatus;
      }

      if (Object.keys(updates).length > 0) {
        await updateSalesOrder(selectedOrder.order_id, updates);
      }

      notification.success({
        message: 'Cập nhật thành công',
        description: 'Trạng thái đơn hàng đã được cập nhật',
      });

      setStatusEditModalOpen(false);
      loadOrders(); // Reload data
    } catch (error: any) {
      notification.error({
        message: 'Lỗi cập nhật',
        description: error.message || 'Không thể cập nhật trạng thái',
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

  // Get status color
  const getStatusColor = (status: string, type: 'payment' | 'operational') => {
    if (type === 'payment') {
      switch (status) {
        case 'Đã thanh toán': return 'success';
        case 'Chờ thanh toán': return 'warning';
        case 'Thanh toán thiếu': return 'error';
        case 'Hoàn tiền': return 'default';
        default: return 'default';
      }
    } else {
      switch (status) {
        case 'Hoàn tất': return 'success';
        case 'Đang xử lý': return 'processing';
        case 'Đã hủy': return 'error';
        case 'Chờ xác nhận': return 'warning';
        default: return 'default';
      }
    }
  };

  const columns: ColumnsType<Order> = [
    {
      title: 'Mã đơn',
      dataIndex: 'order_id',
      key: 'order_id',
      width: 120,
      render: (id: string) => (
        <Text strong style={{ color: '#1890ff' }}>
          #{id.slice(-6)}
        </Text>
      ),
    },
    {
      title: 'Khách hàng',
      key: 'customer',
      render: (_, record) => (
        <div>
          <Text strong>{record.patients?.full_name || 'N/A'}</Text>
          <br />
          <Text type="secondary">{record.patients?.phone_number}</Text>
        </div>
      ),
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'total_value',
      key: 'total_value',
      render: (value: number) => (
        <Text strong style={{ color: '#52c41a' }}>
          {formatCurrency(value)}
        </Text>
      ),
      sorter: true,
    },
    {
      title: 'Thanh toán',
      dataIndex: 'payment_status',
      key: 'payment_status',
      render: (status: string) => (
        <Tag color={getStatusColor(status, 'payment')}>{status}</Tag>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'operational_status',
      key: 'operational_status',
      render: (status: string) => (
        <Tag color={getStatusColor(status, 'operational')}>{status}</Tag>
      ),
    },
    {
      title: 'Loại',
      dataIndex: 'order_type',
      key: 'order_type',
      render: (type: string) => (
        <Tag color="blue">{type}</Tag>
      ),
    },
    {
      title: 'Thời gian',
      dataIndex: 'order_datetime',
      key: 'order_datetime',
      render: (datetime: string) => (
        <Text>{dayjs(datetime).format('DD/MM/YYYY HH:mm')}</Text>
      ),
      sorter: true,
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => handleViewOrder(record.order_id)}
            title="Xem chi tiết"
          />
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEditStatus(record)}
            title="Sửa trạng thái"
          />
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>
          <ShopOutlined style={{ marginRight: 8, color: '#1890ff' }} />
          Kênh cửa hàng
        </Title>
        <Text type="secondary">
          Quản lý đơn hàng, cập nhật trạng thái và theo dõi thanh toán
        </Text>
      </div>

      {/* Statistics */}
      {statistics && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="Tổng đơn hàng"
                value={statistics.total || 0}
                prefix={<ShopOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Doanh thu"
                value={statistics.totalRevenue || 0}
                prefix={<DollarOutlined />}
                formatter={(value) => formatCurrency(Number(value))}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Chờ thanh toán"
                value={statistics.byPaymentStatus?.['Chờ thanh toán'] || 0}
                valueStyle={{ color: '#faad14' }}
                prefix={<Badge status="warning" />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Đã thanh toán"
                value={statistics.byPaymentStatus?.['Đã thanh toán'] || 0}
                valueStyle={{ color: '#52c41a' }}
                prefix={<Badge status="success" />}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Search and Filter Bar */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Input.Search
              placeholder="Tìm theo mã đơn, tên khách hàng, số điện thoại..."
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
          dataSource={orders}
          rowKey="order_id"
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} đơn hàng`,
            onChange: (page, size) => {
              setCurrent(page);
              setPageSize(size || 20);
            },
          }}
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
          <Form.Item name="paymentStatus" label="Trạng thái thanh toán">
            <Select placeholder="Chọn trạng thái thanh toán" allowClear>
              {orderStatuses.paymentStatuses?.map((status: string) => (
                <Select.Option key={status} value={status}>
                  {status}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="operationalStatus" label="Trạng thái vận hành">
            <Select placeholder="Chọn trạng thái vận hành" allowClear>
              {orderStatuses.operationalStatuses?.map((status: string) => (
                <Select.Option key={status} value={status}>
                  {status}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="orderType" label="Loại đơn hàng">
            <Select placeholder="Chọn loại đơn hàng" allowClear>
              {orderStatuses.orderTypes?.map((type: string) => (
                <Select.Option key={type} value={type}>
                  {type}
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
        title={`Chi tiết đơn hàng #${selectedOrder?.order_id?.slice(-6)}`}
        open={orderDetailModalOpen}
        onCancel={() => setOrderDetailModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setOrderDetailModalOpen(false)}>
            Đóng
          </Button>
        ]}
        width={800}
      >
        {selectedOrder && (
          <div>
            <Row gutter={16}>
              <Col span={12}>
                <Card title="Thông tin khách hàng" size="small">
                  <p><strong>Tên:</strong> {selectedOrder.patients?.full_name}</p>
                  <p><strong>SĐT:</strong> {selectedOrder.patients?.phone_number}</p>
                </Card>
              </Col>
              <Col span={12}>
                <Card title="Thông tin đơn hàng" size="small">
                  <p><strong>Loại:</strong> {selectedOrder.order_type}</p>
                  <p><strong>Tổng tiền:</strong> {formatCurrency(selectedOrder.total_value)}</p>
                  <p><strong>Thanh toán:</strong>
                    <Tag color={getStatusColor(selectedOrder.payment_status, 'payment')}>
                      {selectedOrder.payment_status}
                    </Tag>
                  </p>
                  <p><strong>Trạng thái:</strong>
                    <Tag color={getStatusColor(selectedOrder.operational_status, 'operational')}>
                      {selectedOrder.operational_status}
                    </Tag>
                  </p>
                </Card>
              </Col>
            </Row>
          </div>
        )}
      </Modal>

      {/* Status Edit Modal */}
      <Modal
        title="Cập nhật trạng thái đơn hàng"
        open={statusEditModalOpen}
        onCancel={() => setStatusEditModalOpen(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleStatusUpdate}
        >
          <Form.Item name="paymentStatus" label="Trạng thái thanh toán" rules={[{ required: true }]}>
            <Select>
              {orderStatuses.paymentStatuses?.map((status: string) => (
                <Select.Option key={status} value={status}>
                  {status}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="paymentMethod" label="Phương thức thanh toán">
            <Select placeholder="Chọn phương thức thanh toán" allowClear>
              <Select.Option value="Tiền mặt">Tiền mặt</Select.Option>
              <Select.Option value="Chuyển khoản">Chuyển khoản</Select.Option>
              <Select.Option value="Thẻ">Thẻ</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="operationalStatus" label="Trạng thái vận hành" rules={[{ required: true }]}>
            <Select>
              {orderStatuses.operationalStatuses?.map((status: string) => (
                <Select.Option key={status} value={status}>
                  {status}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setStatusEditModalOpen(false)}>
                Hủy
              </Button>
              <Button type="primary" htmlType="submit">
                Cập nhật
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default StoreChannelPage;