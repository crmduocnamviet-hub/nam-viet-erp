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
import type { Breakpoint } from "antd";
import dayjs from "dayjs";
import {
  UserOutlined,
  PlusOutlined,
  SearchOutlined,
  PhoneOutlined,
  HeartOutlined,
  MedicineBoxOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import {
  getPatients,
  createPatient,
  updatePatient,
  deletePatient,
  getPatientPointsHistory,
} from "@nam-viet-erp/services";

const { Title, Text } = Typography;
const { Search } = Input;

const PatientsPage: React.FC = () => {
  const { notification, modal } = AntApp.useApp();
  const [patients, setPatients] = useState<IPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<IPatient | null>(null);
  const [stats, setStats] = useState({ total: 0, totalPoints: 0 });
  const [transactionHistory, setTransactionHistory] = useState<
    Record<string, any[]>
  >({});
  const [deletingPatientId, setDeletingPatientId] = useState<string | null>(
    null,
  );
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  useEffect(() => {
    loadPatients();
    loadStats();
  }, [searchTerm]);

  useEffect(() => {
    if (patients.length > 0) {
      loadTransactionHistory();
    }
  }, [patients]);

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
      const { data: allPatients } = await getPatients({ limit: 1000 });

      const total = allPatients?.length || 0;
      const totalPoints =
        allPatients?.reduce((sum, p) => sum + (p.loyalty_points || 0), 0) || 0;

      setStats({ total, totalPoints });
    } catch (error) {
      // Stats are optional
    }
  };

  const loadTransactionHistory = async () => {
    try {
      const historyData: Record<string, any[]> = {};

      // Load transaction history for each patient
      for (const patient of patients) {
        const { data: pointsHistory } = await getPatientPointsHistory(
          patient.patient_id,
          { limit: 5 },
        );
        historyData[patient.patient_id] = pointsHistory || [];
      }

      setTransactionHistory(historyData);
    } catch (error) {
      // Transaction history is optional, don't show error
      console.log("Could not load transaction history:", error);
    }
  };

  const handleCreatePatient = async (values: any) => {
    try {
      const patientData: Omit<IPatient, "patient_id" | "created_at"> = {
        full_name: values.full_name,
        phone_number: values.phone_number,
        date_of_birth: values.date_of_birth?.format("YYYY-MM-DD") || null,
        gender: values.gender || null,
        loyalty_points: 0,
        allergy_notes: values.allergy_notes || null,
        chronic_diseases: values.chronic_diseases || null,
        address: values.address || null,
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

  const handleEditPatient = async (patient: IPatient) => {
    setSelectedPatient(patient);
    editForm.setFieldsValue({
      full_name: patient.full_name,
      phone_number: patient.phone_number,
      date_of_birth: patient.date_of_birth
        ? dayjs(patient.date_of_birth)
        : null,
      gender: patient.gender,
      address: Array.isArray(patient.address)
        ? patient.address[0]
        : patient.address,
      allergy_notes: patient.allergy_notes,
      chronic_diseases: patient.chronic_diseases,
      // loyalty_points không nên được chỉnh sửa trực tiếp
    });
    setIsEditModalOpen(true);
  };

  const handleUpdatePatient = async (values: any) => {
    if (!selectedPatient) return;

    try {
      const updateData: any = {
        full_name: values.full_name,
        phone_number: values.phone_number,
        date_of_birth: values.date_of_birth
          ? values.date_of_birth.format("YYYY-MM-DD")
          : null,
        gender: values.gender,
        allergy_notes: values.allergy_notes,
        chronic_diseases: values.chronic_diseases,
        // loyalty_points không nên được thay đổi trực tiếp
        // Điểm tích lũy nên được quản lý thông qua patient_points_history
      };

      if (values.address && values.address.trim()) {
        updateData.address = values.address.trim();
      }

      const { error } = await updatePatient(
        selectedPatient.patient_id,
        updateData,
      );
      if (error) throw error;

      notification.success({
        message: "Cập nhật thành công",
        description: "Thông tin bệnh nhân đã được cập nhật",
      });

      setIsEditModalOpen(false);
      setSelectedPatient(null);
      editForm.resetFields();
      loadPatients();
      loadStats();
      loadTransactionHistory();
    } catch (error: any) {
      notification.error({
        message: "Lỗi cập nhật",
        description: error.message || "Không thể cập nhật thông tin bệnh nhân",
      });
    }
  };

  const handleDeletePatient = async (patientId: string) => {
    const patient = patients.find((p) => p.patient_id === patientId);
    if (!patient) return;

    modal.confirm({
      title: "Xác nhận xóa",
      content: `Bạn có chắc chắn muốn xóa bệnh nhân "${patient.full_name}"?`,
      okText: "Xóa",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          setDeletingPatientId(patientId);
          console.log("🗑️ Attempting to delete patient:", patientId);

          const { error } = await deletePatient(patientId);

          if (error) {
            console.error("❌ Delete error:", error);
            throw error;
          }

          console.log("✅ Delete successful");

          notification.success({
            message: "Xóa thành công",
            description: "Bệnh nhân đã được xóa khỏi hệ thống",
          });

          loadPatients();
          loadStats();
          loadTransactionHistory();
        } catch (error: any) {
          console.error("❌ Delete failed:", error);

          let errorMessage = "Không thể xóa bệnh nhân";

          if (error.message) {
            if (error.message.includes("foreign key")) {
              errorMessage =
                "Không thể xóa bệnh nhân vì đã có giao dịch liên quan";
            } else if (error.message.includes("permission")) {
              errorMessage = "Bạn không có quyền xóa bệnh nhân";
            } else {
              errorMessage = error.message;
            }
          }

          notification.error({
            message: "Lỗi xóa",
            description: errorMessage,
          });
        } finally {
          setDeletingPatientId(null);
        }
      },
    });
  };

  const handleViewTransactionHistory = (patient: IPatient) => {
    setSelectedPatient(patient);
    setIsTransactionModalOpen(true);
  };

  const columns = [
    {
      title: "Tên bệnh nhân",
      dataIndex: "full_name",
      key: "full_name",
      render: (text: string) => (
        <Space>
          <UserOutlined />
          <Text strong>{text}</Text>
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
      title: "Giới tính",
      dataIndex: "gender",
      key: "gender",
      render: (gender: string) => <Text>{gender || "Chưa có"}</Text>,
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
      title: "Địa chỉ",
      dataIndex: "address",
      key: "address",
      responsive: ["lg", "xl"] as Breakpoint[],
      render: (address: string | string[]) => {
        const displayAddress = Array.isArray(address)
          ? address.join(", ")
          : address;
        return (
          <Text type="secondary">
            {displayAddress
              ? displayAddress.length > 30
                ? `${displayAddress.substring(0, 30)}...`
                : displayAddress
              : "Chưa cập nhật"}
          </Text>
        );
      },
    },
    {
      title: "Dị ứng",
      dataIndex: "allergy_notes",
      key: "allergy_notes",
      responsive: ["md", "lg", "xl"] as Breakpoint[],
      render: (allergy: string) => (
        <Text type="secondary">
          {allergy
            ? allergy.length > 20
              ? `${allergy.substring(0, 20)}...`
              : allergy
            : "Không có"}
        </Text>
      ),
    },
    {
      title: "Bệnh mãn tính",
      dataIndex: "chronic_diseases",
      key: "chronic_diseases",
      responsive: ["md", "lg", "xl"] as Breakpoint[],
      render: (diseases: string) => (
        <Text type="secondary">
          {diseases
            ? diseases.length > 20
              ? `${diseases.substring(0, 20)}...`
              : diseases
            : "Không có"}
        </Text>
      ),
    },
    {
      title: "Lịch sử giao dịch",
      key: "transaction_history",
      responsive: ["sm", "md", "lg", "xl"] as Breakpoint[],
      width: 120,
      render: (record: IPatient) => {
        const history = transactionHistory[record.patient_id] || [];
        const recentCount = history.length;

        return (
          <div>
            {recentCount > 0 ? (
              <Space direction="vertical" size={0}>
                <Text type="secondary" style={{ fontSize: "12px" }}>
                  {recentCount} giao dịch
                </Text>
                <Button
                  type="link"
                  size="small"
                  onClick={() => handleViewTransactionHistory(record)}
                  style={{ padding: 0, height: "auto" }}
                >
                  Xem chi tiết
                </Button>
              </Space>
            ) : (
              <Text type="secondary">Chưa có giao dịch</Text>
            )}
          </div>
        );
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 120,
      render: (record: IPatient) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEditPatient(record)}
            title="Chỉnh sửa"
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            loading={deletingPatientId === record.patient_id}
            onClick={() => handleDeletePatient(record.patient_id)}
            title="Xóa"
          />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Row style={{ marginBottom: 24 }} gutter={[16, 16]} align="middle">
        <Col xs={24} sm={24} md={12} lg={12} xl={12}>
          <Title level={2} style={{ margin: 0 }}>
            <UserOutlined style={{ marginRight: 8 }} />
            Quản lý Bệnh nhân
          </Title>
        </Col>
        <Col
          xs={24}
          sm={24}
          md={12}
          lg={12}
          xl={12}
          style={{ textAlign: "center" }}
        >
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsCreateModalOpen(true)}
            style={{ width: "100%", maxWidth: "200px" }}
          >
            Thêm bệnh nhân mới
          </Button>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={12} lg={8} xl={8}>
          <Card>
            <Statistic
              title="Tổng số bệnh nhân"
              value={stats.total}
              prefix={<UserOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={12} lg={8} xl={8}>
          <Card>
            <Statistic
              title="Tổng điểm tích lũy"
              value={stats.totalPoints}
              prefix={<HeartOutlined />}
              valueStyle={{ color: "#ff4d4f" }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={24} md={12} lg={8} xl={6}>
            <Search
              placeholder="Tìm bệnh nhân theo tên hoặc số điện thoại..."
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              style={{ width: "100%" }}
              onSearch={setSearchTerm}
            />
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={patients}
          rowKey="patient_id"
          loading={loading}
          scroll={{ x: 800 }}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} bệnh nhân`,
            responsive: true,
            showQuickJumper: true,
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
        width="90%"
        style={{ maxWidth: 600 }}
      >
        <Form form={form} layout="vertical" onFinish={handleCreatePatient}>
          <Row gutter={16}>
            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
              <Form.Item
                name="full_name"
                label="Họ và tên"
                rules={[{ required: true, message: "Vui lòng nhập họ và tên" }]}
              >
                <Input placeholder="Nhập họ và tên" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
              <Form.Item
                name="phone_number"
                label="Số điện thoại"
                rules={[
                  { required: true, message: "Vui lòng nhập số điện thoại" },
                  { pattern: /^[0-9]+$/, message: "Chỉ được nhập số" },
                ]}
              >
                <Input
                  placeholder="Nhập số điện thoại"
                  onKeyPress={(e) => {
                    if (!/[0-9]/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
              <Form.Item name="date_of_birth" label="Ngày sinh">
                <DatePicker
                  style={{ width: "100%" }}
                  placeholder="Chọn ngày sinh"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
              <Form.Item name="gender" label="Giới tính">
                <Select placeholder="Chọn giới tính">
                  <Select.Option value="Nam">Nam</Select.Option>
                  <Select.Option value="Nữ">Nữ</Select.Option>
                  <Select.Option value="Khác">Khác</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="address" label="Địa chỉ">
            <Input.TextArea rows={2} placeholder="Nhập địa chỉ..." />
          </Form.Item>

          <Form.Item name="allergy_notes" label="Dị ứng đã biết">
            <Input.TextArea
              rows={2}
              placeholder="Ghi chú về tình trạng dị ứng..."
            />
          </Form.Item>

          <Form.Item name="chronic_diseases" label="Bệnh mãn tính">
            <Input.TextArea
              rows={2}
              placeholder="Ghi chú về bệnh mãn tính..."
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Chỉnh sửa */}
      <Modal
        title="Chỉnh sửa bệnh nhân"
        open={isEditModalOpen}
        onCancel={() => {
          setIsEditModalOpen(false);
          setSelectedPatient(null);
          editForm.resetFields();
        }}
        onOk={editForm.submit}
        width="90%"
        style={{ maxWidth: 600 }}
      >
        <Form form={editForm} layout="vertical" onFinish={handleUpdatePatient}>
          <Row gutter={16}>
            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
              <Form.Item
                name="full_name"
                label="Họ và tên"
                rules={[{ required: true, message: "Vui lòng nhập họ và tên" }]}
              >
                <Input placeholder="Nhập họ và tên" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
              <Form.Item
                name="phone_number"
                label="Số điện thoại"
                rules={[
                  { required: true, message: "Vui lòng nhập số điện thoại" },
                  { pattern: /^[0-9]+$/, message: "Chỉ được nhập số" },
                ]}
              >
                <Input
                  placeholder="Nhập số điện thoại"
                  onKeyPress={(e) => {
                    if (!/[0-9]/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
              <Form.Item name="date_of_birth" label="Ngày sinh">
                <DatePicker
                  style={{ width: "100%" }}
                  placeholder="Chọn ngày sinh"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
              <Form.Item name="gender" label="Giới tính">
                <Select placeholder="Chọn giới tính">
                  <Select.Option value="Nam">Nam</Select.Option>
                  <Select.Option value="Nữ">Nữ</Select.Option>
                  <Select.Option value="Khác">Khác</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="address" label="Địa chỉ">
            <Input.TextArea rows={2} placeholder="Nhập địa chỉ..." />
          </Form.Item>

          <Form.Item name="allergy_notes" label="Dị ứng đã biết">
            <Input.TextArea
              rows={2}
              placeholder="Ghi chú về tình trạng dị ứng..."
            />
          </Form.Item>

          <Form.Item name="chronic_diseases" label="Bệnh mãn tính">
            <Input.TextArea
              rows={2}
              placeholder="Ghi chú về bệnh mãn tính..."
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Lịch sử giao dịch */}
      <Modal
        title={`Lịch sử giao dịch - ${selectedPatient?.full_name}`}
        open={isTransactionModalOpen}
        onCancel={() => {
          setIsTransactionModalOpen(false);
          setSelectedPatient(null);
        }}
        footer={[
          <Button
            key="close"
            onClick={() => {
              setIsTransactionModalOpen(false);
              setSelectedPatient(null);
            }}
          >
            Đóng
          </Button>,
        ]}
        width="95%"
        style={{ maxWidth: 800 }}
      >
        {selectedPatient && (
          <div>
            <Table
              dataSource={transactionHistory[selectedPatient.patient_id] || []}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              columns={[
                {
                  title: "Loại giao dịch",
                  dataIndex: "transaction_type",
                  key: "transaction_type",
                  render: (type: string) => {
                    const typeMap: Record<
                      string,
                      { text: string; color: string }
                    > = {
                      earn: { text: "Tích điểm", color: "green" },
                      redeem: { text: "Sử dụng điểm", color: "red" },
                      adjustment: { text: "Điều chỉnh", color: "blue" },
                      expire: { text: "Hết hạn", color: "orange" },
                      refund: { text: "Hoàn điểm", color: "purple" },
                    };
                    const typeInfo = typeMap[type] || {
                      text: type,
                      color: "default",
                    };
                    return <Tag color={typeInfo.color}>{typeInfo.text}</Tag>;
                  },
                },
                {
                  title: "Số điểm",
                  dataIndex: "points_amount",
                  key: "points_amount",
                  render: (amount: number, record: any) => {
                    // points_amount đã có dấu + hoặc - sẵn trong database
                    const isPositive = amount > 0;
                    return (
                      <Text
                        style={{ color: isPositive ? "#52c41a" : "#ff4d4f" }}
                      >
                        {amount > 0 ? "+" : ""}
                        {amount} điểm
                      </Text>
                    );
                  },
                },
                {
                  title: "Số dư trước",
                  dataIndex: "balance_before",
                  key: "balance_before",
                  render: (balance: number) => `${balance} điểm`,
                },
                {
                  title: "Số dư sau",
                  dataIndex: "balance_after",
                  key: "balance_after",
                  render: (balance: number) => `${balance} điểm`,
                },
                {
                  title: "Mô tả",
                  dataIndex: "description",
                  key: "description",
                  render: (desc: string) => desc || "-",
                },
                {
                  title: "Ngày tạo",
                  dataIndex: "created_at",
                  key: "created_at",
                  render: (date: string) =>
                    new Date(date).toLocaleString("vi-VN"),
                },
              ]}
            />
          </div>
        )}
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
