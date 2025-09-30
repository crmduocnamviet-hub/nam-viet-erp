import React from "react";
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
  Grid,
  Col,
  type FormInstance,
  Input,
  App as AntApp,
} from "antd";
import dayjs from "dayjs";
import QRCodeDisplay from "./QRCodeDisplay";
import CashDenominationCounter from "./CashDenominationCounter";
import { supabase } from "../../../lib/supabaseClient";
import { usePermissions } from "../../../context/PermissionContext";

const { useBreakpoint } = Grid;
const { Option } = Select;
const { Text } = Typography;

interface TransactionViewModalProps {
  open: boolean;
  onCancel: () => void;
  onApprove: () => void;
  onExecute: (values: any, denominationCounts?: Record<number, number>) => void;
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
  const { hasPermission } = usePermissions();
  const screens = useBreakpoint();
  const { modal, notification } = AntApp.useApp();

  if (!transaction) return null;

  const isIncome = transaction.type === "income";
  const canApprove = transaction.status.trim().toLowerCase() === "chờ duyệt";
  const canExecute =
    transaction.status.trim().toLowerCase() === "đã duyệt - chờ chi" ||
    transaction.status.trim().toLowerCase() === "đã duyệt" ||
    transaction.status.trim().toLowerCase() === "chờ thực thu";

  const handleReject = () => {
    let rejectionReason = "";
    modal.confirm({
      title: `Xác nhận Từ chối Phiếu ${isIncome ? "thu" : "chi"}?`,
      content: (
        <div>
          <Text>Bạn có chắc chắn muốn từ chối phiếu này không?</Text>
          <Input.TextArea
            style={{ marginTop: 16 }}
            rows={3}
            placeholder="Nhập lý do từ chối (không bắt buộc)"
            onChange={(e) => {
              rejectionReason = e.target.value;
            }}
          />
        </div>
      ),
      okText: "Xác nhận Từ chối",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          const { error } = await supabase
            .from("transactions")
            .update({
              status: "Từ chối",
              description: `${
                transaction.description
              }\n\n---LÝ DO TỪ CHỐI---\n${rejectionReason || "Không có lý do"}`,
            })
            .eq("id", transaction.id);
          if (error) throw error;
          notification.success({ message: "Đã từ chối phiếu thành công." });
          onCancel();
        } catch (error: any) {
          notification.error({
            message: "Từ chối thất bại",
            description: error.message,
          });
        }
      },
    });
  };

  const renderApprovalSection = () => (
    <Card title="Xác nhận Thực thi" style={{ marginTop: 16 }}>
      <Form form={form} layout="vertical" onFinish={onExecute}>
        <Form.Item
          name="fund_id"
          label="Chọn Quỹ/Tài khoản để thực hiện"
          rules={[{ required: true }]}
        >
          <Select placeholder="Chọn nguồn tiền">
            {funds
              .filter((fund) => fund.type === transaction.payment_method)
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
  );

  const renderToolsSection = () => {
    // SỬA LỖI: Luôn đọc qr_code_url từ transaction đã lưu
    if (transaction.payment_method === "bank" && !isIncome) {
      return <QRCodeDisplay qrUrl={transaction.qr_code_url} />;
    }
    if (transaction.payment_method === "cash" && isIncome) {
      return (
        <CashDenominationCounter targetAmount={transaction.amount} readOnly />
      );
    }
    return null;
  };

  return (
    <Modal
      title={`Chi tiết Phiếu ${isIncome ? "Thu" : "Chi"} #${transaction.id}`}
      open={open}
      onCancel={onCancel}
      footer={null}
      width={
        canExecute && (transaction.payment_method === "bank" || isIncome)
          ? 1000
          : 600
      }
      destroyOnHidden
    >
      <Row gutter={24}>
        {/* NÂNG CẤP: Logic responsive */}
        <Col span={screens.md && canExecute ? 12 : 24}>
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
                ? transaction.attachments.map((url: string, index: number) => (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      key={index}
                      style={{ marginRight: 8 }}
                    >
                      File {index + 1}
                    </a>
                  ))
                : "Không có"}
            </Descriptions.Item>
          </Descriptions>
          {canApprove && (
            <Space style={{ marginTop: 24 }}>
              {/* Chỉ hiển thị nút Duyệt khi có quyền */}
              {hasPermission("transactions.approve") && (
                <Button type="primary" onClick={onApprove}>
                  {isIncome ? "Duyệt Thu" : "Duyệt Chi"}
                </Button>
              )}
              <Button danger onClick={handleReject}>
                Từ chối
              </Button>
            </Space>
          )}
        </Col>

        {/* Hiển thị bên cạnh trên Desktop */}
        {canExecute && screens.md && (
          <Col span={12}>
            {renderToolsSection()}
            {renderApprovalSection()}
          </Col>
        )}
      </Row>

      {/* Hiển thị ở dưới trên Mobile */}
      {canExecute && !screens.md && (
        <Row style={{ marginTop: 24 }}>
          <Col span={24}>{renderToolsSection()}</Col>
          <Col span={24}>{renderApprovalSection()}</Col>
        </Row>
      )}
    </Modal>
  );
};

const TransactionViewModalWrapper: React.FC<TransactionViewModalProps> = (
  props
) => (
  <AntApp>
    <TransactionViewModal {...props} />
  </AntApp>
);

export default TransactionViewModalWrapper;
