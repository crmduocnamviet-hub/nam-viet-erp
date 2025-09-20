// src/pages/RolesPermissions.tsx

import React, { useState, useEffect, useMemo } from "react";
import {
  Row,
  Col,
  Typography,
  App as AntApp,
  Card,
  List,
  Button,
  Spin,
  Tree,
  Modal,
  Form,
  Input,
  Divider,
} from "antd";
import { PlusOutlined, SaveOutlined } from "@ant-design/icons";
import { supabase } from "../lib/supabaseClient";

const { Title, Text } = Typography;

const RolesPermissionsContent: React.FC = () => {
  const { notification } = AntApp.useApp();
  const [roleForm] = Form.useForm();

  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedRole, setSelectedRole] = useState<any | null>(null);
  const [checkedPermissions, setCheckedPermissions] = useState<React.Key[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const rolesPromise = supabase.from("roles").select("*").order("name");
        const permissionsPromise = supabase
          .from("permissions")
          .select("*")
          .order("module");

        const [rolesRes, permissionsRes] = await Promise.all([
          rolesPromise,
          permissionsPromise,
        ]);

        if (rolesRes.error) throw rolesRes.error;
        if (permissionsRes.error) throw permissionsRes.error;

        setRoles(rolesRes.data || []);
        setPermissions(permissionsRes.data || []);
      } catch (error: any) {
        notification.error({
          message: "Lỗi tải dữ liệu",
          description: error.message,
        });
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [notification]);

  const permissionTreeData = useMemo(() => {
    const grouped: { [key: string]: any[] } = {};
    permissions.forEach((p) => {
      if (!grouped[p.module]) {
        grouped[p.module] = [];
      }
      grouped[p.module].push({ title: p.description, key: p.id });
    });

    return Object.keys(grouped).map((moduleName) => ({
      title: moduleName,
      key: moduleName,
      children: grouped[moduleName],
    }));
  }, [permissions]);

  const handleSelectRole = async (role: any) => {
    setSelectedRole(role);
    try {
      const { data, error } = await supabase
        .from("role_permissions")
        .select("permission_id")
        .eq("role_id", role.id);
      if (error) throw error;
      setCheckedPermissions(data.map((p) => p.permission_id));
    } catch (error: any) {
      notification.error({
        message: "Lỗi tải quyền của vai trò",
        description: error.message,
      });
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;
    try {
      // Xóa hết quyền cũ
      const { error: deleteError } = await supabase
        .from("role_permissions")
        .delete()
        .eq("role_id", selectedRole.id);
      if (deleteError) throw deleteError;

      // Thêm các quyền mới
      const newPermissions = checkedPermissions
        .filter((key) => typeof key === "number")
        .map((permId) => ({
          role_id: selectedRole.id,
          permission_id: permId,
        }));

      if (newPermissions.length > 0) {
        const { error: insertError } = await supabase
          .from("role_permissions")
          .insert(newPermissions);
        if (insertError) throw insertError;
      }

      notification.success({
        message: `Đã cập nhật quyền cho vai trò "${selectedRole.name}"`,
      });
    } catch (error: any) {
      notification.error({
        message: "Lỗi lưu quyền",
        description: error.message,
      });
    }
  };

  const handleCreateRole = async (values: any) => {
    try {
      const { data, error } = await supabase
        .from("roles")
        .insert({ name: values.name, description: values.description })
        .select()
        .single();
      if (error) throw error;
      setRoles((prev) => [...prev, data]);
      setIsModalOpen(false);
      roleForm.resetFields();
      notification.success({ message: "Tạo vai trò mới thành công!" });
    } catch (error: any) {
      notification.error({
        message: "Lỗi tạo vai trò",
        description: error.message,
      });
    }
  };

  return (
    <Spin spinning={loading}>
      <Title level={2}>Quản lý Vai trò & Quyền hạn</Title>
      <Row gutter={24}>
        <Col xs={24} md={8}>
          <Card title="Danh sách Vai trò">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsModalOpen(true)}
              style={{ marginBottom: 16 }}
            >
              Tạo Vai trò Mới
            </Button>
            <List
              dataSource={roles}
              renderItem={(role) => (
                <List.Item
                  onClick={() => handleSelectRole(role)}
                  style={{
                    cursor: "pointer",
                    background:
                      selectedRole?.id === role.id ? "#e6f7ff" : "transparent",
                  }}
                >
                  <List.Item.Meta
                    title={role.name}
                    description={role.description}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} md={16}>
          <Card
            title={
              selectedRole
                ? `Phân quyền cho: ${selectedRole.name}`
                : "Chọn một vai trò để phân quyền"
            }
          >
            {selectedRole ? (
              <>
                <Tree
                  checkable
                  checkedKeys={checkedPermissions}
                  onCheck={(keys: any) => setCheckedPermissions(keys)}
                  treeData={permissionTreeData}
                  defaultExpandAll
                />
                <Divider />
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={handleSavePermissions}
                >
                  Lưu thay đổi
                </Button>
              </>
            ) : (
              <Text type="secondary">
                Vui lòng chọn một vai trò từ danh sách bên trái.
              </Text>
            )}
          </Card>
        </Col>
      </Row>
      <Modal
        title="Tạo Vai trò Mới"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => roleForm.submit()}
      >
        <Form
          form={roleForm}
          layout="vertical"
          onFinish={handleCreateRole}
          style={{ paddingTop: 24 }}
        >
          <Form.Item
            name="name"
            label="Tên Vai trò"
            rules={[{ required: true }]}
          >
            <Input placeholder="Ví dụ: Kế toán, Dược sĩ..." />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea placeholder="Mô tả ngắn về vai trò này" />
          </Form.Item>
        </Form>
      </Modal>
    </Spin>
  );
};

const RolesPermissions: React.FC = () => (
  <AntApp>
    <RolesPermissionsContent />
  </AntApp>
);

export default RolesPermissions;
