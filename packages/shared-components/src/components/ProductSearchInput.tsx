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
  notification,
} from "antd";
import { ShoppingOutlined, QrcodeOutlined } from "@ant-design/icons";
import {
  getB2BWarehouseProductByBarCode,
  getB2BWarehouseProducts,
  searchProductInWarehouse,
  searchProducts,
} from "@nam-viet-erp/services";
import { useDebounce } from "../hooks/useDebounce";
import QRScanner from "./QRScannerModal";
import { useInventory } from "@nam-viet-erp/store";

const { Text } = Typography;

interface ProductSearchInputProps {
  value?: IProduct | null;
  employeeWarehouse?: IWarehouse | null;
  onChange?: (product: IProduct | null) => void;
  placeholder?: string;
  allowClear?: boolean;
  disabled?: boolean;
  style?: React.CSSProperties;
  size?: "small" | "middle" | "large";
  showQRScanner?: boolean;
  debounceDelay?: number;
  selectedCustomer?: IPatient | null;
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
  employeeWarehouse,
  selectedCustomer,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, debounceDelay);

  const inventory = useInventory();

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth: string | null): number | null => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  // Get appropriate HDSD based on patient age
  const getHDSD = (product: IProduct): string | null => {
    if (!product) return null;

    const age = selectedCustomer?.date_of_birth
      ? calculateAge(selectedCustomer.date_of_birth)
      : null;

    if (age === null) {
      // If no age, show hdsd_over_18 as default
      return (
        product.description ||
        product.hdsd_over_18 ||
        product.hdsd_6_18 ||
        product.hdsd_2_6 ||
        product.hdsd_0_2
      );
    }

    if (age < 2) {
      return product.hdsd_0_2 || product.description;
    } else if (age < 6) {
      return product.hdsd_2_6 || product.description;
    } else if (age < 18) {
      return product.hdsd_6_18 || product.description;
    } else {
      return product.hdsd_over_18 || product.description;
    }
  };

  // Filter products when debounced search term changes
  useEffect(() => {
    if (debouncedSearchTerm && debouncedSearchTerm.length >= 1) {
      setLoading(true);
      getB2BWarehouseProducts({ search: debouncedSearchTerm })
        .then(({ data }) => {
          setProducts(
            (data?.map((v) => ({
              ...v.products,
              stock_quantity: v.quantity,
            })) as any) || [],
          );
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

  useEffect(() => {
    if (debouncedSearchTerm) {
      setLoading(true);

      // Search in inventory store instead of making API calls
      if (inventory.length > 0) {
        const searchLower = debouncedSearchTerm.toLowerCase();

        const filteredProducts = inventory
          .filter((item: any) => {
            const product = item.products;
            if (!product) return false;

            // Search by name, barcode, or product code
            const matchName = product.name?.toLowerCase().includes(searchLower);
            const matchBarcode = product.barcode
              ?.toLowerCase()
              .includes(searchLower);
            const matchCode = product.product_code
              ?.toLowerCase()
              .includes(searchLower);
            return (
              (matchName || matchBarcode || matchCode) && item.quantity > 0
            );
          })
          .map((item: any) => ({
            ...item.products,
            stock_quantity: item.quantity,
          }))
          .slice(0, 10); // Limit to 10 results

        setProducts(filteredProducts);
        setLoading(false);
      } else if (employeeWarehouse) {
        // Fallback to API if inventory is not loaded
        searchProductInWarehouse({
          search: debouncedSearchTerm,
          warehouseId: employeeWarehouse.id,
        })
          .then(({ data }) => {
            setProducts(
              data?.map(
                (v) =>
                  ({ ...v.products, stock_quantity: v.quantity }) as IProduct,
              ) || [],
            );
          })
          .catch(() => {
            notification.error({
              message: "Lỗi tìm kiếm",
              description: "Không thể tìm kiếm sản phẩm trong kho",
            });
            setProducts([]);
          })
          .finally(() => setLoading(false));
      } else {
        // Fallback to general search when no warehouse is selected
        searchProducts({
          search: debouncedSearchTerm,
          pageSize: 10,
          status: "active",
        })
          .then(({ data, error }) => {
            if (error) {
              notification.error({
                message: "Lỗi tìm kiếm",
                description: error.message,
              });
              setProducts([]);
            } else {
              setProducts(data || []);
            }
          })
          .finally(() => setLoading(false));
      }
    } else {
      setProducts([]);
    }
  }, [debouncedSearchTerm, employeeWarehouse, notification, inventory]);

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
      (product) => product.id.toString() === selectedValue,
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
      },
    );
  };

  const options = products.map((product) => {
    const hdsd = getHDSD(product);

    return {
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
            {hdsd && (
              <div
                style={{ marginTop: 4, padding: "4px 8px", borderRadius: 4 }}
              >
                <Text style={{ fontSize: 11, color: "#1890ff" }}>
                  💊 HDSD: {hdsd}
                </Text>
              </div>
            )}
            <div style={{ marginTop: 4 }}>
              <Text strong style={{ color: "#52c41a", fontSize: 13 }}>
                {formatCurrency(product.wholesale_price || 0)}
              </Text>
            </div>
          </div>
        </div>
      ),
    };
  });

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
