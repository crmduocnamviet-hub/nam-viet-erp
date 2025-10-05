import React, { useMemo } from "react";
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
  Modal,
  Badge,
  FloatButton,
  Typography,
  Grid,
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
} from "@ant-design/icons";
import { useInventory } from "@nam-viet-erp/store";
import { calculateProductGlobalQuantities } from "@nam-viet-erp/services";

const { Text } = Typography;
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
}) => {
  const inventory = useInventory();
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
      (i) => !!productGlobalQuantities[i.products.id]
    );
    for (const prod of filterProducts) {
      if (prod.quantity < productGlobalQuantities[prod.products.id]) {
        return true;
      }
    }
    return false;
  }, [inventory, productGlobalQuantities]);
  // cart.some(
  //   (item) =>
  //     item.stock_quantity !== undefined && item.quantity > item.stock_quantity
  // );

  return (
    <div>
      {/* Employee Warehouse Display */}
      <Row style={{ marginBottom: 16 }} gutter={[8, 8]}>
        <Col xs={24}>
          <Space
            wrap
            size={isMobile ? "small" : "middle"}
            style={{ width: "100%" }}
          >
            {loadingWarehouse ? (
              <Text>Đang tải thông tin kho...</Text>
            ) : employeeWarehouse ? (
              <Text>
                🏪 <strong>Kho:</strong> {employeeWarehouse.name}
              </Text>
            ) : (
              <Text type="warning">⚠️ Chưa gán kho cho nhân viên</Text>
            )}
          </Space>
        </Col>
      </Row>

      <Row
        gutter={[16, 16]}
        style={{ minHeight: isMobile ? "auto" : "calc(100vh - 300px)" }}
      >
        <Col xs={24} lg={8}>
          <Space
            direction="vertical"
            size={isMobile ? 12 : 16}
            style={{
              width: "100%",
              height: isMobile ? "auto" : "100%",
            }}
          >
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
              <div style={{ position: "relative" }}>
                <Search
                  placeholder="Tìm khách hàng (SĐT hoặc tên)..."
                  enterButton={<SearchOutlined />}
                  style={{ marginBottom: 16 }}
                  value={customerSearchTerm}
                  onChange={(e) => setCustomerSearchTerm(e.target.value)}
                  loading={isSearchingCustomers}
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
                      maxHeight: 200,
                      overflow: "auto",
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
                            <Text type="secondary">
                              {customer.phone_number}
                            </Text>
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
              <Space align="center">
                <Avatar
                  size={48}
                  icon={<UserOutlined />}
                  style={{
                    backgroundColor: selectedCustomer ? "#52c41a" : "#1890ff",
                  }}
                />
                <div>
                  <Text strong style={{ fontSize: 16 }}>
                    {selectedCustomer
                      ? selectedCustomer.full_name
                      : "Khách vãng lai"}
                  </Text>
                  <br />
                  {selectedCustomer ? (
                    <>
                      <Space>
                        <Text type="secondary">
                          {selectedCustomer.phone_number}
                        </Text>
                        {selectedCustomer.loyalty_points > 0 && (
                          <Tag color="gold">
                            {selectedCustomer.loyalty_points} điểm
                          </Tag>
                        )}
                        <Button
                          type="link"
                          size="small"
                          style={{ padding: 0, height: "auto" }}
                          onClick={() => setStoreSelectedCustomer(null)}
                        >
                          Bỏ chọn
                        </Button>
                      </Space>
                      <br />
                      {selectedCustomer.allergy_notes && (
                        <div style={{ marginTop: 8 }}>
                          <Tag color="red" icon={<WarningOutlined />}>
                            Dị ứng: {selectedCustomer.allergy_notes}
                          </Tag>
                        </div>
                      )}
                      {selectedCustomer.chronic_diseases && (
                        <div style={{ marginTop: 4 }}>
                          <Tag color="orange" icon={<WarningOutlined />}>
                            Bệnh mãn tính: {selectedCustomer.chronic_diseases}
                          </Tag>
                        </div>
                      )}
                    </>
                  ) : (
                    <Button
                      type="link"
                      style={{ padding: 0, height: "auto" }}
                      onClick={() => setIsCreateCustomerModalOpen(true)}
                    >
                      + Tạo khách hàng mới
                    </Button>
                  )}
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
                flex: isMobile ? "none" : 1,
                display: "flex",
                flexDirection: "column",
                borderRadius: 8,
                overflow: "hidden",
                minHeight: isMobile ? 300 : "auto",
              }}
              styles={{
                body: {
                  flex: isMobile ? "none" : 1,
                  padding: 16,
                  overflow: isMobile ? "visible" : "hidden",
                },
              }}
            >
              <>
                <Space.Compact style={{ width: "100%", marginBottom: 8 }}>
                  <Search
                    placeholder="Quét mã vạch hoặc tìm tên thuốc..."
                    size="large"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    loading={isSearching}
                    style={{ width: "100%" }}
                  />
                  <Tooltip title="Quét mã QR">
                    <Button
                      icon={<QrcodeOutlined />}
                      size="large"
                      onClick={() => setIsQRScannerOpen(true)}
                      style={{ flexShrink: 0 }}
                    />
                  </Tooltip>
                </Space.Compact>
                {selectedWarehouse && (
                  <div
                    style={{
                      marginBottom: 16,
                      padding: "4px 8px",
                      backgroundColor: "#f0f8ff",
                      borderRadius: 4,
                      fontSize: "12px",
                      color: "#666",
                    }}
                  >
                    📦 Chỉ hiển thị sản phẩm có hàng trong kho:{" "}
                    {selectedWarehouse.name}
                  </div>
                )}
                <div
                  style={{
                    flex: isMobile ? "none" : 1,
                    overflow: "auto",
                    maxHeight: isMobile ? 250 : "none",
                  }}
                >
                  <List
                    loading={isSearching}
                    dataSource={searchResults}
                    locale={{
                      emptyText: searchTerm
                        ? selectedWarehouse
                          ? "Không tìm thấy sản phẩm có hàng trong kho được chọn"
                          : "Không tìm thấy sản phẩm"
                        : "Nhập từ khóa để tìm kiếm",
                    }}
                    renderItem={(product: IProduct) => (
                      <List.Item
                        style={{
                          padding: "12px 0",
                          borderRadius: 8,
                          marginBottom: 8,
                          backgroundColor: "#fafafa",
                          paddingLeft: 12,
                          paddingRight: 12,
                        }}
                        actions={[
                          <Tooltip title="Thêm vào giỏ hàng">
                            <Button
                              type="primary"
                              shape="circle"
                              icon={<PlusOutlined />}
                              onClick={() => handleAddToCart(product)}
                              disabled={product.stock_quantity === 0}
                            />
                          </Tooltip>,
                        ]}
                      >
                        <List.Item.Meta
                          title={
                            <Space>
                              <Text strong>{product.name}</Text>
                              {product.stock_quantity !== undefined &&
                                product.stock_quantity <= 5 && (
                                  <Tag
                                    color={
                                      product.stock_quantity === 0
                                        ? "red"
                                        : "orange"
                                    }
                                  >
                                    {product.stock_quantity === 0
                                      ? "Hết hàng"
                                      : `Còn ${product.stock_quantity}`}
                                  </Tag>
                                )}
                            </Space>
                          }
                          description={
                            <Space direction="vertical" size={0}>
                              <Text
                                style={{
                                  color: "#52c41a",
                                  fontWeight: 500,
                                }}
                              >
                                {(product.retail_price || 0).toLocaleString()}đ
                              </Text>
                              {product.stock_quantity !== undefined && (
                                <Text
                                  type="secondary"
                                  style={{ fontSize: "12px" }}
                                >
                                  📦 Tồn kho: {product.stock_quantity}
                                </Text>
                              )}
                            </Space>
                          }
                        />
                      </List.Item>
                    )}
                  />
                </div>
              </>
            </Card>
          </Space>
        </Col>
        <Col xs={24} lg={10}>
          <Card
            title={
              <Space>
                <span>Giỏ hàng</span>
              </Space>
            }
            size="small"
            style={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              borderRadius: 8,
              overflow: "hidden",
            }}
            styles={{
              body: { flex: 1, padding: 16, overflow: "hidden" },
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
                    🎁 Combo khuyến mãi có sẵn!
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
                    const discountPercentage =
                      originalPrice > 0
                        ? (discountAmount / originalPrice) * 100
                        : 0;

                    return (
                      <Card
                        key={combo.id}
                        size="small"
                        style={{
                          background: "#fff",
                          cursor: "pointer",
                        }}
                        hoverable
                      >
                        <Space
                          direction="vertical"
                          size={4}
                          style={{ width: "100%" }}
                        >
                          <Text strong>{combo.name}</Text>
                          {combo.description && (
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {combo.description}
                            </Text>
                          )}
                          <Space>
                            <Text
                              delete
                              style={{ color: "#999", fontSize: 12 }}
                            >
                              {originalPrice.toLocaleString()}đ
                            </Text>
                            <Tag color="orange">
                              Giảm {discountPercentage.toFixed(0)}%
                            </Tag>
                            <Text
                              strong
                              style={{ color: "#52c41a", fontSize: 14 }}
                            >
                              {combo.combo_price.toLocaleString()}đ
                            </Text>
                          </Space>
                          <div
                            style={{
                              fontSize: 11,
                              color: "#666",
                              marginTop: 4,
                            }}
                          >
                            {combo.combo_items?.map((item, idx) => (
                              <span key={idx}>
                                {item.products?.name} x{item.quantity}
                                {idx < (combo.combo_items?.length || 0) - 1 &&
                                  ", "}
                              </span>
                            ))}
                          </div>
                          <Button
                            type="primary"
                            size="small"
                            block
                            style={{ marginTop: 8 }}
                            onClick={() => handleAddCombo?.(combo)}
                          >
                            Thêm Combo (Tiết kiệm{" "}
                            {discountAmount.toLocaleString()}đ)
                          </Button>
                        </Space>
                      </Card>
                    );
                  })}
                </Space>
              </Card>
            )}

            <div style={{ flex: 1, overflow: "auto" }}>
              {cart.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "40px 0",
                    color: "#999",
                  }}
                >
                  <ShoppingCartOutlined
                    style={{ fontSize: 48, marginBottom: 16 }}
                  />
                  <div>Giỏ hàng trống</div>
                </div>
              ) : (
                <List
                  itemLayout="horizontal"
                  dataSource={cartDetails.items}
                  renderItem={(item: any) => {
                    return (
                      <List.Item
                        style={{
                          padding: "12px 0",
                          borderRadius: 8,
                          marginBottom: 8,
                          backgroundColor: item.isCombo ? "#fff7e6" : "#f8f9fa",
                          paddingLeft: 12,
                          paddingRight: 12,
                          borderLeft: item.isCombo
                            ? "4px solid #faad14"
                            : "none",
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
                          title={
                            <Space>
                              <Text strong>{item.name}</Text>
                              {item.isCombo && (
                                <Tag color="orange" icon={<GiftOutlined />}>
                                  COMBO
                                </Tag>
                              )}
                            </Space>
                          }
                          description={
                            <Space
                              direction="vertical"
                              size={4}
                              style={{ width: "100%" }}
                            >
                              <Space align="center">
                                {item.appliedPromotion && (
                                  <Text delete style={{ color: "#999" }}>
                                    {item.originalPrice.toLocaleString()}đ
                                  </Text>
                                )}
                                <Text strong style={{ color: "#52c41a" }}>
                                  {item.finalPrice.toLocaleString()}đ
                                </Text>
                                <InputNumber
                                  size="small"
                                  min={1}
                                  value={item.quantity}
                                  onChange={(val) =>
                                    handleUpdateQuantity(item.id, val!)
                                  }
                                  style={{ width: 60 }}
                                />
                                <div style={{ textAlign: "right" }}>
                                  <Text strong style={{ fontSize: 16 }}>
                                    {(
                                      item.finalPrice * item.quantity
                                    ).toLocaleString()}
                                    đ
                                  </Text>
                                </div>
                              </Space>
                              {item.appliedPromotion && !item.isCombo && (
                                <Tag icon={<TagOutlined />} color="success">
                                  {item.appliedPromotion.name}
                                </Tag>
                              )}
                              {item.isCombo && item.comboData && (
                                <div
                                  style={{
                                    marginTop: 4,
                                    fontSize: 11,
                                    color: "#666",
                                  }}
                                >
                                  <Text type="secondary">
                                    Sản phẩm:{" "}
                                    {item.comboData.combo_items
                                      ?.map(
                                        (
                                          comboItem: IComboItem & {
                                            products?: IProduct;
                                          }
                                        ) =>
                                          `${comboItem.products?.name} x${comboItem.quantity}`
                                      )
                                      .join(", ")}
                                  </Text>
                                  <br />
                                </div>
                              )}
                              {item.description && !item.isCombo && (
                                <Text
                                  type="secondary"
                                  style={{
                                    fontSize: 12,
                                    display: "block",
                                    marginTop: 4,
                                  }}
                                >
                                  {item.description}
                                </Text>
                              )}
                              {item.prescriptionNote && (
                                <Text
                                  type="secondary"
                                  style={{
                                    fontSize: "11px",
                                    fontStyle: "italic",
                                  }}
                                >
                                  📝 {item.prescriptionNote}
                                </Text>
                              )}
                            </Space>
                          }
                        />
                      </List.Item>
                    );
                  }}
                />
              )}
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={6} style={{ marginTop: isMobile ? 16 : 0 }}>
          <Card
            title="💰 Thanh toán"
            size="small"
            style={{
              height: isMobile ? "auto" : "100%",
              borderRadius: 8,
              border: "2px solid #1890ff",
            }}
          >
            <Space direction="vertical" size={16} style={{ width: "100%" }}>
              <div style={{ textAlign: "center" }}>
                <Statistic
                  title="Tổng cộng"
                  value={cartDetails.itemTotal}
                  suffix="VNĐ"
                  valueStyle={{
                    color: "#1890ff",
                    fontSize: isMobile ? "1.4rem" : "1.8rem",
                  }}
                />
                {cartDetails.totalDiscount > 0 && (
                  <>
                    <Text delete style={{ color: "#999" }}>
                      {cartDetails.originalTotal.toLocaleString()}đ
                    </Text>
                    <br />
                    <Statistic
                      title="🎉 Tiết kiệm"
                      value={cartDetails.totalDiscount}
                      suffix="VNĐ"
                      valueStyle={{
                        color: "#52c41a",
                        fontSize: isMobile ? "1rem" : "1.2rem",
                      }}
                    />
                  </>
                )}
              </div>

              <Divider style={{ margin: "8px 0" }} />

              <Space direction="vertical" size={8} style={{ width: "100%" }}>
                <Button
                  block
                  size={isMobile ? "middle" : "large"}
                  icon={<DollarOutlined />}
                  onClick={() => handleOpenPaymentModal("cash")}
                  style={{ height: isMobile ? 40 : 48 }}
                  disabled={cart.length === 0 || hasStockViolation}
                >
                  Tiền mặt
                </Button>
                <Button
                  block
                  size={isMobile ? "middle" : "large"}
                  icon={<CreditCardOutlined />}
                  onClick={() => handleOpenPaymentModal("card")}
                  style={{ height: isMobile ? 40 : 48 }}
                  disabled={cart.length === 0 || hasStockViolation}
                >
                  Thẻ
                </Button>
              </Space>

              {hasStockViolation && (
                <Text
                  type="danger"
                  style={{
                    fontSize: "12px",
                    textAlign: "center",
                    display: "block",
                  }}
                >
                  ⚠️ Vui lòng điều chỉnh số lượng sản phẩm vượt tồn kho
                </Text>
              )}

              <Button
                type="primary"
                block
                size={isMobile ? "middle" : "large"}
                style={{
                  height: isMobile ? 50 : 64,
                  fontSize: isMobile ? "1rem" : "1.2rem",
                  fontWeight: "bold",
                  background: "linear-gradient(45deg, #1890ff, #40a9ff)",
                  border: "none",
                  boxShadow: "0 4px 15px 0 rgba(24, 144, 255, 0.4)",
                }}
                disabled={cart.length === 0 || hasStockViolation}
                loading={isProcessingPayment}
                onClick={() => handleOpenPaymentModal("cash")}
              >
                🚀 Thanh Toán Ngay
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default PosTabContent;
