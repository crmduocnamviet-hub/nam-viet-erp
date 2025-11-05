import React from "react";
import { Table, Button, Space, Tag, Typography, Checkbox } from "antd";
import { EyeOutlined, EditOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

const { Text } = Typography;

interface B2BQuoteWithStatus extends IB2BQuote {
  // Using quote_stage for all order statuses
}

interface B2BOrderListTableProps {
  quotes: B2BQuoteWithStatus[];
  loading: boolean;
  selectedOrderIds: string[];
  canViewQuotes: boolean;
  canEditQuotes: boolean;
  isInventoryStaff: boolean;
  isDeliveryStaff: boolean;
  onSelectOrder: (quoteId: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  onViewOrder: (quote: B2BQuoteWithStatus) => void;
  onEditOrder: (quote: B2BQuoteWithStatus) => void;
  canEditOrderStatus: (status: string) => boolean;
  formatCurrency: (value: number) => string;
  getStageInfo: (stage: string) => { color: string; title: string };
  getPaymentStatusInfo: (status: string) => { color: string; title: string };
}

const B2BOrderListTable: React.FC<B2BOrderListTableProps> = ({
  quotes,
  loading,
  selectedOrderIds,
  canViewQuotes,
  canEditQuotes,
  isInventoryStaff,
  isDeliveryStaff,
  onSelectOrder,
  onSelectAll,
  onViewOrder,
  onEditOrder,
  canEditOrderStatus,
  formatCurrency,
  getStageInfo,
  getPaymentStatusInfo,
}) => {
  const columns: ColumnsType<B2BQuoteWithStatus> = [
    {
      title: (
        <Checkbox
          indeterminate={
            selectedOrderIds.length > 0 &&
            selectedOrderIds.length <
              quotes.filter((quote) => canEditOrderStatus(quote.quote_stage))
                .length
          }
          checked={
            selectedOrderIds.length > 0 &&
            selectedOrderIds.length ===
              quotes.filter((quote) => canEditOrderStatus(quote.quote_stage))
                .length
          }
          onChange={(e) => onSelectAll(e.target.checked)}
        />
      ),
      key: "select",
      width: 50,
      render: (_, record) => (
        <Checkbox
          checked={selectedOrderIds.includes(record.quote_id)}
          onChange={(e) => onSelectOrder(record.quote_id, e.target.checked)}
          disabled={!canEditOrderStatus(record.quote_stage)}
        />
      ),
    },
    {
      title: "Mã ĐH / BG",
      dataIndex: "quote_number",
      key: "quote_number",
      width: 140,
      render: (text: string) => (
        <Text strong style={{ color: "#722ed1" }}>
          {text}
        </Text>
      ),
    },
    {
      title: "Tên Khách hàng",
      key: "customer",
      dataIndex: "customer_name",
      width: 200,
      sorter: (a, b) => {
        const nameA = a.customer_name || "";
        const nameB = b.customer_name || "";
        return nameA.localeCompare(nameB, "vi", { sensitivity: "base" });
      },
      sortDirections: ["ascend", "descend"],
      showSorterTooltip: {
        title: "Sắp xếp theo tên khách hàng (A-Z / Z-A)",
      },
      render: (text, record) => (
        <div>
          <Text strong>{text || "N/A"}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: "12px" }}>
            {record.customer_code || "Chưa có mã"}
          </Text>
        </div>
      ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "quote_date",
      key: "quote_date",
      width: 110,
      sorter: (a, b) => {
        const dateA = a.quote_date ? dayjs(a.quote_date).valueOf() : 0;
        const dateB = b.quote_date ? dayjs(b.quote_date).valueOf() : 0;
        return dateA - dateB;
      },
      sortDirections: ["ascend", "descend"],
      showSorterTooltip: {
        title: "Sắp xếp theo ngày tạo (cũ → mới / mới → cũ)",
      },
      defaultSortOrder: "descend",
      render: (date: string) => dayjs(date).format("DD/MM/YYYY"),
    },
    {
      title: "Tổng Giá trị",
      dataIndex: "total_value",
      key: "total_value",
      width: 120,
      sorter: (a, b) => {
        const valueA = a.total_value || 0;
        const valueB = b.total_value || 0;
        return valueA - valueB;
      },
      sortDirections: ["ascend", "descend"],
      showSorterTooltip: {
        title: "Sắp xếp theo giá trị (thấp → cao / cao → thấp)",
      },
      render: (value: number) => (
        <Text strong style={{ color: "#52c41a" }}>
          {formatCurrency(value)}
        </Text>
      ),
    },
    {
      title: "Trạng thái Đơn hàng",
      dataIndex: "quote_stage",
      key: "quote_stage",
      width: 160,
      render: (stage: string) => {
        const stageInfo = getStageInfo(stage);
        return <Tag color={stageInfo.color}>{stageInfo.title}</Tag>;
      },
    },
    {
      title: "Trạng thái Thanh toán",
      dataIndex: "payment_status",
      key: "payment_status",
      width: 150,
      render: (status: string) => {
        const statusInfo = getPaymentStatusInfo(status);
        return <Tag color={statusInfo.color}>{statusInfo.title}</Tag>;
      },
    },
    {
      title: "Hành Động",
      key: "actions",
      width: 150,
      render: (_, record) => (
        <Space>
          {/* View button - available for everyone with view permission */}
          {canViewQuotes && (
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => onViewOrder(record)}
              size="small"
              title="Xem chi tiết đơn hàng"
            ></Button>
          )}

          {/* Edit button - only for those with edit permission and proper status */}
          {/* Hide Edit button for inventory-staff and delivery-staff */}
          {canEditQuotes &&
            !isInventoryStaff &&
            !isDeliveryStaff &&
            canEditOrderStatus(record.quote_stage) && (
              <Button
                type="link"
                icon={<EditOutlined />}
                onClick={() => onEditOrder(record)}
                size="small"
                title="Chỉnh sửa đơn hàng"
              ></Button>
            )}
          {canEditQuotes &&
            !isInventoryStaff &&
            !isDeliveryStaff &&
            !canEditOrderStatus(record.quote_stage) && (
              <Button
                type="link"
                icon={<EditOutlined />}
                onClick={() => onEditOrder(record)}
                size="small"
                disabled
                title="Bạn không có quyền chỉnh sửa trạng thái này"
              ></Button>
            )}
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={quotes}
      loading={loading}
      rowKey="quote_id"
      pagination={{
        pageSize: 10,
        showSizeChanger: true,
        showTotal: (total) => `Tổng ${total} đơn hàng`,
      }}
      scroll={{ x: 1200 }}
    />
  );
};

export default B2BOrderListTable;
