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

const { Title, Text } = Typography;

const SalaryStructureTab: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [salaryGrades, setSalaryGrades] = useState<SalaryGrade[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingGrade, setEditingGrade] = useState<SalaryGrade | null>(null);

  useEffect(() => {
    loadSalaryGrades();
  }, []);

  const loadSalaryGrades = () => {
    setLoading(true);
    try {
      // TODO: Load from API
      // Mock data for now
      const mockData: SalaryGrade[] = [
        {
          id: "1",
          grade_name: "Ngạch A - Nhân viên cấp cao",
          base_salary: 15000000,
          description: "Dành cho nhân viên quản lý cấp cao",
          allowances: [
            {
              id: "a1",
              name: "Phụ cấp xăng xe",
              amount: 2000000,
            },
            {
              id: "a2",
              name: "Phụ cấp điện thoại",
              amount: 500000,
            },
            {
              id: "a3",
              name: "Phụ cấp ăn trưa",
              amount: 1000000,
            },
          ],
          total_salary: 18500000,
          is_active: true,
        },
        {
          id: "2",
          grade_name: "Ngạch B - Nhân viên trung cấp",
          base_salary: 10000000,
          description: "Dành cho nhân viên có kinh nghiệm",
          allowances: [
            {
              id: "a4",
              name: "Phụ cấp xăng xe",
              amount: 1000000,
            },
            {
              id: "a5",
              name: "Phụ cấp điện thoại",
              amount: 300000,
            },
            {
              id: "a6",
              name: "Phụ cấp ăn trưa",
              amount: 800000,
            },
          ],
          total_salary: 12100000,
          is_active: true,
        },
        {
          id: "3",
          grade_name: "Ngạch C - Nhân viên",
          base_salary: 7000000,
          description: "Dành cho nhân viên mới vào",
          allowances: [
            {
              id: "a7",
              name: "Phụ cấp ăn trưa",
              amount: 500000,
            },
          ],
          total_salary: 7500000,
          is_active: true,
        },
        {
          id: "4",
          grade_name: "Ngạch D - Thử việc",
          base_salary: 5000000,
          description: "Dành cho nhân viên đang trong thời gian thử việc",
          allowances: [],
          total_salary: 5000000,
          is_active: true,
        },
      ];

      setSalaryGrades(mockData);
    } catch (error) {
      message.error("Không thể tải ngạch lương");
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

  const handleDelete = (record: SalaryGrade) => {
    // TODO: Delete salary grade via API
    message.success(`Đã xóa ngạch lương "${record.grade_name}"`);
    loadSalaryGrades();
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
