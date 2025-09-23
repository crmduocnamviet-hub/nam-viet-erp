import React from 'react';
import { Card, Typography } from 'antd';
import AppointmentCard from './AppointmentCard';

const { Title } = Typography;

interface Appointment {
  id: string;
  appointmentId: string;
  patientName: string;
  time: string;
  type: 'new' | 'follow-up';
  status: string;
  patientId: string;
  roomId?: string;
  roomName?: string;
  doctorId?: string;
  doctorName?: string;
}

interface ResourceColumnProps {
  resource: {
    id: string;
    name: string;
    type?: string;
  };
  appointments: Appointment[];
  onAppointmentClick: (patientId: string) => void;
  onEditTime?: (appointmentId: string) => void;
  onCancelAppointment?: (appointmentId: string) => void;
}

const ResourceColumn: React.FC<ResourceColumnProps> = ({ resource, appointments, onAppointmentClick, onEditTime, onCancelAppointment }) => {
  const isUnassigned = resource.type === 'unassigned';

  return (
    <Card
      style={{
        height: '100%',
        backgroundColor: isUnassigned ? '#fff2e6' : '#f7f7f7',
        border: isUnassigned ? '2px dashed #ff7a00' : '1px solid #d9d9d9'
      }}
      styles={{ body: { padding: 8, height: '100%', overflowY: 'auto' } }}
    >
      <Title
        level={5}
        style={{
          textAlign: 'center',
          marginBottom: 16,
          color: isUnassigned ? '#ff7a00' : 'inherit'
        }}
      >
        {resource.name}
        {isUnassigned && appointments.length > 0 && (
          <div style={{ fontSize: '12px', fontWeight: 'normal', color: '#ff4d4f' }}>
            ({appointments.length} cần phân bác sĩ)
          </div>
        )}
      </Title>
      {appointments.map(app => (
        <AppointmentCard
          key={app.id}
          appointment={app}
          onClick={onAppointmentClick}
          onEditTime={onEditTime}
          onCancel={onCancelAppointment}
        />
      ))}
    </Card>
  );
};

export default ResourceColumn;