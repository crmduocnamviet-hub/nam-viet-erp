// Screen Imports - Authentication
import LoginPage from "./auth/LoginPage";

// Screen Imports - POS
import PosPage from "./pos/PosPage";

// Screen Imports - B2B
import B2BOrderManagementPage from "./b2b/B2BOrderManagementPage";
import B2BOrderListPage from "./b2b/B2BOrderListPage";
import QuickQuotePage from "./b2b/QuickQuotePage";
import CreateOrderPage from "./b2b/CreateOrderPage";

// Screen Imports - Medical
import PatientsPage from "./medical/PatientsPage";
import PatientDetailPage from "./medical/PatientDetailPage";
import MedicalRecordsPage from "./medical/MedicalRecordsPage";
import SchedulingPage from "./medical/SchedulingPage";

// Screen Imports - Inventory
import ProductsPage from "./inventory/ProductsPage";
import PurchaseOrdersPage from "./inventory/PurchaseOrdersPage";

// Screen Imports - Financial
import CashLedgerPage from "./financial/CashLedgerPage";
import FinancialTransactionsPage from "./financial/FinancialTransactionsPage";
import FundManagementPage from "./financial/FundManagementPage";

// Screen Imports - Marketing
import PromotionsPage from "./marketing/PromotionsPage";
import PromotionDetailPage from "./marketing/PromotionDetailPage";
import VouchersPage from "./marketing/VouchersPage";
import MarketingDashboardPage from "./marketing/MarketingDashboardPage";
import CampaignsPage from "./marketing/CampaignsPage";
import CampaignDetailPage from "./marketing/CampaignDetailPage";
import CustomerSegmentsPage from "./marketing/CustomerSegmentsPage";
import ContentLibraryPage from "./marketing/ContentLibraryPage";
import ChatbotManagementPage from "./marketing/ChatbotManagementPage";

// Screen Imports - Management
import DashboardPage from "./management/DashboardPage";
import EmployeesPage from "./management/EmployeesPage";
import RoomManagementPage from "./management/RoomManagementPage";

// Screen Imports - Staff Dashboards
import SalesStaffDashboardPage from "./staff/SalesStaffDashboardPage";
import InventoryStaffDashboardPage from "./staff/InventoryStaffDashboardPage";
import DeliveryStaffDashboardPage from "./staff/DeliveryStaffDashboardPage";

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
  "inventory.purchase-orders": {
    component: PurchaseOrdersPage,
    permissions: ["inventory.access", "purchase-orders.view"],
    category: "inventory",
    title: "Đơn mua hàng",
    description: "Quản lý đơn mua hàng từ nhà cung cấp",
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
  "management.rooms": {
    component: RoomManagementPage,
    permissions: ["management.access", "rooms.view"],
    category: "management",
    title: "Quản lý Phòng ban",
    description: "Quản lý phòng ban và cơ cấu tổ chức",
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
};

// ==================== PERMISSION CATEGORIES ====================
export const PERMISSION_CATEGORIES = {
  AUTHENTICATION: "auth",
  POS: "pos",
  B2B: "b2b",
  MEDICAL: "medical",
  INVENTORY: "inventory",
  FINANCIAL: "financial",
  MARKETING: "marketing",
  MANAGEMENT: "management",
  REPORTS: "reports",
} as const;

// ==================== DETAILED PERMISSIONS REGISTRY ====================
export const PERMISSIONS = {
  // Authentication
  "auth.login": "Đăng nhập hệ thống",

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
  "products.edit": "Chỉnh sửa thông tin sản phẩm",
  "products.delete": "Xóa sản phẩm",
  "purchase-orders.view": "Xem đơn mua hàng",
  "purchase-orders.create": "Tạo đơn mua hàng",
  "purchase-orders.approve": "Phê duyệt đơn mua hàng",

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
  "rooms.view": "Xem danh sách phòng ban",
  "rooms.create": "Tạo phòng ban mới",
  "rooms.edit": "Chỉnh sửa thông tin phòng ban",
  "settings.access": "Truy cập cài đặt hệ thống",
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
    "inventory.access",
    "products.view",
    "products.create",
    "products.edit",
    "financial.access",
    "ledger.view",
    "transactions.view",
    "funds.view",
    "marketing.access",
    "promotions.view",
    "campaigns.view",
    "b2b.access",
    "quotes.view",
    "quotes.create",
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
    "products.edit",
    "purchase-orders.view",
    "purchase-orders.create",
    "purchase-orders.approve",
  ],

  "inventory-staff": [
    "inventory.access",
    "products.view",
    "products.create",
    "products.edit",
    "purchase-orders.view",
    "purchase-orders.create",
    "b2b.access",
    "b2b.view",
    "quotes.edit",
    "inventory.dashboard",
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
  // Medical
  PatientsPage,
  PatientDetailPage,
  MedicalRecordsPage,
  SchedulingPage,
  // Inventory
  ProductsPage,
  PurchaseOrdersPage,
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
  RoomManagementPage,
  // Staff Dashboards
  SalesStaffDashboardPage,
  InventoryStaffDashboardPage,
  DeliveryStaffDashboardPage,
};

// Helper function to get screen by key
export const getScreen = (screenKey: string): ScreenConfig | undefined => {
  return SCREEN_REGISTRY[screenKey];
};

// Helper function to get screens by category
export const getScreensByCategory = (
  category: string
): Record<string, ScreenConfig> => {
  return Object.entries(SCREEN_REGISTRY)
    .filter(([_, config]) => config.category === category)
    .reduce((acc, [key, config]) => ({ ...acc, [key]: config }), {});
};

// Helper function to check if user has permission for screen
export const hasScreenPermission = (
  screenKey: string,
  userPermissions: string[]
): boolean => {
  const screen = SCREEN_REGISTRY[screenKey];
  if (!screen) return false;

  // If no permissions required, allow access
  if (screen.permissions.length === 0) return true;

  // Check if user has ALL required permissions
  return screen.permissions.every((permission) =>
    userPermissions.includes(permission)
  );
};

// Helper function to get available screens for user
export const getAvailableScreens = (
  userPermissions: string[]
): Record<string, ScreenConfig> => {
  return Object.entries(SCREEN_REGISTRY)
    .filter(([key, _]) => hasScreenPermission(key, userPermissions))
    .reduce((acc, [key, config]) => ({ ...acc, [key]: config }), {});
};

// Helper function to get permissions for role
export const getPermissionsForRole = (role: string): string[] => {
  return ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS] || [];
};
