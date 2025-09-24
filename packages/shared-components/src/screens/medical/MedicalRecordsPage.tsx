import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Input,
  Space,
  Tag,
  Typography,
  App as AntApp,
  Row,
  Col,
  Button,
  Descriptions,
  Modal,
  Collapse,
  List,
} from "antd";
import {
  FileTextOutlined,
  UserOutlined,
  SearchOutlined,
  MedicineBoxOutlined,
  ExperimentOutlined,
  EyeOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { getMedicalVisits, getPrescriptionsByVisitId, getLabOrdersByVisitId } from "@nam-viet-erp/services";

const { Title, Text } = Typography;
const { Search } = Input;
const { Panel } = Collapse;

const MedicalRecordsPage: React.FC = () => {
  const { notification } = AntApp.useApp();
  const [medicalVisits, setMedicalVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVisit, setSelectedVisit] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [labOrders, setLabOrders] = useState<any[]>([]);

  useEffect(() => {
    loadMedicalVisits();
  }, [searchTerm]);

  const loadMedicalVisits = async () => {
    try {
      setLoading(true);
      const { data, error } = await getMedicalVisits({
        limit: 50,
      });

      if (error) {
        notification.error({
          message: "Lỗi tải dữ liệu",
          description: error.message,
        });
      } else {
        setMedicalVisits(data || []);
      }
    } catch (error) {
      notification.error({
        message: "Lỗi hệ thống",
        description: "Không thể tải hồ sơ y tế",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadVisitDetails = async (visitId: string) => {
    try {
      const [prescriptionsRes, labOrdersRes] = await Promise.all([
        getPrescriptionsByVisitId(visitId),
        getLabOrdersByVisitId(visitId),
      ]);

      setPrescriptions(prescriptionsRes.data || []);
      setLabOrders(labOrdersRes.data || []);
    } catch (error) {
      notification.error({
        message: "Lỗi tải chi tiết",
        description: "Không thể tải chi tiết hồ sơ",
      });
    }
  };

  const handleViewDetails = async (visit: any) => {
    setSelectedVisit(visit);
    setIsDetailModalOpen(true);
    await loadVisitDetails(visit.visit_id);
  };

  const columns = [
    {
      title: "Ngày khám",
      dataIndex: "visit_date",
      key: "visit_date",
      render: (date: string) => (
        <Space>
          <CalendarOutlined />
          <Text>{new Date(date).toLocaleDateString("vi-VN")}</Text>
        </Space>
      ),
    },
    {
      title: "Bệnh nhân",
      key: "patient",
      render: (record: any) => (
        <Space>
          <UserOutlined />
          <div>
            <Text strong>{record.patients?.full_name}</Text>
            <br />
            <Text type="secondary">{record.patients?.phone_number}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Bác sĩ khám",
      key: "doctor",
      render: (record: any) => (
        <Space>
          <UserOutlined />
          <Text>{record.doctor?.full_name}</Text>
        </Space>
      ),
    },
    {
      title: "Chẩn đoán",
      dataIndex: "assessment_diagnosis_icd10",
      key: "diagnosis",
      render: (diagnosis: string) => (
        <Text>{diagnosis || "Chưa có chẩn đoán"}</Text>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "is_signed_off",
      key: "status",
      render: (isSignedOff: boolean) => (
        <Tag color={isSignedOff ? "green" : "orange"}>
          {isSignedOff ? "Đã hoàn tất" : "Đang xử lý"}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      render: (record: any) => (
        <Button
          type="primary"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetails(record)}
        >
          Xem chi tiết
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Row style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Title level={2} style={{ margin: 0 }}>
            <FileTextOutlined style={{ marginRight: 8 }} />
            Hồ sơ Y tế & Khám bệnh
          </Title>
        </Col>
      </Row>

      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Search
            placeholder="Tìm theo tên bệnh nhân..."
            allowClear
            enterButton={<SearchOutlined />}
            size="large"
            style={{ width: 400 }}
            onSearch={setSearchTerm}
          />
        </Space>

        <Table
          columns={columns}
          dataSource={medicalVisits}
          rowKey="visit_id"
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} hồ sơ khám bệnh`,
          }}
        />
      </Card>

      <Modal
        title={
          <Space>
            <FileTextOutlined />
            Chi tiết hồ sơ khám bệnh
          </Space>
        }
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        width={900}
        footer={[
          <Button key="close" onClick={() => setIsDetailModalOpen(false)}>
            Đóng
          </Button>,
        ]}
      >
        {selectedVisit && (
          <div>
            <Descriptions bordered column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Bệnh nhân">
                {selectedVisit.patients?.full_name}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày khám">
                {new Date(selectedVisit.visit_date).toLocaleDateString("vi-VN")}
              </Descriptions.Item>
              <Descriptions.Item label="Bác sĩ khám">
                {selectedVisit.doctor?.full_name}
              </Descriptions.Item>
              <Descriptions.Item label="Chẩn đoán">
                {selectedVisit.assessment_diagnosis_icd10 || "Chưa có"}
              </Descriptions.Item>
            </Descriptions>

            <Collapse>
              <Panel header="📋 Triệu chứng & Khám lâm sàng" key="symptoms">
                <Space direction="vertical" style={{ width: "100%" }}>
                  <div>
                    <Text strong>Triệu chứng (S - Subjective):</Text>
                    <br />
                    <Text>{selectedVisit.subjective_notes || "Không có ghi chú"}</Text>
                  </div>
                  <div>
                    <Text strong>Khám lâm sàng (O - Objective):</Text>
                    <br />
                    <Text>{selectedVisit.objective_notes || "Không có ghi chú"}</Text>
                  </div>
                  <div>
                    <Text strong>Kế hoạch điều trị (P - Plan):</Text>
                    <br />
                    <Text>{selectedVisit.plan_notes || "Không có kế hoạch"}</Text>
                  </div>
                </Space>
              </Panel>

              <Panel
                header={`💊 Đơn thuốc (${prescriptions.length} thuốc)`}
                key="prescriptions"
              >
                <List
                  dataSource={prescriptions}
                  renderItem={(prescription: any) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<MedicineBoxOutlined style={{ color: "#52c41a" }} />}
                        title={prescription.products?.name}
                        description={
                          <Space direction="vertical" size={0}>
                            <Text>Số lượng: {prescription.quantity_ordered}</Text>
                            <Text>Cách dùng: {prescription.dosage_instruction || "Theo chỉ định"}</Text>
                            {prescription.ai_interaction_warning && (
                              <Tag color="red">⚠️ {prescription.ai_interaction_warning}</Tag>
                            )}
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              </Panel>

              <Panel
                header={`🔬 Xét nghiệm & Dịch vụ (${labOrders.length} dịch vụ)`}
                key="lab-orders"
              >
                <List
                  dataSource={labOrders}
                  renderItem={(labOrder: any) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<ExperimentOutlined style={{ color: "#1890ff" }} />}
                        title={labOrder.service_name}
                        description={
                          <Space direction="vertical" size={0}>
                            <Text>Chẩn đoán sơ bộ: {labOrder.preliminary_diagnosis || "Không có"}</Text>
                            <Tag color={labOrder.is_executed ? "green" : "orange"}>
                              {labOrder.is_executed ? "Đã thực hiện" : "Chờ thực hiện"}
                            </Tag>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              </Panel>
            </Collapse>
          </div>
        )}
      </Modal>
    </div>
  );
};

const MedicalRecordsPageWrapper: React.FC = () => (
  <AntApp>
    <MedicalRecordsPage />
  </AntApp>
);

export default MedicalRecordsPageWrapper;