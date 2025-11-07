import React from "react";
import { Table, Button, Space, Tag, Typography } from "antd";
import { EyeOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

const { Text } = Typography;

interface InventoryB2BOrdersTableProps {
  quotes: IB2BQuote[];
  loading: boolean;
  onViewOrder: (quote: IB2BQuote) => void;
  getActionButtons: (record: IB2BQuote) => React.ReactNode;
  getStageTitle: (stage: string) => string;
}

const InventoryB2BOrdersTable: React.FC<InventoryB2BOrdersTableProps> = ({
  quotes,
  loading,
  onViewOrder,
  getActionButtons,
  getStageTitle,
}) => {
  const columns: ColumnsType<IB2BQuote> = [
    {
      title: "Mã đơn",
      dataIndex: "quote_number",
      key: "quote_number",
      width: 150,
      fixed: "left",
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: "Khách hàng",
      dataIndex: "customer_name",
      key: "customer_name",
      width: 200,
    },
    {
      title: "Ngày tạo",
      dataIndex: "created_at",
      key: "created_at",
      width: 150,
      render: (date) => dayjs(date).format("DD/MM/YYYY HH:mm"),
    },
    {
      title: "Tổng tiền",
      dataIndex: "total_value",
      key: "total_value",
      width: 150,
      render: (value) => (
        <Text strong style={{ color: "#52c41a" }}>
          {value?.toLocaleString()} VND
        </Text>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "quote_stage",
      key: "quote_stage",
      width: 150,
      render: (stage) => {
        const colors: Record<string, string> = {
          accepted: "blue",
          pending_packaging: "orange",
          packaged: "green",
        };
        return <Tag color={colors[stage]}>{getStageTitle(stage)}</Tag>;
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      fixed: "right",
      width: 300,
      render: (_, record) => getActionButtons(record),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={quotes}
      loading={loading}
      rowKey="quote_id"
      pagination={{
        pageSize: 20,
        showSizeChanger: true,
        showTotal: (total) => `Tổng ${total} đơn hàng`,
      }}
      scroll={{ x: 1200 }}
    />
  );
};

export default InventoryB2BOrdersTable;
