import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  Select,
  Statistic,
  Popconfirm,
  Avatar,
  Tooltip,
  Grid,
} from "antd";
import {
  UserOutlined,
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  MedicineBoxOutlined,
  CustomerServiceOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import {
  getEmployees,
  deleteEmployee,
  updateEmployee,
  getUsers,
} from "@nam-viet-erp/services";
import { COMMON_SPACING, getResponsivePadding } from "../../constants/spacing";

const { Title, Text } = Typography;
const { Search } = Input;
const { useBreakpoint } = Grid;

const EmployeesPage: React.FC = () => {
  const navigate = useNavigate();
  const { notification } = App.useApp();
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const [employees, setEmployees] = useState<IEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [stats, setStats] = useState({
    total: 0,
    inventoryStaff: 0,
    medicalStaff: 0,
    deliveryStaff: 0,
    salesStaff: 0,
    active: 0,
  });
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
      width: isMobile ? 180 : 240,
      render: (record: IEmployee) => (
        <Space>
          <Avatar
            size={isMobile ? 32 : 40}
            icon={getRoleIcon(record.role_name)}
          />
          <div>
            <Text
              strong
              ellipsis
              style={{
                maxWidth: isMobile ? 120 : 180,
                display: "inline-block",
              }}
            >
              {record.full_name}
            </Text>
            <br />
            <Text
              type="secondary"
              style={{ fontSize: isMobile ? 11 : 12 }}
              ellipsis
            >
              {record.employee_code}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Vai trò",
      dataIndex: "role_name",
      key: "role_name",
      width: isMobile ? 140 : 160,
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
      width: isMobile ? 180 : 220,
      render: (userId: string, record: IEmployee) => {
        if (!userId) {
          return <Tag color="default">Chưa liên kết</Tag>;
        }

        // Find user info from users state (if available)
        const linkedUser = users.find((user) => user.id === userId);
        if (linkedUser) {
          return (
            <Tooltip title={`Email: ${linkedUser.email}`}>
              <Tag color="blue" style={{ fontSize: isMobile ? 11 : 12 }}>
                {isMobile ? linkedUser.email.split("@")[0] : linkedUser.email}
              </Tag>
            </Tooltip>
          );
        }

        // User not found - might be deleted
        return (
          <Tooltip title="Tài khoản này đã bị xóa - nhấn để liên kết lại">
            <Tag
              color="red"
              style={{ cursor: "pointer" }}
              onClick={() => navigate(`/employees/${record.employee_id}`)}
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
      width: isMobile ? 120 : 140,
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
      width: isMobile ? 90 : 100,
      fixed: "right" as const,
      render: (record: IEmployee) => (
        <Space size="small">
          <Tooltip title="Sửa">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/employees/${record.employee_id}`);
              }}
            />
          </Tooltip>
          <Popconfirm
            title="Xóa nhân viên"
            description={`Bạn có chắc chắn muốn xóa nhân viên ${record.full_name}?`}
            onConfirm={(e) => {
              e?.stopPropagation();
              handleDeleteEmployee(record.employee_id, record.full_name);
            }}
            onCancel={(e) => {
              e?.stopPropagation();
            }}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Xóa">
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={(e) => e.stopPropagation()}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: getResponsivePadding(screens) }}>
      <Row style={{ marginBottom: 24 }} gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Title
            level={isMobile ? 3 : 2}
            style={{ margin: 0, display: "flex", alignItems: "center", gap: 8 }}
          >
            <UserOutlined style={{ marginRight: 8 }} />
            {isMobile ? "Nhân viên" : "Quản lý Nhân viên"}
          </Title>
        </Col>
        <Col
          xs={24}
          md={12}
          style={{
            textAlign: isMobile ? "left" : "right",
            paddingRight: isMobile ? 56 : undefined,
          }}
        >
          <Button
            type="primary"
            size={isMobile ? "middle" : "large"}
            icon={<PlusOutlined />}
            onClick={() => navigate("/employees/create")}
            block={isMobile}
            style={{
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
        <Row gutter={[12, 12]}>
          <Col xs={24} sm={12} md={10}>
            <Input
              placeholder="Tìm theo tên hoặc mã nhân viên..."
              prefix={<SearchOutlined />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onPressEnter={() => loadEmployees()}
              allowClear
              size="large"
            />
          </Col>
          <Col xs={24} sm={12} md={10}>
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
          <Col xs={12} sm={12} md={2}>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={() => loadEmployees()}
              block
              size="large"
            >
              Tìm
            </Button>
          </Col>
          <Col xs={12} sm={12} md={2}>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                setSearchTerm("");
                setSelectedRole("all");
                loadEmployees();
              }}
              block
              size="large"
            >
              Mới
            </Button>
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
          size={isMobile ? "small" : "middle"}
          tableLayout={isMobile ? "fixed" : "auto"}
          onRow={(record) => ({
            onClick: () => navigate(`/employees/${record.employee_id}`),
            style: { cursor: "pointer" },
          })}
          scroll={{ x: isMobile ? 900 : 1200 }}
          pagination={{
            pageSize: isMobile ? 10 : 20,
            showSizeChanger: !isMobile,
            showQuickJumper: !isMobile,
            showTotal: (total) => `Tổng ${total} nhân viên`,
          }}
        />
      </Card>
    </div>
  );
};

const EmployeesPageWrapper: React.FC = () => (
  <App>
    <EmployeesPage />
  </App>
);

export default EmployeesPageWrapper;
