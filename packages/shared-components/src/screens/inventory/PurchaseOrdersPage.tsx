import React, { useState, useEffect } from "react";
import {
  Button,
  Table,
  Space,
  Row,
  Col,
  Typography,
  App as AntApp,
  Tag,
  type TableProps,
  Input,
  Grid,
} from "antd";
import { PlusOutlined, RobotOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import {
  getPurchaseOrder,
  autoGeneratePurchaseOrders,
} from "@nam-viet-erp/services";

const { Title } = Typography;
const { Search } = Input;
const { useBreakpoint } = Grid;

interface PurchaseOrdersPageProps {
  employee?: any;
}

const PurchaseOrdersContent: React.FC<PurchaseOrdersPageProps> = ({
  employee,
}) => {
  const { notification, modal } = AntApp.useApp();
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const screens = useBreakpoint();
  const isMobile = !screens.lg;

  const fetchPOs = async () => {
    setLoading(true);
    try {
      // Chúng ta cần join với bảng suppliers để lấy tên Nhà Cung Cấp
      const { data, error } = await getPurchaseOrder();
      if (error) throw error;
      setPurchaseOrders(data || []);
    } catch (error: any) {
      notification.error({
        message: "Lỗi tải đơn đặt hàng",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPOs();
  }, [notification]);

  const handleAutoGenerate = async () => {
    if (!employee?.warehouse_id) {
      notification.error({
        message: "Lỗi",
        description:
          "Bạn chưa được gán kho hàng. Vui lòng liên hệ quản trị viên.",
      });
      return;
    }

    modal.confirm({
      title: "Xác nhận Tạo Dự trù Tự động?",
      content:
        "Hệ thống sẽ quét kho và tự động tạo các đơn hàng nháp cho các sản phẩm dưới tồn tối thiểu. Quá trình này có thể mất vài phút.",
      okText: "Bắt đầu",
      cancelText: "Hủy",
      onOk: async () => {
        setLoading(true);
        try {
          const result = await autoGeneratePurchaseOrders(
            employee.warehouse_id,
            employee.employee_id || null
          );

          notification.success({
            message: "Đã tạo thành công!",
            description: result.message,
          });

          // Reload purchase orders list
          await fetchPOs();
        } catch (error: any) {
          notification.error({
            message: "Tạo dự trù thất bại",
            description: error.message,
          });
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const columns: TableProps<any>["columns"] = [
    {
      title: "Mã ĐH",
      dataIndex: "id",
      key: "id",
      render: (id) => `PO-${String(id).padStart(5, "0")}`,
    },
    {
      title: "Nhà Cung Cấp",
      dataIndex: "suppliers",
      key: "supplier_name",
      render: (supplier) => supplier?.name || "N/A",
    },
    {
      title: "Ngày tạo",
      dataIndex: "created_at",
      key: "created_at",
      render: (date) => dayjs(date).format("DD/MM/YYYY"),
    },
    { title: "Người tạo", dataIndex: "created_by", key: "created_by" },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => <Tag>{status}</Tag>,
    },
    {
      title: "Hành động",
      key: "action",
      render: () => (
        <Space>
          <Button size="small">Xem</Button>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2}>Quản lý Đặt hàng</Title>
        </Col>
        <Col>
          <Space wrap>
            <Button icon={<RobotOutlined />} onClick={handleAutoGenerate}>
              Tạo Dự trù & Lên Đơn hàng Loạt
            </Button>
            <Button type="primary" icon={<PlusOutlined />}>
              {!isMobile && "Tạo Đơn hàng Thủ công"}
            </Button>
          </Space>
        </Col>
      </Row>
      <Row style={{ marginBottom: 16 }} gutter={16}>
        <Col span={12}>
          <Search placeholder="Tìm theo Mã ĐH, Tên NCC..." allowClear />
        </Col>
      </Row>
      <Table
        columns={columns}
        dataSource={purchaseOrders}
        loading={loading}
        rowKey="id"
      />
    </>
  );
};

const PurchaseOrders: React.FC<PurchaseOrdersPageProps> = ({ employee }) => (
  <AntApp>
    <PurchaseOrdersContent employee={employee} />
  </AntApp>
);
export default PurchaseOrders;
