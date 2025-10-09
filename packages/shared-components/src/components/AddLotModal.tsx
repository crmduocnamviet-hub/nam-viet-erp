import React, { useEffect, useState } from "react";
import {
  Modal,
  Form,
  Row,
  Col,
  Select,
  Input,
  DatePicker,
  InputNumber,
  Button,
  App,
  Tooltip,
  Space,
} from "antd";
import { AudioOutlined, AudioMutedOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import {
  createProductLotWithInventory,
  getProductLots,
} from "@nam-viet-erp/services";
import { useSpeechToText } from "../hooks/useSpeechToText";

interface AddLotModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  productId: number;
  warehouses: any[];
}

const AddLotModal: React.FC<AddLotModalProps> = ({
  open,
  onClose,
  onSuccess,
  productId,
  warehouses,
}) => {
  const [form] = Form.useForm();
  const { notification } = App.useApp();
  const [saving, setSaving] = useState(false);
  const b2bWarehouse = warehouses.find((wh) => wh.is_b2b_warehouse === true);

  // Speech-to-text for lot_number
  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    isSupported,
  } = useSpeechToText({
    lang: "vi-VN", // Vietnamese
    continuous: false,
    interimResults: false,
    onResult: (text) => {
      // Remove all spaces and convert to uppercase
      const cleanedText = text.replace(/\s+/g, "").toUpperCase();

      // Update lot_number field with cleaned text
      form.setFieldValue("lot_number", cleanedText);
      notification.success({
        message: "Nhận diện giọng nói thành công",
        description: `Đã nhập: "${cleanedText}"`,
        duration: 2,
      });
    },
    onError: (error) => {
      notification.error({
        message: "Lỗi nhận diện giọng nói",
        description: error,
        duration: 3,
      });
    },
  });

  useEffect(() => {
    if (b2bWarehouse) {
      form.setFieldValue("warehouse_id", b2bWarehouse.id);
    }
  }, [b2bWarehouse]);

  // Update form when transcript changes
  useEffect(() => {
    if (transcript) {
      // Remove spaces and convert to uppercase
      const cleanedText = transcript.replace(/\s+/g, "").toUpperCase();
      form.setFieldValue("lot_number", cleanedText);
    }
  }, [transcript, form]);

  const handleFinish = async (values: any) => {
    setSaving(true);
    try {
      // Check for duplicate lot_number in the same warehouse
      const { data: existingLots } = await getProductLots({
        productId,
        warehouseId: values.warehouse_id,
      });

      const isDuplicate = existingLots?.some(
        (lot: IProductLot) =>
          lot.lot_number?.toLowerCase() === values.lot_number?.toLowerCase(),
      );

      if (isDuplicate) {
        notification.error({
          message: "Số lô đã tồn tại",
          description: `Số lô "${values.lot_number}" đã tồn tại trong kho này. Vui lòng sử dụng số lô khác.`,
        });
        setSaving(false);
        return;
      }

      const lotData = {
        product_id: productId,
        warehouse_id: values.warehouse_id,
        lot_number: values.lot_number,
        batch_code: values.batch_code || undefined,
        expiry_date: values.expiry_date
          ? dayjs(values.expiry_date).format("YYYY-MM-DD")
          : undefined,
        received_date: values.received_date
          ? dayjs(values.received_date).format("YYYY-MM-DD")
          : undefined,
        quantity: values.quantity || 0,
      };

      const { error } = await createProductLotWithInventory(lotData);

      if (error) throw error;

      notification.success({
        message: "Thành công!",
        description: "Lô hàng đã được tạo và đồng bộ tồn kho.",
      });

      // Reset form
      form.resetFields();

      // Call onSuccess first (triggers loading state)
      onSuccess();

      // Close modal after a short delay
      setTimeout(() => {
        onClose();
      }, 100);
    } catch (error: any) {
      // Check for duplicate lot_number error
      const isDuplicate =
        error.message?.includes("unique_lot_number_per_warehouse_product") ||
        error.message?.includes("duplicate key") ||
        error.code === "23505";

      notification.error({
        message: isDuplicate ? "Số lô đã tồn tại" : "Lỗi tạo lô hàng",
        description: isDuplicate
          ? `Số lô "${values.lot_number}" đã tồn tại trong kho này. Vui lòng sử dụng số lô khác.`
          : error.message || "Không thể tạo lô hàng.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    resetTranscript();
    if (isListening) {
      stopListening();
    }
    onClose();
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <>
      <style>
        {`
          @keyframes pulse {
            0% {
              box-shadow: 0 0 0 0 rgba(255, 77, 79, 0.7);
            }
            70% {
              box-shadow: 0 0 0 10px rgba(255, 77, 79, 0);
            }
            100% {
              box-shadow: 0 0 0 0 rgba(255, 77, 79, 0);
            }
          }
        `}
      </style>
      <Modal
        title="Thêm lô hàng mới"
        open={open}
        onCancel={handleCancel}
        footer={null}
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleFinish}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="warehouse_id"
                label="Kho"
                rules={[{ required: true, message: "Vui lòng chọn kho" }]}
              >
                <Select
                  placeholder="Chọn kho"
                  options={warehouses.map((wh) => ({
                    value: wh.id,
                    label: wh.name,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="lot_number"
                label={
                  <Space>
                    <span>Số lô</span>
                    {!isSupported && (
                      <Tooltip title="Trình duyệt không hỗ trợ nhận diện giọng nói">
                        <span style={{ color: "#999", fontSize: 12 }}>
                          (Không hỗ trợ speech)
                        </span>
                      </Tooltip>
                    )}
                  </Space>
                }
                rules={[{ required: true, message: "Vui lòng nhập số lô" }]}
              >
                <Input
                  placeholder="Ví dụ: LOT001"
                  onChange={(e) => {
                    // Convert to uppercase automatically
                    const upperValue = e.target.value.toUpperCase();
                    form.setFieldValue("lot_number", upperValue);
                  }}
                  suffix={
                    isSupported && (
                      <Tooltip
                        title={
                          isListening
                            ? "Đang nghe... Nhấn để dừng"
                            : "Nhấn để nói số lô"
                        }
                      >
                        <Button
                          type={isListening ? "primary" : "default"}
                          danger={isListening}
                          icon={
                            isListening ? (
                              <AudioOutlined />
                            ) : (
                              <AudioMutedOutlined />
                            )
                          }
                          onClick={toggleListening}
                          size="small"
                          style={{
                            border: "none",
                            background: isListening ? "#ff4d4f" : "transparent",
                            animation: isListening
                              ? "pulse 1.5s infinite"
                              : "none",
                          }}
                        />
                      </Tooltip>
                    )
                  }
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="batch_code" label="Mã lô">
                <Input placeholder="Ví dụ: BATCH001" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="received_date" label="Ngày nhận">
                <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="expiry_date" label="Hạn sử dụng">
                <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="quantity"
                label="Số lượng"
                rules={[{ required: true, message: "Vui lòng nhập số lượng" }]}
                initialValue={0}
              >
                <InputNumber
                  placeholder="Nhập số lượng"
                  style={{ width: "100%" }}
                  min={0}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row justify="end" gutter={8} style={{ marginTop: 16 }}>
            <Col>
              <Button onClick={handleCancel}>Hủy</Button>
            </Col>
            <Col>
              <Button type="primary" htmlType="submit" loading={saving}>
                Tạo lô hàng
              </Button>
            </Col>
          </Row>
        </Form>
      </Modal>
    </>
  );
};

export default AddLotModal;
