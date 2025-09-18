// src/features/products/components/ProductForm.tsx

import React, { useEffect, useState } from "react";
import {
  Modal,
  Form,
  Input,
  Row,
  Col,
  InputNumber,
  Select,
  Switch,
  Checkbox,
  Button,
  Typography,
  Divider,
  Spin,
  App,
  Steps, // <-- Nâng cấp: Dùng Steps thay cho Tabs
  Space,
} from "antd";
import {
  InfoCircleOutlined,
  DollarCircleOutlined,
  HomeOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import ImageUpload from "./ImageUpload";
import { supabase } from "../../../lib/supabaseClient";
import PdfUpload from "./PdfUpload";

const { Title } = Typography;

interface ProductFormProps {
  open: boolean;
  onClose: () => void;
  onFinish: (values: any) => void;
  loading: boolean;
  initialData?: any | null;
}

const ProductForm: React.FC<ProductFormProps> = ({
  open,
  onClose,
  onFinish,
  loading,
  initialData,
}) => {
  const [form] = Form.useForm();
  const { notification } = App.useApp();
  const [aiLoading, setAiLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0); // <-- Nâng cấp: State cho Stepper

  // State để lưu danh sách kho và nhà cung cấp
  const [suppliers, setSuppliers] = useState<
    { value: number; label: string }[]
  >([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loadingInitialData, setLoadingInitialData] = useState(false);

  // Lắng nghe giá trị đơn vị để cập nhật label động
  const wholesaleUnit = Form.useWatch("wholesaleUnit", form);
  const retailUnit = Form.useWatch("retailUnit", form);
  const conversionLabel = `Số lượng Quy đổi ${
    wholesaleUnit && retailUnit ? `(1 ${wholesaleUnit} = ? ${retailUnit})` : ""
  }`;

  // Tải dữ liệu cần thiết (kho, nhà cung cấp) mỗi khi modal được mở
  useEffect(() => {
    if (open) {
      setLoadingInitialData(true);
      const fetchInitialData = async () => {
        const warehousesPromise = supabase
          .from("warehouses")
          .select("id, name");
        const suppliersPromise = supabase.from("suppliers").select("id, name");

        const [warehousesRes, suppliersRes] = await Promise.all([
          warehousesPromise,
          suppliersPromise,
        ]);

        if (warehousesRes.data) setWarehouses(warehousesRes.data);
        if (suppliersRes.data) {
          setSuppliers(
            suppliersRes.data.map((s) => ({ value: s.id, label: s.name }))
          );
        }
        setLoadingInitialData(false);
      };
      fetchInitialData();
    }
  }, [open]);

  // Điền dữ liệu vào form khi sửa sản phẩm
  useEffect(() => {
    if (open && !loadingInitialData) {
      if (initialData) {
        const inventorySettingsForForm =
          initialData.inventory_data?.reduce((acc: any, inv: any) => {
            if (inv) {
              acc[inv.warehouse_id] = {
                min_stock: inv.min_stock,
                max_stock: inv.max_stock,
              };
            }
            return acc;
          }, {}) || {};

        const formData = {
          ...initialData,
          // Đảm bảo tags luôn là một mảng, kể cả khi nó null từ CSDL
          tags: initialData.tags || [],
          productType: initialData.product_type,
          isFixedAsset: initialData.is_fixed_asset,
          registrationNumber: initialData.registration_number,
          isChronic: initialData.is_chronic,
          wholesaleUnit: initialData.wholesale_unit,
          retailUnit: initialData.retail_unit,
          conversionRate: initialData.conversion_rate,
          invoicePrice: initialData.invoice_price,
          costPrice: initialData.cost_price,
          wholesaleProfit: initialData.wholesale_profit,
          retailProfit: initialData.retail_profit,
          wholesalePrice: initialData.wholesale_price,
          retailPrice: initialData.retail_price,
          hdsd_0_2: initialData.hdsd_0_2,
          hdsd_2_6: initialData.hdsd_2_6,
          hdsd_6_18: initialData.hdsd_6_18,
          hdsd_over_18: initialData.hdsd_over_18,
          inventory_settings: inventorySettingsForForm,
          supplier_id: initialData.supplier_id,
        };
        form.setFieldsValue(formData);
      } else {
        form.resetFields();
        setCurrentStep(0);
      }
    }
  }, [initialData, open, loadingInitialData, form]);
  // --- LOGIC XỬ LÝ ---

  const handleValuesChange = (changedValues: any, allValues: any) => {
    const { costPrice, wholesaleProfit, retailProfit, conversionRate } =
      allValues;
    const changedKey = Object.keys(changedValues)[0];

    if (
      ["costPrice", "wholesaleProfit"].includes(changedKey) &&
      costPrice !== undefined &&
      wholesaleProfit !== undefined
    ) {
      form.setFieldsValue({ wholesalePrice: costPrice + wholesaleProfit });
    }

    if (
      ["costPrice", "retailProfit", "conversionRate"].includes(changedKey) &&
      costPrice !== undefined &&
      retailProfit !== undefined &&
      conversionRate > 0
    ) {
      form.setFieldsValue({
        retailPrice: Math.round((costPrice + retailProfit) / conversionRate),
      });
    }
  };

  const handleExtractFromPdf = async (
    fileContent: string,
    mimeType: string
  ) => {
    setPdfLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "extract-from-pdf",
        {
          body: { fileContent, mimeType },
        }
      );

      if (error) throw error;

      form.setFieldsValue({
        name: data.name,
        registrationNumber: data.registrationNumber,
        category: data.category,
        packaging: data.packaging,
        description: data.description,
        route: data.route,
        hdsd_0_2: data.hdsd_0_2,
        hdsd_2_6: data.hdsd_2_6,
        hdsd_6_18: data.hdsd_6_18,
        hdsd_over_18: data.hdsd_over_18,
        disease: data.disease,
        isChronic: data.isChronic,
        wholesaleUnit: data.wholesaleUnit,
        retailUnit: data.retailUnit,
        conversionRate: data.conversionRate,
        manufacturer: data.manufacturer,
        distributor: data.distributor,
        tags: data.tags,
      });
      notification.success({
        message: "Thành công!",
        description: "Đã trích xuất và điền dữ liệu từ PDF.",
      });
    } catch (error: any) {
      notification.error({
        message: "Lỗi Trích xuất PDF",
        description: error.message,
      });
    } finally {
      setPdfLoading(false);
    }
  };

  const handleEnrichData = async () => {
    const productName = form.getFieldValue("name");
    if (!productName) {
      notification.warning({
        message: "Thiếu thông tin",
        description: "Vui lòng nhập Tên sản phẩm trước.",
      });
      return;
    }
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "enrich-product-data",
        {
          body: { productName },
        }
      );
      if (error) throw error;
      form.setFieldsValue({
        description: data.description,
        tags: data.tags,
        category: data.category,
      });
      notification.success({
        message: "Thành công!",
        description: "Dữ liệu đã được AI làm giàu.",
      });
    } catch (error: any) {
      notification.error({ message: "Lỗi AI", description: error.message });
    } finally {
      setAiLoading(false);
    }
  };

  const handleOk = () => {
    form
      .validateFields()
      .then((values) => {
        onFinish(values);
      })
      .catch(() => {
        // Tự động chuyển đến tab có lỗi
        const fields = form.getFieldsError();
        const firstErrorField = fields.find((field) => field.errors.length > 0);
        if (firstErrorField) {
          // Đây là nơi logic chuyển tab/step sẽ được thêm vào nếu cần
          notification.error({
            message: "Vui lòng kiểm tra lại các trường bị lỗi.",
          });
        }
      });
  };

  // --- NỘI DUNG CHO TỪNG BƯỚC (STEP) ---

  const steps = [
    {
      title: "Thông tin chung",
      icon: <InfoCircleOutlined />,
      content: (
        <Spin spinning={loadingInitialData}>
          <Row gutter={24}>
            <Col xs={24} md={8}>
              <Form.Item name="image_url" label="Ảnh sản phẩm">
                <ImageUpload />
              </Form.Item>
              <Form.Item name="image_url">
                <Input placeholder="Hoặc dán URL ảnh" />
              </Form.Item>
              <Form.Item
                name="productType"
                label="Loại hàng"
                initialValue="goods"
              >
                <Select
                  options={[
                    { value: "goods", label: "Hàng hóa" },
                    { value: "service", label: "Dịch vụ" },
                  ]}
                />
              </Form.Item>
              <Form.Item
                name="isFixedAsset"
                label="Là sản phẩm cố định"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24} md={16}>
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="name"
                    label="Tên sản phẩm"
                    rules={[{ required: true }]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="supplier_id" label="Nhà Cung Cấp chính">
                    <Select
                      showSearch
                      placeholder="Chọn nhà cung cấp"
                      options={suppliers}
                      filterOption={(input, option) =>
                        (option?.label ?? "")
                          .toLowerCase()
                          .includes(input.toLowerCase())
                      }
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="sku"
                    label="Mã SKU"
                    rules={[{ required: true }]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="barcode" label="Mã vạch">
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="category" label="Phân loại SP">
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="tags" label="Tags">
                    <Select mode="tags" />
                  </Form.Item>
                </Col>
              </Row>
            </Col>
          </Row>
          <Col span={24}>
            <Form.Item name="description" label="Mô tả & HDSD chung">
              <Input.TextArea rows={4} />
            </Form.Item>
          </Col>

          <Col span={24}>
            <Divider>Hướng dẫn sử dụng chi tiết theo độ tuổi</Divider>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="hdsd_0_2" label="Từ 0-2 tuổi">
              <Input.TextArea rows={2} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="hdsd_2_6" label="Từ 2-6 tuổi">
              <Input.TextArea rows={2} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="hdsd_6_18" label="Từ 6-18 tuổi">
              <Input.TextArea rows={2} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="hdsd_over_18" label="Trên 18 tuổi">
              <Input.TextArea rows={2} />
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item name="disease" label="Bệnh áp dụng (Gợi ý từ AI)">
              <Input />
            </Form.Item>
            <Form.Item name="isChronic" valuePropName="checked">
              <Checkbox>Là bệnh mãn tính</Checkbox>
            </Form.Item>
          </Col>
        </Spin>
      ),
    },
    {
      title: "Giá & Kinh doanh",
      icon: <DollarCircleOutlined />,
      content: (
        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Form.Item name="wholesaleUnit" label="Đơn vị Bán Buôn">
              <Input placeholder="ví dụ: Thùng" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item name="retailUnit" label="Đơn vị Bán lẻ">
              <Input placeholder="ví dụ: Hộp" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item name="conversionRate" label={conversionLabel}>
              <InputNumber style={{ width: "100%" }} min={1} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="invoicePrice" label="Giá nhập trên Hóa Đơn">
              <InputNumber
                style={{ width: "100%" }}
                addonAfter="VNĐ"
                formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
                parser={(v) => Number(v!.replace(/\./g, ""))}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="costPrice"
              label="Giá vốn thực tế"
              rules={[{ required: true }]}
            >
              <InputNumber
                style={{ width: "100%" }}
                addonAfter="VNĐ"
                formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
                parser={(v) => Number(v!.replace(/\./g, ""))}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="wholesaleProfit" label="Lãi bán buôn">
              <InputNumber
                style={{ width: "100%" }}
                addonAfter="VNĐ"
                formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
                parser={(v) => Number(v!.replace(/\./g, ""))}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="retailProfit" label="Lãi bán lẻ">
              <InputNumber
                style={{ width: "100%" }}
                addonAfter="VNĐ"
                formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
                parser={(v) => Number(v!.replace(/\./g, ""))}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="wholesalePrice" label="Giá bán buôn (Tự tính)">
              <InputNumber
                readOnly
                style={{ width: "100%", backgroundColor: "#f0f2f5" }}
                addonAfter="VNĐ"
                formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
                parser={(v) => Number(v!.replace(/\./g, ""))}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="retailPrice" label="Giá bán lẻ (Tự tính)">
              <InputNumber
                readOnly
                style={{ width: "100%", backgroundColor: "#f0f2f5" }}
                addonAfter="VNĐ"
                formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
                parser={(v) => Number(v!.replace(/\./g, ""))}
              />
            </Form.Item>
          </Col>
        </Row>
      ),
    },
    {
      title: "Cài đặt Tồn kho",
      icon: <HomeOutlined />,
      content: loadingInitialData ? (
        <Spin />
      ) : (
        <Row gutter={[16, 24]}>
          {warehouses.map((wh) => (
            <Col xs={24} sm={12} key={wh.id}>
              <Title level={5}>{wh.name}</Title>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name={["inventory_settings", wh.id, "min_stock"]}
                    label="Tồn tối thiểu"
                  >
                    <InputNumber style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name={["inventory_settings", wh.id, "max_stock"]}
                    label="Tồn tối đa"
                  >
                    <InputNumber style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
              </Row>
            </Col>
          ))}
        </Row>
      ),
    },
  ];
  // --- GIAO DIỆN MODAL VÀ CÁC NÚT ĐIỀU HƯỚNG ---

  return (
    <Modal
      open={open}
      title={initialData ? "Cập nhật sản phẩm" : "Thêm sản phẩm mới"}
      width={1000}
      onCancel={onClose}
      destroyOnHidden
      // Nâng cấp: Tùy chỉnh footer để chứa các nút điều hướng stepper
      footer={
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          {/* Nút Hủy và Quay lại bên trái */}
          <Space>
            <Button onClick={onClose}>Hủy</Button>
            {currentStep > 0 && (
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => setCurrentStep(currentStep - 1)}
              >
                Quay lại
              </Button>
            )}
          </Space>

          {/* Nút Tiếp và Cập nhật/Tạo mới bên phải */}
          <Space>
            {currentStep < steps.length - 1 && (
              <Button
                type="default"
                onClick={() => setCurrentStep(currentStep + 1)}
              >
                Tiếp theo <ArrowRightOutlined />
              </Button>
            )}
            {/* Nút Cập nhật/Tạo mới luôn hiển thị */}
            <Button type="primary" loading={loading} onClick={handleOk}>
              {initialData ? "Cập nhật" : "Tạo mới sản phẩm"}
            </Button>
          </Space>
        </div>
      }
    >
      <Form
        form={form}
        layout="vertical"
        name="product_form_detailed"
        onValuesChange={handleValuesChange}
      >
        <Space style={{ marginBottom: 24 }}>
          <Button
            type="primary"
            ghost
            onClick={handleEnrichData}
            loading={aiLoading}
          >
            Gợi ý dữ liệu từ Tên [AI]
          </Button>
          <PdfUpload onFileReady={handleExtractFromPdf} loading={pdfLoading} />
        </Space>

        {/* Nâng cấp: Hiển thị Stepper */}
        <Steps
          current={currentStep}
          items={steps}
          style={{ marginBottom: 24 }}
        />

        {/* Hiển thị nội dung của step hiện tại */}
        <div>{steps[currentStep].content}</div>
      </Form>
    </Modal>
  );
};

export default ProductForm;
