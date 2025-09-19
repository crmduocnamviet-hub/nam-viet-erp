// src/pages/FinancialTransactions.tsx

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
  Dropdown,
  Tag,
  Grid,
  List,
  Avatar,
  type TableProps,
  Drawer,
  Card,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EllipsisOutlined,
  FilterOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { supabase } from "../lib/supabaseClient";
import dayjs from "dayjs";
import { useAuth } from "../context/AuthContext";
import TransactionCreationModal from "../features/finance/components/TransactionCreationModal";
import TransactionViewModalWrapper from "../features/finance/components/TransactionViewModal";
import FilterControls from "../features/finance/components/FilterControls";

const sanitizeFilename = (filename: string) => {
  return filename
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9.\-_]/g, "_")
    .replace(/\s+/g, "_");
};

const { Search } = Input;
const { useBreakpoint } = Grid;

const TransactionPageContent: React.FC = () => {
  const screens = useBreakpoint();
  const { notification, modal } = AntApp.useApp();
  const { user } = useAuth();
  const [creationForm] = Form.useForm();
  const [executionForm] = Form.useForm();

  const [transactions, setTransactions] = useState<any[]>([]);
  const [funds, setFunds] = useState<any[]>([]);
  const [banks] = useState<any[]>([]);
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

  const initialFilters = {
    dateRange: [dayjs().startOf("month"), dayjs().endOf("month")],
    type: null,
    status: null,
    fundId: null,
    searchTerm: "",
  };

  const [filters, setFilters] = useState(initialFilters);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  const fetchData = useCallback(
    async (currentFilters = filters) => {
      setLoading(true);
      try {
        let query = supabase
          .from("transactions")
          .select("*, funds(name)")
          .order("created_at", { ascending: false });

        // Áp dụng bộ lọc
        if (
          currentFilters.dateRange &&
          currentFilters.dateRange[0] &&
          currentFilters.dateRange[1]
        ) {
          query = query.gte(
            "transaction_date",
            currentFilters.dateRange[0].format("YYYY-MM-DD")
          );
          query = query.lte(
            "transaction_date",
            currentFilters.dateRange[1].format("YYYY-MM-DD")
          );
        }
        if (currentFilters.type) {
          query = query.eq("type", currentFilters.type);
        }
        if (currentFilters.status) {
          query = query.eq("status", currentFilters.status);
        }
        if (currentFilters.fundId) {
          query = query.eq("fund_id", currentFilters.fundId);
        }
        if (currentFilters.searchTerm) {
          query = query.or(
            `description.ilike.%${currentFilters.searchTerm}%,created_by.ilike.%${currentFilters.searchTerm}%`
          );
        }

        const { data, error } = await query;
        if (error) throw error;
        setTransactions(data || []);
      } catch (error: any) {
        notification.error({
          message: "Lỗi tải dữ liệu",
          description: error.message,
        });
      } finally {
        setLoading(false);
      }
    },
    [notification]
  );

  useEffect(() => {
    const fetchInitialData = async () => {
      const { data } = await supabase.from("funds").select("*");
      if (data) setFunds(data);
      // Fetch data with initial filters
      fetchData(filters);
    };
    fetchInitialData();

    const channel = supabase
      .channel("transactions-realtime-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transactions" },
        (payload) => {
          console.log("Change received!", payload);
          fetchData(filters);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData, filters]);

  const handleFilterChange = (changedFilters: any, reset: boolean = false) => {
    const newFilters = reset
      ? changedFilters
      : { ...filters, ...changedFilters };
    setFilters(newFilters);
    // On desktop, filter changes apply instantly
    if (screens.md && !reset) {
      fetchData(newFilters);
    }
  };

  const handleSearch = (searchTerm: string) => {
    const newFilters = { ...filters, searchTerm };
    setFilters(newFilters);
    fetchData(newFilters);
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
      responsive: ["md"],
    },
    {
      title: "Người tạo",
      dataIndex: "created_by",
      key: "created_by",
      responsive: ["md"],
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: getStatusTag,
    },
    {
      title: "Hành động",
      key: "action",
      render: (_: any, record: any) => {
        const isEditable =
          record.status === "chờ duyệt" || record.status === "chờ thực thu";
        const isMobile = !screens.md; // Coi là mobile nếu màn hình nhỏ hơn medium

        const menuItems = [
          {
            key: "edit",
            label: "Sửa phiếu",
            icon: <EditOutlined />,
            onClick: () => handleEdit(record),
          },
          {
            key: "delete",
            label: "Xóa phiếu",
            icon: <DeleteOutlined />,
            danger: true,
            onClick: () => handleDelete(record.id),
          },
        ];

        return (
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

            {isEditable && isMobile && (
              <Dropdown menu={{ items: menuItems }}>
                <Button size="small" icon={<EllipsisOutlined />} />
              </Dropdown>
            )}

            {isEditable && !isMobile && (
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
        );
      },
    },
  ];

  return (
    <>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Typography.Title level={2}>Quản lý Thu - Chi</Typography.Title>
        </Col>
        <Col>
          <Space wrap>
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

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="bottom">
          <Col xs={24} md={8}>
            <Form layout="vertical">
              <Row align="bottom" gutter={8}>
                <Col xs={18} sm={20} md={24}>
                  <Form.Item label="Tìm kiếm">
                    <Search
                      placeholder="Tìm theo diễn giải..."
                      onSearch={handleSearch}
                      allowClear
                    />
                  </Form.Item>
                </Col>
                {!screens.md && (
                  <Col xs={6} sm={4}>
                    <Form.Item>
                      <Button
                        icon={<FilterOutlined />}
                        onClick={() => setIsFilterDrawerOpen(true)}
                        block
                      >
                        Lọc
                      </Button>
                    </Form.Item>
                  </Col>
                )}
              </Row>
            </Form>
          </Col>

          {screens.md && (
            <Col xs={24} md={16}>
              <FilterControls
                filters={filters}
                onFilterChange={handleFilterChange}
                funds={funds}
              />
            </Col>
          )}
        </Row>
      </Card>

      {screens.md ? (
        <Table
          columns={columns}
          dataSource={transactions}
          loading={loading}
          rowKey="id"
        />
      ) : (
        <List
          loading={loading}
          dataSource={transactions}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Button
                  size="small"
                  onClick={() => {
                    setSelectedTransaction(item);
                    setIsViewModalOpen(true);
                  }}
                >
                  Xem
                </Button>,
              ]}
            >
              <List.Item.Meta
                avatar={
                  <Avatar
                    style={{
                      backgroundColor:
                        item.type === "income" ? "#87d068" : "#f50",
                    }}
                  >
                    {item.type === "income" ? "T" : "C"}
                  </Avatar>
                }
                title={<a>{item.description}</a>}
                description={
                  <div>
                    <div>
                      <Typography.Text
                        strong
                        type={item.type === "income" ? "success" : "danger"}
                      >
                        {item.type === "income" ? "+" : "-"}
                        {item.amount.toLocaleString("vi-VN")} đ
                      </Typography.Text>
                    </div>
                    <div>
                      {dayjs(item.transaction_date).format("DD/MM/YYYY")} -{" "}
                      {getStatusTag(item.status)}
                    </div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      )}

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

      <TransactionViewModalWrapper
        open={isViewModalOpen}
        onCancel={() => setIsViewModalOpen(false)}
        onApprove={handleApprove}
        onExecute={handleExecutionFinish}
        transaction={selectedTransaction}
        funds={funds}
        banks={banks}
        form={executionForm}
      />

      <Drawer
        title="Bộ lọc"
        placement="right"
        onClose={() => setIsFilterDrawerOpen(false)}
        open={isFilterDrawerOpen}
      >
        <FilterControls
          filters={filters}
          onFilterChange={handleFilterChange}
          funds={funds}
          onApply={() => {
            fetchData(filters);
            setIsFilterDrawerOpen(false);
          }}
        />
      </Drawer>
    </>
  );
};

const FinancialTransactions: React.FC = () => (
  <AntApp>
    <TransactionPageContent />
  </AntApp>
);

export default FinancialTransactions;
