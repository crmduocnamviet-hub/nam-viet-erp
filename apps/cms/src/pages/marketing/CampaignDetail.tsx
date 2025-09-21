import React, { useState } from "react";
import {
  Steps,
  Button,
  Card,
  Form,
  Input,
  DatePicker,
  InputNumber,
  Select,
  Row,
  Col,
  App,
  Typography,
  Space,
} from "antd";
import {
  SaveOutlined,
  ArrowLeftOutlined,
  UsergroupAddOutlined,
  MessageOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import SegmentBuilder from "../../features/marketing/components/SegmentBuilder";

const { Title } = Typography;
const { RangePicker } = DatePicker;

const CampaignDetail: React.FC = () => {
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();
  const params = useParams();
  const isCreating = !params.id;

  const steps = [
    { title: "Thiết lập Cơ bản", icon: <EyeOutlined /> },
    { title: "Đối tượng Mục tiêu", icon: <UsergroupAddOutlined /> },
    { title: "Nội dung & Kênh", icon: <MessageOutlined /> },
  ];

  const next = () => setCurrent(current + 1);
  const prev = () => setCurrent(current - 1);

  return (
    <App>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate("/marketing/campaigns")}
              />
              <Title level={2} style={{ marginBottom: 0 }}>
                {isCreating ? "Tạo Chiến dịch mới" : "Chi tiết Chiến dịch"}
              </Title>
            </Space>
          </Col>
          <Col>
            <Button type="primary" icon={<SaveOutlined />}>
              Lưu chiến dịch
            </Button>
          </Col>
        </Row>

        <Steps current={current} items={steps} />

        <div style={{ marginTop: 24 }}>
          {current === 0 && (
            <Card title="Bước 1: Thiết lập Cơ bản">
              <Form layout="vertical">
                <Form.Item label="Tên chiến dịch" required>
                  <Input />
                </Form.Item>
                <Form.Item label="Mục tiêu">
                  <Select
                    options={[
                      { value: "conversion", label: "Tăng chuyển đổi" },
                      { value: "awareness", label: "Tăng nhận diện" },
                    ]}
                  />
                </Form.Item>
                <Form.Item label="Thời gian">
                  <RangePicker style={{ width: "100%" }} />
                </Form.Item>
                <Form.Item label="Ngân sách">
                  <InputNumber style={{ width: "100%" }} addonAfter="VNĐ" />
                </Form.Item>
              </Form>
            </Card>
          )}
          {current === 1 && <SegmentBuilder />}
          {current === 2 && (
            <Card title="Bước 3: Thiết kế Nội dung và Kênh">
              <Form layout="vertical">
                <Form.Item label="Chọn kênh">
                  <Select
                    mode="multiple"
                    options={[
                      { value: "zalo", label: "Zalo ZNS" },
                      { value: "sms", label: "SMS" },
                      { value: "facebook", label: "Facebook Post" },
                    ]}
                  />
                </Form.Item>
                <Form.Item label="Nội dung tin nhắn">
                  <Input.TextArea
                    rows={4}
                    placeholder="Xin chào {{TEN_KHACH_HANG}}, ưu đãi dành riêng cho bạn..."
                  />
                </Form.Item>
                <p>Sử dụng biến như để cá nhân hóa.</p>
              </Form>
            </Card>
          )}
        </div>

        <Space>
          {current > 0 && <Button onClick={prev}>Quay lại</Button>}
          {current < steps.length - 1 && (
            <Button type="primary" onClick={next}>
              Tiếp theo
            </Button>
          )}
          {current === steps.length - 1 && (
            <Button type="primary">Hoàn tất</Button>
          )}
        </Space>
      </Space>
    </App>
  );
};

export default CampaignDetail;
