import React from "react";
import { Upload, Button, App } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import type { RcFile } from "antd/es/upload/interface";

// Hàm "mã hóa" file sang base64
const getBase64 = (file: RcFile): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(",")[1]); // Chỉ lấy phần dữ liệu base64
    reader.onerror = (error) => reject(error);
  });

interface PdfUploadProps {
  onFileReady: (fileContent: string, mimeType: string) => void;
  loading: boolean;
}

const PdfUpload: React.FC<PdfUploadProps> = ({ onFileReady, loading }) => {
  const { notification } = App.useApp();

  const customRequest = async ({ file }: any) => {
    const isPdf = file.type === "application/pdf";
    if (!isPdf) {
      notification.error({
        message: "File không hợp lệ",
        description: "Vui lòng chỉ tải lên file PDF.",
      });
      return;
    }
    try {
      const fileContent = await getBase64(file);
      onFileReady(fileContent, file.type);
    } catch (error) {
      notification.error({ message: "Lỗi xử lý file" });
    }
  };

  return (
    <Upload customRequest={customRequest} maxCount={1} showUploadList={false}>
      <Button icon={<UploadOutlined />} loading={loading}>
        Trích xuất từ PDF
      </Button>
    </Upload>
  );
};

export default PdfUpload;
