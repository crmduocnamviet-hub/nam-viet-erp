import {
  Card,
  DatePicker,
  Descriptions,
  Form,
  notification,
  Space,
  Tag,
} from "antd";
import React, { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import ConfirmButton from "./SubmitButton";
import { updateProductLot } from "@nam-viet-erp/services";

type ProductLotForm = Omit<
  IProductLot,
  "id" | "product_id" | "created_at" | "updated_at"
> & {
  expiry_date: Date | dayjs.Dayjs | any;
  received_date: Date | dayjs.Dayjs | any;
};

const ProductLotDetailForm: React.FC<{ lot: IProductLot }> = ({ lot }) => {
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [form] = Form.useForm<ProductLotForm>();
  // Calculate days until expiry
  const daysUntilExpiry = useMemo(
    () =>
      lot?.expiry_date ? dayjs(lot.expiry_date).diff(dayjs(), "day") : null,
    [lot]
  );

  useEffect(() => {
    form.setFieldsValue({
      batch_code: lot?.batch_code,
      lot_number: lot?.lot_number,
      expiry_date: dayjs(lot?.expiry_date),
      received_date: dayjs(lot?.received_date),
    });
  }, [lot]);

  // Calculate status
  const getStatus = () => {
    if (!lot.expiry_date) {
      return { text: "Còn hạn", color: "green" };
    }
    const isExpired = daysUntilExpiry !== null && daysUntilExpiry <= 0;
    return {
      text: isExpired ? "Hết hạn" : "Còn hạn",
      color: isExpired ? "red" : "green",
    };
  };

  const status = getStatus();

  const onFinish = async (values: ProductLotForm) => {
    setIsSaving(true);
    try {
      const { error } = await updateProductLot(lot.id, {
        expiry_date: values.expiry_date
          ? dayjs(values.expiry_date).format("YYYY-MM-DD")
          : null,
        received_date: values.received_date
          ? dayjs(values.received_date).format("YYYY-MM-DD")
          : null,
      });

      if (error) throw error;

      notification.success({ message: "Thông tin lô hàng đã được cập nhật!" });
    } catch (e) {}
    setIsSaving(false);
  };

  return (
    <Form form={form} onFinish={onFinish}>
      <Card title="Thông tin lô">
        <Descriptions bordered column={1}>
          <Descriptions.Item label="Số lô">
            <p>{lot?.lot_number || "--"}</p>
          </Descriptions.Item>
          <Descriptions.Item label="Sản phẩm">
            <b>{lot?.products?.name}</b>
          </Descriptions.Item>
          <Descriptions.Item label="Mã lô">
            <p>{lot?.batch_code || "--"}</p>
          </Descriptions.Item>
          <Descriptions.Item label="Trạng thái">
            <Tag color={status.color}>{status.text}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Ngày nhận">
            <Space>
              <Form.Item name="received_date">
                <DatePicker format="DD/MM/YYYY" />
              </Form.Item>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Hạn sử dụng">
            <Space>
              <Form.Item name="expiry_date">
                <DatePicker format="DD/MM/YYYY" />
              </Form.Item>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Còn lại">
            {daysUntilExpiry !== null ? `${daysUntilExpiry} ngày` : "-"}
          </Descriptions.Item>
        </Descriptions>
        <ConfirmButton hideCancelButton loading={isSaving} />
      </Card>
    </Form>
  );
};

export default ProductLotDetailForm;
