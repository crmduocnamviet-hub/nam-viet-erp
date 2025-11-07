import React from "react";
import { Table, Space, Button, Tooltip, Popconfirm, Typography } from "antd";
import {
  MailOutlined,
  UserOutlined,
  PhoneOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

const { Text } = Typography;

interface UserManagementTableProps {
  users: IUserAccount[];
  loading: boolean;
  onEdit: (user?: IUserAccount | undefined) => void;
  onDelete: (userId: string) => void;
}

const UserManagementTable: React.FC<UserManagementTableProps> = ({
  users,
  loading,
  onEdit,
  onDelete,
}) => {
  const columns: ColumnsType<IUserAccount> = [
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      width: 200,
      render: (email: string) => (
        <Space>
          <MailOutlined />
          <Text copyable={{ text: email }}>{email}</Text>
        </Space>
      ),
    },
    {
      title: "Họ tên",
      dataIndex: "full_name",
      key: "full_name",
      width: 150,
      render: (name: string) => (
        <Space>
          <UserOutlined />
          {name || "Chưa cập nhật"}
        </Space>
      ),
    },
    {
      title: "Số điện thoại",
      dataIndex: "phone",
      key: "phone",
      width: 120,
      render: (phone: string) =>
        phone ? (
          <Space>
            <PhoneOutlined />
            {phone}
          </Space>
        ) : (
          "Chưa cập nhật"
        ),
    },
    {
      title: "Lần đăng nhập cuối",
      dataIndex: "last_sign_in_at",
      key: "last_sign_in_at",
      width: 150,
      render: (date: string) =>
        date ? new Date(date).toLocaleString("vi-VN") : "Chưa đăng nhập",
    },
    {
      title: "Hành động",
      key: "actions",
      width: 100,
      fixed: "right" as const,
      render: (_, record: IUserAccount) => (
        <Space size="small">
          <Tooltip title="Sửa">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                onEdit(record);
              }}
            />
          </Tooltip>
          <Popconfirm
            title="Xóa tài khoản?"
            description={`Bạn có chắc chắn muốn xóa tài khoản "${record.email}"?`}
            onConfirm={(e) => {
              e?.stopPropagation();
              onDelete(record.id);
            }}
            onCancel={(e) => {
              e?.stopPropagation();
            }}
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
                onClick={(e) => {
                  e.stopPropagation();
                }}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={users}
      loading={loading}
      rowKey="id"
      pagination={{
        pageSize: 10,
        showSizeChanger: true,
        showTotal: (total) => `Tổng ${total} tài khoản`,
      }}
      scroll={{ x: 800 }}
    />
  );
};

export default UserManagementTable;
