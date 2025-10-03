import React, { useState, useEffect } from "react";
import { Button, Row, Col, Typography, App as AntApp, Spin } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { AppointmentCreationModal } from '@nam-viet-erp/shared-components';

// Temporary stub components to replace missing scheduling components
const SchedulingDashboard: React.FC<{ onAppointmentClick?: (appointment: any) => void }> = () => (
  <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
    <p>📅 Dashboard lịch hẹn sẽ được hiển thị tại đây</p>
    <p style={{ color: '#666', fontSize: '14px' }}>Chức năng dashboard lịch hẹn đang được phát triển</p>
  </div>
);

const PatientCrmModal: React.FC<any> = ({ open, onCancel }) => (
  open ? (
    <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1000, backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
      <h3>Thông tin bệnh nhân</h3>
      <p>Modal thông tin bệnh nhân sẽ được hiển thị tại đây</p>
      <button onClick={onCancel} style={{ marginTop: '10px' }}>Đóng</button>
    </div>
  ) : null
);

import { getEmployees } from '@nam-viet-erp/services';

const { Title } = Typography;


const DashboardPageContent: React.FC = () => {
  const { notification } = AntApp.useApp();
  const [isCreationModalOpen, setIsCreationModalOpen] = useState(false);
  const [isCrmModalOpen, setIsCrmModalOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [resources, setResources] = useState<IEmployee[]>([]);
  const [loadingResources, setLoadingResources] = useState(true);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        setLoadingResources(true);
        const { data, error } = await getEmployees({
          roleName: 'BacSi',
          limit: 50
        });
        if (error) {
          console.error('Error loading doctors:', error);
          notification.error({
            message: 'Lỗi tải dữ liệu',
            description: 'Không thể tải danh sách bác sĩ'
          });
        } else {
          setResources(data || []);
        }
      } catch (error) {
        console.error('Error loading doctors:', error);
        notification.error({
          message: 'Lỗi tải dữ liệu',
          description: 'Không thể tải danh sách bác sĩ'
        });
      } finally {
        setLoadingResources(false);
      }
    };
    fetchResources();
  }, [notification]);

  const handleFinishCreation = (values: any) => {
    console.log('New Appointment Values:', values);
    // In a real app, you would now add the new appointment to your state
    // and call a service to persist it.
    notification?.success({
      message: 'Tạo lịch hẹn thành công!',
      description: `Đã tạo lịch hẹn cho ${values.patientName} vào lúc ${values.appointmentTime.format('HH:mm')} ngày ${values.appointmentDate.format('DD/MM/YYYY')}.`,
    });
    setIsCreationModalOpen(false);
  };

  const handleAppointmentClick = (patientId: string) => {
    setSelectedPatientId(patientId);
    setIsCrmModalOpen(true);
  };

  if (loadingResources) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px'
      }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2}>Lịch làm việc</Title>
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

const Dashboard: React.FC = () => (
    <AntApp>
        <DashboardPageContent />
    </AntApp>
);

export default Dashboard;