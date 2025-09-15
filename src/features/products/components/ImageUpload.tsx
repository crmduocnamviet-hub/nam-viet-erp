import React, { useState, useEffect } from "react";
import { PlusOutlined } from "@ant-design/icons";
import { Modal, Upload, App } from "antd";
import type { UploadFile, UploadProps } from "antd";
import { supabase } from "../../../lib/supabaseClient";

interface ImageUploadProps {
  value?: string; // Nhận URL ảnh từ Form
  onChange?: (value: string) => void; // Gửi URL ảnh mới về cho Form
}

const ImageUpload: React.FC<ImageUploadProps> = ({ value, onChange }) => {
  const { notification } = App.useApp();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage] = useState("");
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  // Cập nhật ảnh hiển thị khi dữ liệu sửa được nạp vào
  useEffect(() => {
    if (value) {
      setFileList([
        {
          uid: "-1",
          name: "image.png",
          status: "done",
          url: value,
        },
      ]);
    } else {
      setFileList([]);
    }
  }, [value]);

  const handlePreview = async (file: UploadFile) => {
    /* ... Giữ nguyên ... */
  };

  const handleChange: UploadProps["onChange"] = ({ fileList: newFileList }) => {
    setFileList(newFileList);
    if (newFileList.length === 0) {
      onChange?.(""); // Báo cho Form biết là ảnh đã bị xóa
    }
  };

  const customRequest: UploadProps["customRequest"] = async ({
    file,
    onSuccess,
    onError,
  }) => {
    const fileExt = (file as File).name.split(".").pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);

      onChange?.(data.publicUrl); // Gửi public URL về cho Form
      onSuccess?.("Ok");
    } catch (error: any) {
      notification.error({
        message: "Lỗi tải ảnh",
        description: error.message,
      });
      onError?.(error);
    }
  };

  const uploadButton = (
    <button style={{ border: 0, background: "none" }} type="button">
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>Tải ảnh lên</div>
    </button>
  );

  return (
    <>
      <Upload
        customRequest={customRequest}
        listType="picture-card"
        fileList={fileList}
        onPreview={handlePreview}
        onChange={handleChange}
        maxCount={1}
      >
        {fileList.length >= 1 ? null : uploadButton}
      </Upload>
      <Modal
        open={previewOpen}
        footer={null}
        onCancel={() => setPreviewOpen(false)}
      >
        <img alt="example" style={{ width: "100%" }} src={previewImage} />
      </Modal>
    </>
  );
};

export default ImageUpload;
