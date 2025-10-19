import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Tag,
  Popconfirm,
  App,
  Row,
  Col,
  Statistic,
  Badge,
} from "antd";
import {
  HomeOutlined,
  PlusOutlined,
  DeleteOutlined,
  EyeOutlined,
  MedicineBoxOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import {
  getRooms,
  createRoom,
  updateRoom,
  deleteRoom,
  getRoomStatistics,
  checkRoomNameExists,
  type Room,
  type CreateRoomData,
  type UpdateRoomData,
} from "@nam-viet-erp/services";

const { Title, Text } = Typography;
const { TextArea } = Input;

const roomTypeOptions = [
  { label: "🏥 Phòng Y tế", value: "medical" },
  { label: "🛌 Phòng Điều trị", value: "treatment" },
  { label: "👨‍⚕️ Phòng Tư vấn", value: "consultation" },
  { label: "🔬 Phòng Chẩn đoán", value: "diagnostic" },
  { label: "📋 Khác", value: "other" },
];

const getRoomTypeDisplay = (type: Room["room_type"]) => {
  const option = roomTypeOptions.find((opt) => opt.value === type);
  return option ? option.label : type;
};

const RoomManagementPage: React.FC = () => {
  const { notification } = App.useApp();
  const [form] = Form.useForm();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">(
    "create",
  );
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load rooms and statistics
  const loadRoomsData = async () => {
    setLoading(true);
    try {
      const [roomsResponse, statsResponse] = await Promise.all([
        getRooms(),
        getRoomStatistics(),
      ]);

      if (roomsResponse.error) throw roomsResponse.error;
      if (statsResponse.error) throw statsResponse.error;

      setRooms(roomsResponse.data || []);
      setStatistics(statsResponse.data);
    } catch (error: any) {
      notification.error({
        message: "Lỗi tải dữ liệu",
        description: error.message || "Không thể tải danh sách phòng",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoomsData();
  }, []);

  // Handle create room
  const handleCreateRoom = () => {
    setModalMode("create");
    setEditingRoom(null);
    form.resetFields();
    setModalOpen(true);
  };

  // Handle edit room
  const handleEditRoom = (room: Room) => {
    setModalMode("edit");
    setEditingRoom(room);
    form.setFieldsValue({
      name: room.name,
      description: room.description,
      room_type: room.room_type,
      capacity: room.capacity,
      equipment: room.equipment,
      is_active: room.is_active,
    });
    setModalOpen(true);
  };

  // Handle view room
  const handleViewRoom = (room: Room) => {
    setModalMode("view");
    setEditingRoom(room);
    form.setFieldsValue({
      name: room.name,
      description: room.description,
      room_type: room.room_type,
      capacity: room.capacity,
      equipment: room.equipment,
      is_active: room.is_active,
    });
    setModalOpen(true);
  };

  // Handle delete room
  const handleDeleteRoom = async (roomId: string) => {
    try {
      const { error } = await deleteRoom(roomId);
      if (error) throw error;

      notification?.success({
        message: "Đã xóa phòng",
        description: "Phòng đã được xóa thành công",
      });

      await loadRoomsData();
    } catch (error: any) {
      notification.error({
        message: "Lỗi xóa phòng",
        description: error.message || "Không thể xóa phòng",
      });
    }
  };

  // Handle form submission
  const handleSubmit = async (values: any) => {
    setIsSubmitting(true);
    try {
      // Check for duplicate name
      const { exists } = await checkRoomNameExists(
        values.name,
        editingRoom?.room_id,
      );

      if (exists) {
        notification.error({
          message: "Tên phòng đã tồn tại",
          description: "Vui lòng chọn tên khác cho phòng",
        });
        return;
      }

      if (modalMode === "create") {
        const { error } = await createRoom(values as CreateRoomData);
        if (error) throw error;

        notification?.success({
          message: "Đã tạo phòng mới",
          description: "Phòng đã được tạo thành công",
        });
      } else if (modalMode === "edit" && editingRoom) {
        const { error } = await updateRoom(
          editingRoom.room_id,
          values as UpdateRoomData,
        );
        if (error) throw error;

        notification?.success({
          message: "Đã cập nhật phòng",
          description: "Thông tin phòng đã được cập nhật thành công",
        });
      }

      setModalOpen(false);
      await loadRoomsData();
    } catch (error: any) {
      notification.error({
        message:
          modalMode === "create" ? "Lỗi tạo phòng" : "Lỗi cập nhật phòng",
        description: error.message || "Có lỗi xảy ra",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: ColumnsType<Room> = [
    {
      title: "Tên Phòng",
      dataIndex: "name",
      key: "name",
      render: (name: string, record: Room) => (
        <Space>
          <HomeOutlined style={{ color: "#1890ff" }} />
          <Text strong>{name}</Text>
          {!record.is_active && <Tag color="red">Ngưng hoạt động</Tag>}
        </Space>
      ),
    },
    {
      title: "Loại Phòng",
      dataIndex: "room_type",
      key: "room_type",
      render: (type: Room["room_type"]) => (
        <Tag color="blue">{getRoomTypeDisplay(type)}</Tag>
      ),
    },
    {
      title: "Sức Chứa",
      dataIndex: "capacity",
      key: "capacity",
      render: (capacity: number) => (capacity ? `${capacity} người` : "—"),
      align: "center",
    },
    {
      title: "Thiết Bị",
      dataIndex: "equipment",
      key: "equipment",
      render: (equipment: string[]) => (
        <div>
          {equipment && equipment.length > 0 ? (
            equipment.slice(0, 2).map((item, index) => (
              <Tag key={index} style={{ marginBottom: 2 }}>
                {item}
              </Tag>
            ))
          ) : (
            <Text type="secondary">Chưa có</Text>
          )}
          {equipment && equipment.length > 2 && (
            <Tag>+{equipment.length - 2} khác</Tag>
          )}
        </div>
      ),
    },
    {
      title: "Trạng Thái",
      dataIndex: "is_active",
      key: "is_active",
      render: (isActive: boolean) => (
        <Badge
          status={isActive ? "success" : "error"}
          text={isActive ? "Đang hoạt động" : "Ngưng hoạt động"}
        />
      ),
      align: "center",
    },
    {
      title: "Thao Tác",
      key: "action",
      render: (_, record: Room) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              handleViewRoom(record);
            }}
            title="Xem chi tiết"
          />
          <Popconfirm
            title="Xóa phòng"
            description="Bạn có chắc muốn xóa phòng này?"
            onConfirm={(e) => {
              e?.stopPropagation();
              handleDeleteRoom(record.room_id);
            }}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button
              type="text"
              icon={<DeleteOutlined />}
              danger
              title="Xóa"
              onClick={(e) => e.stopPropagation()}
            />
          </Popconfirm>
        </Space>
      ),
      align: "center" as const,
    },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>
          <MedicineBoxOutlined style={{ marginRight: 8, color: "#1890ff" }} />
          Quản lý Phòng
        </Title>
        <Text type="secondary">
          Quản lý các phòng y tế, điều trị và chẩn đoán trong hệ thống
        </Text>
      </div>

      {/* Statistics */}
      {statistics && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="Tổng số phòng"
                value={statistics.total}
                prefix={<HomeOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Đang hoạt động"
                value={statistics.active}
                valueStyle={{ color: "#3f8600" }}
                prefix={<Badge status="success" />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Ngưng hoạt động"
                value={statistics.inactive}
                valueStyle={{ color: "#cf1322" }}
                prefix={<Badge status="error" />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Phòng Y tế"
                value={statistics.byType.medical || 0}
                prefix={<MedicineBoxOutlined />}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Main Content */}
      <Card
        title="Danh sách Phòng"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreateRoom}
          >
            Thêm Phòng Mới
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={rooms}
          rowKey="room_id"
          loading={loading}
          onRow={(record) => ({
            onClick: () => handleEditRoom(record),
            style: { cursor: "pointer" },
          })}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} phòng`,
          }}
        />
      </Card>

      {/* Room Form Modal */}
      <Modal
        title={
          modalMode === "create"
            ? "🏥 Thêm Phòng Mới"
            : modalMode === "edit"
              ? "✏️ Chỉnh Sửa Phòng"
              : "👁️ Thông Tin Phòng"
        }
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={
          modalMode === "view"
            ? [
                <Button key="close" onClick={() => setModalOpen(false)}>
                  Đóng
                </Button>,
              ]
            : [
                <Button key="cancel" onClick={() => setModalOpen(false)}>
                  Hủy
                </Button>,
                <Button
                  key="submit"
                  type="primary"
                  loading={isSubmitting}
                  onClick={() => form.submit()}
                >
                  {modalMode === "create" ? "Tạo Phòng" : "Cập Nhật"}
                </Button>,
              ]
        }
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          disabled={modalMode === "view"}
        >
          <Form.Item
            name="name"
            label="Tên Phòng"
            rules={[
              { required: true, message: "Vui lòng nhập tên phòng" },
              { min: 2, message: "Tên phòng phải có ít nhất 2 ký tự" },
            ]}
          >
            <Input
              placeholder="Ví dụ: Phòng Tiêm Chủng, Phòng Siêu Âm"
              prefix={<HomeOutlined />}
            />
          </Form.Item>

          <Form.Item
            name="room_type"
            label="Loại Phòng"
            rules={[{ required: true, message: "Vui lòng chọn loại phòng" }]}
          >
            <Select placeholder="Chọn loại phòng" options={roomTypeOptions} />
          </Form.Item>

          <Form.Item name="description" label="Mô Tả">
            <TextArea
              rows={3}
              placeholder="Mô tả chi tiết về phòng..."
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="capacity" label="Sức Chứa (số người)">
                <InputNumber
                  min={1}
                  max={100}
                  placeholder="Số người"
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="is_active"
                label="Trạng Thái"
                initialValue={true}
              >
                <Select>
                  <Select.Option value={true}>✅ Đang hoạt động</Select.Option>
                  <Select.Option value={false}>
                    ❌ Ngưng hoạt động
                  </Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="equipment" label="Thiết Bị">
            <Select
              mode="tags"
              placeholder="Nhập tên thiết bị và nhấn Enter"
              style={{ width: "100%" }}
              options={[
                { label: "Máy siêu âm", value: "Máy siêu âm" },
                { label: "Máy X-quang", value: "Máy X-quang" },
                { label: "Máy đo huyết áp", value: "Máy đo huyết áp" },
                { label: "Giường khám", value: "Giường khám" },
                { label: "Tủ thuốc", value: "Tủ thuốc" },
                { label: "Máy tiệt trùng", value: "Máy tiệt trùng" },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RoomManagementPage;
