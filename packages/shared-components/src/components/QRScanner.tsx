import React, { useState, useRef, useEffect } from "react";
import { Typography, Alert, Button, Space, Divider, Steps } from "antd";
import {
  ChromeOutlined,
  GlobalOutlined,
  SafetyOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

// Import BarcodeDetector if available
declare global {
  interface Window {
    BarcodeDetector: any;
  }
}

interface QRScannerProps {
  visible: boolean;
  onClose: () => void;
  onScan: (result: string) => void;
  title?: string;
  allowMultipleScan?: boolean;
  scanDelay?: number;
}

const QRScanner: React.FC<QRScannerProps> = ({
  visible,
  onClose,
  onScan,
  title = "Quét mã QR",
  allowMultipleScan = false,
  scanDelay = 2000,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const barcodeDetectorRef = useRef<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [recentScans, setRecentScans] = useState<Set<string>>(new Set());
  const [lastScanTime, setLastScanTime] = useState<number>(0);

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

  const initializeBarcodeDetector = async () => {
    if ("BarcodeDetector" in window) {
      try {
        barcodeDetectorRef.current = new window.BarcodeDetector({
          formats: [
            "qr_code",
            "ean_13",
            "ean_8",
            "code_128",
            "code_39",
            "code_93",
            "codabar",
            "itf",
            "upc_a",
            "upc_e",
          ],
        });
        return true;
      } catch (err) {
        console.warn("BarcodeDetector not supported:", err);
      }
    }
    return false;
  };

  const startCamera = async () => {
    try {
      setError(null);
      setIsScanning(false);

      // Check HTTPS requirement
      if (
        window.location.protocol !== "https:" &&
        window.location.hostname !== "localhost"
      ) {
        setError(
          "Camera chỉ hoạt động trên HTTPS. Vui lòng truy cập qua HTTPS."
        );
        return;
      }

      // Initialize barcode detector
      const hasDetector = await initializeBarcodeDetector();
      if (!hasDetector) {
        setError(
          "Trình duyệt không hỗ trợ quét mã barcode. Vui lòng sử dụng Chrome hoặc Edge phiên bản mới nhất."
        );
        setShowTutorial(true);
        return;
      }

      // Get camera stream with higher resolution for better barcode detection
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();

        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          setIsScanning(true);
          startScanning();
        };
      }
    } catch (err: any) {
      console.error("Camera error:", err);
      if (err.name === "NotAllowedError") {
        setError(
          "Quyền truy cập camera bị từ chối. Vui lòng cấp quyền camera."
        );
        setShowTutorial(true);
      } else if (err.name === "NotFoundError") {
        setError("Không tìm thấy camera trên thiết bị này.");
      } else {
        setError("Không thể truy cập camera. Vui lòng kiểm tra kết nối.");
      }
    }
  };

  const startScanning = () => {
    if (!barcodeDetectorRef.current || !videoRef.current) return;

    scanIntervalRef.current = setInterval(async () => {
      try {
        if (videoRef.current && videoRef.current.readyState === 4) {
          const barcodes = await barcodeDetectorRef.current.detect(
            videoRef.current
          );
          if (barcodes.length > 0) {
            const result = barcodes[0].rawValue;
            if (result) {
              const currentTime = Date.now();

              // For multiple scan mode, prevent duplicate scans within scanDelay period
              if (allowMultipleScan) {
                if (currentTime - lastScanTime < scanDelay || recentScans.has(result)) {
                  return; // Skip if too soon or recently scanned
                }

                // Update tracking
                setLastScanTime(currentTime);
                setRecentScans(prev => new Set(prev).add(result));

                // Clear recent scan after delay to allow re-scanning same code
                setTimeout(() => {
                  setRecentScans(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(result);
                    return newSet;
                  });
                }, scanDelay);

                console.log("Barcode detected:", result, "Format:", barcodes[0].format);
                onScan(result);
                // Keep scanning - don't stop camera or close
              } else {
                // Single scan mode - stop after first scan
                console.log("Barcode detected:", result, "Format:", barcodes[0].format);
                onScan(result);
                stopCamera();
                onClose();
              }
            }
          }
        }
      } catch (err) {
        console.error("Scanning error:", err);
      }
    }, 150); // Scan every 150ms for faster detection
  };

  const stopCamera = () => {
    setIsScanning(false);

    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const handleRetry = () => {
    setError(null);
    setShowTutorial(false);
    startCamera();
  };

  useEffect(() => {
    if (visible && !error) {
      startCamera();
    } else if (!visible) {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [visible]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Don't render anything if not visible
  if (!visible) return null;

  return (
    <div style={{ textAlign: "center", width: "100%" }}>
      {error && (
        <>
          <Alert
            message={error.includes("HTTPS") ? "Yêu cầu HTTPS" : "Lỗi Camera"}
            description={error}
            type="error"
            showIcon
            style={{ marginBottom: 16, textAlign: "left" }}
          />

          {/* Tutorial Section */}
          {showTutorial && (
            <div style={{ textAlign: "left", marginTop: 16 }}>
              <Divider orientation="left">
                <Space>
                  {getBrowserTutorial().icon}
                  <Text strong>Hướng dẫn cho {getBrowserTutorial().name}</Text>
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
                    <br />
                    <Text>
                      • Sử dụng Chrome hoặc Edge để có kết quả tốt nhất
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
      )}

      {!error && (
        <div
          style={{
            border: "2px solid #d9d9d9",
            borderRadius: 8,
            overflow: "hidden",
            marginBottom: 16,
            position: "relative",
          }}
        >
          <video
            ref={videoRef}
            style={{
              width: "100%",
              maxWidth: 450,
              height: 338,
              objectFit: "cover",
            }}
            playsInline
            muted
          />
          {/* Scanning overlay with corner indicators */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 250,
              height: 250,
              border: "3px solid #1890ff",
              borderRadius: 12,
              pointerEvents: "none",
              boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.4)",
            }}
          >
            {/* Corner indicators */}
            <div
              style={{
                position: "absolute",
                top: -3,
                left: -3,
                width: 30,
                height: 30,
                borderTop: "6px solid #52c41a",
                borderLeft: "6px solid #52c41a",
                borderRadius: "12px 0 0 0",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: -3,
                right: -3,
                width: 30,
                height: 30,
                borderTop: "6px solid #52c41a",
                borderRight: "6px solid #52c41a",
                borderRadius: "0 12px 0 0",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: -3,
                left: -3,
                width: 30,
                height: 30,
                borderBottom: "6px solid #52c41a",
                borderLeft: "6px solid #52c41a",
                borderRadius: "0 0 0 12px",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: -3,
                right: -3,
                width: 30,
                height: 30,
                borderBottom: "6px solid #52c41a",
                borderRight: "6px solid #52c41a",
                borderRadius: "0 0 12px 0",
              }}
            />
          </div>
        </div>
      )}

      <div style={{ textAlign: "center" }}>
        <Text type="secondary" style={{ display: "block", marginBottom: 8 }}>
          {isScanning
            ? "Đưa mã QR hoặc barcode vào khung hình"
            : error
            ? "Camera đang gặp sự cố"
            : "Đang khởi động camera..."}
        </Text>
        {isScanning && (
          <Text type="secondary" style={{ fontSize: 12, display: "block" }}>
            Hỗ trợ: QR Code, EAN-13, EAN-8, Code 128, Code 39, UPC-A, UPC-E
          </Text>
        )}
      </div>
    </div>
  );
};

export default QRScanner;
