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
  Tabs,
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
import { useDebounce, QRScanner } from "@nam-viet-erp/shared-components";
import {
  processSaleTransaction,
  searchProducts,
  getActivePromotions,
  getPatients,
  createPatient,
  getPrescriptionsByVisitId,
  getMedicalVisits,
  getWarehouse,
  searchProductInWarehouse,
} from "@nam-viet-erp/services";
import {
  usePosStore,
  usePosTabs,
  usePosActiveTabId,
  useCart,
  usePosSelectedCustomer,
  usePosSelectedWarehouse,
  usePosIsProcessingPayment,
} from "@nam-viet-erp/store";
import PaymentModal, {
  type PaymentValues,
  type CartItem as BaseCartItem,
} from "../../components/PaymentModal";

// Extended CartItem type for POS with additional properties
type CartItem = BaseCartItem & {
  discount?: number;
  appliedPromotion?: any;
  stock_quantity?: number;
  image_url?: string | null;
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

  // POS Store - Multi-tab support
  const tabs = usePosTabs();
  const activeTabId = usePosActiveTabId();
  const cart = useCart();
  const selectedCustomer = usePosSelectedCustomer();
  const selectedWarehouse = usePosSelectedWarehouse();
  const isProcessingPayment = usePosIsProcessingPayment();

  const {
    createTab,
    closeTab,
    switchTab,
    addCartItem,
    removeCartItem,
    updateCartItem,
    setSelectedCustomer: setStoreSelectedCustomer,
    setSelectedWarehouse: setStoreSelectedWarehouse,
    processPayment,
  } = usePosStore();

  // Local UI state (not tab-specific)
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<IProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "qr">(
    "cash"
  );
  const [promotions, setPromotions] = useState<IPromotion[]>([]);

  // Customer management
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [customerSearchResults, setCustomerSearchResults] = useState<
    IPatient[]
  >([]);
  const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  // Employee's assigned warehouse
  const [employeeWarehouse, setEmployeeWarehouse] = useState<IWarehouse | null>(null);
  const [loadingWarehouse, setLoadingWarehouse] = useState(false);

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

  // QR Scanner
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [lastScanTime, setLastScanTime] = useState(0);
  const [recentScans, setRecentScans] = useState<Set<string>>(new Set());
  const [isScanning, setIsScanning] = useState(false);

  // Cart modal for mobile
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);

  const selectedLocation = "dh1"; // Default location
  const { warehouseId, fundId } = selectedWarehouse
    ? {
        warehouseId: selectedWarehouse.id,
        fundId: WAREHOUSE_MAP[selectedLocation]?.fundId || 1,
      }
    : WAREHOUSE_MAP[selectedLocation];
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const debouncedCustomerSearchTerm = useDebounce(customerSearchTerm, 300);

  // Fetch employee's assigned warehouse on component mount
  useEffect(() => {
    const fetchEmployeeWarehouse = async () => {
      // If employee doesn't have a warehouse assigned, return early
      if (!employee?.warehouse_id) {
        notification.warning({
          message: "Chưa gán kho",
          description: "Nhân viên chưa được gán kho làm việc. Vui lòng liên hệ quản lý.",
        });
        return;
      }

      setLoadingWarehouse(true);
      try {
        const { data, error } = await getWarehouse();
        if (error) {
          notification.error({
            message: "Lỗi tải thông tin kho",
            description: error.message,
          });
        } else if (data) {
          // Find employee's assigned warehouse
          const assignedWarehouse = data.find(w => w.id === employee.warehouse_id);
          if (assignedWarehouse) {
            setEmployeeWarehouse(assignedWarehouse);
            setStoreSelectedWarehouse(assignedWarehouse);
          } else {
            notification.error({
              message: "Lỗi kho",
              description: "Không tìm thấy kho được gán cho nhân viên này.",
            });
          }
        }
      } catch (error) {
        notification.error({
          message: "Lỗi tải thông tin kho",
          description: "Không thể tải thông tin kho",
        });
      } finally {
        setLoadingWarehouse(false);
      }
    };

    fetchEmployeeWarehouse();
  }, [employee?.warehouse_id, notification]);

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

      if (selectedWarehouse) {
        // Search within selected warehouse
        searchProductInWarehouse({
          search: debouncedSearchTerm,
          warehouseId: selectedWarehouse.id,
        })
          .then(({ data }) => {
            setSearchResults(data?.map((v) => ({ ...v.products })) || []);
          })
          .catch((error) => {
            console.error("Warehouse search error:", error);
            notification.error({
              message: "Lỗi tìm kiếm",
              description: "Không thể tìm kiếm sản phẩm trong kho",
            });
            setSearchResults([]);
          })
          .finally(() => setIsSearching(false));
      } else {
        // Fallback to general search when no warehouse is selected
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
      }
      // searchProducts({
      //   search: debouncedSearchTerm,
      //   pageSize: 10,
      //   status: "active",
      // })
      //   .then(({ data, error }) => {
      //     if (error) {
      //       notification.error({
      //         message: "Lỗi tìm kiếm",
      //         description: error.message,
      //       });
      //       setSearchResults([]);
      //     } else {
      //       // Filter products to only show those with available inventory
      //       const productsWithInventory = (data || []).filter(
      //         (product: any) => {
      //           // If no warehouse is selected, show all products
      //           if (!selectedWarehouse) return true;

      //           // Check if product has stock quantity available
      //           const stockQuantity = product.stock_quantity || 0;
      //           return stockQuantity > 0;
      //         }
      //       );
      //       setSearchResults(productsWithInventory);
      //     }
      //   })
      //   .finally(() => setIsSearching(false));
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearchTerm, selectedWarehouse, notification]);

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
    const priceInfo = calculateBestPrice(product, promotions);
    const cartItem = {
      key: `${product.id}_${Date.now()}`,
      id: product.id,
      name: product.name,
      quantity: 1,
      price: priceInfo.finalPrice,
      total: priceInfo.finalPrice,
      ...priceInfo,
      stock_quantity: product.stock_quantity,
      image_url: product.image_url,
      product_id: String(product.id),
      unit_price: priceInfo.originalPrice,
    };

    addCartItem(cartItem);
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
        notification?.success({
          message: "Tạo khách hàng thành công!",
          description: `Đã tạo khách hàng ${values.full_name}`,
        });
        setStoreSelectedCustomer(data);
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

  // QR Scanner Handler with delay mechanism
  const handleQRScan = async (scannedData: string) => {
    const currentTime = Date.now();
    const scanDelay = 2000; // 2 seconds delay between scans

    // Check if we're already processing a scan
    if (isScanning) {
      return;
    }

    // Check if this is a duplicate scan within the delay period
    if (
      currentTime - lastScanTime < scanDelay ||
      recentScans.has(scannedData)
    ) {
      return;
    }

    // Set scanning state to prevent concurrent scans
    setIsScanning(true);
    setLastScanTime(currentTime);

    // Add to recent scans
    const newRecentScans = new Set(recentScans);
    newRecentScans.add(scannedData);
    setRecentScans(newRecentScans);

    // Remove from recent scans after delay
    setTimeout(() => {
      setRecentScans((prev) => {
        const updated = new Set(prev);
        updated.delete(scannedData);
        return updated;
      });
    }, scanDelay);

    // Search for product directly by barcode
    try {
      let foundProduct = null;

      if (selectedWarehouse) {
        const { data } = await searchProductInWarehouse({
          search: scannedData,
          warehouseId: selectedWarehouse.id,
        });

        const products = data?.map((v) => ({ ...v.products })) || [];
        if (products.length > 0) {
          foundProduct = products[0];
          handleAddToCart(products[0]);
          notification?.success({
            message: "✅ Đã thêm vào giỏ hàng",
            description: `${products[0].name} - ${scannedData}`,
            duration: 2,
          });
        } else {
          notification.warning({
            message: "⚠️ Không tìm thấy sản phẩm",
            description: `Mã: ${scannedData}`,
            duration: 2,
          });
        }
      } else {
        const { data } = await searchProducts({
          search: scannedData,
          pageSize: 1,
          status: "active",
        });

        if (data && data.length > 0) {
          foundProduct = data[0];
          handleAddToCart(data[0]);
          notification?.success({
            message: "✅ Đã thêm vào giỏ hàng",
            description: `${data[0].name} - ${scannedData}`,
            duration: 2,
          });
        } else {
          notification.warning({
            message: "⚠️ Không tìm thấy sản phẩm",
            description: `Mã: ${scannedData}`,
            duration: 2,
          });
        }
      }

      // Show scan feedback
      if (foundProduct) {
        notification.info({
          message: "📱 Quét thành công!",
          description: "Chờ 2 giây để quét sản phẩm tiếp theo",
          duration: 1.5,
        });
      }
    } catch (error) {
      notification.error({
        message: "❌ Lỗi quét mã",
        description: "Không thể tìm kiếm sản phẩm",
        duration: 2,
      });
    } finally {
      // Reset scanning state after a short delay
      setTimeout(() => {
        setIsScanning(false);
      }, 500);
    }
  };

  const handleRemoveFromCart = (productId: number) => {
    const item = cart.find(i => i.id === productId);
    if (item) {
      removeCartItem(item.key);
    }
  };

  const handleUpdateQuantity = (productId: number, newQuantity: number) => {
    const item = cart.find(i => i.id === productId);
    if (!item) return;

    if (newQuantity <= 0) {
      removeCartItem(item.key);
    } else {
      updateCartItem(item.key, { quantity: newQuantity, total: item.price * newQuantity });
    }
  };

  const cartDetails = useMemo((): CartDetails => {
    const items = (cart || []).map((item) => {
      // Create a mock product object with the required IProduct properties
      const mockProduct: IProduct = {
        ...item,
        id: item.id,
        name: item.name,
        retail_price: item.price,
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
      // notification.warning({ message: "Giỏ hàng đang trống!" });
      return;
    }
    setPaymentMethod(method);
    setIsPaymentModalOpen(true);
  };

  const handleFinishPayment = async (values: PaymentValues) => {
    try {
      await processPayment({
        cart: cartDetails.items || [],
        total: cartDetails.itemTotal,
        paymentMethod: values.payment_method,
        warehouseId,
        fundId,
        createdBy: employee?.employee_id || null,
        customerId: selectedCustomer?.patient_id,
      }, processSaleTransaction);

      notification?.success({
        message: "Thanh toán thành công!",
        description: `Đã ghi nhận hóa đơn ${cartDetails.itemTotal.toLocaleString()}đ.`,
      });

      setIsPaymentModalOpen(false);
    } catch (error: unknown) {
      notification.error({
        message: "Thanh toán thất bại",
        description: getErrorMessage(error),
      });
    }
  };

  return (
    <div style={{ padding: "24px", minHeight: "100vh" }}>
      <Row
        justify="space-between"
        align="middle"
        style={{ marginBottom: isMobile ? 16 : 24 }}
      >
        <Col>
          <Title level={isMobile ? 3 : 2} style={{ margin: 0 }}>
            💰 POS Bán Lẻ
          </Title>
          <Text
            type="secondary"
            style={{ fontSize: isMobile ? "14px" : "16px" }}
          >
            Quản lý bán hàng và thanh toán tại quầy
          </Text>
        </Col>
      </Row>

      {/* Multi-tab navigation */}
      <Tabs
        type="editable-card"
        activeKey={activeTabId}
        onChange={switchTab}
        onEdit={(targetKey, action) => {
          if (action === "add") {
            createTab();
          } else if (action === "remove") {
            closeTab(targetKey as string);
          }
        }}
        items={tabs.map((tab) => ({
          key: tab.id,
          label: (
            <span
              onDoubleClick={(e) => {
                e.stopPropagation();
                const newTitle = prompt("Nhập tên đơn hàng:", tab.title);
                if (newTitle && newTitle.trim()) {
                  const { updateTabTitle } = usePosStore.getState();
                  updateTabTitle(tab.id, newTitle.trim());
                }
              }}
            >
              {tab.title}
              {tab.cart.length > 0 && (
                <Badge
                  count={tab.cart.length}
                  offset={[10, -2]}
                  style={{ backgroundColor: "#52c41a" }}
                />
              )}
            </span>
          ),
          closable: tabs.length > 1,
          children: (
            <div>
              {/* Employee Warehouse Display */}
              <Row style={{ marginBottom: 16 }} gutter={[8, 8]}>
                <Col xs={24}>
                  <Space wrap size={isMobile ? "small" : "middle"} style={{ width: "100%" }}>
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
                                style={{ color: "#52c41a", fontWeight: 500 }}
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
            </div>
          ),
        }))}
        style={{ marginBottom: 16 }}
      />

      {/* Modals */}
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
          notification?.success({ message: "Đang in hóa đơn..." });
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

      {/* QR Scanner Modal - continuous scanning mode */}
      <Modal
        title="Quét mã vạch sản phẩm"
        open={isQRScannerOpen}
        onCancel={() => setIsQRScannerOpen(false)}
        footer={[
          <Button key="close" onClick={() => setIsQRScannerOpen(false)}>
            Đóng
          </Button>,
        ]}
        width={500}
        centered
      >
        <div style={{ textAlign: "center" }}>
          <Text type="secondary" style={{ marginBottom: 16, display: "block" }}>
            Quét mã vạch trên sản phẩm để thêm vào giỏ hàng
          </Text>
          <QRScanner
            visible={isQRScannerOpen}
            onClose={() => setIsQRScannerOpen(false)}
            onScan={handleQRScan}
            allowMultipleScan={true}
            scanDelay={2000}
          />
        </div>
      </Modal>
    </div>
  );
};

const PosPageWrapper: React.FC<PosPageProps> = (props) => (
  <App>
    <PosPage {...props} />
  </App>
);

export default PosPageWrapper;
