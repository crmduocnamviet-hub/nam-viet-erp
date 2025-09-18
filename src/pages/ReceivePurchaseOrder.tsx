// src/pages/ReceivePurchaseOrder.tsx

import React, { useState, useEffect, useCallback } from "react";
import {
  Button,
  Row,
  Col,
  Typography,
  App as AntApp,
  Form,
  Table,
  InputNumber,
  Space,
  Card,
  Spin,
  Input,
  Descriptions,
  Tag,
  Modal,
  Upload,
} from "antd";
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CameraOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const ReceivePurchaseOrderContent: React.FC = () => {
  const { notification, modal } = AntApp.useApp();
  const params = useParams();
  const navigate = useNavigate();
  const poId = params.id;

  const [loading, setLoading] = useState(true);
  const [poDetails, setPoDetails] = useState<any>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const fetchOrderDetails = useCallback(async () => {
    if (!poId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // 1. Lấy thông tin chính của đơn hàng và tên nhà cung cấp
      const { data: poData, error: poError } = await supabase
        .from("purchase_orders")
        .select("*, suppliers(name)")
        .eq("id", poId)
        .single();
      if (poError) throw poError;
      setPoDetails(poData);

      // 2. Lấy danh sách các sản phẩm thuộc đơn hàng đó
      const { data: itemsData, error: itemsError } = await supabase
        .from("purchase_order_items")
        .select("*, products(*)")
        .eq("po_id", poId);
      if (itemsError) throw itemsError;

      // 3. Chuẩn hóa dữ liệu để hiển thị trên bảng đối soát
      const formattedItems = itemsData.map((item) => ({
        key: item.products.id,
        product_id: item.products.id,
        name: item.products.name,
        sku: item.products.sku,
        shelf_location: item.products.shelf_location,
        ordered_quantity: item.quantity,
        invoice_quantity: item.quantity, // Mặc định SL trên HĐ = SL đặt
        received_quantity: item.quantity, // Mặc định SL thực nhận = SL đặt
        invoice_price: item.cost_price, // Mặc định giá HĐ = giá đặt
        actual_price: item.cost_price, // Mặc định giá thực tế = giá đặt
        lot_number: "",
        expiry_date: null,
        is_extra_item: false, // Đánh dấu đây không phải hàng ngoài ĐH
      }));
      setOrderItems(formattedItems);
    } catch (error: any) {
      notification.error({
        message: "Lỗi tải chi tiết đơn hàng",
        description: error.message,
      });
    } finally {
      setLoading(false); // Đảm bảo luôn tắt loading sau khi hoàn tất
    }
  }, [poId, notification]);

  useEffect(() => {
    fetchOrderDetails();
  }, [fetchOrderDetails]);

  const handleItemChange = (productId: number, field: string, value: any) => {
    setOrderItems((prev) =>
      prev.map((item) =>
        item.product_id === productId ? { ...item, [field]: value } : item
      )
    );
  };

  const handleScanInvoice = async (options: any) => {
    const { file } = options;
    setIsUploading(true);
    notification.info({
      message: "Đang phân tích hóa đơn...",
      description: "AI đang đọc dữ liệu, vui lòng chờ trong giây lát.",
      duration: 0,
    });

    try {
      // Chuyển file sang base64 để gửi đi
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const fileContent = (reader.result as string).split(",")[1];
        const mimeType = file.type;

        // Gọi đến "Mắt thần AI" trên Supabase
        const { data: reconciledData, error } = await supabase.functions.invoke(
          "scan-invoice-v2",
          {
            body: {
              poId: poId,
              fileContent: fileContent,
              mimeType: mimeType,
            },
          }
        );

        if (error) throw error;

        // Cập nhật bảng với dữ liệu AI đã đối soát
        setOrderItems(reconciledData.items);
        notification.success({ message: "Phân tích hóa đơn thành công!" });
        setIsModalVisible(false);
      };
    } catch (error: any) {
      notification.error({
        message: "Lỗi phân tích hóa đơn",
        description: error.message,
      });
    } finally {
      setIsUploading(false);
      notification.destroy(); // Tắt thông báo "Đang xử lý..."
    }
  };

  const handleCompleteReceiving = () => {
    // Logic hoàn tất sẽ được xây dựng ở bước cuối cùng
    notification.info({ message: "Chức năng đang được phát triển" });
  };

  const columns = [
    {
      title: "Sản phẩm",
      dataIndex: "name",
      key: "name",
      render: (text: string, record: any) => (
        <div
          style={{
            background: record.is_extra_item ? "#e6ffed" : "transparent",
            padding: "8px",
          }}
        >
          <Text strong>{text}</Text>
          <div>SKU: {record.sku}</div>
          {record.is_extra_item && <Tag color="success">Hàng ngoài ĐH</Tag>}
        </div>
      ),
    },
    {
      title: "SL Đặt",
      dataIndex: "ordered_quantity",
      key: "ordered_quantity",
      align: "center" as const,
    },
    {
      title: "SL HĐ (AI)",
      dataIndex: "invoice_quantity",
      key: "invoice_quantity",
      align: "center" as const,
    },
    {
      title: "SL Thực Nhận",
      dataIndex: "received_quantity",
      key: "received_quantity",
      width: 120,
      render: (text: number, record: any) => (
        <InputNumber
          min={0}
          value={text}
          onChange={(val) =>
            handleItemChange(record.product_id, "received_quantity", val)
          }
          style={{ width: "100%" }}
        />
      ),
    },
    {
      title: "Đơn giá HĐ (AI)",
      dataIndex: "invoice_price",
      key: "invoice_price",
      width: 130,
      render: (text: number) => text?.toLocaleString("vi-VN") + " đ",
    },
    {
      title: "Đơn giá Thực tế",
      dataIndex: "actual_price",
      key: "actual_price",
      width: 130,
      render: (text: number, record: any) => (
        <InputNumber
          value={text}
          onChange={(val) =>
            handleItemChange(record.product_id, "actual_price", val)
          }
          style={{ width: "100%" }}
          formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
          parser={(v) => Number(v!.replace(/\./g, ""))}
        />
      ),
    },
    {
      title: "Số Lô",
      dataIndex: "lot_number",
      key: "lot_number",
      width: 150,
      render: (text: string, record: any) => (
        <Input
          addonAfter={
            <Button type="text" size="small" icon={<CameraOutlined />} />
          }
          value={text}
          onChange={(e) =>
            handleItemChange(record.product_id, "lot_number", e.target.value)
          }
        />
      ),
    },
    {
      title: "Hạn Dùng",
      dataIndex: "expiry_date",
      key: "expiry_date",
      width: 160,
      render: (text: string, record: any) => (
        <Input
          type="date"
          addonAfter={
            <Button type="text" size="small" icon={<CameraOutlined />} />
          }
          value={text}
          onChange={(e) =>
            handleItemChange(record.product_id, "expiry_date", e.target.value)
          }
        />
      ),
    },
  ];

  return (
    <>
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
                  Nhập Kho từ Đơn hàng PO-{String(poId).padStart(5, "0")}
                </Title>
              </Space>
            </Col>
            <Col>
              <Space>
                <Button
                  icon={<CameraOutlined />}
                  onClick={() => setIsModalVisible(true)}
                >
                  Tải lên & Đối soát HĐ
                </Button>
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={handleCompleteReceiving}
                >
                  Hoàn tất Nhập & Ghi nhận Công nợ
                </Button>
              </Space>
            </Col>
          </Row>
          {poDetails && (
            <Card>
              <Descriptions bordered column={2}>
                <Descriptions.Item label="Nhà Cung Cấp">
                  {poDetails.suppliers.name}
                </Descriptions.Item>
                <Descriptions.Item label="Ngày tạo đơn">
                  {dayjs(poDetails.created_at).format("DD/MM/YYYY")}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          )}
          <Title level={4}>Bảng Đối soát và Nhập liệu</Title>
          <Table
            dataSource={orderItems}
            columns={columns}
            rowKey="key"
            pagination={false}
          />
        </Space>
      </Spin>
      <Modal
        title="Tải lên Hóa đơn VAT"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Upload.Dragger
          name="file"
          multiple={false}
          customRequest={handleScanInvoice}
          showUploadList={false}
          accept="application/pdf,image/png,image/jpeg"
        >
          <p className="ant-upload-drag-icon">
            <UploadOutlined />
          </p>
          <p className="ant-upload-text">
            Kéo thả file PDF/ảnh hóa đơn vào đây hoặc bấm để chọn file
          </p>
          <p className="ant-upload-hint">
            Hệ thống sẽ tự động đọc và đối soát với đơn hàng hiện tại.
          </p>
        </Upload.Dragger>
      </Modal>
    </>
  );
};

const ReceivePurchaseOrder: React.FC = () => (
  <AntApp>
    <ReceivePurchaseOrderContent />
  </AntApp>
);

export default ReceivePurchaseOrder;
