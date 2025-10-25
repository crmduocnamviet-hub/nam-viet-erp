import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Form,
  Input,
  Button,
  Row,
  Col,
  Space,
  notification,
  Spin,
  Divider,
} from "antd";
import {
  SaveOutlined,
  ArrowLeftOutlined,
  HomeOutlined,
  ShopOutlined,
} from "@ant-design/icons";
import PageLayout from "../../components/PageLayout";
import {
  getSupplierById,
  createSupplier,
  updateSupplier,
} from "@nam-viet-erp/services";

const SupplierFormPage: React.FC = () => {
  const { supplierId } = useParams<{ supplierId: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [supplier, setSupplier] = useState<any>(null);

  const isEditing = !!supplierId && supplierId !== "new";

  // Fetch supplier data if editing
  useEffect(() => {
    if (isEditing) {
      fetchSupplier();
    }
  }, [supplierId]);

  const fetchSupplier = async () => {
    setLoading(true);
    try {
      const { data, error } = await getSupplierById(Number(supplierId));
      if (error) throw error;
      if (data) {
        setSupplier(data);
        form.setFieldsValue(data);
      }
    } catch (error: any) {
      notification.error({
        message: "Lỗi",
        description: error.message || "Không thể tải thông tin nhà cung cấp",
      });
      navigate("/warehouse/suppliers");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    setSaving(true);
    try {
      if (isEditing) {
        const { error } = await updateSupplier(Number(supplierId), values);
        if (error) throw error;
        notification.success({
          message: "Thành công",
          description: "Đã cập nhật thông tin nhà cung cấp",
        });
      } else {
        const { error } = await createSupplier({
          ...values,
          is_active: true,
        });
        if (error) throw error;
        notification.success({
          message: "Thành công",
          description: "Đã thêm nhà cung cấp mới",
        });
      }
      navigate("/warehouse/suppliers");
    } catch (error: any) {
      notification.error({
        message: "Lỗi",
        description: error.message || "Không thể lưu thông tin nhà cung cấp",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageLayout title={isEditing ? "Sửa Nhà Cung Cấp" : "Thêm Nhà Cung Cấp"}>
        <div style={{ textAlign: "center", padding: "40px" }}>
          <Spin size="large" tip="Đang tải thông tin..." />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title={isEditing ? "Sửa Nhà Cung Cấp" : "Thêm Nhà Cung Cấp"}
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
        {
          title: isEditing ? "Sửa Nhà Cung Cấp" : "Thêm Nhà Cung Cấp",
        },
      ]}
      extra={
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/warehouse/suppliers")}
          size="large"
        >
          Quay lại
        </Button>
      }
    >
      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            name: "",
            tax_code: "",
            contact_person: "",
            phone: "",
            email: "",
            address: "",
            payment_terms: "",
          }}
        >
          <Divider orientation="left">Thông Tin Cơ Bản</Divider>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="name"
                label="Tên Nhà Cung Cấp"
                rules={[
                  { required: true, message: "Vui lòng nhập tên nhà cung cấp" },
                ]}
              >
                <Input placeholder="Công ty ABC" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="tax_code" label="Mã Số Thuế">
                <Input placeholder="0123456789" size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">Thông Tin Liên Hệ</Divider>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="contact_person" label="Người Liên Hệ">
                <Input placeholder="Nguyễn Văn A" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="phone"
                label="Số Điện Thoại"
                rules={[
                  {
                    pattern: /^[0-9]{10,11}$/,
                    message: "Số điện thoại không hợp lệ",
                  },
                ]}
              >
                <Input placeholder="0901234567" size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  {
                    type: "email",
                    message: "Email không hợp lệ",
                  },
                ]}
              >
                <Input placeholder="contact@example.com" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="payment_terms" label="Điều Khoản Thanh Toán">
                <Input
                  placeholder="VD: Thanh toán trong 30 ngày"
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="address" label="Địa Chỉ">
            <Input.TextArea
              rows={4}
              placeholder="Số nhà, đường, phường, quận, thành phố"
              size="large"
            />
          </Form.Item>

          <Divider />

          <Form.Item>
            <Space style={{ width: "100%", justifyContent: "flex-end" }}>
              <Button
                onClick={() => navigate("/warehouse/suppliers")}
                size="large"
              >
                Hủy
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={saving}
                size="large"
              >
                {isEditing ? "Cập Nhật" : "Tạo Mới"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </PageLayout>
  );
};

export default SupplierFormPage;
