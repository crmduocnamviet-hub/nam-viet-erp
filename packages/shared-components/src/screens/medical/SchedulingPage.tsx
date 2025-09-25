import React, { useState, useEffect } from "react";
import { Button, Row, Col, Typography, App as AntApp, Spin } from "antd";
import { PlusOutlined, CalendarOutlined } from "@ant-design/icons";
import {
  getEmployees,
  createAppointment,
  initializeDefaultStatuses,
} from "@nam-viet-erp/services";
import { AppointmentCreationModal } from "@nam-viet-erp/shared-components";
// Basic functional scheduling dashboard
const SchedulingDashboard: React.FC<{ onAppointmentClick?: (appointment: any) => void }> = ({ onAppointmentClick }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading appointments
    const loadAppointments = async () => {
      try {
        setLoading(true);
        // This would be replaced with actual API call to get today's appointments
        // const { data, error } = await getAppointments({ date: new Date().toISOString().split('T')[0] });

        // Mock data for now
        const today = new Date().toISOString().split('T')[0];
        const mockAppointments = [
          {
            id: '1',
            patient_name: 'Nguyễn Văn A',
            time: '09:00',
            doctor: 'Bác sĩ Trần Thị B',
            service: 'Khám tổng quát',
            status: 'SCHEDULED'
          },
          {
            id: '2',
            patient_name: 'Lê Thị C',
            time: '10:30',
            doctor: 'Bác sĩ Nguyễn Văn D',
            service: 'Khám chuyên khoa',
            status: 'CHECKED_IN'
          }
        ];

        setTimeout(() => {
          setAppointments(mockAppointments);
          setLoading(false);
        }, 1000);
      } catch (error) {
        setLoading(false);
      }
    };

    loadAppointments();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <Spin size="large" />
        <p style={{ marginTop: '16px' }}>Đang tải lịch hẹn...</p>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#f5f5f5', borderRadius: '8px', padding: '24px' }}>
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <CalendarOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
        <h3 style={{ margin: 0 }}>Lịch hẹn hôm nay ({new Date().toLocaleDateString('vi-VN')})</h3>
      </div>

      {appointments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <CalendarOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
          <p style={{ color: '#666', fontSize: '16px' }}>Không có lịch hẹn nào hôm nay</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {appointments.map((appointment: any) => (
            <div
              key={appointment.id}
              onClick={() => onAppointmentClick?.(appointment.id)}
              style={{
                backgroundColor: 'white',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #e8e8e8',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: '0 0 8px 0', color: '#1890ff' }}>{appointment.patient_name}</h4>
                  <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#666' }}>
                    🕒 {appointment.time} - {appointment.doctor}
                  </p>
                  <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                    📋 {appointment.service}
                  </p>
                </div>
                <div>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    backgroundColor: appointment.status === 'CHECKED_IN' ? '#52c41a' : '#1890ff',
                    color: 'white'
                  }}>
                    {appointment.status === 'CHECKED_IN' ? 'Đã check-in' : 'Đã đặt lịch'}
                  </span>
                </div>
              </div>
            </div>
          ))}
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
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      onClick={handleClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          minWidth: '400px',
          maxWidth: '80vw',
          maxHeight: '80vh',
          overflow: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0 }}>📋 Thông tin bệnh nhân</h3>
          <button
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: '#999',
              padding: '4px'
            }}
          >
            ×
          </button>
        </div>
        <p>🎉 Modal CRM bệnh nhân sẽ được hiển thị tại đây (Live Update Test)</p>
        <div style={{ textAlign: 'right', marginTop: '20px' }}>
          <button
            onClick={handleClose}
            style={{
              padding: '8px 16px',
              backgroundColor: '#1890ff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
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
      <SchedulingDashboard onAppointmentClick={handleAppointmentClick} />
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

const SchedulingPage: React.FC = () => (
  <AntApp>
    <SchedulingPageContent />
  </AntApp>
);

export default SchedulingPage;
