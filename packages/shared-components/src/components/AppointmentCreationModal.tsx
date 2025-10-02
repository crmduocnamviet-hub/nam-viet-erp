import React, { useState } from "react";
import {
  Modal,
  Steps,
  Button,
  Form,
  Input,
  AutoComplete,
  Select,
  DatePicker,
  Row,
  Col,
  Result,
  Typography,
  TimePicker,
  Space,
  Card,
  List,
  Spin,
  Checkbox,
} from "antd";
import {
  UserOutlined,
  SolutionOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  PlusCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  getPatients,
  getAppointments,
  getEmployees,
  createPatient,
} from "@nam-viet-erp/services";
import { useDebounce } from "../hooks/useDebounce";

interface AppointmentFormValues {
  patient_id?: string;
  patientName?: string;
  patientPhone?: string;
  service?: string;
  resourceId?: string;
  appointmentDate?: any;
  appointmentTime?: any;
  notes?: string;
  sendConfirmation?: boolean;
}

const { Step } = Steps;
const { Text } = Typography;

interface AppointmentCreationModalProps {
  open: boolean;
  onClose: () => void;
  onFinish: (values: any) => void;
  resources: IEmployee[]; // Pass resources from dashboard
}

// This is the option type for the AutoComplete
interface PatientOption {
  value: string; // Unique value, can be patient ID or a special key like '__CREATE_NEW__'
  label: React.ReactNode;
  patient?: any; // The full patient object
}

const AppointmentCreationModal: React.FC<AppointmentCreationModalProps> = ({
  open,
  onClose,
  onFinish,
  resources,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();
  const [patientOptions, setPatientOptions] = useState<PatientOption[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [availableResources, setAvailableResources] =
    useState<IEmployee[]>(resources); // Use passed resources
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [showNewPatientForm, setShowNewPatientForm] = useState(false);
  const [creatingPatient, setCreatingPatient] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const selectedService = Form.useWatch("service", form);
  const selectedResourceId = Form.useWatch("resourceId", form);
  const selectedDate = Form.useWatch("appointmentDate", form);

  // Load doctors when modal opens - This logic might need to be adjusted if resources are always passed in
  React.useEffect(() => {
    if (open && resources.length === 0) {
      // Only load if no resources are passed
      const loadDoctors = async () => {
        try {
          // setLoadingDoctors(true); // Removed loadingDoctors state
          const { data, error } = await getEmployees({
            roleName: "medical-staff", // Only load doctors
            limit: 50,
          });
          if (error) {
            console.error("Error loading doctors:", error);
          } else {
            setAvailableResources(data || []);
          }
        } catch (error) {
          console.error("Error loading doctors:", error);
        } finally {
          // setLoadingDoctors(false); // Removed loadingDoctors state
        }
      };
      loadDoctors();
    } else if (open && resources.length > 0) {
      setAvailableResources(resources);
    }
  }, [open, resources]);

  React.useEffect(() => {
    // For now, all doctors can handle all services
    // In a real app, you might filter doctors based on their specialization
    // Simply keep all available resources without resetting the selection
    setAvailableResources(resources);
  }, [resources]);

  React.useEffect(() => {
    const performSearch = async () => {
      if (debouncedSearchTerm) {
        setSearching(true);
        const { data, error } = await getPatients({
          search: debouncedSearchTerm,
          limit: 10,
        });
        if (error) {
          // Handle error, maybe show a notification
          setPatientOptions([]);
        } else {
          const options: PatientOption[] = data.map((p: any) => ({
            value: p.patient_id,
            label: (
              <div>
                <Text strong>{p.full_name}</Text>
                <br />
                <Text type="secondary">{p.phone_number}</Text>
              </div>
            ),
            patient: p,
          }));

          // Add the "Create New" option
          options.push({
            value: "__CREATE_NEW__",
            label: (
              <Button type="link" icon={<PlusCircleOutlined />}>
                Tạo Bệnh nhân mới
              </Button>
            ),
          });

          setPatientOptions(options);
        }
        setSearching(false);
      } else {
        setPatientOptions([]);
      }
    };

    performSearch();
  }, [debouncedSearchTerm]);

  React.useEffect(() => {
    if (selectedResourceId && open) {
      setLoadingAppointments(true);
      getAppointments({ doctorId: selectedResourceId })
        .then(({ data }) => {
          setAppointments(data || []);
        })
        .finally(() => setLoadingAppointments(false));
    } else {
      setAppointments([]);
    }
  }, [selectedResourceId, open]);

  const onPatientSelect = (value: string, option: PatientOption) => {
    if (value === "__CREATE_NEW__") {
      setShowNewPatientForm(true);
      setSearchTerm("");
      return;
    }

    const patient = option.patient;
    if (patient) {
      setSelectedPatient(patient);
      form.setFieldsValue({
        patientName: patient.full_name,
        patientPhone: patient.phone_number,
        patient_id: patient.patient_id,
      });
    }
  };

  const handleCreateNewPatient = async () => {
    try {
      setCreatingPatient(true);
      const patientName = form.getFieldValue("patientName");
      const patientPhone = form.getFieldValue("patientPhone");

      if (!patientName || !patientPhone) {
        console.error("Patient name and phone are required");
        return;
      }

      const newPatientData = {
        full_name: patientName,
        phone_number: patientPhone,
        date_of_birth: null,
        gender: null,
        is_b2b_customer: false,
        loyalty_points: 0,
        allergy_notes: null,
        chronic_diseases: null,
      };

      const { data: newPatient, error } = await createPatient(newPatientData);

      if (error) {
        console.error("Error creating patient:", error);
        return;
      }

      if (newPatient) {
        setSelectedPatient(newPatient);
        form.setFieldsValue({
          patient_id: newPatient.patient_id,
        });
        setShowNewPatientForm(false);
        console.log("New patient created:", newPatient);
      }
    } catch (error) {
      console.error("Error creating patient:", error);
    } finally {
      setCreatingPatient(false);
    }
  };

  const disabledTime = () => {
    if (!selectedDate || !selectedResourceId) {
      return {};
    }

    const bookedTimes = appointments
      .filter((app) => dayjs(app.appointment_time).isSame(selectedDate, "day"))
      .map((app) => dayjs(app.appointment_time));

    const disabledHours = () => {
      const hours = new Set<number>();
      bookedTimes.forEach((time) => {
        // Assuming 15-minute slots, if all 4 slots in an hour are booked, disable the hour
        const startOfHour = time.startOf("hour");
        // const slotsInHour = [
        //   startOfHour,
        //   startOfHour.add(15, 'minutes'),
        //   startOfHour.add(30, 'minutes'),
        //   startOfHour.add(45, 'minutes'),
        // ];
        const bookedSlotsInHour = bookedTimes.filter((bt) =>
          bt.isSame(startOfHour, "hour")
        );
        if (bookedSlotsInHour.length >= 4) {
          hours.add(time.hour());
        }
      });
      return Array.from(hours);
    };

    const disabledMinutes = (hour: number) => {
      const minutes = new Set<number>();
      bookedTimes.forEach((time) => {
        if (time.hour() === hour) {
          minutes.add(time.minute());
        }
        // Add logic to disable specific 15-minute slots if needed
        // For example, if a 15-minute slot is booked, disable that specific minute
        // if (time.hour() === hour && time.minute() === minute) {
        //   minutes.add(minute);
        // }
      });
      return Array.from(minutes);
    };

    return {
      disabledHours,
      disabledMinutes,
    };
  };

  const steps = [
    {
      title: "Bệnh nhân",
      icon: <UserOutlined />,
      content: (
        <>
          <Form.Item name="patient_id" hidden>
            <Input />
          </Form.Item>
          {!showNewPatientForm ? (
            <Form.Item label="Tìm kiếm bệnh nhân (SĐT hoặc Tên)">
              <AutoComplete
                options={patientOptions}
                onSelect={onPatientSelect}
                onSearch={setSearchTerm}
                placeholder="Nhập để tìm..."
                notFoundContent={searching ? <Spin size="small" /> : null}
                disabled={selectedPatient}
              >
                <Input />
              </AutoComplete>
            </Form.Item>
          ) : (
            <Card
              title="Tạo bệnh nhân mới"
              extra={
                <Button
                  type="link"
                  onClick={() => {
                    setShowNewPatientForm(false);
                    form.setFieldsValue({ patientName: "", patientPhone: "" });
                  }}
                >
                  Hủy
                </Button>
              }
              style={{ marginBottom: 16 }}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="patientName"
                    label="Họ và Tên"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng nhập tên bệnh nhân",
                      },
                    ]}
                  >
                    <Input placeholder="Nhập họ và tên" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="patientPhone"
                    label="Số điện thoại"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng nhập số điện thoại",
                      },
                      {
                        pattern: /^[0-9]{10,11}$/,
                        message: "Số điện thoại không hợp lệ",
                      },
                    ]}
                  >
                    <Input placeholder="Nhập số điện thoại" />
                  </Form.Item>
                </Col>
              </Row>
              <Button
                type="primary"
                onClick={handleCreateNewPatient}
                loading={creatingPatient}
                style={{ width: "100%" }}
              >
                Tạo bệnh nhân và tiếp tục
              </Button>
            </Card>
          )}

          {selectedPatient && !showNewPatientForm && (
            <Card
              title="Thông tin bệnh nhân đã chọn"
              style={{ marginBottom: 16 }}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Text strong>Họ và Tên: </Text>
                  <Text>{selectedPatient.full_name}</Text>
                </Col>
                <Col span={12}>
                  <Text strong>Số điện thoại: </Text>
                  <Text>{selectedPatient.phone_number}</Text>
                </Col>
              </Row>
              <Button
                type="link"
                onClick={() => {
                  setSelectedPatient(null);
                  form.setFieldsValue({
                    patientName: "",
                    patientPhone: "",
                    patient_id: "",
                  });
                }}
                style={{ paddingLeft: 0 }}
              >
                Chọn bệnh nhân khác
              </Button>
            </Card>
          )}

          {!selectedPatient && !showNewPatientForm && (
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="patientName"
                  label="Họ và Tên"
                  rules={[
                    { required: true, message: "Vui lòng nhập tên bệnh nhân" },
                  ]}
                >
                  <Input
                    disabled
                    placeholder="Chọn từ danh sách hoặc tạo mới"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="patientPhone"
                  label="Số điện thoại"
                  rules={[
                    { required: true, message: "Vui lòng nhập số điện thoại" },
                  ]}
                >
                  <Input
                    disabled
                    placeholder="Chọn từ danh sách hoặc tạo mới"
                  />
                </Form.Item>
              </Col>
            </Row>
          )}
        </>
      ),
    },
    {
      title: "Dịch vụ",
      icon: <SolutionOutlined />,
      content: (
        <>
          <Form.Item
            name="service"
            label="Chọn dịch vụ"
            rules={[{ required: true, message: "Vui lòng chọn dịch vụ" }]}
          >
            <Select placeholder="Chọn dịch vụ khám">
              <Select.Option value="general">Khám tổng quát</Select.Option>
              <Select.Option value="specialist">Khám chuyên khoa</Select.Option>
              <Select.Option value="vaccine">Tiêm chủng</Select.Option>
              <Select.Option value="ultrasound">Siêu âm</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="resourceId"
            label="Chọn bác sĩ/phòng"
            rules={[{ required: true, message: "Vui lòng chọn nguồn lực" }]}
          >
            <Select
              placeholder="Chọn bác sĩ hoặc phòng khám"
              disabled={!selectedService}
            >
              {availableResources.map((r) => (
                <Select.Option key={r.employee_id} value={r.employee_id}>
                  {r.full_name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </>
      ),
    },
    {
      title: "Thời gian",
      icon: <ClockCircleOutlined />,
      content: (
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="appointmentDate"
              label="Chọn ngày"
              rules={[{ required: true, message: "Vui lòng chọn ngày" }]}
            >
              <DatePicker
                style={{ width: "100%" }}
                format="DD/MM/YYYY"
                disabledDate={(current) =>
                  current && current < dayjs().endOf("day")
                }
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="appointmentTime"
              label="Chọn giờ"
              rules={[{ required: true, message: "Vui lòng chọn giờ" }]}
            >
              <TimePicker
                style={{ width: "100%" }}
                format="HH:mm"
                minuteStep={15}
                disabled={!selectedDate || loadingAppointments}
                disabledTime={disabledTime}
              />
            </Form.Item>
          </Col>
        </Row>
      ),
    },
    {
      title: "Xác nhận & Ghi chú",
      icon: <CheckCircleOutlined />,
      content: <ConfirmationStep form={form} resources={availableResources} />,
    },
  ];

  const handleNext = async () => {
    try {
      await form.validateFields();
      setCurrentStep(currentStep + 1);
    } catch {
      // Errors will be displayed on the form fields
    }
  };

  const handlePrev = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleFormFinish = () => {
    form
      .validateFields()
      .then(() => {
        const allValues = {
          ...form.getFieldsValue(true),
          patientId: selectedPatient?.patient_id || selectedPatient?.id,
        };
        onFinish(allValues);
        handleReset();
      })
      .catch((info) => {
        console.log("Validate Failed:", info);
      });
  };

  const handleReset = () => {
    form.resetFields();
    setCurrentStep(0);
    setSelectedPatient(null);
    setShowNewPatientForm(false);
    setSearchTerm("");
    setPatientOptions([]);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <Modal
      open={open}
      title="Tạo Lịch hẹn mới (4 bước Siêu tốc)"
      onCancel={handleClose}
      width={800}
      destroyOnClose={true}
      footer={
        <Space>
          <Button onClick={handleClose}>Hủy</Button>
          {currentStep > 0 && <Button onClick={handlePrev}>Quay lại</Button>}
          {currentStep < steps.length - 1 && (
            <Button type="primary" onClick={handleNext}>
              Tiếp theo
            </Button>
          )}
          {currentStep === steps.length - 1 && (
            <Button type="primary" onClick={handleFormFinish}>
              Xác nhận & Tạo lịch hẹn
            </Button>
          )}
        </Space>
      }
    >
      <Form form={form} layout="vertical" name="appointmentCreation">
        <Steps current={currentStep} style={{ margin: "24px 0" }}>
          {steps.map((item) => (
            <Step key={item.title} title={item.title} icon={item.icon} />
          ))}
        </Steps>
        <div className="steps-content" style={{ marginTop: 24 }}>
          {steps[currentStep].content}
        </div>
      </Form>
    </Modal>
  );
};

// Confirmation Step Component
const ConfirmationStep = ({
  form,
  resources,
}: {
  form: any;
  resources: IEmployee[];
}) => {
  const values: AppointmentFormValues = form.getFieldsValue(true) || {};

  // Also use useWatch for reactivity
  const watchedValues = Form.useWatch([], form);

  // Merge both to ensure we get the latest values
  const allValues = {
    ...values,
    ...(watchedValues && typeof watchedValues === "object"
      ? watchedValues
      : {}),
  };

  const resourceName =
    resources.find((r) => r.employee_id === allValues.resourceId)?.full_name ||
    "N/A";
  const appointmentDateTime =
    allValues.appointmentDate && allValues.appointmentTime
      ? `${allValues.appointmentDate.format(
          "DD/MM/YYYY"
        )} lúc ${allValues.appointmentTime.format("HH:mm")}`
      : "Chưa chọn";

  const getServiceName = (service?: string) => {
    switch (service) {
      case "general":
        return "Khám tổng quát";
      case "specialist":
        return "Khám chuyên khoa";
      case "vaccine":
        return "Tiêm chủng";
      case "ultrasound":
        return "Siêu âm";
      default:
        return service || "Chưa chọn";
    }
  };

  const items = [
    { label: "Bệnh nhân", value: allValues.patientName || "Chưa nhập" },
    { label: "Số điện thoại", value: allValues.patientPhone || "Chưa nhập" },
    { label: "Dịch vụ", value: getServiceName(allValues.service) },
    { label: "Bác sĩ/Phòng", value: resourceName },
    { label: "Thời gian", value: appointmentDateTime },
  ];

  return (
    <Card>
      <Result
        status="info"
        title="Xác nhận thông tin Lịch hẹn"
        subTitle="Vui lòng kiểm tra lại các thông tin dưới đây trước khi tạo."
      >
        <List
          dataSource={items}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta title={item.label} description={item.value} />
            </List.Item>
          )}
        />
        <Form.Item name="notes" label="Ghi chú">
          <Input.TextArea rows={3} placeholder="Thêm ghi chú cho cuộc hẹn..." />
        </Form.Item>
        <Form.Item name="sendConfirmation" valuePropName="checked">
          <Checkbox>Gửi SMS/Zalo xác nhận cho khách hàng</Checkbox>
        </Form.Item>
      </Result>
    </Card>
  );
};

export default AppointmentCreationModal;
