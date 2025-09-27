import React, { useState, useEffect, useMemo } from "react";
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
  Tooltip,
  Modal,
  Form,
  DatePicker,
  Grid,
  FloatButton,
  Badge,
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
} from "@ant-design/icons";
import { useDebounce } from "@nam-viet-erp/shared-components";
import {
  processSaleTransaction,
  searchProducts,
  getActivePromotions,
  getPatients,
  createPatient,
  getPrescriptionsByVisitId,
  getMedicalVisits,
  getWarehouse,
} from "@nam-viet-erp/services";
// Temporary stub component to replace missing PaymentModal
const PaymentModal: React.FC<{
  open: boolean;
  paymentMethod: "cash" | "card" | "qr";
  cartTotal: number;
  cartItems: CartItem[];
  customerInfo: any;
  onCancel: () => void;
  onFinish: () => void;
  okButtonProps?: { loading?: boolean };
  onPrintReceipt: () => void;
}> = ({ open, onCancel, onFinish, okButtonProps }) => (
  <Modal
    open={open}
    title="💳 Thanh toán"
    onCancel={onCancel}
    onOk={onFinish}
    okText="Xác nhận thanh toán"
    okButtonProps={okButtonProps}
  >
    <div style={{ padding: "20px", textAlign: "center" }}>
      <p>🏪 Giao diện thanh toán POS</p>
      <p style={{ color: "#666", fontSize: "14px" }}>
        Component thanh toán đang được phát triển
      </p>
    </div>
  </Modal>
);

// Types defined locally to match the actual usage in the code
type CartItem = {
  id: number;
  name: string;
  quantity: number;
  finalPrice: number;
  originalPrice: number;
  discount?: number;
  appliedPromotion?: any;
  prescriptionNote?: string;
  stock_quantity?: number;
  image_url?: string;
  product_id?: string;
  unit_price?: number;
  prescription_id?: string;
};

type CartDetails = {
  items: CartItem[];
  itemTotal: number;
  originalTotal: number;
  totalDiscount: number;
};

type PriceInfo = {
  finalPrice: number;
  originalPrice: number;
  appliedPromotion?: any;
};

const getErrorMessage = (error: any): string => {
  return error?.message || "Đã xảy ra lỗi không xác định";
};
// Context will be passed via props from the app
// import { useEmployee } from "../../context/EmployeeContext";

const { Title, Text } = Typography;
const { Search } = Input;
const { useBreakpoint } = Grid;

// Map UI selection to warehouse and fund IDs
const WAREHOUSE_MAP: {
  [key: string]: { warehouseId: number; fundId: number };
} = {
  dh1: { warehouseId: 1, fundId: 1 }, // Assuming DH1 is warehouse 1 and uses fund 1
  dh2: { warehouseId: 2, fundId: 2 }, // Assuming DH2 is warehouse 2 and uses fund 2
};

// Extended prescription type that includes joined product data (unused, commented out)
/* interface PrescriptionWithProduct extends IPrescription {
  products?: {
    name: string;
    manufacturer: string;
    route: string;
    retail_price: number;
  };
} */

interface PosPageProps {
  employee?: any;
  [key: string]: any;
}

const PosPage: React.FC<PosPageProps> = ({ employee }) => {
  const { notification } = App.useApp();
  const screens = useBreakpoint();
  const isMobile = !screens.lg;

  // State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<IProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "qr">(
    "cash"
  );
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState("dh1");
  const [promotions, setPromotions] = useState<IPromotion[]>([]);

  // Customer management
  const [selectedCustomer, setSelectedCustomer] = useState<IPatient | null>(
    null
  );
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [customerSearchResults, setCustomerSearchResults] = useState<
    IPatient[]
  >([]);
  const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  // Warehouse selection
  const [warehouseMode, setWarehouseMode] = useState(false);
  const [warehouses, setWarehouses] = useState<IWarehouse[]>([]);
  const [loadingWarehouses, setLoadingWarehouses] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<IWarehouse | null>(
    null
  );

  // Keep prescription integration for backward compatibility (commented out unused variables)
  // const [patientVisits, setPatientVisits] = useState<any[]>([]);
  const [selectedVisit, setSelectedVisit] = useState<any>(null);
  // const [availablePrescriptions, setAvailablePrescriptions] = useState<PrescriptionWithProduct[]>([]);
  // const [loadingPrescriptions, setLoadingPrescriptions] = useState(false);

  // Create customer modal
  const [isCreateCustomerModalOpen, setIsCreateCustomerModalOpen] =
    useState(false);
  const [createCustomerForm] = Form.useForm();
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);

  // Cart modal for mobile
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);

  const { warehouseId, fundId } = selectedWarehouse
    ? {
        warehouseId: selectedWarehouse.id,
        fundId: WAREHOUSE_MAP[selectedLocation]?.fundId || 1,
      }
    : WAREHOUSE_MAP[selectedLocation];
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const debouncedCustomerSearchTerm = useDebounce(customerSearchTerm, 300);

  // Fetch warehouses on component mount
  useEffect(() => {
    const fetchWarehouses = async () => {
      setLoadingWarehouses(true);
      try {
        const { data, error } = await getWarehouse();
        if (error) {
          notification.error({
            message: "Lỗi tải danh sách kho",
            description: error.message,
          });
        } else if (data) {
          setWarehouses(data);
          // Set first warehouse as default if available
          if (data.length > 0) {
            setSelectedWarehouse(data[0]);
          }
        }
      } catch (error) {
        notification.error({
          message: "Lỗi tải danh sách kho",
          description: "Không thể tải danh sách kho",
        });
      } finally {
        setLoadingWarehouses(false);
      }
    };

    fetchWarehouses();
  }, [notification]);

  useEffect(() => {
    const fetchPromos = async () => {
      const { data, error } = await getActivePromotions();
      if (error) {
        notification.error({
          message: "Lỗi tải khuyến mãi",
          description: error.message,
        });
      } else {
        setPromotions((data as IPromotion[]) || []);
      }
    };
    fetchPromos();
  }, [notification]);

  // --- PROMOTION LOGIC START ---
  const calculateBestPrice = (
    product: IProduct,
    promotions: IPromotion[]
  ): PriceInfo => {
    let bestPrice = product.retail_price;
    let appliedPromotion: IPromotion | null = null;

    if (bestPrice === null || bestPrice === undefined || bestPrice <= 0) {
      return {
        finalPrice: 0,
        originalPrice: 0,
        appliedPromotion: null,
      };
    }

    for (const promo of promotions) {
      const conditions = promo.conditions;
      let isApplicable = true;

      // Condition checks
      if (conditions) {
        // Check manufacturers
        const manufacturers = conditions.manufacturers;
        if (
          typeof manufacturers === "string" &&
          product.manufacturer &&
          manufacturers !== product.manufacturer
        ) {
          isApplicable = false;
        }

        // Check product categories
        const productCategories = conditions.product_categories;
        if (
          isApplicable &&
          typeof productCategories === "string" &&
          product.category &&
          productCategories !== product.category
        ) {
          isApplicable = false;
        }
      }

      if (isApplicable) {
        let currentPrice = product.retail_price;
        let calculated = false;

        if (
          promo.type === "percentage" &&
          product.retail_price !== null &&
          promo.value !== undefined
        ) {
          currentPrice = product.retail_price * (1 - promo.value / 100);
          calculated = true;
        } else if (
          promo.type === "fixed_amount" &&
          product.retail_price !== null &&
          promo.value !== undefined
        ) {
          currentPrice = product.retail_price - promo.value;
          calculated = true;
        }

        if (
          calculated &&
          currentPrice !== null &&
          bestPrice !== null &&
          currentPrice < bestPrice
        ) {
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
      searchProducts({
        search: debouncedSearchTerm,
        pageSize: 10,
        status: "active",
      })
        .then(({ data, error }) => {
          if (error) {
            notification.error({
              message: "Lỗi tìm kiếm",
              description: error.message,
            });
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

  useEffect(() => {
    if (debouncedCustomerSearchTerm) {
      setIsSearchingCustomers(true);
      getPatients({ search: debouncedCustomerSearchTerm, limit: 10 })
        .then(({ data, error }) => {
          if (error) {
            notification.error({
              message: "Lỗi tìm kiếm khách hàng",
              description: error.message,
            });
            setCustomerSearchResults([]);
          } else {
            setCustomerSearchResults(data || []);
            setShowCustomerDropdown(true);
          }
        })
        .finally(() => setIsSearchingCustomers(false));
    } else {
      setCustomerSearchResults([]);
      setShowCustomerDropdown(false);
    }
  }, [debouncedCustomerSearchTerm, notification]);

  // Load patient visits when customer is selected
  useEffect(() => {
    if (selectedCustomer /* && prescriptionMode */) {
      const loadPatientVisits = async () => {
        try {
          const { error } = await getMedicalVisits({
            patientId: selectedCustomer.patient_id,
            limit: 10,
          });
          if (error) {
            notification.error({
              message: "Lỗi tải lịch sử khám",
              description: error.message,
            });
          } else {
            // setPatientVisits(data || []);
          }
        } catch (error) {
          notification.error({
            message: "Lỗi hệ thống",
            description: "Không thể tải lịch sử khám bệnh",
          });
        }
      };
      loadPatientVisits();
    } else {
      // setPatientVisits([]);
      setSelectedVisit(null);
      // setAvailablePrescriptions([]);
    }
  }, [selectedCustomer, /* prescriptionMode, */ notification]);

  // Load prescriptions when visit is selected
  useEffect(() => {
    if (selectedVisit) {
      const loadPrescriptions = async () => {
        try {
          // setLoadingPrescriptions(true);
          const { error } = await getPrescriptionsByVisitId(
            selectedVisit.visit_id
          );
          if (error) {
            notification.error({
              message: "Lỗi tải đơn thuốc",
              description: error.message,
            });
          } else {
            // setAvailablePrescriptions(data || []);
          }
        } catch (error) {
          notification.error({
            message: "Lỗi hệ thống",
            description: "Không thể tải đơn thuốc",
          });
        } finally {
          // setLoadingPrescriptions(false);
        }
      };
      loadPrescriptions();
    } else {
      // setAvailablePrescriptions([]);
    }
  }, [selectedVisit, notification]);

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
    setSearchTerm("");
    setSearchResults([]);
  };

  // Commented out unused function - handleAddPrescriptionToCart
  /*
  const handleAddPrescriptionToCart = (prescription: any) => {
    const product = prescription.products;
    if (!product) return;

    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      const prescribedQuantity = prescription.quantity_ordered;

      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + prescribedQuantity }
            : item
        );
      } else {
        const priceInfo = calculateBestPrice(product, promotions);
        return [
          ...prevCart,
          {
            ...product,
            quantity: prescribedQuantity,
            ...priceInfo,
            prescriptionNote: prescription.dosage_instruction,
          },
        ];
      }
    });
  };
  */

  const handleToggleWarehouseMode = () => {
    setWarehouseMode(!warehouseMode);
    if (!warehouseMode) {
      // Entering warehouse mode
      if (warehouses.length === 0) {
        notification.info({
          message: "Đang tải danh sách kho...",
        });
      }
    } else {
      // Exiting warehouse mode
      setSelectedWarehouse(warehouses.length > 0 ? warehouses[0] : null);
    }
  };

  const handleCreateCustomer = async (values: any) => {
    try {
      setIsCreatingCustomer(true);
      const customerData: Omit<IPatient, "patient_id" | "created_at"> = {
        full_name: values.full_name,
        phone_number: values.phone_number,
        date_of_birth: values.date_of_birth?.format("YYYY-MM-DD") || null,
        gender: values.gender || null,
        is_b2b_customer: values.is_b2b_customer || false,
        loyalty_points: 0,
        allergy_notes: values.allergy_notes || null,
        chronic_diseases: values.chronic_diseases || null,
      };

      const { data, error } = await createPatient(customerData);

      if (error) {
        notification.error({
          message: "Lỗi tạo khách hàng",
          description: error.message,
        });
      } else {
        notification.success({
          message: "Tạo khách hàng thành công!",
          description: `Đã tạo khách hàng ${values.full_name}`,
        });
        setSelectedCustomer(data);
        setIsCreateCustomerModalOpen(false);
        createCustomerForm.resetFields();
      }
    } catch (error) {
      notification.error({
        message: "Lỗi hệ thống",
        description: "Không thể tạo khách hàng mới",
      });
    } finally {
      setIsCreatingCustomer(false);
    }
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
      // Create a mock product object with the required IProduct properties
      const mockProduct: IProduct = {
        ...item,
        id: item.id,
        name: item.name,
        retail_price: item.finalPrice || item.originalPrice,
        manufacturer: "",
        category: "",
        sku: "",
        cost_price: 0,
        created_at: "",
        stock_quantity: item.stock_quantity || 0,
        image_url: item.image_url || null,
        description: null,
        route: null,
        barcode: null,
        supplier_id: null,
      } as never;

      const priceInfo = calculateBestPrice(mockProduct, promotions);
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
  const handleOpenPaymentModal = (method: "cash" | "card" | "qr") => {
    if (cart.length === 0) {
      notification.warning({ message: "Giỏ hàng đang trống!" });
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
        createdBy:
          employee?.employee_id || "00000000-0000-0000-0000-000000000001", // Use actual employee ID or fallback
        customerId: selectedCustomer?.patient_id,
      });

      notification.success({
        message: "Thanh toán thành công!",
        description: `Đã ghi nhận hóa đơn ${cartDetails.itemTotal.toLocaleString()}đ.`,
      });

      setCart([]);
      setIsPaymentModalOpen(false);
    } catch (error: unknown) {
      notification.error({
        message: "Thanh toán thất bại",
        description: getErrorMessage(error),
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <div style={{ height: "100%", paddingBottom: isMobile ? 80 : 0 }}>
      <Row style={{ marginBottom: 16 }} gutter={[8, 8]}>
        <Col xs={24} sm={12} md={12}>
          <Title level={isMobile ? 3 : 2} style={{ margin: 0 }}>
            POS Bán Lẻ & Thống kê
          </Title>
        </Col>
        <Col
          xs={24}
          sm={12}
          md={12}
          style={{ textAlign: isMobile ? "left" : "right" }}
        >
          <Space wrap size={isMobile ? "small" : "middle"}>
            <Button
              type="default"
              size={isMobile ? "small" : "middle"}
              onClick={() => {
                notification.info({
                  message: "Thống kê bán hàng",
                  description: `Tổng đơn hàng hôm nay: ${
                    cart.length
                  } | Tổng doanh thu: ${cartDetails.itemTotal.toLocaleString()}đ`,
                  duration: 5,
                });
              }}
            >
              📊 Thống kê
            </Button>
            <Select
              value={selectedLocation}
              onChange={setSelectedLocation}
              size={isMobile ? "small" : "large"}
              style={{ width: isMobile ? 150 : 200 }}
              placeholder="Chọn cửa hàng"
            >
              <Select.Option value="dh1">🏪 Nhà thuốc DH1</Select.Option>
              <Select.Option value="dh2">🏪 Nhà thuốc DH2</Select.Option>
            </Select>
          </Space>
        </Col>
      </Row>

      <Row
        gutter={[16, 16]}
        style={{ minHeight: isMobile ? "auto" : "calc(100vh - 200px)" }}
      >
        <Col xs={24} lg={8}>
          <Space
            direction="vertical"
            size={isMobile ? 12 : 16}
            style={{ width: "100%", height: isMobile ? "auto" : "100%" }}
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
                          style={{ cursor: "pointer", padding: "8px 12px" }}
                          onClick={() => {
                            setSelectedCustomer(customer);
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
                        onClick={() => setSelectedCustomer(null)}
                      >
                        Bỏ chọn
                      </Button>
                    </Space>
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
                  {warehouseMode ? (
                    <Tag color="blue">Kho</Tag>
                  ) : (
                    <SearchOutlined />
                  )}
                  <span>
                    {warehouseMode ? "Chọn Kho" : "Tìm kiếm Sản phẩm"}
                  </span>
                  <Button
                    size="small"
                    type={warehouseMode ? "primary" : "default"}
                    onClick={handleToggleWarehouseMode}
                  >
                    {warehouseMode ? "Thoát" : "Chọn Kho"}
                  </Button>
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
              {!warehouseMode ? (
                <>
                  <Search
                    placeholder="Quét mã vạch hoặc tìm tên thuốc..."
                    size="large"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    loading={isSearching}
                    style={{ marginBottom: 16 }}
                  />
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
                          ? "Không tìm thấy sản phẩm"
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
                                  style={{ color: "#52c41a", fontWeight: 500 }}
                                >
                                  {(product.retail_price || 0).toLocaleString()}
                                  đ
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
              ) : (
                <div style={{ flex: 1, overflow: "auto" }}>
                  {loadingWarehouses ? (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "40px 0",
                        color: "#999",
                      }}
                    >
                      <Text>Đang tải danh sách kho...</Text>
                    </div>
                  ) : warehouses.length === 0 ? (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "40px 0",
                        color: "#999",
                      }}
                    >
                      <Text>Không có kho nào được tìm thấy</Text>
                    </div>
                  ) : (
                    <>
                      <Select
                        placeholder="Chọn kho"
                        style={{ width: "100%", marginBottom: 16 }}
                        value={selectedWarehouse?.id}
                        onChange={(warehouseId) => {
                          const warehouse = warehouses.find(
                            (w) => w.id === warehouseId
                          );
                          setSelectedWarehouse(warehouse || null);
                        }}
                      >
                        {warehouses.map((warehouse) => (
                          <Select.Option
                            key={warehouse.id}
                            value={warehouse.id}
                          >
                            🏪 {warehouse.name}
                          </Select.Option>
                        ))}
                      </Select>

                      {selectedWarehouse && (
                        <div
                          style={{
                            padding: "16px",
                            backgroundColor: "#f0f9ff",
                            borderRadius: "8px",
                            border: "1px solid #bae7ff",
                            marginBottom: "16px",
                          }}
                        >
                          <Text
                            strong
                            style={{ fontSize: "16px", color: "#1890ff" }}
                          >
                            📍 Kho được chọn: {selectedWarehouse.name}
                          </Text>
                          <div style={{ marginTop: "8px" }}>
                            <Text type="secondary">
                              ID Kho: {selectedWarehouse.id}
                            </Text>
                          </div>
                          <div style={{ marginTop: "8px" }}>
                            <Text type="success">
                              ✅ Kho đã được thiết lập cho phiên bán hàng
                            </Text>
                          </div>
                        </div>
                      )}

                      <div
                        style={{
                          textAlign: "center",
                          padding: "32px 0",
                          color: "#666",
                          backgroundColor: "#f9f9f9",
                          borderRadius: "8px",
                          border: "1px dashed #d9d9d9",
                        }}
                      >
                        <Text type="secondary">
                          💡 Chọn kho để thiết lập nguồn hàng hóa
                          <br />
                          Sau khi chọn kho, thoát chế độ này để tìm kiếm sản
                          phẩm
                        </Text>
                      </div>
                    </>
                  )}
                </div>
              )}
            </Card>
          </Space>
        </Col>

        {!isMobile && (
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
              styles={{ body: { flex: 1, padding: 16, overflow: "hidden" } }}
            >
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
                    renderItem={(item: CartItem) => (
                      <List.Item
                        style={{
                          padding: "12px 0",
                          borderRadius: 8,
                          marginBottom: 8,
                          backgroundColor: "#f8f9fa",
                          paddingLeft: 12,
                          paddingRight: 12,
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
                              </Space>
                              {item.appliedPromotion && (
                                <Tag icon={<TagOutlined />} color="success">
                                  {item.appliedPromotion.name}
                                </Tag>
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
                              {item.stock_quantity !== undefined &&
                                item.quantity > item.stock_quantity && (
                                  <Space>
                                    <WarningOutlined
                                      style={{ color: "#ff4d4f" }}
                                    />
                                    <Text
                                      type="danger"
                                      style={{ fontSize: "11px" }}
                                    >
                                      Vượt tồn kho ({item.stock_quantity} có
                                      sẵn)
                                    </Text>
                                  </Space>
                                )}
                            </Space>
                          }
                        />
                        <div style={{ textAlign: "right" }}>
                          <Text strong style={{ fontSize: 16 }}>
                            {(item.finalPrice * item.quantity).toLocaleString()}
                            đ
                          </Text>
                        </div>
                      </List.Item>
                    )}
                  />
                )}
              </div>
            </Card>
          </Col>
        )}

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
                >
                  Tiền mặt
                </Button>
                <Button
                  block
                  size={isMobile ? "middle" : "large"}
                  icon={<CreditCardOutlined />}
                  onClick={() => handleOpenPaymentModal("card")}
                  style={{ height: isMobile ? 40 : 48 }}
                >
                  Thẻ
                </Button>
                <Button
                  block
                  size={isMobile ? "middle" : "large"}
                  icon={<QrcodeOutlined />}
                  onClick={() => handleOpenPaymentModal("qr")}
                  style={{ height: isMobile ? 40 : 48 }}
                >
                  Chuyển khoản (QR)
                </Button>
              </Space>

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
                disabled={cart.length === 0}
                loading={isProcessingPayment}
                onClick={() => handleOpenPaymentModal("cash")}
              >
                🚀 Thanh Toán Ngay
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Floating Cart Button for Mobile */}
      {isMobile && (
        <>
          <FloatButton
            icon={
              <Badge count={cart.length} size="small">
                <ShoppingCartOutlined />
              </Badge>
            }
            type="primary"
            style={{
              bottom: 20,
              right: 20,
              width: 56,
              height: 56,
              zIndex: 1000,
            }}
            onClick={() => setIsCartModalOpen(true)}
          />

          {/* Cart Modal for Mobile */}
          <Modal
            title={
              <Space>
                <ShoppingCartOutlined />
                <span>Giỏ hàng ({cart.length} sản phẩm)</span>
              </Space>
            }
            open={isCartModalOpen}
            onCancel={() => setIsCartModalOpen(false)}
            footer={null}
            width="calc(100% - 32px)"
            style={{
              top: 16,
              paddingBottom: 0,
              maxWidth: "calc(100vw - 32px)",
              margin: "16px",
            }}
            styles={{
              body: {
                padding: "16px",
                maxHeight: "70vh",
                overflow: "auto",
              },
            }}
          >
            <div style={{ marginBottom: 16 }}>
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
                  renderItem={(item: CartItem) => (
                    <List.Item
                      style={{
                        padding: "12px",
                        borderRadius: 8,
                        marginBottom: 8,
                        backgroundColor: "#f8f9fa",
                        border: "1px solid #e8e8e8",
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
                        avatar={<Avatar src={item.image_url} size={40} />}
                        title={
                          <Text strong style={{ fontSize: 14 }}>
                            {item.name}
                          </Text>
                        }
                        description={
                          <Space
                            direction="vertical"
                            size={4}
                            style={{ width: "100%" }}
                          >
                            <Space align="center" wrap>
                              {item.appliedPromotion && (
                                <Text
                                  delete
                                  style={{ color: "#999", fontSize: 12 }}
                                >
                                  {item.originalPrice.toLocaleString()}đ
                                </Text>
                              )}
                              <Text
                                strong
                                style={{ color: "#52c41a", fontSize: 14 }}
                              >
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
                            </Space>
                            {item.appliedPromotion && (
                              <Tag
                                icon={<TagOutlined />}
                                color="success"
                                style={{ fontSize: 11 }}
                              >
                                {item.appliedPromotion.name}
                              </Tag>
                            )}
                            {item.prescriptionNote && (
                              <Text
                                type="secondary"
                                style={{
                                  fontSize: "10px",
                                  fontStyle: "italic",
                                }}
                              >
                                📝 {item.prescriptionNote}
                              </Text>
                            )}
                            {item.stock_quantity !== undefined &&
                              item.quantity > item.stock_quantity && (
                                <Space>
                                  <WarningOutlined
                                    style={{ color: "#ff4d4f", fontSize: 12 }}
                                  />
                                  <Text
                                    type="danger"
                                    style={{ fontSize: "10px" }}
                                  >
                                    Vượt tồn kho ({item.stock_quantity} có sẵn)
                                  </Text>
                                </Space>
                              )}
                            <div style={{ textAlign: "right", marginTop: 4 }}>
                              <Text
                                strong
                                style={{ fontSize: 14, color: "#1890ff" }}
                              >
                                ={" "}
                                {(
                                  item.finalPrice * item.quantity
                                ).toLocaleString()}
                                đ
                              </Text>
                            </div>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              )}
            </div>

            {cart.length > 0 && (
              <div
                style={{
                  borderTop: "1px solid #e8e8e8",
                  paddingTop: 16,
                  position: "sticky",
                  bottom: 0,
                  backgroundColor: "white",
                }}
              >
                <div style={{ textAlign: "center", marginBottom: 16 }}>
                  <Statistic
                    title="Tổng cộng"
                    value={cartDetails.itemTotal}
                    suffix="VNĐ"
                    valueStyle={{ color: "#1890ff", fontSize: "1.5rem" }}
                  />
                  {cartDetails.totalDiscount > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <Text delete style={{ color: "#999" }}>
                        {cartDetails.originalTotal.toLocaleString()}đ
                      </Text>
                      <br />
                      <Text style={{ color: "#52c41a", fontSize: "14px" }}>
                        🎉 Tiết kiệm:{" "}
                        {cartDetails.totalDiscount.toLocaleString()}đ
                      </Text>
                    </div>
                  )}
                </div>
                <Button
                  type="primary"
                  block
                  size="large"
                  style={{
                    height: 50,
                    fontSize: "1.1rem",
                    fontWeight: "bold",
                  }}
                  disabled={cart.length === 0}
                  loading={isProcessingPayment}
                  onClick={() => {
                    setIsCartModalOpen(false);
                    handleOpenPaymentModal("cash");
                  }}
                >
                  🚀 Thanh Toán ({cartDetails.itemTotal.toLocaleString()}đ)
                </Button>
              </div>
            )}
          </Modal>
        </>
      )}

      <PaymentModal
        open={isPaymentModalOpen}
        paymentMethod={paymentMethod}
        cartTotal={cartDetails.itemTotal}
        cartItems={cartDetails.items}
        customerInfo={selectedCustomer}
        onCancel={() => setIsPaymentModalOpen(false)}
        onFinish={handleFinishPayment}
        okButtonProps={{ loading: isProcessingPayment }}
        onPrintReceipt={() => {
          notification.success({ message: "Đang in hóa đơn..." });
        }}
      />

      <Modal
        title="Tạo khách hàng mới"
        open={isCreateCustomerModalOpen}
        onCancel={() => {
          setIsCreateCustomerModalOpen(false);
          createCustomerForm.resetFields();
        }}
        onOk={createCustomerForm.submit}
        confirmLoading={isCreatingCustomer}
        width={600}
      >
        <Form
          form={createCustomerForm}
          layout="vertical"
          onFinish={handleCreateCustomer}
          style={{ marginTop: 16 }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="full_name"
                label="Họ và tên"
                rules={[{ required: true, message: "Vui lòng nhập họ và tên" }]}
              >
                <Input placeholder="Nhập họ và tên" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="phone_number"
                label="Số điện thoại"
                rules={[
                  { required: true, message: "Vui lòng nhập số điện thoại" },
                  {
                    pattern: /^[0-9]{10,11}$/,
                    message: "Số điện thoại không hợp lệ",
                  },
                ]}
              >
                <Input placeholder="Nhập số điện thoại" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="date_of_birth" label="Ngày sinh">
                <DatePicker
                  style={{ width: "100%" }}
                  placeholder="Chọn ngày sinh"
                  format="DD/MM/YYYY"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="gender" label="Giới tính">
                <Select placeholder="Chọn giới tính">
                  <Select.Option value="Nam">Nam</Select.Option>
                  <Select.Option value="Nữ">Nữ</Select.Option>
                  <Select.Option value="Khác">Khác</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="allergy_notes" label="Dị ứng đã biết">
            <Input.TextArea
              rows={2}
              placeholder="Ghi chú về tình trạng dị ứng (nếu có)..."
            />
          </Form.Item>

          <Form.Item name="chronic_diseases" label="Bệnh mãn tính">
            <Input.TextArea
              rows={2}
              placeholder="Ghi chú về bệnh mãn tính (nếu có)..."
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

const PosPageWrapper: React.FC = () => (
  <App>
    <PosPage />
  </App>
);

export default PosPageWrapper;
