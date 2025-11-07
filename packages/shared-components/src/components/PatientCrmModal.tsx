import React, { useState, useEffect } from "react";
import {
  Modal,
  Row,
  Col,
  Avatar,
  Typography,
  Tabs,
  List,
  Input,
  Button,
  Spin,
  Empty,
  App,
  Tag,
  Descriptions,
  Grid,
} from "antd";
import {
  UserOutlined,
  SaveOutlined,
  CalendarOutlined,
  HistoryOutlined,
  EditOutlined,
} from "@ant-design/icons";
import {
  getProfileById,
  updateProfileNotes,
  getAppointmentsByPatientId,
  getPatientMedicalHistory,
} from "@nam-viet-erp/services";
import dayjs from "dayjs";
import { useDebounce, getErrorMessage } from "@nam-viet-erp/shared-components";
import { useNavigate } from "react-router-dom";

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { TextArea } = Input;

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

// Dịch service_type từ tiếng Anh sang tiếng Việt
const getServiceName = (serviceType?: string | null): string => {
  if (!serviceType) return "Chưa xác định";

  const serviceMap: Record<string, string> = {
    general: "Khám tổng quát",
    specialist: "Khám chuyên khoa",
    vaccine: "Tiêm chủng",
    ultrasound: "Siêu âm",
    // Các giá trị đã là tiếng Việt
    "Khám tổng quát": "Khám tổng quát",
    "Khám chuyên khoa": "Khám chuyên khoa",
    "Tiêm chủng": "Tiêm chủng",
    "Siêu âm": "Siêu âm",
    "Khám Bệnh": "Khám Bệnh",
    "Tiêm Chủng": "Tiêm Chủng",
  };

  // Kiểm tra trong map trước
  if (serviceMap[serviceType]) {
    return serviceMap[serviceType];
  }

  // Nếu không có trong map, trả về giá trị gốc (có thể đã là tiếng Việt)
  return serviceType;
};

interface PatientCrmModalProps {
  open: boolean;
  onClose: () => void;
  patientId: string | null;
}

const PatientCrmModal: React.FC<PatientCrmModalProps> = ({
  open,
  onClose,
  patientId,
}) => {
  const { notification } = App.useApp();
  const navigate = useNavigate();
  const { useBreakpoint } = Grid;
  const screens = useBreakpoint();
  const isMobile = !screens.md; // Mobile khi màn hình < 768px
  const isTablet = screens.md && !screens.lg; // Tablet khi 768px - 992px

  const [profile, setProfile] = useState<any | null>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [serviceHistory, setServiceHistory] = useState<any[]>([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const debouncedNotes = useDebounce(notes, 500);

  useEffect(() => {
    console.log("PatientCrmModal useEffect:", { open, patientId });
    if (open && patientId) {
      const fetchData = async () => {
        setLoading(true);
        console.log("Fetching patient data for patientId:", patientId);
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

          console.log("Patient data fetched:", {
            profile: profileRes.data,
            appointments: appointmentsRes.data,
            serviceHistory: serviceHistoryRes.data,
          });
          setProfile(profileRes.data);
          setAppointments(appointmentsRes.data || []);
          setServiceHistory(serviceHistoryRes.data || []);
          setNotes((profileRes.data as any)?.receptionist_notes || "");
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
    } else {
      // Reset state when modal is closed
      setProfile(null);
      setAppointments([]);
      setServiceHistory([]);
      setNotes("");
    }
  }, [open, patientId, notification]);

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

  const handleEditPatient = () => {
    if (patientId) {
      onClose(); // Close the patient profile modal
      navigate(`/patients/${patientId}`); // Navigate to patient detail page
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={isMobile ? "95%" : isTablet ? 700 : 900}
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: isMobile ? 16 : 18, fontWeight: 600 }}>
            📋 Thông tin bệnh nhân
          </span>
        </div>
      }
      destroyOnClose
      styles={{
        body: { padding: isMobile ? "16px" : "24px" },
      }}
    >
      <Spin spinning={loading}>
        {profile ? (
          <Row gutter={isMobile ? [16, 16] : 24}>
            <Col xs={24} sm={24} md={8} lg={8}>
              <div
                style={{
                  textAlign: "center",
                  padding: isMobile ? "0" : "0 8px",
                }}
              >
                <Avatar
                  size={isMobile ? 96 : 128}
                  src={profile.avatar_url}
                  icon={<UserOutlined />}
                  style={{
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    border: "4px solid #ffffff",
                  }}
                />
                <Title
                  level={isMobile ? 5 : 4}
                  style={{
                    marginTop: isMobile ? 12 : 16,
                    marginBottom: 4,
                    color: "#262626",
                    fontSize: isMobile ? 16 : undefined,
                  }}
                >
                  {profile.full_name}
                </Title>
                <Text type="secondary" style={{ fontSize: isMobile ? 13 : 14 }}>
                  {profile.phone_number}
                </Text>
                <div style={{ marginTop: isMobile ? 16 : 20 }}>
                  <Button
                    type="primary"
                    icon={<EditOutlined />}
                    onClick={handleEditPatient}
                    size={isMobile ? "small" : "middle"}
                    style={{
                      width: "100%",
                      height: isMobile ? 36 : 40,
                      borderRadius: 8,
                      fontWeight: 500,
                    }}
                  >
                    Chỉnh sửa thông tin
                  </Button>
                </div>
              </div>

              <div style={{ marginTop: isMobile ? 16 : 24 }}>
                <Descriptions
                  bordered
                  column={1}
                  size={isMobile ? "small" : "small"}
                  style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e8e8e8",
                    borderRadius: 12,
                    boxShadow: "0 2px 4px rgba(0,0,0,0.04)",
                  }}
                >
                  <Descriptions.Item label="📅 Ngày sinh">
                    <Text strong>
                      {profile.date_of_birth
                        ? dayjs(profile.date_of_birth).format("DD/MM/YYYY")
                        : "Chưa cập nhật"}
                    </Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="👤 Giới tính">
                    <Text strong>
                      {profile.gender
                        ? profile.gender === "Nam"
                          ? "👨 Nam"
                          : profile.gender === "Nữ"
                            ? "👩 Nữ"
                            : "🤷 Khác"
                        : "Chưa cập nhật"}
                    </Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="🏠 Địa chỉ">
                    <Text>{profile.address || "Chưa cập nhật"}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="⚠️ Dị ứng">
                    <Text>
                      {profile.allergy_notes ? (
                        <Text style={{ color: "#ff4d4f" }}>
                          {profile.allergy_notes}
                        </Text>
                      ) : (
                        "Không có"
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
                        "Không có"
                      )}
                    </Text>
                  </Descriptions.Item>
                </Descriptions>
              </div>
            </Col>
            <Col xs={24} sm={24} md={16} lg={16}>
              <Tabs
                defaultActiveKey="1"
                size={isMobile ? "small" : "middle"}
                tabBarStyle={{ marginBottom: 16 }}
              >
                <TabPane
                  tab={
                    <>
                      <CalendarOutlined /> Lịch sử Hẹn
                    </>
                  }
                  key="1"
                >
                  {appointments.length > 0 ? (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: isMobile ? 8 : 12,
                      }}
                    >
                      {appointments.map((item, index) => (
                        <div
                          key={item.appointment_id || index}
                          style={{
                            border: "1px solid #e8e8e8",
                            borderRadius: isMobile ? 8 : 12,
                            padding: isMobile ? 12 : 20,
                            backgroundColor: "#ffffff",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                            transition: "all 0.3s ease",
                            cursor: "pointer",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.boxShadow =
                              "0 4px 12px rgba(0,0,0,0.12)";
                            e.currentTarget.style.transform =
                              "translateY(-2px)";
                            e.currentTarget.style.borderColor = "#00b96b";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.boxShadow =
                              "0 2px 8px rgba(0,0,0,0.06)";
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.borderColor = "#e8e8e8";
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                              marginBottom: 12,
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: isMobile ? 8 : 12,
                              }}
                            >
                              <div
                                style={{
                                  width: isMobile ? 40 : 48,
                                  height: isMobile ? 40 : 48,
                                  borderRadius: isMobile ? 8 : 12,
                                  backgroundColor: "#e6f7ff",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                }}
                              >
                                <CalendarOutlined
                                  style={{
                                    fontSize: isMobile ? 16 : 20,
                                    color: "#1890ff",
                                  }}
                                />
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                  style={{
                                    fontSize: isMobile ? 14 : 16,
                                    fontWeight: 600,
                                    color: "#262626",
                                    marginBottom: 4,
                                  }}
                                >
                                  {dayjs(
                                    item.appointment_time ||
                                      item.scheduled_datetime,
                                  ).format("DD/MM/YYYY HH:mm")}
                                </div>
                                <div
                                  style={{
                                    fontSize: isMobile ? 12 : 13,
                                    color: "#8c8c8c",
                                  }}
                                >
                                  {getServiceName(
                                    item.service_type || item.service,
                                  )}
                                </div>
                              </div>
                            </div>
                            <Tag
                              color={getStatusColor(
                                item.status ||
                                  item.appointment_statuses?.status_name_vn ||
                                  item.current_status,
                              )}
                              style={{
                                fontSize: isMobile ? 11 : 12,
                                padding: isMobile ? "2px 8px" : "4px 12px",
                                borderRadius: 12,
                                margin: 0,
                                flexShrink: 0,
                              }}
                            >
                              {item.status ||
                                item.appointment_statuses?.status_name_vn ||
                                item.current_status ||
                                "Chưa xác định"}
                            </Tag>
                          </div>

                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: isMobile ? 6 : 8,
                              paddingLeft: isMobile ? 48 : 60,
                              marginTop: isMobile ? 8 : 0,
                            }}
                          >
                            {item.doctor?.full_name && (
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                }}
                              >
                                <UserOutlined
                                  style={{
                                    fontSize: isMobile ? 12 : 14,
                                    color: "#595959",
                                  }}
                                />
                                <Text
                                  style={{
                                    fontSize: isMobile ? 12 : 14,
                                    color: "#595959",
                                  }}
                                >
                                  <strong style={{ color: "#262626" }}>
                                    Bác sĩ:
                                  </strong>{" "}
                                  {item.doctor.full_name}
                                </Text>
                              </div>
                            )}
                            {(item.note || item.reason_for_visit) && (
                              <div
                                style={{
                                  marginTop: 4,
                                  padding: isMobile ? 8 : 12,
                                  backgroundColor: "#fafafa",
                                  borderRadius: 8,
                                  border: "1px solid #f0f0f0",
                                }}
                              >
                                <Text
                                  style={{
                                    fontSize: isMobile ? 12 : 13,
                                    color: "#595959",
                                  }}
                                >
                                  <strong style={{ color: "#262626" }}>
                                    Ghi chú:
                                  </strong>{" "}
                                  {item.note || item.reason_for_visit}
                                </Text>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Empty description="Chưa có lịch hẹn nào" />
                  )}
                </TabPane>
                <TabPane
                  tab={
                    <>
                      <HistoryOutlined /> Lịch sử Sử dụng Dịch vụ
                    </>
                  }
                  key="2"
                >
                  {serviceHistory.length > 0 ? (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: isMobile ? 8 : 12,
                      }}
                    >
                      {serviceHistory.map((item, index) => (
                        <div
                          key={item.visit_id || item.service_id || index}
                          style={{
                            border: "1px solid #e8e8e8",
                            borderRadius: isMobile ? 8 : 12,
                            padding: isMobile ? 12 : 20,
                            backgroundColor: "#ffffff",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                            transition: "all 0.3s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.boxShadow =
                              "0 4px 12px rgba(0,0,0,0.12)";
                            e.currentTarget.style.transform =
                              "translateY(-2px)";
                            e.currentTarget.style.borderColor = "#52c41a";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.boxShadow =
                              "0 2px 8px rgba(0,0,0,0.06)";
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.borderColor = "#e8e8e8";
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                              marginBottom: 12,
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: isMobile ? 8 : 12,
                                flex: 1,
                                minWidth: 0,
                              }}
                            >
                              <div
                                style={{
                                  width: isMobile ? 40 : 48,
                                  height: isMobile ? 40 : 48,
                                  borderRadius: isMobile ? 8 : 12,
                                  backgroundColor: "#f6ffed",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                }}
                              >
                                <HistoryOutlined
                                  style={{
                                    fontSize: isMobile ? 16 : 20,
                                    color: "#52c41a",
                                  }}
                                />
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                  style={{
                                    fontSize: isMobile ? 14 : 16,
                                    fontWeight: 600,
                                    color: "#262626",
                                    marginBottom: 4,
                                  }}
                                >
                                  {item.services?.name ||
                                    "Dịch vụ không xác định"}
                                </div>
                                <div
                                  style={{
                                    fontSize: isMobile ? 12 : 13,
                                    color: "#8c8c8c",
                                  }}
                                >
                                  {item.appointments?.appointment_time
                                    ? dayjs(
                                        item.appointments.appointment_time,
                                      ).format("DD/MM/YYYY HH:mm")
                                    : dayjs(item.created_at).format(
                                        "DD/MM/YYYY HH:mm",
                                      )}
                                </div>
                              </div>
                            </div>
                            {item.services?.price && (
                              <Text
                                strong
                                style={{
                                  color: "#52c41a",
                                  fontSize: isMobile ? 14 : 16,
                                  flexShrink: 0,
                                }}
                              >
                                {new Intl.NumberFormat("vi-VN", {
                                  style: "currency",
                                  currency: "VND",
                                }).format(item.services.price)}
                              </Text>
                            )}
                          </div>

                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: isMobile ? 6 : 8,
                              paddingLeft: isMobile ? 48 : 60,
                              marginTop: isMobile ? 8 : 0,
                            }}
                          >
                            {item.quantity && (
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                }}
                              >
                                <Text
                                  style={{
                                    fontSize: isMobile ? 12 : 14,
                                    color: "#595959",
                                  }}
                                >
                                  <strong style={{ color: "#262626" }}>
                                    Số lượng:
                                  </strong>{" "}
                                  {item.quantity}
                                </Text>
                              </div>
                            )}
                            {item.notes && (
                              <div
                                style={{
                                  marginTop: 4,
                                  padding: isMobile ? 8 : 12,
                                  backgroundColor: "#fafafa",
                                  borderRadius: 8,
                                  border: "1px solid #f0f0f0",
                                }}
                              >
                                <Text
                                  style={{
                                    fontSize: isMobile ? 12 : 13,
                                    color: "#595959",
                                  }}
                                >
                                  <strong style={{ color: "#262626" }}>
                                    Ghi chú:
                                  </strong>{" "}
                                  {item.notes}
                                </Text>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Empty description="Chưa có lịch sử sử dụng dịch vụ" />
                  )}
                </TabPane>
                <TabPane
                  tab={
                    <>
                      <EditOutlined /> Ghi chú Lễ tân
                    </>
                  }
                  key="3"
                >
                  <div
                    style={{
                      background: "#f9f9f9",
                      padding: isMobile ? 12 : 16,
                      borderRadius: 8,
                      marginBottom: isMobile ? 12 : 16,
                    }}
                  >
                    <Paragraph
                      style={{
                        margin: 0,
                        color: "#666",
                        fontSize: isMobile ? 13 : 14,
                      }}
                    >
                      📝 Ghi lại các thông tin phi y tế quan trọng (ví dụ: sở
                      thích, lưu ý khi giao tiếp, người nhà cần liên hệ...).
                    </Paragraph>
                  </div>
                  <TextArea
                    rows={isMobile ? 8 : 12}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Nhập ghi chú về bệnh nhân..."
                    style={{ borderRadius: 8 }}
                  />
                  <div
                    style={{
                      display: "flex",
                      flexDirection: isMobile ? "column" : "row",
                      justifyContent: "space-between",
                      alignItems: isMobile ? "stretch" : "center",
                      gap: isMobile ? 12 : 0,
                      marginTop: isMobile ? 12 : 16,
                    }}
                  >
                    <Text
                      type="secondary"
                      style={{ fontSize: isMobile ? 11 : 12 }}
                    >
                      Ghi chú sẽ được tự động lưu sau 500ms
                    </Text>
                    <Button
                      type="primary"
                      icon={<SaveOutlined />}
                      loading={isSaving}
                      onClick={handleSaveNotes}
                      disabled={
                        notes === ((profile as any)?.receptionist_notes || "")
                      }
                      size={isMobile ? "small" : "middle"}
                      style={{ width: isMobile ? "100%" : "auto" }}
                    >
                      Lưu ghi chú
                    </Button>
                  </div>
                </TabPane>
              </Tabs>
            </Col>
          </Row>
        ) : !loading && open ? (
          <Empty description="Không tìm thấy thông tin bệnh nhân." />
        ) : null}
      </Spin>
    </Modal>
  );
};

export default PatientCrmModal;
