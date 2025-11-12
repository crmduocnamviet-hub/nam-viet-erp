/**
 * Seniority Policy Tab - Chính sách Thâm Niên
 *
 * Tab quản lý chính sách thưởng thâm niên
 * Tự động tính toán dựa trên thời gian làm việc
 */

import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Space,
  Tag,
  Card,
  Statistic,
  Row,
  Col,
  Typography,
  App,
  Popconfirm,
  Progress,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { SeniorityPolicy, EmployeeSeniority } from "../../types/salary";
import { formatCurrency } from "../../utils";
import {
  getSeniorityPolicies,
  deleteSeniorityPolicy,
} from "@nam-viet-erp/services";
import SeniorityPolicyFormModal from "./SeniorityPolicyFormModal";
import { formatRoleTitles } from "../../constants/roles";

const { Title, Text } = Typography;

const SeniorityPolicyTab: React.FC = () => {
  const { message: messageApi } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [policies, setPolicies] = useState<SeniorityPolicy[]>([]);
  const [employeeSeniority, setEmployeeSeniority] = useState<
    EmployeeSeniority[]
  >([]);
  const [activeTab, setActiveTab] = useState<"policies" | "employees">(
    "policies",
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<SeniorityPolicy | null>(
    null,
  );

  useEffect(() => {
    loadPolicies();
    loadEmployeeSeniority();
  }, []);

  const loadPolicies = async () => {
    setLoading(true);
    try {
      const { data, error } = await getSeniorityPolicies();

      if (error) {
        messageApi.error(
          "Không thể tải chính sách thâm niên: " + error.message,
        );
        return;
      }

      setPolicies(data || []);
    } catch (error) {
      console.error("Error loading seniority policies:", error);
      messageApi.error("Có lỗi xảy ra khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const loadEmployeeSeniority = () => {
    // TODO: Load from API
    const mockEmployees: EmployeeSeniority[] = [
      {
        employee_id: "emp_1",
        employee_name: "Nguyễn Văn A",
        role_key: "sales-manager",
        join_date: "2020-01-15",
        years_of_service: 4.8,
        applicable_policies: [
          {
            id: "sp_3",
            name: "Thưởng 3-5 năm",
            min_years: 3,
            max_years: 5,
            bonus_type: "percentage",
            bonus_amount: 5,
            is_active: true,
          },
        ],
        total_seniority_bonus: 750000,
        calculated_at: "2024-11-01T00:00:00Z",
      },
      {
        employee_id: "emp_2",
        employee_name: "Trần Thị B",
        role_key: "sales-staff",
        join_date: "2018-06-20",
        years_of_service: 6.4,
        applicable_policies: [
          {
            id: "sp_4",
            name: "Thưởng trên 5 năm",
            min_years: 5,
            bonus_type: "percentage",
            bonus_amount: 10,
            is_active: true,
          },
        ],
        total_seniority_bonus: 800000,
        calculated_at: "2024-11-01T00:00:00Z",
      },
      {
        employee_id: "emp_3",
        employee_name: "Lê Văn C",
        role_key: "inventory-staff",
        join_date: "2023-03-10",
        years_of_service: 1.7,
        applicable_policies: [
          {
            id: "sp_1",
            name: "Thưởng 1 năm",
            min_years: 1,
            max_years: 2,
            bonus_type: "fixed",
            bonus_amount: 2000000,
            is_active: true,
          },
        ],
        total_seniority_bonus: 2000000,
        calculated_at: "2024-11-01T00:00:00Z",
      },
    ];

    setEmployeeSeniority(mockEmployees);
  };

  const handleCreatePolicy = () => {
    setSelectedPolicy(null);
    setModalVisible(true);
  };

  const handleEditPolicy = (record: SeniorityPolicy) => {
    setSelectedPolicy(record);
    setModalVisible(true);
  };

  const handleDeletePolicy = async (record: SeniorityPolicy) => {
    try {
      const { error } = await deleteSeniorityPolicy(record.id);

      if (error) {
        messageApi.error(
          "Không thể xóa chính sách thâm niên: " + error.message,
        );
        return;
      }

      messageApi.success(`Đã xóa chính sách "${record.policy_name}"`);
      loadPolicies();
    } catch (error) {
      console.error("Error deleting seniority policy:", error);
      messageApi.error("Có lỗi xảy ra khi xóa chính sách");
    }
  };

  const handleModalClose = (saved: boolean) => {
    setModalVisible(false);
    setSelectedPolicy(null);

    if (saved) {
      loadPolicies();
    }
  };

  const policyColumns: ColumnsType<SeniorityPolicy> = [
    {
      title: "Tên chính sách",
      dataIndex: "policy_name",
      key: "policy_name",
      width: 200,
      render: (text: string, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text}</Text>
          {record.description && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.description}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: "Thời gian",
      key: "years",
      width: 150,
      render: (_, record) => {
        const max = record.years_to ? `${record.years_to} năm` : "vô hạn";
        return (
          <Tag color="blue">
            {record.years_from} - {max}
          </Tag>
        );
      },
    },
    {
      title: "Loại phụ cấp",
      dataIndex: "benefit_type",
      key: "benefit_type",
      width: 120,
      render: (type: string) => (
        <Tag color={type === "fixed" ? "green" : "orange"}>
          {type === "fixed" ? "Cố định" : "% Lương"}
        </Tag>
      ),
    },
    {
      title: "Giá trị",
      dataIndex: "benefit_value",
      key: "benefit_value",
      width: 150,
      align: "right",
      render: (amount: number, record) => {
        if (record.benefit_type === "fixed") {
          return <Text strong>{formatCurrency(amount)}</Text>;
        } else {
          return <Text strong>{amount}%</Text>;
        }
      },
    },
    {
      title: "Vai trò áp dụng",
      dataIndex: "applicable_roles",
      key: "applicable_roles",
      width: 180,
      render: (roles: string[] | null) => (
        <Text type="secondary">{formatRoleTitles(roles)}</Text>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "is_active",
      key: "is_active",
      width: 120,
      align: "center",
      render: (isActive: boolean) => (
        <Tag color={isActive ? "green" : "red"}>
          {isActive ? "Đang áp dụng" : "Ngừng"}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 150,
      align: "center",
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditPolicy(record)}
            size="small"
          >
            Sửa
          </Button>
          <Popconfirm
            title="Xác nhận xóa"
            description={`Bạn có chắc muốn xóa chính sách "${record.policy_name}"?`}
            onConfirm={() => handleDeletePolicy(record)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button type="link" danger icon={<DeleteOutlined />} size="small">
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const employeeColumns: ColumnsType<EmployeeSeniority> = [
    {
      title: "Nhân viên",
      dataIndex: "employee_name",
      key: "employee_name",
      width: 200,
      fixed: "left",
    },
    {
      title: "Ngày vào làm",
      dataIndex: "join_date",
      key: "join_date",
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString("vi-VN"),
    },
    {
      title: "Thâm niên",
      dataIndex: "years_of_service",
      key: "years_of_service",
      width: 150,
      render: (years: number) => {
        const percent = Math.min((years / 10) * 100, 100);
        return (
          <Space direction="vertical" size={0} style={{ width: "100%" }}>
            <Text strong>{years.toFixed(1)} năm</Text>
            <Progress
              percent={percent}
              size="small"
              showInfo={false}
              strokeColor="#52c41a"
            />
          </Space>
        );
      },
    },
    {
      title: "Chính sách áp dụng",
      dataIndex: "applicable_policies",
      key: "applicable_policies",
      render: (policies: SeniorityPolicy[]) => (
        <Space direction="vertical" size={0}>
          {policies.map((p) => (
            <Tag key={p.id} color="blue">
              {p.name}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: "Thưởng thâm niên",
      dataIndex: "total_seniority_bonus",
      key: "total_seniority_bonus",
      width: 150,
      align: "right",
      render: (amount: number) => (
        <Tag color="green" style={{ fontSize: 14, padding: "4px 12px" }}>
          {formatCurrency(amount)}
        </Tag>
      ),
    },
  ];

  // Statistics
  const totalPolicies = policies.length;
  const activePolicies = policies.filter((p) => p.is_active).length;
  const totalEmployees = employeeSeniority.length;
  const totalSeniorityBonus = employeeSeniority.reduce(
    (sum, e) => sum + e.total_seniority_bonus,
    0,
  );
  const avgYears =
    employeeSeniority.length > 0
      ? employeeSeniority.reduce((sum, e) => sum + e.years_of_service, 0) /
        employeeSeniority.length
      : 0;

  return (
    <div>
      {/* Statistics */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng chính sách"
              value={totalPolicies}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Đang áp dụng"
              value={activePolicies}
              valueStyle={{ color: "#3f8600" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng thưởng thâm niên"
              value={totalSeniorityBonus}
              prefix={<TrophyOutlined />}
              formatter={(value) => formatCurrency(Number(value))}
              valueStyle={{ color: "#cf1322" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Thâm niên TB"
              value={avgYears}
              suffix="năm"
              precision={1}
            />
          </Card>
        </Col>
      </Row>

      {/* Tab Switch */}
      <Card
        tabList={[
          { key: "policies", tab: "Chính sách Thâm niên" },
          { key: "employees", tab: "Thâm niên Nhân viên" },
        ]}
        activeTabKey={activeTab}
        onTabChange={(key) => setActiveTab(key as any)}
      >
        {activeTab === "policies" && (
          <>
            <div
              style={{
                marginBottom: 16,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <Title level={5} style={{ margin: 0 }}>
                  Danh sách Chính sách
                </Title>
                <Text type="secondary">
                  Quản lý các chính sách thưởng thâm niên
                </Text>
              </div>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreatePolicy}
              >
                Thêm chính sách
              </Button>
            </div>

            <Table
              columns={policyColumns}
              dataSource={policies}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showTotal: (total) => `Tổng số ${total} chính sách`,
              }}
            />
          </>
        )}

        {activeTab === "employees" && (
          <>
            <div style={{ marginBottom: 16 }}>
              <Title level={5} style={{ margin: 0 }}>
                Thâm niên Nhân viên
              </Title>
              <Text type="secondary">
                Tự động tính toán dựa trên thời gian làm việc
              </Text>
            </div>

            <Table
              columns={employeeColumns}
              dataSource={employeeSeniority}
              rowKey="employee_id"
              scroll={{ x: 1000 }}
              pagination={{
                pageSize: 10,
                showTotal: (total) => `Tổng số ${total} nhân viên`,
              }}
            />
          </>
        )}
      </Card>

      <SeniorityPolicyFormModal
        visible={modalVisible}
        seniorityPolicy={selectedPolicy}
        onClose={handleModalClose}
      />
    </div>
  );
};

export default SeniorityPolicyTab;
