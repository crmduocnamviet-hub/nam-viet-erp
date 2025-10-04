// src/features/community/components/SuggestionModal.tsx

import React, { useState } from "react";
import { Modal, Form, Input, Button, Upload, App as AntApp } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import RichTextEditor from "../../../components/RichTextEditor";
import { useAuth } from "../../../context/AuthContext";
import { supabase } from "../../../lib/supabaseClient";

interface SuggestionModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void; // Callback để tải lại danh sách
}

const SuggestionModal: React.FC<SuggestionModalProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const { user } = useAuth();
  const { notification, message } = AntApp.useApp();
  const [fileList, setFileList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Hàm "làm sạch" tên file
  const sanitizeFilename = (filename: string): string => {
    const noDiacritics = filename
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    const replaced = noDiacritics.replace(/[^a-zA-Z0-9._-]/g, "_");
    return replaced.replace(/_{2,}/g, "_");
  };

  const handleUpload = async ({
    file,
    onSuccess: onUploadSuccess,
    onError,
  }: any) => {
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
        name: file.name,
        status: "done",
        url: publicUrl,
      };
      setFileList((prevList) => [...prevList, newFile]);
      onUploadSuccess("ok");
    } catch (error: any) {
      message.error(`Upload file ${file.name} thất bại.`);
      onError(error);
    }
  };

  const handleFinish = async (values: any) => {
    if (!user) {
      notification.error({ message: "Bạn cần đăng nhập để gửi đề xuất." });
      return;
    }
    setLoading(true);
    try {
      // Lấy chế độ kiểm duyệt hiện tại từ CSDL
      const { data: setting, error: settingError } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", "suggestion_moderation_mode")
        .single();

      if (settingError && settingError.code !== "PGRST116") throw settingError;

      const moderationMode = setting?.value || "manual"; // Mặc định là thủ công nếu không có cài đặt

      const attachments = fileList.map((f) => ({ name: f.name, url: f.url }));
      const { error } = await supabase.from("posts").insert([
        {
          title: values.title,
          content: values.content,
          author_id: user.id,
          post_type: "suggestion",
          // Tự động quyết định trạng thái dựa trên cấu hình hệ thống
          status: moderationMode === "auto" ? "published" : "pending_approval",
          attachments: attachments.length > 0 ? attachments : null,
        },
      ]);

      if (error) throw error;

      notification.success({
        message: "Gửi đề xuất thành công!",
        description:
          moderationMode === "manual"
            ? "Đề xuất của bạn đã được gửi đến quản lý để xem xét."
            : "Đề xuất của bạn đã được đăng lên diễn đàn.",
      });
      form.resetFields();
      setFileList([]);
      onSuccess();
      onClose();
    } catch (error: any) {
      notification.error({
        message: "Gửi đề xuất thất bại",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Gửi Đề xuất / Sáng kiến"
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText="Gửi đi"
      cancelText="Hủy"
      destroyOnHidden
      confirmLoading={loading}
      width={800}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        style={{ paddingTop: 24 }}
      >
        <Form.Item
          name="title"
          label="Tiêu đề Đề xuất"
          rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}
        >
          <Input placeholder="Ví dụ: Cải tiến quy trình đóng gói hàng B2B" />
        </Form.Item>
        <Form.Item
          name="content"
          label="Mô tả chi tiết"
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
      </Form>
    </Modal>
  );
};

export default SuggestionModal;
