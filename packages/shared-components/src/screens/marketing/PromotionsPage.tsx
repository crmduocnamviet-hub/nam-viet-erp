import React, { useState, useEffect } from "react";
import { Button, Table, Space, Row, Col, Typography, App, Tag } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { deletePromotion, getPromotions } from "@nam-viet-erp/services";
// Helper function to safely get error message
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    return (error as any).message;
  }

  return 'An unknown error occurred';
};

const { Title } = Typography;

const Promotions: React.FC = () => {
  const { notification, modal } = App.useApp();
  const navigate = useNavigate(); // Khởi tạo công cụ điều hướng
  const [promotions, setPromotions] = useState<IPromotion[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPromotions = async () => {
    setLoading(true);
    try {
      const { data, error } = await getPromotions();
      if (error) throw error;
      setPromotions(data || []);
    } catch (error: unknown) {
      notification.error({
        message: "Lỗi tải dữ liệu",
        description: getErrorMessage(error),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  const handleDelete = (id: number, name: string) => {
    modal.confirm({
      title: "Bạn có chắc chắn muốn xóa?",
      content: `Chương trình khuyến mại "${name}" sẽ bị xóa vĩnh viễn.`,
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          const { error } = await deletePromotion(id);
          if (error) throw error;
          notification.success({ message: "Đã xóa thành công!" });
          fetchPromotions(); // Tải lại danh sách
        } catch (error: unknown) {
          notification.error({
            message: "Lỗi khi xóa",
            description: getErrorMessage(error),
          });
        }
      },
    });
  };

  const columns = [
    { title: "Tên Chương trình", dataIndex: "name", key: "name" },
    { title: "Loại", dataIndex: "type", key: "type" },
    {
      title: "Trạng thái",
      key: "is_active",
      render: (isActive: boolean) => (
        <Tag color={isActive ? "green" : "red"}>
          {isActive ? "Hoạt động" : "Vô hiệu"}
        </Tag>
      ),
    },
    {
      title: "Hành động",
      key: "action",
      // Nút Sửa giờ đây sẽ điều hướng đến trang chi tiết
      render: (_: unknown, record: IPromotion) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => navigate(`/promotions/${record.id}`)}
          />
          <Button
            icon={<DeleteOutlined />}
            danger
            onClick={() => handleDelete(record.id, record.name)}
          />
        </Space>
      ),
    },
  ];

  return (
    <>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2}>Quản lý Khuyến mại</Title>
        </Col>
        {/* Nút Thêm mới giờ đây sẽ điều hướng đến trang tạo mới */}
        <Col>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate("/promotions/new")}
          >
            Thêm Khuyến mại
          </Button>
        </Col>
      </Row>
      <Table
        columns={columns}
        dataSource={promotions}
        loading={loading}
        rowKey="id"
      />
    </>
  );
};

export default Promotions;
