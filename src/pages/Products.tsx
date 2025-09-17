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
  type TableProps, // <-- Đảm bảo import đúng 'type'
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

const ProductsPageContent: React.FC = () => {
  const { notification, modal } = AntApp.useApp();
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
      let query = supabase
        .from("products_with_inventory")
        .select("*", { count: "exact" });
      if (search) {
        query = query.or(
          `name.ilike.%${search}%,sku.ilike.%${search}%,barcode.ilike.%${search}`
        );
      }
      if (status) {
        query = query.eq("is_active", status === "active");
      }
      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(
          (pagination.current - 1) * pagination.pageSize,
          pagination.current * pagination.pageSize - 1
        );

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
      const { data, error } = await supabase
        .from("warehouses")
        .select("id, name");
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
          const { error } = await supabase
            .from("products")
            .delete()
            .eq("id", productId);
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
    // ... logic xử lý hàng loạt
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
    // ... logic xử lý form
  };

  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection = { selectedRowKeys, onChange: onSelectChange };
  const handleDownloadTemplate = () => {
    /* ... */
  };
  const handleExportExcel = async () => {
    /* ... */
  };
  const handleImportExcel = (file: File) => {
    /* ... */
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
            <Typography.Text strong>{text}</Typography.Text>
            <div style={{ color: "gray" }}>SKU: {record.sku}</div>
          </div>
        ),
      },
    ];

    const warehouseColumns = warehouses.map((wh) => ({
      title: `Tồn ${wh.name}`,
      dataIndex: "inventory_data",
      key: `stock_${wh.id}`,
      responsive: ["lg"] as const,
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
