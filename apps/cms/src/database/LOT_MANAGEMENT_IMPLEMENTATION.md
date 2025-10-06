# 📦 Hệ Thống Quản Lý Lô Hàng - Implementation Guide

## 🎯 Tổng Quan

Hệ thống quản lý lô hàng toàn diện giúp theo dõi từng lô sản phẩm từ khi nhập kho đến khi bán ra, với đầy đủ tính năng:

### ✅ Tính Năng Chính

1. **NÚT 1: Tạo đơn mua tự động** ✅ (Đã implement)
2. **NÚT 2: Nhập lô & HSD tự động qua OCR/AI** ✅
3. **NÚT 3: Quét Barcode/QR đối chiếu** ✅
4. **NÚT 4: Đối chiếu hóa đơn VAT** ✅
5. **FIFO/FEFO** - Tự động chọn lô theo HSD
6. **Theo dõi vị trí kệ** - Aisle, Rack, Level
7. **Báo cáo sắp hết hạn** - Cảnh báo tự động
8. **Tính giá vốn** - Sau chiết khấu & khuyến mại

---

## 🗄️ Database Schema

### 1. product_lots - Bảng Lô Hàng Chính

```sql
CREATE TABLE product_lots (
    id SERIAL PRIMARY KEY,

    -- Sản phẩm & Kho
    product_id INTEGER,
    warehouse_id INTEGER,

    -- Số lô (NÚT 2)
    lot_number VARCHAR(100),
    manufacturing_date DATE,
    expiry_date DATE,

    -- Số lượng
    quantity_received INTEGER,      -- Nhận về
    quantity_available INTEGER,     -- Còn lại
    quantity_reserved INTEGER,      -- Đã đặt
    quantity_sold INTEGER,          -- Đã bán

    -- Giá vốn (sau chiết khấu)
    unit_price_before_vat DECIMAL,  -- 100k
    vat_percent DECIMAL,            -- 10%
    discount_percent DECIMAL,       -- 5%
    final_unit_cost DECIMAL,        -- 95k (giá vốn cuối)

    -- VAT tracking (NÚT 4)
    has_vat_invoice BOOLEAN,
    vat_invoice_received INTEGER,   -- 50 chai có VAT
    vat_invoice_sold INTEGER,       -- Đã xuất VAT

    -- Barcode/QR (NÚT 3)
    barcode VARCHAR(255),
    qr_code TEXT,

    -- Vị trí kệ
    shelf_location VARCHAR(100),
    aisle VARCHAR(50),
    rack VARCHAR(50),
    level VARCHAR(50),

    status VARCHAR(50),
    created_at TIMESTAMPTZ
);
```

### 2. vat_invoices - Hóa Đơn VAT

```sql
CREATE TABLE vat_invoices (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(100) UNIQUE,
    invoice_type VARCHAR(20), -- 'purchase' | 'sales'
    invoice_date DATE,

    supplier_id INTEGER,
    customer_id INTEGER,

    -- OCR/AI (NÚT 2)
    pdf_url TEXT,
    ocr_status VARCHAR(50),
    ocr_data JSONB,           -- Dữ liệu OCR extract
    ocr_confidence DECIMAL,

    -- Reconciliation (NÚT 4)
    reconciliation_status VARCHAR(50),

    subtotal DECIMAL,
    vat_amount DECIMAL,
    total_with_vat DECIMAL,
    created_at TIMESTAMPTZ
);
```

### 3. lot_movements - Lịch Sử Di Chuyển

```sql
CREATE TABLE lot_movements (
    id SERIAL PRIMARY KEY,
    lot_id INTEGER,
    movement_type VARCHAR(50), -- received, shelved, picked, sold, etc.
    quantity INTEGER,

    -- Locations
    from_location VARCHAR(200),
    to_location VARCHAR(200),

    -- Orders
    order_id INTEGER,
    order_type VARCHAR(50),

    -- VAT tracking (NÚT 4)
    purchase_vat_invoice_id INTEGER,
    sales_vat_invoice_id INTEGER,

    -- Barcode verification (NÚT 3)
    verified_by_barcode BOOLEAN,
    barcode_scanned VARCHAR(255),

    performed_by UUID,
    created_at TIMESTAMPTZ
);
```

### 4. vat_warehouse - Kho VAT Ảo

```sql
CREATE TABLE vat_warehouse (
    id SERIAL PRIMARY KEY,
    product_id INTEGER,
    lot_id INTEGER,
    purchase_vat_invoice_id INTEGER,

    quantity_in INTEGER,              -- 50 chai có VAT
    quantity_sold INTEGER,            -- Đã xuất VAT
    quantity_available INTEGER,       -- = in - sold

    sales_vat_invoices JSONB,         -- [{invoice_id, qty, date}]
    created_at TIMESTAMPTZ
);
```

### 5. barcode_verifications - Log Quét Barcode

```sql
CREATE TABLE barcode_verifications (
    id SERIAL PRIMARY KEY,
    barcode_scanned VARCHAR(255),
    scan_type VARCHAR(50),

    product_id INTEGER,
    lot_id INTEGER,
    match_status VARCHAR(50),

    order_id INTEGER,
    in_order BOOLEAN,

    verification_context VARCHAR(50),
    scanned_by UUID,
    scanned_at TIMESTAMPTZ
);
```

---

## 🔧 SQL Functions

### 1. get_available_lots_v2() - Lấy Lô Theo FIFO/FEFO

```sql
SELECT * FROM get_available_lots_v2(
    101,     -- product_id
    1,       -- warehouse_id
    30,      -- required_quantity (optional)
    'FEFO',  -- strategy: FIFO or FEFO
    true     -- require_vat
);
```

**Kết quả:**
```
lot_id | lot_number | expiry_date | quantity_available | vat_available | days_until_expiry
1      | ABC123     | 2025-12-31  | 70                | 30            | 365
2      | XYZ456     | 2026-06-30  | 100               | 50            | 545
```

### 2. reserve_lot_quantity_v2() - Đặt Trước Lô

```sql
SELECT reserve_lot_quantity_v2(
    1,              -- lot_id
    30,             -- quantity
    456,            -- order_id
    'pos',          -- order_type
    'emp-uuid',     -- employee_id
    'A1-R3-L2'      -- shelf_location
);
```

**Kết quả:**
```json
{
  "success": true,
  "lot_id": 1,
  "reserved_quantity": 30
}
```

### 3. sell_lot_quantity_v2() - Bán Lô Với VAT

```sql
SELECT sell_lot_quantity_v2(
    1,              -- lot_id
    30,             -- quantity
    456,            -- order_id
    'pos',          -- order_type
    10,             -- sales_vat_invoice_id
    'emp-uuid'      -- employee_id
);
```

**Kết quả:**
```json
{
  "success": true,
  "lot_id": 1,
  "sold_quantity": 30,
  "purchase_vat_invoice": 5,    -- So_HD_Mua_0004
  "sales_vat_invoice": 10       -- So_HD_Ban_00010
}
```

### 4. verify_barcode_v2() - Quét Barcode (NÚT 3)

```sql
SELECT verify_barcode_v2(
    '8934868001234',  -- barcode
    123,              -- order_id
    'pos',            -- order_type
    'picking',        -- context
    'emp-uuid'        -- employee_id
);
```

**Kết quả:**
```json
{
  "success": true,
  "match_status": "matched",
  "product_id": 101,
  "lot_id": 1,
  "in_order": true,
  "product": {
    "id": 101,
    "name": "Clear 500ml",
    "sku": "CLR-500",
    "barcode": "8934868001234"
  }
}
```

---

## 🔄 Luồng Hoạt Động

### LUỒNG 1: Nhập Hàng (NÚT 2)

#### Cách 1: Quét Camera OCR

```typescript
import { extractLotFromImage, createProductLot } from '@/services/lotManagementService';

// 1. Chụp ảnh lô & HSD trên vỏ hộp
const handleCameraCapture = async (imageData: string) => {
  // Gọi AI/OCR
  const result = await extractLotFromImage(imageData);

  // Kết quả:
  // {
  //   lot_number: "ABC123",
  //   expiry_date: "2025-12-31",
  //   confidence: 0.95
  // }

  // Auto-fill form
  setFormValues({
    lot_number: result.lot_number,
    expiry_date: result.expiry_date
  });
};
```

#### Cách 2: Upload PDF Hóa Đơn

```typescript
import { extractLotFromPDF, bulkCreateLotsFromOCR } from '@/services/lotManagementService';

// 1. Upload PDF hóa đơn NCC
const handlePDFUpload = async (file: File) => {
  // OCR extract
  const ocrData = await extractLotFromPDF(file);

  // Kết quả:
  // [
  //   { supplier_product_name: "Clear 500ml", lot: "ABC", expiry: "2025-12" },
  //   { supplier_product_name: "Sunsilk 200ml", lot: "XYZ", expiry: "2026-01" }
  // ]

  // 2. Ánh xạ tự động qua product_supplier_mapping
  // 3. Tạo nhiều lots cùng lúc
  const results = await bulkCreateLotsFromOCR({
    purchaseOrderId: poId,
    warehouseId: 1,
    ocrData: ocrData,
    employeeId: currentUser.id
  });
};
```

#### Cách 3: Nhập Thủ Công (Fallback)

```typescript
const handleManualInput = async (formData) => {
  await createProductLot({
    product_id: 101,
    warehouse_id: 1,
    lot_number: formData.lot_number,
    expiry_date: formData.expiry_date,
    quantity_received: 100,
    quantity_available: 100,
    unit_price_before_vat: 100000,
    vat_percent: 10,
    discount_percent: 5,
    final_unit_cost: 95000, // Giá vốn sau chiết khấu
    has_vat_invoice: true,
    vat_invoice_received: 50, // Chỉ 50 chai có VAT
    purchase_order_id: poId,
    supplier_id: 12
  });
};
```

### LUỒNG 2: Lên Kệ

```typescript
import { moveLotToShelf } from '@/services/lotManagementService';

const handlePutOnShelf = async (lotId: number) => {
  await moveLotToShelf({
    lotId: lotId,
    shelfLocation: 'A1-R3-L2',
    aisle: 'A1',
    rack: 'R3',
    level: 'L2',
    employeeId: currentUser.id
  });

  // Lot status → 'on_shelf'
  // Movement record: 'shelved'
};
```

### LUỒNG 3: Bán Hàng (FEFO)

```typescript
import { getAvailableLots, reserveLotQuantity, sellLotQuantity } from '@/services/lotManagementService';

// 1. Khách đặt 30 chai Clear
const handleCreateOrder = async () => {
  // Lấy lô FEFO (HSD gần nhất trước)
  const { data: lots } = await getAvailableLots({
    productId: 101,
    warehouseId: 1,
    requiredQuantity: 30,
    strategy: 'FEFO'
  });

  // lots[0] = { lot_id: 1, lot_number: 'ABC123', expiry: '2025-12-31', available: 70, vat_available: 30 }

  // 2. Reserve
  await reserveLotQuantity({
    lotId: lots[0].lot_id,
    quantity: 30,
    orderId: newOrderId,
    orderType: 'pos',
    employeeId: currentUser.id,
    shelfLocation: lots[0].shelf_location
  });

  // quantity_available: 70 → 40
  // quantity_reserved: 0 → 30
};

// 3. Giao hàng thành công → Bán
const handleDeliverySuccess = async () => {
  await sellLotQuantity({
    lotId: 1,
    quantity: 30,
    orderId: orderId,
    orderType: 'pos',
    salesVatInvoiceId: vatInvoiceId, // Nếu xuất VAT
    employeeId: currentUser.id
  });

  // quantity_reserved: 30 → 0
  // quantity_sold: 0 → 30
  // vat_invoice_sold: 0 → 30 (nếu có VAT)
};
```

### LUỒNG 4: Quét Barcode Đối Chiếu (NÚT 3)

```typescript
import { verifyBarcode } from '@/services/lotManagementService';

// Nhân viên kho quét barcode khi picking
const handleBarcodeScan = async (barcode: string) => {
  const { data } = await verifyBarcode({
    barcode: barcode,
    orderId: currentOrderId,
    orderType: 'pos',
    context: 'picking',
    employeeId: currentUser.id
  });

  if (data.success && data.in_order) {
    showNotification('success', `✅ ${data.product.name} - Đúng đơn hàng`);
  } else if (data.success && !data.in_order) {
    showNotification('error', `❌ ${data.product.name} - SAI đơn hàng!`);
  } else {
    showNotification('error', '❌ Không tìm thấy sản phẩm');
  }
};
```

### LUỒNG 5: Xuất Hóa Đơn VAT (NÚT 4)

```typescript
import { checkVatAvailability, createVatInvoice, sellLotQuantity } from '@/services/lotManagementService';

const handleIssueVatInvoice = async (lotId: number, requestedQty: number) => {
  // 1. Kiểm tra VAT khả dụng
  const { available } = await checkVatAvailability(lotId);

  if (requestedQty > available) {
    throw new Error(
      `Chỉ có ${available} chai có hóa đơn VAT. Không thể xuất ${requestedQty} chai!`
    );
  }

  // 2. Tạo hóa đơn VAT bán ra
  const { data: invoice } = await createVatInvoice({
    invoice_number: 'So_HD_Ban_00010',
    invoice_type: 'sales',
    customer_id: customerId,
    subtotal: 30 * 95000,
    vat_rate: 10,
    vat_amount: 30 * 95000 * 0.1,
    total_with_vat: 30 * 95000 * 1.1
  });

  // 3. Bán với VAT
  await sellLotQuantity({
    lotId: lotId,
    quantity: requestedQty,
    orderId: orderId,
    orderType: 'pos',
    salesVatInvoiceId: invoice.id,
    employeeId: currentUser.id
  });

  // Hệ thống tự ghi nhận:
  // HĐ mua: So_HD_Mua_0004 ↔ HĐ bán: So_HD_Ban_00010
};
```

---

## 💻 UI Components

### 1. ReceiveGoodsModal (Nhận Hàng)

```tsx
import { useState } from 'react';
import { Modal, Button, Form, Input, DatePicker, InputNumber, Space, Tabs } from 'antd';
import { CameraOutlined, FileTextOutlined, EditOutlined } from '@ant-design/icons';
import { BarcodeScanner } from '@/components/BarcodeScanner';
import { extractLotFromImage, extractLotFromPDF, createProductLot } from '@/services/lotManagementService';

interface ReceiveGoodsModalProps {
  visible: boolean;
  purchaseOrderId: number;
  onClose: () => void;
}

export const ReceiveGoodsModal: React.FC<ReceiveGoodsModalProps> = ({
  visible,
  purchaseOrderId,
  onClose
}) => {
  const [form] = Form.useForm();
  const [ocrMode, setOcrMode] = useState<'camera' | 'pdf' | 'manual'>('manual');
  const [loading, setLoading] = useState(false);

  // NÚT 2: Quét Camera OCR
  const handleCameraOCR = async (imageData: string) => {
    setLoading(true);
    try {
      const result = await extractLotFromImage(imageData);
      form.setFieldsValue({
        lot_number: result.lot_number,
        expiry_date: result.expiry_date
      });
      message.success('Đã trích xuất thông tin lô tự động!');
    } catch (error) {
      message.error('OCR thất bại. Vui lòng nhập thủ công.');
    } finally {
      setLoading(false);
    }
  };

  // NÚT 2: Upload PDF
  const handlePDFUpload = async (file: File) => {
    setLoading(true);
    try {
      const results = await extractLotFromPDF(file);
      // Show batch results and create lots
      message.success(`Đã trích xuất ${results.length} lô từ PDF!`);
    } catch (error) {
      message.error('Xử lý PDF thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    await createProductLot({
      ...values,
      purchase_order_id: purchaseOrderId,
      quantity_available: values.quantity_received,
      final_unit_cost: calculateFinalCost(values) // Apply discounts
    });
    message.success('Đã nhập lô thành công!');
    onClose();
  };

  return (
    <Modal
      title="Nhập Hàng Vào Kho"
      open={visible}
      onCancel={onClose}
      width={800}
      footer={null}
    >
      <Tabs
        activeKey={ocrMode}
        onChange={(key) => setOcrMode(key as any)}
        items={[
          {
            key: 'camera',
            label: <><CameraOutlined /> Quét Camera</>,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Alert
                  message="Chụp ảnh lô & HSD trên vỏ hộp"
                  type="info"
                />
                <BarcodeScanner
                  onCapture={handleCameraOCR}
                  mode="ocr"
                />
              </Space>
            )
          },
          {
            key: 'pdf',
            label: <><FileTextOutlined /> Upload PDF</>,
            children: (
              <Upload.Dragger
                accept=".pdf"
                beforeUpload={handlePDFUpload}
                showUploadList={false}
              >
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p>Kéo thả hoặc click để upload hóa đơn/phiếu xuất PDF</p>
              </Upload.Dragger>
            )
          },
          {
            key: 'manual',
            label: <><EditOutlined /> Nhập Thủ Công</>,
            children: (
              <Form form={form} onFinish={handleSubmit} layout="vertical">
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="lot_number"
                      label="Số Lô"
                      rules={[{ required: true }]}
                    >
                      <Input placeholder="ABC123" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="expiry_date"
                      label="Hạn Sử Dụng"
                    >
                      <DatePicker style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="quantity_received"
                      label="Số Lượng Nhận"
                      rules={[{ required: true }]}
                    >
                      <InputNumber min={1} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="unit_price_before_vat"
                      label="Giá Chưa VAT"
                      rules={[{ required: true }]}
                    >
                      <InputNumber
                        formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item name="vat_percent" label="VAT (%)" initialValue={10}>
                      <InputNumber min={0} max={100} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="discount_percent" label="Chiết Khấu (%)" initialValue={0}>
                      <InputNumber min={0} max={100} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="promotion" label="Khuyến Mại">
                      <Input placeholder="Mua 10 tặng 1" />
                    </Form.Item>
                  </Col>
                </Row>

                <Divider />

                <Alert
                  message="Hóa Đơn VAT"
                  description="Nhập thông tin nếu có hóa đơn VAT từ nhà cung cấp"
                  type="warning"
                />

                <Row gutter={16} style={{ marginTop: 16 }}>
                  <Col span={12}>
                    <Form.Item name="vat_invoice_number" label="Số HĐ VAT">
                      <Input placeholder="So_HD_Mua_0004" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="vat_invoice_received" label="SL trên HĐ VAT">
                      <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item>
                  <Space>
                    <Button type="primary" htmlType="submit" loading={loading}>
                      Nhập Kho
                    </Button>
                    <Button onClick={onClose}>Hủy</Button>
                  </Space>
                </Form.Item>
              </Form>
            )
          }
        ]}
      />
    </Modal>
  );
};
```

### 2. BarcodeVerificationPanel (NÚT 3)

```tsx
import { useState } from 'react';
import { Card, List, Tag, Alert } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { BarcodeScanner } from '@/components/BarcodeScanner';
import { verifyBarcode } from '@/services/lotManagementService';

export const BarcodeVerificationPanel = ({ orderId, orderType }) => {
  const [scannedItems, setScannedItems] = useState([]);

  const handleScan = async (barcode: string) => {
    const { data } = await verifyBarcode({
      barcode,
      orderId,
      orderType,
      context: 'picking',
      employeeId: currentUser.id
    });

    const result = {
      barcode,
      product: data.product,
      status: data.in_order ? 'correct' : 'wrong',
      timestamp: new Date()
    };

    setScannedItems(prev => [result, ...prev]);

    if (data.in_order) {
      message.success(`✅ ${data.product?.name} - Đúng!`);
    } else {
      message.error(`❌ ${data.product?.name} - SAI đơn hàng!`);
    }
  };

  return (
    <Card title="Đối Chiếu Barcode (NÚT 3)">
      <BarcodeScanner onScan={handleScan} />

      <List
        dataSource={scannedItems}
        renderItem={item => (
          <List.Item>
            <List.Item.Meta
              avatar={
                item.status === 'correct' ? (
                  <CheckCircleOutlined style={{ color: 'green', fontSize: 24 }} />
                ) : (
                  <CloseCircleOutlined style={{ color: 'red', fontSize: 24 }} />
                )
              }
              title={item.product?.name}
              description={
                <>
                  <Tag>{item.barcode}</Tag>
                  <Tag color={item.status === 'correct' ? 'success' : 'error'}>
                    {item.status === 'correct' ? 'Đúng đơn' : 'SAI đơn'}
                  </Tag>
                </>
              }
            />
          </List.Item>
        )}
      />
    </Card>
  );
};
```

### 3. LotSelectionModal (Chọn Lô)

```tsx
import { Table, Modal, Tag, Badge } from 'antd';
import { getAvailableLots } from '@/services/lotManagementService';

export const LotSelectionModal = ({ product, quantity, onSelect }) => {
  const { data: lots } = useQuery({
    queryKey: ['lots', product.id],
    queryFn: () => getAvailableLots({
      productId: product.id,
      warehouseId: 1,
      requiredQuantity: quantity,
      strategy: 'FEFO'
    })
  });

  const columns = [
    { title: 'Số Lô', dataIndex: 'lot_number' },
    {
      title: 'HSD',
      dataIndex: 'expiry_date',
      render: (date, record) => (
        <Space>
          <span>{date}</span>
          {record.days_until_expiry < 30 && (
            <Badge status="warning" text={`${record.days_until_expiry} ngày`} />
          )}
        </Space>
      )
    },
    { title: 'Vị Trí', dataIndex: 'shelf_location' },
    { title: 'Còn lại', dataIndex: 'quantity_available' },
    {
      title: 'VAT',
      dataIndex: 'vat_available',
      render: (val) => <Tag color={val > 0 ? 'green' : 'red'}>{val}</Tag>
    },
    {
      title: '',
      render: (lot) => (
        <Button onClick={() => onSelect(lot)}>Chọn</Button>
      )
    }
  ];

  return (
    <Modal title={`Chọn lô cho ${product.name}`} width={900}>
      <Alert
        message="Lô được sắp xếp theo FEFO (HSD gần nhất trước)"
        type="info"
        style={{ marginBottom: 16 }}
      />
      <Table dataSource={lots} columns={columns} />
    </Modal>
  );
};
```

### 4. VatReconciliationReport (NÚT 4)

```tsx
import { Table, DatePicker, Button } from 'antd';
import { getVatReconciliation } from '@/services/lotManagementService';

export const VatReconciliationReport = () => {
  const [dateRange, setDateRange] = useState([]);

  const { data: movements } = useQuery({
    queryKey: ['vat-reconciliation', dateRange],
    queryFn: () => getVatReconciliation({
      startDate: dateRange[0],
      endDate: dateRange[1]
    })
  });

  const columns = [
    {
      title: 'Sản phẩm',
      render: (record) => record.lot?.product?.name
    },
    { title: 'Số Lô', render: (r) => r.lot?.lot_number },
    { title: 'Số lượng', dataIndex: 'quantity' },
    {
      title: 'HĐ VAT Mua',
      render: (r) => (
        <Tag color="blue">
          {r.purchase_vat?.invoice_number}
          <br />
          {r.purchase_vat?.supplier?.name}
        </Tag>
      )
    },
    {
      title: 'HĐ VAT Bán',
      render: (r) => (
        <Tag color="green">
          {r.sales_vat?.invoice_number}
          <br />
          {r.sales_vat?.customer?.customer_name}
        </Tag>
      )
    },
    { title: 'Ngày', dataIndex: 'created_at' }
  ];

  return (
    <Card title="Đối Chiếu Hóa Đơn VAT (NÚT 4)">
      <Space style={{ marginBottom: 16 }}>
        <DatePicker.RangePicker onChange={setDateRange} />
        <Button type="primary" onClick={() => exportToExcel(movements)}>
          Xuất Excel
        </Button>
      </Space>

      <Table
        dataSource={movements}
        columns={columns}
        summary={(data) => (
          <Table.Summary.Row>
            <Table.Summary.Cell colSpan={2}>Tổng</Table.Summary.Cell>
            <Table.Summary.Cell>
              {data.reduce((sum, r) => sum + r.quantity, 0)}
            </Table.Summary.Cell>
            <Table.Summary.Cell colSpan={3} />
          </Table.Summary.Row>
        )}
      />
    </Card>
  );
};
```

---

## 📊 Báo Cáo & Dashboard

### 1. Sắp Hết Hạn

```typescript
import { getExpiringLots } from '@/services/lotManagementService';

const ExpiringLotsReport = () => {
  const { data } = useQuery({
    queryKey: ['expiring-lots'],
    queryFn: () => getExpiringLots({ daysUntilExpiry: 30 })
  });

  return (
    <Table
      dataSource={data}
      columns={[
        { title: 'Sản phẩm', render: (r) => r.product.name },
        { title: 'Số lô', dataIndex: 'lot_number' },
        { title: 'HSD', dataIndex: 'expiry_date' },
        { title: 'Còn lại', dataIndex: 'quantity_available' },
        { title: 'Vị trí', dataIndex: 'shelf_location' }
      ]}
    />
  );
};
```

### 2. Tồn Kho Theo Lô

```typescript
import { getLotInventorySummary } from '@/services/lotManagementService';

const LotInventoryDashboard = () => {
  const { data } = useQuery({
    queryKey: ['lot-inventory'],
    queryFn: () => getLotInventorySummary()
  });

  return (
    <Card title="Tồn Kho Theo Lô">
      <Row gutter={16}>
        <Col span={6}>
          <Statistic
            title="Tổng Lô"
            value={data?.length}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="Tổng Số Lượng"
            value={data?.reduce((sum, lot) => sum + lot.quantity_available, 0)}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="Giá Trị Tồn"
            value={data?.reduce((sum, lot) =>
              sum + (lot.quantity_available * lot.final_unit_cost), 0
            )}
            suffix="đ"
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="Sắp Hết Hạn"
            value={data?.filter(lot =>
              lot.expiry_date && new Date(lot.expiry_date) < addDays(new Date(), 30)
            ).length}
          />
        </Col>
      </Row>
    </Card>
  );
};
```

---

## 🚀 Migration & Setup

### Bước 1: Run Migration

```bash
psql -U postgres -d nam_viet_erp -f lot-management-v2.sql
```

### Bước 2: Verify Tables

```sql
-- Check tables
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'product_lots',
  'vat_invoices',
  'vat_invoice_items',
  'lot_movements',
  'vat_warehouse',
  'barcode_verifications'
);

-- Check functions
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%lot%' OR routine_name LIKE '%vat%';
```

### Bước 3: Test Functions

```sql
-- Test FEFO
SELECT * FROM get_available_lots_v2(1, 1, NULL, 'FEFO', false);

-- Test reserve
SELECT reserve_lot_quantity_v2(1, 10, 1, 'pos', 'emp-uuid', 'A1-R1-L1');

-- Test barcode
SELECT verify_barcode_v2('8934868001234', 1, 'pos', 'picking', 'emp-uuid');
```

---

## 📖 Best Practices

1. **Luôn dùng FEFO** cho sản phẩm có HSD
2. **Quét barcode** mỗi khi picking/packing
3. **Upload PDF NCC** để OCR tự động
4. **Kiểm tra VAT** trước khi xuất hóa đơn
5. **Báo cáo hết hạn** định kỳ hàng tuần
6. **Đối chiếu VAT** hàng tháng

---

## 🔍 Troubleshooting

**Q: Không xuất được VAT?**
```sql
-- Check VAT availability
SELECT * FROM vat_warehouse WHERE lot_id = 1;
```

**Q: OCR không đọc được?**
- Chụp ảnh rõ, đủ sáng
- Thử PDF thay vì ảnh
- Fallback: Nhập thủ công

**Q: Barcode không match?**
```sql
-- Check barcode
SELECT * FROM products WHERE barcode = '8934868001234';
SELECT * FROM product_lots WHERE barcode = '8934868001234';
```

---

**🎉 Hệ thống đã sẵn sàng triển khai!**
