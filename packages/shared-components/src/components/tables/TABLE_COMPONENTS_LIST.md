# Danh sách Table Components cần Extract

## ✅ Đã hoàn thành:

1. **B2BOrderListTable** - Bảng danh sách đơn hàng B2B
   - File: B2BOrderListTable.tsx
   - Screen: b2b/B2BOrderListPage.tsx

2. **InventoryB2BOrdersTable** - Bảng đơn hàng B2B cho nhân viên kho
   - File: InventoryB2BOrdersTable.tsx
   - Screen: b2b/InventoryB2BOrdersPage.tsx

3. **UserManagementTable** - Bảng quản lý tài khoản
   - File: UserManagementTable.tsx
   - Screen: management/UserManagementPage.tsx

4. **RoomManagementTable** - Bảng quản lý phòng ban
   - File: RoomManagementTable.tsx
   - Screen: management/RoomManagementPage.tsx

5. **PurchaseOrdersTable** - Bảng đơn đặt hàng
   - File: PurchaseOrdersTable.tsx
   - Screen: warehouse/PurchaseOrdersPage.tsx

6. **ProductListTable** - Bảng danh sách sản phẩm
   - File: ProductListTable.tsx
   - Screen: inventory/ProductListPage.tsx

## 📋 Cần extract:

### Inventory Tables

3. **ProductListTable** - Bảng danh sách sản phẩm ✅ DONE
   - Screen: inventory/ProductListPage.tsx
   - Columns: product_name+image, category, unit, price, manufacturer, status

### Management Tables

4. **UserManagementTable** - Bảng quản lý tài khoản người dùng ✅ DONE
   - Screen: management/UserManagementPage.tsx
   - Columns: username, full_name, email, role, status, actions

5. **RoomManagementTable** - Bảng quản lý phòng ban ✅ DONE
   - Screen: management/RoomManagementPage.tsx
   - Columns: room_name, room_code, description, capacity, status, actions

### Warehouse Tables

6. **PurchaseOrdersTable** - Bảng đơn đặt hàng ✅ DONE
   - Screen: warehouse/PurchaseOrdersPage.tsx
   - Columns: po_number, supplier, status, total, actions

### Marketing Tables

5. **CustomerSegmentsTable** - Bảng phân khúc khách hàng
   - Screen: marketing/CustomerSegmentsPage.tsx
   - Columns: segment_name, description, customer_count, created_date, actions

6. **ContentLibraryTable** - Bảng thư viện nội dung marketing
   - Screen: marketing/ContentLibraryPage.tsx
   - Columns: title, content_type, status, created_date, actions

### Warehouse Tables

7. **PurchaseOrderItemsTable** - Bảng chi tiết sản phẩm trong đơn đặt hàng
   - Screen: warehouse/EditPurchaseOrderPage.tsx
   - Columns: product_name, sku, quantity, unit_price, total, actions

8. **WarehouseTransfersTable** - Bảng danh sách phiếu chuyển kho
   - Screen: warehouse/WarehouseTransfersListPage.tsx
   - Columns: transfer_code, from_warehouse, to_warehouse, status, created_date, actions

9. **VATInvoiceInputTable** - Bảng hóa đơn VAT mua vào
   - Screen: warehouse/VATInvoiceInputPage.tsx
   - Columns: invoice_number, supplier, invoice_date, total_amount, vat_amount, actions

10. **VATInvoicePOSTable** - Bảng hóa đơn VAT bán lẻ (POS)
    - Screen: warehouse/VATInvoicePOSPage.tsx
    - Columns: invoice_number, customer, sale_date, total_amount, vat_amount, actions

11. **VATInvoiceB2BTable** - Bảng hóa đơn VAT bán buôn (B2B)
    - Screen: warehouse/VATInvoiceB2BPage.tsx
    - Columns: invoice_number, customer, quote_number, total_amount, vat_amount, actions

12. **WarehouseTransferDetailTable** - Bảng chi tiết sản phẩm trong phiếu chuyển kho
    - Screen: warehouse/WarehouseTransferDetailPage.tsx
    - Columns: product_name, sku, quantity_requested, quantity_sent, quantity_received, status

13. **CreateWarehouseTransferTable** - Bảng sản phẩm khi tạo phiếu chuyển kho mới
    - Screen: warehouse/CreateWarehouseTransferPage.tsx
    - Columns: product_name, sku, available_quantity, transfer_quantity, actions

14. **VATInventoryTable** - Bảng tồn kho VAT
    - Screen: warehouse/VATInventoryDashboard.tsx
    - Columns: product_name, sku, vat_quantity, actual_quantity, difference, actions

## Lưu ý khi Extract:

- Mỗi table component nên nhận props từ parent
- Logic sắp xếp, filter nên để ở parent component
- Table component chỉ chịu trách nhiệm hiển thị và gọi callback
- Export tất cả table components từ index.ts
