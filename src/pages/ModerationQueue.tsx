// src/pages/ModerationQueue.tsx

import React, { useState, useEffect, useCallback } from "react";
import {
  Row,
  Col,
  Typography,
  App as AntApp,
  Spin,
  Empty,
  List,
  Avatar,
  Space,
  Button,
  Tag,
} from "antd";
import { supabase } from "../lib/supabaseClient";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const ModerationQueueContent: React.FC = () => {
  const { notification, modal } = AntApp.useApp();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPendingPosts = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("posts")
        .select("*, author:profiles(full_name, avatar_url)")
        .eq("status", "pending_approval")
        .order("created_at", { ascending: true });
      if (error) throw error;
      setPosts(data || []);
    } catch (error: any) {
      notification.error({
        message: "Lỗi tải danh sách chờ duyệt",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  }, [notification]);

  useEffect(() => {
    fetchPendingPosts();
  }, [fetchPendingPosts]);

  const handleUpdateStatus = (
    postId: string,
    newStatus: "published" | "rejected"
  ) => {
    const actionText = newStatus === "published" ? "Duyệt" : "Từ chối";
    modal.confirm({
      title: `Bạn có chắc muốn ${actionText.toLowerCase()} bài viết này?`,
      onOk: async () => {
        try {
          const { error } = await supabase
            .from("posts")
            .update({ status: newStatus })
            .eq("id", postId);
          if (error) throw error;
          notification.success(
            `Đã ${actionText.toLowerCase()} bài viết thành công.`
          );
          fetchPendingPosts(); // Tải lại danh sách
        } catch (error: any) {
          notification.error({
            message: `${actionText} thất bại`,
            description: error.message,
          });
        }
      },
    });
  };

  return (
    <Spin spinning={loading}>
      <Title level={2}>Kiểm duyệt Đề xuất & Góp ý</Title>
      {posts.length > 0 ? (
        <List
          itemLayout="vertical"
          dataSource={posts}
          renderItem={(post) => (
            <List.Item
              key={post.id}
              actions={[
                <Button
                  type="primary"
                  onClick={() => handleUpdateStatus(post.id, "published")}
                >
                  Duyệt & Đăng
                </Button>,
                <Button
                  danger
                  onClick={() => handleUpdateStatus(post.id, "rejected")}
                >
                  Từ chối
                </Button>,
              ]}
            >
              <List.Item.Meta
                avatar={<Avatar src={post.author?.avatar_url} />}
                title={<a href="#">{post.title}</a>}
                description={`Bởi ${post.author?.full_name || "N/A"} - ${dayjs(
                  post.created_at
                ).fromNow()}`}
              />
              <div dangerouslySetInnerHTML={{ __html: post.content }} />
            </List.Item>
          )}
        />
      ) : (
        <Empty description="Không có đề xuất nào đang chờ duyệt." />
      )}
    </Spin>
  );
};

const ModerationQueue: React.FC = () => (
  <AntApp>
    <ModerationQueueContent />
  </AntApp>
);

export default ModerationQueue;
