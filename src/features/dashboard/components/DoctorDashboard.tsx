// src/features/dashboard/components/DoctorDashboard.tsx

import React from "react";
import { Row, Col, Card, Space, List, Tag, Typography } from "antd";
import { UserCheck, FlaskConical } from "lucide-react";

const { Text } = Typography;

// Dữ liệu giả lập
const mockPatientQueue = [
  { name: "Trần Thị Hoa", status: "Đã check-in", time: "15:10" },
  { name: "Lê Văn Dũng", status: "Đã check-in", time: "15:15" },
];

const mockLabResults = [
  {
    patient: "Đặng Thị G",
    test: "Kali máu",
    status: "KHẨN CẤP",
    level: "critical",
  },
  {
    patient: "Phạm Thị E",
    test: "Công thức máu",
    status: "Bất thường",
    level: "warning",
  },
  {
    patient: "Vũ Văn F",
    test: "Đường huyết",
    status: "BÌNH THƯỜNG",
    level: "normal",
  },
];

const DoctorDashboard: React.FC = () => {
  return (
    <Row gutter={[24, 24]}>
      <Col xs={24} lg={12}>
        <Card
          title={
            <Space>
              <UserCheck size={18} />
              Hàng đợi Bệnh nhân
            </Space>
          }
        >
          <List
            dataSource={mockPatientQueue}
            renderItem={(item) => (
              <List.Item>
                <Typography.Text strong>{item.name}</Typography.Text>
                <Tag color="green">{item.status}</Tag>
              </List.Item>
            )}
          />
        </Card>
      </Col>
      <Col xs={24} lg={12}>
        <Card
          title={
            <Space>
              <FlaskConical size={18} />
              Hộp thư Kết quả Cận lâm sàng
            </Space>
          }
        >
          <List
            dataSource={mockLabResults}
            renderItem={(item) => (
              <List.Item>
                <Text strong>{item.patient}</Text>
                <Text>{item.test}</Text>
                <Tag
                  color={
                    item.level === "critical"
                      ? "red"
                      : item.level === "warning"
                      ? "orange"
                      : "default"
                  }
                >
                  {item.status}
                </Tag>
              </List.Item>
            )}
          />
        </Card>
      </Col>
    </Row>
  );
};

export default DoctorDashboard;
