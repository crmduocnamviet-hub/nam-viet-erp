import React, { useRef, useEffect, useState } from "react";
import { Modal, Button, Space, Typography, Alert, Steps, Divider } from "antd";
import {
  QrcodeOutlined,
  StopOutlined,
  CameraOutlined,
  ChromeOutlined,
  SafetyOutlined,
  GlobalOutlined,
} from "@ant-design/icons";
import QrScanner from "qr-scanner";

const { Text } = Typography;

interface QRScannerProps {
  visible: boolean;
  onClose: () => void;
  onScan: (result: string) => void;
  title?: string;
}

const QRScanner: React.FC<QRScannerProps> = ({
  visible,
  onClose,
  onScan,
  title = "Quét mã QR",
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const [hasCamera, setHasCamera] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<
    "checking" | "granted" | "denied" | "prompt"
  >("checking");
  const [showTutorial, setShowTutorial] = useState(false);

  // Detect browser type for specific tutorials
  const getBrowserType = () => {
    const userAgent = navigator.userAgent;
    if (userAgent.includes("Chrome") && !userAgent.includes("Edg"))
      return "chrome";
    if (userAgent.includes("Firefox")) return "firefox";
    if (userAgent.includes("Safari") && !userAgent.includes("Chrome"))
      return "safari";
    if (userAgent.includes("Edg")) return "edge";
    return "other";
  };

  const getBrowserTutorial = () => {
    const browser = getBrowserType();

    switch (browser) {
      case "chrome":
        return {
          icon: <ChromeOutlined />,
          name: "Google Chrome",
          steps: [
            "Nhấp vào biểu tượng khóa 🔒 hoặc camera 📷 bên trái thanh địa chỉ",
            'Chọn "Cho phép" hoặc "Always allow" cho Camera',
            'Nhấp "Tải lại" trang và thử lại',
          ],
        };
      case "firefox":
        return {
          icon: <SafetyOutlined />,
          name: "Mozilla Firefox",
          steps: [
            "Nhấp vào biểu tượng khiên 🛡️ hoặc camera 📷 bên trái thanh địa chỉ",
            'Chọn "Allow" cho Camera permissions',
            "Tải lại trang và thử quét lại",
          ],
        };
      case "safari":
        return {
          icon: <GlobalOutlined />,
          name: "Safari",
          steps: [
            "Vào Safari > Preferences > Websites",
            'Chọn "Camera" trong danh sách bên trái',
            'Tìm website này và chọn "Allow"',
            "Tải lại trang web",
          ],
        };
      case "edge":
        return {
          icon: <GlobalOutlined />,
          name: "Microsoft Edge",
          steps: [
            "Nhấp vào biểu tượng khóa 🔒 hoặc camera 📷 bên trái thanh địa chỉ",
            'Chọn "Allow" cho Camera',
            'Nhấp "Reload" và thử lại',
          ],
        };
      default:
        return {
          icon: <GlobalOutlined />,
          name: "Trình duyệt",
          steps: [
            "Tìm biểu tượng camera hoặc khóa trên thanh địa chỉ",
            "Cho phép truy cập Camera cho website này",
            "Tải lại trang và thử lại",
          ],
        };
    }
  };

  useEffect(() => {
    if (visible && videoRef.current) {
      startScanner();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [visible]);

  const checkCameraPermission = async () => {
    try {
      // Check if camera permission is available
      if ("permissions" in navigator) {
        const permission = await navigator.permissions.query({
          name: "camera" as PermissionName,
        });
        setPermissionStatus(permission.state);
        return permission.state === "granted";
      } else {
        // Fallback for browsers that don't support permissions API
        setPermissionStatus("prompt");
        return true;
      }
    } catch (err) {
      console.warn("Permission API not supported:", err);
      setPermissionStatus("prompt");
      return true;
    }
  };

  const requestCameraPermission = async () => {
    try {
      // Request camera access directly through getUserMedia
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((track) => track.stop()); // Stop the stream immediately
      setPermissionStatus("granted");
      return true;
    } catch (err: any) {
      console.error("Permission denied:", err);
      setPermissionStatus("denied");
      if (err.name === "NotAllowedError") {
        setPermissionStatus("denied");
        setError(
          "Quyền truy cập camera bị từ chối. Vui lòng cấp quyền camera trong cài đặt trình duyệt."
        );
        setShowTutorial(true);
      } else if (err.name === "NotFoundError") {
        setError("Không tìm thấy camera trên thiết bị này.");
        setHasCamera(false);
      } else {
        setError("Không thể truy cập camera: " + err.message);
      }
      return false;
    }
  };

  const startScanner = async () => {
    if (!videoRef.current) return;

    try {
      setError(null);
      setIsScanning(false);
      setPermissionStatus("checking");

      // Check if QR scanner has camera
      const hasCamera = await QrScanner.hasCamera();
      if (!hasCamera) {
        setHasCamera(false);
        setError("Không tìm thấy camera trên thiết bị này");
        return;
      }

      // Check camera permission first
      const hasPermission = await checkCameraPermission();

      if (permissionStatus === "denied") {
        setError(
          "Quyền truy cập camera bị từ chối. Vui lòng cấp quyền camera trong cài đặt trình duyệt."
        );
        return;
      }

      // If permission is prompt or not granted, request it
      if (!hasPermission || permissionStatus === "prompt") {
        const granted = await requestCameraPermission();
        if (!granted) return;
      }

      // Create scanner instance
      scannerRef.current = new QrScanner(
        videoRef.current,
        (result) => {
          onScan(result.data);
          stopScanner();
          onClose();
        },
        {
          preferredCamera: "environment", // Use back camera if available
          highlightScanRegion: true,
          highlightCodeOutline: true,
        }
      );

      await scannerRef.current.start();
      setIsScanning(true);
      setPermissionStatus("granted");
    } catch (err: any) {
      console.error("Scanner error:", err);

      // Handle specific permission errors
      if (err.name === "NotAllowedError") {
        setPermissionStatus("denied");
        setError(
          "Quyền truy cập camera bị từ chối. Vui lòng cấp quyền camera và thử lại."
        );
        setShowTutorial(true);
      } else if (err.name === "NotFoundError") {
        setHasCamera(false);
        setError("Không tìm thấy camera trên thiết bị này.");
      } else if (err.name === "NotSupportedError") {
        setError("Trình duyệt không hỗ trợ truy cập camera.");
      } else {
        setError(err.message || "Không thể khởi động camera");
      }
      setIsScanning(false);
    }
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.stop();
      scannerRef.current.destroy();
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  const handleClose = () => {
    stopScanner();
    onClose();
  };

  return (
    <Modal
      title={
        <Space>
          <QrcodeOutlined />
          {title}
        </Space>
      }
      open={visible}
      onCancel={handleClose}
      footer={[
        ...(permissionStatus === "denied"
          ? [
              <Button
                key="tutorial"
                onClick={() => setShowTutorial(!showTutorial)}
                type="default"
              >
                {showTutorial ? "Ẩn hướng dẫn" : "Xem hướng dẫn"}
              </Button>,
              <Button
                key="retry"
                onClick={startScanner}
                type="primary"
                icon={<CameraOutlined />}
              >
                Thử lại
              </Button>,
            ]
          : []),
        <Button key="close" onClick={handleClose} icon={<StopOutlined />}>
          Đóng
        </Button>,
      ]}
      width={showTutorial && permissionStatus === "denied" ? 600 : 400}
      centered
    >
      <div style={{ textAlign: "center", width: "100%" }}>
        {permissionStatus === "checking" ? (
          <>
            <div style={{ marginBottom: 16 }}>
              <Text type="secondary">
                Đang kiểm tra quyền truy cập camera...
              </Text>
            </div>
          </>
        ) : permissionStatus === "denied" || error ? (
          <>
            <Alert
              message={
                permissionStatus === "denied"
                  ? "Quyền truy cập camera bị từ chối"
                  : "Lỗi Camera"
              }
              description={
                permissionStatus === "denied"
                  ? "Vui lòng cho phép truy cập camera trong cài đặt trình duyệt để sử dụng tính năng quét QR code."
                  : error
              }
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
              action={
                permissionStatus === "denied" && (
                  <Button
                    size="small"
                    onClick={() => setShowTutorial(!showTutorial)}
                    type="default"
                  >
                    {showTutorial ? "Ẩn hướng dẫn" : "Xem hướng dẫn"}
                  </Button>
                )
              }
            />

            {/* Tutorial Section */}
            {permissionStatus === "denied" && showTutorial && (
              <div style={{ textAlign: "left", marginTop: 16 }}>
                <Divider orientation="left">
                  <Space>
                    {getBrowserTutorial().icon}
                    <Text strong>
                      Hướng dẫn cho {getBrowserTutorial().name}
                    </Text>
                  </Space>
                </Divider>

                <Steps
                  direction="vertical"
                  size="small"
                  current={getBrowserTutorial().steps.length}
                  items={getBrowserTutorial().steps.map((step, index) => ({
                    title: `Bước ${index + 1}`,
                    description: step,
                    status: "wait" as const,
                  }))}
                />

                <Divider />

                <Alert
                  message="Mẹo hữu ích"
                  description={
                    <div>
                      <Text>
                        • Sau khi cấp quyền, nhấn nút "Thử lại" bên dưới
                      </Text>
                      <br />
                      <Text>
                        • Nếu vẫn không hoạt động, hãy tải lại trang web
                      </Text>
                      <br />
                      <Text>
                        • Đảm bảo camera không được sử dụng bởi ứng dụng khác
                      </Text>
                    </div>
                  }
                  type="info"
                  showIcon
                  style={{ marginTop: 12 }}
                />
              </div>
            )}
          </>
        ) : (
          <></>
        )}

        <div>
          <video
            ref={videoRef}
            style={{
              width: "100%",
              maxWidth: 300,
              height: 225,
              borderRadius: 8,
              backgroundColor: "#f0f0f0",
              marginBottom: 16,
            }}
          />
          <p className="w-full">
            {isScanning
              ? "Đưa mã QR vào khung hình"
              : permissionStatus === "granted"
              ? "Đang khởi động camera..."
              : "Chuẩn bị camera..."}
          </p>
        </div>

        {!hasCamera && (
          <Alert
            message="Camera không khả dụng"
            description="Thiết bị này không có camera."
            type="warning"
            showIcon
            style={{ marginTop: 16 }}
          />
        )}

        {permissionStatus === "prompt" && !error && (
          <Alert
            message="Cần quyền truy cập camera"
            description="Trình duyệt sẽ yêu cầu quyền truy cập camera. Vui lòng chọn 'Cho phép' để tiếp tục."
            type="info"
            showIcon
            style={{ marginTop: 16 }}
          />
        )}
      </div>
    </Modal>
  );
};

export default QRScanner;
