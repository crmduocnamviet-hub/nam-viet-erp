import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  Button,
  DatePicker,
  Select,
  App,
  Typography,
} from "antd";
import { EditOutlined, SaveOutlined } from "@ant-design/icons";
import { updatePatient } from "@nam-viet-erp/services";
import dayjs from "dayjs";
import { getErrorMessage } from "../../../../../../packages/shared-components/src/utils";

const { Text } = Typography;

interface EditPatientModalProps {
  open: boolean;
  onClose: () => void;
  patientId: string | null;
  patientData: any | null;
  onPatientUpdated: (updatedData: any) => void;
}

const EditPatientModal: React.FC<EditPatientModalProps> = ({
  open,
  onClose,
  patientId,
  patientData,
  onPatientUpdated,
}) => {
  const { notification } = App.useApp();
  const [form] = Form.useForm();
  const [isUpdating, setIsUpdating] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Populate form when patient data changes
  useEffect(() => {
    if (open && patientData) {
      form.setFieldsValue({
        full_name: patientData.full_name || "",
        phone_number: patientData.phone_number || "",
        date_of_birth: patientData.date_of_birth
          ? dayjs(patientData.date_of_birth)
          : null,
        gender: patientData.gender || "",
        address: patientData.address || "",
        allergy_notes: patientData.allergy_notes || "",
        chronic_diseases: patientData.chronic_diseases || "",
        is_b2b_customer: patientData.is_b2b_customer || false,
      });
      setHasUnsavedChanges(false);
    }
  }, [open, patientData, form]);

  const handleUpdatePatient = async (values: any) => {
    if (!patientId) return;
    setIsUpdating(true);
    try {
      const updateData = {
        ...values,
        date_of_birth: values.date_of_birth
          ? values.date_of_birth.format("YYYY-MM-DD")
          : null,
      };

      const { error } = await updatePatient(patientId, updateData);
      if (error) throw error;

      // Notify parent component about the update
      onPatientUpdated(updateData);
      setHasUnsavedChanges(false);

      notification?.success({
        message: "Thành công!",
        description: "Đã cập nhật thông tin bệnh nhân thành công",
      });

      // Close modal after successful update
      onClose();
    } catch (error: unknown) {
      notification.error({
        message: "Lỗi cập nhật thông tin",
        description: getErrorMessage(error),
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      Modal.confirm({
        title: "Bỏ các thay đổi?",
        content:
          "Bạn có thay đổi chưa lưu. Bạn có chắc muốn bỏ các thay đổi này?",
        okText: "Bỏ thay đổi",
        cancelText: "Tiếp tục chỉnh sửa",
        onOk: () => {
          setHasUnsavedChanges(false);
          onClose();
        },
      });
    } else {
      onClose();
    }
  };

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <EditOutlined style={{ color: "#1890ff" }} />
          <span>Chỉnh sửa thông tin bệnh nhân</span>
          {hasUnsavedChanges && (
            <Text style={{ color: "#faad14", fontSize: 12 }}>
              ● Có thay đổi chưa lưu
            </Text>
          )}
        </div>
      }
      open={open}
      onCancel={handleCancel}
      footer={null}
      width={600}
      maskClosable={false}
    >
      <div
        style={{
          padding: "16px 0",
          backgroundColor: "#fafafa",
          borderRadius: 8,
          margin: "16px 0",
        }}
      >
        <Text
          type="secondary"
          style={{ display: "block", textAlign: "center" }}
        >
          📝 Cập nhật thông tin cá nhân và y tế của bệnh nhân
        </Text>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleUpdatePatient}
        onValuesChange={() => setHasUnsavedChanges(true)}
      >
        <Form.Item
          name="full_name"
          label="Họ và tên"
          rules={[
            { required: true, message: "Vui lòng nhập họ tên" },
            { min: 2, message: "Họ tên phải có ít nhất 2 ký tự" },
          ]}
        >
          <Input placeholder="Nhập họ và tên đầy đủ" size="large" />
        </Form.Item>

        <Form.Item
          name="phone_number"
          label="Số điện thoại"
          rules={[
            { required: true, message: "Vui lòng nhập số điện thoại" },
            {
              pattern: /^[0-9]{10,11}$/,
              message: "Số điện thoại phải có 10-11 chữ số",
            },
          ]}
        >
          <Input placeholder="Nhập số điện thoại (10-11 chữ số)" size="large" />
        </Form.Item>

        <Form.Item name="date_of_birth" label="Ngày sinh">
          <DatePicker
            style={{ width: "100%" }}
            size="large"
            format="DD/MM/YYYY"
            placeholder="Chọn ngày sinh"
            disabledDate={(current) =>
              current && current.isAfter(dayjs(), "day")
            }
          />
        </Form.Item>

        <Form.Item name="gender" label="Giới tính">
          <Select placeholder="Chọn giới tính" allowClear size="large">
            <Select.Option value="Nam">👨 Nam</Select.Option>
            <Select.Option value="Nữ">👩 Nữ</Select.Option>
            <Select.Option value="Khác">🤷 Khác</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item name="address" label="Địa chỉ">
          <Input.TextArea
            rows={3}
            placeholder="Nhập địa chỉ thường trú"
            showCount
            maxLength={200}
          />
        </Form.Item>

        <Form.Item name="allergy_notes" label="Ghi chú dị ứng">
          <Input.TextArea
            rows={3}
            placeholder="Ghi chú các loại thuốc, thực phẩm dị ứng..."
            showCount
            maxLength={500}
          />
        </Form.Item>

        <Form.Item name="chronic_diseases" label="Bệnh mãn tính">
          <Input.TextArea
            rows={3}
            placeholder="Ghi chú các bệnh mãn tính đang điều trị..."
            showCount
            maxLength={500}
          />
        </Form.Item>

        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "flex-end",
            borderTop: "1px solid #f0f0f0",
            paddingTop: 20,
            marginTop: 20,
          }}
        >
          <Button onClick={handleCancel} size="large" style={{ minWidth: 100 }}>
            Hủy
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={isUpdating}
            size="large"
            icon={<SaveOutlined />}
            style={{ minWidth: 120 }}
          >
            Lưu thay đổi
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default EditPatientModal;
