import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  App,
  Row,
  Col,
  Divider,
  notification,
} from "antd";
import dayjs from "dayjs";

interface EditPurchaseOrderModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  purchaseOrder: any;
  suppliers: any[];
}

const EditPurchaseOrderModal: React.FC<EditPurchaseOrderModalProps> = ({
  open,
  onClose,
  onSuccess,
  purchaseOrder,
  suppliers,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && purchaseOrder) {
      form.setFieldsValue({
        supplier_id: purchaseOrder.supplier_id,
        order_date: purchaseOrder.order_date
          ? dayjs(purchaseOrder.order_date)
          : null,
        expected_delivery_date: purchaseOrder.expected_delivery_date
          ? dayjs(purchaseOrder.expected_delivery_date)
          : null,
        status: purchaseOrder.status,
        notes: purchaseOrder.notes,
      });
    }
  }, [open, purchaseOrder, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // Import the service function
      const { updatePurchaseOrder } = await import(
        "@nam-viet-erp/services/src/purchaseOrderService"
      );

      const updates = {
        supplier_id: values.supplier_id,
        order_date: values.order_date?.format("YYYY-MM-DD"),
        expected_delivery_date:
          values.expected_delivery_date?.format("YYYY-MM-DD"),
        status: values.status,
        notes: values.notes,
      };

      const { data, error } = await updatePurchaseOrder(
        purchaseOrder.id,
        updates,
      );

      if (error) {
        throw error;
      }

      notification.success({
        message: "Thành công",
        description: "Đã cập nhật đơn đặt hàng",
      });

      form.resetFields();
      onSuccess();
      onClose();
    } catch (error: any) {
      notification.error({
        message: "Lỗi",
        description: error.message || "Không thể cập nhật đơn đặt hàng",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title={`Chỉnh Sửa Đơn Đặt Hàng - ${purchaseOrder?.po_number || ""}`}
      open={open}
      onOk={handleSubmit}
      onCancel={handleCancel}
      okText="Lưu"
      cancelText="Hủy"
      confirmLoading={loading}
      width={700}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          status: "draft",
        }}
      >
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="supplier_id"
              label="Nhà Cung Cấp"
              rules={[
                { required: true, message: "Vui lòng chọn nhà cung cấp" },
              ]}
            >
              <Select
                showSearch
                placeholder="Chọn nhà cung cấp"
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option?.label ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                options={suppliers.map((supplier) => ({
                  value: supplier.id,
                  label: supplier.name,
                }))}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="order_date"
              label="Ngày Đặt Hàng"
              rules={[
                { required: true, message: "Vui lòng chọn ngày đặt hàng" },
              ]}
            >
              <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="expected_delivery_date" label="Ngày Dự Kiến Giao">
              <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="status"
              label="Trạng Thái"
              rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}
            >
              <Select placeholder="Chọn trạng thái">
                <Select.Option value="draft">Nháp</Select.Option>
                <Select.Option value="sent">Đã gửi</Select.Option>
                <Select.Option value="ordered">Đã đặt hàng</Select.Option>
                <Select.Option value="partially_received">
                  Nhận một phần
                </Select.Option>
                <Select.Option value="received">Hoàn thành</Select.Option>
                <Select.Option value="cancelled">Đã hủy</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <div style={{ paddingTop: 30 }}>
              <strong>Tổng Tiền:</strong>{" "}
              {purchaseOrder?.total_amount?.toLocaleString("vi-VN", {
                style: "currency",
                currency: "VND",
              })}
            </div>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item name="notes" label="Ghi Chú">
              <Input.TextArea
                rows={4}
                placeholder="Nhập ghi chú cho đơn hàng..."
              />
            </Form.Item>
          </Col>
        </Row>

        <Divider />

        <div style={{ color: "#888", fontSize: 12 }}>
          <div>
            <strong>Số Đơn:</strong> {purchaseOrder?.po_number}
          </div>
          <div>
            <strong>Số Sản Phẩm:</strong> {purchaseOrder?.items?.length || 0}
          </div>
          <div style={{ marginTop: 8, color: "#666" }}>
            <em>
              Lưu ý: Để chỉnh sửa các sản phẩm trong đơn hàng, vui lòng sử dụng
              chức năng xem chi tiết đơn hàng.
            </em>
          </div>
        </div>
      </Form>
    </Modal>
  );
};

export default EditPurchaseOrderModal;
