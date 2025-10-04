// src/features/dashboard/components/SuggestionBoxWidget.tsx

import React, { useState } from "react";
import { Card, Space, Button, Typography, App as AntApp } from "antd";
import { Lightbulb, Send } from "lucide-react";
import SuggestionModal from "../../community/components/SuggestionModal";

const SuggestionBoxWidget: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Card
        className="dashboard-card card-border-top"
        style={{ borderColor: "#faad14" }}
      >
        <Space direction="vertical" align="center" style={{ width: "100%" }}>
          <Lightbulb size={32} color="#faad14" />
          <Typography.Title level={4} style={{ margin: "16px 0 8px 0" }}>
            Góc Góp Ý & Sáng kiến
          </Typography.Title>
          <Typography.Paragraph
            type="secondary"
            style={{ textAlign: "center" }}
          >
            Mọi ý tưởng của bạn đều đáng quý. Hãy cùng xây dựng Nam Việt ngày
            một tốt hơn!
          </Typography.Paragraph>
          <Button
            type="primary"
            icon={<Send size={16} />}
            onClick={() => setIsModalOpen(true)}
          >
            Gửi Đề xuất Mới
          </Button>
        </Space>
      </Card>

      <SuggestionModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          // Hiện tại không cần làm gì sau khi gửi từ Dashboard
        }}
      />
    </>
  );
};

export default SuggestionBoxWidget;
