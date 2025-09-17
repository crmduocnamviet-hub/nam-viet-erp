import React, { useState, useEffect, useCallback } from "react";
import {
  Button,
  Table,
  Space,
  Row,
  Col,
  Typography,
  App as AntApp,
  Form,
  Input,
  Tag,
  type TableProps,
} from "antd";
import {
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { supabase } from "../lib/supabaseClient";
import dayjs from "dayjs";
import { useAuth } from "../context/AuthContext";
import { useDebounce } from "../hooks/useDebounce";
import TransactionCreationModal from "../features/finance/components/TransactionCreationModal";
import TransactionViewModal from "../features/finance/components/TransactionViewModal";

const { Title } = Typography;
const { Search } = Input;

const sanitizeFilename = (filename: string) => {
  return filename
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9.\-_]/g, "_")
    .replace(/\s+/g, "_");
};

const TransactionPageContent: React.FC = () => {
  const { notification, modal } = AntApp.useApp();
  const { user } = useAuth();
  const [creationForm] = Form.useForm();
  const [executionForm] = Form.useForm();

  const [transactions, setTransactions] = useState<any[]>([]);
  const [funds, setFunds] = useState<any[]>([]);
  const [banks, setBanks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isCreationModalOpen, setIsCreationModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const [transactionType, setTransactionType] = useState<"income" | "expense">(
    "income"
  );
  const [fileList, setFileList] = useState<any[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<any | null>(
    null
  );

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const fetchData = useCallback(
    async (page = 1, pageSize = 10, search = debouncedSearchTerm) => {
      setLoading(true);
      try {
        if (funds.length === 0 || banks.length === 0) {
          const fundsPromise = supabase.from("funds").select("*, banks(*)");
          const banksPromise = supabase.from("banks").select("*");
          const [fundsRes, banksRes] = await Promise.all([
            fundsPromise,
            banksPromise,
          ]);

          if (fundsRes.error) throw fundsRes.error;
          if (banksRes.error) throw banksRes.error;

          setFunds(fundsRes.data || []);

          const bankList =
            banksRes.data?.map((b) => ({
              value: b.short_name,
              label: `${b.short_name} - ${b.name}`,
              bin: b.bin,
            })) || [];
          setBanks(bankList);
        }

        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        if (search) {
          const { data, error, count } = await supabase
            .rpc(
              "search_transactions",
              { search_term: search },
              { count: "exact" }
            )
            .select("*, funds(name)")
            .range(from, to)
            .order("created_at", { ascending: false });
          if (error) throw error;
          setTransactions(data || []);
          setPagination((prev) => ({
            ...prev,
            total: count || 0,
            current: page,
          }));
        } else {
          const { data, error, count } = await supabase
            .from("transactions")
            .select("*, funds(name)", { count: "exact" })
            .range(from, to)
            .order("created_at", { ascending: false });
          if (error) throw error;
          setTransactions(data || []);
          setPagination((prev) => ({
            ...prev,
            total: count || 0,
            current: page,
          }));
        }
      } catch (error: any) {
        notification.error({
          message: "Lỗi tải dữ liệu",
          description: error.message,
        });
      } finally {
        setLoading(false);
      }
    },
    [debouncedSearchTerm, notification, funds.length, banks.length]
  );

  useEffect(() => {
    fetchData(pagination.current, pagination.pageSize);
  }, [fetchData, pagination.current, pagination.pageSize]);

  const handleTableChange: TableProps<any>["onChange"] = (newPagination) => {
    setPagination((prev) => ({
      ...prev,
      current: newPagination.current || 1,
      pageSize: newPagination.pageSize || 10,
    }));
  };

  const handleUpload = async ({ file, onSuccess, onError }: any) => {
    const cleanFileName = sanitizeFilename(file.name);
    const fileName = `${Date.now()}_${cleanFileName}`;
    try {
      const { error } = await supabase.storage
        .from("transaction-attachments")
        .upload(fileName, file, { contentType: file.type });
      if (error) throw error;
      const {
        data: { publicUrl },
      } = supabase.storage
        .from("transaction-attachments")
        .getPublicUrl(fileName);
      const newFile = {
        uid: file.uid,
        name: file.name,
        status: "done",
        url: publicUrl,
      };
      setFileList((prev) => [...prev, newFile]);
      onSuccess("ok");
    } catch (error: any) {
      notification.error({
        message: "Upload thất bại",
        description: error.message,
      });
      onError(error);
    }
  };

  const handleCreationFinish = async (values: any) => {
    try {
      let qrUrl = null;
      if (values.payment_method === "bank" && transactionType === "expense") {
        const selectedBank = banks.find(
          (b) => b.value === values.recipient_bank
        );
        if (selectedBank) {
          const info = values.description || `Thanh toan`;
          qrUrl = `https://img.vietqr.io/image/${selectedBank.bin}-${
            values.recipient_account
          }-compact2.png?amount=${values.amount}&addInfo=${encodeURIComponent(
            info
          )}&accountName=${encodeURIComponent(values.recipient_name || "")}`;
        }
      }

      const attachmentUrls = fileList.map((f) => f.url);
      const record = {
        type: transactionType,
        amount: values.amount,
        description: values.description,
        payment_method: values.payment_method,
        recipient_bank: values.recipient_bank,
        recipient_account: values.recipient_account,
        recipient_name: values.recipient_name,
        qr_code_url: qrUrl,
        transaction_date: values.transaction_date.format("YYYY-MM-DD"),
        created_by:
          user?.user_metadata?.full_name || user?.email || "Không xác định",
        attachments: attachmentUrls.length > 0 ? attachmentUrls : null,
        status: transactionType === "income" ? "chờ thực thu" : "chờ duyệt",
      };
      const { error } = await supabase.from("transactions").insert([record]);
      if (error) throw error;
      notification.success({ message: `Đã tạo phiếu và gửi đi thành công!` });
      setIsCreationModalOpen(false);
      fetchData();
    } catch (error: any) {
      notification.error({
        message: "Thao tác thất bại",
        description: error.message,
      });
    }
  };

  const handleExecutionFinish = async (values: any) => {
    if (!selectedTransaction) return;
    try {
      const { error } = await supabase
        .from("transactions")
        .update({
          status: selectedTransaction.type === "income" ? "đã thu" : "đã chi",
          executed_by: user?.user_metadata?.full_name || user?.email,
          fund_id: values.fund_id,
        })
        .eq("id", selectedTransaction.id);

      if (error) throw error;
      notification.success({ message: `Đã xác nhận thực thi giao dịch!` });
      setIsViewModalOpen(false);
      fetchData();
    } catch (error: any) {
      notification.error({
        message: `Xác nhận thất bại`,
        description: error.message,
      });
    }
  };

  const handleApprove = async () => {
    if (!selectedTransaction) return;
    modal.confirm({
      title: `Xác nhận Duyệt chi?`,
      content: `Bạn có chắc chắn muốn duyệt khoản chi này?`,
      okText: "Duyệt",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          const { error } = await supabase
            .from("transactions")
            .update({
              status: "đã duyệt - chờ chi",
              approved_by: user?.user_metadata?.full_name || user?.email,
            })
            .eq("id", selectedTransaction.id);
          if (error) throw error;
          notification.success({ message: `Duyệt chi thành công!` });
          setIsViewModalOpen(false);
          fetchData();
        } catch (error: any) {
          notification.error({
            message: `Duyệt chi thất bại`,
            description: error.message,
          });
        }
      },
    });
  };

  const handleDelete = (transactionId: number) => {
    modal.confirm({
      title: "Bạn có chắc chắn muốn xóa phiếu này?",
      content: "Hành động này không thể hoàn tác.",
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          const { error } = await supabase
            .from("transactions")
            .delete()
            .eq("id", transactionId);
          if (error) throw error;
          notification.success({ message: "Đã xóa phiếu thành công!" });
          fetchData(); // Tải lại dữ liệu
        } catch (error: any) {
          notification.error({
            message: "Xóa thất bại",
            description: error.message,
          });
        }
      },
    });
  };
  const handleEdit = (record: any) => {
    // Đặt lại selectedTransaction để đảm bảo chúng ta đang sửa bản ghi đúng
    setSelectedTransaction(record);
    setTransactionType(record.type);

    // Khôi phục lại danh sách file đã đính kèm
    const currentFileList =
      record.attachments?.map((url: string, index: number) => ({
        uid: `${-index - 1}`, // Tạo uid âm để không bị trùng
        name: url
          .substring(url.lastIndexOf("/") + 1)
          .split("?")[0]
          .substring(14), // Lấy lại tên file gốc
        status: "done",
        url: url,
      })) || [];
    setFileList(currentFileList);

    // Điền tất cả dữ liệu của bản ghi vào form
    creationForm.setFieldsValue({
      ...record,
      transaction_date: dayjs(record.transaction_date),
    });

    // Mở modal tạo/sửa phiếu
    setIsCreationModalOpen(true);
  };

  const getStatusTag = (status: string) => {
    switch (status) {
      case "chờ duyệt":
        return <Tag color="blue">Chờ duyệt</Tag>;
      case "đã duyệt - chờ chi":
        return <Tag color="purple">Đã duyệt - Chờ chi</Tag>;
      case "đã chi":
        return <Tag color="green">Đã Chi</Tag>;
      case "đã thu":
        return <Tag color="green">Đã Thu</Tag>;
      case "từ chối":
        return <Tag color="red">Từ chối</Tag>;
      case "chờ thực thu":
        return <Tag color="cyan">Chờ thực thu</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const columns: TableProps<any>["columns"] = [
    {
      title: "Ngày",
      dataIndex: "transaction_date",
      key: "transaction_date",
      render: (text: string) => dayjs(text).format("DD/MM/YYYY"),
    },
    {
      title: "Diễn giải",
      dataIndex: "description",
      key: "description",
      width: "25%",
    },
    {
      title: "Số tiền",
      dataIndex: "amount",
      key: "amount",
      render: (amount: number, record: any) => (
        <Typography.Text type={record.type === "income" ? "success" : "danger"}>
          {record.type === "income" ? "+" : "-"}
          {amount.toLocaleString("vi-VN")} đ
        </Typography.Text>
      ),
    },
    {
      title: "Quỹ/Tài khoản",
      dataIndex: ["funds", "name"],
      key: "fund_name",
      render: (name) => name || "Chưa thực thi",
    },
    { title: "Người tạo", dataIndex: "created_by", key: "created_by" },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: getStatusTag,
    },
    {
      title: "Hành động",
      key: "action",
      render: (_: any, record: any) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedTransaction(record);
              setIsViewModalOpen(true);
            }}
          >
            Xem
          </Button>
          {(record.status === "chờ duyệt" ||
            record.status === "chờ thực thu") && (
            <>
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
              />
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDelete(record.id)}
              />
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Typography.Title level={2}>Quản lý Thu - Chi</Typography.Title>
        </Col>
        <Col>
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setTransactionType("income");
                setIsCreationModalOpen(true);
              }}
            >
              Tạo Phiếu Thu
            </Button>
            <Button
              danger
              icon={<PlusOutlined />}
              onClick={() => {
                setTransactionType("expense");
                setIsCreationModalOpen(true);
              }}
            >
              Tạo Phiếu Chi
            </Button>
          </Space>
        </Col>
      </Row>
      <Row style={{ marginBottom: 16 }} gutter={16}>
        <Col span={12}>
          <Search
            placeholder="Tìm theo người tạo, diễn giải..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            allowClear
          />
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={transactions}
        loading={loading}
        rowKey="id"
        pagination={pagination}
        onChange={handleTableChange}
      />

      <TransactionCreationModal
        open={isCreationModalOpen}
        onCancel={() => {
          setIsCreationModalOpen(false);
          creationForm.resetFields();
        }}
        onFinish={handleCreationFinish}
        transactionType={transactionType}
        form={creationForm}
        fileList={fileList}
        setFileList={setFileList}
        handleUpload={handleUpload}
      />

      <TransactionViewModal
        open={isViewModalOpen}
        onCancel={() => setIsViewModalOpen(false)}
        onApprove={handleApprove}
        onExecute={handleExecutionFinish}
        transaction={selectedTransaction}
        funds={funds}
        banks={banks}
        form={executionForm}
      />
    </>
  );
};

const FinancialTransactions: React.FC = () => (
  <AntApp>
    <TransactionPageContent />
  </AntApp>
);

export default FinancialTransactions;
