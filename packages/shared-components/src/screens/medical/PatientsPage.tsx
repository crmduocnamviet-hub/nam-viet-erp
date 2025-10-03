import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  Input,
  Space,
  Tag,
  Typography,
  App as AntApp,
  Row,
  Col,
  Modal,
  Form,
  DatePicker,
  Select,
  Statistic,
} from "antd";
import {
  UserOutlined,
  PlusOutlined,
  SearchOutlined,
  PhoneOutlined,
  HeartOutlined,
  MedicineBoxOutlined,
} from "@ant-design/icons";
import { getPatients, createPatient, getVIPPatients } from "@nam-viet-erp/services";

const { Title, Text } = Typography;
const { Search } = Input;

const PatientsPage: React.FC = () => {
  const { notification } = AntApp.useApp();
  const [patients, setPatients] = useState<IPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [stats, setStats] = useState({ total: 0, vip: 0, b2b: 0 });
  const [form] = Form.useForm();

  useEffect(() => {
    loadPatients();
    loadStats();
  }, [searchTerm]);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const { data, error } = await getPatients({
        search: searchTerm,
        limit: 50,
      });

      if (error) {
        notification.error({
          message: "Lỗi tải dữ liệu",
          description: error.message,
        });
      } else {
        setPatients(data || []);
      }
    } catch (error) {
      notification.error({
        message: "Lỗi hệ thống",
        description: "Không thể tải danh sách bệnh nhân",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const [allPatients, vipPatients] = await Promise.all([
        getPatients({ limit: 1000 }),
        getVIPPatients(50),
      ]);

      const total = allPatients.data?.length || 0;
      const vip = vipPatients.data?.length || 0;
      const b2b = allPatients.data?.filter((p) => p.is_b2b_customer).length || 0;

      setStats({ total, vip, b2b });
    } catch (error) {
      // Stats are optional
    }
  };

  const handleCreatePatient = async (values: any) => {
    try {
      const patientData: Omit<IPatient, "patient_id" | "created_at"> = {
        full_name: values.full_name,
        phone_number: values.phone_number,
        date_of_birth: values.date_of_birth?.format("YYYY-MM-DD") || null,
        gender: values.gender || null,
        is_b2b_customer: values.is_b2b_customer || false,
        loyalty_points: 0,
        allergy_notes: values.allergy_notes || null,
        chronic_diseases: values.chronic_diseases || null,
      };

      const { error } = await createPatient(patientData);

      if (error) {
        notification.error({
          message: "Lỗi tạo bệnh nhân",
          description: error.message,
        });
      } else {
        notification?.success({
          message: "Tạo bệnh nhân thành công!",
        });
        setIsCreateModalOpen(false);
        form.resetFields();
        loadPatients();
        loadStats();
      }
    } catch (error) {
      notification.error({
        message: "Lỗi hệ thống",
        description: "Không thể tạo bệnh nhân mới",
      });
    }
  };

  const columns = [
    {
      title: "Tên bệnh nhân",
      dataIndex: "full_name",
      key: "full_name",
      render: (text: string, record: IPatient) => (
        <Space>
          <UserOutlined />
          <div>
            <Text strong>{text}</Text>
            {record.is_b2b_customer && (
              <Tag color="blue" style={{ marginLeft: 8 }}>
                Khách B2B
              </Tag>
            )}
          </div>
        </Space>
      ),
    },
    {
      title: "Số điện thoại",
      dataIndex: "phone_number",
      key: "phone_number",
      render: (phone: string) => (
        <Space>
          <PhoneOutlined />
          <Text>{phone || "Chưa có"}</Text>
        </Space>
      ),
    },
    {
      title: "Điểm tích lũy",
      dataIndex: "loyalty_points",
      key: "loyalty_points",
      render: (points: number) => (
        <Space>
          <HeartOutlined style={{ color: "#ff4d4f" }} />
          <Text strong>{points} điểm</Text>
        </Space>
      ),
    },
    {
      title: "Tình trạng sức khỏe",
      key: "health_status",
      render: (record: IPatient) => (
        <Space direction="vertical" size={0}>
          {record.allergy_notes && (
            <Tag color="orange" icon={<MedicineBoxOutlined />}>
              Dị ứng
            </Tag>
          )}
          {record.chronic_diseases && (
            <Tag color="red" icon={<MedicineBoxOutlined />}>
              Bệnh mãn tính
            </Tag>
          )}
          {!record.allergy_notes && !record.chronic_diseases && (
            <Text type="secondary">Không có ghi chú</Text>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Row style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Title level={2} style={{ margin: 0 }}>
            <UserOutlined style={{ marginRight: 8 }} />
            Quản lý Bệnh nhân
          </Title>
        </Col>
        <Col span={12} style={{ textAlign: "right" }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            Thêm bệnh nhân mới
          </Button>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Tổng số bệnh nhân"
              value={stats.total}
              prefix={<UserOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Khách hàng VIP"
              value={stats.vip}
              prefix={<HeartOutlined />}
              valueStyle={{ color: "#ff4d4f" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Khách hàng B2B"
              value={stats.b2b}
              prefix={<UserOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Search
            placeholder="Tìm bệnh nhân theo tên hoặc số điện thoại..."
            allowClear
            enterButton={<SearchOutlined />}
            size="large"
            style={{ width: 400 }}
            onSearch={setSearchTerm}
          />
        </Space>

        <Table
          columns={columns}
          dataSource={patients}
          rowKey="patient_id"
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} bệnh nhân`,
          }}
        />
      </Card>

      <Modal
        title="Thêm bệnh nhân mới"
        open={isCreateModalOpen}
        onCancel={() => {
          setIsCreateModalOpen(false);
          form.resetFields();
        }}
        onOk={form.submit}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleCreatePatient}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="full_name"
                label="Họ và tên"
                rules={[{ required: true, message: "Vui lòng nhập họ và tên" }]}
              >
                <Input placeholder="Nhập họ và tên" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="phone_number"
                label="Số điện thoại"
                rules={[{ required: true, message: "Vui lòng nhập số điện thoại" }]}
              >
                <Input placeholder="Nhập số điện thoại" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="date_of_birth" label="Ngày sinh">
                <DatePicker style={{ width: "100%" }} placeholder="Chọn ngày sinh" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="gender" label="Giới tính">
                <Select placeholder="Chọn giới tính">
                  <Select.Option value="Nam">Nam</Select.Option>
                  <Select.Option value="Nữ">Nữ</Select.Option>
                  <Select.Option value="Khác">Khác</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="allergy_notes" label="Dị ứng đã biết">
            <Input.TextArea rows={2} placeholder="Ghi chú về tình trạng dị ứng..." />
          </Form.Item>

          <Form.Item name="chronic_diseases" label="Bệnh mãn tính">
            <Input.TextArea rows={2} placeholder="Ghi chú về bệnh mãn tính..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

const PatientsPageWrapper: React.FC = () => (
  <AntApp>
    <PatientsPage />
  </AntApp>
);

export default PatientsPageWrapper;