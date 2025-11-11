import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  Space,
  InputNumber,
  Tag,
  Tooltip,
  Typography,
  Empty,
  FloatButton,
  Badge,
  Modal,
  Descriptions,
  Form,
  App,
  AutoComplete,
} from "antd";
import {
  UserOutlined,
  DeleteOutlined,
  ShoppingCartOutlined,
  CreditCardOutlined,
  DollarOutlined,
  AppstoreOutlined,
  CloseCircleOutlined,
  CloseOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { useInventory, usePosStore } from "@nam-viet-erp/store";
import {
  calculateProductGlobalQuantities,
  updatePatient,
  getPromoCodes,
} from "@nam-viet-erp/services";
import {
  isPromotionApplicable,
  getPromotionNotApplicableReason,
} from "../utils/promotionUtils";
import ProductSearchInput from "./ProductSearchInput";
import DateInput from "./DateInput";

const { Text, Title } = Typography;
const { Search } = Input;

interface PosTabContentProps {
  // Tab
  activeTabId: string;

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
    promoDiscount?: number;
    pointsDiscount?: number;
    finalTotal?: number;
  };
  handleRemoveFromCart: (itemKey: string) => void;
  handleUpdateQuantity: (itemKey: string, quantity: number) => void;
  handleOpenPaymentModal: (method: "cash" | "card") => void;
  isProcessingPayment: boolean;

  // Promo code
  promoCode?: string;
  setPromoCode?: (code: string) => void;
  appliedPromoCode?: string | null;
  promoDiscount?: number;
  promoCodeError?: string;
  handleApplyPromoCode?: (codeToApply?: string) => void;
  handleRemovePromoCode?: () => void;

  // Points discount
  pointsToRedeem?: number;
  setPointsToRedeem?: (points: number) => void;
  appliedPointsDiscount?: {
    pointsUsed: number;
    discountAmount: number;
    pointsRemaining: number;
  } | null;
  pointsDiscountError?: string;
  handleApplyPointsDiscount?: () => void;
  handleRemovePointsDiscount?: () => void;

  // Combos
  detectedCombos?: IComboWithItems[];
  handleAddCombo?: (combo: IComboWithItems) => void;

  // Mobile
  isMobile: boolean;
  isCartModalOpen: boolean;
  setIsCartModalOpen: (open: boolean) => void;
}

const PosTabContent: React.FC<PosTabContentProps> = ({
  activeTabId,
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
  handleAddToCart,
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
  promoCode,
  setPromoCode,
  appliedPromoCode,
  promoDiscount,
  promoCodeError,
  handleApplyPromoCode,
  handleRemovePromoCode,
  pointsToRedeem,
  setPointsToRedeem,
  appliedPointsDiscount,
  pointsDiscountError,
  handleApplyPointsDiscount,
  handleRemovePointsDiscount,
}) => {
  const navigate = useNavigate();
  const inventory = useInventory();
  const { notification } = App.useApp();
  const [isEditPatientModalOpen, setIsEditPatientModalOpen] = useState(false);
  const [editForm] = Form.useForm();
  const [isSavingPatient, setIsSavingPatient] = useState(false);
  const productSearchRef = React.useRef<any>(null);

  // Promo codes state
  const [availablePromoCodes, setAvailablePromoCodes] = useState<any[]>([]);
  const [promoOptions, setPromoOptions] = useState<
    { value: string; label: string; description?: string }[]
  >([]);
  const [promoLoading, setPromoLoading] = useState(false);

  // Load promo codes (applicable first) for search/select - giống B2B
  const loadPromoOptions = React.useCallback(async () => {
    if (promoOptions.length > 0) return; // đã tải rồi thì không gọi lại
    try {
      setPromoLoading(true);
      // Luôn hiển thị toàn bộ mã đang hoạt động
      const { data } = await getPromoCodes();
      if (data) {
        setAvailablePromoCodes(data);
        setPromoOptions(
          (data || []).map((p: any) => ({
            value: p.code,
            label: `${p.code} — ${p.name}`,
            description: p.description,
          })),
        );
      }
    } catch (e) {
      // silent fail
    } finally {
      setPromoLoading(false);
    }
  }, []);

  // Fetch all available promo codes on mount
  useEffect(() => {
    loadPromoOptions();
  }, []);

  // Reset promo code when cart is empty
  useEffect(() => {
    if (cart.length === 0 && (promoCode || appliedPromoCode)) {
      setPromoCode?.("");
      handleRemovePromoCode?.();
    }
  }, [cart.length]);

  // Update tab title when customer is selected
  useEffect(() => {
    if (selectedCustomer) {
      const { updateTabTitle } = usePosStore.getState();
      const newTitle = `${selectedCustomer.full_name}-${selectedCustomer.phone_number}`;
      updateTabTitle(activeTabId, newTitle);
    }
  }, [selectedCustomer, activeTabId]);

  // Auto-focus product search when typing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Get the active element
      const activeElement = document.activeElement as HTMLElement;
      const tagName = activeElement?.tagName.toLowerCase();

      // Don't trigger if user is already typing in an input/textarea
      if (
        tagName === "input" ||
        tagName === "textarea" ||
        activeElement?.contentEditable === "true"
      ) {
        return;
      }

      // Don't trigger on special keys
      if (
        e.ctrlKey ||
        e.metaKey ||
        e.altKey ||
        e.key === "Escape" ||
        e.key === "Tab" ||
        e.key === "Enter" ||
        e.key === "Shift" ||
        e.key === "Control" ||
        e.key === "Alt" ||
        e.key === "Meta" ||
        e.key.startsWith("Arrow") ||
        e.key.startsWith("F")
      ) {
        return;
      }

      // Only trigger on printable characters (length 1 or space)
      if (e.key.length === 1) {
        // Focus the product search input
        if (productSearchRef.current) {
          productSearchRef.current.focus();
        }
      }
    };

    // Add event listener
    document.addEventListener("keydown", handleKeyDown);

    // Cleanup
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth: string | null): number | null => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  // Get appropriate HDSD based on patient age
  const getHDSD = (item: any): string | null => {
    if (!item.product) return null;

    const age = selectedCustomer?.date_of_birth
      ? calculateAge(selectedCustomer.date_of_birth)
      : null;
    const product = item.product;

    if (age === null) {
      // If no age, show hdsd_over_18 as default
      return (
        product.hdsd_over_18 ||
        product.hdsd_6_18 ||
        product.hdsd_2_6 ||
        product.hdsd_0_2
      );
    }

    if (age < 2) {
      return product.hdsd_0_2;
    } else if (age < 6) {
      return product.hdsd_2_6;
    } else if (age < 18) {
      return product.hdsd_6_18;
    } else {
      return product.hdsd_over_18;
    }
  };

  // Handle saving patient edits
  const handleSavePatient = async () => {
    try {
      const values = await editForm.validateFields();
      setIsSavingPatient(true);

      const { data, error } = await updatePatient(
        selectedCustomer.patient_id,
        values,
      );

      if (error) {
        throw new Error(error.message);
      }

      notification.success({
        message: "Cập nhật thành công",
        description: "Thông tin khách hàng đã được cập nhật",
      });

      // Update the selected customer with new data
      setStoreSelectedCustomer(data);
      setIsEditPatientModalOpen(false);
      editForm.resetFields();
    } catch (error: any) {
      notification.error({
        message: "Lỗi",
        description: error.message || "Không thể cập nhật thông tin khách hàng",
      });
    } finally {
      setIsSavingPatient(false);
    }
  };

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

  // Filter products by selected category

  return (
    <div
      style={{
        backgroundColor: "#f5f5f5",
        minHeight: "100vh",
        padding: "8px",
        height: "100%",
      }}
    >
      {/* Top Bar - Customer & Warehouse Info */}
      <div
        style={{
          backgroundColor: "#fff",
          padding: "8px 12px",
          marginBottom: 8,
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
        </Row>
      </div>

      <Row
        gutter={24}
        style={{ height: "calc(100vh - 150px)", paddingTop: "16px" }}
      >
        {/* Left Panel - Cart */}
        <Col xs={24} lg={11}>
          <div
            style={{
              backgroundColor: "white",
              height: "calc(100vh - 150px)",
              padding: "16px",
              borderRadius: "12px",
            }}
          >
            <ProductSearchInput
              ref={productSearchRef}
              size="large"
              onChange={(product) => handleAddToCart(product)}
              selectedCustomer={selectedCustomer}
              employeeWarehouse={employeeWarehouse}
            />

            <div
              style={{
                height: "calc(100% - 66px - 60px)",
                overflowY: "auto",
                paddingRight: "10px",
                backgroundColor: "white",
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
                  <Space
                    direction="vertical"
                    size={8}
                    style={{ width: "100%" }}
                  >
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

              {/* Cart Items List */}
              <List
                itemLayout="vertical"
                dataSource={cartDetails.items}
                locale={{
                  emptyText: (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="Giỏ hàng trống"
                    />
                  ),
                }}
                renderItem={(item: any) => {
                  const hdsd = item?.description ?? getHDSD(item);
                  return (
                    <List.Item
                      key={item.key}
                      style={{
                        background: "#fff",
                        marginBottom: "8px",
                        padding: "12px",
                        borderRadius: "8px",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                      }}
                    >
                      <Row align="middle" gutter={16}>
                        <Col flex="auto">
                          <Text
                            strong
                            style={{
                              cursor: "pointer",
                              color: "#1890ff",
                            }}
                            onClick={() => {
                              if (item.product_id) {
                                navigate(`/products/edit/${item.product_id}`);
                              }
                            }}
                          >
                            {item.name}
                          </Text>
                          {item.isCombo && (
                            <Tag
                              color="orange"
                              style={{ marginLeft: 8, fontSize: 11 }}
                            >
                              COMBO
                            </Tag>
                          )}
                          {item.lot_number && (
                            <div>
                              <Text type="secondary" style={{ fontSize: 11 }}>
                                📦 Lô: {item.lot_number}
                                {item.batch_code && ` (${item.batch_code})`}
                              </Text>
                            </div>
                          )}
                          <Input.TextArea
                            value={hdsd || ""}
                            autoSize={{ minRows: 1, maxRows: 3 }}
                            variant="borderless"
                            style={{
                              padding: "4px 0",
                              color: "rgba(0,0,0,0.45)",
                            }}
                            placeholder="Hướng dẫn sử dụng..."
                          />
                        </Col>
                        <Col style={{ width: 80 }}>
                          <Text>{item.finalPrice?.toLocaleString()}đ</Text>
                        </Col>
                        <Col style={{ width: 100 }}>
                          <InputNumber
                            min={1}
                            value={item.quantity}
                            onChange={(val) =>
                              handleUpdateQuantity(item.key, val!)
                            }
                          />
                        </Col>
                        <Col style={{ width: 120, textAlign: "right" }}>
                          <Text strong>
                            {(item.finalPrice * item.quantity).toLocaleString()}
                            đ
                          </Text>
                        </Col>
                        <Col>
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => handleRemoveFromCart(item.key)}
                          />
                        </Col>
                      </Row>
                    </List.Item>
                  );
                }}
              />
            </div>
          </div>
        </Col>

        {/* Middle Panel - Patient Information */}
        <Col xs={0} lg={7}>
          {/* Patient Search */}
          <div
            style={{
              backgroundColor: "white",
              height: "calc(100vh - 150px)",
              padding: "16px",
              borderRadius: "12px",
            }}
          >
            <div style={{ position: "relative" }}>
              {!selectedCustomer && (
                <Search
                  placeholder="Tìm khách hàng (SĐT hoặc tên)..."
                  value={customerSearchTerm}
                  onChange={(e) => {
                    setCustomerSearchTerm(e.target.value);
                    if (e.target.value) {
                      setShowCustomerDropdown(true);
                    }
                  }}
                  onFocus={() => {
                    if (customerSearchTerm) {
                      setShowCustomerDropdown(true);
                    }
                  }}
                  loading={isSearchingCustomers}
                  size="large"
                  prefix={<UserOutlined />}
                  suffix={
                    selectedCustomer ? (
                      <CloseCircleOutlined
                        style={{ cursor: "pointer", color: "#999" }}
                        onClick={() => {
                          setStoreSelectedCustomer(null);
                          setCustomerSearchTerm("");
                        }}
                      />
                    ) : null
                  }
                />
              )}

              {!!selectedCustomer && (
                <Row
                  style={{
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 16,
                  }}
                >
                  <Text strong>Thông tin khách hàng</Text>
                  <Space>
                    <Tooltip title="Chỉnh sửa">
                      <Button
                        type="text"
                        shape="circle"
                        icon={<EditOutlined />}
                        onClick={() => {
                          editForm.setFieldsValue({
                            full_name: selectedCustomer.full_name,
                            phone_number: selectedCustomer.phone_number,
                            date_of_birth: selectedCustomer.date_of_birth,
                            gender: selectedCustomer.gender,
                            address: selectedCustomer.address,
                            allergy_notes: selectedCustomer.allergy_notes,
                            chronic_diseases: selectedCustomer.chronic_diseases,
                          });
                          setIsEditPatientModalOpen(true);
                        }}
                      />
                    </Tooltip>
                    <Tooltip title="Đóng">
                      <Button
                        type="text"
                        shape="circle"
                        icon={<CloseOutlined />}
                        onClick={() => {
                          setStoreSelectedCustomer(null);
                          setCustomerSearchTerm("");
                        }}
                      />
                    </Tooltip>
                  </Space>
                </Row>
              )}

              {showCustomerDropdown && customerSearchTerm && (
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
                  {isSearchingCustomers ? (
                    <div style={{ padding: "16px", textAlign: "center" }}>
                      <Text type="secondary">Đang tìm kiếm...</Text>
                    </div>
                  ) : customerSearchResults.length > 0 ? (
                    <List
                      size="small"
                      dataSource={customerSearchResults}
                      renderItem={(customer: IPatient) => {
                        return (
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
                        );
                      }}
                    />
                  ) : (
                    <div style={{ padding: "8px 12px", textAlign: "center" }}>
                      <Text type="secondary">Không tìm thấy khách hàng</Text>
                    </div>
                  )}
                  <Button
                    type="primary"
                    block
                    style={{ marginTop: 8 }}
                    onClick={() => {
                      setIsCreateCustomerModalOpen(true);
                      setShowCustomerDropdown(false);
                    }}
                  >
                    + Tạo khách hàng mới
                  </Button>
                </Card>
              )}
            </div>

            {selectedCustomer && (
              <Card
                style={{
                  borderRadius: 8,
                  borderWidth: 0,
                  height: "calc(100vh - 186px)",
                }}
              >
                {/* Name */}
                <Descriptions
                  bordered
                  column={1}
                  size="small"
                  style={{ marginRight: -25, marginLeft: -25 }}
                >
                  <Descriptions.Item label="Khách hàng">
                    <Space>
                      <Avatar size="small" icon={<UserOutlined />} />
                      <Text strong>{selectedCustomer.full_name}</Text>
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="Điểm tích lũy">
                    <Text strong style={{ color: "#52c41a" }}>
                      {selectedCustomer.loyalty_points}
                    </Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Tuổi">
                    {selectedCustomer.date_of_birth &&
                      calculateAge(selectedCustomer.date_of_birth) !== null &&
                      calculateAge(selectedCustomer.date_of_birth) + " tuổi"}
                  </Descriptions.Item>
                  {/* <Descriptions.Item label="Cân nặng">
                    12
                  </Descriptions.Item> */}
                  <Descriptions.Item label="Dị ứng">
                    <Tag color="volcano">{selectedCustomer.allergy_notes}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Tiền sử bệnh">
                    {selectedCustomer.chronic_diseases}
                  </Descriptions.Item>
                </Descriptions>
                {/* Address */}
                {selectedCustomer.address && (
                  <div
                    style={{ marginRight: -25, marginLeft: -25, marginTop: 25 }}
                  >
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Địa chỉ
                    </Text>
                    <div>
                      <Text>{selectedCustomer.address}</Text>
                    </div>
                  </div>
                )}
              </Card>
            )}
          </div>
        </Col>

        {/* Right Panel - Payment */}
        <Col xs={0} lg={6}>
          <Card
            style={{
              borderRadius: 8,
              height: "calc(100vh - 120px)",
              display: "flex",
              flexDirection: "column",
            }}
            styles={{
              body: {
                flex: 1,
                display: "flex",
                flexDirection: "column",
                padding: 16,
              },
            }}
          >
            {/* Promo Code Input */}
            <div style={{ marginTop: 12, marginBottom: 12 }}>
              {!appliedPromoCode ? (
                <AutoComplete
                  placeholder="Nhập hoặc tìm mã khuyến mãi (Enter để áp dụng)"
                  value={promoCode}
                  onChange={(value) => {
                    setPromoCode?.(value);
                  }}
                  onSelect={(value) => {
                    // Apply directly with the selected value
                    handleApplyPromoCode?.(value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && promoCode) {
                      handleApplyPromoCode?.(promoCode);
                    }
                  }}
                  status={promoCodeError ? "error" : ""}
                  disabled={cart.length === 0}
                  options={availablePromoCodes
                    .filter((promo) => promo.code)
                    .map((promo) => {
                      const orderValue = cartDetails.itemTotal || 0;
                      const items = cartDetails.items || [];
                      const applicable = isPromotionApplicable(
                        promo,
                        orderValue,
                        items,
                      );
                      const reason = !applicable
                        ? getPromotionNotApplicableReason(promo, orderValue)
                        : "";

                      return {
                        value: promo.code,
                        disabled: !applicable,
                        label: (
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              opacity: applicable ? 1 : 0.5,
                            }}
                          >
                            <span>
                              {promo.code}
                              {!applicable && reason && (
                                <span
                                  style={{
                                    marginLeft: 8,
                                    fontSize: 11,
                                    color: "#ff4d4f",
                                  }}
                                >
                                  ({reason})
                                </span>
                              )}
                            </span>
                            <span style={{ color: "#888", fontSize: 12 }}>
                              {promo.type === "percentage"
                                ? `${promo.value}%`
                                : `${promo.value?.toLocaleString()}đ`}
                            </span>
                          </div>
                        ),
                      };
                    })}
                  filterOption={(inputValue, option) =>
                    option?.value
                      ?.toString()
                      .toLowerCase()
                      .includes(inputValue.toLowerCase())
                  }
                  style={{ width: "100%" }}
                />
              ) : (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 12px",
                    backgroundColor: "#f6ffed",
                    border: "1px solid #b7eb8f",
                    borderRadius: "6px",
                  }}
                >
                  <Space>
                    <Tag color="success">{appliedPromoCode}</Tag>
                    {promoDiscount && (
                      <Text type="success" style={{ fontSize: 13 }}>
                        Giảm: {promoDiscount.toLocaleString()}đ
                      </Text>
                    )}
                  </Space>
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<CloseCircleOutlined />}
                    onClick={handleRemovePromoCode}
                  >
                    Xóa
                  </Button>
                </div>
              )}
              {promoCodeError && (
                <Text type="danger" style={{ fontSize: 12, marginTop: 4 }}>
                  {promoCodeError}
                </Text>
              )}
            </div>

            {/* Points Discount Input */}
            {selectedCustomer && selectedCustomer.loyalty_points > 0 && (
              <div style={{ marginTop: 12, marginBottom: 12 }}>
                {!appliedPointsDiscount ? (
                  <Space.Compact style={{ width: "100%" }}>
                    <InputNumber
                      placeholder="Nhập số điểm muốn dùng"
                      value={pointsToRedeem}
                      onChange={(value) => setPointsToRedeem?.(value || 0)}
                      onKeyDown={(e) => {
                        if (
                          e.key === "Enter" &&
                          pointsToRedeem &&
                          pointsToRedeem > 0
                        ) {
                          handleApplyPointsDiscount?.();
                        }
                      }}
                      min={0}
                      max={selectedCustomer.loyalty_points}
                      style={{ width: "70%" }}
                      addonBefore="Điểm"
                      status={pointsDiscountError ? "error" : ""}
                      disabled={cart.length === 0}
                    />
                    <Button
                      type="primary"
                      onClick={handleApplyPointsDiscount}
                      disabled={
                        !pointsToRedeem ||
                        pointsToRedeem <= 0 ||
                        cart.length === 0
                      }
                      style={{ width: "30%" }}
                    >
                      Áp dụng
                    </Button>
                  </Space.Compact>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 12px",
                      backgroundColor: "#fff7e6",
                      border: "1px solid #ffd591",
                      borderRadius: "6px",
                    }}
                  >
                    <Space>
                      <Tag color="orange">
                        Đã dùng {appliedPointsDiscount.pointsUsed} điểm
                      </Tag>
                      <Text type="warning" style={{ fontSize: 13 }}>
                        Giảm:{" "}
                        {appliedPointsDiscount.discountAmount.toLocaleString()}đ
                      </Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Còn: {appliedPointsDiscount.pointsRemaining} điểm
                      </Text>
                    </Space>
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<CloseCircleOutlined />}
                      onClick={handleRemovePointsDiscount}
                    >
                      Xóa
                    </Button>
                  </div>
                )}
                {pointsDiscountError && (
                  <Text type="danger" style={{ fontSize: 12, marginTop: 4 }}>
                    {pointsDiscountError}
                  </Text>
                )}
              </div>
            )}

            {/* Spacer to push content to bottom */}
            <div style={{ flex: 1 }} />

            {/* Total & Payment Buttons */}
            <Space direction="vertical" size={12} style={{ width: "100%" }}>
              {/* Total */}
              <div style={{ textAlign: "center" }}>
                {!!appliedPromoCode && (
                  <>
                    {cartDetails.totalDiscount > 0 && (
                      <>
                        <Text delete style={{ color: "#999", fontSize: 14 }}>
                          {cartDetails.originalTotal.toLocaleString()}đ
                        </Text>
                        <br />
                        <Text type="success" style={{ fontSize: 13 }}>
                          Tiết kiệm:{" "}
                          {cartDetails.totalDiscount.toLocaleString()}đ
                        </Text>
                        <br />
                      </>
                    )}
                    {cartDetails.promoDiscount &&
                      cartDetails.promoDiscount > 0 && (
                        <>
                          <Text delete style={{ color: "#999", fontSize: 14 }}>
                            {cartDetails.itemTotal.toLocaleString()}đ
                          </Text>
                          <br />
                          <Text type="success" style={{ fontSize: 13 }}>
                            Giảm mã KM: -
                            {cartDetails.promoDiscount.toLocaleString()}đ
                          </Text>
                          <br />
                        </>
                      )}
                    {cartDetails.pointsDiscount &&
                      cartDetails.pointsDiscount > 0 && (
                        <>
                          <Text delete style={{ color: "#999", fontSize: 14 }}>
                            {(
                              cartDetails.itemTotal -
                              (cartDetails.promoDiscount || 0)
                            ).toLocaleString()}
                            đ
                          </Text>
                          <br />
                          <Text type="warning" style={{ fontSize: 13 }}>
                            Giảm điểm: -
                            {cartDetails.pointsDiscount.toLocaleString()}đ
                          </Text>
                          <br />
                        </>
                      )}
                  </>
                )}
                <Title level={3} style={{ margin: "4px 0", color: "#1890ff" }}>
                  {(
                    cartDetails.finalTotal ?? cartDetails.itemTotal
                  ).toLocaleString()}
                  đ
                </Title>
              </div>

              <Divider style={{ margin: "12px 0" }} />

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
        {/* Promo Code Input */}
        <div style={{ marginBottom: 12 }}>
          {!appliedPromoCode ? (
            <AutoComplete
              placeholder="Nhập hoặc tìm mã khuyến mãi (Enter để áp dụng)"
              value={promoCode}
              onChange={(value) => {
                setPromoCode?.(value);
              }}
              onSelect={(value) => {
                // Apply directly with the selected value
                handleApplyPromoCode?.(value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && promoCode) {
                  handleApplyPromoCode?.(promoCode);
                }
              }}
              status={promoCodeError ? "error" : ""}
              disabled={cart.length === 0}
              options={availablePromoCodes
                .filter((promo) => promo.code)
                .map((promo) => {
                  const orderValue = cartDetails.itemTotal || 0;
                  const items = cartDetails.items || [];
                  const applicable = isPromotionApplicable(
                    promo,
                    orderValue,
                    items,
                  );
                  const reason = !applicable
                    ? getPromotionNotApplicableReason(promo, orderValue)
                    : "";

                  return {
                    value: promo.code,
                    disabled: !applicable,
                    label: (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          opacity: applicable ? 1 : 0.5,
                        }}
                      >
                        <span>
                          {promo.code}
                          {!applicable && reason && (
                            <span
                              style={{
                                marginLeft: 8,
                                fontSize: 11,
                                color: "#ff4d4f",
                              }}
                            >
                              ({reason})
                            </span>
                          )}
                        </span>
                        <span style={{ color: "#888", fontSize: 12 }}>
                          {promo.type === "percentage"
                            ? `${promo.value}%`
                            : `${promo.value?.toLocaleString()}đ`}
                        </span>
                      </div>
                    ),
                  };
                })}
              filterOption={(inputValue, option) =>
                option?.value
                  ?.toString()
                  .toLowerCase()
                  .includes(inputValue.toLowerCase())
              }
              style={{ width: "100%" }}
            />
          ) : (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 12px",
                backgroundColor: "#f6ffed",
                border: "1px solid #b7eb8f",
                borderRadius: "6px",
              }}
            >
              <Space>
                <Tag color="success">{appliedPromoCode}</Tag>
                {promoDiscount && (
                  <Text type="success" style={{ fontSize: 13 }}>
                    Giảm: {promoDiscount.toLocaleString()}đ
                  </Text>
                )}
              </Space>
              <Button
                type="text"
                size="small"
                danger
                icon={<CloseCircleOutlined />}
                onClick={handleRemovePromoCode}
              >
                Xóa
              </Button>
            </div>
          )}
          {promoCodeError && (
            <Text type="danger" style={{ fontSize: 12, marginTop: 4 }}>
              {promoCodeError}
            </Text>
          )}
        </div>

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
              renderItem={(item: any) => {
                const hdsd = getHDSD(item);
                return (
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
                          <Text
                            strong
                            style={{
                              fontSize: 13,
                              cursor: "pointer",
                              color: "#1890ff",
                              textDecoration: "none",
                            }}
                            onClick={() => {
                              if (item.product?.id) {
                                navigate(`/products/${item.product.id}`);
                              }
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.textDecoration =
                                "underline";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.textDecoration = "none";
                            }}
                          >
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
                          {hdsd && (
                            <div
                              style={{
                                marginTop: 4,
                                padding: "4px 8px",
                                backgroundColor: "#f0f5ff",
                                borderRadius: 4,
                              }}
                            >
                              <Text style={{ fontSize: 11, color: "#1890ff" }}>
                                💊 HDSD: {hdsd}
                              </Text>
                            </div>
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
                                handleUpdateQuantity(item.key, val!)
                              }
                              style={{ width: 55 }}
                            />
                            <Button
                              type="text"
                              danger
                              size="small"
                              icon={<DeleteOutlined />}
                              onClick={() => handleRemoveFromCart(item.key)}
                            />
                          </Space>
                          <Text strong style={{ fontSize: 14 }}>
                            ={" "}
                            {(item.finalPrice * item.quantity).toLocaleString()}
                            đ
                          </Text>
                        </Space>
                      }
                    />
                  </List.Item>
                );
              }}
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
                {cartDetails.promoDiscount && cartDetails.promoDiscount > 0 && (
                  <>
                    <Text delete style={{ color: "#999", fontSize: 14 }}>
                      {cartDetails.itemTotal.toLocaleString()}đ
                    </Text>
                    <br />
                    <Text type="success" style={{ fontSize: 13 }}>
                      Giảm mã KM: -{cartDetails.promoDiscount.toLocaleString()}đ
                    </Text>
                    <br />
                  </>
                )}
                <Title level={3} style={{ margin: "4px 0", color: "#1890ff" }}>
                  {(
                    cartDetails.finalTotal ?? cartDetails.itemTotal
                  ).toLocaleString()}
                  đ
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

      {/* Edit Patient Modal */}
      <Modal
        title="Chỉnh sửa thông tin khách hàng"
        open={isEditPatientModalOpen}
        onOk={handleSavePatient}
        onCancel={() => {
          setIsEditPatientModalOpen(false);
          editForm.resetFields();
        }}
        confirmLoading={isSavingPatient}
        okText="Lưu"
        cancelText="Hủy"
        width={600}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item
            label="Họ và tên"
            name="full_name"
            rules={[{ required: true, message: "Vui lòng nhập họ và tên" }]}
          >
            <Input placeholder="Nhập họ và tên" />
          </Form.Item>

          <Form.Item
            label="Số điện thoại"
            name="phone_number"
            rules={[{ required: true, message: "Vui lòng nhập số điện thoại" }]}
          >
            <Input placeholder="Nhập số điện thoại" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Ngày sinh" name="date_of_birth">
                <DateInput />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Giới tính" name="gender">
                <Select placeholder="Chọn giới tính">
                  <Select.Option value="Nam">Nam</Select.Option>
                  <Select.Option value="Nữ">Nữ</Select.Option>
                  <Select.Option value="Khác">Khác</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Địa chỉ" name="address">
            <Input.TextArea rows={2} placeholder="Nhập địa chỉ" />
          </Form.Item>

          <Form.Item label="Dị ứng" name="allergy_notes">
            <Input.TextArea rows={2} placeholder="Nhập thông tin dị ứng" />
          </Form.Item>

          <Form.Item label="Bệnh nền / Tiền sử bệnh" name="chronic_diseases">
            <Input.TextArea
              rows={2}
              placeholder="Nhập bệnh nền hoặc tiền sử bệnh"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PosTabContent;
