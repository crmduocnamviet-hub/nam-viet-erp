# Hướng Dẫn Hệ Thống Thông Báo Hoàn Chỉnh

## 📋 Tổng Quan

Hệ thống thông báo tích hợp 2 phần:

1. **Database Notifications** - Lưu trữ thông báo trong database
2. **Firebase Cloud Messaging (FCM)** - Push notifications realtime

### Tính Năng

- ✅ Thông báo trong app (database)
- ✅ Push notifications (FCM)
- ✅ Phân loại thông báo theo type
- ✅ Metadata linh hoạt (JSONB)
- ✅ Read/Unread status
- ✅ Priority levels
- ✅ Realtime subscriptions
- ✅ Unread count badge
- ✅ Auto cleanup

---

## 🗂️ Database Schema

### Table: `notifications`

```sql
CREATE TABLE notifications (
  id BIGSERIAL PRIMARY KEY,
  employee_id UUID NOT NULL,
  notification_type VARCHAR(50) NOT NULL, -- Loại thông báo
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'normal',
  metadata JSONB DEFAULT '{}', -- Dữ liệu thêm
  action_url VARCHAR(500),
  action_label VARCHAR(100),
  icon VARCHAR(255),
  image_url VARCHAR(500),
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  sent_to_fcm BOOLEAN DEFAULT false,
  fcm_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  expires_at TIMESTAMPTZ
);
```

### Notification Types

```typescript
type NotificationType =
  | "order_new" // Đơn hàng mới
  | "order_updated" // Đơn hàng cập nhật
  | "order_cancelled" // Đơn hàng hủy
  | "inventory_low" // Hàng sắp hết
  | "inventory_expired" // Hàng hết hạn
  | "appointment_new" // Lịch hẹn mới
  | "appointment_reminder" // Nhắc lịch hẹn
  | "appointment_cancelled" // Lịch hẹn hủy
  | "quote_new" // Báo giá mới
  | "quote_updated" // Báo giá cập nhật
  | "purchase_order" // Đơn nhập hàng
  | "payment_due" // Nhắc thanh toán
  | "task_assigned" // Công việc được giao
  | "system" // Thông báo hệ thống
  | "other"; // Khác
```

### Priority Levels

```typescript
type NotificationPriority = "low" | "normal" | "high" | "urgent";
```

---

## 🚀 Setup

### 1. Chạy Migrations

```bash
# Run in Supabase SQL Editor
database/migrations/create_notifications_table.sql
database/migrations/create_employee_fcm_tokens_table.sql
```

### 2. Thêm VAPID Key

```env
# apps/sale/.env
VITE_FIREBASE_VAPID_KEY=your-vapid-key-here
```

---

## 💻 Sử Dụng

### 1. Deploy Edge Function (One-time Setup)

**Supabase Edge Function** được sử dụng để gửi push notifications từ server.

#### Deploy Steps:

```bash
# 1. Install Supabase CLI
brew install supabase/tap/supabase

# 2. Login
supabase login

# 3. Link project
supabase link --project-ref your-project-ref

# 4. Deploy function
supabase functions deploy push-notification
```

Chi tiết xem: `packages/services/src/supabase/function/README.md`

### 2. Initialize Notification System (Frontend)

```typescript
import { notificationService } from "@nam-viet-erp/services";

// Khi user login
const initializeNotifications = async (employee) => {
  const { fcmToken, unreadCount, unsubscribe } =
    await notificationService.initializeCompleteNotificationSystem(
      employee.employee_id,
      "Nam Viet Sale App",
      (notification) => {
        // Callback khi có notification mới
        console.log("New notification:", notification);

        // Update UI: badge count, show toast, etc.
        updateUnreadBadge(unreadCount + 1);
        showToastNotification(notification);
      },
    );

  console.log("FCM Token:", fcmToken);
  console.log("Unread count:", unreadCount);

  // Cleanup on logout
  return unsubscribe;
};
```

### 3. Send Push Notifications (Recommended)

Sử dụng helper functions để gửi push notifications qua Edge Function:

#### a. Order Notification

```typescript
import { sendOrderPushNotification } from "@nam-viet-erp/services";

// Gửi thông báo đơn hàng mới
await sendOrderPushNotification(
  ["employee-uuid-1", "employee-uuid-2"], // employee IDs
  12345, // order ID
  {
    customerName: "Nguyễn Văn A",
    total: 1000000,
    status: "pending",
  },
  "order_new",
  currentUserId, // created_by (optional)
);
```

#### b. Inventory Notification

```typescript
import { sendInventoryPushNotification } from "@nam-viet-erp/services";

// Cảnh báo hàng sắp hết
await sendInventoryPushNotification(
  ["warehouse-manager-uuid"],
  456, // product ID
  {
    productName: "Chai dầu gội Clear",
    currentQuantity: 5,
    minStock: 10,
  },
  "inventory_low",
);
```

#### c. Appointment Notification

```typescript
import { sendAppointmentPushNotification } from "@nam-viet-erp/services";

// Nhắc lịch hẹn
await sendAppointmentPushNotification(
  ["doctor-uuid"],
  789, // appointment ID
  {
    patientName: "Trần Thị B",
    time: "14:00",
    service: "Khám tổng quát",
  },
  "appointment_reminder",
);
```

#### d. System Notification

```typescript
import { sendSystemPushNotification } from "@nam-viet-erp/services";

// Thông báo hệ thống
await sendSystemPushNotification(
  ["employee-uuid-1", "employee-uuid-2"],
  "Bảo Trì Hệ Thống",
  "Hệ thống sẽ bảo trì vào 22:00 hôm nay",
  {
    maintenance_time: "22:00",
    estimated_duration: "2 hours",
  },
  "high",
);
```

#### e. Broadcast by Role

```typescript
import { broadcastPushNotificationByRole } from "@nam-viet-erp/services";

// Gửi đến tất cả sales employees
await broadcastPushNotificationByRole(
  ["sales", "sales_manager"],
  {
    notification_type: "system",
    title: "Thông Báo Quan Trọng",
    body: "Meeting toàn bộ team sales lúc 15:00",
    priority: "high",
    metadata: {
      meeting_time: "15:00",
      location: "Phòng họp A",
    },
  },
  currentUserId,
);
```

### 4. Create Notifications in Database Only (Without Push)

Nếu chỉ muốn tạo notification trong database mà không gửi push:

#### a. Tạo Thông Báo Đơn Giản

```typescript
import { createNotification } from "@nam-viet-erp/services";

await createNotification({
  employee_id: "employee-uuid",
  notification_type: "order_new",
  title: "Đơn Hàng Mới",
  body: "Đơn hàng #12345 từ Nguyễn Văn A - 1,000,000đ",
  priority: "high",
  metadata: {
    order_id: 12345,
    customer_name: "Nguyễn Văn A",
    total: 1000000,
  },
  action_url: "/orders/12345",
  action_label: "Xem đơn hàng",
  icon: "shopping-cart",
});
```

#### b. Sử Dụng Helper Functions

```typescript
import {
  createOrderNotification,
  createInventoryNotification,
  createAppointmentNotification,
} from "@nam-viet-erp/services";

// Order notification
await createOrderNotification(
  employeeId,
  orderId,
  {
    customerName: "Nguyễn Văn A",
    total: 1000000,
    status: "pending",
  },
  "order_new",
);

// Inventory notification
await createInventoryNotification(
  employeeId,
  productId,
  {
    productName: "Chai dầu gội Clear",
    currentQuantity: 5,
    minStock: 10,
  },
  "inventory_low",
);

// Appointment notification
await createAppointmentNotification(
  employeeId,
  appointmentId,
  {
    patientName: "Trần Thị B",
    time: "14:00",
    service: "Khám tổng quát",
  },
  "appointment_new",
);
```

### 5. Get Notifications (Frontend)

```typescript
import {
  getNotifications,
  getUnreadNotifications,
  getUnreadNotificationCount,
} from "@nam-viet-erp/services";

// Get all notifications
const { data, count } = await getNotifications(employeeId, {
  limit: 20,
  offset: 0,
});

// Get unread only
const { data: unread } = await getUnreadNotifications(employeeId);

// Get unread count
const unreadCount = await getUnreadNotificationCount(employeeId);
```

### 6. Mark as Read

```typescript
import {
  markNotificationAsRead,
  markNotificationsAsRead,
  markAllNotificationsAsRead,
} from "@nam-viet-erp/services";

// Mark single notification
await markNotificationAsRead(notificationId);

// Mark multiple
await markNotificationsAsRead([id1, id2, id3]);

// Mark all as read
await markAllNotificationsAsRead(employeeId);
```

### 7. Filter Notifications

```typescript
// By type
const { data: orders } = await getNotificationsByType(
  employeeId,
  "order_new",
  10,
);

// By priority
const { data: urgent } = await getNotifications(employeeId, {
  priority: "urgent",
  limit: 10,
});

// By read status
const { data: unread } = await getNotifications(employeeId, {
  isRead: false,
  limit: 20,
});
```

### 8. Delete Notifications

```typescript
import {
  deleteNotification,
  deleteNotifications,
  deleteReadNotifications,
} from "@nam-viet-erp/services";

// Delete single
await deleteNotification(notificationId);

// Delete multiple
await deleteNotifications([id1, id2, id3]);

// Delete all read
await deleteReadNotifications(employeeId);
```

---

## 📱 UI Implementation Example

### React Component - Notification Bell

```tsx
import React, { useEffect, useState } from "react";
import { Badge, Dropdown, Menu, Button, List } from "antd";
import { BellOutlined } from "@ant-design/icons";
import {
  notificationService,
  getUnreadNotifications,
  markNotificationAsRead,
  type INotification,
} from "@nam-viet-erp/services";

const NotificationBell: React.FC = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadNotifications();

    // Subscribe to new notifications
    const unsubscribe = notificationService.subscribeToEmployeeNotifications(
      (notification) => {
        setNotifications((prev) => [notification, ...prev]);
        setUnreadCount((prev) => prev + 1);
      },
    );

    return () => {
      unsubscribe();
    };
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    const employeeId = notificationService.getCurrentEmployeeId();
    if (employeeId) {
      const { data } = await getUnreadNotifications(employeeId, 10);
      setNotifications(data || []);
      setUnreadCount(data?.length || 0);
    }
    setLoading(false);
  };

  const handleNotificationClick = async (notification: INotification) => {
    // Mark as read
    await markNotificationAsRead(notification.id);
    setUnreadCount((prev) => Math.max(0, prev - 1));

    // Navigate
    if (notification.action_url) {
      window.location.href = notification.action_url;
    }
  };

  const menu = (
    <Menu style={{ maxWidth: 400, maxHeight: 500, overflow: "auto" }}>
      {notifications.length === 0 ? (
        <Menu.Item disabled>Không có thông báo mới</Menu.Item>
      ) : (
        notifications.map((notification) => (
          <Menu.Item
            key={notification.id}
            onClick={() => handleNotificationClick(notification)}
          >
            <div>
              <strong>{notification.title}</strong>
              <p style={{ margin: 0, color: "#666" }}>{notification.body}</p>
              <small style={{ color: "#999" }}>
                {new Date(notification.created_at).toLocaleString("vi-VN")}
              </small>
            </div>
          </Menu.Item>
        ))
      )}
    </Menu>
  );

  return (
    <Dropdown overlay={menu} trigger={["click"]}>
      <Badge count={unreadCount} size="small">
        <Button
          type="text"
          icon={<BellOutlined style={{ fontSize: 20 }} />}
          size="large"
        />
      </Badge>
    </Dropdown>
  );
};

export default NotificationBell;
```

---

## 🔧 Advanced Usage

### 1. Custom Notification Types

Thêm type mới trong migration:

```sql
ALTER TABLE notifications
DROP CONSTRAINT notifications_notification_type_check;

ALTER TABLE notifications
ADD CONSTRAINT notifications_notification_type_check
CHECK (notification_type IN (
  'order_new', 'order_updated', 'order_cancelled',
  'inventory_low', 'inventory_expired',
  'appointment_new', 'appointment_reminder', 'appointment_cancelled',
  'quote_new', 'quote_updated',
  'purchase_order', 'payment_due', 'task_assigned',
  'system', 'other',
  'custom_type_1', 'custom_type_2' -- Thêm types mới
));
```

### 2. Metadata Examples

```typescript
// Order notification
metadata: {
  order_id: 123,
  customer_name: "ABC",
  total: 1000000,
  items_count: 5,
  payment_status: "pending"
}

// Inventory notification
metadata: {
  product_id: 456,
  product_name: "Product X",
  current_quantity: 5,
  min_stock: 10,
  warehouse_id: 1
}

// Appointment notification
metadata: {
  appointment_id: 789,
  patient_id: "patient-uuid",
  patient_name: "Nguyen Van A",
  time: "14:00",
  date: "2025-10-26",
  service: "Khám tổng quát",
  doctor_id: "doctor-uuid"
}

// Task notification
metadata: {
  task_id: 999,
  task_title: "Kiểm kho",
  deadline: "2025-10-30",
  assigned_by: "manager-uuid",
  assigned_by_name: "Quản lý X"
}
```

### 3. Send to Multiple Employees

```typescript
import { createNotifications } from "@nam-viet-erp/services";

const employeeIds = ["uuid1", "uuid2", "uuid3"];

await createNotifications(
  employeeIds.map((id) => ({
    employee_id: id,
    notification_type: "system",
    title: "Thông Báo Hệ Thống",
    body: "Hệ thống sẽ bảo trì vào 22:00 hôm nay",
    priority: "high",
    metadata: {
      maintenance_time: "22:00",
      estimated_duration: "2 hours",
    },
  })),
);
```

### 4. Query with Metadata

```typescript
// Get notifications by metadata field
const { data } = await supabase
  .from("notifications")
  .select("*")
  .eq("employee_id", employeeId)
  .contains("metadata", { order_id: 12345 });

// Search in metadata
const { data: lowStock } = await supabase
  .from("notifications")
  .select("*")
  .eq("notification_type", "inventory_low")
  .lt("metadata->current_quantity", 10);
```

---

## 📊 Analytics & Reports

### Notification Statistics

```sql
-- Most common notification types
SELECT notification_type, COUNT(*) as count
FROM notifications
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY notification_type
ORDER BY count DESC;

-- Unread notifications by employee
SELECT employee_id, COUNT(*) as unread_count
FROM notifications
WHERE is_read = false
GROUP BY employee_id
ORDER BY unread_count DESC;

-- Average response time (time to read)
SELECT
  notification_type,
  AVG(EXTRACT(EPOCH FROM (read_at - created_at))) / 60 as avg_minutes_to_read
FROM notifications
WHERE read_at IS NOT NULL
GROUP BY notification_type;
```

---

## 🎯 Best Practices

1. **Priority Usage**:
   - `urgent`: Critical issues (system down, payment failed)
   - `high`: Important actions (new order, low stock)
   - `normal`: Regular updates (order status change)
   - `low`: Informational (newsletter, tips)

2. **Metadata Guidelines**:
   - Always include IDs (order_id, product_id, etc.)
   - Include display info (names, amounts)
   - Keep it flat when possible
   - Don't store large objects

3. **Cleanup Strategy**:
   - Set `expires_at` for time-sensitive notifications
   - Periodically delete old read notifications
   - Archive instead of delete for analytics

4. **Performance**:
   - Use pagination for notification lists
   - Index frequently queried metadata fields
   - Limit realtime subscriptions
   - Cache unread counts

---

## 📝 Files Liên Quan

### Database

- `database/migrations/create_notifications_table.sql` - Notifications table
- `database/migrations/create_employee_fcm_tokens_table.sql` - FCM tokens table

### Services

- `packages/services/src/supabase/employeeNotificationService.ts` - Notification CRUD
- `packages/services/src/supabase/notificationService.ts` - Realtime & FCM
- `packages/services/src/supabase/pushNotificationHelper.ts` - Push notification helpers
- `packages/services/src/firebase/fcmService.ts` - FCM functions

### Edge Function

- `packages/services/src/supabase/function/push-notification.js` - Supabase Edge Function
- `packages/services/src/supabase/function/README.md` - Edge Function guide
- `packages/services/src/supabase/function/deno.json` - Deno config

---

## ✅ Checklist

- [x] Database migrations
- [x] Notification service
- [x] FCM integration
- [x] Helper functions
- [x] Push notification Edge Function
- [x] Documentation
- [ ] Run migrations ⚠️ **BẠN CẦN LÀM**
- [ ] Deploy Edge Function ⚠️ **BẠN CẦN LÀM**
- [ ] Add VAPID key ⚠️ **BẠN CẦN LÀM**
- [ ] Implement NotificationBell component ⚠️ **BẠN CẦN LÀM**
- [ ] Initialize on login ⚠️ **BẠN CẦN LÀM**
- [ ] Test notifications ⚠️ **BẠN CẦN LÀM**

---

## 🎯 Next Steps

1. **Run migrations** trong Supabase:
   - `create_notifications_table.sql`
   - `create_employee_fcm_tokens_table.sql`

2. **Deploy Edge Function**:

   ```bash
   supabase functions deploy push-notification
   ```

3. **Add VAPID key** vào `.env`:

   ```env
   VITE_FIREBASE_VAPID_KEY=your-vapid-key
   ```

4. **Implement NotificationBell** component (xem example trong guide)

5. **Initialize notifications** when user logs in

6. **Test** gửi push notifications:

   ```typescript
   import { sendOrderPushNotification } from "@nam-viet-erp/services";

   await sendOrderPushNotification(
     ["employee-uuid"],
     12345,
     {
       customerName: "Test",
       total: 100000,
       status: "pending",
     },
     "order_new",
   );
   ```

---

**Status**: ✅ Implementation completed
**Dependencies**: Supabase, Firebase

🎉 Hệ thống thông báo hoàn chỉnh!
