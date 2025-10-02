import React from "react";
import {
  Modal,
  Button,
  Form,
  Select,
  Tag,
  Typography,
} from "antd";

const { Text } = Typography;

interface BulkUpdateModalProps {
  open: boolean;
  onCancel: () => void;
  form: any;
  selectedOrderCount: number;
  loading: boolean;
  onBulkUpdate: (values: any) => Promise<void>;
  getAllowedStatuses: () => any[];
}

const BulkUpdateModal: React.FC<BulkUpdateModalProps> = ({
  open,
  onCancel,
  form,
  selectedOrderCount,
  loading,
  onBulkUpdate,
  getAllowedStatuses,
}) => {
  return (
    <Modal
      title={`Cập nhật trạng thái hàng loạt (${selectedOrderCount} đơn hàng)`}
      open={open}
      closable={!loading}
      maskClosable={!loading}
      onCancel={() => {
        if (!loading) {
          onCancel();
        }
      }}
      footer={[
        <Button
          key="cancel"
          disabled={loading}
          onClick={onCancel}
        >
          Hủy
        </Button>,
        <Button
          key="update"
          type="primary"
          loading={loading}
          onClick={async () => {
            try {
              const values = await form.validateFields();
              onBulkUpdate(values);
            } catch (error) {
              console.error("Validation failed:", error);
            }
          }}
        >
          Cập nhật trạng thái
        </Button>,
      ]}
      width={600}
    >
      <div style={{ marginBottom: 16 }}>
        <Text type="secondary">
          Trạng thái mới sẽ được áp dụng cho {selectedOrderCount} đơn
          hàng đã chọn
        </Text>
      </div>

      <Form layout="vertical" form={form}>
        <Form.Item
          name="quote_stage"
          label="Trạng thái đơn hàng mới"
          rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}
        >
          <Select placeholder="Chọn trạng thái đơn hàng mới" size="large">
            {getAllowedStatuses().map((stage) => (
              <Select.Option key={stage.key} value={stage.key}>
                <Tag color={stage.color}>{stage.title}</Tag> -{" "}
                {stage.description}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default BulkUpdateModal;