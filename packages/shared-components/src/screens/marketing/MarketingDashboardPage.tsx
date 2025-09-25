import React from 'react';
import { Row, Col, Space } from 'antd';
// Temporary stub components to replace missing marketing components
const KpiCard: React.FC<{ title: string; value: any; color?: string; suffix?: string; change?: number }> = ({ title, value, color }) => (
  <div style={{ padding: '16px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #f0f0f0', textAlign: 'center' }}>
    <div style={{ fontSize: '14px', color: '#666' }}>{title}</div>
    <div style={{ fontSize: '24px', fontWeight: 'bold', color: color || '#1890ff', marginTop: '8px' }}>{value}</div>
  </div>
);

const CampaignCalendar: React.FC = () => (
  <div style={{ padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px', textAlign: 'center' }}>
    <p>📅 Lịch chiến dịch marketing</p>
    <p style={{ color: '#666', fontSize: '14px' }}>Component lịch chiến dịch đang được phát triển</p>
  </div>
);

const ConversionFunnel: React.FC = () => (
  <div style={{ padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px', textAlign: 'center' }}>
    <p>📈 Phễu chuyển đổi</p>
    <p style={{ color: '#666', fontSize: '14px' }}>Biểu đồ phễu chuyển đổi đang được phát triển</p>
  </div>
);

const ChannelPerformance: React.FC = () => (
  <div style={{ padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px', textAlign: 'center' }}>
    <p>📊 Hiệu suất kênh</p>
    <p style={{ color: '#666', fontSize: '14px' }}>Báo cáo hiệu suất kênh đang được phát triển</p>
  </div>
);

const AiAdvisor: React.FC = () => (
  <div style={{ padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px', textAlign: 'center' }}>
    <p>🤖 AI Marketing Advisor</p>
    <p style={{ color: '#666', fontSize: '14px' }}>Tính năng tư vấn AI đang được phát triển</p>
  </div>
);

const MarketingDashboard: React.FC = () => {
  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <KpiCard title="Tổng chi phí" value={11000000} suffix="đ" change={15} />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <KpiCard title="Khách hàng mới" value={480} change={-5} />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <KpiCard title="CPA trung bình" value={22916} suffix="đ" change={20} />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <KpiCard title="ROI Tổng" value={336} suffix="%" change={-10} />
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
