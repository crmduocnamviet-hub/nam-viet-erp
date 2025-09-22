import React from 'react';
import { Card, Typography, Button, List } from 'antd';
import { RobotOutlined, CheckCircleOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

const AiAdvisor: React.FC = () => {
    const analysis = {
        strengths: [
            'ROI kênh Zalo ZNS rất cao (1150%), cho thấy hiệu quả vượt trội.',
            'Tỷ lệ chuyển đổi từ "Click" sang "Thêm vào giỏ" tốt (50%).'
        ],
        weaknesses: [
            'CPA kênh Facebook Ads và SMS còn cao, cần tối ưu chi phí.',
            'Tỷ lệ thoát ở giai đoạn "Tiếp cận" sang "Tương tác" là 20%, có thể cải thiện.'
        ],
        suggestions: [
            'Tăng ngân sách cho kênh Zalo ZNS thêm 30% để khai thác tối đa tiềm năng.',
            'Tạo chiến dịch retargeting trên Facebook cho những người đã "Thêm vào giỏ" nhưng chưa "Thanh toán".',
            'Thử nghiệm nội dung SMS mới, tập trung vào ưu đãi độc quyền để tăng tỷ lệ chuyển đổi.'
        ]
    };

    return (
        <Card style={{ background: '#f0f5ff' }}>
            <Title level={4}><RobotOutlined /> Cố vấn Marketing AI</Title>
            <Paragraph>Dựa trên dữ liệu từ 30 ngày qua, AI đưa ra các phân tích và gợi ý sau:</Paragraph>
            
            <Title level={5}>Điểm mạnh</Title>
            <List
                dataSource={analysis.strengths}
                renderItem={item => <List.Item><Text type="success">{item}</Text></List.Item>}
                size="small"
            />

            <Title level={5} style={{marginTop: 16}}>Điểm yếu</Title>
            <List
                dataSource={analysis.weaknesses}
                renderItem={item => <List.Item><Text type="danger">{item}</Text></List.Item>}
                size="small"
            />

            <Title level={5} style={{marginTop: 16}}>Gợi ý hành động</Title>
            <List
                dataSource={analysis.suggestions}
                renderItem={item => (
                    <List.Item
                        actions={[<Button size="small" icon={<CheckCircleOutlined />}>Tạo nhiệm vụ</Button>]}
                    >
                        <Text>{item}</Text>
                    </List.Item>
                )}
                size="small"
            />
        </Card>
    );
};

export default AiAdvisor;
