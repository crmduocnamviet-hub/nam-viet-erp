import React from 'react';
import { Card, Statistic, Typography, Space } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface KpiCardProps {
  title: string;
  value: number | string;
  precision?: number;
  prefix?: React.ReactNode;
  suffix?: string;
  change: number;
  changeLabel?: string;
  loading?: boolean;
}

const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  precision = 0,
  prefix,
  suffix,
  change,
  changeLabel = 'so với tháng trước',
  loading = false,
}) => {
  const isPositive = change >= 0;

  return (
    <Card loading={loading}>
      <Statistic
        title={title}
        value={value}
        precision={precision}
        prefix={prefix}
        suffix={suffix}
        valueStyle={{ color: '#262626', fontSize: '2em' }}
      />
      <Space style={{ marginTop: 8 }}>
        {isPositive ? (
          <ArrowUpOutlined style={{ color: '#52c41a' }} />
        ) : (
          <ArrowDownOutlined style={{ color: '#f5222d' }} />
        )}
        <Text style={{ color: isPositive ? '#52c41a' : '#f5222d' }}>
          {Math.abs(change)}%
        </Text>
        <Text type="secondary">{changeLabel}</Text>
      </Space>
    </Card>
  );
};

export default KpiCard;
