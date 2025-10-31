# 🚀 Hướng Dẫn Deploy CMS & Sale Lên Vercel

## 📋 Tổng Quan

Monorepo này chứa 2 apps:

- **CMS** (`apps/cms`) - Quản lý nội bộ
- **Sale** (`apps/sale`) - Bán hàng

Mỗi app sẽ được deploy lên 1 project riêng biệt trên Vercel.

> 💡 **Sử dụng nhiều Vercel accounts?** Xem hướng dẫn: [VERCEL_MULTI_ACCOUNT_GUIDE.md](VERCEL_MULTI_ACCOUNT_GUIDE.md)

---

## 🎯 Bước 1: Chuẩn Bị

### 1.1. Đảm bảo vercel.json đã được cấu hình

✅ **CMS** - `apps/cms/vercel.json`:

```json
{
  "buildCommand": "cd ../.. && yarn install && yarn cms:build",
  "outputDirectory": "dist",
  "installCommand": "yarn install",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/:path*",
      "destination": "/"
    }
  ]
}
```

✅ **Sale** - `apps/sale/vercel.json`:

```json
{
  "buildCommand": "cd ../.. && yarn install && yarn sale:build",
  "outputDirectory": "dist",
  "installCommand": "yarn install",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/:path*",
      "destination": "/"
    }
  ]
}
```

---

## 🌐 Bước 2: Tạo Projects Trên Vercel

### 2.1. Tạo Project Cho CMS

1. Truy cập: https://vercel.com/new
2. Import Git Repository của bạn
3. **Configure Project:**

   ```
   Project Name: nam-viet-cms (hoặc tên bạn muốn)
   Framework Preset: Vite
   Root Directory: apps/cms
   ```

4. **Build & Output Settings:**

   ```
   Build Command: cd ../.. && yarn install && yarn cms:build
   Output Directory: dist
   Install Command: yarn install
   ```

5. **Environment Variables** (nếu cần):

   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

6. Click **Deploy**

---

### 2.2. Tạo Project Cho Sale

1. Truy cập: https://vercel.com/new
2. Import **cùng Git Repository**
3. **Configure Project:**

   ```
   Project Name: nam-viet-sale
   Framework Preset: Vite
   Root Directory: apps/sale
   ```

4. **Build & Output Settings:**

   ```
   Build Command: cd ../.. && yarn install && yarn sale:build
   Output Directory: dist
   Install Command: yarn install
   ```

5. **Environment Variables** (nếu cần):

   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

6. Click **Deploy**

---

## 🔧 Bước 3: Cấu Hình Vercel CLI (Tùy chọn)

### 3.1. Cài đặt Vercel CLI

```bash
npm i -g vercel
```

### 3.2. Login

```bash
vercel login
```

### 3.3. Deploy CMS

```bash
cd apps/cms
vercel
```

Chọn:

- Link to existing project? **No**
- Project name: **nam-viet-cms**
- Directory: **./apps/cms**

### 3.4. Deploy Sale

```bash
cd apps/sale
vercel
```

Chọn:

- Link to existing project? **No**
- Project name: **nam-viet-sale**
- Directory: **./apps/sale**

---

## 📦 Bước 4: Cấu Hình Git Integration (Khuyến Nghị)

### 4.1. Automatic Deployments

Vercel sẽ tự động deploy khi:

- Push lên branch `main` → Production deployment
- Push lên branch khác → Preview deployment

### 4.2. Ignored Build Step (Tối ưu)

Tạo file `apps/cms/vercel-build-ignore.sh`:

```bash
#!/bin/bash

# Only build if CMS files changed
git diff HEAD^ HEAD --quiet apps/cms/ packages/ types/
```

Tạo file `apps/sale/vercel-build-ignore.sh`:

```bash
#!/bin/bash

# Only build if Sale files changed
git diff HEAD^ HEAD --quiet apps/sale/ packages/ types/
```

Thêm vào `vercel.json`:

```json
{
  "git": {
    "deploymentEnabled": {
      "main": true
    }
  },
  "ignoreCommand": "bash vercel-build-ignore.sh"
}
```

---

## 🌍 Bước 5: Environment Variables

### Thiết lập cho cả 2 projects:

**Vercel Dashboard → Project → Settings → Environment Variables**

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Optional
VITE_API_URL=https://api.example.com
NODE_ENV=production
```

---

## 🎨 Bước 6: Custom Domains (Tùy chọn)

### CMS:

```
Dashboard → Project (CMS) → Settings → Domains
→ Add Domain: cms.namviet.com
```

### Sale:

```
Dashboard → Project (Sale) → Settings → Domains
→ Add Domain: sale.namviet.com
```

---

## 🔍 Kiểm Tra Build Locally

### Test CMS Build:

```bash
yarn cms:build
```

Kiểm tra output tại: `apps/cms/dist`

### Test Sale Build:

```bash
yarn sale:build
```

Kiểm tra output tại: `apps/sale/dist`

### Preview Local Build:

```bash
# CMS
yarn cms:preview

# Sale
yarn sale:preview
```

---

## 🐛 Troubleshooting

### Lỗi: "Module not found"

**Nguyên nhân:** Vercel không build shared packages

**Giải pháp:** Build command đã bao gồm `cd ../.. && yarn install`

---

### Lỗi: "Build failed - TypeScript errors"

**Giải pháp:** Đã disable `noUnusedLocals` và `noUnusedParameters` trong tsconfig

---

### Lỗi: "Out of memory"

**Giải pháp:**

Thêm vào `package.json` của root:

```json
{
  "scripts": {
    "cms:build": "NODE_OPTIONS='--max-old-space-size=4096' yarn workspace @nam-viet-erp/cms build",
    "sale:build": "NODE_OPTIONS='--max-old-space-size=4096' yarn workspace @nam-viet-erp/sale build"
  }
}
```

---

### Lỗi: Workbox file size warning

✅ **Đã fix:** Tăng `maximumFileSizeToCacheInBytes` lên 5MB trong `vite.config.ts`

---

## 📊 Deployment URLs

Sau khi deploy thành công, bạn sẽ có:

### Production:

- **CMS**: https://nam-viet-cms.vercel.app
- **Sale**: https://nam-viet-sale.vercel.app

### Preview (mỗi PR):

- **CMS**: https://nam-viet-cms-[hash].vercel.app
- **Sale**: https://nam-viet-sale-[hash].vercel.app

---

## 🚀 Deploy Commands

### Deploy to Production:

```bash
# CMS
cd apps/cms && vercel --prod

# Sale
cd apps/sale && vercel --prod
```

### Deploy Preview:

```bash
# CMS
cd apps/cms && vercel

# Sale
cd apps/sale && vercel
```

---

## 📝 Checklist Trước Khi Deploy

- [ ] Test build locally: `yarn cms:build` và `yarn sale:build`
- [ ] Kiểm tra `.env` variables
- [ ] Đảm bảo `vercel.json` đã cấu hình đúng
- [ ] TypeScript errors đã được fix
- [ ] Git commit & push code
- [ ] Environment variables đã được set trên Vercel
- [ ] Domains đã được configure (nếu dùng custom domain)

---

## 🎉 Kết Quả

Bạn đã có 2 projects riêng biệt trên Vercel:

1. **CMS Project** - Quản lý nội bộ
2. **Sale Project** - Bán hàng

Mỗi khi push code:

- Thay đổi trong `apps/cms` → Deploy CMS
- Thay đổi trong `apps/sale` → Deploy Sale
- Thay đổi trong `packages` → Deploy cả 2

---

## 📞 Support

Nếu gặp vấn đề, check:

1. Vercel Deployment Logs
2. Build logs tại: Dashboard → Deployments → [Latest] → Building
3. Runtime logs tại: Dashboard → Deployments → [Latest] → Runtime Logs

---

**Chúc deploy thành công! 🎊**
