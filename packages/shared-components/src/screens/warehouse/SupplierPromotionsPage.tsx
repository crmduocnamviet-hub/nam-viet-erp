import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Table,
  Button,
  Space,
  Tag,
  Typography,
  Card,
  Modal,
  Form,
  Row,
  Col,
  notification,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Switch,
  Tooltip,
  Badge,
  Divider,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  ArrowLeftOutlined,
  HomeOutlined,
  ShopOutlined,
  GiftOutlined,
  PercentageOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import PageLayout from "../../components/PageLayout";
import {
  getSupplierPromotions,
  createSupplierPromotion,
  updateSupplierPromotion,
  deleteSupplierPromotion,
  toggleSupplierPromotionStatus,
  getSupplierById,
  type ISupplierPromotion,
  type PromotionType,
} from "@nam-viet-erp/services";

const { Text, Title } = Typography;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

const SupplierPromotionsPage: React.FC = () => {
  const { supplierId } = useParams<{ supplierId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [promotions, setPromotions] = useState<ISupplierPromotion[]>([]);
  const [supplier, setSupplier] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPromotion, setEditingPromotion] =
    useState<ISupplierPromotion | null>(null);
  const [form] = Form.useForm();

  // Fetch supplier info
  useEffect(() => {
    if (supplierId) {
      fetchSupplier();
    }
  }, [supplierId]);

  const fetchSupplier = async () => {
    try {
      const { data, error } = await getSupplierById(Number(supplierId));
      if (error) throw error;
      setSupplier(data);
    } catch (error: any) {
      notification.error({
        message: "Lỗi",
        description: error.message || "Không thể tải thông tin nhà cung cấp",
      });
    }
  };

  // Fetch promotions
  const fetchPromotions = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await getSupplierPromotions({
        supplierId: supplierId ? Number(supplierId) : undefined,
      });
      if (error) throw error;
      setPromotions(data || []);
    } catch (error: any) {
      notification.error({
        message: "Lỗi",
        description: error.message || "Không thể tải danh sách chương trình",
      });
    } finally {
      setLoading(false);
    }
  }, [supplierId]);

  useEffect(() => {
    fetchPromotions();
  }, [fetchPromotions]);

  const getPromotionTypeLabel = (type: PromotionType) => {
    const labels = {
      buy_x_get_y: "Mua X Tặng Y",
      percentage_discount: "Giảm giá theo %",
      fixed_discount: "Giảm giá cố định",
      post_payment_discount: "Chiết khấu trả sau",
    };
    return labels[type] || type;
  };

  const getPromotionTypeColor = (type: PromotionType) => {
    const colors = {
      buy_x_get_y: "magenta",
      percentage_discount: "blue",
      fixed_discount: "green",
      post_payment_discount: "orange",
    };
    return colors[type] || "default";
  };

  const formatPromotionConfig = (promotion: ISupplierPromotion) => {
    const { promotion_type, promotion_config } = promotion;

    switch (promotion_type) {
      case "buy_x_get_y":
        return `Mua ${(promotion_config as any).buy_quantity} tặng ${(promotion_config as any).get_quantity}`;
      case "percentage_discount":
        return `Giảm ${(promotion_config as any).discount_percent}%`;
      case "fixed_discount":
        return `Giảm ${(promotion_config as any).discount_amount?.toLocaleString()}đ`;
      case "post_payment_discount":
        return `Giảm ${(promotion_config as any).discount_percent}% (thanh toán trong ${(promotion_config as any).payment_days} ngày)`;
      default:
        return "";
    }
  };

  const handleCreate = () => {
    setEditingPromotion(null);
    form.resetFields();
    form.setFieldsValue({
      supplier_id: supplierId ? Number(supplierId) : undefined,
      promotion_type: "buy_x_get_y",
      applies_to_all_products: true,
      is_active: true,
      min_order_quantity: 0,
      min_order_value: 0,
      priority: 0,
    });
    setModalVisible(true);
  };

  const handleEdit = (promotion: ISupplierPromotion) => {
    setEditingPromotion(promotion);

    // Parse config based on promotion type
    const config = promotion.promotion_config as any;

    form.setFieldsValue({
      ...promotion,
      date_range: [
        dayjs(promotion.start_date),
        promotion.end_date ? dayjs(promotion.end_date) : null,
      ],
      // Spread config values
      ...config,
    });

    setModalVisible(true);
  };

  const handleDelete = (promotion: ISupplierPromotion) => {
    Modal.confirm({
      title: "Xác nhận xóa",
      content: `Bạn có chắc chắn muốn xóa chương trình "${promotion.name}"?`,
      onOk: async () => {
        try {
          const { error } = await deleteSupplierPromotion(promotion.id);
          if (error) throw error;
          notification.success({
            message: "Thành công",
            description: "Đã xóa chương trình",
          });
          fetchPromotions();
        } catch (error: any) {
          notification.error({
            message: "Lỗi",
            description: error.message || "Không thể xóa chương trình",
          });
        }
      },
    });
  };

  const handleToggleStatus = async (promotion: ISupplierPromotion) => {
    try {
      const { error } = await toggleSupplierPromotionStatus(
        promotion.id,
        !promotion.is_active,
      );
      if (error) throw error;
      notification.success({
        message: "Thành công",
        description: `Đã ${!promotion.is_active ? "kích hoạt" : "tắt"} chương trình`,
      });
      fetchPromotions();
    } catch (error: any) {
      notification.error({
        message: "Lỗi",
        description: error.message || "Không thể cập nhật trạng thái",
      });
    }
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const [startDate, endDate] = values.date_range || [];

      // Build promotion_config based on type
      let promotion_config: any = {};

      switch (values.promotion_type) {
        case "buy_x_get_y":
          promotion_config = {
            buy_quantity: values.buy_quantity,
            get_quantity: values.get_quantity,
          };
          break;
        case "percentage_discount":
          promotion_config = {
            discount_percent: values.discount_percent,
          };
          break;
        case "fixed_discount":
          promotion_config = {
            discount_amount: values.discount_amount,
            min_order_value: values.min_order_value_config || 0,
          };
          break;
        case "post_payment_discount":
          promotion_config = {
            discount_percent: values.post_discount_percent,
            payment_days: values.payment_days,
          };
          break;
      }

      const promotionData = {
        supplier_id: values.supplier_id || Number(supplierId),
        name: values.name,
        description: values.description,
        promotion_type: values.promotion_type,
        promotion_config,
        start_date: startDate?.format("YYYY-MM-DD"),
        end_date: endDate?.format("YYYY-MM-DD") || null,
        applies_to_all_products: values.applies_to_all_products,
        product_ids: values.product_ids || null,
        min_order_quantity: values.min_order_quantity || 0,
        min_order_value: values.min_order_value || 0,
        is_active: values.is_active,
        priority: values.priority || 0,
        internal_notes: values.internal_notes,
      };

      if (editingPromotion) {
        const { error } = await updateSupplierPromotion(
          editingPromotion.id,
          promotionData,
        );
        if (error) throw error;
        notification.success({
          message: "Thành công",
          description: "Đã cập nhật chương trình",
        });
      } else {
        const { error } = await createSupplierPromotion(promotionData as any);
        if (error) throw error;
        notification.success({
          message: "Thành công",
          description: "Đã tạo chương trình mới",
        });
      }

      setModalVisible(false);
      form.resetFields();
      fetchPromotions();
    } catch (error: any) {
      notification.error({
        message: "Lỗi",
        description: error.message || "Không thể lưu chương trình",
      });
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "Tên Chương Trình",
      dataIndex: "name",
      key: "name",
      width: 200,
      render: (text: string, record: ISupplierPromotion) => (
        <Space direction="vertical" size="small">
          <Text strong>{text}</Text>
          {record.description && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.description}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: "Loại",
      dataIndex: "promotion_type",
      key: "promotion_type",
      width: 150,
      render: (type: PromotionType) => (
        <Tag color={getPromotionTypeColor(type)}>
          {getPromotionTypeLabel(type)}
        </Tag>
      ),
    },
    {
      title: "Chi Tiết",
      key: "config",
      width: 200,
      render: (_: any, record: ISupplierPromotion) => (
        <Text strong style={{ color: "#52c41a" }}>
          {formatPromotionConfig(record)}
        </Text>
      ),
    },
    {
      title: "Thời Gian",
      key: "period",
      width: 180,
      render: (_: any, record: ISupplierPromotion) => (
        <Space direction="vertical" size="small">
          <Text style={{ fontSize: 12 }}>
            Từ: {dayjs(record.start_date).format("DD/MM/YYYY")}
          </Text>
          {record.end_date && (
            <Text style={{ fontSize: 12 }}>
              Đến: {dayjs(record.end_date).format("DD/MM/YYYY")}
            </Text>
          )}
          {!record.end_date && <Tag color="blue">Không giới hạn</Tag>}
        </Space>
      ),
    },
    {
      title: "Áp Dụng",
      key: "applies_to",
      width: 120,
      align: "center" as const,
      render: (_: any, record: ISupplierPromotion) =>
        record.applies_to_all_products ? (
          <Tag color="cyan">Tất cả SP</Tag>
        ) : (
          <Tag>Sản phẩm cụ thể</Tag>
        ),
    },
    {
      title: "Trạng Thái",
      dataIndex: "is_active",
      key: "is_active",
      width: 100,
      align: "center" as const,
      render: (active: boolean, record: ISupplierPromotion) => (
        <Switch
          checked={active}
          onChange={() => handleToggleStatus(record)}
          checkedChildren="ON"
          unCheckedChildren="OFF"
        />
      ),
    },
    {
      title: "Hành Động",
      key: "actions",
      width: 100,
      align: "center" as const,
      fixed: "right" as const,
      render: (_: any, record: ISupplierPromotion) => (
        <Space>
          <Tooltip title="Sửa">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(record);
              }}
            />
          </Tooltip>
          <Tooltip title="Xóa">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(record);
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Render promotion type specific fields
  const renderPromotionTypeFields = () => {
    const promotionType = Form.useWatch("promotion_type", form);

    switch (promotionType) {
      case "buy_x_get_y":
        return (
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="buy_quantity"
                label="Số Lượng Mua"
                rules={[{ required: true, message: "Vui lòng nhập số lượng" }]}
              >
                <InputNumber
                  min={1}
                  placeholder="Ví dụ: 10"
                  style={{ width: "100%" }}
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="get_quantity"
                label="Số Lượng Tặng"
                rules={[{ required: true, message: "Vui lòng nhập số lượng" }]}
              >
                <InputNumber
                  min={1}
                  placeholder="Ví dụ: 1"
                  style={{ width: "100%" }}
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>
        );

      case "percentage_discount":
        return (
          <Form.Item
            name="discount_percent"
            label="Phần Trăm Giảm Giá (%)"
            rules={[
              { required: true, message: "Vui lòng nhập phần trăm giảm giá" },
            ]}
          >
            <InputNumber
              min={0}
              max={100}
              placeholder="Ví dụ: 5"
              style={{ width: "100%" }}
              size="large"
              addonAfter="%"
            />
          </Form.Item>
        );

      case "fixed_discount":
        return (
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="discount_amount"
                label="Số Tiền Giảm (đ)"
                rules={[{ required: true, message: "Vui lòng nhập số tiền" }]}
              >
                <InputNumber
                  min={0}
                  placeholder="Ví dụ: 50000"
                  style={{ width: "100%" }}
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                  parser={(value) => Number(value!.replace(/\$\s?|(,*)/g, ""))}
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="min_order_value_config"
                label="Giá Trị Đơn Tối Thiểu"
              >
                <InputNumber
                  min={0}
                  placeholder="Ví dụ: 1000000"
                  style={{ width: "100%" }}
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                  parser={(value) => Number(value!.replace(/\$\s?|(,*)/g, ""))}
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>
        );

      case "post_payment_discount":
        return (
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="post_discount_percent"
                label="Phần Trăm Chiết Khấu (%)"
                rules={[{ required: true, message: "Vui lòng nhập phần trăm" }]}
              >
                <InputNumber
                  min={0}
                  max={100}
                  placeholder="Ví dụ: 5"
                  style={{ width: "100%" }}
                  size="large"
                  addonAfter="%"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="payment_days"
                label="Số Ngày Thanh Toán"
                rules={[{ required: true, message: "Vui lòng nhập số ngày" }]}
              >
                <InputNumber
                  min={1}
                  placeholder="Ví dụ: 30"
                  style={{ width: "100%" }}
                  size="large"
                  addonAfter="ngày"
                />
              </Form.Item>
            </Col>
          </Row>
        );

      default:
        return null;
    }
  };

  return (
    <PageLayout
      title={
        supplier
          ? `Chương Trình Khuyến Mại - ${supplier.name}`
          : "Chương Trình Khuyến Mại"
      }
      breadcrumbs={[
        {
          title: "Trang chủ",
          href: "/",
          icon: <HomeOutlined />,
        },
        {
          title: "Nhà Cung Cấp",
          href: "/warehouse/suppliers",
          icon: <ShopOutlined />,
        },
        ...(supplier
          ? [
              {
                title: supplier.name,
                href: `/warehouse/suppliers/${supplierId}`,
              },
            ]
          : []),
        {
          title: "Chương Trình Khuyến Mại",
        },
      ]}
      extra={
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
            size="large"
          ></Button>
        </Space>
      }
    >
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Space direction="vertical" size="small" style={{ width: "100%" }}>
              <Text type="secondary">Tổng Chương Trình</Text>
              <Title level={3} style={{ margin: 0 }}>
                {promotions.length}
              </Title>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Space direction="vertical" size="small" style={{ width: "100%" }}>
              <Text type="secondary">Đang Hoạt Động</Text>
              <Title level={3} style={{ margin: 0, color: "#52c41a" }}>
                {promotions.filter((p) => p.is_active).length}
              </Title>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Space direction="vertical" size="small" style={{ width: "100%" }}>
              <Text type="secondary">Đã Tắt</Text>
              <Title level={3} style={{ margin: 0, color: "#999" }}>
                {promotions.filter((p) => !p.is_active).length}
              </Title>
            </Space>
          </Card>
        </Col>
      </Row>

      <Card>
        <Table
          columns={columns}
          dataSource={promotions}
          loading={loading}
          rowKey="id"
          scroll={{ x: 1200 }}
          pagination={{
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} chương trình`,
          }}
        />
      </Card>

      <Modal
        title={
          editingPromotion
            ? "Sửa Chương Trình Khuyến Mại"
            : "Thêm Chương Trình Khuyến Mại"
        }
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={800}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Divider orientation="left">Thông Tin Cơ Bản</Divider>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Tên Chương Trình"
                rules={[{ required: true, message: "Vui lòng nhập tên" }]}
              >
                <Input placeholder="VD: Mua 10 tặng 1" size="large" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="promotion_type"
                label="Loại Chương Trình"
                rules={[{ required: true, message: "Vui lòng chọn loại" }]}
              >
                <Select size="large" placeholder="Chọn loại">
                  <Select.Option value="buy_x_get_y">
                    <Space>
                      <GiftOutlined />
                      Mua X Tặng Y
                    </Space>
                  </Select.Option>
                  <Select.Option value="percentage_discount">
                    <Space>
                      <PercentageOutlined />
                      Giảm giá theo %
                    </Space>
                  </Select.Option>
                  <Select.Option value="fixed_discount">
                    Giảm giá cố định
                  </Select.Option>
                  <Select.Option value="post_payment_discount">
                    Chiết khấu trả sau
                  </Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="Mô Tả">
            <TextArea rows={2} placeholder="Mô tả chương trình..." />
          </Form.Item>

          <Divider orientation="left">Chi Tiết Khuyến Mại</Divider>

          {renderPromotionTypeFields()}

          <Divider orientation="left">Thời Gian & Điều Kiện</Divider>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="date_range"
                label="Thời Gian Áp Dụng"
                rules={[{ required: true, message: "Vui lòng chọn thời gian" }]}
              >
                <RangePicker
                  style={{ width: "100%" }}
                  format="DD/MM/YYYY"
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="priority" label="Độ Ưu Tiên">
                <InputNumber
                  min={0}
                  placeholder="0 = thấp nhất"
                  style={{ width: "100%" }}
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="min_order_quantity"
                label="Số Lượng Đơn Hàng Tối Thiểu"
              >
                <InputNumber
                  min={0}
                  placeholder="0 = không giới hạn"
                  style={{ width: "100%" }}
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="min_order_value"
                label="Giá Trị Đơn Hàng Tối Thiểu (đ)"
              >
                <InputNumber
                  min={0}
                  placeholder="0 = không giới hạn"
                  style={{ width: "100%" }}
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                  parser={(value) => Number(value!.replace(/\$\s?|(,*)/g, ""))}
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="applies_to_all_products"
            label="Áp Dụng Cho"
            valuePropName="checked"
          >
            <Switch
              checkedChildren="Tất cả sản phẩm"
              unCheckedChildren="Sản phẩm cụ thể"
            />
          </Form.Item>

          <Form.Item name="internal_notes" label="Ghi Chú Nội Bộ">
            <TextArea rows={2} placeholder="Ghi chú cho nội bộ..." />
          </Form.Item>

          <Form.Item
            name="is_active"
            label="Trạng Thái"
            valuePropName="checked"
          >
            <Switch checkedChildren="Kích hoạt" unCheckedChildren="Tạm tắt" />
          </Form.Item>

          <Divider />

          <Form.Item>
            <Space style={{ width: "100%", justifyContent: "flex-end" }}>
              <Button onClick={() => setModalVisible(false)} size="large">
                Hủy
              </Button>
              <Button type="primary" htmlType="submit" size="large">
                {editingPromotion ? "Cập Nhật" : "Tạo Mới"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </PageLayout>
  );
};

export default SupplierPromotionsPage;
