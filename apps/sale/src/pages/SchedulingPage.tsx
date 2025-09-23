import React, { useState, useEffect } from "react";
import { Button, Row, Col, Typography, App as AntApp, Spin } from "antd";
import { PlusOutlined, CalendarOutlined } from "@ant-design/icons";
import {
  getEmployees,
  createAppointment,
  initializeDefaultStatuses,
} from "@nam-viet-erp/services";
import { AppointmentCreationModal } from "@nam-viet-erp/shared-components";
import PatientCrmModal from "../features/scheduling/components/PatientCrmModal";
import SchedulingDashboard from "../features/scheduling/SchedulingDashboard";

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
          roleName: 'BacSi',
          limit: 50
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
        service_type: values.service_type,
        scheduled_datetime: `${values.appointmentDate.format(
          "YYYY-MM-DD"
        )}T${values.appointmentTime.format("HH:mm:ss")}`,
        doctor_id: values.resource_id?.startsWith("doc")
          ? values.resource_id
          : null,
        receptionist_id: null, // Would be filled with current logged in user
        current_status: "SCHEDULED",
        reason_for_visit: values.reason_for_visit,
        check_in_time: null,
        is_confirmed_by_zalo: false,
        receptionist_notes: values.notes || null,
      };

      const { data, error } = await createAppointment(appointmentData);

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
            size="large"
            icon={<PlusOutlined />}
            onClick={() => setIsCreationModalOpen(true)}
            style={{
              background: "linear-gradient(45deg, #1890ff, #40a9ff)",
              border: "none",
              boxShadow: "0 4px 15px 0 rgba(24, 144, 255, 0.4)",
            }}
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