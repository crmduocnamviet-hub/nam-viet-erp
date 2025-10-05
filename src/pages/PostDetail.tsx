// src/pages/PostDetail.tsx

import React, { useState, useEffect, useCallback } from "react";
import {
  Typography,
  App as AntApp,
  Spin,
  Card,
  Empty,
  Avatar,
  Space,
  Divider,
  Button,
  Form,
  Input,
  List,
} from "antd";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { Heart, MessageSquare, ArrowLeft } from "lucide-react";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const PostDetailPageContent: React.FC = () => {
  const { notification } = AntApp.useApp();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form] = Form.useForm();

  const [post, setPost] = useState<any | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [reactions, setReactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const postPromise = supabase
        .from("posts")
        .select("*, author:profiles(full_name, avatar_url)")
        .eq("id", id)
        .single();
      const commentsPromise = supabase
        .from("comments")
        .select("*, author:profiles(full_name, avatar_url)")
        .eq("post_id", id)
        .order("created_at", { ascending: true });
      const reactionsPromise = supabase
        .from("post_reactions")
        .select("*")
        .eq("post_id", id);

      const [postRes, commentsRes, reactionsRes] = await Promise.all([
        postPromise,
        commentsPromise,
        reactionsPromise,
      ]);

      if (postRes.error) throw postRes.error;
      if (commentsRes.error) throw commentsRes.error;
      if (reactionsRes.error) throw reactionsRes.error;

      setPost(postRes.data);
      setComments(commentsRes.data || []);
      setReactions(reactionsRes.data || []);
    } catch (error: any) {
      notification.error({
        message: "Lỗi tải dữ liệu",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  }, [id, notification]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCommentSubmit = async (values: { content: string }) => {
    if (!user) return;
    try {
      const { error } = await supabase.from("comments").insert({
        post_id: id,
        author_id: user.id,
        content: values.content,
      });
      if (error) throw error;
      form.resetFields();
      fetchData(); // Tải lại dữ liệu để hiển thị bình luận mới
    } catch (error: any) {
      notification.error({
        message: "Gửi bình luận thất bại",
        description: error.message,
      });
    }
  };

  const hasLiked = reactions.some((r) => r.user_id === user?.id);

  const handleLike = async () => {
    if (!user) return;
    try {
      if (hasLiked) {
        // Nếu đã thích, bấm lần nữa để bỏ thích
        const { error } = await supabase
          .from("post_reactions")
          .delete()
          .match({ post_id: id, user_id: user.id });
        if (error) throw error;
      } else {
        // Nếu chưa thích, bấm để thích
        const { error } = await supabase
          .from("post_reactions")
          .insert({ post_id: id, user_id: user.id, reaction_type: "like" });
        if (error) throw error;
      }
      fetchData(); // Tải lại dữ liệu reactions
    } catch (error: any) {
      notification.error({
        message: "Thao tác thất bại",
        description: error.message,
      });
    }
  };

  if (loading) return <Spin spinning />;
  if (!post) return <Empty description="Không tìm thấy bài viết" />;

  return (
    <>
      <Button
        icon={<ArrowLeft />}
        onClick={() => navigate("/community")}
        style={{ marginBottom: 16 }}
      >
        Quay lại Diễn đàn
      </Button>
      <Card>
        <Title level={2}>{post.title}</Title>
        <Space align="center" style={{ marginBottom: 24 }}>
          <Avatar src={post.author?.avatar_url} size="large" />
          <div>
            <Text strong>{post.author?.full_name || "Hệ thống"}</Text>
            <br />
            <Text type="secondary">
              {dayjs(post.created_at).format("HH:mm [ngày] DD/MM/YYYY")}
            </Text>
          </div>
        </Space>
        <div
          className="post-content-view"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
        <Divider />
        <Space size="large">
          <Button
            type={hasLiked ? "primary" : "default"}
            icon={<Heart />}
            onClick={handleLike}
          >
            {reactions.length} Thích
          </Button>
          <Space>
            <MessageSquare />
            <Text>{comments.length} Bình luận</Text>
          </Space>
        </Space>
      </Card>

      <Card title="Bình luận" style={{ marginTop: 24 }}>
        <List
          dataSource={comments}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                avatar={<Avatar src={item.author?.avatar_url} />}
                title={<a>{item.author?.full_name}</a>}
                description={item.content}
              />
              <Text type="secondary">{dayjs(item.created_at).fromNow()}</Text>
            </List.Item>
          )}
        />
        <Divider />
        <Form form={form} onFinish={handleCommentSubmit}>
          <Form.Item name="content" rules={[{ required: true }]}>
            <Input.TextArea rows={3} placeholder="Viết bình luận của bạn..." />
          </Form.Item>
          <Form.Item>
            <Button htmlType="submit" type="primary">
              Gửi bình luận
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </>
  );
};

const PostDetail: React.FC = () => (
  <AntApp>
    <PostDetailPageContent />
  </AntApp>
);

export default PostDetail;
