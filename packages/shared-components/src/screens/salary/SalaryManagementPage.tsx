/**
 * Salary Management Page - Quản lý Lương & Thưởng
 *
 * Main page kết hợp 3 tabs:
 * 1. Cấu trúc Lương & Phụ Cấp (Lương cơ bản)
 * 2. Cấu hình Hoa Hồng & KPIs (Lương kinh doanh, READ-ONLY)
 * 3. Chính sách Thâm Niên (Tự động tính)
 */

import React, { useState } from "react";
import { Card, Tabs, Typography, Space } from "antd";
import {
  DollarOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import SalaryStructureTab from "../../components/salary/SalaryStructureTab";
import CommissionKPITab from "../../components/salary/CommissionKPITab";
import SeniorityPolicyTab from "../../components/salary/SeniorityPolicyTab";

const { Title, Text } = Typography;

type TabKey = "salary" | "commission" | "seniority";

const SalaryManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>("salary");

  const tabItems = [
    {
      key: "salary" as TabKey,
      label: (
        <Space>
          <DollarOutlined />
          <span>Cấu trúc Lương & Phụ Cấp</span>
        </Space>
      ),
      children: <SalaryStructureTab />,
    },
    {
      key: "commission" as TabKey,
      label: (
        <Space>
          <TrophyOutlined />
          <span>Cấu hình Hoa Hồng & KPIs</span>
        </Space>
      ),
      children: <CommissionKPITab />,
    },
    {
      key: "seniority" as TabKey,
      label: (
        <Space>
          <ClockCircleOutlined />
          <span>Chính sách Thâm Niên</span>
        </Space>
      ),
      children: <SeniorityPolicyTab />,
    },
  ];

  return (
    <div style={{ padding: "0 12px 12px" }}>
      {/* Page Header */}
      <div style={{ marginBottom: 16 }}>
        <Title level={2} style={{ marginBottom: 8 }}>
          Quản lý Lương & Thưởng
        </Title>
        <Text type="secondary">
          Hệ thống quản lý lương bổng, hoa hồng và thưởng cho nhân viên
        </Text>
      </div>

      {/* Tabs */}
      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as TabKey)}
        items={tabItems}
        size="large"
      />
    </div>
  );
};

export default SalaryManagementPage;
