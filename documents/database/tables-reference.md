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
  full_name           VARCHAR NOT NULL,
  phone_number        VARCHAR UNIQUE,
  date_of_birth       DATE,
  gender              VARCHAR,
  is_b2b_customer     BOOLEAN DEFAULT FALSE,
  loyalty_points      INTEGER DEFAULT 0,
  allergy_notes       TEXT,
  chronic_diseases    TEXT,
  created_at          TIMESTAMP DEFAULT NOW()
)
```

**Relationships**:

- Referenced by: `appointments`, `medical_visits`, `sales_orders`
- Usage: Patient registration, medical records, B2B customer tracking

---

### 2. `employees` - Staff Management

**Purpose**: Medical and administrative staff registry

**Key Features**:

- Role-based access control
- Vietnamese role names support
- Active/inactive status management

**Schema**:

```sql
employees (
  employee_id         UUID PRIMARY KEY,
  full_name           VARCHAR NOT NULL,
  employee_code       VARCHAR UNIQUE,
  role_name           VARCHAR, -- 'BacSi', 'DuocSi', 'LeTan'
  is_active           BOOLEAN DEFAULT TRUE,
  created_at          TIMESTAMP DEFAULT NOW()
)
```

**Relationships**:

- Referenced by: `appointments`, `medical_visits`, `sales_orders`
- Usage: Staff management, appointment assignments, medical visit tracking

---

### 3. `appointment_statuses` - Status Reference

**Purpose**: Standardized appointment status lookup with color coding

**Key Features**:

- Vietnamese status names
- UI color codes for dashboard display
- Consistent status management

**Schema**:

```sql
appointment_statuses (
  status_code         VARCHAR PRIMARY KEY,
  status_name_vn      VARCHAR NOT NULL,
  color_code          VARCHAR
)
```

**Relationships**:

- Referenced by: `appointments.current_status`
- Usage: Dashboard color coding, status management

---

### 4. `appointments` - Appointment Scheduling

**Purpose**: Complete appointment booking system

**Key Features**:

- Patient-doctor scheduling
- Room assignment integration
- Service type categorization
- Check-in time tracking

**Schema**:

```sql
appointments (
  appointment_id      UUID PRIMARY KEY,
  patient_id          UUID REFERENCES patients(patient_id),
  doctor_id           UUID REFERENCES employees(employee_id),
  receptionist_id     UUID REFERENCES employees(employee_id),
  room_id             UUID REFERENCES rooms(room_id),
  scheduled_datetime  TIMESTAMP NOT NULL,
  current_status      VARCHAR REFERENCES appointment_statuses(status_code),
  service_type        VARCHAR,
  check_in_time       TIMESTAMP,
  created_at          TIMESTAMP DEFAULT NOW()
)
```

**Relationships**:

- Links to: `patients`, `employees`, `rooms`, `appointment_statuses`
- Referenced by: `medical_visits`
- Usage: Scheduling system, appointment management, room assignments

---

### 5. `rooms` - Medical Room Management

**Purpose**: Facility and equipment management

**Key Features**:

- Room capacity management
- Equipment tracking
- Availability status

**Schema**:

```sql
rooms (
  room_id             UUID PRIMARY KEY,
  name                VARCHAR NOT NULL,
  room_type           VARCHAR,
  capacity            INTEGER,
  equipment           TEXT[], -- Array of equipment
  is_active           BOOLEAN DEFAULT TRUE,
  created_at          TIMESTAMP DEFAULT NOW()
)
```

**Relationships**:

- Referenced by: `appointments.room_id`
- Usage: Room booking, facility management, appointment scheduling

---

## 📋 Electronic Medical Records (EMR)

### 6. `medical_visits` - Medical Visit Records

**Purpose**: Core EMR following SOAP (Subjective, Objective, Assessment, Plan) methodology

**Key Features**:

- Complete medical documentation
- SOAP methodology compliance
- Vital signs storage (JSONB)
- ICD-10 coding support

**Schema**:

```sql
medical_visits (
  visit_id                    UUID PRIMARY KEY,
  appointment_id              UUID REFERENCES appointments(appointment_id),
  patient_id                  UUID REFERENCES patients(patient_id),
  doctor_id                   UUID REFERENCES employees(employee_id),
  visit_date                  DATE NOT NULL,
  subjective_notes            TEXT, -- Patient complaints
  objective_notes             TEXT, -- Physical examination
  vital_signs                 JSONB, -- Blood pressure, temperature, etc.
  assessment_diagnosis_icd10  VARCHAR, -- ICD-10 diagnosis code
  plan_notes                  TEXT, -- Treatment plan
  created_at                  TIMESTAMP DEFAULT NOW()
)
```

**Relationships**:

- Links to: `appointments`, `patients`, `employees`
- Referenced by: `lab_orders`, `prescriptions`, `sales_orders`
- Usage: Medical documentation, diagnosis tracking, treatment planning

---

### 7. `lab_orders` - Laboratory Orders

**Purpose**: Lab test management and result tracking

**Key Features**:

- Medical visit integration
- Test execution tracking
- Result management
- Service categorization

**Schema**:

```sql
lab_orders (
  order_id                UUID PRIMARY KEY,
  visit_id                UUID REFERENCES medical_visits(visit_id),
  service_name            VARCHAR NOT NULL,
  preliminary_diagnosis   TEXT,
  is_executed             BOOLEAN DEFAULT FALSE,
  result_received_at      TIMESTAMP,
  created_at              TIMESTAMP DEFAULT NOW()
)
```

**Relationships**:

- Links to: `medical_visits`
- Usage: Lab test management, diagnostic services, result tracking

---

### 8. `prescriptions` - Electronic Prescriptions

**Purpose**: Digital prescription management with AI-powered drug interaction warnings

**Key Features**:

- Dosage instruction management
- AI-powered interaction warnings
- Medication quantity tracking
- Medical visit integration

**Schema**:

```sql
prescriptions (
  prescription_item_id    UUID PRIMARY KEY,
  visit_id                UUID REFERENCES medical_visits(visit_id),
  product_id              INTEGER REFERENCES products(id),
  quantity_ordered        INTEGER NOT NULL,
  dosage_instruction      TEXT,
  ai_interaction_warning  TEXT, -- AI-generated warnings
  created_at              TIMESTAMP DEFAULT NOW()
)
```

**Relationships**:

- Links to: `medical_visits`, `products`
- Referenced by: `sales_order_items`
- Usage: Prescription management, drug interaction checking, medication dispensing

---

## 💰 Sales & Inventory Management

### 9. `sales_orders` - Transaction Management

**Purpose**: Universal sales system handling POS, B2B, and medical billing

**Key Features**:

- Multi-channel sales support
- Payment method tracking
- Operational status workflow
- Medical visit integration

**Schema**:

```sql
sales_orders (
  order_id                UUID PRIMARY KEY,
  patient_id              UUID REFERENCES patients(patient_id),
  medical_visit_id        UUID REFERENCES medical_visits(visit_id),
  order_type              VARCHAR NOT NULL, -- 'POS', 'B2B', 'TMDT'
  created_by_employee_id  UUID REFERENCES employees(employee_id),
  order_datetime          TIMESTAMP DEFAULT NOW(),
  total_value             DECIMAL(15,2) NOT NULL,
  payment_method          VARCHAR, -- 'cash', 'card', 'transfer'
  payment_status          VARCHAR, -- Payment tracking
  operational_status      VARCHAR  -- Order processing status
)
```

**Relationships**:

- Links to: `patients`, `medical_visits`, `employees`
- Referenced by: `sales_order_items`
- Usage: POS system, medical billing, transaction tracking

---

### 10. `sales_order_items` - Order Line Items

**Purpose**: Detailed breakdown of sales transactions

**Key Features**:

- Product and service support
- Prescription dosage printing
- Unit pricing tracking
- Quantity management

**Schema**:

```sql
sales_order_items (
  item_id             UUID PRIMARY KEY,
  order_id            UUID REFERENCES sales_orders(order_id),
  product_id          INTEGER REFERENCES products(id),
  quantity            INTEGER NOT NULL,
  unit_price          DECIMAL(10,2) NOT NULL,
  is_service          BOOLEAN DEFAULT FALSE,
  dosage_printed      TEXT, -- For prescription items
  created_at          TIMESTAMP DEFAULT NOW()
)
```

**Relationships**:

- Links to: `sales_orders`, `products`
- Usage: Order details, service charges, medication dispensing

---

### 11. `products` - Product Catalog

**Purpose**: Comprehensive product/medication database

**Key Features**:

- Medical registration tracking
- Comprehensive product information
- Usage instructions (HDSD)
- Chronic disease indicators
- Multi-route administration support

**Schema**:

```sql
products (
  id                      SERIAL PRIMARY KEY,
  name                    VARCHAR NOT NULL,
  sku                     VARCHAR UNIQUE,
  cost_price              DECIMAL(10,2),
  retail_price            DECIMAL(10,2),
  category                VARCHAR,
  manufacturer            VARCHAR,
  registration_number     VARCHAR, -- Medical registration
  hdsd_contraindications  TEXT, -- Usage instructions
  hdsd_side_effects       TEXT,
  hdsd_interactions       TEXT,
  hdsd_overdose          TEXT,
  is_chronic             BOOLEAN DEFAULT FALSE,
  route                  VARCHAR, -- Administration route
  status                 VARCHAR DEFAULT 'active',
  created_at             TIMESTAMP DEFAULT NOW()
)
```

**Relationships**:

- Referenced by: `prescriptions`, `sales_order_items`, `b2b_quote_items`, `inventory`
- Usage: Product management, prescription system, inventory tracking

---

### 12. `products_with_inventory` - Real-time Stock View

**Purpose**: Database view combining product data with current inventory levels

**Key Features**:

- Real-time stock integration
- Inventory-aware queries
- Multi-warehouse support

**View Definition**:

```sql
CREATE VIEW products_with_inventory AS
SELECT
  p.*,
  COALESCE(SUM(i.quantity), 0) as stock_quantity
FROM products p
LEFT JOIN inventory i ON p.id = i.product_id
GROUP BY p.id;
```

**Usage**: Inventory-aware product queries, stock checking

---

### 13. `inventory` - Stock Management

**Purpose**: Multi-warehouse inventory tracking

**Key Features**:

- Warehouse-specific quantities
- Min/max stock levels
- Automated reorder management

**Schema**:

```sql
inventory (
  id              SERIAL PRIMARY KEY,
  product_id      INTEGER REFERENCES products(id),
  warehouse_id    INTEGER REFERENCES warehouses(id),
  quantity        INTEGER NOT NULL DEFAULT 0,
  min_stock       INTEGER DEFAULT 0,
  max_stock       INTEGER,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
)
```

**Relationships**:

- Links to: `products`, `warehouses`
- Usage: Stock tracking, reorder management, warehouse operations

---

### 14. `warehouses` - Warehouse Management

**Purpose**: Multiple storage location management

**Key Features**:

- Multi-location support
- Warehouse categorization
- Location tracking

**Schema**:

```sql
warehouses (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR NOT NULL,
  location    VARCHAR,
  created_at  TIMESTAMP DEFAULT NOW()
)
```

**Relationships**:

- Referenced by: `inventory`
- Usage: Multi-location inventory, warehouse operations

---

### 15. `purchase_orders` - Procurement Management

**Purpose**: Supplier purchase order tracking

**Key Features**:

- Supplier relationship management
- Order status workflow
- Employee assignment

**Schema**:

```sql
purchase_orders (
  id            SERIAL PRIMARY KEY,
  supplier_id   INTEGER,
  status        VARCHAR DEFAULT 'pending',
  notes         TEXT,
  created_by    UUID REFERENCES employees(employee_id),
  created_at    TIMESTAMP DEFAULT NOW()
)
```

**Relationships**:

- Links to: suppliers, employees
- Usage: Procurement, supplier management

---

## 🏢 B2B Commerce System

### 16. `b2b_customers` - Wholesale Customer Management

**Purpose**: Business client registry (hospitals, pharmacies, clinics)

**Key Features**:

- Business customer categorization
- Credit limit management
- Payment term tracking
- Customer coding system

**Schema**:

```sql
b2b_customers (
  customer_id         UUID PRIMARY KEY,
  customer_name       VARCHAR NOT NULL,
  customer_code       VARCHAR UNIQUE,
  customer_type       VARCHAR, -- 'hospital', 'pharmacy', 'clinic'
  credit_limit        DECIMAL(15,2) DEFAULT 0,
  payment_terms_days  INTEGER DEFAULT 30,
  created_at          TIMESTAMP DEFAULT NOW()
)
```

**Relationships**:

- Referenced by: `b2b_quotes`
- Usage: Wholesale customer management, credit tracking

---

### 17. `b2b_quotes` - B2B Quotation System

**Purpose**: 7-stage wholesale quotation lifecycle management

**Key Features**:

- Quote numbering system
- 7-stage lifecycle workflow
- Validity period management
- Employee assignment

**Schema**:

```sql
b2b_quotes (
  quote_id              UUID PRIMARY KEY,
  quote_number          VARCHAR UNIQUE NOT NULL,
  customer_id           UUID REFERENCES b2b_customers(customer_id),
  customer_name         VARCHAR,
  quote_stage           INTEGER DEFAULT 1, -- 1-7 stages
  total_value           DECIMAL(15,2) DEFAULT 0,
  valid_until           DATE,
  created_by_employee_id UUID REFERENCES employees(employee_id),
  created_at            TIMESTAMP DEFAULT NOW()
)
```

**Relationships**:

- Links to: `b2b_customers`, `employees`
- Referenced by: `b2b_quote_items`
- Usage: B2B sales process, quotation management, wholesale pricing

---

### 18. `b2b_quote_items` - Quote Line Items

**Purpose**: Detailed B2B pricing with bulk discounts

**Key Features**:

- Quantity-based pricing
- Discount management
- Subtotal calculations
- Product integration

**Schema**:

```sql
b2b_quote_items (
  item_id           UUID PRIMARY KEY,
  quote_id          UUID REFERENCES b2b_quotes(quote_id),
  product_id        INTEGER REFERENCES products(id),
  quantity          INTEGER NOT NULL,
  unit_price        DECIMAL(10,2) NOT NULL,
  discount_percent  DECIMAL(5,2) DEFAULT 0,
  subtotal          DECIMAL(12,2) NOT NULL,
  created_at        TIMESTAMP DEFAULT NOW()
)
```

**Relationships**:

- Links to: `b2b_quotes`, `products`
- Usage: B2B pricing, bulk discounting, quotation details

---

## 💳 Financial Management

### 19. `funds` - Multi-Fund Accounting

**Purpose**: Separate financial accounts and fund management

**Key Features**:

- Multiple account types
- Bank account integration
- Initial balance tracking
- Fund categorization

**Schema**:

```sql
funds (
  id                SERIAL PRIMARY KEY,
  name              VARCHAR NOT NULL,
  type              VARCHAR, -- 'cash', 'bank', 'credit'
  initial_balance   DECIMAL(15,2) DEFAULT 0,
  account_number    VARCHAR,
  bank_id           INTEGER REFERENCES banks(id),
  created_at        TIMESTAMP DEFAULT NOW()
)
```

**Relationships**:

- Links to: `banks`
- Referenced by: `transactions`, `internal_fund_transfers`
- Usage: Multi-fund accounting, bank account management

---

### 20. `banks` - Banking Reference Data

**Purpose**: Vietnamese banking system integration

**Key Features**:

- Vietnamese bank registry
- BIN number support
- Bank code standardization
- Logo asset management

**Schema**:

```sql
banks (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR NOT NULL,
  code        VARCHAR UNIQUE,
  bin         VARCHAR, -- Bank Identification Number
  short_name  VARCHAR,
  logo        VARCHAR, -- Logo URL
  created_at  TIMESTAMP DEFAULT NOW()
)
```

**Relationships**:

- Referenced by: `funds`
- Usage: Banking integration, payment processing

---

### 21. `transactions` - Financial Transaction Log

**Purpose**: Complete financial audit trail with approval workflow

**Key Features**:

- Multi-status approval process
- QR code generation
- Payment method tracking
- Complete audit trail

**Schema**:

```sql
transactions (
  id              SERIAL PRIMARY KEY,
  fund_id         INTEGER REFERENCES funds(id),
  type            VARCHAR NOT NULL, -- 'income', 'expense'
  amount          DECIMAL(15,2) NOT NULL,
  description     TEXT,
  status          VARCHAR DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  approved_by     UUID REFERENCES employees(employee_id),
  payment_method  VARCHAR,
  qr_code_url     VARCHAR, -- Generated QR code
  transaction_date DATE DEFAULT CURRENT_DATE,
  created_at      TIMESTAMP DEFAULT NOW()
)
```

**Relationships**:

- Links to: `funds`, `employees`
- Referenced by: `transaction-attachments`
- Usage: Financial tracking, cash management, audit trail

---

### 22. `internal_fund_transfers` - Inter-Fund Transfers

**Purpose**: Movement of funds between different accounts

**Key Features**:

- Inter-account transfers
- Transfer documentation
- Amount tracking

**Schema**:

```sql
internal_fund_transfers (
  id            SERIAL PRIMARY KEY,
  from_fund_id  INTEGER REFERENCES funds(id),
  to_fund_id    INTEGER REFERENCES funds(id),
  amount        DECIMAL(15,2) NOT NULL,
  description   TEXT,
  created_at    TIMESTAMP DEFAULT NOW()
)
```

**Relationships**:

- Links to: `funds` (both from and to)
- Usage: Fund rebalancing, internal transfers

---

### 23. `transaction-attachments` - Document Storage

**Purpose**: Financial document and receipt storage

**Key Features**:

- File attachment support
- Transaction documentation
- Audit trail support

**Schema**:

```sql
transaction_attachments (
  id              SERIAL PRIMARY KEY,
  transaction_id  INTEGER REFERENCES transactions(id),
  file_name       VARCHAR NOT NULL,
  file_url        VARCHAR NOT NULL,
  file_size       INTEGER,
  file_type       VARCHAR,
  uploaded_at     TIMESTAMP DEFAULT NOW()
)
```

**Relationships**:

- Links to: `transactions`
- Usage: Receipt storage, documentation, audit support

---

## 🎯 Marketing & Promotions

### 24. `promotions` - Marketing Campaigns

**Purpose**: Promotional campaign management

**Key Features**:

- Multiple promotion types
- Date-based validity
- Condition-based targeting
- Value-based discounts

**Schema**:

```sql
promotions (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR NOT NULL,
  type        VARCHAR NOT NULL, -- 'percentage', 'fixed_amount'
  value       DECIMAL(10,2) NOT NULL,
  start_date  DATE NOT NULL,
  end_date    DATE NOT NULL,
  conditions  JSONB, -- Flexible conditions
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMP DEFAULT NOW()
)
```

**Relationships**:

- Referenced by: `vouchers`
- Usage: Marketing campaigns, discount management

---

### 25. `vouchers` - Promotional Vouchers

**Purpose**: Individual coupon code management

**Key Features**:

- Unique voucher codes
- Usage limit tracking
- Redemption counting
- Promotion linking

**Schema**:

```sql
vouchers (
  id            SERIAL PRIMARY KEY,
  code          VARCHAR UNIQUE NOT NULL,
  promotion_id  INTEGER REFERENCES promotions(id),
  usage_limit   INTEGER DEFAULT 1,
  times_used    INTEGER DEFAULT 0,
  created_at    TIMESTAMP DEFAULT NOW()
)
```

**Relationships**:

- Links to: `promotions`
- Usage: Coupon system, promotion tracking

---

### 26. `product-images` - Media Asset Management

**Purpose**: Product image and media storage

**Key Features**:

- Product visual assets
- Multiple image support
- Media URL management

**Schema**:

```sql
product_images (
  id          SERIAL PRIMARY KEY,
  product_id  INTEGER REFERENCES products(id),
  image_url   VARCHAR NOT NULL,
  alt_text    VARCHAR,
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMP DEFAULT NOW()
)
```

**Relationships**:

- Links to: `products`
- Usage: Product catalog display, e-commerce functionality

---

## 🔄 Business Flow Integration

### Primary Business Workflows

1. **Patient Care Workflow**:

   ```
   patients → appointments → medical_visits → prescriptions → sales_orders
   ```

2. **Inventory Management Flow**:

   ```
   products → inventory → sales_order_items → stock updates
   ```

3. **B2B Sales Process**:

   ```
   b2b_customers → b2b_quotes → b2b_quote_items → conversion to sales_orders
   ```

4. **Financial Management Chain**:
   ```
   sales_orders → transactions → funds → banks
   ```

### Key Integrations

- **Medical-to-Sales Integration**: Medical visits automatically generate prescriptions that convert to sales orders
- **Multi-Channel Sales**: Single sales system handles POS, B2B, and medical billing
- **Inventory Synchronization**: Real-time stock updates across all sales channels
- **Financial Consolidation**: All revenue streams flow into unified financial tracking

### Data Relationships Summary

- **26 interconnected tables** forming a complete ERP ecosystem
- **UUID primary keys** for global uniqueness and scalability
- **Foreign key relationships** maintaining referential integrity
- **JSONB fields** for flexible medical and condition data
- **View-based queries** for real-time inventory and reporting

---

## 📊 Database Schema Overview

### Table Categories by Function

| Category              | Tables   | Primary Purpose                            |
| --------------------- | -------- | ------------------------------------------ |
| **Medical Core**      | 5 tables | Patient care, scheduling, staff management |
| **EMR System**        | 3 tables | Medical records, prescriptions, lab orders |
| **Sales & Inventory** | 8 tables | Transaction processing, stock management   |
| **B2B Commerce**      | 3 tables | Wholesale operations, quotations           |
| **Financial**         | 5 tables | Multi-fund accounting, banking integration |
| **Marketing**         | 2 tables | Promotions, voucher management             |

### Performance Considerations

- **Indexed foreign keys** for optimal join performance
- **Partitioned tables** for high-volume transaction data
- **Materialized views** for complex reporting queries
- **JSONB indexing** for medical data queries

### Security & Compliance

- **UUID-based primary keys** prevent enumeration attacks
- **Row-level security** for patient data protection
- **Audit logging** for financial transactions
- **Data encryption** for sensitive medical information

---

_Last Updated: $(date)_
_Generated from Nam Viet ERP Database Analysis_
