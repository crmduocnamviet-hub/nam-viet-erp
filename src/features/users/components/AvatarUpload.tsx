// src/features/users/components/AvatarUpload.tsx

import React, { useState, useEffect } from "react";
import { LoadingOutlined, UserOutlined } from "@ant-design/icons";
import { Upload, App, Avatar } from "antd";
import type { UploadProps } from "antd";
import { supabase } from "../../../lib/supabaseClient";

interface AvatarUploadProps {
  value?: string;
  onChange?: (value: string) => void;
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({ value, onChange }) => {
  const { notification } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | undefined>(value);

  useEffect(() => {
    setImageUrl(value);
  }, [value]);

  const customRequest: UploadProps["customRequest"] = async ({
    file,
    onSuccess,
    onError,
  }) => {
    setLoading(true);
    const fileExt = (file as File).name.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `public/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
      setImageUrl(data.publicUrl);
      onChange?.(data.publicUrl);
      onSuccess?.("Ok");
    } catch (error: any) {
      notification.error({
        message: "Lỗi tải ảnh",
        description: error.message,
      });
      onError?.(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Upload
      name="avatar"
      listType="picture-circle"
      className="avatar-uploader"
      showUploadList={false}
      customRequest={customRequest}
    >
      {imageUrl ? (
        <Avatar src={imageUrl} size={100} />
      ) : (
        <div>
          {loading ? <LoadingOutlined /> : <UserOutlined />}
          <div style={{ marginTop: 8 }}>Tải ảnh</div>
        </div>
      )}
    </Upload>
  );
};

export default AvatarUpload;
