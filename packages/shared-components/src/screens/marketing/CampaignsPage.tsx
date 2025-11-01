import React, { useState, useMemo } from "react";
import {
  Button,
  Table,
  Space,
  Row,
  Col,
  Tag,
  Dropdown,
  Menu,
  Card,
  Statistic,
  Input,
  Select,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  CopyOutlined,
  BarChartOutlined,
  MoreOutlined,
  HomeOutlined,
  RocketOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import PageLayout from "../../components/PageLayout";

const Campaigns: React.FC = () => {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const menu = (record: any) => (
    <Menu>
      <Menu.Item
        key="1"
        icon={<BarChartOutlined />}
        onClick={() => navigate(`/marketing/campaigns/${record.id}`)}
      >
        Xem báo cáo
      </Menu.Item>
      <Menu.Item key="2" icon={<CopyOutlined />}>
        Nhân bản
      </Menu.Item>
      <Menu.Item key="3" icon={<DeleteOutlined />} danger>
        Xóa
      </Menu.Item>
    </Menu>
  );

  const columns = [
    { title: "Tên chiến dịch", dataIndex: "name", key: "name" },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        let color = "default";
        if (status === "Đang chạy") color = "green";
        if (status === "Đã kết thúc") color = "red";
        if (status === "Nháp") color = "gold";
        return <Tag color={color}>{status}</Tag>;
      },
    },
    { title: "Chuyển đổi", dataIndex: "conversions", key: "conversions" },
    {
      title: "Doanh thu",
      dataIndex: "revenue",
      key: "revenue",
      render: (val: number) => val.toLocaleString("vi-VN") + " đ",
    },
    {
      title: "ROI",
      dataIndex: "roi",
      key: "roi",
      render: (val: number) => `${val}%`,
    },
    {
      title: "Hành động",
      key: "action",
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="primary"
            onClick={() => navigate(`/marketing/campaigns/${record.id}`)}
          >
            Chi tiết
          </Button>
          <Dropdown overlay={menu(record)} trigger={["click"]}>
            <Button icon={<MoreOutlined />} />
          </Dropdown>
        </Space>
      ),
    },
  ];

  const data = [
    {
      id: 1,
      name: "Khuyến mại Black Friday 2025",
      status: "Đang chạy",
      conversions: 150,
      revenue: 25000000,
      roi: 400,
    },
    {
      id: 2,
      name: "Chào hè rực rỡ",
      status: "Đã kết thúc",
      conversions: 300,
      revenue: 40000000,
      roi: 250,
    },
    {
      id: 3,
      name: "Chiến dịch Tết 2026",
      status: "Nháp",
      conversions: 0,
      revenue: 0,
      roi: 0,
    },
  ];

  // Filter data
  const filteredData = useMemo(() => {
    let filtered = data;

    // Filter by search text
    if (searchText) {
      const lowerSearch = searchText.toLowerCase();
      filtered = filtered.filter((campaign) =>
        campaign.name?.toLowerCase().includes(lowerSearch),
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (campaign) => campaign.status === statusFilter,
      );
    }

    return filtered;
  }, [searchText, statusFilter]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const total = data.length;
    const running = data.filter((c) => c.status === "Đang chạy").length;
    const completed = data.filter((c) => c.status === "Đã kết thúc").length;
    const totalRevenue = data.reduce((sum, c) => sum + c.revenue, 0);

    return { total, running, completed, totalRevenue };
  }, []);

  return (
    <PageLayout
      title="Quản lý Chiến dịch"
      breadcrumbs={[
        {
          title: "Trang chủ",
          href: "/",
          icon: <HomeOutlined />,
        },
        {
          title: "Chiến dịch Marketing",
          icon: <RocketOutlined />,
        },
      ]}
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate("/marketing/campaigns/new")}
          size="large"
        >
          Tạo chiến dịch mới
        </Button>
      }
    >
      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng Chiến Dịch"
              value={statistics.total}
              prefix={<RocketOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Đang Chạy"
              value={statistics.running}
              valueStyle={{ color: "#52c41a" }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Đã Kết Thúc"
              value={statistics.completed}
              valueStyle={{ color: "#ff4d4f" }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng Doanh Thu"
              value={statistics.totalRevenue}
              valueStyle={{ color: "#1890ff" }}
              prefix={<DollarOutlined />}
              suffix="đ"
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Space size="middle" wrap>
          <Input
            placeholder="Tìm kiếm theo tên chiến dịch..."
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
              { label: "Đang chạy", value: "Đang chạy" },
              { label: "Đã kết thúc", value: "Đã kết thúc" },
              { label: "Nháp", value: "Nháp" },
            ]}
          />
        </Space>
      </Card>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          pagination={{
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} chiến dịch`,
          }}
        />
      </Card>
    </PageLayout>
  );
};

export default Campaigns;
