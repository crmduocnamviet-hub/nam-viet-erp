import React, { useState, useEffect } from "react";
import {
  Table,
  Card,
  Input,
  Select,
  Space,
  Typography,
  Tag,
  Statistic,
  Row,
  Col,
  Button,
  DatePicker,
  message,
  Tooltip,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  SearchOutlined,
  ReloadOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ExportOutlined,
} from "@ant-design/icons";
import {
  getVATInventorySummary,
  getOverallVATStats,
  getWarehouse,
} from "@nam-viet-erp/services";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const VATInventoryDashboard: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [inventoryData, setInventoryData] = useState<IVATInventorySummary[]>(
    [],
  );
  const [warehouses, setWarehouses] = useState<IWarehouse[]>([]);
  const [stats, setStats] = useState<any>(null);

  // Filters
  const [searchText, setSearchText] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState<number | null>(
    null,
  );
  const [showOnlyDiscrepancies, setShowOnlyDiscrepancies] = useState(false);

  useEffect(() => {
    loadWarehouses();
    loadData();
    loadStats();
  }, []);

  const loadWarehouses = async () => {
    const { data } = await getWarehouse();
    if (data) {
      setWarehouses(data);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const { data, error } = await getVATInventorySummary({
        warehouseId: selectedWarehouse || undefined,
        showOnlyDiscrepancies,
      });

      if (error) throw error;

      if (data) {
        setInventoryData(data);
      }
    } catch (error) {
      console.error("Error loading VAT inventory:", error);
      message.error("Không thể tải dữ liệu kho VAT");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data } = await getOverallVATStats();
      if (data) {
        setStats(data);
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const handleRefresh = () => {
    loadData();
    loadStats();
  };

  const handleExport = () => {
    // TODO: Implement CSV export
    message.info("Chức năng xuất báo cáo đang được phát triển");
  };

  // Filter data based on search text
  const filteredData = inventoryData.filter(
    (item) =>
      item.product_name.toLowerCase().includes(searchText.toLowerCase()) ||
      item.sku?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.barcode?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.lot_number?.toLowerCase().includes(searchText.toLowerCase()),
  );

  const columns: ColumnsType<IVATInventorySummary> = [
    {
      title: "Kho",
      dataIndex: "warehouse_name",
      key: "warehouse_name",
      width: 150,
      fixed: "left",
      filters: warehouses.map((w) => ({ text: w.name, value: w.name })),
      onFilter: (value, record) => record.warehouse_name === value,
    },
    {
      title: "Sản phẩm",
      key: "product",
      width: 250,
      fixed: "left",
      render: (_, record) => (
        <div>
          <div>
            <Text strong>{record.product_name}</Text>
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: "12px" }}>
              SKU: {record.sku || "N/A"} | Barcode: {record.barcode || "N/A"}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: "Lô",
      key: "lot",
      width: 150,
      render: (_, record) =>
        record.lot_number ? (
          <div>
            <div>
              <Text>{record.lot_number}</Text>
            </div>
            {record.expiry_date && (
              <div>
                <Text type="secondary" style={{ fontSize: "12px" }}>
                  HSD: {dayjs(record.expiry_date).format("DD/MM/YYYY")}
                </Text>
              </div>
            )}
          </div>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: "Tổng nhập VAT",
      dataIndex: "total_vat_in",
      key: "total_vat_in",
      width: 130,
      align: "right",
      render: (value) => (
        <Text strong style={{ color: "#52c41a" }}>
          {Number(value).toLocaleString()}
        </Text>
      ),
      sorter: (a, b) => Number(a.total_vat_in) - Number(b.total_vat_in),
    },
    {
      title: "Tổng xuất VAT",
      dataIndex: "total_vat_out",
      key: "total_vat_out",
      width: 130,
      align: "right",
      render: (value) => (
        <Text strong style={{ color: "#ff4d4f" }}>
          {Number(value).toLocaleString()}
        </Text>
      ),
      sorter: (a, b) => Number(a.total_vat_out) - Number(b.total_vat_out),
    },
    {
      title: "Chờ xuất VAT",
      dataIndex: "pending_vat_out",
      key: "pending_vat_out",
      width: 130,
      align: "right",
      render: (value) => {
        const val = Number(value);
        return val > 0 ? (
          <Tag color="orange">{val.toLocaleString()}</Tag>
        ) : (
          <Text type="secondary">0</Text>
        );
      },
      sorter: (a, b) => Number(a.pending_vat_out) - Number(b.pending_vat_out),
    },
    {
      title: "Tồn VAT hiện tại",
      dataIndex: "current_vat_inventory",
      key: "current_vat_inventory",
      width: 150,
      align: "right",
      render: (value) => (
        <Text strong style={{ color: "#1890ff" }}>
          {Number(value).toLocaleString()}
        </Text>
      ),
      sorter: (a, b) =>
        Number(a.current_vat_inventory) - Number(b.current_vat_inventory),
    },
    {
      title: "Tồn kho thực tế",
      dataIndex: "physical_inventory",
      key: "physical_inventory",
      width: 150,
      align: "right",
      render: (value) => <Text strong>{Number(value).toLocaleString()}</Text>,
      sorter: (a, b) =>
        Number(a.physical_inventory) - Number(b.physical_inventory),
    },
    {
      title: "Chênh lệch",
      dataIndex: "inventory_difference",
      key: "inventory_difference",
      width: 150,
      align: "right",
      render: (value) => {
        const diff = Number(value);
        const isMatch = diff === 0;

        return (
          <Space>
            {isMatch ? (
              <Tooltip title="Khớp">
                <CheckCircleOutlined style={{ color: "#52c41a" }} />
              </Tooltip>
            ) : (
              <Tooltip title="Chênh lệch">
                <WarningOutlined style={{ color: "#ff4d4f" }} />
              </Tooltip>
            )}
            <Text
              strong
              style={{
                color: isMatch ? "#52c41a" : "#ff4d4f",
              }}
            >
              {diff > 0 ? "+" : ""}
              {diff.toLocaleString()}
            </Text>
          </Space>
        );
      },
      sorter: (a, b) =>
        Number(a.inventory_difference) - Number(b.inventory_difference),
      defaultSortOrder: "descend",
    },
  ];

  return (
    <div style={{ padding: "12px" }}>
      <div
        style={{
          marginBottom: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Title level={2} style={{ margin: 0 }}>
          📦 Kho VAT
        </Title>
        <Space>
          <Button icon={<ExportOutlined />} onClick={handleExport}>
            Xuất báo cáo
          </Button>
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
          >
            Làm mới
          </Button>
        </Space>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <Row gutter={16} style={{ marginBottom: "24px" }}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Tổng kho"
                value={stats.total_warehouses}
                suffix="kho"
                valueStyle={{ color: "#1890ff" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Tổng sản phẩm"
                value={stats.total_products}
                suffix="SP"
                valueStyle={{ color: "#1890ff" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Tồn VAT"
                value={stats.current_vat_inventory}
                valueStyle={{ color: "#1890ff" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Chênh lệch"
                value={stats.discrepancies}
                suffix="mục"
                valueStyle={{
                  color: stats.discrepancies > 0 ? "#ff4d4f" : "#52c41a",
                }}
                prefix={
                  stats.discrepancies > 0 ? (
                    <WarningOutlined />
                  ) : (
                    <CheckCircleOutlined />
                  )
                }
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Filters */}
      <Card style={{ marginBottom: "16px" }}>
        <Space wrap style={{ width: "100%" }}>
          <Input
            placeholder="Tìm sản phẩm, SKU, barcode, lô..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
            allowClear
          />

          <Select
            placeholder="Chọn kho"
            style={{ width: 200 }}
            value={selectedWarehouse}
            onChange={(value) => {
              setSelectedWarehouse(value);
              setTimeout(loadData, 100);
            }}
            allowClear
          >
            {warehouses.map((warehouse) => (
              <Option key={warehouse.id} value={warehouse.id}>
                {warehouse.name}
              </Option>
            ))}
          </Select>

          <Select
            placeholder="Lọc chênh lệch"
            style={{ width: 200 }}
            value={showOnlyDiscrepancies ? "discrepancies" : "all"}
            onChange={(value) => {
              setShowOnlyDiscrepancies(value === "discrepancies");
              setTimeout(loadData, 100);
            }}
          >
            <Option value="all">Tất cả</Option>
            <Option value="discrepancies">Chỉ chênh lệch</Option>
          </Select>
        </Space>
      </Card>

      {/* Main Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey={(record) =>
            `${record.warehouse_id}-${record.product_id}-${record.lot_id || 0}`
          }
          loading={loading}
          scroll={{ x: 1500 }}
          pagination={{
            defaultPageSize: 50,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} mục`,
            pageSizeOptions: ["20", "50", "100", "200"],
          }}
          summary={(pageData) => {
            const totalVATIn = pageData.reduce(
              (sum, record) => sum + Number(record.total_vat_in),
              0,
            );
            const totalVATOut = pageData.reduce(
              (sum, record) => sum + Number(record.total_vat_out),
              0,
            );
            const totalPending = pageData.reduce(
              (sum, record) => sum + Number(record.pending_vat_out),
              0,
            );
            const currentVAT = pageData.reduce(
              (sum, record) => sum + Number(record.current_vat_inventory),
              0,
            );
            const physicalInv = pageData.reduce(
              (sum, record) => sum + Number(record.physical_inventory),
              0,
            );
            const totalDiff = pageData.reduce(
              (sum, record) => sum + Number(record.inventory_difference),
              0,
            );

            return (
              <Table.Summary fixed>
                <Table.Summary.Row style={{ backgroundColor: "#fafafa" }}>
                  <Table.Summary.Cell index={0} colSpan={3}>
                    <Text strong>Tổng trang này</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3} align="right">
                    <Text strong style={{ color: "#52c41a" }}>
                      {totalVATIn.toLocaleString()}
                    </Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={4} align="right">
                    <Text strong style={{ color: "#ff4d4f" }}>
                      {totalVATOut.toLocaleString()}
                    </Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={5} align="right">
                    <Text strong>{totalPending.toLocaleString()}</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={6} align="right">
                    <Text strong style={{ color: "#1890ff" }}>
                      {currentVAT.toLocaleString()}
                    </Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={7} align="right">
                    <Text strong>{physicalInv.toLocaleString()}</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={8} align="right">
                    <Text
                      strong
                      style={{ color: totalDiff === 0 ? "#52c41a" : "#ff4d4f" }}
                    >
                      {totalDiff > 0 ? "+" : ""}
                      {totalDiff.toLocaleString()}
                    </Text>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            );
          }}
        />
      </Card>
    </div>
  );
};

export default VATInventoryDashboard;
