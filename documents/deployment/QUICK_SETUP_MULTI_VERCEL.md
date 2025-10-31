# ⚡ Quick Setup: Multiple Vercel Accounts

## 🚀 Setup trong 5 phút

### 1️⃣ Cài đặt script

```bash
cd /Users/macbook/Documents/personal-work/nam-viet-erp

# Make executable
chmod +x scripts/vercel-switch.sh

# Add alias to shell
echo "alias vercel-switch='$(pwd)/scripts/vercel-switch.sh'" >> ~/.zshrc
source ~/.zshrc
```

### 2️⃣ Lưu accounts

```bash
# Login account Personal
vercel login
# → Chọn email/GitHub của account Personal

# Save account Personal
vercel-switch save personal
# ✅ Saved current account as: personal

# Login account Company
vercel login
# → Chọn email/GitHub của account Company

# Save account Company
vercel-switch save company
# ✅ Saved current account as: company
```

### 3️⃣ Sử dụng

```bash
# Xem tất cả accounts
vercel-switch list
# 📋 Available Vercel Accounts:
#    • personal
#    • company

# Switch sang Personal
vercel-switch switch personal
# ✅ Switched to: personal
# 👤 your-personal-username

# Switch sang Company
vercel-switch switch company
# ✅ Switched to: company
# 👤 your-company-username

# Xem account hiện tại
vercel-switch current
# 👤 Current Vercel Account:
# your-current-username
```

### 4️⃣ Deploy

```bash
# Method 1: Switch trước rồi deploy
vercel-switch switch personal
cd apps/cms
vercel --prod

# Method 2: Deploy luôn với account cụ thể
cd apps/cms
vercel-switch deploy personal --prod

cd apps/sale
vercel-switch deploy company --prod
```

---

## 🎯 Workflow Khuyến Nghị

### Setup lần đầu (One-time)

```bash
# 1. Link CMS với Personal account
vercel-switch switch personal
cd apps/cms
vercel link  # Link project với Personal account

# 2. Link Sale với Company account
vercel-switch switch company
cd apps/sale
vercel link  # Link project với Company account
```

### Deploy hàng ngày (Daily)

```bash
# Deploy CMS - tự động dùng Personal account
cd apps/cms && vercel --prod

# Deploy Sale - tự động dùng Company account
cd apps/sale && vercel --prod
```

**Không cần switch!** Vercel CLI tự động nhận account từ `.vercel/project.json`

---

## 📝 All Commands

```bash
vercel-switch list              # List accounts
vercel-switch save <name>       # Save current account
vercel-switch switch <name>     # Switch to account
vercel-switch current           # Show current
vercel-switch delete <name>     # Delete account
vercel-switch rename <old> <new> # Rename account
vercel-switch deploy <name> [args] # Deploy with account
vercel-switch help              # Show help
```

---

## 🔍 Kiểm Tra Setup

```bash
# Test script hoạt động
vercel-switch list

# Test switch
vercel-switch switch personal
vercel whoami  # Should show personal username

vercel-switch switch company
vercel whoami  # Should show company username
```

---

## 📚 Tài Liệu Đầy Đủ

- **Full Guide**: [VERCEL_MULTI_ACCOUNT_GUIDE.md](VERCEL_MULTI_ACCOUNT_GUIDE.md)
- **Deployment Guide**: [VERCEL_DEPLOYMENT_GUIDE.md](VERCEL_DEPLOYMENT_GUIDE.md)
- **Scripts Docs**: [scripts/README.md](scripts/README.md)

---

**Setup xong! 🎉**
