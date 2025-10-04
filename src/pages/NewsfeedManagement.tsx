// src/pages/NewsfeedManagement.tsx

import React, { useState, useEffect, useCallback } from "react";
import {
  Button,
  Table,
  Space,
  Row,
  Col,
  Typography,
  App as AntApp,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Upload,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PaperClipOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { supabase } from "../lib/supabaseClient";
import dayjs from "dayjs";
import { useAuth } from "../context/AuthContext";
// NÂNG CẤP: Import trình soạn thảo Tiptap mới
import RichTextEditor from "../components/RichTextEditor";

const { Title } = Typography;

// Thêm hàm "làm sạch" tên file upload
const sanitizeFilename = (filename: string): string => {
  // 1. Chuyển đổi Unicode tiếng Việt về không dấu
  const noDiacritics = filename
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  // 2. Thay thế khoảng trắng và các ký tự đặc biệt không mong muốn bằng dấu gạch dưới
  const replaced = noDiacritics.replace(/[^a-zA-Z0-9._-]/g, "_");
  // 3. Loại bỏ các dấu gạch dưới liên tiếp
  return replaced.replace(/_{2,}/g, "_");
};

const NewsfeedManagementContent: React.FC = () => {
  // SỬA LỖI: Lấy message từ App context để không bị warning
  const { notification, modal, message } = AntApp.useApp();
  const { user } = useAuth();
  const [form] = Form.useForm();

  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<any | null>(null);
  const [fileList, setFileList] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("posts")
        .select("*, author:profiles(full_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setPosts(data || []);
    } catch (error: any) {
      notification.error({
        message: "Lỗi tải danh sách bài viết",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  }, [notification]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingPost(null);
    setFileList([]); // Reset danh sách file khi đóng modal
    form.resetFields();
  };

  const handleAdd = () => {
    setEditingPost(null);
    form.resetFields();
    setFileList([]);
    setIsModalOpen(true);
  };

  const handleEdit = (record: any) => {
    setEditingPost(record);
    form.setFieldsValue(record);
    if (record.attachments) {
      setFileList(
        record.attachments.map((file: any, index: number) => ({
          uid: `${-index}`, // Tạo uid duy nhất
          name: file.name,
          status: "done",
          url: file.url,
        }))
      );
    }
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, title: string) => {
    modal.confirm({
      title: "Bạn có chắc chắn muốn xóa?",
      content: `Bài viết "${title}" sẽ bị xóa vĩnh viễn.`,
      okText: "Xóa",
      okType: "danger",
      onOk: async () => {
        const { error } = await supabase.from("posts").delete().eq("id", id);
        if (error) {
          notification.error({
            message: "Lỗi khi xóa",
            description: error.message,
          });
        } else {
          notification.success({ message: "Đã xóa thành công!" });
          fetchData();
        }
      },
    });
  };

  const handleUpload = async ({ file, onSuccess, onError }: any) => {
    // Sử dụng hàm làm sạch tên file ở đây
    const cleanFileName = sanitizeFilename(file.name);
    const fileName = `${Date.now()}_${cleanFileName}`;

    try {
      const { error } = await supabase.storage
        .from("post-attachments")
        .upload(fileName, file);

      if (error) throw error;

      const {
        data: { publicUrl },
      } = supabase.storage.from("post-attachments").getPublicUrl(fileName);

      const newFile = {
        uid: file.uid,
        name: file.name, // Giữ lại tên gốc để hiển thị cho người dùng
        status: "done",
        url: publicUrl,
      };

      setFileList((prevList) => [...prevList, newFile]);
      onSuccess("ok");
    } catch (error: any) {
      message.error(`Upload file ${file.name} thất bại.`);
      onError(error);
    }
  };

  const handleFinish = async (values: any) => {
    try {
      const attachments = fileList.map((f) => ({ name: f.name, url: f.url }));

      const record = {
        ...values,
        author_id: user?.id,
        attachments: attachments.length > 0 ? attachments : null,
      };

      let error;
      if (editingPost) {
        ({ error } = await supabase
          .from("posts")
          .update(record)
          .eq("id", editingPost.id));
      } else {
        ({ error } = await supabase.from("posts").insert([record]));
      }

      if (error) throw error;
      notification.success({
        message: `Đã ${editingPost ? "cập nhật" : "đăng"} bài viết thành công!`,
      });
      handleCancel();
      fetchData();
    } catch (error: any) {
      notification.error({
        message: "Thao tác thất bại",
        description: error.message,
      });
    }
  };

  const columns = [
    {
      title: "Tiêu đề",
      dataIndex: "title",
      key: "title",
      render: (text: string, record: any) => (
        <Space>
          {record.is_pinned && <Tag color="gold">Ghim</Tag>}
          <Typography.Text strong>{text}</Typography.Text>
          {record.attachments?.length > 0 && <PaperClipOutlined />}
        </Space>
      ),
    },
    {
      title: "Loại bài viết",
      dataIndex: "post_type",
      key: "post_type",
      render: (type: string) => {
        const typeMap: { [key: string]: { color: string; text: string } } = {
          announcement: { color: "blue", text: "Thông báo" },
          kudos: { color: "green", text: "Khen thưởng" },
          policy: { color: "purple", text: "Chính sách" },
          suggestion: { color: "default", text: "Góp ý" },
        };
        return (
          <Tag color={typeMap[type]?.color}>{typeMap[type]?.text || type}</Tag>
        );
      },
    },
    {
      title: "Tác giả",
      dataIndex: "author",
      key: "author",
      render: (author: any) => author?.full_name || "Hệ thống",
    },
    {
      title: "Ngày đăng",
      dataIndex: "created_at",
      key: "created_at",
      render: (date: string) => dayjs(date).format("DD/MM/YYYY HH:mm"),
    },
    {
      title: "Hành động",
      key: "action",
      render: (_: any, record: any) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Button
            icon={<DeleteOutlined />}
            danger
            onClick={() => handleDelete(record.id, record.title)}
          />
        </Space>
      ),
    },
  ];

  return (
    <>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2}>Quản lý Bảng tin chung</Title>
        </Col>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Tạo bài viết mới
          </Button>
        </Col>
      </Row>
      <Table
        columns={columns}
        dataSource={posts}
        loading={loading}
        rowKey="id"
      />

      <Modal
        title={editingPost ? "Chỉnh sửa Bài viết" : "Tạo Bài viết mới"}
        open={isModalOpen}
        onCancel={handleCancel}
        onOk={() => form.submit()}
        width={800}
        destroyOnHidden // Sửa `destroyOnClose` thành `destroyOnHidden`
      >
        <Form
          form={form} // Truyền `form` instance vào đây
          layout="vertical"
          onFinish={handleFinish}
          style={{ paddingTop: 24 }}
          initialValues={{ post_type: "announcement", is_pinned: false }}
        >
          <Form.Item
            name="title"
            label="Tiêu đề"
            rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="content"
            label="Nội dung"
            rules={[{ required: true, message: "Vui lòng nhập nội dung" }]}
          >
            <RichTextEditor />
          </Form.Item>

          <Form.Item label="File đính kèm">
            <Upload
              customRequest={handleUpload}
              fileList={fileList}
              onRemove={(file) => {
                const index = fileList.findIndex((f) => f.uid === file.uid);
                const newFileList = fileList.slice();
                newFileList.splice(index, 1);
                setFileList(newFileList);
              }}
            >
              <Button icon={<UploadOutlined />}>Chọn File</Button>
            </Upload>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="post_type" label="Loại bài viết">
                <Select
                  options={[
                    { value: "announcement", label: "Thông báo chung" },
                    { value: "kudos", label: "Khen thưởng & Vinh danh" },
                    { value: "policy", label: "Chính sách mới" },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="is_pinned"
                label="Ưu tiên"
                valuePropName="checked"
              >
                <Switch
                  checkedChildren="Ghim lên đầu"
                  unCheckedChildren="Bình thường"
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </>
  );
};

const NewsfeedManagement: React.FC = () => (
  <AntApp>
    <NewsfeedManagementContent />
  </AntApp>
);

export default NewsfeedManagement;
