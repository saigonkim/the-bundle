# PRD.md — The Bundle: ETF Curation Subscription Service

> **버전**: v0.1 (기획 초안) | **작성일**: 2026-03-12 | **대상**: 20대 사회초년생

---

## 1. 서비스 개요 (Product Overview)

| 항목 | 내용 |
|------|------|
| 서비스명 | **The Bundle** |
| 슬로건 | "커피 한 잔 값으로 시작하는 나의 첫 ETF 포트폴리오" |
| 핵심 가치 | 복잡한 ETF 투자를 큐레이션된 '번들(10종 묶음)'로 단순화 |
| 타겟 사용자 | 22~29세 사회초년생, 투자 초보자 |
| 구독 가격 | 월 **4,900원** (= 커피 한 잔 비유) |
| 결제 수단 | 토스페이먼츠 빌링(자동 정기결제) |
| 핵심 기능 | ETF 번들 구독 + 가상 트래킹 + 기다림 지수(Patience Gauge) |

---

## 2. 사용자 스토리보드 (User Storyboard)

### 2-A. 신규 사용자 여정 (Guest → Subscriber → Dashboard)

```
[Step 1] 랜딩 페이지 진입
  ↓
  - 슬로건과 함께 '이달의 번들' 카드 미리보기 (잠금 상태)
  - "커피 한 잔값으로 매달 전문가가 고른 ETF 10종을" 문구 노출
  - CTA: [지금 구독하기 — 월 4,900원]

[Step 2] 회원가입 / 로그인
  ↓
  - Supabase Auth: 이메일/비밀번호 or 카카오 소셜 로그인
  - 가입 완료 후 온보딩 화면으로 이동

[Step 3] 온보딩 (투자 성향 파악)
  ↓
  - 간단한 3문항: "얼마나 오래 기다릴 수 있어요?"
  - 결과: '기다림 지수(Patience Gauge)' 초기값 설정 (0~100)
  - CTA: [구독 시작하기]

[Step 4] 토스페이먼츠 정기결제 등록
  ↓
  - 카드 정보 입력 → 빌링키 발급
  - 최초 결제(4,900원) 즉시 발생
  - 결제 성공 시 구독 상태(status) 활성화

[Step 5] 대시보드 — 나의 번들
  ↓
  - 이달의 '10종 ETF 번들' 카드 형태로 표시
  - 각 ETF: 종목명 / 현재가 / 편입 비중 / 간단한 비유 설명
    (예: "TIGER 미국 S&P500 — 미국 500개 대기업 한 번에 담기")
  - 가상 수익률 트래킹 (구독 시작일 기준 수익률 계산)
  - 기다림 지수 게이지 바 (보유 기간 + 수익률에 따라 증가)

[Step 6] 월간 번들 업데이트 알림
  ↓
  - 매월 1일: "이달의 번들이 업데이트됐어요!" 메일/푸시
  - 대시보드에서 변경 내역(추가/제거 ETF) 및 AI 생성 코멘트 확인
```

### 2-B. 관리자 여정 (Admin Panel)

```
[Step 1] 관리자 로그인 (/admin)
  ↓
  - Supabase Role-Based Auth (admin role 체크)

[Step 2] AI 번들 초안 생성 요청
  ↓
  - [초안 생성] 버튼 클릭
  - 백엔드: OpenAI/Gemini API에 최신 ETF 데이터 + 시장 컨텍스트 전달
  - AI가 '10종 ETF 선정 이유 + 월간 코멘트' 초안 반환

[Step 3] 초안 검토 및 편집
  ↓
  - 관리자가 AI 초안을 수동으로 수정 가능
  - 각 ETF 비중 조정 슬라이더 (총합 100% 유지)

[Step 4] 번들 발행 (Publish)
  ↓
  - [발행하기] 버튼 → Bundle 상태를 published로 변경
  - 구독자에게 이메일/푸시 발송 트리거
```

---

## 3. 핵심 기능 정의 (Feature Specifications)

### F-01. ETF 번들 표시
- 매월 큐레이션된 10종 ETF를 카드 UI로 표시
- 각 ETF마다 '20대 친화 비유 설명' 포함 (AI 생성)
- 편입 비중(%), 현재 NAV, 전일 대비 수익률 표시

### F-02. 가상 트래킹 수익률
- 구독 시작일의 ETF NAV를 기준값으로 저장
- 실시간/일일 NAV와 비교하여 가상 P&L 계산
- 배당 재투자 시뮬레이션 포함 (Optional v1.1)

### F-03. 기다림 지수 (Patience Gauge)
- 0~100 범위의 지수
- **증가 요인**: 구독 유지 기간, 수익 발생 구간, 리밸런싱 후 유지
- **감소 요인**: 연속 손실 구간 (심리적 압박 시뮬레이션)
- 시각화: 원형 게이지 + 단계별 뱃지 (초보 → 인내자 → 현인)

### F-04. 정기결제 (토스페이먼츠 빌링)
- 최초 카드 등록 시 빌링키 발급 후 저장
- 매월 1일 자동 결제 (Server-side Cron)
- 결제 실패 시 3일 유예 후 구독 정지

### F-05. 관리자 패널
- AI 번들 초안 생성 → 검토 → 발행 워크플로우
- 구독자 수 / 월 MRR / 이탈rate 지표 대시보드

---

## 4. 비기능 요구사항 (Non-functional Requirements)

| 항목 | 목표 |
|------|------|
| 성능 | 번들 페이지 LCP < 2.5초 |
| 가용성 | 99.5% 업타임 |
| 보안 | 빌링키 암호화 저장, Supabase RLS 적용 |
| 확장성 | 초기 MAU 1,000명 → 10,000명 대응 |
| 접근성 | WCAG 2.1 AA 준수 |

---

## 5. 기술 스택 (Tech Stack)

| 레이어 | 기술 |
|--------|------|
| Frontend | Next.js 14 (App Router, TypeScript) |
| Styling | Tailwind CSS + shadcn/ui |
| Backend/DB | Supabase (PostgreSQL + Auth + Edge Functions) |
| ETF 시세 | 한국투자증권 KIS Developers REST API |
| AI 생성 | OpenAI GPT-4o / Google Gemini 1.5 Pro |
| 결제 | 토스페이먼츠 빌링 API |
| 스케줄러 | Supabase Edge Functions (pg_cron) + Vercel Cron |
| 배포 | Vercel (Frontend) + Supabase Cloud (Backend) |
| 이메일 | Resend or Supabase Email |
| 모니터링 | Sentry + Vercel Analytics |
