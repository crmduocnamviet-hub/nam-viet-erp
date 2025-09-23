import React, { useState, useEffect } from "react";
import { Button, Row, Col, Typography, App as AntApp, Spin } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import SchedulingDashboard from "../features/scheduling/SchedulingDashboard";
import { AppointmentCreationModal } from '@nam-viet-erp/shared-components';
import PatientCrmModal from "../features/scheduling/components/PatientCrmModal";
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