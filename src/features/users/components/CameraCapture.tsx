// src/features/users/components/CameraCapture.tsx

import React, { useState, useRef } from "react";
import { Button, Modal, App, Spin, Image } from "antd";
import { CameraOutlined } from "@ant-design/icons";
import { supabase } from "../../../lib/supabaseClient";

interface CameraCaptureProps {
  value?: string;
  onChange?: (value: string) => void;
  title: string;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({
  value,
  onChange,
  title,
}) => {
  const { notification } = App.useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    setIsModalOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      notification.error({
        message: "Lỗi truy cập camera",
        description: "Vui lòng cấp quyền truy cập camera cho trang web.",
      });
      setIsModalOpen(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }
  };

  const handleCapture = async () => {
    if (videoRef.current && canvasRef.current) {
      setLoading(true);
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext("2d");
      context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

      canvas.toBlob(async (blob) => {
        if (blob) {
          const fileName = `citizen_id_${Date.now()}.png`;
          const filePath = `public/${fileName}`;
          try {
            const { error } = await supabase.storage
              .from("identity-documents")
              .upload(filePath, blob);
            if (error) throw error;
            const { data } = supabase.storage
              .from("identity-documents")
              .getPublicUrl(filePath);
            onChange?.(data.publicUrl);
            notification.success({ message: "Chụp và tải lên thành công!" });
            stopCamera();
            setIsModalOpen(false);
          } catch (err: any) {
            notification.error({
              message: "Lỗi tải ảnh lên",
              description: err.message,
            });
          } finally {
            setLoading(false);
          }
        }
      }, "image/png");
    }
  };

  return (
    <>
      {value ? (
        <Image src={value} width={150} />
      ) : (
        <Button icon={<CameraOutlined />} onClick={startCamera}>
          {title}
        </Button>
      )}
      <Modal
        title="Chụp ảnh tài liệu"
        open={isModalOpen}
        onCancel={() => {
          stopCamera();
          setIsModalOpen(false);
        }}
        footer={[
          <Button
            key="capture"
            type="primary"
            onClick={handleCapture}
            loading={loading}
          >
            Chụp ảnh
          </Button>,
        ]}
      >
        <Spin spinning={loading}>
          <video ref={videoRef} autoPlay style={{ width: "100%" }} />
          <canvas ref={canvasRef} style={{ display: "none" }} />
        </Spin>
      </Modal>
    </>
  );
};

export default CameraCapture;
