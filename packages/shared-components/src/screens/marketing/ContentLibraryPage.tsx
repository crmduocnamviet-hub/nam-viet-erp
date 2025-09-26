import React from 'react';
import { Button, Table, Space, Row, Col, Typography, Grid } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

const { Title } = Typography;
const { useBreakpoint } = Grid;

const ContentLibrary: React.FC = () => {
  const screens = useBreakpoint();
  const isMobile = !screens.lg;
  const columns = [
    { title: 'Tên mẫu', dataIndex: 'name', key: 'name' },
    { title: 'Nội dung', dataIndex: 'content', key: 'content', ellipsis: true },
    { title: 'Kênh', dataIndex: 'channel', key: 'channel' },
    { title: 'Ngày tạo', dataIndex: 'createdDate', key: 'createdDate' },
    {
      title: 'Hành động',
      key: 'action',
      render: () => (
        <Space>
          <Button icon={<EditOutlined />} />
          <Button icon={<DeleteOutlined />} danger />
        </Space>
      ),
    },
  ];

  const data = [
    { id: 1, name: 'Tin nhắn chúc mừng sinh nhật', content: 'Nam Việt xin chúc mừng sinh nhật {{TEN_KHACH_HANG}}! Tặng bạn mã giảm giá {{MA_GIAM_GIA}}.', channel: 'Zalo, SMS', createdDate: '10/08/2025' },
    { id: 2, name: 'Thông báo khuyến mãi Black Friday', content: 'Siêu sale Black Friday, giảm giá đến 50% toàn bộ sản phẩm...', channel: 'Zalo, Facebook', createdDate: '05/08/2025' },
  ];

  return (
    <>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2}>Thư viện Nội dung & Mẫu</Title>
        </Col>
        <Col>
          <Button type="primary" icon={<PlusOutlined />}>
            {!isMobile && "Tạo mẫu mới"}
          </Button>
        </Col>
      </Row>
      <Table columns={columns} dataSource={data} rowKey="id" />
    </>
  );
};

export default ContentLibrary;
