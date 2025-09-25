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
  App as AntApp,
  Upload,
  Grid, // <-- Thêm Grid
  type TableProps,
} from "antd";
import {
  PlusOutlined,
  DownloadOutlined,
  UploadOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import * as XLSX from "xlsx";
// Temporary stub component to replace missing ProductForm
const ProductForm: React.FC<any> = ({ open, onCancel, onOk, product }) => (
  open ? (
    <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1000, backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', minWidth: '400px' }}>
      <h3>📦 {product ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}</h3>
      <p>Form quản lý sản phẩm sẽ được hiển thị tại đây</p>
      <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={{ padding: '8px 16px', backgroundColor: '#f5f5f5', border: '1px solid #d9d9d9', borderRadius: '4px' }}>Hủy</button>
        <button onClick={onOk} style={{ padding: '8px 16px', backgroundColor: '#1890ff', color: 'white', border: 'none', borderRadius: '4px' }}>Lưu</button>
      </div>
    </div>
  ) : null
);
import { useDebounce } from '@nam-viet-erp/shared-components';
import {
  createProduct,
  deleteProduct,
  deleteProductByIds,
  getProductWithInventory,
  getWarehouse,
  searchProducts,
  updateProduct,
  updateProductByIds,
  upsetInventory,
  upsetProduct,
} from "@nam-viet-erp/services";

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { useBreakpoint } = Grid; // <-- Khai báo hook "mắt thần"

const ProductsPageContent: React.FC = () => {
  const { notification, modal } = AntApp.useApp();
  const screens = useBreakpoint(); // <-- Gọi hook để lấy thông tin màn hình
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [tableLoading, setTableLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const fetchProducts = async (
    search = debouncedSearchTerm,
    status = statusFilter
  ) => {
    setTableLoading(true);
    try {
      const { data, error, count } = await searchProducts({
        search,
        status,
        page: pagination.current,
        pageSize: pagination.pageSize,
      });
      if (error) throw error;
      setProducts(data || []);
      setPagination((prev) => ({ ...prev, total: count || 0 }));
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
      const { data, error } = await getWarehouse();
      if (error) {
        notification.error({
          message: "Lỗi tải danh sách kho",
          description: error.message,
        });
      } else {
        setWarehouses(data || []);
      }
    };
    fetchWarehouses();
  }, [notification]);

  useEffect(() => {
    fetchProducts(debouncedSearchTerm, statusFilter);
  }, [
    debouncedSearchTerm,
    statusFilter,
    pagination.current,
    pagination.pageSize,
    notification,
  ]);
  const handleDelete = (productId: number, productName: string) => {
    modal.confirm({
      title: "Bạn có chắc chắn muốn xóa?",
      content: `Sản phẩm "${productName}" sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác.`,
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          const { error } = await deleteProduct(productId);
          if (error) throw error;
          notification.success({
            message: "Đã xóa!",
            description: `Sản phẩm "${productName}" đã được xóa thành công.`,
          });
          fetchProducts(debouncedSearchTerm, statusFilter);
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
        confirmTitle = "Xác nhận Đặt làm SP Cố định";
        updateData = { is_fixed_asset: true };
        break;
      case "unsetFixed":
        confirmTitle = "Xác nhận Bỏ SP Cố định";
        updateData = { is_fixed_asset: false };
        break;
      case "delete":
        confirmTitle = "Xác nhận Xóa vĩnh viễn";
        okType = "danger";
        isDelete = true;
        successMessage = `Đã xóa ${selectedRowKeys.length} sản phẩm.`;
        break;
    }

    modal.confirm({
      title: confirmTitle,
      content: `Bạn có chắc muốn thực hiện hành động này cho ${selectedRowKeys.length} sản phẩm đã chọn?`,
      okText: "Đồng ý",
      okType,
      cancelText: "Hủy",
      onOk: async () => {
        try {
          let error;
          if (isDelete) {
            ({ error } = await deleteProductByIds(selectedRowKeys));
          } else {
            ({ error } = await updateProductByIds(selectedRowKeys, updateData));
          }
          if (error) throw error;
          notification.success({
            message: "Thành công!",
            description: successMessage,
          });
          fetchProducts();
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
  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleFormFinish = async (values: any) => {
    setFormLoading(true);
    try {
      // 1. Chuẩn bị dữ liệu sản phẩm để gửi lên CSDL
      const productData: Partial<IProduct> = {
        name: values.name,
        sku: values.sku,
        image_url: values.image_url,
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
      let successMessage = "";

      // 2. Kiểm tra xem đây là Sửa hay Thêm mới
      if (editingProduct) {
        // --- CẬP NHẬT SẢN PHẨM ---
        const { error } = await updateProduct(
          editingProduct.id,
          editingProduct
        );
        if (error) throw error;
        successMessage = `Đã cập nhật sản phẩm "${values.name}" thành công.`;
      } else {
        // --- THÊM MỚI SẢN PHẨM ---
        const { data, error } = await createProduct(productData);
        if (error) throw error;
        productId = data.id; // Lấy ID của sản phẩm vừa được tạo
        successMessage = `Đã thêm sản phẩm "${values.name}" thành công.`;
      }

      // 3. Xử lý Cài đặt Tồn kho (Thêm mới hoặc Cập nhật)
      if (values.inventory_settings && productId) {
        const inventoryRecords = Object.entries(values.inventory_settings)
          .filter(([, settings]) => settings !== undefined && settings !== null)
          .map(([warehouseId, settings]: [string, any]) => ({
            product_id: productId,
            warehouse_id: parseInt(warehouseId, 10),
            min_stock: settings.min_stock,
            max_stock: settings.max_stock,
          }));

        if (inventoryRecords.length > 0) {
          // Dùng "upsert" để tự động cập nhật nếu đã có, hoặc thêm mới nếu chưa có
          const { error } = await upsetInventory(inventoryRecords);
          if (error) throw error;
        }
      }

      notification.success({
        message: "Thành công!",
        description: successMessage,
      });
      handleCloseModal();
      fetchProducts(debouncedSearchTerm, statusFilter);
    } catch (error: any) {
      notification.error({ message: "Thất bại", description: error.message });
    } finally {
      setFormLoading(false);
    }
  };

  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection = { selectedRowKeys, onChange: onSelectChange };
  const handleDownloadTemplate = () => {
    // Định nghĩa các cột cho file mẫu
    const headers = [
      {
        "Tên Sản Phẩm*": "Panadol Extra",
        "Mã SKU*": "PND-EXT-01",
        "Giá vốn*": 5000,
        "Đường dùng": "Uống",
        "Đơn vị Bán Buôn": "Hộp",
        "Đơn vị Bán lẻ": "Vỉ",
        "Số lượng Quy đổi": 10,
        "Quy cách đóng gói": "Hộp 10 vỉ x 12 viên",
        "Mã vạch": "8934534000132",
        "Phân loại": "Thuốc giảm đau, hạ sốt",
        "Công ty sản xuất": "GSK",
        "Số Đăng Ký": "VN-12345-12",
      },
    ];
    try {
      const ws = XLSX.utils.json_to_sheet(headers);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Sản phẩm");
      XLSX.writeFile(wb, "file-mau-san-pham.xlsx");
      notification.success({ message: "Đã tải file mẫu thành công!" });
    } catch (error: any) {
      notification.error({
        message: "Lỗi khi tạo file mẫu",
        description: error.message,
      });
    }
  };

  const handleExportExcel = async () => {
    try {
      setTableLoading(true);
      // Lấy tất cả sản phẩm, không chỉ trang hiện tại
      const { data, error } = await getProductWithInventory();
      if (error) throw error;

      // Chuyển đổi dữ liệu sang định dạng thân thiện với người dùng
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
      notification.success({ message: "Đã xuất file excel thành công!" });
    } catch (err: any) {
      notification.error({
        message: "Xuất file thất bại",
        description: err.message,
      });
    } finally {
      setTableLoading(false);
    }
  };

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

        // Ánh xạ từ tên cột trong Excel sang tên cột trong CSDL
        const dataToUpsert = json.map((row: any) => ({
          name: row["Tên Sản Phẩm*"],
          sku: row["Mã SKU*"],
          cost_price: row["Giá vốn*"],
          route: row["Đường dùng"],
          wholesale_unit: row["Đơn vị Bán Buôn"],
          retail_unit: row["Đơn vị Bán lẻ"],
          conversion_rate: row["Số lượng Quy đổi"],
          packaging: row["Quy cách đóng gói"],
          barcode: row["Mã vạch"],
          category: row["Phân loại"],
          manufacturer: row["Công ty sản xuất"],
          registration_number: row["Số Đăng Ký"],
        }));

        // Dùng upsert để vừa thêm mới vừa cập nhật (dựa vào cột sku)
        const { error } = await upsetProduct(dataToUpsert);

        if (error) throw error;

        notification.success({
          message: "Thành công!",
          description: `Đã nhập thành công ${dataToUpsert.length} sản phẩm.`,
        });
        fetchProducts(debouncedSearchTerm, statusFilter); // Tải lại dữ liệu
      } catch (err: any) {
        notification.error({
          message: "Nhập file thất bại",
          description:
            "Vui lòng kiểm tra lại định dạng file hoặc " + err.message,
        });
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleTableChange: TableProps<any>["onChange"] = (newPagination) => {
    setPagination((prev) => ({
      ...prev,
      current: newPagination.current || 1,
      pageSize: newPagination.pageSize || 10,
    }));
  };

  const columns: TableProps<any>["columns"] = useMemo(() => {
    const baseColumns = [
      {
        title: "Sản phẩm",
        dataIndex: "name",
        key: "name",
        render: (text: string, record: any) => (
          <Space>
            <Avatar shape="square" size={64} src={record.image_url} />
            <div>
              <Typography.Text strong>{text}</Typography.Text>
              <div style={{ color: "gray" }}>SKU: {record.sku}</div>
            </div>
          </Space>
        ),
      },
    ];

    const warehouseColumns = warehouses.map((wh) => ({
      title: `Tồn ${wh.name}`,
      dataIndex: "inventory_data",
      key: `stock_${wh.id}`,
      // KHÔNG CÒN `responsive` ở đây nữa
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

    // Nếu màn hình lớn (lg trở lên), mới ghép các cột tồn kho vào
    if (screens.lg) {
      return [...baseColumns, ...warehouseColumns, actionColumn];
    }

    // Nếu không, chỉ hiển thị các cột cơ bản
    return [...baseColumns, actionColumn];
  }, [warehouses, screens.lg]); // Thêm screens.lg vào dependencies

  return (
    <>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2}>Danh sách sản phẩm</Title>
          </Col>
          <Col>
            <Space wrap>
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
          pagination={pagination}
          onChange={handleTableChange}
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

const Products: React.FC = () => (
  <AntApp>
    <ProductsPageContent />
  </AntApp>
);

export default Products;
