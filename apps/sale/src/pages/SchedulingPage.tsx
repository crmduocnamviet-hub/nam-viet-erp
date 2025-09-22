import React, { useState } from "react";
import { Button, Row, Col, Typography, App as AntApp } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import SchedulingDashboard from "../../features/scheduling/SchedulingDashboard";
import AppointmentCreationModal from "../../features/scheduling/components/AppointmentCreationModal";
import PatientCrmModal from "../../features/scheduling/components/PatientCrmModal";

const { Title } = Typography;

// Mock data for resources, as it's needed by the modal.
// Ideally, this would come from a shared service or context.
const resources = [
  { id: 'doc1', name: 'BS. Nguyễn Văn Minh' },
  { id: 'doc2', name: 'BS. Trần Thị Lan' },
  { id: 'room1', name: 'Phòng Tiêm Chủng' },
  { id: 'room2', name: 'Phòng Siêu Âm' },
];

const SchedulingPageContent: React.FC = () => {
  const { notification } = AntApp.useApp();
  const [isCreationModalOpen, setIsCreationModalOpen] = useState(false);
  const [isCrmModalOpen, setIsCrmModalOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  const handleFinishCreation = (values: any) => {
    console.log('New Appointment Values:', values);
    // In a real app, you would now add the new appointment to your state
    // and call a service to persist it.
    notification.success({
      message: 'Tạo lịch hẹn thành công!',
      description: `Đã tạo lịch hẹn cho ${values.patientName} vào lúc ${values.appointmentTime.format('HH:mm')} ngày ${values.appointmentDate.format('DD/MM/YYYY')}.`,
    });
    setIsCreationModalOpen(false);
  };

  const handleAppointmentClick = (patientId: string) => {
    setSelectedPatientId(patientId);
    setIsCrmModalOpen(true);
  };

  return (
    <>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24, padding: '0 24px' }}>
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

const SchedulingPage: React.FC = () => (
    <AntApp>
        <SchedulingPageContent />
    </AntApp>
);

export default SchedulingPage;