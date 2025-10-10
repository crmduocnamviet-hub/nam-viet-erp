# Nam Việt ERP - Tài Liệu Hệ Thống

Chào mừng đến với tài liệu hệ thống Nam Việt ERP. Thư mục này chứa tài liệu đầy đủ cho toàn bộ hệ thống.

## 📚 Cấu Trúc Tài Liệu

### 🏗️ [Kiến Trúc Hệ Thống](./architecture/)

Tài liệu về kiến trúc hệ thống, mẫu thiết kế và cấu trúc dự án.

- [Kiến Trúc Workspace](./architecture/workspace-architecture-vi.md) - Cấu trúc và tổ chức Monorepo
- [Kiến Trúc Shared Screens](./architecture/shared-screens.md) - Hệ thống chia sẻ màn hình
- [Quản Lý State](./architecture/state-management-vi.md) - Kiến trúc Store (Zustand + Entity Store)
- [Schema Cơ Sở Dữ Liệu](./architecture/database-schema.md) - Thiết kế và quan hệ database

### 💻 [Phát Triển](./development/)

Hướng dẫn phát triển, chuẩn code và quy trình làm việc.

- [Quy Tắc Phát Triển](./development/rules-vi.md) - Quy tắc và quy ước cốt lõi
- [Chuẩn Coding](./development/coding-standards.md) - Style code và best practices
- [Git Workflow](./development/git-workflow.md) - Hướng dẫn quản lý version
- [Phát Triển Component](./development/component-development.md) - Tạo component tái sử dụng

### ✨ [Tính Năng](./features/)

Tài liệu chi tiết về các tính năng.

- [Hệ Thống POS](./features/pos-system-vi.md) - Chức năng bán hàng trực tiếp
- [Quản Lý Kho](./features/inventory-management.md) - Quản lý tồn kho và kho hàng
- [Quản Lý Lô Hàng](./features/product-lot-management-vi.md) - Theo dõi lô và quản lý hạn sử dụng
- [Đơn Hàng B2B](./features/b2b-orders.md) - Quản lý đơn hàng bán buôn
- [Tính Năng Y Tế](./features/medical-features.md) - Quản lý bệnh nhân và đơn thuốc

### 🔌 [API](./api/)

Tài liệu API, services và tích hợp.

- [Tổng Quan Services](./api/services-overview.md) - Kiến trúc tầng service
- [Tích Hợp Supabase](./api/supabase-integration.md) - Sử dụng Database API
- [API Endpoints](./api/endpoints.md) - Các API endpoint có sẵn

### 🗄️ [Cơ Sở Dữ Liệu](./database/)

Schema database, migrations và tài liệu query.

- [Tổng Quan Schema](./database/schema-overview.md) - Schema database đầy đủ
- [Tham Chiếu Bảng](./database/tables-reference-vi.md) - Tài liệu bảng chi tiết
- [Hướng Dẫn Migration](./database/migration-guide.md) - Quy trình migration database

### 🚀 [Triển Khai](./deployment/)

Hướng dẫn triển khai, CI/CD và thiết lập môi trường.

- [Thiết Lập Môi Trường](./deployment/environment-setup.md) - Cấu hình môi trường dev
- [Triển Khai Production](./deployment/production-deployment.md) - Hướng dẫn deploy production
- [CI/CD Pipeline](./deployment/ci-cd-pipeline.md) - Tích hợp/triển khai liên tục

### 📖 [Hướng Dẫn](./guides/)

Hướng dẫn người dùng, tutorials và how-tos.

- [Bắt Đầu](./guides/getting-started-vi.md) - Hướng dẫn khởi đầu nhanh
- [Hướng Dẫn POS](./guides/pos-user-guide.md) - Cách sử dụng hệ thống POS
- [Hướng Dẫn Kho](./guides/inventory-user-guide.md) - Quản lý kho hàng
- [Xử Lý Sự Cố](./guides/troubleshooting.md) - Các vấn đề thường gặp và giải pháp

## 🎯 Đường Dẫn Nhanh

### Cho Developer

1. Bắt đầu: [Bắt Đầu](./guides/getting-started-vi.md)
2. Học: [Kiến Trúc Workspace](./architecture/workspace-architecture-vi.md)
3. Quy tắc: [Quy Tắc Phát Triển](./development/rules-vi.md)
4. State: [Quản Lý State](./architecture/state-management-vi.md)

### Cho Người Dùng

1. Hướng dẫn POS: [Hướng Dẫn POS](./guides/pos-user-guide.md)
2. Hướng dẫn Kho: [Hướng Dẫn Kho](./guides/inventory-user-guide.md)
3. Xử lý sự cố: [Xử Lý Sự Cố](./guides/troubleshooting.md)

### Cho Quản Trị Viên

1. Schema: [Tham Chiếu Bảng](./database/tables-reference-vi.md)
2. Môi trường: [Thiết Lập Môi Trường](./deployment/environment-setup.md)
3. Triển khai: [Triển Khai Production](./deployment/production-deployment.md)

## 📝 Đóng Góp Tài Liệu

Khi thêm tài liệu mới:

1. Đặt file vào thư mục phù hợp
2. Dùng tên file có dạng kebab-case (ví dụ: `product-lot-management-vi.md`)
3. Cập nhật file README.md index tương ứng
4. Tuân theo hướng dẫn style markdown
5. Thêm ví dụ code khi cần
6. Thêm sơ đồ cho khái niệm phức tạp

## 🔄 Cập Nhật Gần Đây

Tài liệu này được cập nhật liên tục. Cập nhật lớn gần nhất: Tháng 10 năm 2025

---

**Cần trợ giúp?** Xem [Hướng Dẫn Xử Lý Sự Cố](./guides/troubleshooting.md) hoặc liên hệ team phát triển.
