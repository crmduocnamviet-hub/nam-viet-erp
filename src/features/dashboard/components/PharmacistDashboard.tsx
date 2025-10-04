// src/features/dashboard/components/PharmacistDashboard.tsx

import React from "react";
import { Row, Col, Card, Space, List, Tag, Typography } from "antd";
import {
  ShoppingBasket,
  BookHeart,
  Sparkles,
  GraduationCap,
} from "lucide-react";

// Dữ liệu giả lập
const mockPrescriptions = [
  { patient: "Nguyễn Văn Bình", doctor: "BS. Minh", time: "5 phút trước" },
  { patient: "Trần Thị Mai", doctor: "BS. An", time: "12 phút trước" },
];
const mockCrmTasks = [
  {
    type: "call",
    patient: "Anh Nguyễn Văn A",
    task: "Hỏi thăm tình hình sử dụng thuốc huyết áp mới.",
  },
  {
    type: "zalo",
    patient: "Chị Trần Thị B",
    task: "Nhắc lịch tiêm mũi HPV thứ 2 vào tuần tới.",
  },
];
const mockSalesFocus = [
  {
    title: "Gói Chăm Sóc Bé Ốm Mùa Tựu Trường",
    discount: "15%",
    tag: "HÔM NAY",
  },
  { title: "Tư vấn thêm Men vi sinh khi bán Kháng sinh", tag: "GỢI Ý" },
];
const mockTraining = [
  { type: "ĐỌC NGAY", title: "Hướng dẫn sử dụng thuốc X mới (5 phút)" },
  {
    type: "XEM VIDEO",
    title: "Kỹ năng xử lý khi khách hàng phàn nàn (10 phút)",
  },
];

const PharmacistDashboard: React.FC = () => {
  return (
    <Row gutter={[24, 24]}>
      <Col xs={24} md={12}>
        <Card
          title={
            <Space>
              <ShoppingBasket size={18} />
              Đơn thuốc mới từ PK
            </Space>
          }
        >
          <List
            dataSource={mockPrescriptions}
            renderItem={(item) => (
              <List.Item>
                {item.patient} -{" "}
                <Typography.Text type="secondary">
                  {item.doctor} ({item.time})
                </Typography.Text>
              </List.Item>
            )}
          />
        </Card>
      </Col>
      <Col xs={24} md={12}>
        <Card
          title={
            <Space>
              <BookHeart size={18} />
              Nhiệm vụ Chăm sóc KH
            </Space>
          }
        >
          <List
            dataSource={mockCrmTasks}
            renderItem={(item) => (
              <List.Item>
                <Tag>{item.type.toUpperCase()}</Tag> {item.patient} -{" "}
                {item.task}
              </List.Item>
            )}
          />
        </Card>
      </Col>
      <Col xs={24} md={12}>
        <Card
          title={
            <Space>
              <Sparkles size={18} />
              Chương trình Bán hàng
            </Space>
          }
        >
          <List
            dataSource={mockSalesFocus}
            renderItem={(item) => (
              <List.Item>
                <Tag color="blue">{item.tag}</Tag> {item.title}{" "}
                <strong>{item.discount}</strong>
              </List.Item>
            )}
          />
        </Card>
      </Col>
      <Col xs={24} md={12}>
        <Card
          title={
            <Space>
              <GraduationCap size={18} />
              Góc Đào tạo
            </Space>
          }
        >
          <List
            dataSource={mockTraining}
            renderItem={(item) => (
              <List.Item>
                <Tag color="purple">{item.type}</Tag>
                <a>{item.title}</a>
              </List.Item>
            )}
          />
        </Card>
      </Col>
    </Row>
  );
};

export default PharmacistDashboard;
