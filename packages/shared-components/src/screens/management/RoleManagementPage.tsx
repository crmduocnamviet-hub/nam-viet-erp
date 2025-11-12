/**
 * Role Management Page - Master-Detail Layout
 *
 * Left: List of roles
 * Right: Role details with permissions
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
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  SafetyOutlined,
  LockOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { Role, SYSTEM_ROLES } from "../../types/role";
import { PERMISSIONS } from "../index";
import RoleFormModal from "../../components/RoleFormModal";
import {
  checkAndCreate,
  checkAndEdit,
  checkAndDelete,
} from "../../utils/permissionChecker";
import {
  getPermissionRoles,
  updateRolePermissions,
  deletePermissionRole,
  type PermissionRole,
} from "@nam-viet-erp/services";

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;

// Core permissions that cannot be deleted
const CORE_PERMISSIONS = [
  "auth.login",
  "auth.logout",
  "dashboard.view",
  "management.access",
];

// Convert PermissionRole from DB to Role format
const convertToRole = (permRole: PermissionRole): Role => {
  return {
    id: permRole.id,
    key: permRole.role_key,
    title: permRole.role_title,
    description: permRole.description,
    permissions: permRole.permissions,
    is_system_role: permRole.is_system_role,
  };
};

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

const RoleManagementPage: React.FC = () => {
  const { message } = App.useApp();
  const [roles, setRoles] = useState<Role[]>([]);
  const [filteredRoles, setFilteredRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [searchText, setSearchText] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);
  const [editedPermissions, setEditedPermissions] = useState<string[]>([]);
  const [savingPermissions, setSavingPermissions] = useState(false);

  useEffect(() => {
    loadRoles();
  }, []);

  useEffect(() => {
    // Filter roles based on search text
    if (searchText) {
      const filtered = roles.filter(
        (role) =>
          role.title.toLowerCase().includes(searchText.toLowerCase()) ||
          role.key.toLowerCase().includes(searchText.toLowerCase()) ||
          role.description?.toLowerCase().includes(searchText.toLowerCase()),
      );
      setFilteredRoles(filtered);
    } else {
      setFilteredRoles(roles);
    }
  }, [searchText, roles]);

  useEffect(() => {
    // Initialize editedPermissions when selectedRole changes
    if (selectedRole) {
      // If super-admin, enable all permissions
      if (selectedRole.key === "super-admin") {
        const allPermissions = Object.keys(PERMISSIONS);
        setEditedPermissions(allPermissions);
      } else {
        setEditedPermissions([...selectedRole.permissions]);
      }
    }
  }, [selectedRole]);

  const loadRoles = async () => {
    setLoading(true);
    try {
      // Load from Supabase
      const { data, error } = await getPermissionRoles();

      if (error) {
        throw error;
      }

      if (data) {
        const rolesData = data.map(convertToRole);
        setRoles(rolesData);
        setFilteredRoles(rolesData);

        // Auto-select first role
        if (rolesData.length > 0 && !selectedRole) {
          setSelectedRole(rolesData[0]);
        }
      }
    } catch (error) {
      console.error("Error loading roles:", error);
      message.error("Không thể tải danh sách vai trò");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    checkAndCreate(
      "roles",
      () => {
        setEditingRole(null);
        setModalVisible(true);
      },
      "Bạn không có quyền tạo vai trò mới",
    );
  };

  const handleEdit = (role: Role) => {
    checkAndEdit(
      "roles",
      () => {
        setEditingRole(role);
        setModalVisible(true);
      },
      "Bạn không có quyền chỉnh sửa vai trò",
    );
  };

  const handleDelete = async (role: Role) => {
    if (role.is_system_role) {
      message.error("Không thể xóa vai trò hệ thống");
      return;
    }

    await checkAndDelete(
      "roles",
      async () => {
        try {
          // Delete from Supabase
          const { error } = await deletePermissionRole(role.id);

          if (error) {
            throw error;
          }

          // Update local state
          const newRoles = roles.filter((r) => r.id !== role.id);
          setRoles(newRoles);
          setFilteredRoles(newRoles);

          if (selectedRole?.id === role.id) {
            setSelectedRole(null);
          }

          message.success(`Đã xóa vai trò "${role.title}"`);
        } catch (error) {
          console.error("Error deleting role:", error);
          message.error("Không thể xóa vai trò");
        }
      },
      "Bạn không có quyền xóa vai trò",
    );
  };

  const handleSaveRole = async (roleData: Role) => {
    // Reload roles from database to get latest data
    await loadRoles();

    // If editing current selected role, update selection
    if (selectedRole?.id === roleData.id) {
      const updatedRole = roles.find((r) => r.id === roleData.id);
      if (updatedRole) {
        setSelectedRole(updatedRole);
        setEditedPermissions([...updatedRole.permissions]);
      }
    }
  };

  const handleModalClose = (saved: boolean) => {
    setModalVisible(false);
    setEditingRole(null);
    if (saved) {
      loadRoles();
    }
  };

  const handleRoleClick = (role: Role) => {
    setSelectedRole(role);
    setEditedPermissions([...role.permissions]);
  };

  const handleResetPermissions = () => {
    if (!selectedRole) return;
    setEditedPermissions([...selectedRole.permissions]);
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
    if (!selectedRole) return;

    setSavingPermissions(true);
    try {
      // Update permissions in Supabase
      const { data, error } = await updateRolePermissions(
        selectedRole.id,
        editedPermissions,
      );

      if (error) {
        throw error;
      }

      // Update local state
      const updatedRoles = roles.map((role) =>
        role.id === selectedRole.id
          ? { ...role, permissions: editedPermissions }
          : role,
      );

      setRoles(updatedRoles);
      setFilteredRoles(updatedRoles);
      setSelectedRole({ ...selectedRole, permissions: editedPermissions });

      message.success(`Đã cập nhật quyền cho vai trò "${selectedRole.title}"`);
    } catch (error) {
      console.error("Error updating permissions:", error);
      message.error("Không thể cập nhật quyền");
    } finally {
      setSavingPermissions(false);
    }
  };

  // Check if selected role is super-admin
  const isSuperAdmin = selectedRole?.key === "super-admin";

  // Check if there are unsaved changes (always false for super-admin)
  const hasUnsavedChanges =
    !isSuperAdmin &&
    selectedRole &&
    JSON.stringify([...editedPermissions].sort()) !==
      JSON.stringify([...selectedRole.permissions].sort());

  const currentPermissions = editedPermissions;
  const allPermissionsByCategory = getAllPermissionsByCategory();

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <Space
          style={{
            width: "100%",
            justifyContent: "space-between",
            flexWrap: "wrap",
          }}
        >
          <Text type="secondary">
            Quản lý vai trò hệ thống và phân quyền truy cập
          </Text>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Thêm vai trò mới
          </Button>
        </Space>
      </div>

      <Row gutter={16}>
        {/* Left: Role List */}
        <Col xs={24} lg={8} xl={7}>
          <Card
            title={
              <Space>
                <SafetyOutlined />
                <span>Danh sách vai trò ({filteredRoles.length})</span>
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
              dataSource={filteredRoles}
              renderItem={(role) => (
                <List.Item
                  style={{
                    cursor: "pointer",
                    backgroundColor:
                      selectedRole?.id === role.id ? "#e6f7ff" : "transparent",
                    borderLeft:
                      selectedRole?.id === role.id
                        ? "3px solid #1890ff"
                        : "3px solid transparent",
                    padding: "12px 16px",
                  }}
                  onClick={() => handleRoleClick(role)}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <span>{role.title}</span>
                        {role.is_system_role && (
                          <Tag color="blue" icon={<LockOutlined />}>
                            System
                          </Tag>
                        )}
                      </Space>
                    }
                    description={
                      <Space size={4}>
                        <Badge
                          count={role.permissions.length}
                          showZero
                          color="#52c41a"
                          style={{ fontSize: 10 }}
                        />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          quyền
                        </Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
              locale={{
                emptyText: (
                  <Empty
                    description="Không tìm thấy vai trò nào"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                ),
              }}
            />
          </Card>
        </Col>

        {/* Right: Role Details */}
        <Col xs={24} lg={16} xl={17}>
          {selectedRole ? (
            <Card
              title={
                <Space>
                  <span>{selectedRole.title}</span>
                  {selectedRole.is_system_role && (
                    <Tag color="blue" icon={<LockOutlined />}>
                      Vai trò hệ thống
                    </Tag>
                  )}
                </Space>
              }
              extra={
                <Space>
                  {hasUnsavedChanges && (
                    <>
                      <Button
                        type="primary"
                        icon={<SafetyOutlined />}
                        onClick={handleSavePermissions}
                        loading={savingPermissions}
                      >
                        Lưu thay đổi
                      </Button>
                      <Button onClick={handleResetPermissions}>Hoàn tác</Button>
                    </>
                  )}
                  <Button
                    icon={<EditOutlined />}
                    onClick={() => handleEdit(selectedRole)}
                    disabled={isSuperAdmin}
                  >
                    Chỉnh sửa
                  </Button>
                  {!selectedRole.is_system_role && (
                    <Button
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleDelete(selectedRole)}
                      disabled={isSuperAdmin}
                    >
                      Xóa
                    </Button>
                  )}
                </Space>
              }
            >
              {/* Role Info */}
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="Mã vai trò">
                  <code>{selectedRole.key}</code>
                </Descriptions.Item>
                <Descriptions.Item label="Tên vai trò">
                  {selectedRole.title}
                </Descriptions.Item>
                <Descriptions.Item label="Mô tả">
                  {selectedRole.description || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Loại vai trò">
                  {selectedRole.is_system_role ? (
                    <Tag color="blue">Vai trò hệ thống</Tag>
                  ) : (
                    <Tag color="green">Vai trò tùy chỉnh</Tag>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Tổng số quyền">
                  <Badge
                    count={currentPermissions.length}
                    showZero
                    color="#52c41a"
                  />
                </Descriptions.Item>
              </Descriptions>

              {/* Super Admin Alert */}
              {isSuperAdmin && (
                <Alert
                  message="Vai trò Quản trị viên cấp cao"
                  description="Vai trò này tự động có toàn quyền truy cập vào tất cả các chức năng của hệ thống và không thể chỉnh sửa quyền."
                  type="info"
                  showIcon
                  style={{ marginTop: 16 }}
                />
              )}

              <Divider orientation="left">
                <Space>
                  <SafetyOutlined />
                  <span>
                    Danh sách quyền ({currentPermissions.length})
                    {hasUnsavedChanges && (
                      <Tag color="orange" style={{ marginLeft: 8 }}>
                        Có thay đổi chưa lưu
                      </Tag>
                    )}
                  </span>
                </Space>
              </Divider>

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
                            disabled={isSuperAdmin}
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
                                    {isDeletable &&
                                      isChecked &&
                                      !isSuperAdmin && (
                                        <Popconfirm
                                          title="Xóa quyền này?"
                                          description={`Bạn có chắc muốn xóa quyền "${perm.label}" khỏi vai trò này?`}
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
                  description="Vai trò này chưa có quyền nào"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              )}
            </Card>
          ) : (
            <Card>
              <Empty
                description="Chọn một vai trò để xem chi tiết"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            </Card>
          )}
        </Col>
      </Row>

      <RoleFormModal
        visible={modalVisible}
        role={editingRole}
        onClose={handleModalClose}
        onSave={handleSaveRole}
      />
    </div>
  );
};

export default RoleManagementPage;
