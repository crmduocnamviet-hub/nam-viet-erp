# Documentation Index

Complete index of Nam Việt ERP documentation organized by category.

## 📊 Documentation Statistics

- **Total Documents**: 10
- **Categories**: 7
- **Last Updated**: October 10, 2025

## 📁 Documentation Structure

```
documents/
├── README.md                              # Main documentation hub
├── DOCUMENTATION_INDEX.md                 # This file
│
├── architecture/                          # System Architecture (3 docs)
│   ├── workspace-architecture.md         # Monorepo & package structure
│   ├── shared-screens.md                 # Screen sharing system
│   └── state-management.md               # Zustand stores & Entity Store
│
├── development/                           # Development Guidelines (1 doc)
│   └── rules.md                          # Core development rules
│
├── features/                              # Feature Documentation (2 docs)
│   ├── pos-system.md                     # POS system overview
│   └── product-lot-management.md         # Lot management feature
│
├── database/                              # Database Documentation (2 docs)
│   ├── tables-reference.md               # Database schema (English)
│   └── tables-reference-vi.md            # Database schema (Vietnamese)
│
├── guides/                                # User & Developer Guides (1 doc)
│   └── getting-started.md                # Quick start guide
│
├── api/                                   # API Documentation (empty)
│   └── (To be created)
│
└── deployment/                            # Deployment Guides (empty)
    └── (To be created)
```

## 📚 Documentation by Category

### 🏗️ Architecture (3 documents)

1. **[Workspace Architecture](./architecture/workspace-architecture.md)**
   - Monorepo structure
   - Package organization
   - Apps vs Packages
   - Dependencies & imports
   - Development workflow
   - Best practices

2. **[Shared Screens Architecture](./architecture/shared-screens.md)**
   - Screen registry system
   - Permission-based access
   - Dynamic menu generation
   - Screen provider usage
   - Adding new screens

3. **[State Management](./architecture/state-management.md)**
   - Zustand store architecture
   - Entity Store pattern
   - Normalized data storage
   - POS Store multi-tab
   - Custom hooks
   - Performance optimization

### 💻 Development (1 document)

1. **[Development Rules](./development/rules.md)**
   - Core development rules
   - Yarn workspace usage
   - Services package rules
   - SQL query files
   - File organization
   - TypeScript rules
   - Security guidelines
   - Performance rules
   - Common mistakes

### ✨ Features (2 documents)

1. **[POS System](./features/pos-system.md)**
   - Multi-tab order management
   - Product search & selection
   - Product lot management in POS
   - Shopping cart
   - Customer management
   - Combo detection
   - Payment processing
   - Warehouse integration
   - UI/UX features
   - Technical implementation

2. **[Product Lot Management](./features/product-lot-management.md)**
   - Lot tracking system
   - Lot management interface
   - Inventory synchronization
   - Expiry management
   - POS integration
   - Database schema
   - User workflows
   - UI components
   - Entity Store integration
   - Service layer
   - Data validation

### 🗄️ Database (2 documents)

1. **[Tables Reference (English)](./database/tables-reference.md)**
   - Complete database schema
   - Table definitions
   - Relationships
   - Indexes

2. **[Tables Reference (Vietnamese)](./database/tables-reference-vi.md)**
   - Database schema in Vietnamese
   - Table explanations
   - Field descriptions

### 📖 Guides (1 document)

1. **[Getting Started](./guides/getting-started.md)**
   - Prerequisites
   - Quick start instructions
   - Project structure overview
   - Development workflow
   - Common tasks
   - Code examples
   - Troubleshooting
   - Checklist for new developers

### 🔌 API (Planned)

To be created:

- Services Overview
- Supabase Integration
- API Endpoints Reference
- Error Handling

### 🚀 Deployment (Planned)

To be created:

- Environment Setup
- Production Deployment
- CI/CD Pipeline
- Monitoring & Logging

## 🎯 Quick Navigation by Topic

### For New Developers

1. Start: [Getting Started](./guides/getting-started.md)
2. Learn: [Workspace Architecture](./architecture/workspace-architecture.md)
3. Rules: [Development Rules](./development/rules.md)
4. State: [State Management](./architecture/state-management.md)

### For Feature Development

1. Screens: [Shared Screens Architecture](./architecture/shared-screens.md)
2. State: [State Management](./architecture/state-management.md)
3. Rules: [Development Rules](./development/rules.md)

### For POS Development

1. Overview: [POS System](./features/pos-system.md)
2. Lots: [Product Lot Management](./features/product-lot-management.md)
3. State: [State Management](./architecture/state-management.md)

### For Database Work

1. Schema: [Tables Reference](./database/tables-reference.md)
2. Vietnamese: [Tables Reference (VI)](./database/tables-reference-vi.md)
3. Rules: [Development Rules](./development/rules.md) (SQL section)

## 📊 Coverage by Domain

| Domain           | Documents | Status                            |
| ---------------- | --------- | --------------------------------- |
| **Architecture** | 3         | ✅ Complete                       |
| **Development**  | 1         | ✅ Complete                       |
| **Features**     | 2         | 🟡 Partial (POS, Lots only)       |
| **Database**     | 2         | ✅ Complete                       |
| **Guides**       | 1         | 🟡 Partial (Getting Started only) |
| **API**          | 0         | ❌ Not started                    |
| **Deployment**   | 0         | ❌ Not started                    |

## 🔄 Upcoming Documentation

### High Priority

- [ ] Services Overview (API)
- [ ] Environment Setup (Deployment)
- [ ] Inventory Management (Features)
- [ ] B2B Orders (Features)

### Medium Priority

- [ ] Coding Standards (Development)
- [ ] Git Workflow (Development)
- [ ] Component Development (Development)
- [ ] API Endpoints (API)
- [ ] POS User Guide (Guides)

### Low Priority

- [ ] Medical Features (Features)
- [ ] Production Deployment (Deployment)
- [ ] CI/CD Pipeline (Deployment)
- [ ] Troubleshooting (Guides)

## 📝 Documentation Standards

### File Naming

- Use kebab-case: `product-lot-management.md`
- Be descriptive: `workspace-architecture.md` not `arch.md`
- Use category prefixes for related docs

### Content Structure

1. **Title** - Clear, descriptive H1
2. **Overview** - Brief introduction with purpose
3. **Key Features** - Bullet points of main features
4. **Architecture/Structure** - Technical details
5. **Usage/Examples** - Practical code examples
6. **Best Practices** - Guidelines and tips
7. **Related Documentation** - Links to related docs

### Code Examples

- Always include working code snippets
- Show both ✅ correct and ❌ incorrect examples
- Add comments explaining complex parts
- Use TypeScript with proper types

### Cross-References

- Link to related documentation
- Use relative paths: `../architecture/state-management.md`
- Include "Related Documentation" section at end

## 🔍 Search by Keyword

### Architecture

- Monorepo → [Workspace Architecture](./architecture/workspace-architecture.md)
- Screens → [Shared Screens](./architecture/shared-screens.md)
- State → [State Management](./architecture/state-management.md)
- Entity Store → [State Management](./architecture/state-management.md)
- Zustand → [State Management](./architecture/state-management.md)

### Development

- Rules → [Development Rules](./development/rules.md)
- Yarn → [Development Rules](./development/rules.md)
- Services → [Development Rules](./development/rules.md)
- TypeScript → [Development Rules](./development/rules.md)

### Features

- POS → [POS System](./features/pos-system.md)
- Lot Management → [Product Lot Management](./features/product-lot-management.md)
- Expiry → [Product Lot Management](./features/product-lot-management.md)
- Cart → [POS System](./features/pos-system.md)
- Payment → [POS System](./features/pos-system.md)

### Database

- Schema → [Tables Reference](./database/tables-reference.md)
- Tables → [Tables Reference](./database/tables-reference.md)
- SQL → [Development Rules](./development/rules.md)

### Getting Started

- Setup → [Getting Started](./guides/getting-started.md)
- Quick Start → [Getting Started](./guides/getting-started.md)
- Install → [Getting Started](./guides/getting-started.md)

## 📞 Contact & Contribution

### Updating Documentation

1. Make changes in appropriate category folder
2. Update this index if adding new docs
3. Update main [README.md](./README.md) if needed
4. Follow documentation standards above

### Questions?

- Check existing docs first
- Search by keyword in this index
- Ask team for clarification
- Create issue for missing docs

---

**Last Updated**: October 10, 2025
**Maintained by**: Nam Việt ERP Development Team
