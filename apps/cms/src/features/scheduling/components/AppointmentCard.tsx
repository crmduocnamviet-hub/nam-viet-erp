import React from 'react';
import { Card, Typography, Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';

const { Text } = Typography;

// Định nghĩa các trạng thái có thể có của cuộc hẹn
type AppointmentStatus = 'Chưa xác nhận' | 'Đã xác nhận' | 'Đã check-in' | 'Đang khám' | 'Đã hoàn tất/Chờ thanh toán' | 'Hủy/Không đến';

interface Appointment {
  id: string;
  patientName: string;
  time: string;
  type: 'new' | 'follow-up';
  status: AppointmentStatus; // Thêm trạng thái vào interface
  patientId: string; // Thêm ID bệnh nhân
}

interface AppointmentCardProps {
  appointment: Appointment;
  onClick: (patientId: string) => void; // Thêm prop onClick
}

// Bảng màu tương ứng với từng trạng thái
const statusColors: Record<AppointmentStatus, string> = {
  'Chưa xác nhận': '#f0f0f0', // Xám
  'Đã xác nhận': '#e6f7ff',   // Xanh Dương nhạt
  'Đã check-in': '#f6ffed',   // Xanh Lá nhạt
  'Đang khám': '#fffbe6',      // Vàng nhạt
  'Đã hoàn tất/Chờ thanh toán': '#f9f0ff', // Tím nhạt
  'Hủy/Không đến': '#fff1f0',   // Đỏ nhạt
};

const AppointmentCard: React.FC<AppointmentCardProps> = ({ appointment, onClick }) => {
  const cardStyle: React.CSSProperties = {
    marginBottom: 8,
    backgroundColor: statusColors[appointment.status] || '#ffffff', // Lấy màu nền từ trạng thái
  };

  return (
    <Card
      hoverable
      style={cardStyle}
      bodyStyle={{ padding: 12 }}
      onClick={() => onClick(appointment.patientId)} // Thêm sự kiện onClick
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Avatar icon={<UserOutlined />} />
        <div style={{ marginLeft: 8 }}>
          <Text strong>{appointment.patientName}</Text>
          <br />
          <Text type="secondary">Lúc: {appointment.time}</Text>
        </div>
      </div>
    </Card>
  );
};

export default AppointmentCard;
