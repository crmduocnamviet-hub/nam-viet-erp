// src/pages/Dashboard.tsx

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import {
  Row,
  Col,
  Typography,
  App as AntApp,
  Card,
  Spin,
  Avatar,
  Tag,
  Empty,
} from "antd";
import { UserOutlined } from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;

const Dashboard: React.FC = () => {
  const { notification } = AntApp.useApp();
  const [loading, setLoading] = useState(true);
  const [newEmployees, setNewEmployees] = useState<any[]>([]);

  const fetchNewestEmployees = useCallback(async () => {
    setLoading(true);
    try {
      // Lấy 3 nhân viên được duyệt gần đây nhất
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("employee_status", "Đang làm việc")
        .order("updated_at", { ascending: false })
        .limit(3);

      if (error) throw error;
      setNewEmployees(data || []);
    } catch (error: any) {
      notification.error({
        message: "Lỗi tải danh sách nhân viên mới",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  }, [notification]);

  useEffect(() => {
    fetchNewestEmployees();

    // Lắng nghe thay đổi trên bảng profiles
    const channel = supabase
      .channel("profiles-dashboard-channel")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles" },
        (payload) => {
          // Nếu có một nhân viên được cập nhật sang trạng thái "Đang làm việc"
          if (payload.new.employee_status === "Đang làm việc") {
            notification.info({
              message: "Có thành viên mới vừa được duyệt!",
              description: "Dashboard sẽ được cập nhật.",
            });
            fetchNewestEmployees(); // Tải lại danh sách
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchNewestEmployees]);

  return (
    <Spin spinning={loading}>
      <Title level={2} style={{ marginBottom: 24 }}>
        Dashboard Tổng quan
      </Title>

      <Card>
        <Title level={4}>🌟 Chào mừng Thành viên mới</Title>
        {newEmployees.length > 0 ? (
          <Row gutter={[24, 24]}>
            {newEmployees.map((employee) => (
              <Col xs={24} md={12} lg={8} key={employee.id}>
                <Card>
                  <Card.Meta
                    avatar={
                      <Avatar
                        size={64}
                        src={employee.avatar_url}
                        icon={<UserOutlined />}
                      />
                    }
                    title={
                      <Text strong style={{ fontSize: 16 }}>
                        {employee.full_name}
                      </Text>
                    }
                    description={
                      <Tag color="blue">
                        {/* Lấy vai trò sẽ được nâng cấp sau */}
                      </Tag>
                    }
                  />
                  <Paragraph
                    ellipsis={{ rows: 3, expandable: true, symbol: "xem thêm" }}
                    style={{ marginTop: 16 }}
                  >
                    <strong>Giới thiệu:</strong>{" "}
                    {employee.self_introduction || "Chưa có thông tin."}
                  </Paragraph>
                  <Paragraph>
                    <strong>Sở thích:</strong>{" "}
                    {employee.hobbies || "Chưa có thông tin."}
                  </Paragraph>
                  <Paragraph>
                    <strong>Giới hạn cá nhân:</strong>{" "}
                    {employee.personal_boundaries || "Chưa có thông tin."}
                  </Paragraph>
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <Empty description="Chưa có nhân viên mới nào được duyệt gần đây." />
        )}
      </Card>
    </Spin>
  );
};

export default Dashboard;
