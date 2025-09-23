import React, { useState } from 'react';
import { Card, Typography, Avatar, Button, Space, Popconfirm } from 'antd';
import { UserOutlined, EditOutlined, DeleteOutlined, ClockCircleOutlined } from '@ant-design/icons';

const { Text } = Typography;

// Định nghĩa các trạng thái có thể có của cuộc hẹn
type AppointmentStatus = 'Chưa xác nhận' | 'Đã xác nhận' | 'Đã check-in' | 'Đang khám' | 'Đã hoàn tất/Chờ thanh toán' | 'Hủy/Không đến';

interface Appointment {
  id: string;
  appointmentId: string;
  patientName: string;
  time: string;
  type: 'new' | 'follow-up';
  status: AppointmentStatus;
  patientId: string;
  roomId?: string;
  roomName?: string;
  doctorId?: string;
  doctorName?: string;
}

interface AppointmentCardProps {
  appointment: Appointment;
  onClick: (patientId: string) => void;
  onEditTime?: (appointmentId: string) => void;
  onCancel?: (appointmentId: string) => void;
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

const AppointmentCard: React.FC<AppointmentCardProps> = ({ appointment, onClick, onEditTime, onCancel }) => {
  const [showActions, setShowActions] = useState(false);

  const cardStyle: React.CSSProperties = {
    marginBottom: 8,
    backgroundColor: statusColors[appointment.status] || '#ffffff',
    border: showActions ? '2px solid #1890ff' : '1px solid #f0f0f0',
    transition: 'all 0.3s ease',
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent card click when clicking action buttons
    if ((e.target as HTMLElement).closest('.appointment-actions')) {
      e.stopPropagation();
      return;
    }
    onClick(appointment.patientId);
  };

  const handleEditTime = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEditTime) {
      onEditTime(appointment.appointmentId);
    }
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onCancel) {
      onCancel(appointment.appointmentId);
    }
  };

  // Only show edit/cancel for appointments that can be modified
  const canModify = !['Hủy/Không đến', 'Đã hoàn tất/Chờ thanh toán'].includes(appointment.status);

  return (
    <Card
      hoverable
      style={cardStyle}
      bodyStyle={{ padding: 12 }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      onClick={handleCardClick}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar icon={<UserOutlined />} />
          <div style={{ marginLeft: 8 }}>
            <Text strong>{appointment.patientName}</Text>
            <br />
            <Text type="secondary">
              <ClockCircleOutlined style={{ marginRight: 4 }} />
              {appointment.time}
            </Text>
            {appointment.doctorName && (
              <>
                <br />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  👨‍⚕️ {appointment.doctorName}
                </Text>
              </>
            )}
          </div>
        </div>

        {showActions && canModify && (
          <div className="appointment-actions" style={{ opacity: showActions ? 1 : 0, transition: 'opacity 0.3s' }}>
            <Space direction="vertical" size="small">
              {onEditTime && (
                <Button
                  type="text"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={handleEditTime}
                  style={{ color: '#1890ff', padding: '2px 4px' }}
                  title="Sửa giờ hẹn"
                />
              )}
              {onCancel && (
                <Popconfirm
                  title="Hủy lịch hẹn"
                  description="Bạn có chắc muốn hủy lịch hẹn này?"
                  onConfirm={handleCancel}
                  okText="Hủy lịch"
                  cancelText="Không"
                  placement="left"
                >
                  <Button
                    type="text"
                    size="small"
                    icon={<DeleteOutlined />}
                    style={{ color: '#ff4d4f', padding: '2px 4px' }}
                    title="Hủy lịch hẹn"
                  />
                </Popconfirm>
              )}
            </Space>
          </div>
        )}
      </div>
    </Card>
  );
};

export default AppointmentCard;