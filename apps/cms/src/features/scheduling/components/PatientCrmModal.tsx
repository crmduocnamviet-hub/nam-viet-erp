
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
import { UserOutlined, SaveOutlined, CalendarOutlined, HistoryOutlined, EditOutlined } from '@ant-design/icons';
import {
  getProfileById,
  updateProfileNotes,
  getAppointmentsByPatientId,
  getPatientMedicalHistory,
} from '@nam-viet-erp/services';
import dayjs from 'dayjs';
import { useDebounce } from '@nam-viet-erp/shared-components';
import { getErrorMessage } from '../../../types/error';
import { useNavigate } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { TextArea } = Input;

const getStatusColor = (status: string) => {
  const colorMap: Record<string, string> = {
    'Chưa xác nhận': 'default',
    'Đã xác nhận': 'blue',
    'Đã check-in': 'green',
    'Đang khám': 'gold',
    'Đã hoàn tất/Chờ thanh toán': 'purple',
    'Hủy/Không đến': 'red',
  };
  return colorMap[status] || 'default';
};

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
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any | null>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [serviceHistory, setServiceHistory] = useState<any[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const debouncedNotes = useDebounce(notes, 500);

  useEffect(() => {
    if (open && patientId) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const [profileRes, appointmentsRes, serviceHistoryRes] = await Promise.all([
            getProfileById(patientId),
            getAppointmentsByPatientId(patientId),
            getPatientMedicalHistory(patientId),
          ]);

          if (profileRes.error) throw profileRes.error;
          if (appointmentsRes.error) throw appointmentsRes.error;
          if (serviceHistoryRes.error) throw serviceHistoryRes.error;

          setProfile(profileRes.data);
          setAppointments(appointmentsRes.data || []);
          setServiceHistory(serviceHistoryRes.data || []);
          setNotes(profileRes.data?.receptionist_notes || '');
        } catch (error: unknown) {
          notification.error({
            message: 'Lỗi tải dữ liệu bệnh nhân',
            description: getErrorMessage(error),
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
      setServiceHistory([]);
      setNotes('');
    }
  }, [open, patientId, notification]);

  const handleSaveNotes = async () => {
    if (!patientId) return;
    setIsSaving(true);
    try {
      const { error } = await updateProfileNotes(patientId, debouncedNotes);
      if (error) throw error;
      notification?.success({ message: 'Đã lưu ghi chú!' });
    } catch (error: unknown) {
      notification.error({
        message: 'Lỗi lưu ghi chú',
        description: getErrorMessage(error),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditPatient = () => {
    if (patientId) {
      onClose(); // Close the patient profile modal
      navigate(`/patients/${patientId}`); // Navigate to patient detail page
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
                <Text type="secondary">{profile.phone_number}</Text>
                <div style={{ marginTop: 16 }}>
                  <Button
                    type="primary"
                    icon={<EditOutlined />}
                    onClick={handleEditPatient}
                    size="small"
                    style={{ width: '100%' }}
                  >
                    Chỉnh sửa thông tin
                  </Button>
                </div>
              </div>

              <div style={{ marginTop: 16 }}>
                <Descriptions
                  bordered
                  column={1}
                  size="small"
                  style={{
                    backgroundColor: '#fafafa',
                    border: '1px solid #f0f0f0',
                    borderRadius: 8
                  }}
                >
                  <Descriptions.Item label="📅 Ngày sinh">
                    <Text strong>
                      {profile.date_of_birth
                        ? dayjs(profile.date_of_birth).format('DD/MM/YYYY')
                        : <Text type="secondary">Chưa cập nhật</Text>}
                    </Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="👤 Giới tính">
                    <Text strong>
                      {profile.gender ? (
                        profile.gender === 'Nam' ? '👨 Nam' :
                        profile.gender === 'Nữ' ? '👩 Nữ' : '🤷 Khác'
                      ) : <Text type="secondary">Chưa cập nhật</Text>}
                    </Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="🏠 Địa chỉ">
                    <Text>
                      {profile.address || <Text type="secondary">Chưa cập nhật</Text>}
                    </Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="⚠️ Dị ứng">
                    <Text>
                      {profile.allergy_notes ? (
                        <Text style={{ color: '#ff4d4f' }}>{profile.allergy_notes}</Text>
                      ) : (
                        <Text type="secondary">Không có</Text>
                      )}
                    </Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="🏥 Bệnh mãn tính">
                    <Text>
                      {profile.chronic_diseases ? (
                        <Text style={{ color: '#faad14' }}>{profile.chronic_diseases}</Text>
                      ) : (
                        <Text type="secondary">Không có</Text>
                      )}
                    </Text>
                  </Descriptions.Item>
                </Descriptions>
              </div>
            </Col>
            <Col span={16}>
              <Tabs defaultActiveKey="1">
                <TabPane
                  tab={<><CalendarOutlined /> Lịch sử Hẹn</>}
                  key="1"
                >
                  <List
                    dataSource={appointments}
                    renderItem={(item) => (
                      <List.Item
                        style={{
                          border: '1px solid #f0f0f0',
                          borderRadius: 8,
                          marginBottom: 8,
                          padding: 16
                        }}
                      >
                        <List.Item.Meta
                          avatar={<CalendarOutlined style={{ fontSize: 16, color: '#1890ff' }} />}
                          title={
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span>{dayjs(item.appointment_time).format('DD/MM/YYYY HH:mm')}</span>
                              <Tag color={getStatusColor(item.status)}>{item.status}</Tag>
                            </div>
                          }
                          description={
                            <div>
                              <div><strong>Dịch vụ:</strong> {item.service || 'N/A'}</div>
                              {item.note && (
                                <div style={{ marginTop: 8, padding: 8, backgroundColor: '#f6f6f6', borderRadius: 4 }}>
                                  <strong>Ghi chú:</strong> {item.note}
                                </div>
                              )}
                            </div>
                          }
                        />
                      </List.Item>
                    )}
                  />
                </TabPane>
                <TabPane
                  tab={<><HistoryOutlined /> Lịch sử Sử dụng Dịch vụ</>}
                  key="2"
                >
                  <List
                    dataSource={serviceHistory}
                    renderItem={(item) => (
                      <List.Item
                        style={{
                          border: '1px solid #f0f0f0',
                          borderRadius: 8,
                          marginBottom: 8,
                          padding: 16
                        }}
                      >
                        <List.Item.Meta
                          avatar={<HistoryOutlined style={{ fontSize: 16, color: '#52c41a' }} />}
                          title={
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span>{item.services?.name || 'Dịch vụ không xác định'}</span>
                              {item.services?.price && (
                                <Text strong style={{ color: '#52c41a' }}>
                                  {new Intl.NumberFormat('vi-VN', {
                                    style: 'currency',
                                    currency: 'VND'
                                  }).format(item.services.price)}
                                </Text>
                              )}
                            </div>
                          }
                          description={
                            <div>
                              <div>
                                <strong>Ngày sử dụng:</strong> {
                                  item.appointments?.appointment_time
                                    ? dayjs(item.appointments.appointment_time).format('DD/MM/YYYY HH:mm')
                                    : dayjs(item.created_at).format('DD/MM/YYYY HH:mm')
                                }
                              </div>
                              {item.quantity && <div><strong>Số lượng:</strong> {item.quantity}</div>}
                              {item.notes && (
                                <div style={{ marginTop: 8, padding: 8, backgroundColor: '#f6f6f6', borderRadius: 4 }}>
                                  <strong>Ghi chú:</strong> {item.notes}
                                </div>
                              )}
                            </div>
                          }
                        />
                      </List.Item>
                    )}
                  />
                </TabPane>
                <TabPane
                  tab={<><EditOutlined /> Ghi chú Lễ tân</>}
                  key="3"
                >
                  <div style={{ background: '#f9f9f9', padding: 16, borderRadius: 8, marginBottom: 16 }}>
                    <Paragraph style={{ margin: 0, color: '#666' }}>
                      📝 Ghi lại các thông tin phi y tế quan trọng (ví dụ: sở thích,
                      lưu ý khi giao tiếp, người nhà cần liên hệ...).
                    </Paragraph>
                  </div>
                  <TextArea
                    rows={12}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Nhập ghi chú về bệnh nhân..."
                    style={{ borderRadius: 8 }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Ghi chú sẽ được tự động lưu sau 500ms
                    </Text>
                    <Button
                      type="primary"
                      icon={<SaveOutlined />}
                      loading={isSaving}
                      onClick={handleSaveNotes}
                      disabled={notes === (profile?.receptionist_notes || '')}
                    >
                      Lưu ghi chú
                    </Button>
                  </div>
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
