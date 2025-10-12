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
  hasPermission: (permission: string) => boolean;
}

const PurchaseOrdersTable: React.FC<PurchaseOrdersTableProps> = ({
  data,
  loading,
  onView,
  onEdit,
  onCancel,
  onDelete,
  hasPermission,
}) => {
  const columns: ColumnsType<any> = [
    {
      title: "Số Đơn",
      dataIndex: "po_number",
      key: "po_number",
      width: 150,
      render: (text: string) => <a>{text}</a>,
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
      width: 150,
      render: (status: string) => {
        const statusConfig: Record<string, { color: string; text: string }> = {
          draft: { color: "default", text: "Nháp" },
          sent: { color: "processing", text: "Đã gửi" },
          ordered: { color: "processing", text: "Đã đặt hàng" },
          partially_received: { color: "warning", text: "Nhận một phần" },
          received: { color: "success", text: "Hoàn thành" },
          cancelled: { color: "error", text: "Đã hủy" },
        };
        const config = statusConfig[status] || {
          color: "default",
          text: status,
        };
        return <Tag color={config.color}>{config.text}</Tag>;
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
          <Space size="small">
            <Tooltip title="Xem">
              <Button
                type="link"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => onView?.(record)}
              />
            </Tooltip>
            {canEdit && canModify && (
              <Tooltip title="Sửa">
                <Button
                  type="link"
                  size="small"
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
                    size="small"
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
                    size="small"
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
    />
  );
};

export default PurchaseOrdersTable;
