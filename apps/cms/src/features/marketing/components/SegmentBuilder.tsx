import React from 'react';
import { Card, Form, Row, Col, Select, InputNumber, Button, Space, Typography, Statistic } from 'antd';
import { PlusOutlined, DeleteOutlined, SaveOutlined, RobotOutlined } from '@ant-design/icons';

const { Title } = Typography;

const SegmentBuilder: React.FC<{ onSave?: () => void }> = ({ onSave }) => {
  return (
    <Card>
      <Title level={4}>Trình tạo Phân khúc Khách hàng</Title>
      <Form layout="vertical">
        <Form.List name="rules">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                  <Form.Item {...restField} name={[name, 'field']}>
                    <Select placeholder="Thuộc tính" style={{ width: 150 }}>
                      <Select.Option value="total_spent">Tổng chi tiêu</Select.Option>
                      <Select.Option value="last_purchase_date">Ngày mua cuối</Select.Option>
                      <Select.Option value="location">Thành phố</Select.Option>
                      <Select.Option value="product_category">Loại SP đã mua</Select.Option>
                    </Select>
                  </Form.Item>
                  <Form.Item {...restField} name={[name, 'operator']}>
                    <Select placeholder="Toán tử" style={{ width: 120 }}>
                      <Select.Option value=">=">&gt;=</Select.Option>
                      <Select.Option value="<=">&lt;=</Select.Option>
                      <Select.Option value="=">Bằng</Select.Option>
                      <Select.Option value="in">Trong</Select.Option>
                    </Select>
                  </Form.Item>
                  <Form.Item {...restField} name={[name, 'value']}>
                    <InputNumber placeholder="Giá trị" style={{ width: 200 }} />
                  </Form.Item>
                  <DeleteOutlined onClick={() => remove(name)} />
                </Space>
              ))}
              <Form.Item>
                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                  Thêm điều kiện
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>
        <Row gutter={16} align="middle">
            <Col>
                <Statistic title="Số khách hàng ước tính" value={1128} suffix="người" />
            </Col>
            <Col>
                <Button type="primary" ghost icon={<RobotOutlined />}>Gợi ý phân khúc từ AI</Button>
            </Col>
        </Row>
        {onSave && (
            <Form.Item style={{marginTop: 24}}>
                <Button type="primary" icon={<SaveOutlined />} onClick={onSave}>Lưu phân khúc</Button>
            </Form.Item>
        )}
      </Form>
    </Card>
  );
};

export default SegmentBuilder;
