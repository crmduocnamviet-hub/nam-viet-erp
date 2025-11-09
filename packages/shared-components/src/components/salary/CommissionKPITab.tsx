/**
 * Commission & KPI Tab - Cấu hình Hoa Hồng & KPIs
 *
 * Tab quản lý các chính sách KPI và Hoa hồng
 */

import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  Space,
  Tag,
  Typography,
  Collapse,
  Popconfirm,
  App,
  Empty,
  Descriptions,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  TrophyOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import {
  KPIPolicy,
  CommissionPolicyItem,
  CommissionTierConfig,
} from "../../types/salary";
import { formatCurrency } from "../../utils";
import {
  getKPIPolicies,
  deleteKPIPolicy,
  deleteCommissionPolicy,
} from "@nam-viet-erp/services";
import KPIPolicyFormModal from "./KPIPolicyFormModal";
import CommissionPolicyFormModal from "./CommissionPolicyFormModal";
import {
  formatRoleTitles,
  getMeasurementPeriodTitle,
  getKPITypeTitle,
} from "../../constants/roles";

const { Title, Text } = Typography;
const { Panel } = Collapse;

const CommissionKPITab: React.FC = () => {
  const { message: messageApi } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [kpiPolicies, setKpiPolicies] = useState<KPIPolicy[]>([]);
  const [kpiModalVisible, setKpiModalVisible] = useState(false);
  const [commissionModalVisible, setCommissionModalVisible] = useState(false);
  const [editingKPI, setEditingKPI] = useState<KPIPolicy | null>(null);
  const [editingCommission, setEditingCommission] =
    useState<CommissionPolicyItem | null>(null);
  const [selectedKPIId, setSelectedKPIId] = useState<string>("");

  useEffect(() => {
    loadKPIPolicies();
  }, []);

  const loadKPIPolicies = async () => {
    setLoading(true);
    try {
      const { data, error } = await getKPIPolicies();

      if (error) {
        console.error("Error loading KPI policies:", error);
        messageApi.error("Không thể tải chính sách KPI: " + error.message);
        return;
      }

      setKpiPolicies(data || []);
    } catch (error: any) {
      console.error("Exception loading KPI policies:", error);
      messageApi.error("Không thể tải chính sách KPI");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKPI = () => {
    setEditingKPI(null);
    setKpiModalVisible(true);
  };

  const handleEditKPI = (kpi: KPIPolicy) => {
    setEditingKPI(kpi);
    setKpiModalVisible(true);
  };

  const handleDeleteKPI = async (kpi: KPIPolicy) => {
    try {
      const { error } = await deleteKPIPolicy(kpi.kpi_id);

      if (error) {
        console.error("Error deleting KPI policy:", error);
        messageApi.error("Không thể xóa chính sách KPI: " + error.message);
        return;
      }

      messageApi.success(`Đã xóa chính sách KPI "${kpi.kpi_name}"`);
      loadKPIPolicies();
    } catch (error: any) {
      console.error("Exception deleting KPI policy:", error);
      messageApi.error("Không thể xóa chính sách KPI");
    }
  };

  const handleCreateCommission = (kpiId: string) => {
    setSelectedKPIId(kpiId);
    setEditingCommission(null);
    setCommissionModalVisible(true);
  };

  const handleEditCommission = (
    kpiId: string,
    commission: CommissionPolicyItem,
  ) => {
    setSelectedKPIId(kpiId);
    setEditingCommission(commission);
    setCommissionModalVisible(true);
  };

  const handleDeleteCommission = async (commission: CommissionPolicyItem) => {
    try {
      const { error } = await deleteCommissionPolicy(commission.id);

      if (error) {
        console.error("Error deleting commission policy:", error);
        messageApi.error("Không thể xóa chính sách hoa hồng: " + error.message);
        return;
      }

      messageApi.success(
        `Đã xóa chính sách hoa hồng "${commission.policy_name}"`,
      );
      loadKPIPolicies();
    } catch (error: any) {
      console.error("Exception deleting commission policy:", error);
      messageApi.error("Không thể xóa chính sách hoa hồng");
    }
  };

  const handleKPIModalClose = (saved: boolean) => {
    setKpiModalVisible(false);
    setEditingKPI(null);
    if (saved) {
      loadKPIPolicies();
    }
  };

  const handleCommissionModalClose = (saved: boolean) => {
    setCommissionModalVisible(false);
    setEditingCommission(null);
    setSelectedKPIId("");
    if (saved) {
      loadKPIPolicies();
    }
  };

  const renderCommissionType = (
    type: string,
    rate?: number,
    tiers?: CommissionTierConfig[],
  ) => {
    if (type === "percentage") {
      return <Tag color="blue">Phần trăm: {rate}%</Tag>;
    } else if (type === "fixed") {
      return <Tag color="green">Cố định: {formatCurrency(rate || 0)}</Tag>;
    } else if (type === "tiered") {
      return <Tag color="purple">Bậc thang ({tiers?.length || 0} bậc)</Tag>;
    }
    return <Tag>{type}</Tag>;
  };

  const renderTiersDetail = (tiers?: CommissionTierConfig[]) => {
    if (!tiers || tiers.length === 0) return null;

    return (
      <div style={{ marginTop: 8 }}>
        <Text strong>Chi tiết bậc thang:</Text>
        {tiers.map((tier, idx) => (
          <div key={idx} style={{ marginLeft: 16, marginTop: 4 }}>
            <Text>
              • {formatCurrency(tier.from)} -{" "}
              {tier.to ? formatCurrency(tier.to) : "∞"}: {tier.rate}%
              {tier.description && ` (${tier.description})`}
            </Text>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      {/* Header */}
      <Card style={{ marginBottom: 24 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <Title level={5} style={{ margin: 0 }}>
              Quản lý KPI & Hoa hồng
            </Title>
            <Text type="secondary">
              Tạo và quản lý các chính sách KPI và hoa hồng cho nhân viên
            </Text>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreateKPI}
          >
            Thêm chính sách KPI
          </Button>
        </div>
      </Card>

      {/* KPI Policies List */}
      {loading ? (
        <Card loading={loading} />
      ) : kpiPolicies.length === 0 ? (
        <Card>
          <Empty
            description="Chưa có chính sách KPI nào"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button type="primary" onClick={handleCreateKPI}>
              Tạo chính sách KPI đầu tiên
            </Button>
          </Empty>
        </Card>
      ) : (
        <Collapse
          accordion
          expandIconPosition="end"
          style={{ background: "white" }}
        >
          {kpiPolicies.map((kpi) => (
            <Panel
              header={
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Space>
                    <TrophyOutlined
                      style={{ fontSize: 18, color: "#1890ff" }}
                    />
                    <Text strong style={{ fontSize: 16 }}>
                      {kpi.kpi_name}
                    </Text>
                    <Tag color={kpi.kpi_is_active ? "green" : "red"}>
                      {kpi.kpi_is_active ? "Đang áp dụng" : "Ngừng"}
                    </Tag>
                  </Space>
                </div>
              }
              key={kpi.kpi_id}
              extra={
                <Space size="small" onClick={(e) => e.stopPropagation()}>
                  <Button
                    type="link"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => handleEditKPI(kpi)}
                  >
                    Sửa
                  </Button>
                  <Popconfirm
                    title="Xác nhận xóa"
                    description={`Bạn có chắc muốn xóa KPI "${kpi.kpi_name}"? Tất cả chính sách hoa hồng liên quan sẽ bị xóa.`}
                    onConfirm={() => handleDeleteKPI(kpi)}
                    okText="Xóa"
                    cancelText="Hủy"
                    okButtonProps={{ danger: true }}
                  >
                    <Button
                      type="link"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                    >
                      Xóa
                    </Button>
                  </Popconfirm>
                </Space>
              }
            >
              {/* KPI Details */}
              <Descriptions bordered size="small" column={2}>
                <Descriptions.Item label="Loại KPI">
                  {getKPITypeTitle(kpi.kpi_type)}
                </Descriptions.Item>
                <Descriptions.Item label="Chu kỳ đo lường">
                  {getMeasurementPeriodTitle(kpi.measurement_period)}
                </Descriptions.Item>
                <Descriptions.Item label="Mục tiêu mặc định">
                  {kpi.default_target
                    ? formatCurrency(kpi.default_target)
                    : "Không có"}
                </Descriptions.Item>
                <Descriptions.Item label="Vai trò áp dụng">
                  {formatRoleTitles(kpi.kpi_applicable_roles)}
                </Descriptions.Item>
                {kpi.description && (
                  <Descriptions.Item label="Mô tả" span={2}>
                    {kpi.description}
                  </Descriptions.Item>
                )}
              </Descriptions>

              {/* Commission Policies */}
              <Card
                title={
                  <Space>
                    <DollarOutlined />
                    <span>Chính sách Hoa hồng</span>
                  </Space>
                }
                size="small"
                style={{ marginTop: 16 }}
                extra={
                  <Button
                    type="primary"
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={() => handleCreateCommission(kpi.kpi_id)}
                  >
                    Thêm chính sách hoa hồng
                  </Button>
                }
              >
                {kpi.commission_policies.length === 0 ? (
                  <Empty
                    description="Chưa có chính sách hoa hồng"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                ) : (
                  kpi.commission_policies.map((commission) => (
                    <Card
                      key={commission.id}
                      size="small"
                      style={{ marginBottom: 8 }}
                      title={
                        <Space>
                          <Text strong>{commission.policy_name}</Text>
                          <Tag color={commission.is_active ? "green" : "red"}>
                            {commission.is_active ? "Đang áp dụng" : "Ngừng"}
                          </Tag>
                        </Space>
                      }
                      extra={
                        <Space size="small">
                          <Button
                            type="link"
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() =>
                              handleEditCommission(kpi.kpi_id, commission)
                            }
                          >
                            Sửa
                          </Button>
                          <Popconfirm
                            title="Xác nhận xóa"
                            description={`Bạn có chắc muốn xóa chính sách "${commission.policy_name}"?`}
                            onConfirm={() => handleDeleteCommission(commission)}
                            okText="Xóa"
                            cancelText="Hủy"
                            okButtonProps={{ danger: true }}
                          >
                            <Button
                              type="link"
                              danger
                              size="small"
                              icon={<DeleteOutlined />}
                            >
                              Xóa
                            </Button>
                          </Popconfirm>
                        </Space>
                      }
                    >
                      <Space direction="vertical" style={{ width: "100%" }}>
                        <div>
                          <Text strong>Loại hoa hồng: </Text>
                          {renderCommissionType(
                            commission.commission_type,
                            commission.commission_rate,
                            commission.tiers,
                          )}
                        </div>

                        {commission.commission_type === "tiered" &&
                          renderTiersDetail(commission.tiers)}

                        {commission.min_threshold && (
                          <div>
                            <Text strong>Ngưỡng tối thiểu: </Text>
                            <Text>
                              {formatCurrency(commission.min_threshold)}
                            </Text>
                          </div>
                        )}

                        {commission.max_commission && (
                          <div>
                            <Text strong>Hoa hồng tối đa: </Text>
                            <Text>
                              {formatCurrency(commission.max_commission)}
                            </Text>
                          </div>
                        )}

                        {commission.applicable_roles &&
                          commission.applicable_roles.length > 0 && (
                            <div>
                              <Text strong>Vai trò áp dụng: </Text>
                              <Text>
                                {formatRoleTitles(commission.applicable_roles)}
                              </Text>
                            </div>
                          )}
                      </Space>
                    </Card>
                  ))
                )}
              </Card>
            </Panel>
          ))}
        </Collapse>
      )}

      {/* Modals */}
      <KPIPolicyFormModal
        visible={kpiModalVisible}
        kpiPolicy={editingKPI}
        onClose={handleKPIModalClose}
      />

      <CommissionPolicyFormModal
        visible={commissionModalVisible}
        kpiId={selectedKPIId}
        commissionPolicy={editingCommission}
        onClose={handleCommissionModalClose}
      />
    </div>
  );
};

export default CommissionKPITab;
