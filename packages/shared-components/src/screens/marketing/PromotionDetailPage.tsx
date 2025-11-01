import React, { useState, useEffect } from "react";
import {
  Button,
  App,
  Form,
  Input,
  Select,
  InputNumber,
  DatePicker,
  Switch,
  Card,
  Row,
  Col,
} from "antd";
import { SaveOutlined, HomeOutlined, GiftOutlined } from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import PageLayout from "../../components/PageLayout";
import {
  createPromotion,
  getPromotionDetail,
  supabase,
  updatePromotion,
} from "@nam-viet-erp/services";
// Helper function to safely get error message
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    return (error as any).message;
  }

  return "An unknown error occurred";
};

const { RangePicker } = DatePicker;

const PromotionDetail: React.FC = () => {
  const { notification } = App.useApp();
  const [form] = Form.useForm();
  const params = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [promotion, setPromotion] = useState<any | null>(null);
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
            categoryRes.data.map((item) => item.category).filter(Boolean),
          ),
        ];
        setCategories(uniqueCategories.map((c) => ({ value: c, label: c })));
      }
      if (manuRes.data) {
        const uniqueManufacturers = [
          ...new Set(
            manuRes.data.map((item) => item.manufacturer).filter(Boolean),
          ),
        ];
        setManufacturers(
          uniqueManufacturers.map((m) => ({ value: m, label: m })),
        );
      }
    };
    fetchFilterOptions();
  }, []);

  const isCreating = !params.id;

  useEffect(() => {
    if (!isCreating) {
      const fetchPromotionDetail = async () => {
        setLoading(true);
        const promoData: IPromotion | undefined = await getPromotionDetail(
          params.id!,
        );

        if (promoData) {
          setPromotion(promoData);
          setPromotionType(promoData.type || null);
          form.setFieldsValue({
            ...promoData,
            dateRange: [dayjs(promoData.start_date), dayjs(promoData.end_date)],
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
      const record: any = {
        name: values.name,
        type: values.type,
        value: values.value,
        start_date: values.dateRange[0].toISOString(),
        end_date: values.dateRange[1].toISOString(),
        is_active: values.is_active ?? true,
        code: values.code || null, // Add code field
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
      const errorMsg = getErrorMessage(error);
      // Check if error is about duplicate code
      const isDuplicateCode =
        errorMsg.includes("unique") || errorMsg.includes("duplicate");
      notification.error({
        message: isDuplicateCode ? "Mã khuyến mãi đã tồn tại" : "Lưu thất bại",
        description: isDuplicateCode
          ? "Vui lòng chọn mã khuyến mãi khác. Mã khuyến mãi phải là duy nhất."
          : errorMsg,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout
      title={
        isCreating ? "Tạo Khuyến mại mới" : promotion?.name || "Đang tải..."
      }
      breadcrumbs={[
        {
          title: "Trang chủ",
          href: "/",
          icon: <HomeOutlined />,
        },
        {
          title: "Khuyến mại",
          href: "/promotions",
          icon: <GiftOutlined />,
        },
        {
          title: isCreating ? "Tạo mới" : "Chi tiết",
        },
      ]}
      showBackButton={true}
      onBack={() => navigate("/promotions")}
      extra={
        <Button
          type="primary"
          icon={<SaveOutlined />}
          loading={loading}
          onClick={handleSave}
          size="large"
        >
          Lưu thay đổi
        </Button>
      }
    >
      <Form form={form} layout="vertical" initialValues={{ is_active: true }}>
        <Row gutter={16}>
          {/* Cột 1: Thông tin */}
          <Col xs={24} lg={12}>
            <Card
              title="Thông tin chương trình"
              loading={loading && !isCreating}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="name"
                    label="Tên chương trình"
                    rules={[{ required: true }]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="code"
                    label="Mã khuyến mãi"
                    help="Ví dụ: TEST10, GIAM20K"
                  >
                    <Input placeholder="Nhập mã (tùy chọn)" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="type"
                    label="Loại khuyến mại"
                    rules={[{ required: true }]}
                  >
                    <Select
                      onChange={setPromotionType}
                      options={[
                        { value: "percentage", label: "Phần trăm (%)" },
                        { value: "fixed_amount", label: "Số tiền (VNĐ)" },
                        {
                          value: "order_discount",
                          label: "Giảm theo đơn hàng",
                        },
                      ]}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  {promotionType === "percentage" && (
                    <Form.Item
                      name="value"
                      label="Giá trị giảm (%)"
                      rules={[{ required: true }]}
                    >
                      <InputNumber
                        style={{ width: "100%" }}
                        min={0}
                        max={100}
                        suffix="%"
                      />
                    </Form.Item>
                  )}
                  {(promotionType === "fixed_amount" ||
                    promotionType === "order_discount") && (
                    <Form.Item
                      name="value"
                      label="Giá trị giảm (VNĐ)"
                      rules={[{ required: true }]}
                    >
                      <InputNumber
                        style={{ width: "100%" }}
                        formatter={(value) =>
                          `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
                        }
                        parser={(value) => value!.replace(/\./g, "")}
                        suffix="đ"
                      />
                    </Form.Item>
                  )}
                </Col>
              </Row>

              {promotionType === "order_discount" && (
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="min_order_value"
                      label="Đơn hàng tối thiểu"
                      rules={[{ required: true }]}
                    >
                      <InputNumber
                        style={{ width: "100%" }}
                        formatter={(value) =>
                          `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
                        }
                        parser={(value) => value!.replace(/\./g, "")}
                        suffix="đ"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="is_active"
                      label="Kích hoạt"
                      valuePropName="checked"
                    >
                      <Switch />
                    </Form.Item>
                  </Col>
                </Row>
              )}

              {promotionType !== "order_discount" && (
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="is_active"
                      label="Kích hoạt"
                      valuePropName="checked"
                    >
                      <Switch />
                    </Form.Item>
                  </Col>
                </Row>
              )}

              <Form.Item
                name="dateRange"
                label="Thời gian hiệu lực"
                rules={[{ required: true }]}
              >
                <RangePicker style={{ width: "100%" }} />
              </Form.Item>
            </Card>
          </Col>

          {/* Cột 2: Điều kiện áp dụng */}
          <Col xs={24} lg={12}>
            <Card title="Điều kiện áp dụng" loading={loading && !isCreating}>
              <Form.Item
                name="manufacturers"
                label="Áp dụng cho Hãng sản xuất"
                help="Bỏ trống để áp dụng cho tất cả"
              >
                <Select mode="multiple" allowClear options={manufacturers} />
              </Form.Item>

              <Form.Item
                name="product_categories"
                label="Áp dụng cho Phân loại Sản phẩm"
                help="Bỏ trống để áp dụng cho tất cả"
              >
                <Select mode="multiple" allowClear options={categories} />
              </Form.Item>
            </Card>
          </Col>
        </Row>
      </Form>
    </PageLayout>
  );
};

export default PromotionDetail;
