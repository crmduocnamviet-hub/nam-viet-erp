import React, { useState, useEffect, useCallback } from "react";
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
  notification,
  Select,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  DeleteOutlined,
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import PageLayout from "../../components/PageLayout";
import {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deactivateSupplier,
} from "@nam-viet-erp/services";
import { useDebounce } from "../../hooks/useDebounce";

const { Text } = Typography;

type StatusFilter = "all" | "active" | "inactive";

const SuppliersPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [form] = Form.useForm();

  const debouncedSearchText = useDebounce(searchText, 300);

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
      width: 80,
      align: "center" as const,
      fixed: "right" as const,
      render: (_: any, record: any) => (
        <Tooltip title="Xóa">
          <Button
            type="text"
            size="large"
            danger
            icon={<DeleteOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(record);
            }}
          />
        </Tooltip>
      ),
    },
  ];

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await getSuppliers({
        status: statusFilter,
        searchText: debouncedSearchText,
      });
      if (error) throw error;
      setSuppliers(data || []);
    } catch (error: any) {
      notification.error({
        message: "Lỗi",
        description: error.message || "Không thể tải danh sách nhà cung cấp",
      });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, debouncedSearchText]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

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
      content: `Bạn có chắc chắn muốn ngưng hoạt động nhà cung cấp \"${supplier.name}\"?`,
      onOk: async () => {
        try {
          const { error } = await deactivateSupplier(supplier.id);
          if (error) throw error;
          notification.success({
            message: "Thành công",
            description: "Đã ngưng hoạt động nhà cung cấp",
          });
          fetchSuppliers();
        } catch (error: any) {
          notification.error({
            message: "Lỗi",
            description: error.message || "Không thể xóa nhà cung cấp",
          });
        }
      },
    });
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      if (editingSupplier) {
        const { error } = await updateSupplier(editingSupplier.id, values);
        if (error) throw error;
        notification.success({
          message: "Thành công",
          description: "Đã cập nhật thông tin nhà cung cấp",
        });
      } else {
        const { error } = await createSupplier({
          ...values,
          is_active: true,
        });
        if (error) throw error;
        notification.success({
          message: "Thành công",
          description: "Đã thêm nhà cung cấp mới",
        });
      }

      setModalVisible(false);
      form.resetFields();
      fetchSuppliers();
    } catch (error: any) {
      notification.error({
        message: "Lỗi",
        description: error.message || "Không thể lưu thông tin nhà cung cấp",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout
      title="Nhà Cung Cấp"
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreate}
          size="large"
        >
          Thêm Nhà Cung Cấp
        </Button>
      }
    >
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Tổng Nhà Cung Cấp" value={suppliers.length} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Hoạt Động"
              value={suppliers.filter((s) => s.is_active).length}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng Đơn Hàng"
              value={suppliers.reduce(
                (sum, s) => sum + (s.total_orders || 0),
                0,
              )}
            />
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

      <Card style={{ marginBottom: 16 }}>
        <Space size="middle" wrap>
          <Input
            placeholder="Tìm kiếm theo tên, MST, điện thoại..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
            allowClear
            size="large"
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 200 }}
            suffixIcon={<FilterOutlined />}
            options={[
              { label: "Tất cả trạng thái", value: "all" },
              { label: "Đang hoạt động", value: "active" },
              { label: "Ngưng hoạt động", value: "inactive" },
            ]}
            size="large"
          />
        </Space>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={suppliers}
          loading={loading}
          rowKey="id"
          onRow={(record) => ({
            onClick: () => handleEdit(record),
            style: { cursor: "pointer" },
          })}
          scroll={{ x: 1400 }}
          pagination={{
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} nhà cung cấp`,
          }}
        />
      </Card>

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
                <Input placeholder="Công ty ABC" size="large" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="tax_code" label="Mã Số Thuế">
                <Input placeholder="0123456789" size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="contact_person" label="Người Liên Hệ">
                <Input placeholder="Nguyễn Văn A" size="large" />
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
                <Input placeholder="0901234567" size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="email" label="Email">
            <Input
              type="email"
              placeholder="contact@example.com"
              size="large"
            />
          </Form.Item>

          <Form.Item name="address" label="Địa Chỉ">
            <Input.TextArea
              rows={3}
              placeholder="Số nhà, đường, phường, quận, thành phố"
              size="large"
            />
          </Form.Item>

          <Form.Item name="payment_terms" label="Điều Khoản Thanh Toán">
            <Input placeholder="VD: Thanh toán trong 30 ngày" size="large" />
          </Form.Item>

          <Form.Item>
            <Space style={{ width: "100%", justifyContent: "flex-end" }}>
              <Button onClick={() => setModalVisible(false)} size="large">
                Hủy
              </Button>
              <Button type="primary" htmlType="submit" size="large">
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
