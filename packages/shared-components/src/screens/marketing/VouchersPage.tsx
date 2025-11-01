import React, { useState, useEffect, useMemo } from "react";
import {
  Button,
  Table,
  Space,
  Row,
  Col,
  App,
  Modal,
  Form,
  Input as AntInput,
  Select,
  InputNumber,
  Switch,
  Tag,
  Card,
  Statistic,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  HomeOutlined,
  GiftOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import PageLayout from "../../components/PageLayout";
import {
  createVoucher,
  deleteVoucher,
  getActivePromotions,
  getVouchersWithPromotion,
  updateVoucher,
} from "@nam-viet-erp/services";

const Vouchers: React.FC = () => {
  const { notification, modal } = App.useApp();
  const [form] = Form.useForm();
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [promotions, setPromotions] = useState<
    { value: number; label: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<any | null>(null);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const fetchVouchers = async () => {
    setLoading(true);
    try {
      const { data, error } = await getVouchersWithPromotion();
      if (error) throw error;
      setVouchers(data || []);
    } catch (error: any) {
      notification.error({
        message: "Lỗi tải mã giảm giá",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchPromotions = async () => {
      const { data, error } = await getActivePromotions();
      if (error) console.error(error);
      else {
        setPromotions(data.map((p) => ({ value: p.id, label: p.name })));
      }
    };

    fetchVouchers();
    fetchPromotions();
  }, []);

  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingVoucher(null);
    form.resetFields();
  };

  const handleAdd = () => {
    setEditingVoucher(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (record: any) => {
    setEditingVoucher(record);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number, code: string) => {
    modal.confirm({
      title: "Bạn chắc chắn muốn xóa mã này?",
      content: `Mã giảm giá "${code}" sẽ bị xóa vĩnh viễn.`,
      okText: "Xóa",
      okType: "danger",
      onOk: async () => {
        const { error } = await deleteVoucher(id);
        if (error) {
          notification.error({
            message: "Lỗi khi xóa",
            description: error.message,
          });
        } else {
          notification?.success({ message: "Đã xóa thành công!" });
          fetchVouchers();
        }
      },
    });
  };

  const handleFinish = async (values: any) => {
    try {
      const record: Omit<IVoucher, "id"> = {
        code: values.code,
        promotion_id: values.promotion_id,
        usage_limit: values.usage_limit,
        is_active: values.is_active,
      };

      let error;
      if (editingVoucher) {
        ({ error } = await updateVoucher(editingVoucher.id, record));
      } else {
        ({ error } = await createVoucher(record));
      }

      if (error) throw error;
      notification?.success({
        message: `Đã ${
          editingVoucher ? "cập nhật" : "tạo"
        } mã giảm giá thành công!`,
      });
      handleCancel();
      fetchVouchers();
    } catch (error: any) {
      notification.error({
        message: "Thao tác thất bại",
        description: error.message,
      });
    }
  };

  // Filter data
  const filteredData = useMemo(() => {
    let filtered = vouchers;

    // Filter by search text
    if (searchText) {
      const lowerSearch = searchText.toLowerCase();
      filtered = filtered.filter(
        (voucher) =>
          voucher.code?.toLowerCase().includes(lowerSearch) ||
          voucher.promotions?.name?.toLowerCase().includes(lowerSearch),
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      const isActive = statusFilter === "active";
      filtered = filtered.filter((voucher) => voucher.is_active === isActive);
    }

    return filtered;
  }, [vouchers, searchText, statusFilter]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const total = vouchers.length;
    const active = vouchers.filter((v) => v.is_active).length;
    const used = vouchers.filter((v) => v.times_used > 0).length;
    const totalUsage = vouchers.reduce(
      (sum, v) => sum + (v.times_used || 0),
      0,
    );

    return { total, active, used, totalUsage };
  }, [vouchers]);

  const columns = [
    { title: "Mã Code", dataIndex: "code", key: "code" },
    {
      title: "Thuộc Chương trình KM",
      dataIndex: "promotions",
      key: "promotion_name",
      render: (promo: any) => promo?.name || "N/A",
    },
    {
      title: "Giới hạn Lượt dùng",
      dataIndex: "usage_limit",
      key: "usage_limit",
    },
    { title: "Đã dùng", dataIndex: "times_used", key: "times_used" },
    {
      title: "Trạng thái",
      dataIndex: "is_active",
      key: "is_active",
      render: (isActive: boolean) => (
        <Tag color={isActive ? "green" : "red"}>
          {isActive ? "Hoạt động" : "Vô hiệu"}
        </Tag>
      ),
    },
    {
      title: "Hành động",
      key: "action",
      width: 80,
      align: "center" as const,
      fixed: "right" as const,
      render: (_: any, record: any) => (
        <Button
          icon={<DeleteOutlined />}
          danger
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(record.id, record.code);
          }}
        />
      ),
    },
  ];

  return (
    <PageLayout
      title="Quản lý Mã Giảm Giá"
      breadcrumbs={[
        {
          title: "Trang chủ",
          href: "/",
          icon: <HomeOutlined />,
        },
        {
          title: "Mã Giảm Giá",
          icon: <GiftOutlined />,
        },
      ]}
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
          size="large"
        >
          Tạo Mã mới
        </Button>
      }
    >
      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng Mã Giảm Giá"
              value={statistics.total}
              prefix={<GiftOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Đang Hoạt Động"
              value={statistics.active}
              valueStyle={{ color: "#52c41a" }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Đã Sử Dụng"
              value={statistics.used}
              valueStyle={{ color: "#1890ff" }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng Lượt Dùng"
              value={statistics.totalUsage}
              valueStyle={{ color: "#faad14" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Space size="middle" wrap>
          <AntInput
            placeholder="Tìm kiếm theo mã, chương trình..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
            allowClear
            size="large"
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 200 }}
            size="large"
            options={[
              { label: "Tất cả trạng thái", value: "all" },
              { label: "Đang hoạt động", value: "active" },
              { label: "Ngưng hoạt động", value: "inactive" },
            ]}
          />
        </Space>
      </Card>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredData}
          loading={loading}
          rowKey="id"
          onRow={(record) => ({
            onClick: () => handleEdit(record),
            style: { cursor: "pointer" },
          })}
          pagination={{
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} mã giảm giá`,
          }}
        />
      </Card>

      <Modal
        title={editingVoucher ? "Cập nhật Mã Giảm Giá" : "Tạo Mã Giảm Giá mới"}
        open={isModalOpen}
        onCancel={handleCancel}
        onOk={() => form.submit()}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          style={{ paddingTop: 24 }}
          initialValues={{ is_active: true, usage_limit: 1 }}
        >
          <Form.Item
            name="promotion_id"
            label="Chọn chương trình khuyến mại"
            rules={[{ required: true }]}
          >
            <Select
              options={promotions}
              placeholder="Liên kết với một chương trình..."
            />
          </Form.Item>
          <Form.Item
            name="code"
            label="Mã Giảm Giá (Voucher Code)"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="usage_limit"
            label="Giới hạn lượt sử dụng"
            rules={[{ required: true }]}
          >
            <InputNumber style={{ width: "100%" }} min={1} />
          </Form.Item>
          <Form.Item name="is_active" label="Kích hoạt" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </PageLayout>
  );
};

export default Vouchers;
