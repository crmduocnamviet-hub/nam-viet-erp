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
  Select,
  InputNumber,
  Tag,
  Avatar,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import {
  createFund,
  deleteFund,
  getFunds,
  updateFund,
} from "@nam-viet-erp/services";
import { getErrorMessage } from "../types/error";

const { Title } = Typography;

// Component con chứa toàn bộ logic và giao diện
const FundManagementContent: React.FC = () => {
  const { notification, modal } = AntApp.useApp(); // <-- SỬA LỖI 1: Khai báo lại modal
  const [form] = Form.useForm();

  const [funds, setFunds] = useState<any[]>([]);
  const [banks, setBanks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFund, setEditingFund] = useState<any | null>(null);

  // SỬA LỖI 2: Thêm lại hàm fetchData
  const fetchData = async () => {
    setLoading(true);
    try {
      const { funds, banks } = await getFunds();
      setFunds(funds || []);
      setBanks(banks);
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
    setEditingFund(null);
    form.resetFields();
  };

  const handleAdd = () => {
    setEditingFund(null);
    form.resetFields();
    form.setFieldsValue({ type: "cash" });
    setIsModalOpen(true);
  };

  const handleEdit = (record: any) => {
    setEditingFund(record);
    form.setFieldsValue({ ...record, bank_id: record.banks?.id });
    setIsModalOpen(true);
  };

  const handleDelete = (id: number, name: string) => {
    modal.confirm({
      title: "Bạn có chắc chắn muốn xóa?",
      content: `Quỹ/Tài khoản "${name}" sẽ bị xóa. Hành động này có thể ảnh hưởng đến các giao dịch đã ghi nhận.`,
      okText: "Xóa",
      okType: "danger",
      onOk: async () => {
        try {
          const { error } = await deleteFund(id);
          if (error) throw error;
          notification.success({ message: "Đã xóa thành công!" });
          fetchData(); // <-- Giờ đây hàm này đã tồn tại
        } catch (error: any) {
          notification.error({
            message: "Lỗi khi xóa",
            description: error.message,
          });
        }
      },
    });
  };

  const handleFinish = async (values: any) => {
    try {
      const record = {
        name: values.name,
        type: values.type,
        initial_balance: values.initial_balance || 0,
        account_holder_name:
          values.type === "bank" ? values.account_holder_name : null,
        account_number: values.type === "bank" ? values.account_number : null,
        bank_id: values.type === "bank" ? values.bank_id : null,
      };

      let error;
      if (editingFund) {
        ({ error } = await updateFund(editingFund.id, record));
      } else {
        ({ error } = await createFund(record));
      }
      if (error) throw error;
      notification.success({
        message: `Đã ${editingFund ? "cập nhật" : "tạo"} thành công!`,
      });
      fetchData();
      handleCancel();
    } catch (error: unknown) {
      notification.error({
        message: "Thao tác thất bại",
        description: getErrorMessage(error),
      });
    }
  };

  const columns = [
    {
      title: "Tên Quỹ / Tài khoản",
      dataIndex: "name",
      key: "name",
      render: (text: string, record: any) => (
        <Space>
          {record.banks?.logo && <Avatar src={record.banks.logo} />}
          <Typography.Text strong>{text}</Typography.Text>
        </Space>
      ),
    },
    {
      title: "Loại",
      dataIndex: "type",
      key: "type",
      render: (type: string) => (
        <Tag color={type === "cash" ? "gold" : "blue"}>
          {type === "cash" ? "Tiền mặt" : "Ngân hàng"}
        </Tag>
      ),
    },
    {
      title: "Chủ tài khoản",
      dataIndex: "account_holder_name",
      key: "account_holder_name",
    },
    {
      title: "Số tài khoản",
      dataIndex: "account_number",
      key: "account_number",
    },
    {
      title: "Số dư ban đầu",
      dataIndex: "initial_balance",
      key: "initial_balance",
      render: (balance: number) =>
        `${(balance || 0).toLocaleString("vi-VN")} đ`,
    },
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

  const fundType = Form.useWatch("type", form);

  return (
    <>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2}>Cấu hình Quỹ & Tài khoản</Title>
        </Col>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Thêm mới
          </Button>
        </Col>
      </Row>
      <Table
        columns={columns}
        dataSource={funds}
        loading={loading}
        rowKey="id"
      />
      <Modal
        title={
          editingFund ? "Cập nhật Quỹ/Tài khoản" : "Thêm mới Quỹ/Tài khoản"
        }
        open={isModalOpen}
        onCancel={handleCancel}
        onOk={() => form.submit()}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          style={{ paddingTop: 24 }}
          initialValues={{ initial_balance: 0, type: "cash" }}
        >
          <Form.Item name="type" label="Loại" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="cash">Tiền mặt</Select.Option>
              <Select.Option value="bank">Ngân hàng</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="name"
            label="Tên gợi nhớ"
            rules={[{ required: true }]}
          >
            <Input placeholder="Ví dụ: Quỹ tiền mặt công ty, TK Techcombank Hiền..." />
          </Form.Item>
          {fundType === "bank" && (
            <>
              <Form.Item
                name="bank_id"
                label="Ngân hàng"
                rules={[{ required: true }]}
              >
                <Select
                  showSearch
                  placeholder="Chọn ngân hàng"
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    (option?.label ?? "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  options={banks.map((b) => ({
                    value: b.id,
                    label: `${b.label}`,
                  }))}
                />
              </Form.Item>
              <Form.Item
                name="account_holder_name"
                label="Tên chủ tài khoản"
                rules={[{ required: true }]}
              >
                <Input placeholder="Tên in trên thẻ/tài khoản" />
              </Form.Item>
              <Form.Item
                name="account_number"
                label="Số tài khoản"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </>
          )}
          <Form.Item name="initial_balance" label="Số dư ban đầu">
            <InputNumber
              style={{ width: "100%" }}
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
              }
              parser={(value) => Number(value!.replace(/\./g, ""))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

const FundManagement: React.FC = () => (
  <AntApp>
    <FundManagementContent />
  </AntApp>
);

export default FundManagement;
