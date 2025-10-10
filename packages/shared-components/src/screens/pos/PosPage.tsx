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
  calculateProductGlobalQuantities,
} from "@nam-viet-erp/services";
import {
  usePosStore,
  usePosTabs,
  usePosActiveTabId,
  useCart,
  usePosSelectedCustomer,
  usePosSelectedWarehouse,
  usePosIsProcessingPayment,
  useComboStore,
  useCombos,
  useInventory,
} from "@nam-viet-erp/store";
import PaymentModal from "../../components/PaymentModal";
import PosTabContent from "../../components/PosTabContent";
import LotSelectionModal from "../../components/LotSelectionModal";

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

  // Combo Store
  const storedCombos = useCombos();
  const { fetchCombos } = useComboStore();

  // Inventory Store
  const inventory = useInventory();

  // Local UI state (not tab-specific)
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<IProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("cash");
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
    null,
  );
  const [loadingWarehouse, setLoadingWarehouse] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<any>(null);

  // Create customer modal
  const [isCreateCustomerModalOpen, setIsCreateCustomerModalOpen] =
    useState(false);
  const [createCustomerForm] = Form.useForm();
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);

  // QR Scanner
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);

  // Cart modal for mobile
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);

  // Lot selection modal
  const [isLotSelectionModalOpen, setIsLotSelectionModalOpen] = useState(false);
  const [selectedProductForLot, setSelectedProductForLot] =
    useState<IProduct | null>(null);

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

  // Fetch combos on component mount
  useEffect(() => {
    fetchCombos();
  }, [fetchCombos]);

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

  // Detect combos whenever cart changes
  const detectedCombos = useMemo(() => {
    if (cart.length === 0 || storedCombos.length === 0) {
      return [];
    }

    // Get only regular products (not combo items) from cart
    const regularItems = cart
      .filter((item) => !item.isCombo)
      .map((item) => ({ id: item.id, quantity: item.quantity }));

    if (regularItems.length === 0) {
      return [];
    }

    // Check each combo to see if cart has all required products
    const matchedCombos: IComboWithItems[] = [];

    for (const combo of storedCombos) {
      const comboItems = combo.combo_items || [];
      let isMatch = true;

      // Check if all combo items are in the cart with sufficient quantity
      for (const comboItem of comboItems) {
        const cartItem = regularItems.find(
          (ci) => ci.id === comboItem.product_id,
        );

        if (!cartItem || cartItem.quantity < comboItem.quantity) {
          isMatch = false;
          break;
        }
      }

      if (isMatch && comboItems.length > 0) {
        matchedCombos.push(combo);
      }
    }

    return matchedCombos;
  }, [cart, storedCombos]);

  // --- PROMOTION LOGIC START ---
  const calculateBestPrice = (
    product: IProduct,
    promotions: IPromotion[],
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

      // Search in inventory store instead of making API calls
      if (inventory.length > 0) {
        const searchLower = debouncedSearchTerm.toLowerCase();

        const filteredProducts = inventory
          .filter((item: any) => {
            const product = item.products;
            if (!product) return false;

            // Search by name, barcode, or product code
            const matchName = product.name?.toLowerCase().includes(searchLower);
            const matchBarcode = product.barcode
              ?.toLowerCase()
              .includes(searchLower);
            const matchCode = product.product_code
              ?.toLowerCase()
              .includes(searchLower);
            return (
              (matchName || matchBarcode || matchCode) && item.quantity > 0
            );
          })
          .map((item: any) => ({
            ...item.products,
            stock_quantity: item.quantity,
          }))
          .slice(0, 10); // Limit to 10 results

        setSearchResults(filteredProducts);
        setIsSearching(false);
      } else if (employeeWarehouse) {
        // Fallback to API if inventory is not loaded
        searchProductInWarehouse({
          search: debouncedSearchTerm,
          warehouseId: employeeWarehouse.id,
        })
          .then(({ data }) => {
            setSearchResults(
              data?.map(
                (v) =>
                  ({ ...v.products, stock_quantity: v.quantity }) as IProduct,
              ) || [],
            );
          })
          .catch(() => {
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
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearchTerm, employeeWarehouse, notification, inventory]);

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
            selectedVisit.visit_id,
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

    // Check if product has lot management enabled
    if (product.enable_lot_management && employeeWarehouse) {
      setSelectedProductForLot(product);
      setIsLotSelectionModalOpen(true);
      return;
    }

    // Check if product already exists in cart
    const existingItem = cart.find(
      (item) => item.id === product.id && !item.lot_id,
    );

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
        description: product.description,
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

  // Handle lot selection from modal
  const handleLotSelect = (lot: IProductLot, quantity: number) => {
    if (!selectedProductForLot) return;

    // Check if this specific lot already exists in cart
    const existingItem = cart.find(
      (item) => item.id === selectedProductForLot.id && item.lot_id === lot.id,
    );

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;

      // Check if new quantity exceeds lot stock
      if (lot.quantity && newQuantity > lot.quantity) {
        notification.error({
          message: "Vượt quá tồn kho lô",
          description: `Lô ${lot.lot_number} chỉ còn ${lot.quantity} sản phẩm. Hiện tại giỏ hàng đã có ${existingItem.quantity}.`,
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
      // Add new item with lot information
      const priceInfo = calculateBestPrice(selectedProductForLot, promotions);
      const cartItem = {
        key: `${selectedProductForLot.id}_${lot.id}_${Date.now()}`,
        id: selectedProductForLot.id,
        name: selectedProductForLot.name,
        description: selectedProductForLot.description,
        quantity: quantity,
        price: priceInfo.finalPrice,
        total: priceInfo.finalPrice * quantity,
        ...priceInfo,
        stock_quantity: lot.quantity,
        image_url: selectedProductForLot.image_url,
        product_id: String(selectedProductForLot.id),
        unit_price: priceInfo.originalPrice,
        lot_id: lot.id,
        lot_number: lot.lot_number,
        batch_code: lot.batch_code,
        expiry_date: lot.expiry_date,
      };

      addCartItem(cartItem, true);
    }

    notification.success({
      message: "Đã thêm vào giỏ hàng",
      description: `${selectedProductForLot.name} - Lô: ${lot.lot_number} (${quantity})`,
      duration: 2,
    });

    setSearchTerm("");
    setSearchResults([]);
  };

  // Add combo to cart
  const handleAddCombo = (combo: IComboWithItems) => {
    if (!combo.combo_items || combo.combo_items.length === 0) {
      notification.error({
        message: "Combo không hợp lệ",
        description: "Combo này không có sản phẩm",
      });
      return;
    }

    // Calculate how many combo sets we can make from cart
    let maxComboSets = Infinity;

    combo.combo_items.forEach((comboItem) => {
      const cartItem = cart.find(
        (item) => !item.isCombo && item.id === comboItem.product_id,
      );
      if (cartItem) {
        const possibleSets = Math.floor(cartItem.quantity / comboItem.quantity);
        maxComboSets = Math.min(maxComboSets, possibleSets);
      }
    });

    // If maxComboSets is still Infinity or 0, something is wrong
    if (maxComboSets === Infinity || maxComboSets === 0) {
      maxComboSets = 1;
    }

    // Remove products that are part of the combo from cart
    combo.combo_items.forEach((comboItem) => {
      const cartItem = cart.find(
        (item) => !item.isCombo && item.id === comboItem.product_id,
      );
      if (cartItem) {
        const quantityToRemove = comboItem.quantity * maxComboSets;
        const remainingQuantity = cartItem.quantity - quantityToRemove;

        if (remainingQuantity <= 0) {
          // Remove item completely
          removeCartItem(cartItem.key);
        } else {
          // Update quantity
          updateCartItem(cartItem.key, {
            quantity: remainingQuantity,
            total: cartItem.price * remainingQuantity,
          });
        }
      }
    });

    // Calculate total original price
    const originalPrice = combo.combo_items.reduce((sum, item) => {
      return sum + (item.products?.retail_price || 0) * item.quantity;
    }, 0);

    // Add combo as a single cart item
    const comboCartItem = {
      key: `combo_${combo.id}_${Date.now()}`,
      id: combo.id,
      name: combo.name,
      description: combo.description || undefined,
      quantity: maxComboSets,
      price: combo.combo_price,
      total: combo.combo_price * maxComboSets,
      finalPrice: combo.combo_price,
      originalPrice: originalPrice,
      image_url: combo.image_url,
      product_id: `combo_${combo.id}`,
      unit_price: originalPrice,
      isCombo: true,
      combo_id: combo.id,
      comboData: combo,
    };

    addCartItem(comboCartItem);

    notification.success({
      message: "Đã thêm combo!",
      description: `${combo.name} x${maxComboSets} - Tiết kiệm ${(
        (originalPrice - combo.combo_price) *
        maxComboSets
      ).toLocaleString()}đ`,
      duration: 3,
    });

    // Refetch combos to update the store
    fetchCombos();
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

      // First, try to search in inventory store
      if (inventory.length > 0) {
        const scannedLower = scannedData.toLowerCase();
        const inventoryItem = inventory.find((item: any) => {
          const product = item.products;
          if (!product) return false;

          const matchBarcode = product.barcode?.toLowerCase() === scannedLower;
          const matchCode =
            product.product_code?.toLowerCase() === scannedLower;

          return matchBarcode || matchCode;
        });

        if (inventoryItem) {
          foundProduct = {
            ...inventoryItem.products,
            stock_quantity: inventoryItem.quantity,
          };

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
          } else {
            handleAddToCart(foundProduct);
            notification?.success({
              message: "✅ Đã thêm vào giỏ hàng",
              description: `${foundProduct.name} - Còn lại: ${foundProduct.stock_quantity}`,
              duration: 2,
            });
          }
        } else {
          notification.warning({
            message: "⚠️ Không tìm thấy sản phẩm",
            description: `Mã: ${scannedData}`,
            duration: 2,
          });
        }
      } else if (employeeWarehouse) {
        // Fallback to API if inventory is not loaded
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
          } else {
            handleAddToCart(foundProduct);
            notification?.success({
              message: "✅ Đã thêm vào giỏ hàng",
              description: `${foundProduct.name} - Còn lại: ${foundProduct.stock_quantity}`,
              duration: 2,
            });
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
          } else {
            handleAddToCart(foundProduct);
            notification?.success({
              message: "✅ Đã thêm vào giỏ hàng",
              description: `${foundProduct.name} - Còn lại: ${foundProduct.stock_quantity}`,
              duration: 2,
            });
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

  const handleRemoveFromCart = (itemKey: string) => {
    removeCartItem(itemKey);
  };

  const handleUpdateQuantity = (itemKey: string, newQuantity: number) => {
    const item = cart.find((i) => i.key === itemKey);
    if (!item) return;

    if (newQuantity <= 0) {
      removeCartItem(itemKey);
    } else {
      updateCartItem(itemKey, {
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
      0,
    );
    const originalTotal = items.reduce(
      (total, item) => total + item.originalPrice * item.quantity,
      0,
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

  const handleFinishPayment = async (
    values: PaymentValues,
    tabIndex?: number,
  ) => {
    try {
      // If tabIndex is provided, use it; otherwise use active tab
      const targetTabIndex =
        tabIndex !== undefined
          ? tabIndex
          : tabs.findIndex((t) => t.id === activeTabId);

      // Validate global inventory (including products in combos)
      const productGlobalQuantities = calculateProductGlobalQuantities(
        cartDetails.items || [],
      );

      // Check if global quantities exceed inventory
      const insufficientProducts: {
        productName: string;
        required: number;
        available: number;
      }[] = [];

      Object.entries(productGlobalQuantities).forEach(
        ([productId, { name, quantity }]) => {
          const inventoryItem = inventory.find(
            (inv: any) => inv.product_id === Number(productId),
          );
          const availableQuantity = inventoryItem?.quantity || 0;

          if (quantity > availableQuantity) {
            insufficientProducts.push({
              productName: name,
              required: quantity,
              available: availableQuantity,
            });
          }
        },
      );

      if (insufficientProducts.length > 0) {
        const errorMessage = insufficientProducts
          .map(
            (p) => `- ${p.productName}: Cần ${p.required}, Còn ${p.available}`,
          )
          .join("\n");

        notification.error({
          message: "Không đủ hàng trong kho",
          description: (
            <div style={{ whiteSpace: "pre-line" }}>
              {`Các sản phẩm không đủ số lượng (bao gồm trong combo):\n${errorMessage}`}
            </div>
          ),
          duration: 6,
        });
        return;
      }

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
        inventory,
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
    <div
      style={{
        padding: 0,
        minHeight: "100vh",
        height: "100vh",
        backgroundColor: "#f5f5f5",
        overflow: "hidden",
      }}
    >
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
              detectedCombos={detectedCombos}
              handleAddCombo={handleAddCombo}
              isMobile={isMobile}
              isCartModalOpen={isCartModalOpen}
              setIsCartModalOpen={setIsCartModalOpen}
            />
          ),
        }))}
        style={{
          marginBottom: 0,
          backgroundColor: "transparent",
        }}
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

      {/* Lot Selection Modal */}
      <LotSelectionModal
        open={isLotSelectionModalOpen}
        onClose={() => {
          setIsLotSelectionModalOpen(false);
          setSelectedProductForLot(null);
        }}
        onSelect={handleLotSelect}
        product={selectedProductForLot}
        warehouseId={employeeWarehouse?.id || null}
      />
    </div>
  );
};

const PosPageWrapper: React.FC<PosPageProps> = (props) => (
  <App>
    <PosPage {...props} />
  </App>
);

export default PosPageWrapper;
