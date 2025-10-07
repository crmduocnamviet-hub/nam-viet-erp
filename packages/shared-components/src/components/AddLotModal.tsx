import React, { useState } from "react";
import {
  Modal,
  Form,
  Row,
  Col,
  Select,
  Input,
  DatePicker,
  InputNumber,
  Checkbox,
  Button,
  App,
} from "antd";
import dayjs from "dayjs";
import { createProductLot } from "@nam-viet-erp/services";

interface AddLotModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  productId: number;
  warehouses: any[];
  defaultCostPrice?: number;
}

const AddLotModal: React.FC<AddLotModalProps> = ({
  open,
  onClose,
  onSuccess,
  productId,
  warehouses,
  defaultCostPrice = 0,
}) => {
  const [form] = Form.useForm();
  const { notification } = App.useApp();
  const [saving, setSaving] = useState(false);

  const handleFinish = async (values: any) => {
    setSaving(true);
    try {
      const unitCost = values.final_unit_cost || 0;
      // If has VAT, calculate unit_price_before_vat (divide by 1.1 to get pre-VAT price)
      // Otherwise, they're the same
      const hasVat = values.has_vat_invoice || false;
      const unitPriceBeforeVat = hasVat ? unitCost / 1.1 : unitCost;
      const unitPriceWithVat = unitCost;

      const lotData = {
        product_id: productId,
        warehouse_id: values.warehouse_id,
        lot_number: values.lot_number,
        expiry_date: values.expiry_date
          ? dayjs(values.expiry_date).format("YYYY-MM-DD")
          : null,
        manufacturing_date: values.manufacturing_date
          ? dayjs(values.manufacturing_date).format("YYYY-MM-DD")
          : null,
        quantity_received: values.quantity_received || 0,
        quantity_available: values.quantity_received || 0,
        unit_price_before_vat: unitPriceBeforeVat,
        unit_price_with_vat: unitPriceWithVat,
        final_unit_cost: unitCost,
        shelf_location: values.shelf_location || null,
        has_vat_invoice: hasVat,
      };

      const { error } = await createProductLot(lotData);

      if (error) throw error;

      notification.success({
        message: "Thành công!",
        description: "Lô hàng đã được tạo thành công.",
      });

      // Reset form and close modal
      form.resetFields();
      onClose();
      onSuccess();
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

  // Set default cost price when modal opens
  React.useEffect(() => {
    if (open && defaultCostPrice) {
      form.setFieldsValue({ final_unit_cost: defaultCostPrice });
    }
  }, [open, defaultCostPrice, form]);

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
            <Form.Item name="expiry_date" label="Hạn sử dụng (HSD)">
              <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="manufacturing_date" label="Ngày sản xuất (NSX)">
              <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="quantity_received"
              label="Số lượng nhập"
              rules={[{ required: true, message: "Vui lòng nhập số lượng" }]}
            >
              <InputNumber
                style={{ width: "100%" }}
                min={0}
                placeholder="0"
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="final_unit_cost"
              label="Giá vốn"
              rules={[{ required: true, message: "Vui lòng nhập giá vốn" }]}
            >
              <InputNumber
                style={{ width: "100%" }}
                min={0}
                placeholder="0"
                addonAfter="VNĐ"
                formatter={(value) =>
                  `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
                }
                parser={(value) => value!.replace(/\./g, "") as never}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="shelf_location" label="Vị trí kệ">
              <Input placeholder="Ví dụ: A1-R3-L2" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="has_vat_invoice" valuePropName="checked">
              <Checkbox>Có hóa đơn VAT</Checkbox>
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
