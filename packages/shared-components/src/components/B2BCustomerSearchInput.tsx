import React, { useState, useEffect } from "react";
import { AutoComplete, Avatar, Space, Typography, Tag, App, Spin } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { getB2BCustomers } from "@nam-viet-erp/services";
import { useDebounce } from "../hooks/useDebounce";

const { Text } = Typography;

interface B2BCustomerSearchInputProps {
  value?: IB2BCustomer | null;
  onChange?: (customer: IB2BCustomer | null) => void;
  placeholder?: string;
  allowClear?: boolean;
  disabled?: boolean;
  style?: React.CSSProperties;
  size?: "small" | "middle" | "large";
}

const B2BCustomerSearchInput: React.FC<B2BCustomerSearchInputProps> = ({
  value,
  onChange,
  placeholder = "Tìm kiếm khách hàng B2B...",
  allowClear = true,
  disabled = false,
  style,
  size = "middle",
}) => {
  const { notification } = App.useApp();
  const [searchTerm, setSearchTerm] = useState("");
  const [customers, setCustomers] = useState<IB2BCustomer[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Search customers when debounced search term changes
  useEffect(() => {
    if (debouncedSearchTerm && debouncedSearchTerm.length >= 2) {
      searchCustomers(debouncedSearchTerm);
    } else {
      setCustomers([]);
      setOpen(false);
    }
  }, [debouncedSearchTerm]);

  // Update search term when value changes externally
  useEffect(() => {
    if (value) {
      setSearchTerm(value.customer_name);
    } else if (!searchTerm) {
      setSearchTerm("");
    }
  }, [value]);

  const searchCustomers = async (term: string) => {
    try {
      setLoading(true);
      const { data, error } = await getB2BCustomers({
        isActive: true,
        limit: 20,
        search: term.toLowerCase(),
      });

      if (error) throw error;

      const searchResults = (data || []).filter(
        (customer) =>
          customer.customer_name.toLowerCase().includes(term.toLowerCase()) ||
          customer.customer_code.toLowerCase().includes(term.toLowerCase()) ||
          (customer.contact_person &&
            customer.contact_person
              .toLowerCase()
              .includes(term.toLowerCase())) ||
          (customer.phone_number && customer.phone_number.includes(term)) ||
          (customer.email &&
            customer.email.toLowerCase().includes(term.toLowerCase()))
      );

      setCustomers(searchResults);
      setOpen(searchResults.length > 0);
    } catch (error: any) {
      notification.error({
        message: "Lỗi tìm kiếm",
        description: error.message || "Không thể tìm kiếm khách hàng B2B",
      });
    } finally {
      setLoading(false);
    }
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

  const handleSelect = (selectedValue: string, option: any) => {
    const selectedCustomer = customers.find(
      (customer) => customer.customer_id === selectedValue
    );
    if (selectedCustomer) {
      setSearchTerm(selectedCustomer.customer_name);
      onChange?.(selectedCustomer);
      setOpen(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    if (!value) {
      onChange?.(null);
      setCustomers([]);
      setOpen(false);
    }
  };

  const handleClear = () => {
    setSearchTerm("");
    onChange?.(null);
    setCustomers([]);
    setOpen(false);
  };

  const options = customers.map((customer) => ({
    key: customer.customer_id,
    value: customer.customer_id,
    label: (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "8px 0",
          borderBottom: "1px solid #f0f0f0",
        }}
      >
        <Avatar
          size={32}
          icon={<UserOutlined />}
          style={{
            backgroundColor: getCustomerTypeColor(customer.customer_type),
            marginRight: 12,
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Text strong style={{ fontSize: 14 }}>
              {customer.customer_name}
            </Text>
            <Tag
              color="blue"
              style={{ fontSize: 11, padding: "0 4px", lineHeight: "16px" }}
            >
              {getCustomerTypeLabel(customer.customer_type)}
            </Tag>
          </div>
          <div style={{ marginTop: 2 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {customer.customer_code}
            </Text>
            {customer.contact_person && (
              <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                • {customer.contact_person}
              </Text>
            )}
            {customer.phone_number && (
              <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                • {customer.phone_number}
              </Text>
            )}
          </div>
        </div>
      </div>
    ),
  }));

  return (
    <AutoComplete
      value={searchTerm}
      options={options}
      onSelect={handleSelect}
      onSearch={handleSearch}
      placeholder={placeholder}
      allowClear={allowClear}
      disabled={disabled}
      style={style}
      size={size}
      open={open}
      onDropdownVisibleChange={setOpen}
      styles={{
        popup: {
          root: {
            maxHeight: 300,
            overflow: "auto",
          },
        },
      }}
      notFoundContent={
        loading ? (
          <div style={{ textAlign: "center", padding: 16 }}>
            <Spin size="small" />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">Đang tìm kiếm...</Text>
            </div>
          </div>
        ) : searchTerm && searchTerm.length >= 2 ? (
          <div style={{ textAlign: "center", padding: 16 }}>
            <Text type="secondary">
              Không tìm thấy khách hàng nào chứa "{searchTerm}"
            </Text>
          </div>
        ) : searchTerm && searchTerm.length < 2 ? (
          <div style={{ textAlign: "center", padding: 16 }}>
            <Text type="secondary">Nhập ít nhất 2 ký tự để tìm kiếm</Text>
          </div>
        ) : null
      }
    />
  );
};

export default B2BCustomerSearchInput;
