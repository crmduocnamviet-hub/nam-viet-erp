import React, { useState, useEffect, useMemo } from "react";
import {
  Input,
  Select,
  Row,
  Col,
  Typography,
  App,
  List,
  Card,
  Spin,
  Tag,
} from "antd";
import { supabase } from "../lib/supabaseClient";
import { useDebounce } from "../hooks/useDebounce";

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;

// === "BỘ NÃO" TÍNH GIÁ ĐÃ ĐƯỢC NÂNG CẤP TOÀN DIỆN ===
const calculateBestPrice = (product: any, promotions: any[]) => {
  let bestPrice = product.wholesale_price;
  let appliedPromotionName: string | null = null;

  if (bestPrice === null || bestPrice === undefined || bestPrice <= 0) {
    return { finalPrice: 0, originalPrice: 0, promotionApplied: null };
  }

  for (const promo of promotions) {
    const conditions = promo.conditions;
    let isApplicable = true;

    // Kiểm tra các điều kiện chung (hãng, loại sản phẩm...)
    if (conditions) {
      if (
        conditions.price_groups &&
        !conditions.price_groups.includes("Bán buôn")
      )
        isApplicable = false;
      if (
        isApplicable &&
        conditions.manufacturers &&
        conditions.manufacturers.length > 0 &&
        !conditions.manufacturers.includes(product.manufacturer)
      )
        isApplicable = false;
      if (
        isApplicable &&
        conditions.product_categories &&
        conditions.product_categories.length > 0 &&
        !conditions.product_categories.includes(product.category)
      )
        isApplicable = false;
    }

    if (isApplicable) {
      let currentPrice = product.wholesale_price;
      let calculated = false;

      // Xử lý các loại khuyến mại trên SẢN PHẨM
      if (promo.type === "percentage") {
        currentPrice = product.wholesale_price * (1 - promo.value / 100);
        calculated = true;
      } else if (promo.type === "fixed_amount") {
        currentPrice = product.wholesale_price - promo.value;
        calculated = true;
      }
      // === LOGIC MỚI: Xử lý khuyến mại trên ĐƠN HÀNG ===
      else if (
        promo.type === "order_discount" &&
        conditions?.min_order_value > 0
      ) {
        const minOrderValue = conditions.min_order_value;
        const discountValue = promo.value;

        // Tính số lượng sản phẩm cần mua để đạt ngưỡng KM
        const requiredUnits = Math.ceil(
          minOrderValue / product.wholesale_price
        );
        if (requiredUnits > 0) {
          // Phân bổ giá trị KM trên mỗi sản phẩm
          const perUnitDiscount = discountValue / requiredUnits;
          // Làm tròn tăng lên hàng nghìn gần nhất
          const roundedUpDiscount = Math.ceil(perUnitDiscount / 1000) * 1000;
          // Tính giá tham khảo cuối cùng
          currentPrice = product.wholesale_price - roundedUpDiscount;
          calculated = true;
        }
      }

      if (calculated && currentPrice < bestPrice) {
        bestPrice = currentPrice;
        appliedPromotionName = promo.name;
      }
    }
  }

  return {
    finalPrice: Math.round(bestPrice), // Làm tròn giá cuối cùng
    originalPrice: product.wholesale_price,
    promotionApplied: appliedPromotionName,
  };
};

const QuickQuote: React.FC = () => {
  const { notification } = App.useApp();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedManufacturer, setSelectedManufacturer] = useState<
    string | null
  >(null);
  const [selectedDisease, setSelectedDisease] = useState<string | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [manufacturers, setManufacturers] = useState<
    { value: string; label: string }[]
  >([]);
  const [diseases, setDiseases] = useState<{ value: string; label: string }[]>(
    []
  );
  const [routes, setRoutes] = useState<{ value: string; label: string }[]>([]);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const productsPromise = supabase
          .from("products")
          .select("*")
          .eq("is_active", true);
        const promotionsPromise = supabase
          .from("promotions")
          .select("*")
          .eq("is_active", true);
        const [productsRes, promotionsRes] = await Promise.all([
          productsPromise,
          promotionsPromise,
        ]);

        if (productsRes.error) throw productsRes.error;
        if (promotionsRes.error) throw promotionsRes.error;

        setProducts(productsRes.data || []);
        setPromotions(promotionsRes.data || []);

        const uniqueManufacturers = [
          ...new Set(
            productsRes.data.map((item) => item.manufacturer).filter(Boolean)
          ),
        ];
        setManufacturers(
          uniqueManufacturers.map((m) => ({ value: m, label: m }))
        );

        const uniqueDiseases = [
          ...new Set(
            productsRes.data.map((item) => item.disease).filter(Boolean)
          ),
        ];
        setDiseases(uniqueDiseases.map((d) => ({ value: d, label: d })));

        const uniqueRoutes = [
          ...new Set(
            productsRes.data.map((item) => item.route).filter(Boolean)
          ),
        ];
        setRoutes(uniqueRoutes.map((r) => ({ value: r, label: r })));
      } catch (error: any) {
        notification.error({
          message: "Lỗi tải dữ liệu",
          description: error.message,
        });
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

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
        <Row
          justify="space-between"
          align="middle"
          style={{ marginBottom: 24 }}
        >
          <Col>
            <Title level={2}>Xem Nhanh Báo Giá</Title>
          </Col>
        </Row>

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
                        product.image_url || "https://via.placeholder.com/150"
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
                      <span style={{ fontWeight: 600 }}>Công dụng:</span>{" "}
                      {product.disease}
                    </Paragraph>
                  )}
                  <div style={{ marginTop: 12 }}>
                    <Text strong style={{ fontSize: 16, color: "#d4380d" }}>
                      {priceInfo.finalPrice.toLocaleString("vi-VN")} đ
                    </Text>
                    {priceInfo.promotionApplied && (
                      <Text delete type="secondary" style={{ marginLeft: 8 }}>
                        {priceInfo.originalPrice.toLocaleString("vi-VN")} đ
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

export default QuickQuote;
