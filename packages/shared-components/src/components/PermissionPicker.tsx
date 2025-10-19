import React, { useState, useMemo } from "react";
import {
  Card,
  Checkbox,
  Collapse,
  Space,
  Tag,
  Input,
  Empty,
  Typography,
  Row,
  Col,
  Button,
} from "antd";
import {
  SearchOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import {
  getPermissionsByCategory,
  getPermissionDisplayName,
} from "../utils/permissions";

const { Panel } = Collapse;
const { Text } = Typography;
const { Search } = Input;

interface PermissionPickerProps {
  value?: string[];
  onChange?: (permissions: string[]) => void;
  disabled?: boolean;
}

const PermissionPicker: React.FC<PermissionPickerProps> = ({
  value = [],
  onChange,
  disabled = false,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const permissionGroups = useMemo(() => getPermissionsByCategory(), []);

  // Filter permission groups based on search
  const filteredGroups = useMemo(() => {
    if (!searchTerm) return permissionGroups;

    return permissionGroups
      .map((group) => ({
        ...group,
        permissions: group.permissions.filter(
          (permission) =>
            permission.toLowerCase().includes(searchTerm.toLowerCase()) ||
            group.displayName
              .toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            getPermissionDisplayName(permission)
              .toLowerCase()
              .includes(searchTerm.toLowerCase()),
        ),
      }))
      .filter((group) => group.permissions.length > 0);
  }, [permissionGroups, searchTerm]);

  const handlePermissionChange = (permission: string, checked: boolean) => {
    if (disabled) return;

    let newPermissions: string[];
    if (checked) {
      newPermissions = [...value, permission];
    } else {
      newPermissions = value.filter((p) => p !== permission);
    }

    onChange?.(newPermissions);
  };

  const handleGroupChange = (groupPermissions: string[], checked: boolean) => {
    if (disabled) return;

    let newPermissions: string[];
    if (checked) {
      // Add all permissions from this group
      newPermissions = Array.from(new Set([...value, ...groupPermissions]));
    } else {
      // Remove all permissions from this group
      newPermissions = value.filter((p) => !groupPermissions.includes(p));
    }

    onChange?.(newPermissions);
  };

  const isGroupFullyChecked = (groupPermissions: string[]): boolean => {
    return groupPermissions.every((permission) => value.includes(permission));
  };

  const isGroupPartiallyChecked = (groupPermissions: string[]): boolean => {
    const checkedCount = groupPermissions.filter((permission) =>
      value.includes(permission),
    ).length;
    return checkedCount > 0 && checkedCount < groupPermissions.length;
  };

  const handleSelectAll = () => {
    if (disabled) return;
    const allPermissions = permissionGroups.flatMap(
      (group) => group.permissions,
    );
    onChange?.(allPermissions);
  };

  const handleDeselectAll = () => {
    if (disabled) return;
    onChange?.([]);
  };

  return (
    <div>
      <Space direction="vertical" style={{ width: "100%", marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Search
              placeholder="Tìm kiếm quyền..."
              allowClear
              enterButton={<SearchOutlined />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={disabled}
            />
          </Col>
          <Col>
            <Space>
              <Button
                icon={<CheckCircleOutlined />}
                onClick={handleSelectAll}
                disabled={disabled}
                size="small"
              >
                Chọn tất cả
              </Button>
              <Button
                icon={<CloseCircleOutlined />}
                onClick={handleDeselectAll}
                disabled={disabled}
                size="small"
              >
                Bỏ chọn tất cả
              </Button>
            </Space>
          </Col>
        </Row>

        <div>
          <Text type="secondary">
            Đã chọn: <strong>{value.length}</strong> quyền
          </Text>
        </div>
      </Space>

      {filteredGroups.length === 0 ? (
        <Empty description="Không tìm thấy quyền phù hợp" />
      ) : (
        <Collapse
          defaultActiveKey={filteredGroups.map((g) => g.category)}
          bordered={false}
        >
          {filteredGroups.map((group) => {
            const isFullyChecked = isGroupFullyChecked(group.permissions);
            const isPartiallyChecked = isGroupPartiallyChecked(
              group.permissions,
            );

            return (
              <Panel
                key={group.category}
                header={
                  <Space>
                    <Checkbox
                      checked={isFullyChecked}
                      indeterminate={isPartiallyChecked}
                      onChange={(e) =>
                        handleGroupChange(group.permissions, e.target.checked)
                      }
                      disabled={disabled}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <strong>{group.displayName}</strong>
                    </Checkbox>
                    <Tag
                      color={
                        isFullyChecked
                          ? "success"
                          : isPartiallyChecked
                            ? "warning"
                            : "default"
                      }
                    >
                      {
                        group.permissions.filter((p) => value.includes(p))
                          .length
                      }
                      /{group.permissions.length}
                    </Tag>
                  </Space>
                }
              >
                <Space direction="vertical" style={{ width: "100%" }}>
                  {group.permissions.map((permission) => (
                    <Checkbox
                      key={permission}
                      checked={value.includes(permission)}
                      onChange={(e) =>
                        handlePermissionChange(permission, e.target.checked)
                      }
                      disabled={disabled}
                      style={{ width: "100%", marginLeft: 0 }}
                    >
                      <Space>
                        <Text code style={{ fontSize: "12px" }}>
                          {permission}
                        </Text>
                        <Text type="secondary">
                          - {getPermissionDisplayName(permission)}
                        </Text>
                      </Space>
                    </Checkbox>
                  ))}
                </Space>
              </Panel>
            );
          })}
        </Collapse>
      )}
    </div>
  );
};

export default PermissionPicker;
