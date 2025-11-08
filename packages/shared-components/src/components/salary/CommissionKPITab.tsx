/**
 * Commission & KPI Tab - Cấu hình Hoa Hồng & KPIs
 *
 * Tab hiển thị KPIs và kết quả hoa hồng
 * READ-ONLY: Logic tính toán được hardcode, không có UI để config
 */

import React, { useState, useEffect } from "react";
import {
  Table,
  Card,
  Statistic,
  Row,
  Col,
  Typography,
  Tag,
  Space,
  Collapse,
  Descriptions,
  Select,
  DatePicker,
  message,
} from "antd";
import {
  TrophyOutlined,
  DollarOutlined,
  RiseOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import {
  KPIDefinition,
  KPIResult,
  CommissionResult,
  PREDEFINED_KPIS,
} from "../../types/salary";
import { formatCurrency } from "../../utils";
import dayjs from "dayjs";

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;
const { RangePicker } = DatePicker;

const CommissionKPITab: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [selectedKPI, setSelectedKPI] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().startOf("month"),
    dayjs().endOf("month"),
  ]);
  const [kpiResults, setKpiResults] = useState<KPIResult[]>([]);
  const [commissionResults, setCommissionResults] = useState<
    CommissionResult[]
  >([]);

  useEffect(() => {
    loadKPIResults();
    loadCommissionResults();
  }, [selectedKPI, dateRange]);

  const loadKPIResults = () => {
    setLoading(true);
    try {
      // TODO: Load from API with filters
      // Mock data
      const mockKPIResults: KPIResult[] = [
        {
          id: "kpi_result_1",
          employee_id: "emp_1",
          employee_name: "Nguyễn Văn A",
          kpi_definition_id: "kpi_sales_monthly_revenue",
          kpi_name: "Doanh thu trong tháng",
          period_start: "2024-11-01",
          period_end: "2024-11-30",
          actual_value: 150000000,
          calculated_at: "2024-11-30T23:59:59Z",
          metadata: {
            order_count: 45,
            total_orders: 50,
            conditions: [
              "Đã giao hàng",
              "Đã nộp tiền cho Kế toán",
              "Trong tháng 11/2024",
            ],
          },
        },
        {
          id: "kpi_result_2",
          employee_id: "emp_2",
          employee_name: "Trần Thị B",
          kpi_definition_id: "kpi_sales_monthly_revenue",
          kpi_name: "Doanh thu trong tháng",
          period_start: "2024-11-01",
          period_end: "2024-11-30",
          actual_value: 120000000,
          calculated_at: "2024-11-30T23:59:59Z",
          metadata: {
            order_count: 38,
            total_orders: 40,
          },
        },
        {
          id: "kpi_result_3",
          employee_id: "emp_3",
          employee_name: "Lê Văn C",
          kpi_definition_id: "kpi_sales_monthly_orders",
          kpi_name: "Số đơn hàng trong tháng",
          period_start: "2024-11-01",
          period_end: "2024-11-30",
          actual_value: 65,
          calculated_at: "2024-11-30T23:59:59Z",
        },
      ];

      setKpiResults(mockKPIResults);
    } catch (error) {
      message.error("Không thể tải kết quả KPI");
    } finally {
      setLoading(false);
    }
  };

  const loadCommissionResults = () => {
    // TODO: Load commission results from API
    const mockCommissionResults: CommissionResult[] = [
      {
        id: "comm_1",
        employee_id: "emp_1",
        employee_name: "Nguyễn Văn A",
        commission_structure_id: "comm_struct_1",
        kpi_result_id: "kpi_result_1",
        kpi_value: 150000000,
        commission_rate: 2.5,
        commission_amount: 3750000,
        period_start: "2024-11-01",
        period_end: "2024-11-30",
        calculated_at: "2024-11-30T23:59:59Z",
      },
      {
        id: "comm_2",
        employee_id: "emp_2",
        employee_name: "Trần Thị B",
        commission_structure_id: "comm_struct_1",
        kpi_result_id: "kpi_result_2",
        kpi_value: 120000000,
        commission_rate: 2.0,
        commission_amount: 2400000,
        period_start: "2024-11-01",
        period_end: "2024-11-30",
        calculated_at: "2024-11-30T23:59:59Z",
      },
    ];

    setCommissionResults(mockCommissionResults);
  };

  const kpiColumns: ColumnsType<KPIResult> = [
    {
      title: "Nhân viên",
      dataIndex: "employee_name",
      key: "employee_name",
      width: 200,
      fixed: "left",
    },
    {
      title: "KPI",
      dataIndex: "kpi_name",
      key: "kpi_name",
      width: 200,
    },
    {
      title: "Kỳ tính",
      key: "period",
      width: 200,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontSize: 12 }}>
            {dayjs(record.period_start).format("DD/MM/YYYY")} -{" "}
            {dayjs(record.period_end).format("DD/MM/YYYY")}
          </Text>
        </Space>
      ),
    },
    {
      title: "Giá trị đạt được",
      dataIndex: "actual_value",
      key: "actual_value",
      width: 150,
      align: "right",
      render: (value: number, record) => {
        // Format based on metric type
        const kpiDef = PREDEFINED_KPIS.find(
          (k) => k.id === record.kpi_definition_id,
        );
        if (kpiDef?.metric_type === "revenue") {
          return (
            <Tag color="green" style={{ fontSize: 14 }}>
              {formatCurrency(value)}
            </Tag>
          );
        } else if (kpiDef?.metric_type === "order_count") {
          return <Text strong>{value} đơn</Text>;
        } else {
          return <Text strong>{value.toFixed(2)}%</Text>;
        }
      },
    },
    {
      title: "Chi tiết",
      key: "metadata",
      width: 100,
      align: "center",
      render: (_, record) => (
        <Collapse
          ghost
          items={[
            {
              key: "1",
              label: <InfoCircleOutlined />,
              children: (
                <Space direction="vertical" size="small">
                  {record.metadata?.order_count && (
                    <Text>Số đơn: {record.metadata.order_count}</Text>
                  )}
                  {record.metadata?.conditions && (
                    <div>
                      <Text strong>Điều kiện:</Text>
                      <ul style={{ marginTop: 4, paddingLeft: 20 }}>
                        {record.metadata.conditions.map((c, idx) => (
                          <li key={idx}>
                            <Text type="secondary">{c}</Text>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Tính lúc:{" "}
                    {dayjs(record.calculated_at).format("DD/MM/YYYY HH:mm")}
                  </Text>
                </Space>
              ),
            },
          ]}
        />
      ),
    },
  ];

  const commissionColumns: ColumnsType<CommissionResult> = [
    {
      title: "Nhân viên",
      dataIndex: "employee_name",
      key: "employee_name",
      width: 200,
      fixed: "left",
    },
    {
      title: "Giá trị KPI",
      dataIndex: "kpi_value",
      key: "kpi_value",
      width: 150,
      align: "right",
      render: (value: number) => formatCurrency(value),
    },
    {
      title: "% Hoa hồng",
      dataIndex: "commission_rate",
      key: "commission_rate",
      width: 120,
      align: "center",
      render: (rate: number) => <Tag color="blue">{rate}%</Tag>,
    },
    {
      title: "Tiền hoa hồng",
      dataIndex: "commission_amount",
      key: "commission_amount",
      width: 150,
      align: "right",
      render: (amount: number) => (
        <Tag color="green" style={{ fontSize: 14, padding: "4px 12px" }}>
          {formatCurrency(amount)}
        </Tag>
      ),
    },
    {
      title: "Kỳ tính",
      key: "period",
      width: 200,
      render: (_, record) => (
        <Text style={{ fontSize: 12 }}>
          {dayjs(record.period_start).format("DD/MM/YYYY")} -{" "}
          {dayjs(record.period_end).format("DD/MM/YYYY")}
        </Text>
      ),
    },
  ];

  // Statistics
  const totalKPIResults = kpiResults.length;
  const totalCommission = commissionResults.reduce(
    (sum, c) => sum + c.commission_amount,
    0,
  );
  const avgCommission =
    commissionResults.length > 0
      ? totalCommission / commissionResults.length
      : 0;

  return (
    <div>
      {/* KPI Definitions - Hardcoded, read-only */}
      <Card
        title={
          <Space>
            <TrophyOutlined />
            <span>Định nghĩa KPIs (Hardcoded)</span>
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        <Paragraph type="secondary">
          Các KPI dưới đây được định nghĩa sẵn trong hệ thống. Logic tính toán
          được hardcode và không thể thay đổi qua giao diện.
        </Paragraph>

        <Collapse accordion>
          {PREDEFINED_KPIS.map((kpi) => (
            <Panel
              header={
                <Space>
                  <Text strong>{kpi.name}</Text>
                  <Tag color="blue">{kpi.period}</Tag>
                  <Tag>{kpi.metric_type}</Tag>
                </Space>
              }
              key={kpi.id}
            >
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="Mã KPI">
                  <code>{kpi.key}</code>
                </Descriptions.Item>
                <Descriptions.Item label="Mô tả">
                  {kpi.description}
                </Descriptions.Item>
                <Descriptions.Item label="Áp dụng cho">
                  {kpi.applicable_roles.map((role) => (
                    <Tag key={role}>{role}</Tag>
                  ))}
                </Descriptions.Item>
                <Descriptions.Item label="Logic tính toán">
                  <code style={{ fontSize: 12 }}>{kpi.calculation_logic}</code>
                </Descriptions.Item>
              </Descriptions>
            </Panel>
          ))}
        </Collapse>
      </Card>

      {/* Statistics */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Tổng kết quả KPI"
              value={totalKPIResults}
              prefix={<RiseOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Tổng hoa hồng"
              value={totalCommission}
              prefix={<DollarOutlined />}
              formatter={(value) => formatCurrency(Number(value))}
              valueStyle={{ color: "#3f8600" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Hoa hồng TB/người"
              value={avgCommission}
              formatter={(value) => formatCurrency(Number(value))}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Space size="middle" wrap>
          <Select
            placeholder="Chọn KPI"
            style={{ width: 250 }}
            allowClear
            value={selectedKPI}
            onChange={setSelectedKPI}
            options={PREDEFINED_KPIS.map((kpi) => ({
              label: kpi.name,
              value: kpi.id,
            }))}
          />
          <RangePicker
            value={dateRange}
            onChange={(dates) => dates && setDateRange(dates as any)}
            format="DD/MM/YYYY"
          />
        </Space>
      </Card>

      {/* KPI Results Table */}
      <Card title="Kết quả KPIs" style={{ marginBottom: 24 }}>
        <Table
          columns={kpiColumns}
          dataSource={kpiResults}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1000 }}
          pagination={{
            pageSize: 10,
            showTotal: (total) => `Tổng số ${total} kết quả`,
          }}
        />
      </Card>

      {/* Commission Results Table */}
      <Card title="Kết quả Hoa hồng">
        <Table
          columns={commissionColumns}
          dataSource={commissionResults}
          rowKey="id"
          scroll={{ x: 800 }}
          pagination={{
            pageSize: 10,
            showTotal: (total) => `Tổng số ${total} kết quả`,
          }}
        />
      </Card>
    </div>
  );
};

export default CommissionKPITab;
