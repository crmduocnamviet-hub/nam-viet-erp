# Hệ Thống Quản Lý Lô Hàng (Lot Management System)

## Tổng Quan

Hệ thống quản lý lô hàng giúp theo dõi chi tiết từng lô sản phẩm từ khi nhập kho đến khi bán ra, bao gồm:

- ✅ **Theo dõi số lô & hạn sử dụng** (NÚT 2)
- ✅ **Quét mã vạch/QR code** đối chiếu sản phẩm (NÚT 3)
- ✅ **Đối chiếu hóa đơn VAT** mua vào và bán ra (NÚT 4)
- ✅ **FIFO/FEFO** tự động chọn lô hàng
- ✅ **Kho ảo VAT** theo dõi hóa đơn VAT

## Cấu Trúc Database

### 1. **product_lots** - Bảng chính quản lý lô hàng

Lưu trữ thông tin từng lô sản phẩm:

```sql
- lot_number: Số lô từ nhà cung cấp
- expiry_date: Hạn sử dụng
- quantity_received: Số lượng nhận về
- quantity_available: Số lượng còn lại để bán
- quantity_reserved: Số lượng đã đặt (chưa giao)
- quantity_sold: Số lượng đã bán
- vat_invoice_number: Số hóa đơn VAT (NÚT 4)
- vat_quantity: Số lượng trên hóa đơn VAT
- barcode/qr_code: Mã vạch/QR (NÚT 3)
```

**Ví dụ thực tế:**
- Nhận về 100 chai Clear, lô ABC123, HSD 2025-12-31
- Hóa đơn VAT chỉ xuất 50 chai → vat_quantity = 50
- Bán 30 chai → quantity_available = 70, quantity_sold = 30

### 2. **vat_invoices** - Quản lý hóa đơn VAT (NÚT 4)

Theo dõi hóa đơn VAT mua vào và bán ra:

```sql
- invoice_type: 'purchase' (mua vào) hoặc 'sales' (bán ra)
- invoice_number: Số hóa đơn VAT
- pdf_url: Link file PDF hóa đơn
- ocr_data: Dữ liệu AI/OCR đọc từ hóa đơn (NÚT 2)
```

**Quy trình đối chiếu VAT:**
1. Upload hóa đơn VAT mua vào → AI đọc số lô, HSD
2. Hệ thống tạo record trong `vat_warehouse_inventory`
3. Khi bán hàng, chỉ được xuất VAT tối đa = số lượng trên HĐ VAT mua vào
4. Tự động ghi nhận: HĐ mua ABC ↔ HĐ bán XYZ

### 3. **vat_warehouse_inventory** - Kho ảo VAT (NÚT 4)

Theo dõi số lượng có hóa đơn VAT:

```sql
- quantity_in: Số lượng nhập có VAT
- quantity_out: Số lượng xuất có VAT
- quantity_available: Tự động tính (in - out)
```

**Ví dụ:**
- Nhận 100 chai thực tế
- VAT invoice chỉ 50 chai → quantity_in = 50
- Khi xuất VAT, chỉ cho xuất tối đa 50 chai

### 4. **lot_movements** - Lịch sử di chuyển lô

Audit trail đầy đủ:

```sql
- movement_type: received, reserved, sold, returned, etc.
- purchase_vat_invoice_id: HĐ VAT mua vào
- sales_vat_invoice_id: HĐ VAT bán ra
```

## Luồng Hoạt Động

### A. Nhập Hàng Với Số Lô (NÚT 2)

#### Cách 1: Quét Camera OCR (NÚT 2)
```typescript
// 1. Mở camera quét thông tin lô & HSD trên vỏ hộp
// 2. AI/OCR đọc và trả về:
{
  lot_number: "ABC123",
  expiry_date: "2025-12-31"
}

// 3. Tự động điền vào form nhập hàng
```

#### Cách 2: Upload Hóa Đơn/Phiếu Xuất (NÚT 2)
```typescript
// 1. Upload PDF hóa đơn từ NCC
// 2. AI đọc hàng loạt:
[
  { supplier_product_name: "Clear 500ml", lot: "ABC", expiry: "2025-12" },
  { supplier_product_name: "Sunsilk 200ml", lot: "XYZ", expiry: "2026-01" }
]

// 3. Ánh xạ tự động qua product_supplier_mapping
// 4. Tạo nhiều product_lots cùng lúc
```

### B. Nhập Kho Thực Tế

```sql
-- Tạo lô mới khi nhập hàng
INSERT INTO product_lots (
    product_id, warehouse_id, lot_number, expiry_date,
    quantity_received, quantity_available, unit_cost,
    purchase_order_id, supplier_id
) VALUES (
    101, 1, 'ABC123', '2025-12-31',
    100, 100, 95000, -- Giá vốn sau chiết khấu
    45, 12
);

-- Nếu có hóa đơn VAT
INSERT INTO vat_invoices (
    invoice_number, invoice_type, supplier_id,
    total_amount, vat_amount, pdf_url
) VALUES (
    'So_HD_Mua_0004', 'purchase', 12,
    5000000, 500000, '/invoices/...'
);

-- Ghi nhận vào kho VAT
INSERT INTO vat_warehouse_inventory (
    product_id, lot_id, vat_invoice_id,
    quantity_in
) VALUES (101, 1, 1, 50); -- Chỉ 50 chai có VAT
```

### C. Quét Barcode Đối Chiếu (NÚT 3)

```typescript
// Warehouse staff quét barcode trên hộp
const scannedBarcode = "8934868001234"; // From QR scanner

// 1. Tìm product theo barcode
const product = await supabase
  .from('products')
  .select('*')
  .eq('barcode', scannedBarcode)
  .single();

// 2. Kiểm tra trong đơn nhập/bán
const inOrder = order_items.some(item =>
  item.product_id === product.id
);

// 3. Hiển thị kết quả
if (inOrder) {
  showSuccess("✅ Sản phẩm có trong đơn");
} else {
  showError("❌ Sản phẩm KHÔNG có trong đơn");
}
```

### D. Bán Hàng Với Lô (FIFO/FEFO)

```sql
-- Lấy lô sẵn có theo FEFO (First Expired First Out)
SELECT * FROM get_available_lots(
    101,  -- product_id
    1,    -- warehouse_id
    'FEFO' -- strategy
);

-- Kết quả: Lô có HSD gần nhất, còn hàng
-- lot_id=1, lot_number='ABC123', expiry_date='2025-12-31',
-- quantity_available=70, vat_available=30

-- Reserve khi tạo đơn
SELECT reserve_lot_quantity(
    1,    -- lot_id
    30,   -- quantity
    456,  -- order_id
    'pos', -- order_type
    'emp-uuid'
);

-- Bán khi giao hàng thành công
SELECT sell_lot_quantity(
    1,    -- lot_id
    30,   -- quantity
    456,  -- order_id
    'pos',
    10,   -- sales_vat_invoice_id
    'emp-uuid'
);
```

### E. Xuất Hóa Đơn VAT (NÚT 4)

```typescript
// 1. Kiểm tra số lượng VAT khả dụng
const { data: vatAvailable } = await supabase
  .from('vat_warehouse_inventory')
  .select('quantity_available')
  .eq('lot_id', lotId)
  .single();

// 2. Giới hạn số lượng xuất
if (requestedQty > vatAvailable.quantity_available) {
  throw new Error(
    `Chỉ có ${vatAvailable.quantity_available} chai có hóa đơn VAT.
     Không thể xuất ${requestedQty} chai!`
  );
}

// 3. Tạo hóa đơn VAT bán ra
const salesVatInvoice = await createVatInvoice({
  invoice_type: 'sales',
  customer_id: customerId,
  items: [{ lot_id: lotId, quantity: requestedQty }]
});

// 4. Ghi nhận liên kết HĐ mua ↔ bán
await supabase.from('lot_movements').insert({
  lot_id: lotId,
  movement_type: 'sold',
  quantity: requestedQty,
  purchase_vat_invoice_id: originalPurchaseInvoice.id,
  sales_vat_invoice_id: salesVatInvoice.id
});
```

## Tích Hợp UI

### 1. Purchase Order - Nhận Hàng

**Component:** `ReceiveGoodsModal.tsx`

```typescript
interface ReceiveGoodsProps {
  purchaseOrderId: number;
}

const ReceiveGoodsModal = ({ purchaseOrderId }) => {
  const [ocrMode, setOcrMode] = useState<'camera' | 'upload' | null>(null);

  // NÚT 2: Quét camera OCR
  const handleCameraOCR = async (imageData) => {
    const result = await extractLotInfoFromImage(imageData);
    // Auto-fill: lot_number, expiry_date
  };

  // NÚT 2: Upload hóa đơn PDF
  const handleUploadInvoice = async (file) => {
    const result = await extractLotInfoFromPDF(file);
    // Batch create lots
  };

  return (
    <Modal>
      <Button onClick={() => setOcrMode('camera')}>
        📷 Quét Lô & HSD Qua Camera
      </Button>
      <Button onClick={() => setOcrMode('upload')}>
        📄 Upload Hóa Đơn/Phiếu Xuất
      </Button>

      <Form>
        <Input name="lot_number" label="Số Lô" />
        <DatePicker name="expiry_date" label="Hạn Sử Dụng" />
        <Input name="vat_invoice_number" label="Số HĐ VAT" />
        <InputNumber name="vat_quantity" label="SL trên HĐ VAT" />
      </Form>
    </Modal>
  );
};
```

### 2. Warehouse - Đối Chiếu Barcode (NÚT 3)

**Component:** `BarcodeVerification.tsx`

```typescript
const BarcodeVerification = ({ orderId, orderItems }) => {
  const [scannedProducts, setScannedProducts] = useState([]);

  const handleBarcodeScan = async (barcode) => {
    // 1. Find product by barcode
    const product = await findProductByBarcode(barcode);

    // 2. Check in order
    const isInOrder = orderItems.find(
      item => item.product_id === product.id
    );

    // 3. Show result
    if (isInOrder) {
      setScannedProducts(prev => [...prev, product]);
      showNotification('success', '✅ Sản phẩm đúng');
    } else {
      showNotification('error', '❌ Sản phẩm SAI');
    }
  };

  return (
    <Card title="Đối Chiếu Barcode">
      <BarcodeScanner onScan={handleBarcodeScan} />

      <List>
        {scannedProducts.map(p => (
          <List.Item key={p.id}>
            ✅ {p.name} - {p.barcode}
          </List.Item>
        ))}
      </List>
    </Card>
  );
};
```

### 3. POS - Chọn Lô Khi Bán

**Component:** `LotSelectionModal.tsx`

```typescript
const LotSelectionModal = ({ product, quantity }) => {
  const { data: lots } = useQuery({
    queryKey: ['available-lots', product.id],
    queryFn: () => getAvailableLots(product.id, warehouseId, 'FEFO')
  });

  return (
    <Modal title={`Chọn lô cho ${product.name}`}>
      <Table
        dataSource={lots}
        columns={[
          { title: 'Số Lô', dataIndex: 'lot_number' },
          { title: 'HSD', dataIndex: 'expiry_date' },
          { title: 'Còn lại', dataIndex: 'quantity_available' },
          { title: 'VAT khả dụng', dataIndex: 'vat_available' },
          {
            title: 'Chọn',
            render: (lot) => (
              <Button onClick={() => selectLot(lot)}>
                Chọn
              </Button>
            )
          }
        ]}
      />

      <Alert type="info">
        💡 Lô được sắp xếp theo HSD gần nhất (FEFO)
      </Alert>
    </Modal>
  );
};
```

### 4. Accounting - Đối Chiếu VAT (NÚT 4)

**Component:** `VatReconciliation.tsx`

```typescript
const VatReconciliation = () => {
  const { data: movements } = useQuery({
    queryKey: ['vat-movements'],
    queryFn: async () => {
      const { data } = await supabase
        .from('lot_movements')
        .select(`
          *,
          purchase_vat:purchase_vat_invoice_id(invoice_number),
          sales_vat:sales_vat_invoice_id(invoice_number)
        `)
        .not('purchase_vat_invoice_id', 'is', null)
        .not('sales_vat_invoice_id', 'is', null);
      return data;
    }
  });

  return (
    <Table
      title="Đối Chiếu Hóa Đơn VAT"
      dataSource={movements}
      columns={[
        { title: 'Sản phẩm', dataIndex: ['lot', 'product', 'name'] },
        { title: 'Số Lô', dataIndex: ['lot', 'lot_number'] },
        { title: 'Số lượng', dataIndex: 'quantity' },
        {
          title: 'HĐ VAT Mua',
          dataIndex: ['purchase_vat', 'invoice_number'],
          render: (num) => <Tag color="blue">{num}</Tag>
        },
        {
          title: 'HĐ VAT Bán',
          dataIndex: ['sales_vat', 'invoice_number'],
          render: (num) => <Tag color="green">{num}</Tag>
        }
      ]}
    />
  );
};
```

## Services Implementation

### Lot Service

```typescript
// packages/services/src/lotService.ts

export const getAvailableLots = async (
  productId: number,
  warehouseId: number,
  strategy: 'FIFO' | 'FEFO' = 'FEFO'
) => {
  const { data, error } = await supabase
    .rpc('get_available_lots', {
      p_product_id: productId,
      p_warehouse_id: warehouseId,
      p_strategy: strategy
    });

  return { data, error };
};

export const reserveLotQuantity = async (params: {
  lotId: number;
  quantity: number;
  orderId: number;
  orderType: string;
  employeeId: string;
}) => {
  const { data, error } = await supabase
    .rpc('reserve_lot_quantity', {
      p_lot_id: params.lotId,
      p_quantity: params.quantity,
      p_order_id: params.orderId,
      p_order_type: params.orderType,
      p_employee_id: params.employeeId
    });

  return { data, error };
};

export const sellLotQuantity = async (params: {
  lotId: number;
  quantity: number;
  orderId: number;
  orderType: string;
  salesVatInvoiceId?: number;
  employeeId: string;
}) => {
  const { data, error } = await supabase
    .rpc('sell_lot_quantity', {
      p_lot_id: params.lotId,
      p_quantity: params.quantity,
      p_order_id: params.orderId,
      p_order_type: params.orderType,
      p_sales_vat_invoice_id: params.salesVatInvoiceId,
      p_employee_id: params.employeeId
    });

  return { data, error };
};

// NÚT 2: OCR/AI Integration
export const extractLotFromImage = async (imageData: string) => {
  const response = await fetch('/api/ocr/extract-lot', {
    method: 'POST',
    body: JSON.stringify({ image: imageData })
  });
  return response.json();
};

export const extractLotFromPDF = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/ocr/extract-lot-pdf', {
    method: 'POST',
    body: formData
  });
  return response.json();
};

// NÚT 3: Barcode verification
export const verifyBarcodeInOrder = async (
  barcode: string,
  orderId: number
) => {
  const { data: product } = await supabase
    .from('products')
    .select('id, name, barcode')
    .eq('barcode', barcode)
    .single();

  if (!product) {
    return { found: false, message: 'Không tìm thấy sản phẩm' };
  }

  const { data: orderItem } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', orderId)
    .eq('product_id', product.id)
    .single();

  return {
    found: !!orderItem,
    product,
    message: orderItem
      ? '✅ Sản phẩm có trong đơn'
      : '❌ Sản phẩm KHÔNG có trong đơn'
  };
};

// NÚT 4: VAT tracking
export const checkVatAvailability = async (lotId: number) => {
  const { data } = await supabase
    .from('vat_warehouse_inventory')
    .select('quantity_available')
    .eq('lot_id', lotId)
    .single();

  return data?.quantity_available || 0;
};

export const createVatInvoice = async (params: {
  invoiceType: 'purchase' | 'sales';
  invoiceNumber: string;
  supplierId?: number;
  customerId?: number;
  items: Array<{
    productId: number;
    lotId: number;
    quantity: number;
    unitPrice: number;
  }>;
}) => {
  // Create VAT invoice
  const { data: invoice } = await supabase
    .from('vat_invoices')
    .insert({
      invoice_number: params.invoiceNumber,
      invoice_type: params.invoiceType,
      supplier_id: params.supplierId,
      customer_id: params.customerId,
      total_amount: params.items.reduce((sum, item) =>
        sum + (item.quantity * item.unitPrice), 0
      )
    })
    .select()
    .single();

  // Create invoice items
  await supabase
    .from('vat_invoice_items')
    .insert(params.items.map(item => ({
      vat_invoice_id: invoice.id,
      product_id: item.productId,
      lot_id: item.lotId,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      subtotal: item.quantity * item.unitPrice
    })));

  return invoice;
};
```

## Migration Steps

1. **Run Migration:**
   ```bash
   psql -U postgres -d your_db -f lot-management-system.sql
   ```

2. **Verify Tables:**
   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name LIKE '%lot%' OR table_name LIKE '%vat%';
   ```

3. **Test Functions:**
   ```sql
   -- Test get available lots
   SELECT * FROM get_available_lots(1, 1, 'FEFO');

   -- Test reserve
   SELECT reserve_lot_quantity(1, 10, 1, 'pos', 'emp-uuid');
   ```

## Best Practices

1. **Luôn dùng FEFO** cho sản phẩm có HSD
2. **Kiểm tra VAT** trước khi xuất hóa đơn VAT
3. **Scan barcode** khi nhận hàng và giao hàng
4. **Upload hóa đơn NCC** để OCR tự động nhập lô
5. **Đối chiếu VAT** định kỳ hàng tháng

## Troubleshooting

**Q: Không xuất được hóa đơn VAT?**
- Kiểm tra `vat_warehouse_inventory.quantity_available`
- Đảm bảo đã nhập hóa đơn VAT mua vào

**Q: OCR không đọc được lô/HSD?**
- Chụp ảnh rõ nét, đủ sáng
- Thử upload PDF thay vì ảnh
- Nhập thủ công nếu OCR thất bại

**Q: Lô nào được chọn trước?**
- FEFO: Lô có HSD gần nhất
- FIFO: Lô nhập trước

## Roadmap

- [ ] Tích hợp AI OCR cho NÚT 2
- [ ] Thêm báo cáo hết hạn
- [ ] Cảnh báo lô sắp hết hạn
- [ ] Export báo cáo VAT cho kế toán
- [ ] Mobile app cho nhân viên kho

---

**Tài liệu này cung cấp đầy đủ hướng dẫn triển khai hệ thống quản lý lô hàng từ database đến UI.**
