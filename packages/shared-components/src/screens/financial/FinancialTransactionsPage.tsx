import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  Modal,
  DatePicker,
  Select,
  Badge,
  type TableProps,
} from "antd";
import {
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  EllipsisOutlined,
  DownloadOutlined,
  FileExcelOutlined,
} from "@ant-design/icons";

import {
  createTransaction,
  deleteTransaction,
  getTransactions,
  searchTransactions,
  updateTransaction,
  uploadAttachment,
} from "@nam-viet-erp/services";
import dayjs from "dayjs";
import { useDebounce } from "@nam-viet-erp/shared-components";
import {
  exportTransactionsToExcel,
  exportTransactionsTemplate,
  exportTransactionsSummary,
} from "@nam-viet-erp/shared-components";
// Temporary stub components to replace missing modal imports
const TransactionCreationModal: React.FC<any> = ({
  open,
  onCancel,
  onOk,
  ...props
}) =>
  open ? (
    <Modal
      title="Transaction Creation"
      open={open}
      onCancel={onCancel}
      onOk={onOk}
      {...props}
    >
      <p>Transaction creation functionality will be implemented here.</p>
    </Modal>
  ) : null;

const TransactionViewModal: React.FC<any> = ({ open, onCancel, ...props }) =>
  open ? (
    <Modal title="Transaction View" open={open} onCancel={onCancel} {...props}>
      <p>Transaction view functionality will be implemented here.</p>
    </Modal>
  ) : null;
import { getFunds } from "@nam-viet-erp/services";

const { Search } = Input;
const { useBreakpoint } = Grid;

interface FinancialTransactionsPageProps {
  user?: any;
  [key: string]: any;
}

const TransactionPageContent: React.FC<FinancialTransactionsPageProps> = ({
  user,
}) => {
  const screens = useBreakpoint(); // Lấy thông tin màn hình
  const { notification, modal } = AntApp.useApp();
  const [creationForm] = Form.useForm();
  const [executionForm] = Form.useForm();

  const [transactions, setTransactions] = useState<any[]>([]);
  const [funds, setFunds] = useState<any[]>([]);
  const [banks, setBanks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isCreationModalOpen, setIsCreationModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const [transactionType, setTransactionType] = useState<"income" | "expense">(
    "income",
  );
  const [fileList, setFileList] = useState<any[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<any | null>(
    null,
  );

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 50,
    total: 0,
    showSizeChanger: true,
    pageSizeOptions: [10, 20, 50, 100, 200, 500, 1000],
  });

  // Filter states
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(
    null,
  );
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">(
    "all",
  );
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [creatorFilter, setCreatorFilter] = useState<string>("all");

  // Row selection state
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const fetchData = useCallback(
    async (page = 1, pageSize = 50, search = debouncedSearchTerm) => {
      setLoading(true);
      try {
        if (funds.length === 0 || banks.length === 0) {
          const { funds, banks } = await getFunds();
          setFunds(funds || []);
          setBanks(banks);
        }

        // const from = (page - 1) * pageSize;
        // const to = from + pageSize - 1;

        if (search) {
          const { data, error, count } = await searchTransactions(
            search,
            page,
            pageSize,
          );
          if (error) throw error;
          setTransactions(data || []);
          setPagination((prev) => ({
            ...prev,
            total: count || 0,
            current: page,
          }));
        } else {
          const { data, error, count } = await getTransactions(page, pageSize);
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
    [debouncedSearchTerm, notification, funds.length, banks.length],
  );

  useEffect(() => {
    fetchData(pagination.current, pagination.pageSize);
  }, [fetchData, pagination.current, pagination.pageSize]);

  const handleTableChange: TableProps<any>["onChange"] = (newPagination) => {
    const pageSize = Math.min(newPagination.pageSize || 50, 1000); // Maximum 1000 rows/page
    setPagination((prev) => ({
      ...prev,
      current: newPagination.current || 1,
      pageSize,
      showSizeChanger: true,
      pageSizeOptions: [10, 20, 50, 100, 200, 500, 1000],
    }));
  };

  const handleUpload = async ({ file, onSuccess, onError }: any) => {
    try {
      const publicUrl = await uploadAttachment(file);
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
          (b) => b.value === values.recipient_bank,
        );
        if (selectedBank) {
          const info = values.description || `Thanh toan`;
          qrUrl = `https://img.vietqr.io/image/${selectedBank.bin}-${
            values.recipient_account
          }-compact2.png?amount=${values.amount}&addInfo=${encodeURIComponent(
            info,
          )}&accountName=${encodeURIComponent(values.recipient_name || "")}`;
        }
      }

      const attachmentUrls: string[] = fileList.map((f) => f.url);
      const record: Partial<ITransaction> = {
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
      const { error } = await createTransaction(record);
      if (error) throw error;
      notification?.success({ message: `Đã tạo phiếu và gửi đi thành công!` });
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
      const record = {
        status: selectedTransaction.type === "income" ? "đã thu" : "đã chi",
        executed_by: user?.user_metadata?.full_name || user?.email,
        fund_id: values.fund_id,
      };
      const { error } = await updateTransaction(selectedTransaction.id, record);

      if (error) throw error;
      notification?.success({ message: `Đã xác nhận thực thi giao dịch!` });
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
          const record = {
            status: "đã duyệt - chờ chi",
            approved_by: user?.user_metadata?.full_name || user?.email,
          };
          const { error } = await updateTransaction(
            selectedTransaction.id,
            record,
          );
          if (error) throw error;
          notification?.success({ message: `Duyệt chi thành công!` });
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
          await deleteTransaction(transactionId);
          notification?.success({ message: "Đã xóa phiếu thành công!" });
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

  const handleBulkDelete = () => {
    if (selectedRowKeys.length === 0) {
      notification.warning({
        message: "Chưa chọn phiếu nào",
        description: "Vui lòng chọn ít nhất một phiếu để xoá.",
      });
      return;
    }

    modal.confirm({
      title: `Xác nhận xóa ${selectedRowKeys.length} phiếu thu chi?`,
      content:
        "Hành động này không thể hoàn tác. Tất cả các phiếu đã chọn sẽ bị xóa vĩnh viễn.",
      okText: "Xóa tất cả",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        setLoading(true);
        let successCount = 0;
        let failCount = 0;
        const errors: string[] = [];

        try {
          // Xóa từng transaction
          for (const id of selectedRowKeys) {
            try {
              await deleteTransaction(id as number);
              successCount++;
            } catch (error: any) {
              failCount++;
              errors.push(
                `Phiếu ${id}: ${error.message || "Lỗi không xác định"}`,
              );
            }
          }

          // Hiển thị kết quả
          if (successCount > 0 && failCount === 0) {
            notification.success({
              message: "Xóa hàng loạt thành công!",
              description: `Đã xóa ${successCount} phiếu thu chi.`,
            });
          } else if (successCount > 0 && failCount > 0) {
            notification.warning({
              message: "Xóa một phần thành công",
              description: `Đã xóa ${successCount} phiếu. ${failCount} phiếu xóa thất bại.`,
            });
          } else {
            notification.error({
              message: "Xóa thất bại",
              description: `Không thể xóa ${failCount} phiếu. ${errors[0] || ""}`,
            });
          }

          // Clear selection và reload data
          setSelectedRowKeys([]);
          fetchData();
        } catch (error: any) {
          notification.error({
            message: "Lỗi hệ thống",
            description: error.message || "Đã xảy ra lỗi khi xóa phiếu.",
          });
        } finally {
          setLoading(false);
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

  // Get unique creators from transactions
  const uniqueCreators = useMemo(() => {
    const creators = transactions
      .map((t) => t.created_by)
      .filter((creator) => creator && creator.trim() !== "");

    return Array.from(new Set(creators)).sort();
  }, [transactions]);

  // Filtered transactions based on filters
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    // Filter by date range
    if (dateRange) {
      const [start, end] = dateRange;
      const startDate = start.startOf("day");
      const endDate = end.endOf("day");

      filtered = filtered.filter((t) => {
        const transDate = dayjs(t.transaction_date);
        return !transDate.isBefore(startDate) && !transDate.isAfter(endDate);
      });
    }

    // Filter by type
    if (typeFilter !== "all") {
      filtered = filtered.filter((t) => t.type === typeFilter);
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((t) => t.status === statusFilter);
    }

    // Filter by creator
    if (creatorFilter !== "all") {
      filtered = filtered.filter((t) => t.created_by === creatorFilter);
    }

    return filtered;
  }, [transactions, dateRange, typeFilter, statusFilter, creatorFilter]);

  // Get selected transactions (either selected rows or all filtered if none selected)
  const transactionsToExport = useMemo(() => {
    if (selectedRowKeys.length > 0) {
      return filteredTransactions.filter((t) => selectedRowKeys.includes(t.id));
    }
    return filteredTransactions;
  }, [filteredTransactions, selectedRowKeys]);

  // Excel Export Handlers
  const handleExportExcel = () => {
    try {
      const dataToExport = transactionsToExport;
      if (dataToExport.length === 0) {
        notification.warning({
          message: "Không có dữ liệu để xuất",
          description:
            "Vui lòng chọn ít nhất một giao dịch hoặc điều chỉnh bộ lọc.",
        });
        return;
      }

      const filename = dateRange
        ? `bao-cao-thu-chi-${dateRange[0].format("DDMMYYYY")}-${dateRange[1].format("DDMMYYYY")}.xlsx`
        : "bao-cao-thu-chi.xlsx";

      exportTransactionsToExcel(dataToExport, filename);
      notification.success({
        message: "Xuất Excel thành công!",
        description: `Đã xuất ${dataToExport.length} giao dịch ra file Excel.`,
      });

      // Clear selection after export
      setSelectedRowKeys([]);
    } catch (error: any) {
      notification.error({
        message: "Xuất Excel thất bại",
        description: error.message,
      });
    }
  };

  const handleExportTemplate = () => {
    try {
      exportTransactionsTemplate();
      notification.success({
        message: "Tải template thành công!",
        description: "Đã tải file mẫu import thu chi.",
      });
    } catch (error: any) {
      notification.error({
        message: "Tải template thất bại",
        description: error.message,
      });
    }
  };

  const handleExportSummary = () => {
    try {
      const dataToExport = transactionsToExport;
      if (dataToExport.length === 0) {
        notification.warning({
          message: "Không có dữ liệu để xuất",
          description:
            "Vui lòng chọn ít nhất một giao dịch hoặc điều chỉnh bộ lọc.",
        });
        return;
      }

      const startDate = dateRange?.[0].format("YYYY-MM-DD");
      const endDate = dateRange?.[1].format("YYYY-MM-DD");
      const filename = dateRange
        ? `bao-cao-tong-hop-${dateRange[0].format("DDMMYYYY")}-${dateRange[1].format("DDMMYYYY")}.xlsx`
        : "bao-cao-tong-hop-thu-chi.xlsx";

      exportTransactionsSummary(dataToExport, startDate, endDate, filename);
      notification.success({
        message: "Xuất báo cáo tổng hợp thành công!",
        description: `Đã xuất báo cáo cho ${dataToExport.length} giao dịch.`,
      });

      // Clear selection after export
      setSelectedRowKeys([]);
    } catch (error: any) {
      notification.error({
        message: "Xuất báo cáo thất bại",
        description: error.message,
      });
    }
  };

  // Clear all filters
  const handleClearFilters = () => {
    setDateRange(null);
    setTypeFilter("all");
    setStatusFilter("all");
    setCreatorFilter("all");
    setSelectedRowKeys([]);
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
            <Dropdown
              menu={{
                items: [
                  {
                    key: "export",
                    icon: <FileExcelOutlined />,
                    label: "Xuất Excel (Tất cả)",
                    onClick: handleExportExcel,
                  },
                  {
                    key: "summary",
                    icon: <FileExcelOutlined />,
                    label: "Báo cáo tổng hợp",
                    onClick: handleExportSummary,
                  },
                  {
                    type: "divider",
                  },
                  {
                    key: "template",
                    icon: <DownloadOutlined />,
                    label: "Tải file mẫu",
                    onClick: handleExportTemplate,
                  },
                ],
              }}
              trigger={["click"]}
            >
              <Button icon={<DownloadOutlined />}>Xuất Excel</Button>
            </Dropdown>
          </Space>
        </Col>
      </Row>
      {/* Filters Row */}
      <Row style={{ marginBottom: 16 }} gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6} lg={5}>
          <Search
            placeholder="Tìm theo người tạo, diễn giải..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            allowClear
          />
        </Col>
        <Col xs={24} sm={12} md={6} lg={5}>
          <DatePicker.RangePicker
            style={{ width: "100%" }}
            value={dateRange}
            onChange={(dates) =>
              setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)
            }
            format="DD/MM/YYYY"
            placeholder={["Từ ngày", "Đến ngày"]}
          />
        </Col>
        <Col xs={12} sm={6} md={4} lg={3}>
          <Select
            style={{ width: "100%" }}
            value={typeFilter}
            onChange={setTypeFilter}
            placeholder="Loại"
          >
            <Select.Option value="all">Tất cả loại</Select.Option>
            <Select.Option value="income">Thu</Select.Option>
            <Select.Option value="expense">Chi</Select.Option>
          </Select>
        </Col>
        <Col xs={12} sm={6} md={4} lg={3}>
          <Select
            style={{ width: "100%" }}
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="Trạng thái"
          >
            <Select.Option value="all">Tất cả</Select.Option>
            <Select.Option value="chờ duyệt">Chờ duyệt</Select.Option>
            <Select.Option value="đã duyệt - chờ chi">
              Đã duyệt - Chờ chi
            </Select.Option>
            <Select.Option value="đã chi">Đã chi</Select.Option>
            <Select.Option value="đã thu">Đã thu</Select.Option>
            <Select.Option value="chờ thực thu">Chờ thực thu</Select.Option>
            <Select.Option value="từ chối">Từ chối</Select.Option>
          </Select>
        </Col>
        <Col xs={12} sm={6} md={4} lg={4}>
          <Select
            style={{ width: "100%" }}
            value={creatorFilter}
            onChange={setCreatorFilter}
            placeholder="Người tạo"
            showSearch
            optionFilterProp="children"
            filterOption={(input, option) =>
              String(option?.children || "")
                .toLowerCase()
                .includes(input.toLowerCase())
            }
          >
            <Select.Option value="all">Tất cả người tạo</Select.Option>
            {uniqueCreators.map((creator) => (
              <Select.Option key={creator} value={creator}>
                {creator}
              </Select.Option>
            ))}
          </Select>
        </Col>
        <Col xs={12} sm={6} md={4} lg={4}>
          <Button onClick={handleClearFilters} block>
            Xóa bộ lọc
          </Button>
        </Col>
      </Row>

      {/* Summary Info */}
      {(dateRange ||
        typeFilter !== "all" ||
        statusFilter !== "all" ||
        creatorFilter !== "all" ||
        selectedRowKeys.length > 0) && (
        <Row style={{ marginBottom: 16 }} gutter={[16, 16]}>
          <Col xs={24} sm={24} md={16} lg={18}>
            <Space wrap>
              {selectedRowKeys.length > 0 && (
                <Badge count={selectedRowKeys.length} showZero>
                  <Tag color="blue">Đã chọn {selectedRowKeys.length} dòng</Tag>
                </Badge>
              )}
              {filteredTransactions.length !== transactions.length && (
                <Tag color="green">
                  Đang hiển thị {filteredTransactions.length}/
                  {transactions.length} giao dịch
                </Tag>
              )}
              {transactionsToExport.length > 0 && (
                <Tag color="orange">
                  Sẽ xuất {transactionsToExport.length} giao dịch
                </Tag>
              )}
            </Space>
          </Col>
          {selectedRowKeys.length > 0 && (
            <Col xs={24} sm={24} md={8} lg={6}>
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={handleBulkDelete}
                block
              >
                Xoá {selectedRowKeys.length} phiếu đã chọn
              </Button>
            </Col>
          )}
        </Row>
      )}

      <Table
        columns={columns}
        dataSource={filteredTransactions}
        loading={loading}
        rowKey="id"
        pagination={pagination}
        onChange={handleTableChange}
        rowSelection={{
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys),
          selections: [
            Table.SELECTION_ALL,
            Table.SELECTION_INVERT,
            Table.SELECTION_NONE,
          ],
        }}
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

const FinancialTransactions: React.FC<FinancialTransactionsPageProps> = (
  props,
) => (
  <AntApp>
    <TransactionPageContent {...props} />
  </AntApp>
);

export default FinancialTransactions;
