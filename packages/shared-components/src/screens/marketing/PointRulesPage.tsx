import React, { useState, useEffect, useMemo } from "react";
import {
  Button,
  Table,
  Space,
  App,
  Tag,
  Tooltip,
  Card,
  Input,
  Select,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { deletePointRule, getPointRules } from "@nam-viet-erp/services";
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

const PointRulesPage: React.FC = () => {
  const { notification, modal } = App.useApp();
  const navigate = useNavigate();
  const [pointRules, setPointRules] = useState<IPointRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const fetchPointRules = async () => {
    setLoading(true);
    try {
      const { data, error } = await getPointRules({ includeInactive: true });
      if (error) throw error;
      setPointRules(data || []);
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
    fetchPointRules();
  }, []);

  const handleDelete = (id: number, name: string) => {
    modal.confirm({
      title: "Bạn có chắc chắn muốn xóa?",
      content: `Quy tắc "${name}" sẽ bị xóa vĩnh viễn.`,
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          const { error } = await deletePointRule(id);
          if (error) throw error;
          notification?.success({ message: "Đã xóa thành công!" });
          fetchPointRules();
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
    let filtered = pointRules;

    // Filter by search text
    if (searchText) {
      const lowerSearch = searchText.toLowerCase();
      filtered = filtered.filter((rule) =>
        rule.name?.toLowerCase().includes(lowerSearch),
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      const isActive = statusFilter === "active";
      filtered = filtered.filter((rule) => rule.is_active === isActive);
    }

    return filtered;
  }, [pointRules, searchText, statusFilter]);

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString("vi-VN")} ₫`;
  };

  const columns = [
    {
      title: "Tên Quy Tắc",
      dataIndex: "name",
      key: "name",
      width: 250,
      render: (name: string, record: IPointRule) => (
        <Space>
          {name}
          {record.is_default && <Tag color="gold">Mặc định</Tag>}
        </Space>
      ),
    },
    {
      title: "Trạng Thái",
      key: "is_active",
      width: 120,
      align: "center" as const,
      render: (_: any, record: IPointRule) => (
        <Tag color={record.is_active ? "green" : "default"}>
          {record.is_active ? "Đang bật" : "Đang tắt"}
        </Tag>
      ),
    },
    {
      title: "Tỷ Lệ Tích / Đổi",
      key: "rates",
      width: 280,
      render: (_: any, record: IPointRule) => (
        <Space direction="vertical" size="small" style={{ fontSize: 12 }}>
          <div>
            <strong>Tích:</strong> {record.accumulation_points_earned} điểm /{" "}
            {formatCurrency(record.accumulation_spend_amount)}
          </div>
          <div>
            <strong>Đổi:</strong> {record.redemption_points_required} điểm ={" "}
            {formatCurrency(record.redemption_voucher_value)}
          </div>
        </Space>
      ),
    },
    {
      title: "Chi Nhánh Áp Dụng",
      key: "branches",
      width: 200,
      render: (_: any, record: IPointRule) => (
        <Tag color={record.applies_to_all_branches ? "blue" : "cyan"}>
          {record.applies_to_all_branches
            ? "Tất cả chi nhánh"
            : `${record.warehouse_ids?.length || 0} chi nhánh`}
        </Tag>
      ),
    },
    {
      title: "Hành Động",
      key: "action",
      width: 120,
      align: "center" as const,
      fixed: "right" as const,
      render: (_: unknown, record: IPointRule) => (
        <Space size="small">
          <Tooltip title="Sửa">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/point-rules/${record.id}`);
              }}
            />
          </Tooltip>
          <Tooltip title="Xóa">
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(record.id, record.name);
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <PageLayout
      title="Danh sách Quy tắc Tích điểm"
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate("/point-rules/new")}
          size="large"
        >
          Thêm quy tắc mới
        </Button>
      }
    >
      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Space size="middle" wrap>
          <Input
            placeholder="Tìm kiếm theo tên quy tắc..."
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
              { label: "Đang bật", value: "active" },
              { label: "Đang tắt", value: "inactive" },
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
            onClick: () => navigate(`/point-rules/${record.id}`),
            style: { cursor: "pointer" },
          })}
          scroll={{ x: 1200 }}
          pagination={{
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} quy tắc`,
          }}
        />
      </Card>
    </PageLayout>
  );
};

export default PointRulesPage;
