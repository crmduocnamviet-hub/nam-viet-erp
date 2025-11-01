import React, { useState, useEffect } from "react";
import { Row, Col, Space, Spin } from "antd";
import { getPromotions } from "@nam-viet-erp/services";
import { getSalesStats, getTodaysSales } from "@nam-viet-erp/services";

// KPI Card component
const KpiCard: React.FC<{
  title: string;
  value: any;
  color?: string;
  suffix?: string;
  change?: number;
}> = ({ title, value, color, suffix }) => (
  <div
    style={{
      padding: "16px",
      backgroundColor: "#fff",
      borderRadius: "8px",
      border: "1px solid #f0f0f0",
      textAlign: "center",
    }}
  >
    <div style={{ fontSize: "14px", color: "#666" }}>{title}</div>
    <div
      style={{
        fontSize: "24px",
        fontWeight: "bold",
        color: color || "#1890ff",
        marginTop: "8px",
      }}
    >
      {typeof value === "number" ? value.toLocaleString("vi-VN") : value}
      {suffix && (
        <span style={{ fontSize: "16px", marginLeft: "4px" }}>{suffix}</span>
      )}
    </div>
  </div>
);

const CampaignCalendar: React.FC = () => (
  <div
    style={{
      padding: "20px",
      backgroundColor: "#f5f5f5",
      borderRadius: "8px",
      textAlign: "center",
    }}
  >
    <p>📅 Lịch chiến dịch marketing</p>
    <p style={{ color: "#666", fontSize: "14px" }}>
      Component lịch chiến dịch đang được phát triển
    </p>
  </div>
);

const ConversionFunnel: React.FC = () => (
  <div
    style={{
      padding: "20px",
      backgroundColor: "#f5f5f5",
      borderRadius: "8px",
      textAlign: "center",
    }}
  >
    <p>📈 Phễu chuyển đổi</p>
    <p style={{ color: "#666", fontSize: "14px" }}>
      Biểu đồ phễu chuyển đổi đang được phát triển
    </p>
  </div>
);

const ChannelPerformance: React.FC = () => (
  <div
    style={{
      padding: "20px",
      backgroundColor: "#f5f5f5",
      borderRadius: "8px",
      textAlign: "center",
    }}
  >
    <p>📊 Hiệu suất kênh</p>
    <p style={{ color: "#666", fontSize: "14px" }}>
      Báo cáo hiệu suất kênh đang được phát triển
    </p>
  </div>
);

const AiAdvisor: React.FC = () => (
  <div
    style={{
      padding: "20px",
      backgroundColor: "#f5f5f5",
      borderRadius: "8px",
      textAlign: "center",
    }}
  >
    <p>🤖 AI Marketing Advisor</p>
    <p style={{ color: "#666", fontSize: "14px" }}>
      Tính năng tư vấn AI đang được phát triển
    </p>
  </div>
);

const MarketingDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCost: 0,
    newCustomers: 0,
    averageCPA: 0,
    totalROI: 0,
  });

  useEffect(() => {
    loadMarketingStats();
  }, []);

  const loadMarketingStats = async () => {
    try {
      setLoading(true);

      // Fetch promotions and sales data
      const [promotionsRes, salesStatsRes, todaySalesRes] = await Promise.all([
        getPromotions(),
        getSalesStats(),
        getTodaysSales(),
      ]);

      // Check for errors
      if (promotionsRes.error) {
        console.error("Error loading promotions:", promotionsRes.error);
      }
      if (salesStatsRes.error) {
        console.error("Error loading sales stats:", salesStatsRes.error);
      }
      if (todaySalesRes.error) {
        console.error("Error loading today sales:", todaySalesRes.error);
      }

      // Calculate marketing KPIs from real data
      // Only use promotions data if there's no error
      const promotions = promotionsRes.error ? [] : promotionsRes.data || [];
      const salesStats = salesStatsRes.data || {};

      // getTodaysSales returns array of orders, count unique customers
      const todayOrders = todaySalesRes.data || [];
      const uniqueCustomersToday = new Set(
        todayOrders
          .filter((order: any) => order.patient_id)
          .map((order: any) => order.patient_id),
      ).size;

      // Calculate total cost from promotions (can be enhanced with actual marketing spend data)
      const totalCost = promotions.reduce((sum: number, promo: any) => {
        return sum + (promo.budget || 0);
      }, 0);

      // New customers - count unique customers from today's sales
      const newCustomers = uniqueCustomersToday;

      // Average CPA (Cost Per Acquisition) - simplified calculation
      const averageCPA = newCustomers > 0 ? totalCost / newCustomers : 0;

      // Total ROI - simplified calculation (Revenue / Cost * 100)
      const totalRevenue = salesStats.totalRevenue || 0;
      const totalROI = totalCost > 0 ? (totalRevenue / totalCost) * 100 : 0;

      setStats({
        totalCost,
        newCustomers,
        averageCPA: Math.round(averageCPA),
        totalROI: Math.round(totalROI * 100) / 100,
      });
    } catch (error) {
      console.error("Error loading marketing stats:", error);
      // Keep default stats on error
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <KpiCard title="Tổng chi phí" value={stats.totalCost} suffix="đ" />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <KpiCard
            title="Khách hàng mới (hôm nay)"
            value={stats.newCustomers}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <KpiCard title="CPA trung bình" value={stats.averageCPA} suffix="đ" />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <KpiCard title="ROI Tổng" value={stats.totalROI} suffix="%" />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <CampaignCalendar />
        </Col>
        <Col xs={24} lg={8}>
          <AiAdvisor />
        </Col>
      </Row>

      <Row>
        <Col span={24}>
          <ConversionFunnel />
        </Col>
      </Row>

      <Row>
        <Col span={24}>
          <ChannelPerformance />
        </Col>
      </Row>
    </Space>
  );
};

export default MarketingDashboard;
