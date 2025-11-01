import React, { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Avatar,
  Typography,
  Tabs,
  List,
  Input,
  Button,
  Spin,
  App,
  Modal,
  Tag,
  Descriptions,
  Form,
  DatePicker,
  Select,
  Breadcrumb,
  Space,
  Divider,
  Grid,
} from "antd";
import { getResponsivePadding } from "../../constants/spacing";
import {
  UserOutlined,
  SaveOutlined,
  CalendarOutlined,
  HistoryOutlined,
  EditOutlined,
  ArrowLeftOutlined,
  HomeOutlined,
} from "@ant-design/icons";
import {
  getProfileById,
  updateProfileNotes,
  getAppointmentsByPatientId,
  getPatientMedicalHistory,
  updatePatient,
} from "@nam-viet-erp/services";
import dayjs from "dayjs";
import { useDebounce } from "@nam-viet-erp/shared-components";
const getErrorMessage = (error: any): string => {
  return error?.message || "Đã xảy ra lỗi không xác định";
};
import { useParams, useNavigate } from "react-router-dom";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { useBreakpoint } = Grid;

const getStatusColor = (status: string) => {
  const colorMap: Record<string, string> = {
    "Chưa xác nhận": "default",
    "Đã xác nhận": "blue",
    "Đã check-in": "green",
    "Đang khám": "gold",
    "Đã hoàn tất/Chờ thanh toán": "purple",
    "Hủy/Không đến": "red",
  };
  return colorMap[status] || "default";
};

const PatientDetailPage: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { notification } = App.useApp();
  const screens = useBreakpoint();
  const [form] = Form.useForm();

  const [profile, setProfile] = useState<any | null>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [serviceHistory, setServiceHistory] = useState<any[]>([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const debouncedNotes = useDebounce(notes, 500);

  useEffect(() => {
    if (patientId) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const [profileRes, appointmentsRes, serviceHistoryRes] =
            await Promise.all([
              getProfileById(patientId),
              getAppointmentsByPatientId(patientId),
              getPatientMedicalHistory(patientId),
            ]);

          if (profileRes.error) throw profileRes.error;
          if (appointmentsRes.error) throw appointmentsRes.error;
          if (serviceHistoryRes.error) throw serviceHistoryRes.error;

          setProfile(profileRes.data);
          setAppointments(appointmentsRes.data || []);
          setServiceHistory(serviceHistoryRes.data || []);
          setNotes(profileRes.data?.receptionist_notes || "");

          // Populate form with patient data
          form.setFieldsValue({
            full_name: profileRes.data?.full_name || "",
            phone_number: profileRes.data?.phone_number || "",
            date_of_birth: profileRes.data?.date_of_birth
              ? dayjs(profileRes.data.date_of_birth)
              : null,
            gender: profileRes.data?.gender || "",
            address: profileRes.data?.address || "",
            allergy_notes: profileRes.data?.allergy_notes || "",
            chronic_diseases: profileRes.data?.chronic_diseases || "",
            is_b2b_customer: profileRes.data?.is_b2b_customer || false,
          });
        } catch (error: unknown) {
          notification.error({
            message: "Lỗi tải dữ liệu bệnh nhân",
            description: getErrorMessage(error),
          });
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [patientId, notification, form]);

  const handleSaveNotes = async () => {
    if (!patientId) return;
    setIsSaving(true);
    try {
      const { error } = await updateProfileNotes(patientId, debouncedNotes);
      if (error) throw error;
      notification?.success({ message: "Đã lưu ghi chú!" });
    } catch (error: unknown) {
      notification.error({
        message: "Lỗi lưu ghi chú",
        description: getErrorMessage(error),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePatient = async (values: any) => {
    if (!patientId) return;
    setIsUpdating(true);
    try {
      const updateData = {
        ...values,
        date_of_birth: values.date_of_birth
          ? values.date_of_birth.format("YYYY-MM-DD")
          : null,
      };

      const { error } = await updatePatient(patientId, updateData);
      if (error) throw error;

      // Update local profile state
      setProfile((prev: any | null) => ({ ...prev, ...updateData }));
      setIsEditing(false);
      setHasUnsavedChanges(false);

      notification?.success({ message: "Đã cập nhật thông tin bệnh nhân!" });
    } catch (error: unknown) {
      notification.error({
        message: "Lỗi cập nhật thông tin",
        description: getErrorMessage(error),
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    if (hasUnsavedChanges) {
      Modal.confirm({
        title: "Bỏ các thay đổi?",
        content:
          "Bạn có thay đổi chưa lưu. Bạn có chắc muốn bỏ các thay đổi này?",
        okText: "Bỏ thay đổi",
        cancelText: "Tiếp tục chỉnh sửa",
        onOk: () => {
          setIsEditing(false);
          setHasUnsavedChanges(false);
          // Reset form to original values
          form.setFieldsValue({
            full_name: profile?.full_name || "",
            phone_number: profile?.phone_number || "",
            date_of_birth: profile?.date_of_birth
              ? dayjs(profile.date_of_birth)
              : null,
            gender: profile?.gender || "",
            address: profile?.address || "",
            allergy_notes: profile?.allergy_notes || "",
            chronic_diseases: profile?.chronic_diseases || "",
            is_b2b_customer: profile?.is_b2b_customer || false,
          });
        },
      });
    } else {
      setIsEditing(false);
      setHasUnsavedChanges(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "400px",
        }}
      >
        <Spin size="large" tip="Đang tải thông tin bệnh nhân...">
          <div style={{ minHeight: "200px" }} />
        </Spin>
      </div>
    );
  }

  if (!profile) {
    return (
      <Card>
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <Title level={3}>Không tìm thấy thông tin bệnh nhân</Title>
          <Button
            type="primary"
            onClick={() => navigate(-1)}
            icon={<ArrowLeftOutlined />}
          >
            Quay lại
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div style={{ padding: getResponsivePadding(screens) }}>
      {/* Breadcrumb Navigation */}
      <Card style={{ marginBottom: 16 }}>
        <Breadcrumb>
          <Breadcrumb.Item>
            <HomeOutlined />
            <span
              onClick={() => navigate("/")}
              style={{ cursor: "pointer", marginLeft: 8 }}
            >
              Trang chủ
            </span>
          </Breadcrumb.Item>
          <Breadcrumb.Item>
            <span
              onClick={() => navigate("/patients")}
              style={{ cursor: "pointer" }}
            >
              Quản lý bệnh nhân
            </span>
          </Breadcrumb.Item>
          <Breadcrumb.Item>{profile.full_name}</Breadcrumb.Item>
        </Breadcrumb>

        <div
          style={{
            marginTop: 16,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Title level={2} style={{ margin: 0 }}>
            📋 Hồ sơ bệnh nhân: {profile.full_name}
          </Title>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            Quay lại
          </Button>
        </div>
      </Card>

      {/* Main Content */}
      <Row gutter={[24, 24]}>
        {/* Left Column - Patient Info */}
        <Col xs={24} lg={8}>
          <Card
            title="Thông tin cá nhân"
            extra={
              <Button
                type={isEditing ? "default" : "primary"}
                icon={<EditOutlined />}
                onClick={() => {
                  setIsEditing(!isEditing);
                  setHasUnsavedChanges(false);
                }}
              >
                {isEditing ? "Hủy chỉnh sửa" : "Chỉnh sửa"}
              </Button>
            }
          >
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <Avatar
                size={128}
                src={profile.avatar_url}
                icon={<UserOutlined />}
              />
              <Title level={4} style={{ marginTop: 16 }}>
                {profile.full_name}
              </Title>
              <Text type="secondary">{profile.phone_number}</Text>
            </div>

            {isEditing ? (
              <Form
                form={form}
                layout="vertical"
                onFinish={handleUpdatePatient}
                onValuesChange={() => setHasUnsavedChanges(true)}
              >
                <Form.Item
                  name="full_name"
                  label="Họ và tên"
                  rules={[
                    { required: true, message: "Vui lòng nhập họ tên" },
                    { min: 2, message: "Họ tên phải có ít nhất 2 ký tự" },
                  ]}
                >
                  <Input placeholder="Nhập họ và tên đầy đủ" />
                </Form.Item>

                <Form.Item
                  name="phone_number"
                  label="Số điện thoại"
                  rules={[
                    { required: true, message: "Vui lòng nhập số điện thoại" },
                    {
                      pattern: /^[0-9]{10,11}$/,
                      message: "Số điện thoại phải có 10-11 chữ số",
                    },
                  ]}
                >
                  <Input placeholder="Nhập số điện thoại (10-11 chữ số)" />
                </Form.Item>

                <Form.Item name="date_of_birth" label="Ngày sinh">
                  <DatePicker
                    style={{ width: "100%" }}
                    format="DD/MM/YYYY"
                    placeholder="Chọn ngày sinh"
                    disabledDate={(current) =>
                      current && current.isAfter(dayjs(), "day")
                    }
                  />
                </Form.Item>

                <Form.Item name="gender" label="Giới tính">
                  <Select placeholder="Chọn giới tính" allowClear>
                    <Select.Option value="Nam">👨 Nam</Select.Option>
                    <Select.Option value="Nữ">👩 Nữ</Select.Option>
                    <Select.Option value="Khác">🤷 Khác</Select.Option>
                  </Select>
                </Form.Item>

                <Form.Item name="address" label="Địa chỉ">
                  <Input.TextArea
                    rows={2}
                    placeholder="Nhập địa chỉ thường trú"
                    showCount
                    maxLength={200}
                  />
                </Form.Item>

                <Form.Item name="allergy_notes" label="Ghi chú dị ứng">
                  <Input.TextArea
                    rows={2}
                    placeholder="Ghi chú các loại thuốc, thực phẩm dị ứng..."
                    showCount
                    maxLength={500}
                  />
                </Form.Item>

                <Form.Item name="chronic_diseases" label="Bệnh mãn tính">
                  <Input.TextArea
                    rows={2}
                    placeholder="Ghi chú các bệnh mãn tính đang điều trị..."
                    showCount
                    maxLength={500}
                  />
                </Form.Item>

                <Divider />

                <Space style={{ width: "100%", justifyContent: "flex-end" }}>
                  <Button onClick={handleCancelEdit}>Hủy</Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={isUpdating}
                    icon={<SaveOutlined />}
                  >
                    Lưu thay đổi
                  </Button>
                </Space>
              </Form>
            ) : (
              <Descriptions
                bordered
                column={1}
                size="small"
                style={{
                  backgroundColor: "#fafafa",
                  border: "1px solid #f0f0f0",
                  borderRadius: 8,
                }}
              >
                <Descriptions.Item label="📅 Ngày sinh">
                  <Text strong>
                    {profile.date_of_birth ? (
                      dayjs(profile.date_of_birth).format("DD/MM/YYYY")
                    ) : (
                      <Text type="secondary">Chưa cập nhật</Text>
                    )}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="👤 Giới tính">
                  <Text strong>
                    {profile.gender ? (
                      profile.gender === "Nam" ? (
                        "👨 Nam"
                      ) : profile.gender === "Nữ" ? (
                        "👩 Nữ"
                      ) : (
                        "🤷 Khác"
                      )
                    ) : (
                      <Text type="secondary">Chưa cập nhật</Text>
                    )}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="🏠 Địa chỉ">
                  <Text>
                    {profile.address || (
                      <Text type="secondary">Chưa cập nhật</Text>
                    )}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="⚠️ Dị ứng">
                  <Text>
                    {profile.allergy_notes ? (
                      <Text style={{ color: "#ff4d4f" }}>
                        {profile.allergy_notes}
                      </Text>
                    ) : (
                      <Text type="secondary">Không có</Text>
                    )}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="🏥 Bệnh mãn tính">
                  <Text>
                    {profile.chronic_diseases ? (
                      <Text style={{ color: "#faad14" }}>
                        {profile.chronic_diseases}
                      </Text>
                    ) : (
                      <Text type="secondary">Không có</Text>
                    )}
                  </Text>
                </Descriptions.Item>
              </Descriptions>
            )}
          </Card>
        </Col>

        {/* Right Column - Appointments & History */}
        <Col xs={24} lg={16}>
          <Card>
            <Tabs
              defaultActiveKey="1"
              items={[
                {
                  key: "1",
                  label: (
                    <>
                      <CalendarOutlined /> Lịch sử Hẹn ({appointments.length})
                    </>
                  ),
                  children: (
                    <List
                      dataSource={appointments}
                      renderItem={(item) => (
                        <List.Item
                          style={{
                            border: "1px solid #f0f0f0",
                            borderRadius: 8,
                            marginBottom: 8,
                            padding: 16,
                          }}
                        >
                          <List.Item.Meta
                            avatar={
                              <CalendarOutlined
                                style={{ fontSize: 16, color: "#1890ff" }}
                              />
                            }
                            title={
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                }}
                              >
                                <span>
                                  {dayjs(item.appointment_time).format(
                                    "DD/MM/YYYY HH:mm",
                                  )}
                                </span>
                                <Tag color={getStatusColor(item.status)}>
                                  {item.status}
                                </Tag>
                              </div>
                            }
                            description={
                              <div>
                                <div>
                                  <strong>Dịch vụ:</strong>{" "}
                                  {item.service || "N/A"}
                                </div>
                                {item.note && (
                                  <div
                                    style={{
                                      marginTop: 8,
                                      padding: 8,
                                      backgroundColor: "#f6f6f6",
                                      borderRadius: 4,
                                    }}
                                  >
                                    <strong>Ghi chú:</strong> {item.note}
                                  </div>
                                )}
                              </div>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  ),
                },
                {
                  key: "2",
                  label: (
                    <>
                      <HistoryOutlined /> Lịch sử Sử dụng Dịch vụ (
                      {serviceHistory.length})
                    </>
                  ),
                  children: (
                    <List
                      dataSource={serviceHistory}
                      renderItem={(item) => (
                        <List.Item
                          style={{
                            border: "1px solid #f0f0f0",
                            borderRadius: 8,
                            marginBottom: 8,
                            padding: 16,
                          }}
                        >
                          <List.Item.Meta
                            avatar={
                              <HistoryOutlined
                                style={{ fontSize: 16, color: "#52c41a" }}
                              />
                            }
                            title={
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                }}
                              >
                                <span>
                                  {item.services?.name ||
                                    "Dịch vụ không xác định"}
                                </span>
                                {item.services?.price && (
                                  <Text strong style={{ color: "#52c41a" }}>
                                    {new Intl.NumberFormat("vi-VN", {
                                      style: "currency",
                                      currency: "VND",
                                    }).format(item.services.price)}
                                  </Text>
                                )}
                              </div>
                            }
                            description={
                              <div>
                                <div>
                                  <strong>Ngày sử dụng:</strong>{" "}
                                  {item.appointments?.appointment_time
                                    ? dayjs(
                                        item.appointments.appointment_time,
                                      ).format("DD/MM/YYYY HH:mm")
                                    : dayjs(item.created_at).format(
                                        "DD/MM/YYYY HH:mm",
                                      )}
                                </div>
                                {item.quantity && (
                                  <div>
                                    <strong>Số lượng:</strong> {item.quantity}
                                  </div>
                                )}
                                {item.notes && (
                                  <div
                                    style={{
                                      marginTop: 8,
                                      padding: 8,
                                      backgroundColor: "#f6f6f6",
                                      borderRadius: 4,
                                    }}
                                  >
                                    <strong>Ghi chú:</strong> {item.notes}
                                  </div>
                                )}
                              </div>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  ),
                },
                {
                  key: "3",
                  label: (
                    <>
                      <EditOutlined /> Ghi chú Lễ tân
                    </>
                  ),
                  children: (
                    <>
                      <div
                        style={{
                          background: "#f9f9f9",
                          padding: 16,
                          borderRadius: 8,
                          marginBottom: 16,
                        }}
                      >
                        <Paragraph style={{ margin: 0, color: "#666" }}>
                          📝 Ghi lại các thông tin phi y tế quan trọng (ví dụ:
                          sở thích, lưu ý khi giao tiếp, người nhà cần liên
                          hệ...).
                        </Paragraph>
                      </div>
                      <TextArea
                        rows={12}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Nhập ghi chú về bệnh nhân..."
                        style={{ borderRadius: 8 }}
                      />
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginTop: 16,
                        }}
                      >
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Ghi chú sẽ được tự động lưu sau 500ms
                        </Text>
                        <Button
                          type="primary"
                          icon={<SaveOutlined />}
                          loading={isSaving}
                          onClick={handleSaveNotes}
                          disabled={
                            notes === (profile?.receptionist_notes || "")
                          }
                        >
                          Lưu ghi chú
                        </Button>
                      </div>
                    </>
                  ),
                },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default PatientDetailPage;
