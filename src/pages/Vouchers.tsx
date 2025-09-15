import React, { useState, useEffect } from "react";
import {
  Button,
  Table,
  Space,
  Row,
  Col,
  Typography,
  App,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Switch,
  Tag,
} from "antd";
import { PlusOutlined, EditOutlined } from "@ant-design/icons";
import { supabase } from "../lib/supabaseClient";

const { Title } = Typography;

const Vouchers: React.FC = () => {
  const { notification } = App.useApp();
  const [form] = Form.useForm();
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [promotions, setPromotions] = useState<
    { value: number; label: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<any | null>(null);

  useEffect(() => {
    const fetchVouchers = async () => {
      setLoading(true);
      try {
        // Lấy dữ liệu voucher và "nhờ" Supabase lấy luôn tên của chương trình khuyến mại liên quan
        const { data, error } = await supabase
          .from("vouchers")
          .select("*, promotions(name)")
          .order("created_at", { ascending: false });
        if (error) throw error;
        setVouchers(data || []);
      } catch (error: any) {
        notification.error({
          message: "Lỗi tải mã giảm giá",
          description: error.message,
        });
      } finally {
        setLoading(false);
      }
    };

    const fetchPromotions = async () => {
      const { data, error } = await supabase
        .from("promotions")
        .select("id, name")
        .eq("is_active", true);
      if (error) console.error(error);
      else {
        setPromotions(data.map((p) => ({ value: p.id, label: p.name })));
      }
    };

    fetchVouchers();
    fetchPromotions();
  }, []);

  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingVoucher(null);
    form.resetFields();
  };

  const handleFinish = async (values: any) => {
    try {
      const record = {
        code: values.code,
        promotion_id: values.promotion_id,
        usage_limit: values.usage_limit,
        is_active: values.is_active,
      };

      let error;
      if (editingVoucher) {
        ({ error } = await supabase
          .from("vouchers")
          .update(record)
          .eq("id", editingVoucher.id));
      } else {
        ({ error } = await supabase.from("vouchers").insert([record]));
      }

      if (error) throw error;
      notification.success({
        message: `Đã ${
          editingVoucher ? "cập nhật" : "tạo"
        } mã giảm giá thành công!`,
      });
      handleCancel();
      fetchVouchers();
    } catch (error: any) {
      notification.error({
        message: "Thao tác thất bại",
        description: error.message,
      });
    }
  };

  const columns = [
    { title: "Mã Code", dataIndex: "code", key: "code" },
    {
      title: "Thuộc Chương trình KM",
      dataIndex: "promotions",
      key: "promotion_name",
      render: (promo: any) => promo?.name || "N/A",
    },
    {
      title: "Giới hạn Lượt dùng",
      dataIndex: "usage_limit",
      key: "usage_limit",
    },
    { title: "Đã dùng", dataIndex: "times_used", key: "times_used" },
    {
      title: "Trạng thái",
      key: "is_active",
      render: (isActive: boolean) => (
        <Tag color={isActive ? "green" : "red"}>
          {isActive ? "Hoạt động" : "Vô hiệu"}
        </Tag>
      ),
    },
    {
      title: "Hành động",
      key: "action",
      render: (_: any) => (
        <Space>
          <Button icon={<EditOutlined />} />
        </Space>
      ),
    },
  ];

  return (
    <>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2}>Quản lý Mã Giảm Giá</Title>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsModalOpen(true)}
          >
            Tạo Mã mới
          </Button>
        </Col>
      </Row>
      <Table
        columns={columns}
        dataSource={vouchers}
        loading={loading}
        rowKey="id"
      />

      <Modal
        title={editingVoucher ? "Cập nhật Mã Giảm Giá" : "Tạo Mã Giảm Giá mới"}
        open={isModalOpen}
        onCancel={handleCancel}
        onOk={() => form.submit()}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          style={{ paddingTop: 24 }}
        >
          <Form.Item
            name="promotion_id"
            label="Chọn chương trình khuyến mại"
            rules={[{ required: true }]}
          >
            <Select
              options={promotions}
              placeholder="Liên kết với một chương trình..."
            />
          </Form.Item>
          <Form.Item
            name="code"
            label="Mã Giảm Giá (Voucher Code)"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="usage_limit"
            label="Giới hạn lượt sử dụng"
            initialValue={1}
            rules={[{ required: true }]}
          >
            <InputNumber style={{ width: "100%" }} min={1} />
          </Form.Item>
          <Form.Item
            name="is_active"
            label="Kích hoạt"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default Vouchers;
