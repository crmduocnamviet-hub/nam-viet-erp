import React, { useState } from "react";
import {
  Table,
  Button,
  Space,
  Tag,
  Typography,
  Card,
  Input,
  Modal,
  Form,
  Row,
  Col,
  Statistic,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import PageLayout from "../../components/PageLayout";

const { Title, Text } = Typography;

const SuppliersPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  const [form] = Form.useForm();

  // Mock data - will be replaced with real API calls
  const mockData: any[] = [];

  const columns = [
    {
      title: "Tên Nhà Cung Cấp",
      dataIndex: "name",
      key: "name",
      width: 200,
      render: (text: string, record: any) => (
        <Space direction="vertical" size="small">
          <Text strong>{text}</Text>
          {record.tax_code && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              MST: {record.tax_code}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: "Liên Hệ",
      key: "contact",
      width: 200,
      render: (_: any, record: any) => (
        <Space direction="vertical" size="small">
          {record.contact_person && (
            <Space size="small">
              <Text type="secondary">👤</Text>
              <Text>{record.contact_person}</Text>
            </Space>
          )}
          {record.phone && (
            <Space size="small">
              <PhoneOutlined style={{ color: "#1890ff" }} />
              <Text>{record.phone}</Text>
            </Space>
          )}
          {record.email && (
            <Space size="small">
              <MailOutlined style={{ color: "#1890ff" }} />
              <Text>{record.email}</Text>
            </Space>
          )}
        </Space>
      ),
    },
    {
      title: "Địa Chỉ",
      dataIndex: "address",
      key: "address",
      width: 250,
      render: (address: string) =>
        address ? (
          <Space size="small">
            <EnvironmentOutlined style={{ color: "#52c41a" }} />
            <Text>{address}</Text>
          </Space>
        ) : (
          <Text type="secondary">Chưa cập nhật</Text>
        ),
    },
    {
      title: "Điều Khoản Thanh Toán",
      dataIndex: "payment_terms",
      key: "payment_terms",
      width: 150,
      render: (terms: string) => terms || "Chưa xác định",
    },
    {
      title: "Số Đơn Hàng",
      dataIndex: "total_orders",
      key: "total_orders",
      align: "center" as const,
      width: 120,
      render: (count: number) => <Tag color="blue">{count || 0}</Tag>,
    },
    {
      title: "Trạng Thái",
      dataIndex: "is_active",
      key: "is_active",
      width: 120,
      render: (active: boolean) =>
        active ? (
          <Tag color="success">Hoạt động</Tag>
        ) : (
          <Tag color="error">Ngưng HĐ</Tag>
        ),
    },
    {
      title: "Hành Động",
      key: "actions",
      width: 120,
      fixed: "right" as const,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Sửa
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          >
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  const handleCreate = () => {
    setEditingSupplier(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (supplier: any) => {
    setEditingSupplier(supplier);
    form.setFieldsValue(supplier);
    setModalVisible(true);
  };

  const handleDelete = (supplier: any) => {
    Modal.confirm({
      title: "Xác nhận xóa",
      content: `Bạn có chắc chắn muốn xóa nhà cung cấp "${supplier.name}"?`,
      onOk: async () => {
        console.log("Deleting supplier:", supplier.id);
        // Will implement delete logic
      },
    });
  };

  const handleSubmit = async (values: any) => {
    console.log("Submitting supplier:", values);
    // Will implement create/update logic
    setModalVisible(false);
    form.resetFields();
  };

  return (
    <PageLayout
      title="Nhà Cung Cấp"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          Thêm Nhà Cung Cấp
        </Button>
      }
    >
      {/* Statistics */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Tổng Nhà Cung Cấp" value={0} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Hoạt Động"
              value={0}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Tổng Đơn Hàng" value={0} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Giá Trị Mua Hàng"
              value={0}
              suffix="₫"
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Search */}
      <Card style={{ marginBottom: 16 }}>
        <Input
          placeholder="Tìm kiếm theo tên, MST, điện thoại..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 400 }}
        />
      </Card>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={mockData}
          loading={loading}
          rowKey="id"
          scroll={{ x: 1400 }}
          pagination={{
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} nhà cung cấp`,
          }}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={editingSupplier ? "Sửa Nhà Cung Cấp" : "Thêm Nhà Cung Cấp"}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Tên Nhà Cung Cấp"
                rules={[{ required: true, message: "Vui lòng nhập tên" }]}
              >
                <Input placeholder="Công ty ABC" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="tax_code" label="Mã Số Thuế">
                <Input placeholder="0123456789" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="contact_person" label="Người Liên Hệ">
                <Input placeholder="Nguyễn Văn A" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="Số Điện Thoại"
                rules={[
                  {
                    pattern: /^[0-9]{10,11}$/,
                    message: "Số điện thoại không hợp lệ",
                  },
                ]}
              >
                <Input placeholder="0901234567" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="email" label="Email">
            <Input type="email" placeholder="contact@example.com" />
          </Form.Item>

          <Form.Item name="address" label="Địa Chỉ">
            <Input.TextArea
              rows={3}
              placeholder="Số nhà, đường, phường, quận, thành phố"
            />
          </Form.Item>

          <Form.Item name="payment_terms" label="Điều Khoản Thanh Toán">
            <Input placeholder="VD: Thanh toán trong 30 ngày" />
          </Form.Item>

          <Form.Item>
            <Space style={{ width: "100%", justifyContent: "flex-end" }}>
              <Button onClick={() => setModalVisible(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit">
                {editingSupplier ? "Cập Nhật" : "Tạo Mới"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </PageLayout>
  );
};

export default SuppliersPage;
