// src/features/community/components/PostItem.tsx

import React from "react";
import { Card, Avatar, Space, Typography, Tooltip } from "antd";
import { MessageSquare, Heart } from "lucide-react";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";

const { Text, Title, Paragraph } = Typography;

const PostItem = ({ post }: { post: any }) => {
  const navigate = useNavigate();

  // Hàm rút gọn nội dung HTML để hiển thị snippet
  const createSnippet = (htmlContent: string, length: number) => {
    const doc = new DOMParser().parseFromString(htmlContent, "text/html");
    const text = doc.body.textContent || "";
    if (text.length <= length) return text;
    return text.substring(0, length) + "...";
  };

  return (
    <Card
      hoverable
      className="dashboard-card"
      style={{ height: "100%" }} // Đảm bảo các card có chiều cao bằng nhau trong 1 hàng
      onClick={() => navigate(`/community/${post.id}`)}
      bodyStyle={{ display: "flex", flexDirection: "column", height: "100%" }}
    >
      {/* Phần Header */}
      <Space direction="vertical" style={{ marginBottom: 16 }}>
        <Title level={4} style={{ marginBottom: 0 }}>
          <Tooltip title={post.title}>
            <a style={{ color: "inherit" }}>{post.title}</a>
          </Tooltip>
        </Title>
        <Space size={4}>
          <Avatar src={post.author?.avatar_url} size="small" />
          <Text type="secondary">
            {post.author?.full_name || "Nhân viên"} -{" "}
            {dayjs(post.created_at).fromNow()}
          </Text>
        </Space>
      </Space>

      {/* Phần snippet nội dung */}
      <Paragraph type="secondary" style={{ flexGrow: 1 }}>
        {createSnippet(post.content, 100)}
      </Paragraph>

      {/* Phần thống kê tương tác */}
      <Space size="large" style={{ marginTop: "auto" }}>
        <Space>
          <Heart size={16} color="#8c8c8c" />
          <Text type="secondary">{post.post_reactions_count || 0}</Text>
        </Space>
        <Space>
          <MessageSquare size={16} color="#8c8c8c" />
          <Text type="secondary">{post.comments_count || 0}</Text>
        </Space>
      </Space>
    </Card>
  );
};

export default PostItem;
