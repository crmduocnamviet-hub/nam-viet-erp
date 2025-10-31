-- ============================================
-- View: products_needing_reorder
-- ============================================
-- This view shows products that need to be reordered based on:
-- 1. Current quantity < min_stock
-- 2. Not already in pending purchase orders (draft, sent, ordered, partially_received)
-- ============================================

CREATE OR REPLACE VIEW products_needing_reorder AS
SELECT
  inv.warehouse_id,
  inv.product_id,
  inv.quantity AS current_quantity,
  inv.min_stock,
  inv.max_stock,
  (inv.max_stock - inv.quantity) AS quantity_needed,
  p.id,
  p.name AS product_name,
  p.sku,
  p.barcode,
  p.supplier_id,
  p.wholesale_price,
  p.cost_price,
  p.retail_price,
  s.name AS supplier_name,
  s.email AS supplier_email,
  s.phone AS supplier_phone,
  w.name AS warehouse_name
FROM
  inventory inv
  INNER JOIN products p ON inv.product_id = p.id
  LEFT JOIN suppliers s ON p.supplier_id = s.id
  LEFT JOIN warehouses w ON inv.warehouse_id = w.id
WHERE
  -- Condition 1: Quantity is below minimum stock
  inv.quantity < inv.min_stock

  -- Condition 2: Product has a supplier
  AND p.supplier_id IS NOT NULL

  -- Condition 3: Max stock is set (to calculate quantity needed)
  AND inv.max_stock > 0

  -- Condition 4: Not already in pending purchase orders
  AND NOT EXISTS (
    SELECT 1
    FROM purchase_order_items poi
    INNER JOIN purchase_orders po ON poi.po_id = po.id
    WHERE
      poi.product_id = inv.product_id
      AND po.status IN ('draft', 'sent', 'ordered', 'partially_received')
  )
ORDER BY
  inv.warehouse_id,
  (inv.quantity / NULLIF(inv.min_stock, 0)) ASC; -- Most critical first (lowest stock ratio)

-- ============================================
-- Add comment to the view
-- ============================================
COMMENT ON VIEW products_needing_reorder IS
  'Shows products that need reordering based on inventory levels and excludes products already in pending purchase orders';

-- ============================================
-- Grant permissions
-- ============================================
GRANT SELECT ON products_needing_reorder TO authenticated;
GRANT SELECT ON products_needing_reorder TO service_role;
