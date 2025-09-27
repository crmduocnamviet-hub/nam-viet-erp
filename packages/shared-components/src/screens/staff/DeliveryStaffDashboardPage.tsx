import React, { useState, useEffect } from 'react';
import { Card, List, Badge, Button, Typography, Row, Col, Statistic, Tag, Space, Timeline } from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  TruckOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  CarOutlined,
  ShoppingOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

interface TodoItem {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed';
  dueDate?: string;
  type: 'delivery' | 'pickup' | 'contact' | 'general';
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

const DeliveryStaffDashboardPage: React.FC<DeliveryStaffDashboardPageProps> = ({ employee }) => {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [stats, setStats] = useState({
    todayDeliveries: 8,
    pendingPickups: 3,
    completedDeliveries: 12,
    totalDistance: 156
  });

  useEffect(() => {
    // Mock data for delivery staff todos
    const mockTodos: TodoItem[] = [
      {
        id: '1',
        title: 'Giao hàng đơn #DH024',
        description: 'Giao 50 bộ thiết bị y tế cho Bệnh viện Chợ Rẫy',
        priority: 'high',
        status: 'pending',
        dueDate: '09:00 - 14/01/2024',
        type: 'delivery',
        orderId: 'DH024',
        customerInfo: {
          name: 'Bệnh viện Chợ Rẫy',
          phone: '028-3855-4269',
          address: '201B Nguyễn Chí Thanh, Q.5, TP.HCM'
        }
      },
      {
        id: '2',
        title: 'Giao hàng khẩn cấp #DH023',
        description: 'Máy thở cần giao ngay cho Bệnh viện Nhi Đồng 1',
        priority: 'high',
        status: 'in_progress',
        dueDate: '08:00 - 14/01/2024',
        type: 'delivery',
        orderId: 'DH023',
        customerInfo: {
          name: 'Bệnh viện Nhi Đồng 1',
          phone: '028-3829-5132',
          address: '341 Sư Vạn Hạnh, Q.10, TP.HCM'
        }
      },
      {
        id: '3',
        title: 'Liên hệ xác nhận giao hàng',
        description: 'Gọi điện xác nhận thời gian giao hàng với Phòng khám Đa khoa Tâm Anh',
        priority: 'medium',
        status: 'pending',
        type: 'contact',
        customerInfo: {
          name: 'Phòng khám Đa khoa Tâm Anh',
          phone: '1900-54-54-54',
          address: '108 Hoàng Như Tiếp, Q.Long Biên, Hà Nội'
        }
      },
      {
        id: '4',
        title: 'Thu hồi bao bì #DH021',
        description: 'Thu hồi thùng carton và pallet từ Bệnh viện Đại học Y Dược',
        priority: 'low',
        status: 'pending',
        dueDate: '15:00 - 14/01/2024',
        type: 'pickup',
        customerInfo: {
          name: 'Bệnh viện Đại học Y Dược',
          phone: '028-3952-5109',
          address: '215 Hồng Bàng, Q.5, TP.HCM'
        }
      },
      {
        id: '5',
        title: 'Giao hàng đơn #DH025',
        description: '10 bộ dụng cụ sơ cứu cho Trạm y tế Phường 15',
        priority: 'medium',
        status: 'pending',
        dueDate: '13:00 - 14/01/2024',
        type: 'delivery',
        orderId: 'DH025',
        customerInfo: {
          name: 'Trạm y tế Phường 15',
          phone: '028-3123-4567',
          address: '123 Nguyễn Thị Minh Khai, Q.3, TP.HCM'
        }
      }
    ];
    setTodos(mockTodos);
  }, []);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'green';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'in_progress': return <ClockCircleOutlined style={{ color: '#1890ff' }} />;
      case 'pending': return <ExclamationCircleOutlined style={{ color: '#faad14' }} />;
      default: return <ClockCircleOutlined />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'delivery': return <TruckOutlined />;
      case 'pickup': return <CarOutlined />;
      case 'contact': return <PhoneOutlined />;
      default: return <ShoppingOutlined />;
    }
  };

  const markAsCompleted = (todoId: string) => {
    setTodos(prev => prev.map(todo =>
      todo.id === todoId ? { ...todo, status: 'completed' } : todo
    ));
  };

  const markAsInProgress = (todoId: string) => {
    setTodos(prev => prev.map(todo =>
      todo.id === todoId ? { ...todo, status: 'in_progress' } : todo
    ));
  };

  const pendingTodos = todos.filter(todo => todo.status !== 'completed');
  const completedTodos = todos.filter(todo => todo.status === 'completed');
  const todayDeliveries = todos.filter(todo => todo.type === 'delivery');

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>🚚 Dashboard Nhân viên Giao hàng</Title>
      <Text type="secondary">Xin chào {employee?.full_name || 'Nhân viên'}! Đây là lịch trình giao hàng hôm nay.</Text>

      {/* Statistics Cards */}
      <Row gutter={16} style={{ margin: '24px 0' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Giao hàng hôm nay"
              value={stats.todayDeliveries}
              prefix={<TruckOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Chờ thu hồi"
              value={stats.pendingPickups}
              prefix={<CarOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Đã hoàn thành"
              value={stats.completedDeliveries}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
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
              valueStyle={{ color: '#722ed1' }}
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
                    item.status === 'pending' && (
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
                    </Button>
                  ].filter(Boolean)}
                >
                  <List.Item.Meta
                    avatar={getTypeIcon(item.type)}
                    title={
                      <Space direction="vertical" size={0}>
                        <Space>
                          <span>{item.title}</span>
                          <Tag color={getPriorityColor(item.priority)}>
                            {item.priority === 'high' ? 'Khẩn cấp' :
                             item.priority === 'medium' ? 'Ưu tiên' : 'Bình thường'}
                          </Tag>
                          {item.dueDate && (
                            <Tag color="blue">{item.dueDate}</Tag>
                          )}
                        </Space>
                        {item.customerInfo && (
                          <Space size={12}>
                            <Text strong style={{ fontSize: '12px' }}>{item.customerInfo.name}</Text>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
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
                          <Text type="secondary" style={{ fontSize: '12px' }}>
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
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button type="primary" block icon={<TruckOutlined />}>
                Bắt đầu giao hàng
              </Button>
              <Button block icon={<EnvironmentOutlined />}>
                Xem bản đồ
              </Button>
              <Button block icon={<PhoneOutlined />}>
                Gọi khách hàng
              </Button>
              <Button block>
                Báo cáo giao hàng
              </Button>
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
              size="small"
              items={todayDeliveries.slice(0, 4).map(item => ({
                color: item.status === 'completed' ? 'green' :
                       item.status === 'in_progress' ? 'blue' : 'gray',
                children: (
                  <div>
                    <Text style={{ fontSize: '12px' }} strong>
                      {item.dueDate}
                    </Text>
                    <br />
                    <Text style={{ fontSize: '11px' }}>
                      {item.customerInfo?.name}
                    </Text>
                  </div>
                )
              }))}
            />
          </Card>

          {/* Completed Tasks */}
          <Card
            title={
              <Space>
                <CheckCircleOutlined style={{ color: '#52c41a' }} />
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
                    title={<Text delete style={{ fontSize: '12px' }}>{item.title}</Text>}
                    description={<Text type="secondary" style={{ fontSize: '10px' }}>
                      {item.customerInfo?.name}
                    </Text>}
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