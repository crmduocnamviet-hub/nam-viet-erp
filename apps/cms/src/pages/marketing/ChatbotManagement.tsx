import React from 'react';
import { Card, Typography, List, Avatar, Input, Button, Space } from 'antd';
import { RobotOutlined, UserOutlined, SendOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const ChatbotManagement: React.FC = () => {
    const chatHistory = [
        { from: 'user', text: 'Chào bạn, tôi muốn hỏi về công dụng của thuốc Panadol Extra.' },
        { from: 'bot', text: 'Chào bạn, Panadol Extra chứa Paracetamol 500mg và Caffeine 65mg, có tác dụng giảm đau nhanh các triệu chứng như đau đầu, đau nửa đầu, đau cơ, và hạ sốt. Bạn cần thêm thông tin gì không ạ?' },
        { from: 'user', text: 'Liều dùng cho người lớn như thế nào?' },
        { from: 'bot', text: 'Đối với người lớn, liều thông thường là 1-2 viên mỗi 4-6 giờ, không quá 8 viên một ngày. Để có thông tin chính xác nhất, bạn nên tham khảo ý kiến bác sĩ hoặc dược sĩ.' },
        { from: 'user', text: 'Tôi muốn đặt hàng với số lượng lớn cho nhà thuốc, tôi cần liên hệ ai?' },
        { from: 'bot', text: 'Rất tiếc, tôi chưa được huấn luyện để xử lý yêu cầu này. Tôi đã tạo một nhiệm vụ ưu tiên cao và chuyển đến bộ phận Kinh doanh B2B. Các chuyên viên sẽ liên hệ với bạn trong thời gian sớm nhất. Bạn có cần hỗ trợ gì thêm không ạ?' },
    ];

  return (
    <Card>
      <Title level={2}>Quản lý Chatbot AI</Title>
      <div style={{ height: '60vh', border: '1px solid #f0f0f0', borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'column' }}>
        <List
            style={{flexGrow: 1, overflowY: 'auto'}}
            dataSource={chatHistory}
            renderItem={item => (
                <List.Item style={{border: 'none'}}>
                    <List.Item.Meta
                        avatar={item.from === 'bot' ? <Avatar icon={<RobotOutlined />} /> : <Avatar icon={<UserOutlined />} />}
                        title={item.from === 'bot' ? 'Chatbot AI' : 'Khách hàng'}
                        description={item.text}
                    />
                </List.Item>
            )}
        />
        <Space.Compact style={{marginTop: 16}}>
            <Input placeholder="Nhập tin nhắn..." />
            <Button type="primary" icon={<SendOutlined />} />
        </Space.Compact>
      </div>
    </Card>
  );
};

export default ChatbotManagement;
