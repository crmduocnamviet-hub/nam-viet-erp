import React, { useState, useEffect } from "react";
import {
  Modal,
  Input,
  List,
  Avatar,
  Button,
  Space,
  Typography,
  Tag,
  Grid,
  App,
} from "antd";
import { UserOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { getB2BCustomers } from "@nam-viet-erp/services";

const { Text } = Typography;
const { useBreakpoint } = Grid;

interface B2BCustomerSearchModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (customer: IB2BCustomer) => void;
  title?: string;
}

const B2BCustomerSearchModal: React.FC<B2BCustomerSearchModalProps> = ({
  open,
  onClose,
  onSelect,
  title = "Chọn Khách hàng B2B",
}) => {
  const { notification } = App.useApp();
  const screens = useBreakpoint();
  const isMobile = !screens.lg;

  const [allCustomers, setAllCustomers] = useState<IB2BCustomer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<IB2BCustomer[]>(
    []
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  // Load customers when modal opens
  useEffect(() => {
    if (open && allCustomers.length === 0) {
      loadCustomers();
    }
  }, [open]);

  // Filter customers based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredCustomers(allCustomers);
      return;
    }

    const filtered = allCustomers.filter(
      (customer) =>
        customer.customer_name
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        customer.customer_code
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (customer.contact_person &&
          customer.contact_person
            .toLowerCase()
            .includes(searchTerm.toLowerCase())) ||
        (customer.phone_number && customer.phone_number.includes(searchTerm)) ||
        (customer.email &&
          customer.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (customer.address &&
          customer.address.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredCustomers(filtered);
  }, [searchTerm, allCustomers]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const { data, error } = await getB2BCustomers({
        isActive: true,
        limit: 500,
      });

      if (error) throw error;

      const customers = data || [];
      setAllCustomers(customers);
      setFilteredCustomers(customers);
    } catch (error: any) {
      notification.error({
        message: "Lỗi tải khách hàng",
        description: error.message || "Không thể tải danh sách khách hàng B2B",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCustomer = (customer: IB2BCustomer) => {
    onSelect(customer);
    onClose();
  };

  const handleClose = () => {
    setSearchTerm("");
    setFilteredCustomers(allCustomers);
    onClose();
  };

  const getCustomerTypeLabel = (type: string) => {
    const typeLabels = {
      hospital: "Bệnh viện",
      pharmacy: "Nhà thuốc",
      clinic: "Phòng khám",
      distributor: "Nhà phân phối",
      other: "Khác",
    };
    return typeLabels[type as keyof typeof typeLabels] || type;
  };

  const getCustomerTypeColor = (type: string) => {
    const typeColors = {
      hospital: "#52c41a",
      pharmacy: "#1890ff",
      clinic: "#722ed1",
      distributor: "#fa8c16",
      other: "#8c8c8c",
    };
    return typeColors[type as keyof typeof typeColors] || "#8c8c8c";
  };

  return (
    <Modal
      title={
        <Space>
          <UserOutlined />
          <span>{title}</span>
          {filteredCustomers.length > 0 && (
            <Tag color="blue">
              {filteredCustomers.length}/{allCustomers.length} khách hàng
            </Tag>
          )}
        </Space>
      }
      open={open}
      onCancel={handleClose}
      footer={[
        <Button key="close" onClick={handleClose}>
          Đóng
        </Button>,
        <Button
          key="refresh"
          onClick={() => {
            setSearchTerm("");
            loadCustomers();
          }}
          loading={loading}
        >
          Tải lại
        </Button>,
      ]}
      width={isMobile ? "95%" : 800}
      styles={{ body: { maxHeight: "60vh", overflowY: "auto" } }}
    >
      <Input.Search
        placeholder="Tìm kiếm theo tên, mã khách hàng, người liên hệ, số điện thoại..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ marginBottom: 16 }}
        size="large"
        allowClear
      />

      {searchTerm && (
        <div style={{ marginBottom: 12 }}>
          <Text type="secondary">
            Kết quả cho "{searchTerm}": {filteredCustomers.length} khách hàng
          </Text>
          {filteredCustomers.length === 0 && (
            <Button
              type="link"
              size="small"
              onClick={() => setSearchTerm("")}
              style={{ padding: 0, marginLeft: 8 }}
            >
              Hiển thị tất cả
            </Button>
          )}
        </div>
      )}

      <List
        loading={loading}
        itemLayout="horizontal"
        dataSource={filteredCustomers}
        pagination={{
          pageSize: isMobile ? 5 : 8,
          showSizeChanger: false,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} của ${total} khách hàng`,
        }}
        renderItem={(customer) => (
          <List.Item
            actions={[
              <Button
                type="primary"
                size="small"
                onClick={() => handleSelectCustomer(customer)}
              >
                Chọn
              </Button>,
            ]}
            style={{
              padding: 16,
              borderRadius: 8,
              marginBottom: 8,
              backgroundColor: "#fafafa",
              cursor: "pointer",
              border: "1px solid #e8e8e8",
            }}
            onClick={() => handleSelectCustomer(customer)}
          >
            <List.Item.Meta
              avatar={
                <Avatar
                  size={48}
                  icon={<UserOutlined />}
                  style={{
                    backgroundColor: getCustomerTypeColor(
                      customer.customer_type
                    ),
                  }}
                />
              }
              title={
                <Space>
                  <Text strong>{customer.customer_name}</Text>
                  <Tag color="blue">
                    {getCustomerTypeLabel(customer.customer_type)}
                  </Tag>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {customer.customer_code}
                  </Text>
                </Space>
              }
              description={
                <div>
                  {customer.contact_person && (
                    <div>👤 {customer.contact_person}</div>
                  )}
                  {customer.phone_number && (
                    <div>📞 {customer.phone_number}</div>
                  )}
                  {customer.email && <div>✉️ {customer.email}</div>}
                  {customer.address && <div>📍 {customer.address}</div>}
                  <div style={{ marginTop: 4 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Ngày tạo:{" "}
                      {dayjs(customer.created_at).format("DD/MM/YYYY")}
                    </Text>
                    {customer.tax_code && (
                      <Tag
                        color="purple"
                        style={{ marginLeft: 8, fontSize: 11 }}
                      >
                        MST: {customer.tax_code}
                      </Tag>
                    )}
                    {customer.credit_limit && customer.credit_limit > 0 && (
                      <Tag
                        color="orange"
                        style={{ marginLeft: 4, fontSize: 11 }}
                      >
                        Hạn mức: {customer.credit_limit.toLocaleString("vi-VN")}
                        đ
                      </Tag>
                    )}
                  </div>
                </div>
              }
            />
          </List.Item>
        )}
        locale={{
          emptyText: loading
            ? "Đang tải..."
            : searchTerm
            ? `Không tìm thấy khách hàng nào chứa "${searchTerm}"`
            : "Không có khách hàng B2B nào",
        }}
      />
    </Modal>
  );
};

export default B2BCustomerSearchModal;
