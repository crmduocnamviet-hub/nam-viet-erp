import React, { useState, useEffect } from "react";
import {
  Button,
  Row,
  Col,
  Typography,
  App,
  Form,
  Input,
  Select,
  InputNumber,
  DatePicker,
  Switch,
  Card,
  Table,
  Space,
  Tag,
  Modal,
  Divider,
} from "antd";
import {
  SaveOutlined,
  ArrowLeftOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import {
  createPromotion,
  createVoucher,
  getPromotionDetail,
  supabase,
  updatePromotion,
} from "@nam-viet-erp/services";
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

const { Title } = Typography;
const { RangePicker } = DatePicker;

const PromotionDetail: React.FC = () => {
  const { notification } = App.useApp();
  const [form] = Form.useForm();
  const [voucherForm] = Form.useForm();
  const params = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [promotion, setPromotion] = useState<any | null>(null);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [promotionType, setPromotionType] = useState<string | null>(null);

  // State để lưu các tùy chọn cho bộ lọc điều kiện
  const [categories, setCategories] = useState<
    { value: string; label: string }[]
  >([]);
  const [manufacturers, setManufacturers] = useState<
    { value: string; label: string }[]
  >([]);

  useEffect(() => {
    // Tải dữ liệu cho các bộ lọc điều kiện
    const fetchFilterOptions = async () => {
      const [categoryRes, manuRes] = await Promise.all([
        supabase.from("products").select("category"),
        supabase.from("products").select("manufacturer"),
      ]);
      if (categoryRes.data) {
        const uniqueCategories = [
          ...new Set(
            categoryRes.data.map((item) => item.category).filter(Boolean)
          ),
        ];
        setCategories(uniqueCategories.map((c) => ({ value: c, label: c })));
      }
      if (manuRes.data) {
        const uniqueManufacturers = [
          ...new Set(
            manuRes.data.map((item) => item.manufacturer).filter(Boolean)
          ),
        ];
        setManufacturers(
          uniqueManufacturers.map((m) => ({ value: m, label: m }))
        );
      }
    };
    fetchFilterOptions();
  }, []);

  const isCreating = !params.id;

  const fetchVouchers = async (promoId: string) => {
    const { data: voucherData, error: voucherError } = await getPromotionDetail(
      promoId
    );
    if (voucherError) {
      notification.error({
        message: "Lỗi tải danh sách voucher",
        description: voucherError.message,
      });
    } else {
      setVouchers(voucherData || []);
    }
  };

  useEffect(() => {
    if (!isCreating) {
      const fetchPromotionDetail = async () => {
        setLoading(true);
        const { data: promoData, error: promoError } = await getPromotionDetail(
          params.id!
        );

        if (promoData) {
          setPromotion(promoData);
          form.setFieldsValue({
            ...promoData,
            dateRange: [dayjs(promoData.start_date), dayjs(promoData.end_date)],
          });
          fetchVouchers(promoData.id); // Tải voucher sau khi có thông tin khuyến mại
        } else if (promoError) {
          notification.error({
            message: "Lỗi tải dữ liệu khuyến mại",
            description: promoError.message,
          });
        }
        setLoading(false);
      };
      fetchPromotionDetail();
    }
  }, [params.id, isCreating]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      const record = {
        name: values.name,
        type: values.type,
        value: values.value,
        start_date: values.dateRange[0].toISOString(),
        end_date: values.dateRange[1].toISOString(),
        is_active: values.is_active ?? true,
        conditions: {
          min_order_value: values.min_order_value, // Giảm giá theo giá trị đơn hàng
          manufacturers: values.manufacturers,
          product_categories: values.product_categories,
          // Sẽ thêm các điều kiện khác như Mua X Tặng Y ở đây
        },
      };

      if (isCreating) {
        const { data, error } = await createPromotion(record);
        if (error) throw error;
        notification?.success({ message: "Tạo khuyến mại thành công!" });
        navigate(`/promotions/${data.id}`); // Chuyển đến trang sửa để thêm voucher
      } else {
        const { error } = await updatePromotion(params.id!, record);
        if (error) throw error;
        notification?.success({ message: "Cập nhật thành công!" });
      }
    } catch (error: unknown) {
      notification.error({
        message: "Lưu thất bại",
        description: getErrorMessage(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVoucherFinish = async (values: any) => {
    try {
      const { error } = await createVoucher({
        ...values,
        promotion_id: params.id,
      });
      if (error) throw error;
      notification?.success({ message: "Tạo mã giảm giá thành công!" });
      fetchVouchers(params.id!); // Tải lại danh sách voucher
      setIsVoucherModalOpen(false);
      voucherForm.resetFields();
    } catch (error: unknown) {
      notification.error({
        message: "Tạo mã thất bại",
        description: getErrorMessage(error),
      });
    }
  };

  const voucherColumns = [
    { title: "Mã Code", dataIndex: "code", key: "code" },
    { title: "Giới hạn", dataIndex: "usage_limit", key: "usage_limit" },
    { title: "Đã dùng", dataIndex: "times_used", key: "times_used" },
    {
      title: "Trạng thái",
      key: "is_active",
      render: (isActive: boolean) => (
        <Tag color={isActive ? "green" : "red"}>
          {isActive ? "Hoạt động" : "Vô hiệu"}
        </Tag>
      ),
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Row justify="space-between" align="middle">
        <Col>
          <Space>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate("/promotions")}
            />
            <Title level={2} style={{ marginBottom: 0 }}>
              {isCreating
                ? "Tạo Khuyến mại mới"
                : promotion?.name || "Đang tải..."}
            </Title>
          </Space>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={loading}
            onClick={handleSave}
          >
            Lưu thay đổi
          </Button>
        </Col>
      </Row>

      <Card
        title="1. Thông tin và Quy tắc Chương trình"
        loading={loading && !isCreating}
      >
        <Form form={form} layout="vertical" initialValues={{ is_active: true }}>
          <Form.Item
            name="name"
            label="Tên chương trình"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="type"
            label="Loại khuyến mại"
            rules={[{ required: true }]}
          >
            <Select
              options={[
                { value: "percentage", label: "Phần trăm (%)" },
                { value: "fixed_amount", label: "Số tiền cố định (VNĐ)" },
              ]}
            />
          </Form.Item>
          <Form.Item name="value" label="Giá trị" rules={[{ required: true }]}>
            <InputNumber
              style={{ width: "100%" }}
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
              }
              parser={(value) => value!.replace(/\./g, "")}
            />
          </Form.Item>
          <Form.Item
            name="dateRange"
            label="Thời gian hiệu lực"
            rules={[{ required: true }]}
          >
            <RangePicker style={{ width: "100%" }} />
          </Form.Item>

          <Divider>Phương thức Áp dụng</Divider>
          <Form.Item
            name="type"
            label="Loại khuyến mại"
            rules={[{ required: true }]}
          >
            <Select
              onChange={setPromotionType}
              options={[
                {
                  value: "percentage",
                  label: "Giảm giá theo Phần trăm (%) trên sản phẩm",
                },
                {
                  value: "fixed_amount",
                  label: "Giảm giá theo Số tiền cố định trên sản phẩm",
                },
                {
                  value: "order_discount",
                  label: "Giảm giá theo Tổng giá trị đơn hàng",
                },
                // { value: 'buy_x_get_y', label: 'Mua X Tặng Y' }, // Sẽ thêm sau
              ]}
            />
          </Form.Item>

          {/* Hiển thị các ô nhập liệu tương ứng với từng loại KM */}
          {promotionType === "percentage" && (
            <Form.Item
              name="value"
              label="Phần trăm giảm giá (%)"
              rules={[{ required: true }]}
            >
              <InputNumber style={{ width: "100%" }} min={0} max={100} />
            </Form.Item>
          )}
          {promotionType === "fixed_amount" && (
            <Form.Item
              name="value"
              label="Số tiền giảm giá (VNĐ)"
              rules={[{ required: true }]}
            >
              <InputNumber
                style={{ width: "100%" }}
                formatter={(value) =>
                  `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
                }
                parser={(value) => value!.replace(/\./g, "")}
              />
            </Form.Item>
          )}
          {promotionType === "order_discount" && (
            <>
              <Form.Item
                name="min_order_value"
                label="Giá trị đơn hàng tối thiểu (VNĐ)"
                rules={[{ required: true }]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
                  }
                  parser={(value) => value!.replace(/\./g, "")}
                />
              </Form.Item>
              <Form.Item
                name="value"
                label="Số tiền giảm giá (VNĐ)"
                rules={[{ required: true }]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
                  }
                  parser={(value) => value!.replace(/\./g, "")}
                />
              </Form.Item>
            </>
          )}
          <Divider>Điều kiện Áp dụng (Bỏ trống nếu áp dụng cho tất cả)</Divider>
          <Form.Item name="manufacturers" label="Áp dụng cho Hãng sản xuất">
            <Select mode="multiple" allowClear options={manufacturers} />
          </Form.Item>
          <Form.Item
            name="product_categories"
            label="Áp dụng cho Phân loại Sản phẩm"
          >
            <Select mode="multiple" allowClear options={categories} />
          </Form.Item>
          <Form.Item name="is_active" label="Kích hoạt" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Card>

      {!isCreating && (
        <Card
          title="2. Danh sách Mã Giảm Giá"
          extra={
            <Button
              icon={<PlusOutlined />}
              onClick={() => setIsVoucherModalOpen(true)}
            >
              Thêm Mã mới
            </Button>
          }
        >
          <Table
            columns={voucherColumns}
            dataSource={vouchers}
            rowKey="id"
            loading={loading}
          />
        </Card>
      )}

      <Modal
        title="Tạo Mã Giảm Giá mới"
        open={isVoucherModalOpen}
        onCancel={() => setIsVoucherModalOpen(false)}
        onOk={() => voucherForm.submit()}
      >
        <Form
          form={voucherForm}
          layout="vertical"
          onFinish={handleVoucherFinish}
          style={{ paddingTop: 24 }}
          initialValues={{ is_active: true, usage_limit: 1 }}
        >
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
            <InputNumber style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="is_active" label="Kích hoạt" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
};

export default PromotionDetail;
