import React, { useState, useEffect } from 'react';
import { Row, Col, Spin, Alert, DatePicker, Space, Typography, Modal, Form, TimePicker, App, Button, Select } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';
import { getDoctors, getAppointments, updateAppointment, getActiveRooms } from '@nam-viet-erp/services';
import ResourceColumn from './components/ResourceColumn';
import dayjs from 'dayjs';

interface SchedulingDashboardProps {
  onAppointmentClick: (appointmentId: string) => void;
}

const SchedulingDashboard: React.FC<SchedulingDashboardProps> = ({ onAppointmentClick }) => {
  const { notification } = App.useApp();
  const [timeEditForm] = Form.useForm();
  const [resources, setResources] = useState<any[]>([]);
  const [doctorOptions, setDoctorOptions] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(dayjs()); // Default to today
  const [editTimeModalOpen, setEditTimeModalOpen] = useState(false);
  const [editingAppointmentId, setEditingAppointmentId] = useState<string | null>(null);

  // Load doctors and resources (only once)
  useEffect(() => {
    const loadResources = async () => {
      try {
        // Load doctors and service rooms from database
        const [doctorsResult, roomsResult] = await Promise.all([
          getDoctors(),
          getActiveRooms()
        ]);

        const { data: doctors, error: doctorsError } = doctorsResult;
        const { data: rooms, error: roomsError } = roomsResult;

        if (doctorsError) {
          console.error('Error loading doctors:', doctorsError);
          throw doctorsError;
        }

        if (roomsError) {
          console.error('Error loading rooms:', roomsError);
          throw roomsError;
        }

        console.log('Loaded doctors:', doctors); // Debug log
        console.log('Loaded rooms:', rooms); // Debug log

        const serviceRooms = rooms?.map(room => ({
          id: room.room_id,
          name: room.name,
          type: 'room'
        })) || [];

        // Add unassigned room column for appointments without room assignment
        const unassignedRoomColumn = [
          { id: 'unassigned', name: 'Chưa phân phòng', type: 'unassigned' }
        ];

        // Use only rooms as columns, doctors are for selection in forms only
        const allResources = [...serviceRooms, ...unassignedRoomColumn];
        console.log('All resources:', allResources); // Debug log
        setResources(allResources);

        // Store doctors separately for form options
        const doctorOptions = doctors?.map(doctor => ({
          id: doctor.employee_id,
          name: doctor.full_name,
          type: 'doctor'
        })) || [];
        setDoctorOptions(doctorOptions);

      } catch (err: any) {
        setError(err.message || 'Không thể tải dữ liệu bác sĩ');
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

        const dateStr = selectedDate.format('YYYY-MM-DD');
        const startOfDay = `${dateStr}T00:00:00`;
        const endOfDay = `${dateStr}T23:59:59`;

        // Load appointments for selected date
        const { data: dateAppointments, error: appointmentsError } = await getAppointments({
          startDate: startOfDay,
          endDate: endOfDay
        });
        if (appointmentsError) throw appointmentsError;

        // Transform appointments data to match component structure
        const transformedAppointments = dateAppointments?.map(appointment => {
          console.log('Appointment data:', appointment); // Debug log
          return {
            id: appointment.appointment_id,
            patientName: appointment.patients?.full_name || 'Không xác định',
            time: new Date(appointment.scheduled_datetime).toLocaleTimeString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit'
            }),
            type: appointment.reason_for_visit?.includes('tái khám') ? 'follow-up' as const : 'new' as const,
            resourceId: appointment.room_id || 'unassigned', // Group by room instead of doctor
            status: getStatusDisplayName(appointment.current_status),
            patientId: appointment.patient_id,
            appointmentId: appointment.appointment_id,
            serviceType: appointment.service_type,
            reasonForVisit: appointment.reason_for_visit,
            roomId: appointment.room_id,
            roomName: appointment.room?.name,
            doctorId: appointment.doctor_id,
            doctorName: appointment.doctor?.full_name
          };
        }) || [];

        console.log('Transformed appointments:', transformedAppointments); // Debug log

        setAppointments(transformedAppointments);

      } catch (err: any) {
        setError(err.message || 'Không thể tải dữ liệu lịch hẹn');
      } finally {
        setLoading(false);
      }
    };

    loadAppointments();
  }, [selectedDate]);

  const getStatusDisplayName = (status: string): string => {
    const statusMap: Record<string, string> = {
      'SCHEDULED': 'Đã đặt lịch',
      'CONFIRMED': 'Đã xác nhận',
      'CHECKED_IN': 'Đã check-in',
      'IN_PROGRESS': 'Đang khám',
      'COMPLETED': 'Đã hoàn tất',
      'CANCELLED': 'Đã hủy',
      'NO_SHOW': 'Không đến'
    };
    return statusMap[status] || status;
  };

  const handleEditTime = (appointmentId: string) => {
    const appointment = appointments.find(app => app.appointmentId === appointmentId);
    if (appointment) {
      setEditingAppointmentId(appointmentId);
      setEditTimeModalOpen(true);

      // Parse existing time and date
      const currentDateTime = dayjs(appointment.appointmentDateTime || `${selectedDate.format('YYYY-MM-DD')} ${appointment.time}`);
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
        current_status: 'CANCELLED'
      });

      if (error) throw error;

      // Update local state
      setAppointments(prev =>
        prev.map(app =>
          app.appointmentId === appointmentId
            ? { ...app, status: 'Hủy/Không đến' }
            : app
        )
      );

      notification?.success({
        message: 'Đã hủy lịch hẹn',
        description: 'Lịch hẹn đã được hủy thành công'
      });
    } catch (error: any) {
      notification.error({
        message: 'Lỗi hủy lịch hẹn',
        description: error.message || 'Không thể hủy lịch hẹn'
      });
    }
  };

  const handleSaveTimeEdit = async (values: any) => {
    if (!editingAppointmentId) return;

    try {
      const newDateTime = values.newDate.format('YYYY-MM-DD') + 'T' + values.newTime.format('HH:mm:ss');

      const updateData: any = {
        scheduled_datetime: newDateTime
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

      const { error } = await updateAppointment(editingAppointmentId, updateData);

      if (error) throw error;

      // Update local state
      setAppointments(prev =>
        prev.map(app =>
          app.appointmentId === editingAppointmentId
            ? {
                ...app,
                time: values.newTime.format('HH:mm'),
                appointmentDateTime: newDateTime,
                resourceId: values.roomId || 'unassigned', // Room-based grouping
                roomId: values.roomId || undefined,
                roomName: values.roomId ? resources.find(r => r.id === values.roomId)?.name : undefined,
                doctorId: values.doctorId || undefined,
                doctorName: values.doctorId ? doctorOptions.find(d => d.id === values.doctorId)?.name : undefined
              }
            : app
        )
      );

      setEditTimeModalOpen(false);
      setEditingAppointmentId(null);
      timeEditForm.resetFields();

      notification?.success({
        message: 'Đã cập nhật lịch hẹn',
        description: 'Thời gian, bác sĩ và phòng khám đã được cập nhật thành công'
      });
    } catch (error: any) {
      notification.error({
        message: 'Lỗi cập nhật giờ hẹn',
        description: error.message || 'Không thể cập nhật thời gian'
      });
    }
  };

  const handleCancelTimeEdit = () => {
    setEditTimeModalOpen(false);
    setEditingAppointmentId(null);
    timeEditForm.resetFields();
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px'
      }}>
        <Spin size="large" tip="Đang tải lịch hẹn...">
          <div style={{ minHeight: "200px" }} />
        </Spin>
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Lỗi tải dữ liệu"
        description={error}
        type="error"
        showIcon
        style={{ margin: '20px 0' }}
      />
    );
  }

  return (
    <div style={{ width: '100%' }}>
      {/* Date picker header */}
      <div style={{
        marginBottom: 16,
        padding: '12px 16px',
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Space>
          <CalendarOutlined />
          <Typography.Text strong>Chọn ngày xem lịch hẹn:</Typography.Text>
          <DatePicker
            value={selectedDate}
            onChange={(date) => setSelectedDate(date || dayjs())}
            format="DD/MM/YYYY"
            placeholder="Chọn ngày"
            allowClear={false}
          />
        </Space>
        <Typography.Text type="secondary">
          {appointments.length} lịch hẹn
        </Typography.Text>
      </div>

      {/* Appointments grid */}
      <div style={{ width: '100%', overflowX: 'auto', height: 'calc(100vh - 280px)' }}>
        <Row gutter={16} wrap={false} style={{ height: '100%' }}>
          {resources.map(resource => (
            <Col key={resource.id} flex="300px">
              <ResourceColumn
                resource={resource}
                appointments={appointments.filter(app => app.resourceId === resource.id)}
                onAppointmentClick={onAppointmentClick}
                onEditTime={handleEditTime}
                onCancelAppointment={handleCancelAppointment}
              />
            </Col>
          ))}
        </Row>
      </div>

      {/* Edit Time Modal */}
      <Modal
        title={
          <Space>
            <CalendarOutlined />
            <span>Chỉnh sửa lịch hẹn</span>
          </Space>
        }
        open={editTimeModalOpen}
        onCancel={handleCancelTimeEdit}
        footer={null}
        width={500}
      >
        <div style={{
          padding: '16px 0',
          backgroundColor: '#f9f9f9',
          borderRadius: 8,
          margin: '16px 0',
          textAlign: 'center'
        }}>
          <Typography.Text type="secondary">
            📅 Cập nhật thời gian, bác sĩ và phòng khám
          </Typography.Text>
        </div>

        <Form
          form={timeEditForm}
          layout="vertical"
          onFinish={handleSaveTimeEdit}
        >
          <Form.Item
            name="newDate"
            label="📅 Ngày mới"
            rules={[{ required: true, message: 'Vui lòng chọn ngày' }]}
          >
            <DatePicker
              style={{ width: '100%' }}
              size="large"
              format="DD/MM/YYYY"
              placeholder="Chọn ngày"
            />
          </Form.Item>

          <Form.Item
            name="newTime"
            label="🕐 Giờ mới"
            rules={[{ required: true, message: 'Vui lòng chọn giờ' }]}
          >
            <TimePicker
              style={{ width: '100%' }}
              size="large"
              format="HH:mm"
              placeholder="Chọn giờ"
              minuteStep={15}
            />
          </Form.Item>

          <Form.Item
            name="doctorId"
            label="👨‍⚕️ Bác sĩ phụ trách"
          >
            <Select
              style={{ width: '100%' }}
              size="large"
              placeholder="Chọn bác sĩ (để trống nếu chưa phân bác sĩ)"
              allowClear
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={doctorOptions.map(doctor => ({
                value: doctor.id,
                label: `👨‍⚕️ ${doctor.name}`,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="roomId"
            label="🏥 Phòng khám"
          >
            <Select
              style={{ width: '100%' }}
              size="large"
              placeholder="Chọn phòng khám (tùy chọn)"
              allowClear
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={resources
                .filter(resource => resource.type === 'room')
                .map(room => ({
                  value: room.id,
                  label: `🏥 ${room.name}`,
                }))
              }
            />
          </Form.Item>

          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 12,
            marginTop: 24,
            borderTop: '1px solid #f0f0f0',
            paddingTop: 16
          }}>
            <Button onClick={handleCancelTimeEdit} size="large">
              Hủy
            </Button>
            <Button type="primary" htmlType="submit" size="large">
              💾 Lưu thay đổi
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default SchedulingDashboard;