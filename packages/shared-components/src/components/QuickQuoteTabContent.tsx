import React, { useMemo } from "react";
import {
  Input,
  Select,
  Row,
  Col,
  Typography,
  List,
  Card,
  Spin,
  Tag,
} from "antd";

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;

// Helper function to validate URLs
const isValidUrl = (string: string): boolean => {
  try {
    const url = new URL(string);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

// Calculate best price logic
const calculateBestPrice = (product: IProduct, promotions: IPromotion[]) => {
  let bestPrice = product.wholesale_price;
  let appliedPromotionName: string | null = null;

  if (bestPrice === null || bestPrice === undefined || bestPrice <= 0) {
    return { finalPrice: 0, originalPrice: 0, promotionApplied: null };
  }

  for (const promo of promotions) {
    const conditions = promo.conditions;
    let isApplicable = true;

    // Check conditions
    if (conditions) {
      const priceGroups = conditions.price_groups;
      if (typeof priceGroups === "string" && priceGroups !== "Bán buôn")
        isApplicable = false;

      const manufacturers = conditions.manufacturers;
      if (
        isApplicable &&
        typeof manufacturers === "string" &&
        product.manufacturer &&
        manufacturers !== product.manufacturer
      )
        isApplicable = false;

      const productCategories = conditions.product_categories;
      if (
        isApplicable &&
        typeof productCategories === "string" &&
        product.category &&
        productCategories !== product.category
      )
        isApplicable = false;
    }

    if (isApplicable) {
      let currentPrice = product.wholesale_price;
      let calculated = false;

      if (
        promo.type === "percentage" &&
        product.wholesale_price !== null &&
        promo.value !== undefined
      ) {
        currentPrice = product.wholesale_price * (1 - promo.value / 100);
        calculated = true;
      } else if (
        promo.type === "fixed_amount" &&
        product.wholesale_price !== null &&
        promo.value !== undefined
      ) {
        currentPrice = product.wholesale_price - promo.value;
        calculated = true;
      } else if (
        promo.type === "order_discount" &&
        conditions &&
        typeof conditions.min_order_value === "number" &&
        conditions.min_order_value > 0 &&
        product.wholesale_price !== null &&
        promo.value !== undefined
      ) {
        const minOrderValue = conditions.min_order_value;
        const discountValue = promo.value;

        const requiredUnits = Math.ceil(
          minOrderValue / product.wholesale_price,
        );
        if (requiredUnits > 0) {
          const perUnitDiscount = discountValue / requiredUnits;
          const roundedUpDiscount = Math.ceil(perUnitDiscount / 1000) * 1000;
          currentPrice = product.wholesale_price - roundedUpDiscount;
          calculated = true;
        }
      }

      if (
        calculated &&
        currentPrice !== null &&
        bestPrice !== null &&
        currentPrice < bestPrice
      ) {
        bestPrice = currentPrice;
        appliedPromotionName = promo.name;
      }
    }
  }

  return {
    finalPrice: Math.round(bestPrice || 0),
    originalPrice: product.wholesale_price || 0,
    promotionApplied: appliedPromotionName,
  };
};

interface QuickQuoteTabContentProps {
  products: IProduct[];
  loading: boolean;
  promotions: IPromotion[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedManufacturer: string | null;
  setSelectedManufacturer: (value: string | null) => void;
  selectedDisease: string | null;
  setSelectedDisease: (value: string | null) => void;
  selectedRoute: string | null;
  setSelectedRoute: (value: string | null) => void;
  manufacturers: { value: string; label: string }[];
  diseases: { value: string; label: string }[];
  routes: { value: string; label: string }[];
  debouncedSearchTerm: string;
}

const QuickQuoteTabContent: React.FC<QuickQuoteTabContentProps> = ({
  products,
  loading,
  promotions,
  searchTerm,
  setSearchTerm,
  selectedManufacturer,
  setSelectedManufacturer,
  selectedDisease,
  setSelectedDisease,
  selectedRoute,
  setSelectedRoute,
  manufacturers,
  diseases,
  routes,
  debouncedSearchTerm,
}) => {
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const nameMatch = debouncedSearchTerm
        ? product.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
        : true;
      const manuMatch = selectedManufacturer
        ? product.manufacturer === selectedManufacturer
        : true;
      const diseaseMatch = selectedDisease
        ? product.disease === selectedDisease
        : true;
      const routeMatch = selectedRoute ? product.route === selectedRoute : true;
      return nameMatch && manuMatch && diseaseMatch && routeMatch;
    });
  }, [
    products,
    debouncedSearchTerm,
    selectedManufacturer,
    selectedDisease,
    selectedRoute,
  ]);

  return (
    <div style={{ background: "#f0f2f5", padding: 24, borderRadius: 8 }}>
      <Spin spinning={loading}>
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Search
              placeholder="Tìm theo tên sản phẩm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Select
              placeholder="Lọc theo hãng sản xuất"
              style={{ width: "100%" }}
              options={manufacturers}
              value={selectedManufacturer}
              onChange={(value) => setSelectedManufacturer(value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Select
              placeholder="Lọc theo nhóm bệnh"
              style={{ width: "100%" }}
              options={diseases}
              value={selectedDisease}
              onChange={(value) => setSelectedDisease(value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Select
              placeholder="Lọc theo đường dùng"
              style={{ width: "100%" }}
              options={routes}
              value={selectedRoute}
              onChange={(value) => setSelectedRoute(value)}
              allowClear
            />
          </Col>
        </Row>

        <List
          grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4, xl: 5, xxl: 6 }}
          dataSource={filteredProducts}
          pagination={{
            pageSize: 12,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} sản phẩm`,
          }}
          renderItem={(product) => {
            const priceInfo = calculateBestPrice(product, promotions);
            return (
              <List.Item>
                <Card
                  hoverable
                  style={{
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.09)",
                    height: "100%",
                    minHeight: 430,
                  }}
                  bodyStyle={{ padding: 16 }}
                  cover={
                    <img
                      alt={product.name}
                      src={
                        product.image_url && isValidUrl(product.image_url)
                          ? product.image_url
                          : "https://via.placeholder.com/150"
                      }
                      style={{ height: 180, objectFit: "contain", padding: 8 }}
                    />
                  }
                >
                  <Title
                    level={5}
                    ellipsis={{ rows: 2, tooltip: product.name }}
                    style={{ height: 48, marginBottom: "0.5em" }}
                  >
                    {product.name}
                  </Title>
                  <Card.Meta
                    description={
                      <Text type="secondary" style={{ fontSize: 13 }}>
                        {product.packaging}
                      </Text>
                    }
                  />
                  {product.disease && (
                    <Paragraph
                      ellipsis={{ rows: 2 }}
                      style={{
                        height: 44,
                        marginTop: 8,
                        marginBottom: 0,
                        fontSize: 13,
                        color: "#2a5a40",
                        fontWeight: 500,
                        background: "#e6ffe6",
                        padding: "4px 8px",
                        borderRadius: 4,
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>Công dụng/Bệnh:</span>{" "}
                      {product.disease}
                    </Paragraph>
                  )}
                  <div style={{ marginTop: 12 }}>
                    <Text strong style={{ fontSize: 16, color: "#d4380d" }}>
                      {priceInfo.finalPrice.toLocaleString("vi-VN")} đ
                    </Text>
                    {priceInfo.promotionApplied && (
                      <Text delete type="secondary" style={{ marginLeft: 8 }}>
                        {(priceInfo.originalPrice || 0).toLocaleString("vi-VN")}{" "}
                        đ
                      </Text>
                    )}
                    {priceInfo.promotionApplied && (
                      <Tag
                        color="green"
                        style={{ marginLeft: 0, marginTop: -4 }}
                      >
                        {priceInfo.promotionApplied}
                      </Tag>
                    )}
                    <div style={{ fontSize: 12, color: "gray" }}>
                      Để biết thêm chi tiết, vui lòng liên hệ TDV hoặc Hotline
                      Dược Nam Việt
                    </div>
                  </div>
                </Card>
              </List.Item>
            );
          }}
        />
      </Spin>
    </div>
  );
};

export default QuickQuoteTabContent;
