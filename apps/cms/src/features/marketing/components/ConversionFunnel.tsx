import React from 'react';
import { Card, Typography, Row, Col, Statistic } from 'antd';

const { Title } = Typography;

const ConversionFunnel: React.FC = () => {
    const data = [
        { stage: 'Tiếp cận', number: 10000 },
        { stage: 'Tương tác', number: 8000 },
        { stage: 'Click', number: 6000 },
        { stage: 'Thêm vào giỏ', number: 3000 },
        { stage: 'Thanh toán', number: 1500 },
    ];

    const config = {
        data: data,
        xField: 'stage',
        yField: 'number',
        legend: false,
        conversionTag: {},
    };

    return (
        <Card>
            <Title level={4}>Phễu Chuyển đổi Tổng hợp</Title>
            {/* Using Statistic as a placeholder since FunnelPlot is not in the project */}
            <Row gutter={16}>
                {data.map(item => (
                    <Col span={4} key={item.stage}>
                        <Statistic title={item.stage} value={item.number} />
                    </Col>
                ))}
            </Row>
            <div style={{marginTop: 16, textAlign: 'center', color: 'gray'}}>
                (Biểu đồ phễu sẽ được hiển thị ở đây)
            </div>
        </Card>
    );
};

export default ConversionFunnel;
