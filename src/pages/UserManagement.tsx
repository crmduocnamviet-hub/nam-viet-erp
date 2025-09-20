// src/pages/UserManagement.tsx

import React, { useState, useEffect, useCallback } from "react";
import {
  Row,
  Col,
  Typography,
  App as AntApp,
  Card,
  Table,
  Button,
  Spin,
  Modal,
  Form,
  Input,
  Tag,
  Grid,
  Avatar,
  Checkbox,
  List,
  Space,
  Dropdown,
} from "antd";
import {
  PlusOutlined,
  UserSwitchOutlined,
  CheckOutlined,
  DownOutlined,
} from "@ant-design/icons";
import { supabase } from "../lib/supabaseClient";
import { useDebounce } from "../hooks/useDebounce";
import type { MenuProps } from "antd";

const { Title, Text } = Typography;
const { Search } = Input;
const { useBreakpoint } = Grid;

const UserManagementContent: React.FC = () => {
  const { notification, modal } = AntApp.useApp();
  const screens = useBreakpoint();
  const [inviteForm] = Form.useForm();
  const [rolesForm] = Form.useForm();

  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isRolesModalOpen, setIsRolesModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const fetchData = useCallback(
    async (search = debouncedSearchTerm) => {
      setLoading(true);
      try {
        let query = supabase
          .from("profiles")
          .select("*, user_roles(roles(id, name))");

        if (search) {
          query = query.or(
            `full_name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`
          );
        }

        const { data, error } = await query.order("full_name");
        if (error) throw error;
        setUsers(data || []);
      } catch (error: any) {
        notification.error({
          message: "Lỗi tải dữ liệu",
          description: error.message,
        });
      } finally {
        setLoading(false);
      }
    },
    [notification, debouncedSearchTerm]
  );

  useEffect(() => {
    const fetchRoles = async () => {
      const { data } = await supabase.from("roles").select("*");
      if (data) setRoles(data);
    };
    fetchRoles();
  }, []);

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel("profiles-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => fetchData()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [debouncedSearchTerm, fetchData]);

  const handleInviteUser = async (values: any) => {
    try {
      const { error } = await supabase.functions.invoke("invite-user", {
        body: { email: values.email, fullName: values.full_name },
      });
      if (error) throw error;
      notification.success({ message: `Đã gửi lời mời đến ${values.email}` });
      setIsInviteModalOpen(false);
      inviteForm.resetFields();
    } catch (error: any) {
      notification.error({
        message: "Mời thất bại",
        description: error.message,
      });
    }
  };

  const handleOpenRolesModal = (user: any) => {
    setSelectedUser(user);
    const currentUserRoleIds = user.user_roles.map((ur: any) => ur.roles.id);
    rolesForm.setFieldsValue({ roleIds: currentUserRoleIds });
    setIsRolesModalOpen(true);
  };

  const handleUpdateRoles = async (values: any) => {
    if (!selectedUser) return;
    try {
      const { error } = await supabase.functions.invoke("update-user-roles", {
        body: { userId: selectedUser.id, roleIds: values.roleIds },
      });
      if (error) throw error;
      notification.success({
        message: `Đã cập nhật vai trò cho ${selectedUser.full_name}`,
      });
      setIsRolesModalOpen(false);
      fetchData();
    } catch (error: any) {
      notification.error({
        message: "Cập nhật vai trò thất bại",
        description: error.message,
      });
    }
  };

  const handleApproveUser = async (user: any) => {
    modal.confirm({
      title: `Duyệt thành viên "${user.full_name}"?`,
      content:
        "Sau khi duyệt, người dùng này sẽ có thể đăng nhập vào hệ thống.",
      okText: "Duyệt",
      onOk: async () => {
        try {
          const { error } = await supabase.functions.invoke("approve-user", {
            body: { userId: user.id },
          });
          if (error) throw error;
          notification.success({ message: "Phê duyệt thành công!" });
          fetchData();
        } catch (error: any) {
          notification.error({
            message: "Phê duyệt thất bại",
            description: error.message,
          });
        }
      },
    });
  };

  const handleChangeStatus = async (user: any, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ employee_status: newStatus })
        .eq("id", user.id);
      if (error) throw error;
      notification.success({
        message: `Đã cập nhật trạng thái cho ${user.full_name}`,
      });
      fetchData();
    } catch (error: any) {
      notification.error({
        message: "Cập nhật thất bại",
        description: error.message,
      });
    }
  };

  const columns = [
    {
      title: "Họ Tên",
      dataIndex: "full_name",
      key: "full_name",
      render: (text: string, record: any) => (
        <Space>
          <Avatar src={record.avatar_url} />
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "employee_status",
      key: "employee_status",
      render: (status: string) => {
        let color = "default";
        if (status === "Đang làm việc") color = "success";
        if (status === "Chờ duyệt") color = "warning";
        if (status === "Đã nghỉ việc") color = "error";
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: "Vai trò",
      dataIndex: "user_roles",
      key: "roles",
      render: (userRoles: any[]) =>
        userRoles.map((ur) => (
          <Tag color="blue" key={ur.roles.id}>
            {ur.roles.name}
          </Tag>
        )),
    },
    {
      title: "Hành động",
      key: "action",
      render: (_: any, record: any) => {
        const statusItems: MenuProps["items"] = [
          { key: "Đang làm việc", label: "Đang làm việc" },
          { key: "Thử việc", label: "Thử việc" },
          { key: "Thực tập", label: "Thực tập" },
          { key: "Đã nghỉ việc", label: "Đã nghỉ việc", danger: true },
        ];

        if (record.employee_status === "Chờ duyệt") {
          return (
            <Button
              icon={<CheckOutlined />}
              type="primary"
              onClick={() => handleApproveUser(record)}
            >
              Duyệt
            </Button>
          );
        }
        return (
          <Space>
            <Button
              onClick={() => {
                /* Sẽ xây dựng trang chi tiết ở bước sau */ notification.info({
                  message: "Chức năng đang được phát triển",
                });
              }}
            >
              Sửa
            </Button>
            <Button
              icon={<UserSwitchOutlined />}
              onClick={() => handleOpenRolesModal(record)}
            >
              Sửa vai trò
            </Button>
            <Dropdown
              menu={{
                items: statusItems,
                onClick: ({ key }) => handleChangeStatus(record, key),
              }}
            >
              <Button>
                Chuyển trạng thái <DownOutlined />
              </Button>
            </Dropdown>
          </Space>
        );
      },
    },
  ];

  return (
    <Spin spinning={loading}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2}>Quản lý Người dùng</Title>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsInviteModalOpen(true)}
          >
            Mời Người dùng Mới
          </Button>
        </Col>
      </Row>

      <Card style={{ marginBottom: 16 }}>
        <Search
          placeholder="Tìm theo tên, SĐT hoặc email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          allowClear
        />
      </Card>

      {screens.md ? (
        <Table dataSource={users} columns={columns} rowKey="id" />
      ) : (
        <List
          dataSource={users}
          renderItem={(user) => {
            const statusItems: MenuProps["items"] = [
              { key: "Đang làm việc", label: "Đang làm việc" },
              { key: "Đã nghỉ việc", label: "Đã nghỉ việc", danger: true },
            ];
            return (
              <List.Item>
                <Card style={{ width: "100%" }}>
                  <List.Item.Meta
                    avatar={<Avatar src={user.avatar_url} size={48} />}
                    title={<Text strong>{user.full_name}</Text>}
                    description={
                      <>
                        <div>
                          {user.user_roles.map((ur: any) => (
                            <Tag color="blue" key={ur.roles.id}>
                              {ur.roles.name}
                            </Tag>
                          ))}
                        </div>
                        <div>
                          {(() => {
                            let color = "default";
                            if (user.employee_status === "Đang làm việc")
                              color = "success";
                            if (user.employee_status === "Chờ duyệt")
                              color = "warning";
                            if (user.employee_status === "Đã nghỉ việc")
                              color = "error";
                            return (
                              <Tag color={color}>{user.employee_status}</Tag>
                            );
                          })()}
                        </div>
                      </>
                    }
                  />
                  <Space
                    wrap
                    style={{
                      marginTop: 16,
                      width: "100%",
                      justifyContent: "flex-end",
                    }}
                  >
                    {user.employee_status === "Chờ duyệt" ? (
                      <Button
                        icon={<CheckOutlined />}
                        type="primary"
                        onClick={() => handleApproveUser(user)}
                        block
                      >
                        Duyệt
                      </Button>
                    ) : (
                      <>
                        <Button
                          icon={<UserSwitchOutlined />}
                          onClick={() => handleOpenRolesModal(user)}
                          size="small"
                        >
                          Sửa vai trò
                        </Button>
                        <Dropdown
                          menu={{
                            items: statusItems,
                            onClick: ({ key }) => handleChangeStatus(user, key),
                          }}
                        >
                          <Button size="small">
                            Trạng thái <DownOutlined />
                          </Button>
                        </Dropdown>
                      </>
                    )}
                  </Space>
                </Card>
              </List.Item>
            );
          }}
        />
      )}

      <Modal
        title="Mời Người dùng Mới"
        open={isInviteModalOpen}
        onCancel={() => setIsInviteModalOpen(false)}
        onOk={() => inviteForm.submit()}
      >
        <Form
          form={inviteForm}
          layout="vertical"
          onFinish={handleInviteUser}
          style={{ paddingTop: 24 }}
        >
          <Form.Item
            name="full_name"
            label="Họ và Tên"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, type: "email" }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`Phân quyền cho: ${selectedUser?.full_name}`}
        open={isRolesModalOpen}
        onCancel={() => setIsRolesModalOpen(false)}
        onOk={() => rolesForm.submit()}
      >
        <Form
          form={rolesForm}
          onFinish={handleUpdateRoles}
          style={{ paddingTop: 24 }}
        >
          <Form.Item name="roleIds">
            <Checkbox.Group style={{ width: "100%" }}>
              <Row>
                {roles.map((role) => (
                  <Col span={24} key={role.id}>
                    <Checkbox value={role.id}>{role.name}</Checkbox>
                  </Col>
                ))}
              </Row>
            </Checkbox.Group>
          </Form.Item>
        </Form>
      </Modal>
    </Spin>
  );
};

const UserManagement: React.FC = () => (
  <AntApp>
    <UserManagementContent />
  </AntApp>
);
export default UserManagement;
