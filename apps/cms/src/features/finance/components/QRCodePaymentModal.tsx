import React from "react";
import { Modal, Descriptions, Image, Typography } from "antd";

const { Text } = Typography;

interface QRCodePaymentModalProps {
  open: boolean;
  onCancel: () => void;
  paymentInfo: {
    bankName: string;
    accountNo: string;
    accountName: string;
    amount: number;
    description: string;
  };
}

const QRCodePaymentModal: React.FC<QRCodePaymentModalProps> = ({
  open,
  onCancel,
  paymentInfo,
}) => {
  const { bankName, accountNo, accountName, amount, description } = paymentInfo;

  // Logic tạo URL VietQR dựa trên tài liệu
  const vietQRUrl = `https://img.vietqr.io/image/${bankName}-${accountNo}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(
    description
  )}&accountName=${encodeURIComponent(accountName)}`;

  return (
    <Modal
      title="Quét mã QR để Thanh toán"
      open={open}
      onCancel={onCancel}
      footer={null} // Không cần nút OK/Cancel
    >
      <div style={{ display: "flex", gap: "24px" }}>
        <div style={{ flex: 1 }}>
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Ngân hàng">{bankName}</Descriptions.Item>
            <Descriptions.Item label="Số tài khoản">
              {accountNo}
            </Descriptions.Item>
            <Descriptions.Item label="Chủ tài khoản">
              {accountName}
            </Descriptions.Item>
            <Descriptions.Item label="Số tiền">
              <Text strong color="red">
                {amount.toLocaleString("vi-VN")} VNĐ
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Nội dung">
              {description}
            </Descriptions.Item>
          </Descriptions>
        </div>
        <div style={{ flex: "0 0 200px", textAlign: "center" }}>
          <Image width={200} src={vietQRUrl} preview={false} />
          <Text type="secondary">Dùng ứng dụng ngân hàng để quét mã</Text>
        </div>
      </div>
    </Modal>
  );
};

export default QRCodePaymentModal;
