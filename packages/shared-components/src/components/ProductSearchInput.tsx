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
import {
  getB2BWarehouseProductByBarCode,
  getB2BWarehouseProducts,
} from "@nam-viet-erp/services";
import { useDebounce } from "../hooks/useDebounce";
import QRScanner from "./QRScannerModal";

const { Text } = Typography;

interface ProductSearchInputProps {
  value?: IProduct | null;
  onChange?: (product: IProduct | null) => void;
  placeholder?: string;
  allowClear?: boolean;
  disabled?: boolean;
  style?: React.CSSProperties;
  size?: "small" | "middle" | "large";
  showQRScanner?: boolean;
  debounceDelay?: number;
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
  debounceDelay = 300,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, debounceDelay);

  // Filter products when debounced search term changes
  useEffect(() => {
    if (debouncedSearchTerm && debouncedSearchTerm.length >= 2) {
      setLoading(true);
      getB2BWarehouseProducts({ search: debouncedSearchTerm })
        .then(({ data }) => {
          setProducts((data?.map((v) => ({ ...v.products })) as any) || []);
          setOpen(data.length > 0);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setProducts([]);
      setOpen(false);
    }
  }, [debouncedSearchTerm]);

  // Update search term when value changes externally
  useEffect(() => {
    if (value) {
      setSearchTerm(value.name);
    } else if (!searchTerm) {
      setSearchTerm("");
    }
  }, [value]);

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
    const selectedProduct = products.find(
      (product) => product.id.toString() === selectedValue
    );
    if (selectedProduct) {
      setSearchTerm("");
      onChange?.(selectedProduct);
      setOpen(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    if (!value) {
      onChange?.(null);
      setProducts([]);
      setOpen(false);
    }
  };

  const handleQRScan = (scannedData: string) => {
    getB2BWarehouseProductByBarCode({ barcode: scannedData }).then(
      ({ data }) => {
        if (data.length) {
          onChange?.([data[0].products] as never);
        }
      }
    );
  };

  const options = products.map((product) => ({
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
              <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                • {product.packaging}
              </Text>
            )}
          </div>
          <div style={{ marginTop: 4 }}>
            <Text strong style={{ color: "#52c41a", fontSize: 13 }}>
              {formatCurrency(product.wholesale_price || 0)}
            </Text>
          </div>
        </div>
      </div>
    ),
  }));

  return (
    <>
      <Space.Compact style={{ width: "100%" }}>
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
