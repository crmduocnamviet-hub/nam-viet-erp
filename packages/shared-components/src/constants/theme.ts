/**
 * Nam Viet ERP Theme Configuration
 *
 * File này định nghĩa tất cả màu sắc và theme cho toàn bộ ứng dụng.
 * Muốn thay đổi màu sắc, chỉ cần sửa ở đây.
 */

// ==================== MÀU SẮC THƯƠNG HIỆU ====================
export const BRAND_COLORS = {
  // Màu chủ đạo
  primary: "#1773ad", // Màu xanh dương chủ đạo
  primaryHover: "#1890ff", // Màu xanh sáng khi hover

  // Màu thương hiệu (xanh lá)
  brand: "#00b96b", // Màu xanh lá thương hiệu
  brandHover: "#00d97e", // Màu xanh lá khi hover

  // Màu sidebar
  sidebar: "#001529", // Màu xanh đậm cho sidebar (Ant Design dark theme)
  sidebarSelected: "#00b96b", // Màu item được chọn trong sidebar

  // Màu nền
  background: "#f0f2f5", // Màu nền chính
  contentBackground: "#ffffff", // Màu nền content
  contentLayoutBackground: "#f5f5f5", // Màu nền content layout

  // Màu border
  border: "#c5c5c5", // Màu border (Github-style)
  borderLight: "#d9d9d9", // Màu border nhạt

  // Màu text
  textPrimary: "#333333", // Màu chữ chính
  textSecondary: "rgba(0, 0, 0, 0.65)", // Màu chữ phụ
  textDisabled: "rgba(0, 0, 0, 0.25)", // Màu chữ disabled

  // Màu sidebar text
  sidebarText: "rgba(255, 255, 255, 0.75)", // Màu chữ sidebar thường
  sidebarTextHover: "#ffffff", // Màu chữ sidebar khi hover
  sidebarTextSelected: "#ffffff", // Màu chữ sidebar khi được chọn

  // Màu trạng thái
  success: "#52c41a",
  warning: "#faad14",
  error: "#ff4d4f",
  info: "#1890ff",
} as const;

// ==================== ANT DESIGN THEME CONFIG ====================
export const getNamVietTheme = () => ({
  token: {
    colorBgLayout: BRAND_COLORS.background,
    colorPrimary: BRAND_COLORS.brand, // Màu xanh lá thương hiệu cho primary buttons
    borderRadius: 5,
    // Button colors
    colorSuccess: BRAND_COLORS.brand,
    colorInfo: BRAND_COLORS.primary, // Xanh dương cho info buttons
    colorWarning: BRAND_COLORS.warning,
    colorError: BRAND_COLORS.error,
  },
  components: {
    Layout: {
      headerBg: BRAND_COLORS.contentBackground,
      siderBg: BRAND_COLORS.sidebar,
      triggerBg: BRAND_COLORS.sidebar,
    },
    Menu: {
      // Dark theme menu (sidebar)
      darkItemBg: BRAND_COLORS.sidebar,
      darkSubMenuItemBg: BRAND_COLORS.sidebar,
      darkItemColor: BRAND_COLORS.sidebarText,
      darkItemHoverBg: "rgba(255, 255, 255, 0.15)",
      darkItemHoverColor: BRAND_COLORS.sidebarTextHover,
      darkItemSelectedBg: BRAND_COLORS.sidebarSelected,
      darkItemSelectedColor: BRAND_COLORS.sidebarTextSelected,
    },
    Button: {
      // Primary button - dùng màu brand (xanh lá)
      primaryColor: "#ffffff",
      primaryBg: BRAND_COLORS.brand,
      primaryHoverBg: BRAND_COLORS.brandHover,
      primaryActiveBg: BRAND_COLORS.brand,
      // Default button
      defaultBg: BRAND_COLORS.contentBackground,
      defaultColor: BRAND_COLORS.textPrimary,
      defaultBorderColor: BRAND_COLORS.borderLight,
      // Hover states
      defaultHoverBg: "#fafafa",
      defaultHoverColor: BRAND_COLORS.primary,
      defaultHoverBorderColor: BRAND_COLORS.primary,
      // Active states
      defaultActiveBg: "#f0f0f0",
      defaultActiveColor: BRAND_COLORS.primary,
      defaultActiveBorderColor: BRAND_COLORS.primary,
    },
    Input: {
      hoverBorderColor: BRAND_COLORS.primary,
      activeBorderColor: BRAND_COLORS.primary,
    },
    Select: {
      hoverBorderColor: BRAND_COLORS.primary,
      activeBorderColor: BRAND_COLORS.primary,
    },
    Table: {
      headerBg: "#fafafa",
      headerColor: BRAND_COLORS.textPrimary,
    },
  },
});

// ==================== CSS VARIABLES (cho CSS files) ====================
export const CSS_VARIABLES = {
  "--brand-primary": BRAND_COLORS.primary,
  "--brand-primary-hover": BRAND_COLORS.primaryHover,
  "--brand-color": BRAND_COLORS.brand,
  "--brand-color-hover": BRAND_COLORS.brandHover,
  "--sidebar-bg": BRAND_COLORS.sidebar,
  "--sidebar-selected": BRAND_COLORS.sidebarSelected,
  "--content-bg": BRAND_COLORS.contentBackground,
  "--content-layout-bg": BRAND_COLORS.contentLayoutBackground,
  "--border-color": BRAND_COLORS.border,
  "--border-light": BRAND_COLORS.borderLight,
  "--text-primary": BRAND_COLORS.textPrimary,
  "--text-secondary": BRAND_COLORS.textSecondary,
} as const;

// ==================== EXPORT TYPE ====================
export type BrandColors = typeof BRAND_COLORS;
export type NamVietTheme = ReturnType<typeof getNamVietTheme>;
