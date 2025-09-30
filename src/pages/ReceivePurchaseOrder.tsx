// src/pages/ReceivePurchaseOrder.tsx

import React, { useState, useEffect, useCallback, useRef } from "react";
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
  Modal,
  Grid,
  List,
  Avatar,
} from "antd";
import type { TableProps } from "antd";
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CameraOutlined,
  DeleteOutlined,
  QrcodeOutlined,
} from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import dayjs from "dayjs";
import CameraScanner from "../features/warehouse/components/CameraScanner";
import SpeechToTextInput from "../features/warehouse/components/SpeechToTextInput";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const ReceivePurchaseOrderContent: React.FC = () => {
  const { notification, modal } = AntApp.useApp();
  const screens = useBreakpoint();
  const params = useParams();
  const navigate = useNavigate();
  const poId = params.id;

  const [loading, setLoading] = useState(true);
  const [poDetails, setPoDetails] = useState<any>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [setIsAiModalOpen] = useState(false);
  const [isManualScanModalOpen, setIsManualScanModalOpen] = useState(false);
  const inputRefs = useRef<Record<string, any>>({});

  const fetchData = useCallback(async () => {
    if (!poId) return;
    setLoading(true);
    try {
      const { data: poData, error: poError } = await supabase
        .from("purchase_orders")
        .select("*, suppliers(name)")
        .eq("id", poId)
        .single();
      if (poError) throw poError;
      setPoDetails(poData);

      const { data: itemsData, error: itemsError } = await supabase
        .from("purchase_order_items")
        .select("*, products(*)")
        .eq("po_id", poId);
      if (itemsError) throw itemsError;

      const formattedItems = itemsData.map((item) => ({
        key: item.products.id,
        product_id: item.products.id,
        products: item.products,
        name: item.products.name,
        sku: item.products.sku,
        image_url: item.products.image_url,
        ordered_quantity: item.quantity,
        invoice_quantity: item.invoiced_quantity ?? item.quantity,
        received_quantity: item.received_quantity ?? item.quantity,
        lot_number: "",
        expiry_date: null,
      }));
      setOrderItems(formattedItems);
    } catch (error: any) {
      notification.error({
        message: "Lỗi tải chi tiết đơn hàng",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  }, [poId, notification]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleItemChange = (productId: number, field: string, value: any) => {
    setOrderItems((prev) =>
      prev.map((item) =>
        item.product_id === productId ? { ...item, [field]: value } : item
      )
    );
  };

  const handleRemoveItem = (productId: number) => {
    setOrderItems((prev) =>
      prev.filter((item) => item.product_id !== productId)
    );
  };

  const handleScanSuccess = async (scannedBarcode: string) => {
    notification.success({
      message: `Đã quét: ${scannedBarcode}`,
      duration: 2,
    });
    const productInOrder = orderItems.find(
      (item) => item.products?.barcode === scannedBarcode
    );

    if (productInOrder) {
      const inputRef = inputRefs.current[productInOrder.product_id]?.lot_number;
      if (inputRef) {
        inputRef.focus();
      }
    } else {
      const { data: productData } = await supabase
        .from("products")
        .select("*")
        .eq("barcode", scannedBarcode)
        .single();

      if (productData) {
        modal.confirm({
          title: "Sản phẩm không có trong đơn hàng",
          content: `Sản phẩm "${productData.name}" không nằm trong đơn đặt hàng này. Bạn có muốn thêm vào không?`,
          okText: "Thêm vào",
          onOk: () => {
            const newItem = {
              key: productData.id,
              product_id: productData.id,
              products: productData,
              name: productData.name,
              sku: productData.sku,
              image_url: productData.image_url,
              ordered_quantity: 0,
              received_quantity: 1,
            };
            setOrderItems((prev) => [...prev, newItem]);
          },
        });
      } else {
        notification.error({
          message: "Không tìm thấy sản phẩm với mã vạch này trong hệ thống.",
        });
      }
    }
  };

  // const handleScanInvoice = () => {
  //     notification.info({message: "Chức năng AI đang được phát triển"});
  // };

  const handleCompleteReceiving = () => {
    notification.info({ message: "Chức năng đang được phát triển" });
  };
  // THAY THẾ TOÀN BỘ BIẾN `columns` BẰNG PHIÊN BẢN NÀY
  const columns: TableProps<any>["columns"] = [
    {
      title: "Sản phẩm",
      dataIndex: "name",
      key: "name",
      render: (text: string, record: any) => (
        <div>
          <Text strong>{text}</Text>
          <div>SKU: {record.sku}</div>
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
      title: "SL Thực Nhận",
      dataIndex: "received_quantity",
      key: "received_quantity",
      width: 120,
      render: (text: number, record: any) => (
        <InputNumber
          ref={(el) => {
            if (!inputRefs.current[record.product_id])
              inputRefs.current[record.product_id] = {};
            inputRefs.current[record.product_id].received_quantity = el;
          }}
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
      title: "Số Lô",
      dataIndex: "lot_number",
      key: "lot_number",
      width: 180,
      render: (text: string, record: any) => (
        <SpeechToTextInput
          value={text}
          onConfirm={(value) =>
            handleItemChange(record.product_id, "lot_number", value)
          }
        />
      ),
    },
    {
      title: "Hạn Dùng",
      dataIndex: "expiry_date",
      key: "expiry_date",
      width: 180,
      render: (text: string, record: any) => (
        <SpeechToTextInput
          value={text}
          onConfirm={(value) =>
            handleItemChange(record.product_id, "expiry_date", value)
          }
        />
      ),
    },
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

  const renderDesktop = () => (
    <Table
      dataSource={orderItems}
      columns={columns}
      rowKey="key"
      pagination={false}
    />
  );

  const renderMobile = () => (
    <List
      dataSource={orderItems}
      renderItem={(item) => (
        <List.Item>
          <Card style={{ width: "100%" }} styles={{ body: { padding: 16 } }}>
            <List.Item.Meta
              avatar={<Avatar shape="square" size={64} src={item.image_url} />}
              title={<Text strong>{item.name}</Text>}
              description={`SKU: ${item.sku} | SL Đặt: ${item.ordered_quantity}`}
            />
            <Row gutter={[8, 8]} style={{ marginTop: 16 }}>
              <Col span={12}>
                <Form.Item label="SL Thực Nhận" style={{ marginBottom: 0 }}>
                  <InputNumber
                    min={0}
                    value={item.received_quantity}
                    onChange={(val) =>
                      handleItemChange(
                        item.product_id,
                        "received_quantity",
                        val
                      )
                    }
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Số Lô" style={{ marginBottom: 0 }}>
                  <Input
                    value={item.lot_number}
                    onChange={(e) =>
                      handleItemChange(
                        item.product_id,
                        "lot_number",
                        e.target.value
                      )
                    }
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Hạn Dùng" style={{ marginBottom: 0 }}>
                  <Input
                    type="date"
                    value={item.expiry_date}
                    onChange={(e) =>
                      handleItemChange(
                        item.product_id,
                        "expiry_date",
                        e.target.value
                      )
                    }
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label=" " style={{ marginBottom: 0 }}>
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemoveItem(item.product_id)}
                    block
                  >
                    Xóa
                  </Button>
                </Form.Item>
              </Col>
            </Row>
          </Card>
        </List.Item>
      )}
    />
  );

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
              <Title level={screens.md ? 2 : 4} style={{ marginBottom: 0 }}>
                Nhập Kho PO-{String(poId).padStart(5, "0")}
              </Title>
            </Space>
          </Col>
          <Col>
            <Space wrap>
              <Button
                icon={<QrcodeOutlined />}
                onClick={() => setIsManualScanModalOpen(true)}
              >
                Kiểm hàng thủ công
              </Button>

              <Button
                icon={<CameraOutlined />}
                onClick={() => setIsAiModalOpen(true)}
              >
                Đối soát HĐ [AI]
              </Button>
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={handleCompleteReceiving}
              >
                Hoàn tất Nhận hàng
              </Button>
            </Space>
          </Col>
        </Row>
        {poDetails && (
          <Card>
            <Descriptions bordered column={screens.md ? 2 : 1} size="small">
              <Descriptions.Item label="Nhà Cung Cấp">
                {poDetails.suppliers.name}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày tạo đơn">
                {dayjs(poDetails.created_at).format("DD/MM/YYYY")}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        )}
        <Title level={4}>Danh sách Sản phẩm</Title>
        {screens.md ? renderDesktop() : renderMobile()}
      </Space>
      <Modal
        title="Kiểm hàng Thủ công bằng Camera"
        open={isManualScanModalOpen}
        onCancel={() => setIsManualScanModalOpen(false)}
        footer={null}
        width="90vw"
        destroyOnClose
      >
        {isManualScanModalOpen && (
          <CameraScanner
            onScanSuccess={handleScanSuccess}
            isActive={isManualScanModalOpen}
          />
        )}
      </Modal>
    </Spin>
  );
};

const ReceivePurchaseOrder: React.FC = () => (
  <AntApp>
    <ReceivePurchaseOrderContent />
  </AntApp>
);

export default ReceivePurchaseOrder;
