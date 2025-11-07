import React from "react";
import { Table, Space, Avatar, Typography, Tag, type TableProps } from "antd";

interface ProductListTableProps {
  products: IProduct[];
  loading: boolean;
  pagination: {
    current: number;
    pageSize: number;
    total: number;
  };
  isMobile: boolean;
  onTableChange: TableProps<IProduct>["onChange"];
  onRowClick: (record: IProduct) => void;
}

// Helper function to validate URLs
const isValidUrl = (string: string): boolean => {
  try {
    const url = new URL(string);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const ProductListTable: React.FC<ProductListTableProps> = ({
  products,
  loading,
  pagination,
  isMobile,
  onTableChange,
  onRowClick,
}) => {
  const columns: TableProps<IProduct>["columns"] = [
    {
      title: "Sản phẩm",
      dataIndex: "name",
      key: "name",
      render: (text: string, record: IProduct) => (
        <Space>
          <Avatar
            shape="square"
            size={isMobile ? 48 : 64}
            src={
              record.image_url && isValidUrl(record.image_url)
                ? record.image_url
                : null
            }
          />
          <div>
            <Typography.Text strong>{text}</Typography.Text>
            <div style={{ color: "gray", fontSize: "12px" }}>
              SKU: {record.sku || "N/A"}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: "Phân loại",
      dataIndex: "category",
      key: "category",
      responsive: ["md"],
      render: (category: string) => category || "-",
    },
    {
      title: "Đơn vị",
      key: "unit",
      responsive: ["lg"],
      render: (_: any, record: IProduct) => (
        <div>
          <div>Bán lẻ: {record.retail_unit || "-"}</div>
          <div style={{ fontSize: "12px", color: "gray" }}>
            Bán buôn: {record.wholesale_unit || "-"}
          </div>
        </div>
      ),
    },
    {
      title: "Giá bán",
      key: "price",
      render: (_: any, record: IProduct) => (
        <div>
          <div>
            {record.retail_price
              ? `${record.retail_price.toLocaleString("vi-VN")}đ`
              : "-"}
          </div>
          {record.wholesale_price && (
            <div style={{ fontSize: "12px", color: "gray" }}>
              Sỉ: {record.wholesale_price.toLocaleString("vi-VN")}đ
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Nhà sản xuất",
      dataIndex: "manufacturer",
      key: "manufacturer",
      responsive: ["lg"],
      render: (manufacturer: string) => manufacturer || "-",
    },
    {
      title: "Trạng thái",
      dataIndex: "is_active",
      key: "is_active",
      responsive: ["md"],
      render: (isActive: boolean) => (
        <Tag color={isActive ? "green" : "red"}>
          {isActive ? "Đang kinh doanh" : "Ngừng kinh doanh"}
        </Tag>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={products}
      loading={loading}
      rowKey="id"
      pagination={pagination}
      onChange={onTableChange}
      onRow={(record) => ({
        onClick: () => onRowClick(record),
        style: { cursor: "pointer" },
      })}
      scroll={{ x: 800 }}
    />
  );
};

export default ProductListTable;
