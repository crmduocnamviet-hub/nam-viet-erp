import React, { useState, useEffect } from "react";
import { Typography, App, Tabs, Input, Space, Tooltip, Badge } from "antd";
import { EditOutlined } from "@ant-design/icons";
import { useDebounce } from "@nam-viet-erp/shared-components";
import { getActiveProduct, getActivePromotions } from "@nam-viet-erp/services";
import { useB2BOrderStore } from "@nam-viet-erp/store";
import QuickQuoteTabContent from "../../components/QuickQuoteTabContent";
// Helper function to safely get error message
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    return (error as any).message;
  }

  return "An unknown error occurred";
};

const { Title } = Typography;

const QuickQuote: React.FC = () => {
  // B2B Order Store - Multi-tab support
  const tabs = useB2BOrderStore((state) => state.tabs);
  const activeTabId = useB2BOrderStore((state) => state.activeTabId);
  const { createTab, closeTab, switchTab } = useB2BOrderStore();

  // Tab editing state
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingTabTitle, setEditingTabTitle] = useState<string>("");
  // Global state (shared across all tabs)
  const { notification } = App.useApp();
  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [promotions, setPromotions] = useState<IPromotion[]>([]);

  // Tab-specific local state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedManufacturer, setSelectedManufacturer] = useState<
    string | null
  >(null);
  const [selectedDisease, setSelectedDisease] = useState<string | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);

  // Filter options
  const [manufacturers, setManufacturers] = useState<
    { value: string; label: string }[]
  >([]);
  const [diseases, setDiseases] = useState<{ value: string; label: string }[]>(
    [],
  );
  const [routes, setRoutes] = useState<{ value: string; label: string }[]>([]);

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const productsPromise = getActiveProduct();
        const promotionsPromise = getActivePromotions();
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
            productsRes.data.map((item) => item.manufacturer).filter(Boolean),
          ),
        ];
        setManufacturers(
          uniqueManufacturers.map((m) => ({ value: m, label: m })),
        );

        const uniqueDiseases = [
          ...new Set(
            productsRes.data.map((item) => item.disease).filter(Boolean),
          ),
        ];
        setDiseases(uniqueDiseases.map((d) => ({ value: d, label: d })));

        const uniqueRoutes = [
          ...new Set(
            productsRes.data.map((item) => item.route).filter(Boolean),
          ),
        ];
        setRoutes(uniqueRoutes.map((r) => ({ value: r, label: r })));
      } catch (error: unknown) {
        notification.error({
          message: "Lỗi tải dữ liệu",
          description: getErrorMessage(error),
        });
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  return (
    <div
      style={{
        padding: 0,
        minHeight: "100vh",
        height: "100vh",
        backgroundColor: "#f5f5f5",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div style={{ padding: "16px 24px", backgroundColor: "#fff" }}>
        <Title level={2} style={{ margin: 0 }}>
          Xem Nhanh Báo Giá
        </Title>
      </div>

      {/* Multi-tab navigation */}
      <Tabs
        type="editable-card"
        activeKey={activeTabId}
        onChange={switchTab}
        onEdit={(targetKey, action) => {
          if (action === "add") {
            createTab();
          } else if (action === "remove") {
            closeTab(targetKey as string);
          }
        }}
        items={tabs.map((tab) => ({
          key: tab.id,
          label: (
            <Space size={4}>
              {editingTabId === tab.id ? (
                <Input
                  size="small"
                  value={editingTabTitle}
                  onChange={(e) => setEditingTabTitle(e.target.value)}
                  onPressEnter={() => {
                    if (editingTabTitle.trim()) {
                      const { updateTabTitle } = useB2BOrderStore.getState();
                      updateTabTitle(tab.id, editingTabTitle.trim());
                    }
                    setEditingTabId(null);
                    setEditingTabTitle("");
                  }}
                  onBlur={() => {
                    if (editingTabTitle.trim()) {
                      const { updateTabTitle } = useB2BOrderStore.getState();
                      updateTabTitle(tab.id, editingTabTitle.trim());
                    }
                    setEditingTabId(null);
                    setEditingTabTitle("");
                  }}
                  autoFocus
                  style={{ width: 120 }}
                />
              ) : (
                <span
                  style={{ cursor: "pointer" }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setEditingTabId(tab.id);
                    setEditingTabTitle(tab.title);
                  }}
                >
                  {tab.title}
                </span>
              )}
              {editingTabId !== tab.id && (
                <Tooltip title="Double-click to edit or click icon">
                  <EditOutlined
                    style={{ fontSize: 12, color: "#999", cursor: "pointer" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingTabId(tab.id);
                      setEditingTabTitle(tab.title);
                    }}
                  />
                </Tooltip>
              )}
              {tab.orderItems.length > 0 && (
                <Badge
                  count={tab.orderItems.length}
                  offset={[10, -2]}
                  style={{ backgroundColor: "#52c41a" }}
                />
              )}
            </Space>
          ),
          closable: tabs.length > 1,
          children: (
            <QuickQuoteTabContent
              products={products}
              loading={loading}
              promotions={promotions}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              selectedManufacturer={selectedManufacturer}
              setSelectedManufacturer={setSelectedManufacturer}
              selectedDisease={selectedDisease}
              setSelectedDisease={setSelectedDisease}
              selectedRoute={selectedRoute}
              setSelectedRoute={setSelectedRoute}
              manufacturers={manufacturers}
              diseases={diseases}
              routes={routes}
              debouncedSearchTerm={debouncedSearchTerm}
            />
          ),
        }))}
        style={{
          marginBottom: 0,
          backgroundColor: "transparent",
        }}
      />
    </div>
  );
};

export default QuickQuote;
