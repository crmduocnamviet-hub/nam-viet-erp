// src/pages/Dashboard.tsx

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import {
  Row,
  Col,
  Typography,
  App as AntApp,
  Spin,
  Divider,
  Empty,
} from "antd";
import { useAuth } from "../context/AuthContext";

// SỬA LỖI: Import dayjs và locale tiếng Việt
import dayjs from "dayjs";
import "dayjs/locale/vi";

// Import các widget
import AnnouncementsWidget from "../features/dashboard/components/AnnouncementsWidget";
import AwardsWidget from "../features/dashboard/components/AwardsWidget";
import DoctorDashboard from "../features/dashboard/components/DoctorDashboard";
import PharmacistDashboard from "../features/dashboard/components/PharmacistDashboard";
import SuggestionBoxWidget from "../features/dashboard/components/SuggestionBoxWidget";

const { Title, Paragraph } = Typography;

const DashboardPageContent: React.FC = () => {
  const { notification } = AntApp.useApp();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  const fetchUserRole = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("roles(name)")
        .eq("user_id", user.id)
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data) {
        const roleName = data.roles?.name;
        switch (roleName) {
          case "Bác sĩ":
            setUserRole("doctor");
            break;
          case "Dược sĩ":
            setUserRole("pharmacist");
            break;
          default:
            setUserRole("default");
            break;
        }
      } else {
        setUserRole("default");
      }
    } catch (error: any) {
      notification.error({
        message: "Lỗi tải vai trò người dùng",
        description: error.message,
      });
      setUserRole("default");
    } finally {
      setLoading(false);
    }
  }, [user, notification]);

  useEffect(() => {
    fetchUserRole();
  }, [fetchUserRole]);

  const renderRoleDashboard = () => {
    switch (userRole) {
      case "doctor":
        return <DoctorDashboard />;
      case "pharmacist":
        return <PharmacistDashboard />;
      default:
        // Sếp có thể thay bằng một dashboard mặc định cho các vai trò khác ở đây
        return <PharmacistDashboard />;
    }
  };

  return (
    <Spin spinning={loading}>
      <Title level={2}>
        Chào mừng trở lại, {user?.user_metadata?.full_name || "thành viên"}!
      </Title>
      {/* SỬA LỖI: Sử dụng dayjs sau khi đã import */}
      <Paragraph type="secondary">
        Hôm nay là {dayjs().locale("vi").format("dddd, ngày DD/MM/YYYY")}.
      </Paragraph>

      <Divider>Thông tin chung</Divider>

      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={14} xl={10}>
          <AnnouncementsWidget />
        </Col>
        <Col xs={24} lg={10} xl={7}>
          <AwardsWidget />
        </Col>
        <Col xs={24} lg={24} xl={7}>
          <SuggestionBoxWidget />
        </Col>
      </Row>

      <Divider>Thông tin dành riêng cho bạn</Divider>

      {!loading && userRole ? (
        renderRoleDashboard()
      ) : (
        <Empty description="Không có không gian làm việc cá nhân nào được cấu hình cho vai trò của bạn." />
      )}
    </Spin>
  );
};

const Dashboard: React.FC = () => (
  <AntApp>
    <DashboardPageContent />
  </AntApp>
);

export default Dashboard;
