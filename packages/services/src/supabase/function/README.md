# Supabase Edge Function: Push Notification

## 📋 Tổng Quan

Edge Function để gửi push notifications đến nhân viên qua Firebase Cloud Messaging (FCM).

### Chức Năng

1. ✅ Tạo notifications trong database
2. ✅ Lấy FCM tokens của employees
3. ✅ Gửi push notifications qua Firebase Admin SDK
4. ✅ Cập nhật status `sent_to_fcm`
5. ✅ Tự động đánh dấu failed tokens là inactive

---

## 🚀 Deploy Edge Function

### 1. Install Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# Windows (via Scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### 2. Login to Supabase

```bash
supabase login
```

### 3. Link Project

```bash
# Từ root directory của project
supabase link --project-ref your-project-ref
```

### 4. Deploy Function

```bash
# Deploy từ thư mục này
supabase functions deploy push-notification

# Hoặc từ root
supabase functions deploy push-notification --project-ref your-project-ref
```

### 5. Set Environment Variables

```bash
# Trong Supabase Dashboard > Edge Functions > push-notification > Settings
# Thêm các biến môi trường:
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## 💻 Cách Sử Dụng

### Request Format

**Endpoint:** `https://your-project.supabase.co/functions/v1/push-notification`

**Method:** `POST`

**Headers:**

```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer YOUR_ANON_KEY"
}
```

**Body:**

```json
{
  "employee_ids": ["uuid1", "uuid2", "uuid3"],
  "notification_type": "order_new",
  "title": "Đơn Hàng Mới",
  "body": "Bạn có 1 đơn hàng mới #12345",
  "priority": "high",
  "metadata": {
    "order_id": 12345,
    "customer_name": "Nguyễn Văn A",
    "total": 1000000
  },
  "action_url": "/orders/12345",
  "action_label": "Xem đơn hàng",
  "icon": "shopping-cart",
  "image_url": "https://example.com/image.jpg",
  "created_by": "admin-uuid"
}
```

### Response Format

**Success:**

```json
{
  "success": true,
  "notifications_created": 3,
  "fcm_tokens_found": 3,
  "fcm_sent_success": 3,
  "fcm_sent_failed": 0,
  "notification_ids": [1, 2, 3]
}
```

**Error:**

```json
{
  "error": "employee_ids is required and must be an array"
}
```

---

## 📝 Examples

### 1. Gửi Thông Báo Đơn Hàng

```typescript
const response = await fetch(
  "https://your-project.supabase.co/functions/v1/push-notification",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      employee_ids: ["employee-uuid-1", "employee-uuid-2"],
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
    }),
  },
);

const result = await response.json();
console.log(result);
```

### 2. Gửi Cảnh Báo Tồn Kho

```typescript
await fetch("https://your-project.supabase.co/functions/v1/push-notification", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  },
  body: JSON.stringify({
    employee_ids: ["warehouse-manager-uuid"],
    notification_type: "inventory_low",
    title: "Cảnh Báo Tồn Kho",
    body: "Chai dầu gội Clear sắp hết hàng (còn 5 cái)",
    priority: "high",
    metadata: {
      product_id: 456,
      product_name: "Chai dầu gội Clear",
      current_quantity: 5,
      min_stock: 10,
    },
    action_url: "/products/456",
    action_label: "Xem sản phẩm",
    icon: "warning",
  }),
});
```

### 3. Gửi Nhắc Lịch Hẹn

```typescript
await fetch("https://your-project.supabase.co/functions/v1/push-notification", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  },
  body: JSON.stringify({
    employee_ids: ["doctor-uuid"],
    notification_type: "appointment_reminder",
    title: "Nhắc Lịch Hẹn",
    body: "Bạn có lịch hẹn với Trần Thị B lúc 14:00",
    priority: "high",
    metadata: {
      appointment_id: 789,
      patient_name: "Trần Thị B",
      time: "14:00",
      service: "Khám tổng quát",
    },
    action_url: "/appointments/789",
    action_label: "Xem lịch hẹn",
    icon: "calendar",
  }),
});
```

### 4. Gửi Broadcast Tới Nhiều Nhân Viên

```typescript
// Get all sales employees
const { data: salesEmployees } = await supabase
  .from("employees")
  .select("employee_id")
  .contains("role", ["sales"]);

const employeeIds = salesEmployees.map((e) => e.employee_id);

// Send notification
await fetch("https://your-project.supabase.co/functions/v1/push-notification", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  },
  body: JSON.stringify({
    employee_ids: employeeIds,
    notification_type: "system",
    title: "Thông Báo Hệ Thống",
    body: "Hệ thống sẽ bảo trì vào 22:00 hôm nay",
    priority: "high",
    metadata: {
      maintenance_time: "22:00",
      estimated_duration: "2 hours",
    },
  }),
});
```

---

## 🔧 Testing Locally

### 1. Start Supabase Locally

```bash
supabase start
```

### 2. Serve Function Locally

```bash
supabase functions serve push-notification --env-file ./supabase/.env.local
```

### 3. Test with cURL

```bash
curl -i --location --request POST 'http://localhost:54321/functions/v1/push-notification' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "employee_ids": ["test-uuid"],
    "notification_type": "system",
    "title": "Test Notification",
    "body": "This is a test",
    "priority": "normal"
  }'
```

---

## ⚙️ Configuration

### Required Parameters

- **employee_ids** (array): Danh sách UUID của employees cần gửi notification

### Optional Parameters

- **notification_type** (string): Loại thông báo (default: "other")
- **title** (string): Tiêu đề thông báo
- **body** (string): Nội dung thông báo
- **priority** (string): "low" | "normal" | "high" | "urgent" (default: "normal")
- **metadata** (object): Dữ liệu bổ sung (JSONB)
- **action_url** (string): URL để navigate khi click
- **action_label** (string): Text cho action button
- **icon** (string): Icon URL hoặc tên
- **image_url** (string): Image URL cho notification
- **created_by** (UUID): ID của người tạo notification

---

## 📊 Monitoring

### View Logs

```bash
# View function logs
supabase functions logs push-notification

# Follow logs in realtime
supabase functions logs push-notification --follow
```

### Check Notifications in Database

```sql
-- Recent notifications
SELECT * FROM notifications
ORDER BY created_at DESC
LIMIT 10;

-- FCM sent status
SELECT
  notification_type,
  COUNT(*) as total,
  SUM(CASE WHEN sent_to_fcm THEN 1 ELSE 0 END) as sent,
  SUM(CASE WHEN NOT sent_to_fcm THEN 1 ELSE 0 END) as not_sent
FROM notifications
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY notification_type;
```

---

## 🚨 Error Handling

### Common Errors

1. **"employee_ids is required"**
   - Payload thiếu hoặc sai format employee_ids

2. **"No active FCM tokens found"**
   - Employees chưa có FCM tokens hoặc tokens đã bị deactivate
   - Notification vẫn được tạo trong DB nhưng không gửi FCM

3. **"Error creating notifications"**
   - Lỗi insert vào database
   - Check schema và constraints

4. **FCM send failed**
   - Invalid FCM token
   - Token bị revoked
   - Function sẽ tự động mark token là inactive

---

## 🔐 Security

### RLS (Row Level Security)

Edge Function sử dụng `SUPABASE_SERVICE_ROLE_KEY` nên bypass RLS. Cần implement authorization trong function nếu cần.

### Best Practices

1. Validate input trong function
2. Limit số lượng employee_ids trong 1 request (e.g., max 100)
3. Rate limiting để tránh abuse
4. Log errors để monitor
5. Implement authentication/authorization nếu cần

---

## 📝 Notes

- ✅ Function tự động tạo notification trong DB trước khi gửi FCM
- ✅ Nếu FCM fail, notification vẫn tồn tại trong DB
- ✅ Failed tokens được tự động mark inactive
- ✅ Support metadata linh hoạt với JSONB
- ✅ Hỗ trợ gửi đến nhiều employees cùng lúc

---

## 🔗 Related Files

- `database/migrations/create_notifications_table.sql`
- `database/migrations/create_employee_fcm_tokens_table.sql`
- `packages/services/src/supabase/employeeNotificationService.ts`
- `NOTIFICATIONS_SYSTEM_GUIDE.md`

---

**Last Updated:** 2025-10-26
