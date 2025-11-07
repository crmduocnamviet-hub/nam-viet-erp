import React from "react";
import { Table, Button, Space, Tag, Tooltip, Popconfirm, Popover } from "antd";
import {
  EyeOutlined,
  EditOutlined,
  StopOutlined,
  DeleteOutlined,
  ShoppingOutlined,
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
      title: "Sản phẩm",
      key: "products",
      width: 300,
      render: (_, record) => {
        const items = record.items || [];
        if (items.length === 0) {
          return (
            <Tag color="default" style={{ margin: 0 }}>
              Chưa có sản phẩm
            </Tag>
          );
        }

        // Single product - show full name
        if (items.length === 1) {
          const product = items[0].product;
          const productName =
            product?.name || `Sản phẩm #${items[0].product_id}`;
          return (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <ShoppingOutlined style={{ color: "#1890ff" }} />
              <span style={{ fontWeight: 500 }}>{productName}</span>
              {items[0].quantity && (
                <Tag color="blue" style={{ margin: 0 }}>
                  x{items[0].quantity}
                </Tag>
              )}
            </div>
          );
        }

        // Multiple products - show count with popover
        const productListContent = (
          <div style={{ maxWidth: 400, maxHeight: 300, overflowY: "auto" }}>
            <div style={{ marginBottom: 8, fontWeight: 600, color: "#1890ff" }}>
              {items.length} sản phẩm trong đơn hàng:
            </div>
            {items.map((item: any, index: number) => {
              const product = item.product;
              const productName =
                product?.name || `Sản phẩm #${item.product_id}`;
              return (
                <div
                  key={index}
                  style={{
                    padding: "6px 0",
                    borderBottom:
                      index < items.length - 1 ? "1px solid #f0f0f0" : "none",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span style={{ color: "#666", minWidth: 20 }}>
                    {index + 1}.
                  </span>
                  <span style={{ flex: 1, fontWeight: 500 }}>
                    {productName}
                  </span>
                  {item.quantity && (
                    <Tag color="blue" style={{ margin: 0 }}>
                      SL: {item.quantity}
                    </Tag>
                  )}
                </div>
              );
            })}
          </div>
        );

        return (
          <Popover
            content={productListContent}
            title={null}
            trigger="click"
            placement="left"
            overlayStyle={{ maxWidth: 450 }}
          >
            <div
              style={{
                cursor: "pointer",
                padding: "4px 8px",
                borderRadius: 4,
                background: "#f0f7ff",
                border: "1px solid #d6e4ff",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <ShoppingOutlined style={{ color: "#1890ff" }} />
              <span style={{ fontWeight: 600, color: "#1890ff" }}>
                {items.length} sản phẩm
              </span>
            </div>
          </Popover>
        );
      },
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
