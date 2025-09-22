import React, { useState, useEffect, useMemo } from 'react';
import {
  Layout,
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
} from 'antd';
import {
  UserOutlined,
  DeleteOutlined,
  PlusOutlined,
  TagOutlined,
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

const { Header, Content } = Layout;
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
    <>
      <Layout style={{ height: '100vh', overflow: 'hidden' }}>
        <Header
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#001529',
            padding: '0 24px',
          }}
        >
          <Title level={3} style={{ color: 'white', margin: 0 }}>
            POS Bán Lẻ
          </Title>
          <Select 
            value={selectedLocation} 
            onChange={setSelectedLocation}
            style={{ marginLeft: 'auto', width: 150 }}
          >
            <Select.Option value="dh1">Nhà thuốc DH1</Select.Option>
            <Select.Option value="dh2">Nhà thuốc DH2</Select.Option>
          </Select>
        </Header>
        <Content style={{ padding: '12px' }}>
          <Row gutter={12} style={{ height: '100%' }}>
            <Col span={8}>
              <Card title="Thông tin Khách hàng" style={{ marginBottom: 12 }}>
                <Search
                  placeholder="Tìm khách hàng (SĐT)..."
                  enterButton
                  style={{ marginBottom: 12 }}
                />
                <Space>
                  <Avatar size="large" icon={<UserOutlined />} />
                  <div>
                    <Text strong>Khách vãng lai</Text>
                    <br />
                    <Button type="link" style={{ padding: 0 }}>
                      Tạo khách hàng mới
                    </Button>
                  </div>
                </Space>
              </Card>
              <Card
                title="Tìm kiếm Sản phẩm"
                style={{ height: 'calc(100vh - 280px)', display: 'flex', flexDirection: 'column' }}
                bodyStyle={{ flex: 1, overflowY: 'auto' }}
              >
                <Search
                  placeholder="Quét mã vạch hoặc tìm tên thuốc..."
                  size="large"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  loading={isSearching}
                />
                <List
                  style={{ marginTop: 12 }}
                  loading={isSearching}
                  dataSource={searchResults}
                  renderItem={(product) => (
                    <List.Item
                      actions={[
                        <Button
                          type="primary"
                          icon={<PlusOutlined />}
                          onClick={() => handleAddToCart(product)}
                        />,
                      ]}
                    >
                      <List.Item.Meta
                        title={product.name}
                        description={`${(product.retail_price || 0).toLocaleString()}đ`}
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </Col>

            <Col span={10}>
              <Card
                title="Giỏ hàng"
                style={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}
                bodyStyle={{ flex: 1, overflowY: 'auto' }}
              >
                <List
                  itemLayout="horizontal"
                  dataSource={cartDetails.items}
                  renderItem={(item) => (
                    <List.Item
                      actions={[
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => handleRemoveFromCart(item.id)}
                        />,
                      ]}
                    >
                      <List.Item.Meta
                        avatar={<Avatar src={item.image_url} />}
                        title={item.name}
                        description={
                          <Space direction="vertical" size={0}>
                            <div>
                              {item.appliedPromotion && (
                                <Text delete style={{ marginRight: 8 }}>
                                  {item.originalPrice.toLocaleString()}đ
                                </Text>
                              )}
                              <Text>
                                {item.finalPrice.toLocaleString()}đ
                              </Text>
                              <InputNumber
                                size="small"
                                min={1}
                                value={item.quantity}
                                onChange={(val) => handleUpdateQuantity(item.id, val!)}
                                style={{ width: 60, marginLeft: 8 }}
                              />
                            </div>
                            {item.appliedPromotion && (
                              <Tag icon={<TagOutlined />} color="success">
                                {item.appliedPromotion.name}
                              </Tag>
                            )}
                          </Space>
                        }
                      />
                      <div>
                        <Text strong>
                          {(item.finalPrice * item.quantity).toLocaleString()}đ
                        </Text>
                      </div>
                    </List.Item>
                  )}
                />
              </Card>
            </Col>

            <Col span={6}>
              <Card style={{ height: 'calc(100vh - 100px)' }}>
                <Title level={4}>Tổng cộng</Title>
                <Statistic value={cartDetails.itemTotal} suffix="VNĐ" />
                {cartDetails.totalDiscount > 0 && (
                  <>
                    <Text delete>{cartDetails.originalTotal.toLocaleString()}đ</Text>
                    <Statistic
                      title="Tiết kiệm"
                      value={cartDetails.totalDiscount}
                      suffix="VNĐ"
                      valueStyle={{ color: '#52c41a', fontSize: '1rem' }}
                    />
                  </>
                )}
                <Divider />
                <Row gutter={[8, 8]}>
                  <Col span={12}>
                    <Button block size="large" onClick={() => handleOpenPaymentModal('cash')}>
                      Tiền mặt
                    </Button>
                  </Col>
                  <Col span={12}>
                    <Button block size="large" onClick={() => handleOpenPaymentModal('card')}>
                      Thẻ
                    </Button>
                  </Col>
                  <Col span={24}>
                    <Button block size="large" onClick={() => handleOpenPaymentModal('qr')}>
                      Chuyển khoản (QR)
                    </Button>
                  </Col>
                </Row>
                <Divider />
                <Button
                  type="primary"
                  block
                  size="large"
                  style={{ height: 80, fontSize: '1.5rem' }}
                  disabled={cart.length === 0}
                  loading={isProcessingPayment}
                  onClick={() => handleOpenPaymentModal('cash')}
                >
                  Thanh Toán
                </Button>
              </Card>
            </Col>
          </Row>
        </Content>
      </Layout>
      <PaymentModal 
        open={isPaymentModalOpen}
        paymentMethod={paymentMethod}
        cartTotal={cartDetails.itemTotal}
        onCancel={() => setIsPaymentModalOpen(false)}
        onFinish={handleFinishPayment}
        okButtonProps={{ loading: isProcessingPayment }}
      />
    </>
  );
};

const PosPageWrapper: React.FC = () => (
  <App>
    <PosPage />
  </App>
);

export default PosPageWrapper;