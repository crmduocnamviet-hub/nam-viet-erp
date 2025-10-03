import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Row,
  Col,
  Typography,
  App as AntApp,
  Card,
  Spin,
  Statistic,
  DatePicker,
  Button,
  Modal,
  Form,
  Select,
  InputNumber,
  Input,
  Space,
} from "antd";
import { SwapOutlined } from "@ant-design/icons";

import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { createInternalTransfer, getFundsAndTransactions } from "@nam-viet-erp/services";

dayjs.extend(isBetween);

// Helper function to safely get error message
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    return (error as any).message;
  }

  return 'An unknown error occurred';
};

const { RangePicker } = DatePicker;
const { Option } = Select;

// Component Card cho từng quỹ, logic tính toán từng quỹ.
const FundCard: React.FC<{
  fund: any;
  transactions: any[];
  transfers: any[];
  range: any;
}> = ({ fund, transactions, transfers, range }) => {
  const currentBalance = useMemo(() => {
    // Chỉ tính các giao dịch đã hoàn tất
    const incomeAndExpense = transactions
      .filter(
        (t) =>
          t.fund_id === fund.id &&
          (t.status === "đã thu" || t.status === "đã chi")
      )
      .reduce(
        (acc, t) => acc + (t.type === "income" ? t.amount : -t.amount),
        0
      );

    // Tính các khoản chuyển tiền nội bộ
    const internalTransfers = transfers.reduce((acc, t) => {
      if (t.from_fund_id === fund.id) return acc - t.amount;
      if (t.to_fund_id === fund.id) return acc + t.amount;
      return acc;
    }, 0);

    return fund.initial_balance + incomeAndExpense + internalTransfers;
  }, [transactions, transfers, fund]);

  // Báo cáo chi nhanh - không bao gồm chuyển tiền nội bộ
  const expenseReport = useMemo(() => {
    if (!range || !range[0] || !range[1]) return { total: 0 };
    const [startDate, endDate] = range;
    const total = transactions
      .filter(
        (t) =>
          t.fund_id === fund.id &&
          t.type === "expense" &&
          t.status === "đã chi" && // Chỉ tính các khoản đã chi
          dayjs(t.transaction_date).isBetween(startDate, endDate, null, "[]")
      )
      .reduce((acc, t) => acc + t.amount, 0);
    return { total };
  }, [transactions, fund, range]);

  return (
    <Col xs={24} sm={12} lg={8}>
      <Card title={fund.name} style={{ height: "100%" }}>
        <Statistic
          title="Số dư hiện tại"
          value={currentBalance}
          precision={0}
          valueStyle={{ color: "#0D5EA6" }}
          suffix="VNĐ"
        />
        <div
          style={{
            marginTop: 16,
            borderTop: "1px solid #f0f0f0",
            paddingTop: 16,
          }}
        >
          <Typography.Text strong>Báo cáo chi trong kỳ</Typography.Text>
          <Statistic
            title="Tổng chi (không gồm chuyển nội bộ)"
            value={expenseReport.total}
            precision={0}
            valueStyle={{ color: "#cf1322" }}
            suffix="VNĐ"
          />
        </div>
      </Card>
    </Col>
  );
};

const CashLedgerPageContent: React.FC = () => {
  const { notification } = AntApp.useApp();
  const [transferForm] = Form.useForm();

  const [funds, setFunds] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [internalTransfers, setInternalTransfers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<any>([
    dayjs().startOf("month"),
    dayjs().endOf("month"),
  ]);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { funds, transactions, internalTransfers } = await getFundsAndTransactions();
      setFunds(funds);
      setTransactions(transactions);
      setInternalTransfers(internalTransfers);
    } catch (error: unknown) {
      notification.error({
        message: "Lỗi tải dữ liệu",
        description: getErrorMessage(error),
      });
    } finally {
      setLoading(false);
    }
  }, [notification]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalBalance = useMemo(() => {
    const totalInitial = funds.reduce((acc, f) => acc + f.initial_balance, 0);
    const totalTransactions = transactions
      .filter((t) => t.status === "đã thu" || t.status === "đã chi")
      .reduce(
        (acc, t) => acc + (t.type === "income" ? t.amount : -t.amount),
        0
      );
    return totalInitial + totalTransactions;
  }, [funds, transactions]);

  const handleTransferCancel = () => {
    setIsTransferModalOpen(false);
    transferForm.resetFields();
  };

  const handleTransferFinish = async (values: any) => {
    if (values.from_fund_id === values.to_fund_id) {
      notification.error({
        message: "Lỗi",
        description: "Quỹ nguồn và quỹ đích không được trùng nhau.",
      });
      return;
    }
    try {
      setLoading(true);
      await createInternalTransfer(values);
      notification?.success({ message: "Chuyển tiền nội bộ thành công!" });
      handleTransferCancel();
      fetchData();
    } catch (error: unknown) {
      notification.error({
        message: "Chuyển tiền thất bại",
        description: getErrorMessage(error),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Spin spinning={loading}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Typography.Title level={2}>
            Sổ Quỹ - Bảng điều khiển
          </Typography.Title>
        </Col>
        <Col>
          <Space wrap>
            <RangePicker value={dateRange} onChange={setDateRange} />
            <Button
              icon={<SwapOutlined />}
              onClick={() => setIsTransferModalOpen(true)}
            >
              Chuyển tiền nội bộ
            </Button>
          </Space>
        </Col>
      </Row>

      <Card style={{ marginBottom: 24, background: "#ECECEC" }}>
        <Statistic
          title="TỔNG SỐ DƯ TOÀN CÔNG TY"
          value={totalBalance}
          precision={0}
          valueStyle={{ color: "#003a4d", fontSize: "2.5em" }}
          suffix="VNĐ"
        />
      </Card>

      <Typography.Title level={4} style={{ marginBottom: 16 }}>
        Chi tiết các Quỹ & Tài khoản
      </Typography.Title>
      <Row gutter={[16, 16]}>
        {funds.map((fund) => (
          <FundCard
            key={fund.id}
            fund={fund}
            transactions={transactions}
            transfers={internalTransfers}
            range={dateRange}
          />
        ))}
      </Row>

      <Modal
        title="Tạo Lệnh Chuyển tiền Nội bộ"
        open={isTransferModalOpen}
        onCancel={handleTransferCancel}
        onOk={() => transferForm.submit()}
        okText="Xác nhận Chuyển"
        cancelText="Hủy"
        destroyOnHidden
      >
        <Form
          form={transferForm}
          layout="vertical"
          onFinish={handleTransferFinish}
          style={{ paddingTop: 24 }}
        >
          <Form.Item
            name="from_fund_id"
            label="Chuyển từ Quỹ/Tài khoản"
            rules={[{ required: true }]}
          >
            <Select placeholder="Chọn quỹ nguồn">
              {funds.map((fund) => (
                <Option key={fund.id} value={fund.id}>
                  {fund.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="to_fund_id"
            label="Đến Quỹ/Tài khoản"
            rules={[{ required: true }]}
          >
            <Select placeholder="Chọn quỹ đích">
              {funds.map((fund) => (
                <Option key={fund.id} value={fund.id}>
                  {fund.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="amount" label="Số tiền" rules={[{ required: true }]}>
            <InputNumber
              style={{ width: "100%" }}
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
              }
              parser={(value) => Number(value!.replace(/\./g, ""))}
              addonAfter="VNĐ"
            />
          </Form.Item>
          <Form.Item name="description" label="Nội dung">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </Spin>
  );
};

const CashLedger: React.FC = () => (
  <AntApp>
    <CashLedgerPageContent />
  </AntApp>
);

export default CashLedger;
