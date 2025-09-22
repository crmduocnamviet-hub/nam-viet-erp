import React from 'react';
import { Row, Col } from 'antd';
import ResourceColumn from './components/ResourceColumn';

// Mock Data
const resources = [
  { id: 'doc1', name: 'BS. Nguyễn Văn Minh' },
  { id: 'doc2', name: 'BS. Trần Thị Lan' },
  { id: 'room1', name: 'Phòng Tiêm Chủng' },
  { id: 'room2', name: 'Phòng Siêu Âm' },
];

const appointments = [
  { id: 'app1', patientName: 'Nguyễn Thị A', time: '08:00', type: 'new' as const, resourceId: 'doc1', status: 'Đã xác nhận' as const, patientId: 'd6a85251-a8b3-4c34-9b4e-82c1286649a1' },
  { id: 'app2', patientName: 'Trần Văn B', time: '08:30', type: 'follow-up' as const, resourceId: 'doc1', status: 'Đang khám' as const, patientId: 'f2c5d1b3-6a7b-4e8c-9d1e-2a5c6b7d8e9f' },
  { id: 'app3', patientName: 'Lê Thị C', time: '09:00', type: 'new' as const, resourceId: 'doc2', status: 'Đã check-in' as const, patientId: 'a1b2c3d4-e5f6-7890-1234-567890abcdef' },
  { id: 'app4', patientName: 'Phạm Văn D', time: '08:15', type: 'new' as const, resourceId: 'room1', status: 'Chưa xác nhận' as const, patientId: 'b2c3d4e5-f6a7-8901-2345-67890abcdef1' },
  { id: 'app5', patientName: 'Hoàng Thị E', time: '09:30', type: 'new' as const, resourceId: 'doc2', status: 'Đã hoàn tất/Chờ thanh toán' as const, patientId: 'c3d4e5f6-a7b8-9012-3456-7890abcdef12' },
  { id: 'app6', patientName: 'Vũ Văn F', time: '10:00', type: 'follow-up' as const, resourceId: 'room2', status: 'Hủy/Không đến' as const, patientId: 'd4e5f6a7-b8c9-0123-4567-890abcdef123' },
];

interface SchedulingDashboardProps {
    onAppointmentClick: (patientId: string) => void;
}

const SchedulingDashboard: React.FC<SchedulingDashboardProps> = ({ onAppointmentClick }) => {
  return (
    <div style={{ width: '100%', overflowX: 'auto', height: 'calc(100vh - 200px)' }}>
      <Row gutter={16} wrap={false} style={{ height: '100%' }}>
        {resources.map(resource => (
          <Col key={resource.id} flex="280px">
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