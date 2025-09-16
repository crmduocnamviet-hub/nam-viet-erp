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
import { supabase } from "../lib/supabaseClient";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";

dayjs.extend(isBetween);

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

// Component Card cho từng quỹ, tích hợp báo cáo chi nhanh
const FundCard: React.FC<{ fund: any; transactions: any[]; range: any }> = ({
  fund,
  transactions,
  range,
}) => {
  const currentBalance = useMemo(() => {
    const balance = transactions.reduce((acc, t) => {
      if (t.fund_id !== fund.id) return acc;
      return acc + (t.type === "income" ? t.amount : -t.amount);
    }, fund.initial_balance);
    return balance;
  }, [transactions, fund]);

  const expenseReport = useMemo(() => {
    if (!range || !range[0] || !range[1]) return { total: 0 };
    const [startDate, endDate] = range;
    const total = transactions
      .filter(
        (t) =>
          t.fund_id === fund.id &&
          t.type === "expense" &&
          dayjs(t.transaction_date).isBetween(startDate, endDate, null, "[]")
      )
      .reduce((acc, t) => acc + t.amount, 0);
    return { total };
  }, [transactions, fund, range]);

  return (
    <Col xs={24} sm={12} md={8}>
      <Card title={fund.name} style={{ height: "100%" }}>
        <Statistic
          title="Số dư hiện tại"
          value={currentBalance}
          precision={0}
          valueStyle={{ color: "#00809D" }}
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
            title="Tổng chi"
            value={expenseReport.total}
            precision={0}
            valueStyle={{ color: "#cf1322" }}
            suffix="VNĐ"
          />
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Phân loại chi tiết sẽ được cập nhật ở phiên bản sau.
          </Typography.Text>
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
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<any>([
    dayjs().startOf("month"),
    dayjs().endOf("month"),
  ]);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const fundsPromise = supabase.from("funds").select("*, banks(*)"); // Lấy cả thông tin ngân hàng
      const transPromise = supabase.from("transactions").select("*");
      const [fundsRes, transRes] = await Promise.all([
        fundsPromise,
        transPromise,
      ]);

      if (fundsRes.error) throw fundsRes.error;
      if (transRes.error) throw transRes.error;

      setFunds(fundsRes.data || []);
      setTransactions(transRes.data || []);
    } catch (error: any) {
      notification.error({
        message: "Lỗi tải dữ liệu",
        description: error.message,
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
    const totalTransactions = transactions.reduce((acc, t) => {
      return acc + (t.type === "income" ? t.amount : -t.amount);
    }, 0);
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
      const { error } = await supabase.rpc("create_internal_transfer", {
        from_fund_id: values.from_fund_id,
        to_fund_id: values.to_fund_id,
        transfer_amount: values.amount,
        transfer_description: values.description || "Chuyển tiền nội bộ",
        created_by_user: "Thủ quỹ",
      });
      if (error) throw error;
      notification.success({ message: "Chuyển tiền nội bộ thành công!" });
      handleTransferCancel();
      fetchData();
    } catch (error: any) {
      notification.error({
        message: "Chuyển tiền thất bại",
        description: error.message,
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
          <Space>
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
