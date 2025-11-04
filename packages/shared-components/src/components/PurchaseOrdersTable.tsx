import React from "react";
import { Table, Button, Space, Tag, Tooltip, Popconfirm } from "antd";
import {
  EyeOutlined,
  EditOutlined,
  StopOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

interface PurchaseOrdersTableProps {
  data: any[];
  loading: boolean;
  onView?: (record: any) => void;
  onEdit?: (record: any) => void;
  onCancel?: (record: any) => void;
  onDelete?: (record: any) => void;
  onStatusChange?: (record: any, status: string) => void;
  hasPermission: (permission: string) => boolean;
}

const PurchaseOrdersTable: React.FC<PurchaseOrdersTableProps> = ({
  data,
  loading,
  onView,
  onEdit,
  onCancel,
  onDelete,
  onStatusChange,
  hasPermission,
}) => {
  const columns: ColumnsType<any> = [
    {
      title: "Số Đơn",
      dataIndex: "po_number",
      key: "po_number",
      width: 150,
      render: (text: string, record) => (
        <a onClick={() => onView?.(record)}>{text}</a>
      ),
    },
    {
      title: "Nhà Cung Cấp",
      dataIndex: ["supplier", "name"],
      key: "supplier_name",
      width: 200,
    },
    {
      title: "Trạng Thái",
      dataIndex: "status",
      key: "status",
      width: 200,
      render: (status: string, record: any) => {
        const statusConfig: Record<
          string,
          { color: string; text: string; nextStatuses: string[] }
        > = {
          draft: {
            color: "default",
            text: "Nháp",
            nextStatuses: ["sent", "ordered"],
          },
          sent: {
            color: "processing",
            text: "Đã gửi",
            nextStatuses: ["ordered"],
          },
          ordered: {
            color: "processing",
            text: "Đã đặt hàng",
            nextStatuses: ["partially_received", "received"],
          },
          partially_received: {
            color: "warning",
            text: "Nhận một phần",
            nextStatuses: ["received"],
          },
          received: { color: "success", text: "Hoàn thành", nextStatuses: [] },
          cancelled: { color: "error", text: "Đã hủy", nextStatuses: [] },
        };
        const config = statusConfig[status] || {
          color: "default",
          text: status,
          nextStatuses: [],
        };

        const isCompleted = status === "received" || status === "cancelled";
        const canChangeStatus =
          onStatusChange && !isCompleted && config.nextStatuses.length > 0;

        return (
          <Space direction="vertical" size={4}>
            <Tag color={config.color}>{config.text}</Tag>
            {canChangeStatus && (
              <Space size={4}>
                {config.nextStatuses.map((nextStatus) => {
                  const nextConfig = statusConfig[nextStatus];
                  return (
                    <Button
                      key={nextStatus}
                      size="small"
                      type="link"
                      onClick={() => onStatusChange?.(record, nextStatus)}
                    >
                      → {nextConfig.text}
                    </Button>
                  );
                })}
              </Space>
            )}
          </Space>
        );
      },
    },
    {
      title: "Tổng Tiền",
      dataIndex: "total_amount",
      key: "total_amount",
      width: 150,
      align: "right" as const,
      render: (amount: number) =>
        amount?.toLocaleString("vi-VN", {
          style: "currency",
          currency: "VND",
        }),
    },
    {
      title: "Ngày Đặt",
      dataIndex: "order_date",
      key: "order_date",
      width: 120,
      render: (date: string) =>
        date ? new Date(date).toLocaleDateString("vi-VN") : "-",
    },
    {
      title: "Ngày Dự Kiến",
      dataIndex: "expected_delivery_date",
      key: "expected_delivery_date",
      width: 120,
      render: (date: string) =>
        date ? new Date(date).toLocaleDateString("vi-VN") : "-",
    },
    {
      title: "Hành Động",
      key: "actions",
      width: 120,
      fixed: "right" as const,
      render: (_: any, record: any) => {
        const canEdit = hasPermission("warehouse.purchase-orders.edit");
        const canDelete = hasPermission("warehouse.purchase-orders.delete");
        const canCancel = hasPermission("warehouse.purchase-orders.cancel");

        // Disable edit/cancel/delete for completed or cancelled orders
        const isCompleted = record.status === "received";
        const isCancelled = record.status === "cancelled";
        const canModify = !isCompleted && !isCancelled;

        return (
          <Space size="middle">
            {canEdit && canModify && (
              <Tooltip title="Sửa">
                <Button
                  type="link"
                  size="middle"
                  icon={<EditOutlined />}
                  onClick={() => onEdit?.(record)}
                />
              </Tooltip>
            )}
            {canCancel && canModify && (
              <Popconfirm
                title="Xác nhận hủy"
                description={`Bạn có chắc chắn muốn hủy đơn ${record.po_number}?`}
                onConfirm={() => onCancel?.(record)}
                okText="Hủy đơn"
                cancelText="Không"
                okButtonProps={{ danger: true }}
              >
                <Tooltip title="Hủy đơn">
                  <Button
                    type="link"
                    size="middle"
                    danger
                    icon={<StopOutlined />}
                  />
                </Tooltip>
              </Popconfirm>
            )}
            {canDelete && record.status === "draft" && (
              <Popconfirm
                title="Xác nhận xóa"
                description={`Bạn có chắc chắn muốn xóa đơn ${record.po_number}? Hành động này không thể hoàn tác.`}
                onConfirm={() => onDelete?.(record)}
                okText="Xóa"
                cancelText="Hủy"
                okButtonProps={{ danger: true }}
              >
                <Tooltip title="Xóa">
                  <Button
                    type="link"
                    size="middle"
                    danger
                    icon={<DeleteOutlined />}
                  />
                </Tooltip>
              </Popconfirm>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={data}
      loading={loading}
      rowKey="id"
      scroll={{ x: 1200 }}
      pagination={{
        showSizeChanger: true,
        showTotal: (total) => `Tổng ${total} đơn hàng`,
      }}
      onRow={(record) => ({
        // onClick() {
        //   onView?.(record);
        // },
        style: {
          cursor: "pointer",
        },
      })}
    />
  );
};

export default PurchaseOrdersTable;
