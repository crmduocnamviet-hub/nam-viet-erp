-- =====================================================
-- LOT MANAGEMENT REFACTORING MIGRATION
-- =====================================================
-- This migration supports the new lot management workflow:
-- 1. When enable_lot_management = TRUE: Copy inventory → product_lots
-- 2. When enable_lot_management = FALSE: Delete all product_lots
-- =====================================================

-- Step 1: Verify product_lots table has required columns
-- (Should already exist from lot-management-v2.sql)
DO $$
BEGIN
  -- Check if warehouse_id column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_lots'
    AND column_name = 'warehouse_id'
  ) THEN
    RAISE EXCEPTION 'product_lots table missing warehouse_id column. Run lot-management-v2.sql first.';
  END IF;

  -- Check if quantity_available column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_lots'
    AND column_name = 'quantity_available'
  ) THEN
    RAISE EXCEPTION 'product_lots table missing quantity_available column. Run lot-management-v2.sql first.';
  END IF;
END $$;

-- Step 2: Add index for better performance when filtering by product_id + warehouse_id
CREATE INDEX IF NOT EXISTS idx_product_lots_product_warehouse
ON public.product_lots(product_id, warehouse_id);

-- Step 3: Add index for enable_lot_management on products
CREATE INDEX IF NOT EXISTS idx_products_enable_lot_management
ON public.products(enable_lot_management)
WHERE enable_lot_management = TRUE;

-- Step 4: Create helper function to migrate inventory to lots
CREATE OR REPLACE FUNCTION migrate_inventory_to_lots(p_product_id INTEGER)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
  v_inventory_record RECORD;
  v_created_count INTEGER := 0;
BEGIN
  -- Loop through all inventory records for this product
  FOR v_inventory_record IN
    SELECT warehouse_id, quantity
    FROM inventory
    WHERE product_id = p_product_id
    AND quantity > 0
  LOOP
    -- Insert default lot for each warehouse
    INSERT INTO product_lots (
      product_id,
      warehouse_id,
      lot_number,
      received_date,
      quantity,
    ) VALUES (
      p_product_id,
      v_inventory_record.warehouse_id,
      'Lô mặc định',
      CURRENT_DATE,
      v_inventory_record.quantity,
    );

    v_created_count := v_created_count + 1;
  END LOOP;

  v_result := json_build_object(
    'success', true,
    'lots_created', v_created_count,
    'product_id', p_product_id
  );

  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'product_id', p_product_id
    );
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create helper function to remove all lots for a product
CREATE OR REPLACE FUNCTION remove_all_lots(p_product_id INTEGER)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM product_lots
  WHERE product_id = p_product_id;

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  v_result := json_build_object(
    'success', true,
    'lots_deleted', v_deleted_count,
    'product_id', p_product_id
  );

  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'product_id', p_product_id
    );
END;
$$ LANGUAGE plpgsql;

-- Step 6: (OPTIONAL) Migrate existing products with enable_lot_management = TRUE
-- Uncomment and run this if you have existing products that should have lots created

/*
DO $$
DECLARE
  v_product RECORD;
  v_result JSON;
BEGIN
  FOR v_product IN
    SELECT id, name
    FROM products
    WHERE enable_lot_management = TRUE
  LOOP
    -- Migrate inventory to lots for each product
    v_result := migrate_inventory_to_lots(v_product.id);

    RAISE NOTICE 'Product %: % - Result: %',
      v_product.id,
      v_product.name,
      v_result::text;
  END LOOP;
END $$;
*/

-- Step 6: Create function to sync lot quantities back to inventory
CREATE OR REPLACE FUNCTION sync_lots_to_inventory(p_product_id INTEGER)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
  v_warehouse_record RECORD;
  v_synced_count INTEGER := 0;
BEGIN
  -- Loop through warehouses and calculate totals
  FOR v_warehouse_record IN
    SELECT
      warehouse_id,
      SUM(quantity) as total_quantity
    FROM product_lots
    WHERE product_id = p_product_id
    GROUP BY warehouse_id
  LOOP
    -- Update or insert inventory record
    INSERT INTO inventory (product_id, warehouse_id, quantity)
    VALUES (
      p_product_id,
      v_warehouse_record.warehouse_id,
      v_warehouse_record.total_quantity
    )
    ON CONFLICT (product_id, warehouse_id)
    DO UPDATE SET quantity = EXCLUDED.quantity;

    v_synced_count := v_synced_count + 1;
  END LOOP;

  v_result := json_build_object(
    'success', true,
    'warehouses_synced', v_synced_count,
    'product_id', p_product_id
  );

  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'product_id', p_product_id
    );
END;
$$ LANGUAGE plpgsql;

-- Step 7: Grant necessary permissions
GRANT EXECUTE ON FUNCTION migrate_inventory_to_lots(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION remove_all_lots(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION sync_lots_to_inventory(INTEGER) TO authenticated;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check products with lot management enabled
-- SELECT id, name, enable_lot_management
-- FROM products
-- WHERE enable_lot_management = TRUE;

-- Check product_lots created
-- SELECT pl.*, p.name as product_name, w.name as warehouse_name
-- FROM product_lots pl
-- JOIN products p ON pl.product_id = p.id
-- JOIN warehouses w ON pl.warehouse_id = w.id
-- ORDER BY pl.product_id, pl.warehouse_id;

-- Compare inventory vs product_lots
-- SELECT
--   i.product_id,
--   p.name,
--   i.warehouse_id,
--   w.name as warehouse_name,
--   i.quantity as inventory_qty,
--   COALESCE(SUM(pl.quantity_available), 0) as lot_qty
-- FROM inventory i
-- JOIN products p ON i.product_id = p.id
-- JOIN warehouses w ON i.warehouse_id = w.id
-- LEFT JOIN product_lots pl ON pl.product_id = i.product_id AND pl.warehouse_id = i.warehouse_id
-- WHERE p.enable_lot_management = TRUE
-- GROUP BY i.product_id, p.name, i.warehouse_id, w.name, i.quantity;
