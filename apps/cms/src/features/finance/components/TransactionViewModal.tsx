import React, { useState } from "react";
import {
  Modal,
  Form,
  Select,
  Button,
  Card,
  Space,
  Typography,
  Descriptions,
  Row,
  Col,
  App,
  type FormInstance,
} from "antd";
import { PrinterOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import QRCodeDisplay from "./QRCodeDisplay";
import {
  PrintableReceipt,
  printReceipt,
} from "@nam-viet-erp/shared-components";

const { Option } = Select;
const { Text } = Typography;

interface TransactionViewModalProps {
  open: boolean;
  onCancel: () => void;
  onApprove: () => void;
  onExecute: (values: any) => void;
  transaction: any | null;
  funds: any[];
  banks: any[];
  form: FormInstance;
}

const TransactionViewModal: React.FC<TransactionViewModalProps> = ({
  open,
  onCancel,
  onApprove,
  onExecute,
  transaction,
  funds,
  form,
}) => {
  const { message } = App.useApp();
  const [isPrintPreviewVisible, setIsPrintPreviewVisible] = useState(false);

  if (!transaction) return null;

  const isIncome = transaction.type === "income";
  const canApprove = transaction.status === "chờ duyệt";
  const canExecute =
    transaction.status === "Đã duyệt - Chờ chi" ||
    transaction.status === "đã duyệt" ||
    transaction.status === "chờ thực thu";

  const handlePrint = () => {
    try {
      setIsPrintPreviewVisible(true);
      // Đợi component render xong rồi mới in
      setTimeout(() => {
        printReceipt();
        message.success("Đang chuẩn bị in phiếu...");
      }, 100);
    } catch (error) {
      message.error("Không thể in phiếu. Vui lòng thử lại.");
      console.error("Print error:", error);
    }
  };

  return (
    <>
      <Modal
        title={
          <Space>
            <span>
              Chi tiết Phiếu {isIncome ? "Thu" : "Chi"} #{transaction.id}
            </span>
            <Button
              type="primary"
              icon={<PrinterOutlined />}
              onClick={handlePrint}
              size="small"
            >
              In phiếu
            </Button>
          </Space>
        }
        open={open}
        onCancel={onCancel}
        footer={null}
        width={canExecute && transaction.payment_method === "bank" ? 1000 : 600}
        destroyOnClose
      >
        <Row gutter={24}>
          <Col
            span={canExecute && transaction.payment_method === "bank" ? 12 : 24}
          >
            <Descriptions bordered column={1}>
              <Descriptions.Item label="Ngày">
                {dayjs(transaction.transaction_date).format("DD/MM/YYYY")}
              </Descriptions.Item>
              <Descriptions.Item label="Hình thức">
                {transaction.payment_method === "cash"
                  ? "Tiền mặt"
                  : "Chuyển khoản"}
              </Descriptions.Item>
              <Descriptions.Item label="Số tiền">
                <Text type={isIncome ? "success" : "danger"}>
                  {transaction.amount.toLocaleString("vi-VN")} đ
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Người tạo">
                {transaction.created_by}
              </Descriptions.Item>
              <Descriptions.Item label="Diễn giải">
                {transaction.description}
              </Descriptions.Item>
              {transaction.payment_method === "bank" && !isIncome && (
                <>
                  <Descriptions.Item label="Ngân hàng nhận">
                    {transaction.recipient_bank}
                  </Descriptions.Item>
                  <Descriptions.Item label="STK nhận">
                    {transaction.recipient_account}
                  </Descriptions.Item>
                  <Descriptions.Item label="Tên người nhận">
                    {transaction.recipient_name}
                  </Descriptions.Item>
                </>
              )}
              <Descriptions.Item label="Chứng từ">
                {transaction.attachments?.length > 0
                  ? transaction.attachments.map(
                      (url: string, index: number) => (
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          key={index}
                          style={{ marginRight: 8 }}
                        >
                          File {index + 1}
                        </a>
                      ),
                    )
                  : "Không có"}
              </Descriptions.Item>
            </Descriptions>

            {canApprove && (
              <Space style={{ marginTop: 24 }}>
                <Button type="primary" onClick={onApprove}>
                  Duyệt Chi
                </Button>
                <Button danger>Từ chối</Button>
              </Space>
            )}
          </Col>

          {canExecute && (
            <Col span={12}>
              {/* Chỉ cần đọc qr_code_url từ transaction và hiển thị */}
              {transaction.payment_method === "bank" && !isIncome && (
                <QRCodeDisplay qrUrl={transaction.qr_code_url} />
              )}
              <Card title="Xác nhận Thực thi" style={{ marginTop: 16 }}>
                <Form form={form} layout="vertical" onFinish={onExecute}>
                  <Form.Item
                    name="fund_id"
                    label="Chọn Quỹ/Tài khoản để thực hiện"
                    rules={[{ required: true }]}
                  >
                    <Select placeholder="Chọn nguồn tiền">
                      {funds
                        .filter(
                          (fund) => fund.type === transaction.payment_method,
                        )
                        .map((fund) => (
                          <Option key={fund.id} value={fund.id}>
                            {fund.name}
                          </Option>
                        ))}
                    </Select>
                  </Form.Item>
                  <Button type="primary" htmlType="submit">
                    Xác nhận Đã {isIncome ? "Thu" : "Chi"}
                  </Button>
                </Form>
              </Card>
            </Col>
          )}
        </Row>
      </Modal>

      {/* Hidden PrintableReceipt for printing */}
      <div
        style={{
          display: isPrintPreviewVisible ? "block" : "none",
          position: "absolute",
          left: "-9999px",
        }}
      >
        <PrintableReceipt transaction={transaction} />
      </div>
    </>
  );
};

export default TransactionViewModal;
