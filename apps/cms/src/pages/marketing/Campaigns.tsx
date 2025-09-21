import React from 'react';
import { Button, Table, Space, Row, Col, Typography, Tag, Dropdown, Menu } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CopyOutlined, BarChartOutlined, MoreOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

const Campaigns: React.FC = () => {
  const navigate = useNavigate();

  const menu = (record: any) => (
    <Menu>
      <Menu.Item key="1" icon={<BarChartOutlined />} onClick={() => navigate(`/marketing/campaigns/${record.id}`)}>Xem báo cáo</Menu.Item>
      <Menu.Item key="2" icon={<CopyOutlined />}>Nhân bản</Menu.Item>
      <Menu.Item key="3" icon={<DeleteOutlined />} danger>Xóa</Menu.Item>
    </Menu>
  );

  const columns = [
    { title: 'Tên chiến dịch', dataIndex: 'name', key: 'name' },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status', render: (status: string) => {
        let color = 'default';
        if (status === 'Đang chạy') color = 'green';
        if (status === 'Đã kết thúc') color = 'red';
        if (status === 'Nháp') color = 'gold';
        return <Tag color={color}>{status}</Tag>;
    }},
    { title: 'Chuyển đổi', dataIndex: 'conversions', key: 'conversions' },
    { title: 'Doanh thu', dataIndex: 'revenue', key: 'revenue', render: (val: number) => val.toLocaleString('vi-VN') + ' đ' },
    { title: 'ROI', dataIndex: 'roi', key: 'roi', render: (val: number) => `${val}%` },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button type="primary" onClick={() => navigate(`/marketing/campaigns/${record.id}`)}>Chi tiết</Button>
          <Dropdown overlay={menu(record)} trigger={['click']}>
            <Button icon={<MoreOutlined />} />
          </Dropdown>
        </Space>
      ),
    },
  ];

  const data = [
    { id: 1, name: 'Khuyến mại Black Friday 2025', status: 'Đang chạy', conversions: 150, revenue: 25000000, roi: 400 },
    { id: 2, name: 'Chào hè rực rỡ', status: 'Đã kết thúc', conversions: 300, revenue: 40000000, roi: 250 },
    { id: 3, name: 'Chiến dịch Tết 2026', status: 'Nháp', conversions: 0, revenue: 0, roi: 0 },
  ];

  return (
    <>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2}>Quản lý Chiến dịch</Title>
        </Col>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/marketing/campaigns/new')}>
            Tạo chiến dịch mới
          </Button>
        </Col>
      </Row>
      <Table columns={columns} dataSource={data} rowKey="id" />
    </>
  );
};

export default Campaigns;
