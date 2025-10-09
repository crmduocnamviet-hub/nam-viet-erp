import React, { useMemo, useState } from "react";
import {
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
  InputNumber,
  Tag,
  Tooltip,
  Typography,
  Grid,
  Tabs,
  Empty,
  FloatButton,
  Badge,
  Modal,
} from "antd";
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
  WarningOutlined,
  GiftOutlined,
  AppstoreOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { useInventory } from "@nam-viet-erp/store";
import { calculateProductGlobalQuantities } from "@nam-viet-erp/services";

const { Text, Title } = Typography;
const { Search } = Input;
const { useBreakpoint } = Grid;

interface PosTabContentProps {
  // Warehouse
  employeeWarehouse: IWarehouse | null;
  loadingWarehouse: boolean;

  // Customer
  customerSearchTerm: string;
  setCustomerSearchTerm: (term: string) => void;
  customerSearchResults: IPatient[];
  isSearchingCustomers: boolean;
  showCustomerDropdown: boolean;
  setShowCustomerDropdown: (show: boolean) => void;
  selectedCustomer: any | null;
  setStoreSelectedCustomer: (customer: any | null) => void;
  setIsCreateCustomerModalOpen: (open: boolean) => void;

  // Product search
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  searchResults: IProduct[];
  isSearching: boolean;
  selectedWarehouse: any | null;
  handleAddToCart: (product: IProduct) => void;
  setIsQRScannerOpen: (open: boolean) => void;

  // Cart
  cart: any[];
  cartDetails: {
    items: any[];
    itemTotal: number;
    originalTotal: number;
    totalDiscount: number;
  };
  handleRemoveFromCart: (productId: number) => void;
  handleUpdateQuantity: (productId: number, quantity: number) => void;
  handleOpenPaymentModal: (method: "cash" | "card") => void;
  isProcessingPayment: boolean;

  // Combos
  detectedCombos?: IComboWithItems[];
  handleAddCombo?: (combo: IComboWithItems) => void;

  // Mobile
  isMobile: boolean;
  isCartModalOpen: boolean;
  setIsCartModalOpen: (open: boolean) => void;
}

const PosTabContent: React.FC<PosTabContentProps> = ({
  employeeWarehouse,
  loadingWarehouse,
  customerSearchTerm,
  setCustomerSearchTerm,
  customerSearchResults,
  isSearchingCustomers,
  showCustomerDropdown,
  setShowCustomerDropdown,
  selectedCustomer,
  setStoreSelectedCustomer,
  setIsCreateCustomerModalOpen,
  searchTerm,
  setSearchTerm,
  searchResults,
  isSearching,
  selectedWarehouse,
  handleAddToCart,
  setIsQRScannerOpen,
  cart,
  cartDetails,
  handleRemoveFromCart,
  handleUpdateQuantity,
  handleOpenPaymentModal,
  isProcessingPayment,
  detectedCombos = [],
  handleAddCombo,
  isMobile,
  isCartModalOpen,
  setIsCartModalOpen,
}) => {
  const inventory = useInventory();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Calculate global quantity for each product (including products in combos)
  const productGlobalQuantities = useMemo(() => {
    const quantities = calculateProductGlobalQuantities(cartDetails.items);
    // Convert to simple Record<number, number> for easier usage
    const simpleQuantities: Record<number, number> = {};
    Object.entries(quantities).forEach(([productId, { quantity }]) => {
      simpleQuantities[Number(productId)] = quantity;
    });
    return simpleQuantities;
  }, [cartDetails.items]);

  // Check if any item exceeds stock
  const hasStockViolation = useMemo(() => {
    const filterProducts = inventory.filter(
      (i) => !!productGlobalQuantities[i.products.id],
    );
    for (const prod of filterProducts) {
      if (prod.quantity < productGlobalQuantities[prod.products.id]) {
        return true;
      }
    }
    return false;
  }, [inventory, productGlobalQuantities]);

  // Extract unique categories from search results
  const categories = useMemo(() => {
    const cats = new Set<string>();
    searchResults.forEach((product) => {
      if (product.category) {
        cats.add(product.category);
      }
    });
    return Array.from(cats);
  }, [searchResults]);

  // Filter products by selected category
  const filteredProducts = useMemo(() => {
    if (selectedCategory === "all") {
      return searchResults;
    }
    return searchResults.filter((p) => p.category === selectedCategory);
  }, [searchResults, selectedCategory]);

  return (
    <div style={{ backgroundColor: "#f5f5f5", minHeight: "100vh", padding: 0 }}>
      {/* Top Bar - Customer & Warehouse Info */}
      <div
        style={{
          backgroundColor: "#fff",
          padding: "12px 16px",
          marginBottom: 16,
          borderRadius: 8,
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        }}
      >
        <Row gutter={16} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Space style={{ width: "100%" }}>
              {loadingWarehouse ? (
                <Text type="secondary">Đang tải...</Text>
              ) : employeeWarehouse ? (
                <>
                  <Tag color="blue" style={{ margin: 0 }}>
                    🏪 {employeeWarehouse.name}
                  </Tag>
                </>
              ) : (
                <Text type="warning">⚠️ Chưa gán kho</Text>
              )}
            </Space>
          </Col>
          <Col xs={24} sm={12} md={16}>
            <div style={{ position: "relative" }}>
              <Search
                placeholder="🔍 Tìm khách hàng (SĐT hoặc tên)..."
                value={customerSearchTerm}
                onChange={(e) => setCustomerSearchTerm(e.target.value)}
                loading={isSearchingCustomers}
                prefix={<UserOutlined />}
                suffix={
                  selectedCustomer ? (
                    <Space>
                      <Tag color="success">{selectedCustomer.full_name}</Tag>
                      <CloseCircleOutlined
                        style={{ cursor: "pointer", color: "#999" }}
                        onClick={() => setStoreSelectedCustomer(null)}
                      />
                    </Space>
                  ) : null
                }
              />
              {showCustomerDropdown && customerSearchResults.length > 0 && (
                <Card
                  size="small"
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    zIndex: 1000,
                    maxHeight: 300,
                    overflow: "auto",
                    marginTop: 4,
                  }}
                >
                  <List
                    size="small"
                    dataSource={customerSearchResults}
                    renderItem={(customer: IPatient) => (
                      <List.Item
                        style={{
                          cursor: "pointer",
                          padding: "8px 12px",
                        }}
                        onClick={() => {
                          setStoreSelectedCustomer(customer);
                          setCustomerSearchTerm("");
                          setShowCustomerDropdown(false);
                        }}
                      >
                        <div>
                          <Text strong>{customer.full_name}</Text>
                          <br />
                          <Text type="secondary">{customer.phone_number}</Text>
                          {customer.loyalty_points > 0 && (
                            <Tag color="gold" style={{ marginLeft: 8 }}>
                              {customer.loyalty_points} điểm
                            </Tag>
                          )}
                        </div>
                      </List.Item>
                    )}
                  />
                </Card>
              )}
            </div>
          </Col>
        </Row>
      </div>

      <Row gutter={[16, 16]}>
        {/* Left Panel - Product Grid */}
        <Col xs={24} lg={16} xl={17}>
          <Card
            style={{
              borderRadius: 8,
              height: isMobile ? "auto" : "calc(100vh - 200px)",
              display: "flex",
              flexDirection: "column",
            }}
            styles={{
              body: {
                flex: 1,
                overflow: isMobile ? "visible" : "hidden",
                display: "flex",
                flexDirection: "column",
                padding: 16,
              },
            }}
          >
            {/* Search Bar */}
            <Space.Compact style={{ width: "100%", marginBottom: 16 }}>
              <Search
                placeholder="Tìm sản phẩm theo tên, mã vạch..."
                size="large"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                loading={isSearching}
                style={{ width: "100%" }}
                prefix={<SearchOutlined />}
              />
              <Tooltip title="Quét mã QR">
                <Button
                  icon={<QrcodeOutlined />}
                  size="large"
                  onClick={() => setIsQRScannerOpen(true)}
                  type="primary"
                />
              </Tooltip>
            </Space.Compact>

            {/* Category Tabs */}
            {categories.length > 0 && (
              <Tabs
                activeKey={selectedCategory}
                onChange={setSelectedCategory}
                size="small"
                style={{ marginBottom: 12 }}
                items={[
                  { key: "all", label: "Tất cả" },
                  ...categories.map((cat) => ({
                    key: cat,
                    label: cat,
                  })),
                ]}
              />
            )}

            {/* Product Grid */}
            <div
              style={{
                flex: 1,
                overflow: "auto",
                minHeight: isMobile ? 400 : "auto",
              }}
            >
              {isSearching ? (
                <div style={{ textAlign: "center", padding: 40 }}>
                  <Text type="secondary">Đang tìm kiếm...</Text>
                </div>
              ) : filteredProducts.length === 0 ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    searchTerm
                      ? "Không tìm thấy sản phẩm"
                      : "Nhập từ khóa để tìm kiếm sản phẩm"
                  }
                  style={{ marginTop: 60 }}
                />
              ) : (
                <Row gutter={[12, 12]}>
                  {filteredProducts.map((product) => (
                    <Col xs={12} sm={8} md={8} lg={6} xl={4} key={product.id}>
                      <Card
                        hoverable
                        style={{
                          borderRadius: 8,
                          height: "100%",
                          cursor: "pointer",
                          border:
                            product.stock_quantity === 0
                              ? "1px solid #ff4d4f"
                              : "1px solid #d9d9d9",
                        }}
                        styles={{ body: { padding: 12 } }}
                        onClick={() => handleAddToCart(product)}
                        cover={
                          <div
                            style={{
                              height: 120,
                              background: product.image_url
                                ? `url(${product.image_url})`
                                : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                              backgroundSize: "cover",
                              backgroundPosition: "center",
                              borderRadius: "8px 8px 0 0",
                              position: "relative",
                            }}
                          >
                            {product.stock_quantity !== undefined && (
                              <Tag
                                color={
                                  product.stock_quantity === 0
                                    ? "red"
                                    : product.stock_quantity <= 5
                                      ? "orange"
                                      : "green"
                                }
                                style={{
                                  position: "absolute",
                                  top: 4,
                                  right: 4,
                                  margin: 0,
                                  fontSize: 11,
                                }}
                              >
                                {product.stock_quantity === 0
                                  ? "Hết"
                                  : `${product.stock_quantity}`}
                              </Tag>
                            )}
                          </div>
                        }
                      >
                        <div>
                          <Tooltip title={product.name}>
                            <Text
                              strong
                              style={{
                                display: "block",
                                marginBottom: 4,
                                fontSize: 13,
                                height: 36,
                                overflow: "hidden",
                                lineHeight: "18px",
                              }}
                            >
                              {product.name}
                            </Text>
                          </Tooltip>
                          <Text
                            strong
                            style={{
                              color: "#1890ff",
                              fontSize: 15,
                              display: "block",
                            }}
                          >
                            {(product.retail_price || 0).toLocaleString()}đ
                          </Text>
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>
              )}
            </div>
          </Card>
        </Col>

        {/* Right Panel - Cart & Payment */}
        <Col xs={0} lg={8} xl={7}>
          <Card
            title={
              <Space>
                <ShoppingCartOutlined />
                <span>Đơn hàng</span>
                {cart.length > 0 && (
                  <Tag color="blue">{cart.length} sản phẩm</Tag>
                )}
              </Space>
            }
            style={{
              borderRadius: 8,
              height: "calc(100vh - 200px)",
              display: "flex",
              flexDirection: "column",
            }}
            styles={{
              body: {
                flex: 1,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                padding: 16,
              },
            }}
          >
            {/* Combo Suggestions */}
            {detectedCombos.length > 0 && (
              <Card
                size="small"
                style={{
                  marginBottom: 12,
                  background:
                    "linear-gradient(135deg, #fff7e6 0%, #fffbf0 100%)",
                  border: "2px solid #faad14",
                }}
              >
                <Space direction="vertical" size={8} style={{ width: "100%" }}>
                  <Text strong style={{ color: "#d46b08" }}>
                    🎁 Combo khuyến mãi!
                  </Text>
                  {detectedCombos.map((combo) => {
                    const originalPrice =
                      combo.combo_items?.reduce((sum, item) => {
                        return (
                          sum +
                          (item.products?.retail_price || 0) * item.quantity
                        );
                      }, 0) || 0;
                    const discountAmount = originalPrice - combo.combo_price;

                    return (
                      <Button
                        key={combo.id}
                        type="primary"
                        size="small"
                        block
                        onClick={() => handleAddCombo?.(combo)}
                        style={{
                          height: "auto",
                          padding: "8px 12px",
                          textAlign: "left",
                        }}
                      >
                        <div>
                          <Text strong style={{ color: "#fff" }}>
                            {combo.name}
                          </Text>
                          <br />
                          <Text style={{ fontSize: 11, color: "#fff" }}>
                            Tiết kiệm {discountAmount.toLocaleString()}đ
                          </Text>
                        </div>
                      </Button>
                    );
                  })}
                </Space>
              </Card>
            )}

            {/* Cart Items */}
            <div style={{ flex: 1, overflow: "auto", marginBottom: 12 }}>
              {cart.length === 0 ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Giỏ hàng trống"
                  style={{ marginTop: 40 }}
                />
              ) : (
                <List
                  size="small"
                  dataSource={cartDetails.items}
                  renderItem={(item: any) => (
                    <List.Item
                      style={{
                        padding: "8px 0",
                        borderBottom: "1px solid #f0f0f0",
                      }}
                    >
                      <List.Item.Meta
                        avatar={
                          <Avatar
                            src={item.image_url}
                            size={48}
                            icon={<AppstoreOutlined />}
                          />
                        }
                        title={
                          <Space>
                            <Text strong style={{ fontSize: 13 }}>
                              {item.name}
                            </Text>
                            {item.isCombo && (
                              <Tag
                                color="orange"
                                style={{ margin: 0, fontSize: 11 }}
                              >
                                COMBO
                              </Tag>
                            )}
                          </Space>
                        }
                        description={
                          <Space
                            direction="vertical"
                            size={2}
                            style={{ width: "100%" }}
                          >
                            {item.lot_number && (
                              <Text type="secondary" style={{ fontSize: 11 }}>
                                📦 Lô: {item.lot_number}
                                {item.batch_code && ` (${item.batch_code})`}
                              </Text>
                            )}
                            <Space>
                              <Text style={{ color: "#1890ff", fontSize: 13 }}>
                                {item.finalPrice.toLocaleString()}đ
                              </Text>
                              <InputNumber
                                size="small"
                                min={1}
                                value={item.quantity}
                                onChange={(val) =>
                                  handleUpdateQuantity(item.id, val!)
                                }
                                style={{ width: 55 }}
                              />
                              <Button
                                type="text"
                                danger
                                size="small"
                                icon={<DeleteOutlined />}
                                onClick={() => handleRemoveFromCart(item.id)}
                              />
                            </Space>
                            <Text strong style={{ fontSize: 14 }}>
                              ={" "}
                              {(
                                item.finalPrice * item.quantity
                              ).toLocaleString()}
                              đ
                            </Text>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              )}
            </div>

            {/* Payment Section */}
            <div
              style={{
                borderTop: "2px solid #f0f0f0",
                paddingTop: 12,
              }}
            >
              <Space direction="vertical" size={12} style={{ width: "100%" }}>
                {/* Total */}
                <div style={{ textAlign: "center" }}>
                  {cartDetails.totalDiscount > 0 && (
                    <>
                      <Text delete style={{ color: "#999", fontSize: 14 }}>
                        {cartDetails.originalTotal.toLocaleString()}đ
                      </Text>
                      <br />
                      <Text type="success" style={{ fontSize: 13 }}>
                        Tiết kiệm: {cartDetails.totalDiscount.toLocaleString()}đ
                      </Text>
                      <br />
                    </>
                  )}
                  <Title
                    level={3}
                    style={{ margin: "4px 0", color: "#1890ff" }}
                  >
                    {cartDetails.itemTotal.toLocaleString()}đ
                  </Title>
                </div>

                {/* Payment Buttons */}
                <Button
                  type="primary"
                  block
                  size="large"
                  icon={<DollarOutlined />}
                  disabled={cart.length === 0 || hasStockViolation}
                  loading={isProcessingPayment}
                  onClick={() => handleOpenPaymentModal("cash")}
                  style={{
                    height: 50,
                    fontSize: 16,
                    fontWeight: "bold",
                    background:
                      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    border: "none",
                  }}
                >
                  Thanh toán - Tiền mặt
                </Button>
                <Button
                  block
                  size="large"
                  icon={<CreditCardOutlined />}
                  disabled={cart.length === 0 || hasStockViolation}
                  onClick={() => handleOpenPaymentModal("card")}
                  style={{ height: 42 }}
                >
                  Thẻ / Chuyển khoản
                </Button>

                {hasStockViolation && (
                  <Text
                    type="danger"
                    style={{
                      fontSize: 12,
                      textAlign: "center",
                      display: "block",
                    }}
                  >
                    ⚠️ Số lượng vượt tồn kho
                  </Text>
                )}
              </Space>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Mobile Floating Cart Button */}
      {isMobile && (
        <Badge count={cart.length} offset={[-5, 5]}>
          <FloatButton
            icon={<ShoppingCartOutlined />}
            type="primary"
            style={{
              width: 60,
              height: 60,
              right: 24,
              bottom: 24,
            }}
            onClick={() => setIsCartModalOpen(true)}
          />
        </Badge>
      )}

      {/* Mobile Cart Modal */}
      <Modal
        title={
          <Space>
            <ShoppingCartOutlined />
            <span>Giỏ hàng</span>
            {cart.length > 0 && <Tag color="blue">{cart.length} sản phẩm</Tag>}
          </Space>
        }
        open={isMobile && isCartModalOpen}
        onCancel={() => setIsCartModalOpen(false)}
        footer={null}
        width="100%"
        style={{ top: 0, maxWidth: "100vw", paddingBottom: 0 }}
        styles={{
          body: { maxHeight: "70vh", overflow: "auto", padding: 16 },
        }}
      >
        {/* Combo Suggestions */}
        {detectedCombos.length > 0 && (
          <Card
            size="small"
            style={{
              marginBottom: 12,
              background: "linear-gradient(135deg, #fff7e6 0%, #fffbf0 100%)",
              border: "2px solid #faad14",
            }}
          >
            <Space direction="vertical" size={8} style={{ width: "100%" }}>
              <Text strong style={{ color: "#d46b08" }}>
                🎁 Combo khuyến mãi!
              </Text>
              {detectedCombos.map((combo) => {
                const originalPrice =
                  combo.combo_items?.reduce((sum, item) => {
                    return (
                      sum + (item.products?.retail_price || 0) * item.quantity
                    );
                  }, 0) || 0;
                const discountAmount = originalPrice - combo.combo_price;

                return (
                  <Button
                    key={combo.id}
                    type="primary"
                    size="small"
                    block
                    onClick={() => {
                      handleAddCombo?.(combo);
                      setIsCartModalOpen(false);
                    }}
                    style={{
                      height: "auto",
                      padding: "8px 12px",
                      textAlign: "left",
                    }}
                  >
                    <div>
                      <Text strong style={{ color: "#fff" }}>
                        {combo.name}
                      </Text>
                      <br />
                      <Text style={{ fontSize: 11, color: "#fff" }}>
                        Tiết kiệm {discountAmount.toLocaleString()}đ
                      </Text>
                    </div>
                  </Button>
                );
              })}
            </Space>
          </Card>
        )}

        {/* Cart Items */}
        {cart.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Giỏ hàng trống"
            style={{ marginTop: 40 }}
          />
        ) : (
          <>
            <List
              size="small"
              dataSource={cartDetails.items}
              renderItem={(item: any) => (
                <List.Item
                  style={{
                    padding: "8px 0",
                    borderBottom: "1px solid #f0f0f0",
                  }}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        src={item.image_url}
                        size={48}
                        icon={<AppstoreOutlined />}
                      />
                    }
                    title={
                      <Space>
                        <Text strong style={{ fontSize: 13 }}>
                          {item.name}
                        </Text>
                        {item.isCombo && (
                          <Tag
                            color="orange"
                            style={{ margin: 0, fontSize: 11 }}
                          >
                            COMBO
                          </Tag>
                        )}
                      </Space>
                    }
                    description={
                      <Space
                        direction="vertical"
                        size={2}
                        style={{ width: "100%" }}
                      >
                        {item.lot_number && (
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            📦 Lô: {item.lot_number}
                            {item.batch_code && ` (${item.batch_code})`}
                          </Text>
                        )}
                        <Space>
                          <Text style={{ color: "#1890ff", fontSize: 13 }}>
                            {item.finalPrice.toLocaleString()}đ
                          </Text>
                          <InputNumber
                            size="small"
                            min={1}
                            value={item.quantity}
                            onChange={(val) =>
                              handleUpdateQuantity(item.id, val!)
                            }
                            style={{ width: 55 }}
                          />
                          <Button
                            type="text"
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={() => handleRemoveFromCart(item.id)}
                          />
                        </Space>
                        <Text strong style={{ fontSize: 14 }}>
                          = {(item.finalPrice * item.quantity).toLocaleString()}
                          đ
                        </Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />

            <Divider />

            {/* Payment Section */}
            <Space direction="vertical" size={12} style={{ width: "100%" }}>
              {/* Total */}
              <div style={{ textAlign: "center" }}>
                {cartDetails.totalDiscount > 0 && (
                  <>
                    <Text delete style={{ color: "#999", fontSize: 14 }}>
                      {cartDetails.originalTotal.toLocaleString()}đ
                    </Text>
                    <br />
                    <Text type="success" style={{ fontSize: 13 }}>
                      Tiết kiệm: {cartDetails.totalDiscount.toLocaleString()}đ
                    </Text>
                    <br />
                  </>
                )}
                <Title level={3} style={{ margin: "4px 0", color: "#1890ff" }}>
                  {cartDetails.itemTotal.toLocaleString()}đ
                </Title>
              </div>

              {/* Payment Buttons */}
              <Button
                type="primary"
                block
                size="large"
                icon={<DollarOutlined />}
                disabled={cart.length === 0 || hasStockViolation}
                loading={isProcessingPayment}
                onClick={() => {
                  handleOpenPaymentModal("cash");
                  setIsCartModalOpen(false);
                }}
                style={{
                  height: 50,
                  fontSize: 16,
                  fontWeight: "bold",
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  border: "none",
                }}
              >
                Thanh toán - Tiền mặt
              </Button>
              <Button
                block
                size="large"
                icon={<CreditCardOutlined />}
                disabled={cart.length === 0 || hasStockViolation}
                onClick={() => {
                  handleOpenPaymentModal("card");
                  setIsCartModalOpen(false);
                }}
                style={{ height: 42 }}
              >
                Thẻ / Chuyển khoản
              </Button>

              {hasStockViolation && (
                <Text
                  type="danger"
                  style={{
                    fontSize: 12,
                    textAlign: "center",
                    display: "block",
                  }}
                >
                  ⚠️ Số lượng vượt tồn kho
                </Text>
              )}
            </Space>
          </>
        )}
      </Modal>
    </div>
  );
};

export default PosTabContent;
