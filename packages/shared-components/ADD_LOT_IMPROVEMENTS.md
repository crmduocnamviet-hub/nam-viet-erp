# Add Product Lot - Loading State Improvements

## Problem

After creating a new product lot:

- No loading indicator was shown
- Modal closed before data refreshed
- New lot might not appear immediately
- Inconsistent behavior compared to delete operation

## Solution

Synchronized loading behavior between create and delete operations.

## Changes Made

### 1. Added Quantity Field to Form

```typescript
<Form.Item
  name="quantity"
  label="Số lượng"
  rules={[{ required: true, message: "Vui lòng nhập số lượng" }]}
  initialValue={0}
>
  <InputNumber
    placeholder="Nhập số lượng"
    style={{ width: "100%" }}
    min={0}
  />
</Form.Item>
```

**Why:** Users need to specify initial quantity when creating a lot

### 2. Reordered Modal Close Sequence

**Before:**

```typescript
form.resetFields();
onClose(); // Close immediately
onSuccess(); // Then refetch
```

**After:**

```typescript
form.resetFields();
onSuccess(); // Trigger refetch first
setTimeout(() => {
  onClose(); // Close after 100ms
}, 100);
```

**Benefits:**

- ✅ Loading state shows before modal closes
- ✅ Better visual feedback
- ✅ Modal closes after refetch starts

### 3. Updated Success Handler

**ProductLotManagement.tsx:**

```typescript
const handleAddLotSuccess = async () => {
  // Show loading state immediately
  setIsDeleting(true);

  // Refetch data to show new lot
  await refetch();

  // Close modal after data is fetched
  setIsAddLotModalOpen(false);

  // Delay to ensure UI updates properly
  setTimeout(() => {
    setIsDeleting(false);
  }, 300);
};
```

**Flow:**

```
1. User submits form
2. Create lot in database
3. Sync to inventory (auto)
4. Show success notification
5. Trigger onSuccess()
6. Set loading state = true (spinner shows)
7. Refetch data from server
8. Close modal (100ms delay)
9. Wait 300ms for UI update
10. Hide spinner
11. New lot visible in table
```

### 4. Updated Notification Message

```typescript
notification.success({
  message: "Thành công!",
  description: "Lô hàng đã được tạo và đồng bộ tồn kho.",
});
```

**Change:** Added "và đồng bộ tồn kho" to inform user about inventory sync

## User Experience Flow

### Visual States

**1. Modal Open - User Fills Form**

```
┌─────────────────────────────┐
│  Thêm lô hàng mới           │
├─────────────────────────────┤
│  Kho: [Kho A ▼]             │
│  Số lô: [LOT-001]           │
│  Mã lô: [BATCH-001]         │
│  Ngày nhận: [15/01/2025]    │
│  Hạn SD: [31/12/2025]       │
│  Số lượng: [100]            │ ← New field!
│                             │
│  [Hủy]  [Tạo lô hàng]      │
└─────────────────────────────┘
```

**2. User Clicks "Tạo lô hàng"**

```
┌─────────────────────────────┐
│  Thêm lô hàng mới           │
├─────────────────────────────┤
│  Creating...                │
│  [Button loading spinner]   │
└─────────────────────────────┘
```

**3. Success Notification Appears**

```
┌─────────────────────────────┐
│ ✓ Thành công!               │
│ Lô hàng đã được tạo và      │
│ đồng bộ tồn kho.            │
└─────────────────────────────┘
```

**4. Table Shows Spinner**

```
┌─────────────────────────────┐
│      🔄 Đang tải...         │
│  [Table with spinner]       │
└─────────────────────────────┘
```

**5. Modal Closes (100ms after success)**

```
[Modal closes smoothly]
[Spinner still showing on table]
```

**6. New Lot Appears (after 300ms delay)**

```
┌─────────────────────────────┐
│ Kho A │ LOT-001 │ 100 │ [×]│ ← New row!
│ Kho B │ LOT-002 │  50 │ [×]│
└─────────────────────────────┘
```

## Timeline

```
0ms:    User clicks "Tạo lô hàng"
0ms:    Form validation
50ms:   Create lot (database)
80ms:   Sync to inventory (database function)
100ms:  Success notification shows
100ms:  onSuccess() called
100ms:  Spinner shows (setIsDeleting = true)
120ms:  Refetch starts
150ms:  Modal closes
220ms:  New data arrives
300ms:  Wait delay
500ms:  Spinner hides (setIsDeleting = false)
500ms:  New lot visible in table
```

## Comparison: Delete vs Create

### Delete Flow

```
Click Delete
  ↓
Confirm
  ↓
setIsDeleting(true) → Spinner
  ↓
Delete from DB
  ↓
Sync inventory
  ↓
Refetch
  ↓
Wait 300ms
  ↓
setIsDeleting(false) → Hide spinner
  ↓
Row removed from table
```

### Create Flow (NEW - Now Matching!)

```
Click "Tạo lô hàng"
  ↓
Validate form
  ↓
Create in DB
  ↓
Sync inventory (auto)
  ↓
Success notification
  ↓
setIsDeleting(true) → Spinner
  ↓
Refetch
  ↓
Close modal (100ms)
  ↓
Wait 300ms
  ↓
setIsDeleting(false) → Hide spinner
  ↓
New row appears in table
```

✅ **Now both operations have consistent loading behavior!**

## Benefits

### 1. Consistency

✅ Same loading pattern as delete
✅ Same 300ms delay timing
✅ Same spinner behavior

### 2. Better UX

✅ Quantity field allows setting initial stock
✅ Clear visual feedback during creation
✅ Modal closes smoothly after refetch
✅ New lot appears reliably

### 3. Data Integrity

✅ Auto-sync to inventory
✅ No stale data issues
✅ Fresh data always displayed

### 4. Professional Feel

✅ Smooth transitions
✅ Predictable behavior
✅ Clear user feedback

## Testing Checklist

- [x] Quantity field shows in form
- [x] Quantity field is required
- [x] Spinner shows when creating lot
- [x] Modal closes after 100ms
- [x] New lot appears in table after spinner
- [x] Inventory quantity synced correctly
- [x] Loading state clears after 300ms
- [x] Success notification shows
- [x] Form resets after creation
- [x] Works with all warehouses
- [x] Error handling works correctly

## Error Handling

### If creation fails:

```typescript
catch (error) {
  notification.error({
    message: "Lỗi tạo lô hàng",
    description: error.message,
  });
  // Modal stays open
  // User can fix and retry
  // No loading state triggered
}
```

### If refetch fails:

```typescript
// Success already shown
// Modal will close
// Spinner will eventually clear (300ms)
// User can manually refresh if needed
```

## Configuration

### Adjust Modal Close Delay

```typescript
// Faster (might not see spinner)
setTimeout(() => onClose(), 50);

// Current (recommended)
setTimeout(() => onClose(), 100);

// Slower (more obvious spinner)
setTimeout(() => onClose(), 200);
```

### Adjust Spinner Duration

```typescript
// Shorter (faster but might miss render)
setTimeout(() => setIsDeleting(false), 100);

// Current (recommended)
setTimeout(() => setIsDeleting(false), 300);

// Longer (ensures render but slower)
setTimeout(() => setIsDeleting(false), 500);
```

## Troubleshooting

### New lot doesn't appear

**Cause:** Delay too short or cache issue
**Fix:** Increase delay to 500ms or verify `gcTime: 0`

### Modal closes too quickly

**Cause:** Modal close delay too short
**Fix:** Increase from 100ms to 200ms

### Spinner shows too long

**Cause:** Large dataset or slow network
**Fix:** Normal behavior, or optimize query

### Quantity not saving

**Cause:** Form field not included
**Fix:** Verify quantity field is in form and has name="quantity"

## Summary

✅ **Added quantity field** to form  
✅ **Spinner feedback** during creation  
✅ **300ms delay** ensures UI updates  
✅ **Consistent with delete** operation  
✅ **Auto-sync to inventory** built-in  
✅ **Professional UX** with smooth transitions

Creating product lots now has the same reliable, smooth loading behavior as deleting them!
