import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Input,
  Space,
  Tag,
  Typography,
  App,
  Row,
  Col,
  Modal,
  Form,
  Select,
  Statistic,
  Popconfirm,
  Avatar,
  Tooltip,
} from 'antd';
import {
  UserOutlined,
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  MedicineBoxOutlined,
  CustomerServiceOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from '@nam-viet-erp/services';

const { Title, Text } = Typography;
const { Search } = Input;

interface EmployeeFormData {
  full_name: string;
  employee_code: string;
  role_name: string;
  is_active: boolean;
}

const EmployeesPage: React.FC = () => {
  const { notification } = App.useApp();
  const [employees, setEmployees] = useState<IEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<IEmployee | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    inventoryStaff: 0,
    medicalStaff: 0,
    deliveryStaff: 0,
    salesStaff: 0,
    active: 0
  });
  const [form] = Form.useForm();

  useEffect(() => {
    loadEmployees();
  }, [searchTerm, selectedRole]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const { data, error } = await getEmployees({
        search: searchTerm,
        roleName: selectedRole !== 'all' ? selectedRole : undefined,
        limit: 100,
      });

      if (error) {
        notification.error({
          message: 'Lỗi tải dữ liệu',
          description: error.message,
        });
      } else {
        setEmployees(data || []);
        calculateStats(data || []);
      }
    } catch (error) {
      notification.error({
        message: 'Lỗi hệ thống',
        description: 'Không thể tải danh sách nhân viên',
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (employeeData: IEmployee[]) => {
    const total = employeeData.length;
    const inventoryStaff = employeeData.filter(emp => emp.role_name === 'inventory-staff').length;
    const medicalStaff = employeeData.filter(emp => emp.role_name === 'medical-staff').length;
    const deliveryStaff = employeeData.filter(emp => emp.role_name === 'delivery-staff').length;
    const salesStaff = employeeData.filter(emp => emp.role_name === 'sales-staff').length;
    const active = employeeData.filter(emp => emp.is_active).length;

    setStats({
      total,
      inventoryStaff,
      medicalStaff,
      deliveryStaff,
      salesStaff,
      active
    });
  };

  const handleCreateEmployee = async (values: EmployeeFormData) => {
    try {
      const { error } = await createEmployee(values);

      if (error) {
        notification.error({
          message: 'Lỗi tạo nhân viên',
          description: error.message,
        });
      } else {
        notification?.success({
          message: 'Tạo nhân viên thành công!',
          description: `Đã tạo nhân viên ${values.full_name}`,
        });
        setIsModalOpen(false);
        form.resetFields();
        loadEmployees();
      }
    } catch (error) {
      notification.error({
        message: 'Lỗi hệ thống',
        description: 'Không thể tạo nhân viên mới',
      });
    }
  };

  const handleUpdateEmployee = async (values: EmployeeFormData) => {
    if (!editingEmployee) return;

    try {
      const { error } = await updateEmployee(editingEmployee.employee_id, values);

      if (error) {
        notification.error({
          message: 'Lỗi cập nhật nhân viên',
          description: error.message,
        });
      } else {
        notification?.success({
          message: 'Cập nhật nhân viên thành công!',
          description: `Đã cập nhật thông tin ${values.full_name}`,
        });
        setIsModalOpen(false);
        setEditingEmployee(null);
        form.resetFields();
        loadEmployees();
      }
    } catch (error) {
      notification.error({
        message: 'Lỗi hệ thống',
        description: 'Không thể cập nhật nhân viên',
      });
    }
  };

  const handleDeleteEmployee = async (employeeId: string, employeeName: string) => {
    try {
      const { error } = await deleteEmployee(employeeId);

      if (error) {
        notification.error({
          message: 'Lỗi xóa nhân viên',
          description: error.message,
        });
      } else {
        notification?.success({
          message: 'Xóa nhân viên thành công!',
          description: `Đã xóa nhân viên ${employeeName}`,
        });
        loadEmployees();
      }
    } catch (error) {
      notification.error({
        message: 'Lỗi hệ thống',
        description: 'Không thể xóa nhân viên',
      });
    }
  };

  const handleOpenModal = (employee?: IEmployee) => {
    if (employee) {
      setEditingEmployee(employee);
      form.setFieldsValue({
        full_name: employee.full_name,
        employee_code: employee.employee_code,
        role_name: employee.role_name,
        is_active: employee.is_active,
      });
    } else {
      setEditingEmployee(null);
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'BacSi':
        return <UserOutlined style={{ color: '#1890ff' }} />;
      case 'DuocSi':
        return <MedicineBoxOutlined style={{ color: '#52c41a' }} />;
      case 'LeTan':
        return <CustomerServiceOutlined style={{ color: '#fa8c16' }} />;
      case 'inventory-staff':
        return <MedicineBoxOutlined style={{ color: '#722ed1' }} />;
      case 'medical-staff':
        return <UserOutlined style={{ color: '#13c2c2' }} />;
      case 'delivery-staff':
        return <CustomerServiceOutlined style={{ color: '#eb2f96' }} />;
      case 'sales-staff':
        return <UserOutlined style={{ color: '#f5222d' }} />;
      default:
        return <UserOutlined />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'BacSi':
        return 'blue';
      case 'DuocSi':
        return 'green';
      case 'LeTan':
        return 'orange';
      case 'inventory-staff':
        return 'purple';
      case 'medical-staff':
        return 'cyan';
      case 'delivery-staff':
        return 'magenta';
      case 'sales-staff':
        return 'red';
      default:
        return 'default';
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'BacSi':
        return 'Bác sĩ';
      case 'DuocSi':
        return 'Dược sĩ';
      case 'LeTan':
        return 'Lễ tân';
      case 'inventory-staff':
        return 'Nhân Viên Kho';
      case 'medical-staff':
        return 'Nhân Viên Y Tế';
      case 'delivery-staff':
        return 'Nhân Viên Giao Hàng';
      case 'sales-staff':
        return 'Nhân Viên Kinh Doanh';
      default:
        return role;
    }
  };

  const columns = [
    {
      title: 'Nhân viên',
      key: 'employee',
      render: (record: IEmployee) => (
        <Space>
          <Avatar size={40} icon={getRoleIcon(record.role_name)} />
          <div>
            <Text strong>{record.full_name}</Text>
            <br />
            <Text type="secondary">{record.employee_code}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Vai trò',
      dataIndex: 'role_name',
      key: 'role_name',
      render: (role: string) => (
        <Tag color={getRoleColor(role)} icon={getRoleIcon(role)}>
          {getRoleName(role)}
        </Tag>
      ),
      filters: [
        { text: 'Bác sĩ', value: 'BacSi' },
        { text: 'Dược sĩ', value: 'DuocSi' },
        { text: 'Lễ tân', value: 'LeTan' },
        { text: 'Nhân Viên Kho', value: 'inventory-staff' },
        { text: 'Nhân Viên Y Tế', value: 'medical-staff' },
        { text: 'Nhân Viên Giao Hàng', value: 'delivery-staff' },
        { text: 'Nhân Viên Kinh Doanh', value: 'sales-staff' },
      ],
      onFilter: (value: any, record: IEmployee) => record.role_name === value,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'success' : 'error'}>
          {isActive ? 'Hoạt động' : 'Không hoạt động'}
        </Tag>
      ),
      filters: [
        { text: 'Hoạt động', value: true },
        { text: 'Không hoạt động', value: false },
      ],
      onFilter: (value: any, record: IEmployee) => record.is_active === value,
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (record: IEmployee) => (
        <Space>
          <Tooltip title="Chỉnh sửa">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleOpenModal(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Xóa nhân viên"
            description={`Bạn có chắc chắn muốn xóa nhân viên ${record.full_name}?`}
            onConfirm={() => handleDeleteEmployee(record.employee_id, record.full_name)}
            okText="Xóa"
            cancelText="Hủy"
            okType="danger"
          >
            <Tooltip title="Xóa">
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Row style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Title level={2} style={{ margin: 0 }}>
            <UserOutlined style={{ marginRight: 8 }} />
            Quản lý Nhân viên
          </Title>
        </Col>
        <Col span={12} style={{ textAlign: 'right' }}>
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={() => handleOpenModal()}
            style={{
              background: 'linear-gradient(45deg, #1890ff, #40a9ff)',
              border: 'none',
            }}
          >
            Thêm nhân viên mới
          </Button>
        </Col>
      </Row>

      {/* Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={6} md={4}>
          <Card>
            <Statistic
              title="Tổng số nhân viên"
              value={stats.total}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} md={4}>
          <Card>
            <Statistic
              title="NV Kho"
              value={stats.inventoryStaff}
              prefix={<MedicineBoxOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} md={4}>
          <Card>
            <Statistic
              title="NV Y Tế"
              value={stats.medicalStaff}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6} md={4}>
          <Card>
            <Statistic
              title="NV Giao Hàng"
              value={stats.deliveryStaff}
              prefix={<CustomerServiceOutlined />}
              valueStyle={{ color: '#eb2f96' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} md={4}>
          <Card>
            <Statistic
              title="NV Kinh Doanh"
              value={stats.salesStaff}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} md={4}>
          <Card>
            <Statistic
              title="Đang hoạt động"
              value={stats.active}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Search
              placeholder="Tìm theo tên hoặc mã nhân viên..."
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              onSearch={setSearchTerm}
            />
          </Col>
          <Col xs={24} md={12}>
            <Select
              placeholder="Lọc theo vai trò"
              size="large"
              style={{ width: '100%' }}
              value={selectedRole}
              onChange={setSelectedRole}
            >
              <Select.Option value="all">Tất cả vai trò</Select.Option>
              <Select.Option value="BacSi">🩺 Bác sĩ</Select.Option>
              <Select.Option value="DuocSi">💊 Dược sĩ</Select.Option>
              <Select.Option value="LeTan">📞 Lễ tân</Select.Option>
              <Select.Option value="inventory-staff">📦 Nhân Viên Kho</Select.Option>
              <Select.Option value="medical-staff">🏥 Nhân Viên Y Tế</Select.Option>
              <Select.Option value="delivery-staff">🚚 Nhân Viên Giao Hàng</Select.Option>
              <Select.Option value="sales-staff">💼 Nhân Viên Kinh Doanh</Select.Option>
            </Select>
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={employees}
          rowKey="employee_id"
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `Tổng ${total} nhân viên`,
          }}
        />
      </Card>

      {/* Modal */}
      <Modal
        title={
          <Space>
            <UserAddOutlined />
            {editingEmployee ? 'Chỉnh sửa nhân viên' : 'Thêm nhân viên mới'}
          </Space>
        }
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingEmployee(null);
          form.resetFields();
        }}
        onOk={form.submit}
        width={600}
        okText={editingEmployee ? 'Cập nhật' : 'Tạo mới'}
        cancelText="Hủy"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={editingEmployee ? handleUpdateEmployee : handleCreateEmployee}
          style={{ marginTop: 16 }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="full_name"
                label="Họ và tên"
                rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
              >
                <Input placeholder="Nhập họ và tên" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="employee_code"
                label="Mã nhân viên"
                rules={[
                  { required: true, message: 'Vui lòng nhập mã nhân viên' },
                  { pattern: /^[A-Z0-9]+$/, message: 'Mã nhân viên chỉ chứa chữ hoa và số' }
                ]}
              >
                <Input placeholder="VD: DOC001, PHAR001" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="role_name"
                label="Vai trò"
                rules={[{ required: true, message: 'Vui lòng chọn vai trò' }]}
              >
                <Select placeholder="Chọn vai trò">
                  <Select.Option value="BacSi">🩺 Bác sĩ</Select.Option>
                  <Select.Option value="DuocSi">💊 Dược sĩ</Select.Option>
                  <Select.Option value="LeTan">📞 Lễ tân</Select.Option>
                  <Select.Option value="inventory-staff">📦 Nhân Viên Kho</Select.Option>
                  <Select.Option value="medical-staff">🏥 Nhân Viên Y Tế</Select.Option>
                  <Select.Option value="delivery-staff">🚚 Nhân Viên Giao Hàng</Select.Option>
                  <Select.Option value="sales-staff">💼 Nhân Viên Kinh Doanh</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="is_active"
                label="Trạng thái"
                initialValue={true}
              >
                <Select>
                  <Select.Option value={true}>Hoạt động</Select.Option>
                  <Select.Option value={false}>Không hoạt động</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

const EmployeesPageWrapper: React.FC = () => (
  <App>
    <EmployeesPage />
  </App>
);

export default EmployeesPageWrapper;