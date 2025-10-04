import React, { useState, useEffect, useMemo } from "react";
import {
  Typography,
  Row,
  Col,
  Modal,
  Form,
  DatePicker,
  Grid,
  Badge,
  Tabs,
  Button,
  Input,
  App,
  Select,
} from "antd";
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
  getWarehouseById,
  searchProductInWarehouse,
  searchProductInWarehouseByBarcode,
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
import PaymentModal from "../../components/PaymentModal";
import PosTabContent from "../../components/PosTabContent";

const getErrorMessage = (error: any): string => {
  return error?.message || "Đã xảy ra lỗi không xác định";
};
// Context will be passed via props from the app
// import { useEmployee } from "../../context/EmployeeContext";

const { Title, Text } = Typography;
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
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("cash");
  const [paymentTabIndex, setPaymentTabIndex] = useState<number | undefined>(undefined);
  const [promotions, setPromotions] = useState<IPromotion[]>([]);

  // Customer management
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [customerSearchResults, setCustomerSearchResults] = useState<
    IPatient[]
  >([]);
  const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  // Employee's assigned warehouse
  const [employeeWarehouse, setEmployeeWarehouse] = useState<IWarehouse | null>(
    null
  );
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
  const [isScanning, setIsScanning] = useState(false);

  // Cart modal for mobile
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);

  const selectedLocation = "dh1"; // Default location
  const { warehouseId, fundId } = employeeWarehouse
    ? {
        warehouseId: employeeWarehouse.id,
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
          description:
            "Nhân viên chưa được gán kho làm việc. Vui lòng liên hệ quản lý.",
        });
        return;
      }

      setLoadingWarehouse(true);
      try {
        // Fetch warehouse directly by ID
        const { data, error } = await getWarehouseById(employee.warehouse_id);

        if (error) {
          notification.error({
            message: "Lỗi tải thông tin kho",
            description: error.message,
          });
        } else if (data) {
          setEmployeeWarehouse(data);
          setStoreSelectedWarehouse(data);
        } else {
          notification.error({
            message: "Lỗi kho",
            description: "Không tìm thấy kho được gán cho nhân viên này.",
          });
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
  }, [employee?.warehouse_id, notification, setStoreSelectedWarehouse]);

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

      if (employeeWarehouse) {
        // Search within selected warehouse
        searchProductInWarehouse({
          search: debouncedSearchTerm,
          warehouseId: employeeWarehouse.id,
        })
          .then(({ data }) => {
            setSearchResults(
              data?.map(
                (v) =>
                  ({ ...v.products, stock_quantity: v.quantity } as IProduct)
              ) || []
            );
          })
          .catch((error) => {
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
  }, [debouncedSearchTerm, employeeWarehouse, notification]);

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
    // Check if product has sufficient inventory
    if (!product.stock_quantity || product.stock_quantity <= 0) {
      notification.error({
        message: "Không thể thêm sản phẩm",
        description: `${product.name} đã hết hàng trong kho. Vui lòng nhập thêm hàng hoặc chọn sản phẩm khác.`,
        duration: 4,
      });
      return;
    }

    // Check if product already exists in cart
    const existingItem = cart.find((item) => item.id === product.id);

    if (existingItem) {
      const newQuantity = existingItem.quantity + 1;

      // Check if new quantity exceeds stock
      if (newQuantity > product.stock_quantity) {
        notification.error({
          message: "Vượt quá tồn kho",
          description: `${product.name} chỉ còn ${product.stock_quantity} sản phẩm trong kho. Hiện tại giỏ hàng đã có ${existingItem.quantity}.`,
          duration: 4,
        });
        return;
      }

      // Update quantity
      updateCartItem(existingItem.key, {
        quantity: newQuantity,
        total: existingItem.price * newQuantity,
      });
    } else {
      // Add new item
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
    }

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
    // Search for product directly by barcode
    try {
      let foundProduct = null;
      let stockAvailable = false;

      if (employeeWarehouse) {
        const { data } = await searchProductInWarehouseByBarcode({
          search: scannedData,
          warehouseId: employeeWarehouse.id,
        });

        const products =
          data?.map((v) => ({ ...v.products, stock_quantity: v.quantity })) ||
          [];
        if (products.length > 0) {
          foundProduct = products[0];

          // Check inventory before adding
          if (
            !foundProduct.stock_quantity ||
            foundProduct.stock_quantity <= 0
          ) {
            notification.error({
              message: "❌ Sản phẩm hết hàng",
              description: `${foundProduct.name} đã hết hàng trong kho. Vui lòng nhập thêm hàng.`,
              duration: 3,
            });
            stockAvailable = false;
          } else {
            handleAddToCart(foundProduct);
            notification?.success({
              message: "✅ Đã thêm vào giỏ hàng",
              description: `${foundProduct.name} - Còn lại: ${foundProduct.stock_quantity}`,
              duration: 2,
            });
            stockAvailable = true;
          }
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

          // Check inventory before adding
          if (
            !foundProduct.stock_quantity ||
            foundProduct.stock_quantity <= 0
          ) {
            notification.error({
              message: "❌ Sản phẩm hết hàng",
              description: `${foundProduct.name} đã hết hàng trong kho. Vui lòng nhập thêm hàng.`,
              duration: 3,
            });
            stockAvailable = false;
          } else {
            handleAddToCart(foundProduct);
            notification?.success({
              message: "✅ Đã thêm vào giỏ hàng",
              description: `${foundProduct.name} - Còn lại: ${foundProduct.stock_quantity}`,
              duration: 2,
            });
            stockAvailable = true;
          }
        } else {
          notification.warning({
            message: "⚠️ Không tìm thấy sản phẩm",
            description: `Mã: ${scannedData}`,
            duration: 2,
          });
        }
      }
    } catch (error) {
      notification.error({
        message: "❌ Lỗi quét mã",
        description: "Không thể tìm kiếm sản phẩm",
        duration: 2,
      });
    }
  };

  const handleRemoveFromCart = (productId: number) => {
    const item = cart.find((i) => i.id === productId);
    if (item) {
      removeCartItem(item.key);
    }
  };

  const handleUpdateQuantity = (productId: number, newQuantity: number) => {
    const item = cart.find((i) => i.id === productId);
    if (!item) return;

    if (newQuantity <= 0) {
      removeCartItem(item.key);
    } else {
      updateCartItem(item.key, {
        quantity: newQuantity,
        total: item.price * newQuantity,
      });
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
  const handleOpenPaymentModal = (method: "cash" | "card") => {
    if (cart.length === 0) {
      // notification.warning({ message: "Giỏ hàng đang trống!" });
      return;
    }
    setPaymentMethod(method);
    setIsPaymentModalOpen(true);
  };

  const handleFinishPayment = async (values: PaymentValues, tabIndex?: number) => {
    try {
      // If tabIndex is provided, use it; otherwise use active tab
      const targetTabIndex = tabIndex !== undefined ? tabIndex : tabs.findIndex(t => t.id === activeTabId);

      await processPayment(
        {
          cart: cartDetails.items || [],
          total: cartDetails.itemTotal,
          paymentMethod: values.payment_method,
          warehouseId,
          fundId,
          createdBy: employee?.employee_id || null,
          customerId: selectedCustomer?.patient_id,
          tabIndex: targetTabIndex, // Pass tab index to processPayment
        },
        processSaleTransaction
      );

      notification?.success({
        message: "Thanh toán thành công!",
        description: `Đã ghi nhận hóa đơn ${cartDetails.itemTotal.toLocaleString()}đ.`,
      });

      // setIsPaymentModalOpen(false);
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
            <PosTabContent
              employeeWarehouse={employeeWarehouse}
              loadingWarehouse={loadingWarehouse}
              customerSearchTerm={customerSearchTerm}
              setCustomerSearchTerm={setCustomerSearchTerm}
              customerSearchResults={customerSearchResults}
              isSearchingCustomers={isSearchingCustomers}
              showCustomerDropdown={showCustomerDropdown}
              setShowCustomerDropdown={setShowCustomerDropdown}
              selectedCustomer={selectedCustomer}
              setStoreSelectedCustomer={setStoreSelectedCustomer}
              setIsCreateCustomerModalOpen={setIsCreateCustomerModalOpen}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              searchResults={searchResults}
              isSearching={isSearching}
              selectedWarehouse={employeeWarehouse}
              handleAddToCart={handleAddToCart}
              setIsQRScannerOpen={setIsQRScannerOpen}
              cart={cart}
              cartDetails={cartDetails}
              handleRemoveFromCart={handleRemoveFromCart}
              handleUpdateQuantity={handleUpdateQuantity}
              handleOpenPaymentModal={handleOpenPaymentModal}
              isProcessingPayment={isProcessingPayment}
              isMobile={isMobile}
              isCartModalOpen={isCartModalOpen}
              setIsCartModalOpen={setIsCartModalOpen}
            />
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
            scanDelay={3000}
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
