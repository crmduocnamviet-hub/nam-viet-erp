import React from "react";
import { Table, Space, Button, Tag, Typography, Badge, Popconfirm } from "antd";
import { HomeOutlined, EyeOutlined, DeleteOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { Room } from "@nam-viet-erp/services";

const { Text } = Typography;

interface RoomManagementTableProps {
  rooms: Room[];
  loading: boolean;
  onView: (room: Room) => void;
  onDelete: (roomId: string) => void;
  getRoomTypeDisplay: (type: Room["room_type"]) => string;
}

const RoomManagementTable: React.FC<RoomManagementTableProps> = ({
  rooms,
  loading,
  onView,
  onDelete,
  getRoomTypeDisplay,
}) => {
  const columns: ColumnsType<Room> = [
    {
      title: "Tên Phòng",
      dataIndex: "name",
      key: "name",
      render: (name: string, record: Room) => (
        <Space>
          <HomeOutlined style={{ color: "#1890ff" }} />
          <Text strong>{name}</Text>
          {!record.is_active && <Tag color="red">Ngưng hoạt động</Tag>}
        </Space>
      ),
    },
    {
      title: "Loại Phòng",
      dataIndex: "room_type",
      key: "room_type",
      render: (type: Room["room_type"]) => (
        <Tag color="blue">{getRoomTypeDisplay(type)}</Tag>
      ),
    },
    {
      title: "Sức Chứa",
      dataIndex: "capacity",
      key: "capacity",
      render: (capacity: number) => (capacity ? `${capacity} người` : "—"),
      align: "center",
    },
    {
      title: "Thiết Bị",
      dataIndex: "equipment",
      key: "equipment",
      render: (equipment: string[]) => (
        <div>
          {equipment && equipment.length > 0 ? (
            equipment.slice(0, 2).map((item, index) => (
              <Tag key={index} style={{ marginBottom: 2 }}>
                {item}
              </Tag>
            ))
          ) : (
            <Text type="secondary">Chưa có</Text>
          )}
          {equipment && equipment.length > 2 && (
            <Tag>+{equipment.length - 2} khác</Tag>
          )}
        </div>
      ),
    },
    {
      title: "Trạng Thái",
      dataIndex: "is_active",
      key: "is_active",
      render: (isActive: boolean) => (
        <Badge
          status={isActive ? "success" : "error"}
          text={isActive ? "Đang hoạt động" : "Ngưng hoạt động"}
        />
      ),
      align: "center",
    },
    {
      title: "Thao Tác",
      key: "action",
      render: (_, record: Room) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              onView(record);
            }}
            title="Xem chi tiết"
          />
          <Popconfirm
            title="Xóa phòng"
            description="Bạn có chắc muốn xóa phòng này?"
            onConfirm={(e) => {
              e?.stopPropagation();
              onDelete(record.room_id);
            }}
            onCancel={(e) => {
              e?.stopPropagation();
            }}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={(e) => {
                e.stopPropagation();
              }}
              title="Xóa"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={rooms}
      loading={loading}
      rowKey="room_id"
      pagination={{
        pageSize: 10,
        showSizeChanger: true,
        showTotal: (total) => `Tổng ${total} phòng`,
      }}
      scroll={{ x: 1000 }}
    />
  );
};

export default RoomManagementTable;
