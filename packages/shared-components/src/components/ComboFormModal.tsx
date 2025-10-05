import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Switch,
  Button,
  Space,
  Table,
  Select,
  App,
  Typography,
  Tag,
  Divider,
} from "antd";
import {
  DeleteOutlined,
  GiftOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import {
  searchProducts,
  createCombo,
  updateCombo,
  addComboItems,
  removeComboItems,
} from "@nam-viet-erp/services";
import { useDebounce } from "@nam-viet-erp/shared-components";

const { Text } = Typography;
const { TextArea } = Input;

interface ComboFormModalProps {
  open: boolean;
  combo: IComboWithItems | null;
  onCancel: () => void;
  onSuccess: () => void;
}

interface ComboItemRow {
  key: string;
  product_id: number;
  product_name: string;
  product_price: number;
  quantity: number;
}

const ComboFormModal: React.FC<ComboFormModalProps> = ({
  open,
  combo,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const { notification } = App.useApp();
  const [loading, setLoading] = useState(false);

  // Product search
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [productSearchResults, setProductSearchResults] = useState<IProduct[]>(
    []
  );
  const [searchingProducts, setSearchingProducts] = useState(false);
  const debouncedProductSearch = useDebounce(productSearchTerm, 500);

  // Combo items
  const [comboItems, setComboItems] = useState<ComboItemRow[]>([]);
  const [comboPriceValue, setComboPriceValue] = useState<number>(0);

  // Calculate totals
  const originalPrice = comboItems.reduce(
    (sum, item) => sum + item.product_price * item.quantity,
    0
  );

  const discountAmount = originalPrice - comboPriceValue;
  const discountPercentage =
    originalPrice > 0 ? (discountAmount / originalPrice) * 100 : 0;

  useEffect(() => {
    if (open && combo) {
      // Edit mode - populate form
      form.setFieldsValue({
        name: combo.name,
        description: combo.description,
        combo_price: combo.combo_price,
        is_active: combo.is_active,
        image_url: combo.image_url,
      });
      setComboPriceValue(combo.combo_price);

      // Populate combo items
      const items: ComboItemRow[] = (combo.combo_items || []).map((item) => ({
        key: `${item.product_id}_${Date.now()}`,
        product_id: item.product_id,
        product_name: item.products?.name || `Product ${item.product_id}`,
        product_price: item.products?.retail_price || 0,
        quantity: item.quantity,
      }));
      setComboItems(items);
    } else if (open) {
      // Create mode - reset form
      form.resetFields();
      setComboItems([]);
      setComboPriceValue(0);
    }
  }, [open, combo, form]);

  useEffect(() => {
    if (debouncedProductSearch && debouncedProductSearch.length >= 2) {
      handleSearchProducts();
    } else {
      setProductSearchResults([]);
    }
  }, [debouncedProductSearch]);

  const handleSearchProducts = async () => {
    if (!debouncedProductSearch || debouncedProductSearch.length < 2) {
      setProductSearchResults([]);
      return;
    }

    setSearchingProducts(true);
    try {
      const { data, error } = await searchProducts({
        search: debouncedProductSearch,
        pageSize: 20,
        status: "active",
      });
      if (error) throw error;
      setProductSearchResults(data || []);
    } catch (error: any) {
      notification.error({
        message: "Lỗi tìm kiếm sản phẩm",
        description: error.message,
      });
      setProductSearchResults([]);
    } finally {
      setSearchingProducts(false);
    }
  };

  const handleAddProduct = (product: IProduct) => {
    // Check if product already exists
    const exists = comboItems.find((item) => item.product_id === product.id);
    if (exists) {
      notification.warning({
        message: "Sản phẩm đã có trong combo",
        description: "Vui lòng chọn sản phẩm khác hoặc tăng số lượng",
      });
      return;
    }

    const newItem: ComboItemRow = {
      key: `${product.id}_${Date.now()}`,
      product_id: product.id,
      product_name: product.name,
      product_price: product.retail_price || 0,
      quantity: 1,
    };

    setComboItems([...comboItems, newItem]);
    setProductSearchTerm("");
    setProductSearchResults([]);
  };

  const handleRemoveProduct = (key: string) => {
    setComboItems(comboItems.filter((item) => item.key !== key));
  };

  const handleQuantityChange = (key: string, quantity: number) => {
    setComboItems(
      comboItems.map((item) =>
        item.key === key ? { ...item, quantity } : item
      )
    );
  };

  const handleSubmit = async (values: any) => {
    if (comboItems.length === 0) {
      notification.error({
        message: "Lỗi",
        description: "Vui lòng thêm ít nhất 1 sản phẩm vào combo",
      });
      return;
    }

    if (values.combo_price >= originalPrice) {
      notification.error({
        message: "Lỗi giá combo",
        description: "Giá combo phải thấp hơn tổng giá gốc để có ưu đãi",
      });
      return;
    }

    setLoading(true);
    try {
      if (combo) {
        // Update existing combo
        const { error: updateError } = await updateCombo(combo.id, {
          name: values.name,
          description: values.description,
          combo_price: values.combo_price,
          is_active: values.is_active,
          image_url: values.image_url,
        });
        if (updateError) throw updateError;

        // Get existing product IDs
        const existingProductIds = (combo.combo_items || []).map(
          (item) => item.product_id
        );
        const newProductIds = comboItems.map((item) => item.product_id);

        // Remove products that are no longer in the combo
        const toRemove = existingProductIds.filter(
          (id) => !newProductIds.includes(id)
        );
        if (toRemove.length > 0) {
          await removeComboItems(combo.id, toRemove);
        }

        // Add new products
        const toAdd = comboItems.filter(
          (item) => !existingProductIds.includes(item.product_id)
        );
        if (toAdd.length > 0) {
          const { error: addError } = await addComboItems(
            toAdd.map((item) => ({
              combo_id: combo.id,
              product_id: item.product_id,
              quantity: item.quantity,
            }))
          );
          if (addError) throw addError;
        }

        // Update quantities for existing products
        const toUpdate = comboItems.filter((item) =>
          existingProductIds.includes(item.product_id)
        );
        if (toUpdate.length > 0) {
          // Remove and re-add to update quantities
          await removeComboItems(
            combo.id,
            toUpdate.map((item) => item.product_id)
          );
          const { error: updateItemsError } = await addComboItems(
            toUpdate.map((item) => ({
              combo_id: combo.id,
              product_id: item.product_id,
              quantity: item.quantity,
            }))
          );
          if (updateItemsError) throw updateItemsError;
        }

        notification.success({
          message: "Cập nhật thành công",
          description: "Combo đã được cập nhật",
        });
      } else {
        // Create new combo
        const { data: newCombo, error: createError } = await createCombo({
          name: values.name,
          description: values.description,
          combo_price: values.combo_price,
          is_active: values.is_active ?? true,
          image_url: values.image_url,
        });
        if (createError) throw createError;

        // Add combo items
        const { error: addItemsError } = await addComboItems(
          comboItems.map((item) => ({
            combo_id: newCombo.id,
            product_id: item.product_id,
            quantity: item.quantity,
          }))
        );
        if (addItemsError) throw addItemsError;

        notification.success({
          message: "Tạo thành công",
          description: "Combo mới đã được tạo",
        });
      }

      onSuccess();
    } catch (error: any) {
      notification.error({
        message: combo ? "Lỗi cập nhật combo" : "Lỗi tạo combo",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const comboItemColumns = [
    {
      title: "Sản phẩm",
      dataIndex: "product_name",
      key: "product_name",
    },
    {
      title: "Giá",
      dataIndex: "product_price",
      key: "product_price",
      render: (price: number) => `${price.toLocaleString()}đ`,
    },
    {
      title: "Số lượng",
      dataIndex: "quantity",
      key: "quantity",
      width: 120,
      render: (quantity: number, record: ComboItemRow) => (
        <InputNumber
          min={1}
          value={quantity}
          onChange={(val) => handleQuantityChange(record.key, val || 1)}
          style={{ width: "100%" }}
        />
      ),
    },
    {
      title: "Tổng",
      key: "total",
      render: (_: any, record: ComboItemRow) => (
        <Text strong>
          {(record.product_price * record.quantity).toLocaleString()}đ
        </Text>
      ),
    },
    {
      title: "",
      key: "action",
      width: 50,
      render: (_: any, record: ComboItemRow) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleRemoveProduct(record.key)}
          size="small"
        />
      ),
    },
  ];

  return (
    <Modal
      title={
        <Space>
          <GiftOutlined style={{ color: "#faad14" }} />
          {combo ? "Chỉnh sửa Combo" : "Tạo Combo Mới"}
        </Space>
      }
      open={open}
      onCancel={onCancel}
      width={900}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Hủy
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={() => form.submit()}
        >
          {combo ? "Cập nhật" : "Tạo Combo"}
        </Button>,
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{ is_active: true }}
      >
        <Form.Item
          name="name"
          label="Tên Combo"
          rules={[{ required: true, message: "Vui lòng nhập tên combo" }]}
        >
          <Input placeholder="VD: Combo Chăm Sóc Cảm Cúm" size="large" />
        </Form.Item>

        <Form.Item name="description" label="Mô tả">
          <TextArea
            rows={3}
            placeholder="Mô tả chi tiết về combo và lợi ích cho khách hàng..."
          />
        </Form.Item>

        <Form.Item name="image_url" label="URL Hình ảnh">
          <Input placeholder="https://example.com/combo-image.jpg" />
        </Form.Item>

        <Divider>Sản phẩm trong Combo</Divider>

        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <Select
            showSearch
            placeholder="🔍 Tìm kiếm sản phẩm theo tên, SKU, barcode..."
            value={null}
            searchValue={productSearchTerm}
            onSearch={setProductSearchTerm}
            loading={searchingProducts}
            filterOption={false}
            notFoundContent={
              searchingProducts ? (
                <div style={{ textAlign: "center", padding: "20px" }}>
                  Đang tìm kiếm...
                </div>
              ) : productSearchTerm && productSearchTerm.length < 2 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "20px",
                    color: "#999",
                  }}
                >
                  Nhập ít nhất 2 ký tự để tìm kiếm
                </div>
              ) : productSearchTerm && productSearchResults.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "20px",
                    color: "#999",
                  }}
                >
                  Không tìm thấy sản phẩm
                </div>
              ) : (
                <div
                  style={{
                    textAlign: "center",
                    padding: "20px",
                    color: "#999",
                  }}
                >
                  Nhập để tìm kiếm sản phẩm
                </div>
              )
            }
            style={{ width: "100%" }}
            size="large"
            suffixIcon={<SearchOutlined />}
            onSelect={(value: any) => {
              const product = productSearchResults.find((p) => p.id === value);
              if (product) {
                handleAddProduct(product);
              }
            }}
            popupMatchSelectWidth={false}
            listHeight={400}
          >
            {productSearchResults.map((product) => (
              <Select.Option key={product.id} value={product.id}>
                <Space
                  style={{ width: "100%", justifyContent: "space-between" }}
                >
                  <div>
                    <div>{product.name}</div>
                    <Text type="secondary" style={{ fontSize: "12px" }}>
                      SKU: {product.sku || "N/A"}
                    </Text>
                  </div>
                  <Text strong style={{ color: "#52c41a" }}>
                    {product.retail_price?.toLocaleString()}đ
                  </Text>
                </Space>
              </Select.Option>
            ))}
          </Select>

          <Table
            columns={comboItemColumns}
            dataSource={comboItems}
            pagination={false}
            locale={{ emptyText: "Chưa có sản phẩm nào trong combo" }}
            summary={() => (
              <Table.Summary fixed>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={3}>
                    <Text strong>Tổng giá gốc:</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1}>
                    <Text strong style={{ fontSize: 16 }}>
                      {originalPrice.toLocaleString()}đ
                    </Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2} />
                </Table.Summary.Row>
              </Table.Summary>
            )}
          />
        </Space>

        <Divider>Giá Combo</Divider>

        <Form.Item
          name="combo_price"
          label="Giá bán Combo (sau giảm giá)"
          rules={[
            { required: true, message: "Vui lòng nhập giá combo" },
            {
              validator: (_, value) => {
                if (value && value >= originalPrice) {
                  return Promise.reject(
                    "Giá combo phải thấp hơn tổng giá gốc để có ưu đãi"
                  );
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <InputNumber
            style={{ width: "100%" }}
            formatter={(value) =>
              `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
            }
            parser={(value) =>
              (value ? Number(value.replace(/,/g, "")) : 0) as never
            }
            addonAfter="VNĐ"
            size="large"
            min={0}
            onChange={(value) => setComboPriceValue(value || 0)}
          />
        </Form.Item>

        {discountAmount > 0 && (
          <Space style={{ marginBottom: 16 }}>
            <Tag color="orange" style={{ fontSize: 14, padding: "4px 12px" }}>
              Giảm {discountPercentage.toFixed(1)}%
            </Tag>
            <Text type="success" strong>
              Tiết kiệm: {discountAmount.toLocaleString()}đ
            </Text>
          </Space>
        )}

        <Form.Item name="is_active" label="Trạng thái" valuePropName="checked">
          <Switch checkedChildren="Đang áp dụng" unCheckedChildren="Tạm dừng" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ComboFormModal;
