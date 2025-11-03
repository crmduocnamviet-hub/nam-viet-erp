# Supabase Edge Functions

Thư mục này chứa các Edge Functions của Supabase cho nam-viet-erp.

## Danh sách Edge Functions

### 1. process-sale-order

Xử lý đơn hàng POS một cách atomic và an toàn hơn trên server-side.

**Chức năng:**

- Kiểm tra số lượng lô hàng (pre-flight check)
- Tạo sales order và sales order items
- Tạo financial transaction record
- Cập nhật inventory
- Giảm số lượng lô hàng (lot quantities)
- Tạo VAT invoice tự động

**Ưu điểm so với client-side processing:**

- ✅ Atomic transactions - đảm bảo tính nhất quán dữ liệu
- ✅ Bảo mật hơn - service role key chỉ tồn tại trên server
- ✅ Tập trung business logic - dễ maintain
- ✅ Rollback tốt hơn khi có lỗi

## Cài đặt và Deploy

### Yêu cầu

1. **Supabase CLI** - Cài đặt Supabase CLI:

```bash
npm install -g supabase
```

2. **Supabase Project** - Đảm bảo đã tạo project trên Supabase

3. **Environment Variables** - Cấu hình các biến môi trường trong `.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Bước 1: Login vào Supabase

```bash
supabase login
```

### Bước 2: Link project

```bash
supabase link --project-ref your-project-ref
```

### Bước 3: Deploy Edge Function

Deploy một function cụ thể:

```bash
supabase functions deploy process-sale-order
```

Deploy tất cả functions:

```bash
supabase functions deploy
```

### Bước 4: Set Environment Secrets

Edge functions cần truy cập vào service role key:

```bash
# Set SUPABASE_SERVICE_ROLE_KEY secret
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Set SUPABASE_URL secret
supabase secrets set SUPABASE_URL=https://your-project.supabase.co
```

### Bước 5: Chạy Migration

Trước khi sử dụng edge function, cần chạy migration để tạo database function:

```bash
# Apply all pending migrations
supabase db push

# Or apply specific migration
psql -h your-db-host -U postgres -d postgres -f supabase/migrations/20251102224725_create_deduct_lot_quantity_function.sql
```

## Testing Edge Function Locally

### Bước 1: Start Supabase Local Development

```bash
supabase start
```

### Bước 2: Serve Edge Functions Locally

```bash
supabase functions serve process-sale-order
```

### Bước 3: Test với curl hoặc HTTP client

```bash
curl -i --location --request POST 'http://localhost:54321/functions/v1/process-sale-order' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "cart": [...],
    "total": 100000,
    "paymentMethod": "cash",
    "warehouseId": 1,
    "fundId": 1,
    "createdBy": "employee-uuid",
    "customerId": "patient-uuid"
  }'
```

## Monitoring và Logs

### Xem logs của edge function:

```bash
# Real-time logs
supabase functions logs process-sale-order --tail

# Logs với filter
supabase functions logs process-sale-order --filter "error"
```

### Kiểm tra health của function:

```bash
curl https://your-project.supabase.co/functions/v1/process-sale-order
```

## Rollback

Nếu cần rollback về version cũ:

```bash
# List all deployments
supabase functions list

# Rollback to specific version
supabase functions rollback process-sale-order --version <version-id>
```

## Troubleshooting

### Lỗi "Missing authorization header"

- Đảm bảo client đang gửi token trong header: `Authorization: Bearer <token>`

### Lỗi "VITE_SUPABASE_URL is not configured"

- Kiểm tra file .env có đúng VITE_SUPABASE_URL không
- Rebuild client sau khi cập nhật .env

### Lỗi database function không tồn tại

- Chạy migration: `supabase db push`
- Kiểm tra migration đã apply: `supabase db diff`

### Lỗi "Could not verify lot quantities"

- Kiểm tra table product_lots có tồn tại không
- Kiểm tra RLS policies cho product_lots

## Best Practices

1. **Testing**: Luôn test edge function locally trước khi deploy production
2. **Logging**: Sử dụng console.log để log các bước quan trọng
3. **Error Handling**: Luôn catch errors và return response có ý nghĩa
4. **Rollback Strategy**: Giữ lại old client-side code để có thể rollback nhanh
5. **Monitoring**: Theo dõi logs thường xuyên để phát hiện issues sớm

## Migration từ Client-side sang Edge Function

Trong `posStore.ts`, code đã được cập nhật để sử dụng edge function:

```typescript
// Old way (deprecated)
const result = await processSaleTransaction(paymentData, inventory);

// New way (recommended)
const result = await processSaleTransactionViaEdgeFunction(
  paymentData,
  inventory,
);
```

Function cũ `processSaleTransaction` vẫn còn để fallback nếu cần.

## Support

Nếu gặp vấn đề, tham khảo:

- [Supabase Edge Functions Documentation](https://supabase.com/docs/guides/functions)
- [Deno Documentation](https://deno.land/manual)
