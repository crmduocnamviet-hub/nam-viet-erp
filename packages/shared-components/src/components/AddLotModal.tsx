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
} from "antd";
import dayjs from "dayjs";
import { createProductLotWithInventory } from "@nam-viet-erp/services";

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

  useEffect(() => {
    if (b2bWarehouse) {
      form.setFieldValue("warehouse_id", b2bWarehouse.id);
    }
  }, [b2bWarehouse]);

  const handleFinish = async (values: any) => {
    setSaving(true);
    try {
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
      notification.error({
        message: "Lỗi tạo lô hàng",
        description: error.message || "Không thể tạo lô hàng.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
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
              label="Số lô"
              rules={[{ required: true, message: "Vui lòng nhập số lô" }]}
            >
              <Input placeholder="Ví dụ: LOT001" />
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
  );
};

export default AddLotModal;
