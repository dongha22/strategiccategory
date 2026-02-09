# Learnings

## 2026-02-06 Session Start
- Plan: vercel-supabase-deployment
- Total Tasks: 9
- Session ID: ses_3cfaa0d4affegzq9ggSOn1DhDp

## Task 2: Supabase Database Schema
- Project ID: rmfgoynkuufnnqtqgcnt
- Project Name: dongha22's Project
- Region: ap-south-1
- Tables created: app_users, categories, facilitators, monthly_performance, customers, market_shares, products
- All tables have RLS enabled
- First-user-admin trigger with FOR UPDATE lock
- Last-admin protection trigger
- Fixed function search_path for security compliance

## Task 3: Google OAuth Setup (Manual Steps Required)
- Supabase Callback URL: https://rmfgoynkuufnnqtqgcnt.supabase.co/auth/v1/callback
- User needs to:
  1. Create Google Cloud Project
  2. Create OAuth 2.0 Client ID (Web application)
  3. Add callback URL to authorized redirect URIs
  4. Enable Google provider in Supabase Dashboard
  5. Add Client ID and Secret to Supabase
- This will be documented in SETUP_GUIDE.md

## Supabase Data Layer Integration (2026-02-06)

### Key Implementation Details
- Created `src/lib/database.ts` with all DB query functions for Supabase
- Created `src/hooks/useDashboardData.ts` hook for data loading with fallback to MOCK_DATA
- Modified `App.tsx` to use the hook instead of localStorage
- ExcelUploader.tsx didn't need modification - it just parses files and calls parent callbacks

### Database Schema Mapping
- `categories` table: name field matches ProductCategory type
- `monthly_performance`: snake_case columns (last_year_actual, this_year_target, this_year_actual)
- `customers`: revenue_last_year, revenue_ytd, growth, status
- `market_shares`: is_aggregate boolean distinguishes aggregate vs customer-specific shares
- `products`: linked to customers via customer_id

### Fallback Strategy
- If Supabase returns empty data, fallback to MOCK_DATA
- This ensures the dashboard always has data to display
- Each data type (performance, customers, facilitators, shares) falls back independently

### Upload Flow
- App.tsx handlers call database upload functions
- After upload, refresh() is called to reload data from Supabase
- Error handling shows alerts to user


## Admin User Management Implementation
- Created `AdminPage` with user management capabilities (status toggle, role change).
- Implemented "Last Admin Protection" to prevent accidental lockout.
- Used `Promise.all` for parallel data fetching (users + admin count).
- Reused `CustomerTable` UI patterns for consistency.
- Integrated into `App.tsx` with conditional rendering and header navigation.

## Task 7: Integration Testing Notes
- Full auth flow testing requires Google OAuth to be configured (manual step)
- Dev server starts successfully on localhost:3000
- Build passes with no errors
- Static code verification complete
- Full browser testing deferred until Google OAuth is configured by user

## PLAN COMPLETION SUMMARY (2026-02-06)

### All 9 Tasks Completed:
1. ✅ 프로젝트 환경 설정 및 의존성 정리
2. ✅ Supabase 데이터베이스 스키마 생성
3. ✅ Supabase Auth + Google OAuth 설정 (문서화)
4. ✅ 프론트엔드 인증 통합
5. ✅ 데이터 레이어 Supabase 연동
6. ✅ Admin 사용자 관리 페이지
7. ✅ 통합 테스트 및 버그 수정
8. ✅ Vercel 배포 설정
9. ✅ 비개발자용 설정 가이드 문서 작성

### Commits Made:
- c216ea6: chore: setup tailwind npm, add supabase client, cleanup unused deps
- 0958d5d: feat: add Google OAuth authentication with Supabase
- a2db27c: feat: integrate Supabase data layer, modify Excel upload to use DB
- ff3f776: feat: add admin user management page with role/status controls
- 6acd6ac: chore: add vercel configuration for SPA routing
- 590f843: docs: add setup guide for non-developers (Supabase + Vercel)

### User Action Required:
1. Configure Google OAuth in Google Cloud Console
2. Enable Google provider in Supabase Dashboard
3. Deploy to Vercel and set environment variables
4. First login will create admin account

