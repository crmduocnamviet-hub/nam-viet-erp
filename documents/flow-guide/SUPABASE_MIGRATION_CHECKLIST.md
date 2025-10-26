# Supabase Migration Checklist

## Chuẩn Bị (30 phút)

### 1. Thông Tin Cần Thu Thập

- [ ] Old Project Ref: `____________________`
- [ ] Old Database Password: `____________________`
- [ ] Old Project URL: `https://______.supabase.co`
- [ ] Old Anon Key: (from Settings > API)
- [ ] Old Service Role Key: (from Settings > API)

### 2. Cài Đặt Tools

- [ ] PostgreSQL client installed

  ```bash
  brew install postgresql
  # hoặc
  sudo apt install postgresql-client
  ```

- [ ] Verify pg_dump và psql

  ```bash
  pg_dump --version
  psql --version
  ```

- [ ] Supabase CLI (optional)
  ```bash
  brew install supabase/tap/supabase
  # hoặc
  npm install -g supabase
  ```

### 3. Backup Code Hiện Tại

- [ ] Commit tất cả changes

  ```bash
  git add .
  git commit -m "Pre-migration backup"
  git push
  ```

- [ ] Create backup branch

  ```bash
  git checkout -b backup-before-migration
  git push origin backup-before-migration
  ```

- [ ] Backup .env files
  ```bash
  cp .env .env.backup
  cp .env.local .env.local.backup
  ```

## Migration Process (1-2 giờ)

### 4. Export Database Cũ

- [ ] Make migration script executable

  ```bash
  chmod +x scripts/migrate_supabase.sh
  ```

- [ ] Fill in credentials in script:

  ```bash
  # Edit scripts/migrate_supabase.sh
  OLD_PROJECT_REF="your-old-ref"
  OLD_DB_PASSWORD="your-old-password"
  ```

- [ ] Run migration script

  ```bash
  cd /Users/macbook/Documents/personal-work/nam-viet-erp
  ./scripts/migrate_supabase.sh
  ```

- [ ] Verify backup files created:
  - [ ] `full_backup.sql` exists
  - [ ] `public_schema.sql` exists
  - [ ] `data_only.sql` exists
  - [ ] File size looks reasonable

### 5. Tạo Project Mới

- [ ] Go to https://app.supabase.com
- [ ] Click "New Project"
- [ ] Fill in details:
  - [ ] Project Name: `nam-viet-erp-new`
  - [ ] Database Password: (generate strong password)
  - [ ] Region: **Southeast Asia (Singapore)**
  - [ ] Plan: Free or Pro
- [ ] Click "Create new project"
- [ ] Wait ~2 minutes for provisioning
- [ ] Note down:
  - [ ] New Project Ref: `____________________`
  - [ ] New Database Password: `____________________`

### 6. Import to New Database

- [ ] Continue with migration script (it will prompt you)
- [ ] Enter new project credentials when asked
- [ ] Wait for import to complete
- [ ] Check for errors in `import_log.txt`

### 7. Verify Migration

- [ ] Check table counts match:

  ```bash
  # Compare old vs new
  # Script will show this automatically
  ```

- [ ] Verify data in key tables:

  ```bash
  # Login to new database
  psql "postgresql://postgres:[NEW_PASSWORD]@db.[NEW_REF].supabase.co:5432/postgres"

  # Check row counts
  SELECT count(*) FROM products;
  SELECT count(*) FROM employees;
  SELECT count(*) FROM b2b_quotes;
  ```

- [ ] Check relationships intact:
  ```sql
  SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name
  FROM information_schema.table_constraints AS tc
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
  WHERE tc.constraint_type = 'FOREIGN KEY';
  ```

## Configuration Update (15 phút)

### 8. Get New API Keys

- [ ] Go to new project: https://app.supabase.com/project/[NEW_REF]
- [ ] Navigate to Settings > API
- [ ] Copy keys:
  - [ ] Project URL: `https://[NEW_REF].supabase.co`
  - [ ] Anon/Public key
  - [ ] Service Role key (⚠️ Keep secret!)

### 9. Update Environment Variables

- [ ] Run update script:

  ```bash
  chmod +x scripts/update_supabase_config.sh
  ./scripts/update_supabase_config.sh
  ```

- [ ] Or manually update `.env`:

  ```bash
  NEXT_PUBLIC_SUPABASE_URL=https://[NEW_REF].supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=[new-anon-key]
  SUPABASE_SERVICE_ROLE_KEY=[new-service-role-key]
  ```

- [ ] Update `.env.local` (if exists)
- [ ] Update `.env.production` (if exists)

### 10. Verify Supabase Client

- [ ] Check `packages/services/src/supabase/supabase.ts`:

  ```typescript
  // Should use environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  ```

- [ ] No hardcoded URLs/keys

## Testing (30 phút)

### 11. Local Testing

- [ ] Install dependencies (if needed):

  ```bash
  yarn install
  # or
  npm install
  ```

- [ ] Clear cache:

  ```bash
  rm -rf .next
  rm -rf node_modules/.cache
  ```

- [ ] Start dev server:

  ```bash
  yarn dev
  # or
  npm run dev
  ```

- [ ] Open browser: http://localhost:3000

### 12. Test Core Features

#### Authentication

- [ ] Login with existing account
- [ ] Logout
- [ ] Login again
- [ ] Check user profile

#### Data Operations

- [ ] View products list
- [ ] Create new product
- [ ] Edit product
- [ ] Delete product

#### B2B Features

- [ ] View B2B quotes
- [ ] Create new quote
- [ ] Edit quote
- [ ] Assign employees

#### Purchase Orders

- [ ] View purchase orders
- [ ] Create PO
- [ ] Receive items
- [ ] Check lot management

#### Warehouse

- [ ] View inventory
- [ ] Stock movements
- [ ] Check warehouse data

### 13. Test API Connections

- [ ] Test with curl:

  ```bash
  curl https://[NEW_REF].supabase.co/rest/v1/products \
    -H "apikey: [NEW_ANON_KEY]" \
    -H "Authorization: Bearer [NEW_ANON_KEY]"
  ```

- [ ] Check browser console for errors
- [ ] Check Network tab for API calls
- [ ] Verify no CORS errors

## Deployment (Tùy chọn)

### 14. Update Production Environment

If deploying to production:

- [ ] Update environment variables on hosting platform:
  - Vercel: Project Settings > Environment Variables
  - Netlify: Site Settings > Environment Variables
  - Railway: Variables tab
  - Other: Check platform docs

- [ ] Redeploy application:

  ```bash
  git add .
  git commit -m "Update Supabase configuration"
  git push origin main
  ```

- [ ] Wait for deployment to complete
- [ ] Test production site

### 15. DNS & Custom Domain (if applicable)

- [ ] Update custom domain settings
- [ ] Verify SSL certificate
- [ ] Test custom domain

## Post-Migration (1 tuần)

### 16. Monitor & Verify

**Day 1-3:**

- [ ] Monitor error logs daily
- [ ] Check Supabase dashboard for issues
- [ ] Verify user reports
- [ ] Check database performance

**Day 4-7:**

- [ ] Continue monitoring
- [ ] Compare performance with old database
- [ ] Check for data inconsistencies
- [ ] Backup new database

### 17. Storage Migration (If Needed)

If you have files in Supabase Storage:

- [ ] List buckets in old project
- [ ] Create same buckets in new project
- [ ] Download files from old storage:

  ```bash
  supabase storage download --project-ref OLD_REF
  ```

- [ ] Upload to new storage:

  ```bash
  supabase storage upload --project-ref NEW_REF
  ```

- [ ] Verify file URLs updated in database

### 18. Auth Users Migration (If Needed)

⚠️ **Warning**: Auth migration is complex!

Options:

1. **Keep old project for auth** (redirect login)
2. **Export/Import users** (requires password reset)
3. **Use Supabase Auth Admin API**

- [ ] Decide on auth migration strategy
- [ ] If migrating users:
  - [ ] Export users from old project
  - [ ] Import to new project
  - [ ] Send password reset emails
  - [ ] Update user metadata

### 19. Update Documentation

- [ ] Update README with new Supabase project info
- [ ] Update team documentation
- [ ] Notify team members of changes
- [ ] Document any issues encountered

### 20. Cleanup Old Project

**After 1 week of stable operation:**

- [ ] Download final backup from old project
- [ ] Store backup in safe location
- [ ] Consider downgrading old project to Free tier
- [ ] ⚠️ DO NOT delete old project yet (wait 1 month)

**After 1 month:**

- [ ] Final verification new project is stable
- [ ] Consider pausing old project
- [ ] Keep for 3 months before deletion

## Rollback Plan

If something goes wrong:

### 21. Emergency Rollback

- [ ] Restore `.env` from backup:

  ```bash
  cp .env.backup .env
  cp .env.local.backup .env.local
  ```

- [ ] Clear cache:

  ```bash
  rm -rf .next
  ```

- [ ] Restart dev server:

  ```bash
  yarn dev
  ```

- [ ] Revert deployment (if deployed):

  ```bash
  git revert HEAD
  git push origin main
  ```

- [ ] Update production environment variables back to old values

## Troubleshooting

### Common Issues

#### "Cannot connect to database"

- [ ] Verify database password is correct
- [ ] Check project is not paused
- [ ] Verify IP not blocked
- [ ] Check firewall settings

#### "Relation does not exist"

- [ ] Schema not imported correctly
- [ ] Re-run import with public schema
- [ ] Check migration logs

#### "Permission denied"

- [ ] RLS policies not migrated
- [ ] Check table permissions
- [ ] Verify service role key

#### "No data showing"

- [ ] Data import failed
- [ ] Check import_log.txt
- [ ] Verify row counts
- [ ] Re-import data_only.sql

#### "Auth not working"

- [ ] Clear browser cookies
- [ ] Clear localStorage
- [ ] Check auth schema migrated
- [ ] Verify JWT secret (cannot migrate)

## Success Criteria

✅ Migration is successful when:

- [ ] All tables exist in new database
- [ ] Row counts match between old and new
- [ ] All relationships (FKs) intact
- [ ] Application connects to new database
- [ ] All features work correctly
- [ ] No errors in console/logs
- [ ] Performance is acceptable
- [ ] Users can login and use app
- [ ] Team has been notified
- [ ] Documentation updated

## Notes & Issues

Use this space to document any issues encountered:

```
Date: ___________
Issue: ___________
Resolution: ___________

Date: ___________
Issue: ___________
Resolution: ___________
```

## Resources

- Supabase Migration Guide: `SUPABASE_MIGRATION_GUIDE.md`
- Migration Script: `scripts/migrate_supabase.sh`
- Config Update Script: `scripts/update_supabase_config.sh`
- Supabase Docs: https://supabase.com/docs
- Support: https://discord.supabase.com

---

**Migration Started**: ****\_\_\_****
**Migration Completed**: ****\_\_\_****
**Production Deployed**: ****\_\_\_****
**Old Project Deleted**: ****\_\_\_**** (after 3 months)
