/**
 * Salary Structure Tab - Cấu trúc Lương & Phụ Cấp
 *
 * Tab quản lý lương cơ bản và các khoản phụ cấp theo NGẠCH LƯƠNG
 */

import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Space,
  Tag,
  Card,
  Statistic,
  Row,
  Col,
  Typography,
  message,
  Popconfirm,
  Tooltip,
  App,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  DollarOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { SalaryGrade, Allowance } from "../../types/salary";
import { formatCurrency } from "../../utils";
import SalaryGradeFormModal from "./SalaryGradeFormModal";
import { getSalaryGrades, deleteSalaryGrade } from "@nam-viet-erp/services";

const { Title, Text } = Typography;

const SalaryStructureTab: React.FC = () => {
  const { message: messageApi } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [salaryGrades, setSalaryGrades] = useState<SalaryGrade[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingGrade, setEditingGrade] = useState<SalaryGrade | null>(null);

  useEffect(() => {
    loadSalaryGrades();
  }, []);

  const loadSalaryGrades = async () => {
    setLoading(true);
    try {
      const { data, error } = await getSalaryGrades();

      if (error) {
        console.error("Error loading salary grades:", error);
        messageApi.error("Không thể tải ngạch lương: " + error.message);
        return;
      }

      // Transform data to match SalaryGrade interface
      const transformedData: SalaryGrade[] = (data || []).map((item: any) => ({
        id: item.id,
        grade_name: item.grade_name,
        base_salary: item.base_salary,
        description: item.description,
        total_salary: item.total_salary,
        is_active: item.is_active,
        allowances: Array.isArray(item.allowances) ? item.allowances : [],
      }));

      setSalaryGrades(transformedData);
    } catch (error: any) {
      console.error("Exception loading salary grades:", error);
      messageApi.error("Không thể tải ngạch lương");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingGrade(null);
    setModalVisible(true);
  };

  const handleEdit = (record: SalaryGrade) => {
    setEditingGrade(record);
    setModalVisible(true);
  };

  const handleDelete = async (record: SalaryGrade) => {
    try {
      const { error } = await deleteSalaryGrade(record.id);

      if (error) {
        console.error("Error deleting salary grade:", error);
        messageApi.error("Không thể xóa ngạch lương: " + error.message);
        return;
      }

      messageApi.success(`Đã xóa ngạch lương "${record.grade_name}"`);
      loadSalaryGrades();
    } catch (error: any) {
      console.error("Exception deleting salary grade:", error);
      messageApi.error("Không thể xóa ngạch lương");
    }
  };

  const handleModalClose = (saved: boolean) => {
    setModalVisible(false);
    setEditingGrade(null);
    if (saved) {
      loadSalaryGrades();
    }
  };

  const columns: ColumnsType<SalaryGrade> = [
    {
      title: "Tên ngạch lương",
      dataIndex: "grade_name",
      key: "grade_name",
      width: 250,
      render: (text: string, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text}</Text>
          {record.description && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.description}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: "Lương cơ bản",
      dataIndex: "base_salary",
      key: "base_salary",
      width: 150,
      align: "right",
      render: (amount: number) => <Text strong>{formatCurrency(amount)}</Text>,
    },
    {
      title: "Danh sách phụ cấp",
      dataIndex: "allowances",
      key: "allowances",
      width: 300,
      render: (allowances: Allowance[]) => {
        if (allowances.length === 0) {
          return <Text type="secondary">Không có phụ cấp</Text>;
        }

        const totalAllowance = allowances.reduce((sum, a) => sum + a.amount, 0);

        return (
          <Space direction="vertical" size="small" style={{ width: "100%" }}>
            {allowances.map((allowance) => (
              <div
                key={allowance.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 13 }}>{allowance.name}</Text>
                <Tag color="blue">{formatCurrency(allowance.amount)}</Tag>
              </div>
            ))}
            <div
              style={{
                borderTop: "1px solid #f0f0f0",
                paddingTop: 4,
                marginTop: 4,
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <Text strong>Tổng phụ cấp:</Text>
              <Text strong>{formatCurrency(totalAllowance)}</Text>
            </div>
          </Space>
        );
      },
    },
    {
      title: "Tổng lương",
      dataIndex: "total_salary",
      key: "total_salary",
      width: 150,
      align: "right",
      render: (amount: number) => (
        <Tag color="green" style={{ fontSize: 14, padding: "4px 12px" }}>
          {formatCurrency(amount)}
        </Tag>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "is_active",
      key: "is_active",
      width: 120,
      align: "center",
      render: (isActive: boolean) => (
        <Tag color={isActive ? "green" : "red"}>
          {isActive ? "Đang áp dụng" : "Ngừng"}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 150,
      align: "center",
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          >
            Sửa
          </Button>
          <Popconfirm
            title="Xác nhận xóa"
            description={`Bạn có chắc muốn xóa ngạch lương "${record.grade_name}"?`}
            onConfirm={() => handleDelete(record)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button type="link" danger icon={<DeleteOutlined />} size="small">
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Calculate statistics
  const totalGrades = salaryGrades.length;
  const activeGrades = salaryGrades.filter((s) => s.is_active).length;
  const avgBaseSalary =
    salaryGrades.length > 0
      ? salaryGrades.reduce((sum, s) => sum + s.base_salary, 0) /
        salaryGrades.length
      : 0;
  const avgTotalSalary =
    salaryGrades.length > 0
      ? salaryGrades.reduce((sum, s) => sum + s.total_salary, 0) /
        salaryGrades.length
      : 0;

  return (
    <div>
      {/* Statistics */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng ngạch lương"
              value={totalGrades}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Đang áp dụng"
              value={activeGrades}
              valueStyle={{ color: "#3f8600" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Lương cơ bản TB"
              value={avgBaseSalary}
              formatter={(value) => formatCurrency(Number(value))}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng lương TB"
              value={avgTotalSalary}
              formatter={(value) => formatCurrency(Number(value))}
              valueStyle={{ color: "#cf1322" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Table */}
      <Card>
        <div
          style={{
            marginBottom: 16,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <Title level={5} style={{ margin: 0 }}>
              Danh sách Ngạch Lương
            </Title>
            <Text type="secondary">
              Quản lý ngạch lương, lương cơ bản và phụ cấp
            </Text>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Thêm ngạch lương
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={salaryGrades}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Tổng số ${total} ngạch lương`,
          }}
        />
      </Card>

      {/* Modal */}
      <SalaryGradeFormModal
        visible={modalVisible}
        grade={editingGrade}
        onClose={handleModalClose}
      />
    </div>
  );
};

export default SalaryStructureTab;
