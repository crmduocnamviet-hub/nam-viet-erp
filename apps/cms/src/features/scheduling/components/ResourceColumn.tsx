import React from 'react';
import { Card, Typography } from 'antd';
import AppointmentCard from './AppointmentCard';

const { Title } = Typography;

interface Appointment {
  id: string;
  patientName: string;
  time: string;
  type: 'new' | 'follow-up';
  status: string;
  patientId: string;
}

interface ResourceColumnProps {
  resource: {
    id: string;
    name: string;
  };
  appointments: Appointment[];
  onAppointmentClick: (patientId: string) => void;
}

const ResourceColumn: React.FC<ResourceColumnProps> = ({ resource, appointments, onAppointmentClick }) => {
  return (
    <Card
      style={{ height: '100%', backgroundColor: '#f7f7f7' }}
      bodyStyle={{ padding: 8, height: '100%', overflowY: 'auto' }}
    >
      <Title level={5} style={{ textAlign: 'center', marginBottom: 16 }}>
        {resource.name}
      </Title>
      {appointments.map(app => (
        <AppointmentCard key={app.id} appointment={app} onClick={onAppointmentClick} />
      ))}
    </Card>
  );
};

export default ResourceColumn;
