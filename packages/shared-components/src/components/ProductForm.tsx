import React, { useEffect, useState } from "react";
import {
  Form,
  Input,
  Tabs,
  Row,
  Col,
  InputNumber,
  Select,
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
  QrcodeOutlined,
} from "@ant-design/icons";
import ImageUpload from "./ImageUpload";
import {
  enrichProductData,
  extractFromPdf,
  getWarehouse,
} from "@nam-viet-erp/services";
import PdfUpload from "./PdfUpload";
import QRScannerModal from "./QRScannerModal";
import { getErrorMessage } from "../utils";
import { ProductFormData } from "../types/product";

const { Title } = Typography;

interface ProductFormProps {
  onClose: () => void;
  onFinish: (values: ProductFormData) => void;
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
  const { notification } = App.useApp();
  const [aiLoading, setAiLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);

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
        category: data.category,
        packaging: data.packaging,
        description: data.description,
        route: data.route,
        hdsd_0_2: data.hdsd_0_2,
        hdsd_2_6: data.hdsd_2_6,
        hdsd_6_18: data.hdsd_6_18,
        hdsd_over_18: data.hdsd_over_18,
        disease: data.disease,
        wholesale_unit: (data as any).wholesale_unit,
        retail_unit: (data as any).retail_unit,
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

  // Handle QR scan for barcode
  const handleQRScan = (scannedData: string) => {
    form.setFieldsValue({ barcode: scannedData });
    setIsQRScannerOpen(false);
    notification.success({
      message: "✅ Quét thành công",
      description: `Đã điền mã vạch: ${scannedData}`,
      duration: 2,
    });
  };


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
          wholesale_unit: initialData.wholesale_unit || "",
          retail_unit: initialData.retail_unit || "",
          wholesale_price: initialData.wholesale_price || 0,
          retail_price: initialData.retail_price || 0,
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

    // Separate inventory_settings from product data
    const { inventory_settings, ...productData } = values;

    const finalValues = {
      ...productData,
      image_url: finalImageUrl,
      // Pass inventory_settings separately so it can be saved to inventory table
      inventory_settings: inventory_settings || {},
    };

    // Remove the manual field since it's now merged
    delete finalValues.image_url_manual;

    console.log("Calling onFinish with finalValues:", finalValues);
    console.log("Product data:", { ...finalValues, inventory_settings: undefined });
    console.log("Inventory settings:", finalValues.inventory_settings);

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
                  <Input
                    addonAfter={
                      <QrcodeOutlined
                        style={{ cursor: "pointer" }}
                        onClick={() => setIsQRScannerOpen(true)}
                      />
                    }
                    placeholder="Nhập hoặc quét mã vạch"
                  />
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
            <Form.Item name="wholesale_unit" label="Đơn vị Bán Buôn">
              <Input placeholder="ví dụ: Thùng" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="retail_unit" label="Đơn vị Bán lẻ">
              <Input placeholder="ví dụ: Hộp" />
            </Form.Item>
          </Col>

          {/* === PRICING === */}
          <Col span={12}>
            <Form.Item name="wholesale_price" label="Giá bán buôn">
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
            <Form.Item name="retail_price" label="Giá bán lẻ">
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

      {/* QR Scanner Modal */}
      <QRScannerModal
        visible={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        onScan={handleQRScan}
      />
    </Form>
  );
};

export default ProductForm;
