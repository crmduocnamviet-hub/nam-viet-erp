import React from 'react';
import { Button, Table, Space, Row, Col, Typography, Modal } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import SegmentBuilder from '../../features/marketing/components/SegmentBuilder';

const { Title } = Typography;

const CustomerSegments: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

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
            Tạo phân khúc mới
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
