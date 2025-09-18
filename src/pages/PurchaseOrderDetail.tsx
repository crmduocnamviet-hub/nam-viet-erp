// src/pages/PurchaseOrderDetail.tsx

import React, { useState, useEffect, useCallback } from "react";
import {
  Button,
  Row,
  Col,
  Typography,
  App as AntApp,
  Form,
  Select,
  Table,
  InputNumber,
  Space,
  Card,
  Avatar,
  type TableProps,
  Spin,
} from "antd";
import {
  ArrowLeftOutlined,
  SaveOutlined,
  DeleteOutlined,
  SendOutlined,
} from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

const { Title, Text } = Typography;
const { Option } = Select;

const PurchaseOrderDetailContent: React.FC = () => {
  const { notification, modal } = AntApp.useApp();
  const [form] = Form.useForm();
  const params = useParams();
  const navigate = useNavigate();
  const poId = params.id;
  const isCreating = !poId;

  const [loading, setLoading] = useState(!isCreating);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suppliers, setSuppliers] = useState<
    { value: number; label: string }[]
  >([]);
  const [products, setProducts] = useState<any[]>([]);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [originalOrderItems, setOriginalOrderItems] = useState<any[]>([]); // Lưu trạng thái gốc

  const fetchOrderDetails = useCallback(async () => {
    if (isCreating) return;
    setLoading(true);
    try {
      const { data: poData, error: poError } = await supabase
        .from("purchase_orders")
        .select("*, suppliers(id, name)")
        .eq("id", poId)
        .single();
      if (poError) throw poError;

      const { data: itemsData, error: itemsError } = await supabase
        .from("purchase_order_items")
        .select("*, products(*)")
        .eq("po_id", poId);
      if (itemsError) throw itemsError;

      form.setFieldsValue({ supplier_id: poData.suppliers.id });
      const formattedItems = itemsData.map((item) => ({
        key: item.products.id,
        product_id: item.products.id,
        name: item.products.name,
        sku: item.products.sku,
        image_url: item.products.image_url,
        wholesale_unit: item.products.wholesale_unit,
        quantity: item.quantity,
        cost_price: item.cost_price,
      }));
      setOrderItems(formattedItems);
      setOriginalOrderItems(JSON.parse(JSON.stringify(formattedItems))); // Deep copy
    } catch (error: any) {
      notification.error({
        message: "Lỗi tải chi tiết đơn hàng",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  }, [isCreating, poId, form, notification]);

  useEffect(() => {
    const fetchInitialData = async () => {
      // Chỉ tải danh sách sản phẩm nếu đang tạo đơn mới
      if (isCreating) {
        const { data } = await supabase
          .from("products")
          .select("id, name, sku, cost_price, image_url, wholesale_unit");
        if (data) setProducts(data);
      }
      const { data: supplierData } = await supabase
        .from("suppliers")
        .select("id, name");
      if (supplierData)
        setSuppliers(supplierData.map((s) => ({ value: s.id, label: s.name })));
    };

    fetchInitialData();
    fetchOrderDetails();
  }, [fetchOrderDetails, isCreating]);

  const handleItemQuantityChange = (
    productId: number,
    quantity: number | null
  ) => {
    setOrderItems((prev) =>
      prev.map((item) =>
        item.product_id === productId
          ? { ...item, quantity: quantity || 0 }
          : item
      )
    );
  };

  const handleAddProduct = (productId: number) => {
    const product = products.find((p) => p.id === productId);
    if (product && !orderItems.some((item) => item.product_id === productId)) {
      const newItem = {
        key: product.id,
        product_id: product.id,
        name: product.name,
        sku: product.sku,
        image_url: product.image_url,
        wholesale_unit: product.wholesale_unit,
        quantity: 1,
        cost_price: product.cost_price,
      };
      setOrderItems((prev) => [...prev, newItem]);
    }
  };

  const handleRemoveItem = (productId: number) => {
    setOrderItems((prev) =>
      prev.filter((item) => item.product_id !== productId)
    );
  };

  // --- NÂNG CẤP: Logic cho các nút hành động ---
  const handleSave = async (newStatus?: string) => {
    try {
      await form.validateFields();
      const supplierId = form.getFieldValue("supplier_id");
      if (!supplierId && isCreating) {
        notification.error({ message: "Vui lòng chọn Nhà Cung Cấp." });
        return;
      }
      if (orderItems.length === 0) {
        notification.error({ message: "Đơn hàng phải có ít nhất 1 sản phẩm." });
        return;
      }
      setIsSubmitting(true);
      const itemsToSave = orderItems.map(
        ({ product_id, quantity, cost_price }) => ({
          product_id,
          quantity,
          cost_price,
        })
      );

      const { error } = await supabase.rpc("update_purchase_order_details", {
        p_po_id: poId ? parseInt(poId, 10) : null,
        p_supplier_id: supplierId,
        p_items: itemsToSave,
        p_new_status: newStatus || "Nháp",
      });

      if (error) throw error;

      notification.success({
        message: `Đã ${
          newStatus === "Đã đặt - Chờ nhận hàng" ? "đặt hàng" : "lưu nháp"
        } thành công!`,
      });
      navigate("/purchase-orders");
    } catch (error: any) {
      notification.error({
        message: "Thao tác thất bại",
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelOrder = () => {
    modal.confirm({
      title: "Xác nhận Hủy Đơn hàng?",
      content:
        "Đơn hàng này sẽ được chuyển sang trạng thái 'Đã Hủy' và không thể chỉnh sửa.",
      okText: "Đồng ý Hủy",
      okType: "danger",
      onOk: async () => {
        setIsSubmitting(true);
        try {
          const { error } = await supabase
            .from("purchase_orders")
            .update({ status: "Đã Hủy" })
            .eq("id", poId);
          if (error) throw error;
          notification.success({ message: "Đã hủy đơn hàng thành công." });
          navigate("/purchase-orders");
        } catch (error: any) {
          notification.error({
            message: "Hủy đơn thất bại",
            description: error.message,
          });
        } finally {
          setIsSubmitting(false);
        }
      },
    });
  };

  const columns: TableProps<any>["columns"] = [
    {
      title: "Ảnh",
      dataIndex: "image_url",
      key: "image",
      render: (url) => <Avatar shape="square" src={url} />,
    },
    {
      title: "Thông tin sản phẩm",
      dataIndex: "name",
      key: "info",
      render: (text, record) => (
        <div>
          <Text strong>{text}</Text>
          <div style={{ color: "gray" }}>SKU: {record.sku}</div>
        </div>
      ),
    },
    { title: "Đơn vị nhập", dataIndex: "wholesale_unit", key: "unit" },
    {
      title: "Số lượng",
      dataIndex: "quantity",
      key: "quantity",
      width: 120,
      render: (qty, record) => (
        <InputNumber
          min={1}
          value={qty}
          onChange={(val) => handleItemQuantityChange(record.product_id, val)}
        />
      ),
    },
    {
      title: "Giá nhập",
      dataIndex: "cost_price",
      key: "cost_price",
      render: (price) => (
        <InputNumber
          value={price}
          style={{ width: "120px" }}
          formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
          parser={(v) => Number(v!.replace(/\./g, ""))}
          readOnly
        />
      ),
    }, // <-- Giá không cho sửa
    {
      title: "Hành động",
      key: "action",
      render: (_, record) => (
        <Button
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleRemoveItem(record.product_id)}
        />
      ),
    },
  ];

  return (
    <Spin spinning={loading}>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate("/purchase-orders")}
              />
              <Title level={2} style={{ marginBottom: 0 }}>
                {isCreating
                  ? "Tạo Đơn Đặt Hàng"
                  : `Chi tiết Đơn hàng PO-${String(poId).padStart(5, "0")}`}
              </Title>
            </Space>
          </Col>
          {/* --- NÂNG CẤP: Cụm 3 nút hành động --- */}
          <Col>
            <Space wrap>
              {!isCreating && (
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={handleCancelOrder}
                  loading={isSubmitting}
                >
                  Hủy đơn đặt
                </Button>
              )}
              <Button
                icon={<SaveOutlined />}
                onClick={() => handleSave("Nháp")}
                loading={isSubmitting}
              >
                Lưu nháp
              </Button>
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={() => handleSave("Đã đặt - Chờ nhận hàng")}
                loading={isSubmitting}
              >
                Lưu và Đặt hàng
              </Button>
            </Space>
          </Col>
        </Row>

        <Card>
          <Form form={form} layout="vertical">
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="supplier_id"
                  label="* Chọn Nhà Cung Cấp"
                  rules={[
                    { required: true, message: "Vui lòng chọn nhà cung cấp!" },
                  ]}
                >
                  <Select
                    showSearch
                    options={suppliers}
                    placeholder="Tìm nhà cung cấp..."
                    disabled={!isCreating}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="Thêm Sản phẩm vào Đơn hàng">
                  <Select
                    showSearch
                    placeholder="Gõ để tìm tên hoặc SKU sản phẩm..."
                    onSelect={handleAddProduct}
                    optionFilterProp="label"
                    value={null} // Reset sau mỗi lần chọn
                  >
                    {products.map((p) => (
                      <Option
                        key={p.id}
                        value={p.id}
                        label={`${p.name} (SKU: ${p.sku})`}
                      >
                        {p.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Card>

        <Table
          dataSource={orderItems}
          columns={columns}
          pagination={false}
          rowKey="key"
        />
      </Space>
    </Spin>
  );
};

const PurchaseOrderDetail: React.FC = () => (
  <AntApp>
    <PurchaseOrderDetailContent />
  </AntApp>
);

export default PurchaseOrderDetail;
