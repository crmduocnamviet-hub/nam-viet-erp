import React, { useState, useEffect } from "react";
import {
  Row,
  Col,
  Spin,
  Alert,
  DatePicker,
  Space,
  Typography,
  Modal,
  Form,
  TimePicker,
  App,
  Button,
  Select,
} from "antd";
import { CalendarOutlined } from "@ant-design/icons";
import {
  getDoctors,
  getAppointments,
  updateAppointment,
  getActiveRooms,
} from "@nam-viet-erp/services";
import ResourceColumn from "./components/ResourceColumn";
import dayjs from "dayjs";

interface SchedulingDashboardProps {
  onAppointmentClick: (appointmentId: string) => void;
}

const SchedulingDashboard: React.FC<SchedulingDashboardProps> = ({
  onAppointmentClick,
}) => {
  const { notification } = App.useApp();
  const [timeEditForm] = Form.useForm();
  const [resources, setResources] = useState<any[]>([]);
  const [doctorOptions, setDoctorOptions] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(dayjs()); // Default to today
  const [editTimeModalOpen, setEditTimeModalOpen] = useState(false);
  const [editingAppointmentId, setEditingAppointmentId] = useState<
    string | null
  >(null);

  // Load doctors and resources (only once)
  useEffect(() => {
    const loadResources = async () => {
      try {
        // Load doctors and service rooms from database
        const [doctorsResult, roomsResult] = await Promise.all([
          getDoctors(),
          getActiveRooms(),
        ]);

        const { data: doctors, error: doctorsError } = doctorsResult;
        const { data: rooms, error: roomsError } = roomsResult;

        if (doctorsError) {
          console.error("Error loading doctors:", doctorsError);
          throw doctorsError;
        }

        if (roomsError) {
          console.error("Error loading rooms:", roomsError);
          throw roomsError;
        }

        console.log("Loaded doctors:", doctors); // Debug log
        console.log("Loaded rooms:", rooms); // Debug log

        const serviceRooms =
          rooms?.map((room) => ({
            id: room.room_id,
            name: room.name,
            type: "room",
          })) || [];

        // Add unassigned room column for appointments without room assignment
        const unassignedRoomColumn = [
          { id: "unassigned", name: "Chưa phân phòng", type: "unassigned" },
        ];

        // Use only rooms as columns, doctors are for selection in forms only
        const allResources = [...serviceRooms, ...unassignedRoomColumn];
        console.log("All resources:", allResources); // Debug log
        setResources(allResources);

        // Store doctors separately for form options
        const doctorOptions =
          doctors?.map((doctor) => ({
            id: doctor.employee_id,
            name: doctor.full_name,
            type: "doctor",
          })) || [];
        setDoctorOptions(doctorOptions);
      } catch (err: any) {
        setError(err.message || "Không thể tải dữ liệu bác sĩ");
      }
    };

    loadResources();
  }, []);

  // Load appointments when date changes
  useEffect(() => {
    const loadAppointments = async () => {
      try {
        setLoading(true);
        setError(null);

        const dateStr = selectedDate.format("YYYY-MM-DD");
        const startOfDay = `${dateStr}T00:00:00`;
        const endOfDay = `${dateStr}T23:59:59`;

        // Load appointments for selected date
        const { data: dateAppointments, error: appointmentsError } =
          await getAppointments({
            startDate: startOfDay,
            endDate: endOfDay,
          });
        if (appointmentsError) throw appointmentsError;

        // Transform appointments data to match component structure
        const transformedAppointments =
          dateAppointments?.map((appointment) => {
            console.log("Appointment data:", appointment); // Debug log
            return {
              id: appointment.appointment_id,
              patientName: appointment.patients?.full_name || "Không xác định",
              time: new Date(appointment.scheduled_datetime).toLocaleTimeString(
                "vi-VN",
                {
                  hour: "2-digit",
                  minute: "2-digit",
                },
              ),
              type: appointment.reason_for_visit?.includes("tái khám")
                ? ("follow-up" as const)
                : ("new" as const),
              resourceId: appointment.room_id || "unassigned", // Group by room instead of doctor
              status: getStatusDisplayName(appointment.current_status),
              patientId: appointment.patient_id,
              appointmentId: appointment.appointment_id,
              serviceType: appointment.service_type,
              reasonForVisit: appointment.reason_for_visit,
              roomId: appointment.room_id,
              roomName: appointment.room?.name,
              doctorId: appointment.doctor_id,
              doctorName: appointment.doctor?.full_name,
            };
          }) || [];

        console.log("Transformed appointments:", transformedAppointments); // Debug log

        setAppointments(transformedAppointments);
      } catch (err: any) {
        setError(err.message || "Không thể tải dữ liệu lịch hẹn");
      } finally {
        setLoading(false);
      }
    };

    loadAppointments();
  }, [selectedDate]);

  const getStatusDisplayName = (status: string): string => {
    const statusMap: Record<string, string> = {
      SCHEDULED: "Đã đặt lịch",
      CONFIRMED: "Đã xác nhận",
      CHECKED_IN: "Đã check-in",
      IN_PROGRESS: "Đang khám",
      COMPLETED: "Đã hoàn tất",
      CANCELLED: "Đã hủy",
      NO_SHOW: "Không đến",
    };
    return statusMap[status] || status;
  };

  const handleEditTime = (appointmentId: string) => {
    const appointment = appointments.find(
      (app) => app.appointmentId === appointmentId,
    );
    if (appointment) {
      setEditingAppointmentId(appointmentId);
      setEditTimeModalOpen(true);

      // Parse existing time and date from appointment time string or use selected date
      const appointmentDateStr = `${selectedDate.format("YYYY-MM-DD")} ${appointment.time}`;
      const currentDateTime = dayjs(appointmentDateStr);
      timeEditForm.setFieldsValue({
        newDate: currentDateTime,
        newTime: currentDateTime,
        doctorId: appointment.doctorId || undefined,
        roomId: appointment.roomId || undefined,
      });
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      const { error } = await updateAppointment(appointmentId, {
        current_status: "CANCELLED",
      });

      if (error) throw error;

      // Update local state
      setAppointments((prev) =>
        prev.map((app) =>
          app.appointmentId === appointmentId
            ? { ...app, status: "Hủy/Không đến" }
            : app,
        ),
      );

      notification?.success({
        message: "Đã hủy lịch hẹn",
        description: "Lịch hẹn đã được hủy thành công",
      });
    } catch (error: any) {
      notification.error({
        message: "Lỗi hủy lịch hẹn",
        description: error.message || "Không thể hủy lịch hẹn",
      });
    }
  };

  const handleSaveTimeEdit = async (values: any) => {
    if (!editingAppointmentId) return;

    try {
      const newDateTime =
        values.newDate.format("YYYY-MM-DD") +
        "T" +
        values.newTime.format("HH:mm:ss");

      const updateData: any = {
        scheduled_datetime: newDateTime,
      };

      // Include doctor assignment if specified
      if (values.doctorId) {
        updateData.doctor_id = values.doctorId;
      } else {
        // If no doctor selected, set to null (unassigned)
        updateData.doctor_id = null;
      }

      // Include room assignment if specified
      if (values.roomId) {
        updateData.room_id = values.roomId;
      } else {
        // If no room selected, set to null
        updateData.room_id = null;
      }

      const { error } = await updateAppointment(
        editingAppointmentId,
        updateData,
      );

      if (error) throw error;

      // Update local state
      setAppointments((prev) =>
        prev.map((app) =>
          app.appointmentId === editingAppointmentId
            ? {
                ...app,
                time: values.newTime.format("HH:mm"),
                roomId: values.roomId,
                doctorId: values.doctorId,
              }
            : app,
        ),
      );

      notification?.success({
        message: "Đã cập nhật lịch hẹn",
        description: "Thời gian và thông tin đã được cập nhật thành công",
      });

      setEditTimeModalOpen(false);
      setEditingAppointmentId(null);
      timeEditForm.resetFields();
    } catch (error: any) {
      notification.error({
        message: "Lỗi cập nhật lịch hẹn",
        description: error.message || "Không thể cập nhật lịch hẹn",
      });
    }
  };

  if (error) {
    return (
      <Alert
        message="Lỗi"
        description={error}
        type="error"
        showIcon
        style={{ margin: "20px" }}
      />
    );
  }

  if (loading && resources.length === 0) {
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
    <div style={{ padding: "16px" }}>
      {/* Date selector */}
      <Space style={{ marginBottom: "16px" }}>
        <CalendarOutlined />
        <DatePicker
          value={selectedDate}
          onChange={(date) => setSelectedDate(date || dayjs())}
          format="DD/MM/YYYY"
          placeholder="Chọn ngày"
        />
      </Space>

      {loading && (
        <div style={{ textAlign: "center", padding: "20px" }}>
          <Spin />
        </div>
      )}

      {/* Dashboard */}
      <div
        style={{
          width: "100%",
          overflowX: "auto",
          height: "calc(100vh - 200px)",
        }}
      >
        <Row gutter={16} wrap={false} style={{ height: "100%" }}>
          {resources.map((resource) => (
            <Col key={resource.id} flex="280px">
              <ResourceColumn
                resource={resource}
                appointments={appointments.filter(
                  (app) => app.resourceId === resource.id,
                )}
                onAppointmentClick={(appointmentId: string) => {
                  const appointment = appointments.find(
                    (app) => app.appointmentId === appointmentId,
                  );
                  if (appointment) {
                    onAppointmentClick(appointment.patientId);
                  }
                }}
                onEditTime={handleEditTime}
                onCancelAppointment={handleCancelAppointment}
              />
            </Col>
          ))}
        </Row>
      </div>

      {/* Edit Time Modal */}
      <Modal
        title="Chỉnh sửa thời gian lịch hẹn"
        open={editTimeModalOpen}
        onCancel={() => {
          setEditTimeModalOpen(false);
          setEditingAppointmentId(null);
          timeEditForm.resetFields();
        }}
        onOk={() => timeEditForm.submit()}
      >
        <Form
          form={timeEditForm}
          layout="vertical"
          onFinish={handleSaveTimeEdit}
        >
          <Form.Item
            name="newDate"
            label="Ngày"
            rules={[{ required: true, message: "Vui lòng chọn ngày" }]}
          >
            <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item
            name="newTime"
            label="Giờ"
            rules={[{ required: true, message: "Vui lòng chọn giờ" }]}
          >
            <TimePicker style={{ width: "100%" }} format="HH:mm" />
          </Form.Item>

          <Form.Item name="roomId" label="Phòng">
            <Select placeholder="Chọn phòng (tùy chọn)" allowClear>
              {resources
                .filter((r) => r.type === "room")
                .map((room) => (
                  <Select.Option key={room.id} value={room.id}>
                    {room.name}
                  </Select.Option>
                ))}
            </Select>
          </Form.Item>

          <Form.Item name="doctorId" label="Bác sĩ">
            <Select placeholder="Chọn bác sĩ (tùy chọn)" allowClear>
              {doctorOptions.map((doctor) => (
                <Select.Option key={doctor.id} value={doctor.id}>
                  {doctor.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SchedulingDashboard;
