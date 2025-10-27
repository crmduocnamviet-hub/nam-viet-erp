# Hướng Dẫn Sử Dụng Tính Năng Chuyển Kho

## Tổng Quan

Tính năng Chuyển Kho (Warehouse Transfer) cho phép quản lý việc di chuyển hàng hóa giữa các kho trong hệ thống, bao gồm:

- Tạo phiếu chuyển kho từ kho tổng đến các hiệu thuốc
- Phê duyệt phiếu chuyển kho
- Xuất hàng từ kho nguồn
- Nhận hàng tại kho đích
- Theo dõi tồn kho và lịch sử chuyển kho

---

## Quy Trình Chuyển Kho

### 1. Tạo Phiếu Chuyển Kho (Draft)

**Người thực hiện:** Nhân viên kho / Quản lý kho

**Các bước:**

1. Truy cập **Kho hàng > Chuyển kho**
2. Click **Tạo phiếu chuyển kho**
3. Điền thông tin:
   - **Từ kho:** Chọn kho xuất (kho tổng)
   - **Đến kho:** Chọn kho nhận (hiệu thuốc)
   - **Ngày chuyển:** Ngày thực hiện chuyển kho
   - **Ngày dự kiến giao:** Ngày dự kiến hàng đến kho nhận
   - **Ghi chú:** Ghi chú cho phiếu chuyển kho

4. Thêm sản phẩm:
   - Chọn sản phẩm cần chuyển
   - Chọn lô hàng (nếu có)
   - Nhập số lượng yêu cầu
   - Nhập đơn giá (tùy chọn, để tham khảo)
   - Ghi chú cho sản phẩm (nếu cần)
   - Click **Thêm**

5. Sau khi thêm đủ sản phẩm, click **Lưu phiếu**

**Trạng thái:** `Draft` (Nháp)

---

### 2. Gửi Duyệt (Pending)

**Người thực hiện:** Người tạo phiếu

**Các bước:**

1. Vào trang chi tiết phiếu chuyển kho
2. Kiểm tra lại thông tin
3. Click **Gửi duyệt**

**Trạng thái:** `Pending` (Chờ duyệt)

---

### 3. Phê Duyệt Phiếu (Approved)

**Người thực hiện:** Quản lý kho / Quản lý cấp cao

**Quyền hạn yêu cầu:** `warehouse.transfers.approve`

**Các bước:**

1. Vào trang chi tiết phiếu chuyển kho
2. Kiểm tra thông tin phiếu:
   - Kho xuất/nhận có đúng không
   - Số lượng sản phẩm hợp lý không
   - Tồn kho có đủ để xuất không

3. **Duyệt:** Click **Duyệt**
4. **Từ chối:** Click **Từ chối** và nhập lý do

**Trạng thái:** `Approved` (Đã duyệt) hoặc `Cancelled` (Đã hủy)

---

### 4. Xuất Kho (In Transit)

**Người thực hiện:** Nhân viên kho tại kho xuất

**Quyền hạn yêu cầu:** `warehouse.transfers.send`

**Các bước:**

1. Vào trang chi tiết phiếu chuyển kho
2. Click **Xuất kho**
3. Nhập số lượng thực tế xuất cho từng sản phẩm
   - Có thể khác với số lượng yêu cầu nếu:
     - Tồn kho không đủ
     - Sản phẩm hết hạn/hỏng
     - Thay đổi theo yêu cầu

4. Click **Xuất kho** để xác nhận

**Hệ thống tự động:**

- Trừ số lượng từ tồn kho của kho xuất
- Trừ số lượng từ lô hàng (nếu có chọn lô)
- Cập nhật trạng thái phiếu
- Ghi log xuất kho

**Trạng thái:** `In Transit` (Đang vận chuyển)

---

### 5. Nhận Hàng (Completed)

**Người thực hiện:** Nhân viên kho tại kho nhận

**Quyền hạn yêu cầu:** `warehouse.transfers.receive`

**Các bước:**

1. Vào trang chi tiết phiếu chuyển kho
2. Click **Nhận hàng**
3. Nhập số lượng thực tế nhận được cho từng sản phẩm
   - Có thể khác với số lượng gửi nếu:
     - Hàng hỏng trong quá trình vận chuyển
     - Thiếu hàng
     - Sai sót

4. Ghi chú nếu có hàng hỏng/thiếu
5. Click **Nhận hàng** để xác nhận

**Hệ thống tự động:**

- Cộng số lượng vào tồn kho của kho nhận
- Tạo/cập nhật lô hàng tại kho nhận
  - Nếu lô đã tồn tại tại kho nhận: cộng số lượng
  - Nếu lô chưa có: tạo lô mới với thông tin từ lô gốc
- Cập nhật trạng thái phiếu
- Ghi log nhận hàng

**Trạng thái:** `Completed` (Hoàn thành)

---

## Trạng Thái Phiếu Chuyển Kho

| Trạng thái     | Mô tả           | Màu sắc    | Hành động có thể thực hiện |
| -------------- | --------------- | ---------- | -------------------------- |
| **Draft**      | Nháp, chưa gửi  | Xám        | Chỉnh sửa, Xóa, Gửi duyệt  |
| **Pending**    | Chờ duyệt       | Cam        | Duyệt, Từ chối             |
| **Approved**   | Đã duyệt        | Xanh dương | Xuất kho, Hủy              |
| **In Transit** | Đang vận chuyển | Xanh lam   | Nhận hàng, Hủy             |
| **Completed**  | Hoàn thành      | Xanh lá    | Xem thông tin              |
| **Cancelled**  | Đã hủy          | Đỏ         | Xem thông tin              |

---

## Quyền Hạn

### warehouse.transfers.view

- Xem danh sách phiếu chuyển kho
- Xem chi tiết phiếu chuyển kho

### warehouse.transfers.create

- Tạo phiếu chuyển kho mới
- Thêm/xóa sản phẩm trong phiếu nháp
- Gửi phiếu để duyệt

### warehouse.transfers.edit

- Chỉnh sửa thông tin phiếu (chỉ khi ở trạng thái Draft)
- Cập nhật số lượng sản phẩm

### warehouse.transfers.approve

- Duyệt phiếu chuyển kho
- Từ chối phiếu chuyển kho

### warehouse.transfers.send

- Xuất kho (chuyển hàng từ kho nguồn)
- Cập nhật số lượng thực tế xuất

### warehouse.transfers.receive

- Nhận hàng tại kho đích
- Cập nhật số lượng thực tế nhận

### warehouse.transfers.cancel

- Hủy phiếu chuyển kho (trước khi xuất kho)

### warehouse.transfers.delete

- Xóa phiếu chuyển kho (chỉ khi ở trạng thái Draft)

---

## Phân Quyền Theo Vai Trò

### Warehouse Manager (Quản lý kho)

✅ Tất cả quyền hạn chuyển kho

### Warehouse Staff (Nhân viên kho)

✅ Xem phiếu chuyển kho
✅ Xuất kho
✅ Nhận hàng
❌ Tạo phiếu
❌ Duyệt phiếu
❌ Hủy phiếu

### Inventory Manager (Quản lý tồn kho)

✅ Xem phiếu chuyển kho
✅ Tạo phiếu chuyển kho
✅ Chỉnh sửa phiếu
❌ Xuất/nhận kho

---

## Xử Lý Tồn Kho

### Khi Xuất Kho (Send)

```sql
-- Trừ số lượng từ product_lots
UPDATE product_lots
SET quantity = quantity - [quantity_sent]
WHERE id = [lot_id] AND warehouse_id = [from_warehouse_id];

-- Trừ số lượng từ inventory
UPDATE inventory
SET quantity = quantity - [quantity_sent]
WHERE product_id = [product_id] AND warehouse_id = [from_warehouse_id];
```

### Khi Nhận Hàng (Receive)

```sql
-- Tạo hoặc cập nhật lô tại kho đích
-- Nếu lô đã tồn tại:
UPDATE product_lots
SET quantity = quantity + [quantity_received]
WHERE product_id = [product_id]
  AND warehouse_id = [to_warehouse_id]
  AND lot_number = [lot_number];

-- Nếu lô chưa tồn tại:
INSERT INTO product_lots (
  product_id, warehouse_id, lot_number,
  batch_code, expiry_date, quantity
)
VALUES (
  [product_id], [to_warehouse_id], [lot_number],
  [batch_code], [expiry_date], [quantity_received]
);

-- Cộng số lượng vào inventory
UPDATE inventory
SET quantity = quantity + [quantity_received]
WHERE product_id = [product_id] AND warehouse_id = [to_warehouse_id];
```

---

## Lưu Ý Quan Trọng

### ⚠️ Khi Tạo Phiếu

1. **Kiểm tra tồn kho trước khi tạo phiếu:**
   - Đảm bảo kho xuất có đủ hàng
   - Kiểm tra hạn sử dụng của lô hàng

2. **Chọn lô hàng:**
   - Ưu tiên chọn lô gần hết hạn
   - Chỉ hiển thị lô của kho xuất

3. **Số lượng:**
   - Số lượng yêu cầu phải > 0
   - Không thể vượt quá tồn kho của lô

### ⚠️ Khi Xuất Kho

1. **Số lượng xuất:**
   - Không được vượt quá số lượng yêu cầu
   - Hệ thống tự động trừ tồn kho

2. **Kiểm tra hàng hóa:**
   - Đối chiếu sản phẩm với phiếu
   - Kiểm tra chất lượng trước khi xuất
   - Kiểm tra hạn sử dụng

3. **Đóng gói:**
   - Đóng gói cẩn thận tránh hỏng hóc
   - Dán nhãn rõ ràng: kho đích, mã phiếu

### ⚠️ Khi Nhận Hàng

1. **Số lượng nhận:**
   - Không được vượt quá số lượng đã gửi
   - Ghi rõ lý do nếu thiếu/hỏng

2. **Kiểm tra hàng hóa:**
   - Đối chiếu với phiếu xuất
   - Kiểm tra chất lượng
   - Kiểm tra hạn sử dụng
   - Báo ngay nếu có sai lệch

3. **Xử lý hàng hỏng/thiếu:**
   - Ghi rõ trong "Ghi chú hỏng/thiếu"
   - Chụp ảnh nếu cần
   - Báo cáo quản lý ngay

---

## Các Trường Hợp Đặc Biệt

### Hàng Hỏng Trong Vận Chuyển

1. Nhân viên kho nhận ghi rõ số lượng hỏng trong "Ghi chú hỏng/thiếu"
2. Số lượng nhận = Số lượng gửi - Số lượng hỏng
3. Báo cáo quản lý để xử lý
4. Có thể tạo phiếu điều chỉnh tồn kho riêng

### Thiếu Hàng

1. Nhập số lượng thực tế nhận được (< số lượng gửi)
2. Ghi rõ lý do trong "Ghi chú hỏng/thiếu"
3. Kiểm tra lại tồn kho kho xuất
4. Có thể tạo phiếu chuyển bổ sung nếu cần

### Hủy Phiếu Sau Khi Duyệt

1. Chỉ có thể hủy nếu chưa xuất kho
2. Phải ghi rõ lý do hủy
3. Trạng thái chuyển sang `Cancelled`
4. Không ảnh hưởng đến tồn kho

### Chuyển Nhiều Lô Cùng Sản Phẩm

Có thể thêm nhiều dòng cho cùng sản phẩm với các lô khác nhau:

```
Sản phẩm A - Lô 001 - HSD: 01/2026 - SL: 100
Sản phẩm A - Lô 002 - HSD: 03/2026 - SL: 50
```

---

## Báo Cáo và Thống Kê

### Dashboard Chuyển Kho

Hiển thị:

- Tổng số phiếu chuyển kho
- Số phiếu theo trạng thái
- Phiếu chờ duyệt
- Phiếu đang vận chuyển
- Phiếu hoàn thành

### Bộ Lọc

- **Trạng thái:** Lọc theo trạng thái phiếu
- **Kho xuất:** Lọc theo kho xuất
- **Kho nhận:** Lọc theo kho nhận
- **Thời gian:** Lọc theo ngày chuyển
- **Tìm kiếm:** Tìm theo mã phiếu, tên kho

### Xuất Báo Cáo

- Danh sách phiếu chuyển kho
- Chi tiết sản phẩm đã chuyển
- Thống kê theo kho
- Thống kê theo sản phẩm

---

## API Endpoints

### GET /warehouse-transfers

Lấy danh sách phiếu chuyển kho

**Query Parameters:**

- `status`: Lọc theo trạng thái
- `from_warehouse_id`: Lọc theo kho xuất
- `to_warehouse_id`: Lọc theo kho nhận
- `start_date`: Từ ngày
- `end_date`: Đến ngày

### GET /warehouse-transfers/:id

Lấy chi tiết phiếu chuyển kho

### POST /warehouse-transfers

Tạo phiếu chuyển kho mới

**Body:**

```json
{
  "from_warehouse_id": 1,
  "to_warehouse_id": 2,
  "transfer_date": "2025-01-27",
  "expected_delivery_date": "2025-01-28",
  "notes": "Chuyển hàng cho hiệu thuốc 1",
  "items": [
    {
      "product_id": 100,
      "lot_id": 50,
      "quantity_requested": 100,
      "unit_price": 50000,
      "notes": ""
    }
  ]
}
```

### PUT /warehouse-transfers/:id

Cập nhật thông tin phiếu

### DELETE /warehouse-transfers/:id

Xóa phiếu (chỉ khi Draft)

### POST /warehouse-transfers/:id/submit

Gửi phiếu để duyệt

### POST /warehouse-transfers/:id/approve

Duyệt phiếu

### POST /warehouse-transfers/:id/send

Xuất kho

**Body:**

```json
{
  "items": [
    {
      "id": 1,
      "quantity_sent": 95
    }
  ]
}
```

### POST /warehouse-transfers/:id/receive

Nhận hàng

**Body:**

```json
{
  "items": [
    {
      "id": 1,
      "quantity_received": 93,
      "damage_notes": "2 lọ bị vỡ"
    }
  ]
}
```

### POST /warehouse-transfers/:id/cancel

Hủy phiếu

**Body:**

```json
{
  "rejection_reason": "Kho nhận đã đủ hàng"
}
```

---

## Database Schema

### warehouse_transfers

| Column                 | Type            | Description        |
| ---------------------- | --------------- | ------------------ |
| id                     | BIGINT          | Primary key        |
| transfer_number        | VARCHAR(50)     | Mã phiếu (auto)    |
| from_warehouse_id      | BIGINT          | Kho xuất           |
| to_warehouse_id        | BIGINT          | Kho nhận           |
| status                 | transfer_status | Trạng thái         |
| transfer_date          | DATE            | Ngày chuyển        |
| expected_delivery_date | DATE            | Ngày dự kiến giao  |
| actual_delivery_date   | DATE            | Ngày giao thực tế  |
| created_by             | UUID            | Người tạo          |
| approved_by            | UUID            | Người duyệt        |
| sent_by                | UUID            | Người xuất kho     |
| received_by            | UUID            | Người nhận hàng    |
| approved_at            | TIMESTAMPTZ     | Thời gian duyệt    |
| sent_at                | TIMESTAMPTZ     | Thời gian xuất     |
| received_at            | TIMESTAMPTZ     | Thời gian nhận     |
| notes                  | TEXT            | Ghi chú            |
| rejection_reason       | TEXT            | Lý do hủy          |
| created_at             | TIMESTAMPTZ     | Thời gian tạo      |
| updated_at             | TIMESTAMPTZ     | Thời gian cập nhật |

### warehouse_transfer_items

| Column             | Type          | Description               |
| ------------------ | ------------- | ------------------------- |
| id                 | BIGINT        | Primary key               |
| transfer_id        | BIGINT        | FK to warehouse_transfers |
| product_id         | BIGINT        | FK to products            |
| lot_id             | INTEGER       | FK to product_lots        |
| quantity_requested | NUMERIC(10,2) | Số lượng yêu cầu          |
| quantity_sent      | NUMERIC(10,2) | Số lượng gửi              |
| quantity_received  | NUMERIC(10,2) | Số lượng nhận             |
| unit_price         | NUMERIC(15,2) | Đơn giá                   |
| notes              | TEXT          | Ghi chú                   |
| damage_notes       | TEXT          | Ghi chú hỏng/thiếu        |
| created_at         | TIMESTAMPTZ   | Thời gian tạo             |
| updated_at         | TIMESTAMPTZ   | Thời gian cập nhật        |

---

## Troubleshooting

### Lỗi: "Chỉ có thể xóa phiếu chuyển kho ở trạng thái nháp"

**Nguyên nhân:** Phiếu đã được gửi duyệt hoặc đã duyệt

**Giải pháp:** Sử dụng chức năng "Hủy phiếu" thay vì xóa

### Lỗi: "Transfer ID not found"

**Nguyên nhân:** Phiếu không tồn tại hoặc đã bị xóa

**Giải pháp:** Kiểm tra lại ID phiếu

### Lỗi: Tồn kho không đủ khi xuất

**Nguyên nhân:**

- Tồn kho đã thay đổi từ lúc tạo phiếu
- Có phiếu khác xuất cùng lúc

**Giải pháp:**

- Cập nhật số lượng xuất thực tế
- Kiểm tra lại tồn kho hiện tại
- Tạo phiếu bổ sung nếu cần

### Không thể duyệt phiếu

**Nguyên nhân:** Phiếu không ở trạng thái `Pending`

**Giải pháp:** Kiểm tra trạng thái phiếu

---

## Best Practices

### 1. Quy trình chuẩn

- ✅ Luôn kiểm tra tồn kho trước khi tạo phiếu
- ✅ Chọn lô gần hết hạn để chuyển trước
- ✅ Ghi rõ ghi chú cho mỗi phiếu chuyển
- ✅ Kiểm tra kỹ hàng hóa khi xuất và nhận
- ✅ Cập nhật trạng thái ngay sau mỗi bước

### 2. Quản lý lô hàng

- ✅ FEFO (First Expire First Out) - Chuyển hàng gần hết hạn trước
- ✅ Ghi rõ số lô và hạn sử dụng
- ✅ Kiểm tra HSD trước khi xuất/nhận
- ✅ Không chuyển hàng đã hết hạn

### 3. Bảo mật

- ✅ Chỉ cấp quyền cho người cần thiết
- ✅ Yêu cầu phê duyệt cho phiếu giá trị lớn
- ✅ Ghi log đầy đủ các thao tác
- ✅ Kiểm tra định kỳ các phiếu bất thường

### 4. Hiệu suất

- ✅ Xử lý phiếu ngay, không để tồn đọng
- ✅ Duyệt phiếu trong 24h
- ✅ Xuất/nhận hàng đúng hẹn
- ✅ Báo cáo vấn đề ngay khi phát hiện

---

## Câu Hỏi Thường Gặp (FAQ)

**Q: Có thể chuyển hàng giữa 2 hiệu thuốc không?**
A: Có, miễn là cả 2 kho đều trong hệ thống. Chọn hiệu thuốc nguồn làm "Từ kho" và hiệu thuốc đích làm "Đến kho".

**Q: Phải làm gì nếu nhận thiếu hàng?**
A: Nhập số lượng thực tế nhận được, ghi rõ lý do trong "Ghi chú hỏng/thiếu", và báo cáo quản lý.

**Q: Có thể hủy phiếu sau khi đã xuất kho không?**
A: Không. Sau khi xuất kho, phiếu đang ở trạng thái "In Transit" và phải hoàn thành quy trình nhận hàng. Nếu cần điều chỉnh, tạo phiếu chuyển ngược lại.

**Q: Số lượng gửi có thể khác số lượng yêu cầu không?**
A: Có, khi xuất kho có thể điều chỉnh số lượng thực tế nếu tồn kho không đủ hoặc có vấn đề.

**Q: Có thể chỉnh sửa phiếu sau khi đã duyệt không?**
A: Không. Sau khi duyệt, chỉ có thể hủy phiếu (trước khi xuất kho). Nếu cần thay đổi, hủy phiếu cũ và tạo phiếu mới.

**Q: Làm thế nào để theo dõi hàng đang vận chuyển?**
A: Lọc danh sách phiếu theo trạng thái "In Transit" để xem tất cả hàng đang trên đường.

---

## Liên Hệ Hỗ Trợ

Nếu gặp vấn đề kỹ thuật hoặc cần hỗ trợ:

📧 Email: support@namviet.com
📱 Hotline: 1900 xxxx
💬 Slack: #warehouse-support

---

**Cập nhật lần cuối:** 2025-01-27
**Phiên bản:** 1.0.0
