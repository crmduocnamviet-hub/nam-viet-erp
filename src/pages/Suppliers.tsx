// src/pages/Suppliers.tsx

import React, { useState, useEffect } from "react";
import {
  Button,
  Table,
  Space,
  Row,
  Col,
  Typography,
  App as AntApp,
  Modal,
  Form,
  Input,
  Grid,
  List,
  Card,
  type TableProps,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { supabase } from "../lib/supabaseClient";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const SuppliersContent: React.FC = () => {
  const { notification, modal } = AntApp.useApp();
  const screens = useBreakpoint();
  const [form] = Form.useForm();

  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setSuppliers(data || []);
    } catch (error: any) {
      notification.error({
        message: "Lỗi tải dữ liệu",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingSupplier(null);
    form.resetFields();
  };

  const handleAdd = () => {
    setEditingSupplier(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (record: any) => {
    setEditingSupplier(record);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number, name: string) => {
    modal.confirm({
      title: "Bạn chắc chắn muốn xóa nhà cung cấp này?",
      content: `"${name}" sẽ bị xóa vĩnh viễn.`,
      okText: "Xóa",
      okType: "danger",
      onOk: async () => {
        const { error } = await supabase
          .from("suppliers")
          .delete()
          .eq("id", id);
        if (error) {
          notification.error({
            message: "Lỗi khi xóa",
            description: error.message,
          });
        } else {
          notification.success({ message: "Đã xóa thành công!" });
          fetchData();
        }
      },
    });
  };

  const handleFinish = async (values: any) => {
    try {
      const record = { ...values };
      let error;
      if (editingSupplier) {
        ({ error } = await supabase
          .from("suppliers")
          .update(record)
          .eq("id", editingSupplier.id));
      } else {
        ({ error } = await supabase.from("suppliers").insert([record]));
      }
      if (error) throw error;
      notification.success({
        message: `Đã ${editingSupplier ? "cập nhật" : "tạo"} thành công!`,
      });
      fetchData();
      handleCancel();
    } catch (error: any) {
      notification.error({
        message: "Thao tác thất bại",
        description: error.message,
      });
    }
  };

  const columns: TableProps<any>["columns"] = [
    { title: "Tên Nhà Cung Cấp", dataIndex: "name", key: "name", width: "30%" },
    {
      title: "Người liên hệ",
      dataIndex: "contact_person",
      key: "contact_person",
    },
    { title: "Số điện thoại", dataIndex: "phone", key: "phone" },
    { title: "Email", dataIndex: "email", key: "email" },
    {
      title: "Hành động",
      key: "action",
      render: (_: any, record: any) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Button
            icon={<DeleteOutlined />}
            danger
            onClick={() => handleDelete(record.id, record.name)}
          />
        </Space>
      ),
    },
  ];

  return (
    <>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2}>Quản lý Nhà Cung Cấp</Title>
        </Col>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Thêm NCC
          </Button>
        </Col>
      </Row>

      {screens.md ? (
        <Table
          columns={columns}
          dataSource={suppliers}
          loading={loading}
          rowKey="id"
        />
      ) : (
        <List
          loading={loading}
          dataSource={suppliers}
          renderItem={(item) => (
            <List.Item>
              <Card
                style={{ width: "100%" }}
                actions={[
                  <EditOutlined key="edit" onClick={() => handleEdit(item)} />,
                  <DeleteOutlined
                    key="delete"
                    onClick={() => handleDelete(item.id, item.name)}
                  />,
                ]}
              >
                <Card.Meta
                  title={item.name}
                  description={
                    <>
                      <Text>Người liên hệ: {item.contact_person || "N/A"}</Text>
                      <br />
                      <Text>SĐT: {item.phone || "N/A"}</Text>
                      <br />
                      <Text>Email: {item.email || "N/A"}</Text>
                    </>
                  }
                />
              </Card>
            </List.Item>
          )}
        />
      )}

      <Modal
        title={editingSupplier ? "Cập nhật NCC" : "Thêm mới NCC"}
        open={isModalOpen}
        onCancel={handleCancel}
        onOk={() => form.submit()}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          style={{ paddingTop: 24 }}
        >
          <Form.Item
            name="name"
            label="Tên Nhà Cung Cấp"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="contact_person" label="Người liên hệ">
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="Số điện thoại">
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email">
            <Input />
          </Form.Item>
          <Form.Item name="address" label="Địa chỉ">
            <Input.TextArea />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

const Suppliers: React.FC = () => (
  <AntApp>
    <SuppliersContent />
  </AntApp>
);

export default Suppliers;
