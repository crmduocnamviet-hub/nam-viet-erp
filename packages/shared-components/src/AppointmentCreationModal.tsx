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
} from "@nam-viet-erp/services";
import { useDebounce } from "./hooks/useDebounce";

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
            roleName: "BacSi", // Only load doctors
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
    if (selectedService) {
      // All doctors can handle all services for now
      setAvailableResources(resources); // Use passed resources
      // Reset the selected resource when the service changes to avoid inconsistency.
      form.setFieldsValue({ resourceId: undefined });
    } else {
      setAvailableResources(resources); // Use passed resources
    }
  }, [selectedService, resources, form]);

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
      // Handle opening a new patient creation modal or form
      // For now, we can just log it.
      console.log("Create new patient selected");
      // You might want to clear the search input here
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
          <Form.Item label="Tìm kiếm bệnh nhân (SĐT hoặc Tên)">
            <AutoComplete
              options={patientOptions}
              onSelect={onPatientSelect}
              onSearch={setSearchTerm}
              placeholder="Nhập để tìm..."
              notFoundContent={searching ? <Spin size="small" /> : null}
            >
              <Input />
            </AutoComplete>
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="patientName"
                label="Họ và Tên"
                rules={[
                  { required: true, message: "Vui lòng nhập tên bệnh nhân" },
                ]}
              >
                <Input />
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
                <Input />
              </Form.Item>
            </Col>
          </Row>
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
          patientId: selectedPatient?.id,
        };
        onFinish(allValues);
        form.resetFields();
        setCurrentStep(0);
        setSelectedPatient(null);
      })
      .catch((info) => {
        console.log("Validate Failed:", info);
      });
  };

  return (
    <Modal
      open={open}
      title="Tạo Lịch hẹn mới (4 bước Siêu tốc)"
      onCancel={onClose}
      width={800}
      destroyOnClose={true}
      footer={
        <Space>
          <Button onClick={onClose}>Hủy</Button>
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
  const watchedValues = Form.useWatch([], form) || {};

  // Merge both to ensure we get the latest values
  const allValues = { ...values, ...(watchedValues || {}) };

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

  console.log('Form values:', values);
  console.log('Watched values:', watchedValues);
  console.log('All values:', allValues);

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
