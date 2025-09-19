// src/features/finance/components/FilterControls.tsx

import React from "react";
import { Form, DatePicker, Select, Row, Col, Button, Space } from "antd";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;

interface FilterControlsProps {
  filters: any;
  onFilterChange: (changedFilters: any, reset?: boolean) => void;
  funds: any[];
  onApply?: () => void;
}

const FilterControls: React.FC<FilterControlsProps> = ({
  filters,
  onFilterChange,
  funds,
  onApply,
}) => {
  const [form] = Form.useForm();

  const handleValuesChange = (_: any, allValues: any) => {
    // Nâng cấp: Chỉ tự động lọc trên desktop (khi không có nút 'Áp dụng')
    if (!onApply) {
      onFilterChange(allValues);
    }
  };

  const handleClearFilters = () => {
    const initialFilters = {
      dateRange: [dayjs().startOf("month"), dayjs().endOf("month")],
      type: null,
      status: null,
      fundId: null,
    };
    form.setFieldsValue(initialFilters);
    onFilterChange(initialFilters, true); // Gửi tín hiệu reset
    if (onApply) onApply(); // Đóng drawer trên mobile
  };

  const applyCurrentFilters = () => {
    onFilterChange(form.getFieldsValue());
    if (onApply) onApply();
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={filters}
      onValuesChange={handleValuesChange}
    >
      <Row gutter={16}>
        <Col xs={24} md={8}>
          <Form.Item name="dateRange" label="Khoảng thời gian">
            <RangePicker style={{ width: "100%" }} />
          </Form.Item>
        </Col>
        <Col xs={12} md={4}>
          <Form.Item name="type" label="Loại GD">
            <Select allowClear placeholder="Tất cả">
              <Select.Option value="income">Thu</Select.Option>
              <Select.Option value="expense">Chi</Select.Option>
            </Select>
          </Form.Item>
        </Col>
        <Col xs={12} md={4}>
          <Form.Item name="status" label="Trạng thái">
            <Select allowClear placeholder="Tất cả">
              <Select.Option value="chờ duyệt">Chờ duyệt</Select.Option>
              <Select.Option value="chờ thực thu">Chờ thực thu</Select.Option>
              <Select.Option value="đã duyệt - chờ chi">
                Đã duyệt - Chờ chi
              </Select.Option>
              <Select.Option value="đã thu">Đã Thu</Select.Option>
              <Select.Option value="đã chi">Đã Chi</Select.Option>
              <Select.Option value="Từ chối">Từ chối</Select.Option>
            </Select>
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item name="fundId" label="Quỹ / Tài khoản">
            <Select allowClear placeholder="Tất cả">
              {funds.map((fund) => (
                <Select.Option key={fund.id} value={fund.id}>
                  {fund.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>
      {onApply && (
        <Space style={{ width: "100%" }}>
          <Button onClick={handleClearFilters} style={{ flex: 1 }}>
            Xóa bộ lọc
          </Button>
          <Button
            type="primary"
            onClick={applyCurrentFilters}
            style={{ flex: 1 }}
          >
            Áp dụng
          </Button>
        </Space>
      )}
    </Form>
  );
};

export default FilterControls;
