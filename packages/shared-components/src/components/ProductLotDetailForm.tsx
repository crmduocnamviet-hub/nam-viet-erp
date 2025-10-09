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
import { FETCH_QUERY_KEY, useQuery } from "@nam-viet-erp/store";

type ProductLotForm = Omit<
  IProductLot,
  "id" | "product_id" | "created_at" | "updated_at"
> & {
  expiry_date: Date | dayjs.Dayjs | any;
  received_date: Date | dayjs.Dayjs | any;
};

const ProductLotDetailForm: React.FC<{ lotId: number }> = ({ lotId }) => {
  const { data, refetch } = useQuery<IProductLot>({
    key: [FETCH_QUERY_KEY.PRODUCT_LOT, lotId],
  });
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [form] = Form.useForm<ProductLotForm>();
  // Calculate days until expiry
  const daysUntilExpiry = useMemo(() => {
    if (!data?.expiry_date) return null;
    const expiryDate = dayjs(data.expiry_date);
    return expiryDate.isValid() ? expiryDate.diff(dayjs(), "day") : null;
  }, [data]);

  useEffect(() => {
    // Only set date if valid
    const expiryDate =
      data?.expiry_date && dayjs(data.expiry_date).isValid()
        ? dayjs(data.expiry_date)
        : null;
    const receivedDate =
      data?.received_date && dayjs(data.received_date).isValid()
        ? dayjs(data.received_date)
        : null;

    form.setFieldsValue({
      batch_code: data?.batch_code,
      lot_number: data?.lot_number,
      expiry_date: expiryDate,
      received_date: receivedDate,
    });
  }, [data]);

  // Calculate status
  const getStatus = () => {
    if (!data?.expiry_date || !dayjs(data.expiry_date).isValid()) {
      return { text: "Còn hạn", color: "green" };
    }
    const isExpired = daysUntilExpiry !== null && daysUntilExpiry <= 0;
    return {
      text: isExpired ? "Hết hạn" : "Còn hạn",
      color: isExpired ? "red" : "green",
    };
  };

  const status = data ? getStatus() : { text: "Còn hạn", color: "green" };

  const onFinish = async (values: ProductLotForm) => {
    setIsSaving(true);
    try {
      const { error } = await updateProductLot(data.id, {
        expiry_date: values.expiry_date
          ? dayjs(values.expiry_date).format("YYYY-MM-DD")
          : null,
        received_date: values.received_date
          ? dayjs(values.received_date).format("YYYY-MM-DD")
          : null,
      });

      if (error) throw error;

      await refetch();

      notification.success({ message: "Thông tin lô hàng đã được cập nhật!" });
    } catch (e) {}
    setIsSaving(false);
  };

  return (
    <Form form={form} onFinish={onFinish}>
      <Card title="Thông tin lô">
        <Descriptions bordered column={1}>
          <Descriptions.Item label="Số lô">
            <p>{data?.lot_number || "--"}</p>
          </Descriptions.Item>
          <Descriptions.Item label="Sản phẩm">
            <b>{data?.products?.name}</b>
          </Descriptions.Item>
          <Descriptions.Item label="Mã lô">
            <p>{data?.batch_code || "--"}</p>
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
