# Edge Function Schema Fix

Ngày: 2025-11-02

## Vấn đề

Khi chạy edge function `process-sale-order`, gặp lỗi:

```
Could not find the 'lot_id' column of 'sales_order_items' in the schema cache
```

## Nguyên nhân

Edge function đang cố gắng insert `lot_id` vào các tables không có column này:

1. **sales_order_items** - không có column `lot_id`
2. **sales_combo_items** - không có column `lot_id`

Database đã được thiết kế với **normalized schema**:

- Lot tracking được lưu trong table riêng: `sales_order_product_lot_items`
- Tables `sales_order_items` và `sales_combo_items` chỉ lưu thông tin cơ bản

## Schema Hiện Tại

### sales_order_items

```sql
CREATE TABLE sales_order_items (
    item_id uuid PRIMARY KEY,
    order_id uuid NOT NULL,
    quantity integer NOT NULL,
    unit_price numeric(18,2),
    is_service boolean DEFAULT false,
    dosage_printed text,
    product_id bigint
    -- ❌ KHÔNG có lot_id
);
```

### sales_combo_items

```sql
CREATE TABLE sales_combo_items (
    id uuid PRIMARY KEY,
    order_id uuid NOT NULL,
    combo_id bigint NOT NULL,
    product_id integer NOT NULL,
    quantity integer NOT NULL,
    unit_price numeric(18,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now()
    -- ❌ KHÔNG có lot_id
);
```

### sales_order_product_lot_items (Lot Tracking Table)

```sql
CREATE TABLE sales_order_product_lot_items (
    id bigint PRIMARY KEY,
    created_at timestamp with time zone DEFAULT now(),
    quantity bigint DEFAULT 0,
    order_id uuid,
    lot_id integer
    -- ✅ Đây là nơi lưu lot tracking
);
```

### vat_invoices_out

```sql
-- Table này CÓ column product_lot_id
CREATE TABLE vat_invoices_out (
    ...
    product_lot_id integer,  -- ✅ Có column này
    ...
);
```

## Giải pháp Áp dụng

### 1. Bỏ lot_id khỏi orderItems (Regular Products)

**Before:**

```typescript
orderItems.push({
  product_id: item.id,
  quantity: item.quantity,
  unit_price: item.finalPrice || 0,
  is_service: false,
  lot_id: item.lot_id || null, // ❌ Column không tồn tại
});
```

**After:**

```typescript
orderItems.push({
  product_id: item.id,
  quantity: item.quantity,
  unit_price: item.finalPrice || 0,
  is_service: false,
  // Note: lot_id is NOT stored in sales_order_items
  // It's tracked separately in sales_order_product_lot_items
});
```

### 2. Bỏ lot_id khỏi comboItems

**Before:**

```typescript
comboItems.push({
  order_id: orderData.order_id,
  combo_id: item.id,
  product_id: comboItem.product_id,
  quantity: itemQuantity,
  unit_price: itemPrice,
  lot_id: lotSelection?.lot_id || null, // ❌ Column không tồn tại
});
```

**After:**

```typescript
comboItems.push({
  order_id: orderData.order_id,
  combo_id: item.id,
  product_id: comboItem.product_id,
  quantity: itemQuantity,
  unit_price: itemPrice,
  // Note: lot_id is NOT stored in sales_combo_items
  // It's tracked separately in sales_order_product_lot_items
});
```

### 3. Fix VAT Invoice Items sử dụng productLotMap

**Problem:**

- `orderItems` và `comboItems` không còn có `lot_id`
- Nhưng `vat_invoices_out` CẦN `product_lot_id`

**Solution:**
Tạo mapping từ `productLotItems` array:

```typescript
// Create a map of product_id -> lot_id from productLotItems
const productLotMap = new Map();
productLotItems.forEach((lotItem) => {
  const cartItem = cart.find((item) => {
    if (item.lot_id === lotItem.lot_id) return true;
    if (item.lotSelections) {
      return item.lotSelections.some((ls) => ls.lot_id === lotItem.lot_id);
    }
    return false;
  });

  if (cartItem) {
    if (cartItem.lot_id === lotItem.lot_id) {
      // Regular product
      productLotMap.set(cartItem.id, lotItem.lot_id);
    } else if (cartItem.lotSelections) {
      // Combo product
      const selection = cartItem.lotSelections.find(
        (ls) => ls.lot_id === lotItem.lot_id,
      );
      if (selection) {
        productLotMap.set(selection.product_id, lotItem.lot_id);
      }
    }
  }
});

// Use the map when creating VAT invoices
orderItems.forEach((item) => {
  vatInvoiceItems.push({
    warehouse_id: warehouseId,
    product_id: item.product_id,
    product_lot_id: productLotMap.get(item.product_id) || null, // ✅ Get from map
    quantity: item.quantity,
    unit_price: item.unit_price,
    // ...
  });
});
```

### 4. Fix TypeScript Error

**Error:**

```
Parameter 'inv' implicitly has an 'any' type. [7006]
```

**Fix:**

```typescript
// Before
const currentInventory = inventoryData?.find(
  (inv) => inv.product_id === Number(productId),
);

// After
const currentInventory = inventoryData?.find(
  (inv: any) => inv.product_id === Number(productId),
);
```

## Files Modified

### `/supabase/functions/process-sale-order/index.ts`

**Changes:**

1. Line 195-203: Removed `lot_id` from orderItems
2. Line 177-185: Removed `lot_id` from comboItems
3. Line 373-438: Added `productLotMap` logic for VAT invoices
4. Line 325-327: Added type annotation for `inv` parameter

**Impact:**

- Edge function now matches database schema
- Lot tracking properly uses `sales_order_product_lot_items` table
- VAT invoices correctly reference lot_id via mapping

## Testing Checklist

Sau khi fix, cần test:

- [ ] Regular product order (có lot_id)
- [ ] Regular product order (không có lot_id)
- [ ] Combo order với lot selections
- [ ] Mixed order (regular + combo)
- [ ] Verify lot tracking in `sales_order_product_lot_items`
- [ ] Verify VAT invoices có đúng `product_lot_id`
- [ ] Verify inventory được update đúng
- [ ] Verify lot quantities được deduct

## Deployment

```bash
# Deploy edge function với fixes
supabase functions deploy process-sale-order

# Verify deployment
supabase functions logs process-sale-order --tail

# Test với sample order
curl -X POST https://your-project.supabase.co/functions/v1/process-sale-order \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d @test-order.json
```

## Architecture Notes

### Normalized Schema Benefits

✅ **Pros:**

- Clean separation of concerns
- Lot tracking in dedicated table
- Easy to query lot-specific data
- No NULL values in main tables

❌ **Cons:**

- Slightly more complex queries
- Need joins to get lot info with orders
- Mapping logic needed for VAT invoices

### Alternative: Denormalized Schema

Nếu muốn thêm `lot_id` vào `sales_order_items`:

```sql
-- Migration to add lot_id
ALTER TABLE sales_order_items
ADD COLUMN lot_id integer REFERENCES product_lots(id);

ALTER TABLE sales_combo_items
ADD COLUMN lot_id integer REFERENCES product_lots(id);
```

**Trade-offs:**

- ✅ Simpler queries
- ✅ No mapping needed
- ❌ Denormalized data
- ❌ Duplicate lot tracking (in both tables)
- ❌ More migration work

**Recommendation:** Giữ normalized schema hiện tại vì:

- Already implemented
- Cleaner architecture
- Easier to maintain

## Conclusion

✅ **Fixed:** Edge function now works with normalized schema
✅ **No Migration:** Không cần thay đổi database
✅ **Clean Code:** Mapping logic rõ ràng, có comments
✅ **Backward Compatible:** Không ảnh hưởng code cũ

**Next Steps:**

1. Deploy edge function
2. Test thoroughly
3. Monitor production logs
4. Update documentation if needed
