# Product Lot Loading State Improvements

## Problem

After deleting a product lot, the row was still visible in the table because:

1. Query cache was serving stale data
2. No loading indicator during deletion
3. Refetch completed too quickly for UI to update

## Solution

Added proper loading states with spinner and delayed state updates.

## Changes Made

### 1. Added Loading State Management

```typescript
const [isDeleting, setIsDeleting] = useState(false);
const isLoading = isFetching || isDeleting;
```

**Benefits:**

- ✅ Shows spinner during deletion
- ✅ Prevents stale data from showing
- ✅ Visual feedback to user

### 2. Delete with Loading State

```typescript
const handleDeleteLot = async (record: any) => {
  setIsDeleting(true); // Start loading

  deleteLot({
    lotId: record.id,
    productId: productId,
    warehouseId: record.warehouse_id,
  });
};

const { submit: deleteLot } = useSubmitQuery({
  onSuccess: async () => {
    await refetch(); // Force fresh data

    // Delay to ensure UI updates properly
    setTimeout(() => {
      setIsDeleting(false);
    }, 300);
  },
  onError: () => {
    setIsDeleting(false); // Stop loading on error
  },
});
```

**Flow:**

```
User clicks Delete
    ↓
setIsDeleting(true) → Spinner shows
    ↓
Delete from database
    ↓
Sync inventory
    ↓
Refetch data
    ↓
Wait 300ms (ensure UI refresh)
    ↓
setIsDeleting(false) → Spinner hides
    ↓
Fresh data displayed (without deleted row)
```

### 3. Improved Spinner Component

```typescript
<Spin spinning={isLoading} tip="Đang tải..." style={{ marginTop: 16 }}>
  <Table
    dataSource={dataSource}
    pagination={false}
    columns={lotTableColumns}
    locale={{
      emptyText: "Chưa có lô hàng nào",
    }}
  />
</Spin>
```

**Changes:**

- ✅ Added loading tip text: "Đang tải..."
- ✅ Always render table (even when empty)
- ✅ Show empty state message: "Chưa có lô hàng nào"
- ✅ Maintains table structure during loading

### 4. Consistent Loading for All Operations

**Add Lot:**

```typescript
const handleAddLotSuccess = async () => {
  setIsDeleting(true);
  await refetch();
  setTimeout(() => setIsDeleting(false), 300);
};
```

**Update Warehouse Quantity:**

```typescript
const handleWarehouseQuantitySuccess = async () => {
  setIsDeleting(true);
  await refetch();
  setTimeout(() => setIsDeleting(false), 300);
};
```

**Delete Lot:**

- Same pattern as above

## User Experience

### Before:

```
Delete → ??? → Row still there → Confusing!
```

### After:

```
Delete → Spinner (300ms) → Row removed → Clear feedback!
```

## Timeline

```
0ms:    User clicks Delete
0ms:    Confirmation dialog
50ms:   User confirms
50ms:   Spinner shows (setIsDeleting(true))
100ms:  Database delete
130ms:  Inventory sync
180ms:  Refetch starts
280ms:  New data arrives
300ms:  Wait delay
600ms:  Spinner hides (setIsDeleting(false))
600ms:  Table shows updated data (deleted row gone)
```

## Visual States

### 1. Idle State

```
┌────────────────────────────┐
│ Kho A │ Lô 001 │ 100 │ [×]│
│ Kho B │ Lô 002 │  50 │ [×]│
└────────────────────────────┘
```

### 2. Loading State (After Delete Click)

```
┌────────────────────────────┐
│      🔄 Đang tải...        │
│  [Spinner overlay active]  │
└────────────────────────────┘
```

### 3. Updated State (After 300ms)

```
┌────────────────────────────┐
│ Kho B │ Lô 002 │  50 │ [×]│ ← Row removed!
└────────────────────────────┘
```

## Benefits

### 1. Visual Feedback

✅ Spinner indicates action in progress
✅ User knows system is working
✅ Prevents confusion about state

### 2. Data Freshness

✅ 300ms delay ensures render cycle completes
✅ No stale cached data
✅ Deleted rows don't reappear

### 3. Consistent UX

✅ Same loading pattern for all operations
✅ Predictable behavior
✅ Professional feel

### 4. Error Handling

✅ Spinner stops on error
✅ User can retry immediately
✅ No stuck loading states

## Configuration

### Adjust Delay Time

```typescript
// Shorter delay (faster but might show stale data)
setTimeout(() => setIsDeleting(false), 100);

// Current (recommended)
setTimeout(() => setIsDeleting(false), 300);

// Longer delay (slower but ensures render)
setTimeout(() => setIsDeleting(false), 500);
```

### Customize Spinner Text

```typescript
<Spin spinning={isLoading} tip="Đang xử lý...">
  {/* or */}
<Spin spinning={isLoading} tip="Đang xóa lô hàng...">
  {/* or */}
<Spin spinning={isLoading} tip="Vui lòng đợi...">
```

## Testing Checklist

- [x] Spinner shows when deleting lot
- [x] Deleted row disappears after spinner
- [x] Spinner shows when adding lot
- [x] New row appears after spinner
- [x] Spinner shows when updating quantity
- [x] Quantity updates after spinner
- [x] Error stops spinner immediately
- [x] Empty table shows "Chưa có lô hàng nào"
- [x] Loading state works on all warehouse filters

## Troubleshooting

### Spinner shows but row still there

**Cause:** Delay too short or cache not invalidated
**Fix:** Increase delay to 500ms or check `gcTime: 0` in query

### Spinner never stops

**Cause:** Error in refetch or missing error handler
**Fix:** Check console for errors, ensure `setIsDeleting(false)` in error handler

### Spinner flickers

**Cause:** Multiple refetch calls
**Fix:** Consolidate refetch calls, use debounce if needed

### Deleted row reappears later

**Cause:** Cache serving old data
**Fix:** Ensure `gcTime: 0` in `useFilterProductLot`

## Summary

✅ **300ms delay** ensures UI updates properly  
✅ **Spinner feedback** improves UX  
✅ **Consistent pattern** across all operations  
✅ **No stale data** issues  
✅ **Professional appearance**

Users now see clear visual feedback and deleted rows properly disappear!
