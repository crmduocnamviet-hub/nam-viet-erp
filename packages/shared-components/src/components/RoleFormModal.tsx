import React, { useEffect, useState } from "react";
import {
  Modal,
  Form,
  Input,
  Transfer,
  message,
  Typography,
  Space,
  Tag,
  Collapse,
} from "antd";
import type { TransferDirection } from "antd/es/transfer";
import { Role, CreateRoleInput } from "../types/role";
import { PERMISSIONS, PERMISSION_CATEGORIES } from "../screens/index";

const { TextArea } = Input;
const { Text } = Typography;
const { Panel } = Collapse;

interface RoleFormModalProps {
  visible: boolean;
  role: Role | null;
  onClose: (saved: boolean) => void;
  onSave?: (roleData: Role) => void;
}

interface PermissionItem {
  key: string;
  title: string;
  description: string;
  category: string;
  disabled?: boolean;
}

// Group permissions by category
const getPermissionsByCategory = (): Record<string, PermissionItem[]> => {
  const grouped: Record<string, PermissionItem[]> = {};

  Object.entries(PERMISSIONS).forEach(([key, description]) => {
    // Extract category from permission key (e.g., "pos.access" -> "pos")
    const category = key.split(".")[0];

    if (!grouped[category]) {
      grouped[category] = [];
    }

    grouped[category].push({
      key,
      title: description,
      description,
      category,
    });
  });

  return grouped;
};

const getCategoryTitle = (category: string): string => {
  const categoryTitles: Record<string, string> = {
    auth: "Xác thực",
    pos: "Bán lẻ (POS)",
    b2b: "Bán buôn (B2B)",
    medical: "Y tế",
    inventory: "Kho hàng",
    warehouse: "Kho vận",
    delivery: "Giao hàng",
    sales: "Bán hàng",
    financial: "Tài chính",
    marketing: "Marketing",
    management: "Quản lý",
    reports: "Báo cáo",
    settings: "Cài đặt",
    users: "Người dùng",
    employees: "Nhân viên",
    patients: "Bệnh nhân",
    appointments: "Lịch hẹn",
    products: "Sản phẩm",
    quotes: "Báo giá",
    shipping: "Vận chuyển",
    ledger: "Sổ cái",
    transactions: "Giao dịch",
    funds: "Quỹ",
    promotions: "Khuyến mãi",
    vouchers: "Phiếu giảm giá",
    campaigns: "Chiến dịch",
    customers: "Khách hàng",
    content: "Nội dung",
    chatbot: "Chatbot",
    dashboard: "Dashboard",
    rooms: "Phòng ban",
  };
  return categoryTitles[category] || category.toUpperCase();
};

const RoleFormModal: React.FC<RoleFormModalProps> = ({
  visible,
  role,
  onClose,
  onSave,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const permissionsByCategory = getPermissionsByCategory();

  useEffect(() => {
    if (visible && role) {
      // Edit mode
      form.setFieldsValue({
        key: role.key,
        title: role.title,
        description: role.description,
      });
      setSelectedPermissions(role.permissions);
    } else if (visible) {
      // Create mode
      form.resetFields();
      setSelectedPermissions([]);
    }
  }, [visible, role, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const newRole: Role = {
        id: role?.id || values.key,
        key: values.key,
        title: values.title,
        description: values.description,
        permissions: selectedPermissions,
        is_system_role: role?.is_system_role || false,
      };

      if (role) {
        // Update existing role
        // TODO: Implement API call
        if (onSave) {
          onSave(newRole);
        }
        message.success(`Đã cập nhật vai trò "${newRole.title}"`);
      } else {
        // Create new role
        // TODO: Implement API call
        if (onSave) {
          onSave(newRole);
        }
        message.success(`Đã tạo vai trò "${newRole.title}"`);
      }

      onClose(true);
    } catch (error) {
      console.error("Validation failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setSelectedPermissions([]);
    onClose(false);
  };

  const handlePermissionChange = (
    category: string,
    targetKeys: string[],
    direction: TransferDirection,
    moveKeys: string[],
  ) => {
    // Get all permissions from other categories
    const otherCategoryPermissions = selectedPermissions.filter(
      (perm) => !perm.startsWith(category + "."),
    );

    // Combine with selected permissions from this category
    const newSelectedPermissions = [...otherCategoryPermissions, ...targetKeys];

    setSelectedPermissions(newSelectedPermissions);
  };

  const renderCategoryPermissions = (
    category: string,
    permissions: PermissionItem[],
  ) => {
    const categoryPermissions = permissions.map((p) => p.key);
    const selectedCategoryPermissions = selectedPermissions.filter((p) =>
      categoryPermissions.includes(p),
    );

    return (
      <div key={category} style={{ marginBottom: 16 }}>
        <Transfer
          dataSource={permissions}
          titles={["Quyền khả dụng", "Quyền đã chọn"]}
          targetKeys={selectedCategoryPermissions}
          onChange={(targetKeys, direction, moveKeys) =>
            handlePermissionChange(category, targetKeys, direction, moveKeys)
          }
          render={(item) => (
            <div>
              <Text strong>{item.title}</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                <code>{item.key}</code>
              </Text>
            </div>
          )}
          listStyle={{
            width: 350,
            height: 400,
          }}
          showSearch
          filterOption={(inputValue, item) =>
            item.title.toLowerCase().includes(inputValue.toLowerCase()) ||
            item.key.toLowerCase().includes(inputValue.toLowerCase())
          }
        />
      </div>
    );
  };

  return (
    <Modal
      title={role ? "Chỉnh sửa Vai trò" : "Thêm Vai trò mới"}
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      width={900}
      okText={role ? "Cập nhật" : "Tạo mới"}
      cancelText="Hủy"
    >
      <Form form={form} layout="vertical" requiredMark={false}>
        <Form.Item
          name="key"
          label="Mã vai trò"
          rules={[
            { required: true, message: "Vui lòng nhập mã vai trò!" },
            {
              pattern: /^[a-z0-9-]+$/,
              message: "Chỉ được dùng chữ thường, số và dấu gạch ngang!",
            },
          ]}
          extra="Ví dụ: medical-staff, delivery-staff, sales-manager"
        >
          <Input
            placeholder="medical-staff"
            disabled={!!role?.is_system_role}
          />
        </Form.Item>

        <Form.Item
          name="title"
          label="Tên vai trò"
          rules={[{ required: true, message: "Vui lòng nhập tên vai trò!" }]}
        >
          <Input placeholder="Nhân viên Y tế" />
        </Form.Item>

        <Form.Item name="description" label="Mô tả">
          <TextArea rows={2} placeholder="Mô tả về vai trò và trách nhiệm..." />
        </Form.Item>

        <Form.Item label="Phân quyền">
          <Space direction="vertical" style={{ width: "100%" }}>
            <Text>
              Đã chọn:{" "}
              <Tag color="green">{selectedPermissions.length} quyền</Tag>
            </Text>

            <Collapse accordion>
              {Object.entries(permissionsByCategory).map(
                ([category, permissions]) => (
                  <Panel
                    header={
                      <Space>
                        <Text strong>{getCategoryTitle(category)}</Text>
                        <Tag color="blue">
                          {
                            selectedPermissions.filter((p) =>
                              p.startsWith(category + "."),
                            ).length
                          }
                          /{permissions.length}
                        </Tag>
                      </Space>
                    }
                    key={category}
                  >
                    {renderCategoryPermissions(category, permissions)}
                  </Panel>
                ),
              )}
            </Collapse>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default RoleFormModal;
