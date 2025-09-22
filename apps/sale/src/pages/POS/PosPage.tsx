import React, { useState, useEffect, useMemo } from 'react';
import {
  Typography,
  Row,
  Col,
  Card,
  Input,
  List,
  Button,
  Divider,
  Avatar,
  Select,
  Statistic,
  Space,
  App,
  InputNumber,
  Tag,
  Badge,
  Tooltip,
} from 'antd';
import {
  UserOutlined,
  DeleteOutlined,
  PlusOutlined,
  TagOutlined,
  ShoppingCartOutlined,
  SearchOutlined,
  CreditCardOutlined,
  QrcodeOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import { useDebounce } from '../../hooks/useDebounce';
import {
  processSaleTransaction,
  searchProducts,
  getActivePromotions,
} from '@nam-viet-erp/services';
import PaymentModal from '../../features/pos/components/PaymentModal';
import type {
  CartItem,
  CartDetails,
  PriceInfo,
} from '../../types';
import { getErrorMessage } from '../../types';

const { Title, Text } = Typography;
const { Search } = Input;

// Map UI selection to warehouse and fund IDs
const WAREHOUSE_MAP: { [key: string]: { warehouseId: number; fundId: number } } = {
  dh1: { warehouseId: 1, fundId: 1 }, // Assuming DH1 is warehouse 1 and uses fund 1
  dh2: { warehouseId: 2, fundId: 2 }, // Assuming DH2 is warehouse 2 and uses fund 2
};

const PosPage: React.FC = () => {
  const { notification } = App.useApp();

  // State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<IProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'qr'>('cash');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState('dh1');
  const [promotions, setPromotions] = useState<IPromotion[]>([]);

  const { warehouseId, fundId } = WAREHOUSE_MAP[selectedLocation];
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    const fetchPromos = async () => {
      const { data, error } = await getActivePromotions();
      if (error) {
        notification.error({
          message: 'Lỗi tải khuyến mãi',
          description: error.message,
        });
      } else {
        setPromotions((data as IPromotion[]) || []);
      }
    };
    fetchPromos();
  }, [notification]);

  // --- PROMOTION LOGIC START ---
  const calculateBestPrice = (product: IProduct, promotions: IPromotion[]): PriceInfo => {
    let bestPrice = product.retail_price;
    let appliedPromotion: IPromotion | null = null;

    if (bestPrice === null || bestPrice === undefined || bestPrice <= 0) {
      return { finalPrice: 0, originalPrice: 0, appliedPromotion: null };
    }

    for (const promo of promotions) {
      const conditions = promo.conditions;
      let isApplicable = true;

      // Condition checks
      if (conditions) {
        // Check manufacturers
        const manufacturers = conditions.manufacturers;
        if (
          typeof manufacturers === 'string' &&
          product.manufacturer &&
          manufacturers !== product.manufacturer
        ) {
          isApplicable = false;
        }

        // Check product categories
        const productCategories = conditions.product_categories;
        if (
          isApplicable &&
          typeof productCategories === 'string' &&
          product.category &&
          productCategories !== product.category
        ) {
          isApplicable = false;
        }
      }

      if (isApplicable) {
        let currentPrice = product.retail_price;
        let calculated = false;

        if (promo.type === 'percentage' && product.retail_price !== null && promo.value !== undefined) {
          currentPrice = product.retail_price * (1 - promo.value / 100);
          calculated = true;
        } else if (promo.type === 'fixed_amount' && product.retail_price !== null && promo.value !== undefined) {
          currentPrice = product.retail_price - promo.value;
          calculated = true;
        }

        if (calculated && currentPrice !== null && bestPrice !== null && currentPrice < bestPrice) {
          bestPrice = currentPrice;
          appliedPromotion = promo;
        }
      }
    }

    return {
      finalPrice: Math.round(bestPrice || 0),
      originalPrice: product.retail_price || 0,
      appliedPromotion,
    };
  };
  // --- PROMOTION LOGIC END ---


  useEffect(() => {
    if (debouncedSearchTerm) {
      setIsSearching(true);
      searchProducts({ search: debouncedSearchTerm, pageSize: 10, status: 'active' })
        .then(({ data, error }) => {
          if (error) {
            notification.error({ message: 'Lỗi tìm kiếm', description: error.message });
            setSearchResults([]);
          } else {
            setSearchResults(data || []);
          }
        })
        .finally(() => setIsSearching(false));
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearchTerm, notification]);

  // Cart Handlers
  const handleAddToCart = (product: IProduct) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        const priceInfo = calculateBestPrice(product, promotions);
        return [...prevCart, { ...product, quantity: 1, ...priceInfo }];
      }
    });
    setSearchTerm('');
    setSearchResults([]);
  };

  const handleRemoveFromCart = (productId: number) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  const handleUpdateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveFromCart(productId);
    } else {
      setCart((prevCart) =>
        prevCart.map((item) =>
          item.id === productId ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };

  const cartDetails = useMemo((): CartDetails => {
    const items = cart.map((item) => {
      const priceInfo = calculateBestPrice(item, promotions);
      return {
        ...item,
        ...priceInfo,
      };
    });

    const itemTotal = items.reduce(
      (total, item) => total + item.finalPrice * item.quantity,
      0
    );
    const originalTotal = items.reduce(
      (total, item) => total + item.originalPrice * item.quantity,
      0
    );

    return {
      items,
      itemTotal,
      originalTotal,
      totalDiscount: originalTotal - itemTotal,
    };
  }, [cart, promotions]);

  // Payment Handlers
  const handleOpenPaymentModal = (method: 'cash' | 'card' | 'qr') => {
    if (cart.length === 0) {
      notification.warning({ message: 'Giỏ hàng đang trống!' });
      return;
    }
    setPaymentMethod(method);
    setIsPaymentModalOpen(true);
  };

  const handleFinishPayment = async () => {
    setIsProcessingPayment(true);
    try {
      await processSaleTransaction({
        cart: cartDetails.items, // Send detailed cart items
        total: cartDetails.itemTotal,
        paymentMethod,
        warehouseId,
        fundId,
        createdBy: 'POS User', // TODO: Replace with actual logged-in user
      });

      notification.success({ 
          message: 'Thanh toán thành công!',
          description: `Đã ghi nhận hóa đơn ${cartDetails.itemTotal.toLocaleString()}đ.`
      });

      setCart([]);
      setIsPaymentModalOpen(false);
    } catch (error: unknown) {
      notification.error({ message: 'Thanh toán thất bại', description: getErrorMessage(error) });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <div style={{ height: '100%' }}>
      <Row style={{ marginBottom: 16 }}>
        <Col span={12}>
          <Title level={2} style={{ margin: 0 }}>
            POS Bán Lẻ
          </Title>
        </Col>
        <Col span={12} style={{ textAlign: 'right' }}>
          <Select
            value={selectedLocation}
            onChange={setSelectedLocation}
            size="large"
            style={{ width: 200 }}
            placeholder="Chọn cửa hàng"
          >
            <Select.Option value="dh1">🏪 Nhà thuốc DH1</Select.Option>
            <Select.Option value="dh2">🏪 Nhà thuốc DH2</Select.Option>
          </Select>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ height: 'calc(100vh - 200px)' }}>
        <Col xs={24} lg={8}>
          <Space direction="vertical" size={16} style={{ width: '100%', height: '100%' }}>
            <Card
              title={
                <Space>
                  <UserOutlined />
                  <span>Thông tin Khách hàng</span>
                </Space>
              }
              size="small"
              style={{ borderRadius: 8 }}
            >
              <Search
                placeholder="Tìm khách hàng (SĐT)..."
                enterButton={<SearchOutlined />}
                style={{ marginBottom: 16 }}
              />
              <Space align="center">
                <Avatar size={48} icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
                <div>
                  <Text strong style={{ fontSize: 16 }}>Khách vãng lai</Text>
                  <br />
                  <Button type="link" style={{ padding: 0, height: 'auto' }}>
                    + Tạo khách hàng mới
                  </Button>
                </div>
              </Space>
            </Card>

            <Card
              title={
                <Space>
                  <SearchOutlined />
                  <span>Tìm kiếm Sản phẩm</span>
                </Space>
              }
              size="small"
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 8,
                overflow: 'hidden'
              }}
              styles={{ body: { flex: 1, padding: 16, overflow: 'hidden' } }}
            >
              <Search
                placeholder="Quét mã vạch hoặc tìm tên thuốc..."
                size="large"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                loading={isSearching}
                style={{ marginBottom: 16 }}
              />
              <div style={{ flex: 1, overflow: 'auto' }}>
                <List
                  loading={isSearching}
                  dataSource={searchResults}
                  locale={{ emptyText: searchTerm ? 'Không tìm thấy sản phẩm' : 'Nhập từ khóa để tìm kiếm' }}
                  renderItem={(product) => (
                    <List.Item
                      style={{
                        padding: '12px 0',
                        borderRadius: 8,
                        marginBottom: 8,
                        backgroundColor: '#fafafa',
                        paddingLeft: 12,
                        paddingRight: 12
                      }}
                      actions={[
                        <Tooltip title="Thêm vào giỏ hàng">
                          <Button
                            type="primary"
                            shape="circle"
                            icon={<PlusOutlined />}
                            onClick={() => handleAddToCart(product)}
                          />
                        </Tooltip>,
                      ]}
                    >
                      <List.Item.Meta
                        title={<Text strong>{product.name}</Text>}
                        description={
                          <Text style={{ color: '#52c41a', fontWeight: 500 }}>
                            {(product.retail_price || 0).toLocaleString()}đ
                          </Text>
                        }
                      />
                    </List.Item>
                  )}
                />
              </div>
            </Card>
          </Space>
        </Col>

        <Col xs={24} lg={10}>
          <Card
            title={
              <Space>
                <Badge count={cart.length} showZero>
                  <ShoppingCartOutlined />
                </Badge>
                <span>Giỏ hàng</span>
              </Space>
            }
            size="small"
            style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 8,
              overflow: 'hidden'
            }}
            styles={{ body: { flex: 1, padding: 16, overflow: 'hidden' } }}
          >
            <div style={{ flex: 1, overflow: 'auto' }}>
              {cart.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px 0',
                  color: '#999'
                }}>
                  <ShoppingCartOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                  <div>Giỏ hàng trống</div>
                </div>
              ) : (
                <List
                  itemLayout="horizontal"
                  dataSource={cartDetails.items}
                  renderItem={(item) => (
                    <List.Item
                      style={{
                        padding: '12px 0',
                        borderRadius: 8,
                        marginBottom: 8,
                        backgroundColor: '#f8f9fa',
                        paddingLeft: 12,
                        paddingRight: 12
                      }}
                      actions={[
                        <Tooltip title="Xóa khỏi giỏ hàng">
                          <Button
                            type="text"
                            danger
                            shape="circle"
                            icon={<DeleteOutlined />}
                            onClick={() => handleRemoveFromCart(item.id)}
                          />
                        </Tooltip>,
                      ]}
                    >
                      <List.Item.Meta
                        avatar={<Avatar src={item.image_url} size={48} />}
                        title={<Text strong>{item.name}</Text>}
                        description={
                          <Space direction="vertical" size={4} style={{ width: '100%' }}>
                            <Space align="center">
                              {item.appliedPromotion && (
                                <Text delete style={{ color: '#999' }}>
                                  {item.originalPrice.toLocaleString()}đ
                                </Text>
                              )}
                              <Text strong style={{ color: '#52c41a' }}>
                                {item.finalPrice.toLocaleString()}đ
                              </Text>
                              <InputNumber
                                size="small"
                                min={1}
                                value={item.quantity}
                                onChange={(val) => handleUpdateQuantity(item.id, val!)}
                                style={{ width: 60 }}
                              />
                            </Space>
                            {item.appliedPromotion && (
                              <Tag icon={<TagOutlined />} color="success">
                                {item.appliedPromotion.name}
                              </Tag>
                            )}
                          </Space>
                        }
                      />
                      <div style={{ textAlign: 'right' }}>
                        <Text strong style={{ fontSize: 16 }}>
                          {(item.finalPrice * item.quantity).toLocaleString()}đ
                        </Text>
                      </div>
                    </List.Item>
                  )}
                />
              )}
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={6}>
          <Card
            title="💰 Thanh toán"
            size="small"
            style={{
              height: '100%',
              borderRadius: 8,
              border: '2px solid #1890ff'
            }}
          >
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <div style={{ textAlign: 'center' }}>
                <Statistic
                  title="Tổng cộng"
                  value={cartDetails.itemTotal}
                  suffix="VNĐ"
                  valueStyle={{ color: '#1890ff', fontSize: '1.8rem' }}
                />
                {cartDetails.totalDiscount > 0 && (
                  <>
                    <Text delete style={{ color: '#999' }}>
                      {cartDetails.originalTotal.toLocaleString()}đ
                    </Text>
                    <br />
                    <Statistic
                      title="🎉 Tiết kiệm"
                      value={cartDetails.totalDiscount}
                      suffix="VNĐ"
                      valueStyle={{ color: '#52c41a', fontSize: '1.2rem' }}
                    />
                  </>
                )}
              </div>

              <Divider style={{ margin: '8px 0' }} />

              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                <Button
                  block
                  size="large"
                  icon={<DollarOutlined />}
                  onClick={() => handleOpenPaymentModal('cash')}
                  style={{ height: 48 }}
                >
                  Tiền mặt
                </Button>
                <Button
                  block
                  size="large"
                  icon={<CreditCardOutlined />}
                  onClick={() => handleOpenPaymentModal('card')}
                  style={{ height: 48 }}
                >
                  Thẻ
                </Button>
                <Button
                  block
                  size="large"
                  icon={<QrcodeOutlined />}
                  onClick={() => handleOpenPaymentModal('qr')}
                  style={{ height: 48 }}
                >
                  Chuyển khoản (QR)
                </Button>
              </Space>

              <Button
                type="primary"
                block
                size="large"
                style={{
                  height: 64,
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  background: 'linear-gradient(45deg, #1890ff, #40a9ff)',
                  border: 'none',
                  boxShadow: '0 4px 15px 0 rgba(24, 144, 255, 0.4)'
                }}
                disabled={cart.length === 0}
                loading={isProcessingPayment}
                onClick={() => handleOpenPaymentModal('cash')}
              >
                🚀 Thanh Toán Ngay
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      <PaymentModal
        open={isPaymentModalOpen}
        paymentMethod={paymentMethod}
        cartTotal={cartDetails.itemTotal}
        onCancel={() => setIsPaymentModalOpen(false)}
        onFinish={handleFinishPayment}
        okButtonProps={{ loading: isProcessingPayment }}
      />
    </div>
  );
};

const PosPageWrapper: React.FC = () => (
  <App>
    <PosPage />
  </App>
);

export default PosPageWrapper;