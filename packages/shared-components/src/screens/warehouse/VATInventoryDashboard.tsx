import React, { useState } from "react";
import {
  Card,
  Table,
  Space,
  Typography,
  Tag,
  Row,
  Col,
  Statistic,
  Alert,
  Progress,
  Input,
  Select,
} from "antd";
import {
  WarningOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import PageLayout from "../../components/PageLayout";

const { Title, Text } = Typography;

const VATInventoryDashboard: React.FC = () => {
  const [searchText, setSearchText] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState<string>("all");

  // Mock data - will be replaced with real API calls
  const mockData: any[] = [];

  const columns = [
    {
      title: "Sản Phẩm",
      dataIndex: "product_name",
      key: "product_name",
      width: 200,
      fixed: "left" as const,
      render: (name: string, record: any) => (
        <Space direction="vertical" size="small">
          <Text strong>{name}</Text>
          {record.product_code && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              Mã: {record.product_code}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: "Kho",
      dataIndex: "warehouse_name",
      key: "warehouse_name",
      width: 150,
    },
    {
      title: "Tồn Kho Thực Tế",
      dataIndex: "physical_quantity",
      key: "physical_quantity",
      align: "center" as const,
      width: 120,
      render: (qty: number) => (
        <Tag color="blue" style={{ fontSize: 14 }}>
          {qty || 0}
        </Tag>
      ),
    },
    {
      title: "Tồn Kho VAT",
      dataIndex: "vat_quantity",
      key: "vat_quantity",
      align: "center" as const,
      width: 120,
      render: (qty: number) => (
        <Tag color="green" style={{ fontSize: 14 }}>
          {qty || 0}
        </Tag>
      ),
    },
    {
      title: "Chênh Lệch",
      key: "difference",
      align: "center" as const,
      width: 120,
      render: (_: any, record: any) => {
        const diff =
          (record.physical_quantity || 0) - (record.vat_quantity || 0);
        const color = diff > 0 ? "warning" : diff < 0 ? "error" : "success";
        const icon = diff === 0 ? <CheckCircleOutlined /> : <WarningOutlined />;
        return (
          <Tag color={color} icon={icon} style={{ fontSize: 14 }}>
            {diff > 0 ? `+${diff}` : diff}
          </Tag>
        );
      },
    },
    {
      title: "Tỷ Lệ VAT",
      key: "vat_coverage",
      width: 150,
      render: (_: any, record: any) => {
        const physical = record.physical_quantity || 0;
        const vat = record.vat_quantity || 0;
        if (physical === 0) {
          return <Text type="secondary">N/A</Text>;
        }
        const coverage = (vat / physical) * 100;
        const color =
          coverage >= 100
            ? "success"
            : coverage >= 80
              ? "processing"
              : coverage >= 50
                ? "warning"
                : "exception";
        return (
          <Space direction="vertical" size="small" style={{ width: "100%" }}>
            <Progress
              percent={Math.min(coverage, 100)}
              // status={color}
              size="small"
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {coverage.toFixed(1)}%
            </Text>
          </Space>
        );
      },
    },
    {
      title: "Trạng Thái",
      key: "status",
      width: 150,
      render: (_: any, record: any) => {
        const physical = record.physical_quantity || 0;
        const vat = record.vat_quantity || 0;
        const diff = physical - vat;

        if (diff === 0) {
          return (
            <Tag color="success" icon={<CheckCircleOutlined />}>
              Khớp
            </Tag>
          );
        } else if (diff > 0) {
          return (
            <Tag color="warning" icon={<WarningOutlined />}>
              Thiếu VAT
            </Tag>
          );
        } else {
          return (
            <Tag color="error" icon={<WarningOutlined />}>
              VAT Thừa
            </Tag>
          );
        }
      },
    },
  ];

  return (
    <PageLayout title="Kho VAT">
      {/* Statistics */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng Sản Phẩm"
              value={0}
              prefix={<InfoCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Sản Phẩm Khớp VAT"
              value={0}
              valueStyle={{ color: "#52c41a" }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Thiếu VAT"
              value={0}
              valueStyle={{ color: "#faad14" }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="VAT Thừa"
              value={0}
              valueStyle={{ color: "#f5222d" }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Alerts */}
      <Space
        direction="vertical"
        size="middle"
        style={{ width: "100%", marginBottom: 16 }}
      >
        <Alert
          message="Thông tin về Kho VAT"
          description="Kho VAT theo dõi số lượng sản phẩm có hóa đơn VAT. Chỉ bán được số lượng sản phẩm có hóa đơn VAT tương ứng."
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
        />
      </Space>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input
            placeholder="Tìm kiếm sản phẩm..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
          />
          <Select
            value={warehouseFilter}
            onChange={setWarehouseFilter}
            style={{ width: 200 }}
          >
            <Select.Option value="all">Tất cả kho</Select.Option>
            <Select.Option value="main">Kho chính</Select.Option>
            <Select.Option value="secondary">Kho phụ</Select.Option>
          </Select>
          <Select defaultValue="all" style={{ width: 150 }}>
            <Select.Option value="all">Tất cả</Select.Option>
            <Select.Option value="matched">Khớp</Select.Option>
            <Select.Option value="missing_vat">Thiếu VAT</Select.Option>
            <Select.Option value="excess_vat">VAT thừa</Select.Option>
          </Select>
        </Space>
      </Card>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={mockData}
          rowKey="id"
          scroll={{ x: 1200 }}
          pagination={{
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} sản phẩm`,
          }}
          rowClassName={(record) => {
            const diff =
              (record.physical_quantity || 0) - (record.vat_quantity || 0);
            if (diff === 0) return "row-matched";
            if (diff > 0) return "row-warning";
            return "row-error";
          }}
        />
      </Card>

      <style>{`
        .row-matched {
          background-color: #f6ffed;
        }
        .row-warning {
          background-color: #fffbe6;
        }
        .row-error {
          background-color: #fff1f0;
        }
      `}</style>
    </PageLayout>
  );
};

export default VATInventoryDashboard;
