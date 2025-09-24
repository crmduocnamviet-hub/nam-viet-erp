import React from 'react';
import { Row, Col, Space } from 'antd';
import KpiCard from '../../features/marketing/components/KpiCard';
import CampaignCalendar from '../../features/marketing/components/CampaignCalendar';
import ConversionFunnel from '../../features/marketing/components/ConversionFunnel';
import ChannelPerformance from '../../features/marketing/components/ChannelPerformance';
import AiAdvisor from '../../features/marketing/components/AiAdvisor';

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
