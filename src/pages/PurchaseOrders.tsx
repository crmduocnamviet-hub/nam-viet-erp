// src/pages/PurchaseOrders.tsx

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
import { useNavigate } from "react-router-dom";
import ResponsiveButtonGroup from "../components/ResponsiveButtonGroup";

const { Title } = Typography;
const { Search } = Input;

const PurchaseOrdersContent: React.FC = () => {
  const { notification, modal } = AntApp.useApp();
  const navigate = useNavigate();
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
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

  useEffect(() => {
    fetchData();
  }, []);

  const handleAutoGenerate = async () => {
    modal.confirm({
      title: "Xác nhận Tạo Dự trù Tự động?",
      content:
        "Hệ thống sẽ quét kho và tự động tạo các đơn hàng nháp cho các sản phẩm dưới tồn tối thiểu.",
      okText: "Bắt đầu",
      cancelText: "Hủy",
      onOk: async () => {
        setLoading(true);
        notification.info({
          message: "Đang xử lý...",
          description: "Hệ thống đang phân tích tồn kho và tạo đơn hàng.",
        });
        try {
          const { data: result, error } = await supabase.rpc(
            "generate_draft_purchase_orders"
          );
          if (error) throw error;
          if (result && result.length > 0) {
            notification.success({
              message: "Hoàn tất tạo dự trù!",
              description: `Đã tạo thành công ${result.length} đơn hàng nháp.`,
              duration: 5,
            });
          } else {
            notification.info({
              message: "Không có sản phẩm nào cần đặt hàng",
              description:
                "Tất cả sản phẩm trong Kho Tổng B2B đều đang trên mức tồn kho tối thiểu.",
            });
          }
          fetchData();
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

  const mainActions = [
    {
      text: "Tạo Dự trù & Lên đơn hàng loạt",
      icon: <RobotOutlined />,
      onClick: handleAutoGenerate,
      type: "default" as const,
    },
    {
      text: "Tạo Đơn hàng Thủ công",
      icon: <PlusOutlined />,
      onClick: () => navigate("/purchase-orders/new"),
      type: "primary" as const,
    },
  ];

  // --- NÂNG CẤP: Logic hiển thị Tag màu cho trạng thái ---
  const getStatusTag = (status: string) => {
    switch (status) {
      case "Nháp":
        return <Tag color="default">⚫ Nháp</Tag>;
      case "Đã đặt - Chờ nhận hàng":
        return <Tag color="blue">🔵 Chờ nhận hàng</Tag>;
      case "Đang Nhập Kho":
        return <Tag color="processing">🟡 Đang Nhập Kho</Tag>;
      case "Hoàn Tất":
        return <Tag color="success">✅ Hoàn Tất</Tag>;
      case "Đã Hủy":
        return <Tag color="error">🔴 Đã Hủy</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
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
      render: getStatusTag, // <-- Sử dụng hàm mới
    },
    {
      title: "Hành động",
      key: "action",
      render: (_, record: any) => {
        // --- NÂNG CẤP: Logic hiển thị nút hành động theo trạng thái ---
        if (record.status === "Nháp") {
          return (
            <Button
              size="small"
              onClick={() => navigate(`/purchase-orders/${record.id}`)}
            >
              Xem / Sửa
            </Button>
          );
        }
        if (record.status === "Đã đặt - Chờ nhận hàng") {
          return (
            <Button
              type="primary"
              size="small"
              onClick={() => navigate(`/receive-po/${record.id}`)}
            >
              Nhập Kho
            </Button>
          );
        }
        return (
          <Button
            size="small"
            onClick={() => navigate(`/purchase-orders/${record.id}`)}
          >
            Xem
          </Button>
        );
      },
    },
  ];

  return (
    <>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2}>Quản lý Đặt hàng</Title>
        </Col>
        <Col>
          <ResponsiveButtonGroup buttons={mainActions} />
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
