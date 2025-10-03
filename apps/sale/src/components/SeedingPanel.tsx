import React, { useState } from 'react';
import { Card, Button, Space, Typography, App, List, Tag } from 'antd';
import {
  UserOutlined,
  MedicineBoxOutlined,
  CustomerServiceOutlined,
  PlusOutlined,
  DeleteOutlined,
  EyeOutlined
} from '@ant-design/icons';
import {
  seedDoctors,
  seedEmployees,
  clearEmployees,
  getAllDoctors,
  sampleDoctors,
  samplePharmacists,
  sampleReceptionists
} from '@nam-viet-erp/services';

const { Title, Text } = Typography;

const SeedingPanel: React.FC = () => {
  const { notification } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [showDoctors, setShowDoctors] = useState(false);

  const handleSeedDoctors = async () => {
    try {
      setLoading(true);
      const result = await seedDoctors();

      if (result.success) {
        notification?.success({
          message: 'Thành công!',
          description: `Đã tạo ${result.count || sampleDoctors.length} bác sĩ mẫu`,
        });
      } else {
        notification.warning({
          message: 'Thông báo',
          description: result.message || 'Dữ liệu bác sĩ đã tồn tại',
        });
      }
    } catch {
      notification.error({
        message: 'Lỗi!',
        description: 'Không thể tạo dữ liệu bác sĩ mẫu',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSeedAllEmployees = async () => {
    try {
      setLoading(true);
      const result = await seedEmployees();

      if (result.success) {
        notification?.success({
          message: 'Thành công!',
          description: `Đã tạo ${result.count} nhân viên mẫu (bác sĩ, dược sĩ, lễ tân)`,
        });
      } else {
        notification.warning({
          message: 'Thông báo',
          description: result.message || 'Dữ liệu nhân viên đã tồn tại',
        });
      }
    } catch {
      notification.error({
        message: 'Lỗi!',
        description: 'Không thể tạo dữ liệu nhân viên mẫu',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClearEmployees = async () => {
    try {
      setLoading(true);
      const result = await clearEmployees();

      if (result.success) {
        notification?.success({
          message: 'Thành công!',
          description: 'Đã xóa tất cả dữ liệu nhân viên',
        });
        setDoctors([]);
        setShowDoctors(false);
      } else {
        notification.error({
          message: 'Lỗi!',
          description: 'Không thể xóa dữ liệu nhân viên',
        });
      }
    } catch {
      notification.error({
        message: 'Lỗi!',
        description: 'Không thể xóa dữ liệu nhân viên',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleShowDoctors = async () => {
    try {
      setLoading(true);
      const result = await getAllDoctors();

      if (result.success && result.data) {
        setDoctors(result.data);
        setShowDoctors(true);
        notification.info({
          message: 'Thông tin',
          description: `Tìm thấy ${result.data.length} bác sĩ trong hệ thống`,
        });
      } else {
        notification.warning({
          message: 'Thông báo',
          description: 'Không tìm thấy bác sĩ nào trong hệ thống',
        });
      }
    } catch {
      notification.error({
        message: 'Lỗi!',
        description: 'Không thể tải danh sách bác sĩ',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <Title level={3}>🌱 Tạo Dữ Liệu Mẫu - Nhân Viên</Title>
        <Text type="secondary">
          Sử dụng các công cụ dưới đây để tạo dữ liệu mẫu cho hệ thống hoặc xem dữ liệu hiện có.
        </Text>

        <div style={{ marginTop: 24 }}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>

            {/* Seeding Actions */}
            <Card size="small" title="Tạo Dữ Liệu Mẫu">
              <Space wrap>
                <Button
                  type="primary"
                  icon={<UserOutlined />}
                  loading={loading}
                  onClick={handleSeedDoctors}
                >
                  Tạo {sampleDoctors.length} Bác Sĩ Mẫu
                </Button>

                <Button
                  icon={<PlusOutlined />}
                  loading={loading}
                  onClick={handleSeedAllEmployees}
                >
                  Tạo Tất Cả Nhân Viên ({sampleDoctors.length + samplePharmacists.length + sampleReceptionists.length})
                </Button>

                <Button
                  danger
                  icon={<DeleteOutlined />}
                  loading={loading}
                  onClick={handleClearEmployees}
                >
                  Xóa Tất Cả Nhân Viên
                </Button>
              </Space>
            </Card>

            {/* View Actions */}
            <Card size="small" title="Xem Dữ Liệu">
              <Space>
                <Button
                  icon={<EyeOutlined />}
                  loading={loading}
                  onClick={handleShowDoctors}
                >
                  Xem Danh Sách Bác Sĩ
                </Button>
              </Space>
            </Card>

            {/* Sample Data Preview */}
            <Card size="small" title="Dữ Liệu Mẫu Sẽ Được Tạo">
              <Space direction="vertical" style={{ width: '100%' }}>

                <div>
                  <Text strong><UserOutlined /> Bác Sĩ ({sampleDoctors.length}):</Text>
                  <List
                    size="small"
                    dataSource={sampleDoctors}
                    renderItem={(doctor) => (
                      <List.Item>
                        <Tag color="blue">{doctor.employee_code}</Tag>
                        {doctor.full_name}
                      </List.Item>
                    )}
                  />
                </div>

                <div>
                  <Text strong><MedicineBoxOutlined /> Dược Sĩ ({samplePharmacists.length}):</Text>
                  <List
                    size="small"
                    dataSource={samplePharmacists}
                    renderItem={(pharmacist) => (
                      <List.Item>
                        <Tag color="green">{pharmacist.employee_code}</Tag>
                        {pharmacist.full_name}
                      </List.Item>
                    )}
                  />
                </div>

                <div>
                  <Text strong><CustomerServiceOutlined /> Lễ Tân ({sampleReceptionists.length}):</Text>
                  <List
                    size="small"
                    dataSource={sampleReceptionists}
                    renderItem={(receptionist) => (
                      <List.Item>
                        <Tag color="orange">{receptionist.employee_code}</Tag>
                        {receptionist.full_name}
                      </List.Item>
                    )}
                  />
                </div>
              </Space>
            </Card>

            {/* Current Doctors List */}
            {showDoctors && (
              <Card size="small" title={`Bác Sĩ Hiện Có (${doctors.length})`}>
                <List
                  dataSource={doctors}
                  renderItem={(doctor) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<UserOutlined style={{ color: '#1890ff' }} />}
                        title={doctor.full_name}
                        description={
                          <Space>
                            <Tag color="blue">{doctor.employee_code}</Tag>
                            <Tag color={doctor.is_active ? 'green' : 'red'}>
                              {doctor.is_active ? 'Hoạt động' : 'Không hoạt động'}
                            </Tag>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              </Card>
            )}

          </Space>
        </div>
      </Card>
    </div>
  );
};

const SeedingPanelWrapper: React.FC = () => (
  <App>
    <SeedingPanel />
  </App>
);

export default SeedingPanelWrapper;