import React, { useState } from 'react';
import { Modal, Steps, Button, Form, Input, AutoComplete, Select, DatePicker, Row, Col, Result, Typography, TimePicker, Space, Card, List, Spin, Checkbox } from 'antd';
import { UserOutlined, SolutionOutlined, ClockCircleOutlined, CheckCircleOutlined, PlusCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getPatients, getAppointments } from '@nam-viet-erp/services';
import { useDebounce } from '../../../hooks/useDebounce';

const { Step } = Steps;
const { Text } = Typography;

interface AppointmentCreationModalProps {
  open: boolean;
  onClose: () => void;
  onFinish: (values: any) => void;
  resources: any[]; // Pass resources from dashboard
}

// This is the option type for the AutoComplete
interface PatientOption {
    value: string; // Unique value, can be patient ID or a special key like '__CREATE_NEW__'
    label: React.ReactNode;
    patient?: any; // The full patient object
}


const AppointmentCreationModal: React.FC<AppointmentCreationModalProps> = ({ open, onClose, onFinish, resources }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();
  const [patientOptions, setPatientOptions] = useState<PatientOption[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [availableResources, setAvailableResources] = useState<any[]>(resources);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const selectedService = Form.useWatch('service', form);
  const selectedResourceId = Form.useWatch('resourceId', form);
  const selectedDate = Form.useWatch('appointmentDate', form);

  React.useEffect(() => {
    // In a real app, this mapping would come from a database or a config file.
    const serviceResourceMap: { [key: string]: string[] } = {
      'general': ['doc1', 'doc2'],
      'specialist': ['doc1', 'doc2'],
      'vaccine': ['room1'],
      'ultrasound': ['room2'],
    };

    if (selectedService) {
        const resourceIds = serviceResourceMap[selectedService] || [];
        const filtered = resources.filter(r => resourceIds.includes(r.id));
        setAvailableResources(filtered);
        // Reset the selected resource when the service changes to avoid inconsistency.
        form.setFieldsValue({ resourceId: undefined });
    } else {
        setAvailableResources(resources);
    }
  }, [selectedService, resources, form]);


  React.useEffect(() => {
    const performSearch = async () => {
        if (debouncedSearchTerm) {
            setSearching(true);
            const { data, error } = await getPatients({
              search: debouncedSearchTerm,
              limit: 10
            });
            if (error) {
                // Handle error, maybe show a notification
                setPatientOptions([]);
            } else {
                const options: PatientOption[] = data?.map((p: any) => ({
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
                    value: '__CREATE_NEW__',
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
      if (value === '__CREATE_NEW__') {
          // Handle opening a new patient creation modal or form
          // For now, we can just log it.
          console.log("Create new patient selected");
          // You might want to clear the search input here
          setSearchTerm('');
          return;
      }
      
      const patient = option.patient;
      if (patient) {
          setSelectedPatient(patient);
          form.setFieldsValue({ patientName: patient.full_name, patientPhone: patient.phone_number });
      }
  }

  const disabledTime = () => {
    if (!selectedDate || !selectedResourceId) {
      return {};
    }

    const bookedTimes = appointments
      .filter(app => dayjs(app.appointment_time).isSame(selectedDate, 'day'))
      .map(app => dayjs(app.appointment_time));

    const disabledHours = () => {
      const hours = new Set<number>();
      bookedTimes.forEach(time => {
        // Assuming 15-minute slots, if all 4 slots in an hour are booked, disable the hour
        const startOfHour = time.startOf('hour');
        // const slotsInHour = [
        //   startOfHour,
        //   startOfHour.add(15, 'minutes'),
        //   startOfHour.add(30, 'minutes'),
        //   startOfHour.add(45, 'minutes'),
        // ];
        const bookedSlotsInHour = bookedTimes.filter(bt => bt.isSame(startOfHour, 'hour'));
        if (bookedSlotsInHour.length >= 4) {
            hours.add(time.hour());
        }
      });
      return Array.from(hours);
    };

    const disabledMinutes = (hour: number) => {
      const minutes = new Set<number>();
      bookedTimes.forEach(time => {
        if (time.hour() === hour) {
          minutes.add(time.minute());
        }
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
      title: 'Bệnh nhân',
      icon: <UserOutlined />,
      content: (
        <>
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
              <Form.Item name="patientName" label="Họ và Tên" rules={[{ required: true, message: 'Vui lòng nhập tên bệnh nhân' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="patientPhone" label="Số điện thoại" rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
        </>
      ),
    },
    {
      title: 'Dịch vụ',
      icon: <SolutionOutlined />,
      content: (
        <>
          <Form.Item name="service" label="Chọn dịch vụ" rules={[{ required: true, message: 'Vui lòng chọn dịch vụ' }]}>
            <Select placeholder="Chọn dịch vụ khám">
              <Select.Option value="general">Khám tổng quát</Select.Option>
              <Select.Option value="specialist">Khám chuyên khoa</Select.Option>
              <Select.Option value="vaccine">Tiêm chủng</Select.Option>
              <Select.Option value="ultrasound">Siêu âm</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="resourceId" label="Chọn bác sĩ/phòng" rules={[{ required: true, message: 'Vui lòng chọn nguồn lực' }]}>
            <Select placeholder="Chọn bác sĩ hoặc phòng khám" disabled={!selectedService}>
              {availableResources.map(r => <Select.Option key={r.id} value={r.id}>{r.name}</Select.Option>)}
            </Select>
          </Form.Item>
        </>
      ),
    },
    {
      title: 'Thời gian',
      icon: <ClockCircleOutlined />,
      content: (
        <Row gutter={16}>
            <Col span={12}>
                <Form.Item name="appointmentDate" label="Chọn ngày" rules={[{ required: true, message: 'Vui lòng chọn ngày' }]}>
                    <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" disabledDate={(current) => current && current < dayjs().endOf('day')} />
                </Form.Item>
            </Col>
            <Col span={12}>
                <Form.Item name="appointmentTime" label="Chọn giờ" rules={[{ required: true, message: 'Vui lòng chọn giờ' }]}>
                    <TimePicker style={{ width: '100%' }} format="HH:mm" minuteStep={15} disabled={!selectedDate || loadingAppointments} disabledTime={disabledTime} />
                </Form.Item>
            </Col>
        </Row>
      ),
    },
    {
      title: 'Xác nhận & Ghi chú',
      icon: <CheckCircleOutlined />,
      content: (
        <ConfirmationStep form={form} resources={resources} />
      ),
    },
  ];

  const handleNext = async () => {
    try {
      // Define fields to validate for each step
      const fieldsToValidate = [
        ['patientName', 'patientPhone'], // Step 0: Patient info
        ['service', 'resourceId'],       // Step 1: Service info
        ['appointmentDate', 'appointmentTime'], // Step 2: Time info
        [] // Step 3: Confirmation (no new fields to validate)
      ];

      if (currentStep < fieldsToValidate.length) {
        await form.validateFields(fieldsToValidate[currentStep]);
      }
      setCurrentStep(currentStep + 1);
    } catch (error) {
      // Errors will be displayed on the form fields
      console.log('Validation failed:', error);
    }
  };

  const handlePrev = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleFormFinish = () => {
    form.validateFields().then(() => {
        const allValues = { ...form.getFieldsValue(true), patientId: selectedPatient?.id };
        onFinish(allValues);
        form.resetFields();
        setCurrentStep(0);
        setSelectedPatient(null);
    }).catch(info => {
        console.log('Validate Failed:', info);
    });
  };

  return (
    <Modal
      open={open}
      title="Tạo Lịch hẹn mới (4 bước Siêu tốc)"
      onCancel={onClose}
      width={800}
      footer={
        <Space>
          <Button onClick={onClose}>Hủy</Button>
          {currentStep > 0 && (
            <Button onClick={handlePrev}>
              Quay lại
            </Button>
          )}
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
        <Steps current={currentStep} style={{ margin: '24px 0' }}>
          {steps.map(item => (
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

// Define interface for form values
interface AppointmentFormValues {
    patientName?: string;
    patientPhone?: string;
    service?: string;
    resourceId?: string;
    appointmentDate?: any;
    appointmentTime?: any;
    notes?: string;
    sendConfirmation?: boolean;
}

// Confirmation Step Component
const ConfirmationStep = ({ form, resources }: { form: any, resources: any[] }) => {
    const values = Form.useWatch([], form) as AppointmentFormValues || {};

    // Service name mapping
    const getServiceName = (serviceValue?: string) => {
        const serviceMap: { [key: string]: string } = {
            'general': 'Khám tổng quát',
            'specialist': 'Khám chuyên khoa',
            'vaccine': 'Tiêm chủng',
            'ultrasound': 'Siêu âm'
        };
        return serviceValue ? (serviceMap[serviceValue] || serviceValue) : 'Chưa chọn';
    };

    const resourceName = resources.find(r => r.id === values.resourceId)?.name || 'Chưa chọn';
    const appointmentDateTime = values.appointmentDate && values.appointmentTime
        ? `${values.appointmentDate.format('DD/MM/YYYY')} lúc ${values.appointmentTime.format('HH:mm')}`
        : 'Chưa chọn';

    const items = [
        { label: 'Bệnh nhân', value: values.patientName || 'Chưa nhập' },
        { label: 'Số điện thoại', value: values.patientPhone || 'Chưa nhập' },
        { label: 'Dịch vụ', value: getServiceName(values.service) },
        { label: 'Bác sĩ/Phòng', value: resourceName },
        { label: 'Thời gian', value: appointmentDateTime },
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
                    renderItem={item => (
                        <List.Item>
                            <List.Item.Meta
                                title={<Text strong>{item.label}</Text>}
                                description={
                                    <Text style={{
                                        color: item.value === 'Chưa chọn' || item.value === 'Chưa nhập' ? '#ff4d4f' : '#000',
                                        fontSize: '14px'
                                    }}>
                                        {item.value || 'Chưa nhập'}
                                    </Text>
                                }
                            />
                        </List.Item>
                    )}
                />
                <div style={{ marginTop: 16 }}>
                    <Form.Item name="notes" label="Ghi chú">
                        <Input.TextArea rows={3} placeholder="Thêm ghi chú cho cuộc hẹn..." />
                    </Form.Item>
                    <Form.Item name="sendConfirmation" valuePropName="checked">
                        <Checkbox>Gửi SMS/Zalo xác nhận cho khách hàng</Checkbox>
                    </Form.Item>
                </div>
            </Result>
        </Card>
    );
};

export default AppointmentCreationModal;