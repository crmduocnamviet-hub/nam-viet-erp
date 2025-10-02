# Quick Setup: B2B Notification Permission for Admin

## ✅ Code Implementation Status
The `b2b.notification` permission is **already implemented** in the codebase:

- ✅ Permission defined in `packages/shared-components/src/screens/index.ts` (Line 341)
- ✅ Added to `admin` role (Line 443)
- ✅ Added to `sales-manager` role (Line 458)
- ✅ Added to `sales-staff` role (Line 522)
- ✅ B2BOrderListPage subscription implemented with permission check

## 🚀 Database Setup (Required)

### Step 1: Add Permission to Database

Run this SQL in Supabase SQL Editor or via psql:

```sql
-- Add b2b.notification permission
INSERT INTO permissions (name, description, module)
VALUES (
  'b2b.notification',
  'Receive realtime notifications for B2B quotes and orders',
  'b2b'
)
ON CONFLICT (name) DO NOTHING;
```

### Step 2: Grant to Admin Role

```sql
-- Grant permission to admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin'
AND p.name = 'b2b.notification'
ON CONFLICT DO NOTHING;
```

### Step 3: Verify

```sql
-- Verify permission was added
SELECT * FROM permissions WHERE name = 'b2b.notification';

-- Verify admin role has the permission
SELECT r.name as role_name, p.name as permission_name
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE p.name = 'b2b.notification';
```

### Step 4: Enable Realtime in Supabase

1. Go to **Supabase Dashboard** → **Database** → **Replication**
2. Find `b2b_quotes` table
3. Click **Enable** for replication
4. Save changes

## 🎯 Testing

1. **Login as admin user**
2. **Navigate to B2B Dashboard** (`📋 Danh sách Đơn hàng B2B`)
3. **Open browser console** (F12)
4. **Look for**: `[B2B Dashboard] Setting up realtime subscription for b2b_quotes...`

### Test Realtime Updates

**Option A: Using Another Tab**
1. Open B2B dashboard in Tab 1
2. Open B2B dashboard in Tab 2
3. Create/update a quote in Tab 2
4. See realtime notification in Tab 1

**Option B: Using SQL**
```sql
-- Insert test quote to trigger notification
INSERT INTO b2b_quotes (
  quote_number,
  customer_name,
  total_value,
  subtotal,
  quote_date,
  valid_until
) VALUES (
  'TEST-001',
  'Test Customer',
  100000,
  100000,
  NOW(),
  NOW() + INTERVAL '30 days'
);
```

Expected result: Toast notification appears saying "Đơn hàng mới"

## 📝 Current Permissions by Role

### Super Admin
- ✅ **ALL PERMISSIONS** (automatically includes `b2b.notification`)
- ✅ Configured via `Object.keys(PERMISSIONS)` in code
- ✅ No manual permission assignment needed

### Admin
- ✅ `b2b.access`
- ✅ `b2b.notification` ← **ENABLED**
- ✅ `quotes.view`
- ✅ `quotes.create`

### Sales Manager
- ✅ `b2b.access`
- ✅ `b2b.view`
- ✅ `b2b.create`
- ✅ `b2b.notification` ← **ENABLED**
- ✅ `quotes.view`
- ✅ `quotes.create`
- ✅ `quotes.edit`

### Sales Staff
- ✅ `b2b.access`
- ✅ `b2b.view`
- ✅ `b2b.create`
- ✅ `b2b.notification` ← **ENABLED**
- ✅ `quotes.view`
- ✅ `quotes.create`

### Inventory Staff
- ✅ `b2b.access`
- ✅ `b2b.view`
- ❌ `b2b.notification` ← **NOT ENABLED** (add if needed)

### Delivery Staff
- ✅ `b2b.access`
- ✅ `b2b.view`
- ❌ `b2b.notification` ← **NOT ENABLED** (add if needed)

## 🔧 Troubleshooting

### No notification appears
1. Check browser console for errors
2. Verify permission in database
3. Check Supabase Realtime is enabled for `b2b_quotes`
4. Verify user has `b2b.notification` permission

### Console shows "User does not have b2b.notification permission"
- Run Step 2 SQL to grant permission to role
- Logout and login again
- Clear browser cache

### Realtime connection fails
- Check Supabase project status
- Verify network allows WebSocket connections
- Check browser console for connection errors

## 📚 Additional Resources

See `B2B_NOTIFICATION_SETUP.md` for:
- Complete architecture documentation
- Advanced usage examples
- Security considerations
- Future enhancements

---

**Status**: ✅ Code Ready | ⏳ Database Setup Required
**Version**: 1.0.0
**Last Updated**: January 2025
