# 🔐 Hướng Dẫn Quản Lý Multiple Vercel Accounts Trên macOS

## 📋 Tổng Quan

Khi làm việc với nhiều Vercel accounts (cá nhân, công ty, client), bạn cần cách để switch giữa các accounts một cách dễ dàng.

---

## 🎯 Phương Pháp 1: Sử dụng Vercel CLI với Multiple Login

### Bước 1: Login vào các accounts

```bash
# Login account đầu tiên (Personal)
vercel login

# Vercel sẽ lưu token tại: ~/.vercel/auth.json
```

### Bước 2: Lưu token của từng account

```bash
# Xem token hiện tại
cat ~/.vercel/auth.json

# Output:
# {
#   "// Note": "This is your Vercel credentials file.",
#   "token": "your-token-here"
# }
```

### Bước 3: Tạo file để lưu tokens

```bash
# Tạo thư mục backup
mkdir -p ~/.vercel-accounts

# Backup token của account 1 (Personal)
cp ~/.vercel/auth.json ~/.vercel-accounts/auth-personal.json

# Login vào account 2 (Company)
vercel login

# Backup token của account 2
cp ~/.vercel/auth.json ~/.vercel-accounts/auth-company.json
```

### Bước 4: Tạo script để switch accounts

Tạo file `~/.zshrc` hoặc `~/.bash_profile`:

```bash
# Vercel Account Switcher
alias vercel-personal='cp ~/.vercel-accounts/auth-personal.json ~/.vercel/auth.json && echo "✅ Switched to Personal Account"'
alias vercel-company='cp ~/.vercel-accounts/auth-company.json ~/.vercel/auth.json && echo "✅ Switched to Company Account"'

# Kiểm tra account hiện tại
alias vercel-whoami='vercel whoami'
```

Reload shell:

```bash
source ~/.zshrc
```

### Bước 5: Sử dụng

```bash
# Switch sang Personal account
vercel-personal

# Kiểm tra
vercel whoami
# Output: > your-personal-username

# Switch sang Company account
vercel-company

# Kiểm tra
vercel whoami
# Output: > your-company-username
```

---

## 🎯 Phương Pháp 2: Sử dụng Environment-Specific Tokens

### Bước 1: Tạo Vercel tokens cho từng account

1. Truy cập: https://vercel.com/account/tokens
2. Tạo token mới cho từng account:
   - **Personal Account** → Create Token → `VERCEL_TOKEN_PERSONAL`
   - **Company Account** → Create Token → `VERCEL_TOKEN_COMPANY`

### Bước 2: Lưu tokens vào environment

Thêm vào `~/.zshrc` hoặc `~/.bash_profile`:

```bash
# Vercel Tokens
export VERCEL_TOKEN_PERSONAL="your-personal-token-here"
export VERCEL_TOKEN_COMPANY="your-company-token-here"

# Functions để deploy với từng account
vercel-deploy-personal() {
    VERCEL_TOKEN=$VERCEL_TOKEN_PERSONAL vercel "$@"
}

vercel-deploy-company() {
    VERCEL_TOKEN=$VERCEL_TOKEN_COMPANY vercel "$@"
}
```

Reload shell:

```bash
source ~/.zshrc
```

### Bước 3: Deploy với account cụ thể

```bash
# Deploy CMS với Personal account
cd apps/cms
vercel-deploy-personal

# Deploy Sale với Company account
cd apps/sale
vercel-deploy-company
```

---

## 🎯 Phương Pháp 3: Sử dụng Project-Specific Configuration

### Bước 1: Link project với account cụ thể

```bash
# Trong folder CMS - link với Personal account
cd apps/cms
vercel-personal  # Switch account trước
vercel link

# Trong folder Sale - link với Company account
cd apps/sale
vercel-company  # Switch account
vercel link
```

### Bước 2: Vercel sẽ lưu config trong `.vercel`

```bash
apps/cms/.vercel/
├── project.json  # Chứa project ID và org ID
└── README.txt

apps/sale/.vercel/
├── project.json
└── README.txt
```

Mỗi project đã được link với account riêng!

### Bước 3: Deploy tự động với đúng account

```bash
# Deploy CMS - tự động dùng Personal account
cd apps/cms
vercel

# Deploy Sale - tự động dùng Company account
cd apps/sale
vercel
```

---

## 🎯 Phương Pháp 4: Sử dụng Advanced Script (Khuyến Nghị)

### Tạo file `~/vercel-switch.sh`:

```bash
#!/bin/bash

# Vercel Account Manager for macOS

ACCOUNTS_DIR="$HOME/.vercel-accounts"
AUTH_FILE="$HOME/.vercel/auth.json"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function: List available accounts
list_accounts() {
    echo -e "${BLUE}📋 Available Vercel Accounts:${NC}"
    ls -1 $ACCOUNTS_DIR | sed 's/auth-//g' | sed 's/.json//g' | nl
}

# Function: Switch account
switch_account() {
    local account_name=$1
    local account_file="$ACCOUNTS_DIR/auth-$account_name.json"

    if [ -f "$account_file" ]; then
        cp "$account_file" "$AUTH_FILE"
        echo -e "${GREEN}✅ Switched to: $account_name${NC}"
        vercel whoami
    else
        echo -e "${RED}❌ Account not found: $account_name${NC}"
        list_accounts
    fi
}

# Function: Save current account
save_account() {
    local account_name=$1
    local account_file="$ACCOUNTS_DIR/auth-$account_name.json"

    mkdir -p "$ACCOUNTS_DIR"
    cp "$AUTH_FILE" "$account_file"
    echo -e "${GREEN}✅ Saved current account as: $account_name${NC}"
}

# Function: Show current account
show_current() {
    echo -e "${BLUE}📌 Current Account:${NC}"
    vercel whoami
}

# Main
case "$1" in
    list)
        list_accounts
        ;;
    switch)
        switch_account "$2"
        ;;
    save)
        save_account "$2"
        ;;
    current)
        show_current
        ;;
    *)
        echo "Usage: vercel-switch {list|switch|save|current} [account-name]"
        echo ""
        echo "Examples:"
        echo "  vercel-switch list"
        echo "  vercel-switch switch personal"
        echo "  vercel-switch save personal"
        echo "  vercel-switch current"
        ;;
esac
```

### Cài đặt script:

```bash
# Copy script
chmod +x ~/vercel-switch.sh

# Thêm alias vào ~/.zshrc
echo "alias vercel-switch='~/vercel-switch.sh'" >> ~/.zshrc
source ~/.zshrc
```

### Sử dụng:

```bash
# Lưu account hiện tại
vercel login  # Login vào Personal
vercel-switch save personal

vercel login  # Login vào Company
vercel-switch save company

# List tất cả accounts
vercel-switch list
# Output:
# 📋 Available Vercel Accounts:
#      1  personal
#      2  company

# Switch giữa accounts
vercel-switch switch personal
# Output: ✅ Switched to: personal

vercel-switch switch company
# Output: ✅ Switched to: company

# Xem account hiện tại
vercel-switch current
# Output: 📌 Current Account: your-username
```

---

## 🎯 Phương Pháp 5: Docker-based Isolation (Advanced)

### Tạo file `docker-compose.yml`:

```yaml
version: "3.8"

services:
  vercel-personal:
    image: node:20-alpine
    volumes:
      - ./apps/cms:/app
      - vercel-personal-data:/root/.vercel
    working_dir: /app
    environment:
      - VERCEL_TOKEN=${VERCEL_TOKEN_PERSONAL}
    command: sh -c "npm i -g vercel && vercel deploy"

  vercel-company:
    image: node:20-alpine
    volumes:
      - ./apps/sale:/app
      - vercel-company-data:/root/.vercel
    working_dir: /app
    environment:
      - VERCEL_TOKEN=${VERCEL_TOKEN_COMPANY}
    command: sh -c "npm i -g vercel && vercel deploy"

volumes:
  vercel-personal-data:
  vercel-company-data:
```

### Sử dụng:

```bash
# Deploy CMS với Personal account
docker-compose run vercel-personal

# Deploy Sale với Company account
docker-compose run vercel-company
```

---

## 📊 So Sánh Các Phương Pháp

| Phương Pháp               | Độ Khó   | Tốc Độ | Tự Động | Khuyến Nghị             |
| ------------------------- | -------- | ------ | ------- | ----------------------- |
| Method 1: Manual Copy     | ⭐       | ⭐⭐   | ❌      | Cho người mới           |
| Method 2: Env Tokens      | ⭐⭐     | ⭐⭐⭐ | ✅      | Cho CI/CD               |
| Method 3: Project Link    | ⭐       | ⭐⭐⭐ | ✅      | **Khuyến nghị**         |
| Method 4: Advanced Script | ⭐⭐⭐   | ⭐⭐⭐ | ✅      | Cho power users         |
| Method 5: Docker          | ⭐⭐⭐⭐ | ⭐⭐   | ✅      | Cho isolation hoàn toàn |

---

## 🎨 Workflow Khuyến Nghị

### Setup Ban Đầu:

```bash
# 1. Cài đặt Vercel CLI
npm i -g vercel

# 2. Login account 1 (Personal)
vercel login

# 3. Link CMS project
cd apps/cms
vercel link
# Chọn scope: Personal account

# 4. Login account 2 (Company)
vercel login

# 5. Link Sale project
cd apps/sale
vercel link
# Chọn scope: Company account
```

### Deploy Hàng Ngày:

```bash
# Deploy CMS - tự động dùng Personal account
cd apps/cms && vercel --prod

# Deploy Sale - tự động dùng Company account
cd apps/sale && vercel --prod
```

**Không cần switch account!** Vercel CLI tự động dùng đúng account dựa trên `.vercel/project.json`

---

## 🔧 Troubleshooting

### Lỗi: "No existing credentials found"

```bash
# Xóa cache và login lại
rm -rf ~/.vercel
vercel login
```

### Lỗi: "Insufficient permissions"

```bash
# Kiểm tra account hiện tại
vercel whoami

# Nếu sai account, switch lại
vercel-switch switch [correct-account]
```

### Lỗi: "Project not found"

```bash
# Re-link project
cd apps/cms
rm -rf .vercel
vercel link
```

---

## 📝 Best Practices

1. **Sử dụng Method 3** (Project Link) cho workflow đơn giản nhất
2. **Backup tokens** định kỳ vào `~/.vercel-accounts/`
3. **Đặt tên account rõ ràng**: `personal`, `company`, `client-abc`
4. **Git ignore** file `.vercel/` nếu có sensitive info
5. **Document** account nào dùng cho project nào trong README

---

## 🎁 Bonus: Combine với Git Aliases

Thêm vào `~/.gitconfig`:

```ini
[alias]
    deploy-cms = !cd apps/cms && vercel --prod
    deploy-sale = !cd apps/sale && vercel --prod
    deploy-all = !cd apps/cms && vercel --prod && cd ../sale && vercel --prod
```

Sử dụng:

```bash
git deploy-cms
git deploy-sale
git deploy-all
```

---

## 🚀 Quick Reference

```bash
# Setup
vercel-switch save personal     # Lưu Personal account
vercel-switch save company      # Lưu Company account

# Daily use
vercel-switch list              # List accounts
vercel-switch switch personal   # Switch to Personal
vercel-switch switch company    # Switch to Company
vercel-switch current           # Show current account

# Deploy (with project link - không cần switch)
cd apps/cms && vercel --prod    # Auto use Personal
cd apps/sale && vercel --prod   # Auto use Company
```

---

**Chúc quản lý multi-accounts thành công! 🎊**
