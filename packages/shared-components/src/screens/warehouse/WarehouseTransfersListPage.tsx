import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Card,
  Row,
  Col,
  Statistic,
  Input,
  Select,
  DatePicker,
  Space,
  notification,
  Table,
  Tag,
  Popconfirm,
  Tooltip,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  ClearOutlined,
  ReloadOutlined,
  SwapOutlined,
  SendOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import PageLayout from "../../components/PageLayout";
import {
  getAllWarehouseTransfers,
  deleteWarehouseTransfer,
  cancelWarehouseTransfer,
  submitWarehouseTransfer,
  approveWarehouseTransfer,
  generateTransferSuggestions,
} from "@nam-viet-erp/services";
import TransferSuggestionsModal from "../../components/TransferSuggestionsModal";
import { useAuthStore } from "@nam-viet-erp/store";
import dayjs from "dayjs";
import type { ColumnsType } from "antd/es/table";

const { RangePicker } = DatePicker;

const WarehouseTransfersListPage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(
    null,
  );
  const [transfers, setTransfers] = useState<IWarehouseTransferWithDetails[]>(
    [],
  );

  // Transfer suggestions modal state
  const [showSuggestionsModal, setShowSuggestionsModal] = useState(false);
  const [suggestionsData, setSuggestionsData] = useState<any>(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Fetch warehouse transfers
  const fetchTransfers = async () => {
    setLoading(true);
    try {
      const filters: any = {};

      if (statusFilter && statusFilter !== "all") {
        filters.status = statusFilter as TransferStatus;
      }

      if (dateRange && dateRange[0] && dateRange[1]) {
        filters.startDate = dateRange[0].format("YYYY-MM-DD");
        filters.endDate = dateRange[1].format("YYYY-MM-DD");
      }

      const { data, error } = await getAllWarehouseTransfers(filters);

      if (error) {
        throw error;
      }

      setTransfers(data || []);
    } catch (error: any) {
      notification.error({
        message: "Lỗi",
        description:
          error.message || "Không thể tải danh sách phiếu chuyển kho",
      });
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount and when filters change
  useEffect(() => {
    fetchTransfers();
  }, [statusFilter, dateRange]);

  const handleClearFilters = () => {
    setSearchText("");
    setStatusFilter("all");
    setDateRange(null);
  };

  // Filter by search text (client-side)
  const filteredData = useMemo(() => {
    if (!searchText) return transfers;

    const lowerSearch = searchText.toLowerCase();
    return transfers.filter(
      (transfer) =>
        transfer.transfer_number?.toLowerCase().includes(lowerSearch) ||
        transfer.from_warehouse?.name?.toLowerCase().includes(lowerSearch) ||
        transfer.to_warehouse?.name?.toLowerCase().includes(lowerSearch),
    );
  }, [transfers, searchText]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const total = transfers.length;
    const draft = transfers.filter((t) => t.status === "draft").length;
    const pending = transfers.filter((t) => t.status === "pending").length;
    const approved = transfers.filter((t) => t.status === "approved").length;
    const in_transit = transfers.filter(
      (t) => t.status === "in_transit",
    ).length;
    const completed = transfers.filter((t) => t.status === "completed").length;

    return { total, draft, pending, approved, in_transit, completed };
  }, [transfers]);

  // Get status tag color
  const getStatusColor = (status: TransferStatus) => {
    const colors: Record<TransferStatus, string> = {
      draft: "default",
      pending: "orange",
      approved: "blue",
      in_transit: "cyan",
      completed: "green",
      cancelled: "red",
    };
    return colors[status];
  };

  // Get status label
  const getStatusLabel = (status: TransferStatus) => {
    const labels: Record<TransferStatus, string> = {
      draft: "Nháp",
      pending: "Chờ duyệt",
      approved: "Đã duyệt",
      in_transit: "Đang vận chuyển",
      completed: "Hoàn thành",
      cancelled: "Đã hủy",
    };
    return labels[status];
  };

  // Handle delete
  const handleDelete = async (id: number) => {
    try {
      const { error } = await deleteWarehouseTransfer(id);

      if (error) {
        throw error;
      }

      notification.success({
        message: "Thành công",
        description: "Đã xóa phiếu chuyển kho",
      });

      fetchTransfers();
    } catch (error: any) {
      notification.error({
        message: "Lỗi",
        description: error.message || "Không thể xóa phiếu chuyển kho",
      });
    }
  };

  // Handle submit for approval
  const handleSubmit = async (id: number) => {
    try {
      const { error } = await submitWarehouseTransfer(id);

      if (error) {
        throw error;
      }

      notification.success({
        message: "Thành công",
        description: "Đã gửi phiếu chuyển kho để duyệt",
      });

      fetchTransfers();
    } catch (error: any) {
      notification.error({
        message: "Lỗi",
        description: error.message || "Không thể gửi phiếu chuyển kho",
      });
    }
  };

  // Handle approve
  const handleApprove = async (id: number) => {
    try {
      const { error } = await approveWarehouseTransfer(id);

      if (error) {
        throw error;
      }

      notification.success({
        message: "Thành công",
        description: "Đã duyệt phiếu chuyển kho",
      });

      fetchTransfers();
    } catch (error: any) {
      notification.error({
        message: "Lỗi",
        description: error.message || "Không thể duyệt phiếu chuyển kho",
      });
    }
  };

  // Handle cancel
  const handleCancel = async (id: number) => {
    try {
      const { error } = await cancelWarehouseTransfer(id);

      if (error) {
        throw error;
      }

      notification.success({
        message: "Thành công",
        description: "Đã hủy phiếu chuyển kho",
      });

      fetchTransfers();
    } catch (error: any) {
      notification.error({
        message: "Lỗi",
        description: error.message || "Không thể hủy phiếu chuyển kho",
      });
    }
  };

  // Handle generate suggestions
  const handleGenerateSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const { data, error } = await generateTransferSuggestions();

      if (error) {
        throw error;
      }

      setSuggestionsData(data);
      setShowSuggestionsModal(true);

      if (data && data.suggestions.length > 0) {
        notification.success({
          message: "Tính toán thành công",
          description: `Tìm thấy ${data.total_products} sản phẩm cần chuyển cho ${data.total_pharmacies} kho`,
        });
      }
    } catch (error: any) {
      notification.error({
        message: "Lỗi",
        description: error.message || "Không thể tạo dự trù chuyển kho",
      });
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // Table columns
  const columns: ColumnsType<IWarehouseTransferWithDetails> = [
    {
      title: "Mã phiếu",
      dataIndex: "transfer_number",
      key: "transfer_number",
      width: 150,
      fixed: "left",
      render: (text: string, record) => (
        <Button
          type="link"
          onClick={() => navigate(`/warehouse/transfers/${record.id}`)}
        >
          {text}
        </Button>
      ),
    },
    {
      title: "Từ kho",
      dataIndex: ["from_warehouse", "name"],
      key: "from_warehouse",
      width: 150,
    },
    {
      title: "Đến kho",
      dataIndex: ["to_warehouse", "name"],
      key: "to_warehouse",
      width: 150,
    },
    {
      title: "Ngày chuyển",
      dataIndex: "transfer_date",
      key: "transfer_date",
      width: 120,
      render: (date: string) => dayjs(date).format("DD/MM/YYYY"),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 140,
      render: (status: TransferStatus) => (
        <Tag color={getStatusColor(status)}>{getStatusLabel(status)}</Tag>
      ),
    },
    {
      title: "Số lượng yêu cầu",
      dataIndex: "total_quantity_requested",
      key: "total_quantity_requested",
      width: 130,
      align: "right",
      render: (value: number) => value?.toFixed(0) || "0",
    },
    {
      title: "Số lượng gửi",
      dataIndex: "total_quantity_sent",
      key: "total_quantity_sent",
      width: 120,
      align: "right",
      render: (value: number) => value?.toFixed(0) || "0",
    },
    {
      title: "Số lượng nhận",
      dataIndex: "total_quantity_received",
      key: "total_quantity_received",
      width: 120,
      align: "right",
      render: (value: number) => value?.toFixed(0) || "0",
    },
    {
      title: "Giá trị",
      dataIndex: "total_value",
      key: "total_value",
      width: 130,
      align: "right",
      render: (value: number) =>
        new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(value || 0),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 200,
      fixed: "right",
      render: (_: any, record) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/warehouse/transfers/${record.id}`)}
            />
          </Tooltip>

          {record.status === "draft" && (
            <>
              <Tooltip title="Chỉnh sửa">
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  onClick={() =>
                    navigate(`/warehouse/transfers/${record.id}/edit`)
                  }
                />
              </Tooltip>

              <Tooltip title="Gửi duyệt">
                <Popconfirm
                  title="Gửi phiếu này để duyệt?"
                  onConfirm={() => handleSubmit(record.id)}
                  okText="Có"
                  cancelText="Không"
                >
                  <Button type="text" icon={<SendOutlined />} />
                </Popconfirm>
              </Tooltip>

              <Tooltip title="Xóa">
                <Popconfirm
                  title="Xác nhận xóa phiếu này?"
                  onConfirm={() => handleDelete(record.id)}
                  okText="Xóa"
                  cancelText="Hủy"
                >
                  <Button type="text" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              </Tooltip>
            </>
          )}

          {record.status === "pending" && (
            <>
              <Tooltip title="Duyệt">
                <Popconfirm
                  title="Duyệt phiếu chuyển kho này?"
                  onConfirm={() => handleApprove(record.id)}
                  okText="Duyệt"
                  cancelText="Hủy"
                >
                  <Button type="text" icon={<CheckCircleOutlined />} />
                </Popconfirm>
              </Tooltip>

              <Tooltip title="Từ chối">
                <Popconfirm
                  title="Từ chối phiếu chuyển kho này?"
                  onConfirm={() => handleCancel(record.id)}
                  okText="Từ chối"
                  cancelText="Hủy"
                >
                  <Button type="text" danger icon={<CloseCircleOutlined />} />
                </Popconfirm>
              </Tooltip>
            </>
          )}

          {(record.status === "approved" || record.status === "in_transit") && (
            <Tooltip title="Hủy">
              <Popconfirm
                title="Hủy phiếu chuyển kho này?"
                onConfirm={() => handleCancel(record.id)}
                okText="Hủy phiếu"
                cancelText="Đóng"
              >
                <Button type="text" danger icon={<CloseCircleOutlined />} />
              </Popconfirm>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <PageLayout
      title="Quản lý chuyển kho"
      breadcrumbs={[
        { title: "Kho hàng", path: "/warehouse" },
        { title: "Chuyển kho" },
      ]}
    >
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {/* Statistics */}
        <Row gutter={16}>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Card>
              <Statistic
                title="Tổng số"
                value={statistics.total}
                prefix={<SwapOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Card>
              <Statistic
                title="Nháp"
                value={statistics.draft}
                valueStyle={{ color: "#999" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Card>
              <Statistic
                title="Chờ duyệt"
                value={statistics.pending}
                valueStyle={{ color: "#fa8c16" }}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Card>
              <Statistic
                title="Đã duyệt"
                value={statistics.approved}
                valueStyle={{ color: "#1890ff" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Card>
              <Statistic
                title="Đang chuyển"
                value={statistics.in_transit}
                valueStyle={{ color: "#13c2c2" }}
                prefix={<SendOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Card>
              <Statistic
                title="Hoàn thành"
                value={statistics.completed}
                valueStyle={{ color: "#52c41a" }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {/* Filters */}
        <Card>
          <Space wrap>
            <Input
              placeholder="Tìm kiếm mã phiếu, kho..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 250 }}
            />

            <Select
              placeholder="Trạng thái"
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 150 }}
            >
              <Select.Option value="all">Tất cả</Select.Option>
              <Select.Option value="draft">Nháp</Select.Option>
              <Select.Option value="pending">Chờ duyệt</Select.Option>
              <Select.Option value="approved">Đã duyệt</Select.Option>
              <Select.Option value="in_transit">Đang chuyển</Select.Option>
              <Select.Option value="completed">Hoàn thành</Select.Option>
              <Select.Option value="cancelled">Đã hủy</Select.Option>
            </Select>

            <RangePicker
              value={dateRange}
              onChange={setDateRange}
              format="DD/MM/YYYY"
              placeholder={["Từ ngày", "Đến ngày"]}
            />

            <Button icon={<ClearOutlined />} onClick={handleClearFilters}>
              Xóa bộ lọc
            </Button>

            <Button icon={<ReloadOutlined />} onClick={fetchTransfers}>
              Làm mới
            </Button>

            <Button
              icon={<ShoppingOutlined />}
              onClick={handleGenerateSuggestions}
              loading={loadingSuggestions}
              style={{ borderColor: "#52c41a", color: "#52c41a" }}
            >
              Tạo dự trù chuyển kho
            </Button>

            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate("/warehouse/transfers/create")}
            >
              Tạo phiếu chuyển kho
            </Button>
          </Space>
        </Card>

        {/* Table */}
        <Card>
          <Table
            columns={columns}
            dataSource={filteredData}
            rowKey="id"
            loading={loading}
            scroll={{ x: 1500 }}
            pagination={{
              total: filteredData.length,
              showTotal: (total) => `Tổng ${total} phiếu`,
              showSizeChanger: true,
              showQuickJumper: true,
              pageSizeOptions: ["10", "20", "50", "100"],
            }}
          />
        </Card>

        {/* Transfer Suggestions Modal */}
        <TransferSuggestionsModal
          open={showSuggestionsModal}
          onClose={() => setShowSuggestionsModal(false)}
          data={suggestionsData}
          loading={loadingSuggestions}
        />
      </Space>
    </PageLayout>
  );
};

export default WarehouseTransfersListPage;
