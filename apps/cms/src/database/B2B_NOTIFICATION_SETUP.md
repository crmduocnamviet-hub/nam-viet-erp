# B2B Realtime Notification System

## Overview
This document explains the B2B realtime notification system that allows users with the `b2b.notification` permission to receive live updates when B2B quotes and orders are created, updated, or deleted.

## Features

### ✅ Implemented
1. **Permission-Based Access** - Only users with `b2b.notification` permission receive realtime updates
2. **Realtime Subscriptions** - Automatically listens to changes in the `b2b_quotes` table
3. **Event Notifications** - Shows toast notifications for:
   - New orders (INSERT)
   - Updated orders (UPDATE)
   - Deleted orders (DELETE)
4. **Auto-Refresh** - Automatically refreshes the order list when changes are detected
5. **Employee Filtering** - Optional filtering to only receive notifications for specific employee's quotes

## Architecture

### Components

#### 1. NotificationService (`packages/services/src/notificationService.ts`)
Centralized service for managing Supabase realtime subscriptions:

```typescript
// Subscribe to all B2B quotes
const unsubscribe = notificationService.subscribeToB2BQuotes((payload) => {
  console.log("Quote changed:", payload);
  // Handle the change
});

// Subscribe to specific employee's quotes
const unsubscribe = notificationService.subscribeToB2BQuotes(
  (payload) => {
    // Handle the change
  },
  employeeId
);

// Clean up when component unmounts
unsubscribe();
```

#### 2. B2BOrderListPage Integration
The B2B dashboard automatically subscribes to realtime updates if the user has permission:

**Location**: `packages/shared-components/src/screens/b2b/B2BOrderListPage.tsx`

**Key Features**:
- Permission check before subscribing
- Toast notifications for different event types
- Automatic list refresh on changes
- Proper cleanup on unmount

## Database Setup

### 1. Add Permission to Database

Run the SQL migration file:

```bash
psql -U your_username -d your_database -f apps/cms/src/database/add-b2b-notification-permission.sql
```

Or execute directly in Supabase SQL Editor:

```sql
INSERT INTO permissions (name, description, module)
VALUES (
  'b2b.notification',
  'Receive realtime notifications for B2B quotes and orders',
  'b2b'
)
ON CONFLICT (name) DO NOTHING;
```

### 2. Grant Permission to Roles

#### Option A: Grant to specific role
```sql
-- Grant to sales staff
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'sales_staff'
AND p.name = 'b2b.notification'
ON CONFLICT DO NOTHING;
```

#### Option B: Grant to individual user
```sql
-- Grant to specific user
INSERT INTO user_permissions (user_id, permission_id)
SELECT 'user-uuid-here', p.id
FROM permissions p
WHERE p.name = 'b2b.notification';
```

### 3. Enable Realtime in Supabase

Make sure Realtime is enabled for the `b2b_quotes` table:

1. Go to Supabase Dashboard → Database → Replication
2. Enable replication for `b2b_quotes` table
3. Save changes

## Usage

### For Users

Once the `b2b.notification` permission is granted:

1. **Automatic Activation** - No manual action needed, notifications start automatically
2. **Visual Feedback** - Toast notifications appear in the top-right corner
3. **Live Updates** - The order list automatically refreshes with new data

### For Developers

#### Adding Notifications to Other Pages

```typescript
import { notificationService } from "@nam-viet-erp/services";

// In your component
useEffect(() => {
  // Check permission
  const hasPermission = user?.permissions?.includes("b2b.notification");
  if (!hasPermission) return;

  // Subscribe
  const unsubscribe = notificationService.subscribeToB2BQuotes((payload) => {
    // Handle the update
    if (payload.eventType === "INSERT") {
      console.log("New quote:", payload.new);
    } else if (payload.eventType === "UPDATE") {
      console.log("Updated quote:", payload.new);
    } else if (payload.eventType === "DELETE") {
      console.log("Deleted quote:", payload.old);
    }
  });

  // Cleanup
  return () => unsubscribe();
}, [user?.permissions]);
```

#### Subscribing to Quote Items

```typescript
const unsubscribe = notificationService.subscribeToB2BQuoteItems(
  (payload) => {
    console.log("Quote item changed:", payload);
  },
  quoteId // Optional: filter by specific quote
);
```

## Payload Structure

When a realtime event occurs, the callback receives a payload with:

```typescript
{
  eventType: "INSERT" | "UPDATE" | "DELETE",
  new: IB2BQuote,      // The new/updated record (for INSERT/UPDATE)
  old: IB2BQuote,      // The old record (for UPDATE/DELETE)
  timestamp: string,    // ISO timestamp when the event was processed
  table: "b2b_quotes"   // The table name
}
```

## Troubleshooting

### Notifications Not Appearing

1. **Check Permission**
   ```typescript
   console.log(user?.permissions?.includes("b2b.notification"));
   ```

2. **Check Supabase Realtime**
   - Verify replication is enabled for `b2b_quotes` table
   - Check browser console for connection errors

3. **Check Network**
   - Realtime requires WebSocket connection
   - Ensure no firewall is blocking WSS connections

### Performance Considerations

1. **Subscription Cleanup** - Always unsubscribe when component unmounts
2. **Employee Filtering** - Use employee ID filtering to reduce unnecessary updates
3. **Debounce Refresh** - If getting too many updates, consider debouncing the list refresh

## Security

### Row Level Security (RLS)

Ensure Supabase RLS policies allow users to:
- Read from `b2b_quotes` table based on their permissions
- Receive realtime updates for allowed rows

Example RLS policy:
```sql
CREATE POLICY "Users can view quotes based on permissions"
ON b2b_quotes
FOR SELECT
USING (
  auth.uid() IN (
    SELECT user_id
    FROM user_permissions up
    JOIN permissions p ON up.permission_id = p.id
    WHERE p.name IN ('b2b.view', 'b2b.notification')
  )
  OR
  created_by_employee_id = auth.uid()
);
```

## Future Enhancements

Potential improvements:
- [ ] Sound notifications for important events
- [ ] Notification preferences (enable/disable specific event types)
- [ ] Notification history/log
- [ ] Desktop notifications API integration
- [ ] Filtering by quote stage/status
- [ ] Batch notification for multiple simultaneous changes

## Support

For issues or questions:
1. Check browser console for errors
2. Verify database permissions
3. Test Supabase realtime connection
4. Review this documentation

---

**Version**: 1.0.0
**Last Updated**: January 2025
**Maintained By**: Development Team
