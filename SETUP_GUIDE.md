# 전략품목 유형별 실적 현황 대시보드 - 설정 가이드

이 가이드는 비개발자도 따라할 수 있도록 상세하게 작성되었습니다.

## 목차
1. [Supabase 프로젝트 생성](#1-supabase-프로젝트-생성)
2. [Google Cloud Console OAuth 설정](#2-google-cloud-console-oauth-설정)
3. [Supabase에 Google OAuth 연동](#3-supabase에-google-oauth-연동)
4. [Vercel 배포](#4-vercel-배포)
5. [환경 변수 설정](#5-환경-변수-설정)
6. [첫 Admin 계정 생성](#6-첫-admin-계정-생성)
7. [문제 해결 가이드 (FAQ)](#7-문제-해결-가이드-faq)

---

## 1. Supabase 프로젝트 생성

### 1.1 Supabase 계정 만들기
1. [supabase.com](https://supabase.com)에 접속합니다
2. "Start your project" 버튼을 클릭합니다
3. GitHub 계정으로 로그인합니다 (GitHub 계정이 없다면 먼저 생성하세요)

### 1.2 새 프로젝트 생성
1. 대시보드에서 "New Project" 버튼을 클릭합니다
2. 다음 정보를 입력합니다:
   - **Name**: 프로젝트 이름 (예: strategic-dashboard)
   - **Database Password**: 안전한 비밀번호 입력 (나중에 필요하니 기록해두세요)
   - **Region**: 가장 가까운 지역 선택 (한국의 경우 ap-northeast-1 또는 ap-southeast-1)
3. "Create new project" 버튼을 클릭합니다
4. 프로젝트 생성이 완료될 때까지 2-3분 기다립니다

### 1.3 프로젝트 정보 확인
1. 프로젝트 대시보드에서 왼쪽 메뉴의 "Settings" → "API"를 클릭합니다
2. 다음 정보를 복사해서 안전한 곳에 저장합니다:
   - **Project URL**: `https://xxxxx.supabase.co` 형식
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` 형식

---

## 2. Google Cloud Console OAuth 설정

### 2.1 Google Cloud 프로젝트 생성
1. [Google Cloud Console](https://console.cloud.google.com)에 접속합니다
2. 상단의 프로젝트 선택 드롭다운을 클릭합니다
3. "새 프로젝트"를 클릭합니다
4. 프로젝트 이름을 입력하고 "만들기"를 클릭합니다

### 2.2 OAuth 동의 화면 설정
1. 왼쪽 메뉴에서 "API 및 서비스" → "OAuth 동의 화면"을 클릭합니다
2. "외부"를 선택하고 "만들기"를 클릭합니다
3. 필수 정보를 입력합니다:
   - **앱 이름**: 전략품목 대시보드
   - **사용자 지원 이메일**: 본인 이메일
   - **개발자 연락처 정보**: 본인 이메일
4. "저장 후 계속"을 클릭합니다
5. 범위 설정은 기본값으로 두고 "저장 후 계속"을 클릭합니다
6. 테스트 사용자는 건너뛰고 "저장 후 계속"을 클릭합니다

### 2.3 OAuth 클라이언트 ID 생성
1. 왼쪽 메뉴에서 "API 및 서비스" → "사용자 인증 정보"를 클릭합니다
2. 상단의 "+ 사용자 인증 정보 만들기" → "OAuth 클라이언트 ID"를 클릭합니다
3. 다음 정보를 입력합니다:
   - **애플리케이션 유형**: 웹 애플리케이션
   - **이름**: Strategic Dashboard
   - **승인된 리디렉션 URI**: 
     - `https://rmfgoynkuufnnqtqgcnt.supabase.co/auth/v1/callback`
4. "만들기"를 클릭합니다
5. 표시되는 **클라이언트 ID**와 **클라이언트 보안 비밀번호**를 복사해서 안전한 곳에 저장합니다

---

## 3. Supabase에 Google OAuth 연동

### 3.1 Google Provider 활성화
1. Supabase 대시보드로 돌아갑니다
2. 왼쪽 메뉴에서 "Authentication" → "Providers"를 클릭합니다
3. "Google" 항목을 찾아 클릭합니다
4. "Enable Sign in with Google" 토글을 켭니다
5. 다음 정보를 입력합니다:
   - **Client ID**: Google Cloud Console에서 복사한 클라이언트 ID
   - **Client Secret**: Google Cloud Console에서 복사한 클라이언트 보안 비밀번호
6. "Save"를 클릭합니다

### 3.2 Redirect URL 확인
1. "Authentication" → "URL Configuration"을 클릭합니다
2. "Site URL"에 배포할 도메인을 입력합니다 (나중에 Vercel 배포 후 업데이트)
3. "Redirect URLs"에 다음을 추가합니다:
   - `http://localhost:3000` (개발용)
   - Vercel 배포 URL (나중에 추가)

---

## 4. Vercel 배포

### 4.1 GitHub에 코드 업로드
1. 이 프로젝트의 코드가 GitHub 저장소에 있어야 합니다
2. 없다면 GitHub에 새 저장소를 만들고 코드를 push합니다

### 4.2 Vercel 계정 생성 및 프로젝트 연결
1. [vercel.com](https://vercel.com)에 접속합니다
2. GitHub 계정으로 로그인합니다
3. "Add New..." → "Project"를 클릭합니다
4. GitHub 저장소 목록에서 이 프로젝트를 선택합니다
5. "Import"를 클릭합니다

### 4.3 빌드 설정
1. Framework Preset이 "Vite"로 자동 감지되는지 확인합니다
2. Build Command: `npm run build` (기본값)
3. Output Directory: `dist` (기본값)
4. "Deploy"를 클릭합니다

### 4.4 배포 완료 후
1. 배포가 완료되면 Vercel이 제공하는 URL을 확인합니다 (예: `https://your-project.vercel.app`)
2. 이 URL을 Supabase의 Redirect URLs에 추가합니다

---

## 5. 환경 변수 설정

### 5.1 Vercel 환경 변수 추가
1. Vercel 대시보드에서 프로젝트를 선택합니다
2. "Settings" → "Environment Variables"를 클릭합니다
3. 다음 변수들을 추가합니다:
   - **Name**: `VITE_SUPABASE_URL`
     **Value**: Supabase 프로젝트 URL (예: `https://xxxxx.supabase.co`)
   - **Name**: `VITE_SUPABASE_ANON_KEY`
     **Value**: Supabase anon public key
4. "Save"를 클릭합니다
5. "Deployments" 탭에서 "Redeploy"를 클릭하여 환경 변수를 적용합니다

---

## 6. 첫 Admin 계정 생성

### 6.1 첫 번째 로그인
1. 배포된 URL에 접속합니다
2. "Google로 로그인" 버튼을 클릭합니다
3. Google 계정으로 로그인합니다
4. **첫 번째로 로그인한 사용자가 자동으로 Admin이 됩니다**

### 6.2 Admin 권한 확인
1. 로그인 후 헤더에 "관리" 버튼이 보이면 Admin입니다
2. "관리" 버튼을 클릭하여 사용자 관리 페이지에 접근할 수 있습니다

### 6.3 다른 사용자 승인
1. 다른 사용자가 로그인을 시도하면 "승인 대기 중" 메시지가 표시됩니다
2. Admin이 "관리" 페이지에서 해당 사용자를 "활성화"해야 로그인할 수 있습니다

---

## 7. 문제 해결 가이드 (FAQ)

### Q: 로그인 버튼을 클릭해도 아무 반응이 없어요
**A**: 
- Supabase에서 Google Provider가 활성화되어 있는지 확인하세요
- Google Cloud Console의 OAuth 클라이언트 ID와 Secret이 올바르게 입력되었는지 확인하세요
- Redirect URI가 정확히 일치하는지 확인하세요

### Q: "redirect_uri_mismatch" 에러가 발생해요
**A**: 
- Google Cloud Console의 "승인된 리디렉션 URI"에 Supabase callback URL이 정확히 추가되었는지 확인하세요
- URL 끝에 슬래시(/)가 있거나 없는 차이로 에러가 발생할 수 있습니다

### Q: 로그인은 되는데 "승인 대기 중"이라고 나와요
**A**: 
- 첫 번째 사용자가 아닌 경우 정상입니다
- Admin 사용자에게 계정 활성화를 요청하세요

### Q: Admin 버튼이 보이지 않아요
**A**: 
- 첫 번째로 가입한 사용자만 자동으로 Admin이 됩니다
- 이미 다른 사용자가 먼저 가입했다면, 해당 사용자가 Admin입니다

### Q: 데이터가 표시되지 않아요
**A**: 
- 처음에는 샘플 데이터가 표시됩니다
- Admin 사용자가 Excel 파일을 업로드하면 실제 데이터로 대체됩니다

### Q: Excel 업로드 버튼이 보이지 않아요
**A**: 
- Excel 업로드는 Admin 권한이 있는 사용자만 가능합니다
- 일반 사용자(User)는 데이터 조회만 가능합니다

---

## 지원

문제가 해결되지 않으면 개발팀에 문의하세요.
