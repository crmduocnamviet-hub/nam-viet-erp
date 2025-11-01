import React, { useState, useEffect, useMemo } from "react";
import {
  Button,
  Table,
  Space,
  Row,
  Col,
  App,
  Tag,
  Popconfirm,
  Tooltip,
  Card,
  Statistic,
  Input,
  Select,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  HomeOutlined,
  GiftOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { deletePromotion, getPromotions } from "@nam-viet-erp/services";
import PageLayout from "../../components/PageLayout";
// Helper function to safely get error message
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    return (error as any).message;
  }

  return "An unknown error occurred";
};

const Promotions: React.FC = () => {
  const { notification, modal } = App.useApp();
  const navigate = useNavigate();
  const [promotions, setPromotions] = useState<IPromotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

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
          notification?.success({ message: "Đã xóa thành công!" });
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

  // Filter data based on search and status
  const filteredData = useMemo(() => {
    let filtered = promotions;

    // Filter by search text
    if (searchText) {
      const lowerSearch = searchText.toLowerCase();
      filtered = filtered.filter(
        (promo) =>
          promo.name?.toLowerCase().includes(lowerSearch) ||
          promo.code?.toLowerCase().includes(lowerSearch),
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      const isActive = statusFilter === "active";
      filtered = filtered.filter((promo) => promo.is_active === isActive);
    }

    return filtered;
  }, [promotions, searchText, statusFilter]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const total = promotions.length;
    const active = promotions.filter((p) => p.is_active).length;
    const inactive = promotions.filter((p) => !p.is_active).length;
    const withCode = promotions.filter((p) => p.code).length;

    return { total, active, inactive, withCode };
  }, [promotions]);

  const getTypeLabel = (type: string | undefined) => {
    const types: Record<string, string> = {
      percentage: "Phần trăm (%)",
      fixed_amount: "Số tiền cố định",
      order_discount: "Giảm theo đơn hàng",
    };
    return types[type || ""] || type || "-";
  };

  const columns = [
    {
      title: "Tên Chương trình",
      dataIndex: "name",
      key: "name",
      width: 250,
    },
    {
      title: "Mã khuyến mãi",
      dataIndex: "code",
      key: "code",
      width: 150,
      render: (code: string) =>
        code ? <Tag color="blue">{code}</Tag> : <Tag>-</Tag>,
    },
    {
      title: "Loại",
      dataIndex: "type",
      key: "type",
      width: 180,
      render: (type: string) => getTypeLabel(type),
    },
    {
      title: "Giá trị",
      dataIndex: "value",
      key: "value",
      width: 120,
      align: "right" as const,
      render: (value: number, record: IPromotion) => {
        if (!value) return "-";
        if (record.type === "percentage") {
          return `${value}%`;
        }
        return `${value.toLocaleString("vi-VN")}đ`;
      },
    },
    {
      title: "Trạng thái",
      key: "is_active",
      width: 120,
      align: "center" as const,
      render: (_: any, record: IPromotion) => (
        <Tag color={record.is_active ? "green" : "red"}>
          {record.is_active ? "Hoạt động" : "Vô hiệu"}
        </Tag>
      ),
    },
    {
      title: "Hành động",
      key: "action",
      width: 100,
      align: "center" as const,
      fixed: "right" as const,
      render: (_: unknown, record: IPromotion) => (
        <Space size="small">
          <Tooltip title="Sửa">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/promotions/${record.id}`);
              }}
            />
          </Tooltip>
          <Popconfirm
            title="Xóa khuyến mại?"
            description={`Bạn có chắc chắn muốn xóa "${record.name}"?`}
            onConfirm={() => handleDelete(record.id, record.name)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Xóa">
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={(e) => e.stopPropagation()}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <PageLayout
      title="Quản lý Khuyến mại"
      breadcrumbs={[
        {
          title: "Trang chủ",
          href: "/",
          icon: <HomeOutlined />,
        },
        {
          title: "Khuyến mại",
          icon: <GiftOutlined />,
        },
      ]}
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate("/promotions/new")}
          size="large"
        >
          Thêm Khuyến mại
        </Button>
      }
    >
      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng Khuyến Mại"
              value={statistics.total}
              prefix={<GiftOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Đang Hoạt Động"
              value={statistics.active}
              valueStyle={{ color: "#52c41a" }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Ngưng Hoạt Động"
              value={statistics.inactive}
              valueStyle={{ color: "#ff4d4f" }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Có Mã Khuyến Mãi"
              value={statistics.withCode}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Space size="middle" wrap>
          <Input
            placeholder="Tìm kiếm theo tên, mã khuyến mãi..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
            allowClear
            size="large"
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 200 }}
            size="large"
            options={[
              { label: "Tất cả trạng thái", value: "all" },
              { label: "Đang hoạt động", value: "active" },
              { label: "Ngưng hoạt động", value: "inactive" },
            ]}
          />
        </Space>
      </Card>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredData}
          loading={loading}
          rowKey="id"
          onRow={(record) => ({
            onClick: () => navigate(`/promotions/${record.id}`),
            style: { cursor: "pointer" },
          })}
          scroll={{ x: 1000 }}
          pagination={{
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} khuyến mại`,
          }}
        />
      </Card>
    </PageLayout>
  );
};

export default Promotions;
