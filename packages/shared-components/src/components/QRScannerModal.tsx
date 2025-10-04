import React from "react";
import { Modal } from "antd";
import QRScanner from "./QRScanner";

interface QRScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onScan: (result: string) => void;
  title?: string;
}

const QRScannerModal: React.FC<QRScannerModalProps> = ({
  visible,
  onClose,
  onScan,
  title = "Quét mã QR",
}) => {
  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width={650}
      centered
      destroyOnClose
    >
      <QRScanner
        visible={visible}
        onClose={onClose}
        onScan={onScan}
        title={title}
      />
    </Modal>
  );
};

export default QRScannerModal;
