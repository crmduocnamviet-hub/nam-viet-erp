// src/features/dashboard/components/AnnouncementsWidget.tsx

import React, { useState, useEffect } from "react";
import {
  Card,
  List,
  Typography,
  Spin,
  Space,
  Empty,
  Modal,
  Avatar,
  Button,
  Divider,
} from "antd";
import { Megaphone, Paperclip } from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi"; // Import locale tiếng Việt cho fromNow()

dayjs.extend(relativeTime);
dayjs.locale("vi");

const AnnouncementsWidget: React.FC = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("posts")
          .select("*, author:profiles(full_name, avatar_url)")
          .in("post_type", ["announcement", "policy"])
          .order("is_pinned", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(5);

        if (error) throw error;
        setPosts(data || []);
      } catch (error) {
        console.error("Lỗi tải thông báo:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  return (
    <>
      <Card
        className="dashboard-card card-border-top"
        style={{ borderColor: "#1773adff" }}
        title={
          <Space>
            <Megaphone size={20} color="#1773adff" />
            <Typography.Title level={4} style={{ margin: 0 }}>
              Thông báo & Tin tức Nội bộ
            </Typography.Title>
          </Space>
        }
        bodyStyle={{ padding: 0 }}
      >
        <Spin spinning={loading}>
          {posts.length > 0 ? (
            <div style={{ maxHeight: "350px", overflowY: "auto" }}>
              <List
                itemLayout="horizontal"
                dataSource={posts}
                renderItem={(item) => (
                  <List.Item
                    onClick={() => setSelectedPost(item)}
                    style={{ cursor: "pointer", padding: "12px 24px" }}
                  >
                    <List.Item.Meta
                      title={<a style={{ fontSize: "16px" }}>{item.title}</a>}
                      description={`Đăng ${dayjs(
                        item.created_at
                      ).fromNow()} bởi ${item.author?.full_name || "Hệ thống"}`}
                    />
                  </List.Item>
                )}
              />
            </div>
          ) : (
            <Empty
              style={{ padding: "24px" }}
              description="Chưa có thông báo mới"
            />
          )}
        </Spin>
      </Card>

      {/* ================================================================== */}
      {/* NÂNG CẤP TOÀN DIỆN GIAO DIỆN MODAL XEM CHI TIẾT                  */}
      {/* ================================================================== */}
      <Modal
        open={!!selectedPost}
        onCancel={() => setSelectedPost(null)}
        footer={null} // Không cần footer
        width={800} // Tăng độ rộng để dễ đọc
        destroyOnHidden
      >
        {selectedPost && (
          <div style={{ padding: "16px" }}>
            {/* --- Phần Header của bài viết --- */}
            <Typography.Title level={2} style={{ marginBottom: 12 }}>
              {selectedPost.title}
            </Typography.Title>
            <Space
              align="center"
              style={{
                marginBottom: 24,
                borderBottom: "1px solid #f0f0f0",
                paddingBottom: 16,
                width: "100%",
              }}
            >
              <Avatar src={selectedPost.author?.avatar_url} size="large" />
              <div>
                <Typography.Text strong>
                  {selectedPost.author?.full_name || "Hệ thống"}
                </Typography.Text>
                <br />
                <Typography.Text type="secondary">
                  Đăng lúc{" "}
                  {dayjs(selectedPost.created_at).format(
                    "HH:mm [ngày] DD/MM/YYYY"
                  )}
                </Typography.Text>
              </div>
            </Space>

            {/* --- Phần nội dung bài viết --- */}
            <div
              className="post-content-view"
              dangerouslySetInnerHTML={{ __html: selectedPost.content }}
            />

            {/* --- Phần tài liệu đính kèm (chỉ hiển thị nếu có) --- */}
            {selectedPost.attachments &&
              selectedPost.attachments.length > 0 && (
                <>
                  <Divider />
                  <Typography.Title level={5}>
                    Tài liệu đính kèm
                  </Typography.Title>
                  <List
                    dataSource={selectedPost.attachments}
                    renderItem={(file: any) => (
                      <List.Item>
                        <Button
                          type="link"
                          icon={<Paperclip size={16} />}
                          href={file.url}
                          target="_blank" // Mở trong tab mới
                          rel="noopener noreferrer"
                          style={{ paddingLeft: 0 }}
                        >
                          {file.name}
                        </Button>
                      </List.Item>
                    )}
                  />
                </>
              )}
          </div>
        )}
      </Modal>
    </>
  );
};

export default AnnouncementsWidget;
