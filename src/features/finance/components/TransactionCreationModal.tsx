// src/features/finance/components/TransactionCreationModal.tsx

import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  DatePicker,
  InputNumber,
  Upload,
  Button,
  Select,
  Row,
  Col,
  AutoComplete,
  Card,
  type FormInstance,
} from "antd";
import { UploadOutlined, CalculatorOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { supabase } from "../../../lib/supabaseClient";
import QRCodeDisplay from "./QRCodeDisplay";
import CashDenominationCounter from "./CashDenominationCounter";

interface BankOption {
  value: string;
  label: string;
  bin: string;
}

interface TransactionCreationModalProps {
  open: boolean;
  onCancel: () => void;
  isSubmitting: boolean;
  onFinish: (values: any) => void;
  transactionType: "income" | "expense";
  form: FormInstance;
  fileList: any[];
  handleUpload: (options: any) => void;
  setFileList: (files: any[]) => void;
}

const TransactionCreationModal: React.FC<TransactionCreationModalProps> = ({
  open,
  onCancel,
  isSubmitting,
  onFinish,
  transactionType,
  form,
  fileList,
  handleUpload,
  setFileList,
}) => {
  const [paymentMethod, setPaymentMethod] = useState("");
  const [banks, setBanks] = useState<BankOption[]>([]);
  const [bankOptions, setBankOptions] = useState<BankOption[]>([]);
  const [isCounterModalOpen, setIsCounterModalOpen] = useState(false);

  useEffect(() => {
    if (open) {
      const fetchBanks = async () => {
        const { data } = await supabase
          .from("banks")
          .select("id, bin, short_name, name");
        if (data) {
          const bankList = data.map((b) => ({
            value: b.short_name,
            label: `${b.short_name} - ${b.name}`,
            bin: b.bin,
          }));
          setBanks(bankList);
          setBankOptions(bankList);
        }
      };
      fetchBanks();
      setPaymentMethod(form.getFieldValue("payment_method") || "");
    }
  }, [open, form]);

  const handleBankSearch = (searchText: string) => {
    if (!searchText) {
      setBankOptions(banks);
    } else {
      setBankOptions(
        banks.filter((bank) =>
          bank.label.toLowerCase().includes(searchText.toLowerCase())
        )
      );
    }
  };

  const handleCounterConfirm = (
    total: number,
    counts: Record<number, number>
  ) => {
    form.setFieldsValue({
      amount: total,
      initial_denomination_counts: counts,
    });
    setIsCounterModalOpen(false);
  };

  const watchedValues = Form.useWatch([], form);
  const selectedBankObject = banks.find(
    (b) => b.value === watchedValues?.recipient_bank
  );

  let tempQrUrl = "";
  const canGenerate =
    selectedBankObject?.bin &&
    watchedValues?.recipient_account &&
    watchedValues?.amount > 0;
  if (canGenerate) {
    const info = watchedValues.description || "Thanh toan";
    tempQrUrl = `https://img.vietqr.io/image/${selectedBankObject.bin}-${
      watchedValues.recipient_account
    }-compact2.png?amount=${watchedValues.amount}&addInfo=${encodeURIComponent(
      info
    )}&accountName=${encodeURIComponent(watchedValues.recipient_name || "")}`;
  }

  return (
    <>
      <Modal
        title={
          transactionType === "income"
            ? "Tạo Phiếu Thu Mới"
            : "Tạo Phiếu Chi Mới"
        }
        open={open}
        onCancel={onCancel}
        onOk={() => form.submit()}
        confirmLoading={isSubmitting}
        okText="Gửi đi"
        cancelText="Hủy"
        width={
          paymentMethod === "bank" && transactionType === "expense" ? 1000 : 520
        }
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          style={{ paddingTop: 24 }}
          initialValues={{ transaction_date: dayjs() }}
          onValuesChange={(changedValues) => {
            if (changedValues.payment_method !== undefined) {
              setPaymentMethod(changedValues.payment_method);
            }
          }}
        >
          <Row gutter={24}>
            <Col
              span={
                paymentMethod === "bank" && transactionType === "expense"
                  ? 12
                  : 24
              }
            >
              <Form.Item
                name="payment_method"
                label="Hình thức Thanh toán"
                rules={[{ required: true }]}
              >
                <Select placeholder="Chọn hình thức">
                  <Select.Option value="cash">Tiền mặt</Select.Option>
                  <Select.Option value="bank">Chuyển khoản</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item
                name="transaction_date"
                label="Ngày giao dịch"
                rules={[{ required: true }]}
              >
                <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
              </Form.Item>
              <Form.Item
                name="amount"
                label="Số tiền"
                rules={[{ required: true }]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  formatter={(v) =>
                    `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
                  }
                  parser={(v) => Number(v!.replace(/\./g, ""))}
                  addonAfter={
                    paymentMethod === "cash" ? (
                      <Button
                        type="text"
                        size="small"
                        icon={
                          <CalculatorOutlined
                            style={{ color: "#156de9ff", fontSize: "20px" }}
                          />
                        } // To hơn và có màu
                        onClick={() => setIsCounterModalOpen(true)}
                      />
                    ) : (
                      "VNĐ"
                    )
                  }
                />
              </Form.Item>
              <Form.Item name="initial_denomination_counts" hidden>
                <Input />
              </Form.Item>
              <Form.Item
                name="description"
                label="Diễn giải / Lý do"
                rules={[{ required: true }]}
              >
                <Input.TextArea rows={3} />
              </Form.Item>
              <Form.Item label="Đính kèm Chứng từ">
                <Upload
                  customRequest={handleUpload}
                  fileList={fileList}
                  onRemove={(file) =>
                    setFileList(fileList.filter((f) => f.uid !== file.uid))
                  }
                >
                  <Button icon={<UploadOutlined />}>Tải lên file</Button>
                </Upload>
              </Form.Item>
            </Col>

            {paymentMethod === "bank" && transactionType === "expense" && (
              <Col span={12}>
                <Card title="Thông tin người nhận" size="small" type="inner">
                  <Form.Item
                    name="recipient_bank"
                    label="Ngân hàng nhận"
                    rules={[
                      { required: true, message: "Vui lòng chọn ngân hàng" },
                    ]}
                  >
                    <AutoComplete
                      options={bankOptions}
                      onSearch={handleBankSearch}
                      placeholder="Gõ 'vcb' hoặc 'tech' để tìm..."
                    />
                  </Form.Item>
                  <Form.Item
                    name="recipient_account"
                    label="Số tài khoản nhận"
                    rules={[{ required: true }]}
                  >
                    <Input />
                  </Form.Item>
                  <Form.Item
                    name="recipient_name"
                    label="Tên người nhận"
                    rules={[{ required: true }]}
                  >
                    <Input />
                  </Form.Item>
                </Card>
                <QRCodeDisplay qrUrl={tempQrUrl} />
              </Col>
            )}
          </Row>
        </Form>
      </Modal>
      <Modal
        title="Bảng Kê Tiền Mặt"
        open={isCounterModalOpen}
        onCancel={() => setIsCounterModalOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <CashDenominationCounter
          targetAmount={0}
          onConfirm={handleCounterConfirm}
        />
      </Modal>
    </>
  );
};

export default TransactionCreationModal;
