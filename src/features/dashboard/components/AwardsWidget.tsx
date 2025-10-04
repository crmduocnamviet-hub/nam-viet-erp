// src/features/dashboard/components/AwardsWidget.tsx

import React, { useState, useEffect } from "react";
import { Card, List, Typography, Spin, Space, Empty } from "antd";
import { Sparkles } from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";

const AwardsWidget: React.FC = () => {
  // ... logic fetching data không đổi
  const [kudos, setKudos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchKudos = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("posts")
          .select("id, title")
          .eq("post_type", "kudos")
          .order("created_at", { ascending: false })
          .limit(5);

        if (error) throw error;
        setKudos(data || []);
      } catch (error) {
        console.error("Lỗi tải khen thưởng:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchKudos();
  }, []);

  return (
    <Card
      className="dashboard-card card-border-top" // <-- Thêm class CSS
      style={{ borderColor: "#52c41a" }} // <-- Thêm màu viền
      title={
        <Space>
          <Sparkles size={20} color="#52c41a" />
          <Typography.Title level={4} style={{ margin: 0 }}>
            Khen thưởng & Vinh danh
          </Typography.Title>
        </Space>
      }
      styles={{ body: { padding: "0 24px" } }}
    >
      <Spin spinning={loading}>
        {kudos.length > 0 ? (
          <List
            dataSource={kudos}
            renderItem={(item) => (
              <List.Item>
                <Typography.Text style={{ fontSize: "16px" }}>
                  🎉 {item.title}
                </Typography.Text>
              </List.Item>
            )}
          />
        ) : (
          <Empty
            style={{ padding: "24px 0" }}
            description="Chưa có khen thưởng mới"
          />
        )}
      </Spin>
    </Card>
  );
};

export default AwardsWidget;
