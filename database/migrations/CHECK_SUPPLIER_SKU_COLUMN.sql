-- Check if supplier_product_code column exists in product_supplier_mapping table

SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'product_supplier_mapping'
AND column_name = 'supplier_product_code';

-- If the above returns no rows, run the migration:
-- See: add_supplier_product_code_to_product_supplier_mapping.sql
