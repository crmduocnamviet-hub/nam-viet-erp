// src/pages/Community.tsx

import React, { useState, useEffect, useCallback } from "react";
import {
  Row,
  Col,
  Typography,
  App as AntApp,
  Spin,
  Empty,
  Button,
  List, // <-- Thêm List
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { supabase } from "../lib/supabaseClient";
import PostItem from "../features/community/components/PostItem";
import SuggestionModal from "../features/community/components/SuggestionModal";

const { Title } = Typography;

const CommunityPageContent: React.FC = () => {
  const { notification } = AntApp.useApp();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .rpc("get_published_suggestions")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error: any) {
      notification.error({
        message: "Lỗi tải danh sách đề xuất",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  }, [notification]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return (
    <Spin spinning={loading}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2}>Diễn đàn Góp ý & Sáng kiến</Title>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsModalOpen(true)}
          >
            Tạo Đề xuất
          </Button>
        </Col>
      </Row>

      {/* NÂNG CẤP: Sử dụng List với grid prop */}
      {posts.length > 0 ? (
        <List
          grid={{
            gutter: 24, // Khoảng cách giữa các card
            xs: 1, // 1 card/hàng trên màn hình điện thoại
            sm: 1,
            md: 2, // 2 card/hàng trên màn hình tablet
            lg: 2,
            xl: 3, // 3 card/hàng trên màn hình desktop
            xxl: 3,
          }}
          dataSource={posts}
          renderItem={(post) => (
            <List.Item>
              <PostItem post={post} />
            </List.Item>
          )}
        />
      ) : (
        <Empty description="Chưa có đề xuất nào được duyệt." />
      )}

      <SuggestionModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchPosts}
      />
    </Spin>
  );
};

const Community: React.FC = () => (
  <AntApp>
    <CommunityPageContent />
  </AntApp>
);

export default Community;
