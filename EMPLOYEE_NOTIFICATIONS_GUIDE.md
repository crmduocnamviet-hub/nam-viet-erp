# Hướng Dẫn Hệ Thống Thông Báo Nhân Viên

## 📋 Tổng Quan

Hệ thống thông báo sử dụng Firebase Cloud Messaging (FCM) để gửi push notifications đến từng nhân viên, hỗ trợ:

- ✅ Thông báo realtime cho từng nhân viên
- ✅ Hỗ trợ nhiều thiết bị (Web, Android, iOS)
- ✅ Background notifications (khi app đang đóng)
- ✅ Foreground notifications (khi app đang mở)
- ✅ Quản lý FCM tokens tự động

---

## 🗂️ Database Schema

### Table: `employee_fcm_tokens`

```sql
CREATE TABLE employee_fcm_tokens (
  id BIGSERIAL PRIMARY KEY,
  employee_id UUID NOT NULL,
  fcm_token TEXT NOT NULL UNIQUE,
  device_type VARCHAR(20) CHECK (device_type IN ('web', 'android', 'ios')),
  device_name VARCHAR(255),
  user_agent TEXT,
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🚀 Setup & Configuration

### 1. Chạy Migration

Tạo bảng `employee_fcm_tokens` trong Supabase:

```bash
# Copy SQL từ file và chạy trong Supabase SQL Editor
database/migrations/create_employee_fcm_tokens_table.sql
```

### 2. Cấu Hình Firebase

Hệ thống đã được cấu hình sẵn với Firebase project:

- **Project ID**: `nam-28831`
- **App ID**: `1:552206044423:web:62cb55f3f0d129025ec9a2`

**⚠️ Quan Trọng**: Cần thêm **VAPID Key** vào environment variables:

```env
# File: apps/sale/.env
VITE_FIREBASE_VAPID_KEY=your-vapid-key-here
```

**Lấy VAPID Key:**

1. Vào [Firebase Console](https://console.firebase.google.com/)
2. Chọn project `nam-28831`
3. Vào **Project Settings** → **Cloud Messaging** tab
4. Tìm phần **Web Push certificates**
5. Copy **Web Push certificate (VAPID key)**

### 3. Service Worker

Service worker đã được tạo tại:

```
apps/sale/public/firebase-messaging-sw.js
```

File này sẽ tự động xử lý background notifications.

---

## 💻 Cách Sử Dụng

### 1. Initialize Notifications Khi Login

Khi nhân viên đăng nhập, khởi tạo push notifications:

```typescript
import { notificationService } from "@nam-viet-erp/services";

// Trong component Login hoặc App initialization
const handleLogin = async (employee) => {
  // ... existing login logic

  // Initialize push notifications
  await notificationService.initializePushNotifications(
    employee.employee_id,
    "Web App", // Device name (optional)
  );

  // Setup listener for incoming notifications
  notificationService.setupPushNotificationListener((notification) => {
    console.log("Notification received:", notification);

    // Custom handling (e.g., update UI, play sound, etc.)
    // Notification sẽ tự động hiển thị dưới dạng browser notification
  });
};
```

### 2. Kiểm Tra Trạng Thái

```typescript
// Check if push notifications are enabled
const isEnabled = notificationService.isPushNotificationsEnabled();

// Get current employee ID
const employeeId = notificationService.getCurrentEmployeeId();
```

### 3. Gửi Notification (Backend)

**Note**: Sending notifications phải được thực hiện từ server/backend, KHÔNG phải từ client.

Bạn cần tạo Cloud Function hoặc backend API endpoint để gửi notifications:

```typescript
// Backend code (Node.js example)
import admin from "firebase-admin";

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccountKey),
});

// Function to send notification to an employee
async function sendNotificationToEmployee(
  employeeId: string,
  notification: {
    title: string;
    body: string;
    data?: any;
    link?: string;
  },
) {
  // Get all active FCM tokens for this employee from Supabase
  const { data: tokens } = await supabase
    .from("employee_fcm_tokens")
    .select("fcm_token")
    .eq("employee_id", employeeId)
    .eq("is_active", true);

  if (!tokens || tokens.length === 0) {
    console.log("No active tokens for employee:", employeeId);
    return;
  }

  // Send to all tokens
  const fcmTokens = tokens.map((t) => t.fcm_token);

  const message = {
    notification: {
      title: notification.title,
      body: notification.body,
      icon: "/logo.png",
    },
    data: {
      ...notification.data,
      link: notification.link || "/",
    },
    tokens: fcmTokens,
  };

  const response = await admin.messaging().sendMulticast(message);

  console.log("Notifications sent:", response.successCount);
  console.log("Failed:", response.failureCount);

  // Update last_used_at for successful tokens
  // Remove invalid tokens if needed
}
```

### 4. Use Cases

#### a. Thông Báo Đơn Hàng Mới

```typescript
// Backend
await sendNotificationToEmployee(employeeId, {
  title: "Đơn Hàng Mới",
  body: "Bạn có 1 đơn hàng mới cần xử lý #12345",
  link: "/orders/12345",
  data: {
    type: "new_order",
    orderId: "12345",
  },
});
```

#### b. Thông Báo Inventory Low Stock

```typescript
// Backend
await sendNotificationToEmployee(employeeId, {
  title: "Cảnh Báo Hết Hàng",
  body: "Sản phẩm XYZ sắp hết hàng (còn 5 cái)",
  link: "/products/xyz",
  data: {
    type: "low_stock",
    productId: "xyz",
    quantity: 5,
  },
});
```

#### c. Thông Báo Appointment

```typescript
// Backend
await sendNotificationToEmployee(employeeId, {
  title: "Lịch Hẹn Sắp Tới",
  body: "Bạn có lịch hẹn với khách hàng ABC lúc 14:00",
  link: "/appointments/456",
  data: {
    type: "appointment",
    appointmentId: "456",
    time: "14:00",
  },
});
```

---

## 📱 Frontend Implementation Example

### React Component Example

```tsx
import React, { useEffect } from "react";
import { notificationService } from "@nam-viet-erp/services";
import { notification as antNotification } from "antd";

const AppWithNotifications: React.FC = ({ children }) => {
  useEffect(() => {
    // Get current user
    const currentUser = getCurrentUser(); // Your user management logic

    if (currentUser?.employee_id) {
      // Initialize push notifications
      notificationService.initializePushNotifications(
        currentUser.employee_id,
        "Nam Viet Sale App",
      );

      // Setup listener
      notificationService.setupPushNotificationListener((notification) => {
        // Show Ant Design notification in app
        antNotification.info({
          message: notification.title,
          description: notification.body,
          duration: 5,
          onClick: () => {
            if (notification.link) {
              window.location.href = notification.link;
            }
          },
        });
      });
    }

    // Cleanup on unmount
    return () => {
      // Notifications will persist across sessions
    };
  }, []);

  return <>{children}</>;
};

export default AppWithNotifications;
```

---

## 🔧 API Reference

### notificationService

#### `initializePushNotifications(employeeId, deviceName?)`

Khởi tạo push notifications cho nhân viên.

**Parameters:**

- `employeeId` (string): UUID của employee
- `deviceName` (string, optional): Tên thiết bị

**Returns:** `Promise<string | null>` - FCM token hoặc null nếu thất bại

#### `setupPushNotificationListener(callback?)`

Setup listener cho foreground notifications.

**Parameters:**

- `callback` (function, optional): Custom callback khi nhận notification

#### `isPushNotificationsEnabled()`

Kiểm tra xem push notifications đã được enable chưa.

**Returns:** `boolean`

#### `getCurrentEmployeeId()`

Lấy employee ID hiện tại.

**Returns:** `string | null`

### fcmService

#### `registerFCMToken(employeeId, fcmToken, deviceType, deviceName?)`

Đăng ký FCM token mới.

#### `unregisterFCMToken(fcmToken)`

Hủy đăng ký FCM token.

#### `getEmployeeFCMTokens(employeeId)`

Lấy tất cả active tokens của một employee.

#### `getEmployeesFCMTokens(employeeIds)`

Lấy active tokens của nhiều employees.

---

## 📊 Monitoring & Analytics

### 1. Kiểm Tra Tokens Đã Đăng Ký

```sql
-- Get all active tokens for an employee
SELECT * FROM employee_fcm_tokens
WHERE employee_id = 'your-employee-uuid'
AND is_active = true;

-- Count tokens by device type
SELECT device_type, COUNT(*) as count
FROM employee_fcm_tokens
WHERE is_active = true
GROUP BY device_type;
```

### 2. Cleanup Inactive Tokens

```typescript
import { cleanupInactiveFCMTokens } from "@nam-viet-erp/services";

// Run periodically (e.g., via cron job)
await cleanupInactiveFCMTokens(90); // Remove tokens inactive for 90+ days
```

---

## ⚠️ Troubleshooting

### 1. Không Nhận Được Notifications

**Check:**

- ✅ Browser notification permission đã được granted
- ✅ VAPID key đã được cấu hình đúng
- ✅ Service worker đã được registered
- ✅ FCM token đã được lưu vào database
- ✅ Kiểm tra console logs

```typescript
// Debug
console.log("FCM Enabled:", notificationService.isPushNotificationsEnabled());
console.log("Employee ID:", notificationService.getCurrentEmployeeId());
```

### 2. Service Worker Không Load

**Check:**

- ✅ File `firebase-messaging-sw.js` phải ở trong `public` folder
- ✅ Đường dẫn phải là `/firebase-messaging-sw.js`
- ✅ HTTPS required (không chạy được trên HTTP)

### 3. Permission Denied

User cần manually grant permission:

```typescript
// Check permission status
console.log("Permission:", Notification.permission);

// Request again if denied
if (Notification.permission === "denied") {
  alert("Please enable notifications in browser settings");
}
```

---

## 🎯 Best Practices

1. **Initialize Once**: Chỉ initialize FCM một lần khi user login
2. **Handle Errors**: Luôn wrap FCM calls trong try-catch
3. **Cleanup**: Đánh dấu tokens là inactive khi user logout
4. **Rate Limiting**: Không gửi quá nhiều notifications cùng lúc
5. **Relevant Content**: Chỉ gửi notifications quan trọng và liên quan
6. **Testing**: Test trên nhiều browsers và devices

---

## 📝 Files Liên Quan

### Backend

- `database/migrations/create_employee_fcm_tokens_table.sql` - Database schema
- `packages/services/src/firebase/index.ts` - Firebase initialization
- `packages/services/src/fcmService.ts` - FCM service functions
- `packages/services/src/supabase/notificationService.ts` - Notification service

### Frontend

- `apps/sale/public/firebase-messaging-sw.js` - Service worker
- Your app component để initialize notifications

---

## ✅ Checklist Triển Khai

- [x] Firebase Cloud Messaging setup
- [x] Database migration for employee_fcm_tokens
- [x] FCM service functions
- [x] NotificationService integration
- [x] Service worker for background notifications
- [ ] Add VAPID key to .env ⚠️ **BẠN CẦN LÀM**
- [ ] Run database migration ⚠️ **BẠN CẦN LÀM**
- [ ] Initialize notifications on login ⚠️ **BẠN CẦN LÀM**
- [ ] Create backend API to send notifications ⚠️ **BẠN CẦN LÀM**
- [ ] Test on multiple devices

---

## 🎯 Next Steps

1. **Thêm VAPID Key** vào `.env` file
2. **Run migration** để tạo bảng `employee_fcm_tokens`
3. **Initialize notifications** trong app khi user login
4. **Tạo backend API** để gửi notifications
5. **Test** hệ thống với một vài employees

---

**Status**: ✅ Core implementation completed
**Risk**: Low
**Dependencies**: Firebase, Supabase

🎉 Hệ thống thông báo đã sẵn sàng sử dụng!
