import React, { useState, useEffect } from 'react';
import { Row, Col, Spin, Alert } from 'antd';
import { getTodaysAppointments, getDoctors } from '@nam-viet-erp/services';
import ResourceColumn from './components/ResourceColumn';

interface SchedulingDashboardProps {
  onAppointmentClick: (appointmentId: string) => void;
}

const SchedulingDashboard: React.FC<SchedulingDashboardProps> = ({ onAppointmentClick }) => {
  const [resources, setResources] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load doctors and service rooms
        const { data: doctors, error: doctorsError } = await getDoctors();
        if (doctorsError) throw doctorsError;

        const doctorResources = doctors?.map(doctor => ({
          id: doctor.employee_id,
          name: doctor.full_name,
          type: 'doctor'
        })) || [];

        const serviceRooms = [
          { id: 'room1', name: 'Phòng Tiêm Chủng', type: 'room' },
          { id: 'room2', name: 'Phòng Siêu Âm', type: 'room' },
        ];

        const allResources = [...doctorResources, ...serviceRooms];
        setResources(allResources);

        // Load today's appointments
        const { data: todayAppointments, error: appointmentsError } = await getTodaysAppointments();
        if (appointmentsError) throw appointmentsError;

        // Transform appointments data to match component structure
        const transformedAppointments = todayAppointments?.map(appointment => ({
          id: appointment.appointment_id,
          patientName: (appointment as any).patients?.full_name || 'Không xác định',
          time: new Date(appointment.scheduled_datetime).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit'
          }),
          type: appointment.reason_for_visit?.includes('tái khám') ? 'follow-up' as const : 'new' as const,
          resourceId: appointment.doctor_id || 'room1', // Default to room if no doctor
          status: getStatusDisplayName(appointment.current_status),
          patientId: appointment.patient_id,
          appointmentId: appointment.appointment_id,
          serviceType: appointment.service_type,
          reasonForVisit: appointment.reason_for_visit
        })) || [];

        setAppointments(transformedAppointments);

      } catch (err: any) {
        setError(err.message || 'Không thể tải dữ liệu lịch hẹn');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

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

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px'
      }}>
        <Spin size="large" tip="Đang tải lịch hẹn..." />
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
    <div style={{ width: '100%', overflowX: 'auto', height: 'calc(100vh - 200px)' }}>
      <Row gutter={16} wrap={false} style={{ height: '100%' }}>
        {resources.map(resource => (
          <Col key={resource.id} flex="300px">
            <ResourceColumn
              resource={resource}
              appointments={appointments.filter(app => app.resourceId === resource.id)}
              onAppointmentClick={onAppointmentClick}
            />
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default SchedulingDashboard;