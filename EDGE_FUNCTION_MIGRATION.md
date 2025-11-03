# Migration: POS Order Processing to Edge Functions

## Tổng quan

Đã chuyển logic xử lý đơn hàng POS từ **client-side** sang **server-side** (Supabase Edge Functions) để đảm bảo:

- ✅ **Atomic transactions** - Tính nhất quán dữ liệu tốt hơn
- ✅ **Security** - Service role key chỉ tồn tại trên server
- ✅ **Centralized logic** - Dễ bảo trì và mở rộng
- ✅ **Better rollback** - Xử lý lỗi và rollback tốt hơn

## Các thay đổi đã thực hiện

### 1. Tạo Edge Function

**File:** `supabase/functions/process-sale-order/index.ts`

Edge function này thực hiện tất cả các bước xử lý đơn hàng:

1. **Pre-flight check** - Kiểm tra số lượng lô hàng
2. **Create sales order** - Tạo đơn hàng
3. **Create order items** - Tạo chi tiết đơn hàng (regular + combo)
4. **Create transaction** - Tạo giao dịch tài chính
5. **Update inventory** - Cập nhật kho
6. **Deduct lot quantities** - Giảm số lượng lô
7. **Create VAT invoices** - Tạo hóa đơn VAT tự động

**Đặc điểm:**

- Chạy trên Deno runtime
- Sử dụng CORS headers để hỗ trợ cross-origin requests
- Rollback tự động khi có lỗi
- Logging chi tiết cho debugging

### 2. Database Function

**File:** `supabase/migrations/20251102224725_create_deduct_lot_quantity_function.sql`

Tạo PostgreSQL function `deduct_lot_quantity()` để:

- Giảm số lượng lô một cách atomic
- Lock row khi update (FOR UPDATE)
- Validate số lượng trước khi deduct
- Return success/error status

**Cú pháp:**

```sql
SELECT * FROM deduct_lot_quantity(
  p_lot_id := 123,
  p_quantity := 5
);
```

### 3. Service Layer Updates

**File:** `packages/services/src/supabase/posService.ts`

Thêm function mới:

```typescript
export const processSaleTransactionViaEdgeFunction = async (
  paymentData: IProcessSale,
  _inventory?: IInventoryWithProduct[],
) => {
  // Gọi edge function
  const response = await fetch(
    `${supabaseUrl}/functions/v1/process-sale-order`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(paymentData),
    },
  );

  return result.data;
};
```

**Note:** Function cũ `processSaleTransaction` vẫn giữ lại với decorator `@deprecated` để fallback.

### 4. Store Layer Updates

**File:** `packages/store/src/posStore.ts`

Cập nhật `processPayment` action để sử dụng edge function:

```typescript
// Old (deprecated)
const result = await processSaleTransaction(paymentData, inventory);

// New (recommended)
const result = await processSaleTransactionViaEdgeFunction(
  paymentData,
  inventory,
);
```

### 5. Documentation & Configuration

**Files created:**

- `supabase/functions/README.md` - Hướng dẫn deploy và sử dụng
- `supabase/functions/.env.example` - Template cho environment variables
- `supabase/functions/deno.json` - Deno configuration

## Deployment Steps

### Bước 1: Deploy Database Migration

```bash
# Apply migration để tạo deduct_lot_quantity function
supabase db push

# Hoặc apply trực tiếp
psql -h your-db-host -U postgres -d postgres \
  -f supabase/migrations/20251102224725_create_deduct_lot_quantity_function.sql
```

### Bước 2: Set Secrets

```bash
# Set environment secrets cho edge function
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
supabase secrets set SUPABASE_URL=https://your-project.supabase.co
```

### Bước 3: Deploy Edge Function

```bash
# Login vào Supabase
supabase login

# Link project
supabase link --project-ref your-project-ref

# Deploy function
supabase functions deploy process-sale-order
```

### Bước 4: Verify Deployment

```bash
# Check logs
supabase functions logs process-sale-order --tail

# Test endpoint
curl https://your-project.supabase.co/functions/v1/process-sale-order \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Testing

### Local Testing

```bash
# Start local Supabase
supabase start

# Serve edge function locally
supabase functions serve process-sale-order

# Test với sample data
curl -i --location --request POST 'http://localhost:54321/functions/v1/process-sale-order' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data @test-data.json
```

### Production Testing

1. Test với đơn hàng nhỏ trước
2. Monitor logs để kiểm tra errors
3. Verify data consistency trong database
4. Check inventory updates
5. Verify VAT invoices được tạo đúng

## Rollback Plan

Nếu edge function có vấn đề, có thể rollback nhanh:

### Option 1: Revert Code Changes

```typescript
// Trong posStore.ts, đổi lại thành:
const result = await processSaleTransaction(paymentData, inventory);
```

### Option 2: Feature Flag

Thêm feature flag để toggle giữa edge function và client-side:

```typescript
const USE_EDGE_FUNCTION = import.meta.env.VITE_USE_EDGE_FUNCTION === "true";

const result = USE_EDGE_FUNCTION
  ? await processSaleTransactionViaEdgeFunction(paymentData, inventory)
  : await processSaleTransaction(paymentData, inventory);
```

## Monitoring

### Key Metrics to Monitor

1. **Success Rate** - Tỷ lệ đơn hàng thành công
2. **Response Time** - Thời gian xử lý đơn hàng
3. **Error Rate** - Tỷ lệ lỗi
4. **Data Consistency** - Kiểm tra inventory, transactions, orders

### Logging

Edge function log các events quan trọng:

- `[Process Sale] Starting transaction` - Bắt đầu xử lý
- `[Process Sale] Created order` - Tạo order thành công
- `[Process Sale] Created order items` - Tạo items thành công
- `[Process Sale] Updated inventory` - Cập nhật kho thành công
- `[Process Sale Error]` - Lỗi xảy ra

Xem logs:

```bash
supabase functions logs process-sale-order --tail
```

## Benefits

### So với Client-side Processing

| Aspect              | Client-side (Old)           | Edge Function (New)           |
| ------------------- | --------------------------- | ----------------------------- |
| **Atomicity**       | ❌ Multiple separate calls  | ✅ Single transaction         |
| **Security**        | ⚠️ Service key exposed risk | ✅ Service key on server only |
| **Performance**     | ⚠️ Multiple roundtrips      | ✅ Single API call            |
| **Rollback**        | ❌ Manual, error-prone      | ✅ Automatic rollback         |
| **Consistency**     | ⚠️ Can have partial updates | ✅ All-or-nothing             |
| **Maintainability** | ⚠️ Logic in multiple places | ✅ Centralized logic          |

## Known Issues & Limitations

1. **Cold Start** - First request sau idle có thể chậm hơn
2. **Timeout** - Edge function có timeout limit (10-60s tùy plan)
3. **Debugging** - Khó debug hơn client-side code
4. **Dependencies** - Chỉ dùng được Deno-compatible packages

## Next Steps

1. ✅ Deploy migration
2. ✅ Deploy edge function
3. ✅ Test thoroughly
4. ⏳ Monitor production usage
5. ⏳ Optimize performance nếu cần
6. ⏳ Add more edge functions cho các operations khác

## Support & References

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Deno Documentation](https://deno.land/manual)
- Internal: `supabase/functions/README.md`

## Changelog

### 2025-11-02

- ✅ Created edge function `process-sale-order`
- ✅ Created database function `deduct_lot_quantity`
- ✅ Updated `posService.ts` with wrapper function
- ✅ Updated `posStore.ts` to use edge function
- ✅ Added documentation and configuration files
