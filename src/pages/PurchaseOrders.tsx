import React, { useState, useEffect, useCallback } from "react";
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
  List,
  Card,
} from "antd";
import { PlusOutlined, RobotOutlined } from "@ant-design/icons";
import { supabase } from "../lib/supabaseClient";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import ResponsiveButtonGroup from "../components/ResponsiveButtonGroup";

const { Title, Text } = Typography;
const { Search } = Input;
const { useBreakpoint } = Grid;

const PurchaseOrdersContent: React.FC = () => {
  const { notification, modal } = AntApp.useApp();
  const navigate = useNavigate();
  const screens = useBreakpoint();

  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
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
  }, [notification]);

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel("purchase-orders-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "purchase_orders" },
        () => fetchData()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

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
      render: (supplier) => (
        <Text strong style={{ color: "#1677ff" }}>
          {supplier?.name || "N/A"}
        </Text>
      ),
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
      render: getStatusTag,
    },
    {
      title: "Hành động",
      key: "action",
      render: (_, record: any) => {
        const actionButtonText = record.status === "Nháp" ? "Xem / Sửa" : "Xem";
        let actionButton;
        if (
          record.status === "Đã đặt - Chờ nhận hàng" ||
          record.status === "Đang Nhập Kho"
        ) {
          actionButton = (
            <Button
              type="primary"
              size="small"
              onClick={() => navigate(`/receive-po/${record.id}`)}
            >
              Nhập Kho
            </Button>
          );
        } else {
          actionButton = (
            <Button
              size="small"
              onClick={() => navigate(`/purchase-orders/${record.id}`)}
            >
              {actionButtonText}
            </Button>
          );
        }
        return <Space>{actionButton}</Space>;
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

      {screens.md ? (
        <Table
          columns={columns}
          dataSource={purchaseOrders}
          loading={loading}
          rowKey="id"
        />
      ) : (
        <List
          loading={loading}
          dataSource={purchaseOrders}
          renderItem={(item) => (
            <List.Item>
              <Card style={{ width: "100%" }}>
                <List.Item.Meta
                  title={`PO-${String(item.id).padStart(5, "0")}`}
                  description={
                    <>
                      <Text
                        strong
                        style={{
                          color: "#1677ff",
                          display: "block",
                          marginBottom: 4,
                        }}
                      >
                        {item.suppliers?.name || "N/A"}
                      </Text>
                      <div>
                        {dayjs(item.created_at).format("DD/MM/YYYY")} -{" "}
                        {getStatusTag(item.status)}
                      </div>
                    </>
                  }
                />
                <Space
                  style={{
                    marginTop: 16,
                    width: "100%",
                    justifyContent: "flex-end",
                  }}
                >
                  {(() => {
                    const actionButtonText =
                      item.status === "Nháp" ? "Xem / Sửa" : "Xem";
                    if (
                      item.status === "Đã đặt - Chờ nhận hàng" ||
                      item.status === "Đang Nhập Kho"
                    ) {
                      return (
                        <Button
                          type="primary"
                          size="small"
                          onClick={() => navigate(`/receive-po/${item.id}`)}
                        >
                          Nhập Kho
                        </Button>
                      );
                    }
                    return (
                      <Button
                        size="small"
                        onClick={() => navigate(`/purchase-orders/${item.id}`)}
                      >
                        {actionButtonText}
                      </Button>
                    );
                  })()}
                </Space>
              </Card>
            </List.Item>
          )}
        />
      )}
    </>
  );
};

const PurchaseOrders: React.FC = () => (
  <AntApp>
    <PurchaseOrdersContent />
  </AntApp>
);
export default PurchaseOrders;
