import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  Input,
  Select,
  DatePicker,
  Tag,
  Form,
  Row,
  Col,
  Drawer,
  Grid,
  Checkbox,
  notification,
} from "antd";
import {
  FilterOutlined,
  EyeOutlined,
  EditOutlined,
  ReloadOutlined,
  PlusOutlined,
  SearchOutlined,
  FilePdfOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import {
  getB2BQuotes,
  createB2BQuote,
  updateB2BQuote,
  updateQuoteStage,
  getB2BCustomers,
  createB2BCustomer,
  getQuoteItems,
  getB2BWarehouseProductByBarCode,
  notificationService,
} from "@nam-viet-erp/services";
import {
  OrderDetailModal,
  CreateQuoteModal,
  EditQuoteModal,
  CreateCustomerModal,
  BulkUpdateModal,
  QRScannerVerificationModal,
} from "@nam-viet-erp/shared-components";
import {
  B2B_ORDER_STAGES,
  DELIVERY_STATUSES,
  INVENTORY_STATUSES,
  SALE_STATUSES,
} from "../../constants/b2b";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { useBreakpoint } = Grid;

// Use the global IB2BQuote interface and extend with additional fields if needed
interface B2BQuoteWithStatus extends IB2BQuote {
  // Using quote_stage for all order statuses - no separate operation_status needed
}

interface User {
  id: string;
  name: string;
  permissions: string[];
}

interface B2BOrderListPageProps {
  employee?: IEmployee | null;
  user?: User | null;
}

const B2BOrderListPage: React.FC<B2BOrderListPageProps> = ({
  employee,
  user,
}) => {
  const [quotes, setQuotes] = useState<B2BQuoteWithStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [filters, setFilters] = useState<any>({});
  const [current, setCurrent] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [orderDetailModalOpen, setOrderDetailModalOpen] = useState(false);
  const [createQuoteModalOpen, setCreateQuoteModalOpen] = useState(false);
  const [editQuoteModalOpen, setEditQuoteModalOpen] = useState(false);
  const [createCustomerModalOpen, setCreateCustomerModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<B2BQuoteWithStatus | null>(
    null
  );
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [qrScannerOpen, setQrScannerOpen] = useState(false);
  const [verifiedItems, setVerifiedItems] = useState<Set<string>>(new Set());
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [bulkUpdateModalOpen, setBulkUpdateModalOpen] = useState(false);
  const [bulkUpdateLoading, setBulkUpdateLoading] = useState(false);
  const screens = useBreakpoint();
  const isMobile = !screens.lg;

  const [form] = Form.useForm();
  const [createQuoteForm] = Form.useForm();
  const [editQuoteForm] = Form.useForm();
  const [createCustomerForm] = Form.useForm();
  const [bulkUpdateForm] = Form.useForm();

  // Permission checks
  const userPermissions = user?.permissions || [];
  const canCreateQuotes =
    userPermissions.includes("quotes.create") ||
    userPermissions.includes("b2b.create");
  const canEditQuotes =
    userPermissions.includes("quotes.edit") ||
    userPermissions.includes("b2b.edit");
  const canViewQuotes =
    userPermissions.includes("quotes.view") ||
    userPermissions.includes("b2b.view");

  // Role-based status change permissions
  const isSalesStaff =
    userPermissions.includes("sales.create") ||
    userPermissions.includes("sales.manage");
  const isInventoryStaff =
    userPermissions.includes("inventory.access") ||
    userPermissions.includes("inventory.manage");
  const isDeliveryStaff =
    userPermissions.includes("delivery.access") ||
    userPermissions.includes("shipping.manage");

  // Get allowed statuses based on user role and current order status
  const getAllowedStatuses = (currentStatus?: string) => {
    const salesStatuses = [
      "draft",
      "sent",
      "negotiating",
      "accepted",
      "cancelled",
      "rejected",
      "expired",
    ];
    const inventoryStatuses = ["accepted", "pending_packaging", "packaged"];
    const deliveryStatuses = ["packaged", "shipping", "completed"];

    // If user has admin permissions, allow all statuses
    if (
      userPermissions.includes("admin") ||
      userPermissions.includes("super-admin")
    ) {
      return B2B_ORDER_STAGES;
    }

    let allowedStatuses: string[] = [];

    if (isSalesStaff) {
      allowedStatuses = [...allowedStatuses, ...salesStatuses];
    }
    if (isInventoryStaff) {
      allowedStatuses = [...allowedStatuses, ...inventoryStatuses];
    }
    if (isDeliveryStaff) {
      allowedStatuses = [...allowedStatuses, ...deliveryStatuses];
    }

    // If editing an existing order, check if current status is in user's range
    if (currentStatus) {
      const isCurrentStatusInUserRange =
        allowedStatuses.includes(currentStatus);

      // If current status is NOT in user's range, they cannot change it
      if (!isCurrentStatusInUserRange) {
        // Return only the current status (read-only)
        return B2B_ORDER_STAGES.filter((stage) => stage.key === currentStatus);
      }
    }

    // Filter stages based on allowed statuses
    return B2B_ORDER_STAGES.filter((stage) =>
      allowedStatuses.includes(stage.key)
    );
  };

  // Check if user can edit the current order status
  const canEditOrderStatus = (currentStatus: string) => {
    const salesStatuses = SALE_STATUSES;
    const inventoryStatuses = INVENTORY_STATUSES;
    const deliveryStatuses = DELIVERY_STATUSES;

    // Admin can edit any status
    if (
      userPermissions.includes("admin") ||
      userPermissions.includes("super-admin")
    ) {
      return true;
    }

    // Check if current status is in user's authorized range
    if (isSalesStaff && salesStatuses.includes(currentStatus)) return true;
    if (isInventoryStaff && inventoryStatuses.includes(currentStatus))
      return true;
    if (isDeliveryStaff && deliveryStatuses.includes(currentStatus))
      return true;

    return false;
  };

  // Load B2B orders
  const loadOrders = async () => {
    setLoading(true);
    try {
      // For inventory staff, automatically filter to show only accepted orders and inventory-related stages
      let stageFilter = filters.quoteStage;
      if (
        isInventoryStaff &&
        !userPermissions.includes("admin") &&
        !userPermissions.includes("super-admin")
      ) {
        // Inventory staff can only see orders that are accepted or in inventory processing stages
        const inventoryRelevantStages = [
          "accepted",
          "pending_packaging",
          "packaged",
        ];
        stageFilter =
          stageFilter && inventoryRelevantStages.includes(stageFilter)
            ? stageFilter
            : undefined; // If no filter or invalid filter, don't restrict further, service will handle
      }

      const response = await getB2BQuotes({
        // Search keyword (general search)
        customerName: searchKeyword || filters.customerName || undefined,
        // Creator filter (if supported by the service)
        // creatorName: filters.creatorName || undefined,
        // Employee filter (for personal quotes)
        employeeId: filters.employeeId || undefined,
        // Operation status filter
        stage: stageFilter || undefined,
        // Payment status filter (if supported by the service)
        // paymentStatus: filters.paymentStatus || undefined,
        // Date range filter
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        // Pagination
        limit: pageSize,
        offset: (current - 1) * pageSize,
      });

      if (response.error) throw response.error;

      let quotesData = (response.data || []) as B2BQuoteWithStatus[];

      // Client-side filtering for inventory staff - only show accepted and inventory-relevant orders
      if (
        isInventoryStaff &&
        !userPermissions.includes("admin") &&
        !userPermissions.includes("super-admin")
      ) {
        const inventoryRelevantStages = [
          "accepted",
          "pending_packaging",
          "packaged",
        ];
        quotesData = quotesData.filter((quote) =>
          inventoryRelevantStages.includes(quote.quote_stage)
        );
      }

      setQuotes(quotesData);
      setTotal(quotesData.length); // For now, since we don't have total count from service

      // Clear selected orders if they no longer exist in the current data
      const currentOrderIds = quotesData.map((quote) => quote.quote_id);
      setSelectedOrderIds((prev) =>
        prev.filter((id) => currentOrderIds.includes(id))
      );
    } catch (error: any) {
      notification.error({
        message: "Lỗi tải dữ liệu",
        description: error.message || "Không thể tải danh sách đơn hàng B2B",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [current, searchKeyword, filters]);

  // Realtime subscription for B2B quotes with permission check
  useEffect(() => {
    // Check if user has b2b.notification permission
    const hasNotificationPermission =
      userPermissions.includes("b2b.notification");

    if (!hasNotificationPermission) {
      console.log(
        "[B2B Dashboard] User does not have b2b.notification permission. Skipping realtime subscription."
      );
      return;
    }

    console.log(
      "[B2B Dashboard] Setting up realtime subscription for b2b_quotes..."
    );

    // Subscribe to b2b_quotes changes
    const unsubscribe = notificationService.subscribeToB2BQuotes(
      (payload) => {
        console.log("[B2B Dashboard] Received quote update:", payload);

        // Handle different event types
        if (payload.eventType === "INSERT") {
          notification.info({
            message: "Đơn hàng mới",
            description: `Đơn hàng ${
              payload.new?.quote_number || "mới"
            } đã được tạo`,
            placement: "topRight",
            duration: 4,
          });
        } else if (payload.eventType === "UPDATE") {
          notification.info({
            message: "Cập nhật đơn hàng",
            description: `Đơn hàng ${
              payload.new?.quote_number || ""
            } đã được cập nhật`,
            placement: "topRight",
            duration: 3,
          });
        } else if (payload.eventType === "DELETE") {
          notification.warning({
            message: "Đơn hàng đã xóa",
            description: `Đơn hàng ${
              payload.old?.quote_number || ""
            } đã bị xóa`,
            placement: "topRight",
            duration: 3,
          });
        }

        // Refresh the list to show updated data
        loadOrders();
      },
      employee?.employee_id // Optional: filter by employee ID
    );

    // Cleanup subscription on unmount
    return () => {
      console.log("[B2B Dashboard] Cleaning up realtime subscription...");
      unsubscribe();
    };
  }, [employee?.employee_id, userPermissions]); // Re-subscribe if employee or permissions change

  // Handle search
  const handleSearch = () => {
    setCurrent(1);
    loadOrders();
  };

  // Handle filter apply
  const handleFilterApply = (values: any) => {
    const newFilters: any = {};

    // Date filter
    if (values.dateRange) {
      newFilters.startDate = values.dateRange[0].format("YYYY-MM-DD");
      newFilters.endDate = values.dateRange[1].format("YYYY-MM-DD");
    }

    // Operation status filter (quote stage)
    if (values.quoteStage) newFilters.quoteStage = values.quoteStage;

    // Payment status filter
    if (values.paymentStatus) newFilters.paymentStatus = values.paymentStatus;

    // Customer name filter
    if (values.customerName)
      newFilters.customerName = values.customerName.trim();

    // Creator name filter
    if (values.creatorName) newFilters.creatorName = values.creatorName.trim();

    // Personal filter - only my quotes
    if (values.onlyMyQuotes && employee?.employee_id) {
      newFilters.employeeId = employee.employee_id;
    }

    setFilters(newFilters);
    setCurrent(1);
    setFilterDrawerOpen(false);
  };

  // Handle clear filters
  const handleClearFilters = () => {
    setFilters({});
    setSearchKeyword("");
    form.resetFields();
    setCurrent(1);
    setFilterDrawerOpen(false);
  };

  // Export to PDF function
  const handleExportToPDF = () => {
    // Create a new window with print-friendly content
    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      notification.error({
        message: "Lỗi xuất PDF",
        description:
          "Không thể mở cửa sổ in. Vui lòng kiểm tra cài đặt trình duyệt.",
      });
      return;
    }

    // Prepare data for PDF
    const currentDate = dayjs().format("DD/MM/YYYY HH:mm");

    // Create simplified HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Danh sách Đơn hàng B2B - ${currentDate}</title>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; margin: 15px; color: #333; font-size: 12px; }
          .header { text-align: center; margin-bottom: 20px; border-bottom: 1px solid #ccc; padding-bottom: 15px; }
          .header h1 { margin: 0; font-size: 18px; }
          .order { margin-bottom: 20px; border: 1px solid #ddd; padding: 15px; }
          .order-header { border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 10px; }
          .order-title { font-weight: bold; font-size: 14px; margin-bottom: 5px; }
          .client-info { margin-bottom: 10px; }
          .products-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          .products-table th, .products-table td { border: 1px solid #ddd; padding: 5px; text-align: left; font-size: 11px; }
          .products-table th { background-color: #f8f9fa; font-weight: bold; }
          @media print {
            body { margin: 0; font-size: 11px; }
            .order { page-break-inside: avoid; margin-bottom: 15px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>DANH SÁCH ĐON HÀNG B2B</h1>
          <p>Ngày xuất: ${currentDate} | Tổng: ${quotes.length} đơn hàng</p>
        </div>

        ${quotes
          .map((quote, index) => {
            // Get product items
            const products = quote.quote_items || [];

            return `
            <div class="order">
              <div class="order-header">
                <div class="order-title">Đơn hàng #${index + 1}: ${
              quote.quote_number || "Chưa có mã"
            }</div>
                <div class="client-info">
                  <strong>Khách hàng:</strong> ${
                    quote.customer_name || "N/A"
                  }<br>
                  <strong>Ngày tạo:</strong> ${
                    quote.created_at
                      ? dayjs(quote.created_at).format("DD/MM/YYYY")
                      : "N/A"
                  }
                </div>
              </div>

              ${
                products.length > 0
                  ? `
                <table class="products-table">
                  <thead>
                    <tr>
                      <th>STT</th>
                      <th>Tên sản phẩm</th>
                      <th>Mã SKU</th>
                      <th>Số lượng</th>
                      <th>Đơn giá</th>
                      <th>Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${products
                      .map(
                        (item: any, itemIndex: number) => `
                      <tr>
                        <td>${itemIndex + 1}</td>
                        <td>${item.product_name || "N/A"}</td>
                        <td>${item.product_sku || "N/A"}</td>
                        <td>${item.quantity || 0}</td>
                        <td>${(item.unit_price || 0).toLocaleString(
                          "vi-VN"
                        )} VND</td>
                        <td>${(
                          (item.quantity || 0) * (item.unit_price || 0)
                        ).toLocaleString("vi-VN")} VND</td>
                      </tr>
                    `
                      )
                      .join("")}
                  </tbody>
                </table>
              `
                  : "<p><em>Chưa có sản phẩm trong đơn hàng này</em></p>"
              }
            </div>
          `;
          })
          .join("")}

        <div style="text-align: center; margin-top: 20px; font-size: 10px; color: #666;">
          Nam Việt ERP - ${currentDate}
        </div>
      </body>
      </html>
    `;

    // Write content and trigger print
    printWindow.document.documentElement.innerHTML = htmlContent;

    // Wait for content to load, then print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        // Close window after printing (optional)
        setTimeout(() => printWindow.close(), 1000);
      }, 250);
    };

    notification?.success({
      message: "Đang xuất PDF",
      description: 'Cửa sổ in đã được mở. Chọn "Save as PDF" để lưu file.',
    });
  };

  // Handle view order details
  const handleViewOrder = async (quote: B2BQuoteWithStatus) => {
    setSelectedOrder(quote);
    setOrderDetailModalOpen(true);
    setLoadingItems(true);
    setVerifiedItems(new Set()); // Reset verified items

    try {
      const { data: items, error } = await getQuoteItems(quote.quote_id);
      if (error) {
        console.error("Error loading order items:", error);
        notification.error({
          message: "Lỗi tải sản phẩm",
          description: "Không thể tải danh sách sản phẩm trong đơn hàng",
        });
      } else {
        setOrderItems(items || []);
      }
    } catch (error) {
      console.error("Error loading order items:", error);
      notification.error({
        message: "Lỗi tải sản phẩm",
        description: "Có lỗi xảy ra khi tải danh sách sản phẩm",
      });
    } finally {
      setLoadingItems(false);
    }
  };

  // Handle QR scan for product verification
  const handleQRScan = async (scannedData: string) => {
    try {
      const { data: productData, error } =
        await getB2BWarehouseProductByBarCode({
          barcode: scannedData,
        });

      if (error || !productData || productData.length === 0) {
        notification.warning({
          message: "Sản phẩm không tìm thấy",
          description: `Không tìm thấy sản phẩm với mã QR: ${scannedData}`,
        });
        return;
      }

      const scannedProduct = (productData as any[])[0]?.products;

      if (!scannedProduct) {
        notification.warning({
          message: "Sản phẩm không hợp lệ",
          description: "Dữ liệu sản phẩm không hợp lệ",
        });
        return;
      }

      // Check if this product exists in the current order
      const orderItem = orderItems.find(
        (item) => item.product_id === scannedProduct.id
      );

      if (!orderItem) {
        notification.warning({
          message: "Sản phẩm không có trong đơn hàng",
          description: `Sản phẩm "${scannedProduct.name}" không có trong đơn hàng này`,
        });
        return;
      }

      // Mark item as verified
      const newVerifiedItems = new Set(verifiedItems);
      newVerifiedItems.add(orderItem.item_id);
      setVerifiedItems(newVerifiedItems);

      notification?.success({
        message: "Xác thực thành công",
        description: `Đã xác thực sản phẩm: ${scannedProduct.name}`,
      });

      // Check if all products are now verified
      if (newVerifiedItems.size === orderItems.length) {
        notification?.success({
          message: "🎉 Hoàn thành xác thực!",
          description:
            "Tất cả sản phẩm đã được xác thực. Có thể đánh dấu đã đóng gói.",
          duration: 4,
        });
      }

      // Don't close scanner in multiple scan mode - keep scanning for more products
    } catch (error) {
      console.error("QR scan error:", error);
      notification.error({
        message: "Lỗi quét QR",
        description: "Có lỗi xảy ra khi quét mã QR",
      });
    }
  };

  // Handle open continuous scanner
  const handleOpenContinuousScanner = () => {
    setQrScannerOpen(true);
  };

  // Handle edit quote modal close
  const handleEditQuoteModalClose = () => {
    setEditQuoteModalOpen(false);
    editQuoteForm.resetFields();
    setSelectedOrder(null);
  };

  // Handle create customer modal close
  const handleCreateCustomerModalClose = () => {
    setCreateCustomerModalOpen(false);
    createCustomerForm.resetFields();
  };

  // Handle bulk update modal close
  const handleBulkUpdateModalClose = () => {
    if (!bulkUpdateLoading) {
      setBulkUpdateModalOpen(false);
      bulkUpdateForm.resetFields();
    }
  };

  // Handle marking order as packaged
  const handleMarkAsPackaged = async () => {
    if (!selectedOrder) return;

    try {
      setLoading(true);
      const { error } = await updateQuoteStage(
        selectedOrder.quote_id,
        "packaged"
      );

      if (error) {
        notification.error({
          message: "Lỗi cập nhật trạng thái",
          description: "Không thể cập nhật trạng thái đơn hàng",
        });
        return;
      }

      notification.success({
        message: "Đóng gói hoàn thành",
        description: `Đơn hàng ${selectedOrder.quote_number} đã được đánh dấu là đã đóng gói`,
      });

      // Update the selected order status
      setSelectedOrder({
        ...selectedOrder,
        quote_stage: "packaged",
      });

      // Close the detail modal first
      setOrderDetailModalOpen(false);
      setVerifiedItems(new Set()); // Reset verified items

      // Refresh the orders list after modal is closed
      await loadOrders();
    } catch (error) {
      console.error("Error updating order status:", error);
      notification.error({
        message: "Lỗi hệ thống",
        description: "Có lỗi xảy ra khi cập nhật trạng thái đơn hàng",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle manual verification (for items without QR)
  const handleManualVerify = (item: any) => {
    const newVerifiedItems = new Set(verifiedItems);
    newVerifiedItems.add(item.item_id);
    setVerifiedItems(newVerifiedItems);

    notification?.success({
      message: "Xác thực thủ công",
      description: `Đã xác thực sản phẩm: ${item.products?.name}`,
    });
  };

  // Handle create quote
  const handleCreateQuote = () => {
    createQuoteForm.resetFields();
    setCreateQuoteModalOpen(true);
  };

  // Handle create new customer
  const handleCreateNewCustomer = () => {
    setCreateCustomerModalOpen(true);
  };

  // Handle save new customer
  const handleSaveNewCustomer = async (values: any) => {
    try {
      if (!employee?.employee_id) {
        notification.error({
          message: "Lỗi",
          description: "Không tìm thấy thông tin nhân viên",
        });
        return;
      }

      const customerData = {
        customer_name: values.customer_name,
        customer_code: values.customer_code || "",
        contact_person: values.contact_person || "",
        phone_number: values.phone_number || "",
        email: values.email || "",
        address: values.address || "",
        tax_code: values.tax_code || "",
        customer_type: values.customer_type || ("other" as const),
        credit_limit: values.credit_limit || null,
        payment_terms_days: values.payment_terms_days || 30,
        is_active: true,
        created_by_employee_id: employee.employee_id,
      };

      const { data: newCustomer, error } = await createB2BCustomer(
        customerData
      );

      if (error) {
        throw new Error(error.message);
      }

      if (newCustomer) {
        notification?.success({
          message: "Thành công",
          description: "Tạo khách hàng B2B thành công",
        });

        // Auto-fill the quote form with new customer data
        createQuoteForm.setFieldsValue({
          customer_name: newCustomer.customer_name,
          customer_code: newCustomer.customer_code,
          contact_person: newCustomer.contact_person,
          customer_phone: newCustomer.phone_number,
          customer_email: newCustomer.email,
          customer_address: newCustomer.address,
        });

        setCreateCustomerModalOpen(false);
        createCustomerForm.resetFields();
      }
    } catch (error) {
      console.error("Error creating customer:", error);
      notification.error({
        message: "Lỗi tạo khách hàng",
        description: "Không thể tạo khách hàng B2B mới",
      });
    }
  };

  // Auto-fill customer details when customer name/code changes
  const handleCustomerChange = async (
    field: "customer_name" | "customer_code",
    value: string
  ) => {
    if (!value) return;

    try {
      const { data: existingCustomers } = await getB2BCustomers();
      const existingCustomer = existingCustomers?.find((c) =>
        field === "customer_name"
          ? c.customer_name === value
          : field === "customer_code"
          ? c.customer_code === value
          : false
      );

      if (existingCustomer) {
        // Auto-fill form with existing customer data
        createQuoteForm.setFieldsValue({
          customer_name: existingCustomer.customer_name,
          customer_code: existingCustomer.customer_code,
          contact_person: existingCustomer.contact_person,
          customer_phone: existingCustomer.phone_number,
          customer_email: existingCustomer.email,
          customer_address: existingCustomer.address,
        });

        notification.info({
          message: "Thông tin khách hàng",
          description: "Đã tự động điền thông tin từ khách hàng hiện có",
        });
      }
    } catch (error) {
      console.error("Error fetching customer data:", error);
    }
  };

  // Handle edit quote
  const handleEditOrder = (quote: B2BQuoteWithStatus) => {
    setSelectedOrder(quote);
    // Pre-populate the form with existing data
    editQuoteForm.setFieldsValue({
      customer_name: quote.customer_name,
      customer_code: quote.customer_code,
      contact_person: quote.customer_contact_person,
      customer_phone: quote.customer_phone,
      customer_email: quote.customer_email,
      customer_address: quote.customer_address,
      quote_stage: quote.quote_stage,
      payment_status: quote.payment_status || "unpaid",
      discount_percent: quote.discount_percent,
      tax_percent: quote.tax_percent,
      valid_until: quote.valid_until ? dayjs(quote.valid_until) : null,
      notes: quote.notes,
      terms_conditions: quote.terms_conditions,
    });
    setEditQuoteModalOpen(true);
  };

  // Handle save quote
  const handleSaveQuote = async (values: any, isDraft: boolean = true) => {
    try {
      if (!employee?.employee_id) {
        notification.error({
          message: "Lỗi",
          description: "Không tìm thấy thông tin nhân viên",
        });
        return;
      }

      // Auto-create B2B customer record first
      let b2bCustomerId: string | null = null;
      let existingCustomer: any = null;

      try {
        // Try to find existing customer by name or code first
        const { data: existingCustomers } = await getB2BCustomers();
        existingCustomer = existingCustomers?.find(
          (c) =>
            c.customer_name === values.customer_name ||
            (values.customer_code && c.customer_code === values.customer_code)
        );

        if (existingCustomer) {
          b2bCustomerId = existingCustomer.customer_id;
        } else {
          // Create new B2B customer
          const customerData = {
            customer_name: values.customer_name,
            customer_code: values.customer_code || "",
            contact_person: values.contact_person || "",
            phone: values.customer_phone || "",
            email: values.customer_email || "",
            address: values.customer_address || "",
            customer_type: "other" as const,
            payment_terms_days: 30,
            is_active: true,
            created_by_employee_id: employee.employee_id,
          };

          const { data: newCustomer, error: customerError } =
            await createB2BCustomer(customerData);

          if (customerError) {
            throw new Error(`Lỗi tạo khách hàng: ${customerError.message}`);
          }

          if (newCustomer) {
            b2bCustomerId = newCustomer.customer_id;
          }
        }
      } catch (customerError) {
        console.error("Error handling B2B customer:", customerError);
        notification.error({
          message: "Lỗi xử lý khách hàng",
          description: "Không thể tạo hoặc tìm thấy khách hàng B2B",
        });
        return;
      }

      if (!b2bCustomerId) {
        notification.error({
          message: "Lỗi",
          description: "Không thể tạo khách hàng B2B",
        });
        return;
      }

      // Get customer address from B2B customer record if it exists
      let customerAddress = values.customer_address;
      if (!customerAddress && existingCustomer?.address) {
        customerAddress = existingCustomer.address;
      }

      const quoteData = {
        b2b_customer_id: b2bCustomerId,
        customer_name: values.customer_name,
        customer_code: values.customer_code,
        customer_contact_person: values.contact_person,
        customer_phone: values.customer_phone,
        customer_email: values.customer_email,
        customer_address: customerAddress,
        quote_stage: isDraft ? ("draft" as const) : ("sent" as const),
        total_value: 0,
        subtotal: 0,
        discount_percent: values.discount_percent || 0,
        discount_amount: 0,
        tax_percent: values.tax_percent || 0,
        tax_amount: 0,
        quote_date: dayjs().format("YYYY-MM-DD"),
        valid_until: values.valid_until
          ? dayjs(values.valid_until).format("YYYY-MM-DD")
          : dayjs().add(30, "days").format("YYYY-MM-DD"),
        notes: values.notes,
        terms_conditions: values.terms_conditions,
        created_by_employee_id: employee.employee_id,
      };

      const { data: newQuote, error } = await createB2BQuote(quoteData as any);

      if (error) {
        throw new Error(error.message);
      }

      if (newQuote) {
        notification?.success({
          message: "Thành công",
          description: `${isDraft ? "Lưu nháp" : "Gửi"} báo giá thành công`,
        });
        setCreateQuoteModalOpen(false);
        createQuoteForm.resetFields();
        loadOrders(); // Reload data
      }
    } catch (error) {
      console.error("Error creating quote:", error);
      notification.error({
        message: "Lỗi tạo báo giá",
        description: "Không thể tạo báo giá mới",
      });
    }
  };

  // Handle bulk selection
  const handleSelectOrder = (orderId: string, checked: boolean) => {
    if (checked) {
      setSelectedOrderIds([...selectedOrderIds, orderId]);
    } else {
      setSelectedOrderIds(selectedOrderIds.filter((id) => id !== orderId));
    }
  };

  // Handle select all orders
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const selectableOrderIds = quotes
        .filter((quote) => canEditOrderStatus(quote.quote_stage))
        .map((quote) => quote.quote_id);
      setSelectedOrderIds(selectableOrderIds);
    } else {
      setSelectedOrderIds([]);
    }
  };

  // Handle bulk update
  const handleBulkUpdate = () => {
    if (selectedOrderIds.length === 0) {
      notification.warning({
        message: "Chưa chọn đơn hàng",
        description: "Vui lòng chọn ít nhất một đơn hàng để cập nhật",
      });
      return;
    }
    setBulkUpdateModalOpen(true);
  };

  // Handle bulk update submission
  const handleBulkUpdateSubmit = async (values: any) => {
    setBulkUpdateLoading(true);
    const updateCount = selectedOrderIds.length;

    try {
      const updatePromises = selectedOrderIds.map((orderId) =>
        updateB2BQuote(orderId, {
          quote_stage: values.quote_stage,
        })
      );

      await Promise.all(updatePromises);

      // Close modal and reset form first
      setBulkUpdateModalOpen(false);
      bulkUpdateForm.resetFields();
      setSelectedOrderIds([]);

      // Force refresh the table data
      setCurrent(1); // Reset to first page
      await loadOrders();

      // Then show success notification
      notification?.success({
        message: "Cập nhật trạng thái thành công",
        description: `Đã cập nhật trạng thái cho ${updateCount} đơn hàng`,
      });
    } catch (error) {
      console.error("Error bulk updating quotes:", error);
      notification.error({
        message: "Lỗi cập nhật trạng thái",
        description: "Không thể cập nhật trạng thái đơn hàng",
      });
    } finally {
      setBulkUpdateLoading(false);
    }
  };

  // Handle update quote
  const handleUpdateQuote = async (values: any) => {
    try {
      if (!selectedOrder?.quote_id) {
        notification.error({
          message: "Lỗi",
          description: "Không tìm thấy thông tin báo giá",
        });
        return;
      }

      const updateData = {
        customer_name: values.customer_name,
        customer_code: values.customer_code,
        customer_contact_person: values.contact_person,
        customer_phone: values.customer_phone,
        customer_email: values.customer_email,
        customer_address: values.customer_address,
        quote_stage: values.quote_stage,
        payment_status: values.payment_status,
        discount_percent: values.discount_percent || 0,
        tax_percent: values.tax_percent || 0,
        valid_until: values.valid_until
          ? dayjs(values.valid_until).format("YYYY-MM-DD")
          : null,
        notes: values.notes,
        terms_conditions: values.terms_conditions,
      };

      console.log("Updating quote with data:", updateData);
      console.log("Quote stage being sent:", values.quote_stage);

      const { data: updatedQuote, error } = await updateB2BQuote(
        selectedOrder.quote_id,
        updateData
      );

      if (error) {
        throw new Error(error.message);
      }

      if (updatedQuote) {
        setEditQuoteModalOpen(false);
        editQuoteForm.resetFields();
        setSelectedOrder(null);
        loadOrders(); // Reload data
        notification?.success({
          message: "Thành công",
          description: "Cập nhật báo giá thành công",
        });
      }
    } catch (error) {
      console.error("Error updating quote:", error);
      notification.error({
        message: "Lỗi cập nhật báo giá",
        description: "Không thể cập nhật báo giá",
      });
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Get stage info
  const getStageInfo = (stage: string) => {
    return B2B_ORDER_STAGES.find((s) => s.key === stage) || B2B_ORDER_STAGES[0];
  };

  // Payment Status
  const B2B_PAYMENT_STATUS = [
    {
      key: "unpaid",
      title: "Chưa thanh toán",
      color: "red",
    },
    {
      key: "partial",
      title: "Thanh toán một phần",
      color: "orange",
    },
    {
      key: "paid",
      title: "✅ Hoàn tất",
      color: "green",
    },
    {
      key: "overdue",
      title: "Quá hạn",
      color: "volcano",
    },
  ];

  const getPaymentStatusInfo = (status: string) => {
    const statusInfo = B2B_PAYMENT_STATUS.find((s) => s.key === status);
    return statusInfo || { title: status, color: "default" };
  };

  const columns: ColumnsType<B2BQuoteWithStatus> = [
    {
      title: (
        <Checkbox
          indeterminate={
            selectedOrderIds.length > 0 &&
            selectedOrderIds.length <
              quotes.filter((quote) => canEditOrderStatus(quote.quote_stage))
                .length
          }
          checked={
            selectedOrderIds.length > 0 &&
            selectedOrderIds.length ===
              quotes.filter((quote) => canEditOrderStatus(quote.quote_stage))
                .length
          }
          onChange={(e) => handleSelectAll(e.target.checked)}
        />
      ),
      key: "select",
      width: 50,
      render: (_, record) => (
        <Checkbox
          checked={selectedOrderIds.includes(record.quote_id)}
          onChange={(e) => handleSelectOrder(record.quote_id, e.target.checked)}
          disabled={!canEditOrderStatus(record.quote_stage)}
        />
      ),
    },
    {
      title: "Mã ĐH / BG",
      dataIndex: "quote_number",
      key: "quote_number",
      width: 140,
      render: (text: string) => (
        <Text strong style={{ color: "#722ed1" }}>
          {text}
        </Text>
      ),
    },
    {
      title: "Tên Khách hàng",
      key: "customer",
      dataIndex: "customer_name",
      width: 200,
      sorter: (a, b) => {
        const nameA = a.customer_name || "";
        const nameB = b.customer_name || "";
        return nameA.localeCompare(nameB, "vi", { sensitivity: "base" });
      },
      sortDirections: ["ascend", "descend"],
      showSorterTooltip: {
        title: "Sắp xếp theo tên khách hàng (A-Z / Z-A)",
      },
      render: (text, record) => (
        <div>
          <Text strong>{text || "N/A"}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: "12px" }}>
            {record.customer_code || "Chưa có mã"}
          </Text>
        </div>
      ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "quote_date",
      key: "quote_date",
      width: 110,
      sorter: (a, b) => {
        const dateA = a.quote_date ? dayjs(a.quote_date).valueOf() : 0;
        const dateB = b.quote_date ? dayjs(b.quote_date).valueOf() : 0;
        return dateA - dateB;
      },
      sortDirections: ["ascend", "descend"],
      showSorterTooltip: {
        title: "Sắp xếp theo ngày tạo (cũ → mới / mới → cũ)",
      },
      defaultSortOrder: "descend",
      render: (date: string) => dayjs(date).format("DD/MM/YYYY"),
    },
    {
      title: "Tổng Giá trị",
      dataIndex: "total_value",
      key: "total_value",
      width: 120,
      sorter: (a, b) => {
        const valueA = a.total_value || 0;
        const valueB = b.total_value || 0;
        return valueA - valueB;
      },
      sortDirections: ["ascend", "descend"],
      showSorterTooltip: {
        title: "Sắp xếp theo giá trị (thấp → cao / cao → thấp)",
      },
      render: (value: number) => (
        <Text strong style={{ color: "#52c41a" }}>
          {formatCurrency(value)}
        </Text>
      ),
    },
    {
      title: "Trạng thái Đơn hàng",
      dataIndex: "quote_stage",
      key: "quote_stage",
      width: 160,
      render: (stage: string) => {
        const stageInfo = getStageInfo(stage);
        return <Tag color={stageInfo.color}>{stageInfo.title}</Tag>;
      },
    },
    {
      title: "Trạng thái Thanh toán",
      dataIndex: "payment_status",
      key: "payment_status",
      width: 150,
      render: (status: string) => {
        const statusInfo = getPaymentStatusInfo(status);
        return <Tag color={statusInfo.color}>{statusInfo.title}</Tag>;
      },
    },
    {
      title: "Hành Động",
      key: "actions",
      width: 150,
      render: (_, record) => (
        <Space>
          {canViewQuotes && (
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => handleViewOrder(record)}
              size="small"
            >
              Xem
            </Button>
          )}
          {canEditQuotes && canEditOrderStatus(record.quote_stage) && (
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEditOrder(record)}
              size="small"
            >
              {isInventoryStaff &&
              !userPermissions.includes("admin") &&
              !userPermissions.includes("super-admin")
                ? "Cập nhật"
                : "Sửa"}
            </Button>
          )}
          {canEditQuotes && !canEditOrderStatus(record.quote_stage) && (
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEditOrder(record)}
              size="small"
              disabled
              title={
                isInventoryStaff &&
                !userPermissions.includes("admin") &&
                !userPermissions.includes("super-admin")
                  ? "Đơn hàng này không thuộc phạm vi quản lý của bộ phận kho"
                  : "Bạn không có quyền chỉnh sửa trạng thái này"
              }
            >
              {isInventoryStaff &&
              !userPermissions.includes("admin") &&
              !userPermissions.includes("super-admin")
                ? "Cập nhật"
                : "Sửa"}
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2} style={{ margin: 0 }}>
            📋 Danh sách Đơn hàng B2B
          </Title>
          <div>
            <Text type="secondary">
              Quản lý và theo dõi tất cả đơn hàng bán buôn
            </Text>
            {isInventoryStaff &&
              !userPermissions.includes("admin") &&
              !userPermissions.includes("super-admin") && (
                <div style={{ marginTop: 8 }}>
                  <Tag color="orange" icon="📦">
                    Chế độ Kho: Chỉ hiển thị đơn hàng đã được chấp nhận và cần
                    xử lý
                  </Tag>
                </div>
              )}
          </div>
        </Col>
        <Col>
          <Space>
            {selectedOrderIds.length > 0 && canEditQuotes && (
              <Button
                type="default"
                icon={<EditOutlined />}
                onClick={handleBulkUpdate}
              >
                Cập nhật trạng thái ({selectedOrderIds.length})
              </Button>
            )}
            {canCreateQuotes && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreateQuote}
              >
                {!isMobile && "Tạo báo giá mới"}
              </Button>
            )}
            <Button
              icon={<ReloadOutlined />}
              onClick={loadOrders}
              loading={loading}
            >
              Làm mới
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Search and Filter */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={16} align="middle">
          <Col flex={1}>
            <Input.Search
              placeholder="🔍 Tìm kiếm nhanh theo mã đơn hàng, tên khách hàng..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onSearch={handleSearch}
              style={{ width: "100%" }}
              enterButton={<SearchOutlined />}
              size="large"
            />
          </Col>
          <Col style={{ marginTop: screens.xs ? 16 : 0 }}>
            <Space>
              <Button
                icon={<FilePdfOutlined />}
                onClick={handleExportToPDF}
                size="large"
                disabled={quotes.length === 0}
              >
                Xuất PDF
              </Button>
              <Button
                icon={<FilterOutlined />}
                onClick={() => setFilterDrawerOpen(true)}
                size="large"
                type={Object.keys(filters).length > 0 ? "primary" : "default"}
              >
                Bộ lọc nâng cao ({Object.keys(filters).length})
              </Button>
            </Space>
          </Col>
        </Row>

        {/* Active Filters Display */}
        {Object.keys(filters).length > 0 && (
          <Row style={{ marginTop: 16 }}>
            <Col span={24}>
              <Text type="secondary">Bộ lọc đang áp dụng: </Text>
              <Space wrap>
                {filters.quoteStage && (
                  <Tag
                    color="blue"
                    closable
                    onClose={() => {
                      const newFilters = { ...filters };
                      delete newFilters.quoteStage;
                      setFilters(newFilters);
                    }}
                  >
                    🔄{" "}
                    {
                      B2B_ORDER_STAGES.find((s) => s.key === filters.quoteStage)
                        ?.title
                    }
                  </Tag>
                )}
                {filters.paymentStatus && (
                  <Tag
                    color="green"
                    closable
                    onClose={() => {
                      const newFilters = { ...filters };
                      delete newFilters.paymentStatus;
                      setFilters(newFilters);
                    }}
                  >
                    💰{" "}
                    {filters.paymentStatus === "unpaid"
                      ? "Chưa thanh toán"
                      : filters.paymentStatus === "partial"
                      ? "Thanh toán một phần"
                      : filters.paymentStatus === "paid"
                      ? "Đã thanh toán"
                      : "Quá hạn thanh toán"}
                  </Tag>
                )}
                {filters.customerName && (
                  <Tag
                    color="purple"
                    closable
                    onClose={() => {
                      const newFilters = { ...filters };
                      delete newFilters.customerName;
                      setFilters(newFilters);
                    }}
                  >
                    👤 {filters.customerName}
                  </Tag>
                )}
                {filters.creatorName && (
                  <Tag
                    color="orange"
                    closable
                    onClose={() => {
                      const newFilters = { ...filters };
                      delete newFilters.creatorName;
                      setFilters(newFilters);
                    }}
                  >
                    👨‍💼 {filters.creatorName}
                  </Tag>
                )}
                {filters.startDate && filters.endDate && (
                  <Tag
                    color="cyan"
                    closable
                    onClose={() => {
                      const newFilters = { ...filters };
                      delete newFilters.startDate;
                      delete newFilters.endDate;
                      setFilters(newFilters);
                    }}
                  >
                    📅 {filters.startDate} - {filters.endDate}
                  </Tag>
                )}
                {filters.employeeId && (
                  <Tag
                    color="red"
                    closable
                    onClose={() => {
                      const newFilters = { ...filters };
                      delete newFilters.employeeId;
                      setFilters(newFilters);
                    }}
                  >
                    🔒 Đơn hàng của tôi
                  </Tag>
                )}
              </Space>
            </Col>
          </Row>
        )}
      </Card>

      {/* Orders Table */}
      <Card>
        {selectedOrderIds.length > 0 && (
          <div
            style={{
              marginBottom: 16,
              padding: "8px 16px",
              backgroundColor: "#f0f8ff",
              borderRadius: 6,
              border: "1px solid #d6e4ff",
            }}
          >
            <Space>
              <Text strong style={{ color: "#1890ff" }}>
                📋 Đã chọn {selectedOrderIds.length} đơn hàng
              </Text>
              <Button
                size="small"
                type="link"
                onClick={() => setSelectedOrderIds([])}
                style={{ padding: 0 }}
              >
                Bỏ chọn tất cả
              </Button>
            </Space>
          </div>
        )}
        <Table
          columns={columns}
          dataSource={quotes}
          rowKey="quote_id"
          loading={loading}
          pagination={{
            current,
            pageSize,
            total,
            onChange: setCurrent,
            showSizeChanger: false,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} đơn hàng`,
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* Filter Drawer */}
      <Drawer
        title="🔧 Công cụ Lọc & Tìm kiếm Nâng cao"
        placement="right"
        onClose={() => setFilterDrawerOpen(false)}
        open={filterDrawerOpen}
        width={420}
        extra={
          <Text type="secondary" style={{ fontSize: "12px" }}>
            Lọc đơn hàng B2B theo nhiều tiêu chí
          </Text>
        }
      >
        {/* Quick Filter Buttons */}
        <div style={{ marginBottom: 24 }}>
          <Text strong style={{ display: "block", marginBottom: 12 }}>
            ⚡ Lọc nhanh:
          </Text>
          <Space wrap>
            {isInventoryStaff &&
            !userPermissions.includes("admin") &&
            !userPermissions.includes("super-admin") ? (
              // Inventory staff only sees inventory-relevant quick filters
              <>
                <Button
                  size="small"
                  onClick={() =>
                    form.setFieldsValue({ quoteStage: "accepted" })
                  }
                >
                  ✅ Đã chấp nhận
                </Button>
                <Button
                  size="small"
                  onClick={() =>
                    form.setFieldsValue({ quoteStage: "pending_packaging" })
                  }
                >
                  🔵 Chờ đóng gói
                </Button>
                <Button
                  size="small"
                  onClick={() =>
                    form.setFieldsValue({ quoteStage: "packaged" })
                  }
                >
                  🟡 Đã đóng gói
                </Button>
              </>
            ) : (
              // Non-inventory staff see all quick filters
              <>
                <Button
                  size="small"
                  onClick={() =>
                    form.setFieldsValue({ quoteStage: "pending_packaging" })
                  }
                >
                  🔵 Chờ đóng gói
                </Button>
                <Button
                  size="small"
                  onClick={() =>
                    form.setFieldsValue({ quoteStage: "shipping" })
                  }
                >
                  🚚 Đang giao hàng
                </Button>
                <Button
                  size="small"
                  onClick={() =>
                    form.setFieldsValue({ paymentStatus: "unpaid" })
                  }
                >
                  💰 Chưa thanh toán
                </Button>
                <Button
                  size="small"
                  onClick={() =>
                    form.setFieldsValue({ paymentStatus: "overdue" })
                  }
                >
                  🔺 Quá hạn
                </Button>
              </>
            )}
          </Space>
        </div>

        <Form form={form} layout="vertical" onFinish={handleFilterApply}>
          <Form.Item name="dateRange" label="📅 Ngày tạo">
            <RangePicker
              style={{ width: "100%" }}
              format="DD/MM/YYYY"
              placeholder={["Từ ngày", "Đến ngày"]}
            />
          </Form.Item>

          <Form.Item name="quoteStage" label="🔄 Trạng thái Vận hành">
            <Select placeholder="Chọn trạng thái vận hành" allowClear>
              {(isInventoryStaff &&
              !userPermissions.includes("admin") &&
              !userPermissions.includes("super-admin")
                ? B2B_ORDER_STAGES.filter((stage) =>
                    ["accepted", "pending_packaging", "packaged"].includes(
                      stage.key
                    )
                  )
                : B2B_ORDER_STAGES
              ).map((stage) => (
                <Select.Option key={stage.key} value={stage.key}>
                  {stage.title}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="paymentStatus" label="💰 Trạng thái Thanh toán">
            <Select placeholder="Chọn trạng thái thanh toán" allowClear>
              <Select.Option value="unpaid">🔴 Chưa thanh toán</Select.Option>
              <Select.Option value="partial">
                🟡 Thanh toán một phần
              </Select.Option>
              <Select.Option value="paid">🟢 Đã thanh toán</Select.Option>
              <Select.Option value="overdue">
                🔺 Quá hạn thanh toán
              </Select.Option>
            </Select>
            <Text type="secondary" style={{ fontSize: "12px" }}>
              * Lọc theo trạng thái thanh toán từ cơ sở dữ liệu
            </Text>
          </Form.Item>

          <Form.Item name="customerName" label="👤 Tên Khách hàng">
            <Input placeholder="Nhập tên khách hàng để lọc" allowClear />
            <Text type="secondary" style={{ fontSize: "12px" }}>
              * Tìm kiếm chính xác theo tên khách hàng
            </Text>
          </Form.Item>

          <Form.Item name="creatorName" label="👨‍💼 Người tạo">
            <Input placeholder="Nhập tên người tạo để lọc" allowClear />
            <Text type="secondary" style={{ fontSize: "12px" }}>
              * Lọc theo nhân viên tạo đơn hàng
            </Text>
          </Form.Item>

          {employee?.employee_id && (
            <Form.Item
              name="onlyMyQuotes"
              label="🔒 Bộ lọc cá nhân"
              valuePropName="checked"
            >
              <Checkbox>Chỉ hiển thị đơn hàng do tôi tạo</Checkbox>
            </Form.Item>
          )}

          <Form.Item>
            <Space style={{ width: "100%", justifyContent: "space-between" }}>
              <Button onClick={handleClearFilters}>Xóa bộ lọc</Button>
              <Button type="primary" htmlType="submit">
                Áp dụng
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Drawer>

      {/* Order Detail Modal */}
      <OrderDetailModal
        open={orderDetailModalOpen}
        onClose={() => setOrderDetailModalOpen(false)}
        selectedOrder={selectedOrder}
        orderItems={orderItems}
        loadingItems={loadingItems}
        verifiedItems={verifiedItems}
        isInventoryStaff={isInventoryStaff}
        onMarkAsPackaged={handleMarkAsPackaged}
        onOpenContinuousScanner={handleOpenContinuousScanner}
        onManualVerify={handleManualVerify}
        formatCurrency={formatCurrency}
        getStageInfo={getStageInfo}
        loading={loading}
      />

      {/* Create Quote Modal */}
      <CreateQuoteModal
        open={createQuoteModalOpen}
        onCancel={() => setCreateQuoteModalOpen(false)}
        form={createQuoteForm}
        onSaveDraft={(values) => handleSaveQuote(values, true)}
        onSendQuote={(values) => handleSaveQuote(values, false)}
        onCreateNewCustomer={handleCreateNewCustomer}
        onCustomerChange={handleCustomerChange}
      />

      {/* Edit Quote Modal */}
      <EditQuoteModal
        open={editQuoteModalOpen}
        onCancel={handleEditQuoteModalClose}
        form={editQuoteForm}
        selectedOrder={selectedOrder}
        onUpdateQuote={handleUpdateQuote}
        canEditOrderStatus={canEditOrderStatus}
        getAllowedStatuses={getAllowedStatuses}
        B2B_PAYMENT_STATUS={B2B_PAYMENT_STATUS}
        isSalesStaff={isSalesStaff}
        isInventoryStaff={isInventoryStaff}
        isDeliveryStaff={isDeliveryStaff}
      />

      {/* Create Customer Modal */}
      <CreateCustomerModal
        open={createCustomerModalOpen}
        onCancel={handleCreateCustomerModalClose}
        form={createCustomerForm}
        onCreateCustomer={handleSaveNewCustomer}
      />

      {/* Bulk Update Modal */}
      <BulkUpdateModal
        open={bulkUpdateModalOpen}
        onCancel={handleBulkUpdateModalClose}
        form={bulkUpdateForm}
        selectedOrderCount={selectedOrderIds.length}
        loading={bulkUpdateLoading}
        onBulkUpdate={handleBulkUpdateSubmit}
        getAllowedStatuses={getAllowedStatuses}
      />

      {/* QR Scanner Modal for Product Verification */}
      {isInventoryStaff && (
        <QRScannerVerificationModal
          open={qrScannerOpen}
          onClose={() => setQrScannerOpen(false)}
          onScan={handleQRScan}
          verifiedItems={verifiedItems}
          orderItems={orderItems}
        />
      )}
    </div>
  );
};

export default B2BOrderListPage;
