import React, { useEffect, useState } from "react";
import {
  Form,
  Input,
  Tabs,
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
} from "antd"; // <-- Đã thêm 'Typography' vào đây
import type { TabsProps } from "antd";
import {
  InfoCircleOutlined,
  DollarCircleOutlined,
  HomeOutlined,
} from "@ant-design/icons";
import ImageUpload from "./ImageUpload";
import {
  enrichProductData,
  extractFromPdf,
  getWarehouse,
} from "@nam-viet-erp/services";
import PdfUpload from "./PdfUpload";
import { getErrorMessage } from "../utils";

const { Title } = Typography; // <-- Khai báo Title để sử dụng

interface ProductFormProps {
  onClose: () => void;
  onFinish: (values: any) => void;
  loading: boolean;
  initialData?: any | null;
}

const ProductForm: React.FC<ProductFormProps> = ({
  onClose,
  onFinish,
  loading,
  initialData,
}) => {
  const [form] = Form.useForm();
  // HÀM MỚI: Xử lý logic tính toán
  const handleValuesChange = (changedValues: any, allValues: any) => {
    const { costPrice, wholesaleProfit, retailProfit, conversionRate } =
      allValues;
    const changedKey = Object.keys(changedValues)[0];

    // Chỉ tính Giá Bán Buôn khi người dùng thay đổi Giá Vốn hoặc Lãi Bán Buôn
    if (
      ["costPrice", "wholesaleProfit"].includes(changedKey) &&
      costPrice &&
      wholesaleProfit
    ) {
      const newWholesalePrice = costPrice + wholesaleProfit;
      form.setFieldsValue({ wholesalePrice: newWholesalePrice });
    }

    // Chỉ tính Giá Bán Lẻ khi người dùng thay đổi các trường liên quan
    if (
      ["costPrice", "retailProfit", "conversionRate"].includes(changedKey) &&
      costPrice &&
      retailProfit &&
      conversionRate > 0
    ) {
      const newRetailPrice = (costPrice + retailProfit) / conversionRate;
      form.setFieldsValue({ retailPrice: Math.round(newRetailPrice) }); // Làm tròn để có số đẹp
    }
  };
  const { notification } = App.useApp();
  const [aiLoading, setAiLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const wholesaleUnit = Form.useWatch("wholesaleUnit", form);
  const retailUnit = Form.useWatch("retailUnit", form);

  const conversionLabel = `Số lượng Quy đổi ${
    wholesaleUnit && retailUnit ? `(1 ${wholesaleUnit} = ? ${retailUnit})` : ""
  }`;

  const handleExtractFromPdf = async (
    fileContent: string,
    mimeType: string
  ) => {
    setPdfLoading(true);
    try {
      const { data, error } = await extractFromPdf(fileContent, mimeType);

      if (error) throw error;

      if (!data) throw "Data not found";

      // Nâng cấp để điền tất cả các trường mới từ AI
      form.setFieldsValue({
        name: data.name,
        registrationNumber: (data as any).registrationNumber,
        category: data.category,
        packaging: data.packaging,
        description: data.description,
        route: data.route,
        hdsd_0_2: data.hdsd_0_2,
        hdsd_2_6: data.hdsd_2_6,
        hdsd_6_18: data.hdsd_6_18,
        hdsd_over_18: data.hdsd_over_18,
        disease: data.disease,
        isChronic: (data as any).isChronic,
        wholesaleUnit: (data as any).wholesaleUnit,
        retailUnit: (data as any).retailUnit,
        conversionRate: (data as any).conversionRate,
        manufacturer: data.manufacturer,
        distributor: data.distributor,
        tags: data.tags,
      });
      notification?.success({
        message: "Thành công!",
        description: "Đã trích xuất và điền dữ liệu từ PDF.",
      });
    } catch (error: unknown) {
      notification.error({
        message: "Lỗi Trích xuất PDF",
        description: getErrorMessage(error),
      });
    } finally {
      setPdfLoading(false);
    }
  };

  // HÀM MỚI: Xử lý logic khi bấm nút "Làm giàu dữ liệu từ AI"
  const handleEnrichData = async () => {
    const productName = form.getFieldValue("name");
    if (!productName) {
      notification.warning({
        message: "Thiếu thông tin",
        description: "Vui lòng nhập Tên sản phẩm trước khi làm giàu dữ liệu.",
      });
      return;
    }

    setAiLoading(true);
    try {
      // Gọi đến "Người Phục vụ AI" trên Supabase
      const { data, error } = await enrichProductData(productName);

      if (error) throw error;

      // Tự động điền dữ liệu AI trả về vào các ô tương ứng
      form.setFieldsValue({
        description: data.description,
        tags: data.tags,
        category: data.category,
      });
      notification?.success({
        message: "Thành công!",
        description: "Dữ liệu đã được AI làm giàu.",
      });
    } catch (error: unknown) {
      notification.error({
        message: "Lỗi AI",
        description: getErrorMessage(error),
      });
    } finally {
      setAiLoading(false);
    }
  };

  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loadingWarehouses, setLoadingWarehouses] = useState(false);

  const fetchWarehouses = async () => {
    setLoadingWarehouses(true);
    const { data, error } = await getWarehouse();

    if (error) {
      console.error("Lỗi tải danh sách kho:", error);
    } else {
      setWarehouses(data);
    }
    setLoadingWarehouses(false);
  };

  // Tự động hỏi danh sách kho mỗi khi form được mở
  useEffect(() => {
    fetchWarehouses();
  }, []);

  useEffect(() => {
    if (initialData && warehouses.length > 0) {
      setTimeout(() => {
        // Handle inventory settings if they exist (from separate inventory table)
        let inventorySettingsForForm = {};

        // Only try to process inventory data if it exists and is an array
        if (
          initialData.inventory_data &&
          Array.isArray(initialData.inventory_data)
        ) {
          inventorySettingsForForm = initialData.inventory_data.reduce(
            (acc: any, inv: any) => {
              if (inv && inv.warehouse_id) {
                acc[inv.warehouse_id] = {
                  min_stock: inv.min_stock || 0,
                  max_stock: inv.max_stock || 0,
                };
              }
              return acc;
            },
            {}
          );
        }

        const formData = {
          name: initialData.name || "",
          sku: initialData.sku || "",
          barcode: initialData.barcode || "",
          category: initialData.category || "",
          tags: initialData.tags || [],
          manufacturer: initialData.manufacturer || "",
          distributor: initialData.distributor || "",
          packaging: initialData.packaging || "",
          description: initialData.description || "",
          route: initialData.route || "",
          disease: initialData.disease || "",
          image_url: initialData.image_url || "",
          image_url_manual: "",
          productType: initialData.product_type || "goods",
          isFixedAsset: initialData.is_fixed_asset || false,
          registrationNumber: initialData.registration_number || "",
          isChronic: initialData.is_chronic || false,
          wholesaleUnit: initialData.wholesale_unit || "",
          retailUnit: initialData.retail_unit || "",
          conversionRate: initialData.conversion_rate || 1,
          invoicePrice: initialData.invoice_price || 0,
          costPrice: initialData.cost_price || 0,
          wholesaleProfit: initialData.wholesale_profit || 0,
          retailProfit: initialData.retail_profit || 0,
          wholesalePrice: initialData.wholesale_price || 0,
          retailPrice: initialData.retail_price || 0,
          hdsd_0_2: initialData.hdsd_0_2 || "",
          hdsd_2_6: initialData.hdsd_2_6 || "",
          hdsd_6_18: initialData.hdsd_6_18 || "",
          hdsd_over_18: initialData.hdsd_over_18 || "",
          inventory_settings: inventorySettingsForForm,
        };

        form.setFieldsValue(formData);
      }, 0);
    } else if (!initialData) {
      form.resetFields();
    }
  }, [initialData, warehouses, form]);

  const handleOk = (values: any) => {
    // Merge image_url and image_url_manual, preferring manual input if provided
    const finalImageUrl = values.image_url_manual || values.image_url || "";
    const finalValues = {
      ...values,
      image_url: finalImageUrl,
    };
    // Remove the manual field since it's now merged
    delete finalValues.image_url_manual;
    console.log("Calling onFinish with finalValues:", finalValues);
    onFinish(finalValues);
  };

  const items: TabsProps["items"] = [
    {
      key: "1",
      label: (
        <>
          <InfoCircleOutlined /> Thông tin chung
        </>
      ),
      children: (
        <Row gutter={24}>
          <Col span={8}>
            <Form.Item name="image_url" label="Ảnh sản phẩm">
              <ImageUpload />
            </Form.Item>
            <Form.Item name="image_url_manual">
              <Input placeholder="Hoặc dán URL ảnh trực tiếp vào đây" />
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
          <Col span={16}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="name"
                  label="Tên sản phẩm"
                  rules={[{ required: true }]}
                >
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="sku"
                  label="Mã SKU"
                  rules={[{ required: true }]}
                >
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="barcode" label="Mã vạch (Barcode)">
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="category" label="Phân loại SP (Gợi ý từ AI)">
                  <Select />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item name="tags" label="Tags (hoạt chất, từ khóa...)">
                  <Select mode="tags" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="manufacturer" label="Công ty sản xuất">
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="distributor" label="Công ty phân phối">
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="registrationNumber" label="Số Đăng ký">
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="packaging" label="Quy cách đóng gói">
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="route" label="Đường dùng">
                  <Select
                    options={[
                      { value: "Uống", label: "Uống" },
                      { value: "Tiêm", label: "Tiêm" },
                      { value: "Bôi ngoài da", label: "Bôi ngoài da" },
                      { value: "Đặt", label: "Đặt" },
                      { value: "Ngậm", label: "Ngậm" },
                    ]}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Col>
          <Col span={24}>
            <Form.Item name="description" label="Mô tả & HDSD chung">
              <Input.TextArea rows={4} />
            </Form.Item>
          </Col>

          <Col span={24}>
            <Divider>Hướng dẫn sử dụng chi tiết theo độ tuổi</Divider>
          </Col>
          <Col span={12}>
            <Form.Item name="hdsd_0_2" label="Từ 0-2 tuổi">
              <Input.TextArea rows={2} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="hdsd_2_6" label="Từ 2-6 tuổi">
              <Input.TextArea rows={2} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="hdsd_6_18" label="Từ 6-18 tuổi">
              <Input.TextArea rows={2} />
            </Form.Item>
          </Col>
          <Col span={12}>
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
        </Row>
      ),
    },
    {
      key: "2",
      label: (
        <>
          <DollarCircleOutlined /> Giá & Kinh doanh
        </>
      ),
      children: (
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="wholesaleUnit" label="Đơn vị Bán Buôn">
              <Input placeholder="ví dụ: Thùng" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="retailUnit" label="Đơn vị Bán lẻ">
              <Input placeholder="ví dụ: Hộp" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="conversionRate" label={conversionLabel}>
              <InputNumber style={{ width: "100%" }} min={1} />
            </Form.Item>
          </Col>

          {/* === CÁC Ô ĐÃ ĐƯỢC NÂNG CẤP === */}
          <Col span={12}>
            <Form.Item name="invoicePrice" label="Giá nhập trên Hóa Đơn">
              <InputNumber
                style={{ width: "100%" }}
                addonAfter="VNĐ"
                formatter={(value) =>
                  `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
                }
                parser={(value) => value!.replace(/\./g, "")}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="costPrice"
              label="Giá vốn thực tế"
              rules={[{ required: true }]}
            >
              <InputNumber
                style={{ width: "100%" }}
                addonAfter="VNĐ"
                formatter={(value) =>
                  `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
                }
                parser={(value) => value!.replace(/\./g, "")}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="wholesaleProfit" label="Lãi bán buôn">
              <InputNumber
                style={{ width: "100%" }}
                addonAfter="VNĐ"
                formatter={(value) =>
                  `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
                }
                parser={(value) => value!.replace(/\./g, "")}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="retailProfit" label="Lãi bán lẻ">
              <InputNumber
                style={{ width: "100%" }}
                addonAfter="VNĐ"
                formatter={(value) =>
                  `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
                }
                parser={(value) => value!.replace(/\./g, "")}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="wholesalePrice" label="Giá bán buôn (Tự tính)">
              <InputNumber
                style={{ width: "100%" }}
                addonAfter="VNĐ"
                formatter={(value) =>
                  `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
                }
                parser={(value) => value!.replace(/\./g, "")}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="retailPrice" label="Giá bán lẻ (Tự tính)">
              <InputNumber
                style={{ width: "100%" }}
                addonAfter="VNĐ"
                formatter={(value) =>
                  `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
                }
                parser={(value) => value!.replace(/\./g, "")}
              />
            </Form.Item>
          </Col>
        </Row>
      ),
    },
    {
      key: "3",
      label: (
        <>
          <HomeOutlined /> Cài đặt Tồn kho
        </>
      ),
      children:
        // === NÂNG CẤP LÕI NẰM Ở ĐÂY ===
        loadingWarehouses ? (
          <Spin />
        ) : (
          warehouses.map((wh) => (
            <div key={wh.id}>
              <Title level={5}>
                {wh.name} (Đơn vị: {wh.name.includes("B2B") ? "Thùng" : "Hộp"})
              </Title>
              <Row gutter={16}>
                <Col span={12}>
                  {/* Tên của Form Item giờ đây cũng được tạo động */}
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
            </div>
          ))
        ),
    },
  ];

  return (
    <Form
      form={form}
      layout="vertical"
      name="product_form_detailed"
      onValuesChange={handleValuesChange}
      onFinish={handleOk}
      onFinishFailed={(errorInfo) => {
        console.log("Form validation failed:", errorInfo);
      }}
      className="gap-4"
    >
      <Button
        type="primary"
        ghost
        style={{ marginBottom: 24 }}
        onClick={handleEnrichData}
        loading={aiLoading}
      >
        Gợi ý dữ liệu từ Tên [AI]
      </Button>
      <PdfUpload onFileReady={handleExtractFromPdf} loading={pdfLoading} />
      <Tabs defaultActiveKey="1" items={items} />

      {/* Submit button */}
      <div style={{ marginTop: 24, textAlign: "right" }}>
        <Button onClick={onClose} style={{ marginRight: 8 }}>
          Hủy
        </Button>
        <Button
          type="primary"
          htmlType="submit"
          loading={loading}
          onClick={() => console.log("Submit button clicked")}
        >
          Lưu
        </Button>
      </div>
    </Form>
  );
};

export default ProductForm;
