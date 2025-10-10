# Nam Việt ERP - Documentation

Welcome to the Nam Việt ERP documentation. This directory contains comprehensive documentation for the entire system.

## 📚 Documentation Structure

### 🏗️ [Architecture](./architecture/)

System architecture, design patterns, and project structure documentation.

- [Workspace Architecture](./architecture/workspace-architecture.md) - Monorepo structure and organization
- [Shared Screens Architecture](./architecture/shared-screens.md) - Screen sharing system
- [State Management](./architecture/state-management.md) - Store architecture (Zustand + Entity Store)
- [Database Schema](./architecture/database-schema.md) - Database design and relationships

### 💻 [Development](./development/)

Development guidelines, coding standards, and workflows.

- [Development Rules](./development/rules.md) - Core development rules and conventions
- [Coding Standards](./development/coding-standards.md) - Code style and best practices
- [Git Workflow](./development/git-workflow.md) - Version control guidelines
- [Component Development](./development/component-development.md) - Creating reusable components

### ✨ [Features](./features/)

Feature-specific documentation.

- [POS System](./features/pos-system.md) - Point of Sale functionality
- [Inventory Management](./features/inventory-management.md) - Stock and warehouse management
- [Product Lot Management](./features/product-lot-management.md) - Lot tracking and expiry management
- [B2B Orders](./features/b2b-orders.md) - Business-to-business order management
- [Medical Features](./features/medical-features.md) - Patient and prescription management

### 🔌 [API](./api/)

API documentation, services, and integrations.

- [Services Overview](./api/services-overview.md) - Service layer architecture
- [Supabase Integration](./api/supabase-integration.md) - Database API usage
- [API Endpoints](./api/endpoints.md) - Available API endpoints

### 🗄️ [Database](./database/)

Database schema, migrations, and query documentation.

- [Schema Overview](./database/schema-overview.md) - Complete database schema
- [Tables Reference](./database/tables-reference.md) - Detailed table documentation
- [Migration Guide](./database/migration-guide.md) - Database migration procedures

### 🚀 [Deployment](./deployment/)

Deployment guides, CI/CD, and environment setup.

- [Environment Setup](./deployment/environment-setup.md) - Development environment configuration
- [Production Deployment](./deployment/production-deployment.md) - Production deployment guide
- [CI/CD Pipeline](./deployment/ci-cd-pipeline.md) - Continuous integration/deployment

### 📖 [Guides](./guides/)

User guides, tutorials, and how-tos.

- [Getting Started](./guides/getting-started.md) - Quick start guide
- [POS User Guide](./guides/pos-user-guide.md) - How to use the POS system
- [Inventory User Guide](./guides/inventory-user-guide.md) - Managing inventory
- [Troubleshooting](./guides/troubleshooting.md) - Common issues and solutions

## 🎯 Quick Links

### For Developers

- [Getting Started](./guides/getting-started.md)
- [Development Rules](./development/rules.md)
- [Workspace Architecture](./architecture/workspace-architecture.md)
- [Component Development](./development/component-development.md)

### For Users

- [POS User Guide](./guides/pos-user-guide.md)
- [Inventory User Guide](./guides/inventory-user-guide.md)
- [Troubleshooting](./guides/troubleshooting.md)

### For Administrators

- [Database Schema](./architecture/database-schema.md)
- [Environment Setup](./deployment/environment-setup.md)
- [Production Deployment](./deployment/production-deployment.md)

## 📝 Contributing to Documentation

When adding new documentation:

1. Place files in the appropriate category folder
2. Use descriptive filenames with kebab-case (e.g., `product-lot-management.md`)
3. Update the relevant README.md index
4. Follow the markdown style guide
5. Include code examples where applicable
6. Add diagrams for complex concepts

## 🔄 Last Updated

This documentation is continuously updated. Last major update: October 2025

---

**Need help?** Check the [Troubleshooting Guide](./guides/troubleshooting.md) or contact the development team.
