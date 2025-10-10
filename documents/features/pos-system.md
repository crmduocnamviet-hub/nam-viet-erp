# POS (Point of Sale) System

The POS System is a comprehensive point-of-sale solution designed for retail operations with support for product lot management, customer tracking, combo deals, and multi-tab order management.

## 🎯 Overview

**Location**: `packages/shared-components/src/screens/pos/PosPage.tsx`

**Purpose**: Enable retail staff to process sales transactions efficiently with advanced features like lot selection, combo detection, and customer management.

**Access**: Requires `pos.access` and `sales.create` permissions

## ✨ Key Features

### 1. **Multi-Tab Order Management**

- Create multiple order tabs simultaneously
- Switch between orders seamlessly
- Rename order tabs with double-click
- Visual badge showing item count per tab
- Independent cart, customer, and warehouse per tab

### 2. **Product Search & Selection**

- Real-time product search by name, barcode, or product code
- Category-based filtering with tabs
- Grid view with product images
- Stock quantity indicators
- QR/Barcode scanner integration
- Instant add-to-cart with click

### 3. **Product Lot Management**

- Automatic lot selection for lot-managed products
- Display available lots with quantity
- Expiry date warnings (orange <30 days, red expired)
- Different lots of same product as separate cart items
- Lot information displayed in cart (lot number, batch code)

### 4. **Shopping Cart**

- Real-time price calculations
- Quantity adjustments with validation
- Stock availability checks
- Combo/promotion detection
- Support for both regular and lot-managed products
- Separate items for different lots

### 5. **Customer Management**

- Customer search by phone or name
- Quick customer creation from POS
- Display customer details and loyalty points
- Associate customer with order
- Customer history tracking

### 6. **Combo Detection & Suggestions**

- Automatic combo detection based on cart items
- Visual combo suggestions with savings
- One-click combo application
- Automatic price adjustments
- Original vs combo price comparison

### 7. **Payment Processing**

- Cash payment
- Card/Bank transfer payment
- Multi-payment method support
- Payment modal with receipt preview
- Stock validation before payment
- Automatic inventory updates

### 8. **Warehouse Integration**

- Employee-assigned warehouse
- Warehouse-specific inventory
- Stock validation per warehouse
- Lot-based inventory tracking

## 🏗️ Architecture

### Component Structure

```
PosPage (Main Container)
├── Multi-Tab Interface (Ant Design Tabs)
│   └── PosTabContent (Per Tab)
│       ├── Top Bar
│       │   ├── Warehouse Display
│       │   └── Customer Search
│       ├── Product Grid (Left Panel)
│       │   ├── Search Bar
│       │   ├── Category Tabs
│       │   └── Product Cards
│       └── Cart & Payment (Right Panel)
│           ├── Cart Items List
│           ├── Combo Suggestions
│           ├── Price Summary
│           └── Payment Buttons
├── PaymentModal
├── LotSelectionModal
├── CreateCustomerModal
└── QRScannerModal
```

### State Management

```typescript
// POS Store (Multi-tab state)
usePosStore() {
  tabs: [
    {
      id: string,
      title: string,
      cart: CartItem[],
      selectedCustomer: IPatient | null,
      selectedWarehouse: IWarehouse | null
    }
  ],
  activeTabId: string,
  isProcessingPayment: boolean
}

// Entity Store (Product data)
useEntityProduct(productId)
useEntityProductLotsByProduct(productId)

// Inventory Store (Stock data)
useInventory()
```

## 🔄 User Workflows

### Workflow 1: Basic Sale (Non-Lot Product)

1. **Search Product**
   - Type product name/barcode in search
   - Or click category tab to browse
   - Or use QR scanner

2. **Add to Cart**
   - Click product card
   - Product added with quantity 1
   - Stock validation performed

3. **Adjust Quantity** (Optional)
   - Use InputNumber in cart
   - Real-time stock validation
   - Update total price

4. **Select Customer** (Optional)
   - Search by phone/name
   - Select from dropdown
   - Or create new customer

5. **Process Payment**
   - Click "Thanh toán - Tiền mặt" or "Thẻ / Chuyển khoản"
   - Review order in payment modal
   - Confirm payment
   - Inventory automatically updated

### Workflow 2: Sale with Lot-Managed Product

1. **Search Lot-Managed Product**
   - Product with `enable_lot_management: true`

2. **Select Lot**
   - Click product → Lot Selection Modal opens
   - View available lots with:
     - Lot number
     - Batch code
     - Expiry date (with warnings)
     - Available quantity
   - Select lot
   - Choose quantity (max = lot quantity)
   - Confirm selection

3. **Cart Shows Lot Info**
   - Product name
   - Lot number and batch code
   - Quantity
   - Price

4. **Process Payment**
   - Same as non-lot products
   - Lot-specific inventory updated

### Workflow 3: Combo Purchase

1. **Add Combo Products**
   - Add multiple products to cart
   - E.g., Product A + Product B

2. **Combo Detection**
   - System detects matching combo
   - Combo suggestion appears with:
     - Combo name
     - Savings amount
     - One-click apply button

3. **Apply Combo**
   - Click combo button
   - Individual products removed
   - Combo item added
   - Price updated to combo price

4. **Process Payment**
   - Combo shown as single item
   - Individual products deducted from inventory

### Workflow 4: Multi-Tab Orders

1. **Create New Tab**
   - Click "+" on tab bar
   - New tab created with empty cart

2. **Work on Multiple Orders**
   - Switch tabs to work on different orders
   - Each tab maintains independent:
     - Cart items
     - Customer selection
     - Warehouse

3. **Rename Tab**
   - Double-click tab title
   - Enter new name
   - Helps organize multiple orders

4. **Complete Order**
   - Process payment for active tab
   - Tab cart clears after successful payment
   - Tab remains for new order

5. **Close Tab**
   - Click X on tab
   - Confirmation if cart not empty
   - Minimum 1 tab required

## 🎨 UI/UX Features

### Desktop Layout

```
┌─────────────────────────────────────────────────────────┐
│  Warehouse: Kho 1    |    Customer Search              │
├─────────────────────────┬───────────────────────────────┤
│                         │  🛒 Cart (3 items)            │
│   Product Grid          │  ────────────────────         │
│                         │  • Product A (Lô: LOT001)     │
│  ┌────┐ ┌────┐ ┌────┐  │    50,000đ x 2 = 100,000đ     │
│  │ P1 │ │ P2 │ │ P3 │  │                               │
│  └────┘ └────┘ └────┘  │  • Product B                  │
│                         │    30,000đ x 1 = 30,000đ      │
│  ┌────┐ ┌────┐ ┌────┐  │                               │
│  │ P4 │ │ P5 │ │ P6 │  │  🎁 Combo khuyến mãi!        │
│  └────┘ └────┘ └────┘  │  ✅ Combo A+B - Tiết kiệm    │
│                         │     20,000đ                   │
│                         │  ────────────────────         │
│                         │  Tổng: 130,000đ              │
│                         │  [Thanh toán - Tiền mặt]     │
│                         │  [Thẻ / Chuyển khoản]        │
└─────────────────────────┴───────────────────────────────┘
```

### Mobile Layout

- Product grid collapses to 2 columns
- Cart hidden, accessible via floating button
- Full-screen cart modal when opened
- Touch-optimized controls

### Fullscreen Mode

- No top menu or sidebar
- Maximum screen space for POS
- Route: `/pos` renders fullscreen
- Optimized for retail kiosk setups

## 🔧 Technical Implementation

### Product Addition Logic

```typescript
const handleAddToCart = (product: IProduct) => {
  // Check stock
  if (!product.stock_quantity || product.stock_quantity <= 0) {
    notification.error({ message: "Hết hàng" });
    return;
  }

  // Check if lot-managed
  if (product.enable_lot_management && employeeWarehouse) {
    setSelectedProductForLot(product);
    setIsLotSelectionModalOpen(true);
    return;
  }

  // Check existing item
  const existingItem = cart.find(
    (item) => item.id === product.id && !item.lot_id,
  );

  if (existingItem) {
    const newQuantity = existingItem.quantity + 1;

    // Validate stock
    if (newQuantity > product.stock_quantity) {
      notification.error({ message: "Vượt quá tồn kho" });
      return;
    }

    updateCartItem(existingItem.key, {
      quantity: newQuantity,
      total: existingItem.price * newQuantity,
    });
  } else {
    // Add new item
    const priceInfo = calculateBestPrice(product, promotions);
    const cartItem = {
      key: `${product.id}_${Date.now()}`,
      id: product.id,
      quantity: 1,
      price: priceInfo.finalPrice,
      total: priceInfo.finalPrice,
      ...priceInfo,
      stock_quantity: product.stock_quantity,
    };

    addCartItem(cartItem);
  }
};
```

### Lot Selection Logic

```typescript
const handleLotSelect = (lot: IProductLot, quantity: number) => {
  const existingItem = cart.find(
    (item) => item.id === selectedProductForLot.id && item.lot_id === lot.id,
  );

  if (existingItem) {
    const newQuantity = existingItem.quantity + quantity;

    if (lot.quantity && newQuantity > lot.quantity) {
      notification.error({ message: "Vượt quá tồn kho lô" });
      return;
    }

    updateCartItem(existingItem.key, {
      quantity: newQuantity,
      total: existingItem.price * newQuantity,
    });
  } else {
    const cartItem = {
      key: `${selectedProductForLot.id}_${lot.id}_${Date.now()}`,
      id: selectedProductForLot.id,
      quantity: quantity,
      lot_id: lot.id,
      lot_number: lot.lot_number,
      batch_code: lot.batch_code,
      expiry_date: lot.expiry_date,
      stock_quantity: lot.quantity,
    };

    addCartItem(cartItem, true);
  }
};
```

### Combo Detection Logic

```typescript
const detectedCombos = useMemo(() => {
  if (cart.length === 0 || storedCombos.length === 0) {
    return [];
  }

  const regularItems = cart
    .filter((item) => !item.isCombo)
    .map((item) => ({ id: item.id, quantity: item.quantity }));

  const matchedCombos = [];

  for (const combo of storedCombos) {
    let isMatch = true;

    for (const comboItem of combo.combo_items) {
      const cartItem = regularItems.find(
        (ci) => ci.id === comboItem.product_id,
      );

      if (!cartItem || cartItem.quantity < comboItem.quantity) {
        isMatch = false;
        break;
      }
    }

    if (isMatch && combo.combo_items.length > 0) {
      matchedCombos.push(combo);
    }
  }

  return matchedCombos;
}, [cart, storedCombos]);
```

## 🎯 Key Components

### LotSelectionModal

**Location**: `packages/shared-components/src/components/LotSelectionModal.tsx`

**Purpose**: Allow users to select specific product lots

**Features**:

- Display available lots with details
- Visual expiry warnings
- Quantity selector with validation
- Auto-select if only one lot available

### PosTabContent

**Location**: `packages/shared-components/src/components/PosTabContent.tsx`

**Purpose**: Main POS interface for each tab

**Features**:

- Product grid with search
- Category filtering
- Cart display
- Combo suggestions
- Payment actions

### PaymentModal

**Location**: `packages/shared-components/src/components/PaymentModal.tsx`

**Purpose**: Process payment and generate receipt

**Features**:

- Payment method selection
- Amount entry
- Change calculation
- Receipt preview
- Stock validation

## 📊 Data Flow

```
User Action (Add Product)
        ↓
Product Lookup (Inventory Store)
        ↓
Lot Check (enable_lot_management?)
    ↙         ↘
  Yes          No
   ↓            ↓
Show Lot      Add to Cart
Modal         (POS Store)
   ↓
Select Lot
   ↓
Add to Cart with Lot Info
        ↓
Cart Updates → Combo Detection
        ↓
User Confirms Payment
        ↓
Stock Validation (Global Quantities)
        ↓
Process Payment (API)
        ↓
Update Inventory (Entity Store)
        ↓
Clear Cart → Success Notification
```

## 🔒 Permissions & Security

### Required Permissions

- `pos.access` - Access POS system
- `sales.create` - Create sales orders

### Data Validation

- Stock quantity validation before add to cart
- Global quantity validation (including combos) before payment
- Lot quantity validation for lot-managed products
- Customer data validation on creation

### Inventory Protection

- Real-time stock checks
- Prevent overselling
- Automatic inventory updates
- Transaction logging

## 🚀 Performance Optimizations

1. **Inventory Store Caching**
   - Pre-load warehouse inventory on app start
   - Search locally instead of API calls
   - Faster product lookup

2. **Entity Store Integration**
   - Products cached in normalized store
   - Reduced duplicate API calls
   - Instant data access

3. **Selective Re-renders**
   - Tab-scoped state prevents unnecessary updates
   - Only active tab re-renders on changes
   - Memo-ized combo detection

4. **Optimistic UI Updates**
   - Instant cart updates
   - Background inventory sync
   - Rollback on errors

## 📚 Related Documentation

- [Product Lot Management](./product-lot-management.md)
- [Inventory Management](./inventory-management.md)
- [Customer Management](./customer-management.md)
- [POS User Guide](../guides/pos-user-guide.md)
- [State Management](../architecture/state-management.md)
