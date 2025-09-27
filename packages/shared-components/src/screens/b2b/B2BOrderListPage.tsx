import React, { useState, useEffect } from 'react';
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
  Modal,
  Form,
  App,
  Row,
  Col,
  Drawer,
  Descriptions,
  Grid,
  Checkbox,
} from 'antd';
import {
  FilterOutlined,
  EyeOutlined,
  EditOutlined,
  ReloadOutlined,
  PlusOutlined,
  SearchOutlined,
  FilePdfOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import {
  getB2BQuotes,
  createB2BQuote,
  updateB2BQuote,
  getB2BCustomers,
  createB2BCustomer,
} from '@nam-viet-erp/services';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { useBreakpoint } = Grid;

// Use the global IB2BQuote interface and extend with additional fields if needed
interface B2BQuoteWithStatus extends IB2BQuote {
  // Using quote_stage for all order statuses - no separate operation_status needed
}

// B2B Order Stages - Complete workflow from quote to completion
const B2B_ORDER_STAGES = [
  {
    key: 'draft',
    title: '⚫ Nháp',
    description: 'Báo giá/đơn hàng đang soạn thảo',
    color: 'default',
  },
  {
    key: 'sent',
    title: 'Đã gửi',
    description: 'Báo giá đã gửi cho khách hàng',
    color: 'blue',
  },
  {
    key: 'negotiating',
    title: 'Thương thảo',
    description: 'Đang thương thảo điều khoản',
    color: 'orange',
  },
  {
    key: 'accepted',
    title: 'Chấp nhận',
    description: 'Báo giá được chấp nhận, chuyển thành đơn hàng',
    color: 'green',
  },
  {
    key: 'pending_packaging',
    title: '🔵 Chờ đóng gói',
    description: 'Đơn hàng chờ xử lý và đóng gói',
    color: 'blue',
  },
  {
    key: 'packaged',
    title: '🟡 Đã đóng gói & Chờ giao vận',
    description: 'Hàng đã đóng gói, chờ giao cho đơn vị vận chuyển',
    color: 'orange',
  },
  {
    key: 'shipping',
    title: '🚚 Chờ giao tới khách hàng',
    description: 'Hàng đang trên đường giao đến khách hàng',
    color: 'cyan',
  },
  {
    key: 'completed',
    title: '✅ Hoàn tất',
    description: 'Đơn hàng đã hoàn tất',
    color: 'green',
  },
  {
    key: 'rejected',
    title: 'Từ chối',
    description: 'Báo giá bị từ chối',
    color: 'red',
  },
  {
    key: 'cancelled',
    title: '❌ Đã hủy',
    description: 'Đơn hàng đã bị hủy',
    color: 'red',
  },
  {
    key: 'expired',
    title: 'Hết hạn',
    description: 'Báo giá đã hết hạn',
    color: 'volcano',
  },
];

interface Employee {
  employee_id: string;
  full_name: string;
  employee_code: string;
}

interface User {
  id: string;
  name: string;
  permissions: string[];
}

interface B2BOrderListPageProps {
  employee?: Employee | null;
  user?: User | null;
}

const B2BOrderListPage: React.FC<B2BOrderListPageProps> = ({ employee, user }) => {
  const { notification } = App.useApp();
  const [quotes, setQuotes] = useState<B2BQuoteWithStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filters, setFilters] = useState<any>({});
  const [current, setCurrent] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [orderDetailModalOpen, setOrderDetailModalOpen] = useState(false);
  const [createQuoteModalOpen, setCreateQuoteModalOpen] = useState(false);
  const [editQuoteModalOpen, setEditQuoteModalOpen] = useState(false);
  const [createCustomerModalOpen, setCreateCustomerModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<B2BQuoteWithStatus | null>(null);
  const screens = useBreakpoint();
  const isMobile = !screens.lg;

  const [form] = Form.useForm();
  const [createQuoteForm] = Form.useForm();
  const [editQuoteForm] = Form.useForm();
  const [createCustomerForm] = Form.useForm();

  // Permission checks
  const userPermissions = user?.permissions || [];
  const canCreateQuotes = userPermissions.includes('quotes.create') || userPermissions.includes('b2b.create');
  const canEditQuotes = userPermissions.includes('quotes.edit') || userPermissions.includes('b2b.edit');
  const canViewQuotes = userPermissions.includes('quotes.view') || userPermissions.includes('b2b.view');

  // Role-based status change permissions
  const isSalesStaff = userPermissions.includes('sales.create') || userPermissions.includes('sales.manage');
  const isInventoryStaff = userPermissions.includes('inventory.access') || userPermissions.includes('inventory.manage');
  const isDeliveryStaff = userPermissions.includes('delivery.access') || userPermissions.includes('shipping.manage');

  // Get allowed statuses based on user role and current order status
  const getAllowedStatuses = (currentStatus?: string) => {
    const salesStatuses = ['draft', 'sent', 'negotiating', 'accepted', 'cancelled', 'rejected', 'expired'];
    const inventoryStatuses = ['pending_packaging', 'packaged'];
    const deliveryStatuses = ['shipping', 'completed'];

    // If user has admin permissions, allow all statuses
    if (userPermissions.includes('admin') || userPermissions.includes('super-admin')) {
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
      const isCurrentStatusInUserRange = allowedStatuses.includes(currentStatus);

      // If current status is NOT in user's range, they cannot change it
      if (!isCurrentStatusInUserRange) {
        // Return only the current status (read-only)
        return B2B_ORDER_STAGES.filter(stage => stage.key === currentStatus);
      }
    }

    // Filter stages based on allowed statuses
    return B2B_ORDER_STAGES.filter(stage => allowedStatuses.includes(stage.key));
  };

  // Check if user can edit the current order status
  const canEditOrderStatus = (currentStatus: string) => {
    const salesStatuses = ['draft', 'sent', 'negotiating', 'accepted', 'cancelled', 'rejected', 'expired'];
    const inventoryStatuses = ['pending_packaging', 'packaged'];
    const deliveryStatuses = ['shipping', 'completed'];

    // Admin can edit any status
    if (userPermissions.includes('admin') || userPermissions.includes('super-admin')) {
      return true;
    }

    // Check if current status is in user's authorized range
    if (isSalesStaff && salesStatuses.includes(currentStatus)) return true;
    if (isInventoryStaff && inventoryStatuses.includes(currentStatus)) return true;
    if (isDeliveryStaff && deliveryStatuses.includes(currentStatus)) return true;

    return false;
  };

  // Load B2B orders
  const loadOrders = async () => {
    setLoading(true);
    try {
      const response = await getB2BQuotes({
        // Search keyword (general search)
        customerName: searchKeyword || filters.customerName || undefined,
        // Creator filter (if supported by the service)
        // creatorName: filters.creatorName || undefined,
        // Employee filter (for personal quotes)
        employeeId: filters.employeeId || undefined,
        // Operation status filter
        stage: filters.quoteStage || undefined,
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

      const quotesData = (response.data || []) as B2BQuoteWithStatus[];
      setQuotes(quotesData);
      setTotal(quotesData.length); // For now, since we don't have total count from service
    } catch (error: any) {
      notification.error({
        message: 'Lỗi tải dữ liệu',
        description: error.message || 'Không thể tải danh sách đơn hàng B2B',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [current, searchKeyword, filters]);

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
      newFilters.startDate = values.dateRange[0].format('YYYY-MM-DD');
      newFilters.endDate = values.dateRange[1].format('YYYY-MM-DD');
    }

    // Operation status filter (quote stage)
    if (values.quoteStage) newFilters.quoteStage = values.quoteStage;

    // Payment status filter
    if (values.paymentStatus) newFilters.paymentStatus = values.paymentStatus;

    // Customer name filter
    if (values.customerName) newFilters.customerName = values.customerName.trim();

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
    setSearchKeyword('');
    form.resetFields();
    setCurrent(1);
    setFilterDrawerOpen(false);
  };

  // Export to PDF function
  const handleExportToPDF = () => {
    // Create a new window with print-friendly content
    const printWindow = window.open('', '_blank');

    if (!printWindow) {
      notification.error({
        message: 'Lỗi xuất PDF',
        description: 'Không thể mở cửa sổ in. Vui lòng kiểm tra cài đặt trình duyệt.',
      });
      return;
    }

    // Prepare data for PDF
    const currentDate = dayjs().format('DD/MM/YYYY HH:mm');
    const filterInfo = Object.keys(filters).length > 0 ?
      `Đã áp dụng ${Object.keys(filters).length} bộ lọc` : 'Tất cả đơn hàng';

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

        ${quotes.map((quote, index) => {
          // Get product items
          const products = quote.quote_items || [];

          return `
            <div class="order">
              <div class="order-header">
                <div class="order-title">Đơn hàng #${index + 1}: ${quote.quote_number || 'Chưa có mã'}</div>
                <div class="client-info">
                  <strong>Khách hàng:</strong> ${quote.customer_name || 'N/A'}<br>
                  <strong>Ngày tạo:</strong> ${quote.created_at ? dayjs(quote.created_at).format('DD/MM/YYYY') : 'N/A'}
                </div>
              </div>

              ${products.length > 0 ? `
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
                    ${products.map((item: any, itemIndex: number) => `
                      <tr>
                        <td>${itemIndex + 1}</td>
                        <td>${item.product_name || 'N/A'}</td>
                        <td>${item.product_sku || 'N/A'}</td>
                        <td>${item.quantity || 0}</td>
                        <td>${(item.unit_price || 0).toLocaleString('vi-VN')} VND</td>
                        <td>${((item.quantity || 0) * (item.unit_price || 0)).toLocaleString('vi-VN')} VND</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              ` : '<p><em>Chưa có sản phẩm trong đơn hàng này</em></p>'}
            </div>
          `;
        }).join('')}

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

    notification.success({
      message: 'Đang xuất PDF',
      description: 'Cửa sổ in đã được mở. Chọn "Save as PDF" để lưu file.',
    });
  };

  // Handle view order details
  const handleViewOrder = (quote: B2BQuoteWithStatus) => {
    setSelectedOrder(quote);
    setOrderDetailModalOpen(true);
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
          message: 'Lỗi',
          description: 'Không tìm thấy thông tin nhân viên',
        });
        return;
      }

      const customerData = {
        customer_name: values.customer_name,
        customer_code: values.customer_code || '',
        contact_person: values.contact_person || '',
        phone_number: values.phone_number || '',
        email: values.email || '',
        address: values.address || '',
        tax_code: values.tax_code || '',
        customer_type: values.customer_type || 'other' as const,
        credit_limit: values.credit_limit || null,
        payment_terms_days: values.payment_terms_days || 30,
        is_active: true,
        created_by_employee_id: employee.employee_id,
      };

      const { data: newCustomer, error } = await createB2BCustomer(customerData);

      if (error) {
        throw new Error(error.message);
      }

      if (newCustomer) {
        notification.success({
          message: 'Thành công',
          description: 'Tạo khách hàng B2B thành công',
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
      console.error('Error creating customer:', error);
      notification.error({
        message: 'Lỗi tạo khách hàng',
        description: 'Không thể tạo khách hàng B2B mới',
      });
    }
  };

  // Auto-fill customer details when customer name/code changes
  const handleCustomerChange = async (field: 'customer_name' | 'customer_code', value: string) => {
    if (!value) return;

    try {
      const { data: existingCustomers } = await getB2BCustomers();
      const existingCustomer = existingCustomers?.find(c =>
        field === 'customer_name' ? c.customer_name === value :
        field === 'customer_code' ? c.customer_code === value : false
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
          message: 'Thông tin khách hàng',
          description: 'Đã tự động điền thông tin từ khách hàng hiện có',
        });
      }
    } catch (error) {
      console.error('Error fetching customer data:', error);
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
      payment_status: quote.payment_status || 'unpaid',
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
          message: 'Lỗi',
          description: 'Không tìm thấy thông tin nhân viên',
        });
        return;
      }

      // Auto-create B2B customer record first
      let b2bCustomerId: string | null = null;
      let existingCustomer: any = null;

      try {
        // Try to find existing customer by name or code first
        const { data: existingCustomers } = await getB2BCustomers();
        existingCustomer = existingCustomers?.find(c =>
          c.customer_name === values.customer_name ||
          (values.customer_code && c.customer_code === values.customer_code)
        );

        if (existingCustomer) {
          b2bCustomerId = existingCustomer.customer_id;
        } else {
          // Create new B2B customer
          const customerData = {
            customer_name: values.customer_name,
            customer_code: values.customer_code || '',
            contact_person: values.contact_person || '',
            phone: values.customer_phone || '',
            email: values.customer_email || '',
            address: values.customer_address || '',
            customer_type: 'other' as const,
            payment_terms_days: 30,
            is_active: true,
            created_by_employee_id: employee.employee_id,
          };

          const { data: newCustomer, error: customerError } = await createB2BCustomer(customerData);

          if (customerError) {
            throw new Error(`Lỗi tạo khách hàng: ${customerError.message}`);
          }

          if (newCustomer) {
            b2bCustomerId = newCustomer.customer_id;
          }
        }
      } catch (customerError) {
        console.error('Error handling B2B customer:', customerError);
        notification.error({
          message: 'Lỗi xử lý khách hàng',
          description: 'Không thể tạo hoặc tìm thấy khách hàng B2B',
        });
        return;
      }

      if (!b2bCustomerId) {
        notification.error({
          message: 'Lỗi',
          description: 'Không thể tạo khách hàng B2B',
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
        quote_stage: isDraft ? 'draft' as const : 'sent' as const,
        total_value: 0,
        subtotal: 0,
        discount_percent: values.discount_percent || 0,
        discount_amount: 0,
        tax_percent: values.tax_percent || 0,
        tax_amount: 0,
        quote_date: dayjs().format('YYYY-MM-DD'),
        valid_until: values.valid_until ? dayjs(values.valid_until).format('YYYY-MM-DD') : dayjs().add(30, 'days').format('YYYY-MM-DD'),
        notes: values.notes,
        terms_conditions: values.terms_conditions,
        created_by_employee_id: employee.employee_id,
      };

      const { data: newQuote, error } = await createB2BQuote(quoteData as any);

      if (error) {
        throw new Error(error.message);
      }

      if (newQuote) {
        notification.success({
          message: 'Thành công',
          description: `${isDraft ? 'Lưu nháp' : 'Gửi'} báo giá thành công`,
        });
        setCreateQuoteModalOpen(false);
        createQuoteForm.resetFields();
        loadOrders(); // Reload data
      }
    } catch (error) {
      console.error('Error creating quote:', error);
      notification.error({
        message: 'Lỗi tạo báo giá',
        description: 'Không thể tạo báo giá mới',
      });
    }
  };

  // Handle update quote
  const handleUpdateQuote = async (values: any) => {
    try {
      if (!selectedOrder?.quote_id) {
        notification.error({
          message: 'Lỗi',
          description: 'Không tìm thấy thông tin báo giá',
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
        valid_until: values.valid_until ? dayjs(values.valid_until).format('YYYY-MM-DD') : null,
        notes: values.notes,
        terms_conditions: values.terms_conditions,
      };

      const { data: updatedQuote, error } = await updateB2BQuote(selectedOrder.quote_id, updateData);

      if (error) {
        throw new Error(error.message);
      }

      if (updatedQuote) {
        notification.success({
          message: 'Thành công',
          description: 'Cập nhật báo giá thành công',
        });
        setEditQuoteModalOpen(false);
        editQuoteForm.resetFields();
        setSelectedOrder(null);
        loadOrders(); // Reload data
      }
    } catch (error) {
      console.error('Error updating quote:', error);
      notification.error({
        message: 'Lỗi cập nhật báo giá',
        description: 'Không thể cập nhật báo giá',
      });
    }
  };


  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  // Get stage info
  const getStageInfo = (stage: string) => {
    return B2B_ORDER_STAGES.find(s => s.key === stage) || B2B_ORDER_STAGES[0];
  };


  // Payment Status
  const B2B_PAYMENT_STATUS = [
    {
      key: 'unpaid',
      title: 'Chưa thanh toán',
      color: 'red',
    },
    {
      key: 'partial',
      title: 'Thanh toán một phần',
      color: 'orange',
    },
    {
      key: 'paid',
      title: '✅ Hoàn tất',
      color: 'green',
    },
    {
      key: 'overdue',
      title: 'Quá hạn',
      color: 'volcano',
    },
  ];

  const getPaymentStatusInfo = (status: string) => {
    const statusInfo = B2B_PAYMENT_STATUS.find(s => s.key === status);
    return statusInfo || { title: status, color: 'default' };
  };

  const columns: ColumnsType<B2BQuoteWithStatus> = [
    {
      title: 'Mã ĐH / BG',
      dataIndex: 'quote_number',
      key: 'quote_number',
      width: 140,
      render: (text: string) => (
        <Text strong style={{ color: '#722ed1' }}>
          {text}
        </Text>
      ),
    },
    {
      title: 'Tên Khách hàng',
      key: 'customer',
      dataIndex: 'customer_name',
      width: 200,
      sorter: (a, b) => {
        const nameA = a.customer_name || '';
        const nameB = b.customer_name || '';
        return nameA.localeCompare(nameB, 'vi', { sensitivity: 'base' });
      },
      sortDirections: ['ascend', 'descend'],
      showSorterTooltip: {
        title: 'Sắp xếp theo tên khách hàng (A-Z / Z-A)'
      },
      render: (text, record) => (
        <div>
          <Text strong>{text || 'N/A'}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.customer_code || 'Chưa có mã'}
          </Text>
        </div>
      ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'quote_date',
      key: 'quote_date',
      width: 110,
      sorter: (a, b) => {
        const dateA = a.quote_date ? dayjs(a.quote_date).valueOf() : 0;
        const dateB = b.quote_date ? dayjs(b.quote_date).valueOf() : 0;
        return dateA - dateB;
      },
      sortDirections: ['ascend', 'descend'],
      showSorterTooltip: {
        title: 'Sắp xếp theo ngày tạo (cũ → mới / mới → cũ)'
      },
      defaultSortOrder: 'descend',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Tổng Giá trị',
      dataIndex: 'total_value',
      key: 'total_value',
      width: 120,
      sorter: (a, b) => {
        const valueA = a.total_value || 0;
        const valueB = b.total_value || 0;
        return valueA - valueB;
      },
      sortDirections: ['ascend', 'descend'],
      showSorterTooltip: {
        title: 'Sắp xếp theo giá trị (thấp → cao / cao → thấp)'
      },
      render: (value: number) => (
        <Text strong style={{ color: '#52c41a' }}>
          {formatCurrency(value)}
        </Text>
      ),
    },
    {
      title: 'Trạng thái Đơn hàng',
      dataIndex: 'quote_stage',
      key: 'quote_stage',
      width: 160,
      render: (stage: string) => {
        const stageInfo = getStageInfo(stage);
        return (
          <Tag color={stageInfo.color}>
            {stageInfo.title}
          </Tag>
        );
      },
    },
    {
      title: 'Trạng thái Thanh toán',
      dataIndex: 'payment_status',
      key: 'payment_status',
      width: 150,
      render: (status: string) => {
        const statusInfo = getPaymentStatusInfo(status);
        return (
          <Tag color={statusInfo.color}>
            {statusInfo.title}
          </Tag>
        );
      },
    },
    {
      title: 'Hành Động',
      key: 'actions',
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
              Sửa
            </Button>
          )}
          {canEditQuotes && !canEditOrderStatus(record.quote_stage) && (
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEditOrder(record)}
              size="small"
              disabled
              title="Bạn không có quyền chỉnh sửa trạng thái này"
            >
              Sửa
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2} style={{ margin: 0 }}>
            📋 Danh sách Đơn hàng B2B
          </Title>
          <Text type="secondary">
            Quản lý và theo dõi tất cả đơn hàng bán buôn
          </Text>
        </Col>
        <Col>
          <Space>
            {canCreateQuotes && (
              <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateQuote}>
                {!isMobile && "Tạo báo giá mới"}
              </Button>
            )}
            <Button icon={<ReloadOutlined />} onClick={loadOrders} loading={loading}>
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
              style={{ width: '100%' }}
              enterButton={<SearchOutlined />}
              size="large"
            />
          </Col>
          <Col>
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
                  <Tag color="blue" closable onClose={() => {
                    const newFilters = { ...filters };
                    delete newFilters.quoteStage;
                    setFilters(newFilters);
                  }}>
                    🔄 {B2B_ORDER_STAGES.find(s => s.key === filters.quoteStage)?.title}
                  </Tag>
                )}
                {filters.paymentStatus && (
                  <Tag color="green" closable onClose={() => {
                    const newFilters = { ...filters };
                    delete newFilters.paymentStatus;
                    setFilters(newFilters);
                  }}>
                    💰 {filters.paymentStatus === 'unpaid' ? 'Chưa thanh toán' :
                         filters.paymentStatus === 'partial' ? 'Thanh toán một phần' :
                         filters.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Quá hạn thanh toán'}
                  </Tag>
                )}
                {filters.customerName && (
                  <Tag color="purple" closable onClose={() => {
                    const newFilters = { ...filters };
                    delete newFilters.customerName;
                    setFilters(newFilters);
                  }}>
                    👤 {filters.customerName}
                  </Tag>
                )}
                {filters.creatorName && (
                  <Tag color="orange" closable onClose={() => {
                    const newFilters = { ...filters };
                    delete newFilters.creatorName;
                    setFilters(newFilters);
                  }}>
                    👨‍💼 {filters.creatorName}
                  </Tag>
                )}
                {(filters.startDate && filters.endDate) && (
                  <Tag color="cyan" closable onClose={() => {
                    const newFilters = { ...filters };
                    delete newFilters.startDate;
                    delete newFilters.endDate;
                    setFilters(newFilters);
                  }}>
                    📅 {filters.startDate} - {filters.endDate}
                  </Tag>
                )}
                {filters.employeeId && (
                  <Tag color="red" closable onClose={() => {
                    const newFilters = { ...filters };
                    delete newFilters.employeeId;
                    setFilters(newFilters);
                  }}>
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
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} đơn hàng`,
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
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Lọc đơn hàng B2B theo nhiều tiêu chí
          </Text>
        }
      >
        {/* Quick Filter Buttons */}
        <div style={{ marginBottom: 24 }}>
          <Text strong style={{ display: 'block', marginBottom: 12 }}>
            ⚡ Lọc nhanh:
          </Text>
          <Space wrap>
            <Button
              size="small"
              onClick={() => form.setFieldsValue({ quoteStage: 'pending_packaging' })}
            >
              🔵 Chờ đóng gói
            </Button>
            <Button
              size="small"
              onClick={() => form.setFieldsValue({ quoteStage: 'shipping' })}
            >
              🚚 Đang giao hàng
            </Button>
            <Button
              size="small"
              onClick={() => form.setFieldsValue({ paymentStatus: 'unpaid' })}
            >
              💰 Chưa thanh toán
            </Button>
            <Button
              size="small"
              onClick={() => form.setFieldsValue({ paymentStatus: 'overdue' })}
            >
              🔺 Quá hạn
            </Button>
          </Space>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleFilterApply}
        >
          <Form.Item name="dateRange" label="📅 Ngày tạo">
            <RangePicker
              style={{ width: '100%' }}
              format="DD/MM/YYYY"
              placeholder={['Từ ngày', 'Đến ngày']}
            />
          </Form.Item>

          <Form.Item name="quoteStage" label="🔄 Trạng thái Vận hành">
            <Select placeholder="Chọn trạng thái vận hành" allowClear>
              {B2B_ORDER_STAGES.map(stage => (
                <Select.Option key={stage.key} value={stage.key}>
                  {stage.title}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="paymentStatus" label="💰 Trạng thái Thanh toán">
            <Select placeholder="Chọn trạng thái thanh toán" allowClear>
              <Select.Option value="unpaid">🔴 Chưa thanh toán</Select.Option>
              <Select.Option value="partial">🟡 Thanh toán một phần</Select.Option>
              <Select.Option value="paid">🟢 Đã thanh toán</Select.Option>
              <Select.Option value="overdue">🔺 Quá hạn thanh toán</Select.Option>
            </Select>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              * Lọc theo trạng thái thanh toán từ cơ sở dữ liệu
            </Text>
          </Form.Item>

          <Form.Item name="customerName" label="👤 Tên Khách hàng">
            <Input placeholder="Nhập tên khách hàng để lọc" allowClear />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              * Tìm kiếm chính xác theo tên khách hàng
            </Text>
          </Form.Item>

          <Form.Item name="creatorName" label="👨‍💼 Người tạo">
            <Input placeholder="Nhập tên người tạo để lọc" allowClear />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              * Lọc theo nhân viên tạo đơn hàng
            </Text>
          </Form.Item>

          {employee?.employee_id && (
            <Form.Item name="onlyMyQuotes" label="🔒 Bộ lọc cá nhân" valuePropName="checked">
              <Checkbox>Chỉ hiển thị đơn hàng do tôi tạo</Checkbox>
            </Form.Item>
          )}

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Button onClick={handleClearFilters}>
                Xóa bộ lọc
              </Button>
              <Button type="primary" htmlType="submit">
                Áp dụng
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Drawer>

      {/* Order Detail Modal */}
      <Modal
        title={`Chi tiết báo giá ${selectedOrder?.quote_number}`}
        open={orderDetailModalOpen}
        onCancel={() => setOrderDetailModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setOrderDetailModalOpen(false)}>
            Đóng
          </Button>,
          <Button key="edit" type="primary">
            Chỉnh sửa
          </Button>,
        ]}
        width={800}
      >
        {selectedOrder && (
          <div>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Mã báo giá">
                {selectedOrder.quote_number}
              </Descriptions.Item>
              <Descriptions.Item label="Khách hàng">
                {selectedOrder.customer_name}
              </Descriptions.Item>
              <Descriptions.Item label="Mã khách hàng">
                {selectedOrder.customer_code}
              </Descriptions.Item>
              <Descriptions.Item label="Người liên hệ">
                {selectedOrder.customer_contact_person}
              </Descriptions.Item>
              <Descriptions.Item label="Số điện thoại">
                {selectedOrder.customer_phone}
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                {selectedOrder.customer_email}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày tạo">
                {dayjs(selectedOrder.quote_date).format('DD/MM/YYYY')}
              </Descriptions.Item>
              <Descriptions.Item label="Hạn báo giá">
                {dayjs(selectedOrder.valid_until).format('DD/MM/YYYY')}
              </Descriptions.Item>
              <Descriptions.Item label="Tổng giá trị">
                <Text strong style={{ color: '#52c41a' }}>
                  {formatCurrency(selectedOrder.total_value)}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Chiết khấu">
                {selectedOrder.discount_percent}%
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái đơn hàng">
                <Tag color={getStageInfo(selectedOrder.quote_stage).color}>
                  {getStageInfo(selectedOrder.quote_stage).title}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái thanh toán">
                <Tag color={getPaymentStatusInfo(selectedOrder.payment_status || 'unpaid').color}>
                  {getPaymentStatusInfo(selectedOrder.payment_status || 'unpaid').title}
                </Tag>
              </Descriptions.Item>
              {selectedOrder.notes && (
                <Descriptions.Item label="Ghi chú" span={2}>
                  {selectedOrder.notes}
                </Descriptions.Item>
              )}
            </Descriptions>
          </div>
        )}
      </Modal>

      {/* Create Quote Modal */}
      <Modal
        title="Tạo báo giá B2B mới"
        open={createQuoteModalOpen}
        onCancel={() => setCreateQuoteModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setCreateQuoteModalOpen(false)}>
            Hủy
          </Button>,
          <Button key="save-draft" type="default" onClick={async () => {
            try {
              const values = await createQuoteForm.validateFields();
              handleSaveQuote(values, true);
            } catch (error) {
              console.error('Validation failed:', error);
            }
          }}>
            Lưu nháp
          </Button>,
          <Button key="send" type="primary" onClick={async () => {
            try {
              const values = await createQuoteForm.validateFields();
              handleSaveQuote(values, false);
            } catch (error) {
              console.error('Validation failed:', error);
            }
          }}>
            Gửi báo giá
          </Button>,
        ]}
        width={800}
      >
        <Form layout="vertical" form={createQuoteForm}>
          <Row gutter={16} align="middle">
            <Col span={24}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text strong>Thông tin khách hàng</Text>
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={handleCreateNewCustomer}
                  size="small"
                >
                  Tạo khách hàng mới
                </Button>
              </div>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="customer_name" label="Tên khách hàng" rules={[{ required: true, message: 'Vui lòng nhập tên khách hàng' }]}>
                <Input
                  placeholder="Nhập tên khách hàng"
                  onBlur={(e) => handleCustomerChange('customer_name', e.target.value)}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="customer_code" label="Mã khách hàng">
                <Input
                  placeholder="Mã khách hàng (tùy chọn)"
                  onBlur={(e) => handleCustomerChange('customer_code', e.target.value)}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="valid_until" label="Ngày hết hạn báo giá" rules={[{ required: true, message: 'Vui lòng chọn ngày hết hạn' }]}>
                <DatePicker style={{ width: '100%' }} placeholder="Chọn ngày hết hạn" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="discount_percent" label="Chiết khấu (%)">
                <Input placeholder="0" suffix="%" type="number" min={0} max={100} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="tax_percent" label="Thuế (%)">
                <Input placeholder="0" suffix="%" type="number" min={0} max={100} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="contact_person" label="Người liên hệ">
                <Input placeholder="Tên người liên hệ" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="customer_phone" label="Số điện thoại">
                <Input placeholder="Số điện thoại liên hệ" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="customer_email" label="Email">
            <Input placeholder="Email khách hàng" type="email" />
          </Form.Item>
          <Form.Item name="customer_address" label="Địa chỉ">
            <Input.TextArea rows={2} placeholder="Địa chỉ khách hàng" />
          </Form.Item>
          <Form.Item name="notes" label="Ghi chú">
            <Input.TextArea rows={3} placeholder="Thêm ghi chú cho báo giá..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Quote Modal */}
      <Modal
        title={`Chỉnh sửa báo giá ${selectedOrder?.quote_number}`}
        open={editQuoteModalOpen}
        onCancel={() => {
          setEditQuoteModalOpen(false);
          editQuoteForm.resetFields();
          setSelectedOrder(null);
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setEditQuoteModalOpen(false);
            editQuoteForm.resetFields();
            setSelectedOrder(null);
          }}>
            Hủy
          </Button>,
          <Button key="update" type="primary" onClick={async () => {
            try {
              const values = await editQuoteForm.validateFields();
              handleUpdateQuote(values);
            } catch (error) {
              console.error('Validation failed:', error);
            }
          }}>
            Cập nhật
          </Button>,
        ]}
        width={800}
      >
        {selectedOrder && !canEditOrderStatus(selectedOrder.quote_stage) && (
          <div style={{
            backgroundColor: '#fff7e6',
            border: '1px solid #ffd591',
            borderRadius: '6px',
            padding: '12px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center'
          }}>
            <span style={{ color: '#fa8c16', marginRight: '8px' }}>⚠️</span>
            <span style={{ color: '#ad6800' }}>
              Trạng thái này thuộc phạm vi quản lý của bộ phận khác. Bạn chỉ có thể xem thông tin.
            </span>
          </div>
        )}
        <Form layout="vertical" form={editQuoteForm}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="customer_name" label="Tên khách hàng" rules={[{ required: true, message: 'Vui lòng nhập tên khách hàng' }]}>
                <Input placeholder="Nhập tên khách hàng" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="customer_code" label="Mã khách hàng">
                <Input placeholder="Mã khách hàng (tùy chọn)" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="quote_stage"
                label={
                  <span>
                    Trạng thái đơn hàng
                    {isSalesStaff && <Tag color="blue" style={{ marginLeft: 8 }}>Sales</Tag>}
                    {isInventoryStaff && <Tag color="orange" style={{ marginLeft: 8 }}>Kho</Tag>}
                    {isDeliveryStaff && <Tag color="green" style={{ marginLeft: 8 }}>Giao hàng</Tag>}
                    {selectedOrder && !canEditOrderStatus(selectedOrder.quote_stage) && (
                      <Tag color="red" style={{ marginLeft: 8 }}>Chỉ đọc</Tag>
                    )}
                  </span>
                }
                rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
              >
                <Select
                  placeholder="Chọn trạng thái đơn hàng"
                  disabled={selectedOrder ? !canEditOrderStatus(selectedOrder.quote_stage) : false}
                >
                  {getAllowedStatuses(selectedOrder?.quote_stage).map(stage => (
                    <Select.Option key={stage.key} value={stage.key}>
                      <Tag color={stage.color}>{stage.title}</Tag> - {stage.description}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="valid_until" label="Ngày hết hạn báo giá" rules={[{ required: true, message: 'Vui lòng chọn ngày hết hạn' }]}>
                <DatePicker style={{ width: '100%' }} placeholder="Chọn ngày hết hạn" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="payment_status" label="Trạng thái thanh toán" rules={[{ required: true, message: 'Vui lòng chọn trạng thái thanh toán' }]}>
                <Select placeholder="Chọn trạng thái thanh toán">
                  {B2B_PAYMENT_STATUS.map(status => (
                    <Select.Option key={status.key} value={status.key}>
                      <Tag color={status.color}>{status.title}</Tag>
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="discount_percent" label="Chiết khấu (%)">
                <Input placeholder="0" suffix="%" type="number" min={0} max={100} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="tax_percent" label="Thuế (%)">
                <Input placeholder="0" suffix="%" type="number" min={0} max={100} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="contact_person" label="Người liên hệ">
                <Input placeholder="Tên người liên hệ" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="customer_phone" label="Số điện thoại">
                <Input placeholder="Số điện thoại liên hệ" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="customer_email" label="Email">
            <Input placeholder="Email khách hàng" type="email" />
          </Form.Item>
          <Form.Item name="customer_address" label="Địa chỉ">
            <Input.TextArea rows={2} placeholder="Địa chỉ khách hàng" />
          </Form.Item>
          <Form.Item name="notes" label="Ghi chú">
            <Input.TextArea rows={3} placeholder="Thêm ghi chú cho báo giá..." />
          </Form.Item>
          <Form.Item name="terms_conditions" label="Điều khoản & Điều kiện">
            <Input.TextArea rows={3} placeholder="Điều khoản và điều kiện..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* Create Customer Modal */}
      <Modal
        title="Tạo khách hàng B2B mới"
        open={createCustomerModalOpen}
        onCancel={() => {
          setCreateCustomerModalOpen(false);
          createCustomerForm.resetFields();
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setCreateCustomerModalOpen(false);
            createCustomerForm.resetFields();
          }}>
            Hủy
          </Button>,
          <Button key="create" type="primary" onClick={async () => {
            try {
              const values = await createCustomerForm.validateFields();
              handleSaveNewCustomer(values);
            } catch (error) {
              console.error('Validation failed:', error);
            }
          }}>
            Tạo khách hàng
          </Button>,
        ]}
        width={700}
      >
        <Form layout="vertical" form={createCustomerForm}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="customer_name" label="Tên khách hàng" rules={[{ required: true, message: 'Vui lòng nhập tên khách hàng' }]}>
                <Input placeholder="Nhập tên khách hàng" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="customer_code" label="Mã khách hàng" rules={[{ required: true, message: 'Vui lòng nhập mã khách hàng' }]}>
                <Input placeholder="Nhập mã khách hàng" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="contact_person" label="Người liên hệ">
                <Input placeholder="Tên người liên hệ" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="phone_number" label="Số điện thoại">
                <Input placeholder="Số điện thoại liên hệ" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="email" label="Email">
                <Input placeholder="Email khách hàng" type="email" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="customer_type" label="Loại khách hàng" rules={[{ required: true, message: 'Vui lòng chọn loại khách hàng' }]}>
                <Select placeholder="Chọn loại khách hàng">
                  <Select.Option value="hospital">Bệnh viện</Select.Option>
                  <Select.Option value="pharmacy">Nhà thuốc</Select.Option>
                  <Select.Option value="clinic">Phòng khám</Select.Option>
                  <Select.Option value="distributor">Nhà phân phối</Select.Option>
                  <Select.Option value="other">Khác</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="address" label="Địa chỉ">
            <Input.TextArea rows={2} placeholder="Địa chỉ khách hàng" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="tax_code" label="Mã số thuế">
                <Input placeholder="Mã số thuế" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="payment_terms_days" label="Thời hạn thanh toán (ngày)" initialValue={30}>
                <Input placeholder="30" type="number" min={1} max={365} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="credit_limit" label="Hạn mức tín dụng">
                <Input placeholder="0" type="number" min={0} suffix="VND" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default B2BOrderListPage;