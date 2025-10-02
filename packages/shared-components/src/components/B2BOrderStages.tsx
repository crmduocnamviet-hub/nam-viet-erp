import {
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
} from "@ant-design/icons";

// B2B Order Stages
const B2B_ORDER_STAGES = [
  {
    key: "draft",
    title: "Nháp",
    description: "Báo giá đã gửi, chờ quyết định",
    icon: <FileTextOutlined />,
    color: "default",
    status: "wait",
  },
  {
    key: "sent",
    title: "Đã gửi",
    description: "Báo giá đã gửi cho khách hàng",
    icon: <FileTextOutlined />,
    color: "blue",
    status: "process",
  },
  {
    key: "negotiating",
    title: "Thương thảo",
    description: "Đang thương thảo điều khoản",
    icon: <ClockCircleOutlined />,
    color: "orange",
    status: "process",
  },
  {
    key: "accepted",
    title: "Chấp nhận",
    description: "Báo giá được chấp nhận",
    icon: <CheckCircleOutlined />,
    color: "green",
    status: "finish",
  },
  {
    key: "rejected",
    title: "Từ chối",
    description: "Báo giá bị từ chối",
    icon: <WarningOutlined />,
    color: "red",
    status: "error",
  },
  {
    key: "expired",
    title: "Hết hạn",
    description: "Báo giá đã hết hạn",
    icon: <WarningOutlined />,
    color: "volcano",
    status: "error",
  },
];

export default B2B_ORDER_STAGES;
