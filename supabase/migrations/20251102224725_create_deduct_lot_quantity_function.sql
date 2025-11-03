-- Create function to deduct lot quantity atomically
-- This function ensures that lot quantity updates are done safely with proper checks

CREATE OR REPLACE FUNCTION deduct_lot_quantity(
  p_lot_id INTEGER,
  p_quantity INTEGER
)
RETURNS TABLE (
  success BOOLEAN,
  new_quantity INTEGER,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_quantity INTEGER;
  v_new_quantity INTEGER;
  v_product_id INTEGER;
  v_warehouse_id INTEGER;
BEGIN
  -- Get current lot information
  SELECT quantity, product_id, warehouse_id
  INTO v_current_quantity, v_product_id, v_warehouse_id
  FROM product_lots
  WHERE id = p_lot_id
  FOR UPDATE; -- Lock the row for update

  -- Check if lot exists
  IF v_current_quantity IS NULL THEN
    RETURN QUERY SELECT FALSE, 0, 'Lot not found'::TEXT;
    RETURN;
  END IF;

  -- Calculate new quantity
  v_new_quantity := v_current_quantity - p_quantity;

  -- Check if we have enough quantity
  IF v_new_quantity < 0 THEN
    RETURN QUERY SELECT
      FALSE,
      v_current_quantity,
      format('Insufficient quantity. Current: %s, Requested: %s', v_current_quantity, p_quantity)::TEXT;
    RETURN;
  END IF;

  -- Update the lot quantity
  UPDATE product_lots
  SET
    quantity = v_new_quantity,
    updated_at = NOW()
  WHERE id = p_lot_id;

  -- Return success
  RETURN QUERY SELECT TRUE, v_new_quantity, NULL::TEXT;

EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT FALSE, 0, SQLERRM::TEXT;
END;
$$;

-- Add comment to function
COMMENT ON FUNCTION deduct_lot_quantity IS
'Atomically deducts quantity from a product lot with proper validation and locking';
