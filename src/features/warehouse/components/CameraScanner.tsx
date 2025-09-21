// src/features/warehouse/components/CameraScanner.tsx

import React, { useEffect, useRef, useState } from "react";
import { Typography, Alert, Spin } from "antd";

const { Text } = Typography;

interface CameraScannerProps {
  onScanSuccess: (result: string) => void;
  isActive: boolean;
}

const CameraScanner: React.FC<CameraScannerProps> = ({
  onScanSuccess,
  isActive,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    // NÂNG CẤP: Kiểm tra trình duyệt có hỗ trợ API không
    if (!("BarcodeDetector" in window)) {
      setError(
        "Trình duyệt của bạn không hỗ trợ tính năng quét mã vạch tự động."
      );
      setLoading(false);
      return;
    }

    let stream: MediaStream | null = null;
    const barcodeDetector = new (window as any).BarcodeDetector({
      formats: ["ean_13", "code_128", "qr_code"],
    });
    let animationFrameId: number;

    const detectBarcode = async () => {
      if (
        videoRef.current &&
        videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA
      ) {
        try {
          const barcodes = await barcodeDetector.detect(videoRef.current);
          if (barcodes.length > 0) {
            onScanSuccess(barcodes[0].rawValue);
          }
        } catch (e) {
          console.error("Lỗi khi nhận dạng mã vạch:", e);
        }
      }
      // Tiếp tục quét ở khung hình tiếp theo
      if (isActive) {
        animationFrameId = requestAnimationFrame(detectBarcode);
      }
    };

    const startCamera = async () => {
      try {
        // NÂNG CẤP: Yêu cầu hình ảnh chất lượng cao
        const constraints = {
          video: {
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            facingMode: "environment", // Ưu tiên camera sau trên điện thoại
          },
        };
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            setLoading(false);
            videoRef.current?.play();
            detectBarcode(); // Bắt đầu vòng lặp quét
          };
        }
      } catch (err) {
        console.error("Lỗi truy cập camera:", err);
        setError(
          "Không thể truy cập camera. Vui lòng kiểm tra và cấp quyền cho trang web."
        );
        setLoading(false);
      }
    };

    startCamera();

    // Dọn dẹp: Tắt camera khi component unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isActive, onScanSuccess]);

  if (error) {
    return (
      <Alert message="Lỗi Camera" description={error} type="error" showIcon />
    );
  }

  return (
    <div style={{ position: "relative" }}>
      <Spin spinning={loading} tip="Đang khởi động camera...">
        <video
          ref={videoRef}
          style={{
            width: "100%",
            border: "1px solid #f0f0f0",
            borderRadius: "8px",
          }}
          playsInline
        />
      </Spin>
    </div>
  );
};

export default CameraScanner;
