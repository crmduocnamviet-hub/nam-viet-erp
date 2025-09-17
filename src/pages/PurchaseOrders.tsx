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
} from "antd";
import { PlusOutlined, RobotOutlined } from "@ant-design/icons";
import { supabase } from "../lib/supabaseClient";
import dayjs from "dayjs";

const { Title } = Typography;
const { Search } = Input;

const PurchaseOrdersContent: React.FC = () => {
  const { notification, modal } = AntApp.useApp();
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPOs = async () => {
      setLoading(true);
      try {
        // Chúng ta cần join với bảng suppliers để lấy tên Nhà Cung Cấp
        const { data, error } = await supabase
          .from("purchase_orders")
          .select("*, suppliers(name)")
          .order("created_at", { ascending: false });
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
    fetchPOs();
  }, [notification]);

  const handleAutoGenerate = async () => {
    modal.confirm({
      title: "Xác nhận Tạo Dự trù Tự động?",
      content:
        "Hệ thống sẽ quét kho và tự động tạo các đơn hàng nháp cho các sản phẩm dưới tồn tối thiểu. Quá trình này có thể mất vài phút.",
      okText: "Bắt đầu",
      cancelText: "Hủy",
      onOk: async () => {
        setLoading(true);
        try {
          // Giả lập gọi một RPC function (sẽ xây dựng ở bước sau)
          // const { error } = await supabase.rpc('generate_draft_purchase_orders');
          // if (error) throw error;

          // Tạm thời, chúng ta sẽ thông báo thành công để kiểm tra luồng
          await new Promise((resolve) => setTimeout(resolve, 2000)); // Giả lập thời gian xử lý

          notification.success({
            message: "Đã tạo thành công các đơn hàng nháp!",
          });
          // fetchData(); // Tải lại danh sách
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
              Tạo Đơn hàng Thủ công
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

const PurchaseOrders: React.FC = () => (
  <AntApp>
    <PurchaseOrdersContent />
  </AntApp>
);
export default PurchaseOrders;
