# 📊 Tài Liệu Bảng Cơ Sở Dữ Liệu Nam Việt ERP

Tài liệu này cung cấp tổng quan toàn diện về tất cả các bảng cơ sở dữ liệu được sử dụng trong hệ thống Nam Việt ERP.

## Mục Lục

- [Bảng Y Tế & Lịch Hẹn Cốt Lõi](#bảng-y-tế--lịch-hẹn-cốt-lõi)
- [Hồ Sơ Y Tế Điện Tử (EMR)](#hồ-sơ-y-tế-điện-tử-emr)
- [Quản Lý Bán Hàng & Kho](#quản-lý-bán-hàng--kho)
- [Hệ Thống Thương Mại B2B](#hệ-thống-thương-mại-b2b)
- [Quản Lý Tài Chính](#quản-lý-tài-chính)
- [Marketing & Khuyến Mại](#marketing--khuyến-mại)
- [Bảng Hỗ Trợ](#bảng-hỗ-trợ)
- [Tích Hợp Quy Trình Kinh Doanh](#tích-hợp-quy-trình-kinh-doanh)
- [Tổng Quan Schema Cơ Sở Dữ Liệu](#tổng-quan-schema-cơ-sở-dữ-liệu)

---

## 🏥 Bảng Y Tế & Lịch Hẹn Cốt Lõi

### 1. `patients` - Quản Lý Bệnh Nhân/Khách Hàng

**Mục đích**: Đăng ký trung tâm cho bệnh nhân và khách hàng B2B

**Tính năng chính**:

- Hỗ trợ cả bệnh nhân cá nhân và khách hàng doanh nghiệp
- Hệ thống theo dõi điểm thưởng
- Tích hợp lịch sử bệnh án

**Schema**:

```sql
patients (
  patient_id          UUID PRIMARY KEY,
  full_name           VARCHAR NOT NULL,        -- Họ tên đầy đủ
  phone_number        VARCHAR UNIQUE,          -- Số điện thoại
  date_of_birth       DATE,                    -- Ngày sinh
  gender              VARCHAR,                 -- Giới tính
  is_b2b_customer     BOOLEAN DEFAULT FALSE,   -- Là khách hàng B2B
  loyalty_points      INTEGER DEFAULT 0,       -- Điểm thưởng
  allergy_notes       TEXT,                    -- Ghi chú dị ứng
  chronic_diseases    TEXT,                    -- Bệnh mãn tính
  created_at          TIMESTAMP DEFAULT NOW()
)
```

**Mối quan hệ**:

- Được tham chiếu bởi: `appointments`, `medical_visits`, `sales_orders`
- Sử dụng: Đăng ký bệnh nhân, hồ sơ y tế, theo dõi khách hàng B2B

---

### 2. `employees` - Quản Lý Nhân Viên

**Mục đích**: Đăng ký nhân viên y tế và hành chính

**Tính năng chính**:

- Kiểm soát truy cập dựa trên vai trò
- Hỗ trợ tên vai trò tiếng Việt
- Quản lý trạng thái hoạt động/ngừng hoạt động

**Schema**:

```sql
employees (
  employee_id         UUID PRIMARY KEY,
  full_name           VARCHAR NOT NULL,        -- Họ tên
  employee_code       VARCHAR UNIQUE,          -- Mã nhân viên
  role_name           VARCHAR,                 -- 'BacSi', 'DuocSi', 'LeTan'
  is_active           BOOLEAN DEFAULT TRUE,    -- Đang hoạt động
  created_at          TIMESTAMP DEFAULT NOW()
)
```

**Mối quan hệ**:

- Được tham chiếu bởi: `appointments`, `medical_visits`, `sales_orders`
- Sử dụng: Quản lý nhân viên, phân công lịch hẹn, theo dõi ca khám

---

### 3. `appointment_statuses` - Trạng Thái Lịch Hẹn

**Mục đích**: Tra cứu trạng thái lịch hẹn tiêu chuẩn với mã màu

**Tính năng chính**:

- Tên trạng thái tiếng Việt
- Mã màu UI cho hiển thị dashboard
- Quản lý trạng thái nhất quán

**Schema**:

```sql
appointment_statuses (
  status_code         VARCHAR PRIMARY KEY,     -- Mã trạng thái
  status_name_vn      VARCHAR NOT NULL,        -- Tên trạng thái tiếng Việt
  color_code          VARCHAR                  -- Mã màu
)
```

**Mối quan hệ**:

- Được tham chiếu bởi: `appointments.current_status`
- Sử dụng: Mã màu dashboard, quản lý trạng thái

---

### 4. `appointments` - Lịch Hẹn Khám

**Mục đích**: Hệ thống đặt lịch hẹn hoàn chỉnh

**Tính năng chính**:

- Lập lịch bệnh nhân-bác sĩ
- Tích hợp phân công phòng
- Phân loại loại dịch vụ
- Theo dõi thời gian check-in

**Schema**:

```sql
appointments (
  appointment_id      UUID PRIMARY KEY,
  patient_id          UUID REFERENCES patients(patient_id),      -- ID bệnh nhân
  doctor_id           UUID REFERENCES employees(employee_id),    -- ID bác sĩ
  receptionist_id     UUID REFERENCES employees(employee_id),    -- ID lễ tân
  room_id             UUID REFERENCES rooms(room_id),            -- ID phòng
  scheduled_datetime  TIMESTAMP NOT NULL,                        -- Thời gian hẹn
  current_status      VARCHAR REFERENCES appointment_statuses(status_code), -- Trạng thái hiện tại
  service_type        VARCHAR,                                   -- Loại dịch vụ
  check_in_time       TIMESTAMP,                                 -- Thời gian check-in
  created_at          TIMESTAMP DEFAULT NOW()
)
```

**Mối quan hệ**:

- Liên kết với: `patients`, `employees`, `rooms`, `appointment_statuses`
- Được tham chiếu bởi: `medical_visits`
- Sử dụng: Hệ thống lịch hẹn, quản lý cuộc hẹn, phân công phòng

---

### 5. `rooms` - Quản Lý Phòng Y Tế

**Mục đích**: Quản lý cơ sở vật chất và thiết bị

**Tính năng chính**:

- Quản lý sức chứa phòng
- Theo dõi thiết bị
- Trạng thái có sẵn

**Schema**:

```sql
rooms (
  room_id             UUID PRIMARY KEY,
  name                VARCHAR NOT NULL,        -- Tên phòng
  room_type           VARCHAR,                 -- Loại phòng
  capacity            INTEGER,                 -- Sức chứa
  equipment           TEXT[],                  -- Mảng thiết bị
  is_active           BOOLEAN DEFAULT TRUE,    -- Đang hoạt động
  created_at          TIMESTAMP DEFAULT NOW()
)
```

**Mối quan hệ**:

- Được tham chiếu bởi: `appointments.room_id`
- Sử dụng: Đặt phòng, quản lý cơ sở, lịch hẹn

---

## 📋 Hồ Sơ Y Tế Điện Tử (EMR)

### 6. `medical_visits` - Hồ Sơ Ca Khám

**Mục đích**: EMR cốt lõi theo phương pháp SOAP (Subjective, Objective, Assessment, Plan)

**Tính năng chính**:

- Tài liệu y tế hoàn chỉnh
- Tuân thủ phương pháp SOAP
- Lưu trữ sinh hiệu (JSONB)
- Hỗ trợ mã hóa ICD-10

**Schema**:

```sql
medical_visits (
  visit_id                    UUID PRIMARY KEY,
  appointment_id              UUID REFERENCES appointments(appointment_id), -- ID lịch hẹn
  patient_id                  UUID REFERENCES patients(patient_id),         -- ID bệnh nhân
  doctor_id                   UUID REFERENCES employees(employee_id),       -- ID bác sĩ
  visit_date                  DATE NOT NULL,                                -- Ngày khám
  subjective_notes            TEXT,                                          -- Triệu chứng chủ quan
  objective_notes             TEXT,                                          -- Khám lâm sàng
  vital_signs                 JSONB,                                         -- Sinh hiệu
  assessment_diagnosis_icd10  VARCHAR,                                       -- Chẩn đoán ICD-10
  plan_notes                  TEXT,                                          -- Kế hoạch điều trị
  created_at                  TIMESTAMP DEFAULT NOW()
)
```

**Mối quan hệ**:

- Liên kết với: `appointments`, `patients`, `employees`
- Được tham chiếu bởi: `lab_orders`, `prescriptions`, `sales_orders`
- Sử dụng: Tài liệu y tế, theo dõi chẩn đoán, lập kế hoạch điều trị

---

### 7. `lab_orders` - Chỉ Định Xét Nghiệm

**Mục đích**: Quản lý chỉ định xét nghiệm và theo dõi kết quả

**Tính năng chính**:

- Tích hợp ca khám bệnh
- Theo dõi thực hiện xét nghiệm
- Quản lý kết quả
- Phân loại dịch vụ

**Schema**:

```sql
lab_orders (
  order_id                UUID PRIMARY KEY,
  visit_id                UUID REFERENCES medical_visits(visit_id), -- ID ca khám
  service_name            VARCHAR NOT NULL,                         -- Tên dịch vụ
  preliminary_diagnosis   TEXT,                                     -- Chẩn đoán sơ bộ
  is_executed             BOOLEAN DEFAULT FALSE,                    -- Đã thực hiện
  result_received_at      TIMESTAMP,                                -- Thời gian nhận kết quả
  created_at              TIMESTAMP DEFAULT NOW()
)
```

**Mối quan hệ**:

- Liên kết với: `medical_visits`
- Sử dụng: Quản lý xét nghiệm, dịch vụ chẩn đoán, theo dõi kết quả

---

### 8. `prescriptions` - Đơn Thuốc Điện Tử

**Mục đích**: Quản lý đơn thuốc điện tử với cảnh báo tương tác thuốc AI

**Tính năng chính**:

- Quản lý hướng dẫn liều lượng
- Cảnh báo tương tác thuốc do AI
- Theo dõi số lượng thuốc
- Tích hợp ca khám bệnh

**Schema**:

```sql
prescriptions (
  prescription_item_id    UUID PRIMARY KEY,
  visit_id                UUID REFERENCES medical_visits(visit_id), -- ID ca khám
  product_id              INTEGER REFERENCES products(id),           -- ID sản phẩm
  quantity_ordered        INTEGER NOT NULL,                          -- Số lượng kê
  dosage_instruction      TEXT,                                      -- Hướng dẫn liều lượng
  ai_interaction_warning  TEXT,                                      -- Cảnh báo AI
  created_at              TIMESTAMP DEFAULT NOW()
)
```

**Mối quan hệ**:

- Liên kết với: `medical_visits`, `products`
- Được tham chiếu bởi: `sales_order_items`
- Sử dụng: Quản lý đơn thuốc, kiểm tra tương tác thuốc, phát thuốc

---

## 💰 Quản Lý Bán Hàng & Kho

### 9. `sales_orders` - Quản Lý Giao Dịch

**Mục đích**: Hệ thống bán hàng đa kênh xử lý POS, B2B, và thanh toán y tế

**Tính năng chính**:

- Hỗ trợ bán hàng đa kênh
- Theo dõi phương thức thanh toán
- Quy trình trạng thái vận hành
- Tích hợp ca khám bệnh

**Schema**:

```sql
sales_orders (
  order_id                UUID PRIMARY KEY,
  patient_id              UUID REFERENCES patients(patient_id),     -- ID bệnh nhân
  medical_visit_id        UUID REFERENCES medical_visits(visit_id), -- ID ca khám
  order_type              VARCHAR NOT NULL,                          -- 'POS', 'B2B', 'TMDT'
  created_by_employee_id  UUID REFERENCES employees(employee_id),    -- Tạo bởi nhân viên
  order_datetime          TIMESTAMP DEFAULT NOW(),                   -- Thời gian đặt hàng
  total_value             DECIMAL(15,2) NOT NULL,                    -- Tổng giá trị
  payment_method          VARCHAR,                                   -- Phương thức thanh toán
  payment_status          VARCHAR,                                   -- Trạng thái thanh toán
  operational_status      VARCHAR                                    -- Trạng thái xử lý
)
```

**Mối quan hệ**:

- Liên kết với: `patients`, `medical_visits`, `employees`
- Được tham chiếu bởi: `sales_order_items`
- Sử dụng: Hệ thống POS, thanh toán y tế, theo dõi giao dịch

---

### 10. `sales_order_items` - Chi Tiết Đơn Hàng

**Mục đích**: Phân tích chi tiết các giao dịch bán hàng

**Tính năng chính**:

- Hỗ trợ sản phẩm và dịch vụ
- In liều lượng đơn thuốc
- Theo dõi giá đơn vị
- Quản lý số lượng

**Schema**:

```sql
sales_order_items (
  item_id             UUID PRIMARY KEY,
  order_id            UUID REFERENCES sales_orders(order_id),    -- ID đơn hàng
  product_id          INTEGER REFERENCES products(id),           -- ID sản phẩm
  quantity            INTEGER NOT NULL,                          -- Số lượng
  unit_price          DECIMAL(10,2) NOT NULL,                    -- Giá đơn vị
  is_service          BOOLEAN DEFAULT FALSE,                     -- Là dịch vụ
  dosage_printed      TEXT,                                      -- Liều lượng in ra
  created_at          TIMESTAMP DEFAULT NOW()
)
```

**Mối quan hệ**:

- Liên kết với: `sales_orders`, `products`
- Sử dụng: Chi tiết đơn hàng, phí dịch vụ, phát thuốc

---

### 11. `products` - Danh Mục Sản Phẩm

**Mục đích**: Cơ sở dữ liệu sản phẩm/thuốc toàn diện

**Tính năng chính**:

- Theo dõi đăng ký y tế
- Thông tin sản phẩm toàn diện
- Hướng dẫn sử dụng (HDSD)
- Chỉ báo bệnh mãn tính
- Hỗ trợ đa đường dùng

**Schema**:

```sql
products (
  id                      SERIAL PRIMARY KEY,
  name                    VARCHAR NOT NULL,                -- Tên sản phẩm
  sku                     VARCHAR UNIQUE,                  -- Mã SKU
  cost_price              DECIMAL(10,2),                   -- Giá vốn
  retail_price            DECIMAL(10,2),                   -- Giá bán lẻ
  category                VARCHAR,                         -- Danh mục
  manufacturer            VARCHAR,                         -- Nhà sản xuất
  registration_number     VARCHAR,                         -- Số đăng ký
  hdsd_contraindications  TEXT,                           -- Chống chỉ định
  hdsd_side_effects       TEXT,                           -- Tác dụng phụ
  hdsd_interactions       TEXT,                           -- Tương tác thuốc
  hdsd_overdose          TEXT,                            -- Quá liều
  is_chronic             BOOLEAN DEFAULT FALSE,           -- Thuốc mãn tính
  route                  VARCHAR,                         -- Đường dùng
  status                 VARCHAR DEFAULT 'active',       -- Trạng thái
  created_at             TIMESTAMP DEFAULT NOW()
)
```

**Mối quan hệ**:

- Được tham chiếu bởi: `prescriptions`, `sales_order_items`, `b2b_quote_items`, `inventory`
- Sử dụng: Quản lý sản phẩm, hệ thống đơn thuốc, theo dõi kho

---

### 12. `products_with_inventory` - View Sản Phẩm Kèm Tồn Kho

**Mục đích**: View cơ sở dữ liệu kết hợp dữ liệu sản phẩm với mức tồn kho hiện tại

**Tính năng chính**:

- Tích hợp tồn kho thời gian thực
- Truy vấn có nhận thức về kho
- Hỗ trợ đa kho

**Định nghĩa View**:

```sql
CREATE VIEW products_with_inventory AS
SELECT
  p.*,
  COALESCE(SUM(i.quantity), 0) as stock_quantity  -- Số lượng tồn kho
FROM products p
LEFT JOIN inventory i ON p.id = i.product_id
GROUP BY p.id;
```

**Sử dụng**: Truy vấn sản phẩm có nhận thức kho, kiểm tra tồn kho

---

### 13. `inventory` - Quản Lý Tồn Kho

**Mục đích**: Theo dõi tồn kho đa kho

**Tính năng chính**:

- Số lượng theo từng kho
- Mức tồn kho tối thiểu/tối đa
- Quản lý đặt hàng tự động

**Schema**:

```sql
inventory (
  id              SERIAL PRIMARY KEY,
  product_id      INTEGER REFERENCES products(id),      -- ID sản phẩm
  warehouse_id    INTEGER REFERENCES warehouses(id),    -- ID kho
  quantity        INTEGER NOT NULL DEFAULT 0,           -- Số lượng
  min_stock       INTEGER DEFAULT 0,                    -- Tồn kho tối thiểu
  max_stock       INTEGER,                              -- Tồn kho tối đa
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
)
```

**Mối quan hệ**:

- Liên kết với: `products`, `warehouses`
- Sử dụng: Theo dõi tồn kho, quản lý đặt hàng, vận hành kho

---

### 14. `warehouses` - Quản Lý Kho

**Mục đích**: Quản lý nhiều địa điểm lưu trữ

**Tính năng chính**:

- Hỗ trợ đa địa điểm
- Phân loại kho
- Theo dõi vị trí

**Schema**:

```sql
warehouses (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR NOT NULL,           -- Tên kho
  location    VARCHAR,                    -- Vị trí
  created_at  TIMESTAMP DEFAULT NOW()
)
```

**Mối quan hệ**:

- Được tham chiếu bởi: `inventory`
- Sử dụng: Kho đa địa điểm, vận hành kho

---

### 15. `purchase_orders` - Quản Lý Đơn Đặt Hàng

**Mục đích**: Theo dõi đơn đặt hàng nhà cung cấp

**Tính năng chính**:

- Quản lý quan hệ nhà cung cấp
- Quy trình trạng thái đơn hàng
- Phân công nhân viên

**Schema**:

```sql
purchase_orders (
  id            SERIAL PRIMARY KEY,
  supplier_id   INTEGER,                           -- ID nhà cung cấp
  status        VARCHAR DEFAULT 'pending',         -- Trạng thái
  notes         TEXT,                              -- Ghi chú
  created_by    UUID REFERENCES employees(employee_id), -- Tạo bởi
  created_at    TIMESTAMP DEFAULT NOW()
)
```

**Mối quan hệ**:

- Liên kết với: suppliers, employees
- Sử dụng: Mua hàng, quản lý nhà cung cấp

---

## 🏢 Hệ Thống Thương Mại B2B

### 16. `b2b_customers` - Quản Lý Khách Hàng Bán Buôn

**Mục đích**: Đăng ký khách hàng doanh nghiệp (bệnh viện, nhà thuốc, phòng khám)

**Tính năng chính**:

- Phân loại khách hàng doanh nghiệp
- Quản lý hạn mức tín dụng
- Theo dõi điều kiện thanh toán
- Hệ thống mã hóa khách hàng

**Schema**:

```sql
b2b_customers (
  customer_id         UUID PRIMARY KEY,
  customer_name       VARCHAR NOT NULL,          -- Tên khách hàng
  customer_code       VARCHAR UNIQUE,            -- Mã khách hàng
  customer_type       VARCHAR,                   -- 'hospital', 'pharmacy', 'clinic'
  credit_limit        DECIMAL(15,2) DEFAULT 0,   -- Hạn mức tín dụng
  payment_terms_days  INTEGER DEFAULT 30,        -- Số ngày thanh toán
  created_at          TIMESTAMP DEFAULT NOW()
)
```

**Mối quan hệ**:

- Được tham chiếu bởi: `b2b_quotes`
- Sử dụng: Quản lý khách hàng bán buôn, theo dõi tín dụng

---

### 17. `b2b_quotes` - Hệ Thống Báo Giá B2B

**Mục đích**: Quản lý chu trình báo giá bán buôn 7 giai đoạn

**Tính năng chính**:

- Hệ thống đánh số báo giá
- Quy trình 7 giai đoạn
- Quản lý thời hạn hiệu lực
- Phân công nhân viên

**Schema**:

```sql
b2b_quotes (
  quote_id              UUID PRIMARY KEY,
  quote_number          VARCHAR UNIQUE NOT NULL,                   -- Số báo giá
  customer_id           UUID REFERENCES b2b_customers(customer_id), -- ID khách hàng
  customer_name         VARCHAR,                                   -- Tên khách hàng
  quote_stage           INTEGER DEFAULT 1,                         -- Giai đoạn 1-7
  total_value           DECIMAL(15,2) DEFAULT 0,                   -- Tổng giá trị
  valid_until           DATE,                                      -- Hiệu lực đến
  created_by_employee_id UUID REFERENCES employees(employee_id),    -- Tạo bởi nhân viên
  created_at            TIMESTAMP DEFAULT NOW()
)
```

**Mối quan hệ**:

- Liên kết với: `b2b_customers`, `employees`
- Được tham chiếu bởi: `b2b_quote_items`
- Sử dụng: Quy trình bán B2B, quản lý báo giá, định giá bán buôn

---

### 18. `b2b_quote_items` - Chi Tiết Báo Giá

**Mục đích**: Định giá B2B chi tiết với chiết khấu số lượng

**Tính năng chính**:

- Định giá theo số lượng
- Quản lý chiết khấu
- Tính toán tổng phụ
- Tích hợp sản phẩm

**Schema**:

```sql
b2b_quote_items (
  item_id           UUID PRIMARY KEY,
  quote_id          UUID REFERENCES b2b_quotes(quote_id),    -- ID báo giá
  product_id        INTEGER REFERENCES products(id),         -- ID sản phẩm
  quantity          INTEGER NOT NULL,                        -- Số lượng
  unit_price        DECIMAL(10,2) NOT NULL,                  -- Giá đơn vị
  discount_percent  DECIMAL(5,2) DEFAULT 0,                  -- % chiết khấu
  subtotal          DECIMAL(12,2) NOT NULL,                  -- Tổng phụ
  created_at        TIMESTAMP DEFAULT NOW()
)
```

**Mối quan hệ**:

- Liên kết với: `b2b_quotes`, `products`
- Sử dụng: Định giá B2B, chiết khấu số lượng, chi tiết báo giá

---

## 💳 Quản Lý Tài Chính

### 19. `funds` - Quản Lý Đa Quỹ

**Mục đích**: Quản lý các tài khoản và quỹ tài chính riêng biệt

**Tính năng chính**:

- Nhiều loại tài khoản
- Tích hợp tài khoản ngân hàng
- Theo dõi số dư ban đầu
- Phân loại quỹ

**Schema**:

```sql
funds (
  id                SERIAL PRIMARY KEY,
  name              VARCHAR NOT NULL,              -- Tên quỹ
  type              VARCHAR,                       -- 'cash', 'bank', 'credit'
  initial_balance   DECIMAL(15,2) DEFAULT 0,       -- Số dư ban đầu
  account_number    VARCHAR,                       -- Số tài khoản
  bank_id           INTEGER REFERENCES banks(id),  -- ID ngân hàng
  created_at        TIMESTAMP DEFAULT NOW()
)
```

**Mối quan hệ**:

- Liên kết với: `banks`
- Được tham chiếu bởi: `transactions`, `internal_fund_transfers`
- Sử dụng: Kế toán đa quỹ, quản lý tài khoản ngân hàng

---

### 20. `banks` - Dữ Liệu Tham Chiếu Ngân Hàng

**Mục đích**: Tích hợp hệ thống ngân hàng Việt Nam

**Tính năng chính**:

- Đăng ký ngân hàng Việt Nam
- Hỗ trợ số BIN
- Tiêu chuẩn hóa mã ngân hàng
- Quản lý tài sản logo

**Schema**:

```sql
banks (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR NOT NULL,        -- Tên ngân hàng
  code        VARCHAR UNIQUE,          -- Mã ngân hàng
  bin         VARCHAR,                 -- Số nhận dạng ngân hàng
  short_name  VARCHAR,                 -- Tên viết tắt
  logo        VARCHAR,                 -- URL logo
  created_at  TIMESTAMP DEFAULT NOW()
)
```

**Mối quan hệ**:

- Được tham chiếu bởi: `funds`
- Sử dụng: Tích hợp ngân hàng, xử lý thanh toán

---

### 21. `transactions` - Nhật Ký Giao Dịch Tài Chính

**Mục đích**: Dấu vết kiểm toán tài chính hoàn chỉnh với quy trình phê duyệt

**Tính năng chính**:

- Quy trình phê duyệt đa trạng thái
- Tạo mã QR
- Theo dõi phương thức thanh toán
- Dấu vết kiểm toán hoàn chỉnh

**Schema**:

```sql
transactions (
  id              SERIAL PRIMARY KEY,
  fund_id         INTEGER REFERENCES funds(id),           -- ID quỹ
  type            VARCHAR NOT NULL,                        -- 'income', 'expense'
  amount          DECIMAL(15,2) NOT NULL,                  -- Số tiền
  description     TEXT,                                    -- Mô tả
  status          VARCHAR DEFAULT 'pending',               -- 'pending', 'approved', 'rejected'
  approved_by     UUID REFERENCES employees(employee_id),  -- Phê duyệt bởi
  payment_method  VARCHAR,                                 -- Phương thức thanh toán
  qr_code_url     VARCHAR,                                 -- URL mã QR
  transaction_date DATE DEFAULT CURRENT_DATE,              -- Ngày giao dịch
  created_at      TIMESTAMP DEFAULT NOW()
)
```

**Mối quan hệ**:

- Liên kết với: `funds`, `employees`
- Được tham chiếu bởi: `transaction-attachments`
- Sử dụng: Theo dõi tài chính, quản lý tiền mặt, dấu vết kiểm toán

---

### 22. `internal_fund_transfers` - Chuyển Tiền Nội Bộ

**Mục đích**: Chuyển tiền giữa các tài khoản khác nhau

**Tính năng chính**:

- Chuyển tiền giữa các tài khoản
- Tài liệu chuyển tiền
- Theo dõi số tiền

**Schema**:

```sql
internal_fund_transfers (
  id            SERIAL PRIMARY KEY,
  from_fund_id  INTEGER REFERENCES funds(id),    -- Quỹ nguồn
  to_fund_id    INTEGER REFERENCES funds(id),    -- Quỹ đích
  amount        DECIMAL(15,2) NOT NULL,          -- Số tiền
  description   TEXT,                            -- Mô tả
  created_at    TIMESTAMP DEFAULT NOW()
)
```

**Mối quan hệ**:

- Liên kết với: `funds` (cả nguồn và đích)
- Sử dụng: Cân bằng quỹ, chuyển tiền nội bộ

---

### 23. `transaction-attachments` - Lưu Trữ Tài Liệu

**Mục đích**: Lưu trữ tài liệu và biên lai tài chính

**Tính năng chính**:

- Hỗ trợ đính kèm tệp
- Tài liệu giao dịch
- Hỗ trợ dấu vết kiểm toán

**Schema**:

```sql
transaction_attachments (
  id              SERIAL PRIMARY KEY,
  transaction_id  INTEGER REFERENCES transactions(id),  -- ID giao dịch
  file_name       VARCHAR NOT NULL,                     -- Tên tệp
  file_url        VARCHAR NOT NULL,                     -- URL tệp
  file_size       INTEGER,                              -- Kích thước tệp
  file_type       VARCHAR,                              -- Loại tệp
  uploaded_at     TIMESTAMP DEFAULT NOW()
)
```

**Mối quan hệ**:

- Liên kết với: `transactions`
- Sử dụng: Lưu trữ biên lai, tài liệu, hỗ trợ kiểm toán

---

## 🎯 Marketing & Khuyến Mại

### 24. `promotions` - Chiến Dịch Marketing

**Mục đích**: Quản lý chiến dịch khuyến mại

**Tính năng chính**:

- Nhiều loại khuyến mại
- Hiệu lực theo ngày
- Targeting dựa trên điều kiện
- Chiết khấu theo giá trị

**Schema**:

```sql
promotions (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR NOT NULL,                 -- Tên khuyến mại
  type        VARCHAR NOT NULL,                 -- 'percentage', 'fixed_amount'
  value       DECIMAL(10,2) NOT NULL,           -- Giá trị
  start_date  DATE NOT NULL,                    -- Ngày bắt đầu
  end_date    DATE NOT NULL,                    -- Ngày kết thúc
  conditions  JSONB,                            -- Điều kiện linh hoạt
  is_active   BOOLEAN DEFAULT TRUE,             -- Đang hoạt động
  created_at  TIMESTAMP DEFAULT NOW()
)
```

**Mối quan hệ**:

- Được tham chiếu bởi: `vouchers`
- Sử dụng: Chiến dịch marketing, quản lý chiết khấu

---

### 25. `vouchers` - Phiếu Khuyến Mại

**Mục đích**: Quản lý mã coupon cá nhân

**Tính năng chính**:

- Mã voucher duy nhất
- Theo dõi giới hạn sử dụng
- Đếm lần sử dụng
- Liên kết khuyến mại

**Schema**:

```sql
vouchers (
  id            SERIAL PRIMARY KEY,
  code          VARCHAR UNIQUE NOT NULL,               -- Mã voucher
  promotion_id  INTEGER REFERENCES promotions(id),     -- ID khuyến mại
  usage_limit   INTEGER DEFAULT 1,                     -- Giới hạn sử dụng
  times_used    INTEGER DEFAULT 0,                     -- Số lần đã dùng
  created_at    TIMESTAMP DEFAULT NOW()
)
```

**Mối quan hệ**:

- Liên kết với: `promotions`
- Sử dụng: Hệ thống coupon, theo dõi khuyến mại

---

### 26. `product-images` - Quản Lý Tài Sản Media

**Mục đích**: Lưu trữ hình ảnh và media sản phẩm

**Tính năng chính**:

- Tài sản hình ảnh sản phẩm
- Hỗ trợ nhiều hình ảnh
- Quản lý URL media

**Schema**:

```sql
product_images (
  id          SERIAL PRIMARY KEY,
  product_id  INTEGER REFERENCES products(id),  -- ID sản phẩm
  image_url   VARCHAR NOT NULL,                 -- URL hình ảnh
  alt_text    VARCHAR,                          -- Văn bản thay thế
  sort_order  INTEGER DEFAULT 0,               -- Thứ tự sắp xếp
  created_at  TIMESTAMP DEFAULT NOW()
)
```

**Mối quan hệ**:

- Liên kết với: `products`
- Sử dụng: Hiển thị danh mục sản phẩm, chức năng thương mại điện tử

---

## 🔄 Tích Hợp Quy Trình Kinh Doanh

### Quy Trình Kinh Doanh Chính

1. **Quy Trình Chăm Sóc Bệnh Nhân**:

   ```
   patients → appointments → medical_visits → prescriptions → sales_orders
   ```

2. **Quy Trình Quản Lý Kho**:

   ```
   products → inventory → sales_order_items → cập nhật tồn kho
   ```

3. **Quy Trình Bán Hàng B2B**:

   ```
   b2b_customers → b2b_quotes → b2b_quote_items → chuyển đổi thành sales_orders
   ```

4. **Chuỗi Quản Lý Tài Chính**:
   ```
   sales_orders → transactions → funds → banks
   ```

### Tích Hợp Chính

- **Tích Hợp Y Tế-Bán Hàng**: Ca khám bệnh tự động tạo đơn thuốc chuyển thành đơn bán hàng
- **Bán Hàng Đa Kênh**: Hệ thống bán hàng đơn lẻ xử lý POS, B2B, và thanh toán y tế
- **Đồng Bộ Kho**: Cập nhật tồn kho thời gian thực trên tất cả kênh bán hàng
- **Hợp Nhất Tài Chính**: Tất cả nguồn doanh thu chảy vào theo dõi tài chính thống nhất

### Tóm Tắt Mối Quan Hệ Dữ Liệu

- **26 bảng liên kết** tạo thành hệ sinh thái ERP hoàn chỉnh
- **Khóa chính UUID** cho tính duy nhất toàn cục và khả năng mở rộng
- **Mối quan hệ khóa ngoại** duy trì tính toàn vẹn tham chiếu
- **Trường JSONB** cho dữ liệu y tế và điều kiện linh hoạt
- **Truy vấn dựa trên View** cho báo cáo kho và thời gian thực

---

## 📊 Tổng Quan Schema Cơ Sở Dữ Liệu

### Phân Loại Bảng Theo Chức Năng

| Danh Mục           | Số Bảng | Mục Đích Chính                                  |
| ------------------ | ------- | ----------------------------------------------- |
| **Y Tế Cốt Lõi**   | 5 bảng  | Chăm sóc bệnh nhân, lịch hẹn, quản lý nhân viên |
| **Hệ Thống EMR**   | 3 bảng  | Hồ sơ y tế, đơn thuốc, chỉ định xét nghiệm      |
| **Bán Hàng & Kho** | 8 bảng  | Xử lý giao dịch, quản lý tồn kho                |
| **Thương Mại B2B** | 3 bảng  | Hoạt động bán buôn, báo giá                     |
| **Tài Chính**      | 5 bảng  | Kế toán đa quỹ, tích hợp ngân hàng              |
| **Marketing**      | 2 bảng  | Khuyến mại, quản lý voucher                     |

### Cân Nhắc Hiệu Suất

- **Khóa ngoại được lập chỉ mục** cho hiệu suất join tối ưu
- **Bảng phân vùng** cho dữ liệu giao dịch khối lượng lớn
- **Materialized views** cho truy vấn báo cáo phức tạp
- **Lập chỉ mục JSONB** cho truy vấn dữ liệu y tế

### Bảo Mật & Tuân Thủ

- **Khóa chính dựa trên UUID** ngăn chặn tấn công liệt kê
- **Bảo mật cấp hàng** cho bảo vệ dữ liệu bệnh nhân
- **Ghi log kiểm toán** cho giao dịch tài chính
- **Mã hóa dữ liệu** cho thông tin y tế nhạy cảm

---

_Cập nhật lần cuối: $(date)_
_Tạo từ Phân Tích Cơ Sở Dữ Liệu Nam Việt ERP_
