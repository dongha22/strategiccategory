# Decisions

## Key Decisions from Planning
- Framework: Vite SPA 유지 (Next.js 마이그레이션 안 함)
- 초기 데이터: 빈 DB로 시작 (seed 데이터 없음)
- 비활성 유저: 로그인 차단 + 안내 메시지
- User 권한: 읽기 전용 (Excel 업로드 불가)
- OAuth: 모든 Google 계정 허용 (도메인 제한 없음)
- 신규 유저: 비활성 상태로 생성 (admin 승인 필요)
- DB 범위: 모든 대시보드 데이터 저장
- 테스트: 수동 QA (테스트 코드 없음)
