import React from 'react';
import { Button, Table, Space, Row, Col, Typography, Modal, Grid } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
// Temporary stub component to replace missing SegmentBuilder
const SegmentBuilder: React.FC<any> = () => (
  <div style={{ padding: '40px', backgroundColor: '#f5f5f5', borderRadius: '8px', textAlign: 'center' }}>
    <p>🎯 Công cụ xây dựng phân khúc khách hàng</p>
    <p style={{ color: '#666', fontSize: '14px' }}>Component phân khúc khách hàng đang được phát triển</p>
  </div>
);

const { Title } = Typography;
const { useBreakpoint } = Grid;

const CustomerSegments: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const screens = useBreakpoint();
  const isMobile = !screens.lg;

  const columns = [
    { title: 'Tên phân khúc', dataIndex: 'name', key: 'name' },
    { title: 'Số lượng khách', dataIndex: 'count', key: 'count' },
    { title: 'Ngày tạo', dataIndex: 'createdDate', key: 'createdDate' },
    {
      title: 'Hành động',
      key: 'action',
      render: () => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => setIsModalOpen(true)} />
          <Button icon={<DeleteOutlined />} danger />
        </Space>
      ),
    },
  ];

  const data = [
    { id: 1, name: 'Khách hàng VIP (Chi tiêu > 10tr)', count: 150, createdDate: '20/08/2025' },
    { id: 2, name: 'Khách hàng tiềm năng (Chưa mua hàng)', count: 2300, createdDate: '15/08/2025' },
    { id: 3, name: 'Khách hàng đã lâu không mua', count: 540, createdDate: '10/08/2025' },
  ];

  return (
    <>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2}>Phân khúc Khách hàng</Title>
        </Col>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
            {!isMobile && "Tạo phân khúc mới"}
          </Button>
        </Col>
      </Row>
      <Table columns={columns} dataSource={data} rowKey="id" />
      <Modal
        title="Tạo/Sửa Phân khúc"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={800}
      >
        <SegmentBuilder onSave={() => setIsModalOpen(false)} />
      </Modal>
    </>
  );
};

export default CustomerSegments;
