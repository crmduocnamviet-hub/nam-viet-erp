# Quick Guide: Apply VAT Percent Migration

## ⚡ Quick Start (Supabase Dashboard)

1. **Go to your Supabase project**: https://supabase.com/dashboard
2. **Click "SQL Editor"** in the left sidebar
3. **Click "New Query"**
4. **Copy and paste this SQL**:

```sql
-- Migration: Add vat_percent column to products table
-- Purpose: Enable per-product VAT percentage management
-- Date: 2025-10-25

-- Add vat_percent column to products
ALTER TABLE products
ADD COLUMN IF NOT EXISTS vat_percent DECIMAL(5,2) DEFAULT 5.00;

-- Add comment for documentation
COMMENT ON COLUMN products.vat_percent IS 'VAT percentage applied to this product (0%, 1%, 2%, 3%, 5%)';

-- Add check constraint to ensure valid VAT percentages
ALTER TABLE products
ADD CONSTRAINT check_product_vat_percent_valid
CHECK (vat_percent IN (0, 1, 2, 3, 5));

-- Update existing records to have default VAT of 5%
UPDATE products
SET vat_percent = 5.00
WHERE vat_percent IS NULL;
```

5. **Click "Run"** (or press `Ctrl/Cmd + Enter`)
6. **Done!** ✅

## 🔍 Verify It Worked

Run this query to check:

```sql
-- Check if column was added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'products'
AND column_name = 'vat_percent';
```

You should see:

```
column_name | data_type | column_default
------------|-----------|---------------
vat_percent | numeric   | 5.00
```

## 📝 What This Does

- ✅ Adds `vat_percent` column to products table
- ✅ Sets default VAT to 5% for all products
- ✅ Only allows valid values: 0%, 1%, 2%, 3%, 5%
- ✅ Updates all existing products to have 5% VAT
- ✅ Fully backwards compatible

## 🚀 After Migration

The frontend is already ready! The VAT feature will work immediately:

- Edit products and set their VAT % in the EditProductPage
- Create new products with specific VAT percentages
- When adding products to B2B orders, their VAT is automatically applied
- View VAT breakdown in the order summary
- Export PDFs with VAT calculations

## ⚠️ Important Notes

- **No downtime required** - this is a safe, non-breaking change
- **Existing products** will automatically have 5% VAT applied
- **Frontend code** is already deployed and ready
- **TypeScript types** are already updated

## 🔙 Rollback (if needed)

If you need to remove this feature, run:

```sql
-- Drop the check constraint first
ALTER TABLE products
DROP CONSTRAINT IF EXISTS check_product_vat_percent_valid;

-- Remove the vat_percent column
ALTER TABLE products
DROP COLUMN IF EXISTS vat_percent;
```

## 📚 Full Documentation

For detailed information, see: `VAT_PERCENT_MIGRATION_GUIDE.md`

---

**Status**: Ready to apply ✅
**Risk**: Low
**Time**: < 1 minute
**Downtime**: None
