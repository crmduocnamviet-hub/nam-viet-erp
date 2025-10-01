import React, { useState, useEffect } from "react";
import { Button, Row, Col, Typography, App as AntApp, Spin, DatePicker } from "antd";
import { PlusOutlined, CalendarOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import {
  getEmployees,
  createAppointment,
  initializeDefaultStatuses,
  getAppointments,
  getCurrentEmployee,
} from "@nam-viet-erp/services";
import { AppointmentCreationModal } from "@nam-viet-erp/shared-components";
// Basic functional scheduling dashboard
const SchedulingDashboard: React.FC<{
  onAppointmentClick?: (appointment: any) => void;
  selectedDate: dayjs.Dayjs;
  onDateChange: (date: dayjs.Dayjs) => void;
}> = ({ onAppointmentClick, selectedDate, onDateChange }) => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentEmployee, setCurrentEmployee] = useState<IEmployee | null>(
    null
  );

  useEffect(() => {
    const loadAppointments = async () => {
      try {
        setLoading(true);

        // Get current logged-in employee
        const { data: employee, error: employeeError } =
          await getCurrentEmployee();
        if (employee) {
          setCurrentEmployee(employee);
        }

        // Get appointments for selected date
        // If employee is a doctor, filter by their ID
        const doctorFilter =
          employee?.role_name === "BacSi" ? employee.employee_id : undefined;

        const startOfDay = selectedDate.startOf('day').toISOString();
        const endOfDay = selectedDate.endOf('day').toISOString();

        const { data, error } = await getAppointments({
          doctorId: doctorFilter,
          startDate: startOfDay,
          endDate: endOfDay,
        });

        if (error) {
          console.error("Error loading appointments:", error);
          setAppointments([]);
        } else {
          setAppointments(data || []);
        }
      } catch (error) {
        console.error("Error:", error);
        setAppointments([]);
      } finally {
        setLoading(false);
      }
    };

    loadAppointments();
  }, [selectedDate]);

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <Spin size="large" />
        <p style={{ marginTop: "16px" }}>Đang tải lịch hẹn...</p>
      </div>
    );
  }

  // Format time from ISO datetime
  const formatTime = (datetime: string) => {
    const date = new Date(datetime);
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      SCHEDULED: "#1890ff",
      CONFIRMED: "#52c41a",
      CHECKED_IN: "#faad14",
      IN_PROGRESS: "#13c2c2",
      COMPLETED: "#52c41a",
      CANCELLED: "#ff4d4f",
      NO_SHOW: "#8c8c8c",
    };
    return colors[status] || "#d9d9d9";
  };

  return (
    <div
      style={{
        backgroundColor: "#f5f5f5",
        borderRadius: "8px",
        padding: "24px",
      }}
    >
      <div
        style={{
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <CalendarOutlined style={{ fontSize: "24px", color: "#1890ff" }} />
          <h3 style={{ margin: 0 }}>
            Lịch hẹn
            {currentEmployee?.role_name === "BacSi" && (
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: "normal",
                  color: "#666",
                  marginLeft: "8px",
                }}
              >
                - Bác sĩ {currentEmployee.full_name}
              </span>
            )}
          </h3>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <DatePicker
            value={selectedDate}
            onChange={(date) => date && onDateChange(date)}
            format="DD/MM/YYYY"
            placeholder="Chọn ngày"
            style={{ width: 150 }}
            allowClear={false}
          />
          <Button
            size="small"
            onClick={() => onDateChange(dayjs())}
            disabled={selectedDate.isSame(dayjs(), 'day')}
          >
            Hôm nay
          </Button>
          <div style={{ color: "#666", fontSize: "14px" }}>
            Tổng: <strong>{appointments.length}</strong> lịch hẹn
          </div>
        </div>
      </div>

      {appointments.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px" }}>
          <CalendarOutlined
            style={{ fontSize: "48px", color: "#d9d9d9", marginBottom: "16px" }}
          />
          <p style={{ color: "#666", fontSize: "16px" }}>
            Không có lịch hẹn nào trong ngày {selectedDate.format("DD/MM/YYYY")}
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gap: "12px",
            position: "relative",
            paddingLeft: "80px",
          }}
        >
          {/* Timeline line */}
          <div
            style={{
              position: "absolute",
              left: "55px",
              top: "20px",
              bottom: "20px",
              width: "2px",
              backgroundColor: "#e8e8e8",
            }}
          />

          {appointments
            .sort(
              (a: any, b: any) =>
                new Date(a.scheduled_datetime).getTime() -
                new Date(b.scheduled_datetime).getTime()
            )
            .map((appointment: any) => {
              const appointmentTime = dayjs(appointment.scheduled_datetime);
              const hour = appointmentTime.format('HH:mm');

              return (
              <div key={appointment.appointment_id} style={{ position: "relative" }}>
                {/* Hour marker on the left */}
                <div
                  style={{
                    position: "absolute",
                    left: "-80px",
                    top: "20px",
                    width: "70px",
                    textAlign: "right",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#1890ff",
                    paddingRight: "12px",
                  }}
                >
                  {hour}
                </div>

                <div
                  onClick={() => onAppointmentClick?.(appointment.appointment_id)}
                  style={{
                    backgroundColor: "white",
                    padding: "16px",
                    borderRadius: "8px",
                    border: "1px solid #e8e8e8",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    position: "relative",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow =
                      "0 4px 12px rgba(0,0,0,0.1)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow =
                      "0 1px 4px rgba(0,0,0,0.05)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  {/* Timeline dot */}
                  <div
                    style={{
                      position: "absolute",
                      left: "-72px",
                      top: "20px",
                      width: "12px",
                      height: "12px",
                      borderRadius: "50%",
                      backgroundColor: getStatusColor(appointment.current_status),
                      border: "3px solid white",
                      boxShadow: "0 0 0 1px #e8e8e8",
                    }}
                  />

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        marginBottom: "8px",
                      }}
                    >
                      <h4
                        style={{
                          margin: 0,
                          color: "#262626",
                          fontSize: "16px",
                        }}
                      >
                        {appointment.patients?.full_name || "N/A"}
                      </h4>
                    </div>

                    <div>
                      <p
                        style={{
                          margin: "0 0 4px 0",
                          fontSize: "14px",
                          color: "#666",
                        }}
                      >
                        👨‍⚕️ {appointment.doctor?.full_name || "Chưa phân bổ"}
                      </p>
                      <p
                        style={{
                          margin: "0 0 4px 0",
                          fontSize: "14px",
                          color: "#666",
                        }}
                      >
                        📋 {appointment.service_type || "Chưa xác định"}
                      </p>
                      {appointment.notes && (
                        <p
                          style={{
                            margin: "4px 0 0 0",
                            fontSize: "13px",
                            color: "#8c8c8c",
                            fontStyle: "italic",
                          }}
                        >
                          💬 {appointment.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <span
                      style={{
                        padding: "6px 12px",
                        borderRadius: "12px",
                        fontSize: "12px",
                        backgroundColor: getStatusColor(
                          appointment.current_status
                        ),
                        color: "white",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {appointment.appointment_statuses?.status_name_vn ||
                        appointment.current_status}
                    </span>
                  </div>
                </div>
                </div>
              </div>
            );
            })}
        </div>
      )}
    </div>
  );
};

const PatientCrmModal: React.FC<any> = ({ open, onCancel, onClose }) => {
  const handleClose = onClose || onCancel;

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={handleClose}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          minWidth: "400px",
          maxWidth: "80vw",
          maxHeight: "80vh",
          overflow: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <h3 style={{ margin: 0 }}>📋 Thông tin bệnh nhân</h3>
          <button
            onClick={handleClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "20px",
              cursor: "pointer",
              color: "#999",
              padding: "4px",
            }}
          >
            ×
          </button>
        </div>
        <p>
          🎉 Modal CRM bệnh nhân sẽ được hiển thị tại đây (Live Update Test)
        </p>
        <div style={{ textAlign: "right", marginTop: "20px" }}>
          <button
            onClick={handleClose}
            style={{
              padding: "8px 16px",
              backgroundColor: "#1890ff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

const { Title } = Typography;

const SchedulingPageContent: React.FC = () => {
  const { notification } = AntApp.useApp();
  const [isCreationModalOpen, setIsCreationModalOpen] = useState(false);
  const [isCrmModalOpen, setIsCrmModalOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(
    null
  );
  const [resources, setResources] = useState<IEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs>(dayjs());

  useEffect(() => {
    const initializeData = async () => {
      try {
        // Initialize default appointment statuses
        await initializeDefaultStatuses();

        // Load doctors as resources
        const { data: employees, error } = await getEmployees({
          roleName: "BacSi",
          limit: 50,
        });
        if (error) {
          notification.error({
            message: "Lỗi tải dữ liệu",
            description: "Không thể tải danh sách bác sĩ",
          });
        } else {
          setResources(employees || []);
        }
      } catch (error) {
        notification.error({
          message: "Lỗi khởi tạo",
          description: "Không thể khởi tạo dữ liệu hệ thống",
        });
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [notification]);

  const handleFinishCreation = async (values: any) => {
    try {
      const appointmentData: Omit<
        IAppointment,
        "appointment_id" | "created_at"
      > = {
        patient_id: values.patient_id,
        service_type: (values.service || values.service_type) as any,
        scheduled_datetime: `${values.appointmentDate.format(
          "YYYY-MM-DD"
        )}T${values.appointmentTime.format("HH:mm:ss")}`,
        doctor_id: values.resourceId as any, // Use resourceId directly as it's now a real employee_id
        receptionist_id: null, // Would be filled with current logged in user
        current_status: "SCHEDULED",
        reason_for_visit: values.notes || values.reason_for_visit,
        check_in_time: null,
        is_confirmed_by_zalo: false,
        receptionist_notes: values.notes || null,
      };

      const { error } = await createAppointment(appointmentData);

      if (error) {
        notification.error({
          message: "Lỗi tạo lịch hẹn",
          description: error.message,
        });
      } else {
        notification.success({
          message: "Tạo lịch hẹn thành công!",
          description: `Đã tạo lịch hẹn vào lúc ${values.appointmentTime.format(
            "HH:mm"
          )} ngày ${values.appointmentDate.format("DD/MM/YYYY")}.`,
        });
        setIsCreationModalOpen(false);
        // Refresh the dashboard
        window.location.reload(); // Simple refresh - could be optimized
      }
    } catch (error) {
      notification.error({
        message: "Lỗi hệ thống",
        description: "Không thể tạo lịch hẹn",
      });
    }
  };

  const handleAppointmentClick = (appointmentId: string) => {
    setSelectedPatientId(appointmentId);
    setIsCrmModalOpen(true);
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  return (
    <>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2} style={{ margin: 0 }}>
            <CalendarOutlined style={{ marginRight: 8 }} />
            Lịch Hẹn & Đặt Lịch
          </Title>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsCreationModalOpen(true)}
          >
            Tạo lịch hẹn mới
          </Button>
        </Col>
      </Row>
      <SchedulingDashboard
        onAppointmentClick={handleAppointmentClick}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
      />
      <AppointmentCreationModal
        open={isCreationModalOpen}
        onClose={() => setIsCreationModalOpen(false)}
        onFinish={handleFinishCreation}
        resources={resources}
      />
      <PatientCrmModal
        open={isCrmModalOpen}
        onClose={() => setIsCrmModalOpen(false)}
        patientId={selectedPatientId}
      />
    </>
  );
};

const SchedulingPage: React.FC = ({ ...props }) => (
  <AntApp>
    <SchedulingPageContent {...props} />
  </AntApp>
);

export default SchedulingPage;
