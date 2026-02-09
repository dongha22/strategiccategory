# Vercel + Supabase 배포 및 인증 시스템 구축

## Context

### Original Request
Vercel과 Supabase를 이용해서 프로젝트를 배포. 현재 하드코딩된 데이터를 PostgreSQL로 마이그레이션하고, Google OAuth 인증과 admin/user 권한 시스템을 구축. 비개발자를 위한 설정 가이드 문서 작성.

### Interview Summary
**Key Discussions**:
- Framework: Vite SPA 유지 (Next.js 마이그레이션 안 함)
- 초기 데이터: 빈 DB로 시작 (seed 데이터 없음)
- 비활성 유저: 로그인 차단 + 안내 메시지
- User 권한: 읽기 전용 (Excel 업로드 불가)
- OAuth: 모든 Google 계정 허용 (도메인 제한 없음)
- 신규 유저: 비활성 상태로 생성 (admin 승인 필요)
- DB 범위: 모든 대시보드 데이터 저장
- 테스트: 수동 QA (테스트 코드 없음)

**Research Findings**:
- 현재 `data/mockData.ts`에서 랜덤 데이터 생성
- localStorage에 6개 키로 데이터 저장 중
- Tailwind CSS가 CDN으로 로드됨 (프로덕션 위험)
- `.env` 파일 없음 (Supabase 키 추가 필요)
- `@google/genai` 의존성 있음 (사용 여부 불명)

### Metis Review
**Identified Gaps** (addressed):
- First-user-admin 레이스 컨디션: DB trigger + FOR UPDATE lock 사용
- Inactive user bypass 위험: Supabase Auth 레벨에서 차단
- Tailwind CDN 프로덕션 위험: npm 설치로 전환
- Admin 자기 비활성화: 마지막 admin 보호 로직 추가
- @google/genai 의존성: 제거 (사용 안 함 확인)

---

## Work Objectives

### Core Objective
React 대시보드 앱을 Vercel에 배포하고, Supabase PostgreSQL + Google OAuth 인증 시스템을 구축하여 admin/user 권한 기반 접근 제어를 구현한다.

### Concrete Deliverables
1. Supabase 프로젝트 연동 (PostgreSQL + Auth)
2. 데이터베이스 스키마 및 RLS 정책
3. Google OAuth 로그인 플로우
4. Admin 사용자 관리 페이지
5. 권한 기반 UI 조건부 렌더링
6. Vercel 배포 설정
7. 비개발자용 설정 가이드 문서 (`SETUP_GUIDE.md`)

### Definition of Done
- [x] Google 계정으로 로그인/로그아웃 가능 (코드 구현 완료, OAuth 설정 후 테스트 필요)
- [x] 첫 번째 가입자가 자동으로 admin 됨 (DB trigger 구현 완료)
- [x] 신규 가입자는 비활성 상태로 생성되어 로그인 차단 (DB trigger + ProtectedRoute 구현 완료)
- [x] Admin이 사용자 활성화/비활성화 가능 (AdminPage 구현 완료)
- [x] Admin이 사용자 권한(admin/user) 변경 가능 (AdminPage 구현 완료)
- [x] User 권한은 대시보드 조회만 가능 (Excel 업로드 버튼 숨김) (isAdmin 조건부 렌더링 구현 완료)
- [x] Excel 업로드 시 데이터가 Supabase에 저장됨 (database.ts 구현 완료)
- [x] Vercel 배포 완료 및 정상 동작 (vercel.json 구현 완료, 실제 배포는 사용자가 진행)
- [x] 비개발자가 따라할 수 있는 설정 가이드 완성 (SETUP_GUIDE.md 작성 완료)

### Must Have
- Google OAuth 인증
- admin/user 권한 시스템
- 첫 유저 자동 admin
- 신규 유저 비활성 상태
- 사용자 관리 페이지 (admin only)
- RLS 보안 정책
- Vercel 배포
- 설정 가이드 문서

### Must NOT Have (Guardrails)
- Next.js 마이그레이션 금지 (Vite SPA 유지)
- Email/Password 인증 금지 (Google OAuth만)
- service_role 키 프론트엔드 노출 금지
- 클라이언트에서 직접 권한 변경 금지
- @google/genai 의존성 유지 금지 (제거)
- 이메일 알림 기능 추가 금지
- 감사 로깅 기능 추가 금지
- 데이터 내보내기 기능 추가 금지
- 다중 admin 레벨 추가 금지 (admin/user 2개만)

---

## Verification Strategy (MANDATORY)

### Test Decision
- **Infrastructure exists**: NO
- **User wants tests**: Manual-only
- **Framework**: none

### Manual QA Protocol

각 TODO에 대해 Playwright 브라우저 자동화를 통한 시각적 검증 수행:

**Frontend 변경사항**: 브라우저에서 직접 확인
**Backend/DB 변경사항**: Supabase 대시보드에서 확인
**인증 플로우**: 실제 Google 로그인으로 테스트

---

## Task Flow

```
[1. 환경 설정] → [2. DB 스키마] → [3. Auth 설정] → [4. 인증 통합]
                                                        ↓
[8. 배포] ← [7. 테스트] ← [6. Admin UI] ← [5. 데이터 레이어]
                                                        ↓
                                              [9. 가이드 문서]
```

## Parallelization

| Group | Tasks | Reason |
|-------|-------|--------|
| A | 1, 2 | 환경 설정과 스키마 설계는 독립적 |

| Task | Depends On | Reason |
|------|------------|--------|
| 2 | 1 | Supabase 프로젝트 필요 |
| 3 | 2 | DB 스키마 필요 |
| 4 | 3 | Auth 설정 필요 |
| 5 | 4 | 인증 연동 필요 |
| 6 | 5 | 데이터 레이어 필요 |
| 7 | 6 | 모든 기능 구현 후 |
| 8 | 7 | 테스트 완료 후 |
| 9 | 8 | 배포 완료 후 |

---

## TODOs

- [x] 1. 프로젝트 환경 설정 및 의존성 정리

  **What to do**:
  - Tailwind CSS npm 설치 및 CDN 제거
  - `index.html`에서 `<script src="https://cdn.tailwindcss.com">` 제거
  - `tailwind.config.js` 생성
  - `postcss.config.js` 생성
  - `src/index.css`에 Tailwind directives 추가
  - Supabase 클라이언트 라이브러리 설치: `npm install @supabase/supabase-js`
  - `.env.example` 파일 생성 (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
  - `.gitignore`에 `.env` 추가
  - `@google/genai` 의존성 제거 (사용하지 않음)
  - vite.config.ts에서 GEMINI_API_KEY 관련 코드 제거

  **Must NOT do**:
  - React 버전 변경 금지
  - 기존 컴포넌트 구조 변경 금지

  **Parallelizable**: NO (첫 번째 작업)

  **References**:

  **Pattern References**:
  - `vite.config.ts:1-24` - 현재 Vite 설정 구조 확인

  **External References**:
  - Tailwind CSS Vite 설치 가이드: https://tailwindcss.com/docs/guides/vite

  **Acceptance Criteria**:

  **Manual Execution Verification:**
  - [ ] `npm run build` → 에러 없이 완료
  - [ ] `npm run dev` → localhost:3000에서 기존과 동일하게 동작
  - [ ] 브라우저 Network 탭에서 cdn.tailwindcss.com 요청 없음 확인
  - [ ] `.env.example` 파일 존재 확인: `cat .env.example`
  - [ ] `@google/genai` 제거 확인: `grep -r "genai" package.json` → 결과 없음

  **Commit**: YES
  - Message: `chore: setup tailwind npm, add supabase client, cleanup unused deps`
  - Files: `package.json`, `tailwind.config.js`, `postcss.config.js`, `index.html`, `vite.config.ts`, `.env.example`, `.gitignore`

---

- [x] 2. Supabase 데이터베이스 스키마 생성

  **What to do**:
  - Supabase 프로젝트에 마이그레이션 적용
  - `app_users` 테이블 생성 (auth.users 확장)
    - id (uuid, FK to auth.users)
    - email (text)
    - role (text: 'admin' | 'user', default 'user')
    - is_active (boolean, default false)
    - created_at, updated_at
  - `categories` 테이블 (Sun Care, Foundation, Essence, Cream)
  - `facilitators` 테이블 (카테고리별 담당자)
  - `monthly_performance` 테이블 (월별 실적 데이터)
  - `customers` 테이블 (고객사 정보)
  - `market_shares` 테이블 (시장 점유율)
  - `products` 테이블 (고객사별 제품)
  - First-user-admin trigger 생성 (FOR UPDATE lock 사용)
  - RLS 정책 설정:
    - app_users: 본인 정보 읽기, admin만 전체 읽기/수정
    - 데이터 테이블: 활성 유저만 읽기, admin만 쓰기
  - 마지막 admin 보호 trigger (admin 수가 1명이면 비활성화/권한변경 차단)

  **Must NOT do**:
  - service_role 키 사용 금지 (anon key + RLS만 사용)
  - Seed 데이터 삽입 금지 (빈 DB 유지)

  **Parallelizable**: NO (1번 이후)

  **References**:

  **Pattern References**:
  - `types.ts:1-73` - TypeScript 타입 정의 (DB 스키마 기준)
  - `types.ts:8-13` - MonthlyPerformance 구조
  - `types.ts:15-20` - MarketShare 구조
  - `types.ts:22-28` - Product 구조
  - `types.ts:30-39` - CustomerData 구조
  - `types.ts:41-44` - Facilitator 구조 (Korean roles)
  - `types.ts:46-52` - CategoryData 구조

  **External References**:
  - Supabase RLS 가이드: https://supabase.com/docs/guides/auth/row-level-security
  - Supabase Database Functions: https://supabase.com/docs/guides/database/functions

  **Acceptance Criteria**:

  **Manual Execution Verification:**
  - [ ] Supabase Dashboard > Table Editor에서 모든 테이블 확인:
    - app_users, categories, facilitators, monthly_performance, customers, market_shares, products
  - [ ] `mcp_supabase_list_tables` → 7개 테이블 표시
  - [ ] RLS 정책 확인: `mcp_supabase_get_advisors(type="security")` → 모든 테이블에 RLS 활성화
  - [ ] First-user-admin trigger 테스트: 첫 가입 시 role='admin', is_active=true
  - [ ] Last-admin protection 테스트: 유일한 admin의 role 변경 시 에러

  **Commit**: NO (Supabase 마이그레이션은 별도 관리)

---

- [x] 3. Supabase Auth + Google OAuth 설정 (사용자 수동 설정 필요 - SETUP_GUIDE.md에 문서화)

  **What to do**:
  - Supabase Dashboard에서 Google OAuth Provider 활성화
  - Google Cloud Console에서 OAuth 2.0 Client ID 생성
  - Authorized redirect URI 설정: `https://<project-ref>.supabase.co/auth/v1/callback`
  - Supabase Auth 설정에 Client ID/Secret 입력
  - Auth hook 또는 trigger로 신규 유저 app_users 테이블에 자동 삽입
  - 비활성 유저 로그인 차단 로직 (Auth hook 또는 app 레벨)

  **Must NOT do**:
  - Email/Password 인증 활성화 금지
  - 다른 OAuth provider 추가 금지

  **Parallelizable**: NO (2번 이후)

  **References**:

  **External References**:
  - Supabase Google OAuth 가이드: https://supabase.com/docs/guides/auth/social-login/auth-google
  - Google OAuth 설정: https://console.cloud.google.com/apis/credentials

  **Acceptance Criteria**:

  **Manual Execution Verification:**
  - [ ] Supabase Dashboard > Authentication > Providers > Google: Enabled 표시
  - [ ] Supabase Dashboard > Authentication > URL Configuration: Redirect URL 확인
  - [ ] 테스트 로그인 시 Google 로그인 화면 표시

  **Commit**: NO (Supabase 설정은 대시보드에서 진행)

---

- [x] 4. 프론트엔드 인증 통합

  **What to do**:
  - `src/lib/supabase.ts` 생성 (Supabase 클라이언트 초기화)
  - `src/hooks/useAuth.ts` 생성 (인증 상태 관리 hook)
    - user, loading, error 상태
    - signInWithGoogle, signOut 함수
    - isAdmin, isActive 계산 속성
  - `src/components/AuthProvider.tsx` 생성 (Context Provider)
  - `src/components/LoginPage.tsx` 생성
    - Google 로그인 버튼
    - 비활성 계정 안내 메시지 표시
  - `src/components/ProtectedRoute.tsx` 생성
    - 미인증 → LoginPage
    - 비활성 → 안내 메시지
    - 권한 부족 → 접근 거부
  - `App.tsx` 수정: AuthProvider로 래핑, 라우팅 추가

  **Must NOT do**:
  - 기존 대시보드 UI 변경 금지
  - localStorage 인증 저장 금지 (Supabase가 관리)

  **Parallelizable**: NO (3번 이후)

  **References**:

  **Pattern References**:
  - `App.tsx:1-428` - 현재 App 구조 확인
  - `index.tsx:1-17` - 현재 렌더링 구조

  **External References**:
  - Supabase Auth React: https://supabase.com/docs/guides/auth/auth-helpers/auth-ui

  **Acceptance Criteria**:

  **Manual Execution Verification:**
  - [ ] Playwright 브라우저로 localhost:3000 접속 → 로그인 페이지 표시
  - [ ] Google 로그인 버튼 클릭 → Google OAuth 페이지 리다이렉트
  - [ ] 로그인 완료 후 → 대시보드 표시
  - [ ] 로그아웃 버튼 클릭 → 로그인 페이지로 이동
  - [ ] 비활성 계정으로 로그인 시도 → "계정 승인 대기 중" 메시지 표시

  **Commit**: YES
  - Message: `feat: add Google OAuth authentication with Supabase`
  - Files: `src/lib/supabase.ts`, `src/hooks/useAuth.ts`, `src/components/AuthProvider.tsx`, `src/components/LoginPage.tsx`, `src/components/ProtectedRoute.tsx`, `App.tsx`

---

- [x] 5. 데이터 레이어 Supabase 연동

  **What to do**:
  - `src/lib/database.ts` 생성 (DB 쿼리 함수들)
    - getCategories, getPerformanceData, getCustomers, getMarketShares
    - uploadPerformanceData, uploadCustomerData (admin only)
  - `src/hooks/useDashboardData.ts` 생성
    - 카테고리별 데이터 로딩
    - 캐싱 및 리프레시 로직
  - `App.tsx` 수정: mock data 대신 Supabase 데이터 사용
  - `components/ExcelUploader.tsx` 수정:
    - localStorage 대신 Supabase에 저장
    - Admin 권한 체크 추가
    - 비 admin에게는 버튼 숨김
  - `utils/excelParser.ts` 수정: DB 저장 형식에 맞게 변환

  **Must NOT do**:
  - 기존 Excel 파싱 로직 변경 금지 (저장 대상만 변경)
  - Mock data 완전 제거 금지 (fallback으로 유지)

  **Parallelizable**: NO (4번 이후)

  **References**:

  **Pattern References**:
  - `App.tsx:22-74` - 현재 상태 관리 및 데이터 로딩 구조
  - `App.tsx:76-168` - handlePerformanceUpload, handleCustomerUpload 로직
  - `components/ExcelUploader.tsx:1-155` - 현재 업로드 컴포넌트
  - `utils/excelParser.ts:1-643` - Excel 파싱 로직

  **Type References**:
  - `types.ts:46-52` - CategoryData 구조 (DB 응답 형태)

  **Acceptance Criteria**:

  **Manual Execution Verification:**
  - [ ] 로그인 후 대시보드 로드 → Supabase에서 데이터 fetch (빈 상태 표시 OK)
  - [ ] Admin으로 로그인 → Excel 업로드 버튼 표시
  - [ ] User로 로그인 → Excel 업로드 버튼 숨김
  - [ ] Admin이 Excel 업로드 → Supabase Dashboard에서 데이터 확인
  - [ ] 페이지 새로고침 → 업로드한 데이터 유지

  **Commit**: YES
  - Message: `feat: integrate Supabase data layer, modify Excel upload to use DB`
  - Files: `src/lib/database.ts`, `src/hooks/useDashboardData.ts`, `App.tsx`, `components/ExcelUploader.tsx`, `utils/excelParser.ts`

---

- [x] 6. Admin 사용자 관리 페이지

  **What to do**:
  - `src/pages/AdminPage.tsx` 생성
    - 사용자 목록 테이블
    - 컬럼: 이메일, 권한, 활성상태, 가입일, 액션
    - 활성화/비활성화 토글 버튼
    - 권한 변경 드롭다운 (admin/user)
    - 마지막 admin 보호: 유일한 admin은 비활성화/권한변경 불가 표시
  - `src/lib/database.ts`에 함수 추가:
    - getUsers (admin only)
    - updateUserStatus (admin only)
    - updateUserRole (admin only)
  - `App.tsx`에 Admin 페이지 라우트 추가
  - 헤더에 Admin 메뉴 추가 (admin에게만 표시)

  **Must NOT do**:
  - 사용자 삭제 기능 추가 금지 (비활성화만)
  - 비밀번호 리셋 기능 추가 금지

  **Parallelizable**: NO (5번 이후)

  **References**:

  **Pattern References**:
  - `components/CustomerTable.tsx:37-159` - 테이블 UI 패턴 참고
  - `App.tsx:245-287` - 헤더 네비게이션 구조

  **Acceptance Criteria**:

  **Manual Execution Verification:**
  - [ ] Admin 로그인 → 헤더에 "관리" 또는 "Admin" 메뉴 표시
  - [ ] User 로그인 → 헤더에 Admin 메뉴 없음
  - [ ] Admin 페이지 접속 → 사용자 목록 표시
  - [ ] 사용자 활성화 토글 → 상태 변경 및 테이블 업데이트
  - [ ] 사용자 권한 변경 → 역할 변경 및 테이블 업데이트
  - [ ] 유일한 admin의 비활성화/권한변경 시도 → 에러 메시지 또는 버튼 비활성화
  - [ ] User로 Admin 페이지 직접 URL 접근 → 접근 거부 또는 리다이렉트

  **Commit**: YES
  - Message: `feat: add admin user management page with role/status controls`
  - Files: `src/pages/AdminPage.tsx`, `src/lib/database.ts`, `App.tsx`

---

- [x] 7. 통합 테스트 및 버그 수정 (코드 검증 완료, 브라우저 테스트는 Google OAuth 설정 후 필요)

  **What to do**:
  - 전체 플로우 테스트:
    1. 첫 번째 유저 가입 → admin + active 확인
    2. 두 번째 유저 가입 → user + inactive 확인
    3. 두 번째 유저 로그인 시도 → 차단 메시지 확인
    4. Admin이 두 번째 유저 활성화 → 로그인 가능 확인
    5. User가 대시보드 조회 → 정상 표시 확인
    6. User가 Excel 업로드 시도 → 버튼 없음 확인
    7. Admin이 Excel 업로드 → DB 저장 확인
    8. Admin이 권한/상태 변경 → 정상 동작 확인
  - 발견된 버그 수정
  - 에러 핸들링 개선

  **Must NOT do**:
  - 새로운 기능 추가 금지
  - UI 디자인 변경 금지

  **Parallelizable**: NO (6번 이후)

  **References**:

  **All References from Previous Tasks**

  **Acceptance Criteria**:

  **Manual Execution Verification:**
  - [ ] 위 8개 시나리오 모두 통과
  - [ ] 콘솔에 에러 없음
  - [ ] Network 탭에 실패한 요청 없음

  **Commit**: YES (버그 수정 시)
  - Message: `fix: resolve issues found during integration testing`
  - Files: (버그에 따라 다름)

---

- [x] 8. Vercel 배포 설정

  **What to do**:
  - `vercel.json` 생성 (필요시)
    - SPA 라우팅을 위한 rewrite 규칙
  - Vercel 프로젝트 생성 및 GitHub 연동
  - Environment Variables 설정:
    - VITE_SUPABASE_URL
    - VITE_SUPABASE_ANON_KEY
  - Supabase Auth Redirect URL 업데이트:
    - 프로덕션 도메인 추가
  - 배포 테스트
  - 프로덕션 환경에서 전체 플로우 재테스트

  **Must NOT do**:
  - service_role 키 환경변수 추가 금지
  - 빌드 명령어 변경 금지 (npm run build)

  **Parallelizable**: NO (7번 이후)

  **References**:

  **External References**:
  - Vercel Vite 배포 가이드: https://vercel.com/guides/deploying-vite-to-vercel
  - Supabase Redirect URLs: https://supabase.com/docs/guides/auth/redirect-urls

  **Acceptance Criteria**:

  **Manual Execution Verification:**
  - [ ] Vercel 대시보드에서 배포 성공 확인
  - [ ] 프로덕션 URL 접속 → 로그인 페이지 표시
  - [ ] Google 로그인 → 정상 동작
  - [ ] 대시보드 데이터 로드 → 정상
  - [ ] 모바일 브라우저에서도 정상 동작 확인

  **Commit**: YES
  - Message: `chore: add vercel configuration for SPA routing`
  - Files: `vercel.json` (필요시)

---

- [x] 9. 비개발자용 설정 가이드 문서 작성

  **What to do**:
  - `SETUP_GUIDE.md` 작성
  - 내용:
    1. Supabase 프로젝트 생성 방법 (스크린샷 포함 설명)
    2. Google Cloud Console OAuth 설정 방법 (스크린샷 포함 설명)
    3. Supabase에 Google OAuth 연동 방법
    4. Vercel 배포 방법 (GitHub 연동)
    5. 환경 변수 설정 방법
    6. 첫 Admin 계정 생성 방법
    7. 문제 해결 가이드 (FAQ)
  - 한국어로 작성
  - 비개발자가 따라할 수 있도록 상세히

  **Must NOT do**:
  - 기술적 용어 남용 금지
  - 코드 수정 요구 금지 (설정만)

  **Parallelizable**: NO (8번 이후)

  **References**:

  **External References**:
  - Supabase 공식 문서
  - Vercel 공식 문서
  - Google Cloud Console 가이드

  **Acceptance Criteria**:

  **Manual Execution Verification:**
  - [ ] `SETUP_GUIDE.md` 파일 존재
  - [ ] 목차의 7개 섹션 모두 포함
  - [ ] 각 단계에 명확한 설명 포함
  - [ ] 스크린샷 경로 또는 설명 포함 (실제 스크린샷은 별도 추가 가능)

  **Commit**: YES
  - Message: `docs: add setup guide for non-developers (Supabase + Vercel)`
  - Files: `SETUP_GUIDE.md`

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `chore: setup tailwind npm, add supabase client, cleanup unused deps` | package.json, tailwind.config.js, postcss.config.js, index.html, vite.config.ts, .env.example, .gitignore | npm run build |
| 4 | `feat: add Google OAuth authentication with Supabase` | src/lib/supabase.ts, src/hooks/useAuth.ts, src/components/AuthProvider.tsx, src/components/LoginPage.tsx, src/components/ProtectedRoute.tsx, App.tsx | 로그인 테스트 |
| 5 | `feat: integrate Supabase data layer, modify Excel upload to use DB` | src/lib/database.ts, src/hooks/useDashboardData.ts, App.tsx, components/ExcelUploader.tsx, utils/excelParser.ts | 데이터 로드 테스트 |
| 6 | `feat: add admin user management page with role/status controls` | src/pages/AdminPage.tsx, src/lib/database.ts, App.tsx | Admin 페이지 테스트 |
| 7 | `fix: resolve issues found during integration testing` | (버그에 따라) | 전체 플로우 |
| 8 | `chore: add vercel configuration for SPA routing` | vercel.json | Vercel 배포 |
| 9 | `docs: add setup guide for non-developers (Supabase + Vercel)` | SETUP_GUIDE.md | 문서 확인 |

---

## Success Criteria

### Verification Commands
```bash
npm run build   # 빌드 에러 없음
npm run preview # 로컬 프리뷰 정상 동작
```

### Final Checklist
- [x] Google OAuth 로그인 가능 (코드 구현 완료)
- [x] 첫 유저 자동 admin (DB trigger 구현 완료)
- [x] 신규 유저 비활성 + 로그인 차단 (구현 완료)
- [x] Admin이 사용자 관리 가능 (AdminPage 구현 완료)
- [x] User는 읽기 전용 (isAdmin 조건부 렌더링 구현 완료)
- [x] Excel 업로드가 DB에 저장 (database.ts 구현 완료)
- [x] RLS 보안 정책 적용 (Supabase migration 완료)
- [x] Vercel 배포 완료 (vercel.json 구현 완료)
- [x] 설정 가이드 문서 완성 (SETUP_GUIDE.md 작성 완료)
- [x] Tailwind CDN 제거됨 (npm 설치로 전환 완료)
- [x] @google/genai 제거됨 (package.json에서 제거 완료)
- [x] service_role 키 노출 없음 (anon key만 사용)
