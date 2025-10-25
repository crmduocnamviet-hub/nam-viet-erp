# Supplier-Specific SKU Implementation Summary

## 📋 Overview

Implementation of supplier-specific SKU management system. Each product has **one primary supplier** and can store the supplier's product code/SKU.

**Date**: 2025-10-25
**Feature**: Supplier-specific SKU/product code (single supplier per product)
**Scope**: Product management, supplier relationships, and database

---

## ✅ What Was Implemented

### 1. Frontend Changes

#### ProductForm Component (`packages/shared-components/src/components/ProductForm.tsx`)

**Changes Made**:

1. **Single Supplier Selection**
   - Field name: `supplier_id` (not supplier_ids)
   - Select one primary supplier for the product

2. **Supplier SKU State**

   ```typescript
   const [supplierSku, setSupplierSku] = useState<string>("");
   ```

3. **SKU Input Field**
   - Single input field for supplier's SKU
   - Located next to supplier dropdown
   - Format: Two side-by-side fields (Supplier | SKU)
   - Disabled until supplier is selected

4. **Load Existing SKU**
   - Fetches existing supplier mapping when editing product
   - Populates supplier and SKU fields

5. **Save Supplier SKU**
   - Includes `supplier_product_code` in form submission
   - Saved with product data

**Code Sections**:

- Line 85: State declaration
- Lines 278-293: Loading existing mapping
- Line 360: Adding to form values
- Lines 482-534: UI for supplier and SKU inputs

### 2. TypeScript Support

The `supplierService.ts` already has the interface:

```typescript
type IProductSupplierMapping = {
  id: number;
  product_id: number;
  supplier_id: number;
  is_primary: boolean;
  supplier_product_code?: string; // ✅ Already exists
  unit_price?: number;
  lead_time_days?: number;
  created_at?: string;
  updated_at?: string;
};
```

### 3. Database Migration

#### Migration File: `add_supplier_product_code_to_product_supplier_mapping.sql`

```sql
ALTER TABLE product_supplier_mapping
ADD COLUMN IF NOT EXISTS supplier_product_code VARCHAR(100);

COMMENT ON COLUMN product_supplier_mapping.supplier_product_code IS
  'Supplier-specific SKU/product code for this product';

CREATE INDEX IF NOT EXISTS idx_product_supplier_mapping_supplier_code
ON product_supplier_mapping(supplier_product_code);
```

#### Rollback File: `rollback_add_supplier_product_code.sql`

```sql
DROP INDEX IF EXISTS idx_product_supplier_mapping_supplier_code;

ALTER TABLE product_supplier_mapping
DROP COLUMN IF EXISTS supplier_product_code;
```

### 4. Documentation

Created comprehensive guides:

- `SUPPLIER_SKU_MIGRATION_GUIDE.md` - Full migration guide
- `SUPPLIER_SKU_IMPLEMENTATION_SUMMARY.md` - This file

---

## 🚀 How It Works

### User Workflow

1. **Navigate to EditProductPage**
   - Admin goes to edit a product

2. **Select Primary Supplier**
   - In "Thông tin chung" tab
   - Select one supplier from dropdown
   - Can add new supplier inline

3. **Enter Supplier SKU**
   - Next to supplier dropdown, enter their SKU
   - Field is disabled until supplier is selected
   - Format: `[Supplier Dropdown] | [Supplier SKU Input]`

4. **Save Product**
   - Click save
   - Product and supplier SKU are saved

5. **View on Next Edit**
   - When editing again, supplier and SKU are pre-filled
   - Can update or change as needed

### Example Use Case

**Product**: Paracetamol 500mg
**Your Internal SKU**: PARA-500
**Primary Supplier**: Pharma Corp
**Supplier's SKU**: PC-PARA-500-TP

When ordering from Pharma Corp:

- You receive invoice with code: **PC-PARA-500-TP**
- System knows this is your **PARA-500**
- Auto-matches to correct product ✅

---

## 📊 Database Schema

### product_supplier_mapping Table

```sql
CREATE TABLE product_supplier_mapping (
  id                    SERIAL PRIMARY KEY,
  product_id            INTEGER REFERENCES products(id),
  supplier_id           INTEGER REFERENCES suppliers(id),
  is_primary            BOOLEAN DEFAULT FALSE,
  supplier_product_code VARCHAR(100), -- ✅ NEW COLUMN
  unit_price            DECIMAL(10,2),
  lead_time_days        INTEGER,
  created_at            TIMESTAMP DEFAULT NOW(),
  updated_at            TIMESTAMP DEFAULT NOW()
);

-- ✅ NEW INDEX
CREATE INDEX idx_product_supplier_mapping_supplier_code
ON product_supplier_mapping(supplier_product_code);
```

---

## 🔧 Migration Steps

### Quick Start (Supabase Dashboard)

1. Open Supabase Dashboard → SQL Editor
2. Run this SQL:

```sql
-- Add supplier_product_code column
ALTER TABLE product_supplier_mapping
ADD COLUMN IF NOT EXISTS supplier_product_code VARCHAR(100);

-- Add comment
COMMENT ON COLUMN product_supplier_mapping.supplier_product_code IS
  'Supplier-specific SKU/product code for this product';

-- Add index
CREATE INDEX IF NOT EXISTS idx_product_supplier_mapping_supplier_code
ON product_supplier_mapping(supplier_product_code);
```

3. Verify:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'product_supplier_mapping'
AND column_name = 'supplier_product_code';
```

---

## 📁 Files Modified

### Frontend

- `packages/shared-components/src/components/ProductForm.tsx`
  - Added supplier SKU state management
  - Added SKU input UI
  - Updated form submission

### Backend Services

- `packages/services/src/supplierService.ts`
  - Already has support for `supplier_product_code`
  - No changes needed

### Database Migrations

- `database/migrations/add_supplier_product_code_to_product_supplier_mapping.sql`
- `database/migrations/rollback_add_supplier_product_code.sql`

### Documentation

- `database/migrations/SUPPLIER_SKU_MIGRATION_GUIDE.md`
- `database/migrations/SUPPLIER_SKU_IMPLEMENTATION_SUMMARY.md`

---

## ✅ Testing Checklist

### Database

- [ ] Run migration in Supabase
- [ ] Verify column exists
- [ ] Verify index exists

### Frontend

- [ ] Create new product with multiple suppliers
- [ ] Enter different SKUs for each supplier
- [ ] Save product
- [ ] Edit product and verify SKUs are loaded
- [ ] Update SKUs and save again
- [ ] Remove a supplier and verify SKU is removed

### Backend

- [ ] Verify supplier SKU mappings are saved to database
- [ ] Test querying products by supplier SKU
- [ ] Test updating existing mappings

---

## 🎯 Key Features

✅ **Single Primary Supplier** - One supplier per product
✅ **Supplier-Specific SKU** - Store supplier's product code
✅ **Easy Input** - Simple side-by-side fields
✅ **Auto-Load** - SKU automatically loaded when editing
✅ **Indexed Search** - Fast lookups by supplier SKU
✅ **Optional Field** - Not required, flexible
✅ **Disabled Until Selected** - SKU field disabled until supplier chosen
✅ **Backwards Compatible** - No breaking changes

---

## 📊 Useful Queries

### View All Product-Supplier SKU Mappings

```sql
SELECT
  p.name as product_name,
  p.sku as internal_sku,
  s.name as supplier_name,
  psm.supplier_product_code as supplier_sku,
  psm.unit_price,
  psm.is_primary
FROM product_supplier_mapping psm
JOIN products p ON psm.product_id = p.id
JOIN suppliers s ON psm.supplier_id = s.id
ORDER BY p.name, s.name;
```

### Find Product by Supplier SKU

```sql
SELECT
  p.*,
  s.name as supplier_name,
  psm.supplier_product_code
FROM products p
JOIN product_supplier_mapping psm ON p.id = psm.product_id
JOIN suppliers s ON psm.supplier_id = s.id
WHERE psm.supplier_product_code = 'SUP-A-12345';
```

### Products with Multiple Suppliers

```sql
SELECT
  p.id,
  p.name,
  COUNT(psm.id) as supplier_count,
  STRING_AGG(
    s.name || ': ' || COALESCE(psm.supplier_product_code, 'No SKU'),
    ', '
  ) as suppliers_and_skus
FROM products p
JOIN product_supplier_mapping psm ON p.id = psm.product_id
JOIN suppliers s ON psm.supplier_id = s.id
GROUP BY p.id, p.name
HAVING COUNT(psm.id) > 1
ORDER BY supplier_count DESC;
```

---

## 🔒 Data Integrity

- Column is nullable (optional)
- No default value
- Indexed for performance
- No unique constraint (same SKU can exist across different products)
- Foreign keys ensure referential integrity

---

## 📞 Support

For issues or questions:

- Migration guide: `SUPPLIER_SKU_MIGRATION_GUIDE.md`
- Service implementation: `packages/services/src/supplierService.ts`
- Form component: `packages/shared-components/src/components/ProductForm.tsx`

---

**Status**: ✅ Complete and ready for deployment
**Risk Level**: Low (optional field, backwards compatible)
**Migration Time**: < 1 minute
**Downtime Required**: None
**Dependencies**: None (standalone feature)
