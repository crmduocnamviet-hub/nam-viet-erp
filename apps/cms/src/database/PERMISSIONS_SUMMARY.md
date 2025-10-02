# B2B Notification Permission - Complete Summary

## ✅ Implementation Status: COMPLETE

### Code Implementation (Already Done)
All necessary code changes are **already implemented** in the codebase:

1. **Permission Definition** (`packages/shared-components/src/screens/index.ts`)
   - Line 341: `"b2b.notification": "Nhận thông báo B2B realtime"`

2. **Role Assignments** (`packages/shared-components/src/screens/index.ts`)
   - Line 422: `"super-admin": Object.keys(PERMISSIONS)` ← **Automatically includes ALL permissions**
   - Line 443: `admin` role includes `"b2b.notification"`
   - Line 458: `sales-manager` role includes `"b2b.notification"`
   - Line 522: `sales-staff` role includes `"b2b.notification"`

3. **B2BOrderListPage Integration** (`packages/shared-components/src/screens/b2b/B2BOrderListPage.tsx`)
   - Line 40: Import `notificationService`
   - Line 296-348: Realtime subscription with permission check
   - Automatic toast notifications
   - Auto-refresh on changes

## 🎯 How Super-Admin Works

### Code Level (Line 422)
```typescript
export const ROLE_PERMISSIONS = {
  "super-admin": Object.keys(PERMISSIONS), // ← Gets ALL permissions automatically
  admin: [ /* specific permissions */ ],
  // ... other roles
}
```

**This means:**
- Super-admin gets **every permission** defined in the `PERMISSIONS` object
- When you add a new permission (like `b2b.notification`), super-admin **automatically** gets it
- No need to manually add permissions to super-admin array

### Database Level
```sql
-- Super-admin in database should have role_name = 'super-admin'
-- The code will automatically grant all permissions at runtime
-- No need to manually insert into role_permissions table for super-admin
```

## 📊 Permission Flow

### Super-Admin User Login:
1. User logs in with `role_name = 'super-admin'`
2. App.tsx retrieves employee data
3. Line 105: `ROLE_PERMISSIONS[employee.role_name]` returns `Object.keys(PERMISSIONS)`
4. User object gets **all permissions** including `b2b.notification`
5. B2BOrderListPage checks: `userPermissions.includes("b2b.notification")` ✅
6. Realtime subscription activates

### Admin/Other Roles Login:
1. User logs in with specific role (e.g., `role_name = 'admin'`)
2. App.tsx retrieves employee data
3. Line 105: `ROLE_PERMISSIONS[employee.role_name]` returns specific permission array
4. User object gets only assigned permissions
5. B2BOrderListPage checks permission
6. If has `b2b.notification` → subscription activates

## 🚀 Database Setup Required

### Step 1: Add Permission to Database
```sql
INSERT INTO permissions (name, description, module)
VALUES (
  'b2b.notification',
  'Receive realtime notifications for B2B quotes and orders',
  'b2b'
)
ON CONFLICT (name) DO NOTHING;
```

### Step 2: Grant to Specific Roles (Optional)
```sql
-- For admin role (recommended)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin' AND p.name = 'b2b.notification'
ON CONFLICT DO NOTHING;

-- For sales-manager role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'sales-manager' AND p.name = 'b2b.notification'
ON CONFLICT DO NOTHING;

-- For sales-staff role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'sales-staff' AND p.name = 'b2b.notification'
ON CONFLICT DO NOTHING;
```

**Note:** Super-admin does NOT need manual database assignment - it's handled in code!

### Step 3: Enable Supabase Realtime
1. Supabase Dashboard → Database → Replication
2. Enable replication for `b2b_quotes` table
3. Save changes

## 📋 Permission Matrix

| Role | b2b.notification | How It Works |
|------|------------------|--------------|
| **super-admin** | ✅ | Automatic via `Object.keys(PERMISSIONS)` |
| **admin** | ✅ | Explicitly listed in ROLE_PERMISSIONS |
| **sales-manager** | ✅ | Explicitly listed in ROLE_PERMISSIONS |
| **sales-staff** | ✅ | Explicitly listed in ROLE_PERMISSIONS |
| **inventory-staff** | ❌ | Not listed (can be added if needed) |
| **delivery-staff** | ❌ | Not listed (can be added if needed) |
| **medical-staff** | ❌ | Not listed (not relevant) |
| **accountant** | ❌ | Not listed (not relevant) |

## 🔍 Verification Commands

### Verify Permission Exists
```sql
SELECT * FROM permissions WHERE name = 'b2b.notification';
```

### Verify Role Assignments
```sql
SELECT
  r.name as role_name,
  p.name as permission_name,
  p.description
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE p.name = 'b2b.notification'
ORDER BY r.name;
```

### Check User's Effective Permissions
```sql
-- Check what permissions a user has
SELECT
  e.full_name,
  e.role_name,
  p.name as permission_name
FROM employees e
JOIN roles r ON e.role_name = r.name
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id
WHERE e.employee_id = 'YOUR-EMPLOYEE-ID'
ORDER BY p.name;
```

## 🧪 Testing Guide

### Test Super-Admin
1. Login as user with `role_name = 'super-admin'`
2. Open B2B Dashboard
3. Check browser console for: `[B2B Dashboard] Setting up realtime subscription...`
4. Create/update a quote → See notification ✅

### Test Admin
1. Login as user with `role_name = 'admin'`
2. Open B2B Dashboard
3. Verify subscription activates
4. Test realtime updates ✅

### Test Without Permission
1. Login as `inventory-staff`
2. Open B2B Dashboard
3. Console shows: `User does not have b2b.notification permission. Skipping...`
4. No subscription created ✅

## 🎨 User Experience

### With Permission:
```
[User opens B2B Dashboard]
↓
[Subscription automatically activates]
↓
[Toast notification appears]
┌─────────────────────────────┐
│ ℹ️ Đơn hàng mới             │
│ Đơn hàng BG-2024-001       │
│ đã được tạo                 │
└─────────────────────────────┘
↓
[Table auto-refreshes with new data]
```

### Without Permission:
```
[User opens B2B Dashboard]
↓
[No subscription activated]
↓
[Manual refresh required to see updates]
```

## 📚 Related Files

| File | Purpose |
|------|---------|
| `packages/shared-components/src/screens/index.ts` | Permission definitions & role assignments |
| `packages/shared-components/src/screens/b2b/B2BOrderListPage.tsx` | Realtime subscription implementation |
| `packages/services/src/notificationService.ts` | Notification service core |
| `apps/cms/src/App.tsx` | Permission loading for CMS |
| `apps/cms/src/database/add-b2b-notification-permission.sql` | Database migration |

## 🔐 Security Considerations

1. **Permission Check Before Subscribe**: Always checks permission before creating subscription
2. **Row Level Security**: Ensure Supabase RLS policies restrict data access appropriately
3. **Employee Filtering**: Optional employee_id filter limits notifications to relevant quotes
4. **Automatic Cleanup**: Subscription properly cleaned up on component unmount

## 🎯 Summary

**Code Status**: ✅ **COMPLETE** - All code changes already implemented

**Database Status**: ⏳ **PENDING** - Need to run SQL scripts

**Super-Admin**: ✅ **AUTOMATIC** - Gets all permissions including `b2b.notification` without database changes

**Next Steps**:
1. Run Step 1 SQL (add permission to database)
2. Run Step 2 SQL (grant to specific roles - optional for super-admin)
3. Enable Supabase Realtime
4. Test and verify

---

**Version**: 1.0.0
**Last Updated**: January 2025
**Status**: Ready for Production
