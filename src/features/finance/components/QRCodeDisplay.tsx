import React from "react";
import { Image, Typography, Skeleton, Card } from "antd";

const { Text } = Typography;

interface QRCodeDisplayProps {
  qrUrl?: string | null; // Chỉ cần nhận vào URL
}

const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ qrUrl }) => {
  return (
    <Card
      title="Mã QR Thanh toán"
      size="small"
      style={{ marginTop: 16, background: "#fafafa", textAlign: "center" }}
    >
      {qrUrl ? (
        <Image width={220} src={qrUrl} preview={false} />
      ) : (
        <Skeleton.Image
          active
          style={{ width: 220, height: 220, margin: "auto" }}
        />
      )}
      <Text type="secondary" style={{ display: "block", marginTop: 8 }}>
        {qrUrl
          ? "Dùng ứng dụng ngân hàng để quét mã"
          : "Vui lòng điền đủ thông tin để tạo mã QR"}
      </Text>
    </Card>
  );
};

export default QRCodeDisplay;
