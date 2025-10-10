# Product Lot Management

Product Lot Management system enables tracking products by lot numbers with batch codes, expiry dates, and warehouse-specific quantities. This is essential for pharmaceutical, food, and regulated products.

## 🎯 Overview

**Purpose**: Track and manage products by individual lots for expiry management, batch recall, and FIFO/FEFO inventory control.

**Key Components**:

- Product Lot CRUD operations
- Lot-based inventory tracking
- Expiry date management
- Batch code tracking
- Warehouse-specific lot quantities

## ✨ Key Features

### 1. **Lot Tracking**

- Unique lot numbers per product
- Batch code association
- Expiry date tracking
- Received date logging
- Warehouse-specific quantities

### 2. **Lot Management Interface**

- Create new lots with speech-to-text support
- Edit lot details
- Delete lots with inventory sync
- View lot details and history
- Filter lots by warehouse

### 3. **Inventory Synchronization**

- Automatic inventory updates on lot changes
- Warehouse-specific quantity tracking
- Real-time sync across all screens
- Entity Store integration for instant updates

### 4. **Expiry Management**

- Visual expiry warnings
- Days until expiry calculation
- Status indicators:
  - **Green**: >30 days until expiry
  - **Orange**: <30 days until expiry
  - **Red**: Expired
- Automatic expiry date validation

### 5. **POS Integration**

- Lot selection during product sale
- Visual lot information in cart
- Different lots as separate line items
- Expiry warnings during selection

## 🏗️ Database Schema

### product_lots Table

```sql
CREATE TABLE product_lots (
  id SERIAL PRIMARY KEY,
  lot_number VARCHAR(255) NOT NULL,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  warehouse_id INTEGER REFERENCES warehouses(id) ON DELETE CASCADE,
  batch_code VARCHAR(255),
  expiry_date DATE,
  received_date DATE,
  quantity INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_lot_per_product_warehouse
    UNIQUE(lot_number, product_id, warehouse_id)
);

-- Indexes
CREATE INDEX idx_product_lots_product ON product_lots(product_id);
CREATE INDEX idx_product_lots_warehouse ON product_lots(warehouse_id);
CREATE INDEX idx_product_lots_expiry ON product_lots(expiry_date);
```

### products Table (Lot Management Flag)

```sql
ALTER TABLE products
ADD COLUMN enable_lot_management BOOLEAN DEFAULT FALSE;
```

## 🔄 User Workflows

### Workflow 1: Enable Lot Management for Product

1. **Navigate to Product Form** (Create/Edit)
2. **Enable Lot Management**
   - Toggle "Kích hoạt quản lý theo lô" switch
   - System creates default lot if needed
3. **Save Product**
   - Product marked as lot-managed
   - Default lot created with initial quantity

### Workflow 2: Create New Product Lot

1. **Open Product Detail Page**
   - View "Quản lý lô hàng" section
   - Click "Thêm lô hàng mới"

2. **Fill Lot Information**
   - **Lot Number** (Required)
     - Manual input or speech-to-text
     - Auto-uppercase conversion
     - Unique validation
   - **Warehouse** (Required)
   - **Batch Code** (Optional)
   - **Expiry Date** (Optional)
   - **Received Date** (Optional)
   - **Initial Quantity** (Required)

3. **Submit**
   - Lot created in database
   - Inventory synced automatically
   - Entity Store updated
   - All screens refresh instantly

### Workflow 3: Update Lot Quantity

1. **Navigate to Lot Detail Page**
   - Click lot number in lot management table
   - Or use direct URL `/lots/:lotId`

2. **Edit Quantity**
   - Click "Chỉnh sửa" on quantity field
   - Enter new quantity
   - Click "Lưu"

3. **Automatic Sync**
   - Lot quantity updated
   - Warehouse inventory recalculated
   - Product total inventory updated
   - Entity Store synced
   - All screens update instantly

### Workflow 4: Delete Product Lot

1. **Find Lot in Management Table**
2. **Click Delete Button**
3. **Confirm Deletion**
   - Warning dialog appears
   - Shows lot number and impact

4. **Automatic Cleanup**
   - Lot removed from database
   - Warehouse inventory decreased
   - Product inventory recalculated
   - Entity Store updated
   - Success notification shown

### Workflow 5: POS Lot Selection

1. **Search Product in POS**
   - Product with `enable_lot_management: true`

2. **Click Product Card**
   - Lot Selection Modal opens automatically
   - Shows available lots for current warehouse

3. **Select Lot**
   - View lot details:
     - Lot number
     - Batch code
     - Expiry date (with warnings)
     - Available quantity
   - Select desired lot
   - Choose quantity

4. **Add to Cart**
   - Product added with lot information
   - Cart shows: Product + Lot Number (Batch Code)
   - Different lots = separate cart items

## 🎨 UI Components

### AddLotModal Component

**Location**: `packages/shared-components/src/components/AddLotModal.tsx`

**Features**:

- Form with validation
- Speech-to-text for lot number
  - Automatic space removal
  - Uppercase conversion
  - Voice input support
- Date pickers for expiry/received dates
- Warehouse selection
- Initial quantity input
- Real-time validation

**Usage**:

```typescript
<AddLotModal
  open={isOpen}
  onClose={() => setIsOpen(false)}
  onSuccess={handleSuccess}
  productId={productId}
  warehouses={warehouses}
/>
```

### ProductLotManagement Component

**Location**: `packages/shared-components/src/components/ProductLotManagement.tsx`

**Features**:

- Lot list table with Ant Design Table
- Warehouse filter dropdown
- Add new lot button
- Delete lot action
- Navigate to lot detail
- Entity Store integration
- Real-time updates

**Usage**:

```typescript
<ProductLotManagement
  productId={productId}
  isEnabled={product.enable_lot_management}
  warehouses={warehouses}
/>
```

### LotSelectionModal Component

**Location**: `packages/shared-components/src/components/LotSelectionModal.tsx`

**Features**:

- Available lots list
- Expiry status indicators
- Quantity selector
- Auto-select single lot
- Validation against available quantity

**Usage**:

```typescript
<LotSelectionModal
  open={isOpen}
  onClose={() => setIsOpen(false)}
  onSelect={(lot, quantity) => handleLotSelect(lot, quantity)}
  product={selectedProduct}
  warehouseId={warehouseId}
/>
```

### ProductLotDetailPage

**Location**: `packages/shared-components/src/screens/inventory/ProductLotDetailPage.tsx`

**Features**:

- Lot information display
- Editable quantity field
- Expiry status badge
- Days until expiry calculation
- Invalid date handling
- Back navigation to product

## 🔧 Technical Implementation

### Entity Store Integration

The lot management system fully integrates with Entity Store for automatic cross-screen synchronization.

**Store Actions**:

```typescript
// Add/Update lots
useEntityStore.getState().setProductLot(lot);
useEntityStore.getState().setProductLots(lots);
useEntityStore.getState().updateProductLot(lotId, updates);
useEntityStore.getState().deleteProductLot(lotId);

// Subscribe to lots
const lot = useEntityProductLot(lotId);
const lots = useEntityProductLotsByProduct(productId);
const lots = useEntityProductLotsByWarehouse(productId, warehouseId);
```

**Example: Create Lot**

```typescript
const handleCreateLot = async (lotData) => {
  const { data, error } = await createProductLotWithInventory({
    ...lotData,
    product_id: productId,
  });

  if (data) {
    // ✅ Update Entity Store - all screens sync instantly!
    useEntityStore.getState().setProductLot(data);

    notification.success({
      message: "Lô hàng đã được tạo",
    });
  }
};
```

**Example: Update Quantity**

```typescript
const handleUpdateQuantity = async (lotId, newQuantity) => {
  // Optimistic update - UI updates immediately
  useEntityStore.getState().updateProductLot(lotId, {
    quantity: newQuantity,
  });

  // Sync with server
  const { error } = await updateProductLotQuantity({
    lotId,
    productId,
    warehouseId,
    newQuantityAvailable: newQuantity,
  });

  if (error) {
    // Revert on error
    const originalLot = await fetchProductLot(lotId);
    useEntityStore.getState().setProductLot(originalLot);

    notification.error({ message: "Cập nhật thất bại" });
  }
};
```

### Service Layer

**Location**: `packages/services/src/lotManagementService.ts`

**Key Functions**:

```typescript
// Create lot with inventory sync
export const createProductLotWithInventory = async (params: {
  lot_number: string;
  product_id: number;
  warehouse_id: number;
  batch_code?: string;
  expiry_date?: string;
  received_date?: string;
  quantity: number;
}) => {
  // 1. Create lot
  const { data: lot, error } = await createProductLot(params);

  if (lot) {
    // 2. Auto-update entity store
    useEntityStore.getState().setProductLot(lot);

    // 3. Sync to inventory
    await syncLotQuantityToInventory({
      productId: params.product_id,
      warehouseId: params.warehouse_id,
    });
  }

  return { data: lot, error };
};

// Delete lot with inventory sync
export const deleteProductLot = async (params: {
  lotId: number;
  productId: number;
  warehouseId: number;
}) => {
  // 1. Delete lot
  await supabase.from("product_lots").delete().eq("id", params.lotId);

  // 2. Auto-update entity store
  useEntityStore.getState().deleteProductLot(params.lotId);

  // 3. Sync to inventory
  await syncLotQuantityToInventory({
    productId: params.productId,
    warehouseId: params.warehouseId,
  });

  return { error: null };
};

// Update lot quantity with inventory sync
export const updateProductLotQuantity = async (params: {
  lotId: number;
  productId: number;
  warehouseId: number;
  newQuantityAvailable: number;
}) => {
  // 1. Update lot quantity
  const { data, error } = await supabase
    .from("product_lots")
    .update({ quantity: params.newQuantityAvailable })
    .eq("id", params.lotId)
    .select()
    .single();

  if (data) {
    // 2. Auto-update entity store
    useEntityStore.getState().updateProductLot(params.lotId, {
      quantity: params.newQuantityAvailable,
    });

    // 3. Sync to inventory
    await syncLotQuantityToInventory({
      productId: params.productId,
      warehouseId: params.warehouseId,
    });
  }

  return { error };
};
```

### Inventory Synchronization

```typescript
// Sync lot quantities to inventory table
export const syncLotQuantityToInventory = async (params: {
  productId: number;
  warehouseId: number;
}) => {
  // 1. Calculate total from all lots
  const { data: lots } = await supabase
    .from("product_lots")
    .select("quantity")
    .eq("product_id", params.productId)
    .eq("warehouse_id", params.warehouseId);

  const totalQuantity =
    lots?.reduce((sum, lot) => sum + (lot.quantity || 0), 0) || 0;

  // 2. Update inventory table
  const { data: inventory } = await supabase
    .from("inventory")
    .upsert({
      product_id: params.productId,
      warehouse_id: params.warehouseId,
      quantity: totalQuantity,
    })
    .select()
    .single();

  // 3. Update entity store
  if (inventory) {
    useEntityStore.getState().setInventory(inventory);
  }

  return { totalQuantity, inventory };
};
```

## 📊 Data Flow

### Create Lot Flow

```
User Creates Lot
        ↓
AddLotModal Submit
        ↓
createProductLotWithInventory()
        ↓
1. Insert to product_lots table
        ↓
2. Update Entity Store (setProductLot)
        ↓
3. Calculate total from all lots
        ↓
4. Upsert inventory table
        ↓
5. Update Entity Store (setInventory)
        ↓
All Screens Re-render (Auto-sync)
```

### Update Quantity Flow

```
User Edits Quantity
        ↓
ProductLotDetailPage
        ↓
updateProductLotQuantity()
        ↓
1. Update lot quantity in DB
        ↓
2. Update Entity Store (updateProductLot)
        ↓
3. Recalculate warehouse inventory
        ↓
4. Upsert inventory table
        ↓
5. Update Entity Store (setInventory)
        ↓
All Screens Re-render (Auto-sync)
```

### POS Lot Selection Flow

```
User Clicks Lot-Managed Product
        ↓
Check enable_lot_management = true
        ↓
Open LotSelectionModal
        ↓
Fetch Available Lots (by warehouse)
        ↓
Display Lots with Expiry Status
        ↓
User Selects Lot + Quantity
        ↓
Validate Quantity ≤ Lot Quantity
        ↓
Add to Cart with Lot Info
        ↓
Cart Displays: Product + Lot Number (Batch)
```

## 🎯 Best Practices

### 1. **Lot Number Format**

```typescript
// ✅ Uppercase, no spaces
lot_number: "LOT001";
lot_number: "BATCH-2024-001";

// ❌ Avoid lowercase, spaces
lot_number: "lot 001"; // Wrong
lot_number: "batch-2024-001"; // Wrong (lowercase)
```

### 2. **Expiry Date Validation**

```typescript
// ✅ Validate before setting to form
const expiryDate =
  data?.expiry_date && dayjs(data.expiry_date).isValid()
    ? dayjs(data.expiry_date)
    : null;

form.setFieldsValue({ expiry_date: expiryDate });

// ✅ Check validity before calculations
const daysUntilExpiry =
  data?.expiry_date && dayjs(data.expiry_date).isValid()
    ? dayjs(data.expiry_date).diff(dayjs(), "day")
    : null;
```

### 3. **Entity Store Updates**

```typescript
// ✅ Always update Entity Store after mutations
const result = await createProductLot(data);
if (result.data) {
  useEntityStore.getState().setProductLot(result.data);
}

// ❌ Don't forget Entity Store update
const result = await createProductLot(data);
// Missing store update - other screens won't sync!
```

### 4. **Inventory Sync**

```typescript
// ✅ Always sync inventory after lot changes
await syncLotQuantityToInventory({
  productId,
  warehouseId,
});

// ❌ Don't skip inventory sync
// Inventory will be out of sync with lot quantities!
```

## 🔒 Data Validation

### 1. **Unique Lot Numbers**

- Per product + warehouse combination
- Database constraint enforces uniqueness
- UI validation before submission

### 2. **Quantity Validation**

- Must be non-negative
- POS validates against available lot quantity
- Inventory sync ensures consistency

### 3. **Date Validation**

- Expiry date must be valid or null
- Received date must be valid or null
- UI handles invalid dates gracefully

### 4. **Warehouse Assignment**

- Lot must belong to a warehouse
- Employee can only create lots in assigned warehouse
- POS only shows lots from current warehouse

## 📈 Reporting & Analytics

### Available Reports

1. **Expiring Products**
   - Products expiring within 30 days
   - Grouped by warehouse
   - Sorted by expiry date

2. **Lot Movement**
   - Lot creation history
   - Quantity changes over time
   - Sales by lot

3. **Batch Recall**
   - Find all sales for specific batch
   - Customer notification list
   - Remaining stock by batch

4. **Inventory by Lot**
   - Current stock per lot
   - Expiry status
   - Warehouse distribution

## 📚 Related Documentation

- [POS System](./pos-system.md) - Lot selection in POS
- [Inventory Management](./inventory-management.md) - Overall inventory
- [Entity Store Guide](../../packages/store/ENTITY_STORE_GUIDE.md) - Store usage
- [Quick Start](../../packages/store/QUICK_START.md) - Implementation guide
- [Services Overview](../api/services-overview.md) - API layer
