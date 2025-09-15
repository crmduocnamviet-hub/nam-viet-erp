import React, { useEffect, useState } from "react";
import {
  Modal,
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
import { supabase } from "../../../lib/supabaseClient";
import PdfUpload from "./PdfUpload";

const { Title } = Typography; // <-- Khai báo Title để sử dụng

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
      const { data, error } = await supabase.functions.invoke(
        "extract-from-pdf",
        {
          body: { fileContent, mimeType },
        }
      );

      if (error) throw error;

      // Nâng cấp để điền tất cả các trường mới từ AI
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
      const { data, error } = await supabase.functions.invoke(
        "enrich-product-data",
        {
          body: { productName },
        }
      );

      if (error) throw error;

      // Tự động điền dữ liệu AI trả về vào các ô tương ứng
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

  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loadingWarehouses, setLoadingWarehouses] = useState(false);

  const fetchWarehouses = async () => {
    setLoadingWarehouses(true);
    const { data, error } = await supabase
      .from("warehouses")
      .select("id, name");
    if (error) {
      console.error("Lỗi tải danh sách kho:", error);
    } else {
      setWarehouses(data);
    }
    setLoadingWarehouses(false);
  };

  // Tự động hỏi danh sách kho mỗi khi form được mở
  useEffect(() => {
    if (open) {
      fetchWarehouses();
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      if (initialData && warehouses.length > 0) {
        // Thêm các câu lệnh "ghi âm" để điều tra
        console.log("--- BẮT ĐẦU ĐIỀU TRA ---");
        console.log(
          "1. Dữ liệu gốc nhận được (initialData):",
          JSON.stringify(initialData, null, 2)
        );
        console.log(
          "2. Danh sách kho hàng đã tải về (warehouses):",
          JSON.stringify(warehouses, null, 2)
        );

        setTimeout(() => {
          const inventorySettingsForForm = initialData.inventory_data?.reduce(
            (acc: any, inv: any) => {
              if (inv) {
                acc[inv.warehouse_id] = {
                  min_stock: inv.min_stock,
                  max_stock: inv.max_stock,
                };
              }
              return acc;
            },
            {}
          );

          const formData = {
            ...initialData,
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
          };

          console.log(
            "3. Dữ liệu đã được phiên dịch cho Form (formData):",
            JSON.stringify(formData, null, 2)
          );
          form.setFieldsValue(formData);
          console.log("--- KẾT THÚC ĐIỀU TRA ---");
        }, 0);
      } else if (!initialData) {
        form.resetFields();
      }
    }
  }, [initialData, warehouses, form, open]);

  const handleOk = () => {
    form
      .validateFields()
      .then((values) => {
        onFinish(values);
      })
      .catch((info) => {
        console.log("Validate Failed:", info);
      });
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
            <Form.Item name="image_url">
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
    <Modal
      open={open}
      title={initialData ? "Cập nhật sản phẩm" : "Thêm sản phẩm mới"}
      okText={initialData ? "Cập nhật" : "Tạo mới"}
      width={1000}
      onCancel={onClose}
      onOk={handleOk}
      destroyOnHidden
      confirmLoading={loading}
    >
      <Form
        form={form}
        layout="vertical"
        name="product_form_detailed"
        onValuesChange={handleValuesChange}
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
      </Form>
    </Modal>
  );
};

export default ProductForm;
