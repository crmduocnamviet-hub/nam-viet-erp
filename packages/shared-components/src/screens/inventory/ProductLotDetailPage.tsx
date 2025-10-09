import React, { useState } from "react";
import {
  Card,
  Row,
  Col,
  Table,
  Tag,
  Spin,
  Typography,
  App,
  InputNumber,
  Space,
  Button,
} from "antd";
import {
  HomeOutlined,
  AppstoreOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import { useParams } from "react-router-dom";
import {
  useInventoryOfWarehouseByLotId,
  useProductLot,
  useUpdateQuantityByLot,
} from "@nam-viet-erp/store";
import PageLayout from "../../components/PageLayout";
import ProductLotDetailForm from "../../components/ProductLotDetailForm";

const ProductLotDetailPage: React.FC = () => {
  const { lotId } = useParams<{ lotId: string }>();
  const { notification } = App.useApp();
  // Store

  const { data: lotDetail, isLoading: loading } = useProductLot(Number(lotId));
  const { data: lotInventory, refetch } = useInventoryOfWarehouseByLotId(
    Number(lotId),
  );
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [quantity, setQuantityValue] = useState<number>(0);

  const { submit: updateQuantity, isLoading: isSaving } =
    useUpdateQuantityByLot({
      lotId: parseInt(lotId),
      onSuccess: () => {
        refetch();
        setEditingKey(null);
      },
    });

  const handleEdit = (record: IInventory) => {
    setEditingKey(`${record.warehouse_id}-${record.lot_id}`);
    setQuantityValue(record.quantity || 0);
  };

  const handleSave = async (record: IInventory) => {
    if (!lotDetail) return;
    updateQuantity({
      lotId: record.lot_id,
      productId: lotDetail.product_id,
      warehouseId: record.warehouse_id,
      newQuantityAvailable: quantity,
    });
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!lotDetail) {
    return (
      <PageLayout title="Chi tiết Lô hàng" showBackButton>
        <div style={{ textAlign: "center", padding: "50px" }}>
          <Typography.Title level={4}>
            Không tìm thấy thông tin lô hàng
          </Typography.Title>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title={`Chi tiết Lô hàng: ${lotDetail.lot_number}`}
      breadcrumbs={[
        {
          title: "Trang chủ",
          href: "/",
          icon: <HomeOutlined />,
        },
        {
          title: "Sản phẩm",
          href: "/products",
          icon: <AppstoreOutlined />,
        },
        {
          title: lotDetail.products?.name,
          href: `/products/edit/${lotDetail.product_id}`,
        },
        {
          title: `Lô: ${lotDetail.lot_number}`,
        },
      ]}
    >
      <Row gutter={[16, 16]}>
        {/* Lot Information Card */}
        <Col xs={24} lg={12}>
          {!!lotDetail && <ProductLotDetailForm lotId={Number(lotId)} />}
        </Col>
        {/* Inventory by Warehouse Table */}
        <Col xs={24} lg={12}>
          <Card title="Thông tin kho lưu trữ">
            <Table
              dataSource={(lotInventory || []).map((i) => ({
                ...i,
                key: `${i.warehouse_id}-${i.lot_id}`,
              }))}
              rowKey="lot_id"
              pagination={false}
              columns={[
                {
                  title: "Kho",
                  dataIndex: "warehouse_name",
                  key: "warehouse",
                  render: (text) => <strong>{text}</strong>,
                },
                {
                  title: "Tồn kho",
                  dataIndex: "quantity",
                  key: "quantity",
                  align: "right",
                  render: (qty, record) => {
                    const isEditing = editingKey === record.key;

                    if (isEditing) {
                      return (
                        <Space>
                          <InputNumber
                            value={quantity}
                            onChange={(value) => setQuantityValue(value || 0)}
                            min={0}
                            style={{ width: 100 }}
                            autoFocus
                            onPressEnter={() => handleSave(record)}
                          />
                          <Button
                            icon={<SaveOutlined />}
                            type="primary"
                            loading={isSaving}
                            onClick={() => handleSave(record)}
                          />
                        </Space>
                      );
                    }

                    return (
                      <Tag
                        color={qty > 0 ? "green" : "red"}
                        style={{ cursor: "pointer" }}
                        onClick={() => handleEdit(record)}
                      >
                        {qty}
                      </Tag>
                    );
                  },
                },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </PageLayout>
  );
};

export default ProductLotDetailPage;
