// src/features/warehouse/components/CameraScanner.tsx

import React, { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, NotFoundException } from "@zxing/library";
import { Alert, Spin } from "antd";

interface CameraScannerProps {
  onScanSuccess: (result: string) => void;
  isActive: boolean;
}

const CameraScanner: React.FC<CameraScannerProps> = ({
  onScanSuccess,
  isActive,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef(new BrowserMultiFormatReader());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isActive || !videoRef.current) {
      return;
    }

    console.log("[SENKO LOG] Bắt đầu khởi tạo CameraScanner...");
    const videoElement = videoRef.current;
    const codeReader = codeReaderRef.current;
    let isScanning = true;

    // Giao toàn quyền điều khiển cho thư viện
    codeReader
      .decodeFromVideoDevice(null, videoElement, (result, err) => {
        if (result && isScanning) {
          isScanning = false; // Tạm ngưng quét
          console.log("[SENKO LOG] Quét thành công! Dữ liệu thô:", result);
          onScanSuccess(result.getText());

          setTimeout(() => {
            console.log("[SENKO LOG] Sẵn sàng để quét mã tiếp theo...");
            isScanning = true;
          }, 2000);
        }
        if (err && !(err instanceof NotFoundException)) {
          console.log(
            "[SENKO LOG] Gặp lỗi trong lúc quét (thường là do chưa focus):",
            err
          );
        }
      })
      .catch((err) => {
        console.error(
          "[SENKO LOG] Lỗi nghiêm trọng khi khởi động camera:",
          err
        );
        setError(
          "Không thể truy cập camera. Vui lòng kiểm tra và cấp quyền cho trang web."
        );
      })
      .finally(() => {
        console.log("[SENKO LOG] Đã hoàn tất quá trình khởi động camera.");
        setLoading(false);
      });

    // Dọn dẹp
    return () => {
      console.log("[SENKO LOG] Dọn dẹp và tắt camera.");
      codeReader.reset();
    };
  }, [isActive, onScanSuccess]);

  if (error) {
    return (
      <Alert message="Lỗi Camera" description={error} type="error" showIcon />
    );
  }

  return (
    <div>
      <Spin spinning={loading} tip="Đang khởi động camera...">
        <Alert
          message="Hướng camera của bạn vào mã vạch (barcode) trên sản phẩm."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
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
