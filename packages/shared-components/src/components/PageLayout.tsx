import React from "react";
import { Button, Typography, Space, Breadcrumb } from "antd";
import { ArrowLeftOutlined, HomeOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Title } = Typography;

export interface BreadcrumbItem {
  title: string;
  href?: string;
  icon?: React.ReactNode;
}

interface PageLayoutProps {
  title: string;
  showBackButton?: boolean;
  onBack?: () => void;
  breadcrumbs?: BreadcrumbItem[];
  extra?: React.ReactNode;
  children: React.ReactNode;
}

const PageLayout: React.FC<PageLayoutProps> = ({
  title,
  showBackButton = false,
  onBack,
  breadcrumbs,
  extra,
  children,
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <div style={{ padding: "24px" }}>
      {/* Header Section */}
      <div style={{ marginBottom: 24 }}>
        {/* Breadcrumb */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <Breadcrumb
            style={{ marginBottom: 16 }}
            items={breadcrumbs.map((item) => ({
              title: item.title,
              href: item.href,
              ...(item.icon && { icon: item.icon }),
            }))}
          />
        )}

        {/* Title and Extra Actions */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <Title level={2} style={{ margin: 0 }}>
            {title}
          </Title>

          {extra && <Space>{extra}</Space>}
        </div>
      </div>

      {/* Content Section */}
      <div>{children}</div>
    </div>
  );
};

export default PageLayout;
