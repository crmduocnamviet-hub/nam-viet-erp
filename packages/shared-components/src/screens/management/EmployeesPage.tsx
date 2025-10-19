import React, { useState, useEffect } from "react";
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
  Divider,
} from "antd";
import {
  UserOutlined,
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  MedicineBoxOutlined,
  CustomerServiceOutlined,
  UserAddOutlined,
} from "@ant-design/icons";
import {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  searchUsersForLinking,
  getUsers,
} from "@nam-viet-erp/services";

const { Title, Text } = Typography;
const { Search } = Input;

interface EmployeeFormData {
  full_name: string;
  employee_code: string;
  role_name: string;
  is_active: boolean;
  user_id?: string;
}

const EmployeesPage: React.FC = () => {
  const { notification } = App.useApp();
  const [employees, setEmployees] = useState<IEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<IEmployee | null>(
    null,
  );
  const [stats, setStats] = useState({
    total: 0,
    inventoryStaff: 0,
    medicalStaff: 0,
    deliveryStaff: 0,
    salesStaff: 0,
    active: 0,
  });
  const [form] = Form.useForm();
  const [userSearchResults, setUserSearchResults] = useState<IUserAccount[]>(
    [],
  );
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [users, setUsers] = useState<IUserAccount[]>([]);

  useEffect(() => {
    loadEmployees();
    loadUsers();
  }, [searchTerm, selectedRole]);

  const loadUsers = async () => {
    try {
      const { data, error } = await getUsers();
      if (error) {
        console.error("Error loading users:", error);
      } else {
        setUsers(data || []);
        // Check for orphaned user_id references
        checkOrphanedUserReferences(data || []);
      }
    } catch (error) {
      console.error("Error loading users:", error);
    }
  };

  // Check for employees with user_id that no longer exists
  const checkOrphanedUserReferences = (userList: IUserAccount[]) => {
    const userIds = userList.map((user) => user.id);
    const orphanedEmployees = employees.filter(
      (emp) => emp.user_id && !userIds.includes(emp.user_id),
    );

    if (orphanedEmployees.length > 0) {
      notification.warning({
        message: "Phát hiện liên kết tài khoản không hợp lệ",
        description: `${orphanedEmployees.length} nhân viên có liên kết tài khoản đã bị xóa. Bấm "Tự động sửa" để xóa liên kết không hợp lệ.`,
        duration: 10,
        btn: (
          <Button
            size="small"
            onClick={() => cleanupOrphanedReferences(orphanedEmployees)}
          >
            Tự động sửa
          </Button>
        ),
      });
    }
  };

  // Cleanup orphaned user_id references
  const cleanupOrphanedReferences = async (orphanedEmployees: IEmployee[]) => {
    try {
      let successCount = 0;
      let errorCount = 0;

      for (const employee of orphanedEmployees) {
        try {
          const { error } = await updateEmployee(employee.employee_id, {
            user_id: null,
          });
          if (error) {
            console.error(
              `Error cleaning up employee ${employee.employee_id}:`,
              error,
            );
            errorCount++;
          } else {
            successCount++;
          }
        } catch (err) {
          console.error(
            `Exception cleaning up employee ${employee.employee_id}:`,
            err,
          );
          errorCount++;
        }
      }

      if (successCount > 0) {
        notification.success({
          message: "Dọn dẹp liên kết thành công!",
          description: `Đã xóa ${successCount} liên kết tài khoản không hợp lệ.`,
        });
        loadEmployees(); // Reload to refresh the display
      }

      if (errorCount > 0) {
        notification.error({
          message: "Một số liên kết không thể dọn dẹp",
          description: `${errorCount} liên kết gặp lỗi khi xử lý.`,
        });
      }
    } catch (error) {
      notification.error({
        message: "Lỗi hệ thống",
        description: "Không thể dọn dẹp liên kết tài khoản.",
      });
    }
  };

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const { data, error } = await getEmployees({
        search: searchTerm,
        roleName: selectedRole !== "all" ? selectedRole : undefined,
        limit: 100,
      });

      if (error) {
        notification.error({
          message: "Lỗi tải dữ liệu",
          description: error.message,
        });
      } else {
        setEmployees(data || []);
        calculateStats(data || []);
      }
    } catch (error) {
      notification.error({
        message: "Lỗi hệ thống",
        description: "Không thể tải danh sách nhân viên",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (employeeData: IEmployee[]) => {
    const total = employeeData.length;
    const inventoryStaff = employeeData.filter(
      (emp) => emp.role_name === "inventory-staff",
    ).length;
    const medicalStaff = employeeData.filter(
      (emp) => emp.role_name === "medical-staff",
    ).length;
    const deliveryStaff = employeeData.filter(
      (emp) => emp.role_name === "delivery-staff",
    ).length;
    const salesStaff = employeeData.filter(
      (emp) => emp.role_name === "sales-staff",
    ).length;
    const active = employeeData.filter((emp) => emp.is_active).length;

    setStats({
      total,
      inventoryStaff,
      medicalStaff,
      deliveryStaff,
      salesStaff,
      active,
    });
  };

  const handleCreateEmployee = async (values: EmployeeFormData) => {
    try {
      // Remove user_id from employee creation data
      const { user_id, ...employeeData } = values;

      const { data: newEmployee, error } = await createEmployee(employeeData);
      if (error) {
        notification.error({
          message: "Lỗi tạo nhân viên",
          description: error.message,
        });
      } else {
        // Link user if selected
        if (user_id && newEmployee?.employee_id) {
          try {
            // Verify user still exists before linking
            const userExists = users.find((user) => user.id === user_id);
            if (userExists) {
              await updateEmployee(newEmployee.employee_id, {
                user_id: user_id || null,
              });
            } else {
              notification.warning({
                message: "Tài khoản không tồn tại",
                description:
                  "Tài khoản đã chọn không còn tồn tại. Nhân viên được tạo nhưng không liên kết tài khoản.",
              });
            }
          } catch (linkError) {
            console.error("Error linking user:", linkError);
            notification.error({
              message: "Lỗi liên kết tài khoản",
              description:
                "Không thể liên kết tài khoản. Nhân viên được tạo nhưng chưa có tài khoản đăng nhập.",
            });
          }
        }

        notification?.success({
          message: "Tạo nhân viên thành công!",
          description: `Đã tạo nhân viên ${values.full_name}`,
        });
        setIsModalOpen(false);
        form.resetFields();
        setUserSearchTerm("");
        setUserSearchResults([]);
        loadEmployees();
      }
    } catch (error) {
      notification.error({
        message: "Lỗi hệ thống",
        description: "Không thể tạo nhân viên mới",
      });
    }
  };

  const handleUpdateEmployee = async (values: EmployeeFormData) => {
    if (!editingEmployee) return;

    try {
      const { user_id, ...employeeData } = values;

      // Convert undefined to null for Supabase
      const updateData = {
        ...employeeData,
        user_id: user_id || null,
      };

      const { error } = await updateEmployee(
        editingEmployee.employee_id,
        updateData,
      );

      if (error) {
        notification.error({
          message: "Lỗi cập nhật nhân viên",
          description: error.message,
        });
      } else {
        notification?.success({
          message: "Cập nhật nhân viên thành công!",
          description: `Đã cập nhật thông tin ${values.full_name}`,
        });
        setIsModalOpen(false);
        setEditingEmployee(null);
        form.resetFields();
        setUserSearchTerm("");
        setUserSearchResults([]);
        loadEmployees();
      }
    } catch (error) {
      notification.error({
        message: "Lỗi hệ thống",
        description: "Không thể cập nhật nhân viên",
      });
    }
  };

  const handleDeleteEmployee = async (
    employeeId: string,
    employeeName: string,
  ) => {
    try {
      const { error } = await deleteEmployee(employeeId);

      if (error) {
        notification.error({
          message: "Lỗi xóa nhân viên",
          description: error.message,
        });
      } else {
        notification?.success({
          message: "Xóa nhân viên thành công!",
          description: `Đã xóa nhân viên ${employeeName}`,
        });
        loadEmployees();
      }
    } catch (error) {
      notification.error({
        message: "Lỗi hệ thống",
        description: "Không thể xóa nhân viên",
      });
    }
  };

  // Search users for linking
  const searchUsers = async (searchTerm: string) => {
    setUserSearchLoading(true);
    try {
      const { data, error } = await searchUsersForLinking(searchTerm);
      if (error) {
        console.error("Error searching users:", error);
        notification.error({
          message: "Lỗi tìm kiếm tài khoản",
          description: error.message,
        });
      } else {
        setUserSearchResults(data || []);
      }
    } catch (error) {
      console.error("Exception searching users:", error);
      notification.error({
        message: "Lỗi hệ thống",
        description: "Không thể tìm kiếm tài khoản",
      });
    } finally {
      setUserSearchLoading(false);
    }
  };

  // Handle user search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchUsers(userSearchTerm);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [userSearchTerm]);

  // Load users initially
  useEffect(() => {
    searchUsers(""); // Load all users initially
  }, []);

  // Also load users when modal opens
  useEffect(() => {
    if (isModalOpen) {
      searchUsers("");
    }
  }, [isModalOpen]);

  const handleOpenModal = (employee?: IEmployee) => {
    if (employee) {
      setEditingEmployee(employee);
      form.setFieldsValue({
        full_name: employee.full_name,
        employee_code: employee.employee_code,
        role_name: employee.role_name,
        is_active: employee.is_active,
        user_id: employee.user_id,
      });
    } else {
      setEditingEmployee(null);
      form.resetFields();
    }

    // Reset user search when opening modal
    setUserSearchTerm("");
    setUserSearchResults([]);

    setIsModalOpen(true);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "BacSi":
        return <UserOutlined style={{ color: "#1890ff" }} />;
      case "DuocSi":
        return <MedicineBoxOutlined style={{ color: "#52c41a" }} />;
      case "LeTan":
        return <CustomerServiceOutlined style={{ color: "#fa8c16" }} />;
      case "inventory-staff":
        return <MedicineBoxOutlined style={{ color: "#722ed1" }} />;
      case "medical-staff":
        return <UserOutlined style={{ color: "#13c2c2" }} />;
      case "delivery-staff":
        return <CustomerServiceOutlined style={{ color: "#eb2f96" }} />;
      case "sales-staff":
        return <UserOutlined style={{ color: "#f5222d" }} />;
      default:
        return <UserOutlined />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "BacSi":
        return "blue";
      case "DuocSi":
        return "green";
      case "LeTan":
        return "orange";
      case "inventory-staff":
        return "purple";
      case "medical-staff":
        return "cyan";
      case "delivery-staff":
        return "magenta";
      case "sales-staff":
        return "red";
      default:
        return "default";
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case "BacSi":
        return "Bác sĩ";
      case "DuocSi":
        return "Dược sĩ";
      case "LeTan":
        return "Lễ tân";
      case "inventory-staff":
        return "Nhân Viên Kho";
      case "medical-staff":
        return "Nhân Viên Y Tế";
      case "delivery-staff":
        return "Nhân Viên Giao Hàng";
      case "sales-staff":
        return "Nhân Viên Kinh Doanh";
      default:
        return role;
    }
  };

  const columns = [
    {
      title: "Nhân viên",
      key: "employee",
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
      title: "Vai trò",
      dataIndex: "role_name",
      key: "role_name",
      render: (role: string) => (
        <Tag color={getRoleColor(role)} icon={getRoleIcon(role)}>
          {getRoleName(role)}
        </Tag>
      ),
      filters: [
        { text: "Bác sĩ", value: "BacSi" },
        { text: "Dược sĩ", value: "DuocSi" },
        { text: "Lễ tân", value: "LeTan" },
        { text: "Nhân Viên Kho", value: "inventory-staff" },
        { text: "Nhân Viên Y Tế", value: "medical-staff" },
        { text: "Nhân Viên Giao Hàng", value: "delivery-staff" },
        { text: "Nhân Viên Kinh Doanh", value: "sales-staff" },
      ],
      onFilter: (value: any, record: IEmployee) => record.role_name === value,
    },
    {
      title: "Tài khoản đăng nhập",
      dataIndex: "user_id",
      key: "user_id",
      width: 200,
      render: (userId: string, record: IEmployee) => {
        if (!userId) {
          return <Tag color="default">Chưa liên kết</Tag>;
        }

        // Find user info from users state (if available)
        const linkedUser = users.find((user) => user.id === userId);
        if (linkedUser) {
          return (
            <Tooltip title={`Email: ${linkedUser.email}`}>
              <Tag color="blue">{linkedUser.email}</Tag>
            </Tooltip>
          );
        }

        // User not found - might be deleted
        return (
          <Tooltip title="Tài khoản này đã bị xóa - nhấn để liên kết lại">
            <Tag
              color="red"
              style={{ cursor: "pointer" }}
              onClick={() => handleOpenModal(record)}
            >
              ⚠️ Tài khoản đã xóa
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "is_active",
      key: "is_active",
      render: (isActive: boolean) => (
        <Tag color={isActive ? "success" : "error"}>
          {isActive ? "Hoạt động" : "Không hoạt động"}
        </Tag>
      ),
      filters: [
        { text: "Hoạt động", value: true },
        { text: "Không hoạt động", value: false },
      ],
      onFilter: (value: any, record: IEmployee) => record.is_active === value,
    },
    {
      title: "Thao tác",
      key: "actions",
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
            onConfirm={() =>
              handleDeleteEmployee(record.employee_id, record.full_name)
            }
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
        <Col span={12} style={{ textAlign: "right" }}>
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={() => handleOpenModal()}
            style={{
              background: "linear-gradient(45deg, #1890ff, #40a9ff)",
              border: "none",
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
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} md={4}>
          <Card>
            <Statistic
              title="NV Kho"
              value={stats.inventoryStaff}
              prefix={<MedicineBoxOutlined />}
              valueStyle={{ color: "#722ed1" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} md={4}>
          <Card>
            <Statistic
              title="NV Y Tế"
              value={stats.medicalStaff}
              prefix={<UserOutlined />}
              valueStyle={{ color: "#13c2c2" }}
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
              valueStyle={{ color: "#eb2f96" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} md={4}>
          <Card>
            <Statistic
              title="NV Kinh Doanh"
              value={stats.salesStaff}
              prefix={<UserOutlined />}
              valueStyle={{ color: "#f5222d" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} md={4}>
          <Card>
            <Statistic
              title="Đang hoạt động"
              value={stats.active}
              prefix={<UserOutlined />}
              valueStyle={{ color: "#52c41a" }}
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
              style={{ width: "100%" }}
              value={selectedRole}
              onChange={setSelectedRole}
            >
              <Select.Option value="all">Tất cả vai trò</Select.Option>
              <Select.Option value="BacSi">🩺 Bác sĩ</Select.Option>
              <Select.Option value="DuocSi">💊 Dược sĩ</Select.Option>
              <Select.Option value="LeTan">📞 Lễ tân</Select.Option>
              <Select.Option value="inventory-staff">
                📦 Nhân Viên Kho
              </Select.Option>
              <Select.Option value="medical-staff">
                🏥 Nhân Viên Y Tế
              </Select.Option>
              <Select.Option value="delivery-staff">
                🚚 Nhân Viên Giao Hàng
              </Select.Option>
              <Select.Option value="sales-staff">
                💼 Nhân Viên Kinh Doanh
              </Select.Option>
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
            {editingEmployee ? "Chỉnh sửa nhân viên" : "Thêm nhân viên mới"}
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
        okText={editingEmployee ? "Cập nhật" : "Tạo mới"}
        cancelText="Hủy"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={
            editingEmployee ? handleUpdateEmployee : handleCreateEmployee
          }
          style={{ marginTop: 16 }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="full_name"
                label="Họ và tên"
                rules={[{ required: true, message: "Vui lòng nhập họ và tên" }]}
              >
                <Input placeholder="Nhập họ và tên" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="employee_code"
                label="Mã nhân viên"
                rules={[
                  { required: true, message: "Vui lòng nhập mã nhân viên" },
                  {
                    pattern: /^[A-Z0-9]+$/,
                    message: "Mã nhân viên chỉ chứa chữ hoa và số",
                  },
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
                rules={[{ required: true, message: "Vui lòng chọn vai trò" }]}
              >
                <Select placeholder="Chọn vai trò">
                  <Select.Option value="BacSi">🩺 Bác sĩ</Select.Option>
                  <Select.Option value="DuocSi">💊 Dược sĩ</Select.Option>
                  <Select.Option value="LeTan">📞 Lễ tân</Select.Option>
                  <Select.Option value="inventory-staff">
                    📦 Nhân Viên Kho
                  </Select.Option>
                  <Select.Option value="medical-staff">
                    🏥 Nhân Viên Y Tế
                  </Select.Option>
                  <Select.Option value="delivery-staff">
                    🚚 Nhân Viên Giao Hàng
                  </Select.Option>
                  <Select.Option value="sales-staff">
                    💼 Nhân Viên Kinh Doanh
                  </Select.Option>
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

          {/* User Account Linking Section */}
          <Divider orientation="left">Liên kết tài khoản đăng nhập</Divider>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="user_id" label="Tài khoản đăng nhập">
                <Select
                  placeholder="Chọn tài khoản để liên kết (tùy chọn)"
                  allowClear
                  showSearch
                  loading={userSearchLoading}
                  notFoundContent={
                    userSearchLoading
                      ? "Đang tìm kiếm..."
                      : "Không tìm thấy tài khoản"
                  }
                  onSearch={setUserSearchTerm}
                  filterOption={false}
                  options={userSearchResults.map((user) => ({
                    value: user.id,
                    label: `${user.email} - ${user.full_name || "Chưa có tên"}`,
                  }))}
                />
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
