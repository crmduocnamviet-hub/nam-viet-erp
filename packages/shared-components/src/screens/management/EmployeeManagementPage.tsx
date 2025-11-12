/**
 * Employee Management Page - Master-Detail Layout
 *
 * Left: List of employees
 * Right: Employee details with permissions
 */

import React, { useState, useEffect } from "react";
import {
  Row,
  Col,
  List,
  Card,
  Button,
  Space,
  Tag,
  Typography,
  Empty,
  Input,
  Descriptions,
  Checkbox,
  Divider,
  Badge,
  App,
  Popconfirm,
  Tooltip,
  Alert,
  Form,
  Select,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  UserOutlined,
  LockOutlined,
  CloseCircleOutlined,
  SafetyOutlined,
} from "@ant-design/icons";
import { PERMISSIONS } from "../index";
import {
  getEmployees,
  getEmployeesWithRoles,
  updateEmployee,
  deleteEmployee,
  getPermissionRoles,
} from "@nam-viet-erp/services";
import {
  checkAndCreate,
  checkAndEdit,
  checkAndDelete,
} from "../../utils/permissionChecker";

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;

// Core permissions that cannot be deleted
const CORE_PERMISSIONS = [
  "auth.login",
  "auth.logout",
  "dashboard.view",
  "management.access",
];

// Get all available permissions grouped by category
const getAllPermissionsByCategory = () => {
  const grouped: Record<string, Array<{ key: string; label: string }>> = {};

  // Get all permissions from PERMISSIONS constant
  Object.entries(PERMISSIONS).forEach(([key, label]) => {
    const category = key.split(".")[0];

    if (!grouped[category]) {
      grouped[category] = [];
    }

    grouped[category].push({
      key,
      label,
    });
  });

  return grouped;
};

const getCategoryLabel = (category: string): string => {
  const labels: Record<string, string> = {
    auth: "🔐 Xác thực",
    pos: "🛒 Bán lẻ (POS)",
    sales: "💰 Bán hàng",
    b2b: "🏢 Bán buôn (B2B)",
    quotes: "📋 Báo giá",
    medical: "⚕️ Y tế",
    patients: "🏥 Bệnh nhân",
    appointments: "📅 Lịch hẹn",
    "medical-records": "📄 Hồ sơ Y tế",
    inventory: "📦 Kho",
    products: "📦 Sản phẩm",
    "purchase-orders": "🛍️ Đơn mua hàng",
    warehouse: "🏭 Kho vận",
    delivery: "🚚 Giao hàng",
    shipping: "📮 Vận chuyển",
    financial: "💵 Tài chính",
    ledger: "📊 Sổ cái",
    transactions: "💳 Giao dịch",
    funds: "💰 Quỹ",
    marketing: "📣 Marketing",
    promotions: "🎁 Khuyến mãi",
    vouchers: "🎫 Phiếu giảm giá",
    campaigns: "📢 Chiến dịch",
    customers: "👥 Khách hàng",
    content: "📝 Nội dung",
    chatbot: "🤖 Chatbot",
    management: "⚙️ Quản lý",
    dashboard: "📊 Dashboard",
    employees: "👔 Nhân viên",
    users: "👤 Tài khoản",
    rooms: "🏠 Phòng ban",
    roles: "🎭 Vai trò",
    settings: "⚙️ Cài đặt",
    salary: "💵 Lương & Thưởng",
    commission: "💰 Hoa hồng & KPI",
    seniority: "⏳ Thâm niên",
  };
  return labels[category] || `📌 ${category}`;
};

const EmployeeManagementPage: React.FC = () => {
  const { message } = App.useApp();
  const [employees, setEmployees] = useState<IEmployeeWithRole[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<
    IEmployeeWithRole[]
  >([]);
  const [selectedEmployee, setSelectedEmployee] =
    useState<IEmployeeWithRole | null>(null);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [editedPermissions, setEditedPermissions] = useState<string[]>([]);
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form] = Form.useForm();
  const [permissionRoles, setPermissionRoles] = useState<any[]>([]);
  const [roleChanged, setRoleChanged] = useState(false);

  useEffect(() => {
    loadEmployees();
    loadPermissionRoles();
  }, []);

  useEffect(() => {
    // Filter employees based on search text
    if (searchText) {
      const filtered = employees.filter(
        (emp) =>
          emp.full_name.toLowerCase().includes(searchText.toLowerCase()) ||
          emp.employee_code?.toLowerCase().includes(searchText.toLowerCase()) ||
          emp.role_name.toLowerCase().includes(searchText.toLowerCase()),
      );
      setFilteredEmployees(filtered);
    } else {
      setFilteredEmployees(employees);
    }
  }, [searchText, employees]);

  useEffect(() => {
    // Initialize editedPermissions when selectedEmployee changes
    if (selectedEmployee) {
      setEditedPermissions([...(selectedEmployee.permissions || [])]);
      form.setFieldsValue({
        full_name: selectedEmployee.full_name,
        employee_code: selectedEmployee.employee_code,
        permission_role_id: selectedEmployee.permission_role_id,
        is_active: selectedEmployee.is_active,
      });
    }
  }, [selectedEmployee]);

  const loadEmployees = async () => {
    setLoading(true);
    try {
      // Use getEmployeesWithRoles to get full role information
      const { data, error } = await getEmployeesWithRoles();

      if (error) {
        throw error;
      }

      if (data) {
        setEmployees(data);
        setFilteredEmployees(data);

        // Auto-select first employee
        if (data.length > 0 && !selectedEmployee) {
          setSelectedEmployee(data[0]);
        }
      }
    } catch (error) {
      console.error("Error loading employees:", error);
      message.error("Không thể tải danh sách nhân viên");
    } finally {
      setLoading(false);
    }
  };

  const loadPermissionRoles = async () => {
    try {
      const { data, error } = await getPermissionRoles({ isActive: true });

      if (error) {
        throw error;
      }

      if (data) {
        setPermissionRoles(data);
      }
    } catch (error) {
      console.error("Error loading permission roles:", error);
      message.error("Không thể tải danh sách vai trò");
    }
  };

  const handleEmployeeClick = (employee: IEmployeeWithRole) => {
    setSelectedEmployee(employee);
    setEditedPermissions([...(employee.permissions || [])]);
    setEditMode(false);
    setRoleChanged(false);
  };

  const handleResetPermissions = () => {
    if (!selectedEmployee) return;
    setEditedPermissions([...(selectedEmployee.permissions || [])]);
    message.info("Đã hoàn tác thay đổi");
  };

  const handleDeletePermission = (permissionKey: string) => {
    const newPermissions = editedPermissions.filter(
      (perm) => perm !== permissionKey,
    );
    setEditedPermissions(newPermissions);
    message.success(
      `Đã xóa quyền "${PERMISSIONS[permissionKey as keyof typeof PERMISSIONS] || permissionKey}"`,
    );
  };

  const isPermissionDeletable = (permissionKey: string): boolean => {
    return !CORE_PERMISSIONS.includes(permissionKey);
  };

  const handleCategoryPermissionChange = (
    category: string,
    checkedValues: (string | number | boolean)[],
    allCategoryPerms: string[],
  ) => {
    // Remove all permissions from this category
    const otherPermissions = editedPermissions.filter(
      (perm) => !allCategoryPerms.includes(perm),
    );
    // Add back the checked permissions from this category
    const newPermissions = [
      ...otherPermissions,
      ...(checkedValues as string[]),
    ];
    setEditedPermissions(newPermissions);
  };

  const handleSavePermissions = async () => {
    if (!selectedEmployee) return;

    setSavingPermissions(true);
    try {
      // Update permissions in database
      const { data, error } = await updateEmployee(
        selectedEmployee.employee_id,
        {
          permissions: editedPermissions,
        },
      );

      if (error) {
        throw error;
      }

      // Update local state
      const updatedEmployees = employees.map((emp) =>
        emp.employee_id === selectedEmployee.employee_id
          ? { ...emp, permissions: editedPermissions }
          : emp,
      );

      setEmployees(updatedEmployees);
      setFilteredEmployees(updatedEmployees);
      setSelectedEmployee({
        ...selectedEmployee,
        permissions: editedPermissions,
      });

      message.success(
        `Đã cập nhật quyền cho nhân viên "${selectedEmployee.full_name}"`,
      );
    } catch (error) {
      console.error("Error updating permissions:", error);
      message.error("Không thể cập nhật quyền");
    } finally {
      setSavingPermissions(false);
    }
  };

  const handleSaveInfo = async () => {
    if (!selectedEmployee) return;

    try {
      const values = await form.validateFields();

      // If permission_role_id changed, sync permissions with role
      if (values.permission_role_id !== selectedEmployee.permission_role_id) {
        const newRole = permissionRoles.find(
          (r) => r.id === values.permission_role_id,
        );
        if (newRole) {
          values.permissions = newRole.permissions || [];
          message.info(
            `Quyền đã được đồng bộ từ vai trò "${newRole.role_title}"`,
          );
        }
      }

      const { data, error } = await updateEmployee(
        selectedEmployee.employee_id,
        values,
      );

      if (error) {
        throw error;
      }

      // Reload to get updated data from view
      await loadEmployees();

      // Find and select updated employee
      const updatedEmp = employees.find(
        (e) => e.employee_id === selectedEmployee.employee_id,
      );
      if (updatedEmp) {
        setSelectedEmployee(updatedEmp);
      }

      message.success(
        `Đã cập nhật thông tin nhân viên "${selectedEmployee.full_name}"`,
      );
      setEditMode(false);
      setRoleChanged(false);
    } catch (error) {
      console.error("Error updating employee info:", error);
      message.error("Không thể cập nhật thông tin nhân viên");
    }
  };

  const handleDelete = async (employee: IEmployeeWithRole) => {
    await checkAndDelete(
      "employees",
      async () => {
        try {
          const { error } = await deleteEmployee(employee.employee_id);

          if (error) {
            throw error;
          }

          // Update local state
          const newEmployees = employees.filter(
            (e) => e.employee_id !== employee.employee_id,
          );
          setEmployees(newEmployees);
          setFilteredEmployees(newEmployees);

          if (selectedEmployee?.employee_id === employee.employee_id) {
            setSelectedEmployee(null);
          }

          message.success(`Đã xóa nhân viên "${employee.full_name}"`);
        } catch (error) {
          console.error("Error deleting employee:", error);
          message.error("Không thể xóa nhân viên");
        }
      },
      "Bạn không có quyền xóa nhân viên",
    );
  };

  // Check if there are unsaved permission changes
  const hasUnsavedPermissionChanges =
    selectedEmployee &&
    JSON.stringify([...editedPermissions].sort()) !==
      JSON.stringify([...(selectedEmployee.permissions || [])].sort());

  const currentPermissions = editedPermissions;
  const allPermissionsByCategory = getAllPermissionsByCategory();

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <Text type="secondary">
          Quản lý thông tin nhân viên và phân quyền truy cập
        </Text>
      </div>

      <Row gutter={16}>
        {/* Left: Employee List */}
        <Col xs={24} lg={8} xl={7}>
          <Card
            title={
              <Space>
                <UserOutlined />
                <span>Danh sách nhân viên ({filteredEmployees.length})</span>
              </Space>
            }
            extra={
              <Search
                placeholder="Tìm kiếm..."
                allowClear
                size="small"
                style={{ width: 150 }}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            }
            bodyStyle={{ padding: 0 }}
          >
            <List
              loading={loading}
              dataSource={filteredEmployees}
              renderItem={(employee) => (
                <List.Item
                  style={{
                    cursor: "pointer",
                    backgroundColor:
                      selectedEmployee?.employee_id === employee.employee_id
                        ? "#e6f7ff"
                        : "transparent",
                    borderLeft:
                      selectedEmployee?.employee_id === employee.employee_id
                        ? "3px solid #1890ff"
                        : "3px solid transparent",
                    padding: "12px 16px",
                  }}
                  onClick={() => handleEmployeeClick(employee)}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <span>{employee.full_name}</span>
                        {!employee.is_active && <Tag color="red">Inactive</Tag>}
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size={0}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {employee.role_name}
                        </Text>
                        <Space size={4}>
                          <Badge
                            count={employee.permissions?.length || 0}
                            showZero
                            color="#52c41a"
                            style={{ fontSize: 10 }}
                          />
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            quyền
                          </Text>
                        </Space>
                      </Space>
                    }
                  />
                </List.Item>
              )}
              locale={{
                emptyText: (
                  <Empty
                    description="Không tìm thấy nhân viên nào"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                ),
              }}
            />
          </Card>
        </Col>

        {/* Right: Employee Details */}
        <Col xs={24} lg={16} xl={17}>
          {selectedEmployee ? (
            <Card
              title={
                <Space>
                  <span>{selectedEmployee.full_name}</span>
                  {!selectedEmployee.is_active && (
                    <Tag color="red">Không hoạt động</Tag>
                  )}
                </Space>
              }
              extra={
                <Space>
                  {editMode ? (
                    <>
                      <Button
                        type="primary"
                        onClick={handleSaveInfo}
                        icon={<SafetyOutlined />}
                      >
                        Lưu thông tin
                      </Button>
                      <Button
                        onClick={() => {
                          setEditMode(false);
                          setRoleChanged(false);
                        }}
                      >
                        Hủy
                      </Button>
                    </>
                  ) : (
                    <>
                      {hasUnsavedPermissionChanges && (
                        <>
                          <Button
                            type="primary"
                            icon={<SafetyOutlined />}
                            onClick={handleSavePermissions}
                            loading={savingPermissions}
                          >
                            Lưu quyền
                          </Button>
                          <Button onClick={handleResetPermissions}>
                            Hoàn tác
                          </Button>
                        </>
                      )}
                      <Button
                        icon={<EditOutlined />}
                        onClick={() => setEditMode(true)}
                      >
                        Chỉnh sửa
                      </Button>
                      <Popconfirm
                        title="Xóa nhân viên này?"
                        description={`Bạn có chắc muốn xóa nhân viên "${selectedEmployee.full_name}"?`}
                        onConfirm={() => handleDelete(selectedEmployee)}
                        okText="Xóa"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                      >
                        <Button danger icon={<DeleteOutlined />}>
                          Xóa
                        </Button>
                      </Popconfirm>
                    </>
                  )}
                </Space>
              }
            >
              {/* Employee Info */}
              {editMode ? (
                <Form form={form} layout="vertical">
                  <Form.Item
                    name="full_name"
                    label="Họ tên"
                    rules={[
                      { required: true, message: "Vui lòng nhập họ tên" },
                    ]}
                  >
                    <Input />
                  </Form.Item>
                  <Form.Item name="employee_code" label="Mã nhân viên">
                    <Input />
                  </Form.Item>
                  <Form.Item
                    name="permission_role_id"
                    label="Vai trò"
                    rules={[
                      { required: true, message: "Vui lòng chọn vai trò" },
                    ]}
                  >
                    <Select
                      placeholder="Chọn vai trò"
                      showSearch
                      optionFilterProp="children"
                      onChange={(value) => {
                        if (value !== selectedEmployee?.permission_role_id) {
                          setRoleChanged(true);
                        } else {
                          setRoleChanged(false);
                        }
                      }}
                    >
                      {permissionRoles.map((role) => (
                        <Select.Option key={role.id} value={role.id}>
                          <Space>
                            <span>{role.role_title}</span>
                            <Text type="secondary" style={{ fontSize: 11 }}>
                              ({role.role_key})
                            </Text>
                          </Space>
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                  {roleChanged && (
                    <Alert
                      message="Thay đổi vai trò"
                      description="Khi thay đổi vai trò, tất cả quyền cá nhân của nhân viên sẽ được đồng bộ theo quyền của vai trò mới."
                      type="warning"
                      showIcon
                      closable
                      onClose={() => setRoleChanged(false)}
                      style={{ marginBottom: 16 }}
                    />
                  )}
                  <Form.Item
                    name="is_active"
                    label="Trạng thái"
                    valuePropName="checked"
                  >
                    <Checkbox>Hoạt động</Checkbox>
                  </Form.Item>
                </Form>
              ) : (
                <Descriptions column={1} bordered size="small">
                  <Descriptions.Item label="Mã nhân viên">
                    {selectedEmployee.employee_code || "-"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Họ tên">
                    {selectedEmployee.full_name}
                  </Descriptions.Item>
                  <Descriptions.Item label="Vai trò">
                    {selectedEmployee.role_title ? (
                      <Space>
                        <Tag color="blue">{selectedEmployee.role_title}</Tag>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          ({selectedEmployee.role_key})
                        </Text>
                      </Space>
                    ) : (
                      <Text type="secondary">Chưa gán vai trò</Text>
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="Trạng thái">
                    {selectedEmployee.is_active ? (
                      <Tag color="green">Hoạt động</Tag>
                    ) : (
                      <Tag color="red">Không hoạt động</Tag>
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="Quyền từ vai trò">
                    <Badge
                      count={selectedEmployee.role_permissions?.length || 0}
                      showZero
                      color="#1890ff"
                    />
                  </Descriptions.Item>
                  <Descriptions.Item label="Quyền cá nhân">
                    <Badge
                      count={currentPermissions.length}
                      showZero
                      color="#52c41a"
                    />
                  </Descriptions.Item>
                  <Descriptions.Item label="Tổng số quyền">
                    <Badge
                      count={selectedEmployee.all_permissions?.length || 0}
                      showZero
                      color="#722ed1"
                    />
                  </Descriptions.Item>
                </Descriptions>
              )}

              <Divider orientation="left">
                <Space>
                  <SafetyOutlined />
                  <span>
                    Danh sách quyền ({currentPermissions.length})
                    {hasUnsavedPermissionChanges && (
                      <Tag color="orange" style={{ marginLeft: 8 }}>
                        Có thay đổi chưa lưu
                      </Tag>
                    )}
                  </span>
                </Space>
              </Divider>

              <Alert
                message="Quyền cá nhân"
                description="Các quyền ở đây áp dụng riêng cho nhân viên này và sẽ ghi đè lên quyền từ vai trò của nhân viên."
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />

              {/* Permissions by Category */}
              {Object.keys(allPermissionsByCategory).length > 0 ? (
                <Space
                  direction="vertical"
                  style={{ width: "100%" }}
                  size="middle"
                >
                  {Object.entries(allPermissionsByCategory).map(
                    ([category, perms]) => {
                      const allCategoryPerms = perms.map((p) => p.key);
                      const checkedPerms = currentPermissions.filter((p) =>
                        allCategoryPerms.includes(p),
                      );

                      return (
                        <Card
                          key={category}
                          size="small"
                          type="inner"
                          title={getCategoryLabel(category)}
                          headStyle={{ backgroundColor: "#fafafa" }}
                        >
                          <Checkbox.Group
                            value={checkedPerms}
                            style={{ width: "100%" }}
                            onChange={(checkedValues) =>
                              handleCategoryPermissionChange(
                                category,
                                checkedValues,
                                allCategoryPerms,
                              )
                            }
                          >
                            <Space
                              direction="vertical"
                              style={{ width: "100%" }}
                              size="small"
                            >
                              {perms.map((perm) => {
                                const isDeletable = isPermissionDeletable(
                                  perm.key,
                                );
                                const isChecked = checkedPerms.includes(
                                  perm.key,
                                );

                                return (
                                  <div
                                    key={perm.key}
                                    style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "center",
                                      width: "100%",
                                    }}
                                  >
                                    <Checkbox value={perm.key}>
                                      <Space>
                                        <code
                                          style={{
                                            fontSize: 11,
                                            color: "#666",
                                          }}
                                        >
                                          {perm.key}
                                        </code>
                                        <span>{perm.label}</span>
                                        {!isDeletable && (
                                          <Tooltip title="Quyền cốt lõi không thể xóa">
                                            <LockOutlined
                                              style={{
                                                fontSize: 12,
                                                color: "#1890ff",
                                              }}
                                            />
                                          </Tooltip>
                                        )}
                                      </Space>
                                    </Checkbox>
                                    {isDeletable && isChecked && (
                                      <Popconfirm
                                        title="Xóa quyền này?"
                                        description={`Bạn có chắc muốn xóa quyền "${perm.label}" khỏi nhân viên này?`}
                                        onConfirm={() =>
                                          handleDeletePermission(perm.key)
                                        }
                                        okText="Xóa"
                                        cancelText="Hủy"
                                        okButtonProps={{ danger: true }}
                                      >
                                        <Button
                                          type="text"
                                          danger
                                          size="small"
                                          icon={<CloseCircleOutlined />}
                                          style={{ marginLeft: 8 }}
                                        />
                                      </Popconfirm>
                                    )}
                                  </div>
                                );
                              })}
                            </Space>
                          </Checkbox.Group>
                        </Card>
                      );
                    },
                  )}
                </Space>
              ) : (
                <Empty
                  description="Nhân viên này chưa có quyền nào"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              )}
            </Card>
          ) : (
            <Card>
              <Empty
                description="Chọn một nhân viên để xem chi tiết"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default EmployeeManagementPage;
