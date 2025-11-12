// Screen Imports - Authentication
import LoginPage from "./auth/LoginPage";

// Screen Imports - POS
import PosPage from "./pos/PosPage";
import POSOrderListPage from "./pos/POSOrderListPage";

// Screen Imports - User
import UserProfilePage from "./user/UserProfilePage";

// Screen Imports - B2B
import B2BOrderManagementPage from "./b2b/B2BOrderManagementPage";
import B2BOrderListPage from "./b2b/B2BOrderListPage";
import QuickQuotePage from "./b2b/QuickQuotePage";
import CreateOrderPage from "./b2b/CreateOrderPage";
import EditB2BOrderPage from "./b2b/EditB2BOrderPage";
import B2BFinancialManagementPage from "./b2b/B2BFinancialManagementPage";
import InventoryB2BOrdersPage from "./b2b/InventoryB2BOrdersPage";

// Screen Imports - Medical
import PatientsPage from "./medical/PatientsPage";
import PatientDetailPage from "./medical/PatientDetailPage";
import MedicalRecordsPage from "./medical/MedicalRecordsPage";
import SchedulingPage from "./medical/SchedulingPage";

// Screen Imports - Inventory
import ProductsPage from "./inventory/ProductsPage";
import ProductListPage from "./inventory/ProductListPage";
import CreateProductPage from "./inventory/CreateProductPage";
import EditProductPage from "./inventory/EditProductPage";
import InventoryPurchaseOrdersPage from "./inventory/PurchaseOrdersPage"; // Using inventory version with fixes
import ComboListPage from "./inventory/ComboListPage";
import ProductLotDetailPage from "./inventory/ProductLotDetailPage";

// Screen Imports - Financial
import CashLedgerPage from "./financial/CashLedgerPage";
import FinancialTransactionsPage from "./financial/FinancialTransactionsPage";
import FundManagementPage from "./financial/FundManagementPage";

// Screen Imports - Marketing
import PromotionsPage from "./marketing/PromotionsPage";
import PromotionDetailPage from "./marketing/PromotionDetailPage";
import VouchersPage from "./marketing/VouchersPage";
import PointRulesPage from "./marketing/PointRulesPage";
import PointRuleDetailPage from "./marketing/PointRuleDetailPage";
import MarketingDashboardPage from "./marketing/MarketingDashboardPage";
import CampaignsPage from "./marketing/CampaignsPage";
import CampaignDetailPage from "./marketing/CampaignDetailPage";
import CustomerSegmentsPage from "./marketing/CustomerSegmentsPage";
import ContentLibraryPage from "./marketing/ContentLibraryPage";
import ChatbotManagementPage from "./marketing/ChatbotManagementPage";

// Screen Imports - Management
import DashboardPage from "./management/DashboardPage";
import EmployeesPage from "./management/EmployeesPage";
import CreateEmployeePage from "./management/CreateEmployeePage";
import EditEmployeePage from "./management/EditEmployeePage";
import UserManagementPage from "./management/UserManagementPage";
import RoomManagementPage from "./management/RoomManagementPage";
import RoleManagementPage from "./management/RoleManagementPage";
import EmployeeRolesPage from "./management/EmployeeRolesPage";
import UserRoleManagementPage from "./management/UserRoleManagementPage";
import EmployeeManagementPage from "./management/EmployeeManagementPage";

// Screen Imports - Salary
import SalaryManagementPage from "./salary/SalaryManagementPage";

// Screen Imports - Staff Dashboards
import SalesStaffDashboardPage from "./staff/SalesStaffDashboardPage";
import InventoryStaffDashboardPage from "./staff/InventoryStaffDashboardPage";
import DeliveryStaffDashboardPage from "./staff/DeliveryStaffDashboardPage";

// Screen Imports - Warehouse
import WarehousePurchaseOrdersPage from "./warehouse/PurchaseOrdersPage";
import EditPurchaseOrderPage from "./warehouse/EditPurchaseOrderPage";
import PurchaseOrderReceivingPage from "./warehouse/PurchaseOrderReceivingPage";
import PurchaseOrderReceivingDetailPage from "./warehouse/PurchaseOrderReceivingDetailPage";
import CreatePurchaseImportPage from "./warehouse/CreatePurchaseImportPage";
import SalesOrderPickingPage from "./warehouse/SalesOrderPickingPage";
import SuppliersPage from "./warehouse/SuppliersPage";
import SupplierFormPage from "./warehouse/SupplierFormPage";
import SupplierPromotionsPage from "./warehouse/SupplierPromotionsPage";
import VATInventoryDashboard from "./warehouse/VATInventoryDashboard";
import VATReconciliationPage from "./warehouse/VATReconciliationPage";
import VATInvoiceInputPage from "./warehouse/VATInvoiceInputPage";
import VATInvoicePOSPage from "./warehouse/VATInvoicePOSPage";
import VATInvoiceB2BPage from "./warehouse/VATInvoiceB2BPage";
import WarehouseTransfersListPage from "./warehouse/WarehouseTransfersListPage";
import WarehouseTransferDetailPage from "./warehouse/WarehouseTransferDetailPage";
import CreateWarehouseTransferPage from "./warehouse/CreateWarehouseTransferPage";

// Screen Registry Interface
export interface ScreenConfig {
  component: React.ComponentType<any>;
  permissions: string[];
  category: string;
  title: string;
  description?: string;
  props?: Record<string, any>;
}

export interface ScreenRegistry {
  [key: string]: ScreenConfig;
}

// Complete Screen Registry with Permissions
export const SCREEN_REGISTRY: ScreenRegistry = {
  // ==================== AUTHENTICATION ====================
  "auth.login": {
    component: LoginPage,
    permissions: [], // No permissions needed for login
    category: "auth",
    title: "Đăng nhập",
    description: "Trang đăng nhập hệ thống",
  },

  // ==================== POS SCREENS ====================
  "pos.main": {
    component: PosPage,
    permissions: ["pos.access", "sales.create"],
    category: "pos",
    title: "Bán hàng (POS)",
    description: "Giao diện bán hàng trực tiếp",
  },
  "pos.orders": {
    component: POSOrderListPage,
    permissions: ["pos.access", "sales.view"],
    category: "pos",
    title: "Danh sách Đơn hàng POS",
    description: "Xem và quản lý danh sách đơn hàng bán lẻ",
  },

  // ==================== B2B SCREENS ====================
  "b2b.orders": {
    component: B2BOrderListPage,
    permissions: ["b2b.access", "b2b.view"],
    category: "b2b",
    title: "Danh sách Đơn hàng B2B",
    description: "Xem và quản lý danh sách đơn hàng bán buôn",
  },
  "b2b.quick-quote": {
    component: QuickQuotePage,
    permissions: ["b2b.access", "quotes.create"],
    category: "b2b",
    title: "Báo giá nhanh",
    description: "Tạo báo giá nhanh cho khách hàng",
  },
  "b2b.dashboard": {
    component: B2BOrderManagementPage,
    permissions: ["b2b.access"],
    category: "b2b",
    title: "B2B Sales Dashboard",
    description: "Dashboard tổng quan bán hàng B2B",
  },
  "b2b.create-quote": {
    component: CreateOrderPage,
    permissions: ["b2b.access", "quotes.create"],
    category: "b2b",
    title: "Tạo Báo Giá / Đơn Hàng",
    description: "Tạo báo giá và đơn hàng chi tiết với thông tin khách hàng",
  },
  "b2b.financial": {
    component: B2BFinancialManagementPage,
    permissions: ["b2b.access", "b2b.view"],
    category: "b2b",
    title: "Quản Lý Tài Chính B2B",
    description: "Theo dõi và quản lý thanh toán đơn hàng B2B",
  },

  // ==================== USER SCREENS ====================
  "user.profile": {
    component: UserProfilePage,
    permissions: [], // All authenticated users can access their profile
    category: "user",
    title: "Thông Tin Cá Nhân",
    description: "Quản lý thông tin cá nhân và đổi mật khẩu",
  },

  // ==================== B2B SCREENS ====================
  "b2b.inventory-orders": {
    component: InventoryB2BOrdersPage,
    permissions: ["b2b.access", "b2b.view", "inventory.dashboard"],
    category: "b2b",
    title: "Quản lý Đơn hàng - Kho",
    description: "Kiểm hàng và đóng gói đơn hàng bán buôn cho nhân viên kho",
  },

  // ==================== MEDICAL SCREENS ====================
  "medical.patients": {
    component: PatientsPage,
    permissions: ["medical.access", "patients.view"],
    category: "medical",
    title: "Quản lý Bệnh nhân",
    description: "Quản lý thông tin bệnh nhân",
  },
  "medical.patient-detail": {
    component: PatientDetailPage,
    permissions: ["medical.access", "patients.view"],
    category: "medical",
    title: "Chi tiết Bệnh nhân",
    description: "Xem chi tiết thông tin bệnh nhân",
  },
  "medical.records": {
    component: MedicalRecordsPage,
    permissions: ["medical.access", "medical-records.view"],
    category: "medical",
    title: "Hồ sơ Y tế",
    description: "Quản lý hồ sơ y tế bệnh nhân",
  },
  "medical.scheduling": {
    component: SchedulingPage,
    permissions: ["medical.access", "appointments.view"],
    category: "medical",
    title: "Lịch hẹn",
    description: "Quản lý lịch hẹn khám bệnh",
  },

  // ==================== INVENTORY SCREENS ====================
  "inventory.products": {
    component: ProductsPage,
    permissions: ["inventory.access", "products.view"],
    category: "inventory",
    title: "Quản lý Sản phẩm",
    description: "Quản lý danh mục và thông tin sản phẩm",
  },
  "inventory.products-list": {
    component: ProductListPage,
    permissions: ["inventory.access", "products.view"],
    category: "inventory",
    title: "Danh sách Sản phẩm",
    description: "Xem danh sách sản phẩm",
  },
  "inventory.products.create": {
    component: CreateProductPage,
    permissions: ["inventory.access", "products.create"],
    category: "inventory",
    title: "Thêm sản phẩm mới",
    description: "Tạo sản phẩm mới trong hệ thống",
  },
  "inventory.products.edit": {
    component: EditProductPage,
    permissions: ["inventory.access", "products.update"],
    category: "inventory",
    title: "Chỉnh sửa sản phẩm",
    description: "Cập nhật thông tin sản phẩm",
  },
  "inventory.purchase-orders": {
    component: InventoryPurchaseOrdersPage,
    permissions: ["inventory.access", "purchase-orders.view"],
    category: "inventory",
    title: "Đơn mua hàng",
    description: "Quản lý đơn mua hàng từ nhà cung cấp",
  },
  "inventory.combos": {
    component: ComboListPage,
    permissions: ["inventory.access", "products.view"],
    category: "inventory",
    title: "Quản lý Combo",
    description: "Tạo và quản lý combo khuyến mãi sản phẩm",
  },
  "inventory.lot-detail": {
    component: ProductLotDetailPage,
    permissions: ["inventory.access", "products.view"],
    category: "inventory",
    title: "Chi tiết Lô hàng",
    description: "Xem chi tiết thông tin lô hàng và tồn kho",
  },

  // ==================== FINANCIAL SCREENS ====================
  "financial.ledger": {
    component: CashLedgerPage,
    permissions: ["financial.access", "ledger.view"],
    category: "financial",
    title: "Sổ cái",
    description: "Quản lý sổ cái và giao dịch tài chính",
  },
  "financial.transactions": {
    component: FinancialTransactionsPage,
    permissions: ["financial.access", "transactions.view"],
    category: "financial",
    title: "Giao dịch Tài chính",
    description: "Xem và quản lý các giao dịch tài chính",
  },
  "financial.funds": {
    component: FundManagementPage,
    permissions: ["financial.access", "funds.manage"],
    category: "financial",
    title: "Quản lý Quỹ",
    description: "Quản lý quỹ và ngân sách",
  },

  // ==================== MARKETING SCREENS ====================
  "marketing.dashboard": {
    component: MarketingDashboardPage,
    permissions: ["marketing.access", "marketing.dashboard"],
    category: "marketing",
    title: "Marketing Dashboard",
    description: "Tổng quan hoạt động marketing",
  },
  "marketing.promotions": {
    component: PromotionsPage,
    permissions: ["marketing.access", "promotions.view"],
    category: "marketing",
    title: "Khuyến mãi",
    description: "Quản lý chương trình khuyến mãi",
  },
  "marketing.promotion-detail": {
    component: PromotionDetailPage,
    permissions: ["marketing.access", "promotions.view"],
    category: "marketing",
    title: "Chi tiết Khuyến mãi",
    description: "Xem chi tiết chương trình khuyến mãi",
  },
  "marketing.vouchers": {
    component: VouchersPage,
    permissions: ["marketing.access", "vouchers.view"],
    category: "marketing",
    title: "Phiếu giảm giá",
    description: "Quản lý phiếu giảm giá",
  },
  "marketing.point-rules": {
    component: PointRulesPage,
    permissions: ["marketing.access", "point-rules.view"],
    category: "marketing",
    title: "Quy tắc Tích điểm",
    description: "Quản lý quy tắc tích điểm và đổi điểm",
  },
  "marketing.point-rule-detail": {
    component: PointRuleDetailPage,
    permissions: ["marketing.access", "point-rules.view"],
    category: "marketing",
    title: "Chi tiết Quy tắc Tích điểm",
    description: "Xem và chỉnh sửa quy tắc tích điểm",
  },
  "marketing.campaigns": {
    component: CampaignsPage,
    permissions: ["marketing.access", "campaigns.view"],
    category: "marketing",
    title: "Chiến dịch Marketing",
    description: "Quản lý chiến dịch marketing",
  },
  "marketing.campaign-detail": {
    component: CampaignDetailPage,
    permissions: ["marketing.access", "campaigns.view"],
    category: "marketing",
    title: "Chi tiết Chiến dịch",
    description: "Xem chi tiết chiến dịch marketing",
  },
  "marketing.customer-segments": {
    component: CustomerSegmentsPage,
    permissions: ["marketing.access", "customers.segment"],
    category: "marketing",
    title: "Phân khúc Khách hàng",
    description: "Quản lý phân khúc khách hàng",
  },
  "marketing.content-library": {
    component: ContentLibraryPage,
    permissions: ["marketing.access", "content.manage"],
    category: "marketing",
    title: "Thư viện Nội dung",
    description: "Quản lý thư viện nội dung marketing",
  },
  "marketing.chatbot": {
    component: ChatbotManagementPage,
    permissions: ["marketing.access", "chatbot.manage"],
    category: "marketing",
    title: "Quản lý Chatbot",
    description: "Cấu hình và quản lý chatbot",
  },

  // ==================== MANAGEMENT SCREENS ====================
  "management.dashboard": {
    component: DashboardPage,
    permissions: ["management.access", "dashboard.view"],
    category: "management",
    title: "Tổng quan",
    description: "Bảng điều khiển tổng quan hệ thống",
  },
  "management.employees": {
    component: EmployeesPage,
    permissions: ["management.access", "employees.view"],
    category: "management",
    title: "Quản lý Nhân viên",
    description: "Quản lý thông tin nhân viên",
  },
  "management.employees.create": {
    component: CreateEmployeePage,
    permissions: ["management.access", "employees.view", "employees.create"],
    category: "management",
    title: "Thêm Nhân Viên Mới",
    description: "Tạo nhân viên mới trong hệ thống",
  },
  "management.employees.edit": {
    component: EditEmployeePage,
    permissions: ["management.access", "employees.view", "employees.update"],
    category: "management",
    title: "Chỉnh Sửa Nhân Viên",
    description: "Cập nhật thông tin nhân viên",
  },
  "management.users": {
    component: UserManagementPage,
    permissions: ["management.access", "users.view"],
    category: "management",
    title: "Quản lý Tài khoản",
    description: "Quản lý tài khoản đăng nhập và phân quyền",
  },
  "management.rooms": {
    component: RoomManagementPage,
    permissions: ["management.access", "rooms.view"],
    category: "management",
    title: "Quản lý Phòng ban",
    description: "Quản lý phòng ban và cơ cấu tổ chức",
  },
  "management.roles": {
    component: RoleManagementPage,
    permissions: ["management.access", "roles.view"],
    category: "management",
    title: "Quản lý Vai trò",
    description: "Quản lý vai trò và phân quyền trong hệ thống",
  },
  "management.user-roles": {
    component: UserRoleManagementPage,
    permissions: ["management.access", "users.view"],
    category: "management",
    title: "Quản lý Người dùng & Phân quyền",
    description:
      "Quản lý tài khoản người dùng và vai trò nhân viên trong hệ thống",
  },

  // ==================== SALARY & COMPENSATION SCREENS ====================
  "salary.management": {
    component: SalaryManagementPage,
    permissions: ["salary.view", "salary.manage"],
    category: "salary",
    title: "Quản lý Lương & Thưởng",
    description:
      "Quản lý lương bổng, hoa hồng, KPIs và chính sách thâm niên cho nhân viên",
  },

  // ==================== STAFF DASHBOARD SCREENS ====================
  "staff.sales-dashboard": {
    component: SalesStaffDashboardPage,
    permissions: ["sales.dashboard"],
    category: "staff",
    title: "Dashboard Nhân viên Bán hàng",
    description: "Danh sách công việc và thống kê cho nhân viên bán hàng",
  },
  "staff.inventory-dashboard": {
    component: InventoryStaffDashboardPage,
    permissions: ["inventory.dashboard"],
    category: "staff",
    title: "Dashboard Nhân viên Kho",
    description: "Danh sách công việc và thống kê cho nhân viên kho",
  },
  "staff.delivery-dashboard": {
    component: DeliveryStaffDashboardPage,
    permissions: ["delivery.dashboard"],
    category: "staff",
    title: "Dashboard Nhân viên Giao hàng",
    description: "Lịch trình giao hàng và thống kê cho nhân viên giao hàng",
  },

  // ==================== WAREHOUSE SCREENS ====================
  "warehouse.purchase-orders": {
    component: WarehousePurchaseOrdersPage,
    permissions: ["warehouse.access", "warehouse.purchase-orders.view"],
    category: "warehouse",
    title: "Đơn Đặt Hàng",
    description: "Quản lý đơn đặt hàng từ nhà cung cấp",
  },
  "warehouse.purchase-orders.edit": {
    component: EditPurchaseOrderPage,
    permissions: ["warehouse.access", "warehouse.purchase-orders.edit"],
    category: "warehouse",
    title: "Chỉnh Sửa Đơn Đặt Hàng",
    description: "Cập nhật thông tin đơn đặt hàng",
  },
  "warehouse.receiving": {
    component: PurchaseOrderReceivingPage,
    permissions: ["warehouse.access", "warehouse.receiving.access"],
    category: "warehouse",
    title: "Nhận Hàng",
    description: "Quét mã vạch và xác nhận nhận hàng từ nhà cung cấp",
  },
  "warehouse.receiving.detail": {
    component: PurchaseOrderReceivingDetailPage,
    permissions: ["warehouse.access", "warehouse.receiving.access"],
    category: "warehouse",
    title: "Xác Nhận Nhận Hàng",
    description: "Xác nhận nhận hàng cho đơn đặt hàng cụ thể",
  },
  "warehouse.receiving.create": {
    component: CreatePurchaseImportPage,
    permissions: ["warehouse.access", "warehouse.receiving.access"],
    category: "warehouse",
    title: "Tạo Phiếu Nhập Hàng Mới",
    description: "Tạo phiếu nhập hàng trực tiếp vào kho",
  },
  "warehouse.picking": {
    component: SalesOrderPickingPage,
    permissions: ["warehouse.access", "warehouse.picking.access"],
    category: "warehouse",
    title: "Xuất Hàng / Lấy Hàng",
    description: "Quét mã vạch và xác nhận lấy hàng để chuẩn bị giao",
  },
  "warehouse.suppliers": {
    component: SuppliersPage,
    permissions: ["warehouse.access", "warehouse.suppliers.view"],
    category: "warehouse",
    title: "Nhà Cung Cấp",
    description: "Quản lý thông tin nhà cung cấp và đối tác",
  },
  "warehouse.suppliers.form": {
    component: SupplierFormPage,
    permissions: ["warehouse.access", "warehouse.suppliers.view"],
    category: "warehouse",
    title: "Thông Tin Nhà Cung Cấp",
    description: "Thêm hoặc chỉnh sửa thông tin nhà cung cấp",
  },
  "warehouse.suppliers.promotions": {
    component: SupplierPromotionsPage,
    permissions: ["warehouse.access", "warehouse.suppliers.view"],
    category: "warehouse",
    title: "Chương Trình Khuyến Mại",
    description:
      "Quản lý chương trình khuyến mại và chiết khấu của nhà cung cấp",
  },
  "warehouse.vat-inventory": {
    component: VATInventoryDashboard,
    permissions: ["warehouse.access", "warehouse.vat.view"],
    category: "warehouse",
    title: "Kho VAT",
    description: "Quản lý tồn kho VAT và đối chiếu với tồn kho thực tế",
  },
  "warehouse.vat-reconciliation": {
    component: VATReconciliationPage,
    permissions: ["warehouse.access", "warehouse.vat.reconcile"],
    category: "warehouse",
    title: "Đối Chiếu VAT",
    description: "Đối chiếu hóa đơn VAT mua vào và bán ra",
  },
  "warehouse.vat-invoice-input": {
    component: VATInvoiceInputPage,
    permissions: ["warehouse.access", "warehouse.vat.create-invoice"],
    category: "warehouse",
    title: "Nhập Hóa Đơn VAT",
    description: "Nhập hóa đơn VAT từ nhà cung cấp",
  },
  "warehouse.vat-invoice-pos": {
    component: VATInvoicePOSPage,
    permissions: ["warehouse.access", "warehouse.vat.create-invoice"],
    category: "warehouse",
    title: "Xuất Hóa Đơn VAT cho POS",
    description: "Xuất hóa đơn VAT sau khi khách hàng thanh toán (POS)",
  },
  "warehouse.vat-invoice-b2b": {
    component: VATInvoiceB2BPage,
    permissions: ["warehouse.access", "warehouse.vat.create-invoice"],
    category: "warehouse",
    title: "Xuất Hóa Đơn VAT cho B2B",
    description: "Kế toán vào khi cần để xuất VAT cho đơn hàng B2B",
  },
  "warehouse.transfers": {
    component: WarehouseTransfersListPage,
    permissions: ["warehouse.access", "warehouse.transfers.view"],
    category: "warehouse",
    title: "Chuyển kho",
    description: "Quản lý phiếu chuyển kho giữa các kho",
  },
  "warehouse.transfers.detail": {
    component: WarehouseTransferDetailPage,
    permissions: ["warehouse.access", "warehouse.transfers.view"],
    category: "warehouse",
    title: "Chi tiết Phiếu chuyển kho",
    description: "Xem chi tiết phiếu chuyển kho",
  },
  "warehouse.transfers.create": {
    component: CreateWarehouseTransferPage,
    permissions: ["warehouse.access", "warehouse.transfers.create"],
    category: "warehouse",
    title: "Tạo Phiếu chuyển kho",
    description: "Tạo phiếu chuyển kho mới",
  },
};

// ==================== PERMISSION CATEGORIES ====================
export const PERMISSION_CATEGORIES = {
  AUTHENTICATION: "auth",
  POS: "pos",
  B2B: "b2b",
  MEDICAL: "medical",
  INVENTORY: "inventory",
  WAREHOUSE: "warehouse",
  FINANCIAL: "financial",
  MARKETING: "marketing",
  MANAGEMENT: "management",
  REPORTS: "reports",
} as const;

// ==================== DETAILED PERMISSIONS REGISTRY ====================
export const PERMISSIONS = {
  // Authentication
  "auth.login": "Đăng nhập hệ thống",
  "auth.logout": "Đăng xuất hệ thống",

  // POS Permissions
  "pos.access": "Truy cập hệ thống POS",
  "sales.create": "Tạo đơn hàng bán lẻ",
  "sales.view": "Xem đơn hàng bán lẻ",
  "sales.edit": "Chỉnh sửa đơn hàng",
  "sales.delete": "Xóa đơn hàng",

  // B2B Permissions
  "b2b.access": "Truy cập chức năng B2B",
  "b2b.view": "Xem danh sách đơn hàng B2B",
  "b2b.create": "Tạo đơn hàng B2B",
  "b2b.edit": "Chỉnh sửa đơn hàng B2B",
  "b2b.delete": "Xóa đơn hàng B2B",
  "b2b.notification": "Nhận thông báo B2B realtime",
  "quotes.view": "Xem báo giá B2B",
  "quotes.create": "Tạo báo giá B2B",
  "quotes.edit": "Chỉnh sửa báo giá",
  "quotes.delete": "Xóa báo giá",
  "quotes.approve": "Phê duyệt báo giá",
  "quotes.stage.update": "Cập nhật trạng thái báo giá",

  // Medical Permissions
  "medical.access": "Truy cập chức năng y tế",
  "patients.view": "Xem thông tin bệnh nhân",
  "patients.create": "Tạo hồ sơ bệnh nhân",
  "patients.edit": "Chỉnh sửa thông tin bệnh nhân",
  "patients.delete": "Xóa hồ sơ bệnh nhân",
  "appointments.view": "Xem lịch hẹn",
  "appointments.create": "Tạo lịch hẹn",
  "appointments.edit": "Chỉnh sửa lịch hẹn",
  "medical-records.view": "Xem hồ sơ y tế",
  "medical-records.create": "Tạo hồ sơ y tế",
  "medical-records.edit": "Chỉnh sửa hồ sơ y tế",

  // Inventory Permissions
  "inventory.access": "Truy cập quản lý kho",
  "inventory.manage": "Quản lý đầy đủ kho hàng",
  "products.view": "Xem danh sách sản phẩm",
  "products.create": "Thêm sản phẩm mới",
  "products.update": "Cập nhật thông tin sản phẩm",
  "products.edit": "Chỉnh sửa thông tin sản phẩm",
  "products.delete": "Xóa sản phẩm",
  "purchase-orders.view": "Xem đơn mua hàng",
  "purchase-orders.create": "Tạo đơn mua hàng",
  "purchase-orders.approve": "Phê duyệt đơn mua hàng",

  // Warehouse Permissions
  "warehouse.access": "Truy cập quản lý kho vận",
  "warehouse.purchase-orders.view": "Xem đơn đặt hàng",
  "warehouse.purchase-orders.create": "Tạo đơn đặt hàng",
  "warehouse.purchase-orders.edit": "Chỉnh sửa đơn đặt hàng",
  "warehouse.purchase-orders.auto-create": "Tạo dự trù tự động",
  "warehouse.receiving.access": "Truy cập chức năng nhận hàng",
  "warehouse.receiving.confirm": "Xác nhận nhận hàng",
  "warehouse.picking.access": "Truy cập chức năng xuất hàng",
  "warehouse.picking.confirm": "Xác nhận xuất hàng",
  "warehouse.suppliers.view": "Xem danh sách nhà cung cấp",
  "warehouse.suppliers.create": "Thêm nhà cung cấp mới",
  "warehouse.suppliers.edit": "Chỉnh sửa thông tin nhà cung cấp",
  "warehouse.suppliers.delete": "Xóa nhà cung cấp",
  "warehouse.vat.view": "Xem kho VAT",
  "warehouse.vat.reconcile": "Đối chiếu VAT",
  "warehouse.vat.create-invoice": "Tạo và quản lý hóa đơn VAT",
  "warehouse.vat.invoice-input": "Nhập hóa đơn VAT từ supplier",
  "warehouse.vat.invoice-output": "Xuất hóa đơn VAT cho B2B và POS",
  "warehouse.transfers.view": "Xem phiếu chuyển kho",
  "warehouse.transfers.create": "Tạo phiếu chuyển kho",
  "warehouse.transfers.edit": "Chỉnh sửa phiếu chuyển kho",
  "warehouse.transfers.delete": "Xóa phiếu chuyển kho",
  "warehouse.transfers.approve": "Duyệt phiếu chuyển kho",
  "warehouse.transfers.send": "Xuất kho chuyển hàng",
  "warehouse.transfers.receive": "Nhận hàng chuyển kho",
  "warehouse.transfers.cancel": "Hủy phiếu chuyển kho",

  // Delivery & Shipping Permissions
  "delivery.access": "Truy cập chức năng giao hàng",
  "shipping.manage": "Quản lý vận chuyển",
  "shipping.update": "Cập nhật trạng thái vận chuyển",

  // Staff Dashboard Permissions
  "sales.dashboard": "Dashboard nhân viên bán hàng",
  "inventory.dashboard": "Dashboard nhân viên kho",
  "delivery.dashboard": "Dashboard nhân viên giao hàng",

  // Financial Permissions
  "financial.access": "Truy cập chức năng tài chính",
  "ledger.view": "Xem sổ cái",
  "ledger.edit": "Chỉnh sửa sổ cái",
  "transactions.view": "Xem giao dịch tài chính",
  "transactions.create": "Tạo giao dịch tài chính",
  "funds.view": "Xem thông tin quỹ",
  "funds.manage": "Quản lý quỹ",

  // Marketing Permissions
  "marketing.access": "Truy cập chức năng marketing",
  "marketing.dashboard": "Xem dashboard marketing",
  "promotions.view": "Xem chương trình khuyến mãi",
  "promotions.create": "Tạo chương trình khuyến mãi",
  "promotions.edit": "Chỉnh sửa khuyến mãi",
  "vouchers.view": "Xem phiếu giảm giá",
  "vouchers.create": "Tạo phiếu giảm giá",
  "campaigns.view": "Xem chiến dịch marketing",
  "campaigns.create": "Tạo chiến dịch marketing",
  "customers.segment": "Phân khúc khách hàng",
  "content.manage": "Quản lý nội dung",
  "chatbot.manage": "Quản lý chatbot",

  // Management Permissions
  "management.access": "Truy cập quản lý hệ thống",
  "dashboard.view": "Xem dashboard tổng quan",
  "employees.view": "Xem danh sách nhân viên",
  "employees.create": "Thêm nhân viên mới",
  "employees.edit": "Chỉnh sửa thông tin nhân viên",
  "employees.delete": "Xóa nhân viên",
  "employees.permissions": "Quản lý quyền của nhân viên",
  "users.view": "Xem danh sách tài khoản",
  "users.create": "Tạo tài khoản mới",
  "users.edit": "Chỉnh sửa tài khoản",
  "users.delete": "Xóa tài khoản",
  "users.manage": "Quản lý tài khoản người dùng",
  "rooms.view": "Xem danh sách phòng ban",
  "rooms.create": "Tạo phòng ban mới",
  "rooms.edit": "Chỉnh sửa thông tin phòng ban",
  "roles.view": "Xem danh sách vai trò",
  "roles.create": "Tạo vai trò mới",
  "roles.edit": "Chỉnh sửa vai trò",
  "roles.delete": "Xóa vai trò",
  "settings.access": "Truy cập cài đặt hệ thống",

  // Salary & Compensation Permissions
  "salary.view": "Xem thông tin lương & thưởng",
  "salary.manage": "Quản lý hệ thống lương & thưởng",
  "salary.create": "Tạo cấu trúc lương mới",
  "salary.edit": "Chỉnh sửa cấu trúc lương",
  "salary.delete": "Xóa cấu trúc lương",
  "commission.view": "Xem hoa hồng & KPIs",
  "commission.calculate": "Tính toán hoa hồng",
  "seniority.view": "Xem chính sách thâm niên",
  "seniority.manage": "Quản lý chính sách thâm niên",
} as const;

// ==================== ROLE-BASED PERMISSION PRESETS ====================
export const ROLE_PERMISSIONS = {
  "super-admin": Object.keys(PERMISSIONS),

  admin: [
    "management.access",
    "dashboard.view",
    "employees.view",
    "employees.create",
    "employees.edit",
    "users.view",
    "users.create",
    "users.edit",
    "users.delete",
    "users.manage",
    "roles.view",
    "roles.create",
    "roles.edit",
    "roles.delete",
    "salary.view",
    "salary.manage",
    "salary.create",
    "salary.edit",
    "salary.delete",
    "commission.view",
    "commission.calculate",
    "seniority.view",
    "seniority.manage",
    "inventory.access",
    "products.view",
    "products.create",
    "products.update",
    "products.edit",
    "financial.access",
    "ledger.view",
    "transactions.view",
    "funds.view",
    "marketing.access",
    "promotions.view",
    "campaigns.view",
    "b2b.access",
    "b2b.notification",
    "quotes.view",
    "quotes.create",
    "medical.access",
    "patients.view",
    "patients.create",
    "patients.edit",
    "patients.delete",
  ],

  "sales-manager": [
    "pos.access",
    "sales.create",
    "sales.view",
    "sales.edit",
    "b2b.access",
    "b2b.view",
    "b2b.create",
    "b2b.edit",
    "b2b.delete",
    "b2b.notification",
    "quotes.view",
    "quotes.create",
    "quotes.edit",
    "quotes.delete",
    "quotes.stage.update",
    "customers.segment",
    "marketing.dashboard",
  ],

  "medical-staff": [
    "medical.access",
    "patients.view",
    "patients.create",
    "patients.edit",
    "appointments.view",
    "appointments.create",
    "appointments.edit",
    "medical-records.view",
    "medical-records.create",
  ],

  "inventory-manager": [
    "inventory.access",
    "products.view",
    "products.create",
    "products.update",
    "products.edit",
    "purchase-orders.view",
    "purchase-orders.create",
    "purchase-orders.approve",
    "warehouse.access",
    "warehouse.purchase-orders.view",
    "warehouse.purchase-orders.create",
    "warehouse.purchase-orders.edit",
    "warehouse.purchase-orders.auto-create",
    "warehouse.receiving.access",
    "warehouse.receiving.confirm",
    "warehouse.picking.access",
    "warehouse.picking.confirm",
    "warehouse.suppliers.view",
    "warehouse.suppliers.create",
    "warehouse.suppliers.edit",
    "warehouse.vat.view",
  ],

  "inventory-staff": [
    "inventory.access",
    "products.view",
    "products.create",
    "products.update",
    "products.edit",
    "purchase-orders.view",
    "purchase-orders.create",
    "b2b.access",
    "b2b.view",
    "quotes.edit",
    "inventory.dashboard",
    "warehouse.access",
    "warehouse.purchase-orders.view",
    "warehouse.receiving.access",
    "warehouse.receiving.confirm",
    "warehouse.picking.access",
    "warehouse.picking.confirm",
    "warehouse.suppliers.view",
  ],

  "warehouse-manager": [
    "warehouse.access",
    "warehouse.purchase-orders.view",
    "warehouse.purchase-orders.create",
    "warehouse.purchase-orders.edit",
    "warehouse.purchase-orders.auto-create",
    "warehouse.receiving.access",
    "warehouse.receiving.confirm",
    "warehouse.picking.access",
    "warehouse.picking.confirm",
    "warehouse.suppliers.view",
    "warehouse.suppliers.create",
    "warehouse.suppliers.edit",
    "warehouse.suppliers.delete",
    "warehouse.vat.view",
    "warehouse.vat.reconcile",
    "warehouse.vat.create-invoice",
    "warehouse.transfers.view",
    "warehouse.transfers.create",
    "warehouse.transfers.edit",
    "warehouse.transfers.delete",
    "warehouse.transfers.approve",
    "warehouse.transfers.send",
    "warehouse.transfers.receive",
    "warehouse.transfers.cancel",
    "inventory.access",
    "products.view",
  ],

  "warehouse-staff": [
    "warehouse.access",
    "warehouse.purchase-orders.view",
    "warehouse.receiving.access",
    "warehouse.receiving.confirm",
    "warehouse.picking.access",
    "warehouse.picking.confirm",
    "warehouse.suppliers.view",
    "warehouse.vat.view",
    "warehouse.transfers.view",
    "warehouse.transfers.send",
    "warehouse.transfers.receive",
  ],

  "delivery-staff": [
    "delivery.access",
    "shipping.manage",
    "shipping.update",
    "b2b.access",
    "b2b.view",
    "quotes.edit",
    "delivery.dashboard",
  ],

  "sales-staff": [
    "pos.access",
    "sales.create",
    "sales.view",
    "b2b.access",
    "b2b.view",
    "b2b.create",
    "b2b.notification",
    "quotes.view",
    "quotes.create",
    "quotes.edit",
    "patients.view",
    "patients.create",
    "patients.edit",
    "medical.access",
    "appointments.view",
    "appointments.create",
    "appointments.edit",
    "sales.dashboard",
  ],

  "marketing-manager": [
    "marketing.access",
    "marketing.dashboard",
    "promotions.view",
    "promotions.create",
    "vouchers.view",
    "vouchers.create",
    "campaigns.view",
    "campaigns.create",
    "customers.segment",
    "content.manage",
    "chatbot.manage",
  ],

  accountant: [
    "financial.access",
    "ledger.view",
    "ledger.edit",
    "transactions.view",
    "transactions.create",
    "funds.view",
    "warehouse.access",
    "warehouse.vat.view",
    "warehouse.vat.reconcile",
    "warehouse.vat.create-invoice",
    "warehouse.vat.invoice-input",
    "warehouse.vat.invoice-output",
    "warehouse.purchase-orders.view",
  ],
};

// ==================== HELPER FUNCTIONS ====================

// Export individual screens for direct import
export {
  // Auth
  LoginPage,
  // POS
  PosPage,
  // B2B
  B2BOrderManagementPage,
  B2BOrderListPage,
  QuickQuotePage,
  CreateOrderPage,
  EditB2BOrderPage,
  InventoryB2BOrdersPage,
  // Medical
  PatientsPage,
  PatientDetailPage,
  MedicalRecordsPage,
  SchedulingPage,
  // Inventory
  ProductsPage,
  ProductListPage,
  CreateProductPage,
  EditProductPage,
  InventoryPurchaseOrdersPage,
  ComboListPage,
  ProductLotDetailPage,
  // Financial
  CashLedgerPage,
  FinancialTransactionsPage,
  FundManagementPage,
  // Marketing
  PromotionsPage,
  PromotionDetailPage,
  VouchersPage,
  MarketingDashboardPage,
  CampaignsPage,
  CampaignDetailPage,
  CustomerSegmentsPage,
  ContentLibraryPage,
  ChatbotManagementPage,
  // Management
  DashboardPage,
  EmployeesPage,
  CreateEmployeePage,
  EditEmployeePage,
  UserManagementPage,
  RoomManagementPage,
  RoleManagementPage,
  EmployeeRolesPage,
  UserRoleManagementPage,
  EmployeeManagementPage,
  // Staff Dashboards
  SalesStaffDashboardPage,
  InventoryStaffDashboardPage,
  DeliveryStaffDashboardPage,
  // Warehouse
  WarehousePurchaseOrdersPage,
  EditPurchaseOrderPage,
  PurchaseOrderReceivingPage,
  PurchaseOrderReceivingDetailPage,
  CreatePurchaseImportPage,
  SalesOrderPickingPage,
  SuppliersPage,
  SupplierFormPage,
  SupplierPromotionsPage,
  VATInventoryDashboard,
  VATReconciliationPage,
  VATInvoiceInputPage,
  VATInvoicePOSPage,
  VATInvoiceB2BPage,
  WarehouseTransfersListPage,
  WarehouseTransferDetailPage,
  CreateWarehouseTransferPage,
};

// Helper function to get screen by key
export const getScreen = (screenKey: string): ScreenConfig | undefined => {
  return SCREEN_REGISTRY[screenKey];
};

// Helper function to get screens by category
export const getScreensByCategory = (
  category: string,
): Record<string, ScreenConfig> => {
  return Object.entries(SCREEN_REGISTRY)
    .filter(([_, config]) => config.category === category)
    .reduce((acc, [key, config]) => ({ ...acc, [key]: config }), {});
};

// Helper function to check if user has permission for screen
export const hasScreenPermission = (
  screenKey: string,
  userPermissions: string[],
): boolean => {
  const screen = SCREEN_REGISTRY[screenKey];
  if (!screen) return false;

  // If no permissions required, allow access
  if (screen.permissions.length === 0) return true;

  // Check if user has ALL required permissions
  return screen.permissions.every((permission) =>
    userPermissions.includes(permission),
  );
};

// Helper function to get available screens for user
export const getAvailableScreens = (
  userPermissions: string[],
): Record<string, ScreenConfig> => {
  return Object.entries(SCREEN_REGISTRY)
    .filter(([key, _]) => hasScreenPermission(key, userPermissions))
    .reduce((acc, [key, config]) => ({ ...acc, [key]: config }), {});
};

// Helper function to get permissions for role
export const getPermissionsForRole = (role: string): string[] => {
  return ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS] || [];
};
