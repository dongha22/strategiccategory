# Dashboard UI & Data Interface Refactor

## Context

### Original Request
대시보드 UI 구조 요약 + 데이터 인터페이스(타입/스키마)를 깔끔하게 정리. 더미 데이터를 한 파일로 모으고 실제 데이터(Excel/CSV)로 교체하기 쉬운 구조 설계.

### Interview Summary
**Key Discussions**:
- 더미 데이터 위치: `data/mockData.ts`로 분리
- 타입 구조: `types.ts` 단일 파일 유지 (프로젝트 규모 작음)
- 데이터 소스: Excel/CSV 업로드 (향후)
- 이번 작업 범위: 타입/스키마 정리만 (업로드 기능 제외)
- geminiService.ts: 제거 (현재 미사용)

**Research Findings**:
- App.tsx:138의 `as any`는 불필요한 스프레드 때문 (Metis 발견)
- PerformanceMetrics는 `data.totalPerformance`를 직접 사용 → 스프레드 제거로 해결
- `CATEGORIES`가 `string[]`로 정의되어 `ProductCategory` 타입과 분리됨

### Metis Review
**Identified Gaps** (addressed):
- `CATEGORIES` 타입 안전성 부재 → `as const` + `ProductCategory` 연결로 해결
- `LAST_UPDATE_DATE`, `DATA_PERIOD` 위치 불명확 → `data/mockData.ts`로 이동
- tableColumns 타입 부재 → discriminated union으로 정의

---

## Work Objectives

### Core Objective
대시보드의 데이터 레이어를 정리하여 (1) 타입 안전성 확보, (2) 더미 데이터 분리, (3) 향후 실제 데이터 교체 용이한 구조 구축.

### Concrete Deliverables
- `data/mockData.ts`: 모든 더미 데이터 및 생성 함수
- `types.ts`: 확장된 타입 정의 (TableColumn 등)
- `App.tsx`: `as any` 캐스팅 제거
- `constants.ts`: 삭제 (내용물 이동 완료 후)
- `services/geminiService.ts`: 삭제

### Definition of Done
- [x] `npx tsc --noEmit` 에러 0개
- [x] `as any` 캐스팅 0개
- [x] `npm run dev` 정상 실행 + UI 동작 변경 없음

### Must Have
- 모든 타입이 명시적으로 정의됨
- 더미 데이터가 `data/mockData.ts` 한 파일에 집중
- 기존 UI 동작 100% 유지

### Must NOT Have (Guardrails)
- 컴포넌트 내부 로직 변경 (타입만 수정)
- "향후 확장성"을 위한 과도한 optional 필드/제네릭 추가
- UI 스타일/레이아웃 변경
- Excel 업로드 관련 코드 작성
- 새로운 라이브러리 추가

---

## Verification Strategy (MANDATORY)

### Test Decision
- **Infrastructure exists**: NO (package.json에 테스트 프레임워크 없음)
- **User wants tests**: NO (구조 리팩토링이므로 테스트 불필요)
- **QA approach**: Manual verification

### Manual Verification Procedure
각 TODO 완료 후:
1. `npx tsc --noEmit` → 타입 에러 확인
2. `npm run dev` → 빌드 성공 확인
3. 브라우저에서 카테고리 전환 테스트 → UI 동작 확인

---

## Task Flow

```
Task 1 (geminiService.ts 삭제)
    ↓
Task 2 (types.ts 확장) ←── 독립적
    ↓
Task 3 (data/mockData.ts 생성)
    ↓
Task 4 (App.tsx 수정)
    ↓
Task 5 (constants.ts 삭제)
    ↓
Task 6 (최종 검증)
```

## Parallelization

| Task | Depends On | Reason |
|------|------------|--------|
| 1 | - | 독립적, 다른 파일에서 import 없음 |
| 2 | - | 타입만 추가, 다른 파일 영향 없음 |
| 3 | 2 | 새 타입 사용 |
| 4 | 2, 3 | 새 타입 + 새 import 경로 사용 |
| 5 | 4 | App.tsx가 constants.ts 참조 제거 후 |
| 6 | 5 | 모든 변경 완료 후 |

---

## TODOs

- [x] 1. geminiService.ts 삭제

  **What to do**:
  - `services/geminiService.ts` 파일 삭제
  - 다른 파일에서 import 여부 확인 (이미 확인됨: 없음)

  **Must NOT do**:
  - services 폴더 자체 삭제 (빈 폴더여도 유지)

  **Parallelizable**: YES (독립적)

  **References**:
  
  **Pattern References**:
  - N/A (단순 삭제)
  
  **Verification**:
  - `services/geminiService.ts`에서 export하는 `getStrategicInsights` 함수가 어디서도 사용되지 않음 확인
  - Grep 검색: `geminiService` → 결과 없어야 함

  **Acceptance Criteria**:
  
  **Manual Execution Verification:**
  - [ ] `rm services/geminiService.ts` 실행
  - [ ] `grep -r "geminiService" --include="*.ts" --include="*.tsx" .` → 결과 없음
  - [ ] `npx tsc --noEmit` → 에러 없음

  **Commit**: YES
  - Message: `chore: remove unused geminiService`
  - Files: `services/geminiService.ts` (deleted)
  - Pre-commit: `npx tsc --noEmit`

---

- [x] 2. types.ts 확장 - CATEGORIES 타입 강화 및 TableColumn 타입 추가

  **What to do**:
  - `CATEGORIES`를 `as const`로 정의하고 `ProductCategory` 타입과 연결
  - `TableColumn` discriminated union 타입 추가 (month/summary 구분)
  - `SummaryColumn` 타입 추가 (achievement, growth 필드 포함)

  **Must NOT do**:
  - 기존 타입 시그니처 변경 (하위 호환성)
  - 과도한 optional 필드 추가
  - 제네릭 타입 도입

  **Parallelizable**: YES (독립적, 다른 파일에서 아직 사용 안 함)

  **References**:
  
  **Pattern References**:
  - `types.ts:6-11` - `MonthlyPerformance` 인터페이스 구조
  - `App.tsx:61-67` - 현재 inline으로 정의된 tableColumns 구조

  **API/Type References**:
  - `types.ts:2` - `ProductCategory` 현재 정의
  - `constants.ts:110` - `CATEGORIES` 현재 정의

  **Acceptance Criteria**:
  
  **추가할 타입 구조:**
  ```typescript
  // ProductCategory를 CATEGORIES에서 파생
  export const CATEGORIES = ['Sun Care', 'Foundation', 'Essence', 'Cream'] as const;
  export type ProductCategory = typeof CATEGORIES[number];

  // TableColumn discriminated union
  export interface MonthColumn extends MonthlyPerformance {
    type: 'month';
  }

  export interface SummaryColumn {
    type: 'summary';
    month: string; // '상반기' | '하반기' | '연간 합계'
    lastYearActual: number;
    thisYearTarget: number;
    thisYearActual: number | null;
    achievement: number | null;
    growth: number | null;
  }

  export type TableColumn = MonthColumn | SummaryColumn;
  ```

  **Manual Execution Verification:**
  - [ ] `types.ts` 수정 완료
  - [ ] `npx tsc --noEmit` → 에러 없음
  - [ ] `CATEGORIES` export 확인

  **Commit**: YES
  - Message: `feat(types): add CATEGORIES const and TableColumn discriminated union`
  - Files: `types.ts`
  - Pre-commit: `npx tsc --noEmit`

---

- [x] 3. data/mockData.ts 생성 - 더미 데이터 통합

  **What to do**:
  - `data/` 폴더 생성
  - `data/mockData.ts` 파일 생성
  - `constants.ts`에서 다음 항목 이동:
    - `generateMonthlyData()` 함수
    - `generateMarketShare()` 함수
    - `generateTopCustomers()` 함수
    - `getFacilitators()` 함수
    - `CUSTOMER_NAMES` 배열
    - `MOCK_DATA` 객체
    - `LAST_UPDATE_DATE` 상수
    - `DATA_PERIOD` 상수
  - 필요한 타입 import 추가

  **Must NOT do**:
  - 함수 로직 변경 (그대로 복사)
  - 새로운 추상화 도입
  - `CATEGORIES`는 이동하지 않음 (types.ts로 이미 이동)

  **Parallelizable**: NO (Task 2 완료 필요 - CATEGORIES 타입 참조)

  **References**:
  
  **Pattern References**:
  - `constants.ts:4-77` - 데이터 생성 함수들 (그대로 복사)
  - `constants.ts:79-108` - MOCK_DATA 객체 구조

  **API/Type References**:
  - `types.ts` - CategoryData, MonthlyPerformance, MarketShare, CustomerData, Facilitator 타입

  **External References**:
  - N/A

  **목표 파일 구조:**
  ```
  data/
  └── mockData.ts
      ├── generateMonthlyData() - 내부 함수
      ├── generateMarketShare() - 내부 함수  
      ├── generateTopCustomers() - 내부 함수
      ├── getFacilitators() - 내부 함수
      ├── CUSTOMER_NAMES - 내부 상수
      ├── export MOCK_DATA
      ├── export LAST_UPDATE_DATE
      └── export DATA_PERIOD
  ```

  **Acceptance Criteria**:
  
  **Manual Execution Verification:**
  - [ ] `mkdir -p data` 실행
  - [ ] `data/mockData.ts` 파일 생성
  - [ ] `npx tsc --noEmit` → 에러 없음 (아직 App.tsx는 constants.ts 참조)
  - [ ] MOCK_DATA 구조 동일 확인

  **Commit**: YES
  - Message: `refactor(data): create mockData.ts and consolidate dummy data`
  - Files: `data/mockData.ts` (new)
  - Pre-commit: `npx tsc --noEmit`

---

- [x] 4. App.tsx 수정 - import 경로 변경 및 as any 제거

  **What to do**:
  - import 경로 변경:
    - `MOCK_DATA, LAST_UPDATE_DATE, DATA_PERIOD` → `./data/mockData`
    - `CATEGORIES` → `./types`
  - Line 138: 불필요한 스프레드 제거
    - Before: `<PerformanceMetrics data={{ ...currentData, performance: currentData.totalPerformance } as any} />`
    - After: `<PerformanceMetrics data={currentData} />`
  - `getTableColumns()` 반환 타입 명시: `TableColumn[]`
  - Line 200, 216: `as any` 제거 (TableColumn 타입으로 해결)

  **Must NOT do**:
  - `getTableColumns()` 로직 변경 (타입만 추가)
  - 컴포넌트 Props 전달 방식 외 다른 변경
  - 스타일/레이아웃 변경

  **Parallelizable**: NO (Task 2, 3 완료 필요)

  **References**:
  
  **Pattern References**:
  - `App.tsx:4` - 현재 constants.ts import
  - `App.tsx:30-70` - getTableColumns 함수 구조
  - `App.tsx:138` - PerformanceMetrics 호출 (as any 위치)

  **API/Type References**:
  - `types.ts:TableColumn` - 새로 추가될 타입
  - `components/PerformanceMetrics.tsx:5-7` - Props 인터페이스 (CategoryData 기대)

  **Acceptance Criteria**:
  
  **수정 포인트:**
  ```typescript
  // Before (App.tsx:4)
  import { MOCK_DATA, CATEGORIES, LAST_UPDATE_DATE, DATA_PERIOD } from './constants';
  
  // After
  import { MOCK_DATA, LAST_UPDATE_DATE, DATA_PERIOD } from './data/mockData';
  import { CATEGORIES } from './types';
  
  // Before (App.tsx:138)
  <PerformanceMetrics data={{ ...currentData, performance: currentData.totalPerformance } as any} />
  
  // After
  <PerformanceMetrics data={currentData} />
  
  // Before (App.tsx:30)
  const getTableColumns = () => {
  
  // After
  const getTableColumns = (): TableColumn[] => {
  ```

  **Manual Execution Verification:**
  - [ ] App.tsx 수정 완료
  - [ ] `grep "as any" App.tsx` → 결과 없음
  - [ ] `npx tsc --noEmit` → 에러 없음
  - [ ] `npm run dev` → 빌드 성공
  - [ ] 브라우저에서 카테고리 전환 테스트 → 정상 동작

  **Commit**: YES
  - Message: `refactor(App): remove as any casts and update import paths`
  - Files: `App.tsx`
  - Pre-commit: `npx tsc --noEmit`

---

- [x] 5. constants.ts 삭제

  **What to do**:
  - `constants.ts` 파일 삭제
  - 모든 내용이 types.ts 또는 data/mockData.ts로 이동 완료 확인

  **Must NOT do**:
  - 다른 파일에서 constants.ts를 import하는 곳이 남아있으면 삭제 금지

  **Parallelizable**: NO (Task 4 완료 필요)

  **References**:
  
  **Verification**:
  - `constants.ts`를 import하는 파일 없음 확인

  **Acceptance Criteria**:
  
  **Manual Execution Verification:**
  - [ ] `grep -r "from './constants'" --include="*.ts" --include="*.tsx" .` → 결과 없음
  - [ ] `rm constants.ts` 실행
  - [ ] `npx tsc --noEmit` → 에러 없음
  - [ ] `npm run dev` → 빌드 성공

  **Commit**: YES
  - Message: `chore: remove constants.ts (contents moved to types.ts and data/mockData.ts)`
  - Files: `constants.ts` (deleted)
  - Pre-commit: `npx tsc --noEmit`

---

- [x] 6. 최종 검증 - 전체 동작 확인

  **What to do**:
  - 전체 타입 체크
  - 개발 서버 실행 및 UI 테스트
  - 모든 카테고리 전환 테스트 (Sun Care, Foundation, Essence, Cream)
  - 차트 및 테이블 데이터 표시 확인

  **Must NOT do**:
  - 추가 코드 변경 (검증만)

  **Parallelizable**: NO (모든 Task 완료 필요)

  **References**:
  - N/A

  **Acceptance Criteria**:
  
  **Manual Execution Verification:**
  - [ ] `npx tsc --noEmit` → 에러 0개
  - [ ] `npm run dev` → 빌드 성공
  - [ ] 브라우저에서 `http://localhost:5173` 접속
  - [ ] 각 카테고리 탭 클릭:
    - Sun Care: KPI 카드 4개, 차트 2개, 테이블 2개 표시
    - Foundation: 동일
    - Essence: 동일
    - Cream: 동일
  - [ ] 월별 실적 테이블: 12개월 + 상반기/하반기/연간 컬럼 표시
  - [ ] 고객사 테이블: Top 20 목록 스크롤 가능

  **Commit**: NO (검증만)

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `chore: remove unused geminiService` | services/geminiService.ts | tsc --noEmit |
| 2 | `feat(types): add CATEGORIES const and TableColumn discriminated union` | types.ts | tsc --noEmit |
| 3 | `refactor(data): create mockData.ts and consolidate dummy data` | data/mockData.ts | tsc --noEmit |
| 4 | `refactor(App): remove as any casts and update import paths` | App.tsx | tsc --noEmit + dev server |
| 5 | `chore: remove constants.ts` | constants.ts | tsc --noEmit |

---

## Success Criteria

### Verification Commands
```bash
npx tsc --noEmit          # Expected: No errors
npm run dev               # Expected: Build successful, server starts
grep "as any" App.tsx     # Expected: No results
grep -r "constants" --include="*.ts" --include="*.tsx" . # Expected: No './constants' imports
```

### Final Checklist
- [x] All "Must Have" present
- [x] All "Must NOT Have" absent
- [x] All tests pass (N/A - no tests)
- [x] UI behavior unchanged
