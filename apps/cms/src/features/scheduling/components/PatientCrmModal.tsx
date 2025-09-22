
import React, { useState, useEffect } from 'react';
import {
  Modal,
  Row,
  Col,
  Avatar,
  Typography,
  Tabs,
  List,
  Input,
  Button,
  Spin,
  Empty,
  App,
  Tag,
  Descriptions,
} from 'antd';
import { UserOutlined, SaveOutlined } from '@ant-design/icons';
import {
  getProfileById,
  updateProfileNotes,
  getAppointmentsByPatientId,
} from '@nam-viet-erp/services';
import dayjs from 'dayjs';
import { useDebounce } from '../../../hooks/useDebounce';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { TextArea } = Input;

interface PatientCrmModalProps {
  open: boolean;
  onClose: () => void;
  patientId: string | null;
}

const PatientCrmModal: React.FC<PatientCrmModalProps> = ({
  open,
  onClose,
  patientId,
}) => {
  const { notification } = App.useApp();
  const [profile, setProfile] = useState<any | null>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const debouncedNotes = useDebounce(notes, 500);

  useEffect(() => {
    if (open && patientId) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const [profileRes, appointmentsRes] = await Promise.all([
            getProfileById(patientId),
            getAppointmentsByPatientId(patientId),
          ]);

          if (profileRes.error) throw profileRes.error;
          if (appointmentsRes.error) throw appointmentsRes.error;

          setProfile(profileRes.data);
          setAppointments(appointmentsRes.data || []);
          setNotes(profileRes.data?.receptionist_notes || '');
        } catch (error: any) {
          notification.error({
            message: 'Lỗi tải dữ liệu bệnh nhân',
            description: error.message,
          });
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    } else {
      // Reset state when modal is closed
      setProfile(null);
      setAppointments([]);
      setNotes('');
    }
  }, [open, patientId, notification]);

  const handleSaveNotes = async () => {
    if (!patientId) return;
    setIsSaving(true);
    try {
      const { error } = await updateProfileNotes(patientId, debouncedNotes);
      if (error) throw error;
      notification.success({ message: 'Đã lưu ghi chú!' });
    } catch (error: any) {
      notification.error({
        message: 'Lỗi lưu ghi chú',
        description: error.message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={800}
      title="Hồ sơ Bệnh nhân"
      destroyOnClose
    >
      <Spin spinning={loading}>
        {profile ? (
          <Row gutter={24}>
            <Col span={8}>
              <div style={{ textAlign: 'center' }}>
                <Avatar
                  size={128}
                  src={profile.avatar_url}
                  icon={<UserOutlined />}
                />
                <Title level={4} style={{ marginTop: 8 }}>
                  {profile.full_name}
                </Title>
                <Text type="secondary">{profile.phone}</Text>
              </div>
              <Descriptions bordered column={1} style={{ marginTop: 16 }}>
                <Descriptions.Item label="Ngày sinh">
                  {profile.date_of_birth
                    ? dayjs(profile.date_of_birth).format('DD/MM/YYYY')
                    : 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Giới tính">
                  {profile.gender || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Địa chỉ">
                  {profile.address || 'N/A'}
                </Descriptions.Item>
              </Descriptions>
            </Col>
            <Col span={16}>
              <Tabs defaultActiveKey="1">
                <TabPane tab="Lịch sử Hẹn" key="1">
                  <List
                    dataSource={appointments}
                    renderItem={(item) => (
                      <List.Item>
                        <List.Item.Meta
                          title={`Lịch hẹn ngày ${dayjs(
                            item.appointment_time
                          ).format('DD/MM/YYYY HH:mm')}`}
                          description={`Dịch vụ: ${item.service || 'N/A'}`}
                        />
                        <Tag>{item.status}</Tag>
                      </List.Item>
                    )}
                  />
                </TabPane>
                <TabPane tab="Ghi chú Lễ tân" key="2">
                  <Paragraph>
                    Ghi lại các thông tin phi y tế quan trọng (ví dụ: sở thích,
                    lưu ý khi giao tiếp, người nhà cần liên hệ...).
                  </Paragraph>
                  <TextArea
                    rows={10}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Nhập ghi chú..."
                  />
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    loading={isSaving}
                    onClick={handleSaveNotes}
                    style={{ marginTop: 16 }}
                    disabled={notes === (profile.receptionist_notes || '')}
                  >
                    Lưu ghi chú
                  </Button>
                </TabPane>
              </Tabs>
            </Col>
          </Row>
        ) : (
          <Empty description="Không tìm thấy thông tin bệnh nhân." />
        )}
      </Spin>
    </Modal>
  );
};

export default PatientCrmModal;
