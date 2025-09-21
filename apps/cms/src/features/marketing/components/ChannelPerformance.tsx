import React from 'react';
import { Card, Table, Typography, Tag } from 'antd';

const { Title } = Typography;

const ChannelPerformance: React.FC = () => {
    const columns = [
        { title: 'Kênh', dataIndex: 'channel', key: 'channel', render: (text: string) => <Tag color="blue">{text}</Tag> },
        { title: 'Chi phí', dataIndex: 'cost', key: 'cost', render: (val: number) => val.toLocaleString('vi-VN') + ' đ' },
        { title: 'Lượt chuyển đổi', dataIndex: 'conversions', key: 'conversions' },
        { title: 'CPA', dataIndex: 'cpa', key: 'cpa', render: (val: number) => val.toLocaleString('vi-VN') + ' đ' },
        { title: 'Doanh thu', dataIndex: 'revenue', key: 'revenue', render: (val: number) => val.toLocaleString('vi-VN') + ' đ' },
        { title: 'ROI', dataIndex: 'roi', key: 'roi', render: (val: number) => `${val}%` },
    ];

    const data = [
        { channel: 'Facebook Ads', cost: 5000000, conversions: 120, cpa: 41667, revenue: 15000000, roi: 200 },
        { channel: 'Zalo ZNS', cost: 2000000, conversions: 250, cpa: 8000, revenue: 25000000, roi: 1150 },
        { channel: 'SMS Brandname', cost: 3500000, conversions: 80, cpa: 43750, revenue: 10000000, roi: 185 },
        { channel: 'Email Marketing', cost: 500000, conversions: 30, cpa: 16667, revenue: 7000000, roi: 1300 },
    ];

    return (
        <Card>
            <Title level={4}>Hiệu quả theo Kênh</Title>
            <Table columns={columns} dataSource={data} pagination={false} rowKey="channel" />
        </Card>
    );
};

export default ChannelPerformance;
