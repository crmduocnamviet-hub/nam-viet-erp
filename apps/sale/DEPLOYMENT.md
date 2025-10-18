# Vercel Deployment Guide - Sale App

Complete step-by-step guide to deploy the Nam Viet ERP Sale app to Vercel.

---

## Prerequisites

- Node.js and Yarn installed
- A Vercel account (free tier works fine)
- Terminal/Command Line access

---

## Step-by-Step Deployment

### Step 1: Install Vercel CLI

Open your terminal and run:

```bash
npm install -g vercel
```

Or if you prefer yarn:

```bash
yarn global add vercel
```

**Verify installation:**

```bash
vercel --version
```

You should see a version number (e.g., `Vercel CLI 33.0.0`)

---

### Step 2: Login to Vercel

Run the login command:

```bash
vercel login
```

**You'll see options:**

- Continue with GitHub
- Continue with GitLab
- Continue with Bitbucket
- Continue with Email

**Choose your preferred method** (GitHub recommended if your code is on GitHub)

A browser window will open. **Authorize Vercel** and you'll see "Success!" in your terminal.

---

### Step 3: Navigate to Sale App Directory

From your project root, navigate to the sale app:

```bash
cd apps/sale
```

**Verify you're in the right directory:**

```bash
pwd
```

Should show: `/path/to/nam-viet-erp/apps/sale`

---

### Step 4: Initialize Vercel Project

Run the deployment command:

```bash
vercel
```

**Answer the prompts as follows:**

| Question                  | Answer                                       |
| ------------------------- | -------------------------------------------- |
| Set up and deploy?        | `Y` (Yes)                                    |
| Which scope?              | Select your account/team                     |
| Link to existing project? | `N` (No) - for first deployment              |
| Project name?             | `nam-viet-erp-sale` (or your preferred name) |
| Code directory?           | `./` (press Enter)                           |

---

### Step 5: Configure Build Settings

**Override settings?** → `y` (Yes)

**Select settings to override:**

- ☑ Build Command
- ☑ Output Directory
- ☐ Development Command (optional)

**Build Command:**

```bash
cd ../.. && yarn install && yarn workspace @nam-viet-erp/sale build
```

**Output Directory:**

```
dist
```

The deployment will start and create a preview deployment.

---

### Step 6: Add Environment Variables

After the first deployment completes, add environment variables:

#### Add Supabase URL

```bash
vercel env add VITE_SUPABASE_URL
```

**Prompts:**

1. **Value:** `https://yyqnjeaukxzkzfiufwkb.supabase.co`
2. **Environments:** Select all (Production, Preview, Development)

#### Add Supabase Anon Key

```bash
vercel env add VITE_SUPABASE_ANON_KEY
```

**Prompts:**

1. **Value:**
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5cW5qZWF1a3h6a3pmaXVmd2tiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNDQ3MzAsImV4cCI6MjA3MjcyMDczMH0._dbzHfUsuSBbKd1iXOMWzqJkvsZxMZBtjEfOexA0K04
   ```
2. **Environments:** Select all (Production, Preview, Development)

---

### Step 7: Deploy to Production

Deploy with production environment variables:

```bash
vercel --prod
```

**Expected output:**

```
✅  Production: https://nam-viet-erp-sale.vercel.app [1m 23s]
```

---

## Verification

### Check Deployment Status

```bash
vercel ls
```

### Open Your App in Browser

```bash
vercel open
```

Or visit the production URL directly.

### Test the Application

- ✅ Login functionality
- ✅ Navigation between pages
- ✅ POS system
- ✅ Warehouse receiving
- ✅ All features work correctly

---

## Project Configuration Files

### vercel.json

Location: `apps/sale/vercel.json`

```json
{
  "rewrites": [
    {
      "source": "/:path*",
      "destination": "/"
    }
  ]
}
```

This configuration handles SPA (Single Page Application) routing, ensuring all routes redirect to index.html for client-side routing.

### Environment Variables

- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key

---

## Common Issues & Solutions

### Issue 1: Build Fails with "Cannot find workspace"

**Solution:**

```bash
# Go to root directory
cd ../..

# Test build manually
yarn workspace @nam-viet-erp/sale build

# If successful, deploy again
cd apps/sale
vercel --prod
```

### Issue 2: Environment Variables Not Loading

**Check variables:**

```bash
vercel env ls
```

**Pull variables locally:**

```bash
vercel env pull
```

### Issue 3: 404 Error on Page Refresh

Verify `vercel.json` exists with correct rewrite rules:

```bash
cat vercel.json
```

### Issue 4: Build Timeout

Increase build timeout in Vercel dashboard:

1. Go to Project Settings
2. General → Build & Development Settings
3. Increase timeout limit

---

## Future Deployments

### Manual Deployment

After making code changes:

```bash
cd apps/sale
vercel --prod
```

### Automatic Deployment (GitHub Integration)

**Setup:**

1. Go to Vercel Dashboard
2. Select your project
3. Settings → Git
4. Connect your GitHub repository

**Behavior:**

- Push to `main` → Automatic production deployment
- Push to other branches → Automatic preview deployment
- Pull requests → Preview deployment with unique URL

---

## Advanced Configuration

### Custom Domain

1. Go to Vercel Dashboard
2. Select project: `nam-viet-erp-sale`
3. Settings → Domains
4. Click "Add Domain"
5. Enter your domain (e.g., `sale.namviet.com`)
6. Follow DNS configuration instructions

### Team Collaboration

Add team members:

1. Vercel Dashboard → Project
2. Settings → Team
3. Invite team members by email

### Deployment Hooks

Create webhook for external triggers:

1. Settings → Git → Deploy Hooks
2. Create hook
3. Use webhook URL to trigger deployments

---

## Deployment Commands Reference

| Command                       | Description                 |
| ----------------------------- | --------------------------- |
| `vercel`                      | Deploy to preview           |
| `vercel --prod`               | Deploy to production        |
| `vercel ls`                   | List all deployments        |
| `vercel logs`                 | View deployment logs        |
| `vercel env ls`               | List environment variables  |
| `vercel env add [name]`       | Add environment variable    |
| `vercel env rm [name]`        | Remove environment variable |
| `vercel domains ls`           | List domains                |
| `vercel domains add [domain]` | Add custom domain           |
| `vercel open`                 | Open project in browser     |
| `vercel inspect [url]`        | Inspect deployment          |

---

## Production URLs

- **Production:** `https://nam-viet-erp-sale.vercel.app`
- **Preview Deployments:** `https://nam-viet-erp-sale-[git-branch].vercel.app`

---

## Monitoring & Analytics

### Vercel Analytics

Enable analytics in Vercel dashboard:

1. Project Settings → Analytics
2. Enable Web Analytics
3. View real-time traffic data

### Performance Monitoring

Check build and runtime performance:

1. Deployments tab
2. Click on specific deployment
3. View build logs and runtime metrics

---

## Rollback Procedure

If a deployment has issues:

### Via CLI

```bash
# List deployments
vercel ls

# Promote a previous deployment to production
vercel promote [deployment-url]
```

### Via Dashboard

1. Go to Deployments tab
2. Find the stable deployment
3. Click "..." menu → Promote to Production

---

## Security Best Practices

1. **Never commit environment variables** to Git
2. **Rotate Supabase keys** periodically
3. **Enable Vercel Authentication** for sensitive routes
4. **Use environment-specific variables** for dev/staging/prod
5. **Monitor deployment logs** for suspicious activity

---

## Support & Resources

- **Vercel Documentation:** https://vercel.com/docs
- **Vercel Support:** https://vercel.com/support
- **Vercel Community:** https://github.com/vercel/vercel/discussions

---

## Deployment Checklist

Before deploying to production:

- [ ] All tests passing locally
- [ ] Environment variables configured
- [ ] `vercel.json` routing configured
- [ ] Build command tested locally
- [ ] No sensitive data in code
- [ ] Git repository up to date
- [ ] Team members notified
- [ ] Backup of previous deployment available

---

**Last Updated:** January 2025

**Maintained By:** Nam Viet ERP Development Team
