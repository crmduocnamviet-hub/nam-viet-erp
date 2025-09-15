import React, { useState, useEffect, useMemo } from "react";
import {
  Button,
  Input,
  Select,
  Table,
  Space,
  Row,
  Col,
  Typography,
  Avatar,
  App,
  Upload,
} from "antd";
import {
  PlusOutlined,
  DownloadOutlined,
  UploadOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import * as XLSX from "xlsx";
import ProductForm from "../features/products/components/ProductForm";
import { supabase } from "../lib/supabaseClient";
import { useDebounce } from "../hooks/useDebounce";

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

// const InventoryDisplay = ({
//   inventoryData,
//   warehouseName,
//   unit,
// }: {
//   inventoryData: any[];
//   warehouseName: string;
//   unit: string;
// }) => {
//   if (!inventoryData) {
//     return <span>0 {unit}</span>;
//   }
//   const warehouse = inventoryData.find(
//     (inv) => inv.warehouse_name === warehouseName
//   );
//   return (
//     <span>
//       {warehouse ? warehouse.quantity : 0} {unit}
//     </span>
//   );
// };

const Products: React.FC = () => {
  const { notification, modal } = App.useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [tableLoading, setTableLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [warehouses, setWarehouses] = useState<any[]>([]); // <-- Dòng mới
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]); // <-- Dòng mới

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const fetchProducts = async (searchTerm: string, status: string | null) => {
    setTableLoading(true);
    try {
      // Đọc dữ liệu từ "khung nhìn" thay vì bảng gốc
      let query = supabase.from("products_with_inventory").select("*");

      if (searchTerm) {
        query = query.or(
          `name.ilike.%${searchTerm}%,sku.eq.${searchTerm},barcode.eq.${searchTerm}`
        );
      }
      if (status) {
        query = query.eq("is_active", status === "active");
      }

      const { data, error } = await query.order("created_at", {
        ascending: false,
      });

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      notification.error({
        message: "Lỗi tải dữ liệu",
        description: error.message,
      });
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    const fetchWarehouses = async () => {
      const { data, error } = await supabase
        .from("warehouses")
        .select("id, name");
      if (error) {
        notification.error({
          message: "Lỗi tải danh sách kho",
          description: error.message,
        });
      } else {
        setWarehouses(data);
      }
    };

    fetchWarehouses();
  }, []);

  useEffect(() => {
    fetchProducts(debouncedSearchTerm, statusFilter);
  }, [debouncedSearchTerm, statusFilter]);

  // HÀM MỚI: Xử lý logic khi bấm nút Xóa
  const handleDelete = (productId: number, productName: string) => {
    modal.confirm({
      title: "Bạn có chắc chắn muốn xóa?",
      content: `Sản phẩm "${productName}" sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác.`,
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          const { error } = await supabase
            .from("products")
            .delete()
            .eq("id", productId);

          if (error) throw error;

          notification.success({
            message: "Đã xóa!",
            description: `Sản phẩm "${productName}" đã được xóa thành công.`,
          });
          fetchProducts(searchTerm, statusFilter); // Tải lại danh sách sản phẩm
        } catch (error: any) {
          notification.error({
            message: "Lỗi khi xóa",
            description: error.message,
          });
        }
      },
    });
  };

  const handleBulkActions = async (
    action: "deactivate" | "activate" | "setFixed" | "unsetFixed" | "delete"
  ) => {
    let confirmTitle = "";
    let confirmContent = `Bạn có chắc chắn muốn thực hiện hành động này cho ${selectedRowKeys.length} sản phẩm đã chọn?`;
    let okType: "primary" | "danger" = "primary";
    let successMessage = `Đã cập nhật ${selectedRowKeys.length} sản phẩm.`;

    let updateData: any = null;
    let isDelete = false;

    switch (action) {
      case "deactivate":
        confirmTitle = "Xác nhận Ngừng kinh doanh";
        okType = "danger";
        updateData = { is_active: false };
        break;
      case "activate":
        confirmTitle = "Xác nhận Kinh doanh lại";
        updateData = { is_active: true };
        break;
      case "setFixed":
        confirmTitle = "Xác nhận Đặt làm Sản phẩm Cố định";
        updateData = { is_fixed_asset: true };
        break;
      case "unsetFixed":
        confirmTitle = "Xác nhận Bỏ Sản phẩm Cố định";
        updateData = { is_fixed_asset: false };
        break;
      case "delete":
        confirmTitle = "Xác nhận Xóa vĩnh viễn";
        confirmContent = `Hành động này sẽ xóa vĩnh viễn ${selectedRowKeys.length} sản phẩm và không thể hoàn tác. Bạn có chắc chắn?`;
        okType = "danger";
        isDelete = true;
        successMessage = `Đã xóa ${selectedRowKeys.length} sản phẩm.`;
        break;
    }

    modal.confirm({
      title: confirmTitle,
      content: confirmContent,
      okText: "Đồng ý",
      okType: okType,
      cancelText: "Hủy",
      onOk: async () => {
        try {
          let error;
          if (isDelete) {
            const { error: deleteError } = await supabase
              .from("products")
              .delete()
              .in("id", selectedRowKeys);
            error = deleteError;
          } else {
            const { error: updateError } = await supabase
              .from("products")
              .update(updateData)
              .in("id", selectedRowKeys);
            error = updateError;
          }

          if (error) throw error;

          notification.success({
            message: "Thành công!",
            description: successMessage,
          });
          fetchProducts(debouncedSearchTerm, statusFilter);
          setSelectedRowKeys([]);
        } catch (error: any) {
          notification.error({
            message: "Thất bại",
            description: error.message,
          });
        }
      },
    });
  };

  // HÀM MỚI: Xử lý khi bấm nút Sửa
  const handleEdit = (product: any) => {
    setEditingProduct(product); // Đưa sản phẩm cần sửa vào "bộ nhớ"
    setIsModalOpen(true); // Mở form
  };

  const handleAdd = () => {
    setEditingProduct(null); // Dọn dẹp "bộ nhớ"
    setIsModalOpen(true); // Mở form
  };

  // Hàm dọn dẹp khi đóng form
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null); // Rất quan trọng: Xóa sản phẩm đang sửa khỏi "bộ nhớ"
  };

  const handleFormFinish = async (values: any) => {
    setFormLoading(true);
    try {
      const productData = {
        name: values.name,
        sku: values.sku,
        image_url: values.image_url, // <-- Dòng mới
        product_type: values.productType,
        is_fixed_asset: values.isFixedAsset,
        barcode: values.barcode,
        category: values.category,
        tags: values.tags,
        manufacturer: values.manufacturer,
        distributor: values.distributor,
        registration_number: values.registrationNumber,
        packaging: values.packaging,
        description: values.description,
        hdsd_0_2: values.hdsd_0_2,
        hdsd_2_6: values.hdsd_2_6,
        hdsd_6_18: values.hdsd_6_18,
        hdsd_over_18: values.hdsd_over_18,
        disease: values.disease,
        is_chronic: values.isChronic,
        wholesale_unit: values.wholesaleUnit,
        retail_unit: values.retailUnit,
        conversion_rate: values.conversionRate,
        invoice_price: values.invoicePrice,
        cost_price: values.costPrice,
        wholesale_profit: values.wholesaleProfit,
        retail_profit: values.retailProfit,
        wholesale_price: values.wholesalePrice,
        retail_price: values.retailPrice,
      };

      let productId = editingProduct?.id;

      if (editingProduct) {
        const { error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", editingProduct.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("products")
          .insert(productData)
          .select()
          .single();
        if (error) throw error;
        productId = data.id;
      }

      if (values.inventory_settings && productId) {
        const inventoryRecords = Object.entries(values.inventory_settings)
          // THÊM BƯỚC SÀNG LỌC DỮ LIỆU "TRỐNG"
          .filter(([, settings]) => settings !== undefined && settings !== null)
          .map(([warehouseId, settings]: [string, any]) => ({
            product_id: productId,
            warehouse_id: parseInt(warehouseId, 10),
            min_stock: settings.min_stock,
            max_stock: settings.max_stock,
          }));

        if (inventoryRecords.length > 0) {
          const { error } = await supabase
            .from("inventory")
            .upsert(inventoryRecords);
          if (error) throw error;
        }
      }

      notification.success({
        message: "Thành công!",
        description: `Đã ${editingProduct ? "cập nhật" : "thêm"} sản phẩm "${
          values.name
        }" thành công.`,
      });
      handleCloseModal();
      fetchProducts(searchTerm, statusFilter);
    } catch (error: any) {
      notification.error({ message: "Thất bại", description: error.message });
    } finally {
      setFormLoading(false);
    }
  };

  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    console.log("selectedRowKeys changed: ", newSelectedRowKeys);
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };

  // === HÀM MỚI: Xử lý Tải file Mẫu ===
  const handleDownloadTemplate = () => {
    const headers = {
      "Tên Sản Phẩm*": "",
      "Mã SKU*": "",
      "Giá vốn*": 0,
      "Đường dùng": "",
      "Đơn vị Bán Buôn": "",
      "Đơn vị Bán lẻ": "",
      "Số lượng Quy đổi": 1,
      "Quy cách đóng gói": "",
      // Thêm các cột khác nếu cần
    };
    const ws = XLSX.utils.json_to_sheet([headers]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sản phẩm");
    XLSX.writeFile(wb, "file-mau-san-pham.xlsx");
    notification.success({ message: "Đã tải file mẫu!" });
  };

  // === HÀM MỚI: Xử lý Xuất file Excel ===
  const handleExportExcel = async () => {
    try {
      // Lấy tất cả sản phẩm, không chỉ trang hiện tại
      const { data, error } = await supabase
        .from("products_with_inventory")
        .select("*");
      if (error) throw error;

      const dataToExport = data.map((p) => ({
        "Tên Sản Phẩm": p.name,
        "Mã SKU": p.sku,
        "Mã vạch": p.barcode,
        "Phân loại": p.category,
        "Đường dùng": p.route,
        "Giá vốn": p.cost_price,
        "Giá bán buôn": p.wholesale_price,
        "Giá bán lẻ": p.retail_price,
        "Đơn vị Bán Buôn": p.wholesale_unit,
        "Đơn vị Bán lẻ": p.retail_unit,
        "Số lượng Quy đổi": p.conversion_rate,
        "Quy cách đóng gói": p.packaging,
        "Công ty sản xuất": p.manufacturer,
        "Số Đăng Ký": p.registration_number,
        "Trạng thái": p.is_active ? "Đang kinh doanh" : "Ngừng kinh doanh",
      }));

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Danh sách Sản phẩm");
      XLSX.writeFile(wb, "danh-sach-san-pham.xlsx");
    } catch (err: any) {
      notification.error({
        message: "Xuất file thất bại",
        description: err.message,
      });
    }
  };

  // === HÀM MỚI: Xử lý Nhập file Excel ===
  const handleImportExcel = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);

        if (json.length === 0) {
          throw new Error("File không có dữ liệu.");
        }

        const dataToUpsert = json.map((row: any) => ({
          name: row["Tên Sản Phẩm*"],
          sku: row["Mã SKU*"],
          cost_price: row["Giá vốn*"],
          route: row["Đường dùng"],
          wholesale_unit: row["Đơn vị Bán Buôn"],
          retail_unit: row["Đơn vị Bán lẻ"],
          conversion_rate: row["Số lượng Quy đổi"],
          packaging: row["Quy cách đóng gói"],
          // Thêm các trường khác cần import
        }));

        // Dùng upsert để vừa thêm mới vừa cập nhật (dựa vào cột sku)
        const { error } = await supabase
          .from("products")
          .upsert(dataToUpsert, { onConflict: "sku" });

        if (error) throw error;

        notification.success({
          message: "Thành công!",
          description: `Đã nhập thành công ${dataToUpsert.length} sản phẩm.`,
        });
        fetchProducts(debouncedSearchTerm, statusFilter); // Tải lại dữ liệu
      } catch (err: any) {
        notification.error({
          message: "Nhập file thất bại",
          description: err.message,
        });
      }
    };
    // Ra lệnh cho reader đọc file sau khi đã định nghĩa xong onload
    reader.readAsBinaryString(file);
  }; // <-- HÀM handleImportExcel PHẢI KẾT THÚC TẠI ĐÂY

  const columns = useMemo(() => {
    const baseColumns = [
      {
        title: "Ảnh",
        dataIndex: "image_url",
        key: "image_url",
        render: (url: string) => <Avatar shape="square" size={64} src={url} />,
      },
      {
        title: "Tên Sản Phẩm",
        dataIndex: "name",
        key: "name",
        width: 300,
        render: (text: string, record: { sku: string }) => (
          <div>
            <a style={{ fontWeight: 600 }}>{text}</a>
            <div style={{ color: "gray" }}>SKU: {record.sku}</div>
          </div>
        ),
      },
    ];
    const warehouseColumns = warehouses.map((wh) => ({
      title: `Tồn ${wh.name}`,
      dataIndex: "inventory_data",
      key: `stock_${wh.id}`,
      render: (inventoryData: any[], record: any) => {
        if (!inventoryData) return `0 ${record.retail_unit || ""}`;
        const inventory = inventoryData.find(
          (inv) => inv.warehouse_id === wh.id
        );
        const unit = wh.name.includes("B2B")
          ? record.wholesale_unit
          : record.retail_unit;
        return `${inventory ? inventory.quantity : 0} ${unit || ""}`;
      },
    }));
    const actionColumn = {
      title: "Hành động",
      key: "action",
      render: (_: any, record: any) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Button
            type="link"
            icon={<DeleteOutlined />}
            danger
            onClick={() => handleDelete(record.id, record.name)}
          />
        </Space>
      ),
    };
    return [...baseColumns, ...warehouseColumns, actionColumn];
  }, [warehouses]);

  return (
    <>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2}>Danh sách sản phẩm</Title>
          </Col>
          <Col>
            <Space>
              <Button onClick={handleDownloadTemplate}>Tải file mẫu</Button>
              <Upload
                customRequest={({ file }) => handleImportExcel(file as File)}
                showUploadList={false}
              >
                <Button icon={<UploadOutlined />}>Nhập Excel</Button>
              </Upload>
              <Button icon={<DownloadOutlined />} onClick={handleExportExcel}>
                Xuất Excel
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAdd}
              >
                Thêm sản phẩm
              </Button>
            </Space>
          </Col>
        </Row>

        {selectedRowKeys.length > 0 && (
          <div
            style={{
              marginBottom: 16,
              background: "#e6f7ff",
              padding: "8px 12px",
              borderRadius: 8,
            }}
          >
            <Space wrap>
              <Text strong>Đã chọn: {selectedRowKeys.length} sản phẩm</Text>
              <Button onClick={() => handleBulkActions("activate")}>
                Kinh doanh lại
              </Button>
              <Button onClick={() => handleBulkActions("deactivate")}>
                Ngừng kinh doanh
              </Button>
              <Button onClick={() => handleBulkActions("setFixed")}>
                Đặt SP cố định
              </Button>
              <Button onClick={() => handleBulkActions("unsetFixed")}>
                Bỏ SP cố định
              </Button>
              <Button disabled>Cập nhật tồn kho</Button>
              <Button danger onClick={() => handleBulkActions("delete")}>
                Xóa hàng loạt
              </Button>
            </Space>
          </div>
        )}

        <Row gutter={16}>
          <Col span={12}>
            <Search
              placeholder="Tìm theo Tên, SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="Phân loại"
              style={{ width: "100%" }}
              disabled
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="Nhà sản xuất"
              style={{ width: "100%" }}
              disabled
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="Trạng thái"
              style={{ width: "100%" }}
              allowClear
              value={statusFilter}
              onChange={(value) => setStatusFilter(value)}
            >
              <Option value="active">Đang kinh doanh</Option>
              <Option value="inactive">Ngừng kinh doanh</Option>
            </Select>
          </Col>
        </Row>
        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={products}
          loading={tableLoading}
          rowKey="id"
          pagination={{
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} sản phẩm`,
          }}
        />
      </Space>
      <ProductForm
        open={isModalOpen}
        onClose={handleCloseModal}
        onFinish={handleFormFinish}
        loading={formLoading}
        initialData={editingProduct}
      />
    </>
  );
};
export default Products;
