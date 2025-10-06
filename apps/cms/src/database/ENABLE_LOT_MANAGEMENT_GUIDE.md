# Enable Lot Management Feature

## Overview
This feature adds the ability to enable/disable lot management on a per-product basis. When enabled, products will require lot number, expiry date, and other lot-specific information during receiving and selling operations.

## Database Changes

### Migration File
**Location**: `/apps/cms/src/database/add-enable-lot-management.sql`

### Changes Made:
1. Added `enable_lot_management` column to `products` table
   - Type: `BOOLEAN`
   - Default: `FALSE`
   - Description: Flag to enable lot/batch tracking for this product

2. Created index for performance:
   ```sql
   CREATE INDEX idx_products_enable_lot_management
   ON products(enable_lot_management)
   WHERE enable_lot_management = TRUE;
   ```

## UI Changes

### Product Form (`ProductForm.tsx`)
Added a new section "Quản lý Lô hàng" in the "Thông tin chung" tab with:

1. **Checkbox**: "Bật quản lý theo lô/batch"
   - Field name: `enable_lot_management`
   - Type: `Checkbox`
   - Value prop: `checked`

2. **Information Alert**:
   - Explains what happens when lot management is enabled
   - Message: "Khi bật quản lý lô, sản phẩm này sẽ yêu cầu thông tin số lô, hạn sử dụng, và vị trí kệ khi nhập/xuất kho."

### Location in Form
The checkbox appears after the "Bệnh áp dụng" field and before the "Giá & Kinh doanh" tab.

## Type Updates

### 1. ProductFormData (`/packages/shared-components/src/types/product.ts`)
```typescript
export interface ProductFormData {
  // ... other fields

  // Lot Management
  enable_lot_management?: boolean;

  // ... other fields
}
```

### 2. IProduct (`/types/index.d.ts`)
```typescript
interface IProduct {
  // ... other fields

  enable_lot_management?: boolean;
}
```

## How It Works

### 1. Creating a Product
When creating a new product:
1. User fills in product details
2. In the "Thông tin chung" tab, user can check "Bật quản lý theo lô/batch"
3. When saved, the `enable_lot_management` field is stored in the database

### 2. Editing a Product
The checkbox will show the current status and can be toggled on/off when editing.

### 3. Integration with Lot Management System
When `enable_lot_management = TRUE`:
- Product will appear in warehouse lot management screens
- During receiving (purchase orders), lot information will be required:
  - Lot number
  - Expiry date
  - Manufacturing date (optional)
  - Shelf location (optional)
- During selling, system will use FIFO/FEFO logic
- System will track lot movements and quantities

When `enable_lot_management = FALSE`:
- Product uses simple inventory tracking
- No lot information required
- Standard stock in/out operations

## Usage Examples

### Products That Should Enable Lot Management:
✅ Pharmaceuticals (medicines)
✅ Food supplements
✅ Cosmetics with expiry dates
✅ Medical devices with batch numbers
✅ Any product requiring traceability

### Products That Don't Need Lot Management:
❌ Office supplies
❌ Hardware items without expiry
❌ Fixed assets
❌ Services

## Migration Steps

1. **Run the SQL migration**:
   ```bash
   psql -h [host] -U [user] -d [database] -f add-enable-lot-management.sql
   ```

2. **Update existing products** (optional):
   ```sql
   -- Example: Enable lot management for medicine category
   UPDATE products
   SET enable_lot_management = TRUE
   WHERE category IN ('Thuốc', 'Thực phẩm chức năng', 'Mỹ phẩm');
   ```

3. **Restart the application** to pick up the new field

## Future Enhancements

1. **Bulk Enable/Disable**: Add UI to enable lot management for multiple products at once
2. **Category Default**: Set default lot management based on product category
3. **Validation Rules**: Add validation to ensure products with lot management have proper lot info during operations
4. **Analytics**: Track which products use lot management and their compliance rates

## Related Files

- Database: `/apps/cms/src/database/add-enable-lot-management.sql`
- UI Component: `/packages/shared-components/src/components/ProductForm.tsx`
- Types:
  - `/packages/shared-components/src/types/product.ts`
  - `/types/index.d.ts`
- Lot Management Service: `/packages/services/src/lotManagementService.ts`
- Warehouse UI: `/packages/shared-components/src/screens/warehouse/WarehouseLotManagementPage.tsx`
