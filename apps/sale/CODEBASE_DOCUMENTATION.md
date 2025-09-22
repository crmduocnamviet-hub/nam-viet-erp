# Module Bán hàng POS - Tài liệu Codebase

Tài liệu này mô tả chi tiết về mục đích, kiến trúc, và các tính năng của module Bán hàng tại điểm bán (POS) dành cho các nhà thuốc của Công ty Dược Nam Việt.

## 1. Mục đích và Đối tượng Người dùng

-   **Mục đích:** Cung cấp một giao diện bán hàng nhanh, hiệu quả và dễ sử dụng cho nghiệp vụ bán lẻ tại quầy, đặc biệt là cho việc thanh toán và xuất đơn thuốc cho bệnh nhân sau khi khám bệnh.
-   **Đối tượng Người dùng Chính:**
    -   **Lễ tân:** Tại các phòng khám hoặc nhà thuốc, chịu trách nhiệm tiếp nhận đơn và thanh toán.
    -   **Dược sĩ:** Đứng quầy, tư vấn và bán thuốc trực tiếp cho khách hàng/bệnh nhân.
-   **Phạm vi áp dụng:** Trước mắt, hệ thống phục vụ cho hai nhà thuốc **DH 1** và **DH 2** của công ty.

## 2. Công nghệ sử dụng

Module POS sẽ được phát triển đồng bộ với các công nghệ của dự án hiện tại để đảm bảo tính nhất quán và dễ bảo trì.

-   **Frontend:** React, TypeScript, Vite
-   **UI Framework:** Ant Design
-   **Quản lý State:** React Hooks (useState, useContext), có thể kết hợp Context API cho các state toàn cục như giỏ hàng, thông tin khách hàng.
-   **Backend Integration:** Tương tác với Supabase thông qua các services đã được định nghĩa trong workspace `@nam-viet-erp/services`.
-   **Package Manager:** Yarn Workspace

## 3. Luồng nghiệp vụ cơ bản

1.  Bệnh nhân/Khách hàng đến quầy với đơn thuốc hoặc yêu cầu mua hàng.
2.  Dược sĩ/Lễ tân đăng nhập vào hệ thống POS.
3.  Tìm kiếm thông tin bệnh nhân (nếu có) hoặc tạo mới khách hàng vãng lai.
4.  Sử dụng thanh tìm kiếm để thêm các sản phẩm/thuốc vào giỏ hàng. Hệ thống hỗ trợ tìm kiếm theo tên, mã SKU, mã vạch, hoạt chất.
5.  Hệ thống tự động áp dụng các chương trình khuyến mại (nếu có) cho các sản phẩm trong giỏ hàng.
6.  Xác nhận giỏ hàng và tiến hành thanh toán.
7.  Chọn phương thức thanh toán (Tiền mặt, Chuyển khoản/QR Code, Thẻ).
8.  Hoàn tất thanh toán, hệ thống ghi nhận giao dịch và tự động trừ tồn kho.
9.  In hóa đơn/phiếu thu cho khách hàng.

## 4. Cấu trúc Thư mục (Dự kiến)

Module sẽ được đặt trong `apps/sale` với cấu trúc như sau:

```
/apps/sale/
├───src/
│   ├───assets/         # Hình ảnh, icon...
│   ├───components/     # Các component UI tái sử dụng (VD: NumPad, PaymentModal)
│   ├───features/       # Các component lớn, chứa logic nghiệp vụ (VD: Cart, ProductSearch)
│   ├───hooks/          # Các custom hook (VD: useCart, usePromotions)
│   ├───pages/
│   │   └───POS/
│   │       └───PosPage.tsx   # Trang bán hàng chính
│   ├───services/       # Logic gọi API đến backend (sử dụng @nam-viet-erp/services)
│   └───context/        # Context quản lý state của phiên bán hàng (giỏ hàng, khách hàng...)
└───...                 # Các file cấu hình khác
```

## 5. Các tính năng cốt lõi (Dự kiến)

-   **Giao diện Bán hàng (POS Interface):**
    -   Thiết kế tối ưu cho màn hình cảm ứng và máy tính bàn.
    -   Bố cục gồm 3 phần chính: Thông tin khách hàng, Danh sách sản phẩm trong giỏ hàng (Cart), và khu vực thanh toán.
-   **Tìm kiếm Sản phẩm Thông minh:**
    -   Tìm kiếm real-time theo tên, SKU, mã vạch.
    -   Gợi ý các sản phẩm liên quan hoặc các sản phẩm cùng hoạt chất.
-   **Quản lý Giỏ hàng (Cart):**
    -   Thêm, xóa, cập nhật số lượng sản phẩm.
    -   Hiển thị rõ ràng giá gốc, chiết khấu, và giá cuối cùng.
-   **Tích hợp Khuyến mại Tự động:**
    -   Tự động áp dụng các chương trình khuyến mại hợp lệ (giảm giá, mua X tặng Y) dựa trên các quy tắc đã được thiết lập trong module CMS.
-   **Thanh toán Linh hoạt:**
    -   Hỗ trợ nhiều hình thức: Tiền mặt, Chuyển khoản (tạo mã VietQR), Thẻ ngân hàng.
    -   Gợi ý số tiền thối lại cho khách khi thanh toán bằng tiền mặt.
-   **Quản lý Khách hàng Thân thiết:**
    -   Tìm kiếm nhanh thông tin khách hàng qua SĐT hoặc tên.
    -   Xem lại lịch sử mua hàng.
-   **In Hóa đơn:**
    -   Tích hợp với máy in hóa đơn (máy in nhiệt).
    -   Mẫu in có thể tùy chỉnh.
-   **Báo cáo Cuối ca/Cuối ngày:**
    -   Tổng hợp doanh thu theo từng phương thức thanh toán.
    -   Thống kê số lượng sản phẩm đã bán.

## 6. Tích hợp với các Module khác

-   **Sản phẩm & Tồn kho:** Lấy dữ liệu sản phẩm và giá bán từ bảng `products`. Sau mỗi giao dịch thành công, gọi service để cập nhật lại `inventory`.
-   **Khuyến mại:** Đọc dữ liệu từ bảng `promotions` và `vouchers` để áp dụng chiết khấu.
-   **Tài chính:** Ghi nhận mỗi giao dịch bán hàng như một bản ghi `income` trong bảng `transactions`.
-   **Khách hàng:** (Dự kiến) Tương tác với bảng `customers` để quản lý thông tin khách hàng thân thiết.