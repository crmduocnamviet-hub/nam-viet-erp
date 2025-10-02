# B2B Notification Permission - Testing Guide

## 🧪 Complete Testing Checklist

### Prerequisites

Before testing, ensure:
1. ✅ SQL migration has been run (permission added to database)
2. ✅ Supabase Realtime is enabled for `b2b_quotes` table
3. ✅ You have test users with different roles

---

## Method 1: Browser Console Testing (Quickest)

### Step 1: Login as Admin/Super-Admin
1. Open CMS and login with admin or super-admin credentials
2. Navigate to **📋 Danh sách Đơn hàng B2B**

### Step 2: Open Browser Console
Press `F12` or right-click → Inspect → Console tab

### Step 3: Check for Subscription Messages

**✅ If permission is working, you should see:**
```
[B2B Dashboard] Setting up realtime subscription for b2b_quotes...
```

**❌ If permission is NOT working, you should see:**
```
[B2B Dashboard] User does not have b2b.notification permission. Skipping realtime subscription.
```

### Step 4: Verify User Permissions
In browser console, type:
```javascript
// Check user permissions
console.log(window.__USER_PERMISSIONS__);
// or check in React DevTools
```

Or add this temporary code to check:
```javascript
// Add to B2BOrderListPage temporarily
console.log('User permissions:', userPermissions);
console.log('Has b2b.notification:', userPermissions.includes('b2b.notification'));
```

---

## Method 2: Two-Tab Testing (Live Updates)

### Setup
1. **Tab 1**: Login as admin → Open B2B Dashboard
2. **Tab 2**: Login as admin → Open 🛒 Tạo Báo Giá / Đơn Hàng

### Test New Order (INSERT)
1. In **Tab 2**: Create a new quote/order
2. In **Tab 1**: Look for toast notification

**Expected Result:**
```
┌─────────────────────────────┐
│ ℹ️ Đơn hàng mới             │
│ Đơn hàng BG-2024-XXX       │
│ đã được tạo                 │
└─────────────────────────────┘
```

The list in Tab 1 should automatically refresh with the new order.

### Test Update (UPDATE)
1. In **Tab 2**: Edit an existing quote
2. Change status or any field
3. Save changes

**Expected Result in Tab 1:**
```
┌─────────────────────────────┐
│ ℹ️ Cập nhật đơn hàng        │
│ Đơn hàng BG-2024-XXX       │
│ đã được cập nhật            │
└─────────────────────────────┘
```

---

## Method 3: SQL Testing (Direct Database)

### Test INSERT Notification
Open Supabase SQL Editor and run:

```sql
-- Insert a test quote
INSERT INTO b2b_quotes (
  quote_number,
  customer_name,
  total_value,
  subtotal,
  discount_percent,
  discount_amount,
  tax_percent,
  tax_amount,
  quote_date,
  valid_until,
  quote_stage,
  created_by_employee_id
) VALUES (
  'TEST-' || TO_CHAR(NOW(), 'YYYYMMDD-HH24MISS'),
  'Test Customer - Realtime',
  100000,
  100000,
  0,
  0,
  10,
  10000,
  NOW(),
  NOW() + INTERVAL '30 days',
  'draft',
  NULL -- or your employee_id
);
```

**Expected:** Toast notification appears immediately in B2B Dashboard

### Test UPDATE Notification
```sql
-- Update an existing quote
UPDATE b2b_quotes
SET quote_stage = 'sent',
    total_value = 150000
WHERE quote_number = 'TEST-20250102-143022' -- use actual test quote number
RETURNING *;
```

**Expected:** Update notification appears

### Test DELETE Notification
```sql
-- Delete test quote
DELETE FROM b2b_quotes
WHERE quote_number LIKE 'TEST-%'
RETURNING quote_number;
```

**Expected:** Warning notification appears

---

## Method 4: Network Tab Verification

### Check WebSocket Connection

1. Open DevTools → **Network** tab
2. Filter by **WS** (WebSocket)
3. Navigate to B2B Dashboard

**Expected:**
- You should see WebSocket connection to Supabase
- Connection status: `101 Switching Protocols` (success)
- Messages flowing through the connection

### Inspect Realtime Messages

Click on the WebSocket connection → **Messages** tab

**Expected messages:**
```json
{
  "event": "postgres_changes",
  "payload": {
    "data": {
      "eventType": "INSERT",
      "new": { /* quote data */ },
      "old": null
    }
  }
}
```

---

## Method 5: Role-Based Testing

### Test 1: Super-Admin (Should Work)
```bash
# Login as super-admin
# Expected: ✅ Subscription active
```

### Test 2: Admin (Should Work)
```bash
# Login as admin
# Expected: ✅ Subscription active
```

### Test 3: Sales Staff (Should Work)
```bash
# Login as sales-staff
# Expected: ✅ Subscription active
```

### Test 4: Inventory Staff (Should NOT Work)
```bash
# Login as inventory-staff
# Expected: ❌ No subscription (permission not granted)
# Console: "User does not have b2b.notification permission"
```

---

## 🔍 Debugging Steps

### Issue: No subscription message in console

**Check 1: Verify user has permission**
```sql
-- Check if user's role has the permission
SELECT
  e.full_name,
  e.role_name,
  p.name as permission
FROM employees e
JOIN roles r ON e.role_name = r.name
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id
WHERE e.employee_id = 'YOUR-EMPLOYEE-ID'
AND p.name = 'b2b.notification';
```

**Check 2: Verify permission exists in database**
```sql
SELECT * FROM permissions WHERE name = 'b2b.notification';
```

**Check 3: Check ROLE_PERMISSIONS in code**
```javascript
// In browser console while on B2B Dashboard
import { ROLE_PERMISSIONS } from '@nam-viet-erp/shared-components';
console.log('Admin permissions:', ROLE_PERMISSIONS.admin);
// Should include 'b2b.notification'
```

### Issue: Subscription active but no notifications

**Check 1: Verify Supabase Realtime is enabled**
```
Supabase Dashboard → Database → Replication
→ Find b2b_quotes → Should be ✅ Enabled
```

**Check 2: Check RLS policies**
```sql
-- Verify user can read from b2b_quotes
SELECT * FROM b2b_quotes LIMIT 1;
-- Should return data, not permission error
```

**Check 3: Check WebSocket connection**
- Network tab → WS → Should see active connection
- No 403/401 errors

### Issue: Notifications work but list doesn't refresh

**Check:** The `loadOrders()` function should be called in the subscription callback:

```typescript
// Should be at line 338 in B2BOrderListPage.tsx
loadOrders(); // ✅ This triggers the refresh
```

---

## 🧪 Automated Testing Script

Create a test file: `test-b2b-notifications.sql`

```sql
-- Automated B2B Notification Test Script
-- Run this while logged into B2B Dashboard

DO $$
DECLARE
  test_quote_id uuid;
  test_quote_number text;
BEGIN
  -- Test 1: INSERT
  RAISE NOTICE 'TEST 1: Creating new quote...';

  INSERT INTO b2b_quotes (
    quote_number,
    customer_name,
    total_value,
    subtotal,
    discount_percent,
    discount_amount,
    tax_percent,
    tax_amount,
    quote_date,
    valid_until,
    quote_stage
  ) VALUES (
    'TEST-' || TO_CHAR(NOW(), 'YYYYMMDD-HH24MISS'),
    'Test Customer - Auto',
    100000,
    100000,
    0,
    0,
    10,
    10000,
    NOW(),
    NOW() + INTERVAL '30 days',
    'draft'
  ) RETURNING quote_id, quote_number INTO test_quote_id, test_quote_number;

  RAISE NOTICE 'Created: %', test_quote_number;
  RAISE NOTICE 'Expected: Toast notification "Đơn hàng mới"';
  PERFORM pg_sleep(3);

  -- Test 2: UPDATE
  RAISE NOTICE 'TEST 2: Updating quote...';

  UPDATE b2b_quotes
  SET quote_stage = 'sent',
      total_value = 150000
  WHERE quote_id = test_quote_id;

  RAISE NOTICE 'Updated: %', test_quote_number;
  RAISE NOTICE 'Expected: Toast notification "Cập nhật đơn hàng"';
  PERFORM pg_sleep(3);

  -- Test 3: DELETE
  RAISE NOTICE 'TEST 3: Deleting quote...';

  DELETE FROM b2b_quotes
  WHERE quote_id = test_quote_id;

  RAISE NOTICE 'Deleted: %', test_quote_number;
  RAISE NOTICE 'Expected: Toast notification "Đơn hàng đã xóa"';

  RAISE NOTICE 'All tests completed!';
END $$;
```

---

## ✅ Expected Test Results Summary

| Test | User Role | Expected Result |
|------|-----------|-----------------|
| Console log | super-admin | "Setting up realtime subscription..." ✅ |
| Console log | admin | "Setting up realtime subscription..." ✅ |
| Console log | sales-staff | "Setting up realtime subscription..." ✅ |
| Console log | inventory-staff | "User does not have...permission" ❌ |
| INSERT notification | admin | Toast "Đơn hàng mới" ✅ |
| UPDATE notification | admin | Toast "Cập nhật đơn hàng" ✅ |
| DELETE notification | admin | Toast "Đơn hàng đã xóa" ✅ |
| Auto-refresh | admin | List updates automatically ✅ |
| WebSocket | admin | Active WS connection ✅ |

---

## 📊 Quick Test Checklist

```
□ Login as super-admin
□ Open B2B Dashboard
□ Check console for subscription message
□ Create new quote in another tab
□ See toast notification
□ See list auto-refresh
□ Check Network tab for WebSocket
□ Test with inventory-staff (should NOT work)
□ Verify SQL test creates notifications
```

---

## 🎯 One-Minute Quick Test

**Fastest way to verify it's working:**

1. Open CMS → Login as admin
2. Open B2B Dashboard
3. Press F12 → Console tab
4. Look for: `[B2B Dashboard] Setting up realtime subscription...`
5. Run this SQL in Supabase:
   ```sql
   INSERT INTO b2b_quotes (quote_number, customer_name, total_value, subtotal, quote_date, valid_until)
   VALUES ('QUICK-TEST', 'Quick Test', 100000, 100000, NOW(), NOW() + INTERVAL '30 days');
   ```
6. **Expected:** Toast notification appears within 1 second ✅

---

**If you see the toast notification, the b2b.notification permission is working perfectly!** 🎉
