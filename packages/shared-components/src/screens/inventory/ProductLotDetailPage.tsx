import React, { useState } from "react";
import {
  Card,
  Row,
  Col,
  Tag,
  Spin,
  Typography,
  InputNumber,
  Space,
  Button,
  Descriptions,
  App,
} from "antd";
import {
  HomeOutlined,
  AppstoreOutlined,
  SaveOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { useParams } from "react-router-dom";
import { useProductLot, useUpdateQuantityByLot } from "@nam-viet-erp/store";
import PageLayout from "../../components/PageLayout";
import ProductLotDetailForm from "../../components/ProductLotDetailForm";

const ProductLotDetailPage: React.FC = () => {
  const { lotId } = useParams<{ lotId: string }>();
  const { notification } = App.useApp();

  const {
    data: lotDetail,
    isLoading: loading,
    refetch,
  } = useProductLot(Number(lotId));
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [quantity, setQuantityValue] = useState<number>(0);

  const { submit: updateQuantity, isLoading: isSaving } =
    useUpdateQuantityByLot({
      lotId: parseInt(lotId),
      onSuccess: () => {
        refetch();
        setIsEditing(false);
        notification.success({
          message: "Cập nhật thành công",
          description: "Số lượng tồn kho đã được cập nhật",
        });
      },
    });

  const handleEdit = () => {
    setIsEditing(true);
    setQuantityValue(lotDetail?.quantity || 0);
  };

  const handleSave = async () => {
    if (!lotDetail) return;
    updateQuantity({
      lotId: lotDetail.id,
      productId: lotDetail.product_id,
      warehouseId: lotDetail.warehouse_id,
      newQuantityAvailable: quantity,
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setQuantityValue(lotDetail?.quantity || 0);
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
        {/* Inventory Information Card */}
        <Col xs={24} lg={12}>
          <Card title="Thông tin tồn kho">
            <Descriptions bordered column={1}>
              <Descriptions.Item label="Kho">
                <strong>Kho ID: {lotDetail?.warehouse_id || "-"}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="Số lượng">
                {isEditing ? (
                  <Space>
                    <InputNumber
                      value={quantity}
                      onChange={(value) => setQuantityValue(value || 0)}
                      min={0}
                      style={{ width: 120 }}
                      autoFocus
                      onPressEnter={handleSave}
                    />
                    <Button
                      icon={<SaveOutlined />}
                      type="primary"
                      size="small"
                      loading={isSaving}
                      onClick={handleSave}
                    >
                      Lưu
                    </Button>
                    <Button
                      size="small"
                      onClick={handleCancel}
                      disabled={isSaving}
                    >
                      Hủy
                    </Button>
                  </Space>
                ) : (
                  <Space>
                    <Tag color={lotDetail?.quantity > 0 ? "green" : "red"}>
                      {lotDetail?.quantity || 0}
                    </Tag>
                    <Button
                      icon={<EditOutlined />}
                      size="small"
                      type="link"
                      onClick={handleEdit}
                    >
                      Chỉnh sửa
                    </Button>
                  </Space>
                )}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>
    </PageLayout>
  );
};

export default ProductLotDetailPage;
