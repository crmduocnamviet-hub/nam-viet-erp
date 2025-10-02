import React from "react";
import {
  Modal,
  Button,
  Space,
  Tag,
  Typography,
} from "antd";
import {
  QrcodeOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { QRScanner } from "@nam-viet-erp/shared-components";

const { Text } = Typography;

interface QRScannerVerificationModalProps {
  open: boolean;
  onClose: () => void;
  onScan: (scannedData: string) => void;
  verifiedItems: Set<string>;
  orderItems: any[];
}

const QRScannerVerificationModal: React.FC<QRScannerVerificationModalProps> = ({
  open,
  onClose,
  onScan,
  verifiedItems,
  orderItems,
}) => {
  return (
    <Modal
      title={
        <Space>
          <QrcodeOutlined />
          Quét QR liên tục để xác thực sản phẩm
          <Tag color="blue">
            {verifiedItems.size}/{orderItems.length}
          </Tag>
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={[
        <div key="footer" style={{ textAlign: "center" }}>
          <Text type="secondary" style={{ marginRight: 16 }}>
            Đã xác thực: {verifiedItems.size}/{orderItems.length} sản phẩm
          </Text>
          <Button onClick={onClose}>
            Hoàn thành
          </Button>
        </div>,
      ]}
      width={700}
      centered
    >
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <div style={{ marginBottom: 12 }}>
          <Text strong style={{ color: "#1890ff" }}>
            📱 Quét liên tục nhiều sản phẩm
          </Text>
        </div>
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary">
            • Đưa mã QR/barcode vào khung hình để quét
            <br />
            • Hệ thống sẽ tự động xác thực sản phẩm có trong đơn hàng
            <br />• Tiếp tục quét cho đến khi hoàn thành tất cả sản phẩm
          </Text>
        </div>
        {orderItems.length > 0 && (
          <div
            style={{
              backgroundColor: "#f6f6f6",
              padding: "12px",
              borderRadius: "6px",
              marginBottom: 16,
            }}
          >
            <Text strong>Sản phẩm cần xác thực:</Text>
            <div style={{ marginTop: 8 }}>
              {orderItems.map((item) => (
                <Tag
                  key={item.item_id}
                  color={
                    verifiedItems.has(item.item_id) ? "green" : "default"
                  }
                  style={{ margin: "2px" }}
                >
                  {verifiedItems.has(item.item_id) && (
                    <CheckCircleOutlined style={{ marginRight: 4 }} />
                  )}
                  {item.products?.name}
                </Tag>
              ))}
            </div>
          </div>
        )}
      </div>
      <QRScanner
        visible={open}
        onClose={onClose}
        onScan={onScan}
        allowMultipleScan={true}
        scanDelay={1500}
        title="Quét nhiều mã QR để xác thực sản phẩm"
      />
    </Modal>
  );
};

export default QRScannerVerificationModal;