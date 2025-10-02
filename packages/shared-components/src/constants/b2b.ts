// B2B Order Stages - Complete workflow from quote to completion
export const B2B_ORDER_STAGES = [
  {
    key: "draft",
    title: "⚫ Nháp",
    description: "Báo giá/đơn hàng đang soạn thảo",
    color: "default",
  },
  {
    key: "sent",
    title: "Đã gửi",
    description: "Báo giá đã gửi cho khách hàng",
    color: "blue",
  },
  {
    key: "negotiating",
    title: "Thương thảo",
    description: "Đang thương thảo điều khoản",
    color: "orange",
  },
  {
    key: "accepted",
    title: "Chấp nhận",
    description: "Báo giá được chấp nhận, chuyển thành đơn hàng",
    color: "green",
  },
  {
    key: "pending_packaging",
    title: "🔵 Chờ đóng gói",
    description: "Đơn hàng chờ xử lý và đóng gói",
    color: "blue",
  },
  {
    key: "packaged",
    title: "🟡 Đã đóng gói & Chờ giao vận",
    description: "Hàng đã đóng gói, chờ giao cho đơn vị vận chuyển",
    color: "orange",
  },
  {
    key: "shipping",
    title: "🚚 Chờ giao tới khách hàng",
    description: "Hàng đang trên đường giao đến khách hàng",
    color: "cyan",
  },
  {
    key: "completed",
    title: "✅ Hoàn tất",
    description: "Đơn hàng đã hoàn tất",
    color: "green",
  },
  {
    key: "rejected",
    title: "Từ chối",
    description: "Báo giá bị từ chối",
    color: "red",
  },
  {
    key: "cancelled",
    title: "❌ Đã hủy",
    description: "Đơn hàng đã bị hủy",
    color: "red",
  },
  {
    key: "expired",
    title: "Hết hạn",
    description: "Báo giá đã hết hạn",
    color: "volcano",
  },
];

export const SALE_STATUSES = [
  "draft",
  "sent",
  "negotiating",
  "accepted",
  "cancelled",
  "rejected",
  "expired",
];
export const INVENTORY_STATUSES = ["accepted", "pending_packaging", "packaged"];
export const DELIVERY_STATUSES = ["packaged", "shipping", "completed"];
