# 🛠️ Scripts

Collection of utility scripts for Nam Viet ERP development and deployment.

## 📁 Available Scripts

### 🔐 vercel-switch.sh

Manage multiple Vercel accounts on macOS.

**Installation:**

```bash
# Make executable
chmod +x scripts/vercel-switch.sh

# Add to PATH (choose one method)

# Method 1: Create symlink
sudo ln -s $(pwd)/scripts/vercel-switch.sh /usr/local/bin/vercel-switch

# Method 2: Add alias to ~/.zshrc
echo "alias vercel-switch='$(pwd)/scripts/vercel-switch.sh'" >> ~/.zshrc
source ~/.zshrc
```

**Quick Start:**

```bash
# 1. Login to first account
vercel login

# 2. Save it
vercel-switch save personal

# 3. Login to second account
vercel login

# 4. Save it
vercel-switch save company

# 5. List all accounts
vercel-switch list

# 6. Switch between accounts
vercel-switch switch personal
vercel-switch switch company
```

**Full Documentation:** See [VERCEL_MULTI_ACCOUNT_GUIDE.md](../VERCEL_MULTI_ACCOUNT_GUIDE.md)

---

## 📖 Usage Examples

### Manage Accounts

```bash
# List saved accounts
vercel-switch list

# Save current account
vercel-switch save my-account

# Switch to account
vercel-switch switch my-account

# Show current account
vercel-switch current

# Delete account
vercel-switch delete my-account

# Rename account
vercel-switch rename old-name new-name
```

### Deploy with Specific Account

```bash
# Deploy CMS with personal account
cd apps/cms
vercel-switch deploy personal --prod

# Deploy Sale with company account
cd apps/sale
vercel-switch deploy company --prod
```

---

## 🎨 Features

- ✅ **Easy account switching** - Switch between accounts with one command
- ✅ **Safe operations** - Automatic backup before switching
- ✅ **Colorful output** - Clear visual feedback
- ✅ **Error handling** - Helpful error messages
- ✅ **Deploy integration** - Deploy with specific account directly

---

## 🔧 Troubleshooting

### Command not found

```bash
# Make sure script is executable
chmod +x scripts/vercel-switch.sh

# Check if alias is loaded
which vercel-switch
```

### No saved accounts

```bash
# Login first
vercel login

# Then save
vercel-switch save account-name
```

### Permission denied

```bash
# Fix permissions
chmod +x scripts/vercel-switch.sh
```

---

## 📝 Notes

- Accounts are stored in `~/.vercel-accounts/`
- Original auth file: `~/.vercel/auth.json`
- Backups are created automatically when switching

---

## 🚀 Coming Soon

- [ ] Auto-detect account from project config
- [ ] Team management support
- [ ] Export/import account configs
- [ ] Integration with CI/CD

---

**Happy deploying! 🎉**
