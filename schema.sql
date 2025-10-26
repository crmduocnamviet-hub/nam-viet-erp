

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "auth";


ALTER SCHEMA "auth" OWNER TO "supabase_admin";


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE SCHEMA IF NOT EXISTS "storage";


ALTER SCHEMA "storage" OWNER TO "supabase_admin";


CREATE TYPE "auth"."aal_level" AS ENUM (
    'aal1',
    'aal2',
    'aal3'
);


ALTER TYPE "auth"."aal_level" OWNER TO "supabase_auth_admin";


CREATE TYPE "auth"."code_challenge_method" AS ENUM (
    's256',
    'plain'
);


ALTER TYPE "auth"."code_challenge_method" OWNER TO "supabase_auth_admin";


CREATE TYPE "auth"."factor_status" AS ENUM (
    'unverified',
    'verified'
);


ALTER TYPE "auth"."factor_status" OWNER TO "supabase_auth_admin";


CREATE TYPE "auth"."factor_type" AS ENUM (
    'totp',
    'webauthn',
    'phone'
);


ALTER TYPE "auth"."factor_type" OWNER TO "supabase_auth_admin";


CREATE TYPE "auth"."oauth_authorization_status" AS ENUM (
    'pending',
    'approved',
    'denied',
    'expired'
);


ALTER TYPE "auth"."oauth_authorization_status" OWNER TO "supabase_auth_admin";


CREATE TYPE "auth"."oauth_client_type" AS ENUM (
    'public',
    'confidential'
);


ALTER TYPE "auth"."oauth_client_type" OWNER TO "supabase_auth_admin";


CREATE TYPE "auth"."oauth_registration_type" AS ENUM (
    'dynamic',
    'manual'
);


ALTER TYPE "auth"."oauth_registration_type" OWNER TO "supabase_auth_admin";


CREATE TYPE "auth"."oauth_response_type" AS ENUM (
    'code'
);


ALTER TYPE "auth"."oauth_response_type" OWNER TO "supabase_auth_admin";


CREATE TYPE "auth"."one_time_token_type" AS ENUM (
    'confirmation_token',
    'reauthentication_token',
    'recovery_token',
    'email_change_token_new',
    'email_change_token_current',
    'phone_change_token'
);


ALTER TYPE "auth"."one_time_token_type" OWNER TO "supabase_auth_admin";


CREATE TYPE "public"."points_reference_type" AS ENUM (
    'order',
    'visit',
    'manual',
    'promotion',
    'birthday',
    'referral',
    'system'
);


ALTER TYPE "public"."points_reference_type" OWNER TO "postgres";


CREATE TYPE "public"."points_transaction_type" AS ENUM (
    'earn',
    'redeem',
    'adjustment',
    'expire',
    'refund'
);


ALTER TYPE "public"."points_transaction_type" OWNER TO "postgres";


CREATE TYPE "public"."product_to_purchase" AS (
	"product_id" bigint,
	"supplier_id" bigint,
	"quantity_to_order" numeric,
	"cost_price" numeric
);


ALTER TYPE "public"."product_to_purchase" OWNER TO "postgres";


CREATE TYPE "public"."promotion_type" AS ENUM (
    'percentage',
    'fixed_amount',
    'buy_x_get_y',
    'order_discount'
);


ALTER TYPE "public"."promotion_type" OWNER TO "postgres";


CREATE TYPE "storage"."buckettype" AS ENUM (
    'STANDARD',
    'ANALYTICS'
);


ALTER TYPE "storage"."buckettype" OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "auth"."email"() RETURNS "text"
    LANGUAGE "sql" STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$$;


ALTER FUNCTION "auth"."email"() OWNER TO "supabase_auth_admin";


COMMENT ON FUNCTION "auth"."email"() IS 'Deprecated. Use auth.jwt() -> ''email'' instead.';



CREATE OR REPLACE FUNCTION "auth"."jwt"() RETURNS "jsonb"
    LANGUAGE "sql" STABLE
    AS $$
  select 
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$$;


ALTER FUNCTION "auth"."jwt"() OWNER TO "supabase_auth_admin";


CREATE OR REPLACE FUNCTION "auth"."role"() RETURNS "text"
    LANGUAGE "sql" STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;


ALTER FUNCTION "auth"."role"() OWNER TO "supabase_auth_admin";


COMMENT ON FUNCTION "auth"."role"() IS 'Deprecated. Use auth.jwt() -> ''role'' instead.';



CREATE OR REPLACE FUNCTION "auth"."uid"() RETURNS "uuid"
    LANGUAGE "sql" STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;


ALTER FUNCTION "auth"."uid"() OWNER TO "supabase_auth_admin";


COMMENT ON FUNCTION "auth"."uid"() IS 'Deprecated. Use auth.jwt() -> ''sub'' instead.';



CREATE OR REPLACE FUNCTION "public"."calculate_line_item_subtotal"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Calculate subtotal for the line item
    NEW.subtotal := (NEW.quantity * NEW.unit_price) - NEW.discount_amount;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."calculate_line_item_subtotal"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_quote_totals"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    quote_subtotal DECIMAL(15,2) := 0;
    quote_discount DECIMAL(15,2) := 0;
    quote_tax DECIMAL(15,2) := 0;
    quote_total DECIMAL(15,2) := 0;
    quote_discount_percent DECIMAL(5,2) := 0;
    quote_tax_percent DECIMAL(5,2) := 0;
BEGIN
    -- Get quote-level discount and tax percentages
    SELECT discount_percent, tax_percent
    INTO quote_discount_percent, quote_tax_percent
    FROM public.b2b_quotes
    WHERE quote_id = COALESCE(NEW.quote_id, OLD.quote_id);

    -- Calculate subtotal from all items for this quote
    SELECT COALESCE(SUM(subtotal), 0)
    INTO quote_subtotal
    FROM public.b2b_quote_items
    WHERE quote_id = COALESCE(NEW.quote_id, OLD.quote_id);

    -- Calculate discount amount
    quote_discount := quote_subtotal * (quote_discount_percent / 100);

    -- Calculate tax amount (on subtotal minus discount)
    quote_tax := (quote_subtotal - quote_discount) * (quote_tax_percent / 100);

    -- Calculate total
    quote_total := quote_subtotal - quote_discount + quote_tax;

    -- Update the quote with calculated totals
    UPDATE public.b2b_quotes
    SET
        subtotal = quote_subtotal,
        discount_amount = quote_discount,
        tax_amount = quote_tax,
        total_value = quote_total,
        updated_at = NOW()
    WHERE quote_id = COALESCE(NEW.quote_id, OLD.quote_id);

    RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."calculate_quote_totals"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_internal_transfer"("from_fund_id" bigint, "to_fund_id" bigint, "transfer_amount" numeric, "transfer_description" "text", "created_by_user" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  current_balance NUMERIC;
BEGIN
  -- Tính số dư hiện tại của quỹ nguồn
  SELECT
    (f.initial_balance + COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE -t.amount END), 0))
    INTO current_balance
  FROM public.funds f
  LEFT JOIN public.transactions t ON f.id = t.fund_id
  WHERE f.id = from_fund_id AND (t.status = 'đã thu' OR t.status = 'đã chi')
  GROUP BY f.id;

  -- Kiểm tra số dư
  IF COALESCE(current_balance, 0) < transfer_amount THEN
    RAISE EXCEPTION 'Số dư trong quỹ không đủ để thực hiện giao dịch.';
  END IF;

  -- Nếu đủ, thực hiện ghi vào bảng mới
  INSERT INTO public.internal_fund_transfers (from_fund_id, to_fund_id, amount, description, created_by)
  VALUES (from_fund_id, to_fund_id, transfer_amount, transfer_description, created_by_user);
END;
$$;


ALTER FUNCTION "public"."create_internal_transfer"("from_fund_id" bigint, "to_fund_id" bigint, "transfer_amount" numeric, "transfer_description" "text", "created_by_user" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_draft_purchase_orders"() RETURNS TABLE("created_po_id" bigint, "supplier_name" "text", "product_count" integer, "total_value" numeric)
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    products_needed product_to_purchase[];
    b2b_warehouse_id BIGINT;
    current_supplier_id BIGINT;
    supplier_products product_to_purchase[];
    new_po_id BIGINT;
    result_row RECORD;
BEGIN
    -- SỬA LỖI: Đã đổi tên kho thành 'Kho Tổng B2B'
    SELECT id INTO b2b_warehouse_id FROM public.warehouses WHERE name = 'Kho Tổng B2B' LIMIT 1;

    IF b2b_warehouse_id IS NULL THEN
        RAISE EXCEPTION 'Không tìm thấy kho tổng B2B. Vui lòng kiểm tra lại tên kho.';
    END IF;

    SELECT ARRAY_AGG(
        ROW(
            p.id,
            p.supplier_id,
            (i.max_stock - i.quantity),
            p.cost_price
        )::product_to_purchase
    )
    INTO products_needed
    FROM public.inventory i
    JOIN public.products p ON i.product_id = p.id
    WHERE i.warehouse_id = b2b_warehouse_id
      AND i.quantity < i.min_stock
      AND p.supplier_id IS NOT NULL;

    IF array_length(products_needed, 1) IS NULL THEN
        RETURN;
    END IF;

    FOR current_supplier_id IN
        SELECT DISTINCT p_info.supplier_id FROM unnest(products_needed) AS p_info
    LOOP
        INSERT INTO public.purchase_orders (supplier_id, status, created_by)
        VALUES (current_supplier_id, 'Nháp', 'Hệ thống (Dự trù)')
        RETURNING id INTO new_po_id;

        supplier_products := ARRAY(
            SELECT p_info FROM unnest(products_needed) AS p_info WHERE p_info.supplier_id = current_supplier_id
        );

        INSERT INTO public.purchase_order_items (po_id, product_id, quantity, cost_price)
        SELECT new_po_id, p_info.product_id, p_info.quantity_to_order::INT, p_info.cost_price
        FROM unnest(supplier_products) AS p_info;

        SELECT
            new_po_id AS po_id,
            s.name AS sup_name,
            array_length(supplier_products, 1) AS p_count,
            SUM(p_info.quantity_to_order * p_info.cost_price) AS t_value
        INTO result_row
        FROM unnest(supplier_products) AS p_info
        JOIN public.suppliers s ON s.id = current_supplier_id
        GROUP BY s.name;
        
        created_po_id := result_row.po_id;
        supplier_name := result_row.sup_name;
        product_count := result_row.p_count;
        total_value := result_row.t_value;

        RETURN NEXT;
    END LOOP;
END;
$$;


ALTER FUNCTION "public"."generate_draft_purchase_orders"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_po_number"() RETURNS "text"
    LANGUAGE "plpgsql"
    AS $_$
DECLARE
  today_prefix TEXT;
  next_number INTEGER;
  new_po_number TEXT;
BEGIN
  -- Generate today's prefix (PO-YYYYMMDD)
  today_prefix := 'PO-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD');

  -- Find the highest number for today
  SELECT COALESCE(
    MAX(
      CASE
        WHEN purchase_orders.po_number ~ ('^' || today_prefix || '-[0-9]+$')
        THEN CAST(SPLIT_PART(purchase_orders.po_number, '-', 3) AS INTEGER)
        ELSE 0
      END
    ),
    0
  ) INTO next_number
  FROM purchase_orders
  WHERE purchase_orders.po_number LIKE today_prefix || '%';

  -- Increment and format with leading zeros
  new_po_number := today_prefix || '-' || LPAD((next_number + 1)::TEXT, 4, '0');

  RETURN new_po_number;
END;
$_$;


ALTER FUNCTION "public"."generate_po_number"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."generate_po_number"() IS 'Generates next purchase order number in format PO-00001';



CREATE OR REPLACE FUNCTION "public"."get_available_lots_v2"("p_product_id" integer, "p_warehouse_id" integer, "p_required_quantity" integer DEFAULT NULL::integer, "p_strategy" character varying DEFAULT 'FEFO'::character varying, "p_require_vat" boolean DEFAULT false) RETURNS TABLE("lot_id" integer, "lot_number" character varying, "expiry_date" "date", "shelf_location" character varying, "quantity_available" integer, "vat_available" integer, "unit_cost" numeric, "days_until_expiry" integer, "recommended_quantity" integer)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        pl.id,
        pl.lot_number,
        pl.expiry_date,
        pl.shelf_location,
        pl.quantity_available,
        CASE
            WHEN vw.id IS NOT NULL THEN vw.quantity_available
            ELSE 0
        END::INTEGER as vat_available,
        pl.final_unit_cost,
        CASE
            WHEN pl.expiry_date IS NOT NULL
            THEN (pl.expiry_date - CURRENT_DATE)::INTEGER
            ELSE NULL
        END as days_until_expiry,
        CASE
            WHEN p_required_quantity IS NOT NULL THEN
                LEAST(pl.quantity_available, p_required_quantity)
            ELSE pl.quantity_available
        END as recommended_quantity
    FROM public.product_lots pl
    LEFT JOIN public.vat_warehouse vw ON vw.lot_id = pl.id
    WHERE pl.product_id = p_product_id
        AND pl.warehouse_id = p_warehouse_id
        AND pl.status = 'active'
        AND pl.quantity_available > 0
        AND (pl.expiry_date IS NULL OR pl.expiry_date > CURRENT_DATE)
        AND (NOT p_require_vat OR vw.quantity_available > 0)
    ORDER BY
        CASE
            WHEN p_strategy = 'FEFO' THEN pl.expiry_date
            WHEN p_strategy = 'FIFO' THEN pl.received_date
        END ASC NULLS LAST;
END;
$$;


ALTER FUNCTION "public"."get_available_lots_v2"("p_product_id" integer, "p_warehouse_id" integer, "p_required_quantity" integer, "p_strategy" character varying, "p_require_vat" boolean) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_available_lots_v2"("p_product_id" integer, "p_warehouse_id" integer, "p_required_quantity" integer, "p_strategy" character varying, "p_require_vat" boolean) IS 'Get available lots with FIFO/FEFO strategy and VAT filtering';



CREATE OR REPLACE FUNCTION "public"."get_published_suggestions"() RETURNS TABLE("id" "uuid", "created_at" timestamp with time zone, "title" "text", "content" "text", "author" json, "comments_count" bigint, "post_reactions_count" bigint)
    LANGUAGE "sql"
    AS $$
    SELECT
        p.id,
        p.created_at,
        p.title,
        p.content,
        json_build_object('full_name', pr.full_name, 'avatar_url', pr.avatar_url) as author,
        (SELECT COUNT(*) FROM public.comments c WHERE c.post_id = p.id) as comments_count,
        (SELECT COUNT(*) FROM public.post_reactions prr WHERE prr.post_id = p.id) as post_reactions_count
    FROM
        public.posts p
    LEFT JOIN
        public.profiles pr ON p.author_id = pr.id
    WHERE
        p.post_type = 'suggestion' AND p.status = 'published';
$$;


ALTER FUNCTION "public"."get_published_suggestions"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_unread_notification_count"("emp_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  unread_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO unread_count
  FROM notifications
  WHERE employee_id = emp_id AND is_read = false;

  RETURN unread_count;
END;
$$;


ALTER FUNCTION "public"."get_unread_notification_count"("emp_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_suggestion_notification"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    manager_id UUID;
BEGIN
    -- Chỉ thực thi nếu một bài viết GÓP Ý mới được tạo và đang chờ duyệt
    IF NEW.post_type = 'suggestion' AND NEW.status = 'pending_approval' THEN
        
        -- Vòng lặp để tìm tất cả các user_id có quyền 'posts.manage' và tạo thông báo cho họ
        FOR manager_id IN
            SELECT ur.user_id
            FROM public.user_roles ur
            JOIN public.role_permissions rp ON ur.role_id = rp.role_id
            JOIN public.permissions p ON rp.permission_id = p.id
            WHERE p.name = 'posts.manage'
        LOOP
            -- Chèn một thông báo mới vào bảng notifications
            INSERT INTO public.notifications (user_id, title, content, link_to)
            VALUES (
                manager_id,
                'Có đề xuất mới cần duyệt',
                'Một đề xuất mới từ nhân viên đang chờ được xem xét.',
                '/settings/moderation' -- Điều hướng thẳng đến trang kiểm duyệt
            );
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_suggestion_notification"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    INSERT INTO public.profiles (
        id, phone, full_name, avatar_url, date_of_birth, gender,
        marital_status, citizen_id, citizen_id_issue_date,
        citizen_id_front_url, citizen_id_back_url, education_level,
        major, self_introduction, hobbies, personal_boundaries,
        strengths, allergies
    )
    VALUES (
        new.id,
        new.raw_user_meta_data->>'phone',
        new.raw_user_meta_data->>'full_name',
        new.raw_user_meta_data->>'avatar_url',
        -- NÂNG CẤP: Dạy cho SQL cách đọc định dạng 'DD/MM/YYYY'
        to_date(new.raw_user_meta_data->>'date_of_birth', 'DD/MM/YYYY'),
        new.raw_user_meta_data->>'gender',
        new.raw_user_meta_data->>'marital_status',
        new.raw_user_meta_data->>'citizen_id',
        -- NÂNG CẤP: Áp dụng tương tự cho ngày cấp CCCD
        to_date(new.raw_user_meta_data->>'citizen_id_issue_date', 'DD/MM/YYYY'),
        new.raw_user_meta_data->>'citizen_id_front_url',
        new.raw_user_meta_data->>'citizen_id_back_url',
        new.raw_user_meta_data->>'education_level',
        new.raw_user_meta_data->>'major',
        new.raw_user_meta_data->>'self_introduction',
        new.raw_user_meta_data->>'hobbies',
        new.raw_user_meta_data->>'personal_boundaries',
        new.raw_user_meta_data->>'strengths',
        new.raw_user_meta_data->>'allergies'
    );
    RETURN new;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_permission"("permission_name" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Kiểm tra xem người dùng hiện tại (lấy từ auth.uid()) có vai trò nào
  -- được gán quyền hạn (permission_name) được chỉ định hay không.
  RETURN EXISTS (
    SELECT 1
    FROM public.role_permissions rp
    JOIN public.user_roles ur ON rp.role_id = ur.role_id
    JOIN public.permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = auth.uid() AND p.name = permission_name
  );
END;
$$;


ALTER FUNCTION "public"."has_permission"("permission_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_patient_points_change"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    old_points INTEGER;
    new_points INTEGER;
    points_diff INTEGER;
BEGIN
    -- Only log if loyalty_points actually changed
    IF OLD.loyalty_points IS DISTINCT FROM NEW.loyalty_points THEN
        old_points := COALESCE(OLD.loyalty_points, 0);
        new_points := COALESCE(NEW.loyalty_points, 0);
        points_diff := new_points - old_points;

        -- Insert history record
        INSERT INTO patient_points_history (
            patient_id,
            transaction_type,
            points_amount,
            balance_before,
            balance_after,
            reference_type,
            description
        ) VALUES (
            NEW.patient_id,
            CASE
                WHEN points_diff > 0 THEN 'earn'::points_transaction_type
                ELSE 'redeem'::points_transaction_type
            END,
            points_diff,
            old_points,
            new_points,
            'system'::points_reference_type,
            CASE
                WHEN points_diff > 0 THEN 'Points earned'
                ELSE 'Points redeemed'
            END
        );
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."log_patient_points_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_all_notifications_as_read"("emp_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE notifications
  SET is_read = true, read_at = NOW()
  WHERE employee_id = emp_id AND is_read = false;
END;
$$;


ALTER FUNCTION "public"."mark_all_notifications_as_read"("emp_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_notification_as_read"("notification_id" bigint) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE notifications
  SET is_read = true, read_at = NOW()
  WHERE id = notification_id;
END;
$$;


ALTER FUNCTION "public"."mark_notification_as_read"("notification_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."migrate_inventory_to_lots"("p_product_id" integer) RETURNS json
    LANGUAGE "plpgsql"
    AS $$
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
      quantity
    ) VALUES (
      p_product_id,
      v_inventory_record.warehouse_id,
      'Lô mặc định',
      CURRENT_DATE,
      v_inventory_record.quantity
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
$$;


ALTER FUNCTION "public"."migrate_inventory_to_lots"("p_product_id" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."remove_all_lots"("p_product_id" integer) RETURNS json
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."remove_all_lots"("p_product_id" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reserve_lot_quantity_v2"("p_lot_id" integer, "p_quantity" integer, "p_order_id" integer, "p_order_type" character varying, "p_employee_id" "uuid", "p_shelf_location" character varying DEFAULT NULL::character varying) RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_available INTEGER;
    v_result JSONB;
BEGIN
    -- Check available quantity
    SELECT quantity_available INTO v_available
    FROM public.product_lots
    WHERE id = p_lot_id
    FOR UPDATE;

    IF v_available < p_quantity THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Insufficient quantity',
            'available', v_available,
            'requested', p_quantity
        );
    END IF;

    -- Update lot quantities
    UPDATE public.product_lots
    SET
        quantity_available = quantity_available - p_quantity,
        quantity_reserved = quantity_reserved + p_quantity,
        status = CASE
            WHEN quantity_available - p_quantity = 0 THEN 'reserved'
            ELSE status
        END,
        updated_at = NOW()
    WHERE id = p_lot_id;

    -- Record movement
    INSERT INTO public.lot_movements (
        lot_id, movement_type, quantity, order_id, order_type,
        to_location, performed_by
    ) VALUES (
        p_lot_id, 'reserved', p_quantity, p_order_id, p_order_type,
        p_shelf_location, p_employee_id
    );

    RETURN jsonb_build_object(
        'success', true,
        'lot_id', p_lot_id,
        'reserved_quantity', p_quantity
    );
END;
$$;


ALTER FUNCTION "public"."reserve_lot_quantity_v2"("p_lot_id" integer, "p_quantity" integer, "p_order_id" integer, "p_order_type" character varying, "p_employee_id" "uuid", "p_shelf_location" character varying) OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."transactions" (
    "id" bigint NOT NULL,
    "fund_id" bigint,
    "type" "text" NOT NULL,
    "amount" numeric NOT NULL,
    "description" "text",
    "created_by" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "transaction_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "status" "text" DEFAULT 'chờ duyệt'::"text" NOT NULL,
    "category" "text",
    "attachments" "text"[],
    "approved_by" "text",
    "executed_by" "text",
    "transfer_pair_id" "uuid",
    "payment_method" "text",
    "recipient_bank" "text",
    "recipient_account" "text",
    "recipient_name" "text",
    "qr_code_url" "text",
    "initial_denomination_counts" "jsonb",
    "executed_denomination_counts" "jsonb",
    "author_id" "uuid",
    CONSTRAINT "transactions_amount_check" CHECK (("amount" > (0)::numeric))
);


ALTER TABLE "public"."transactions" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_transactions"("search_term" "text") RETURNS SETOF "public"."transactions"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM transactions
  WHERE
    unaccent(description) ILIKE unaccent('%' || search_term || '%') OR
    unaccent(created_by) ILIKE unaccent('%' || search_term || '%');
END;
$$;


ALTER FUNCTION "public"."search_transactions"("search_term" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sell_lot_quantity_v2"("p_lot_id" integer, "p_quantity" integer, "p_order_id" integer, "p_order_type" character varying, "p_sales_vat_invoice_id" integer DEFAULT NULL::integer, "p_employee_id" "uuid" DEFAULT NULL::"uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_reserved INTEGER;
    v_vat_available INTEGER;
    v_purchase_vat_id INTEGER;
    v_result JSONB;
BEGIN
    -- Check reserved quantity
    SELECT quantity_reserved INTO v_reserved
    FROM public.product_lots
    WHERE id = p_lot_id
    FOR UPDATE;

    IF v_reserved < p_quantity THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Insufficient reserved quantity',
            'reserved', v_reserved,
            'requested', p_quantity
        );
    END IF;

    -- If VAT invoice required, check VAT warehouse
    IF p_sales_vat_invoice_id IS NOT NULL THEN
        SELECT
            vw.quantity_available,
            vw.purchase_vat_invoice_id
        INTO v_vat_available, v_purchase_vat_id
        FROM public.vat_warehouse vw
        WHERE vw.lot_id = p_lot_id
        LIMIT 1;

        IF v_vat_available < p_quantity THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'Insufficient VAT invoice coverage',
                'vat_available', COALESCE(v_vat_available, 0),
                'requested', p_quantity
            );
        END IF;

        -- Update VAT warehouse
        UPDATE public.vat_warehouse
        SET
            quantity_sold = quantity_sold + p_quantity,
            sales_vat_invoices = sales_vat_invoices || jsonb_build_object(
                'invoice_id', p_sales_vat_invoice_id,
                'quantity', p_quantity,
                'date', CURRENT_DATE
            )
        WHERE lot_id = p_lot_id;
    END IF;

    -- Update lot quantities
    UPDATE public.product_lots
    SET
        quantity_reserved = quantity_reserved - p_quantity,
        quantity_sold = quantity_sold + p_quantity,
        vat_invoice_sold = CASE
            WHEN p_sales_vat_invoice_id IS NOT NULL
            THEN vat_invoice_sold + p_quantity
            ELSE vat_invoice_sold
        END,
        status = CASE
            WHEN quantity_available = 0 AND quantity_reserved - p_quantity = 0
            THEN 'depleted'
            ELSE status
        END,
        updated_at = NOW()
    WHERE id = p_lot_id;

    -- Record movement with VAT linkage
    INSERT INTO public.lot_movements (
        lot_id, movement_type, quantity, order_id, order_type,
        purchase_vat_invoice_id, sales_vat_invoice_id, performed_by
    ) VALUES (
        p_lot_id, 'sold', p_quantity, p_order_id, p_order_type,
        v_purchase_vat_id, p_sales_vat_invoice_id, p_employee_id
    );

    RETURN jsonb_build_object(
        'success', true,
        'lot_id', p_lot_id,
        'sold_quantity', p_quantity,
        'purchase_vat_invoice', v_purchase_vat_id,
        'sales_vat_invoice', p_sales_vat_invoice_id
    );
END;
$$;


ALTER FUNCTION "public"."sell_lot_quantity_v2"("p_lot_id" integer, "p_quantity" integer, "p_order_id" integer, "p_order_type" character varying, "p_sales_vat_invoice_id" integer, "p_employee_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_lots_to_inventory"("p_product_id" integer) RETURNS json
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."sync_lots_to_inventory"("p_product_id" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_combos_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_combos_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_notifications_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_notifications_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_purchase_order_details"("p_po_id" bigint, "p_supplier_id" bigint, "p_items" "jsonb", "p_new_status" "text") RETURNS bigint
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_po_id BIGINT;
    item JSONB;
BEGIN
    -- Bước 1: Xác định ID của đơn hàng
    IF p_po_id IS NULL THEN
        -- Nếu là tạo mới, INSERT một đơn hàng mới
        INSERT INTO public.purchase_orders (supplier_id, status, created_by)
        VALUES (p_supplier_id, p_new_status, 'Người dùng') -- Sẽ nâng cấp created_by sau
        RETURNING id INTO v_po_id;
    ELSE
        -- Nếu là cập nhật, sử dụng ID đã có và cập nhật trạng thái
        v_po_id := p_po_id;
        UPDATE public.purchase_orders
        SET status = p_new_status
        WHERE id = v_po_id;
    END IF;

    -- Bước 2: Xóa tất cả các item cũ của đơn hàng này để ghi lại danh sách mới
    DELETE FROM public.purchase_order_items WHERE po_id = v_po_id;

    -- Bước 3: Lặp qua danh sách item mới và INSERT vào CSDL
    IF p_items IS NOT NULL AND jsonb_array_length(p_items) > 0 THEN
        FOR item IN SELECT * FROM jsonb_array_elements(p_items)
        LOOP
            INSERT INTO public.purchase_order_items (po_id, product_id, quantity, cost_price)
            VALUES (
                v_po_id,
                (item->>'product_id')::BIGINT,
                (item->>'quantity')::INT,
                (item->>'cost_price')::NUMERIC
            );
        END LOOP;
    END IF;

    -- Bước 4: Trả về ID của đơn hàng
    RETURN v_po_id;
END;
$$;


ALTER FUNCTION "public"."update_purchase_order_details"("p_po_id" bigint, "p_supplier_id" bigint, "p_items" "jsonb", "p_new_status" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_purchase_orders_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_purchase_orders_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_supplier_promotions_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_supplier_promotions_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."verify_barcode_v2"("p_barcode" character varying, "p_order_id" integer DEFAULT NULL::integer, "p_order_type" character varying DEFAULT NULL::character varying, "p_context" character varying DEFAULT 'inventory_check'::character varying, "p_employee_id" "uuid" DEFAULT NULL::"uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_product_id INTEGER;
    v_lot_id INTEGER;
    v_in_order BOOLEAN := FALSE;
    v_match_status VARCHAR(50);
    v_result JSONB;
BEGIN
    -- Find product by barcode
    SELECT id INTO v_product_id
    FROM public.products
    WHERE barcode = p_barcode OR qr_code = p_barcode
    LIMIT 1;

    -- Find lot by barcode
    SELECT id INTO v_lot_id
    FROM public.product_lots
    WHERE barcode = p_barcode OR qr_code = p_barcode
    LIMIT 1;

    -- Determine match status
    IF v_product_id IS NOT NULL OR v_lot_id IS NOT NULL THEN
        v_match_status := 'matched';
    ELSE
        v_match_status := 'not_found';
    END IF;

    -- Check if in order (if order provided)
    IF p_order_id IS NOT NULL AND v_product_id IS NOT NULL THEN
        CASE p_order_type
            WHEN 'purchase' THEN
                SELECT EXISTS(
                    SELECT 1 FROM public.purchase_order_items
                    WHERE po_id = p_order_id AND product_id = v_product_id
                ) INTO v_in_order;
            WHEN 'pos', 'b2b' THEN
                -- Check in order items table
                SELECT EXISTS(
                    SELECT 1 FROM public.order_items
                    WHERE order_id = p_order_id AND product_id = v_product_id
                ) INTO v_in_order;
        END CASE;
    END IF;

    -- Log verification
    INSERT INTO public.barcode_verifications (
        barcode_scanned, product_id, lot_id, match_status,
        order_id, order_type, in_order, verification_context,
        scanned_by
    ) VALUES (
        p_barcode, v_product_id, v_lot_id, v_match_status,
        p_order_id, p_order_type, v_in_order, p_context,
        p_employee_id
    );

    -- Build result
    v_result := jsonb_build_object(
        'success', v_match_status = 'matched',
        'match_status', v_match_status,
        'product_id', v_product_id,
        'lot_id', v_lot_id,
        'in_order', v_in_order
    );

    -- Add product details if found
    IF v_product_id IS NOT NULL THEN
        v_result := v_result || jsonb_build_object(
            'product', (
                SELECT jsonb_build_object(
                    'id', id,
                    'name', name,
                    'sku', sku,
                    'barcode', barcode
                )
                FROM public.products
                WHERE id = v_product_id
            )
        );
    END IF;

    RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."verify_barcode_v2"("p_barcode" character varying, "p_order_id" integer, "p_order_type" character varying, "p_context" character varying, "p_employee_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."verify_barcode_v2"("p_barcode" character varying, "p_order_id" integer, "p_order_type" character varying, "p_context" character varying, "p_employee_id" "uuid") IS 'Verify barcode and check against order (NÚT 3)';



CREATE OR REPLACE FUNCTION "storage"."add_prefixes"("_bucket_id" "text", "_name" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    prefixes text[];
BEGIN
    prefixes := "storage"."get_prefixes"("_name");

    IF array_length(prefixes, 1) > 0 THEN
        INSERT INTO storage.prefixes (name, bucket_id)
        SELECT UNNEST(prefixes) as name, "_bucket_id" ON CONFLICT DO NOTHING;
    END IF;
END;
$$;


ALTER FUNCTION "storage"."add_prefixes"("_bucket_id" "text", "_name" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."can_insert_object"("bucketid" "text", "name" "text", "owner" "uuid", "metadata" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  INSERT INTO "storage"."objects" ("bucket_id", "name", "owner", "metadata") VALUES (bucketid, name, owner, metadata);
  -- hack to rollback the successful insert
  RAISE sqlstate 'PT200' using
  message = 'ROLLBACK',
  detail = 'rollback successful insert';
END
$$;


ALTER FUNCTION "storage"."can_insert_object"("bucketid" "text", "name" "text", "owner" "uuid", "metadata" "jsonb") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."delete_leaf_prefixes"("bucket_ids" "text"[], "names" "text"[]) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_rows_deleted integer;
BEGIN
    LOOP
        WITH candidates AS (
            SELECT DISTINCT
                t.bucket_id,
                unnest(storage.get_prefixes(t.name)) AS name
            FROM unnest(bucket_ids, names) AS t(bucket_id, name)
        ),
        uniq AS (
             SELECT
                 bucket_id,
                 name,
                 storage.get_level(name) AS level
             FROM candidates
             WHERE name <> ''
             GROUP BY bucket_id, name
        ),
        leaf AS (
             SELECT
                 p.bucket_id,
                 p.name,
                 p.level
             FROM storage.prefixes AS p
                  JOIN uniq AS u
                       ON u.bucket_id = p.bucket_id
                           AND u.name = p.name
                           AND u.level = p.level
             WHERE NOT EXISTS (
                 SELECT 1
                 FROM storage.objects AS o
                 WHERE o.bucket_id = p.bucket_id
                   AND o.level = p.level + 1
                   AND o.name COLLATE "C" LIKE p.name || '/%'
             )
             AND NOT EXISTS (
                 SELECT 1
                 FROM storage.prefixes AS c
                 WHERE c.bucket_id = p.bucket_id
                   AND c.level = p.level + 1
                   AND c.name COLLATE "C" LIKE p.name || '/%'
             )
        )
        DELETE
        FROM storage.prefixes AS p
            USING leaf AS l
        WHERE p.bucket_id = l.bucket_id
          AND p.name = l.name
          AND p.level = l.level;

        GET DIAGNOSTICS v_rows_deleted = ROW_COUNT;
        EXIT WHEN v_rows_deleted = 0;
    END LOOP;
END;
$$;


ALTER FUNCTION "storage"."delete_leaf_prefixes"("bucket_ids" "text"[], "names" "text"[]) OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."delete_prefix"("_bucket_id" "text", "_name" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Check if we can delete the prefix
    IF EXISTS(
        SELECT FROM "storage"."prefixes"
        WHERE "prefixes"."bucket_id" = "_bucket_id"
          AND level = "storage"."get_level"("_name") + 1
          AND "prefixes"."name" COLLATE "C" LIKE "_name" || '/%'
        LIMIT 1
    )
    OR EXISTS(
        SELECT FROM "storage"."objects"
        WHERE "objects"."bucket_id" = "_bucket_id"
          AND "storage"."get_level"("objects"."name") = "storage"."get_level"("_name") + 1
          AND "objects"."name" COLLATE "C" LIKE "_name" || '/%'
        LIMIT 1
    ) THEN
    -- There are sub-objects, skip deletion
    RETURN false;
    ELSE
        DELETE FROM "storage"."prefixes"
        WHERE "prefixes"."bucket_id" = "_bucket_id"
          AND level = "storage"."get_level"("_name")
          AND "prefixes"."name" = "_name";
        RETURN true;
    END IF;
END;
$$;


ALTER FUNCTION "storage"."delete_prefix"("_bucket_id" "text", "_name" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."delete_prefix_hierarchy_trigger"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    prefix text;
BEGIN
    prefix := "storage"."get_prefix"(OLD."name");

    IF coalesce(prefix, '') != '' THEN
        PERFORM "storage"."delete_prefix"(OLD."bucket_id", prefix);
    END IF;

    RETURN OLD;
END;
$$;


ALTER FUNCTION "storage"."delete_prefix_hierarchy_trigger"() OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."enforce_bucket_name_length"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
    if length(new.name) > 100 then
        raise exception 'bucket name "%" is too long (% characters). Max is 100.', new.name, length(new.name);
    end if;
    return new;
end;
$$;


ALTER FUNCTION "storage"."enforce_bucket_name_length"() OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."extension"("name" "text") RETURNS "text"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
DECLARE
    _parts text[];
    _filename text;
BEGIN
    SELECT string_to_array(name, '/') INTO _parts;
    SELECT _parts[array_length(_parts,1)] INTO _filename;
    RETURN reverse(split_part(reverse(_filename), '.', 1));
END
$$;


ALTER FUNCTION "storage"."extension"("name" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."filename"("name" "text") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[array_length(_parts,1)];
END
$$;


ALTER FUNCTION "storage"."filename"("name" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."foldername"("name" "text") RETURNS "text"[]
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
DECLARE
    _parts text[];
BEGIN
    -- Split on "/" to get path segments
    SELECT string_to_array(name, '/') INTO _parts;
    -- Return everything except the last segment
    RETURN _parts[1 : array_length(_parts,1) - 1];
END
$$;


ALTER FUNCTION "storage"."foldername"("name" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."get_level"("name" "text") RETURNS integer
    LANGUAGE "sql" IMMUTABLE STRICT
    AS $$
SELECT array_length(string_to_array("name", '/'), 1);
$$;


ALTER FUNCTION "storage"."get_level"("name" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."get_prefix"("name" "text") RETURNS "text"
    LANGUAGE "sql" IMMUTABLE STRICT
    AS $_$
SELECT
    CASE WHEN strpos("name", '/') > 0 THEN
             regexp_replace("name", '[\/]{1}[^\/]+\/?$', '')
         ELSE
             ''
        END;
$_$;


ALTER FUNCTION "storage"."get_prefix"("name" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."get_prefixes"("name" "text") RETURNS "text"[]
    LANGUAGE "plpgsql" IMMUTABLE STRICT
    AS $$
DECLARE
    parts text[];
    prefixes text[];
    prefix text;
BEGIN
    -- Split the name into parts by '/'
    parts := string_to_array("name", '/');
    prefixes := '{}';

    -- Construct the prefixes, stopping one level below the last part
    FOR i IN 1..array_length(parts, 1) - 1 LOOP
            prefix := array_to_string(parts[1:i], '/');
            prefixes := array_append(prefixes, prefix);
    END LOOP;

    RETURN prefixes;
END;
$$;


ALTER FUNCTION "storage"."get_prefixes"("name" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."get_size_by_bucket"() RETURNS TABLE("size" bigint, "bucket_id" "text")
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
    return query
        select sum((metadata->>'size')::bigint) as size, obj.bucket_id
        from "storage".objects as obj
        group by obj.bucket_id;
END
$$;


ALTER FUNCTION "storage"."get_size_by_bucket"() OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."list_multipart_uploads_with_delimiter"("bucket_id" "text", "prefix_param" "text", "delimiter_param" "text", "max_keys" integer DEFAULT 100, "next_key_token" "text" DEFAULT ''::"text", "next_upload_token" "text" DEFAULT ''::"text") RETURNS TABLE("key" "text", "id" "text", "created_at" timestamp with time zone)
    LANGUAGE "plpgsql"
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(key COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                        substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1)))
                    ELSE
                        key
                END AS key, id, created_at
            FROM
                storage.s3_multipart_uploads
            WHERE
                bucket_id = $5 AND
                key ILIKE $1 || ''%'' AND
                CASE
                    WHEN $4 != '''' AND $6 = '''' THEN
                        CASE
                            WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                                substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                key COLLATE "C" > $4
                            END
                    ELSE
                        true
                END AND
                CASE
                    WHEN $6 != '''' THEN
                        id COLLATE "C" > $6
                    ELSE
                        true
                    END
            ORDER BY
                key COLLATE "C" ASC, created_at ASC) as e order by key COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_key_token, bucket_id, next_upload_token;
END;
$_$;


ALTER FUNCTION "storage"."list_multipart_uploads_with_delimiter"("bucket_id" "text", "prefix_param" "text", "delimiter_param" "text", "max_keys" integer, "next_key_token" "text", "next_upload_token" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."list_objects_with_delimiter"("bucket_id" "text", "prefix_param" "text", "delimiter_param" "text", "max_keys" integer DEFAULT 100, "start_after" "text" DEFAULT ''::"text", "next_token" "text" DEFAULT ''::"text") RETURNS TABLE("name" "text", "id" "uuid", "metadata" "jsonb", "updated_at" timestamp with time zone)
    LANGUAGE "plpgsql"
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(name COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(name from length($1) + 1)) > 0 THEN
                        substring(name from 1 for length($1) + position($2 IN substring(name from length($1) + 1)))
                    ELSE
                        name
                END AS name, id, metadata, updated_at
            FROM
                storage.objects
            WHERE
                bucket_id = $5 AND
                name ILIKE $1 || ''%'' AND
                CASE
                    WHEN $6 != '''' THEN
                    name COLLATE "C" > $6
                ELSE true END
                AND CASE
                    WHEN $4 != '''' THEN
                        CASE
                            WHEN position($2 IN substring(name from length($1) + 1)) > 0 THEN
                                substring(name from 1 for length($1) + position($2 IN substring(name from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                name COLLATE "C" > $4
                            END
                    ELSE
                        true
                END
            ORDER BY
                name COLLATE "C" ASC) as e order by name COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_token, bucket_id, start_after;
END;
$_$;


ALTER FUNCTION "storage"."list_objects_with_delimiter"("bucket_id" "text", "prefix_param" "text", "delimiter_param" "text", "max_keys" integer, "start_after" "text", "next_token" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."lock_top_prefixes"("bucket_ids" "text"[], "names" "text"[]) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_bucket text;
    v_top text;
BEGIN
    FOR v_bucket, v_top IN
        SELECT DISTINCT t.bucket_id,
            split_part(t.name, '/', 1) AS top
        FROM unnest(bucket_ids, names) AS t(bucket_id, name)
        WHERE t.name <> ''
        ORDER BY 1, 2
        LOOP
            PERFORM pg_advisory_xact_lock(hashtextextended(v_bucket || '/' || v_top, 0));
        END LOOP;
END;
$$;


ALTER FUNCTION "storage"."lock_top_prefixes"("bucket_ids" "text"[], "names" "text"[]) OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."objects_delete_cleanup"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_bucket_ids text[];
    v_names      text[];
BEGIN
    IF current_setting('storage.gc.prefixes', true) = '1' THEN
        RETURN NULL;
    END IF;

    PERFORM set_config('storage.gc.prefixes', '1', true);

    SELECT COALESCE(array_agg(d.bucket_id), '{}'),
           COALESCE(array_agg(d.name), '{}')
    INTO v_bucket_ids, v_names
    FROM deleted AS d
    WHERE d.name <> '';

    PERFORM storage.lock_top_prefixes(v_bucket_ids, v_names);
    PERFORM storage.delete_leaf_prefixes(v_bucket_ids, v_names);

    RETURN NULL;
END;
$$;


ALTER FUNCTION "storage"."objects_delete_cleanup"() OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."objects_insert_prefix_trigger"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    PERFORM "storage"."add_prefixes"(NEW."bucket_id", NEW."name");
    NEW.level := "storage"."get_level"(NEW."name");

    RETURN NEW;
END;
$$;


ALTER FUNCTION "storage"."objects_insert_prefix_trigger"() OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."objects_update_cleanup"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    -- NEW - OLD (destinations to create prefixes for)
    v_add_bucket_ids text[];
    v_add_names      text[];

    -- OLD - NEW (sources to prune)
    v_src_bucket_ids text[];
    v_src_names      text[];
BEGIN
    IF TG_OP <> 'UPDATE' THEN
        RETURN NULL;
    END IF;

    -- 1) Compute NEW−OLD (added paths) and OLD−NEW (moved-away paths)
    WITH added AS (
        SELECT n.bucket_id, n.name
        FROM new_rows n
        WHERE n.name <> '' AND position('/' in n.name) > 0
        EXCEPT
        SELECT o.bucket_id, o.name FROM old_rows o WHERE o.name <> ''
    ),
    moved AS (
         SELECT o.bucket_id, o.name
         FROM old_rows o
         WHERE o.name <> ''
         EXCEPT
         SELECT n.bucket_id, n.name FROM new_rows n WHERE n.name <> ''
    )
    SELECT
        -- arrays for ADDED (dest) in stable order
        COALESCE( (SELECT array_agg(a.bucket_id ORDER BY a.bucket_id, a.name) FROM added a), '{}' ),
        COALESCE( (SELECT array_agg(a.name      ORDER BY a.bucket_id, a.name) FROM added a), '{}' ),
        -- arrays for MOVED (src) in stable order
        COALESCE( (SELECT array_agg(m.bucket_id ORDER BY m.bucket_id, m.name) FROM moved m), '{}' ),
        COALESCE( (SELECT array_agg(m.name      ORDER BY m.bucket_id, m.name) FROM moved m), '{}' )
    INTO v_add_bucket_ids, v_add_names, v_src_bucket_ids, v_src_names;

    -- Nothing to do?
    IF (array_length(v_add_bucket_ids, 1) IS NULL) AND (array_length(v_src_bucket_ids, 1) IS NULL) THEN
        RETURN NULL;
    END IF;

    -- 2) Take per-(bucket, top) locks: ALL prefixes in consistent global order to prevent deadlocks
    DECLARE
        v_all_bucket_ids text[];
        v_all_names text[];
    BEGIN
        -- Combine source and destination arrays for consistent lock ordering
        v_all_bucket_ids := COALESCE(v_src_bucket_ids, '{}') || COALESCE(v_add_bucket_ids, '{}');
        v_all_names := COALESCE(v_src_names, '{}') || COALESCE(v_add_names, '{}');

        -- Single lock call ensures consistent global ordering across all transactions
        IF array_length(v_all_bucket_ids, 1) IS NOT NULL THEN
            PERFORM storage.lock_top_prefixes(v_all_bucket_ids, v_all_names);
        END IF;
    END;

    -- 3) Create destination prefixes (NEW−OLD) BEFORE pruning sources
    IF array_length(v_add_bucket_ids, 1) IS NOT NULL THEN
        WITH candidates AS (
            SELECT DISTINCT t.bucket_id, unnest(storage.get_prefixes(t.name)) AS name
            FROM unnest(v_add_bucket_ids, v_add_names) AS t(bucket_id, name)
            WHERE name <> ''
        )
        INSERT INTO storage.prefixes (bucket_id, name)
        SELECT c.bucket_id, c.name
        FROM candidates c
        ON CONFLICT DO NOTHING;
    END IF;

    -- 4) Prune source prefixes bottom-up for OLD−NEW
    IF array_length(v_src_bucket_ids, 1) IS NOT NULL THEN
        -- re-entrancy guard so DELETE on prefixes won't recurse
        IF current_setting('storage.gc.prefixes', true) <> '1' THEN
            PERFORM set_config('storage.gc.prefixes', '1', true);
        END IF;

        PERFORM storage.delete_leaf_prefixes(v_src_bucket_ids, v_src_names);
    END IF;

    RETURN NULL;
END;
$$;


ALTER FUNCTION "storage"."objects_update_cleanup"() OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."objects_update_level_trigger"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Ensure this is an update operation and the name has changed
    IF TG_OP = 'UPDATE' AND (NEW."name" <> OLD."name" OR NEW."bucket_id" <> OLD."bucket_id") THEN
        -- Set the new level
        NEW."level" := "storage"."get_level"(NEW."name");
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "storage"."objects_update_level_trigger"() OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."objects_update_prefix_trigger"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    old_prefixes TEXT[];
BEGIN
    -- Ensure this is an update operation and the name has changed
    IF TG_OP = 'UPDATE' AND (NEW."name" <> OLD."name" OR NEW."bucket_id" <> OLD."bucket_id") THEN
        -- Retrieve old prefixes
        old_prefixes := "storage"."get_prefixes"(OLD."name");

        -- Remove old prefixes that are only used by this object
        WITH all_prefixes as (
            SELECT unnest(old_prefixes) as prefix
        ),
        can_delete_prefixes as (
             SELECT prefix
             FROM all_prefixes
             WHERE NOT EXISTS (
                 SELECT 1 FROM "storage"."objects"
                 WHERE "bucket_id" = OLD."bucket_id"
                   AND "name" <> OLD."name"
                   AND "name" LIKE (prefix || '%')
             )
         )
        DELETE FROM "storage"."prefixes" WHERE name IN (SELECT prefix FROM can_delete_prefixes);

        -- Add new prefixes
        PERFORM "storage"."add_prefixes"(NEW."bucket_id", NEW."name");
    END IF;
    -- Set the new level
    NEW."level" := "storage"."get_level"(NEW."name");

    RETURN NEW;
END;
$$;


ALTER FUNCTION "storage"."objects_update_prefix_trigger"() OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."operation"() RETURNS "text"
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
    RETURN current_setting('storage.operation', true);
END;
$$;


ALTER FUNCTION "storage"."operation"() OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."prefixes_delete_cleanup"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_bucket_ids text[];
    v_names      text[];
BEGIN
    IF current_setting('storage.gc.prefixes', true) = '1' THEN
        RETURN NULL;
    END IF;

    PERFORM set_config('storage.gc.prefixes', '1', true);

    SELECT COALESCE(array_agg(d.bucket_id), '{}'),
           COALESCE(array_agg(d.name), '{}')
    INTO v_bucket_ids, v_names
    FROM deleted AS d
    WHERE d.name <> '';

    PERFORM storage.lock_top_prefixes(v_bucket_ids, v_names);
    PERFORM storage.delete_leaf_prefixes(v_bucket_ids, v_names);

    RETURN NULL;
END;
$$;


ALTER FUNCTION "storage"."prefixes_delete_cleanup"() OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."prefixes_insert_trigger"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    PERFORM "storage"."add_prefixes"(NEW."bucket_id", NEW."name");
    RETURN NEW;
END;
$$;


ALTER FUNCTION "storage"."prefixes_insert_trigger"() OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."search"("prefix" "text", "bucketname" "text", "limits" integer DEFAULT 100, "levels" integer DEFAULT 1, "offsets" integer DEFAULT 0, "search" "text" DEFAULT ''::"text", "sortcolumn" "text" DEFAULT 'name'::"text", "sortorder" "text" DEFAULT 'asc'::"text") RETURNS TABLE("name" "text", "id" "uuid", "updated_at" timestamp with time zone, "created_at" timestamp with time zone, "last_accessed_at" timestamp with time zone, "metadata" "jsonb")
    LANGUAGE "plpgsql"
    AS $$
declare
    can_bypass_rls BOOLEAN;
begin
    SELECT rolbypassrls
    INTO can_bypass_rls
    FROM pg_roles
    WHERE rolname = coalesce(nullif(current_setting('role', true), 'none'), current_user);

    IF can_bypass_rls THEN
        RETURN QUERY SELECT * FROM storage.search_v1_optimised(prefix, bucketname, limits, levels, offsets, search, sortcolumn, sortorder);
    ELSE
        RETURN QUERY SELECT * FROM storage.search_legacy_v1(prefix, bucketname, limits, levels, offsets, search, sortcolumn, sortorder);
    END IF;
end;
$$;


ALTER FUNCTION "storage"."search"("prefix" "text", "bucketname" "text", "limits" integer, "levels" integer, "offsets" integer, "search" "text", "sortcolumn" "text", "sortorder" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."search_legacy_v1"("prefix" "text", "bucketname" "text", "limits" integer DEFAULT 100, "levels" integer DEFAULT 1, "offsets" integer DEFAULT 0, "search" "text" DEFAULT ''::"text", "sortcolumn" "text" DEFAULT 'name'::"text", "sortorder" "text" DEFAULT 'asc'::"text") RETURNS TABLE("name" "text", "id" "uuid", "updated_at" timestamp with time zone, "created_at" timestamp with time zone, "last_accessed_at" timestamp with time zone, "metadata" "jsonb")
    LANGUAGE "plpgsql" STABLE
    AS $_$
declare
    v_order_by text;
    v_sort_order text;
begin
    case
        when sortcolumn = 'name' then
            v_order_by = 'name';
        when sortcolumn = 'updated_at' then
            v_order_by = 'updated_at';
        when sortcolumn = 'created_at' then
            v_order_by = 'created_at';
        when sortcolumn = 'last_accessed_at' then
            v_order_by = 'last_accessed_at';
        else
            v_order_by = 'name';
        end case;

    case
        when sortorder = 'asc' then
            v_sort_order = 'asc';
        when sortorder = 'desc' then
            v_sort_order = 'desc';
        else
            v_sort_order = 'asc';
        end case;

    v_order_by = v_order_by || ' ' || v_sort_order;

    return query execute
        'with folders as (
           select path_tokens[$1] as folder
           from storage.objects
             where objects.name ilike $2 || $3 || ''%''
               and bucket_id = $4
               and array_length(objects.path_tokens, 1) <> $1
           group by folder
           order by folder ' || v_sort_order || '
     )
     (select folder as "name",
            null as id,
            null as updated_at,
            null as created_at,
            null as last_accessed_at,
            null as metadata from folders)
     union all
     (select path_tokens[$1] as "name",
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
     from storage.objects
     where objects.name ilike $2 || $3 || ''%''
       and bucket_id = $4
       and array_length(objects.path_tokens, 1) = $1
     order by ' || v_order_by || ')
     limit $5
     offset $6' using levels, prefix, search, bucketname, limits, offsets;
end;
$_$;


ALTER FUNCTION "storage"."search_legacy_v1"("prefix" "text", "bucketname" "text", "limits" integer, "levels" integer, "offsets" integer, "search" "text", "sortcolumn" "text", "sortorder" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."search_v1_optimised"("prefix" "text", "bucketname" "text", "limits" integer DEFAULT 100, "levels" integer DEFAULT 1, "offsets" integer DEFAULT 0, "search" "text" DEFAULT ''::"text", "sortcolumn" "text" DEFAULT 'name'::"text", "sortorder" "text" DEFAULT 'asc'::"text") RETURNS TABLE("name" "text", "id" "uuid", "updated_at" timestamp with time zone, "created_at" timestamp with time zone, "last_accessed_at" timestamp with time zone, "metadata" "jsonb")
    LANGUAGE "plpgsql" STABLE
    AS $_$
declare
    v_order_by text;
    v_sort_order text;
begin
    case
        when sortcolumn = 'name' then
            v_order_by = 'name';
        when sortcolumn = 'updated_at' then
            v_order_by = 'updated_at';
        when sortcolumn = 'created_at' then
            v_order_by = 'created_at';
        when sortcolumn = 'last_accessed_at' then
            v_order_by = 'last_accessed_at';
        else
            v_order_by = 'name';
        end case;

    case
        when sortorder = 'asc' then
            v_sort_order = 'asc';
        when sortorder = 'desc' then
            v_sort_order = 'desc';
        else
            v_sort_order = 'asc';
        end case;

    v_order_by = v_order_by || ' ' || v_sort_order;

    return query execute
        'with folders as (
           select (string_to_array(name, ''/''))[level] as name
           from storage.prefixes
             where lower(prefixes.name) like lower($2 || $3) || ''%''
               and bucket_id = $4
               and level = $1
           order by name ' || v_sort_order || '
     )
     (select name,
            null as id,
            null as updated_at,
            null as created_at,
            null as last_accessed_at,
            null as metadata from folders)
     union all
     (select path_tokens[level] as "name",
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
     from storage.objects
     where lower(objects.name) like lower($2 || $3) || ''%''
       and bucket_id = $4
       and level = $1
     order by ' || v_order_by || ')
     limit $5
     offset $6' using levels, prefix, search, bucketname, limits, offsets;
end;
$_$;


ALTER FUNCTION "storage"."search_v1_optimised"("prefix" "text", "bucketname" "text", "limits" integer, "levels" integer, "offsets" integer, "search" "text", "sortcolumn" "text", "sortorder" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."search_v2"("prefix" "text", "bucket_name" "text", "limits" integer DEFAULT 100, "levels" integer DEFAULT 1, "start_after" "text" DEFAULT ''::"text", "sort_order" "text" DEFAULT 'asc'::"text", "sort_column" "text" DEFAULT 'name'::"text", "sort_column_after" "text" DEFAULT ''::"text") RETURNS TABLE("key" "text", "name" "text", "id" "uuid", "updated_at" timestamp with time zone, "created_at" timestamp with time zone, "last_accessed_at" timestamp with time zone, "metadata" "jsonb")
    LANGUAGE "plpgsql" STABLE
    AS $_$
DECLARE
    sort_col text;
    sort_ord text;
    cursor_op text;
    cursor_expr text;
    sort_expr text;
BEGIN
    -- Validate sort_order
    sort_ord := lower(sort_order);
    IF sort_ord NOT IN ('asc', 'desc') THEN
        sort_ord := 'asc';
    END IF;

    -- Determine cursor comparison operator
    IF sort_ord = 'asc' THEN
        cursor_op := '>';
    ELSE
        cursor_op := '<';
    END IF;
    
    sort_col := lower(sort_column);
    -- Validate sort column  
    IF sort_col IN ('updated_at', 'created_at') THEN
        cursor_expr := format(
            '($5 = '''' OR ROW(date_trunc(''milliseconds'', %I), name COLLATE "C") %s ROW(COALESCE(NULLIF($6, '''')::timestamptz, ''epoch''::timestamptz), $5))',
            sort_col, cursor_op
        );
        sort_expr := format(
            'COALESCE(date_trunc(''milliseconds'', %I), ''epoch''::timestamptz) %s, name COLLATE "C" %s',
            sort_col, sort_ord, sort_ord
        );
    ELSE
        cursor_expr := format('($5 = '''' OR name COLLATE "C" %s $5)', cursor_op);
        sort_expr := format('name COLLATE "C" %s', sort_ord);
    END IF;

    RETURN QUERY EXECUTE format(
        $sql$
        SELECT * FROM (
            (
                SELECT
                    split_part(name, '/', $4) AS key,
                    name,
                    NULL::uuid AS id,
                    updated_at,
                    created_at,
                    NULL::timestamptz AS last_accessed_at,
                    NULL::jsonb AS metadata
                FROM storage.prefixes
                WHERE name COLLATE "C" LIKE $1 || '%%'
                    AND bucket_id = $2
                    AND level = $4
                    AND %s
                ORDER BY %s
                LIMIT $3
            )
            UNION ALL
            (
                SELECT
                    split_part(name, '/', $4) AS key,
                    name,
                    id,
                    updated_at,
                    created_at,
                    last_accessed_at,
                    metadata
                FROM storage.objects
                WHERE name COLLATE "C" LIKE $1 || '%%'
                    AND bucket_id = $2
                    AND level = $4
                    AND %s
                ORDER BY %s
                LIMIT $3
            )
        ) obj
        ORDER BY %s
        LIMIT $3
        $sql$,
        cursor_expr,    -- prefixes WHERE
        sort_expr,      -- prefixes ORDER BY
        cursor_expr,    -- objects WHERE
        sort_expr,      -- objects ORDER BY
        sort_expr       -- final ORDER BY
    )
    USING prefix, bucket_name, limits, levels, start_after, sort_column_after;
END;
$_$;


ALTER FUNCTION "storage"."search_v2"("prefix" "text", "bucket_name" "text", "limits" integer, "levels" integer, "start_after" "text", "sort_order" "text", "sort_column" "text", "sort_column_after" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$;


ALTER FUNCTION "storage"."update_updated_at_column"() OWNER TO "supabase_storage_admin";


CREATE TABLE IF NOT EXISTS "auth"."audit_log_entries" (
    "instance_id" "uuid",
    "id" "uuid" NOT NULL,
    "payload" json,
    "created_at" timestamp with time zone,
    "ip_address" character varying(64) DEFAULT ''::character varying NOT NULL
);


ALTER TABLE "auth"."audit_log_entries" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."audit_log_entries" IS 'Auth: Audit trail for user actions.';



CREATE TABLE IF NOT EXISTS "auth"."flow_state" (
    "id" "uuid" NOT NULL,
    "user_id" "uuid",
    "auth_code" "text" NOT NULL,
    "code_challenge_method" "auth"."code_challenge_method" NOT NULL,
    "code_challenge" "text" NOT NULL,
    "provider_type" "text" NOT NULL,
    "provider_access_token" "text",
    "provider_refresh_token" "text",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "authentication_method" "text" NOT NULL,
    "auth_code_issued_at" timestamp with time zone
);


ALTER TABLE "auth"."flow_state" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."flow_state" IS 'stores metadata for pkce logins';



CREATE TABLE IF NOT EXISTS "auth"."identities" (
    "provider_id" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "identity_data" "jsonb" NOT NULL,
    "provider" "text" NOT NULL,
    "last_sign_in_at" timestamp with time zone,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "email" "text" GENERATED ALWAYS AS ("lower"(("identity_data" ->> 'email'::"text"))) STORED,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
);


ALTER TABLE "auth"."identities" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."identities" IS 'Auth: Stores identities associated to a user.';



COMMENT ON COLUMN "auth"."identities"."email" IS 'Auth: Email is a generated column that references the optional email property in the identity_data';



CREATE TABLE IF NOT EXISTS "auth"."instances" (
    "id" "uuid" NOT NULL,
    "uuid" "uuid",
    "raw_base_config" "text",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone
);


ALTER TABLE "auth"."instances" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."instances" IS 'Auth: Manages users across multiple sites.';



CREATE TABLE IF NOT EXISTS "auth"."mfa_amr_claims" (
    "session_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone NOT NULL,
    "updated_at" timestamp with time zone NOT NULL,
    "authentication_method" "text" NOT NULL,
    "id" "uuid" NOT NULL
);


ALTER TABLE "auth"."mfa_amr_claims" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."mfa_amr_claims" IS 'auth: stores authenticator method reference claims for multi factor authentication';



CREATE TABLE IF NOT EXISTS "auth"."mfa_challenges" (
    "id" "uuid" NOT NULL,
    "factor_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone NOT NULL,
    "verified_at" timestamp with time zone,
    "ip_address" "inet" NOT NULL,
    "otp_code" "text",
    "web_authn_session_data" "jsonb"
);


ALTER TABLE "auth"."mfa_challenges" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."mfa_challenges" IS 'auth: stores metadata about challenge requests made';



CREATE TABLE IF NOT EXISTS "auth"."mfa_factors" (
    "id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "friendly_name" "text",
    "factor_type" "auth"."factor_type" NOT NULL,
    "status" "auth"."factor_status" NOT NULL,
    "created_at" timestamp with time zone NOT NULL,
    "updated_at" timestamp with time zone NOT NULL,
    "secret" "text",
    "phone" "text",
    "last_challenged_at" timestamp with time zone,
    "web_authn_credential" "jsonb",
    "web_authn_aaguid" "uuid"
);


ALTER TABLE "auth"."mfa_factors" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."mfa_factors" IS 'auth: stores metadata about factors';



CREATE TABLE IF NOT EXISTS "auth"."oauth_authorizations" (
    "id" "uuid" NOT NULL,
    "authorization_id" "text" NOT NULL,
    "client_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "redirect_uri" "text" NOT NULL,
    "scope" "text" NOT NULL,
    "state" "text",
    "resource" "text",
    "code_challenge" "text",
    "code_challenge_method" "auth"."code_challenge_method",
    "response_type" "auth"."oauth_response_type" DEFAULT 'code'::"auth"."oauth_response_type" NOT NULL,
    "status" "auth"."oauth_authorization_status" DEFAULT 'pending'::"auth"."oauth_authorization_status" NOT NULL,
    "authorization_code" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone DEFAULT ("now"() + '00:03:00'::interval) NOT NULL,
    "approved_at" timestamp with time zone,
    CONSTRAINT "oauth_authorizations_authorization_code_length" CHECK (("char_length"("authorization_code") <= 255)),
    CONSTRAINT "oauth_authorizations_code_challenge_length" CHECK (("char_length"("code_challenge") <= 128)),
    CONSTRAINT "oauth_authorizations_expires_at_future" CHECK (("expires_at" > "created_at")),
    CONSTRAINT "oauth_authorizations_redirect_uri_length" CHECK (("char_length"("redirect_uri") <= 2048)),
    CONSTRAINT "oauth_authorizations_resource_length" CHECK (("char_length"("resource") <= 2048)),
    CONSTRAINT "oauth_authorizations_scope_length" CHECK (("char_length"("scope") <= 4096)),
    CONSTRAINT "oauth_authorizations_state_length" CHECK (("char_length"("state") <= 4096))
);


ALTER TABLE "auth"."oauth_authorizations" OWNER TO "supabase_auth_admin";


CREATE TABLE IF NOT EXISTS "auth"."oauth_clients" (
    "id" "uuid" NOT NULL,
    "client_secret_hash" "text",
    "registration_type" "auth"."oauth_registration_type" NOT NULL,
    "redirect_uris" "text" NOT NULL,
    "grant_types" "text" NOT NULL,
    "client_name" "text",
    "client_uri" "text",
    "logo_uri" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    "client_type" "auth"."oauth_client_type" DEFAULT 'confidential'::"auth"."oauth_client_type" NOT NULL,
    CONSTRAINT "oauth_clients_client_name_length" CHECK (("char_length"("client_name") <= 1024)),
    CONSTRAINT "oauth_clients_client_uri_length" CHECK (("char_length"("client_uri") <= 2048)),
    CONSTRAINT "oauth_clients_logo_uri_length" CHECK (("char_length"("logo_uri") <= 2048))
);


ALTER TABLE "auth"."oauth_clients" OWNER TO "supabase_auth_admin";


CREATE TABLE IF NOT EXISTS "auth"."oauth_consents" (
    "id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "client_id" "uuid" NOT NULL,
    "scopes" "text" NOT NULL,
    "granted_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "revoked_at" timestamp with time zone,
    CONSTRAINT "oauth_consents_revoked_after_granted" CHECK ((("revoked_at" IS NULL) OR ("revoked_at" >= "granted_at"))),
    CONSTRAINT "oauth_consents_scopes_length" CHECK (("char_length"("scopes") <= 2048)),
    CONSTRAINT "oauth_consents_scopes_not_empty" CHECK (("char_length"(TRIM(BOTH FROM "scopes")) > 0))
);


ALTER TABLE "auth"."oauth_consents" OWNER TO "supabase_auth_admin";


CREATE TABLE IF NOT EXISTS "auth"."one_time_tokens" (
    "id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "token_type" "auth"."one_time_token_type" NOT NULL,
    "token_hash" "text" NOT NULL,
    "relates_to" "text" NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "one_time_tokens_token_hash_check" CHECK (("char_length"("token_hash") > 0))
);


ALTER TABLE "auth"."one_time_tokens" OWNER TO "supabase_auth_admin";


CREATE TABLE IF NOT EXISTS "auth"."refresh_tokens" (
    "instance_id" "uuid",
    "id" bigint NOT NULL,
    "token" character varying(255),
    "user_id" character varying(255),
    "revoked" boolean,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "parent" character varying(255),
    "session_id" "uuid"
);


ALTER TABLE "auth"."refresh_tokens" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."refresh_tokens" IS 'Auth: Store of tokens used to refresh JWT tokens once they expire.';



CREATE SEQUENCE IF NOT EXISTS "auth"."refresh_tokens_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "auth"."refresh_tokens_id_seq" OWNER TO "supabase_auth_admin";


ALTER SEQUENCE "auth"."refresh_tokens_id_seq" OWNED BY "auth"."refresh_tokens"."id";



CREATE TABLE IF NOT EXISTS "auth"."saml_providers" (
    "id" "uuid" NOT NULL,
    "sso_provider_id" "uuid" NOT NULL,
    "entity_id" "text" NOT NULL,
    "metadata_xml" "text" NOT NULL,
    "metadata_url" "text",
    "attribute_mapping" "jsonb",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "name_id_format" "text",
    CONSTRAINT "entity_id not empty" CHECK (("char_length"("entity_id") > 0)),
    CONSTRAINT "metadata_url not empty" CHECK ((("metadata_url" = NULL::"text") OR ("char_length"("metadata_url") > 0))),
    CONSTRAINT "metadata_xml not empty" CHECK (("char_length"("metadata_xml") > 0))
);


ALTER TABLE "auth"."saml_providers" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."saml_providers" IS 'Auth: Manages SAML Identity Provider connections.';



CREATE TABLE IF NOT EXISTS "auth"."saml_relay_states" (
    "id" "uuid" NOT NULL,
    "sso_provider_id" "uuid" NOT NULL,
    "request_id" "text" NOT NULL,
    "for_email" "text",
    "redirect_to" "text",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "flow_state_id" "uuid",
    CONSTRAINT "request_id not empty" CHECK (("char_length"("request_id") > 0))
);


ALTER TABLE "auth"."saml_relay_states" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."saml_relay_states" IS 'Auth: Contains SAML Relay State information for each Service Provider initiated login.';



CREATE TABLE IF NOT EXISTS "auth"."schema_migrations" (
    "version" character varying(255) NOT NULL
);


ALTER TABLE "auth"."schema_migrations" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."schema_migrations" IS 'Auth: Manages updates to the auth system.';



CREATE TABLE IF NOT EXISTS "auth"."sessions" (
    "id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "factor_id" "uuid",
    "aal" "auth"."aal_level",
    "not_after" timestamp with time zone,
    "refreshed_at" timestamp without time zone,
    "user_agent" "text",
    "ip" "inet",
    "tag" "text",
    "oauth_client_id" "uuid"
);


ALTER TABLE "auth"."sessions" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."sessions" IS 'Auth: Stores session data associated to a user.';



COMMENT ON COLUMN "auth"."sessions"."not_after" IS 'Auth: Not after is a nullable column that contains a timestamp after which the session should be regarded as expired.';



CREATE TABLE IF NOT EXISTS "auth"."sso_domains" (
    "id" "uuid" NOT NULL,
    "sso_provider_id" "uuid" NOT NULL,
    "domain" "text" NOT NULL,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    CONSTRAINT "domain not empty" CHECK (("char_length"("domain") > 0))
);


ALTER TABLE "auth"."sso_domains" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."sso_domains" IS 'Auth: Manages SSO email address domain mapping to an SSO Identity Provider.';



CREATE TABLE IF NOT EXISTS "auth"."sso_providers" (
    "id" "uuid" NOT NULL,
    "resource_id" "text",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "disabled" boolean,
    CONSTRAINT "resource_id not empty" CHECK ((("resource_id" = NULL::"text") OR ("char_length"("resource_id") > 0)))
);


ALTER TABLE "auth"."sso_providers" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."sso_providers" IS 'Auth: Manages SSO identity provider information; see saml_providers for SAML.';



COMMENT ON COLUMN "auth"."sso_providers"."resource_id" IS 'Auth: Uniquely identifies a SSO provider according to a user-chosen resource ID (case insensitive), useful in infrastructure as code.';



CREATE TABLE IF NOT EXISTS "auth"."users" (
    "instance_id" "uuid",
    "id" "uuid" NOT NULL,
    "aud" character varying(255),
    "role" character varying(255),
    "email" character varying(255),
    "encrypted_password" character varying(255),
    "email_confirmed_at" timestamp with time zone,
    "invited_at" timestamp with time zone,
    "confirmation_token" character varying(255),
    "confirmation_sent_at" timestamp with time zone,
    "recovery_token" character varying(255),
    "recovery_sent_at" timestamp with time zone,
    "email_change_token_new" character varying(255),
    "email_change" character varying(255),
    "email_change_sent_at" timestamp with time zone,
    "last_sign_in_at" timestamp with time zone,
    "raw_app_meta_data" "jsonb",
    "raw_user_meta_data" "jsonb",
    "is_super_admin" boolean,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "phone" "text" DEFAULT NULL::character varying,
    "phone_confirmed_at" timestamp with time zone,
    "phone_change" "text" DEFAULT ''::character varying,
    "phone_change_token" character varying(255) DEFAULT ''::character varying,
    "phone_change_sent_at" timestamp with time zone,
    "confirmed_at" timestamp with time zone GENERATED ALWAYS AS (LEAST("email_confirmed_at", "phone_confirmed_at")) STORED,
    "email_change_token_current" character varying(255) DEFAULT ''::character varying,
    "email_change_confirm_status" smallint DEFAULT 0,
    "banned_until" timestamp with time zone,
    "reauthentication_token" character varying(255) DEFAULT ''::character varying,
    "reauthentication_sent_at" timestamp with time zone,
    "is_sso_user" boolean DEFAULT false NOT NULL,
    "deleted_at" timestamp with time zone,
    "is_anonymous" boolean DEFAULT false NOT NULL,
    CONSTRAINT "users_email_change_confirm_status_check" CHECK ((("email_change_confirm_status" >= 0) AND ("email_change_confirm_status" <= 2)))
);


ALTER TABLE "auth"."users" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."users" IS 'Auth: Stores user login data within a secure schema.';



COMMENT ON COLUMN "auth"."users"."is_sso_user" IS 'Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.';



CREATE TABLE IF NOT EXISTS "public"."appointment_statuses" (
    "status_code" character varying(20) NOT NULL,
    "status_name_vn" character varying(50) NOT NULL,
    "color_code" character varying(10)
);


ALTER TABLE "public"."appointment_statuses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."appointments" (
    "appointment_id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "service_type" character varying(50),
    "scheduled_datetime" timestamp with time zone NOT NULL,
    "doctor_id" "uuid",
    "receptionist_id" "uuid",
    "current_status" character varying(20) NOT NULL,
    "reason_for_visit" "text",
    "check_in_time" timestamp with time zone,
    "is_confirmed_by_zalo" boolean DEFAULT false,
    "receptionist_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "room_id" "uuid"
);


ALTER TABLE "public"."appointments" OWNER TO "postgres";


COMMENT ON COLUMN "public"."appointments"."room_id" IS 'Reference to the room where the appointment will take place';



CREATE TABLE IF NOT EXISTS "public"."b2b_customers" (
    "customer_id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "customer_name" character varying(255) NOT NULL,
    "customer_code" character varying(50) NOT NULL,
    "contact_person" character varying(255),
    "phone_number" character varying(20),
    "email" character varying(255),
    "address" "text",
    "tax_code" character varying(50),
    "customer_type" character varying(50) DEFAULT 'other'::character varying NOT NULL,
    "credit_limit" numeric(15,2) DEFAULT 0,
    "payment_terms_days" integer DEFAULT 30,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "b2b_customers_customer_type_check" CHECK ((("customer_type")::"text" = ANY ((ARRAY['hospital'::character varying, 'pharmacy'::character varying, 'clinic'::character varying, 'distributor'::character varying, 'other'::character varying])::"text"[])))
);


ALTER TABLE "public"."b2b_customers" OWNER TO "postgres";


COMMENT ON TABLE "public"."b2b_customers" IS 'B2B customers for wholesale quotations and orders';



CREATE TABLE IF NOT EXISTS "public"."b2b_quote_items" (
    "item_id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "quote_id" "uuid" NOT NULL,
    "product_id" integer NOT NULL,
    "product_name" character varying(255) NOT NULL,
    "product_sku" character varying(100),
    "quantity" integer NOT NULL,
    "unit_price" numeric(15,2) NOT NULL,
    "discount_percent" numeric(5,2) DEFAULT 0,
    "discount_amount" numeric(15,2) DEFAULT 0,
    "subtotal" numeric(15,2) DEFAULT 0 NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "vat_percent" numeric(5,2) DEFAULT 5.00,
    CONSTRAINT "b2b_quote_items_quantity_check" CHECK (("quantity" > 0)),
    CONSTRAINT "b2b_quote_items_unit_price_check" CHECK (("unit_price" >= (0)::numeric)),
    CONSTRAINT "check_b2b_quote_item_vat_percent_valid" CHECK (("vat_percent" = ANY (ARRAY[(0)::numeric, (1)::numeric, (2)::numeric, (3)::numeric, (5)::numeric])))
);


ALTER TABLE "public"."b2b_quote_items" OWNER TO "postgres";


COMMENT ON TABLE "public"."b2b_quote_items" IS 'Line items for B2B quotes with product details and pricing';



COMMENT ON COLUMN "public"."b2b_quote_items"."vat_percent" IS 'VAT percentage for this quote item (inherited from product, can be overridden)';



CREATE TABLE IF NOT EXISTS "public"."b2b_quotes" (
    "quote_id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "quote_number" character varying(50) NOT NULL,
    "customer_name" character varying(255) NOT NULL,
    "customer_code" character varying(50),
    "customer_contact_person" character varying(255),
    "customer_phone" character varying(20),
    "customer_email" character varying(255),
    "customer_address" "text",
    "quote_stage" "text" DEFAULT 'draft'::"text" NOT NULL,
    "total_value" numeric(15,2) DEFAULT 0 NOT NULL,
    "subtotal" numeric(15,2) DEFAULT 0 NOT NULL,
    "discount_percent" numeric(5,2) DEFAULT 0,
    "discount_amount" numeric(15,2) DEFAULT 0,
    "tax_percent" numeric(5,2) DEFAULT 0,
    "tax_amount" numeric(15,2) DEFAULT 0,
    "quote_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "valid_until" "date" NOT NULL,
    "notes" "text",
    "terms_conditions" "text",
    "created_by_employee_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "b2b_customer_id" "uuid",
    "payment_status" character varying DEFAULT 'unpaid'::character varying,
    "warehouse_employee_id" "uuid",
    "delivery_employee_id" "uuid"
);


ALTER TABLE "public"."b2b_quotes" OWNER TO "postgres";


COMMENT ON TABLE "public"."b2b_quotes" IS 'B2B quotations with 7-stage lifecycle from draft to accepted/rejected';



COMMENT ON COLUMN "public"."b2b_quotes"."quote_number" IS 'Auto-generated quote number in format BG-YYYY-MM-NNN';



COMMENT ON COLUMN "public"."b2b_quotes"."quote_stage" IS 'Quote lifecycle: draft, sent, negotiating, accepted, rejected, expired';



COMMENT ON COLUMN "public"."b2b_quotes"."valid_until" IS 'Quote expiration date';



COMMENT ON COLUMN "public"."b2b_quotes"."warehouse_employee_id" IS 'Nhân viên kho được giao xử lý đơn hàng này';



COMMENT ON COLUMN "public"."b2b_quotes"."delivery_employee_id" IS 'Nhân viên giao hàng được phân công cho đơn hàng này';



CREATE TABLE IF NOT EXISTS "public"."banks" (
    "id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "code" "text" NOT NULL,
    "bin" "text" NOT NULL,
    "short_name" "text" NOT NULL,
    "logo" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."banks" OWNER TO "postgres";


ALTER TABLE "public"."banks" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."banks_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."barcode_verifications" (
    "id" integer NOT NULL,
    "barcode_scanned" character varying(255) NOT NULL,
    "scan_type" character varying(50),
    "product_id" integer,
    "lot_id" integer,
    "match_status" character varying(50) NOT NULL,
    "order_id" integer,
    "order_type" character varying(50),
    "in_order" boolean,
    "verification_context" character varying(50),
    "warehouse_id" integer,
    "scanned_by" "uuid",
    "device_info" "jsonb",
    "scanned_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "barcode_verifications_match_status_check" CHECK ((("match_status")::"text" = ANY ((ARRAY['matched'::character varying, 'not_found'::character varying, 'multiple_matches'::character varying, 'error'::character varying])::"text"[]))),
    CONSTRAINT "barcode_verifications_scan_type_check" CHECK ((("scan_type")::"text" = ANY ((ARRAY['barcode'::character varying, 'qr_code'::character varying, 'manual'::character varying])::"text"[]))),
    CONSTRAINT "barcode_verifications_verification_context_check" CHECK ((("verification_context")::"text" = ANY ((ARRAY['receiving'::character varying, 'picking'::character varying, 'packing'::character varying, 'shipping'::character varying, 'inventory_check'::character varying])::"text"[])))
);


ALTER TABLE "public"."barcode_verifications" OWNER TO "postgres";


COMMENT ON TABLE "public"."barcode_verifications" IS 'Barcode/QR scan verification log (NÚT 3)';



CREATE SEQUENCE IF NOT EXISTS "public"."barcode_verifications_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."barcode_verifications_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."barcode_verifications_id_seq" OWNED BY "public"."barcode_verifications"."id";



CREATE TABLE IF NOT EXISTS "public"."combo_items" (
    "id" bigint NOT NULL,
    "combo_id" bigint NOT NULL,
    "product_id" bigint NOT NULL,
    "quantity" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "combo_items_quantity_check" CHECK (("quantity" > 0))
);


ALTER TABLE "public"."combo_items" OWNER TO "postgres";


COMMENT ON TABLE "public"."combo_items" IS 'Links combos to their constituent products with quantities';



COMMENT ON COLUMN "public"."combo_items"."id" IS 'Unique identifier for the combo item';



COMMENT ON COLUMN "public"."combo_items"."combo_id" IS 'Reference to the combo';



COMMENT ON COLUMN "public"."combo_items"."product_id" IS 'Reference to the product included in combo';



COMMENT ON COLUMN "public"."combo_items"."quantity" IS 'How many units of this product are in the combo';



CREATE SEQUENCE IF NOT EXISTS "public"."combo_items_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."combo_items_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."combo_items_id_seq" OWNED BY "public"."combo_items"."id";



CREATE TABLE IF NOT EXISTS "public"."combos" (
    "id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "combo_price" numeric(10,2) NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "image_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "combos_combo_price_check" CHECK (("combo_price" >= (0)::numeric))
);


ALTER TABLE "public"."combos" OWNER TO "postgres";


COMMENT ON TABLE "public"."combos" IS 'Product bundles/packages with discounted pricing';



COMMENT ON COLUMN "public"."combos"."id" IS 'Unique identifier for the combo';



COMMENT ON COLUMN "public"."combos"."name" IS 'Name of the combo (e.g., "Flu Care Package")';



COMMENT ON COLUMN "public"."combos"."description" IS 'Description of the combo and its benefits';



COMMENT ON COLUMN "public"."combos"."combo_price" IS 'Discounted price for buying all products together';



COMMENT ON COLUMN "public"."combos"."is_active" IS 'Whether this combo is currently available';



COMMENT ON COLUMN "public"."combos"."image_url" IS 'URL to combo promotional image';



CREATE SEQUENCE IF NOT EXISTS "public"."combos_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."combos_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."combos_id_seq" OWNED BY "public"."combos"."id";



CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text",
    "cost_price" numeric,
    "retail_price" numeric,
    "sku" "text",
    "product_type" "text",
    "is_fixed_asset" boolean,
    "barcode" "text",
    "category" "text",
    "tags" "text"[],
    "manufacturer" "text",
    "distributor" "text",
    "registration_number" "text",
    "packaging" "text",
    "description" "text",
    "hdsd_0_2" "text",
    "hdsd_2_6" "text",
    "hdsd_6_18" "text",
    "hdsd_over_18" "text",
    "disease" "text",
    "is_chronic" boolean,
    "wholesale_unit" "text",
    "retail_unit" "text",
    "conversion_rate" numeric,
    "invoice_price" numeric,
    "wholesale_profit" numeric,
    "retail_profit" numeric,
    "wholesale_price" numeric,
    "is_active" boolean DEFAULT true,
    "image_url" "text",
    "route" "text",
    "supplier_id" bigint,
    "shelf_location" "text",
    "min_stock" integer DEFAULT 0,
    "max_stock" integer DEFAULT 0,
    "batch_number" character varying(100),
    "expiry_date" "date",
    "enable_lot_management" boolean DEFAULT false,
    "vat_percent" numeric(5,2) DEFAULT 5.00,
    CONSTRAINT "check_product_vat_percent_valid" CHECK (("vat_percent" = ANY (ARRAY[(0)::numeric, (1)::numeric, (2)::numeric, (3)::numeric, (5)::numeric])))
);


ALTER TABLE "public"."products" OWNER TO "postgres";


COMMENT ON COLUMN "public"."products"."min_stock" IS 'Minimum stock level - triggers auto purchase order';



COMMENT ON COLUMN "public"."products"."max_stock" IS 'Maximum stock level - target quantity for restocking';



COMMENT ON COLUMN "public"."products"."batch_number" IS 'Current batch/lot number';



COMMENT ON COLUMN "public"."products"."expiry_date" IS 'Expiry date for current batch';



COMMENT ON COLUMN "public"."products"."enable_lot_management" IS 'Flag to enable lot/batch tracking for this product. When true, the product requires lot number, expiry date, and other lot-specific information during receiving and selling.';



COMMENT ON COLUMN "public"."products"."vat_percent" IS 'VAT percentage applied to this product (0%, 1%, 2%, 3%, 5%)';



CREATE OR REPLACE VIEW "public"."combos_with_pricing" AS
 SELECT "c"."id",
    "c"."name",
    "c"."description",
    "c"."combo_price",
    "c"."is_active",
    "c"."image_url",
    "c"."created_at",
    "c"."updated_at",
    COALESCE("sum"(("p"."retail_price" * ("ci"."quantity")::numeric)), (0)::numeric) AS "original_price",
    (COALESCE("sum"(("p"."retail_price" * ("ci"."quantity")::numeric)), (0)::numeric) - "c"."combo_price") AS "discount_amount",
        CASE
            WHEN (COALESCE("sum"(("p"."retail_price" * ("ci"."quantity")::numeric)), (0)::numeric) > (0)::numeric) THEN "round"((((COALESCE("sum"(("p"."retail_price" * ("ci"."quantity")::numeric)), (0)::numeric) - "c"."combo_price") / COALESCE("sum"(("p"."retail_price" * ("ci"."quantity")::numeric)), (0)::numeric)) * (100)::numeric), 2)
            ELSE (0)::numeric
        END AS "discount_percentage",
    "count"("ci"."id") AS "item_count"
   FROM (("public"."combos" "c"
     LEFT JOIN "public"."combo_items" "ci" ON (("c"."id" = "ci"."combo_id")))
     LEFT JOIN "public"."products" "p" ON (("ci"."product_id" = "p"."id")))
  GROUP BY "c"."id", "c"."name", "c"."description", "c"."combo_price", "c"."is_active", "c"."image_url", "c"."created_at", "c"."updated_at";


ALTER VIEW "public"."combos_with_pricing" OWNER TO "postgres";


COMMENT ON VIEW "public"."combos_with_pricing" IS 'Combos with calculated original price, discount amount, and percentage';



CREATE TABLE IF NOT EXISTS "public"."comments" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "author_id" "uuid",
    "post_id" "uuid",
    "content" "text" NOT NULL
);


ALTER TABLE "public"."comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."employees" (
    "employee_id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "full_name" character varying(255) NOT NULL,
    "employee_code" character varying(50),
    "role_name" character varying(50) NOT NULL,
    "is_active" boolean DEFAULT true,
    "user_id" "uuid",
    "permissions" "text"[],
    "warehouse_id" bigint
);


ALTER TABLE "public"."employees" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."funds" (
    "id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "type" "text" NOT NULL,
    "initial_balance" numeric DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "account_holder_name" "text",
    "account_number" "text",
    "bank_id" bigint
);


ALTER TABLE "public"."funds" OWNER TO "postgres";


ALTER TABLE "public"."funds" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."funds_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."internal_fund_transfers" (
    "id" bigint NOT NULL,
    "from_fund_id" bigint NOT NULL,
    "to_fund_id" bigint NOT NULL,
    "amount" numeric NOT NULL,
    "description" "text",
    "created_by" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "internal_fund_transfers_amount_check" CHECK (("amount" > (0)::numeric))
);


ALTER TABLE "public"."internal_fund_transfers" OWNER TO "postgres";


ALTER TABLE "public"."internal_fund_transfers" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."internal_fund_transfers_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."inventory" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "product_id" bigint NOT NULL,
    "warehouse_id" bigint NOT NULL,
    "quantity" numeric DEFAULT 0 NOT NULL,
    "min_stock" numeric,
    "max_stock" numeric
);


ALTER TABLE "public"."inventory" OWNER TO "postgres";


ALTER TABLE "public"."inventory" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."inventory_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."lab_orders" (
    "order_id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "visit_id" "uuid" NOT NULL,
    "service_name" character varying(255) NOT NULL,
    "preliminary_diagnosis" "text",
    "is_executed" boolean DEFAULT false,
    "result_received_at" timestamp with time zone
);


ALTER TABLE "public"."lab_orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lot_movements" (
    "id" integer NOT NULL,
    "lot_id" integer NOT NULL,
    "movement_type" character varying(50) NOT NULL,
    "quantity" integer NOT NULL,
    "from_warehouse_id" integer,
    "to_warehouse_id" integer,
    "from_location" character varying(200),
    "to_location" character varying(200),
    "order_id" integer,
    "order_type" character varying(50),
    "purchase_vat_invoice_id" integer,
    "sales_vat_invoice_id" integer,
    "verified_by_barcode" boolean DEFAULT false,
    "barcode_scanned" character varying(255),
    "verification_status" character varying(50),
    "condition_before" character varying(50),
    "condition_after" character varying(50),
    "quality_check_passed" boolean,
    "reason" "text",
    "notes" "text",
    "performed_by" "uuid",
    "verified_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "lot_movements_movement_type_check" CHECK ((("movement_type")::"text" = ANY ((ARRAY['received'::character varying, 'shelved'::character varying, 'reserved'::character varying, 'picked'::character varying, 'packed'::character varying, 'shipped'::character varying, 'delivered'::character varying, 'returned'::character varying, 'damaged'::character varying, 'expired'::character varying, 'adjusted'::character varying, 'transferred'::character varying])::"text"[]))),
    CONSTRAINT "lot_movements_verification_status_check" CHECK ((("verification_status")::"text" = ANY ((ARRAY['matched'::character varying, 'mismatched'::character varying, 'not_verified'::character varying])::"text"[])))
);


ALTER TABLE "public"."lot_movements" OWNER TO "postgres";


COMMENT ON TABLE "public"."lot_movements" IS 'Complete audit trail for lot movements with barcode verification';



CREATE SEQUENCE IF NOT EXISTS "public"."lot_movements_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."lot_movements_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."lot_movements_id_seq" OWNED BY "public"."lot_movements"."id";



CREATE TABLE IF NOT EXISTS "public"."medical_visits" (
    "visit_id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "appointment_id" "uuid",
    "patient_id" "uuid" NOT NULL,
    "doctor_id" "uuid" NOT NULL,
    "visit_date" timestamp with time zone DEFAULT "now"(),
    "subjective_notes" "text",
    "objective_notes" "text",
    "vital_signs" "jsonb",
    "assessment_diagnosis_icd10" character varying(50),
    "plan_notes" "text",
    "is_signed_off" boolean DEFAULT false,
    "signed_off_at" timestamp with time zone
);


ALTER TABLE "public"."medical_visits" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" bigint NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "notification_type" character varying(50) NOT NULL,
    "title" character varying(255) NOT NULL,
    "body" "text" NOT NULL,
    "priority" character varying(20) DEFAULT 'normal'::character varying,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "action_url" character varying(500),
    "action_label" character varying(100),
    "icon" character varying(255),
    "image_url" character varying(500),
    "is_read" boolean DEFAULT false,
    "read_at" timestamp with time zone,
    "sent_to_fcm" boolean DEFAULT false,
    "fcm_sent_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "expires_at" timestamp with time zone,
    CONSTRAINT "notifications_notification_type_check" CHECK ((("notification_type")::"text" = ANY ((ARRAY['order_new'::character varying, 'order_updated'::character varying, 'order_cancelled'::character varying, 'inventory_low'::character varying, 'inventory_expired'::character varying, 'appointment_new'::character varying, 'appointment_reminder'::character varying, 'appointment_cancelled'::character varying, 'quote_new'::character varying, 'quote_updated'::character varying, 'purchase_order'::character varying, 'payment_due'::character varying, 'task_assigned'::character varying, 'system'::character varying, 'other'::character varying])::"text"[]))),
    CONSTRAINT "notifications_priority_check" CHECK ((("priority")::"text" = ANY ((ARRAY['low'::character varying, 'normal'::character varying, 'high'::character varying, 'urgent'::character varying])::"text"[])))
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


COMMENT ON TABLE "public"."notifications" IS 'Stores in-app notifications for employees';



COMMENT ON COLUMN "public"."notifications"."notification_type" IS 'Type of notification for categorization and filtering';



COMMENT ON COLUMN "public"."notifications"."priority" IS 'Priority level: low, normal, high, urgent';



COMMENT ON COLUMN "public"."notifications"."metadata" IS 'Additional data in JSON format specific to notification type';



COMMENT ON COLUMN "public"."notifications"."action_url" IS 'URL to navigate when notification is clicked';



COMMENT ON COLUMN "public"."notifications"."is_read" IS 'Whether employee has read this notification';



COMMENT ON COLUMN "public"."notifications"."sent_to_fcm" IS 'Whether this notification was sent via Firebase Cloud Messaging';



COMMENT ON COLUMN "public"."notifications"."expires_at" IS 'When this notification should be auto-deleted (optional)';



CREATE SEQUENCE IF NOT EXISTS "public"."notifications_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."notifications_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."notifications_id_seq" OWNED BY "public"."notifications"."id";



CREATE TABLE IF NOT EXISTS "public"."patient_points_history" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "transaction_type" "public"."points_transaction_type" NOT NULL,
    "points_amount" integer NOT NULL,
    "balance_before" integer NOT NULL,
    "balance_after" integer NOT NULL,
    "reference_type" "public"."points_reference_type" NOT NULL,
    "reference_id" "uuid",
    "description" "text",
    "notes" "text",
    "expires_at" timestamp with time zone,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "check_balance_calculation" CHECK (("balance_after" = ("balance_before" + "points_amount"))),
    CONSTRAINT "check_balance_non_negative" CHECK (("balance_after" >= 0))
);


ALTER TABLE "public"."patient_points_history" OWNER TO "postgres";


COMMENT ON TABLE "public"."patient_points_history" IS 'Records all loyalty points transactions for patients';



COMMENT ON COLUMN "public"."patient_points_history"."transaction_type" IS 'Type of transaction: earn, redeem, adjustment, expire, refund';



COMMENT ON COLUMN "public"."patient_points_history"."points_amount" IS 'Amount of points (positive for earn, negative for redeem)';



COMMENT ON COLUMN "public"."patient_points_history"."balance_before" IS 'Patient points balance before this transaction';



COMMENT ON COLUMN "public"."patient_points_history"."balance_after" IS 'Patient points balance after this transaction';



COMMENT ON COLUMN "public"."patient_points_history"."reference_type" IS 'What caused this transaction: order, visit, manual, etc.';



COMMENT ON COLUMN "public"."patient_points_history"."reference_id" IS 'ID of the related entity (order_id, visit_id, etc.)';



COMMENT ON COLUMN "public"."patient_points_history"."expires_at" IS 'Expiration date for earned points (NULL for redeemed/adjusted points)';



CREATE TABLE IF NOT EXISTS "public"."patients" (
    "patient_id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "full_name" character varying(255) NOT NULL,
    "phone_number" character varying(20),
    "date_of_birth" "date",
    "gender" character varying(10),
    "is_b2b_customer" boolean DEFAULT false,
    "loyalty_points" integer DEFAULT 0,
    "allergy_notes" "text",
    "chronic_diseases" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "address" "text"[]
);


ALTER TABLE "public"."patients" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."patient_points_summary" AS
 SELECT "p"."patient_id",
    "p"."full_name",
    "p"."phone_number",
    "p"."loyalty_points" AS "current_balance",
    COALESCE("sum"(
        CASE
            WHEN ("h"."transaction_type" = 'earn'::"public"."points_transaction_type") THEN "h"."points_amount"
            ELSE 0
        END), (0)::bigint) AS "total_earned",
    COALESCE("sum"(
        CASE
            WHEN ("h"."transaction_type" = 'redeem'::"public"."points_transaction_type") THEN "abs"("h"."points_amount")
            ELSE 0
        END), (0)::bigint) AS "total_redeemed",
    COALESCE("sum"(
        CASE
            WHEN ("h"."transaction_type" = 'expire'::"public"."points_transaction_type") THEN "abs"("h"."points_amount")
            ELSE 0
        END), (0)::bigint) AS "total_expired",
    "count"("h"."id") AS "transaction_count",
    "max"("h"."created_at") AS "last_transaction_at"
   FROM ("public"."patients" "p"
     LEFT JOIN "public"."patient_points_history" "h" ON (("p"."patient_id" = "h"."patient_id")))
  GROUP BY "p"."patient_id", "p"."full_name", "p"."phone_number", "p"."loyalty_points";


ALTER VIEW "public"."patient_points_summary" OWNER TO "postgres";


COMMENT ON VIEW "public"."patient_points_summary" IS 'Summary view of patient points with total earned, redeemed, and expired points';



CREATE TABLE IF NOT EXISTS "public"."permissions" (
    "id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "module" "text"
);


ALTER TABLE "public"."permissions" OWNER TO "postgres";


ALTER TABLE "public"."permissions" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."permissions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."post_reactions" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid",
    "post_id" "uuid",
    "reaction_type" character varying(50) NOT NULL
);


ALTER TABLE "public"."post_reactions" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."post_reactions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."post_reactions_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."post_reactions_id_seq" OWNED BY "public"."post_reactions"."id";



CREATE TABLE IF NOT EXISTS "public"."post_views" (
    "id" bigint NOT NULL,
    "post_id" "uuid",
    "user_id" "uuid",
    "viewed_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."post_views" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."post_views_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."post_views_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."post_views_id_seq" OWNED BY "public"."post_views"."id";



CREATE TABLE IF NOT EXISTS "public"."posts" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "author_id" "uuid",
    "title" "text" NOT NULL,
    "content" "text",
    "post_type" character varying(50) NOT NULL,
    "is_pinned" boolean DEFAULT false,
    "attachments" "jsonb",
    "status" character varying(50) DEFAULT 'published'::character varying NOT NULL,
    CONSTRAINT "posts_post_type_check" CHECK ((("post_type")::"text" = ANY ((ARRAY['announcement'::character varying, 'kudos'::character varying, 'policy'::character varying, 'suggestion'::character varying])::"text"[])))
);


ALTER TABLE "public"."posts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."prescriptions" (
    "prescription_item_id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "visit_id" "uuid" NOT NULL,
    "quantity_ordered" integer NOT NULL,
    "dosage_instruction" "text",
    "ai_interaction_warning" "text",
    "product_id" bigint
);


ALTER TABLE "public"."prescriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product_lots" (
    "id" integer NOT NULL,
    "product_id" integer NOT NULL,
    "lot_number" character varying(100) NOT NULL,
    "batch_code" character varying(100),
    "expiry_date" "date",
    "received_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "quantity" bigint,
    "warehouse_id" bigint
);


ALTER TABLE "public"."product_lots" OWNER TO "postgres";


COMMENT ON TABLE "public"."product_lots" IS 'Stores lot/batch information for products. Quantities are tracked in inventory table.';



CREATE SEQUENCE IF NOT EXISTS "public"."product_lots_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."product_lots_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."product_lots_id_seq" OWNED BY "public"."product_lots"."id";



CREATE TABLE IF NOT EXISTS "public"."product_supplier_mapping" (
    "id" integer NOT NULL,
    "product_id" integer NOT NULL,
    "supplier_id" integer NOT NULL,
    "supplier_product_code" character varying(100),
    "supplier_product_name" character varying(255),
    "cost_price" numeric(18,2),
    "lead_time_days" integer,
    "min_order_quantity" integer,
    "is_primary" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."product_supplier_mapping" OWNER TO "postgres";


COMMENT ON TABLE "public"."product_supplier_mapping" IS 'Maps internal products to supplier product codes for AI OCR matching';



COMMENT ON COLUMN "public"."product_supplier_mapping"."supplier_product_code" IS 'Supplier-specific SKU/product code for this product';



COMMENT ON COLUMN "public"."product_supplier_mapping"."supplier_product_name" IS 'Product name used by supplier';



COMMENT ON COLUMN "public"."product_supplier_mapping"."lead_time_days" IS 'Expected delivery time in days';



CREATE SEQUENCE IF NOT EXISTS "public"."product_supplier_mapping_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."product_supplier_mapping_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."product_supplier_mapping_id_seq" OWNED BY "public"."product_supplier_mapping"."id";



ALTER TABLE "public"."products" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."products_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."warehouses" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text",
    "is_b2b_warehouse" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."warehouses" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."products_with_inventory" AS
 SELECT "id",
    "created_at",
    "name",
    "cost_price",
    "retail_price",
    "sku",
    "product_type",
    "is_fixed_asset",
    "barcode",
    "category",
    "tags",
    "manufacturer",
    "distributor",
    "registration_number",
    "packaging",
    "description",
    "hdsd_0_2",
    "hdsd_2_6",
    "hdsd_6_18",
    "hdsd_over_18",
    "disease",
    "is_chronic",
    "wholesale_unit",
    "retail_unit",
    "conversion_rate",
    "invoice_price",
    "wholesale_profit",
    "retail_profit",
    "wholesale_price",
    "is_active",
    "image_url",
    "supplier_id",
    ( SELECT "jsonb_agg"("json_build_object"('warehouse_name', "w"."name", 'quantity', "i"."quantity", 'warehouse_id', "w"."id", 'min_stock', "i"."min_stock", 'max_stock', "i"."max_stock")) AS "jsonb_agg"
           FROM ("public"."inventory" "i"
             JOIN "public"."warehouses" "w" ON (("i"."warehouse_id" = "w"."id")))
          WHERE ("i"."product_id" = "p"."id")) AS "inventory_data"
   FROM "public"."products" "p";


ALTER VIEW "public"."products_with_inventory" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "full_name" "text",
    "avatar_url" "text",
    "phone" "text",
    "date_of_birth" "date",
    "gender" "text",
    "address" "text",
    "citizen_id" "text",
    "emergency_contact" "text",
    "employee_status" "text" DEFAULT 'Chờ duyệt'::"text",
    "start_date" "date",
    "end_date" "date",
    "manager_id" "uuid",
    "contract_number" "text",
    "bank_name" "text",
    "bank_account_number" "text",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "self_introduction" "text",
    "hobbies" "text",
    "personal_boundaries" "text",
    "marital_status" "text",
    "citizen_id_issue_date" "date",
    "citizen_id_front_url" "text",
    "citizen_id_back_url" "text",
    "education_level" "text",
    "major" "text",
    "strengths" "text",
    "allergies" "text",
    "push_subscription" "jsonb"
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."promotions" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" character varying NOT NULL,
    "description" "text",
    "type" "public"."promotion_type" NOT NULL,
    "value" numeric NOT NULL,
    "start_date" timestamp with time zone NOT NULL,
    "end_date" timestamp with time zone NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "conditions" "jsonb"
);


ALTER TABLE "public"."promotions" OWNER TO "postgres";


ALTER TABLE "public"."promotions" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."promotions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."purchase_order_items" (
    "id" bigint NOT NULL,
    "po_id" bigint NOT NULL,
    "product_id" bigint NOT NULL,
    "quantity" integer NOT NULL,
    "cost_price" numeric,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "invoiced_quantity" integer,
    "received_quantity" integer,
    "lot_id" integer
);


ALTER TABLE "public"."purchase_order_items" OWNER TO "postgres";


COMMENT ON TABLE "public"."purchase_order_items" IS 'Line items in purchase orders';



COMMENT ON COLUMN "public"."purchase_order_items"."received_quantity" IS 'Quantity actually received';



ALTER TABLE "public"."purchase_order_items" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."purchase_order_items_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."purchase_orders" (
    "id" bigint NOT NULL,
    "supplier_id" bigint,
    "status" "text" DEFAULT 'Nháp'::"text" NOT NULL,
    "notes" "text",
    "created_by" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "po_number" character varying(50) NOT NULL,
    "order_date" "date" DEFAULT CURRENT_DATE,
    "expected_delivery_date" "date",
    "total_amount" numeric(18,2) DEFAULT 0,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."purchase_orders" OWNER TO "postgres";


COMMENT ON COLUMN "public"."purchase_orders"."po_number" IS 'Unique purchase order number';



COMMENT ON COLUMN "public"."purchase_orders"."order_date" IS 'Date when order was created';



COMMENT ON COLUMN "public"."purchase_orders"."expected_delivery_date" IS 'Expected delivery date';



COMMENT ON COLUMN "public"."purchase_orders"."total_amount" IS 'Total order amount';



COMMENT ON COLUMN "public"."purchase_orders"."updated_at" IS 'Last update timestamp';



ALTER TABLE "public"."purchase_orders" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."purchase_orders_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."role_permissions" (
    "role_id" bigint NOT NULL,
    "permission_id" bigint NOT NULL
);


ALTER TABLE "public"."role_permissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."roles" (
    "id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."roles" OWNER TO "postgres";


ALTER TABLE "public"."roles" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."roles_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."rooms" (
    "room_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text",
    "room_type" character varying(50) NOT NULL,
    "capacity" integer,
    "equipment" "text"[] DEFAULT '{}'::"text"[],
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "rooms_capacity_check" CHECK (("capacity" > 0)),
    CONSTRAINT "rooms_room_type_check" CHECK ((("room_type")::"text" = ANY ((ARRAY['medical'::character varying, 'treatment'::character varying, 'consultation'::character varying, 'diagnostic'::character varying, 'other'::character varying])::"text"[])))
);


ALTER TABLE "public"."rooms" OWNER TO "postgres";


COMMENT ON TABLE "public"."rooms" IS 'Medical rooms and facilities management';



COMMENT ON COLUMN "public"."rooms"."room_id" IS 'Unique identifier for the room';



COMMENT ON COLUMN "public"."rooms"."name" IS 'Room name (must be unique)';



COMMENT ON COLUMN "public"."rooms"."description" IS 'Optional room description';



COMMENT ON COLUMN "public"."rooms"."room_type" IS 'Type of room: medical, treatment, consultation, diagnostic, or other';



COMMENT ON COLUMN "public"."rooms"."capacity" IS 'Maximum number of people the room can accommodate';



COMMENT ON COLUMN "public"."rooms"."equipment" IS 'Array of equipment available in the room';



COMMENT ON COLUMN "public"."rooms"."is_active" IS 'Whether the room is currently active/available';



COMMENT ON COLUMN "public"."rooms"."created_at" IS 'Timestamp when room was created';



COMMENT ON COLUMN "public"."rooms"."updated_at" IS 'Timestamp when room was last updated';



CREATE TABLE IF NOT EXISTS "public"."sales_combo_items" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "combo_id" bigint NOT NULL,
    "product_id" integer NOT NULL,
    "quantity" integer NOT NULL,
    "unit_price" numeric(18,2) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "sales_combo_items_quantity_check" CHECK (("quantity" > 0)),
    CONSTRAINT "sales_combo_items_unit_price_check" CHECK (("unit_price" >= (0)::numeric))
);


ALTER TABLE "public"."sales_combo_items" OWNER TO "postgres";


COMMENT ON TABLE "public"."sales_combo_items" IS 'Tracks individual products sold as part of combos in sales orders';



COMMENT ON COLUMN "public"."sales_combo_items"."id" IS 'Unique identifier for the sales combo item';



COMMENT ON COLUMN "public"."sales_combo_items"."order_id" IS 'Reference to the sales order';



COMMENT ON COLUMN "public"."sales_combo_items"."combo_id" IS 'Reference to the combo that was sold';



COMMENT ON COLUMN "public"."sales_combo_items"."product_id" IS 'Reference to the product that was part of the combo';



COMMENT ON COLUMN "public"."sales_combo_items"."quantity" IS 'Quantity of this product sold as part of the combo';



COMMENT ON COLUMN "public"."sales_combo_items"."unit_price" IS 'Price allocated to this product from the combo price';



CREATE TABLE IF NOT EXISTS "public"."sales_order_items" (
    "item_id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "quantity" integer NOT NULL,
    "unit_price" numeric(18,2),
    "is_service" boolean DEFAULT false,
    "dosage_printed" "text",
    "product_id" bigint
);


ALTER TABLE "public"."sales_order_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sales_order_product_lot_items" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "quantity" bigint DEFAULT '0'::bigint,
    "order_id" "uuid",
    "lot_id" integer
);


ALTER TABLE "public"."sales_order_product_lot_items" OWNER TO "postgres";


ALTER TABLE "public"."sales_order_product_lot_items" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."sales_order_product_lot_item_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."sales_orders" (
    "order_id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "patient_id" "uuid",
    "medical_visit_id" "uuid",
    "order_type" character varying(20) NOT NULL,
    "created_by_employee_id" "uuid",
    "order_datetime" timestamp with time zone DEFAULT "now"(),
    "total_value" numeric(18,2) NOT NULL,
    "payment_method" character varying(50),
    "payment_status" character varying(20),
    "operational_status" character varying(20) NOT NULL,
    "is_ai_checked" boolean DEFAULT false
);


ALTER TABLE "public"."sales_orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."supplier_promotions" (
    "id" bigint NOT NULL,
    "supplier_id" bigint NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text",
    "promotion_type" character varying(50) NOT NULL,
    "promotion_config" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date",
    "applies_to_all_products" boolean DEFAULT true,
    "product_ids" bigint[],
    "min_order_quantity" integer DEFAULT 0,
    "min_order_value" numeric(15,2) DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "priority" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "internal_notes" "text",
    CONSTRAINT "supplier_promotions_promotion_type_check" CHECK ((("promotion_type")::"text" = ANY ((ARRAY['buy_x_get_y'::character varying, 'percentage_discount'::character varying, 'fixed_discount'::character varying, 'post_payment_discount'::character varying])::"text"[])))
);


ALTER TABLE "public"."supplier_promotions" OWNER TO "postgres";


COMMENT ON TABLE "public"."supplier_promotions" IS 'Manages promotional programs and discounts from suppliers';



COMMENT ON COLUMN "public"."supplier_promotions"."promotion_type" IS 'Type of promotion: buy_x_get_y, percentage_discount, fixed_discount, post_payment_discount';



COMMENT ON COLUMN "public"."supplier_promotions"."promotion_config" IS 'JSON configuration specific to promotion type';



COMMENT ON COLUMN "public"."supplier_promotions"."applies_to_all_products" IS 'If true, applies to all products from supplier';



COMMENT ON COLUMN "public"."supplier_promotions"."product_ids" IS 'Array of product IDs if promotion applies to specific products only';



COMMENT ON COLUMN "public"."supplier_promotions"."priority" IS 'Higher priority promotions are applied first when stacking';



CREATE SEQUENCE IF NOT EXISTS "public"."supplier_promotions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."supplier_promotions_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."supplier_promotions_id_seq" OWNED BY "public"."supplier_promotions"."id";



CREATE TABLE IF NOT EXISTS "public"."suppliers" (
    "id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "contact_person" "text",
    "phone" "text",
    "email" "text",
    "address" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "code" "text",
    "tax_code" "text",
    "payment_terms" "text",
    "notes" "text",
    "is_active" boolean DEFAULT true,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."suppliers" OWNER TO "postgres";


COMMENT ON COLUMN "public"."suppliers"."code" IS 'Internal supplier code';



COMMENT ON COLUMN "public"."suppliers"."tax_code" IS 'Tax identification number';



COMMENT ON COLUMN "public"."suppliers"."payment_terms" IS 'Payment terms and conditions';



ALTER TABLE "public"."suppliers" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."suppliers_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."system_settings" (
    "key" "text" NOT NULL,
    "value" "jsonb",
    "description" "text",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."system_settings" OWNER TO "postgres";


ALTER TABLE "public"."transactions" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."transactions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "user_id" "uuid" NOT NULL,
    "role_id" bigint NOT NULL
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vat_invoice_items" (
    "id" integer NOT NULL,
    "vat_invoice_id" integer NOT NULL,
    "product_id" integer NOT NULL,
    "lot_id" integer,
    "quantity" integer NOT NULL,
    "unit_price" numeric(18,2) NOT NULL,
    "discount_percent" numeric(5,2) DEFAULT 0,
    "discount_amount" numeric(18,2) DEFAULT 0,
    "promotion_type" character varying(100),
    "subtotal" numeric(18,2) NOT NULL,
    "vat_rate" numeric(5,2) DEFAULT 10,
    "vat_amount" numeric(18,2) NOT NULL,
    "total_with_vat" numeric(18,2) NOT NULL,
    "lot_number" character varying(100),
    "expiry_date" "date",
    "supplier_product_code" character varying(100),
    "supplier_product_name" character varying(255),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "vat_invoice_items_quantity_check" CHECK (("quantity" > 0)),
    CONSTRAINT "vat_invoice_items_unit_price_check" CHECK (("unit_price" >= (0)::numeric))
);


ALTER TABLE "public"."vat_invoice_items" OWNER TO "postgres";


COMMENT ON TABLE "public"."vat_invoice_items" IS 'Line items in VAT invoices with lot tracking';



CREATE SEQUENCE IF NOT EXISTS "public"."vat_invoice_items_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."vat_invoice_items_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."vat_invoice_items_id_seq" OWNED BY "public"."vat_invoice_items"."id";



CREATE TABLE IF NOT EXISTS "public"."vat_invoices" (
    "id" integer NOT NULL,
    "invoice_number" character varying(100) NOT NULL,
    "invoice_series" character varying(50),
    "invoice_symbol" character varying(50),
    "invoice_type" character varying(20) NOT NULL,
    "invoice_date" "date" NOT NULL,
    "supplier_id" integer,
    "customer_id" "uuid",
    "subtotal" numeric(18,2) NOT NULL,
    "vat_rate" numeric(5,2) DEFAULT 10,
    "vat_amount" numeric(18,2) NOT NULL,
    "total_with_vat" numeric(18,2) NOT NULL,
    "discount_amount" numeric(18,2) DEFAULT 0,
    "pdf_url" "text",
    "pdf_uploaded_at" timestamp with time zone,
    "original_filename" character varying(255),
    "ocr_status" character varying(50) DEFAULT 'pending'::character varying,
    "ocr_data" "jsonb",
    "ocr_confidence" numeric(5,2),
    "ocr_processed_at" timestamp with time zone,
    "ocr_error" "text",
    "reconciliation_status" character varying(50) DEFAULT 'pending'::character varying,
    "discrepancy_notes" "text",
    "payment_status" character varying(50) DEFAULT 'unpaid'::character varying,
    "payment_due_date" "date",
    "payment_date" "date",
    "notes" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "vat_invoices_invoice_type_check" CHECK ((("invoice_type")::"text" = ANY ((ARRAY['purchase'::character varying, 'sales'::character varying])::"text"[]))),
    CONSTRAINT "vat_invoices_ocr_status_check" CHECK ((("ocr_status")::"text" = ANY ((ARRAY['pending'::character varying, 'processing'::character varying, 'completed'::character varying, 'failed'::character varying, 'manual'::character varying])::"text"[]))),
    CONSTRAINT "vat_invoices_payment_status_check" CHECK ((("payment_status")::"text" = ANY ((ARRAY['unpaid'::character varying, 'partial'::character varying, 'paid'::character varying, 'overdue'::character varying])::"text"[]))),
    CONSTRAINT "vat_invoices_reconciliation_status_check" CHECK ((("reconciliation_status")::"text" = ANY ((ARRAY['pending'::character varying, 'matched'::character varying, 'partial'::character varying, 'discrepancy'::character varying, 'resolved'::character varying])::"text"[]))),
    CONSTRAINT "vat_invoices_subtotal_check" CHECK (("subtotal" >= (0)::numeric)),
    CONSTRAINT "vat_invoices_total_with_vat_check" CHECK (("total_with_vat" >= (0)::numeric)),
    CONSTRAINT "vat_invoices_vat_amount_check" CHECK (("vat_amount" >= (0)::numeric))
);


ALTER TABLE "public"."vat_invoices" OWNER TO "postgres";


COMMENT ON TABLE "public"."vat_invoices" IS 'VAT invoice management with OCR and reconciliation (NÚT 2, NÚT 4)';



COMMENT ON COLUMN "public"."vat_invoices"."ocr_data" IS 'AI/OCR extracted data: lot numbers, expiry dates, quantities';



CREATE SEQUENCE IF NOT EXISTS "public"."vat_invoices_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."vat_invoices_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."vat_invoices_id_seq" OWNED BY "public"."vat_invoices"."id";



CREATE TABLE IF NOT EXISTS "public"."vat_warehouse" (
    "id" integer NOT NULL,
    "product_id" integer NOT NULL,
    "lot_id" integer NOT NULL,
    "purchase_vat_invoice_id" integer NOT NULL,
    "quantity_in" integer DEFAULT 0 NOT NULL,
    "quantity_sold" integer DEFAULT 0 NOT NULL,
    "quantity_available" integer GENERATED ALWAYS AS (("quantity_in" - "quantity_sold")) STORED,
    "sales_vat_invoices" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "vat_warehouse_quantity_in_check" CHECK (("quantity_in" >= 0)),
    CONSTRAINT "vat_warehouse_quantity_sold_check" CHECK (("quantity_sold" >= 0))
);


ALTER TABLE "public"."vat_warehouse" OWNER TO "postgres";


COMMENT ON TABLE "public"."vat_warehouse" IS 'Virtual warehouse for VAT invoice tracking (NÚT 4)';



COMMENT ON COLUMN "public"."vat_warehouse"."sales_vat_invoices" IS 'Array of linked sales VAT invoices';



CREATE SEQUENCE IF NOT EXISTS "public"."vat_warehouse_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."vat_warehouse_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."vat_warehouse_id_seq" OWNED BY "public"."vat_warehouse"."id";



CREATE TABLE IF NOT EXISTS "public"."vouchers" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "code" character varying NOT NULL,
    "promotion_id" bigint NOT NULL,
    "usage_limit" integer DEFAULT 1 NOT NULL,
    "times_used" integer DEFAULT 0 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL
);


ALTER TABLE "public"."vouchers" OWNER TO "postgres";


ALTER TABLE "public"."vouchers" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."vouchers_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE "public"."warehouses" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."warehouses_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "storage"."buckets" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "owner" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "public" boolean DEFAULT false,
    "avif_autodetection" boolean DEFAULT false,
    "file_size_limit" bigint,
    "allowed_mime_types" "text"[],
    "owner_id" "text",
    "type" "storage"."buckettype" DEFAULT 'STANDARD'::"storage"."buckettype" NOT NULL
);


ALTER TABLE "storage"."buckets" OWNER TO "supabase_storage_admin";


COMMENT ON COLUMN "storage"."buckets"."owner" IS 'Field is deprecated, use owner_id instead';



CREATE TABLE IF NOT EXISTS "storage"."buckets_analytics" (
    "id" "text" NOT NULL,
    "type" "storage"."buckettype" DEFAULT 'ANALYTICS'::"storage"."buckettype" NOT NULL,
    "format" "text" DEFAULT 'ICEBERG'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "storage"."buckets_analytics" OWNER TO "supabase_storage_admin";


CREATE TABLE IF NOT EXISTS "storage"."migrations" (
    "id" integer NOT NULL,
    "name" character varying(100) NOT NULL,
    "hash" character varying(40) NOT NULL,
    "executed_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "storage"."migrations" OWNER TO "supabase_storage_admin";


CREATE TABLE IF NOT EXISTS "storage"."objects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "bucket_id" "text",
    "name" "text",
    "owner" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "last_accessed_at" timestamp with time zone DEFAULT "now"(),
    "metadata" "jsonb",
    "path_tokens" "text"[] GENERATED ALWAYS AS ("string_to_array"("name", '/'::"text")) STORED,
    "version" "text",
    "owner_id" "text",
    "user_metadata" "jsonb",
    "level" integer
);


ALTER TABLE "storage"."objects" OWNER TO "supabase_storage_admin";


COMMENT ON COLUMN "storage"."objects"."owner" IS 'Field is deprecated, use owner_id instead';



CREATE TABLE IF NOT EXISTS "storage"."prefixes" (
    "bucket_id" "text" NOT NULL,
    "name" "text" NOT NULL COLLATE "pg_catalog"."C",
    "level" integer GENERATED ALWAYS AS ("storage"."get_level"("name")) STORED NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "storage"."prefixes" OWNER TO "supabase_storage_admin";


CREATE TABLE IF NOT EXISTS "storage"."s3_multipart_uploads" (
    "id" "text" NOT NULL,
    "in_progress_size" bigint DEFAULT 0 NOT NULL,
    "upload_signature" "text" NOT NULL,
    "bucket_id" "text" NOT NULL,
    "key" "text" NOT NULL COLLATE "pg_catalog"."C",
    "version" "text" NOT NULL,
    "owner_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_metadata" "jsonb"
);


ALTER TABLE "storage"."s3_multipart_uploads" OWNER TO "supabase_storage_admin";


CREATE TABLE IF NOT EXISTS "storage"."s3_multipart_uploads_parts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "upload_id" "text" NOT NULL,
    "size" bigint DEFAULT 0 NOT NULL,
    "part_number" integer NOT NULL,
    "bucket_id" "text" NOT NULL,
    "key" "text" NOT NULL COLLATE "pg_catalog"."C",
    "etag" "text" NOT NULL,
    "owner_id" "text",
    "version" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "storage"."s3_multipart_uploads_parts" OWNER TO "supabase_storage_admin";


ALTER TABLE ONLY "auth"."refresh_tokens" ALTER COLUMN "id" SET DEFAULT "nextval"('"auth"."refresh_tokens_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."barcode_verifications" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."barcode_verifications_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."combo_items" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."combo_items_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."combos" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."combos_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."lot_movements" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."lot_movements_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."notifications" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."notifications_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."post_reactions" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."post_reactions_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."post_views" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."post_views_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."product_lots" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."product_lots_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."product_supplier_mapping" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."product_supplier_mapping_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."supplier_promotions" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."supplier_promotions_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."vat_invoice_items" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."vat_invoice_items_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."vat_invoices" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."vat_invoices_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."vat_warehouse" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."vat_warehouse_id_seq"'::"regclass");



ALTER TABLE ONLY "auth"."mfa_amr_claims"
    ADD CONSTRAINT "amr_id_pk" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."audit_log_entries"
    ADD CONSTRAINT "audit_log_entries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."flow_state"
    ADD CONSTRAINT "flow_state_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."identities"
    ADD CONSTRAINT "identities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."identities"
    ADD CONSTRAINT "identities_provider_id_provider_unique" UNIQUE ("provider_id", "provider");



ALTER TABLE ONLY "auth"."instances"
    ADD CONSTRAINT "instances_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."mfa_amr_claims"
    ADD CONSTRAINT "mfa_amr_claims_session_id_authentication_method_pkey" UNIQUE ("session_id", "authentication_method");



ALTER TABLE ONLY "auth"."mfa_challenges"
    ADD CONSTRAINT "mfa_challenges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."mfa_factors"
    ADD CONSTRAINT "mfa_factors_last_challenged_at_key" UNIQUE ("last_challenged_at");



ALTER TABLE ONLY "auth"."mfa_factors"
    ADD CONSTRAINT "mfa_factors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."oauth_authorizations"
    ADD CONSTRAINT "oauth_authorizations_authorization_code_key" UNIQUE ("authorization_code");



ALTER TABLE ONLY "auth"."oauth_authorizations"
    ADD CONSTRAINT "oauth_authorizations_authorization_id_key" UNIQUE ("authorization_id");



ALTER TABLE ONLY "auth"."oauth_authorizations"
    ADD CONSTRAINT "oauth_authorizations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."oauth_clients"
    ADD CONSTRAINT "oauth_clients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."oauth_consents"
    ADD CONSTRAINT "oauth_consents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."oauth_consents"
    ADD CONSTRAINT "oauth_consents_user_client_unique" UNIQUE ("user_id", "client_id");



ALTER TABLE ONLY "auth"."one_time_tokens"
    ADD CONSTRAINT "one_time_tokens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."refresh_tokens"
    ADD CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."refresh_tokens"
    ADD CONSTRAINT "refresh_tokens_token_unique" UNIQUE ("token");



ALTER TABLE ONLY "auth"."saml_providers"
    ADD CONSTRAINT "saml_providers_entity_id_key" UNIQUE ("entity_id");



ALTER TABLE ONLY "auth"."saml_providers"
    ADD CONSTRAINT "saml_providers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."saml_relay_states"
    ADD CONSTRAINT "saml_relay_states_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."schema_migrations"
    ADD CONSTRAINT "schema_migrations_pkey" PRIMARY KEY ("version");



ALTER TABLE ONLY "auth"."sessions"
    ADD CONSTRAINT "sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."sso_domains"
    ADD CONSTRAINT "sso_domains_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."sso_providers"
    ADD CONSTRAINT "sso_providers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."users"
    ADD CONSTRAINT "users_phone_key" UNIQUE ("phone");



ALTER TABLE ONLY "auth"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."appointment_statuses"
    ADD CONSTRAINT "appointment_statuses_pkey" PRIMARY KEY ("status_code");



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_pkey" PRIMARY KEY ("appointment_id");



ALTER TABLE ONLY "public"."b2b_customers"
    ADD CONSTRAINT "b2b_customers_customer_code_key" UNIQUE ("customer_code");



ALTER TABLE ONLY "public"."b2b_customers"
    ADD CONSTRAINT "b2b_customers_pkey" PRIMARY KEY ("customer_id");



ALTER TABLE ONLY "public"."b2b_quote_items"
    ADD CONSTRAINT "b2b_quote_items_pkey" PRIMARY KEY ("item_id");



ALTER TABLE ONLY "public"."b2b_quotes"
    ADD CONSTRAINT "b2b_quotes_pkey" PRIMARY KEY ("quote_id");



ALTER TABLE ONLY "public"."b2b_quotes"
    ADD CONSTRAINT "b2b_quotes_quote_number_key" UNIQUE ("quote_number");



ALTER TABLE ONLY "public"."banks"
    ADD CONSTRAINT "banks_bin_key" UNIQUE ("bin");



ALTER TABLE ONLY "public"."banks"
    ADD CONSTRAINT "banks_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."banks"
    ADD CONSTRAINT "banks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."barcode_verifications"
    ADD CONSTRAINT "barcode_verifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."combo_items"
    ADD CONSTRAINT "combo_items_combo_id_product_id_key" UNIQUE ("combo_id", "product_id");



ALTER TABLE ONLY "public"."combo_items"
    ADD CONSTRAINT "combo_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."combos"
    ADD CONSTRAINT "combos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_employee_code_key" UNIQUE ("employee_code");



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_pkey" PRIMARY KEY ("employee_id");



ALTER TABLE ONLY "public"."funds"
    ADD CONSTRAINT "funds_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."internal_fund_transfers"
    ADD CONSTRAINT "internal_fund_transfers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inventory"
    ADD CONSTRAINT "inventory_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lab_orders"
    ADD CONSTRAINT "lab_orders_pkey" PRIMARY KEY ("order_id");



ALTER TABLE ONLY "public"."lot_movements"
    ADD CONSTRAINT "lot_movements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."medical_visits"
    ADD CONSTRAINT "medical_visits_appointment_id_key" UNIQUE ("appointment_id");



ALTER TABLE ONLY "public"."medical_visits"
    ADD CONSTRAINT "medical_visits_pkey" PRIMARY KEY ("visit_id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."patient_points_history"
    ADD CONSTRAINT "patient_points_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."patients"
    ADD CONSTRAINT "patients_phone_number_key" UNIQUE ("phone_number");



ALTER TABLE ONLY "public"."patients"
    ADD CONSTRAINT "patients_pkey" PRIMARY KEY ("patient_id");



ALTER TABLE ONLY "public"."permissions"
    ADD CONSTRAINT "permissions_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."permissions"
    ADD CONSTRAINT "permissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."post_reactions"
    ADD CONSTRAINT "post_reactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."post_reactions"
    ADD CONSTRAINT "post_reactions_user_id_post_id_key" UNIQUE ("user_id", "post_id");



ALTER TABLE ONLY "public"."post_views"
    ADD CONSTRAINT "post_views_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."post_views"
    ADD CONSTRAINT "post_views_post_id_user_id_key" UNIQUE ("post_id", "user_id");



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."prescriptions"
    ADD CONSTRAINT "prescriptions_pkey" PRIMARY KEY ("prescription_item_id");



ALTER TABLE ONLY "public"."product_lots"
    ADD CONSTRAINT "product_lots_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_supplier_mapping"
    ADD CONSTRAINT "product_supplier_mapping_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_supplier_mapping"
    ADD CONSTRAINT "product_supplier_mapping_product_id_supplier_id_key" UNIQUE ("product_id", "supplier_id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_sku_key" UNIQUE ("sku");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_citizen_id_key" UNIQUE ("citizen_id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_phone_key" UNIQUE ("phone");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."promotions"
    ADD CONSTRAINT "promotions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."purchase_order_items"
    ADD CONSTRAINT "purchase_order_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."purchase_orders"
    ADD CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."purchase_orders"
    ADD CONSTRAINT "purchase_orders_po_number_key" UNIQUE ("po_number");



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id", "permission_id");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rooms"
    ADD CONSTRAINT "rooms_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."rooms"
    ADD CONSTRAINT "rooms_pkey" PRIMARY KEY ("room_id");



ALTER TABLE ONLY "public"."sales_combo_items"
    ADD CONSTRAINT "sales_combo_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sales_order_items"
    ADD CONSTRAINT "sales_order_items_pkey" PRIMARY KEY ("item_id");



ALTER TABLE ONLY "public"."sales_order_product_lot_items"
    ADD CONSTRAINT "sales_order_product_lot_item_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sales_orders"
    ADD CONSTRAINT "sales_orders_medical_visit_id_key" UNIQUE ("medical_visit_id");



ALTER TABLE ONLY "public"."sales_orders"
    ADD CONSTRAINT "sales_orders_pkey" PRIMARY KEY ("order_id");



ALTER TABLE ONLY "public"."supplier_promotions"
    ADD CONSTRAINT "supplier_promotions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."suppliers"
    ADD CONSTRAINT "suppliers_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."suppliers"
    ADD CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."system_settings"
    ADD CONSTRAINT "system_settings_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id", "role_id");



ALTER TABLE ONLY "public"."vat_invoice_items"
    ADD CONSTRAINT "vat_invoice_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vat_invoices"
    ADD CONSTRAINT "vat_invoices_invoice_number_key" UNIQUE ("invoice_number");



ALTER TABLE ONLY "public"."vat_invoices"
    ADD CONSTRAINT "vat_invoices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vat_warehouse"
    ADD CONSTRAINT "vat_warehouse_lot_id_purchase_vat_invoice_id_key" UNIQUE ("lot_id", "purchase_vat_invoice_id");



ALTER TABLE ONLY "public"."vat_warehouse"
    ADD CONSTRAINT "vat_warehouse_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vouchers"
    ADD CONSTRAINT "vouchers_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."vouchers"
    ADD CONSTRAINT "vouchers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."warehouses"
    ADD CONSTRAINT "warehouses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "storage"."buckets_analytics"
    ADD CONSTRAINT "buckets_analytics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "storage"."buckets"
    ADD CONSTRAINT "buckets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "storage"."migrations"
    ADD CONSTRAINT "migrations_name_key" UNIQUE ("name");



ALTER TABLE ONLY "storage"."migrations"
    ADD CONSTRAINT "migrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "storage"."objects"
    ADD CONSTRAINT "objects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "storage"."prefixes"
    ADD CONSTRAINT "prefixes_pkey" PRIMARY KEY ("bucket_id", "level", "name");



ALTER TABLE ONLY "storage"."s3_multipart_uploads_parts"
    ADD CONSTRAINT "s3_multipart_uploads_parts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "storage"."s3_multipart_uploads"
    ADD CONSTRAINT "s3_multipart_uploads_pkey" PRIMARY KEY ("id");



CREATE INDEX "audit_logs_instance_id_idx" ON "auth"."audit_log_entries" USING "btree" ("instance_id");



CREATE UNIQUE INDEX "confirmation_token_idx" ON "auth"."users" USING "btree" ("confirmation_token") WHERE (("confirmation_token")::"text" !~ '^[0-9 ]*$'::"text");



CREATE UNIQUE INDEX "email_change_token_current_idx" ON "auth"."users" USING "btree" ("email_change_token_current") WHERE (("email_change_token_current")::"text" !~ '^[0-9 ]*$'::"text");



CREATE UNIQUE INDEX "email_change_token_new_idx" ON "auth"."users" USING "btree" ("email_change_token_new") WHERE (("email_change_token_new")::"text" !~ '^[0-9 ]*$'::"text");



CREATE INDEX "factor_id_created_at_idx" ON "auth"."mfa_factors" USING "btree" ("user_id", "created_at");



CREATE INDEX "flow_state_created_at_idx" ON "auth"."flow_state" USING "btree" ("created_at" DESC);



CREATE INDEX "identities_email_idx" ON "auth"."identities" USING "btree" ("email" "text_pattern_ops");



COMMENT ON INDEX "auth"."identities_email_idx" IS 'Auth: Ensures indexed queries on the email column';



CREATE INDEX "identities_user_id_idx" ON "auth"."identities" USING "btree" ("user_id");



CREATE INDEX "idx_auth_code" ON "auth"."flow_state" USING "btree" ("auth_code");



CREATE INDEX "idx_user_id_auth_method" ON "auth"."flow_state" USING "btree" ("user_id", "authentication_method");



CREATE INDEX "mfa_challenge_created_at_idx" ON "auth"."mfa_challenges" USING "btree" ("created_at" DESC);



CREATE UNIQUE INDEX "mfa_factors_user_friendly_name_unique" ON "auth"."mfa_factors" USING "btree" ("friendly_name", "user_id") WHERE (TRIM(BOTH FROM "friendly_name") <> ''::"text");



CREATE INDEX "mfa_factors_user_id_idx" ON "auth"."mfa_factors" USING "btree" ("user_id");



CREATE INDEX "oauth_auth_pending_exp_idx" ON "auth"."oauth_authorizations" USING "btree" ("expires_at") WHERE ("status" = 'pending'::"auth"."oauth_authorization_status");



CREATE INDEX "oauth_clients_deleted_at_idx" ON "auth"."oauth_clients" USING "btree" ("deleted_at");



CREATE INDEX "oauth_consents_active_client_idx" ON "auth"."oauth_consents" USING "btree" ("client_id") WHERE ("revoked_at" IS NULL);



CREATE INDEX "oauth_consents_active_user_client_idx" ON "auth"."oauth_consents" USING "btree" ("user_id", "client_id") WHERE ("revoked_at" IS NULL);



CREATE INDEX "oauth_consents_user_order_idx" ON "auth"."oauth_consents" USING "btree" ("user_id", "granted_at" DESC);



CREATE INDEX "one_time_tokens_relates_to_hash_idx" ON "auth"."one_time_tokens" USING "hash" ("relates_to");



CREATE INDEX "one_time_tokens_token_hash_hash_idx" ON "auth"."one_time_tokens" USING "hash" ("token_hash");



CREATE UNIQUE INDEX "one_time_tokens_user_id_token_type_key" ON "auth"."one_time_tokens" USING "btree" ("user_id", "token_type");



CREATE UNIQUE INDEX "reauthentication_token_idx" ON "auth"."users" USING "btree" ("reauthentication_token") WHERE (("reauthentication_token")::"text" !~ '^[0-9 ]*$'::"text");



CREATE UNIQUE INDEX "recovery_token_idx" ON "auth"."users" USING "btree" ("recovery_token") WHERE (("recovery_token")::"text" !~ '^[0-9 ]*$'::"text");



CREATE INDEX "refresh_tokens_instance_id_idx" ON "auth"."refresh_tokens" USING "btree" ("instance_id");



CREATE INDEX "refresh_tokens_instance_id_user_id_idx" ON "auth"."refresh_tokens" USING "btree" ("instance_id", "user_id");



CREATE INDEX "refresh_tokens_parent_idx" ON "auth"."refresh_tokens" USING "btree" ("parent");



CREATE INDEX "refresh_tokens_session_id_revoked_idx" ON "auth"."refresh_tokens" USING "btree" ("session_id", "revoked");



CREATE INDEX "refresh_tokens_updated_at_idx" ON "auth"."refresh_tokens" USING "btree" ("updated_at" DESC);



CREATE INDEX "saml_providers_sso_provider_id_idx" ON "auth"."saml_providers" USING "btree" ("sso_provider_id");



CREATE INDEX "saml_relay_states_created_at_idx" ON "auth"."saml_relay_states" USING "btree" ("created_at" DESC);



CREATE INDEX "saml_relay_states_for_email_idx" ON "auth"."saml_relay_states" USING "btree" ("for_email");



CREATE INDEX "saml_relay_states_sso_provider_id_idx" ON "auth"."saml_relay_states" USING "btree" ("sso_provider_id");



CREATE INDEX "sessions_not_after_idx" ON "auth"."sessions" USING "btree" ("not_after" DESC);



CREATE INDEX "sessions_oauth_client_id_idx" ON "auth"."sessions" USING "btree" ("oauth_client_id");



CREATE INDEX "sessions_user_id_idx" ON "auth"."sessions" USING "btree" ("user_id");



CREATE UNIQUE INDEX "sso_domains_domain_idx" ON "auth"."sso_domains" USING "btree" ("lower"("domain"));



CREATE INDEX "sso_domains_sso_provider_id_idx" ON "auth"."sso_domains" USING "btree" ("sso_provider_id");



CREATE UNIQUE INDEX "sso_providers_resource_id_idx" ON "auth"."sso_providers" USING "btree" ("lower"("resource_id"));



CREATE INDEX "sso_providers_resource_id_pattern_idx" ON "auth"."sso_providers" USING "btree" ("resource_id" "text_pattern_ops");



CREATE UNIQUE INDEX "unique_phone_factor_per_user" ON "auth"."mfa_factors" USING "btree" ("user_id", "phone");



CREATE INDEX "user_id_created_at_idx" ON "auth"."sessions" USING "btree" ("user_id", "created_at");



CREATE UNIQUE INDEX "users_email_partial_key" ON "auth"."users" USING "btree" ("email") WHERE ("is_sso_user" = false);



COMMENT ON INDEX "auth"."users_email_partial_key" IS 'Auth: A partial unique index that applies only when is_sso_user is false';



CREATE INDEX "users_instance_id_email_idx" ON "auth"."users" USING "btree" ("instance_id", "lower"(("email")::"text"));



CREATE INDEX "users_instance_id_idx" ON "auth"."users" USING "btree" ("instance_id");



CREATE INDEX "users_is_anonymous_idx" ON "auth"."users" USING "btree" ("is_anonymous");



CREATE INDEX "idx_appointments_room_date" ON "public"."appointments" USING "btree" ("room_id", "scheduled_datetime");



CREATE INDEX "idx_appointments_room_id" ON "public"."appointments" USING "btree" ("room_id");



CREATE INDEX "idx_b2b_customers_active" ON "public"."b2b_customers" USING "btree" ("is_active");



CREATE INDEX "idx_b2b_customers_code" ON "public"."b2b_customers" USING "btree" ("customer_code");



CREATE INDEX "idx_b2b_customers_name" ON "public"."b2b_customers" USING "btree" ("customer_name");



CREATE INDEX "idx_b2b_customers_type" ON "public"."b2b_customers" USING "btree" ("customer_type");



CREATE INDEX "idx_b2b_quote_items_product" ON "public"."b2b_quote_items" USING "btree" ("product_id");



CREATE INDEX "idx_b2b_quote_items_quote" ON "public"."b2b_quote_items" USING "btree" ("quote_id");



CREATE INDEX "idx_b2b_quotes_customer" ON "public"."b2b_quotes" USING "btree" ("customer_name");



CREATE INDEX "idx_b2b_quotes_date" ON "public"."b2b_quotes" USING "btree" ("quote_date");



CREATE INDEX "idx_b2b_quotes_delivery_employee" ON "public"."b2b_quotes" USING "btree" ("delivery_employee_id");



CREATE INDEX "idx_b2b_quotes_employee" ON "public"."b2b_quotes" USING "btree" ("created_by_employee_id");



CREATE INDEX "idx_b2b_quotes_number" ON "public"."b2b_quotes" USING "btree" ("quote_number");



CREATE INDEX "idx_b2b_quotes_stage" ON "public"."b2b_quotes" USING "btree" ("quote_stage");



CREATE INDEX "idx_b2b_quotes_valid_until" ON "public"."b2b_quotes" USING "btree" ("valid_until");



CREATE INDEX "idx_b2b_quotes_warehouse_employee" ON "public"."b2b_quotes" USING "btree" ("warehouse_employee_id");



CREATE INDEX "idx_barcode_verifications_barcode" ON "public"."barcode_verifications" USING "btree" ("barcode_scanned");



CREATE INDEX "idx_barcode_verifications_date" ON "public"."barcode_verifications" USING "btree" ("scanned_at" DESC);



CREATE INDEX "idx_barcode_verifications_lot" ON "public"."barcode_verifications" USING "btree" ("lot_id");



CREATE INDEX "idx_barcode_verifications_product" ON "public"."barcode_verifications" USING "btree" ("product_id");



CREATE INDEX "idx_combo_items_combo_id" ON "public"."combo_items" USING "btree" ("combo_id");



CREATE INDEX "idx_combo_items_product_id" ON "public"."combo_items" USING "btree" ("product_id");



CREATE INDEX "idx_combos_created_at" ON "public"."combos" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_combos_is_active" ON "public"."combos" USING "btree" ("is_active");



CREATE INDEX "idx_lot_movements_date" ON "public"."lot_movements" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_lot_movements_lot" ON "public"."lot_movements" USING "btree" ("lot_id");



CREATE INDEX "idx_lot_movements_order" ON "public"."lot_movements" USING "btree" ("order_id", "order_type");



CREATE INDEX "idx_lot_movements_type" ON "public"."lot_movements" USING "btree" ("movement_type");



CREATE INDEX "idx_notifications_created_at" ON "public"."notifications" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_notifications_employee_id" ON "public"."notifications" USING "btree" ("employee_id");



CREATE INDEX "idx_notifications_employee_type_date" ON "public"."notifications" USING "btree" ("employee_id", "notification_type", "created_at" DESC);



CREATE INDEX "idx_notifications_employee_unread" ON "public"."notifications" USING "btree" ("employee_id", "is_read") WHERE ("is_read" = false);



CREATE INDEX "idx_notifications_is_read" ON "public"."notifications" USING "btree" ("is_read");



CREATE INDEX "idx_notifications_metadata" ON "public"."notifications" USING "gin" ("metadata");



CREATE INDEX "idx_notifications_priority" ON "public"."notifications" USING "btree" ("priority");



CREATE INDEX "idx_notifications_type" ON "public"."notifications" USING "btree" ("notification_type");



CREATE INDEX "idx_patient_points_history_created_at" ON "public"."patient_points_history" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_patient_points_history_expires_at" ON "public"."patient_points_history" USING "btree" ("expires_at") WHERE ("expires_at" IS NOT NULL);



CREATE INDEX "idx_patient_points_history_patient_id" ON "public"."patient_points_history" USING "btree" ("patient_id");



CREATE INDEX "idx_patient_points_history_reference" ON "public"."patient_points_history" USING "btree" ("reference_type", "reference_id");



CREATE INDEX "idx_patient_points_history_transaction_type" ON "public"."patient_points_history" USING "btree" ("transaction_type");



CREATE INDEX "idx_product_lots_expiry_date" ON "public"."product_lots" USING "btree" ("expiry_date");



CREATE INDEX "idx_product_lots_lot_number" ON "public"."product_lots" USING "btree" ("lot_number");



CREATE INDEX "idx_product_lots_product_id" ON "public"."product_lots" USING "btree" ("product_id");



CREATE INDEX "idx_product_lots_product_warehouse" ON "public"."product_lots" USING "btree" ("product_id", "warehouse_id");



CREATE INDEX "idx_product_supplier_mapping_product_id" ON "public"."product_supplier_mapping" USING "btree" ("product_id");



CREATE INDEX "idx_product_supplier_mapping_supplier_code" ON "public"."product_supplier_mapping" USING "btree" ("supplier_product_code");



CREATE INDEX "idx_product_supplier_mapping_supplier_id" ON "public"."product_supplier_mapping" USING "btree" ("supplier_id");



CREATE INDEX "idx_products_enable_lot_management" ON "public"."products" USING "btree" ("enable_lot_management") WHERE ("enable_lot_management" = true);



CREATE INDEX "idx_products_supplier_id" ON "public"."products" USING "btree" ("supplier_id");



CREATE INDEX "idx_purchase_order_items_po_id" ON "public"."purchase_order_items" USING "btree" ("po_id");



CREATE INDEX "idx_purchase_order_items_product_id" ON "public"."purchase_order_items" USING "btree" ("product_id");



CREATE INDEX "idx_purchase_orders_order_date" ON "public"."purchase_orders" USING "btree" ("order_date" DESC);



CREATE INDEX "idx_purchase_orders_po_number" ON "public"."purchase_orders" USING "btree" ("po_number");



CREATE INDEX "idx_rooms_active" ON "public"."rooms" USING "btree" ("is_active");



CREATE INDEX "idx_rooms_name" ON "public"."rooms" USING "btree" ("name");



CREATE INDEX "idx_rooms_type" ON "public"."rooms" USING "btree" ("room_type");



CREATE INDEX "idx_rooms_type_active" ON "public"."rooms" USING "btree" ("room_type", "is_active");



CREATE INDEX "idx_sales_combo_items_combo_id" ON "public"."sales_combo_items" USING "btree" ("combo_id");



CREATE INDEX "idx_sales_combo_items_created_at" ON "public"."sales_combo_items" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_sales_combo_items_order_id" ON "public"."sales_combo_items" USING "btree" ("order_id");



CREATE INDEX "idx_sales_combo_items_product_id" ON "public"."sales_combo_items" USING "btree" ("product_id");



CREATE INDEX "idx_supplier_promotions_active" ON "public"."supplier_promotions" USING "btree" ("is_active");



CREATE INDEX "idx_supplier_promotions_dates" ON "public"."supplier_promotions" USING "btree" ("start_date", "end_date");



CREATE INDEX "idx_supplier_promotions_supplier_id" ON "public"."supplier_promotions" USING "btree" ("supplier_id");



CREATE INDEX "idx_supplier_promotions_type" ON "public"."supplier_promotions" USING "btree" ("promotion_type");



CREATE INDEX "idx_vat_invoice_items_invoice" ON "public"."vat_invoice_items" USING "btree" ("vat_invoice_id");



CREATE INDEX "idx_vat_invoice_items_lot" ON "public"."vat_invoice_items" USING "btree" ("lot_id");



CREATE INDEX "idx_vat_invoice_items_product" ON "public"."vat_invoice_items" USING "btree" ("product_id");



CREATE INDEX "idx_vat_invoices_customer" ON "public"."vat_invoices" USING "btree" ("customer_id");



CREATE INDEX "idx_vat_invoices_date" ON "public"."vat_invoices" USING "btree" ("invoice_date" DESC);



CREATE INDEX "idx_vat_invoices_number" ON "public"."vat_invoices" USING "btree" ("invoice_number");



CREATE INDEX "idx_vat_invoices_ocr_status" ON "public"."vat_invoices" USING "btree" ("ocr_status");



CREATE INDEX "idx_vat_invoices_supplier" ON "public"."vat_invoices" USING "btree" ("supplier_id");



CREATE INDEX "idx_vat_invoices_type" ON "public"."vat_invoices" USING "btree" ("invoice_type");



CREATE INDEX "idx_vat_warehouse_lot" ON "public"."vat_warehouse" USING "btree" ("lot_id");



CREATE INDEX "idx_vat_warehouse_product" ON "public"."vat_warehouse" USING "btree" ("product_id");



CREATE INDEX "idx_vat_warehouse_purchase_invoice" ON "public"."vat_warehouse" USING "btree" ("purchase_vat_invoice_id");



CREATE UNIQUE INDEX "inventory_product_id_warehouse_id_key" ON "public"."inventory" USING "btree" ("product_id", "warehouse_id");



CREATE INDEX "products_barcode_idx" ON "public"."products" USING "btree" ("barcode");



CREATE INDEX "products_name_idx" ON "public"."products" USING "btree" ("name");



CREATE INDEX "products_sku_idx" ON "public"."products" USING "btree" ("sku");



CREATE INDEX "vouchers_code_idx" ON "public"."vouchers" USING "btree" ("code");



CREATE UNIQUE INDEX "bname" ON "storage"."buckets" USING "btree" ("name");



CREATE UNIQUE INDEX "bucketid_objname" ON "storage"."objects" USING "btree" ("bucket_id", "name");



CREATE INDEX "idx_multipart_uploads_list" ON "storage"."s3_multipart_uploads" USING "btree" ("bucket_id", "key", "created_at");



CREATE UNIQUE INDEX "idx_name_bucket_level_unique" ON "storage"."objects" USING "btree" ("name" COLLATE "C", "bucket_id", "level");



CREATE INDEX "idx_objects_bucket_id_name" ON "storage"."objects" USING "btree" ("bucket_id", "name" COLLATE "C");



CREATE INDEX "idx_objects_lower_name" ON "storage"."objects" USING "btree" (("path_tokens"["level"]), "lower"("name") "text_pattern_ops", "bucket_id", "level");



CREATE INDEX "idx_prefixes_lower_name" ON "storage"."prefixes" USING "btree" ("bucket_id", "level", (("string_to_array"("name", '/'::"text"))["level"]), "lower"("name") "text_pattern_ops");



CREATE INDEX "name_prefix_search" ON "storage"."objects" USING "btree" ("name" "text_pattern_ops");



CREATE UNIQUE INDEX "objects_bucket_id_level_idx" ON "storage"."objects" USING "btree" ("bucket_id", "level", "name" COLLATE "C");



CREATE OR REPLACE TRIGGER "on_auth_user_created" AFTER INSERT ON "auth"."users" FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_user"();



CREATE OR REPLACE TRIGGER "calculate_b2b_quote_item_subtotal" BEFORE INSERT OR UPDATE ON "public"."b2b_quote_items" FOR EACH ROW EXECUTE FUNCTION "public"."calculate_line_item_subtotal"();



CREATE OR REPLACE TRIGGER "calculate_b2b_quote_totals_on_item_change" AFTER INSERT OR DELETE OR UPDATE ON "public"."b2b_quote_items" FOR EACH ROW EXECUTE FUNCTION "public"."calculate_quote_totals"();



CREATE OR REPLACE TRIGGER "calculate_b2b_quote_totals_on_quote_change" AFTER UPDATE OF "discount_percent", "tax_percent" ON "public"."b2b_quotes" FOR EACH ROW EXECUTE FUNCTION "public"."calculate_quote_totals"();



CREATE OR REPLACE TRIGGER "on_new_suggestion_for_moderation" AFTER INSERT ON "public"."posts" FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_suggestion_notification"();



CREATE OR REPLACE TRIGGER "trigger_log_patient_points_change" AFTER UPDATE ON "public"."patients" FOR EACH ROW EXECUTE FUNCTION "public"."log_patient_points_change"();



CREATE OR REPLACE TRIGGER "trigger_product_lots_updated_at" BEFORE UPDATE ON "public"."product_lots" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trigger_product_supplier_mapping_updated_at" BEFORE UPDATE ON "public"."product_supplier_mapping" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trigger_purchase_orders_updated_at" BEFORE UPDATE ON "public"."purchase_orders" FOR EACH ROW EXECUTE FUNCTION "public"."update_purchase_orders_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_suppliers_updated_at" BEFORE UPDATE ON "public"."suppliers" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trigger_update_combos_updated_at" BEFORE UPDATE ON "public"."combos" FOR EACH ROW EXECUTE FUNCTION "public"."update_combos_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_notifications_updated_at" BEFORE UPDATE ON "public"."notifications" FOR EACH ROW EXECUTE FUNCTION "public"."update_notifications_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_supplier_promotions_updated_at" BEFORE UPDATE ON "public"."supplier_promotions" FOR EACH ROW EXECUTE FUNCTION "public"."update_supplier_promotions_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_vat_invoices_updated_at" BEFORE UPDATE ON "public"."vat_invoices" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trigger_vat_warehouse_updated_at" BEFORE UPDATE ON "public"."vat_warehouse" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_b2b_customers_updated_at" BEFORE UPDATE ON "public"."b2b_customers" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_b2b_quotes_updated_at" BEFORE UPDATE ON "public"."b2b_quotes" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_rooms_updated_at" BEFORE UPDATE ON "public"."rooms" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "enforce_bucket_name_length_trigger" BEFORE INSERT OR UPDATE OF "name" ON "storage"."buckets" FOR EACH ROW EXECUTE FUNCTION "storage"."enforce_bucket_name_length"();



CREATE OR REPLACE TRIGGER "objects_delete_delete_prefix" AFTER DELETE ON "storage"."objects" FOR EACH ROW EXECUTE FUNCTION "storage"."delete_prefix_hierarchy_trigger"();



CREATE OR REPLACE TRIGGER "objects_insert_create_prefix" BEFORE INSERT ON "storage"."objects" FOR EACH ROW EXECUTE FUNCTION "storage"."objects_insert_prefix_trigger"();



CREATE OR REPLACE TRIGGER "objects_update_create_prefix" BEFORE UPDATE ON "storage"."objects" FOR EACH ROW WHEN ((("new"."name" <> "old"."name") OR ("new"."bucket_id" <> "old"."bucket_id"))) EXECUTE FUNCTION "storage"."objects_update_prefix_trigger"();



CREATE OR REPLACE TRIGGER "prefixes_create_hierarchy" BEFORE INSERT ON "storage"."prefixes" FOR EACH ROW WHEN (("pg_trigger_depth"() < 1)) EXECUTE FUNCTION "storage"."prefixes_insert_trigger"();



CREATE OR REPLACE TRIGGER "prefixes_delete_hierarchy" AFTER DELETE ON "storage"."prefixes" FOR EACH ROW EXECUTE FUNCTION "storage"."delete_prefix_hierarchy_trigger"();



CREATE OR REPLACE TRIGGER "update_objects_updated_at" BEFORE UPDATE ON "storage"."objects" FOR EACH ROW EXECUTE FUNCTION "storage"."update_updated_at_column"();



ALTER TABLE ONLY "auth"."identities"
    ADD CONSTRAINT "identities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."mfa_amr_claims"
    ADD CONSTRAINT "mfa_amr_claims_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "auth"."sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."mfa_challenges"
    ADD CONSTRAINT "mfa_challenges_auth_factor_id_fkey" FOREIGN KEY ("factor_id") REFERENCES "auth"."mfa_factors"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."mfa_factors"
    ADD CONSTRAINT "mfa_factors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."oauth_authorizations"
    ADD CONSTRAINT "oauth_authorizations_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "auth"."oauth_clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."oauth_authorizations"
    ADD CONSTRAINT "oauth_authorizations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."oauth_consents"
    ADD CONSTRAINT "oauth_consents_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "auth"."oauth_clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."oauth_consents"
    ADD CONSTRAINT "oauth_consents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."one_time_tokens"
    ADD CONSTRAINT "one_time_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."refresh_tokens"
    ADD CONSTRAINT "refresh_tokens_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "auth"."sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."saml_providers"
    ADD CONSTRAINT "saml_providers_sso_provider_id_fkey" FOREIGN KEY ("sso_provider_id") REFERENCES "auth"."sso_providers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."saml_relay_states"
    ADD CONSTRAINT "saml_relay_states_flow_state_id_fkey" FOREIGN KEY ("flow_state_id") REFERENCES "auth"."flow_state"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."saml_relay_states"
    ADD CONSTRAINT "saml_relay_states_sso_provider_id_fkey" FOREIGN KEY ("sso_provider_id") REFERENCES "auth"."sso_providers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."sessions"
    ADD CONSTRAINT "sessions_oauth_client_id_fkey" FOREIGN KEY ("oauth_client_id") REFERENCES "auth"."oauth_clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."sessions"
    ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."sso_domains"
    ADD CONSTRAINT "sso_domains_sso_provider_id_fkey" FOREIGN KEY ("sso_provider_id") REFERENCES "auth"."sso_providers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_current_status_fkey" FOREIGN KEY ("current_status") REFERENCES "public"."appointment_statuses"("status_code");



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "public"."employees"("employee_id");



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("patient_id");



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_receptionist_id_fkey" FOREIGN KEY ("receptionist_id") REFERENCES "public"."employees"("employee_id");



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("room_id");



ALTER TABLE ONLY "public"."b2b_quote_items"
    ADD CONSTRAINT "b2b_quote_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id");



ALTER TABLE ONLY "public"."b2b_quote_items"
    ADD CONSTRAINT "b2b_quote_items_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "public"."b2b_quotes"("quote_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."b2b_quotes"
    ADD CONSTRAINT "b2b_quotes_b2b_customer_id_fkey" FOREIGN KEY ("b2b_customer_id") REFERENCES "public"."b2b_customers"("customer_id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."b2b_quotes"
    ADD CONSTRAINT "b2b_quotes_created_by_employee_id_fkey" FOREIGN KEY ("created_by_employee_id") REFERENCES "public"."employees"("employee_id");



ALTER TABLE ONLY "public"."b2b_quotes"
    ADD CONSTRAINT "b2b_quotes_delivery_employee_id_fkey" FOREIGN KEY ("delivery_employee_id") REFERENCES "public"."employees"("employee_id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."b2b_quotes"
    ADD CONSTRAINT "b2b_quotes_warehouse_employee_id_fkey" FOREIGN KEY ("warehouse_employee_id") REFERENCES "public"."employees"("employee_id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."barcode_verifications"
    ADD CONSTRAINT "barcode_verifications_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "public"."product_lots"("id");



ALTER TABLE ONLY "public"."barcode_verifications"
    ADD CONSTRAINT "barcode_verifications_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id");



ALTER TABLE ONLY "public"."barcode_verifications"
    ADD CONSTRAINT "barcode_verifications_scanned_by_fkey" FOREIGN KEY ("scanned_by") REFERENCES "public"."employees"("employee_id");



ALTER TABLE ONLY "public"."barcode_verifications"
    ADD CONSTRAINT "barcode_verifications_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id");



ALTER TABLE ONLY "public"."combo_items"
    ADD CONSTRAINT "combo_items_combo_id_fkey" FOREIGN KEY ("combo_id") REFERENCES "public"."combos"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."combo_items"
    ADD CONSTRAINT "combo_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."patient_points_history"
    ADD CONSTRAINT "fk_created_by" FOREIGN KEY ("created_by") REFERENCES "public"."employees"("employee_id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."patient_points_history"
    ADD CONSTRAINT "fk_patient" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("patient_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."funds"
    ADD CONSTRAINT "funds_bank_id_fkey" FOREIGN KEY ("bank_id") REFERENCES "public"."banks"("id");



ALTER TABLE ONLY "public"."internal_fund_transfers"
    ADD CONSTRAINT "internal_fund_transfers_from_fund_id_fkey" FOREIGN KEY ("from_fund_id") REFERENCES "public"."funds"("id");



ALTER TABLE ONLY "public"."internal_fund_transfers"
    ADD CONSTRAINT "internal_fund_transfers_to_fund_id_fkey" FOREIGN KEY ("to_fund_id") REFERENCES "public"."funds"("id");



ALTER TABLE ONLY "public"."inventory"
    ADD CONSTRAINT "inventory_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inventory"
    ADD CONSTRAINT "inventory_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lab_orders"
    ADD CONSTRAINT "lab_orders_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "public"."medical_visits"("visit_id");



ALTER TABLE ONLY "public"."lot_movements"
    ADD CONSTRAINT "lot_movements_from_warehouse_id_fkey" FOREIGN KEY ("from_warehouse_id") REFERENCES "public"."warehouses"("id");



ALTER TABLE ONLY "public"."lot_movements"
    ADD CONSTRAINT "lot_movements_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "public"."product_lots"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lot_movements"
    ADD CONSTRAINT "lot_movements_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "public"."employees"("employee_id");



ALTER TABLE ONLY "public"."lot_movements"
    ADD CONSTRAINT "lot_movements_purchase_vat_invoice_id_fkey" FOREIGN KEY ("purchase_vat_invoice_id") REFERENCES "public"."vat_invoices"("id");



ALTER TABLE ONLY "public"."lot_movements"
    ADD CONSTRAINT "lot_movements_sales_vat_invoice_id_fkey" FOREIGN KEY ("sales_vat_invoice_id") REFERENCES "public"."vat_invoices"("id");



ALTER TABLE ONLY "public"."lot_movements"
    ADD CONSTRAINT "lot_movements_to_warehouse_id_fkey" FOREIGN KEY ("to_warehouse_id") REFERENCES "public"."warehouses"("id");



ALTER TABLE ONLY "public"."lot_movements"
    ADD CONSTRAINT "lot_movements_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "public"."employees"("employee_id");



ALTER TABLE ONLY "public"."medical_visits"
    ADD CONSTRAINT "medical_visits_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("appointment_id");



ALTER TABLE ONLY "public"."medical_visits"
    ADD CONSTRAINT "medical_visits_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "public"."employees"("employee_id");



ALTER TABLE ONLY "public"."medical_visits"
    ADD CONSTRAINT "medical_visits_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("patient_id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."employees"("employee_id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("employee_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_reactions"
    ADD CONSTRAINT "post_reactions_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_reactions"
    ADD CONSTRAINT "post_reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_views"
    ADD CONSTRAINT "post_views_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_views"
    ADD CONSTRAINT "post_views_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."prescriptions"
    ADD CONSTRAINT "prescriptions_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."prescriptions"
    ADD CONSTRAINT "prescriptions_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "public"."medical_visits"("visit_id");



ALTER TABLE ONLY "public"."product_lots"
    ADD CONSTRAINT "product_lots_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."employees"("employee_id");



ALTER TABLE ONLY "public"."product_lots"
    ADD CONSTRAINT "product_lots_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_lots"
    ADD CONSTRAINT "product_lots_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."employees"("employee_id");



ALTER TABLE ONLY "public"."product_lots"
    ADD CONSTRAINT "product_lots_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_supplier_mapping"
    ADD CONSTRAINT "product_supplier_mapping_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_supplier_mapping"
    ADD CONSTRAINT "product_supplier_mapping_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."purchase_order_items"
    ADD CONSTRAINT "purchase_order_items_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "public"."product_lots"("id");



ALTER TABLE ONLY "public"."purchase_order_items"
    ADD CONSTRAINT "purchase_order_items_po_id_fkey" FOREIGN KEY ("po_id") REFERENCES "public"."purchase_orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."purchase_order_items"
    ADD CONSTRAINT "purchase_order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id");



ALTER TABLE ONLY "public"."purchase_orders"
    ADD CONSTRAINT "purchase_orders_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id");



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sales_combo_items"
    ADD CONSTRAINT "sales_combo_items_combo_id_fkey" FOREIGN KEY ("combo_id") REFERENCES "public"."combos"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."sales_combo_items"
    ADD CONSTRAINT "sales_combo_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."sales_orders"("order_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sales_combo_items"
    ADD CONSTRAINT "sales_combo_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sales_order_items"
    ADD CONSTRAINT "sales_order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."sales_orders"("order_id");



ALTER TABLE ONLY "public"."sales_order_items"
    ADD CONSTRAINT "sales_order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sales_order_product_lot_items"
    ADD CONSTRAINT "sales_order_product_lot_item_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "public"."product_lots"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sales_order_product_lot_items"
    ADD CONSTRAINT "sales_order_product_lot_item_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."sales_orders"("order_id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."sales_orders"
    ADD CONSTRAINT "sales_orders_created_by_employee_id_fkey" FOREIGN KEY ("created_by_employee_id") REFERENCES "public"."employees"("employee_id");



ALTER TABLE ONLY "public"."sales_orders"
    ADD CONSTRAINT "sales_orders_medical_visit_id_fkey" FOREIGN KEY ("medical_visit_id") REFERENCES "public"."medical_visits"("visit_id");



ALTER TABLE ONLY "public"."sales_orders"
    ADD CONSTRAINT "sales_orders_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("patient_id");



ALTER TABLE ONLY "public"."supplier_promotions"
    ADD CONSTRAINT "supplier_promotions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."employees"("employee_id");



ALTER TABLE ONLY "public"."supplier_promotions"
    ADD CONSTRAINT "supplier_promotions_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_fund_id_fkey" FOREIGN KEY ("fund_id") REFERENCES "public"."funds"("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vat_invoice_items"
    ADD CONSTRAINT "vat_invoice_items_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "public"."product_lots"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."vat_invoice_items"
    ADD CONSTRAINT "vat_invoice_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."vat_invoice_items"
    ADD CONSTRAINT "vat_invoice_items_vat_invoice_id_fkey" FOREIGN KEY ("vat_invoice_id") REFERENCES "public"."vat_invoices"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vat_invoices"
    ADD CONSTRAINT "vat_invoices_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."employees"("employee_id");



ALTER TABLE ONLY "public"."vat_invoices"
    ADD CONSTRAINT "vat_invoices_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."b2b_customers"("customer_id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."vat_invoices"
    ADD CONSTRAINT "vat_invoices_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."vat_warehouse"
    ADD CONSTRAINT "vat_warehouse_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "public"."product_lots"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vat_warehouse"
    ADD CONSTRAINT "vat_warehouse_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vat_warehouse"
    ADD CONSTRAINT "vat_warehouse_purchase_vat_invoice_id_fkey" FOREIGN KEY ("purchase_vat_invoice_id") REFERENCES "public"."vat_invoices"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vouchers"
    ADD CONSTRAINT "vouchers_promotion_id_fkey" FOREIGN KEY ("promotion_id") REFERENCES "public"."promotions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "storage"."objects"
    ADD CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY ("bucket_id") REFERENCES "storage"."buckets"("id");



ALTER TABLE ONLY "storage"."prefixes"
    ADD CONSTRAINT "prefixes_bucketId_fkey" FOREIGN KEY ("bucket_id") REFERENCES "storage"."buckets"("id");



ALTER TABLE ONLY "storage"."s3_multipart_uploads"
    ADD CONSTRAINT "s3_multipart_uploads_bucket_id_fkey" FOREIGN KEY ("bucket_id") REFERENCES "storage"."buckets"("id");



ALTER TABLE ONLY "storage"."s3_multipart_uploads_parts"
    ADD CONSTRAINT "s3_multipart_uploads_parts_bucket_id_fkey" FOREIGN KEY ("bucket_id") REFERENCES "storage"."buckets"("id");



ALTER TABLE ONLY "storage"."s3_multipart_uploads_parts"
    ADD CONSTRAINT "s3_multipart_uploads_parts_upload_id_fkey" FOREIGN KEY ("upload_id") REFERENCES "storage"."s3_multipart_uploads"("id") ON DELETE CASCADE;



ALTER TABLE "auth"."audit_log_entries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."flow_state" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."identities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."instances" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."mfa_amr_claims" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."mfa_challenges" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."mfa_factors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."one_time_tokens" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."refresh_tokens" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."saml_providers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."saml_relay_states" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."schema_migrations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."sso_domains" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."sso_providers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Allow authenticated insert access to sales_combo_items" ON "public"."sales_combo_items" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Allow authenticated read" ON "public"."barcode_verifications" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated read" ON "public"."lot_movements" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated read" ON "public"."product_lots" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated read" ON "public"."vat_invoice_items" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated read" ON "public"."vat_invoices" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated read" ON "public"."vat_warehouse" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated read access to all combo_items" ON "public"."combo_items" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated read access to all combos" ON "public"."combos" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated read access to posts" ON "public"."posts" FOR SELECT TO "authenticated" USING ((("status")::"text" = 'published'::"text"));



CREATE POLICY "Allow authenticated read access to product_supplier_mapping" ON "public"."product_supplier_mapping" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated read access to purchase_order_items" ON "public"."purchase_order_items" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated read access to sales_combo_items" ON "public"."sales_combo_items" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to insert comments" ON "public"."comments" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow authenticated users to insert reactions" ON "public"."post_reactions" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow authenticated write" ON "public"."barcode_verifications" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow authenticated write" ON "public"."lot_movements" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow authenticated write" ON "public"."product_lots" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow authenticated write" ON "public"."vat_invoice_items" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow authenticated write" ON "public"."vat_invoices" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow authenticated write" ON "public"."vat_warehouse" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow authenticated write access to product_supplier_mapping" ON "public"."product_supplier_mapping" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow authenticated write access to purchase_order_items" ON "public"."purchase_order_items" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow full access for post managers" ON "public"."posts" USING ("public"."has_permission"('posts.manage'::"text")) WITH CHECK ("public"."has_permission"('posts.manage'::"text"));



CREATE POLICY "Allow full access for settings managers" ON "public"."system_settings" USING ("public"."has_permission"('settings.manage'::"text")) WITH CHECK ("public"."has_permission"('settings.manage'::"text"));



CREATE POLICY "Allow individual and admin read access" ON "public"."transactions" FOR SELECT TO "authenticated" USING ((("author_id" = "auth"."uid"()) OR "public"."has_permission"('transactions.view_all'::"text")));



CREATE POLICY "Allow individual delete" ON "public"."transactions" FOR DELETE TO "authenticated" USING (("author_id" = "auth"."uid"()));



CREATE POLICY "Allow individual insert" ON "public"."transactions" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Allow individual read access to own views" ON "public"."post_views" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow individual update" ON "public"."transactions" FOR UPDATE TO "authenticated" USING (("author_id" = "auth"."uid"()));



CREATE POLICY "Allow public read access to active combos" ON "public"."combos" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Allow public read access to combo_items" ON "public"."combo_items" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."combos"
  WHERE (("combos"."id" = "combo_items"."combo_id") AND ("combos"."is_active" = true)))));



CREATE POLICY "Allow read access on comments for published posts" ON "public"."comments" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."posts"
  WHERE (("posts"."id" = "comments"."post_id") AND (("posts"."status")::"text" = 'published'::"text")))));



CREATE POLICY "Allow read access to all users on reactions" ON "public"."post_reactions" FOR SELECT USING (true);



CREATE POLICY "Allow service role full access to combo_items" ON "public"."combo_items" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Allow service role full access to combos" ON "public"."combos" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Allow service role full access to sales_combo_items" ON "public"."sales_combo_items" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Allow users to create suggestion posts for approval" ON "public"."posts" FOR INSERT TO "authenticated" WITH CHECK (((("post_type")::"text" = 'suggestion'::"text") AND (("status")::"text" = 'pending_approval'::"text") AND ("author_id" = "auth"."uid"())));



CREATE POLICY "Allow users to delete their own comments" ON "public"."comments" FOR DELETE USING (("auth"."uid"() = "author_id"));



CREATE POLICY "Allow users to delete their own reactions" ON "public"."post_reactions" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow users to update their own comments" ON "public"."comments" FOR UPDATE USING (("auth"."uid"() = "author_id"));



ALTER TABLE "public"."barcode_verifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lot_movements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."post_reactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."post_views" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."posts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."product_supplier_mapping" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."purchase_order_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."system_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vat_invoice_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vat_invoices" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vat_warehouse" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Allow Authenticated Write Access q4abr7_0" ON "storage"."objects" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Allow Authenticated Write Access q4abr7_1" ON "storage"."objects" FOR UPDATE USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Allow Authenticated Write Access q4abr7_2" ON "storage"."objects" FOR DELETE USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Allow Public Read Access q4abr7_0" ON "storage"."objects" FOR SELECT USING (true);



CREATE POLICY "Allow anonymous reads from product-images" ON "storage"."objects" FOR SELECT TO "anon" USING (("bucket_id" = 'product-images'::"text"));



CREATE POLICY "Allow anonymous uploads to product-images" ON "storage"."objects" FOR INSERT TO "anon" WITH CHECK (("bucket_id" = 'product-images'::"text"));



CREATE POLICY "Allow public uploads for avatars" ON "storage"."objects" FOR INSERT TO "anon" WITH CHECK (("bucket_id" = 'avatars'::"text"));



CREATE POLICY "Allow public uploads for identity documents" ON "storage"."objects" FOR INSERT TO "anon" WITH CHECK (("bucket_id" = 'identity-documents'::"text"));



CREATE POLICY "Cho phép người dùng đã đăng nhập upload" ON "storage"."objects" FOR INSERT TO "authenticated" WITH CHECK (("bucket_id" = 'transaction-attachments'::"text"));



CREATE POLICY "Cho phép người dùng đã đăng nhập upload 13m0pj5_2" ON "storage"."objects" FOR UPDATE USING (("bucket_id" = 'transaction-attachments'::"text"));



CREATE POLICY "Give anon users access to JPG images in folder 16wiy3a_0" ON "storage"."objects" FOR SELECT USING ((("bucket_id" = 'product-images'::"text") AND ("storage"."extension"("name") = 'jpg'::"text") AND ("lower"(("storage"."foldername"("name"))[1]) = 'public'::"text") AND ("auth"."role"() = 'anon'::"text")));



CREATE POLICY "Give anon users access to JPG images in folder 16wiy3a_1" ON "storage"."objects" FOR INSERT WITH CHECK ((("bucket_id" = 'product-images'::"text") AND ("storage"."extension"("name") = 'jpg'::"text") AND ("lower"(("storage"."foldername"("name"))[1]) = 'public'::"text") AND ("auth"."role"() = 'anon'::"text")));



CREATE POLICY "Give anon users access to JPG images in folder 16wiy3a_2" ON "storage"."objects" FOR UPDATE USING ((("bucket_id" = 'product-images'::"text") AND ("storage"."extension"("name") = 'jpg'::"text") AND ("lower"(("storage"."foldername"("name"))[1]) = 'public'::"text") AND ("auth"."role"() = 'anon'::"text")));



CREATE POLICY "Give anon users access to JPG images in folder 16wiy3a_3" ON "storage"."objects" FOR DELETE USING ((("bucket_id" = 'product-images'::"text") AND ("storage"."extension"("name") = 'jpg'::"text") AND ("lower"(("storage"."foldername"("name"))[1]) = 'public'::"text") AND ("auth"."role"() = 'anon'::"text")));



ALTER TABLE "storage"."buckets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "storage"."buckets_analytics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "storage"."migrations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "storage"."objects" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "storage"."prefixes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "storage"."s3_multipart_uploads" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "storage"."s3_multipart_uploads_parts" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "auth" TO "anon";
GRANT USAGE ON SCHEMA "auth" TO "authenticated";
GRANT USAGE ON SCHEMA "auth" TO "service_role";
GRANT ALL ON SCHEMA "auth" TO "supabase_auth_admin";
GRANT ALL ON SCHEMA "auth" TO "dashboard_user";
GRANT USAGE ON SCHEMA "auth" TO "postgres";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT USAGE ON SCHEMA "storage" TO "postgres" WITH GRANT OPTION;
GRANT USAGE ON SCHEMA "storage" TO "anon";
GRANT USAGE ON SCHEMA "storage" TO "authenticated";
GRANT USAGE ON SCHEMA "storage" TO "service_role";
GRANT ALL ON SCHEMA "storage" TO "supabase_storage_admin";
GRANT ALL ON SCHEMA "storage" TO "dashboard_user";



GRANT ALL ON FUNCTION "auth"."email"() TO "dashboard_user";



GRANT ALL ON FUNCTION "auth"."jwt"() TO "postgres";
GRANT ALL ON FUNCTION "auth"."jwt"() TO "dashboard_user";



GRANT ALL ON FUNCTION "auth"."role"() TO "dashboard_user";



GRANT ALL ON FUNCTION "auth"."uid"() TO "dashboard_user";



GRANT ALL ON FUNCTION "public"."calculate_line_item_subtotal"() TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_line_item_subtotal"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_line_item_subtotal"() TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_quote_totals"() TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_quote_totals"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_quote_totals"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_internal_transfer"("from_fund_id" bigint, "to_fund_id" bigint, "transfer_amount" numeric, "transfer_description" "text", "created_by_user" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_internal_transfer"("from_fund_id" bigint, "to_fund_id" bigint, "transfer_amount" numeric, "transfer_description" "text", "created_by_user" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_internal_transfer"("from_fund_id" bigint, "to_fund_id" bigint, "transfer_amount" numeric, "transfer_description" "text", "created_by_user" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_draft_purchase_orders"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_draft_purchase_orders"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_draft_purchase_orders"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_po_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_po_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_po_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_available_lots_v2"("p_product_id" integer, "p_warehouse_id" integer, "p_required_quantity" integer, "p_strategy" character varying, "p_require_vat" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."get_available_lots_v2"("p_product_id" integer, "p_warehouse_id" integer, "p_required_quantity" integer, "p_strategy" character varying, "p_require_vat" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_available_lots_v2"("p_product_id" integer, "p_warehouse_id" integer, "p_required_quantity" integer, "p_strategy" character varying, "p_require_vat" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_published_suggestions"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_published_suggestions"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_published_suggestions"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_unread_notification_count"("emp_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_unread_notification_count"("emp_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_unread_notification_count"("emp_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_suggestion_notification"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_suggestion_notification"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_suggestion_notification"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."has_permission"("permission_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."has_permission"("permission_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_permission"("permission_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_patient_points_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_patient_points_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_patient_points_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."mark_all_notifications_as_read"("emp_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."mark_all_notifications_as_read"("emp_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_all_notifications_as_read"("emp_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."mark_notification_as_read"("notification_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."mark_notification_as_read"("notification_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_notification_as_read"("notification_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."migrate_inventory_to_lots"("p_product_id" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."migrate_inventory_to_lots"("p_product_id" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."migrate_inventory_to_lots"("p_product_id" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."remove_all_lots"("p_product_id" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."remove_all_lots"("p_product_id" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."remove_all_lots"("p_product_id" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."reserve_lot_quantity_v2"("p_lot_id" integer, "p_quantity" integer, "p_order_id" integer, "p_order_type" character varying, "p_employee_id" "uuid", "p_shelf_location" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."reserve_lot_quantity_v2"("p_lot_id" integer, "p_quantity" integer, "p_order_id" integer, "p_order_type" character varying, "p_employee_id" "uuid", "p_shelf_location" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."reserve_lot_quantity_v2"("p_lot_id" integer, "p_quantity" integer, "p_order_id" integer, "p_order_type" character varying, "p_employee_id" "uuid", "p_shelf_location" character varying) TO "service_role";



GRANT ALL ON TABLE "public"."transactions" TO "anon";
GRANT ALL ON TABLE "public"."transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."transactions" TO "service_role";



GRANT ALL ON FUNCTION "public"."search_transactions"("search_term" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."search_transactions"("search_term" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_transactions"("search_term" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."sell_lot_quantity_v2"("p_lot_id" integer, "p_quantity" integer, "p_order_id" integer, "p_order_type" character varying, "p_sales_vat_invoice_id" integer, "p_employee_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."sell_lot_quantity_v2"("p_lot_id" integer, "p_quantity" integer, "p_order_id" integer, "p_order_type" character varying, "p_sales_vat_invoice_id" integer, "p_employee_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sell_lot_quantity_v2"("p_lot_id" integer, "p_quantity" integer, "p_order_id" integer, "p_order_type" character varying, "p_sales_vat_invoice_id" integer, "p_employee_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_lots_to_inventory"("p_product_id" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."sync_lots_to_inventory"("p_product_id" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_lots_to_inventory"("p_product_id" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_combos_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_combos_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_combos_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_notifications_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_notifications_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_notifications_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_purchase_order_details"("p_po_id" bigint, "p_supplier_id" bigint, "p_items" "jsonb", "p_new_status" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_purchase_order_details"("p_po_id" bigint, "p_supplier_id" bigint, "p_items" "jsonb", "p_new_status" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_purchase_order_details"("p_po_id" bigint, "p_supplier_id" bigint, "p_items" "jsonb", "p_new_status" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_purchase_orders_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_purchase_orders_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_purchase_orders_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_supplier_promotions_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_supplier_promotions_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_supplier_promotions_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."verify_barcode_v2"("p_barcode" character varying, "p_order_id" integer, "p_order_type" character varying, "p_context" character varying, "p_employee_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."verify_barcode_v2"("p_barcode" character varying, "p_order_id" integer, "p_order_type" character varying, "p_context" character varying, "p_employee_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."verify_barcode_v2"("p_barcode" character varying, "p_order_id" integer, "p_order_type" character varying, "p_context" character varying, "p_employee_id" "uuid") TO "service_role";



GRANT ALL ON TABLE "auth"."audit_log_entries" TO "dashboard_user";
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "auth"."audit_log_entries" TO "postgres";
GRANT SELECT ON TABLE "auth"."audit_log_entries" TO "postgres" WITH GRANT OPTION;



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "auth"."flow_state" TO "postgres";
GRANT SELECT ON TABLE "auth"."flow_state" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."flow_state" TO "dashboard_user";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "auth"."identities" TO "postgres";
GRANT SELECT ON TABLE "auth"."identities" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."identities" TO "dashboard_user";



GRANT ALL ON TABLE "auth"."instances" TO "dashboard_user";
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "auth"."instances" TO "postgres";
GRANT SELECT ON TABLE "auth"."instances" TO "postgres" WITH GRANT OPTION;



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "auth"."mfa_amr_claims" TO "postgres";
GRANT SELECT ON TABLE "auth"."mfa_amr_claims" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."mfa_amr_claims" TO "dashboard_user";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "auth"."mfa_challenges" TO "postgres";
GRANT SELECT ON TABLE "auth"."mfa_challenges" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."mfa_challenges" TO "dashboard_user";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "auth"."mfa_factors" TO "postgres";
GRANT SELECT ON TABLE "auth"."mfa_factors" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."mfa_factors" TO "dashboard_user";



GRANT ALL ON TABLE "auth"."oauth_authorizations" TO "postgres";
GRANT ALL ON TABLE "auth"."oauth_authorizations" TO "dashboard_user";



GRANT ALL ON TABLE "auth"."oauth_clients" TO "postgres";
GRANT ALL ON TABLE "auth"."oauth_clients" TO "dashboard_user";



GRANT ALL ON TABLE "auth"."oauth_consents" TO "postgres";
GRANT ALL ON TABLE "auth"."oauth_consents" TO "dashboard_user";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "auth"."one_time_tokens" TO "postgres";
GRANT SELECT ON TABLE "auth"."one_time_tokens" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."one_time_tokens" TO "dashboard_user";



GRANT ALL ON TABLE "auth"."refresh_tokens" TO "dashboard_user";
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "auth"."refresh_tokens" TO "postgres";
GRANT SELECT ON TABLE "auth"."refresh_tokens" TO "postgres" WITH GRANT OPTION;



GRANT ALL ON SEQUENCE "auth"."refresh_tokens_id_seq" TO "dashboard_user";
GRANT ALL ON SEQUENCE "auth"."refresh_tokens_id_seq" TO "postgres";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "auth"."saml_providers" TO "postgres";
GRANT SELECT ON TABLE "auth"."saml_providers" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."saml_providers" TO "dashboard_user";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "auth"."saml_relay_states" TO "postgres";
GRANT SELECT ON TABLE "auth"."saml_relay_states" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."saml_relay_states" TO "dashboard_user";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "auth"."sessions" TO "postgres";
GRANT SELECT ON TABLE "auth"."sessions" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."sessions" TO "dashboard_user";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "auth"."sso_domains" TO "postgres";
GRANT SELECT ON TABLE "auth"."sso_domains" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."sso_domains" TO "dashboard_user";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "auth"."sso_providers" TO "postgres";
GRANT SELECT ON TABLE "auth"."sso_providers" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."sso_providers" TO "dashboard_user";



GRANT ALL ON TABLE "auth"."users" TO "dashboard_user";
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "auth"."users" TO "postgres";
GRANT SELECT ON TABLE "auth"."users" TO "postgres" WITH GRANT OPTION;



GRANT ALL ON TABLE "public"."appointment_statuses" TO "anon";
GRANT ALL ON TABLE "public"."appointment_statuses" TO "authenticated";
GRANT ALL ON TABLE "public"."appointment_statuses" TO "service_role";



GRANT ALL ON TABLE "public"."appointments" TO "anon";
GRANT ALL ON TABLE "public"."appointments" TO "authenticated";
GRANT ALL ON TABLE "public"."appointments" TO "service_role";



GRANT ALL ON TABLE "public"."b2b_customers" TO "anon";
GRANT ALL ON TABLE "public"."b2b_customers" TO "authenticated";
GRANT ALL ON TABLE "public"."b2b_customers" TO "service_role";



GRANT ALL ON TABLE "public"."b2b_quote_items" TO "anon";
GRANT ALL ON TABLE "public"."b2b_quote_items" TO "authenticated";
GRANT ALL ON TABLE "public"."b2b_quote_items" TO "service_role";



GRANT ALL ON TABLE "public"."b2b_quotes" TO "anon";
GRANT ALL ON TABLE "public"."b2b_quotes" TO "authenticated";
GRANT ALL ON TABLE "public"."b2b_quotes" TO "service_role";



GRANT ALL ON TABLE "public"."banks" TO "anon";
GRANT ALL ON TABLE "public"."banks" TO "authenticated";
GRANT ALL ON TABLE "public"."banks" TO "service_role";



GRANT ALL ON SEQUENCE "public"."banks_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."banks_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."banks_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."barcode_verifications" TO "anon";
GRANT ALL ON TABLE "public"."barcode_verifications" TO "authenticated";
GRANT ALL ON TABLE "public"."barcode_verifications" TO "service_role";



GRANT ALL ON SEQUENCE "public"."barcode_verifications_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."barcode_verifications_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."barcode_verifications_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."combo_items" TO "anon";
GRANT ALL ON TABLE "public"."combo_items" TO "authenticated";
GRANT ALL ON TABLE "public"."combo_items" TO "service_role";



GRANT ALL ON SEQUENCE "public"."combo_items_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."combo_items_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."combo_items_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."combos" TO "anon";
GRANT ALL ON TABLE "public"."combos" TO "authenticated";
GRANT ALL ON TABLE "public"."combos" TO "service_role";



GRANT ALL ON SEQUENCE "public"."combos_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."combos_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."combos_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";



GRANT ALL ON TABLE "public"."combos_with_pricing" TO "anon";
GRANT ALL ON TABLE "public"."combos_with_pricing" TO "authenticated";
GRANT ALL ON TABLE "public"."combos_with_pricing" TO "service_role";



GRANT ALL ON TABLE "public"."comments" TO "anon";
GRANT ALL ON TABLE "public"."comments" TO "authenticated";
GRANT ALL ON TABLE "public"."comments" TO "service_role";



GRANT ALL ON TABLE "public"."employees" TO "anon";
GRANT ALL ON TABLE "public"."employees" TO "authenticated";
GRANT ALL ON TABLE "public"."employees" TO "service_role";



GRANT ALL ON TABLE "public"."funds" TO "anon";
GRANT ALL ON TABLE "public"."funds" TO "authenticated";
GRANT ALL ON TABLE "public"."funds" TO "service_role";



GRANT ALL ON SEQUENCE "public"."funds_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."funds_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."funds_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."internal_fund_transfers" TO "anon";
GRANT ALL ON TABLE "public"."internal_fund_transfers" TO "authenticated";
GRANT ALL ON TABLE "public"."internal_fund_transfers" TO "service_role";



GRANT ALL ON SEQUENCE "public"."internal_fund_transfers_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."internal_fund_transfers_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."internal_fund_transfers_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."inventory" TO "anon";
GRANT ALL ON TABLE "public"."inventory" TO "authenticated";
GRANT ALL ON TABLE "public"."inventory" TO "service_role";



GRANT ALL ON SEQUENCE "public"."inventory_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."inventory_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."inventory_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."lab_orders" TO "anon";
GRANT ALL ON TABLE "public"."lab_orders" TO "authenticated";
GRANT ALL ON TABLE "public"."lab_orders" TO "service_role";



GRANT ALL ON TABLE "public"."lot_movements" TO "anon";
GRANT ALL ON TABLE "public"."lot_movements" TO "authenticated";
GRANT ALL ON TABLE "public"."lot_movements" TO "service_role";



GRANT ALL ON SEQUENCE "public"."lot_movements_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."lot_movements_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."lot_movements_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."medical_visits" TO "anon";
GRANT ALL ON TABLE "public"."medical_visits" TO "authenticated";
GRANT ALL ON TABLE "public"."medical_visits" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON SEQUENCE "public"."notifications_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."notifications_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."notifications_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."patient_points_history" TO "anon";
GRANT ALL ON TABLE "public"."patient_points_history" TO "authenticated";
GRANT ALL ON TABLE "public"."patient_points_history" TO "service_role";



GRANT ALL ON TABLE "public"."patients" TO "anon";
GRANT ALL ON TABLE "public"."patients" TO "authenticated";
GRANT ALL ON TABLE "public"."patients" TO "service_role";



GRANT ALL ON TABLE "public"."patient_points_summary" TO "anon";
GRANT ALL ON TABLE "public"."patient_points_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."patient_points_summary" TO "service_role";



GRANT ALL ON TABLE "public"."permissions" TO "anon";
GRANT ALL ON TABLE "public"."permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."permissions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."permissions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."permissions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."permissions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."post_reactions" TO "anon";
GRANT ALL ON TABLE "public"."post_reactions" TO "authenticated";
GRANT ALL ON TABLE "public"."post_reactions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."post_reactions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."post_reactions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."post_reactions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."post_views" TO "anon";
GRANT ALL ON TABLE "public"."post_views" TO "authenticated";
GRANT ALL ON TABLE "public"."post_views" TO "service_role";



GRANT ALL ON SEQUENCE "public"."post_views_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."post_views_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."post_views_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."posts" TO "anon";
GRANT ALL ON TABLE "public"."posts" TO "authenticated";
GRANT ALL ON TABLE "public"."posts" TO "service_role";



GRANT ALL ON TABLE "public"."prescriptions" TO "anon";
GRANT ALL ON TABLE "public"."prescriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."prescriptions" TO "service_role";



GRANT ALL ON TABLE "public"."product_lots" TO "anon";
GRANT ALL ON TABLE "public"."product_lots" TO "authenticated";
GRANT ALL ON TABLE "public"."product_lots" TO "service_role";



GRANT ALL ON SEQUENCE "public"."product_lots_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."product_lots_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."product_lots_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."product_supplier_mapping" TO "anon";
GRANT ALL ON TABLE "public"."product_supplier_mapping" TO "authenticated";
GRANT ALL ON TABLE "public"."product_supplier_mapping" TO "service_role";



GRANT ALL ON SEQUENCE "public"."product_supplier_mapping_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."product_supplier_mapping_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."product_supplier_mapping_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."products_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."products_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."products_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."warehouses" TO "anon";
GRANT ALL ON TABLE "public"."warehouses" TO "authenticated";
GRANT ALL ON TABLE "public"."warehouses" TO "service_role";



GRANT ALL ON TABLE "public"."products_with_inventory" TO "anon";
GRANT ALL ON TABLE "public"."products_with_inventory" TO "authenticated";
GRANT ALL ON TABLE "public"."products_with_inventory" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."promotions" TO "anon";
GRANT ALL ON TABLE "public"."promotions" TO "authenticated";
GRANT ALL ON TABLE "public"."promotions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."promotions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."promotions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."promotions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."purchase_order_items" TO "anon";
GRANT ALL ON TABLE "public"."purchase_order_items" TO "authenticated";
GRANT ALL ON TABLE "public"."purchase_order_items" TO "service_role";



GRANT ALL ON SEQUENCE "public"."purchase_order_items_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."purchase_order_items_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."purchase_order_items_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."purchase_orders" TO "anon";
GRANT ALL ON TABLE "public"."purchase_orders" TO "authenticated";
GRANT ALL ON TABLE "public"."purchase_orders" TO "service_role";



GRANT ALL ON SEQUENCE "public"."purchase_orders_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."purchase_orders_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."purchase_orders_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."role_permissions" TO "anon";
GRANT ALL ON TABLE "public"."role_permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."role_permissions" TO "service_role";



GRANT ALL ON TABLE "public"."roles" TO "anon";
GRANT ALL ON TABLE "public"."roles" TO "authenticated";
GRANT ALL ON TABLE "public"."roles" TO "service_role";



GRANT ALL ON SEQUENCE "public"."roles_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."roles_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."roles_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."rooms" TO "anon";
GRANT ALL ON TABLE "public"."rooms" TO "authenticated";
GRANT ALL ON TABLE "public"."rooms" TO "service_role";



GRANT ALL ON TABLE "public"."sales_combo_items" TO "anon";
GRANT ALL ON TABLE "public"."sales_combo_items" TO "authenticated";
GRANT ALL ON TABLE "public"."sales_combo_items" TO "service_role";



GRANT ALL ON TABLE "public"."sales_order_items" TO "anon";
GRANT ALL ON TABLE "public"."sales_order_items" TO "authenticated";
GRANT ALL ON TABLE "public"."sales_order_items" TO "service_role";



GRANT ALL ON TABLE "public"."sales_order_product_lot_items" TO "anon";
GRANT ALL ON TABLE "public"."sales_order_product_lot_items" TO "authenticated";
GRANT ALL ON TABLE "public"."sales_order_product_lot_items" TO "service_role";



GRANT ALL ON SEQUENCE "public"."sales_order_product_lot_item_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."sales_order_product_lot_item_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."sales_order_product_lot_item_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."sales_orders" TO "anon";
GRANT ALL ON TABLE "public"."sales_orders" TO "authenticated";
GRANT ALL ON TABLE "public"."sales_orders" TO "service_role";



GRANT ALL ON TABLE "public"."supplier_promotions" TO "anon";
GRANT ALL ON TABLE "public"."supplier_promotions" TO "authenticated";
GRANT ALL ON TABLE "public"."supplier_promotions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."supplier_promotions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."supplier_promotions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."supplier_promotions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."suppliers" TO "anon";
GRANT ALL ON TABLE "public"."suppliers" TO "authenticated";
GRANT ALL ON TABLE "public"."suppliers" TO "service_role";



GRANT ALL ON SEQUENCE "public"."suppliers_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."suppliers_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."suppliers_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."system_settings" TO "anon";
GRANT ALL ON TABLE "public"."system_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."system_settings" TO "service_role";



GRANT ALL ON SEQUENCE "public"."transactions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."transactions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."transactions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."user_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";



GRANT ALL ON TABLE "public"."vat_invoice_items" TO "anon";
GRANT ALL ON TABLE "public"."vat_invoice_items" TO "authenticated";
GRANT ALL ON TABLE "public"."vat_invoice_items" TO "service_role";



GRANT ALL ON SEQUENCE "public"."vat_invoice_items_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."vat_invoice_items_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."vat_invoice_items_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."vat_invoices" TO "anon";
GRANT ALL ON TABLE "public"."vat_invoices" TO "authenticated";
GRANT ALL ON TABLE "public"."vat_invoices" TO "service_role";



GRANT ALL ON SEQUENCE "public"."vat_invoices_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."vat_invoices_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."vat_invoices_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."vat_warehouse" TO "anon";
GRANT ALL ON TABLE "public"."vat_warehouse" TO "authenticated";
GRANT ALL ON TABLE "public"."vat_warehouse" TO "service_role";



GRANT ALL ON SEQUENCE "public"."vat_warehouse_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."vat_warehouse_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."vat_warehouse_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."vouchers" TO "anon";
GRANT ALL ON TABLE "public"."vouchers" TO "authenticated";
GRANT ALL ON TABLE "public"."vouchers" TO "service_role";



GRANT ALL ON SEQUENCE "public"."vouchers_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."vouchers_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."vouchers_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."warehouses_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."warehouses_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."warehouses_id_seq" TO "service_role";



GRANT ALL ON TABLE "storage"."buckets" TO "anon";
GRANT ALL ON TABLE "storage"."buckets" TO "authenticated";
GRANT ALL ON TABLE "storage"."buckets" TO "service_role";
GRANT ALL ON TABLE "storage"."buckets" TO "postgres" WITH GRANT OPTION;



GRANT ALL ON TABLE "storage"."buckets_analytics" TO "service_role";
GRANT ALL ON TABLE "storage"."buckets_analytics" TO "authenticated";
GRANT ALL ON TABLE "storage"."buckets_analytics" TO "anon";



GRANT ALL ON TABLE "storage"."objects" TO "anon";
GRANT ALL ON TABLE "storage"."objects" TO "authenticated";
GRANT ALL ON TABLE "storage"."objects" TO "service_role";
GRANT ALL ON TABLE "storage"."objects" TO "postgres" WITH GRANT OPTION;



GRANT ALL ON TABLE "storage"."prefixes" TO "service_role";
GRANT ALL ON TABLE "storage"."prefixes" TO "authenticated";
GRANT ALL ON TABLE "storage"."prefixes" TO "anon";



GRANT ALL ON TABLE "storage"."s3_multipart_uploads" TO "service_role";
GRANT SELECT ON TABLE "storage"."s3_multipart_uploads" TO "authenticated";
GRANT SELECT ON TABLE "storage"."s3_multipart_uploads" TO "anon";



GRANT ALL ON TABLE "storage"."s3_multipart_uploads_parts" TO "service_role";
GRANT SELECT ON TABLE "storage"."s3_multipart_uploads_parts" TO "authenticated";
GRANT SELECT ON TABLE "storage"."s3_multipart_uploads_parts" TO "anon";



ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_auth_admin" IN SCHEMA "auth" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_auth_admin" IN SCHEMA "auth" GRANT ALL ON SEQUENCES TO "dashboard_user";



ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_auth_admin" IN SCHEMA "auth" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_auth_admin" IN SCHEMA "auth" GRANT ALL ON FUNCTIONS TO "dashboard_user";



ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_auth_admin" IN SCHEMA "auth" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_auth_admin" IN SCHEMA "auth" GRANT ALL ON TABLES TO "dashboard_user";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON SEQUENCES TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON FUNCTIONS TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON TABLES TO "service_role";



RESET ALL;
