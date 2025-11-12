import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Input,
  Space,
  Typography,
  Tag,
  Grid,
  Button,
  Modal,
  Popconfirm,
  Avatar,
  App as AntApp,
  type TableProps,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  GiftOutlined,
} from "@ant-design/icons";
import { useDebounce } from "@nam-viet-erp/shared-components";
import { getActiveCombos, deleteCombo } from "@nam-viet-erp/services";
import { useComboStore } from "@nam-viet-erp/store";
import ComboFormModal from "../../components/ComboFormModal";

const { Title, Text } = Typography;
const { Search } = Input;
const { useBreakpoint } = Grid;

interface ComboListPageContentProps {
  hasPermission?: (permission: string) => boolean;
}

const ComboListPageContent: React.FC<ComboListPageContentProps> = ({
  hasPermission = () => true,
}) => {
  const { notification } = AntApp.useApp();
  const screens = useBreakpoint();
  const isMobile = !screens.lg;

  const [combos, setCombos] = useState<IComboWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const [isComboModalOpen, setIsComboModalOpen] = useState(false);
  const [editingCombo, setEditingCombo] = useState<IComboWithItems | null>(
    null,
  );

  // Combo Store
  const { fetchCombos: fetchCombosToStore } = useComboStore();

  const canCreateCombo = hasPermission("inventory.create");
  const canUpdateCombo = hasPermission("inventory.update");
  const canDeleteCombo = hasPermission("inventory.delete");

  const fetchCombos = async () => {
    setLoading(true);
    try {
      const { data, error } = await getActiveCombos();
      if (error) throw error;

      // Calculate pricing info for each combo
      const combosWithPricing = (data || []).map((combo) => {
        let originalPrice = 0;
        if (combo.combo_items) {
          for (const item of combo.combo_items) {
            if (item.products?.retail_price) {
              originalPrice += item.products.retail_price * item.quantity;
            }
          }
        }
        const discountAmount = originalPrice - combo.combo_price;
        const discountPercentage =
          originalPrice > 0 ? (discountAmount / originalPrice) * 100 : 0;

        return {
          ...combo,
          original_price: originalPrice,
          discount_amount: discountAmount,
          discount_percentage: discountPercentage,
        };
      });

      // Filter by search term
      const filtered = combosWithPricing.filter(
        (combo) =>
          combo.name
            .toLowerCase()
            .includes(debouncedSearchTerm.toLowerCase()) ||
          combo.description
            ?.toLowerCase()
            .includes(debouncedSearchTerm.toLowerCase()),
      );

      setCombos(filtered);

      // Also update the combo store
      fetchCombosToStore();
    } catch (error: any) {
      notification.error({
        message: "Lỗi tải dữ liệu",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCombos();
  }, [debouncedSearchTerm]);

  const handleCreate = () => {
    setEditingCombo(null);
    setIsComboModalOpen(true);
  };

  const handleEdit = (combo: IComboWithItems) => {
    setEditingCombo(combo);
    setIsComboModalOpen(true);
  };

  const handleDelete = async (comboId: number) => {
    try {
      const { error } = await deleteCombo(comboId);
      if (error) throw error;

      notification.success({
        message: "Xóa thành công",
        description: "Combo đã được xóa khỏi hệ thống",
      });
      fetchCombos();
    } catch (error: any) {
      notification.error({
        message: "Lỗi xóa combo",
        description: error.message,
      });
    }
  };

  const handleModalClose = () => {
    setIsComboModalOpen(false);
    setEditingCombo(null);
    fetchCombos();
  };

  const columns: TableProps<IComboWithItems>["columns"] = [
    {
      title: "Combo",
      dataIndex: "name",
      key: "name",
      width: 250,
      fixed: isMobile ? undefined : "left",
      render: (text: string, record: IComboWithItems) => (
        <Space>
          <Avatar
            shape="square"
            size={isMobile ? 40 : 48}
            src={record.image_url}
            icon={<GiftOutlined />}
            style={{ backgroundColor: "#faad14" }}
          />
          <div>
            <Typography.Text
              strong
              style={{ display: "block", marginBottom: 4 }}
            >
              {text}
            </Typography.Text>
            {record.description && (
              <div style={{ color: "gray", fontSize: "11px", maxWidth: 180 }}>
                {record.description}
              </div>
            )}
            {/* Show item count on mobile */}
            {isMobile && (
              <Text type="secondary" style={{ fontSize: "11px" }}>
                {record.combo_items?.length || 0} sản phẩm
              </Text>
            )}
          </div>
        </Space>
      ),
    },
    {
      title: "Sản phẩm",
      key: "items",
      width: 200,
      responsive: ["lg"],
      render: (_: any, record: IComboWithItems) => (
        <div>
          {record.combo_items?.slice(0, 3).map((item, idx) => (
            <div key={idx} style={{ fontSize: "11px", marginBottom: 2 }}>
              • {item.products?.name || `Product ${item.product_id}`} x
              {item.quantity}
            </div>
          ))}
          {record.combo_items && record.combo_items.length > 3 && (
            <Text type="secondary" style={{ fontSize: "11px" }}>
              +{record.combo_items.length - 3} sản phẩm khác
            </Text>
          )}
        </div>
      ),
    },
    {
      title: "Giá",
      key: "price",
      width: 180,
      render: (_: any, record: IComboWithItems) => (
        <div>
          <div style={{ marginBottom: 4 }}>
            <Text delete style={{ color: "#999", fontSize: "12px" }}>
              {record.original_price?.toLocaleString("vi-VN")}đ
            </Text>
          </div>
          <div>
            <Text strong style={{ color: "#52c41a", fontSize: "15px" }}>
              {record.combo_price.toLocaleString("vi-VN")}đ
            </Text>
          </div>
          <Tag color="orange" style={{ marginTop: 4, fontSize: "11px" }}>
            -{record.discount_percentage?.toFixed(0)}%
          </Tag>
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "is_active",
      key: "is_active",
      width: 110,
      responsive: ["md"],
      render: (isActive: boolean) => (
        <Tag color={isActive ? "green" : "red"}>
          {isActive ? "Hoạt động" : "Tạm dừng"}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      fixed: isMobile ? undefined : "right",
      width: isMobile ? 80 : 100,
      render: (_: any, record: IComboWithItems) => (
        <Space size="small" direction={isMobile ? "vertical" : "horizontal"}>
          {canUpdateCombo && (
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              size="small"
            >
              {!isMobile && "Sửa"}
            </Button>
          )}
          {canDeleteCombo && (
            <Popconfirm
              title="Xóa combo?"
              description="Bạn có chắc chắn muốn xóa combo này?"
              onConfirm={() => handleDelete(record.id)}
              okText="Xóa"
              cancelText="Hủy"
              okButtonProps={{ danger: true }}
            >
              <Button type="link" danger icon={<DeleteOutlined />} size="small">
                {!isMobile && "Xóa"}
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "12px", minHeight: "100vh" }}>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <div>
          <Title level={isMobile ? 3 : 2} style={{ margin: 0 }}>
            🎁 Quản lý Combo Sản phẩm
          </Title>
          <Text
            type="secondary"
            style={{ fontSize: isMobile ? "14px" : "16px" }}
          >
            Tạo và quản lý các combo khuyến mãi
          </Text>
        </div>

        <Card>
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            <Space
              style={{ width: "100%", justifyContent: "space-between" }}
              wrap
            >
              <Search
                placeholder="Tìm kiếm combo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                prefix={<SearchOutlined />}
                allowClear
                size={isMobile ? "middle" : "large"}
                style={{ width: isMobile ? "100%" : 300 }}
              />
              {canCreateCombo && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleCreate}
                  size={isMobile ? "middle" : "large"}
                >
                  Tạo Combo Mới
                </Button>
              )}
            </Space>

            <Table
              columns={columns}
              dataSource={combos}
              loading={loading}
              rowKey="id"
              scroll={{ x: 800 }}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `Tổng ${total} combo`,
              }}
            />
          </Space>
        </Card>
      </Space>

      <ComboFormModal
        open={isComboModalOpen}
        combo={editingCombo}
        onCancel={handleModalClose}
        onSuccess={handleModalClose}
      />
    </div>
  );
};

const ComboListPage: React.FC<ComboListPageContentProps> = (props) => (
  <AntApp>
    <ComboListPageContent {...props} />
  </AntApp>
);

export default ComboListPage;
