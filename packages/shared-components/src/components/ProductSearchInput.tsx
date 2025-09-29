import React, { useState, useEffect } from "react";
import {
  AutoComplete,
  Avatar,
  Typography,
  Tag,
  App,
  Spin,
  Button,
  Tooltip,
  Space,
} from "antd";
import { ShoppingOutlined, QrcodeOutlined } from "@ant-design/icons";
import { getActiveProduct } from "@nam-viet-erp/services";
import { useDebounce } from "../hooks/useDebounce";
import QRScanner from "./QRScanner";

const { Text } = Typography;

interface Product {
  id: number;
  name: string;
  wholesale_price: number;
  packaging?: string;
  manufacturer?: string;
  image_url?: string;
  unit?: string;
  sku?: string;
}

interface ProductSearchInputProps {
  value?: Product | null;
  onChange?: (product: Product | null) => void;
  placeholder?: string;
  allowClear?: boolean;
  disabled?: boolean;
  style?: React.CSSProperties;
  size?: "small" | "middle" | "large";
  showQRScanner?: boolean;
}

const ProductSearchInput: React.FC<ProductSearchInputProps> = ({
  value,
  onChange,
  placeholder = "Quét mã QR hoặc tìm kiếm sản phẩm theo tên, SKU, nhà sản xuất...",
  allowClear = true,
  disabled = false,
  style,
  size = "middle",
  showQRScanner = true,
}) => {
  const { notification } = App.useApp();
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Load all products on component mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await getActiveProduct();
        if (response.error) throw response.error;
        const productData = response.data || [];
        setProducts(productData);
      } catch (error: any) {
        notification.error({
          message: "Lỗi tải sản phẩm",
          description: error.message || "Không thể tải danh sách sản phẩm",
        });
      }
    };
    fetchProducts();
  }, []);

  // Filter products when debounced search term changes
  useEffect(() => {
    if (debouncedSearchTerm && debouncedSearchTerm.length >= 2) {
      filterProducts(debouncedSearchTerm);
    } else {
      setFilteredProducts([]);
      setOpen(false);
    }
  }, [debouncedSearchTerm, products]);

  // Update search term when value changes externally
  useEffect(() => {
    if (value) {
      setSearchTerm(value.name);
    } else if (!searchTerm) {
      setSearchTerm("");
    }
  }, [value]);

  const filterProducts = (term: string) => {
    setLoading(true);

    const searchResults = products.filter((product) =>
      product.name.toLowerCase().includes(term.toLowerCase()) ||
      (product.sku &&
        product.sku.toLowerCase().includes(term.toLowerCase())) ||
      (product.manufacturer &&
        product.manufacturer.toLowerCase().includes(term.toLowerCase())) ||
      (product.packaging &&
        product.packaging.toLowerCase().includes(term.toLowerCase()))
    ).slice(0, 20); // Limit to 20 results

    setFilteredProducts(searchResults);
    setOpen(searchResults.length > 0);
    setLoading(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const isValidUrl = (string: string): boolean => {
    try {
      const url = new URL(string);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  };

  const handleSelect = (selectedValue: string) => {
    const selectedProduct = filteredProducts.find(
      (product) => product.id.toString() === selectedValue
    );
    if (selectedProduct) {
      setSearchTerm(selectedProduct.name);
      onChange?.(selectedProduct);
      setOpen(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    if (!value) {
      onChange?.(null);
      setFilteredProducts([]);
      setOpen(false);
    }
  };

  const handleQRScan = (scannedData: string) => {
    // Search for product by the scanned code (could be SKU, barcode, etc.)
    const foundProduct = products.find(
      (product) =>
        product.sku?.toLowerCase() === scannedData.toLowerCase() ||
        product.name.toLowerCase().includes(scannedData.toLowerCase()) ||
        product.id.toString() === scannedData
    );

    if (foundProduct) {
      setSearchTerm(foundProduct.name);
      onChange?.(foundProduct);
      notification.success({
        message: "Tìm thấy sản phẩm",
        description: `Đã tìm thấy: ${foundProduct.name}`,
      });
    } else {
      // If no exact match, use the scanned data as search term
      setSearchTerm(scannedData);
      filterProducts(scannedData);
      notification.warning({
        message: "Không tìm thấy sản phẩm chính xác",
        description: `Đang tìm kiếm với từ khóa: "${scannedData}"`,
      });
    }
  };

  const options = filteredProducts.map((product) => ({
    key: product.id.toString(),
    value: product.id.toString(),
    label: (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "8px 0",
          borderBottom: "1px solid #f0f0f0",
        }}
      >
        {product.image_url && isValidUrl(product.image_url) ? (
          <img
            alt={product.name}
            src={product.image_url}
            style={{
              width: 40,
              height: 40,
              objectFit: "contain",
              borderRadius: 4,
              border: "1px solid #f0f0f0",
              marginRight: 12,
            }}
          />
        ) : (
          <Avatar
            size={40}
            icon={<ShoppingOutlined />}
            style={{
              backgroundColor: "#1890ff",
              marginRight: 12,
            }}
          />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Text strong style={{ fontSize: 14 }}>
              {product.name}
            </Text>
            {product.unit && (
              <Tag
                color="blue"
                style={{ fontSize: 11, padding: "0 4px", lineHeight: "16px" }}
              >
                {product.unit}
              </Tag>
            )}
          </div>
          <div style={{ marginTop: 2 }}>
            {product.sku && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                SKU: {product.sku}
              </Text>
            )}
            {product.manufacturer && (
              <Text
                type="secondary"
                style={{ fontSize: 12, marginLeft: product.sku ? 8 : 0 }}
              >
                • {product.manufacturer}
              </Text>
            )}
            {product.packaging && (
              <Text
                type="secondary"
                style={{ fontSize: 12, marginLeft: 8 }}
              >
                • {product.packaging}
              </Text>
            )}
          </div>
          <div style={{ marginTop: 4 }}>
            <Text
              strong
              style={{ color: "#52c41a", fontSize: 13 }}
            >
              {formatCurrency(product.wholesale_price || 0)}
            </Text>
          </div>
        </div>
      </div>
    ),
  }));

  return (
    <>
      <Space.Compact style={{ width: '100%' }}>
        <AutoComplete
          value={searchTerm}
          options={options}
          onSelect={handleSelect}
          onSearch={handleSearch}
          placeholder={placeholder}
          allowClear={allowClear}
          disabled={disabled}
          style={{ flex: 1, ...style }}
          size={size}
          open={open}
          onDropdownVisibleChange={setOpen}
          styles={{
            popup: {
              root: {
                maxHeight: 400,
                overflow: "auto",
              },
            },
          }}
          notFoundContent={
            loading ? (
              <div style={{ textAlign: "center", padding: 16 }}>
                <Spin size="small" />
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary">Đang tìm kiếm...</Text>
                </div>
              </div>
            ) : searchTerm && searchTerm.length >= 2 ? (
              <div style={{ textAlign: "center", padding: 16 }}>
                <Text type="secondary">
                  Không tìm thấy sản phẩm nào chứa "{searchTerm}"
                </Text>
              </div>
            ) : searchTerm && searchTerm.length < 2 ? (
              <div style={{ textAlign: "center", padding: 16 }}>
                <Text type="secondary">Nhập ít nhất 2 ký tự để tìm kiếm</Text>
              </div>
            ) : null
          }
        />
        {showQRScanner && (
          <Tooltip title="Quét mã QR sản phẩm">
            <Button
              icon={<QrcodeOutlined />}
              onClick={() => setIsQRScannerOpen(true)}
              disabled={disabled}
              size={size}
            />
          </Tooltip>
        )}
      </Space.Compact>

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <QRScanner
          visible={isQRScannerOpen}
          onClose={() => setIsQRScannerOpen(false)}
          onScan={handleQRScan}
        />
      )}
    </>
  );
};

export default ProductSearchInput;