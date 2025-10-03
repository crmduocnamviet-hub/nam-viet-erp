# Changelog

All notable changes to the @nam-viet-erp/store package.

## [1.1.1] - 2025-10-02

### Documentation
- 📚 **IMMER_BENEFITS.md** - Comprehensive guide showing before/after examples
- 📝 **Updated README.md** - Added Immer features section
- 📖 **Updated CHANGELOG.md** - Complete version history

## [1.1.0] - 2025-10-02

### Added
- ✨ **Immer Integration** - All stores now use Immer middleware for cleaner state updates
  - More intuitive state mutations
  - Simpler nested object updates
  - Cleaner array operations
  - Better readability and maintainability

### Changed
- 🔄 **Employee Store** - Refactored all setters to use Immer
- 🔄 **Auth Store** - Refactored all setters to use Immer
- 🔄 **UI Store** - Refactored all setters to use Immer

### Benefits
- More readable code
- Less error-prone updates
- Better developer experience
- Structural sharing for performance

See [IMMER_BENEFITS.md](./IMMER_BENEFITS.md) for detailed examples.

## [1.0.0] - 2025-01-02

### Added
- 🎉 **Initial Release**
- 📦 **Employee Store** - Employee data and permission management
- 🔐 **Auth Store** - Authentication and session management
- 🎨 **UI Store** - UI state (sidebar, theme, modals, notifications)
- 🔧 **Employee Services** - Fetch and sync employee data
- 🪝 **React Hooks** - `useInitializeEmployee`, `useRefreshEmployee`
- 📝 **Comprehensive Documentation**
  - README.md - Complete API documentation
  - MIGRATION_GUIDE.md - Migrate from Context to Zustand
  - INTEGRATION_EXAMPLES.md - Real-world examples
  - QUICK_REFERENCE.md - Quick cheatsheet

### Features
- TypeScript support
- Redux DevTools integration
- LocalStorage persistence
- Optimized selectors
- Permission checking utilities
- Modal management
- Theme management
- Notification system
