import React, { useState, useEffect } from 'react';
import { Card, List, Badge, Button, Typography, Row, Col, Statistic, Tag, Space, Progress } from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  BoxPlotOutlined,
  InboxOutlined,
  TruckOutlined,
  WarningOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

interface TodoItem {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed';
  dueDate?: string;
  type: 'packaging' | 'inventory' | 'quality' | 'general';
  orderId?: string;
}

interface InventoryStaffDashboardPageProps {
  employee?: any;
}

const InventoryStaffDashboardPage: React.FC<InventoryStaffDashboardPageProps> = ({ employee }) => {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [stats] = useState({
    pendingPackaging: 15,
    lowStockItems: 8,
    qualityChecks: 4,
    packagingProgress: 75
  });

  useEffect(() => {
    // Mock data for inventory staff todos
    const mockTodos: TodoItem[] = [
      {
        id: '1',
        title: 'Đóng gói đơn hàng #DH024',
        description: 'Đơn hàng B2B - 50 bộ thiết bị y tế cho Bệnh viện Chợ Rẫy',
        priority: 'high',
        status: 'pending',
        dueDate: '2024-01-15',
        type: 'packaging',
        orderId: 'DH024'
      },
      {
        id: '2',
        title: 'Kiểm tra chất lượng lô hàng mới',
        description: 'Kiểm tra 200 sản phẩm máy đo huyết áp vừa nhập kho',
        priority: 'high',
        status: 'in_progress',
        dueDate: '2024-01-14',
        type: 'quality'
      },
      {
        id: '3',
        title: 'Bổ sung tồn kho',
        description: 'Nhập thêm 100 chiếc nhiệt kế điện tử (mã SP: NK001)',
        priority: 'medium',
        status: 'pending',
        type: 'inventory'
      },
      {
        id: '4',
        title: 'Đóng gói đơn hàng #DH025',
        description: 'Đơn hàng lẻ - 10 bộ dụng cụ sơ cứu',
        priority: 'medium',
        status: 'pending',
        dueDate: '2024-01-16',
        type: 'packaging',
        orderId: 'DH025'
      },
      {
        id: '5',
        title: 'Cập nhật vị trí kho',
        description: 'Sắp xếp lại khu vực A3 sau khi nhận hàng mới',
        priority: 'low',
        status: 'pending',
        type: 'general'
      },
      {
        id: '6',
        title: 'Chuẩn bị đơn hàng khẩn cấp',
        description: 'Đơn hàng #DH023 - Máy thở cần giao trong ngày',
        priority: 'high',
        status: 'in_progress',
        dueDate: '2024-01-14',
        type: 'packaging',
        orderId: 'DH023'
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
      case 'packaging': return <BoxPlotOutlined />;
      case 'inventory': return <InboxOutlined />;
      case 'quality': return <WarningOutlined />;
      default: return <ClockCircleOutlined />;
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
  const packagingTodos = todos.filter(todo => todo.type === 'packaging' && todo.status !== 'completed');

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>📦 Dashboard Nhân viên Kho</Title>
      <Text type="secondary">Xin chào {employee?.full_name || 'Nhân viên'}! Đây là danh sách công việc kho hàng hôm nay.</Text>

      {/* Statistics Cards */}
      <Row gutter={16} style={{ margin: '24px 0' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Chờ đóng gói"
              value={stats.pendingPackaging}
              prefix={<BoxPlotOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Sản phẩm sắp hết"
              value={stats.lowStockItems}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Kiểm tra chất lượng"
              value={stats.qualityChecks}
              prefix={<InboxOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div>
              <div style={{ marginBottom: 8 }}>Tiến độ đóng gói</div>
              <Progress
                percent={stats.packagingProgress}
                status="active"
                strokeColor="#52c41a"
              />
            </div>
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
                      <Space>
                        <span>{item.title}</span>
                        <Tag color={getPriorityColor(item.priority)}>
                          {item.priority === 'high' ? 'Khẩn cấp' :
                           item.priority === 'medium' ? 'Ưu tiên' : 'Bình thường'}
                        </Tag>
                        {item.dueDate && (
                          <Tag color="blue">Hạn: {item.dueDate}</Tag>
                        )}
                        {item.orderId && (
                          <Tag color="purple">{item.orderId}</Tag>
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
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button type="primary" block icon={<BoxPlotOutlined />}>
                Quét đơn hàng
              </Button>
              <Button block icon={<InboxOutlined />}>
                Kiểm tra tồn kho
              </Button>
              <Button block icon={<TruckOutlined />}>
                Chuẩn bị giao hàng
              </Button>
              <Button block>
                Báo cáo kho hàng
              </Button>
            </Space>
          </Card>

          {/* Packaging Priority */}
          <Card
            title={
              <Space>
                <BoxPlotOutlined style={{ color: '#faad14' }} />
                Ưu tiên đóng gói ({packagingTodos.length})
              </Space>
            }
            style={{ marginTop: 16 }}
          >
            <List
              dataSource={packagingTodos.slice(0, 4)}
              size="small"
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={
                      <Space>
                        <Text style={{ fontSize: '12px' }}>{item.orderId}</Text>
                        <Badge
                          status={item.priority === 'high' ? 'error' : 'warning'}
                          text={item.title.replace(`${item.orderId}`, '').trim()}
                        />
                      </Space>
                    }
                  />
                </List.Item>
              )}
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

export default InventoryStaffDashboardPage;